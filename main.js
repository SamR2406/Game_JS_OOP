import { CODE_TO_SYMBOL } from "./src/constants.js";
import { Typewriter, KeyboardView, isTypeableSymbol } from "./src/ui/input.js";
import { Journal, ClueBoard, HUD } from "./src/ui/hud.js";
import { AudioManager } from "./src/systems/audioManager.js";
import { MansionEngine } from "./src/engine/mansionEngine.js";
import { GeminiClient } from "./src/services/geminiClient.js";
import { CommandInterpreter } from "./src/services/commandInterpreter.js";
import { GameController } from "./src/controllers/gameController.js";

const INTRO_SLIDES = [
  { image: "./assets/intro/intro1.png", text: "Ah, this is lovely, I just bought a mansion at a very good price." },
  { image: "./assets/intro/intro2.png", text: "Now I have to fix a couple of things but it will look amazing after some weeks." },
  { image: "./assets/intro/intro3.png", text: "I'll start with the hardest part, the basement first." },
  { image: "./assets/intro/intro4.png", text: "It's very cold here for some reason." },
  { image: "./assets/intro/intro5.png", text: "Is this a typewriter? It looks like there’s already something written on the paper." }
];

const BAD_FINAL_SLIDES = [
  { image: "./assets/Final/final1.png", text: "Thank you human for bringing me to your world." },
  { image: "./assets/Final/final2.png", text: "It was easier than I thought, now I will find you..." },
  { image: "./assets/Final/final3.png", text: "" }
];

const GOOD_FINAL_SLIDES = [
  { image: "./assets/Final/good1.jpg", text: "Glass brakes apart as white light punches through the cracked mirror." },
  { image: "./assets/Final/good2.jpg", text: "\"How did you know?\" the skin-walker rages while the mansion lights strobe on and off." },
  { image: "./assets/Final/good3.jpg", text: "The hall settles into dusty calm, shards glowing like embers that warn others away." }
];

const GEMINI_API_KEY = "PUT API HERE";
const GEMINI_MODEL = "gemini-2.0-flash-lite";
const GEMINI_API_VERSION = "v1";
const GEMINI_URL = GEMINI_API_KEY
  ? `https://generativelanguage.googleapis.com/${GEMINI_API_VERSION}/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`
  : null;

const overlayEl = document.getElementById("overlay");
const overlayMessagePanel = document.getElementById("overlayMessagePanel");
const overlayMessageEl = document.getElementById("overlayMessage");
const overlayButton = document.getElementById("overlayButton");
const introSequence = document.getElementById("introSequence");
const introImageEl = document.getElementById("introImage");
const introTextEl = document.getElementById("introText");
const introButton = document.getElementById("introButton");
const finalSequence = document.getElementById("finalSequence");
const finalImageEl = document.getElementById("finalImage");
const finalTextEl = document.getElementById("finalText");
const finalButton = document.getElementById("finalButton");
const menuPanel = document.getElementById("menuPanel");
const menuToggle = document.getElementById("menuToggle");
const menuClose = document.getElementById("menuClose");

let navigatorFlashTimeout = null;
let introSlideIndex = 0;
let finalSlideIndex = 0;
let finalSoundPlayed = false;
let activeFinalSlides = BAD_FINAL_SLIDES;
let currentEndingType = "bad";

const typewriter = new Typewriter(document.getElementById("typedLine"));
const journal = new Journal(document.getElementById("logOutput"));
const hud = new HUD(
  document.getElementById("hudLocation"),
  document.getElementById("hudKeys"),
  document.getElementById("hudWeapons"),
  document.getElementById("hudStatus")
);
const clueBoard = new ClueBoard(document.getElementById("historyList"));
const promptBox = document.getElementById("promptBox");
const audio = new AudioManager();
const gemini = new GeminiClient({ url: GEMINI_URL });
const engine = new MansionEngine();
const interpreter = new CommandInterpreter({ url: GEMINI_URL });

const controller = new GameController({
  typewriter,
  journal,
  hud,
  clueBoard,
  promptBox,
  audio,
  gemini,
  interpreter,
  engine,
  sendButton: document.getElementById("sendCommand"),
  backspaceButton: document.getElementById("backspaceButton"),
  spaceButton: document.getElementById("spaceButton"),
  onNavigatorCue: () => flashNavigatorCue(menuToggle, menuPanel),
  onFinalSequence: (mode) => showFinalSequence(mode)
});

const keyboard = new KeyboardView(document.getElementById("keyboard"), (symbol) => controller.handleSymbol(symbol));

if (introButton) {
  updateIntroSlide(introSlideIndex);
  introButton.addEventListener("click", () => {
    if (introSlideIndex < INTRO_SLIDES.length - 1) {
      introSlideIndex += 1;
      updateIntroSlide(introSlideIndex);
      return;
    }
    hideOverlay();
    audio.unlock();
    controller.start();
  });
} else if (INTRO_SLIDES.length) {
  updateIntroSlide(0);
}

if (finalButton) {
  finalButton.addEventListener("click", () => {
    if (finalSlideIndex < activeFinalSlides.length - 1) {
      finalSlideIndex += 1;
      updateFinalSlide(finalSlideIndex);
      return;
    }
    hideOverlay();
    controller.start();
  });
}

if (overlayButton) {
  overlayButton.addEventListener("click", () => {
    hideOverlay();
    audio.unlock();
    controller.start();
  });
}

if (menuToggle) {
  menuToggle.addEventListener("click", () => {
    if (menuPanel.classList.contains("hidden")) {
      showMenu();
    } else {
      hideMenu();
    }
  });
}

if (menuClose) {
  menuClose.addEventListener("click", () => hideMenu());
}

document.addEventListener("click", (event) => {
  if (!menuPanel || menuPanel.classList.contains("hidden")) return;
  const withinPanel = menuPanel.contains(event.target);
  const onToggle = menuToggle?.contains(event.target);
  if (!withinPanel && !onToggle) {
    hideMenu();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.repeat) return;
  if (event.code === "Backspace") {
    event.preventDefault();
    controller.handleBackspace();
    return;
  }
  if (event.code === "Enter") {
    event.preventDefault();
    controller.submitCommand();
    return;
  }
  if (event.code === "Space") {
    event.preventDefault();
    controller.handleSymbol(" ");
    return;
  }
  const symbol = CODE_TO_SYMBOL[event.code];
  if (!symbol) return;
  keyboard.pressFromKey(symbol);
  if (isTypeableSymbol(symbol)) {
    event.preventDefault();
    controller.handleSymbol(symbol);
  }
});

document.addEventListener("keyup", (event) => {
  const symbol = CODE_TO_SYMBOL[event.code];
  if (!symbol) return;
  keyboard.releaseFromKey(symbol);
});

function hideOverlay() {
  overlayEl.classList.add("hidden");
  if (overlayMessagePanel) {
    overlayMessagePanel.classList.add("hidden");
  }
  if (finalSequence) {
    finalSequence.classList.add("hidden");
  }
}

function showOverlay(message, buttonLabel) {
  if (introSequence) {
    introSequence.classList.add("hidden");
  }
  if (finalSequence) {
    finalSequence.classList.add("hidden");
  }
  if (overlayMessagePanel) {
    overlayMessagePanel.classList.remove("hidden");
  }
  overlayMessageEl.textContent = message;
  overlayButton.textContent = buttonLabel;
  overlayEl.classList.remove("hidden");
}

function showMenu() {
  if (!menuPanel) return;
  menuPanel.classList.remove("hidden");
}

function hideMenu() {
  if (!menuPanel) return;
  menuPanel.classList.add("hidden");
}

function flashNavigatorCue(toggle, panel) {
  if (!toggle) return;
  toggle.classList.add("navigator-flash");
  if (panel && !panel.classList.contains("hidden")) {
    panel.classList.add("navigator-flash");
  }
  if (navigatorFlashTimeout) {
    clearTimeout(navigatorFlashTimeout);
  }
  navigatorFlashTimeout = setTimeout(() => {
    toggle.classList.remove("navigator-flash");
    if (panel) {
      panel.classList.remove("navigator-flash");
    }
    navigatorFlashTimeout = null;
  }, 2500);
}

function showFinalSequence(mode = "bad") {
  currentEndingType = mode === "good" ? "good" : "bad";
  activeFinalSlides = currentEndingType === "good" ? GOOD_FINAL_SLIDES : BAD_FINAL_SLIDES;
  if (introSequence) {
    introSequence.classList.add("hidden");
  }
  if (overlayMessagePanel) {
    overlayMessagePanel.classList.add("hidden");
  }
  if (finalSequence) {
    finalSequence.classList.remove("hidden");
  }
  finalSlideIndex = 0;
  finalSoundPlayed = false;
  updateFinalSlide(finalSlideIndex);
  overlayEl.classList.remove("hidden");
}

function updateIntroSlide(index) {
  const slide = INTRO_SLIDES[index];
  if (!slide) return;
  if (introImageEl) {
    introImageEl.src = slide.image;
  }
  if (introTextEl) {
    introTextEl.textContent = slide.text;
  }
  if (introButton) {
    introButton.textContent = index === INTRO_SLIDES.length - 1 ? "Begin" : "Next";
  }
}

function updateFinalSlide(index) {
  const slide = activeFinalSlides[index];
  if (!slide) return;
  if (finalImageEl) {
    finalImageEl.src = slide.image;
  }
  if (finalTextEl) {
    finalTextEl.textContent = slide.text ?? "";
  }
  if (finalButton) {
    finalButton.textContent = index === activeFinalSlides.length - 1 ? "Replay" : "Next";
  }
  if (index === activeFinalSlides.length - 1 && !finalSoundPlayed && currentEndingType === "bad") {
    audio.playTerror();
    finalSoundPlayed = true;
  }
}

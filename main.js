const KEY_ROWS = [
  "1234567890-=",
  "QWERTYUIOP[]\\",
  "ASDFGHJKL;'",
  "ZXCVBNM,./",
];

const KEY_SYMBOLS = KEY_ROWS.join("").split("");

const SPECIAL_KEY_INDEX = {
  "1": 0,
  "2": 1,
  "3": 2,
  "4": 3,
  "5": 4,
  "6": 5,
  "7": 6,
  "8": 7,
  "9": 8,
  "0": 9,
  "-": 10,
  "=": 37,
  "[": 38,
  "]": 39,
  "\\": 40,
  ";": 41,
  "'": 42,
  ",": 43,
  ".": 44,
  "/": 45,
};

const CODE_TO_SYMBOL = {
  Digit1: "1",
  Digit2: "2",
  Digit3: "3",
  Digit4: "4",
  Digit5: "5",
  Digit6: "6",
  Digit7: "7",
  Digit8: "8",
  Digit9: "9",
  Digit0: "0",
  Minus: "-",
  Equal: "=",
  KeyQ: "Q",
  KeyW: "W",
  KeyE: "E",
  KeyR: "R",
  KeyT: "T",
  KeyY: "Y",
  KeyU: "U",
  KeyI: "I",
  KeyO: "O",
  KeyP: "P",
  BracketLeft: "[",
  BracketRight: "]",
  Backslash: "\\",
  KeyA: "A",
  KeyS: "S",
  KeyD: "D",
  KeyF: "F",
  KeyG: "G",
  KeyH: "H",
  KeyJ: "J",
  KeyK: "K",
  KeyL: "L",
  Semicolon: ";",
  Quote: "'",
  KeyZ: "Z",
  KeyX: "X",
  KeyC: "C",
  KeyV: "V",
  KeyB: "B",
  KeyN: "N",
  KeyM: "M",
  Comma: ",",
  Period: ".",
  Slash: "/",
};

const INTRO_SLIDES = [
  { image: "./assets/intro/intro1.png", text: "Ah, this is lovely, I just bought a mansion at a very good price." },
  { image: "./assets/intro/intro2.png", text: "Now I have to fix a couple of things but it will look amazing after some weeks." },
  { image: "./assets/intro/intro3.png", text: "I'll start with the hardest part, the basement first." },
  { image: "./assets/intro/intro4.png", text: "It's very cold here for some reason." },
  { image: "./assets/intro/intro5.png", text: "Is this a typewriter? It looks like there's already something written on the paper." }
];

const BAD_FINAL_SLIDES = [
  { image: "./assets/Final/final1.png", text: "Thank you human for bringing me to your world." },
  { image: "./assets/Final/final2.png", text: "It was easier than I thought, now I will find you..." },
  { image: "./assets/Final/final3.png", text: "" }
];

const GOOD_FINAL_SLIDES = [
  { image: "./assets/Final/good1.jpg", text: "Glass shrieks apart as white light punches through the cracked mirror." },
  { image: "./assets/Final/good2.jpg", text: "\"How did you know?\" the skin-walker rages while the mansion lights strobe on and off." },
  { image: "./assets/Final/good3.jpg", text: "The hall settles into dusty calm, shards glowing like embers that warn others away." }
];

const LETTER_REGEX = /^[A-Z]$/;
const LETTER_TILE_START = 11;
const TYPEABLE_SYMBOLS = new Set([...KEY_SYMBOLS, " "]);
const GEMINI_API_KEY = "";
const GEMINI_MODEL = "gemini-2.0-flash-lite";
const GEMINI_API_VERSION = "v1";
const GEMINI_URL = GEMINI_API_KEY
  ? `https://generativelanguage.googleapis.com/${GEMINI_API_VERSION}/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`
  : null;

const LOOT_LIBRARY = {
  parlorNote: {
    id: "parlorNote",
    label: "Clue Note",
    type: "clue",
    text: "Gold key rests in the music room. Silver keys open the quiet bedrooms."
  },
  goldKey: {
    id: "goldKey",
    label: "Gold Key",
    type: "key",
    keywords: ["gold", "mirror", "main"],
    description: "Opens the Mirror Hall - the main room." 
  },
  silverGuest: {
    id: "silverGuest",
    label: "Silver Key (Guest Bedroom)",
    type: "key",
    keywords: ["guest", "silver"],
    description: "Unlocks the guest bedroom door."
  },
  silverMaster: {
    id: "silverMaster",
    label: "Silver Key (Master Bedroom)",
    type: "key",
    keywords: ["master", "silver"],
    description: "Unlocks the master bedroom mirrors."
  },
  mirrorWarning: {
    id: "mirrorWarning",
    label: "Burned Letter",
    type: "clue",
    text: "Type BREAK THE MIRROR when you stand before the humming glass—do not trust the other voice."
  }
};

function cloneItem(id) {
  const item = LOOT_LIBRARY[id];
  return item ? { ...item } : null;
}

function instantiateLoot(ids = []) {
  return ids.map((id) => cloneItem(id)).filter(Boolean);
}

function createRooms() {
  return {
    frontParlor: {
      id: "frontParlor",
      name: "Front Living Room",
      type: "living",
      description: "I can see boxes stacked under dust sheets and hear a soft typewriter hum through the vents.",
      connections: { front: "mirrorHall", left: "musicParlour", right: "guestBedroom", back: "nursery" },
      loot: instantiateLoot(["parlorNote", "mirrorWarning"]),
      lockedBy: null
    },
    musicParlour: {
      id: "musicParlour",
      name: "Music Room",
      type: "living",
      description: "I can see a tired piano and portraits watching me; the air still vibrates with old songs.",
      connections: { back: "frontParlor", front: "marbleBath", left: "servantWashroom", right: "masterBedroom" },
      loot: instantiateLoot(["goldKey"]),
      lockedBy: null
    },
    mirrorHall: {
      id: "mirrorHall",
      name: "Mirror Hall",
      type: "living",
      description: "I can see the floor dip toward a mirror taller than anything else in the house.",
      connections: { back: "frontParlor" },
      loot: [],
      lockedBy: "goldKey"
    },
    guestBedroom: {
      id: "guestBedroom",
      name: "Guest Bedroom",
      type: "bedroom",
      description: "I can see still sheets and empty trunks; whoever stayed here left nothing.",
      connections: { left: "frontParlor", front: "marbleBath", back: "servantWashroom" },
      loot: [],
      lockedBy: "silverGuest"
    },
    masterBedroom: {
      id: "masterBedroom",
      name: "Main Bedroom",
      type: "bedroom",
      description: "I can see mirrors ringing the walls and every reflection twitching on its own.",
      connections: { left: "musicParlour", back: "guestBedroom" },
      loot: [],
      lockedBy: "silverMaster"
    },
    nursery: {
      id: "nursery",
      name: "Kids Bedroom",
      type: "bedroom",
      description: "I see a cot rocking with no wind and the toys twitch whenever I stare.",
      connections: { front: "frontParlor", left: "servantWashroom", right: "marbleBath" },
      loot: [],
      lockedBy: null
    },
    marbleBath: {
      id: "marbleBath",
      name: "Marble Bathroom",
      type: "bathroom",
      description: "I can see cracked tiles, a dry tub, and steam letters that spell questions.",
      connections: { back: "musicParlour", left: "nursery", right: "guestBedroom" },
      loot: instantiateLoot(["silverMaster"]),
      lockedBy: null
    },
    servantWashroom: {
      id: "servantWashroom",
      name: "Utility Bathroom",
      type: "bathroom",
      description: "Buckets, hooks, and a single mirror that refuses to show me.",
      connections: { right: "musicParlour", front: "guestBedroom", back: "nursery" },
      loot: instantiateLoot(["silverGuest"]),
      lockedBy: null
    }
  };
}

class ButtonAtlas {
  constructor() {
    this.states = ["Buttons", "Hovered", "Pressed"];
    this.maps = {};
    this.states.forEach((state) => {
      const base = `/assets/${state}`;
      this.maps[state] = {};
      KEY_SYMBOLS.forEach((symbol) => {
        const tileIndex = symbolToTileIndex(symbol);
        if (tileIndex == null) return;
        const name = `tile${String(tileIndex).padStart(3, "0")}.png`;
        this.maps[state][symbol] = `${base}/${name}`;
      });
    });
  }
  path(symbol, state = "Buttons") {
    const normalized = LETTER_REGEX.test(symbol) ? symbol.toUpperCase() : symbol;
    return this.maps[state]?.[normalized] ?? null;
  }
}

const atlas = new ButtonAtlas();

class Typewriter {
  constructor(lineEl) {
    this.lineEl = lineEl;
    this.buffer = [];
    this.maxChars = 48;
  }
  append(symbol) {
    if (this.buffer.length >= this.maxChars) return false;
    const value = symbol === " " ? symbol : symbol.toUpperCase();
    this.buffer.push(value);
    const glyph = this.createGlyph(value);
    this.lineEl.appendChild(glyph);
    return true;
  }
  createGlyph(symbol) {
    if (symbol === " ") {
      const spacer = document.createElement("div");
      spacer.className = "glyph whitespace";
      return spacer;
    }
    const wrapper = document.createElement("div");
    wrapper.className = "glyph flex items-center justify-center";
    const img = document.createElement("img");
    img.className = "w-full h-full object-contain";
    img.alt = symbol;
    assignImageSource(img, symbol, "Buttons", () => {
      wrapper.replaceChildren(createFallbackBox(symbol));
    });
    wrapper.appendChild(img);
    return wrapper;
  }
  backspace() {
    if (!this.buffer.length) return;
    this.buffer.pop();
    this.lineEl.removeChild(this.lineEl.lastElementChild);
  }
  clear() {
    this.buffer = [];
    this.lineEl.innerHTML = "";
  }
  value() {
    return this.buffer.join("").replace(/\s+/g, " ").trim();
  }
}

class AudioManager {
  constructor() {
    this.enabled = false;
    this.tracks = {
      key: new Audio("./assets/sounds/key.mp3"),
      bell: new Audio("./assets/sounds/bell.mp3"),
      carriage: new Audio("./assets/sounds/carriage.mp3"),
      door: new Audio("./assets/sounds/door.mp3"),
      terror: new Audio("./assets/sounds/final_sound.mp3")
    };
  }
  unlock() {
    this.enabled = true;
    Object.values(this.tracks).forEach((audio) => audio.load());
  }
  play(name) {
    if (!this.enabled) return;
    const audio = this.tracks[name];
    if (!audio) return;
    audio.currentTime = 0;
    audio.play().catch(() => {});
  }
  playKey() {
    this.play("key");
  }
  playBell() {
    this.play("bell");
  }
  playCarriage() {
    this.play("carriage");
  }
  playDoor() {
    this.play("door");
  }
  playTerror() {
    this.play("terror");
  }
}

class KeyboardView {
  constructor(container, onSymbol) {
    this.container = container;
    this.onSymbol = onSymbol;
    this.keys = new Map();
    this.hoverDelay = 80;
    this.buildRows();
  }
  buildRows() {
    this.container.innerHTML = "";
    KEY_ROWS.forEach((rowSymbols, rowIndex) => {
      const row = document.createElement("div");
      row.className = `flex justify-center gap-2 ${rowIndex === 1 ? "pl-6" : rowIndex === 2 ? "pl-12" : ""}`;
      rowSymbols.split("").forEach((symbol) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className =
          "relative bg-[#1a0f0a]/70 border border-[#2c1910] rounded-xl p-2 w-[var(--key-size)] h-[var(--key-size)] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-[#f7d7c2]/70";
        btn.dataset.symbol = symbol;
        btn.setAttribute("aria-label", `Key ${symbol}`);
        const img = document.createElement("img");
        img.alt = symbol;
        img.className = "w-full h-full object-contain";
        const entry = { button: btn, img, timeout: null, pressed: false, fallback: false };
        this.keys.set(symbol, entry);
        assignImageSource(img, symbol, "Buttons", () => {
          this.forceFallback(entry, symbol);
        });
        btn.appendChild(img);
        btn.addEventListener("pointerdown", (ev) => {
          ev.preventDefault();
          this.handlePress(symbol);
          this.onSymbol(symbol);
        });
        btn.addEventListener("pointerup", () => this.handleRelease(symbol));
        btn.addEventListener("pointerleave", () => this.handleRelease(symbol));
        row.appendChild(btn);
      });
      this.container.appendChild(row);
    });
  }
  handlePress(symbol) {
    const entry = this.keys.get(symbol);
    if (!entry) return;
    entry.pressed = true;
    this.swapState(entry, symbol, "Pressed");
  }
  handleRelease(symbol) {
    const entry = this.keys.get(symbol);
    if (!entry || !entry.pressed) return;
    entry.pressed = false;
    this.swapState(entry, symbol, "Hovered");
    clearTimeout(entry.timeout);
    entry.timeout = setTimeout(() => this.swapState(entry, symbol, "Buttons"), this.hoverDelay);
  }
  pressFromKey(symbol) {
    this.handlePress(symbol);
  }
  releaseFromKey(symbol) {
    this.handleRelease(symbol);
  }
  forceFallback(entry, symbol) {
    entry.fallback = true;
    entry.img = null;
    entry.button.dataset.fallback = "true";
    entry.button.replaceChildren(createFallbackBox(symbol));
  }
  swapState(entry, symbol, state) {
    if (!entry || !entry.img || entry.fallback) return;
    assignImageSource(entry.img, symbol, state, () => {
      this.forceFallback(entry, symbol);
    });
  }
}

class Journal {
  constructor(container) {
    this.container = container;
    this.entries = [];
    this.maxEntries = 4;
  }
  reset() {
    this.entries = [];
    this.container.innerHTML = "";
  }
  write(speaker, text) {
    if (!text) return;
    this.entries.push({ speaker, text });
    while (this.entries.length > this.maxEntries) {
      this.entries.shift();
    }
    this.render();
  }
  render() {
    this.container.innerHTML = "";
    this.entries.forEach(({ speaker, text }) => {
      const entry = document.createElement("div");
      entry.className = "journal-entry";
      const label = document.createElement("div");
      label.className = "text-xs uppercase tracking-[0.35em] text-[#a0856a] mb-1";
      label.textContent = speaker;
      const body = document.createElement("p");
      body.className = "text-base leading-7";
      body.textContent = text;
      entry.append(label, body);
      this.container.appendChild(entry);
    });
  }
}

class ClueBoard {
  constructor(listEl) {
    this.listEl = listEl;
  }
  update(clues) {
    this.listEl.innerHTML = "";
    clues.forEach((clue) => {
      const item = document.createElement("li");
      item.textContent = clue;
      this.listEl.appendChild(item);
    });
  }
}

class HUD {
  constructor(locationEl, keysEl, weaponsEl, statusEl) {
    this.locationEl = locationEl;
    this.keysEl = keysEl;
    this.weaponsEl = weaponsEl;
    this.statusEl = statusEl;
  }
  update(snapshot) {
    this.locationEl.textContent = snapshot.roomName;
    this.keysEl.textContent = snapshot.keys.length ? snapshot.keys.join(", ") : "None";
    const clueCount = snapshot.clueCount ?? 0;
    this.weaponsEl.textContent = clueCount ? `${clueCount}` : "0";
    this.statusEl.textContent = snapshot.statusLine;
  }
}

class MansionEngine {
  constructor() {
    this.reset();
  }
  reset() {
    this.rooms = createRooms();
    this.currentRoom = "frontParlor";
    this.visited = new Set([this.currentRoom]);
    this.unlockedRooms = new Set(["frontParlor"]);
    this.inventory = new Map();
    this.clues = [];
    this.statusLine = "The typewriter crackles awake.";
    this.rememberClue("Three living rooms mirror the house. Gold opens the mirror hall, silver opens bedrooms.");
  }
  handleCommand(raw) {
    const trimmed = raw.trim();
    if (!trimmed) {
      return this.finalize({ summary: "Tap more than dust, please." });
    }
    const lower = trimmed.toLowerCase();
    const direction = this.extractDirection(lower);
    if (direction) {
      return this.finalize(this.move(direction));
    }
    if (lower.startsWith("search")) {
      return this.finalize(this.searchRoom());
    }
    if (lower === "break the mirror") {
      return this.finalize(this.shatterMirror());
    }
    if (lower.includes("mirror")) {
      return this.finalize(this.touchMirror(lower));
    }
    if (lower === "inventory" || lower === "keys") {
      return this.finalize({ summary: this.describeInventory() });
    }
    if (lower === "look" || lower === "status") {
      const room = this.rooms[this.currentRoom];
      return this.finalize({ summary: room.description });
    }
    if (lower === "help" || lower === "commands") {
      return this.finalize({ summary: this.helpText() });
    }
    return this.finalize({ summary: "Keys chatter, but I need clearer words. Try move/search/look/help/mirror/break the mirror." });
  }
  finalize(result = {}) {
    const summary = result.summary ?? "Nothing happens.";
    if (result.statusLine) {
      this.statusLine = result.statusLine;
    } else {
      this.statusLine = summary;
    }
    const prompt = result.prompt ?? this.buildPrompt();
    return {
      summary,
      prompt,
      victory: Boolean(result.victory),
      endingType: result.endingType || null,
      state: this.getSnapshot(prompt),
      stateSummary: this.composeStateSummary(summary, prompt),
      highlightNavigator: Boolean(result.highlightNavigator),
      doorOpened: Boolean(result.doorOpened)
    };
  }
  extractDirection(text) {
    const dirs = ["front", "back", "left", "right"];
    return dirs.find((dir) => text === dir || text.startsWith(`go ${dir}`) || text.includes(`${dir} door`));
  }
  move(direction) {
    const room = this.rooms[this.currentRoom];
    const targetId = room.connections?.[direction];
    if (!targetId) {
      return { summary: `There's only old plaster ${direction}.` };
    }
    const target = this.rooms[targetId];
    const visitedBefore = this.visited.has(targetId);
    if (target.lockedBy && !this.unlockedRooms.has(targetId)) {
      const keyItem = this.inventory.get(target.lockedBy);
      if (!keyItem) {
        return { summary: `${target.name} is locked. I need the ${target.lockedBy.includes("gold") ? "gold" : "matching silver"} key.` };
      }
      this.unlockedRooms.add(targetId);
      this.inventory.delete(target.lockedBy);
      this.rememberClue(`${keyItem.label} opened ${target.name}.`);
    }
    this.currentRoom = targetId;
    this.visited.add(targetId);
    const directionPhrase = this.directionText(direction);
    const revisitPrefix = visitedBefore ? "I've already been here. " : "";
    let summary = `${revisitPrefix}I ${directionPhrase} into ${target.name}. ${target.description}`;
    if (!target.loot.length) {
      summary += " It's empty, which somehow feels worse.";
    }
    if (target.id === "mirrorHall") {
      summary += " There's a mirror ahead humming like a doorway.";
    }
    return { summary, doorOpened: true };
  }
  searchRoom() {
    const room = this.rooms[this.currentRoom];
    if (!room.loot.length) {
      return { summary: "Nothing useful turns up." };
    }
    const found = room.loot.splice(0, room.loot.length);
    const labels = [];
    let clueFound = false;
    let keyFound = false;
    found.forEach((item) => {
      if (item.type === "clue") {
        this.rememberClue(item.text || item.label);
        clueFound = true;
      } else {
        this.inventory.set(item.id, item);
      }
      if (item.type === "key") {
        keyFound = true;
      }
      labels.push(item.label);
    });
    const lootLine = labels.length === 1 ? `I just found ${labels[0]}.` : `I just found ${formatList(labels)}.`;
    const extra = [];
    if (keyFound) {
      extra.push("I can't believe it - I actually found a key; this must be useful.");
    }
    const summary = [lootLine, ...extra].join(" ").trim();
    return { summary, highlightNavigator: clueFound };
  }
  touchMirror() {
    const room = this.rooms[this.currentRoom];
    if (room.id !== "mirrorHall") {
      return { summary: "No mirror here answers back." };
    }
    this.currentRoom = "marbleBath";
    this.rememberClue("The bathroom mirror spits me back into your world.");
    return {
      summary: "I press into the giant mirror. Light folds, and I fall out of the marble bath mirror back home.",
      victory: true,
      prompt: "Water drips from the bathroom mirror. Want to spark the typewriter again?",
      endingType: "bad"
    };
  }
  shatterMirror() {
    const room = this.rooms[this.currentRoom];
    if (room.id !== "mirrorHall") {
      return { summary: "I need the humming mirror right in front of me before I can do that." };
    }
    const summary =
      "I slam BREAK THE MIRROR into the keys. The other voice howls, 'How did you know? How did you know I was not human? You can't do this to me!' Light stutters, mirrors crack, and the air smells like burnt ozone.";
    this.rememberClue("BREAK THE MIRROR shattered the mimic and sealed the cracks with light.");
    return {
      summary,
      victory: true,
      endingType: "good",
      statusLine: "The mirrors lie shattered, the house finally still.",
      prompt: "Shards glitter on the floor, but the mansion feels safe. Want to try the typewriter again?"
    };
  }
  describeInventory() {
    const keys = this.inventoryList("key");
    return `Keys: ${keys.length ? keys.join(", ") : "none"}.`;
  }
  helpText() {
    return "Commands: front/back/left/right to move, search to look around, inventory for keys, look for room details, mirror to step through the glowing mirror, break the mirror to shatter it when you stand in Mirror Hall.";
  }
  rememberClue(text) {
    if (!text) return;
    this.clues.unshift(text);
    this.clues = this.clues.slice(0, 6);
  }
  inventoryList(type) {
    return Array.from(this.inventory.values())
      .filter((item) => item.type === type)
      .map((item) => item.label);
  }
  getSnapshot(prompt) {
    const room = this.rooms[this.currentRoom];
    return {
      roomName: room.name,
      roomType: room.type,
      description: room.description,
      keys: this.inventoryList("key"),
      clueCount: this.clues.length,
      statusLine: this.statusLine,
      prompt: prompt || this.buildPrompt()
    };
  }
  getParserContext() {
    const room = this.rooms[this.currentRoom];
    const directions = Object.keys(room.connections || {});
    const directionText = directions.length ? directions.join(", ") : "none";
    const keys = this.inventoryList("key").join(", ") || "none";
    return [
      `Room: ${room.name}. Type: ${room.type}. Directions: ${directionText}.`,
      `Keys in pocket: ${keys}.`,
      "Mirror actions only work inside Mirror Hall.",
      "Valid commands: front/back/left/right, search, inventory, look, help, mirror, break the mirror."
    ].join(" ");
  }
  buildPrompt() {
    const room = this.rooms[this.currentRoom];
    const options = Object.entries(room.connections || {})
      .filter(([, target]) => Boolean(target))
      .map(([dir, target]) => {
        const lockedRoom = this.rooms[target];
        const locked = lockedRoom.lockedBy && !this.unlockedRooms.has(target);
        return `${dir.toUpperCase()}${locked ? " (locked)" : ""}`;
      });
    if (!options.length) return "No doors left - search or plan.";
    return `Doors I can take: ${options.join(", ")}. Say search to look around or point me at the mirror when you find it.`;
  }
  composeStateSummary(latest, prompt) {
    const room = this.rooms[this.currentRoom];
    const keys = this.inventoryList("key").join(", ") || "no keys";
    return [
      "You are the manor's new owner, trapped in the mirrored version of the house after chasing a chill into the basement.",
      `Current room: ${room.name} (${room.type}). ${room.description}`,
      `Inventory - Keys: ${keys}.`,
      `Latest event: ${latest}`,
      `Player prompt: ${prompt}`,
      "Answer in two brief first-person sentences from a mysterious but hopeful stranger, end by asking what they want you to try next, and use British English spelling."
    ].join("\n");
  }
  directionText(direction) {
    switch (direction) {
      case "front":
        return "move forward";
      case "back":
        return "move back";
      case "left":
        return "move left";
      case "right":
        return "move right";
      default:
        return "move";
    }
  }
}

class GeminiClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.instructions =
      "You are a mysterious homeowner trapped in the mirrored version of their mansion. Narrate like an anxious but hopeful confidant, 2 sentences max, using British English spelling.";
    this.reset();
  }
  reset() {
    this.history = [];
    if (GEMINI_URL) {
      this.history.push({ role: "user", parts: [{ text: this.instructions }] });
    }
  }
  trimHistory() {
    const maxMessages = 12;
    if (this.history.length > maxMessages) {
      this.history = this.history.slice(this.history.length - maxMessages);
    }
  }
  async respond({ stateSummary }) {
    if (!GEMINI_URL) return null;
    const userMessage = { role: "user", parts: [{ text: stateSummary }] };
    const payload = {
      contents: [...this.history, userMessage],
      generationConfig: { temperature: 0.7, maxOutputTokens: 180 }
    };
    try {
      const response = await fetch(GEMINI_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error(`Gemini error: ${response.status}`);
      const data = await response.json();
      const reply = data.candidates?.[0]?.content?.parts?.map((part) => part.text).join("").trim();
      if (reply) {
        this.history.push(userMessage, { role: "model", parts: [{ text: reply }] });
        this.trimHistory();
        return reply;
      }
    } catch (error) {
      console.warn("Gemini request failed", error);
    }
    return null;
  }
}

class CommandInterpreter {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.instructions = [
      "You convert player chatter into a single canonical command for the mansion game.",
      "Valid actions: front/back/left/right (movement), search, inventory, look, help, mirror (step through the glowing mirror), break the mirror (shatter the creature when standing in Mirror Hall).",
      "If the player mentions a direction, respond with the bare word: 'front', 'back', 'left', or 'right'.",
      "If they clearly want to use the mirror, output 'mirror'."
    ].join(" ");
  }
  async normalize(input, engine) {
    if (!GEMINI_URL) return null;
    const trimmed = input.trim();
    if (!trimmed) return null;
    const context = engine?.getParserContext ? engine.getParserContext() : "";
    const prompt = [
      this.instructions,
      context ? `Context: ${context}` : "",
      `Player sentence: """${trimmed}"""`,
      'Respond with strict JSON: {"canonical": "...", "confidence": 0-1}.'
    ]
      .filter(Boolean)
      .join("\n");
    const payload = {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 90 }
    };
    try {
      const response = await fetch(GEMINI_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error(`Gemini command error: ${response.status}`);
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text).join("").trim();
      const parsed = this.parseResponse(text);
      if (parsed?.canonical) {
        return {
          canonical: parsed.canonical.trim(),
          confidence: typeof parsed.confidence === "number" ? parsed.confidence : null
        };
      }
    } catch (error) {
      console.warn("Command interpreter fallback", error);
    }
    return null;
  }
  parseResponse(raw) {
    if (!raw) return null;
    const fenced = raw.match(/```json\s*([\s\S]*?)```/i);
    const target = fenced ? fenced[1] : raw;
    const attempt = (snippet) => {
      try {
        return JSON.parse(snippet);
      } catch (err) {
        return null;
      }
    };
    const direct = attempt(target.trim());
    if (direct) return direct;
    const braceMatch = raw.match(/\{[\s\S]*\}/);
    return braceMatch ? attempt(braceMatch[0]) : null;
  }
}

function normalizeCommandLocally(input, engine) {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const lower = trimmed.toLowerCase();
  const contains = (...phrases) => phrases.some((phrase) => lower.includes(phrase));
  const directionSynonyms = [
    { target: "front", patterns: ["front", "forward", "ahead", "straight", "north", "up ahead"] },
    { target: "back", patterns: ["back", "behind", "reverse", "south", "turn around", "retreat"] },
    { target: "left", patterns: ["left", "west", "port"] },
    { target: "right", patterns: ["right", "east", "starboard"] }
  ];
  for (const entry of directionSynonyms) {
    if (contains(...entry.patterns)) {
      return entry.target;
    }
  }
  if (lower === "break the mirror" || contains("break the mirror")) {
    return "break the mirror";
  }
  if (contains("mirror", "reflection", "looking glass", "glass door")) {
    return "mirror";
  }
  if (contains("search", "rummage", "look for", "investigate", "check around", "dig through", "inspect")) {
    return "search";
  }
  if (
    contains(
      "what do you see",
      "what are you seeing",
      "what does it look",
      "describe",
      "look around",
      "observe",
      "tell me what you see",
      "see anything"
    )
  ) {
    return "look";
  }
  if (contains("inventory", "bag", "items", "gear", "equipment")) {
    return "inventory";
  }
  if (contains("help", "commands", "what can you do", "remind me")) {
    return "help";
  }
  if (contains("status", "where are you", "how's it look", "report")) {
    return "look";
  }
  return null;
}

class GameController {
  constructor({ typewriter, journal, hud, clueBoard, promptBox, audio, gemini, interpreter, engine, sendButton, backspaceButton, spaceButton }) {
    this.typewriter = typewriter;
    this.journal = journal;
    this.hud = hud;
    this.clueBoard = clueBoard;
    this.promptBox = promptBox;
    this.audio = audio;
    this.gemini = gemini;
    this.interpreter = interpreter;
    this.engine = engine;
    this.sendButton = sendButton;
    this.backspaceButton = backspaceButton;
    this.spaceButton = spaceButton;
    this.active = false;
    this.busy = false;
    this.voiceName = "Other Voice";
    this.inactivityTimer = null;
    this.idleMessageSent = false;
    this.awaitingPresence = false;
    sendButton.addEventListener("click", () => this.submitCommand());
    backspaceButton.addEventListener("click", () => this.handleBackspace());
    spaceButton.addEventListener("click", () => this.handleSymbol(" "));
  }
  start() {
    this.engine.reset();
    this.gemini.reset();
    this.typewriter.clear();
    this.journal.reset();
    const opening =
      "I'm trapped inside the mirrored version of this mansion in another dimension and I need your help. I don't know how I got here, but I can feel you're close—are you there?";
    this.journal.write(this.voiceName, opening);
    const snapshot = this.engine.getSnapshot(this.engine.buildPrompt());
    this.hud.update(snapshot);
    this.clueBoard.update(this.engine.clues);
    this.promptBox.textContent = snapshot.prompt;
    this.active = true;
    this.clearIdlePing();
    this.scheduleIdlePing();
    this.awaitingPresence = true;
  }
  handleSymbol(symbol) {
    if (!this.active || this.busy) return;
    const normalized = symbol === " " ? symbol : symbol.toUpperCase();
    if (!isTypeableSymbol(normalized)) return;
    if (this.typewriter.append(normalized)) {
      this.audio.playKey();
    }
  }
  handleBackspace() {
    if (!this.active || this.busy) return;
    this.typewriter.backspace();
  }
  async submitCommand() {
    if (!this.active || this.busy) return;
    const text = this.typewriter.value();
    if (!text) {
      this.journal.write(this.voiceName, "Give me more than silence.");
      return;
    }
    this.typewriter.clear();
    this.audio.playCarriage();
    this.busy = true;
    this.sendButton.disabled = true;
    this.clearIdlePing();
    try {
      this.journal.write("You", text);
      if (this.awaitingPresence) {
        const normalizedResponse = text.trim().toLowerCase();
        if (normalizedResponse === "yes" || normalizedResponse === "no") {
          this.journal.write(
            this.voiceName,
            "I can see the letters you typed bleeding through the wallpaper. Please guide me to any mirror—that's the only way out."
          );
          this.awaitingPresence = false;
        } else {
          this.journal.write(this.voiceName, "Please, just say yes or no so I know you're really there.");
        }
        this.scheduleIdlePing();
        return;
      }
      let commandText = text;
      const localIntent = normalizeCommandLocally(text, this.engine);
      if (localIntent) {
        commandText = localIntent;
      } else if (this.interpreter) {
        try {
          const normalized = await this.interpreter.normalize(text, this.engine);
          if (normalized?.canonical) {
            commandText = normalized.canonical;
          }
        } catch (error) {
          console.warn("Interpreter fallback", error);
        }
      }
      const result = this.engine.handleCommand(commandText);
      if (result.doorOpened) {
        this.audio.playDoor();
      }
      this.hud.update(result.state);
      this.clueBoard.update(this.engine.clues);
      this.promptBox.textContent = result.prompt;
      if (result.highlightNavigator) {
        flashNavigatorCue();
      }
      let reply = await this.gemini.respond({ stateSummary: result.stateSummary });
      if (!reply) {
        reply = `${result.summary} ${result.prompt}`;
      }
      this.journal.write(this.voiceName, reply);
      if (result.victory) {
        this.active = false;
        this.audio.playBell();
        showFinalSequence(result.endingType || "bad");
        this.clearIdlePing();
      } else {
        this.scheduleIdlePing();
      }
    } finally {
      this.busy = false;
      this.sendButton.disabled = false;
    }
  }
  scheduleIdlePing() {
    if (!this.active) return;
    this.clearIdlePing();
    this.idleMessageSent = false;
    this.inactivityTimer = setTimeout(() => {
      this.inactivityTimer = null;
      if (!this.active || this.busy || this.idleMessageSent) return;
      this.journal.write(this.voiceName, "are you still there? please help me im scared");
      this.idleMessageSent = true;
    }, 30000);
  }
  clearIdlePing() {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
      this.inactivityTimer = null;
    }
  }
}

function isTypeableSymbol(symbol) {
  if (symbol === " ") return true;
  const upper = symbol.toUpperCase();
  return TYPEABLE_SYMBOLS.has(upper);
}

function assignImageSource(img, symbol, state, fallback) {
  const path = atlas.path(symbol, state);
  if (!path) {
    if (fallback) fallback(symbol);
    return;
  }
  const attempts = [path];
  if (path.toLowerCase().endsWith(".png")) {
    attempts.push(path.replace(/\.png$/i, ".PNG"));
  }
  let cursor = 0;
  const tryNext = () => {
    if (cursor >= attempts.length) {
      if (fallback) fallback(symbol);
      return;
    }
    img.src = attempts[cursor];
    cursor += 1;
  };
  img.onerror = () => tryNext();
  tryNext();
}

function symbolToTileIndex(symbol) {
  if (LETTER_REGEX.test(symbol)) {
    return LETTER_TILE_START + (symbol.charCodeAt(0) - 65);
  }
  return SPECIAL_KEY_INDEX[symbol] ?? null;
}

function createFallbackBox(symbol) {
  const span = document.createElement("span");
  span.className =
    "fallback-letter flex items-center justify-center border border-slate-500 rounded-lg bg-white/80 text-[#1c120c]";
  span.textContent = symbol;
  return span;
}

function formatList(items) {
  if (items.length <= 1) {
    return items[0] ?? "";
  }
  const head = items.slice(0, -1).join(", ");
  const tail = items[items.length - 1];
  return `${head} and ${tail}`;
}

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

function flashNavigatorCue() {
  if (!menuToggle) return;
  menuToggle.classList.add("navigator-flash");
  if (menuPanel && !menuPanel.classList.contains("hidden")) {
    menuPanel.classList.add("navigator-flash");
  }
  if (navigatorFlashTimeout) {
    clearTimeout(navigatorFlashTimeout);
  }
  navigatorFlashTimeout = setTimeout(() => {
    menuToggle.classList.remove("navigator-flash");
    if (menuPanel) {
      menuPanel.classList.remove("navigator-flash");
    }
    navigatorFlashTimeout = null;
  }, 2500);
}

let introSlideIndex = 0;
let finalSlideIndex = 0;
let finalSoundPlayed = false;
let activeFinalSlides = BAD_FINAL_SLIDES;
let currentEndingType = "bad";

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
const gemini = new GeminiClient(GEMINI_API_KEY);
const engine = new MansionEngine();
const interpreter = new CommandInterpreter(GEMINI_API_KEY);

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
  spaceButton: document.getElementById("spaceButton")
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

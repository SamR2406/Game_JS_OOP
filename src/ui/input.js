import {
  KEY_ROWS,
  KEY_SYMBOLS,
  SPECIAL_KEY_INDEX,
  LETTER_REGEX,
  LETTER_TILE_START,
  TYPEABLE_SYMBOLS
} from "../constants.js";

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

export class Typewriter {
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

export class KeyboardView {
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
  swapState(entry, symbol, targetState) {
    if (entry.fallback) return;
    assignImageSource(entry.img, symbol, targetState, () => {
      this.forceFallback(entry, symbol);
    });
  }
}

export function isTypeableSymbol(symbol) {
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

export class Journal {
  constructor(container) {
    this.container = container;
  }
  reset() {
    this.container.innerHTML = "";
  }
  write(author, text) {
    const entry = document.createElement("article");
    entry.className = "journal-entry";
    const label = document.createElement("p");
    label.className = "paper-label mb-1";
    label.textContent = author;
    const body = document.createElement("p");
    body.className = "leading-relaxed";
    body.textContent = text;
    entry.append(label, body);
    this.container.appendChild(entry);
    this.container.scrollTop = this.container.scrollHeight;
  }
}

export class ClueBoard {
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

export class HUD {
  constructor(locationEl, keysEl, clueEl, statusEl) {
    this.locationEl = locationEl;
    this.keysEl = keysEl;
    this.clueEl = clueEl;
    this.statusEl = statusEl;
  }
  update(snapshot) {
    this.locationEl.textContent = snapshot.roomName;
    this.keysEl.textContent = snapshot.keys.length ? snapshot.keys.join(", ") : "None";
    const clueCount = snapshot.clueCount ?? 0;
    this.clueEl.textContent = clueCount ? `${clueCount}` : "0";
    this.statusEl.textContent = snapshot.statusLine;
  }
}

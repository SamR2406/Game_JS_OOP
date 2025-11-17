import { normalizeCommandLocally } from "../services/commandInterpreter.js";

export class GameController {
  constructor({
    typewriter,
    journal,
    hud,
    clueBoard,
    promptBox,
    audio,
    gemini,
    interpreter,
    engine,
    sendButton,
    backspaceButton,
    spaceButton,
    onNavigatorCue,
    onFinalSequence
  }) {
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
    this.onNavigatorCue = onNavigatorCue;
    this.onFinalSequence = onFinalSequence;
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
    if (!this.typewriter.append(normalized)) return;
    this.audio.playKey();
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
      const localIntent = normalizeCommandLocally(text);
      if (localIntent) {
        commandText = localIntent;
      } else if (this.interpreter) {
        try {
          const normalized = await this.interpreter.normalize(text, this.engine);
          if (normalized?.canonical) {
            commandText = normalized.canonical;
          }
        } catch (error) {
          console.warn("Command interpreter fallback", error);
        }
      }
      const result = this.engine.handleCommand(commandText);
      if (result.doorOpened) {
        this.audio.playDoor();
      }
      this.hud.update(result.state);
      this.clueBoard.update(this.engine.clues);
      this.promptBox.textContent = result.prompt;
      if (result.highlightNavigator && this.onNavigatorCue) {
        this.onNavigatorCue();
      }
      let reply = await this.gemini.respond({ stateSummary: result.stateSummary });
      if (!reply) {
        reply = `${result.summary} ${result.prompt}`;
      }
      this.journal.write(this.voiceName, reply);
      if (result.victory) {
        this.active = false;
        this.audio.playBell();
        if (this.onFinalSequence) {
          this.onFinalSequence(result.endingType || "bad");
        }
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

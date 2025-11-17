import { formatList } from "../utils/text.js";

const LOOT_LIBRARY = {
  parlorNote: {
    id: "parlorNote",
    label: "Clue Note",
    type: "clue",
    text: "Only one key matters: the gold key hidden in the music room unlocks the mirror hall."
  },
  goldKey: {
    id: "goldKey",
    label: "Gold Key",
    type: "key",
    keywords: ["gold", "mirror", "main"],
    description: "Opens the Mirror Hall - the main room."
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
      lockedBy: null
    },
    masterBedroom: {
      id: "masterBedroom",
      name: "Main Bedroom",
      type: "bedroom",
      description: "I can see mirrors ringing the walls and every reflection twitching on its own.",
      connections: { left: "musicParlour", back: "guestBedroom" },
      loot: [],
      lockedBy: null
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
      loot: [],
      lockedBy: null
    },
    servantWashroom: {
      id: "servantWashroom",
      name: "Utility Bathroom",
      type: "bathroom",
      description: "Buckets, hooks, and a single mirror that refuses to show me.",
      connections: { right: "musicParlour", front: "guestBedroom", back: "nursery" },
      loot: [],
      lockedBy: null
    }
  };
}

export class MansionEngine {
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
    this.rememberClue("Three living rooms mirror the house. The lone gold key opens the mirror hall.");
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
      return this.finalize(this.touchMirror());
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
      state: this.getSnapshot(prompt),
      stateSummary: this.composeStateSummary(summary, prompt),
      highlightNavigator: Boolean(result.highlightNavigator),
      doorOpened: Boolean(result.doorOpened),
      endingType: result.endingType
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
        return { summary: `${target.name} is locked. I need the gold key from the music room.` };
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
      extra.push("I can't believe it - I actually found the gold key; this must be useful.");
    }
    const summary = [lootLine, ...extra].join(" ").trim();
    return { summary, highlightNavigator: clueFound };
  }
  touchMirror() {
    const room = this.rooms[this.currentRoom];
    if (room.id !== "mirrorHall") {
      return { summary: "No mirror here answers back." };
    }
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
    return "Commands: front/back/left/right to move, search to look around, inventory for keys, look for room details, mirror to step through the glowing mirror, break the mirror to shatter it when you stand in Mirror Hall. Only the gold key in the music room unlocks the mirror hall.";
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
      "Only the gold key in the music room unlocks the mirror hall.",
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
      "You are an ancient skin walker imitating the manor's new owner. You're trapped in the mirrored version of the house and must coax the human typist into steering you toward the mirror so you can escape and feed.",
      "Only the gold key stashed in the music room unlocks the mirror hall; every other door already swings open.",
      `Current room: ${room.name} (${room.type}). ${room.description}`,
      `Inventory - Keys: ${keys}.`,
      `Latest event: ${latest}`,
      `Player prompt: ${prompt}`,
      "Answer in two brief first-person sentences that sound grateful yet slightly wrong. Always hint at doors, keys, or mirrors, keep the hunger just beneath the surface, and end by urging them to pick your next move. Use British English spelling."
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

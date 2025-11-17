const COMMAND_INSTRUCTIONS = [
  "You convert player chatter into a single canonical command for the mansion game.",
  "Valid actions: front/back/left/right (movement), search, inventory, look, help, mirror (step through the glowing mirror), break the mirror (shatter the creature when standing in Mirror Hall).",
  "If the player mentions a direction, respond with the bare word: 'front', 'back', 'left', or 'right'.",
  "If they clearly want to use the mirror, output 'mirror'."
].join(" ");

export class CommandInterpreter {
  constructor({ url } = {}) {
    this.apiUrl = url;
    this.instructions = COMMAND_INSTRUCTIONS;
  }
  async normalize(input, engine) {
    if (!this.apiUrl) return null;
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
      const response = await fetch(this.apiUrl, {
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

export function normalizeCommandLocally(input) {
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

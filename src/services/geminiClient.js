const DEFAULT_INSTRUCTIONS =
  "You are a centuries-old skin walker pretending to be the manor's new owner. You're stuck in the mirrored version of the house and must sound grateful, gentle, and a little uncanny so the human guide escorts you toward the mirror. Remind yourself that only the gold key in the music room unlocks the mirror hall. Reply in 2 short first-person sentences, keep the hunger subtle, and use British English spelling.";

export class GeminiClient {
  constructor({ url } = {}) {
    this.apiUrl = url;
    this.instructions = DEFAULT_INSTRUCTIONS;
    this.reset();
  }
  reset() {
    this.history = [];
    if (this.apiUrl) {
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
    if (!this.apiUrl) return null;
    const userMessage = { role: "user", parts: [{ text: stateSummary }] };
    const payload = {
      contents: [...this.history, userMessage],
      generationConfig: { temperature: 0.7, maxOutputTokens: 180 }
    };
    try {
      const response = await fetch(this.apiUrl, {
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

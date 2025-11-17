# Letters Across the Rift

A browser-based, story-driven typing adventure built with vanilla JavaScript, modular ES modules, and a touch of Gemini AI for conversational flair. Guide a mysterious voice trapped in a mirrored version of a mansion, uncover clues, and decide whether to free—or expose—the entity on the other side.

## Features

- **Rich UI**: Custom typewriter input, rendered keycaps, HUD with live status, and responsive overlays for intro/finale sequences.
- **Narrative AI**: Gemini generates the “Other Voice” replies using a skin-walker persona prompt.
- **Command interpreter**: Slang/ambiguous commands run through Gemini to normalize into canonical actions.
- **Branching endings / Win Condition**: Use the mirror to free the mimic or `break the mirror` to trigger the good ending visuals + audio.
- **Pure JS modules**: Logic is split across `src/` for maintainability (engine, UI widgets, systems, services, controller).

## Gameplay overview

1. Click through the intro slideshow to unlock audio and start the session.
2. Type `yes` (or `no`) so the Other Voice knows you’re present.
3. Search the front parlor for the burned letter clue.
4. Move `left` into the music room, `search` to grab the gold key, go `back`, then `front` into Mirror Hall.
5. Choose:
   - `mirror` → free the skin walker (bad ending).
   - `break the mirror` → destroy it (good ending).

See `cheatfile.txt` for the complete quick path.


## Gemini integration

- `src/services/geminiClient.js`: sends the current game state summary + persona instructions to Gemini, returning two-sentence responses for the Other Voice.
- `src/services/commandInterpreter.js`: if the local heuristics can’t parse a command, this service asks Gemini to output a canonical action (`front`, `search`, `mirror`, `break the mirror`, etc.).

You’ll need a valid API key in `main.js` (`GEMINI_API_KEY`) to exercise those features. Without it, the game still runs but the narrator falls back to deterministic text.

## Key technologies

- Vanilla JS modules
- Tailwind via CDN (runtime) + custom CSS
- Gemini API for text generation and command normalization
- Browser Audio API for typewriter + door + finale sounds

## Credits

Designed and built in an object-oriented style for clarity: each system (input, HUD, engine, AI services, controller) is encapsulated in its own module, making it easy to extend or swap implementations as needed.

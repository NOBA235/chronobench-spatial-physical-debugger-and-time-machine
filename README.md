# ChronoCairn

Seated, hands-first VR time-manipulation puzzle. Built on Meta's Immersive Web SDK (IWSDK).

## Run
Needs Node 20.19+ or 22.12+.

    npm install
    npm run dev            # IWSDK dev browser with the IWER headset/hands emulator
    npm run dev:runtime    # plain Vite; open the printed URL in your own Chrome (emulator is injected in dev)

## Check
    npm run typecheck
    npm run verify:levels  # every level fails by default and has a solution
    npm run build

## Controls
- Headset: left hand rolls the wrist to scrub time and pinches to freeze it. Right hand grabs the cyan plates.
  Poke the crystal orb for the Chaos Architect.
- Desktop (no XR session): drag plates, Ctrl+drag moves on the table, Shift+drag or R/F tilts. Right-drag orbits the camera, -/= zoom.
  Space freezes, Q/E/arrows/wheel scrub, 1-5 load levels, G Chaos Architect, T runs the 50-second demo.

## Gemini (optional)
Put `VITE_AI_API_KEY=...` in `.env`. Without a key the verified offline generator is used.

## Credits
Project scaffold, `iwsdk.config.json` layout and Vite config come from Meta's `npm create @iwsdk@latest` (MIT, Copyright Meta Platforms, Inc.). All game code in `src/` is original.

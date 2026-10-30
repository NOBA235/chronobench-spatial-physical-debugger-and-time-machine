# ChronoCairn — Devpost submission (Meta VR Start Developer Competition 2026)

## Title
ChronoCairn

## Tagline (140 chars max)
Freeze time, rewire cause and effect: a seated, hands-only VR tabletop puzzle where an AI Chaos Architect only deals solvable paradoxes.

## Track
Gaming

## Division
New Experience

## Built with
@iwsdk/core (Meta Immersive Web SDK), Three.js, TypeScript, Vite, WebXR hand tracking, Web Audio API (HRTF), Gemini 2.5 Flash, Vercel

## Description
ChronoCairn is a seated, hands-first puzzle about editing the past. A glowing miniature diorama floats in front of you. Ten seconds of chain-reaction disaster loop on it, and your Energy Core always fails to reach the Reactor. You fix it by changing cause, not effect.

**Left hand is time.** Roll your wrist to scrub from -2.5x to +2.5x. Pinch thumb and index to freeze the moment: velocity arrows hang in the air and every bounce leaves a ripple that expands as time moves forward and contracts as you rewind.

**Right hand is the architect.** While time is frozen, reach in and pinch a cyan anchor plate (`OneHandGrabbable`, `RayInteractable`). The instant you move it, the timeline forks: a deterministic 60 Hz solver re-simulates every future frame and redraws the predicted trajectory, crimson if causality fractures, gold if it holds. Release the pinch and the new future plays.

**The Chaos Architect is neuro-symbolic.** Poke the crystal orb and Gemini 2.5 Flash receives your telemetry (solve time, scrub count, freeze frame, anchor angles) and designs a new paradox, with a one-sentence narrative, meant to counter your habits. A language model can't be trusted to produce a playable level, so every proposal passes through the same physics solver the game uses: the layout must fail as authored and must be solvable by moving an anchor. Unsolvable, malformed or slow (over 2.5 s) answers are discarded, and a procedural mutator takes over. It backtracks from a real trajectory, so its levels are solvable by construction and checked again by the solver. The orb never fails to produce a level.

Five built-in paradoxes (pendulum hazards, a repulsor well, a ceiling laser grid, low gravity) were each verified by an automated search: default state fails, a solution exists.

### How it meets Meta's tests
- **Airplane Seat Test:** everything happens inside a 0.6 m tabletop volume in front of a seated player. No locomotion, no standing, no controllers.
- **One Bus Stop Test:** cold start drops you straight into the looping puzzle. No title screen or menus; all feedback is diegetic 3D (wrist dial, holographic HUD).
- **Take It Away Test:** fully offline. Zero binary assets: all geometry, shaders and sound are generated procedurally. The built-in levels and the procedural Chaos Architect need no network; Gemini is an optional upgrade.

### Desktop fallback
Judges without a headset can play in a browser: drag anchors with the mouse (Shift-drag or R/F to tilt), Space to freeze, Q/E or the wheel to scrub, G for the Chaos Architect, and T for a hands-free 50-second demo.

## Before you submit
- Deadline: Nov 18, 2026 12:00pm PST (that is Nov 19, 1:30am IST).
- The demo video (under 3 minutes) may be recorded from a headset, the XR Simulator or an equivalent emulator. Lead with your best 20 seconds.
- Confirm Track (Gaming) and Division (New Experience) on the live form.
- Add: demo video URL, live Vercel URL, repo URL.
- Test the hand controls in the IWER emulator (and a real headset if you can) before recording.

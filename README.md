# Neon Nexus

An original arcade-resort experience: explore themed districts, play quick challenges, earn tokens and redeem prizes.

## Current prototype

- Responsive resort welcome page with a deliberate entry point and six district discovery panels.
- **Interactive 3D Grand Atrium** with a central landmark, illuminated arcade cabinets, seating, planters and atmospheric lighting.
- **Third-person player movement** using WASD / arrow keys on desktop and an on-screen touch joystick on mobile.
- **Physical arcade cabinet interactions**: walk close and press E or tap Interact. Neon Hoops launches the playable challenge; Prize Drop awards a one-time 15-token discovery bonus; other cabinets preview upcoming games.
- Playable 30-second **Neon Hoops** challenge with scoring, best score and token rewards.
- Three starter quests, token wallet and prize-vault redemption.
- **Persistent local player profile**: wallet, quest progress, best score, claimed bonus and redeemed prizes save in the browser on that device.
- Responsive layouts, keyboard-accessible dialogs and reduced-motion support.

## Controls

- Desktop: **WASD** or **arrow keys** to walk; **E** to use a nearby machine.
- Mobile: drag the on-screen joystick to move; approach a machine and tap **Interact**.
- You can also tap a cabinet in the 3D scene when your character is close to it.

## Run locally

This is a static site. Open `index.html` in a browser, or run a local static server:

```bash
npx serve .
```

The 3D scene loads Three.js as an ES module from jsDelivr, so an internet connection is needed for that dependency. The rest of the site remains static.

## GitHub Pages

In the repository settings, set **Pages → Build and deployment → Deploy from a branch**, choose `main` and `/(root)`. The site is served from `index.html`.

## Roadmap

1. Expand each district into its own functional playable space.
2. Add richer character customisation, NPCs, social features and tournaments.
3. Add original mini-games, animations, audio, accessibility and performance polish.
4. Consider cloud-backed profiles and cross-device saves (current saves are local to one browser/device).

Neon Nexus is an original project. All names, visual design and planned experiences are being developed as original IP.

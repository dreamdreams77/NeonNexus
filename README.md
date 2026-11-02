# Neon Nexus

An original arcade-resort experience: explore themed districts, play quick challenges, earn tokens and redeem prizes.

## Current prototype

- Responsive resort welcome page with a deliberate entry point and six district discovery panels.
- **Interactive 3D Grand Atrium** with central landmark, illuminated arcade cabinets, seating, planters and atmospheric lighting.
- **Five additional explorable 3D districts**, each with its own environment, landmarks and activities:
  - **Combat District:** holographic target range with three interactive targets.
  - **Velocity Boulevard:** night circuit, electric show car, track barriers, garage showcase and finish gate.
  - **Classic Arcade:** skee-ball, air hockey and claw-machine cabinets.
  - **Food & Social:** Afterglow Café, host character, seating and order counter.
  - **Prize Vault:** collector gallery with five illuminated display cases and a bonus point of interest.
- Third-person movement in both world areas: WASD / arrow keys on desktop and an on-screen joystick on mobile.
- Approach an activity and press **E**, or use the on-screen **Interact** button.
- District cards jump directly into the corresponding world. The district tabs also let you switch spaces.
- Activities award tokens; each activity can be completed once per local player profile to prevent repeat farming.
- Dedicated **Neon Hoops** 3D arcade game staged as a handmade clay miniature: procedural thumbprint/grain bump textures, subtly irregular sculpted meshes, a hand-modelled player with a painted face, warm theatrical lighting, soft shadows and 12fps stop-motion-style character motion. Includes a 45-second skill challenge, drag-to-aim controls, variable shot power, simulated gravity, collisions, rebounds and token rewards.
- Physics engine separated from rendering and covered by automated Node tests.
- Three starter quests, token wallet and prize-vault redemption.
- **Persistent local player profile**: wallet, quest progress, best score, claimed bonuses, redeemed prizes and completed district activities save in the browser on that device.
- Responsive layouts, keyboard-accessible dialogs and reduced-motion support.

## Arcade game collection\n\nThe dedicated [Nexus Arcade](./arcade.html) hub contains twenty distinct cabinet experiences: Neon Hoops, Cosmic Skee-Ball, Comet Air Hockey, Moon Moles, Bubble Blaster, Prism Sequence, Beat Foundry, Meteor Mayhem, Turbo Tunnels, Clay Stack, Starlight Pinball, Lucky Claw, Kitchen Rush, Sushi Catch, Mixology Master, Pulse Runner, Barrelstorm Moto, Moonshard Legend, Comet Ring Toss and Moon Gem Dig. The walkable arcade also includes a separate Moonlight Billiards CPU table, a token jukebox, a weighted ticket wheel, a staffed Glow Bar and visitors with RPG-style conversations. Each has its own controls, scoring rules and round flow, with touch and keyboard support where applicable. Cabinet mastery persists per game and increases ticket payouts as it levels up. A daily district circuit rewards 80 tickets for playing three different cabinets, with one claim per UTC day. Four named regulars offer character-specific quests with tracked objectives and ticket rewards; the prize exchange adds VIP experiences and daily restocks to its limited-stock catalogue. Arcade rewards are added to the local player token wallet.\n\n## Controls

- Desktop: **WASD** or **arrow keys** to walk; **E** to use a nearby activity.
- Mobile: drag the on-screen joystick to move; approach an activity and tap **Interact**.
- Select any district tab to switch worlds. The original Grand Atrium remains available above.

## Run locally

This is a static site. Open `index.html`, or run a local static server:

```bash
npx serve .
```

Three.js loads as an ES module from jsDelivr, so an internet connection is needed for the 3D environments. Run `npm test` to execute the basketball physics regression suite.

## GitHub Pages

In repository settings, set **Pages → Build and deployment → Deploy from a branch**, choose `main` and `/(root)`. The site is served from `index.html`.

## Roadmap

1. Turn each district activity into a deeper mini-game with distinct mechanics, sound and animations.
2. Add richer character customisation, NPC dialogue, social features and tournaments.
3. Add accessibility options, performance polish and richer mobile controls.
4. Consider cloud-backed profiles and cross-device saves (current saves are local to one browser/device).

Neon Nexus is an original project. All names, visual design and planned experiences are being developed as original IP.

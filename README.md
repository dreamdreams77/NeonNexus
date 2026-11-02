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

## Arcade game collection\n\nThe dedicated [Nexus Arcade](./arcade.html) hub contains twenty distinct cabinet experiences: Neon Hoops, Cosmic Skee-Ball, Comet Air Hockey, Moon Moles, Bubble Blaster, Prism Sequence, Beat Foundry, Meteor Mayhem, Turbo Tunnels, Clay Stack, Starlight Pinball, Lucky Claw, Kitchen Rush, Sushi Catch, Mixology Master, Pulse Runner, Barrelstorm Moto, Moonshard Legend, Comet Ring Toss and Moon Gem Dig. The walkable arcade also includes a separate Moonlight Billiards CPU table, a token jukebox, a weighted ticket wheel, a staffed Glow Bar and visitors with RPG-style conversations. Each has its own controls, scoring rules and round flow, with touch and keyboard support where applicable. Cabinet mastery persists per game and increases ticket payouts as it levels up. A daily district circuit rewards 80 tickets for playing three different cabinets, with one claim per UTC day. Four named regulars offer character-specific quests with tracked objectives and ticket rewards; the prize exchange adds VIP experiences and daily restocks to its limited-stock catalogue. Arcade rewards are added to the local player token wallet.\n\n## Art direction: the hand-painted lobby

The Nexus Arcade lobby is dressed entirely with procedurally *painted* artwork (`lobby-art.js`), not flat colours or stock textures: wobbly ink outlines, dry-brush grain, layered washes and deliberate imperfections.

- **Floor:** painted parquet (per-plank grain, knots, bevels, a roughness map for sheen) under a single hand-painted arcade carpet with neon confetti, braided gold border, medallions and baked neon light spill.
- **Walls:** damask wallpaper over raised-panel wainscot, framed posters (eight painted designs) and neon plaques; an illuminated **NEON NEXUS** brand sign and an entrance arch with welcome mat.
- **Cabinets:** every machine has painted side-art, an ink outline and a tilted illuminated **marquee** with a unique illustrated emblem (hoops, pool ball, mole, cocktail, robot, gem…) and hand-lettered title.
- **Jukebox & lucky wheel:** chrome-arch jukebox with glowing tubes, spinning record glow and rising notes; both stand clear of the cabinets, with the air hockey and billiards tables on their own rugs.
- **Prize gallery:** neon lintel, flanking planters, and a walkable room with shelves and the prize exchange.
- **Crowd:** `lobby-crowd.js` populates the floor with individually dressed visitors with personalities. They use real A* pathfinding, queue for busy cabinets, play and react to winning or losing, drink at the bar, browse the prize gallery, dance at the jukebox and chat in pairs.

## Title screen and settings

The arcade opens on a title screen with an honest load bar (it completes when the 3D world has rendered), a friendly fallback if loading stalls, and **Settings** for sound, reduced motion and graphics quality (saved on your device).

## The twenty games

All twenty cabinets were playtested with scripted bots driving the real input handlers. Notable work from the audit:

- **Moonlight Billiards** – the whole physics/CPU/rules block had been stranded inside `start()` and only ran once; it now runs every frame (turns alternate, groups are assigned, pockets register).
- **Comet Air Hockey** – rebuilt: free 2D mallets that carry velocity, circle–circle collisions with momentum transfer, goal posts, a CPU that defends and attacks with level-dependent aim error, Easy / Normal / Hard.
- **Beat Foundry** – a charted 116 BPM rhythm game with a backing track on the same clock, Perfect / Good / OK / Miss windows, stray-tap penalty and S–D grades.
- **Turbo Tunnels** – a real circuit race: spline track, steering/throttle/brake, barriers, three AI rivals, three laps, lap timing and place-based rewards.
- **Comet Ring Toss** – was physically unwinnable (rings could not reach the pegs); now a lead-the-target throw with an aim reticle.
- **Pulse Runner** – walking speed was ~42 px/s because of a friction bug; fixed.
- **Lucky Claw** – every grab threw; fixed. Skeeball, Bubble Blaster and Clay Stack no longer award a "clear" for a zero score.

## Economy

Every cabinet has a difficulty tier (×1.0–×1.4) applied to payouts; beating your personal best adds a ticket bonus; Air Hockey's CPU level changes its payout (Hard ×1.25, Easy ×0.8). Payouts use a diminishing-returns score (soft cap) so runaway totals can't flood the economy. Tokens and tickets are spent at the Glow Bar and the prize exchange, and everything persists in `localStorage`.

## Performance

The 3D world pauses while a cabinet is open or the tab is hidden; dynamic point lights were cut from 60 to 14 (cabinet glow uses a small pool that follows the player); the floor is two painted planes instead of hundreds of tile meshes; mobile and the **Low** setting drop shadows, antialiasing and pixel ratio.

## Debugging and tests

Append `?debug` to `arcade.html` to expose `window.__nx` (camera/player), `window.__arc` (cabinet state) and `window.__crowd` for bot-driven playtests. `npm test` runs syntax checks plus ~100 tests, including the movement model and structural regression checks for each fix above.

## Controls

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

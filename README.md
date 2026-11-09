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

## Second-pass art direction: illustrated sprites

The lobby's characters and props are authored illustrations (`lobby-sprites.js`), not procedural noise on primitives: inked outlines, cel shading, designed silhouettes, expressive faces and per-feature drawing code.

- **Cast:** 17 individually designed characters (hair, outfits, glasses, headphones, beards, hats, scarves, backpacks, aprons), each with front / side / back views, a four-frame walk cycle and acting poses (wave, cheer, slump, sip, talk, button-mash). The player, four named regulars, the host, the bartender and chef and the whole crowd use them.
- **Cabinets:** side-profile illustrations in four body types (upright, sit-down racer, pinball, glass claw) with joystick, buttons, coin door, emblem badge and side-art, under a marquee sign that carries the game's artwork and mastery pips.
- **Furniture and props:** top-down dining tables with cushioned chairs and candles, bar stools, a marble bar top with glasses and snacks, three bar-top video-poker units, four plant species.
- **Prize gallery:** a sloped collection wall showing all 17 prizes — owned ones in full colour with a ×N badge, unowned ones as "?" silhouettes — over a tiled floor with a sunburst rug.
- Everything keeps the existing A* crowd, interactions, collision, lighting budget and mobile support. Draw calls dropped from ~1,500 to ~300 as sculpted geometry was retired.

## Voice

Everything the lobby says lives in `dialogue.js`: dry, deadpan and quietly fond of its regulars. Ace, Moxie, Juniper and Laryn each have several lines per topic (chat, tips, rumours), rotating intros and quest-complete lines. A shuffle-bag guarantees every line is used before any repeats. Ambient visitors speak in speech bubbles when they win, lose, queue, drink, browse the prize wall, dance, greet you, or strike up a paired chat. The host, bartender and chef have their own lines. Result screens add a one-line quip that reacts to rhythm grades, race placings, zero scores and personal bests, and every shop, bar and prize message is rewritten in the same voice. To add or tweak a line, edit `dialogue.js`; `tests/dialogue.test.mjs` checks that every line is unique, short enough for a bubble and fully filled in.

`dialogue-memory.js` loads after it and gives the lobby a memory. It keeps a small separate save (`neon-nexus-voice-v1`: visit count, chats per regular, story chapters heard) and reads the player's real progress, so the four regulars (Ace, Moxie, Juniper, Laryn) each react to what you have actually done: your favourite cabinet, your last result, how long you were away, whether you own the Giant Comet Bear. Each has its own register (Ace dramatic, Moxie unbothered, Juniper earnest, Laryn laconic), the bartender, chef and host react to your tokens, orders and the hour, and the regular conversation menu shows a rapport level plus a "How am I going?" verdict. The running story, **The Bear Affair**, has five chapters per regular, unlocked by sessions played (0, 3, 7, 12, 18), with a different ending if you own the bear. All dialogue is Australian, dry, and free of em dashes (a test enforces it).

**More story and daily goals.** Alongside The Bear Affair, the bartender and chef have their own running story, **The Kitchen Feud** (five chapters, told at the bar and the pass, unlocked by how many orders you have placed: 0, 2, 4, 7, 10). Each regular also has a couple of one-off moments that fire exactly once, the first time they become true (first win, owning the bear, all twenty cabinets), and the background visitors occasionally comment on your wealth, streak and the day's featured cabinet.

`daily.js` adds a daily goal. Every local day one cabinet is **featured** (all twenty take a turn before any repeats) and a second is its **double feature** partner. Playing the featured cabinet pays +30 tickets, winning on it +30 more, playing the partner +25, and playing on consecutive days adds a streak bonus (+3 per day, capped at seven days). Bonuses pay once a day, only ever as tickets, and are stored under `daily` in the player save. The header chip and the discovery card show what is still on offer.


## Cabinet depth

`arcade-depth.js` gives every cabinet two shared systems:

- **Fever.** Scoring fills a meter on the left of the screen that cools when you stop. Fill it and the cabinet goes into
  Fever for seven seconds, doubling every point. Air hockey, billiards, racing and table duels skip it, because their
  scores mean something else.
- **Stars.** Each cabinet has three named challenges, judged at the end of a round from what you actually did (a
  perfect drop, a mirror round, a corner cup). Each new star pays 15 tickets once and is saved under `arcadeStars`.
  The cabinet panel lists them.

Cabinet-specific mechanics added on top:

| Cabinet | What's new |
| --- | --- |
| Clay Stack | Perfect drops regrow the block; the swing speeds up as the tower rises. |
| Moon Moles | Golden moles add two seconds, helmet moles take two bonks, bombs cost points and your streak. Winnable at 250. |
| Bubble Blaster | Same-colour pops in a row build a chain; dark bomb bubbles clear a cluster. |
| Prism Sequence | Speeds up each round; every third round is a mirror round entered backwards for double points. Winnable at 200. |
| Mixology Master | Layered drinks with a moving target band and a dead-centre bonus. |
| Moon Gem Dig | Fair boards (eight gems, three cracks), a safe first dig and neighbour counts to deduce from. |
| Cosmic Skee-Ball | A hot ring doubles each roll, corner cups pay 150, scoring rolls build a streak. |
| Starlight Pinball | Light the N-E-X-U-S lanes to double the bumpers for the rest of the ball. |
| Lucky Claw | Heavy prizes slip unless the grab is centred; one golden prize per machine. |
| Sushi Catch | Order tickets: catch the requested fish in sequence for a bonus. |
| Comet Ring Toss | A breeze that changes every throw; the aim guide ignores it. |

## Title screen and settings

The arcade opens on a title screen with an honest load bar (it completes when the 3D world has rendered), a friendly fallback if loading stalls, and **Settings** for sound, reduced motion and graphics quality (saved on your device).

## The twenty games

Each cabinet is a self-contained module in `games/<id>.js` (see **Architecture**). All have keyboard/mouse and touch controls, three difficulty levels, mastery perks, achievements and per-cabinet saved progress. Kitchen Rush is the one existing three.js cabinet (`arcade-game3d.js`). Lucky Claw renders a three.js plush pile into the canvas.

| Cabinet | What it is |
|---|---|
| Cosmic Skee-Ball | Lane, ramp jump and a sloped board with real hole physics; moving 100-point hole on hard |
| Comet Air Hockey | Three-bot tournament (Rookie, Pro, Champion) with real puck physics and CPU personalities |
| Moonlight Billiards | Full 8-ball vs CPU: ball-in-hand, fouls, English, group rules |
| Moon Moles | Waves of mole types, boss mole, Gold Rush bonus round |
| Bubble Blaster | Ammo and reload shooting gallery with civilians, cover and a boss |
| Prism Sequence | Memory modes (classic, reverse, echo, double-tile) with growing grids |
| Beat Foundry | Four-lane rhythm with hold notes, fever mode and three unlockable songs |
| Meteor Mayhem | Inertia ship, upgrades between waves, colossus boss |
| Turbo Tunnels | Top-down drift racer, three AI rivals, three tracks, boost pads and oil |
| Clay Stack | Isometric tower builder with perfect streaks and golden floors |
| Starlight Pinball | Flippers, slings, drop targets, multiball, nudge/tilt |
| Lucky Claw | Three.js claw with swaying cable, grip strength and slip, bombs and golden stars |
| Kitchen Rush | Three.js order-assembly cabinet |
| Sushi Catch | Conveyor stations, momentum tray, recipe orders, three rounds |
| Mixology Master | Multi-step cocktails: pick, pour, shake, garnish, ratings |
| Pulse Runner | Three-level platformer with a reactor boss |
| Barrelstorm Moto | Trials-style physics bike with flips, barrels, three courses |
| Moonshard Legend | Top-down adventure with rooms, enemy types, shard puzzles and bosses |
| Comet Ring Toss | Three stages, lead the moving pegs, wind and a golden peg |
| Moon Gem Dig | Clue-number deduction dig with tools and caves |

The lobby also has video poker (three machines with a paytable and double-or-nothing) and a prize wheel with published odds (see `games/poker-logic.js`, `games/wheel-logic.js`).

## Architecture

- `arcade.js` owns the economy, saves, mastery, difficulty select, particles, touch UI and the canvas loop. The "game-module framework" block near the end of the file drives modules.
- `games/registry.js` defines `NEXUS_GAMES.register(id, def)`. `games/<id>.js` supplies `init/start/update/draw`, pointer and key handlers and an optional `touch` control layout. If no module is registered for an id the legacy code path in `arcade.js` runs.
- `games/lib.js` (`window.NXG`) holds the shared clay art toolkit (blob, slab, ball, coil, cached backdrops, grain, HUD chips/bars/banners), physics helpers and sound effects.
- `games/README.md` is the full module contract. `games/poker-*.js` and `games/wheel-*.js` are the lobby service UIs.
- The lobby (`arcade-world.js`, `lobby-*.js`) is unchanged by the cabinet work.

## Economy

Every cabinet has a difficulty tier (×1.0–×1.4) applied to payouts; beating your personal best adds a ticket bonus; Air Hockey's CPU level changes its payout (Hard ×1.25, Easy ×0.8). Payouts use a diminishing-returns score (soft cap) so runaway totals can't flood the economy. Tokens and tickets are spent at the Glow Bar and the prize exchange, and everything persists in `localStorage`.

## Performance

The 3D world pauses while a cabinet is open or the tab is hidden; dynamic point lights were cut from 60 to 14 (cabinet glow uses a small pool that follows the player); the floor is two painted planes instead of hundreds of tile meshes; mobile and the **Low** setting drop shadows, antialiasing and pixel ratio.

## Debugging and tests

- `?debug` on `arcade.html` exposes `window.__nx` (camera/player), `window.__arc` (cabinet state), `window.__crowd`, `window.NEXUS_ARCADE_API` and per-game `dbg()` helpers. None of these exist without the flag.
- `npm test` runs syntax checks on every script and the unit tests (physics, economy, poker/wheel odds and edge cases, lobby, assets).
- `node tests/qa/run.mjs [gameId ...] [--only=desktop,phone,idle,spam,lobby] [--secs=12] [--jobs=3]` is the browser QA harness (Playwright + Chromium). It plays every cabinet on desktop and a 390x844 touch phone, then checks console errors, overflow and overlap, page scroll, NaN scores, hangs, save integrity and idle/spam payouts. It maps the three.js CDN to a local copy, so it also runs offline. See `TESTING.md` for a tester guide.

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

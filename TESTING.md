# Tester guide (dev build)

Live build: the GitHub Pages site (`arcade.html`). Or run locally: `npx serve .` and open `http://localhost:3000/arcade.html`.

## What changed in this build
- All 20 cabinets were rebuilt as modules in `games/` with real mechanics, difficulty levels, mastery, achievements and unlocks. Scores still pay through the existing token/ticket/mastery system.
- New claymation art for every cabinet, a plum-and-gold cabinet frame, three.js plush pile and claw in Lucky Claw, polished Kitchen Rush.
- New video poker (3 machines) and prize wheel (published odds) in the walkable lobby.
- Touch controls and portrait layouts on phones.

## Please try
1. Every cabinet on desktop (keyboard + mouse) and on a phone (touch). Start, play a full round, die/win, then Play Again.
2. Change the LEVEL select (easy/normal/hard) and confirm the game changes and payouts scale.
3. Open and close cabinets repeatedly from the lobby; confirm the lobby is still walkable afterwards (no stuck input, no audio leaks).
4. Economy: tokens and tickets should rise sensibly, never go NaN or negative; reload and confirm progress and best scores persist.
5. Poker and wheel: bet limits, hand evaluation, odds table matches what you see, closing mid-spin does not lose or duplicate a prize.
6. Resize the window / rotate the phone mid-game.
7. Try an old save (from before this build) if you have one.

## Known issues (don't report these)
- Some phone HUD text is about 15px.
- Meteor Mayhem scores a few points with no input (auto-cannon); tiny payout.
- The daily featured cabinet pays about 30 tickets once per day (existing behaviour).
- Kitchen Rush has not been auto-tested to a natural finish; check it manually.
- Rhythm/Pulse/Moonshard sprites are less fully "clay" than the other cabinets.
- Real-device performance is unmeasured; please note device, browser and rough fps for any slowness.

## Automated checks
`npm test` (unit) and `node tests/qa/run.mjs` (browser harness). Debug hooks need `?debug` on the URL.

## Reporting
Use the GitHub issue template "Bug report" (device, browser, cabinet, steps, expected vs actual, screenshot).

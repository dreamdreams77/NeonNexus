# Game module contract
One file per cabinet: `games/<id>.js` (classic script, IIFE) calling `NEXUS_GAMES.register(id, def)`. If a module is registered, arcade.js delegates everything to it; otherwise the legacy code path in arcade.js runs. Never edit arcade.js/arcade.css/arcade.html (lead owns them) — message the lead for framework changes.

```
def = {
  meta:{title,help,controls,type},        // overrides cabinet header text
  size:[900,520], portraitSize:[540,860], // canvas logical size; portraitSize used on portrait phones. Lay out from api.W/api.H at init/draw time.
  duration:60, timed:true,                // seconds; timed:false = untimed (module calls api.finish itself)
  tier:1.2,                               // payout multiplier by skill demand (default from DIFFICULTY_TIER)
  touch:[{kind:'stick',side:'left',axis:'x'|'y'|undefined,keys:['ArrowLeft','ArrowRight','ArrowUp','ArrowDown']},
         {kind:'btn',side:'right',label:'JUMP',key:' ',big:true,cls:'alt'}], // on-screen controls (touch devices only). Buttons fire keydown/keyup with that key; stick sets api.stick{x,y}∈[-1,1] + arrow keys.
  init(api)      // called on open + after RESET: build state in api.p (also use for the attract/READY screen)
  start(api)     // START pressed: (re)build run state. api.running is true
  update(dt,api) // dt seconds (<=0.04)
  draw(ctx,api)  // draw EVERYTHING (background, world, HUD). Also called before start for READY screen.
  pointerdown/move/up(x,y,e,api)  // x,y in canvas logical coords. Mouse AND touch both arrive here (pointer events, touch-action:none).
  keydown/keyup(e,api)            // e.key; arrow/space already preventDefault'd. Keyboard-only controls must exist for desktop; touch controls via `touch`.
  stop(api)      // finish/close cleanup
  timeUp(api)    // optional; default = api.finish(false)
}
```
## api
`ctx W H canvas p(state obj, reset each open/start) mouse keys stick score time(settable) combo(settable; tracks best streak) running diff{id:'easy'|'normal'|'hard',mul .7/1/1.3} mastery(0-7) portrait touch(bool)`
`setScore(n) addScore(n,x,y,color) finish(win,{grade,combo}) popText(t,x,y,c) burst(x,y,color,n) sound(f,dur,type,vol) shake(mag,sec) rand clamp helpers{rounded,circle,clay,panel} store.get/set(key) (per-cabinet persistent extras: unlocks, tournament progress, etc.) achieve(id,name,tickets=5) hasAchievement(id) toast(msg) hud(text)` 
Economy is automatic in finish(): tokens/tickets from `score` (diminishing softcap 300 → keep scores roughly 0-600 for a good run), win bonus, combo, difficulty multiplier (easy .8 / hard 1.25), mastery XP, personal best. Do not touch localStorage directly except via api.store/achieve. `finish(win)` must be called exactly once per run.
## NXG (games/lib.js)
`ball slab glow text chip bar banner vignette bgGrad rr mix shade ease circleCollide circleSegment noise sfx(api,name) stepper clamp lerp rand mulberry` — use these for lighting, depth, glossy "claymation" look (soft shadows, bevels, highlights, grain). Keep the Neon Nexus claymation palette (cream #f8e9ca, coral #ef896d, mint #91c9a7, plum #684b62, gold #f2ce77).
Particles/popText are drawn by arcade.js on top of draw(). Use api.burst/popText/shake for juice.

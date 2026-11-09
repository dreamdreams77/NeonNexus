#!/usr/bin/env node
// Neon Nexus QA harness.  Usage:
//   node tests/qa/run.mjs [gameId ...] [--only=desktop,phone,idle,spam,lobby] [--secs=12] [--jobs=4] [--out=DIR] [--no-lobby]
// Needs Playwright+Chromium (preinstalled). three.js is fetched via `npm pack` (cached in os tmpdir) and the
// jsDelivr importmap URL is routed to it, so the 3D lobby/Kitchen Rush work even if the CDN is blocked.
import { createRequire } from 'node:module';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const { chromium, devices } = require('playwright');

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const ALL = 'skeeball airhockey billiards whack target memory rhythm meteor racer stack pinball claw chef sushi mixology pulse moto moonquest ringtoss gemdig'.split(' ');
const args = process.argv.slice(2);
const opt = k => (args.find(a => a.startsWith('--' + k + '=')) || '').split('=')[1];
const games = args.filter(a => !a.startsWith('--'));
const GAMES = games.length ? games : ALL;
const SECS = +(opt('secs') || process.env.QA_SECS || 12);
const JOBS = +(opt('jobs') || 3);
const ONLY = (opt('only') || 'desktop,phone,idle,spam,lobby').split(',');
const OUT = opt('out') || process.env.QA_OUT || '/tmp/claude-0/-home-user-NeonNexus/84deefe9-041a-566c-9540-4e68da16154e/scratchpad';
const SHOTS = path.join(OUT, 'shots');
fs.mkdirSync(SHOTS, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const rnd = (a, b) => a + Math.random() * (b - a);
const KEY = 'neon-nexus-player-v1';

// ---------- three.js local copy ----------
function ensureThree() {
  const dir = path.join(os.tmpdir(), 'nn-qa-three');
  const f = path.join(dir, 'package/build/three.module.js');
  if (fs.existsSync(f)) return f;
  try {
    fs.mkdirSync(dir, { recursive: true });
    execSync('npm pack three@0.170.0 --silent', { cwd: dir, stdio: 'pipe' });
    execSync('tar xzf three-0.170.0.tgz', { cwd: dir, stdio: 'pipe' });
    return f;
  } catch (e) { return null; }
}
const THREE = ensureThree();

// ---------- static server ----------
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.woff2': 'font/woff2' };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end('nf'); }
  res.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream', 'cache-control': 'no-store' });
  fs.createReadStream(f).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const BASE = 'http://127.0.0.1:' + server.address().port;

const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });

const VP = {
  desktop: { viewport: { width: 1280, height: 800 }, hasTouch: false },
  phone: { ...devices['iPhone 13'], viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true },
};

async function newPage(kind, url = '/arcade.html?debug', seed, world = false) {
  const ctx = await browser.newContext({ ...VP[kind], serviceWorkers: 'block' });
  await ctx.route(/fonts\.(googleapis|gstatic)\.com/, r => r.fulfill({ body: '', contentType: /css/.test(r.request().url()) ? 'text/css' : 'font/woff2' }));
  await ctx.route(/cdn\.jsdelivr\.net\/npm\/three@/, r => { const rel = new URL(r.request().url()).pathname.replace(/^\/npm\/three@[^/]+\//, ''); const f = THREE && path.join(path.dirname(path.dirname(THREE)), rel); return f && fs.existsSync(f) ? r.fulfill({ path: f, contentType: 'text/javascript', headers: { 'access-control-allow-origin': '*' } }) : r.abort(); });
  if (!world) await ctx.route(/\/arcade-world\.js/, r => r.fulfill({ body: '/* QA: 3D lobby stubbed for game tests */', contentType: 'text/javascript' }));
  if (seed) await ctx.addInitScript(([k, v]) => { if (!localStorage.getItem(k)) localStorage.setItem(k, v); }, [KEY, JSON.stringify(seed)]);
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + String(e.message || e).slice(0, 200)));
  page.on('console', m => { if (m.type() === 'error') { const t = m.text(); if (!/fonts\.g|Failed to load resource.*(403|ERR_FAILED)|net::ERR/.test(t)) errs.push('console.error: ' + t.slice(0, 200)); } });
  if (process.env.QA_DEBUG) { page.on('console', m => console.error('[console]', m.type(), m.text().slice(0, 200))); page.on('requestfailed', q => console.error('[reqfail]', q.url())); page.on('response', q => q.status() >= 400 && console.error('[http]', q.status(), q.url())); }
  try {
    await page.goto(BASE + url, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => typeof window.nexusPlayArcadeGame === 'function', null, { timeout: 20000, polling: 200 });
  } catch (e) { const dbg = await page.evaluate(() => [document.readyState, typeof window.nexusPlayArcadeGame, typeof window.NEXUS_GAMES, document.scripts.length]).catch(x => 'eval fail ' + x.message.slice(0, 60)); await ctx.close(); throw new Error(e.message.split('\n')[0] + ' | ' + JSON.stringify(dbg) + ' | page errors: ' + errs.join(' ; ').slice(0, 400)); }
  await page.evaluate(() => { document.getElementById('intro')?.remove(); });
  return { ctx, page, errs, touch: kind === 'phone', kind };
}

// ---------- input abstraction ----------
async function target(page) {
  return page.evaluate(() => {
    const c = document.querySelector('#stage'), g = document.querySelector('#game3d-stage');
    const vis = e => e && getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().width > 0;
    const e = vis(g) ? g : c, r = e.getBoundingClientRect();
    return { x: r.left, y: r.top, w: r.width, h: r.height, vw: innerWidth, vh: innerHeight };
  });
}
function makeIO(P) {
  const { page, touch } = P; let cdp = null, R = null, held = new Set();
  const io = {
    async refresh() { R = await target(page); },
    pos(fx, fy) { return [Math.max(1, Math.min(R.vw - 1, R.x + R.w * fx)), Math.max(1, Math.min(R.vh - 1, R.y + R.h * fy))]; },
    async tap(fx, fy) { const [x, y] = io.pos(fx, fy); if (touch) await page.touchscreen.tap(x, y); else await page.mouse.click(x, y); },
    async move(fx, fy) { if (touch) return; const [x, y] = io.pos(fx, fy); await page.mouse.move(x, y, { steps: 3 }); },
    async drag(a, b, ms = 300, hold = 0) {
      const n = Math.max(3, Math.round(ms / 30)); const [x1, y1] = io.pos(...a), [x2, y2] = io.pos(...b);
      if (touch) {
        cdp = cdp || await page.context().newCDPSession(page);
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: x1, y: y1 }] });
        for (let i = 1; i <= n; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x1 + (x2 - x1) * i / n, y: y1 + (y2 - y1) * i / n }] }); await sleep(ms / n); }
        if (hold) await sleep(hold);
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      } else {
        await page.mouse.move(x1, y1); await page.mouse.down();
        for (let i = 1; i <= n; i++) { await page.mouse.move(x1 + (x2 - x1) * i / n, y1 + (y2 - y1) * i / n); await sleep(ms / n); }
        if (hold) await sleep(hold);
        await page.mouse.up();
      }
    },
    async key(k, ms = 120) { if (touch) return; await page.keyboard.down(k); await sleep(ms); await page.keyboard.up(k); },
    async down(k) { if (!touch) { await page.keyboard.down(k); held.add(k); } },
    async up(k) { if (!touch && held.has(k)) { await page.keyboard.up(k); held.delete(k); } },
    async releaseAll() { for (const k of [...held]) await io.up(k); },
  };
  return io;
}
const pick = a => a[Math.floor(Math.random() * a.length)];
// one "plausible human" step per game
const PROFILES = {
  skeeball: async io => { const dx = rnd(-.12, .12); await io.drag([.5, .78], [.5 + dx, rnd(.9, .98)], 350); await io.key('Enter'); await sleep(900); },
  airhockey: async io => { for (let i = 0; i < 4; i++) { await io.move(rnd(.2, .8), rnd(.55, .95)); await io.key(pick(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']), 90); } },
  billiards: async io => { await io.drag([.5, .7], [.5 + rnd(-.25, .25), rnd(.82, .95)], 400); await sleep(1500); await io.key('Enter'); },
  whack: async io => { for (let i = 0; i < 3; i++) { await io.tap(rnd(.1, .9), rnd(.2, .9)); await sleep(150); } },
  target: async io => { for (let i = 0; i < 4; i++) { await io.tap(rnd(.1, .9), rnd(.15, .9)); await sleep(120); } },
  memory: async io => { const sq = await io.page.evaluate(() => window.__arcSeq && window.__arcSeq()); for (let i = 0; i < 3; i++) { await io.tap(pick([.3, .7]), pick([.3, .7])); await sleep(250); } await io.key('Enter'); },
  rhythm: async io => { const k = pick(['d', 'f', 'j', 'k']); await io.key(k, 60); await io.tap(pick([.2, .4, .6, .8]), .85); await sleep(120); },
  meteor: async io => { const d = pick(['ArrowLeft', 'ArrowRight']); await io.down(d); await io.drag([rnd(.2, .8), .85], [rnd(.1, .9), .85], 250); await io.up(d); },
  racer: async io => { await io.down('ArrowUp'); const d = pick(['ArrowLeft', 'ArrowRight', null]); if (d) await io.down(d); await io.drag([pick([.1, .9]), .6], [pick([.1, .9]), .6], 400, 300); if (d) await io.up(d); },
  stack: async io => { await io.tap(.5, .5); await io.key('Space', 40); await sleep(rnd(300, 800)); },
  pinball: async io => { await io.key('Space', 200); await io.key('ArrowLeft', 150); await io.key('ArrowRight', 150); await io.tap(pick([.2, .8]), .9); await sleep(200); },
  claw: async io => { await io.tap(.5, .5); await io.key('Space', 40); await sleep(rnd(900, 1600)); },
  chef: async io => { for (let i = 0; i < 3; i++) { await io.tap(rnd(.15, .85), rnd(.4, .9)); await sleep(180); } },
  sushi: async io => { const d = pick(['ArrowLeft', 'ArrowRight']); await io.down(d); await io.drag([rnd(.2, .8), .8], [rnd(.1, .9), .8], 300); await io.up(d); },
  mixology: async io => { await io.tap(.5, .5); await io.key('Space', 40); await sleep(rnd(500, 1300)); },
  pulse: async io => { await io.down('ArrowRight'); await io.key('Space', 220); await io.key('z', 60); await io.tap(.5, .5); await io.up('ArrowRight'); },
  moto: async io => { await io.down('ArrowUp'); await io.key(pick(['ArrowLeft', 'ArrowRight']), 200); await io.key('Space', 100); await io.tap(.5, .5); await io.up('ArrowUp'); },
  moonquest: async io => { await io.down(pick(['w', 'a', 's', 'd', 'ArrowUp', 'ArrowLeft'])); await io.key('Space', 80); await io.tap(rnd(.2, .8), rnd(.2, .8)); await sleep(150); await io.releaseAll(); },
  ringtoss: async io => { await io.key(pick(['ArrowLeft', 'ArrowRight']), 120); await io.tap(rnd(.3, .7), rnd(.5, .9)); await sleep(900); },
  gemdig: async io => { await io.tap(rnd(.15, .85), rnd(.2, .9)); await sleep(350); },
};
async function spamStep(io) { await io.tap(rnd(.05, .95), rnd(.05, .95)); await io.key(pick(['Space', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'z', 'd', 'f', 'j', 'k']), 10); }

// ---------- state helpers ----------
const getState = page => page.evaluate(() => { const a = window.__arc || {}; return { score: a.score, time: a.time, running: a.running, uiScore: document.querySelector('#score')?.textContent, uiTime: document.querySelector('#time')?.textContent }; });
const getSave = page => page.evaluate(k => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch { return 'CORRUPT'; } }, KEY);
function badNumbers(o, p = '') { const out = []; if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) out.push(...badNumbers(v, p + '.' + k)); else if (typeof o === 'number' && (!isFinite(o) || o < 0)) out.push(p + '=' + o); else if (o === null && /(tokens|tickets|best|xp|level|score|plays|wins)$/i.test(p)) out.push(p + '=null'); return out; }
async function clickStart(P) { await P.page.locator('#start').click({ timeout: 5000 }); }
async function layoutCheck(P, phase, issues) {
  const r = await P.page.evaluate(() => {
    const q = s => document.querySelector(s), box = e => { if (!e) return null; const r = e.getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height }; };
    const vis = e => e && getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().width > 0;
    const g = q('#game3d-stage'), c = vis(g) ? g : q('#stage'); const ov = q('#overlay');
    return { vw: innerWidth, vh: innerHeight, sw: document.documentElement.scrollWidth, ovSW: ov.scrollWidth, ovCW: ov.clientWidth, canvas: box(c), start: box(q('#start')), hint: box(q('#control-hint')), close: box(q('#close')), score: box(q('#score')), time: box(q('#time')), result: box(q('#result')), cab: box(q('.cabinet')) };
  });
  const c = r.canvas, ov = (a, b) => a && b && a.l < b.r - 1 && b.l < a.r - 1 && a.t < b.b - 1 && b.t < a.b - 1;
  if (!c || c.w < 50) issues.push(['FAIL', phase + ': canvas not visible/zero size']);
  else {
    if (c.l < -1 || c.r > r.vw + 1) issues.push(['FAIL', `${phase}: canvas horizontally off-screen (${c.l | 0}..${c.r | 0} of ${r.vw})`]);
    if (c.h > r.vh) issues.push(['WARN', `${phase}: canvas taller than viewport`]);
  }
  if (r.sw > r.vw + 1) issues.push(['FAIL', `${phase}: page horizontal overflow (scrollWidth ${r.sw} > ${r.vw})`]);
  if (r.cab && r.cab.r > r.vw + 1) issues.push(['FAIL', `${phase}: cabinet wider than viewport`]);
  if (ov(r.start, r.hint)) issues.push(['WARN', phase + ': START button overlaps control hint']);
  if (ov(r.start, c) || ov(r.hint, c)) issues.push(['FAIL', phase + ': controls overlap canvas']);
  if (ov(r.close, r.score) || ov(r.close, r.time)) issues.push(['WARN', phase + ': close button overlaps score/time']);
  if (r.start && (r.start.r > r.vw + 1 || r.start.l < -1)) issues.push(['FAIL', phase + ': START button off-screen horizontally']);
  return r;
}

// ---------- one game run ----------
async function runGame(game, kind, mode) {
  const issues = [], info = {}, tag = `${game}-${kind}-${mode}`;
  const seed = null; let P;
  try { P = await newPage(kind); } catch (e) { return { game, kind, mode, issues: [['FAIL', 'page load: ' + e.message.slice(0, 120)]], info }; }
  const { page, errs } = P; const T0 = Date.now(); const lap = n => process.env.QA_DEBUG && console.error(`[t ${tag} ${((Date.now() - T0) / 1000).toFixed(1)}s] ${n}`);
  try {
    const io = makeIO(P); io.page = page;
    await page.evaluate(g => window.nexusPlayArcadeGame(g), game);
    await sleep(400);
    const startSave = await getSave(page); const tok0 = Number(startSave?.tokens ?? 250), tix0 = Number(startSave?.tickets || 0);
    lap('opened'); await layoutCheck(P, 'pre-start', issues); lap('layout');
    await clickStart(P); await sleep(500);
    await page.evaluate(() => { const c = document.querySelector('#game3d-stage'); const s = (c && getComputedStyle(c).display !== 'none') ? c : document.querySelector('#stage'); s.scrollIntoView({ block: 'center' }); });
    await sleep(200);
    lap('started'); const st0 = await getState(page);
    if (!st0.running) issues.push(['FAIL', 'start: game not running after START']);
    const L = await layoutCheck(P, 'play', issues);
    if (kind === 'phone' && L.score && (L.score.t < 0 || L.score.b > L.vh)) issues.push(['WARN', 'play: score/time HUD off-screen when canvas centered (phone)']);
    const scroll0 = await page.evaluate(() => [scrollX, scrollY, document.getElementById('overlay').scrollTop]);
    let minTime = Infinity, maxScore = 0, nan = false, t0 = Date.now(), ended = false, shot = false, steps = 0;
    const dur = mode === 'idle' ? Math.min(SECS, 10) : mode === 'spam' ? Math.min(SECS, 12) : SECS;
    while ((Date.now() - t0) / 1000 < dur) {
      await io.refresh();
      if (mode === 'idle') await sleep(400);
      else if (mode === 'spam') { for (let i = 0; i < 8; i++) await spamStep(io); }
      else await PROFILES[game](io);
      steps++;
      const s = await getState(page);
      if (typeof s.score !== 'number' || !isFinite(s.score) || /NaN|undefined|null/.test(String(s.uiScore))) nan = true;
      if (typeof s.time === 'number') minTime = Math.min(minTime, s.time);
      if (/NaN|-\d/.test(String(s.uiTime))) issues.push(['FAIL', 'HUD time shows ' + s.uiTime]);
      maxScore = Math.max(maxScore, s.score || 0);
      if (!shot && (Date.now() - t0) / 1000 > dur / 2 && mode !== 'idle' && mode !== 'spam') { shot = true; await page.screenshot({ path: path.join(SHOTS, tag + '-play.png') }); }
      if (!s.running) { ended = true; break; }
    }
    await io.releaseAll();
    const scroll1 = await page.evaluate(() => [scrollX, scrollY, document.getElementById('overlay').scrollTop]);
    if (scroll0.join() !== scroll1.join()) issues.push(['FAIL', `page/overlay scrolled during play ${scroll0} -> ${scroll1} (touch-action?)`]);
    lap('drove'); info.driveSecs = ((Date.now() - t0) / 1000).toFixed(0);
    info.naturalEnd = ended;
    if (!ended) {
      await page.evaluate(() => { window.__arc.time = 0.3; });
      const f0 = Date.now(); let s, ticking = null;
      while (Date.now() - f0 < 10000) { s = await getState(page); if (!s.running) { ended = true; break; } if (Date.now() - f0 > 1500 && ticking === null) ticking = s.time !== 0.3; await sleep(250); }
      info.forcedEnd = true;
      if (!ended && ticking === false) { // time hook not driving this game (3D/own timer): wait for its natural end instead
        info.timerNotHooked = true; issues.push(['WARN', 'debug __arc.time hook does not drive this game; waited for natural end']);
        const n0 = Date.now(); while (Date.now() - n0 < 75000) { s = await getState(page); if (!s.running) { ended = true; break; } await sleep(500); }
        if (!ended) issues.push(['FAIL', 'HANG: no natural finish within ' + (((Date.now() - f0) / 1000) | 0) + 's after start (score ' + s.score + ')']);
      } else if (!ended) issues.push(['FAIL', 'HANG: still running 10s after time forced to 0 though time ticks (score ' + s.score + ')']);
    }
    lap('ended'); await sleep(300);
    const sEnd = await getState(page);
    if (nan || !isFinite(sEnd.score)) issues.push(['FAIL', 'score NaN/invalid']);
    { const mt = Math.min(minTime, sEnd.time); if (mt < -0.25) issues.push(['FAIL', 'time went negative (' + mt.toFixed(2) + ')']); else if (mt < -0.05) issues.push(['WARN', 'time dipped slightly negative (' + mt.toFixed(3) + ') at finish']); }
    info.score = sEnd.score;
    await page.screenshot({ path: path.join(SHOTS, tag + '-end.png') });
    const res = await page.evaluate(() => document.querySelector('#result')?.textContent || '');
    info.result = res;
    if (!ended) { /* already flagged */ }
    else if (!res.trim()) issues.push(['FAIL', 'no result text shown after finish']);
    else if (/NaN|undefined|null/.test(res)) issues.push(['FAIL', 'result text has NaN/undefined: ' + res.slice(0, 80)]);
    else if (!new RegExp('\\b' + sEnd.score + ' POINTS|' + sEnd.score).test(res) && !/WON|LOST/.test(res)) issues.push(['WARN', 'result text does not show final score ' + sEnd.score]);
    if (ended) {
      const sv = await getSave(page);
      if (!sv || sv === 'CORRUPT') issues.push(['FAIL', 'save missing/corrupt after finish']);
      else {
        const bad = badNumbers({ tokens: sv.tokens, tickets: sv.tickets, arcadeBest: sv.arcadeBest, arcadeMastery: sv.arcadeMastery, arcadeStats: sv.arcadeStats });
        if (bad.length) issues.push(['FAIL', 'save has bad numbers: ' + bad.slice(0, 4).join(', ')]);
        const dt = Number(sv.tokens) - tok0, dx = Number(sv.tickets) - tix0;
        info.tokens = dt; info.tickets = dx;
        if (dt < 0) issues.push(['FAIL', 'tokens decreased on finish (' + dt + ')']);
        if (dx < 0) issues.push(['FAIL', 'tickets decreased on finish']);
        if ((sv.arcadeBest?.[game] ?? -1) < sEnd.score) issues.push(['FAIL', `arcadeBest ${sv.arcadeBest?.[game]} < score ${sEnd.score}`]);
        if ((sv.arcadeStats?.[game]?.plays ?? 0) !== 1) issues.push(['WARN', 'arcadeStats.plays = ' + sv.arcadeStats?.[game]?.plays + ' (expected 1)']);
        const m = sv.arcadeMastery?.[game]; if (!m || !(m.xp >= 0)) issues.push(['WARN', 'arcadeMastery missing/invalid for game: ' + JSON.stringify(m)]); else info.xp = m.xp;
        // wallet UI consistency
        const ui = await page.evaluate(() => [document.getElementById('arcade-tokens')?.textContent, document.getElementById('arcade-tickets')?.textContent]);
        if (String(ui[0]).trim() !== String(sv.tokens) || String(ui[1]).trim() !== String(sv.tickets)) issues.push(['WARN', `wallet UI (${ui}) != save (${sv.tokens}/${sv.tickets}) after finish`]);
        info.save = sv;
        lap('saved-checked'); // reload preservation
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForFunction(() => typeof window.nexusPlayArcadeGame === 'function', null, { timeout: 20000, polling: 200 });
        const sv2 = await getSave(page);
        const same = x => JSON.stringify([x?.tokens, x?.tickets, x?.arcadeBest, x?.arcadeMastery, x?.arcadeStats]);
        if (same(sv) !== same(sv2)) issues.push(['FAIL', 'save changed across reload']);
        await page.evaluate(() => document.getElementById('intro')?.remove());
        await sleep(600);
        const ui2 = await page.evaluate(() => [document.getElementById('arcade-tokens')?.textContent, document.getElementById('arcade-tickets')?.textContent]);
        if (String(ui2[0]).trim() !== String(sv2.tokens)) issues.push(['WARN', `wallet UI after reload (${ui2[0]}) != saved tokens (${sv2.tokens})`]);
        lap('reloaded'); // restart works
        if (mode === 'play') {
          await page.evaluate(g => window.nexusPlayArcadeGame(g), game); await sleep(300);
          await clickStart(P); await sleep(600);
          const r1 = await getState(page);
          if (!r1.running) issues.push(['FAIL', 'restart: not running after START again']);
          else if (r1.score > 10) issues.push(['FAIL', 'restart: score not reset (' + r1.score + ')']);
          else if (!(r1.time > 0)) issues.push(['FAIL', 'restart: bad time ' + r1.time]);
          else if (/NaN|ROUND OVER|CABINET/.test(await page.evaluate(() => document.querySelector('#result').textContent))) issues.push(['WARN', 'restart: old result text still shown']);
          await io.refresh(); for (let i = 0; i < 4; i++) await PROFILES[game](io); await io.releaseAll();
          await page.locator('#close').click({ timeout: 3000 }).catch(() => issues.push(['WARN', 'close button not clickable']));
          await sleep(1200);
          const rc = await getState(page);
          if (rc.running) issues.push(['WARN', 'game keeps running after cabinet closed']);
        }
      }
    }
    // economy flags
    if (mode === 'idle') {
      if (info.score >= 10) issues.push(['FAIL', 'ECON: idle (no input) scored ' + info.score]);
      if (info.tokens > 5 || info.tickets > 6) issues.push(['WARN', `ECON: idle payout ${info.tokens} tokens / ${info.tickets} tickets (score ${info.score})`]);
      if (info.naturalEnd) issues.push(['WARN', `ECON: idle round self-ends in ~${info.driveSecs}s paying ${info.tokens}t/${info.tickets}k (participation farm)`]);
    }
    if (mode === 'spam') {
      if (info.tokens > 40 || info.tickets > 40) issues.push(['FAIL', `ECON: input spam payout ${info.tokens} tokens / ${info.tickets} tickets in ${info.driveSecs}s (score ${info.score})`]);
      else if (info.tokens > 18 || info.tickets > 20) issues.push(['WARN', `ECON: spam payout ${info.tokens}t/${info.tickets}k score ${info.score}`]);
    }
  } catch (e) {
    issues.push(['FAIL', 'harness/run exception: ' + String(e.message).split('\n')[0].slice(0, 160)]);
    try { await P.page.screenshot({ path: path.join(SHOTS, tag + '-exception.png') }); } catch {}
  }
  const uniq = [...new Set(errs)].slice(0, 5);
  for (const e of uniq) issues.push(['FAIL', e]);
  await P.ctx.close();
  return { game, kind, mode, issues, info };
}

// ---------- 3D lobby ----------
async function runLobby(kind) {
  const issues = [], info = {}; let P;
  try {
    P = await newPage(kind, '/arcade.html?debug', null, true);
    await sleep(6000);
    const r = await P.page.evaluate(() => { const w = document.getElementById('arcade-world'); const c = w?.querySelector('canvas'); const b = c?.getBoundingClientRect(); return { canvas: !!c, w: b?.width, h: b?.height, sw: document.documentElement.scrollWidth, vw: innerWidth, cards: document.querySelectorAll('.game-card').length }; });
    info.lobby = r;
    if (!r.canvas) issues.push(['FAIL', '3D lobby canvas missing' + (THREE ? '' : ' (three.js unavailable; CDN blocked, npm pack failed)')]);
    else if (r.w < 100) issues.push(['FAIL', '3D lobby canvas zero-sized']);
    if (r.sw > r.vw + 1) issues.push(['FAIL', 'lobby page horizontal overflow']);
    if (r.canvas) { // walk a bit
      if (!P.touch) { await P.page.mouse.move(400, 400); for (const k of ['w', 'a', 's', 'd', 'ArrowUp', 'e']) { await P.page.keyboard.down(k); await sleep(500); await P.page.keyboard.up(k); } }
      await sleep(500);
    }
    await P.page.screenshot({ path: path.join(SHOTS, `lobby-${kind}.png`) });
    for (const e of [...new Set(P.errs)].slice(0, 6)) issues.push(['FAIL', e]);
  } catch (e) { issues.push(['FAIL', 'lobby exception: ' + e.message.split('\n')[0].slice(0, 160)]); }
  try { await P?.ctx.close(); } catch {}
  return { game: 'LOBBY', kind, mode: 'lobby', issues, info };
}

// ---------- scheduler ----------
const jobs = [];
for (const g of GAMES) {
  if (ONLY.includes('desktop')) jobs.push(() => runGame(g, 'desktop', 'play'));
  if (ONLY.includes('phone')) jobs.push(() => runGame(g, 'phone', 'play'));
  if (ONLY.includes('idle')) jobs.push(() => runGame(g, 'desktop', 'idle'));
  if (ONLY.includes('spam')) jobs.push(() => runGame(g, 'desktop', 'spam'));
}
if (ONLY.includes('lobby') && !args.includes('--no-lobby') && !games.length) { jobs.push(() => runLobby('desktop')); jobs.push(() => runLobby('phone')); }
const results = []; let ji = 0;
await Promise.all(Array.from({ length: JOBS }, async () => { while (ji < jobs.length) { const j = jobs[ji++]; const r = await j(); results.push(r); process.stderr.write(`.${r.game}/${r.kind}/${r.mode} `); } }));
process.stderr.write('\n');
await browser.close(); server.close();

// ---------- report ----------
const sevRank = { FAIL: 2, WARN: 1 };
const verdict = r => r ? (r.issues.some(i => i[0] === 'FAIL') ? 'FAIL' : r.issues.length ? 'WARN' : 'PASS') : '-';
const find = (g, k, m) => results.find(r => r.game === g && r.kind === k && r.mode === m);
const cols = [['desktop', 'play'], ['phone', 'play'], ['desktop', 'idle'], ['desktop', 'spam']];
const pad = (s, n) => String(s).padEnd(n);
console.log('\n' + pad('GAME', 11) + pad('DESKTOP', 9) + pad('PHONE', 9) + pad('IDLE', 9) + pad('SPAM', 9) + 'score(d/p)  +tok/+tix(d)  notes');
for (const g of GAMES) {
  const rs = cols.map(([k, m]) => find(g, k, m));
  const d = rs[0], p = rs[1];
  const n = rs.filter(Boolean).reduce((a, r) => a + r.issues.filter(i => i[0] === 'FAIL').length, 0);
  console.log(pad(g, 11) + rs.map(r => pad(verdict(r), 9)).join('') + pad(`${d?.info.score ?? '-'}/${p?.info.score ?? '-'}`, 12) + pad(`${d?.info.tokens ?? '-'}/${d?.info.tickets ?? '-'}`, 15) + (n ? n + ' fail(s)' : ''));
}
for (const r of results.filter(r => r.game === 'LOBBY')) console.log(pad('LOBBY', 11) + r.kind + ': ' + verdict(r) + (THREE ? '' : ' (three unavailable)'));
console.log('\nISSUES');
for (const g of [...GAMES, 'LOBBY']) for (const [k, m] of [...cols, ['desktop', 'lobby'], ['phone', 'lobby']]) {
  const r = find(g, k, m); if (!r) continue;
  for (const [sev, msg] of r.issues.sort((a, b) => sevRank[b[0]] - sevRank[a[0]])) console.log(`${sev} ${g} [${k}/${m}] ${msg}`);
}
fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify(results.map(r => ({ ...r, info: { ...r.info, save: undefined } })), null, 1));
console.log('\nscreenshots: ' + SHOTS + '  raw: ' + path.join(OUT, 'results.json'));
process.exit(results.some(r => verdict(r) === 'FAIL') ? 1 : 0);

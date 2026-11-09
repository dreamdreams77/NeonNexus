/* Neon Nexus lucky wheel UI: canvas clay wheel, odds table, loyalty meter. Mounted via NXWheelUI.mount(). */
(function () {
  'use strict';
  const W = window.NXWheel; if (!W) return;
  const TAU = Math.PI * 2, LAYOUT = W.sliceLayout(), N = LAYOUT.length, SA = TAU / N;
  const INK = '#392c36', GOLD = '#f4c987', GOLD2 = '#d9a441', PLUM = '#342538', PLUM2 = '#4b3550';
  let st = null, listenerOn = false;
  const h = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const fmt = n => Number(n).toLocaleString('en-US');
  const pct = p => (p * 100).toFixed(p * 100 % 1 === 0 ? 0 : 1) + '%';
  const reduced = () => { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } };
  const mod = (a, m) => ((a % m) + m) % m;

  function load() { const p = st.ctx.readPlayer(); return W.normalizeStats(p.wheelStats); }
  function persist(mut) { const p = st.ctx.readPlayer(); const r = mut(p, W.normalizeStats(p.wheelStats)); p.wheelStats = r.stats; st.ctx.writePlayer(p); return r; }
  const balance = () => Number(st.ctx.readPlayer().tokens ?? 250);

  // ---------------- canvas drawing ----------------
  function wedge(ctx, cx, cy, r, a0, a1) { ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r, a0, a1); ctx.closePath(); }
  function draw(theta, time) {
    const cv = st.cv, ctx = cv.getContext('2d'), S = st.size, dpr = st.dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, S, S);
    const cx = S / 2, cy = S / 2 + 6, R = S / 2 - 10, r = R - S * 0.065;
    // drop shadow
    ctx.save(); ctx.fillStyle = 'rgba(30,18,36,.35)'; ctx.beginPath(); ctx.ellipse(cx, cy + R * 0.96, R * 0.8, R * 0.09, 0, 0, TAU); ctx.fill(); ctx.restore();
    // gold rim
    let g = ctx.createLinearGradient(cx - R, cy - R, cx + R, cy + R); g.addColorStop(0, '#ffe6a8'); g.addColorStop(.5, GOLD2); g.addColorStop(1, '#a8741f');
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, r + 3, 0, TAU); ctx.fillStyle = PLUM; ctx.fill();
    // slices
    ctx.save(); ctx.lineJoin = 'round';
    for (let i = 0; i < N; i++) {
      const seg = W.byKey[LAYOUT[i]], a0 = theta + i * SA - Math.PI / 2, a1 = a0 + SA;
      wedge(ctx, cx, cy, r, a0, a1); ctx.fillStyle = seg.color; ctx.fill();
      const rg = ctx.createRadialGradient(cx - r * .25, cy - r * .35, r * .1, cx, cy, r); rg.addColorStop(0, 'rgba(255,255,255,.22)'); rg.addColorStop(.6, 'rgba(255,255,255,0)'); rg.addColorStop(1, 'rgba(40,20,40,.22)');
      wedge(ctx, cx, cy, r, a0, a1); ctx.fillStyle = rg; ctx.fill();
      wedge(ctx, cx, cy, r, a0, a1); ctx.lineWidth = 2.5; ctx.strokeStyle = INK; ctx.stroke();
      // label
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(a0 + SA / 2); ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.fillStyle = seg.ink;
      const big = seg.key === 'jackpot';
      ctx.font = '700 ' + Math.round(S * (big ? 0.058 : seg.short.length > 4 ? 0.047 : 0.056)) + 'px Fredoka, "Trebuchet MS", sans-serif';
      ctx.fillText(seg.kind === 'bust' ? '✕' : seg.short, r - S * 0.035, 0); ctx.restore();
    }
    ctx.restore();
    // inner ring + hub
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
    const hr = S * 0.095; g = ctx.createRadialGradient(cx - hr * .3, cy - hr * .4, 2, cx, cy, hr); g.addColorStop(0, '#ffe6a8'); g.addColorStop(1, GOLD2);
    ctx.beginPath(); ctx.arc(cx, cy, hr, 0, TAU); ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, hr * .62, 0, TAU); ctx.fillStyle = PLUM; ctx.fill();
    ctx.fillStyle = GOLD; ctx.font = '700 ' + Math.round(hr * .8) + 'px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('✦', cx, cy + 1);
    // bulbs on the rim, chasing while spinning
    const lit = st.spinning ? Math.floor(time / 90) : Math.floor(time / 500);
    for (let i = 0; i < N; i++) {
      const a = theta * 0 + i * SA - Math.PI / 2, bx = cx + Math.cos(a) * (R - S * 0.03), by = cy + Math.sin(a) * (R - S * 0.03);
      const on = st.spinning ? (i + lit) % 3 === 0 : (i + lit) % 2 === 0;
      ctx.beginPath(); ctx.arc(bx, by, S * 0.0145, 0, TAU); ctx.fillStyle = on ? '#fffbe6' : '#b9843a'; ctx.fill(); ctx.lineWidth = 1.2; ctx.strokeStyle = INK; ctx.stroke();
      if (on) { ctx.beginPath(); ctx.arc(bx, by, S * 0.03, 0, TAU); ctx.fillStyle = 'rgba(255,240,170,.28)'; ctx.fill(); }
    }
    // pointer
    ctx.save(); ctx.translate(cx, cy - R + S * 0.015); ctx.rotate(st.pointer);
    ctx.beginPath(); ctx.moveTo(-S * 0.05, -S * 0.025); ctx.lineTo(S * 0.05, -S * 0.025); ctx.lineTo(0, S * 0.1); ctx.closePath();
    ctx.fillStyle = '#e98b7b'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.lineJoin = 'round'; ctx.stroke();
    ctx.beginPath(); ctx.arc(0, -S * 0.005, S * 0.018, 0, TAU); ctx.fillStyle = GOLD; ctx.fill(); ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
  }

  function fit() {
    const w = Math.max(220, Math.min(320, Math.floor(st.stage.clientWidth || 300))); st.size = w; st.dpr = Math.min(2, window.devicePixelRatio || 1);
    st.cv.width = Math.round(w * st.dpr); st.cv.height = Math.round(w * st.dpr); st.cv.style.width = w + 'px'; st.cv.style.height = w + 'px'; draw(st.theta, performance.now());
  }

  // ---------------- animation ----------------
  const easeOut = t => 1 - Math.pow(1 - t, 4), easeIO = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  function plan(key) {
    const idxs = LAYOUT.map((k, i) => k === key ? i : -1).filter(i => i >= 0), idx = idxs[Math.floor(W.randomFloat() * idxs.length)];
    const lowNeighbor = W.byKey[LAYOUT[(idx - 1 + N) % N]], hot = ['jackpot', 't250', 't100', 'free', 't50'].includes(lowNeighbor.key) && key !== lowNeighbor.key && W.byKey[key].kind === 'bust' || (lowNeighbor.key === 'jackpot' && key !== 'jackpot');
    const jitter = hot ? -0.36 * SA : (W.randomFloat() - .5) * 0.5 * SA;     // where in the slice we stop
    const local = (idx + .5) * SA + jitter;                                    // local angle that ends under the pointer
    const turns = 5 + Math.floor(W.randomFloat() * 2), base = st.theta;
    const final = base + mod(-local - base, TAU) + turns * TAU;
    const over = hot ? 0.36 * SA + 0.28 * SA : 0.1 * SA;                       // crossing into the neighbour = near miss
    return { base, final, over, hot };
  }
  function tick(vol) { st.ctx.sound(760 + Math.random() * 90, .03, 'square', vol); }
  function animate(pl, done) {
    const fast = reduced(), T1 = fast ? 700 : 4900, HOLD = fast ? 80 : (pl.hot ? 900 : 380), T2 = fast ? 120 : 800, total = T1 + HOLD + T2;
    let start = performance.now(), lastPeg = Math.floor((pl.base) / SA), lastTick = 0, last = start; st.spinning = true; st.skip = false; st.stage.classList.add('spinning');
    const frame = (now) => {
      if (!st) return;
      if (st.skip) { start = now - total; st.skip = false; }
      const e = now - start; let theta;
      if (e < T1) theta = pl.base + (pl.final + pl.over - pl.base) * easeOut(e / T1);
      else if (e < T1 + HOLD) theta = pl.final + pl.over;
      else theta = pl.final + pl.over * (1 - easeIO(Math.min(1, (e - T1 - HOLD) / T2)));
      const peg = Math.floor(theta / SA), dt = Math.min(.05, (now - last) / 1000); last = now;
      if (peg !== lastPeg) { const crossed = Math.abs(peg - lastPeg); lastPeg = peg; if (now - lastTick > 38 || e > T1 - 900) { tick(Math.min(.03, .012 + (e / T1) * .02)); lastTick = now; } st.pointer = Math.max(-.7, Math.min(.7, st.pointer - .45 * Math.min(2, crossed))); st.vp = 0; }
      // spring pointer back to rest
      st.vp += (-st.pointer * 260 - st.vp * 12) * dt; st.pointer += st.vp * dt;
      st.theta = theta; draw(theta, now);
      if (e < total) st.raf = requestAnimationFrame(frame); else { st.theta = mod(pl.final, TAU); st.spinning = false; st.stage.classList.remove('spinning'); st.pointer = 0; st.vp = 0; draw(st.theta, now); done(false); }
    };
    st.raf = requestAnimationFrame(frame);
  }
  function idleLoop() { const f = (now) => { if (!st) return; if (!st.spinning) { st.vp += (-st.pointer * 260 - st.vp * 12) * .016; st.pointer += st.vp * .016; draw(st.theta, now); } st.idle = requestAnimationFrame(f); }; st.idle = requestAnimationFrame(f); }

  // ---------------- game flow ----------------
  function spin() {
    if (!st || st.spinning || st.busy) return;
    const stats = load();
    if (stats.pending) { resolve(true); return; }
    const free = stats.freeSpins > 0;
    if (!free && balance() < W.COST) { st.ctx.status(st.ctx.needTokens()); flash('Need ' + W.COST + ' tokens to spin.', 'bad'); return; }
    const seg = W.spin(), now = Date.now(); let ok = false;
    persist((p, s) => { const b = W.begin(s, Number(p.tokens ?? 250), seg.key, now); if (b.ok) { p.tokens = Number(p.tokens ?? 250) - b.cost; ok = true; } return { stats: b.stats }; });
    if (!ok) return;
    st.ctx.status(''); st.result.hidden = true; st.result.className = 'wh-result'; st.ctx.sound(330, .12, 'triangle', .03); setTimeout(() => st && st.ctx.sound(494, .12, 'triangle', .03), 90);
    animate(plan(seg.key), (aborted) => { resolve(!!aborted); }); refresh();
  }
  function resolve(recovered) {
    let out = null; const now = Date.now();
    persist((p, s) => {
      const r = W.settle(s, now); out = r; if (r.seg) {
        p.tokens = Number(p.tokens ?? 250) + r.tokens; p.tickets = (Number(p.tickets) || 0) + r.tickets;
        const hist = Array.isArray(p.wheelHistory) ? p.wheelHistory : []; hist.unshift({ tickets: r.tickets, tokens: r.tokens, key: r.seg.key, at: now }); p.wheelHistory = hist.slice(0, 30);
      }
      return { stats: r.stats };
    });
    if (!out || !out.seg) return refresh();
    const seg = out.seg; let title, cls;
    if (seg.kind === 'bust') { title = 'BUST'; cls = 'bust'; st.ctx.sound(180, .35, 'sawtooth', .03); }
    else if (seg.key === 'jackpot') { title = 'JACKPOT! +1,000 ✦'; cls = 'jackpot'; }
    else if (seg.kind === 'free') { title = 'FREE SPIN!'; cls = 'win'; }
    else { title = '+' + fmt(seg.kind === 'tokens' ? seg.amount : seg.amount) + (seg.kind === 'tokens' ? ' TOKENS' : ' TICKETS'); cls = 'win'; }
    let text = title; if (out.loyaltyBonus) text += '  ·  LOYALTY +' + out.loyaltyBonus + ' TICKETS';
    flash(text, cls); st.ctx.status((recovered ? 'Recovered your last spin: ' : '') + text.replace(/\s+·\s+/g, '. ') + '  Balance: ' + fmt(balance()) + ' tokens.');
    if (seg.kind !== 'bust') { celebrate(seg.key === 'jackpot' ? 60 : seg.weight < 20 ? 34 : 16); [523, 659, 784, seg.key === 'jackpot' ? 1568 : 1046].forEach((f, n) => setTimeout(() => st && st.ctx.sound(f, .16, 'triangle', .035), n * 100)); st.ctx.celebrate(); }
    if (out.loyaltyBonus) setTimeout(() => st && [880, 1175].forEach((f, n) => setTimeout(() => st && st.ctx.sound(f, .14, 'sine', .03), n * 120)), 500);
    refresh();
  }
  function flash(text, cls) { st.result.textContent = text; st.result.className = 'wh-result ' + (cls || ''); st.result.hidden = false; }
  function celebrate(n) {
    const box = st.burst; box.innerHTML = ''; const cols = ['#f4c987', '#e98b7b', '#8fd1b5', '#f7e6c8', '#b98ad6'];
    for (let i = 0; i < n; i++) { const s = h('i'); const a = Math.random() * TAU, d = 60 + Math.random() * 140; s.style.setProperty('--dx', Math.cos(a) * d + 'px'); s.style.setProperty('--dy', (Math.sin(a) * d - 40) + 'px'); s.style.background = cols[i % cols.length]; s.style.animationDelay = Math.random() * 150 + 'ms'; box.append(s); }
    setTimeout(() => { if (box) box.innerHTML = ''; }, 1600);
  }

  // ---------------- DOM refresh ----------------
  function refresh() {
    const s = load(), free = s.freeSpins > 0, bal = balance();
    st.bal.textContent = fmt(bal);
    const b = st.spinBtn; b.disabled = st.spinning; b.classList.toggle('free', free);
    b.querySelector('b').textContent = st.spinning ? 'SPINNING…' : (free ? 'FREE SPIN ×' + s.freeSpins : 'SPIN THE WHEEL');
    b.querySelector('small').textContent = free ? 'no cost' : (bal < W.COST ? 'need ' + W.COST + ' ✦ tokens' : W.COST + ' ✦ tokens');
    st.pips.forEach((p, i) => p.classList.toggle('on', i < s.loyalty));
    st.pityTxt.textContent = (W.LOYALTY_EVERY - s.loyalty === 1 ? 'Next spin' : (W.LOYALTY_EVERY - s.loyalty) + ' spins') + ' until a guaranteed +' + W.LOYALTY_TICKETS + ' ticket bonus';
    st.stats.textContent = 'SPINS ' + s.spins + '  ·  BEST HIT ' + fmt(s.biggest) + '  ·  TICKETS WON ' + fmt(s.ticketsWon);
    st.hist.innerHTML = '';
    if (!s.history.length) st.hist.append(h('span', 'wh-hempty', 'No spins yet.'));
    s.history.slice(0, 10).forEach(x => { const seg = W.byKey[x.key], c = h('span', 'wh-chip', seg.kind === 'bust' ? '✕' : seg.kind === 'free' ? 'FREE' : (x.tokens ? '+' + x.tokens : '+' + (x.tickets - (x.bonus || 0)) + '✦')); c.style.background = seg.color; c.style.color = seg.ink; c.title = seg.label + (x.bonus ? ' + loyalty bonus' : ''); st.hist.append(c); });
  }

  function mount(container, ctx) {
    unmount(); st = { ctx, theta: Math.random() * TAU, pointer: 0, vp: 0, spinning: false, busy: false, size: 300, dpr: 1 };
    const root = h('div', 'wh-root'); st.root = root; container.append(root);
    const stage = h('div', 'wh-stage'); st.stage = stage;
    const top = h('div', 'wh-top'); top.append(h('b', '', 'LUCKY WHEEL'), (() => { const x = h('span', 'wh-bal'); x.append('BALANCE ', st.bal = h('b', '', '0'), ' ✦'); return x; })()); stage.append(top);
    const wrap = h('div', 'wh-canvas-wrap'); st.cv = h('canvas', 'wh-canvas'); st.cv.setAttribute('role', 'img'); st.cv.setAttribute('aria-label', 'Lucky wheel. Tap to skip the spin animation.');
    st.cv.addEventListener('click', () => { if (st.spinning) st.skip = true; }); st.burst = h('div', 'wh-burst'); st.result = h('div', 'wh-result'); st.result.hidden = true; st.result.setAttribute('aria-live', 'polite');
    wrap.append(st.cv, st.burst, st.result); stage.append(wrap);
    st.spinBtn = h('button', 'wh-spin'); st.spinBtn.type = 'button'; st.spinBtn.innerHTML = '<b></b><small></small>'; st.spinBtn.addEventListener('click', spin); stage.append(st.spinBtn);
    const pity = h('div', 'wh-pity'); const pips = h('div', 'wh-pips'); st.pips = []; for (let i = 0; i < W.LOYALTY_EVERY; i++) { const p = h('i'); pips.append(p); st.pips.push(p); } st.pityTxt = h('small'); pity.append(h('span', 'wh-pity-h', 'LOYALTY METER'), pips, st.pityTxt); stage.append(pity);
    const side = h('div', 'wh-side'); side.append(h('div', 'wh-h', 'PUBLISHED ODDS · ' + W.COST + ' ✦ PER SPIN'));
    const tbl = h('div', 'wh-odds');
    [...W.SEGMENTS].sort((a, b) => (b.weight - a.weight)).forEach(seg => {
      const r = h('div', 'wh-orow'); const sw = h('i', 'wh-sw'); sw.style.background = seg.color; r.append(sw, h('span', 'wh-on', seg.label), h('span', 'wh-op', pct(W.probability(seg)))); tbl.append(r);
    });
    side.append(tbl);
    const ev = h('div', 'wh-ev'); const e0 = W.expectedValue(false), e1 = W.expectedValue(true);
    ev.append(h('b', '', 'EXPECTED RETURN ' + (W.returnRate(false) * 100).toFixed(1) + '% (' + (W.returnRate(true) * 100).toFixed(1) + '% with loyalty bonus)'), h('small', '', 'About ' + e0.toFixed(1) + ' tokens of value back per ' + W.COST + '-token spin (tickets counted 1:1, free spin = one more spin). The wheel always costs you on average. Slice sizes are decorative; the table is exact.'));
    side.append(ev, h('div', 'wh-h', 'RECENT SPINS'), st.hist = h('div', 'wh-hist'), st.stats = h('div', 'wh-stats'));
    root.append(stage, side, h('div', 'wh-foot', 'Practice tokens only · fair random draw · Space/Enter to spin · tap the wheel to skip the animation'));
    fit(); window.addEventListener('resize', onResize); if (!listenerOn) { document.addEventListener('keydown', onKey); listenerOn = true; }
    idleLoop();
    const s0 = load(); if (s0.pending) { refresh(); resolve(true); } else refresh();
    st.ctx.status('Spin costs ' + W.COST + ' tokens. Odds are listed on the right.');
  }
  function onResize() { if (st && st.root.isConnected) fit(); }
  function onKey(e) { if (!st || !st.root.isConnected || st.ctx.isClosed() || e.ctrlKey || e.metaKey || e.altKey) return; if ((e.key === 'Enter' || e.key === ' ') && !(e.target && e.target.tagName === 'BUTTON')) { e.preventDefault(); if (st.spinning) st.skip = true; else spin(); } }
  function unmount() { if (st) { cancelAnimationFrame(st.raf); cancelAnimationFrame(st.idle); window.removeEventListener('resize', onResize); const wasSpinning = st.spinning, root = st.root; root.remove(); const pend = wasSpinning; st = null; if (pend) { try { settleDetached(); } catch (e) { /* ignore */ } } } }
  // If the panel closes mid-spin, settle the pending prize straight away so nothing is lost.
  function settleDetached() {
    const ctx = window.__nxWheelCtx; if (!ctx) return; const p = ctx.readPlayer(), s = W.normalizeStats(p.wheelStats), r = W.settle(s, Date.now());
    if (r.seg) { p.tokens = Number(p.tokens ?? 250) + r.tokens; p.tickets = (Number(p.tickets) || 0) + r.tickets; const hist = Array.isArray(p.wheelHistory) ? p.wheelHistory : []; hist.unshift({ tickets: r.tickets, tokens: r.tokens, key: r.seg.key, at: Date.now() }); p.wheelHistory = hist.slice(0, 30); }
    p.wheelStats = r.stats; ctx.writePlayer(p);
  }
  const origMount = mount;
  window.NXWheelUI = { mount: (c, ctx) => { window.__nxWheelCtx = ctx; origMount(c, ctx); }, unmount };
})();

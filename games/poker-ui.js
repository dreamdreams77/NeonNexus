/* Neon Nexus video poker UI. Mounted into the arcade service panel by arcade.js via NXPokerUI.mount(). */
(function () {
  'use strict';
  const P = window.NXPoker; if (!P) return;
  const session = { hands: 0, biggest: 0, net: 0 }; // lives until page reload
  let st = null, listenerOn = false;

  const h = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const reduced = () => { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } };
  const fmt = n => Number(n).toLocaleString('en-US');

  function later(fn, ms) { const id = setTimeout(() => { st && st.timers.delete(id); fn(); }, reduced() ? Math.min(ms, 30) : ms); st.timers.add(id); }
  function clearTimers() { if (st) { st.timers.forEach(clearTimeout); st.timers.clear(); } }

  function balance() { return Number(st.ctx.readPlayer().tokens ?? 250); }
  function credit(delta) {
    const p = st.ctx.readPlayer(); const before = Number(p.tokens ?? 250); const next = Math.max(0, before + delta);
    p.tokens = next; session.net += next - before; st.ctx.writePlayer(p); return next - before;
  }
  function saveStats(win, key) {
    const p = st.ctx.readPlayer(); const s = (p.pokerStats && typeof p.pokerStats === 'object') ? p.pokerStats : {};
    s.hands = (Number(s.hands) || 0) + (win === null ? 1 : 0); if (win > (Number(s.biggest) || 0)) { s.biggest = win; s.biggestHand = key || s.biggestHand; }
    s.coins = st.coins; p.pokerStats = s; st.ctx.writePlayer(p);
  }
  const say = (t, cls) => { st.msg.textContent = t; st.msg.className = 'pk-msg' + (cls ? ' ' + cls : ''); };

  function cardFront(c) {
    const red = c.s === 1 || c.s === 2;
    const f = h('div', 'pk-face pk-front' + (red ? ' red' : ''));
    f.append(h('span', 'pk-r1', c.rank), h('span', 'pk-s1', c.suit), h('strong', 'pk-big', c.suit));
    return f;
  }
  function setCard(i, c) { const flip = st.cards[i].querySelector('.pk-flip'); flip.querySelector('.pk-front')?.remove(); flip.append(cardFront(c)); }

  function updateAll() {
    const bal = balance(), coins = st.coins, bet = coins * P.TOKENS_PER_COIN;
    st.bal.textContent = fmt(bal);
    st.betVal.textContent = coins + (coins === 1 ? ' COIN' : ' COINS') + ' · ' + bet + ' ✦';
    st.paytable.querySelectorAll('[data-c]').forEach(e => e.classList.toggle('on', Number(e.dataset.c) === coins));
    st.paytable.querySelectorAll('.pk-row').forEach(r => r.classList.toggle('hit', r.dataset.k === st.hitKey));
    const idle = st.phase === 'idle' || st.phase === 'result';
    st.minus.disabled = st.plus.disabled = st.max.disabled = !idle || st.busy;
    st.cards.forEach((el, i) => {
      el.disabled = st.phase !== 'hold' || st.busy; el.classList.toggle('held', st.phase === 'hold' && !!st.holds[i]);
      el.setAttribute('aria-pressed', String(!!st.holds[i]));
      el.setAttribute('aria-label', st.hand[i] ? st.hand[i].rank + ' of ' + ['spades', 'hearts', 'diamonds', 'clubs'][st.hand[i].s] + (st.holds[i] ? ', held' : '') : 'card ' + (i + 1));
    });
    const limit = session.net <= -P.SESSION_LOSS_LIMIT;
    const main = st.main; main.disabled = st.busy || st.phase === 'gamble' || (idle && (limit || bal < P.TOKENS_PER_COIN));
    main.querySelector('b').textContent = st.phase === 'hold' ? 'DRAW' : (st.phase === 'result' ? 'DEAL AGAIN' : 'DEAL');
    main.querySelector('small').textContent = st.phase === 'hold' ? 'swap the unheld cards' : (limit ? 'machine resting' : 'bet ' + bet + ' ✦');
    const canG = st.phase === 'result' && st.win > 0 && P.canGamble(st.win, st.step) && !st.busy;
    st.dbl.hidden = !canG; st.dbl.querySelector('small').textContent = 'win ' + st.win + ' → ' + st.win * 2;
    st.gamble.hidden = st.phase !== 'gamble';
    st.stats.textContent = 'HANDS ' + session.hands + '  ·  BIGGEST WIN ' + fmt(session.biggest) + ' ✦  ·  SESSION ' + (session.net >= 0 ? '+' : '') + fmt(session.net) + ' ✦';
    st.root.dataset.phase = st.phase;
  }

  function flipUp(i, delay) { later(() => { st.cards[i].querySelector('.pk-flip').classList.add('up'); st.ctx.sound(520 + i * 60, .07, 'triangle', .03); }, delay); }
  function flipDown(i, delay) { later(() => { st.cards[i].querySelector('.pk-flip').classList.remove('up'); st.ctx.sound(300, .05, 'triangle', .02); }, delay); }

  function deal() {
    if (st.busy || !(st.phase === 'idle' || st.phase === 'result')) return;
    if (session.net <= -P.SESSION_LOSS_LIMIT) { say('This machine is resting after a rough session. Try another cabinet.', 'bad'); st.ctx.status('Session loss limit reached (' + P.SESSION_LOSS_LIMIT + ' tokens). Come back later.'); return updateAll(); }
    const bal = balance(), coins = P.affordableCoins(bal, st.coins);
    if (coins < 1) { say('You need ' + P.TOKENS_PER_COIN + ' tokens for one coin.', 'bad'); st.ctx.status(st.ctx.needTokens()); return updateAll(); }
    st.coins = coins; credit(-coins * P.TOKENS_PER_COIN); session.hands++; saveStats(null);
    const wasResult = st.phase === 'result'; st.busy = true; st.win = 0; st.step = 0; st.hitKey = ''; st.holds = [false, false, false, false, false];
    st.deck = P.shuffle(P.makeDeck()); st.hand = st.deck.splice(0, 5); st.phase = 'dealing';
    st.cards.forEach((el, i) => { el.classList.remove('win'); if (wasResult) flipDown(i, i * 30); });
    say('Dealing…'); st.ctx.status(''); updateAll();
    later(() => { st.hand.forEach((c, i) => { setCard(i, c); flipUp(i, i * 120); }); }, wasResult ? 260 : 40);
    later(() => {
      st.busy = false; st.phase = 'hold'; const k = P.evaluate(st.hand, st.v); st.hitKey = k === 'none' ? '' : k;
      say(k === 'none' ? 'Tap cards (or keys 1-5) to HOLD, then DRAW.' : P.HAND_NAMES[k] + ' already! Hold and draw.', k === 'none' ? '' : 'good'); updateAll(); st.main.focus({ preventScroll: true });
    }, (wasResult ? 260 : 40) + 5 * 120 + 160);
  }
  function toggleHold(i) { if (st.phase !== 'hold' || st.busy) return; st.holds[i] = !st.holds[i]; st.ctx.sound(st.holds[i] ? 660 : 440, .05, 'square', .02); updateAll(); }
  function draw() {
    if (st.busy || st.phase !== 'hold') return;
    st.busy = true; st.phase = 'drawing'; const swap = []; const res = P.drawCards(st.hand, st.holds, st.deck); st.deck = res.deck;
    const k0 = P.evaluate(res.hand, st.v), w0 = P.payout(st.v, k0, st.coins); // settle now so closing the panel never loses a win
    if (w0 > 0) { credit(w0); session.biggest = Math.max(session.biggest, w0); saveStats(w0, k0); }
    st.hand.forEach((c, i) => { if (!st.holds[i]) swap.push(i); }); say('Drawing…'); updateAll();
    swap.forEach((i, n) => flipDown(i, n * 70));
    const t0 = swap.length * 70 + 220;
    later(() => { swap.forEach(i => setCard(i, res.hand[i])); st.hand = res.hand; }, t0);
    swap.forEach((i, n) => flipUp(i, t0 + 40 + n * 130));
    later(() => finish(), t0 + 80 + swap.length * 130 + 200);
  }
  function finish() {
    const k = P.evaluate(st.hand, st.v), coins = st.coins, win = P.payout(st.v, k, coins); st.busy = false; st.phase = 'result'; st.hitKey = k === 'none' ? '' : k; st.win = win; st.step = 0;
    if (win > 0) {
      st.cards.forEach(el => el.classList.add('win'));
      say(P.HAND_NAMES[k].toUpperCase() + '!  +' + fmt(win) + ' ✦', 'win'); winBurst(k === 'royal' || k === 'straightFlush' || k === 'quadAces' || k === 'quads' ? 26 : 12);
      [523, 659, 784, 1046].forEach((f, n) => later(() => st.ctx.sound(f, .14, 'triangle', .035), n * 90)); st.ctx.celebrate();
      st.ctx.status(P.HAND_NAMES[k] + '! You won ' + fmt(win) + ' tokens. Balance: ' + fmt(balance()) + '.');
    } else { say('No win. Tap DEAL AGAIN to try another hand.', ''); st.ctx.sound(196, .22, 'sine', .03); st.ctx.status('No winning hand. Balance: ' + fmt(balance()) + ' tokens.'); }
    updateAll();
  }
  function winBurst(n) {
    const box = st.burst; box.innerHTML = '';
    for (let i = 0; i < n; i++) { const s = h('i'); const a = Math.random() * Math.PI * 2, d = 50 + Math.random() * 120; s.style.setProperty('--dx', Math.cos(a) * d + 'px'); s.style.setProperty('--dy', (Math.sin(a) * d - 30) + 'px'); s.style.animationDelay = Math.random() * 120 + 'ms'; box.append(s); }
    later(() => { box.innerHTML = ''; }, 1400);
  }

  // ---- Double or nothing ----
  function startGamble() {
    if (st.phase !== 'result' || !P.canGamble(st.win, st.step) || st.busy) return;
    st.phase = 'gamble'; st.round = P.gambleDeal(); st.picking = true; renderGamble(false, -1); updateAll();
    say('Double or nothing! Pick a card higher than the dealer’s.', ''); st.ctx.sound(392, .1, 'square', .025);
  }
  function renderGamble(reveal, pickedIdx) {
    const g = st.gamble; g.innerHTML = '';
    const top = h('div', 'pk-g-top'); top.append(h('span', 'pk-g-label', 'DEALER'));
    const d = h('div', 'pk-g-card up'); d.append(cardFront(st.round.dealer)); top.append(d);
    const info = h('div', 'pk-g-info'); info.append(h('b', '', 'STAKE ' + fmt(st.win) + ' ✦'), h('small', '', 'Win → ' + fmt(st.win * 2) + ' · tie pushes · step ' + (st.step + 1) + '/' + P.GAMBLE_MAX_STEPS)); top.append(info); g.append(top);
    const row = h('div', 'pk-g-row');
    st.round.choices.forEach((c, i) => {
      const b = h('button', 'pk-g-card' + (reveal ? ' up' : '') + (i === pickedIdx ? ' picked' : ''));
      b.type = 'button'; b.setAttribute('aria-label', 'Pick card ' + (i + 1)); b.disabled = reveal;
      const back = h('div', 'pk-gback'); back.append(h('span', '', String(i + 1))); b.append(back); if (reveal) b.append(cardFront(c));
      b.addEventListener('click', () => pickGamble(i)); row.append(b);
    });
    g.append(row);
    const bar = h('div', 'pk-g-bar'); const col = h('button', 'pk-btn pk-collect'); col.type = 'button'; col.innerHTML = '<b>COLLECT</b><small>keep ' + fmt(st.win) + ' ✦</small>'; col.disabled = reveal; col.addEventListener('click', collect); bar.append(col); g.append(bar);
  }
  function pickGamble(i) {
    if (st.phase !== 'gamble' || !st.picking) return; st.picking = false;
    const out = P.gambleOutcome(st.round.dealer, st.round.choices[i]); renderGamble(true, i); st.ctx.sound(440, .08, 'triangle', .03);
    later(() => {
      if (out === 'win') {
        credit(st.win); st.win *= 2; st.step++; session.biggest = Math.max(session.biggest, st.win); saveStats(st.win, st.hitKey); say('DOUBLED!  Now ' + fmt(st.win) + ' ✦', 'win'); winBurst(18); st.ctx.celebrate();
        [659, 880, 1175].forEach((f, n) => later(() => st.ctx.sound(f, .12, 'triangle', .035), n * 80));
        later(() => { if (P.canGamble(st.win, st.step)) { st.round = P.gambleDeal(); st.picking = true; renderGamble(false, -1); say('Doubled to ' + fmt(st.win) + '! Go again or collect.', 'win'); } else { endGamble('Maximum doubles reached. Collected ' + fmt(st.win) + ' ✦.', 'win'); } updateAll(); }, 1100);
      } else if (out === 'lose') {
        credit(-st.win); const lost = st.win; st.win = 0; st.ctx.sound(150, .35, 'sawtooth', .03); say('Lower card. Lost ' + fmt(lost) + ' ✦.', 'bad'); st.ctx.status('Gamble lost ' + fmt(lost) + ' tokens. Balance: ' + fmt(balance()) + '.');
        later(() => endGamble('Lower card. Lost ' + fmt(lost) + ' ✦. Deal again?', 'bad'), 1100);
      } else {
        say('Tie! Stake pushes. Pick again.', ''); st.ctx.sound(330, .12, 'sine', .03); later(() => { st.round = P.gambleDeal(); st.picking = true; renderGamble(false, -1); updateAll(); }, 1000);
      }
      updateAll();
    }, 700);
  }
  function collect() { if (st.phase !== 'gamble' || !st.picking) return; endGamble('Collected ' + fmt(st.win) + ' ✦. Nicely played.', 'good'); st.ctx.status('Collected ' + fmt(st.win) + ' tokens. Balance: ' + fmt(balance()) + '.'); updateAll(); }
  function endGamble(text, cls) { st.phase = 'result'; st.step = P.GAMBLE_MAX_STEPS; st.picking = false; if (st.win > 0) st.step = Math.max(st.step, P.GAMBLE_MAX_STEPS); say(text, cls); st.gamble.innerHTML = ''; updateAll(); }

  function setCoins(n) { if (st.phase === 'idle' || st.phase === 'result') { st.coins = P.clampCoins(n); st.ctx.sound(440 + st.coins * 40, .04, 'square', .02); updateAll(); } }

  function onKey(e) {
    if (!st || !st.root.isConnected || st.ctx.isClosed()) return; if (e.ctrlKey || e.metaKey || e.altKey) return;
    const k = e.key, onBtn = e.target && e.target.tagName === 'BUTTON';
    if (st.phase === 'hold' && /^[1-5]$/.test(k)) { toggleHold(Number(k) - 1); e.preventDefault(); }
    else if (st.phase === 'gamble' && /^[1-4]$/.test(k)) { pickGamble(Number(k) - 1); e.preventDefault(); }
    else if ((k === 'Enter' || k === ' ') && !onBtn) { if (st.phase === 'hold') draw(); else if (st.phase === 'idle' || st.phase === 'result') deal(); e.preventDefault(); }
    else if (k === 'ArrowUp' || k === '+' || k === '=') { setCoins(st.coins + 1); e.preventDefault(); }
    else if (k === 'ArrowDown' || k === '-') { setCoins(st.coins - 1); e.preventDefault(); }
    else if (k === 'm' || k === 'M') setCoins(P.MAX_COINS);
    else if (k === 'd' || k === 'D') startGamble();
    else if (k === 'c' || k === 'C') collect();
  }

  function buildPaytable(v) {
    const t = h('div', 'pk-paytable'); const head = h('div', 'pk-row pk-head'); head.append(h('span', 'pk-n', 'COINS BET'));
    for (let c = 1; c <= 5; c++) head.append(h('span', 'pk-c', String(c))); t.append(head);
    P.paytableKeys(v).forEach(k => {
      const r = h('div', 'pk-row'); r.dataset.k = k; r.append(h('span', 'pk-n', P.HAND_NAMES[k] + (k === 'pair' ? (v.minPair === 10 ? ' (10s+)' : ' (J+)') : '')));
      for (let c = 1; c <= 5; c++) { const s = h('span', 'pk-c', fmt(P.multiplier(v, k) * c)); s.dataset.c = c; r.append(s); }
      t.append(r);
    });
    return t;
  }

  function mount(container, ctx, machine) {
    unmount();
    const v = P.VARIANTS[Number(machine) || 0] || P.VARIANTS[0];
    const saved = ctx.readPlayer(), ps = saved.pokerStats || {};
    st = { ctx, v, coins: P.clampCoins(ps.coins || 5), phase: 'idle', busy: false, hand: [], holds: [false, false, false, false, false], deck: [], win: 0, step: 0, hitKey: '', timers: new Set(), cards: [] };
    const root = h('div', 'pk-root pk-theme-' + v.theme); st.root = root; container.append(root);
    const top = h('div', 'pk-top'); const ti = h('div', 'pk-title'); ti.append(h('b', '', v.game), h('small', '', v.blurb)); const bal = h('div', 'pk-bal'); bal.append(h('small', '', 'BALANCE'), st.bal = h('b', '', '0'), h('small', '', 'TOKENS')); top.append(ti, bal); root.append(top);
    st.paytable = buildPaytable(v); root.append(st.paytable);
    const felt = h('div', 'pk-felt'); const hand = h('div', 'pk-hand');
    for (let i = 0; i < 5; i++) {
      const b = h('button', 'pk-card'); b.type = 'button'; const flip = h('div', 'pk-flip'); flip.append(h('div', 'pk-face pk-back')); b.append(flip, h('span', 'pk-held', 'HELD'), h('span', 'pk-key', String(i + 1)));
      b.addEventListener('click', () => toggleHold(i)); hand.append(b); st.cards.push(b);
    }
    st.msg = h('div', 'pk-msg'); st.msg.setAttribute('aria-live', 'polite'); st.burst = h('div', 'pk-burst'); st.gamble = h('div', 'pk-gamble'); st.gamble.hidden = true;
    felt.append(hand, st.msg, st.burst); root.append(felt, st.gamble);
    const bet = h('div', 'pk-bet');
    st.minus = h('button', 'pk-btn pk-sm', '−'); st.plus = h('button', 'pk-btn pk-sm', '+'); st.max = h('button', 'pk-btn pk-max', 'MAX BET'); st.betVal = h('div', 'pk-betval');
    [st.minus, st.plus, st.max].forEach(b => { b.type = 'button'; }); st.minus.setAttribute('aria-label', 'Lower bet'); st.plus.setAttribute('aria-label', 'Raise bet');
    st.minus.addEventListener('click', () => setCoins(st.coins - 1)); st.plus.addEventListener('click', () => setCoins(st.coins + 1)); st.max.addEventListener('click', () => setCoins(P.MAX_COINS));
    bet.append(st.minus, st.betVal, st.plus, st.max); root.append(bet);
    const act = h('div', 'pk-actions'); st.main = h('button', 'pk-btn pk-main'); st.main.type = 'button'; st.main.innerHTML = '<b>DEAL</b><small></small>'; st.main.addEventListener('click', () => { if (st.phase === 'hold') draw(); else deal(); });
    st.dbl = h('button', 'pk-btn pk-dbl'); st.dbl.type = 'button'; st.dbl.innerHTML = '<b>DOUBLE ✦</b><small></small>'; st.dbl.hidden = true; st.dbl.addEventListener('click', startGamble);
    act.append(st.main, st.dbl); root.append(act);
    st.stats = h('div', 'pk-stats'); root.append(st.stats, h('div', 'pk-foot', '1 coin = ' + P.TOKENS_PER_COIN + ' tokens · fair shuffle every hand · practice tokens only · keys: 1-5 hold, Enter deal/draw, ↑↓ bet, D double'));
    say(v.short.toUpperCase() + ' · Place your bet and press DEAL.'); st.ctx.status(''); updateAll();
    if (!listenerOn) { document.addEventListener('keydown', onKey); listenerOn = true; }
  }
  function unmount() { if (st) { clearTimers(); st.root && st.root.remove(); st = null; } }
  window.NXPokerUI = { mount, unmount };
})();

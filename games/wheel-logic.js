/* Neon Nexus lucky wheel: pure logic (no DOM). UMD: module.exports and window.NXWheel. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.NXWheel = api;
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this), function () {
  'use strict';
  const COST = 25, TOTAL_WEIGHT = 1000, LOYALTY_EVERY = 10, LOYALTY_TICKETS = 10, HISTORY_MAX = 30, TICKET_VALUE = 1;
  // weight is out of 1000 => probability = weight / 1000, exactly as published in the odds table.
  const SEGMENTS = [
    { key: 'bust',   label: 'Bust',        short: 'BUST', kind: 'bust',   amount: 0,    weight: 457, slices: 8, color: '#5b4561', ink: '#f7e6c8' },
    { key: 't10',    label: '10 tokens',   short: '10',   kind: 'tokens', amount: 10,   weight: 170, slices: 4, color: '#f7e6c8', ink: '#392c36' },
    { key: 't25',    label: '25 tokens',   short: '25',   kind: 'tokens', amount: 25,   weight: 100, slices: 3, color: '#8fd1b5', ink: '#2a3a36' },
    { key: 't50',    label: '50 tokens',   short: '50',   kind: 'tokens', amount: 50,   weight: 35,  slices: 1, color: '#f4c987', ink: '#392c36' },
    { key: 't100',   label: '100 tokens',  short: '100',  kind: 'tokens', amount: 100,  weight: 12,  slices: 1, color: '#e98b7b', ink: '#392c36' },
    { key: 't250',   label: '250 tokens',  short: '250',  kind: 'tokens', amount: 250,  weight: 4,   slices: 1, color: '#d9a441', ink: '#392c36' },
    { key: 'k5',     label: '5 tickets',   short: '5 ✦',  kind: 'tickets', amount: 5,   weight: 100, slices: 2, color: '#e98b7b', ink: '#392c36' },
    { key: 'k15',    label: '15 tickets',  short: '15 ✦', kind: 'tickets', amount: 15,  weight: 50,  slices: 1, color: '#8fd1b5', ink: '#2a3a36' },
    { key: 'k40',    label: '40 tickets',  short: '40 ✦', kind: 'tickets', amount: 40,  weight: 12,  slices: 1, color: '#f4c987', ink: '#392c36' },
    { key: 'free',   label: 'Free spin',   short: 'FREE', kind: 'free',   amount: 0,    weight: 50,  slices: 1, color: '#b98ad6', ink: '#fff6e0' },
    { key: 'jackpot',label: 'JACKPOT 1,000 tokens', short: '1000', kind: 'tokens', amount: 1000, weight: 10, slices: 1, color: '#d9a441', ink: '#392c36' }
  ];
  // Visual layout of the 24 wheel slices (decorative; the odds table is exact).
  const LAYOUT = ['jackpot', 'bust', 't10', 'k5', 'bust', 't25', 'free', 'bust', 't10', 'k15', 'bust', 't50', 't250', 'bust', 't10', 'k5', 'bust', 't25', 'k40', 'bust', 't10', 't100', 'bust', 't25'];
  function sliceLayout() { return LAYOUT.slice(); }
  const byKey = {}; SEGMENTS.forEach(s => { byKey[s.key] = s; });
  function probability(seg) { return seg.weight / TOTAL_WEIGHT; }
  function totalWeight() { return SEGMENTS.reduce((a, s) => a + s.weight, 0); }
  function valueOf(seg) { return seg.kind === 'tokens' ? seg.amount : seg.kind === 'tickets' ? seg.amount * TICKET_VALUE : 0; }
  // Expected return per paid spin, valuing tickets at 1 token and a free spin as one more spin (geometric).
  function expectedValue(withLoyalty) {
    const pf = probability(byKey.free), S = SEGMENTS.reduce((a, s) => a + probability(s) * valueOf(s), 0);
    const L = withLoyalty ? LOYALTY_TICKETS * TICKET_VALUE / LOYALTY_EVERY : 0;
    return (S + L) / (1 - pf);
  }
  function returnRate(withLoyalty) { return expectedValue(withLoyalty) / COST; }

  function randomFloat() {
    try { const c = globalThis.crypto; if (c && c.getRandomValues) { const a = new Uint32Array(2); c.getRandomValues(a); return (a[0] * 2097152 + (a[1] >>> 11)) / 9007199254740992; } } catch (e) { /* fall through */ }
    return Math.random();
  }
  function pick(r) { // r in [0,1)
    let acc = r * TOTAL_WEIGHT;
    for (const s of SEGMENTS) { if (acc < s.weight) return s; acc -= s.weight; }
    return SEGMENTS[SEGMENTS.length - 1];
  }
  function spin(rng) { return pick((rng || randomFloat)()); }

  function freshStats() { return { spins: 0, loyalty: 0, freeSpins: 0, biggest: 0, tokensWon: 0, ticketsWon: 0, spent: 0, history: [], pending: null }; }
  function normalizeStats(s) {
    const f = freshStats(); if (!s || typeof s !== 'object') return f;
    for (const k of ['spins', 'loyalty', 'freeSpins', 'biggest', 'tokensWon', 'ticketsWon', 'spent']) f[k] = Math.max(0, Math.floor(Number(s[k]) || 0));
    f.loyalty = f.loyalty % LOYALTY_EVERY; f.history = Array.isArray(s.history) ? s.history.filter(h => h && byKey[h.key]).slice(0, HISTORY_MAX) : [];
    f.pending = s.pending && byKey[s.pending.key] ? { key: s.pending.key, free: !!s.pending.free, at: Number(s.pending.at) || 0 } : null;
    return f;
  }
  // Pure: begin a spin. Returns {ok, reason?, cost, free, stats}. Never lets the balance go negative.
  function begin(stats, balance, prizeKey, now) {
    stats = normalizeStats(stats);
    if (stats.pending) return { ok: false, reason: 'pending', stats };
    const free = stats.freeSpins > 0; const cost = free ? 0 : COST;
    if (balance < cost) return { ok: false, reason: 'funds', stats };
    if (free) stats.freeSpins--; else stats.spent += COST;
    stats.pending = { key: prizeKey, free, at: now || 0 };
    return { ok: true, cost, free, stats };
  }
  // Pure: settle the pending spin. Returns {tokens, tickets, loyaltyBonus, seg, stats}.
  function settle(stats, now) {
    stats = normalizeStats(stats); if (!stats.pending) return { tokens: 0, tickets: 0, loyaltyBonus: 0, seg: null, stats };
    const seg = byKey[stats.pending.key]; stats.pending = null;
    let tokens = seg.kind === 'tokens' ? seg.amount : 0, tickets = seg.kind === 'tickets' ? seg.amount : 0;
    if (seg.kind === 'free') stats.freeSpins++;
    stats.spins++; stats.loyalty++; let loyaltyBonus = 0;
    if (stats.loyalty >= LOYALTY_EVERY) { stats.loyalty = 0; loyaltyBonus = LOYALTY_TICKETS; tickets += loyaltyBonus; }
    stats.tokensWon += tokens; stats.ticketsWon += tickets; stats.biggest = Math.max(stats.biggest, tokens + tickets);
    stats.history.unshift({ key: seg.key, tokens, tickets, bonus: loyaltyBonus, at: now || 0 }); stats.history = stats.history.slice(0, HISTORY_MAX);
    return { tokens, tickets, loyaltyBonus, seg, stats };
  }
  return { COST, TOTAL_WEIGHT, LOYALTY_EVERY, LOYALTY_TICKETS, HISTORY_MAX, SEGMENTS, byKey, sliceLayout, probability, totalWeight, valueOf, expectedValue, returnRate, randomFloat, pick, spin, freshStats, normalizeStats, begin, settle };
});

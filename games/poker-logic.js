/* Neon Nexus video poker: pure logic (no DOM). UMD: module.exports and window.NXPoker. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.NXPoker = api;
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this), function () {
  'use strict';
  const SUITS = ['♠', '♥', '♦', '♣'];
  const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  const TOKENS_PER_COIN = 5, MIN_COINS = 1, MAX_COINS = 5;
  const SESSION_LOSS_LIMIT = 500;       // tokens: the machine pauses after this much net session loss
  const GAMBLE_MAX_STEPS = 3, GAMBLE_MAX_STAKE = 2000; // tokens at risk cap

  // Display order, best first.
  const HAND_KEYS = ['royal', 'straightFlush', 'quadAces', 'quads', 'fullHouse', 'flush', 'straight', 'trips', 'twoPair', 'pair'];
  const HAND_NAMES = {
    royal: 'Royal Flush', straightFlush: 'Straight Flush', quadAces: 'Four Aces', quads: 'Four of a Kind',
    fullHouse: 'Full House', flush: 'Flush', straight: 'Straight', trips: 'Three of a Kind', twoPair: 'Two Pair',
    pair: 'Pair', none: 'No Win'
  };

  const VARIANTS = [
    { id: 'glow', name: 'The Glow · Classic Video Poker', short: 'Classic', game: 'Jacks or Better', theme: 'glow', minPair: 11,
      blurb: 'The house classic. A pair of Jacks or better pays.',
      pays: { royal: 250, straightFlush: 50, quads: 25, fullHouse: 9, flush: 6, straight: 4, trips: 3, twoPair: 2, pair: 1 } },
    { id: 'moon', name: 'Moon Deal · Five Card Draw', short: 'Moon Deal', game: 'Tens or Better', theme: 'moon', minPair: 10,
      blurb: 'Pairs of Tens pay, with a richer full house and flush.',
      pays: { royal: 250, straightFlush: 50, quads: 25, fullHouse: 7, flush: 5, straight: 4, trips: 3, twoPair: 2, pair: 1 } },
    { id: 'lucky', name: 'Lucky Hand · Neon Poker', short: 'Lucky Hand', game: 'Aces Bonus', theme: 'lucky', minPair: 11, aceBonus: true,
      blurb: 'Jacks or Better with a bonus: four Aces pays 100.',
      pays: { royal: 250, straightFlush: 50, quadAces: 100, quads: 25, fullHouse: 8, flush: 5, straight: 4, trips: 3, twoPair: 2, pair: 1 } }
  ];

  // ---- RNG: unbiased, crypto-backed when available (no rigging anywhere). ----
  function randomFloat() {
    try {
      const c = (typeof globalThis !== 'undefined' && globalThis.crypto) || null;
      if (c && c.getRandomValues) { const a = new Uint32Array(2); c.getRandomValues(a); return (a[0] * 2097152 + (a[1] >>> 11)) / 9007199254740992; }
    } catch (e) { /* fall through */ }
    return Math.random();
  }
  function mulberry32(seed) { let a = seed >>> 0; return function () { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  function card(v, s) { return { v, s, rank: RANKS[v - 2], suit: SUITS[s] }; }
  function makeDeck() { const d = []; for (let s = 0; s < 4; s++) for (let v = 2; v <= 14; v++) d.push(card(v, s)); return d; }
  function shuffle(deck, rng) { rng = rng || randomFloat; const d = deck.slice(); for (let i = d.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); const t = d[i]; d[i] = d[j]; d[j] = t; } return d; }

  // ---- Evaluation ----
  function evaluate(hand, variant) {
    variant = variant || VARIANTS[0];
    if (!hand || hand.length !== 5) return 'none';
    const vals = hand.map(c => c.v).sort((a, b) => a - b);
    const counts = {}; vals.forEach(v => { counts[v] = (counts[v] || 0) + 1; });
    const groups = Object.values(counts).sort((a, b) => b - a);
    const flush = hand.every(c => c.s === hand[0].s);
    const distinct = groups.length === 5;
    const straight = distinct && (vals[4] - vals[0] === 4 || vals.join(',') === '2,3,4,5,14');
    if (flush && straight) return vals[0] === 10 ? 'royal' : 'straightFlush';
    if (groups[0] === 4) { const q = Number(Object.keys(counts).find(k => counts[k] === 4)); return (variant.aceBonus && q === 14) ? 'quadAces' : 'quads'; }
    if (groups[0] === 3 && groups[1] === 2) return 'fullHouse';
    if (flush) return 'flush';
    if (straight) return 'straight';
    if (groups[0] === 3) return 'trips';
    if (groups[0] === 2 && groups[1] === 2) return 'twoPair';
    if (groups[0] === 2) { const p = Number(Object.keys(counts).find(k => counts[k] === 2)); if (p >= (variant.minPair || 11)) return 'pair'; }
    return 'none';
  }
  function multiplier(variant, key) { return (variant.pays && variant.pays[key]) || 0; }
  function payout(variant, key, coins) { return multiplier(variant, key) * clampCoins(coins) * TOKENS_PER_COIN; }
  function clampCoins(c) { c = Math.floor(Number(c) || MIN_COINS); return Math.max(MIN_COINS, Math.min(MAX_COINS, c)); }
  function affordableCoins(balance, wanted) { const maxAffordable = Math.floor(Math.max(0, balance) / TOKENS_PER_COIN); return Math.min(clampCoins(wanted), maxAffordable); }
  function paytableKeys(variant) { return HAND_KEYS.filter(k => variant.pays[k] != null); }

  // ---- Hold strategy (standard-style heuristic; also powers the optional hint) ----
  function bestHold(hand, variant) {
    variant = variant || VARIANTS[0];
    const m = variant.minPair || 11;
    const made = evaluate(hand, variant);
    const all = [true, true, true, true, true], none = [false, false, false, false, false];
    if (['royal', 'straightFlush', 'quadAces', 'quads', 'fullHouse', 'flush', 'straight'].includes(made)) return all;
    const idx = (pred) => hand.map((c, i) => pred(c, i) ? true : false);
    const byRank = {}; hand.forEach((c, i) => { (byRank[c.v] = byRank[c.v] || []).push(i); });
    const sets = Object.keys(byRank).map(Number).filter(v => byRank[v].length >= 2);
    const markIdx = (list) => { const h = none.slice(); list.forEach(i => { h[i] = true; }); return h; };
    if (made === 'trips') return markIdx(byRank[sets.find(v => byRank[v].length === 3)]);
    // suit groups
    const bySuit = [[], [], [], []]; hand.forEach((c, i) => bySuit[c.s].push(i));
    const royalSet = (arr) => arr.filter(i => hand[i].v >= 10);
    for (let s = 0; s < 4; s++) { const r = royalSet(bySuit[s]); if (r.length === 4) return markIdx(r); }
    if (made === 'twoPair') return markIdx(sets.flatMap(v => byRank[v]));
    const highPair = sets.find(v => v >= m);
    if (highPair) return markIdx(byRank[highPair]);
    // 4 to a straight flush (open or inside)
    for (let s = 0; s < 4; s++) { const arr = bySuit[s]; if (arr.length >= 4) { const sub = straightDrawIdx(hand, arr, 4); if (sub) return markIdx(sub); } }
    for (let s = 0; s < 4; s++) { const r = royalSet(bySuit[s]); if (r.length === 3) return markIdx(r); }
    for (let s = 0; s < 4; s++) if (bySuit[s].length === 4) return markIdx(bySuit[s]);
    if (sets.length) return markIdx(byRank[sets[0]]);
    const open = straightDrawIdx(hand, hand.map((_, i) => i), 4, true); if (open) return markIdx(open);
    const highs = hand.map((c, i) => i).filter(i => hand[i].v >= m).sort((a, b) => hand[a].v - hand[b].v);
    for (let s = 0; s < 4; s++) { const hs = bySuit[s].filter(i => hand[i].v >= m); if (hs.length >= 2) return markIdx(hs.slice(0, 2)); }
    if (highs.length >= 2) return markIdx(highs.slice(0, 2));
    if (highs.length === 1) return markIdx(highs);
    return none;
  }
  // find `need` cards (indices from pool) that are 4 to a straight; openOnly = require consecutive run of 4 not at the edge.
  function straightDrawIdx(hand, pool, need, openOnly) {
    const vs = {}; pool.forEach(i => { if (!(hand[i].v in vs)) vs[hand[i].v] = i; if (hand[i].v === 14 && !(1 in vs)) vs[1] = i; });
    if (openOnly) {
      for (let a = 2; a <= 10; a++) if ([a, a + 1, a + 2, a + 3].every(v => v in vs)) return [a, a + 1, a + 2, a + 3].map(v => vs[v]);
      return null;
    }
    for (let lo = 1; lo <= 10; lo++) {
      const win = [lo, lo + 1, lo + 2, lo + 3, lo + 4].filter(v => v in vs);
      if (win.length === 4) { const used = new Set(win.map(v => vs[v])); if (used.size === 4) return [...used]; }
    }
    return null;
  }

  // Draw: replace non-held cards from the remaining deck (deck is the post-deal remainder).
  function drawCards(hand, holds, deck) { const d = deck.slice(); const out = hand.map((c, i) => holds[i] ? c : d.pop()); return { hand: out, deck: d }; }
  function playHand(variant, strategy, rng) {
    const deck = shuffle(makeDeck(), rng); const hand = deck.splice(0, 5);
    const holds = (strategy || bestHold)(hand, variant); const r = drawCards(hand, holds, deck);
    return evaluate(r.hand, variant);
  }
  function simulateRtp(variant, hands, seed) {
    const rng = mulberry32(seed || 1); let paid = 0; const freq = {};
    for (let i = 0; i < hands; i++) { const k = playHand(variant, bestHold, rng); freq[k] = (freq[k] || 0) + 1; paid += multiplier(variant, k); }
    return { rtp: paid / hands, freq };
  }

  // ---- Double-or-nothing: dealer shows a card, pick one of 4 face-down cards; higher wins, tie pushes. ----
  function gambleDeal(rng) { const d = shuffle(makeDeck(), rng); return { dealer: d[0], choices: d.slice(1, 5) }; }
  function gambleOutcome(dealer, picked) { return picked.v > dealer.v ? 'win' : picked.v < dealer.v ? 'lose' : 'push'; }
  function canGamble(stakeTokens, step) { return stakeTokens > 0 && step < GAMBLE_MAX_STEPS && stakeTokens * 2 <= GAMBLE_MAX_STAKE; }

  return { SUITS, RANKS, TOKENS_PER_COIN, MIN_COINS, MAX_COINS, SESSION_LOSS_LIMIT, GAMBLE_MAX_STEPS, GAMBLE_MAX_STAKE, HAND_KEYS, HAND_NAMES, VARIANTS,
    randomFloat, mulberry32, card, makeDeck, shuffle, evaluate, multiplier, payout, clampCoins, affordableCoins, paytableKeys, bestHold, drawCards, playHand, simulateRtp, gambleDeal, gambleOutcome, canGamble };
});

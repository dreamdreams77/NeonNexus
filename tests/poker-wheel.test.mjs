import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

// The games are UMD classic scripts (also loaded by the browser); evaluate them with a fake CommonJS module.
const dir=path.join(path.dirname(fileURLToPath(import.meta.url)),'..','games');
const load=f=>{const m={exports:{}};new Function('module',fs.readFileSync(path.join(dir,f),'utf8'))(m);return m.exports;};
const P=load('poker-logic.js'),W=load('wheel-logic.js');
const S={s:0,h:1,d:2,c:3},R={'2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9,T:10,J:11,Q:12,K:13,A:14};
const hand=str=>str.split(' ').map(t=>P.card(R[t[0]],S[t[1]]));
const [GLOW,MOON,LUCKY]=P.VARIANTS;

test('hand ranking covers every category',()=>{
 const cases={'Ah Kh Qh Jh Th':'royal','9h Kh Qh Jh Th':'straightFlush','3c 3d 3h 3s 9d':'quads','3c 3d 3h 9s 9d':'fullHouse','2h 9h Qh Jh 4h':'flush','5c 6d 7h 8s 9d':'straight','3c 3d 3h 8s 9d':'trips','3c 3d 8h 8s 9d':'twoPair','Jc Jd 2h 8s 9d':'pair','Ac Ad 2h 8s 9d':'pair','Tc Td 2h 8s 9d':'none','2c 4d 7h 8s Kd':'none'};
 for(const [h,k] of Object.entries(cases))assert.equal(P.evaluate(hand(h),GLOW),k,h);
});
test('ace-low straight and wraparound edge cases',()=>{
 assert.equal(P.evaluate(hand('Ah 2d 3c 4s 5h'),GLOW),'straight');
 assert.equal(P.evaluate(hand('Ah 2h 3h 4h 5h'),GLOW),'straightFlush','steel wheel is not a royal');
 assert.equal(P.evaluate(hand('Qh Kd Ac 2s 3h'),GLOW),'none','no wraparound straights');
 assert.equal(P.evaluate(hand('Kh Ad 2c 3s 4h'),GLOW),'none');
 assert.equal(P.evaluate(hand('Ah Kd Qc Js Th'),GLOW),'straight','broadway offsuit');
 assert.equal(P.evaluate(hand('Ah Ad Ac As 2h'),GLOW),'quads');
 assert.equal(P.evaluate(hand('Ah Ad Ac As 2h'),LUCKY),'quadAces');
 assert.equal(P.evaluate(hand('Kh Kd Kc Ks 2h'),LUCKY),'quads');
 assert.equal(P.evaluate(hand('Th Td 2c 5s 9h'),MOON),'pair','Moon Deal pays tens');
 assert.equal(P.evaluate(hand('9h 9d 2c 5s Kh'),MOON),'none');
 assert.equal(P.evaluate(hand('Ah Ad 2c 2s Kh'),GLOW),'twoPair');
});
test('payout math scales with coins and clamps to the balance',()=>{
 assert.equal(P.payout(GLOW,'pair',1),5);assert.equal(P.payout(GLOW,'royal',5),250*5*5);assert.equal(P.payout(GLOW,'none',3),0);
 assert.equal(P.payout(GLOW,'twoPair',99),2*5*5,'bet clamps to 5 coins');
 assert.equal(P.affordableCoins(12,5),2);assert.equal(P.affordableCoins(4,5),0);assert.equal(P.affordableCoins(1000,9),5);assert.equal(P.affordableCoins(0,1),0);
});
test('deck is 52 unique cards and shuffle is a permutation',()=>{
 const d=P.makeDeck();assert.equal(new Set(d.map(c=>c.v*4+c.s)).size,52);
 const s=P.shuffle(d,P.mulberry32(3));assert.equal(s.length,52);assert.deepEqual(s.map(c=>c.v*4+c.s).sort((a,b)=>a-b),d.map(c=>c.v*4+c.s).sort((a,b)=>a-b));
});
test('shuffle is unbiased: each card is roughly uniform over positions',()=>{
 const rng=P.mulberry32(11),pos=new Array(52).fill(0),N=52000;
 for(let i=0;i<N;i++){const s=P.shuffle(P.makeDeck(),rng);pos[s.findIndex(c=>c.v===14&&c.s===0)]++;}
 pos.forEach(c=>assert.ok(Math.abs(c/N-1/52)<.006,String(c/N)));
});
test('hold strategy keeps made hands, pairs and four-flushes',()=>{
 const idx=h=>P.bestHold(hand(h),GLOW).map((x,i)=>x?i:-1).filter(i=>i>=0).join('');
 assert.equal(idx('Kh Kd 2c 5s 9h'),'01');assert.equal(idx('Ah Kh Qh Jh 2d'),'0123');assert.equal(idx('2h 3d 4c 5s 9h'),'0123');assert.equal(idx('2h 9h Kc 5s 7d'),'2');
 assert.equal(idx('5h 9h Kh 2h 7d'),'0123');assert.equal(idx('2c 3d 4h 5s 9c'),'0123');
 assert.equal(idx('3h 3d 3c 5s 9c'),'012');assert.equal(idx('2c 7d 9h 4s 5c'),'');
});
test('every variant returns 94-99% over 200k Monte Carlo hands (fair RNG, strategy-driven)',()=>{
 for(const v of P.VARIANTS){const r=P.simulateRtp(v,200000,20260101+v.minPair);assert.ok(r.rtp>.94&&r.rtp<1.0,v.id+' '+r.rtp);
  assert.ok((r.freq.pair||0)/200000>.2,'pairs happen often');}
});
test('double-or-nothing is fair: ties push, and win rate is ~47%',()=>{
 const rng=P.mulberry32(5);let w=0,l=0,p=0;const N=100000;
 for(let i=0;i<N;i++){const g=P.gambleDeal(rng);assert.equal(g.choices.length,4);const out=P.gambleOutcome(g.dealer,g.choices[Math.floor(rng()*4)]);out==='win'?w++:out==='lose'?l++:p++;}
 assert.ok(Math.abs(w/N-l/N)<.012,'symmetric');assert.ok(Math.abs(p/N-.0588)<.01);
 assert.ok(P.canGamble(50,0)&&!P.canGamble(50,3)&&!P.canGamble(1500,0)&&!P.canGamble(0,0));
});

test('wheel odds sum to exactly 1 and the jackpot is about 1%',()=>{
 assert.equal(W.totalWeight(),W.TOTAL_WEIGHT);assert.ok(Math.abs(W.SEGMENTS.reduce((a,s)=>a+W.probability(s),0)-1)<1e-12);
 assert.equal(W.probability(W.byKey.jackpot),.01);assert.equal(W.byKey.jackpot.amount,1000);assert.equal(W.COST,25);
 assert.equal(W.sliceLayout().length,24);for(const s of W.SEGMENTS)assert.equal(W.sliceLayout().filter(k=>k===s.key).length,s.slices,s.key);
});
test('wheel expected return is honest (below cost, 80-92%)',()=>{
 assert.ok(W.returnRate(false)>.8&&W.returnRate(false)<.92,String(W.returnRate(false)));assert.ok(W.returnRate(true)>W.returnRate(false)&&W.returnRate(true)<.92);
});
test('weighted pick matches published frequencies (500k spins)',()=>{
 const rng=P.mulberry32(99),N=500000,c={};for(let i=0;i<N;i++){const s=W.spin(rng);c[s.key]=(c[s.key]||0)+1;}
 for(const s of W.SEGMENTS){const f=(c[s.key]||0)/N,p=W.probability(s),tol=4*Math.sqrt(p*(1-p)/N)+1e-4;assert.ok(Math.abs(f-p)<tol,s.key+' '+f+' vs '+p);}
 assert.equal(W.pick(0).key,W.SEGMENTS[0].key);assert.equal(W.pick(.999999).key,'jackpot');
});
test('empirical wheel payout including free spins and loyalty matches EV',()=>{
 const rng=P.mulberry32(7);let stats=W.freshStats(),bal=0,paid=0,N=300000,tokens=0;
 for(let i=0;i<N;i++){const seg=W.spin(rng),b=W.begin(stats,1e9,seg.key,i);assert.ok(b.ok);paid+=b.cost;const r=W.settle(b.stats,i);stats=r.stats;tokens+=r.tokens+r.tickets;}
 const rate=tokens/paid;assert.ok(Math.abs(rate-W.returnRate(true))<.05,rate+' vs '+W.returnRate(true));
});
test('loyalty bonus lands exactly every 10th spin and state survives the save round-trip',()=>{
 let s=W.freshStats(),bonuses=[];
 for(let i=1;i<=25;i++){const b=W.begin(s,100,'bust',i);assert.ok(b.ok);const r=W.settle(JSON.parse(JSON.stringify(b.stats)),i);s=r.stats;if(r.loyaltyBonus)bonuses.push(i);assert.equal(r.tickets,r.loyaltyBonus);}
 assert.deepEqual(bonuses,[10,20]);assert.equal(s.spins,25);assert.equal(s.loyalty,5);assert.equal(s.history.length,25);
});
test('wheel never spends more than the balance; pending blocks a double spin; free spins cost nothing',()=>{
 let s=W.freshStats();assert.equal(W.begin(s,24,'bust',1).ok,false);assert.equal(W.begin(s,24,'bust',1).reason,'funds');
 const b=W.begin(s,25,'free',1);assert.ok(b.ok&&b.cost===25);assert.equal(W.begin(b.stats,999,'bust',2).reason,'pending');
 const r=W.settle(b.stats,2);assert.equal(r.stats.freeSpins,1);const f=W.begin(r.stats,0,'bust',3);assert.ok(f.ok&&f.free&&f.cost===0);assert.equal(f.stats.freeSpins,0);
 const junk=W.normalizeStats({spins:-4,loyalty:'x',history:[{key:'nope'}],pending:{key:'zzz'}});assert.equal(junk.spins,0);assert.equal(junk.history.length,0);assert.equal(junk.pending,null);
});

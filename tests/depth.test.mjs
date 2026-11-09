import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const src=await readFile(new URL('../arcade-depth.js',import.meta.url),'utf8');
const sandbox={window:{},Math,Date,JSON,performance:{now:()=>0}};vm.createContext(sandbox);vm.runInContext(src,sandbox);
const D=sandbox.window.NEXUS_DEPTH;
const game=await readFile(new URL('../arcade.js',import.meta.url),'utf8');
const IDS=['skeeball','airhockey','billiards','whack','target','memory','rhythm','meteor','racer','stack','pinball','claw','sushi','mixology','pulse','moto','moonquest','ringtoss','gemdig'];

test('every playable 2D cabinet has exactly three named stars',()=>{
 for(const id of IDS){assert.equal(D.STARS[id].length,3,id);for(const s of D.STARS[id])assert.ok(s.label.length>8&&s.label.length<40,s.label);}
 const all=Object.values(D.STARS).flat().map(s=>s.label).join(' ');assert.doesNotMatch(all,/[—–]/);
});
test('fever fills from scoring, doubles points, then runs out and resets',()=>{
 D.begin('whack');assert.equal(D.mult(),1);
 let ev='';for(let i=0;i<30&&ev!=='fever';i++)ev=D.onScore(30);
 assert.equal(ev,'fever');assert.equal(D.mult(),2);assert.equal(D.state.fevers,1);
 assert.equal(D.onScore(30),'','no heat while in fever');
 let end='';for(let i=0;i<100&&!end;i++)end=D.tick(.1);assert.equal(end,'end');assert.equal(D.mult(),1);assert.equal(D.state.heat,0);
 D.onScore(30);const h=D.state.heat;D.tick(1);assert.ok(D.state.heat<h,'heat cools');
});
test('head-to-head and placement cabinets, and table duels, never get fever',()=>{
 for(const id of ['airhockey','billiards','racer']){D.begin(id);for(let i=0;i<40;i++)D.onScore(50);assert.equal(D.mult(),1,id);}
 D.begin('whack',{duel:true});for(let i=0;i<40;i++)D.onScore(50);assert.equal(D.mult(),1);
});
test('stars pay once, persist in the save and tolerate a corrupt star record',()=>{
 const saved={tickets:10,arcadeStars:'junk'};
 const r={score:300,win:true,bestCombo:4,fevers:0,grade:'',place:0,timeLeft:0,stats:{perfect:5},p:{blocks:9}};
 const msg=D.award(saved,'stack',r);assert.match(msg,/NEW STARS/);assert.equal(saved.tickets,10+2*D.STAR_TICKETS);
 assert.deepEqual([...saved.arcadeStars.stack],[true,true,false]);
 assert.equal(D.award(saved,'stack',r),'','no double pay');assert.equal(saved.tickets,10+2*D.STAR_TICKETS);
 r.p.blocks=14;assert.match(D.award(saved,'stack',r),/14 blocks/);
 assert.equal(D.award(saved,'nope',r),'');
 assert.doesNotThrow(()=>D.results('moonquest',{p:{},stats:{}}));
});
test('arcade.js wires fever, stars and the new cabinet mechanics',()=>{
 assert.match(game,/n=Math\.round\(n\*\(live\?D\.mult\(\):1\)\)/);
 assert.match(game,/NEXUS_DEPTH\.begin\(game,\{duel:!!p\.tableDuel\}\)/);
 assert.match(game,/D2\.award\(saved,game,/);
 assert.match(game,/NEXUS_DEPTH\.panelHTML\(saved,id\)/);
 for(const s of ["p.stats.perfect","p.stats.golden","kind==='bomb'","p.stats.chain","p.mirror","function mixBand","function gemGrid","p.stats.prizes","p.stats.hits","p.stats.crashes","p.stats.corners","p.hot","p.nexusMult","p.stats.nexus","heavy:!gold","TOO HEAVY","function sushiOrder","p.stats.orders","r.wind"])assert.ok(game.includes(s),s);
 assert.match(game,/WIN_SCORE=\{skeeball:150,target:150,stack:100,whack:250,memory:200\}/);
});
test('Moon Gem Dig boards are always winnable: 8 gems and 3 cracks',()=>{
 const m=/function gemGrid\(\)\{[^\n]*\}/.exec(game);assert.ok(m);
 const ctx={Math,Array,Set};vm.createContext(ctx);vm.runInContext(m[0]+';this.g=gemGrid();',ctx);
 for(let k=0;k<50;k++){vm.runInContext('this.g=gemGrid();',ctx);assert.equal(ctx.g.filter(t=>t.gem).length,8);assert.equal(ctx.g.filter(t=>t.hazard).length,3);assert.equal(ctx.g.filter(t=>t.gem&&t.hazard).length,0);}
});

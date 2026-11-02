import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const src=await readFile(new URL('../dialogue.js',import.meta.url),'utf8');
const sandbox={window:{},Math};vm.createContext(sandbox);vm.runInContext(src,sandbox);
const V=sandbox.window.NEXUS_VOICE;

test('voice module loads as a classic script and exposes the API',()=>{
 for(const k of ['pick','fill','regulars','barks','chatPairs','staff','quip','status','s','regular','bark','staffLine'])assert.ok(k in V,k);
});
test('the four regulars each have several lines per topic, intros and quest-done lines',()=>{
 for(const n of ['Pip','Moxie','Juniper','Rook']){const r=V.regulars[n];assert.ok(r,n);
  assert.ok(r.intros.length>=3,n+' intros');assert.ok(r.chat.length>=4,n+' chat');assert.ok(r.tip.length>=3,n+' tip');assert.ok(r.rumour.length>=3,n+' rumour');assert.ok(r.done.length>=2,n+' done');}
});
test('every line is a non-empty, sensibly sized string with no unfilled placeholders in static text',()=>{
 const all=[];const walk=(o)=>{if(typeof o==='string')all.push(o);else if(Array.isArray(o))o.forEach(walk);else if(o&&typeof o==='object')Object.values(o).forEach(walk);};
 walk([V.regulars,V.barks,V.chatPairs,V.staff,V.generic]);
 assert.ok(all.length>150,'lots of dialogue: '+all.length);
 for(const l of all){assert.ok(l.trim().length>8,'too short: '+l);assert.ok(l.length<=260,'too long: '+l);assert.doesNotMatch(l,/\{\w+\}/,'placeholder in '+l);}
 assert.equal(new Set(all).size,all.length,'duplicate lines');
});
test('speech bubbles stay readable: barks and staff lines fit within four wrapped lines',()=>{
 for(const l of [...Object.values(V.barks).flat(),...Object.values(V.staff).flat(),...V.chatPairs.flat()])assert.ok(l.length<=96,'bubble too long ('+l.length+'): '+l);
});
test('shuffle bag uses every line before repeating and never repeats back to back',()=>{
 const list=['a1 line','b2 line','c3 line','d4 line'];const seen=[];let prev='';
 for(let i=0;i<12;i++){const l=V.pick('t',list);assert.notEqual(l,prev);prev=l;seen.push(l);}
 for(let i=0;i<12;i+=4)assert.equal(new Set(seen.slice(i,i+4)).size,4,'cycle '+i);
});
test('status templates fill their variables and every shop key has a line',()=>{
 const need={soldOut:{},needTickets:{n:5,name:'Bear'},redeemed:{name:'Bear'},needTokens5:{},needTokensGeneric:{},ordered:{name:'Soup'},tablesFull:{},tableYours:{table:2,n:3},collected:{name:'Soup'},needTokens5Track:{},nowPlaying:{name:'Song'},needTokens25:{},wheel:{n:100},seated:{table:2},served:{name:'Soup',table:2},quest:{n:90},nod:{name:'Pip'}};
 for(const [k,v] of Object.entries(need)){for(let i=0;i<4;i++){const line=V.s(k,v);assert.ok(line.length>10,k);assert.doesNotMatch(line,/\{\w+\}|undefined|NaN/,k+': '+line);}}
 assert.match(V.s('needTickets',{n:42,name:'Giant Bear'}),/42/);
});
test('result quips respond to grades, placings, zero scores and personal bests',()=>{
 assert.match(V.quip('rhythm',{win:true,score:100,newBest:false,gradeLabel:'GRADE S · 100% ACCURACY'}),/S/);
 assert.match(V.quip('rhythm',{win:false,score:10,newBest:false,gradeLabel:'GRADE D · 20% ACCURACY'}),/D/);
 assert.match(V.quip('racer',{win:true,score:100,newBest:false,gradeLabel:'1ST PLACE · BEST LAP 14s'}),/First/);
 assert.ok(V.quip('whack',{win:false,score:0,newBest:false,gradeLabel:''}).length>10);
 assert.match(V.quip('whack',{win:true,score:50,newBest:true,gradeLabel:''}),/best/i);
 for(const g of ['claw','billiards','airhockey','meteor','stack','memory','chef','pulse'])assert.ok(V.quip(g,{win:Math.random()<.5,score:30,newBest:false,gradeLabel:''}).length>10,g);
});

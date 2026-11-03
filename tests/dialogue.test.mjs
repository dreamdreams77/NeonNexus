import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const src=await readFile(new URL('../dialogue.js',import.meta.url),'utf8');
const dailySrc=await readFile(new URL('../daily.js',import.meta.url),'utf8');
const memSrc=await readFile(new URL('../dialogue-memory.js',import.meta.url),'utf8');
const store=new Map();
const localStorage={getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const sandbox={window:{},Math,Date,JSON,localStorage};vm.createContext(sandbox);vm.runInContext(dailySrc,sandbox);vm.runInContext(src,sandbox);vm.runInContext(memSrc,sandbox);const D=sandbox.window.NEXUS_DAILY;
const V=sandbox.window.NEXUS_VOICE;
const setPlayer=o=>store.set('neon-nexus-player-v1',JSON.stringify(o));
const sessions=(n,extra={})=>Array.from({length:n},(_,i)=>({game:i%2?'claw':'rhythm',score:50,win:i%3===0,bestCombo:3,at:Date.now()-i,...extra}));

test('voice module loads as a classic script and exposes the API',()=>{
 for(const k of ['pick','fill','regulars','barks','chatPairs','staff','quip','status','s','regular','bark','staffLine'])assert.ok(k in V,k);
});
test('the four regulars each have several lines per topic, intros and quest-done lines',()=>{
 for(const n of ['Ace','Moxie','Juniper','Laryn']){const r=V.regulars[n];assert.ok(r,n);
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
 for(const l of [...Object.values(V.barks).flat(),...Object.values(V.staff).flat(),...Object.values(V.memory.STAFF_RX).flat().map(r=>r.t.replace(/\{\w+\}/g,'12')),...V.chatPairs.flat()])assert.ok(l.length<=96,'bubble too long ('+l.length+'): '+l);
});
test('shuffle bag uses every line before repeating and never repeats back to back',()=>{
 const list=['a1 line','b2 line','c3 line','d4 line'];const seen=[];let prev='';
 for(let i=0;i<12;i++){const l=V.pick('t',list);assert.notEqual(l,prev);prev=l;seen.push(l);}
 for(let i=0;i<12;i+=4)assert.equal(new Set(seen.slice(i,i+4)).size,4,'cycle '+i);
});
test('status templates fill their variables and every shop key has a line',()=>{
 const need={soldOut:{},needTickets:{n:5,name:'Bear'},redeemed:{name:'Bear'},needTokens5:{},needTokensGeneric:{},ordered:{name:'Soup'},tablesFull:{},tableYours:{table:2,n:3},collected:{name:'Soup'},needTokens5Track:{},nowPlaying:{name:'Song'},needTokens25:{},wheel:{n:100},seated:{table:2},served:{name:'Soup',table:2},quest:{n:90},nod:{name:'Ace'}};
 for(const [k,v] of Object.entries(need)){for(let i=0;i<4;i++){const line=V.s(k,v);assert.ok(line.length>10,k);assert.doesNotMatch(line,/\{\w+\}|undefined|NaN/,k+': '+line);}}
 assert.match(V.s('needTickets',{n:42,name:'Giant Bear'}),/42/);
});
test('result quips respond to grades, placings, zero scores and personal bests',()=>{
 assert.match(V.quip('rhythm',{win:true,score:100,newBest:false,gradeLabel:'GRADE S · 100% ACCURACY'}),/S/);
 assert.match(V.quip('rhythm',{win:false,score:10,newBest:false,gradeLabel:'GRADE D · 20% ACCURACY'}),/D/);
 assert.match(V.quip('racer',{win:true,score:100,newBest:false,gradeLabel:'1ST PLACE · BEST LAP 14s'}),/First/);
 assert.ok(V.quip('whack',{win:false,score:0,newBest:false,gradeLabel:''}).length>10);
 assert.match(V.quip('whack',{win:true,score:50,newBest:true,gradeLabel:''}),/best|record|new|PB/i);
 for(const g of ['claw','billiards','airhockey','meteor','stack','memory','chef','pulse'])assert.ok(V.quip(g,{win:Math.random()<.5,score:30,newBest:false,gradeLabel:''}).length>10,g);
});

test('no em or en dashes anywhere in the dialogue or visible intro copy',async()=>{
 for(const f of ['../dialogue.js','../dialogue-memory.js','../daily.js','../intro.js']){const text=await readFile(new URL(f,import.meta.url),'utf8');assert.doesNotMatch(text,/[—–]/,f+' contains an em or en dash');}
 const all=[];const walk=(o)=>{if(typeof o==='string')all.push(o);else if(Array.isArray(o))o.forEach(walk);else if(o&&typeof o==='object')Object.values(o).forEach(walk);};
 walk([Object.values(V.memory.FEUD),V.memory.FEUD_WAIT,V.memory.CROWD_RX.map(r=>r.t),Object.values(V.memory.MOMENTS).flat().map(r=>r.t),V.memory.STORY,V.memory.WAIT,V.memory.AFTER,V.memory.REPORT,V.memory.REACT.Ace.map(r=>r.t),V.memory.REACT.Moxie.map(r=>r.t),V.memory.REACT.Juniper.map(r=>r.t),V.memory.REACT.Laryn.map(r=>r.t),Object.values(V.memory.STAFF_RX).flat().map(r=>r.t),V.regulars,V.regularBarks,V.barks,V.chatPairs,V.staff,V.generic,V.status,V.cabinetQuips]);
 for(const l of all)assert.doesNotMatch(l,/[—–]/,l);
});
test('every quoted line in dialogue.js is unique, readable and fits where it is shown',async()=>{
 const text=src+'\n'+memSrc;
 const lines=[...text.matchAll(/'((?:[^'\\\n]|\\.)+)'/g)].map(m=>m[1].replace(/\\'/g,"'")).filter(l=>/\s/.test(l)&&l.length>14&&!/^\s|[()=;]|\bfunction\b/.test(l)&&!/^(q:|s:|b:|rb:|r:|st:|intro:|bye)/.test(l));
 assert.ok(lines.length>300,'plenty of content: '+lines.length);
 const dup=lines.filter((l,i)=>lines.indexOf(l)!==i);assert.deepEqual(dup,[],'duplicate lines');
 for(const l of lines){assert.ok(l.length<=260,'too long: '+l);}
});
test('regular approach barks, cabinet quips and plush barks exist and fit a bubble or card',()=>{
 for(const n of ['Ace','Moxie','Juniper','Laryn']){assert.ok(V.regularBarks[n].length>=4,n);for(const l of V.regularBarks[n])assert.ok(l.length<=96,l);}
 for(const id of ['hoops','skeeball','airhockey','whack','target','memory','rhythm','meteor','racer','stack','pinball','claw','chef','sushi','mixology','pulse','moto','moonquest','ringtoss','gemdig'])assert.ok(V.cabinetQuip(id).length>10&&V.cabinetQuip(id).length<=80,id);
 assert.ok(V.barks.plush.length>=4);assert.equal(typeof V.regularBark('Ace'),'string');
});
test('more material: the regulars now have at least 7 chat lines, 5 tips and 5 rumours each',()=>{
 for(const n of ['Ace','Moxie','Juniper','Laryn']){const r=V.regulars[n];assert.ok(r.chat.length>=7,n+' chat '+r.chat.length);assert.ok(r.tip.length>=5,n+' tip '+r.tip.length);assert.ok(r.rumour.length>=5,n+' rumour '+r.rumour.length);assert.ok(r.done.length>=3,n+' done');}
});

test('the lobby remembers: visit count, rapport and talk tallies persist in their own save',()=>{
 const m=V.memory;assert.ok(m.ctx().visits>=1);
 const before=m.rapport('Ace').talks;V.regular('Ace','chat');assert.equal(m.rapport('Ace').talks,before+1);
 for(let i=0;i<9;i++)V.regular('Ace','tip');
 assert.match(m.rapport('Ace').label,/MATE|PROPER LEGEND/);
 assert.ok(JSON.parse(store.get('neon-nexus-voice-v1')).talks.Ace>=10);
});
test('the Bear Affair: five chapters per regular, gated by sessions, with a bear and a no-bear ending',()=>{
 const m=V.memory;assert.deepEqual([...m.CHAPTERS].length,5);
 for(const n of ['Ace','Moxie','Juniper','Laryn']){assert.equal(m.STORY[n].length,5,n);for(const b of m.STORY[n].slice(0,4))assert.equal(typeof b,'string');assert.ok(m.STORY[n][4].bear&&m.STORY[n][4].plain,n);}
 m.reset();setPlayer({arcadeSessions:sessions(1)});
 let i=m.storyInfo('Ace');assert.equal(i.next,0);assert.ok(i.ready);
 assert.match(m.storyTell('Ace'),/Giant Comet Bear/);
 i=m.storyInfo('Ace');assert.equal(i.next,1);assert.ok(!i.ready);assert.equal(i.need,2);
 assert.match(m.storyTell('Ace'),/Not yet|rest|ferment/i);
 setPlayer({arcadeSessions:sessions(3)});assert.ok(m.storyInfo('Ace').ready);m.storyTell('Ace');
 setPlayer({arcadeSessions:sessions(7)});m.storyTell('Ace');
 setPlayer({arcadeSessions:sessions(12)});m.storyTell('Ace');
 setPlayer({arcadeSessions:sessions(18)});assert.ok(m.storyInfo('Ace').ready);
 assert.match(m.storyTell('Ace'),/Eleven months/);
 assert.ok(m.storyInfo('Ace').done);assert.ok(m.storyTell('Ace').length>10);
 m.reset();setPlayer({arcadeSessions:sessions(18),prizes:[{id:'comet-bear',quantity:1}]});
 for(let k=0;k<4;k++)m.storyTell('Laryn');assert.match(m.storyTell('Laryn'),/bear is yours/);
});
test('reactive lines depend on real save data and every placeholder is filled',()=>{
 const m=V.memory;m.reset();setPlayer({tickets:1200,tokens:10,arcadeSessions:sessions(5),prizes:[]});
 const c=m.ctx();assert.equal(c.sessions,5);assert.ok(c.tickets>=980&&!c.bear);
 const seen=new Set();for(let k=0;k<400;k++)seen.add(V.regular('Ace','chat'));
 assert.ok([...seen].some(l=>/1200 tickets and no bear/.test(l)),'bear nag fires');
 for(const l of seen)assert.doesNotMatch(l,/\{\w+\}/,l);
 setPlayer({tickets:5,tokens:9999,arcadeSessions:[],prizes:[{id:'comet-bear',quantity:2}]});
 const bears=new Set();for(let k=0;k<400;k++)bears.add(V.regular('Juniper','tip'));
 assert.ok([...bears].some(l=>/green tick/.test(l)),'bear owner reaction');
 for(const n of ['Ace','Moxie','Juniper','Laryn'])for(const t of [0,1,2]){setPlayer({arcadeSessions:sessions([0,5,40][t])});const l=V.regular(n,'stats');assert.ok(l.length>15,n);assert.doesNotMatch(l,/\{\w+\}/,l);}
 for(const who of ['bartender','chef','host']){const o=new Set();for(let k=0;k<300;k++)o.add(V.staffLine(who));for(const l of o)assert.doesNotMatch(l,/\{\w+\}/,l);assert.ok(o.size>10,who);}
});
test('bartender and chef have far more to say, and corrupt saves never throw',()=>{
 assert.ok(V.staff.bartender.length>=25&&V.staff.chef.length>=25,V.staff.bartender.length+' '+V.staff.chef.length);
 store.set('neon-nexus-player-v1','{bad');assert.doesNotThrow(()=>V.memory.ctx());
 store.set('neon-nexus-player-v1',JSON.stringify({arcadeSessions:'x',prizes:5,orders:9,tokens:'a'}));assert.doesNotThrow(()=>V.regular('Moxie','chat'));
 store.set('neon-nexus-voice-v1','{bad');assert.doesNotThrow(()=>V.memory.rapport('Ace'));
});

test('daily goals: one featured cabinet per day, every cabinet gets a turn, bonuses pay once',()=>{
 const seen=new Set();for(let n=20000;n<20020;n++){const f=D.featuredOn(n);assert.notEqual(f.game,f.partner);seen.add(f.game);}
 assert.equal(seen.size,20,'all twenty cabinets rotate through');
 const t=D.today(),sv={tickets:0};
 assert.equal(sv.daily,undefined);
 let msg=D.apply(sv,'nothing-special',false);assert.equal(msg,'');
 msg=D.apply(sv,t.game,false);assert.match(msg,/FEATURED \+30/);assert.equal(sv.tickets,30);
 msg=D.apply(sv,t.game,false);assert.equal(msg,'','play bonus only once');
 msg=D.apply(sv,t.game,true);assert.match(msg,/FEATURED WIN \+30/);assert.equal(sv.tickets,60);
 msg=D.apply(sv,t.partner,false);assert.match(msg,/DOUBLE FEATURE \+25/);assert.equal(sv.tickets,85);
 assert.equal(D.apply(sv,t.partner,true),'');
 assert.match(D.pitchFor(t.game,D.today(sv)),/bonuses claimed/);assert.equal(D.pitchFor('zzz',t),'');
});
test('daily streak pays a capped bonus for consecutive days and resets after a gap',()=>{
 const day=D.dayNum();
 const sv={tickets:0,daily:{day:day-1,streak:3,lastDay:day-1,played:true,won:true,partner:true}};
 const msg=D.apply(sv,'nothing',false);assert.match(msg,/DAY 4 STREAK \+12/);assert.equal(sv.daily.streak,4);
 const cap={tickets:0,daily:{day:day-1,streak:30,lastDay:day-1}};D.apply(cap,'x',false);assert.equal(cap.tickets,21);
 const gap={tickets:0,daily:{day:day-3,streak:9,lastDay:day-3}};assert.equal(D.apply(gap,'x',false),'');assert.equal(gap.daily.streak,1);
});
test('one-off moments fire once, the Kitchen Feud unlocks by orders, crowd barks fit a bubble',()=>{
 const m=V.memory;m.reset();setPlayer({tickets:2000,arcadeSessions:sessions(2),prizes:[]});
 assert.match(V.regular('Ace','chat'),/enough for the bear/);
 let again='';for(let k=0;k<60;k++)again+=V.regular('Ace','chat')+'|';assert.doesNotMatch(again,/The bear told me/,'moment is one-off');
 const orders=n=>Array.from({length:n},(_,i)=>({id:'o'+i,name:'x',status:'Served'}));
 setPlayer({orders:orders(0)});assert.ok(m.feudInfo('bar').ready);assert.match(m.feudTell('bar'),/lemons/i);
 assert.ok(!m.feudInfo('bar').ready);assert.equal(m.feudInfo('bar').need,2);assert.match(m.feudTell('bar'),/Not yet|ripening|time/i);
 setPlayer({orders:orders(2)});assert.ok(m.feudInfo('bar').ready);m.feudTell('bar');
 setPlayer({orders:orders(10)});for(let k=0;k<3;k++)m.feudTell('bar');assert.match(m.feudTell('bar'),/speaking|lemon/);assert.ok(m.feudInfo('bar').done);
 for(const side of ['bar','pass']){assert.equal(m.FEUD[side].length,5);}
 for(const r of m.CROWD_RX)assert.ok(r.t.replace(/\{\w+\}/g,'Beat Foundry 12').length<=96,r.t);
 setPlayer({tickets:1500,arcadeSessions:sessions(60)});const seen=new Set();for(let k=0;k<200;k++){const b=V.memoryBark();if(b)seen.add(b);}assert.ok(seen.size>=2);
});
test('story gating counts lifetime plays, not the 25 session log',()=>{
 const m=V.memory;m.reset();setPlayer({arcadeSessions:sessions(25),arcadeStats:{claw:{plays:40,wins:9},rhythm:{plays:30,wins:3}}});
 const c=m.ctx();assert.equal(c.sessions,70);assert.equal(c.wins>=12,true);
});

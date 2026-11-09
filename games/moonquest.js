/* games/moonquest.js — Neon Nexus cabinet module */
(function(){'use strict';
const N=window.NXG,TAU=Math.PI*2,cl=N.clamp,lerp=N.lerp,R=N.rand,E=N.ease;
const DBG=/debug/.test(location.search);
const RI=(a,b)=>Math.floor(a+Math.random()*(b-a+1));
const PAL={cream:'#f8e9ca',coral:'#ef896d',mint:'#91c9a7',plum:'#684b62',gold:'#f2ce77',ink:'#1a1226'};
function T(c,t,x,y,s,col,al,o){if(c.canvas&&c.canvas.height>c.canvas.width)s=Math.max(s,s>=24?s:15);N.text(c,t,x,y,Object.assign({font:'700 '+s+'px Fredoka, system-ui, sans-serif',color:col||'#fff0d4',align:al||'left',stroke:PAL.ink,sw:Math.max(2,s/6)},o||null));}
function wrap(c,txt,mw,font){c.font=font;const w=txt.split(' '),out=[];let l='';for(const x of w){const t=l?l+' '+x:x;if(c.measureText(t).width>mw&&l){out.push(l);l=x;}else l=t;}if(l)out.push(l);return out;}
/* READY panel: objective + how-to + best */
function readyScreen(c,api,title,obj,how,col,extra){
 const W=api.W,H=api.H,fs=api.portrait?15:16,pw=Math.min(W-30,620);
 c.save();c.fillStyle='rgba(16,10,28,.74)';c.fillRect(0,0,W,H);
 const f='600 '+fs+'px Fredoka, system-ui, sans-serif';let lines=[];
 const ol=wrap(c,obj,pw-48,f);how.forEach(h=>lines.push(...wrap(c,'• '+h,pw-48,f)));
 const ph=Math.min(H-24,92+ol.length*(fs+5)+lines.length*(fs+5)+(extra?30:0)+56),px=(W-pw)/2,py=(H-ph)/2;
 N.slab(c,px,py,pw,ph,24,'#4a3552');N.coil(c,px+3,py+3,pw-6,ph-6,22);
 T(c,title,W/2,py+46,Math.min(40,pw/11),col||PAL.gold,'center',{glow:col||PAL.gold});
 let y=py+78;ol.forEach(l=>{T(c,l,W/2,y,fs,'#fff0d4','center',{font:f,stroke:null});y+=fs+5;});y+=8;
 lines.forEach(l=>{T(c,l,px+26,y,fs,'#d8f0e0','left',{font:f,stroke:null});y+=fs+5;});
 if(extra)T(c,extra,W/2,py+ph-48,fs,PAL.gold,'center',{font:f,stroke:null});
 T(c,api.touch?'PRESS START BELOW':'PRESS START',W/2,py+ph-18,fs+3,PAL.mint,'center',{glow:PAL.mint});
 c.restore();
}
/* cached background */
const BGC={};
function bgCache(key,w,h,fn){let o=BGC[key];if(!o||o.width!==w||o.height!==h){o=document.createElement('canvas');o.width=w;o.height=h;fn(o.getContext('2d'),w,h);BGC[key]=o;}return o;}
function heart(c,x,y,s,col,full){c.save();c.translate(x,y);c.scale(s,s);c.beginPath();c.moveTo(0,.35);c.bezierCurveTo(-1.1,-.35,-.55,-1.05,0,-.45);c.bezierCurveTo(.55,-1.05,1.1,-.35,0,.35);c.closePath();c.fillStyle=full?col:'rgba(20,12,30,.55)';c.fill();c.lineWidth=.12;c.strokeStyle='rgba(30,16,34,.7)';c.stroke();if(full){c.fillStyle='rgba(255,255,255,.5)';c.beginPath();c.ellipse(-.38,-.4,.2,.12,-.6,0,TAU);c.fill();}c.restore();}
function gradeOf(frac,win){const g=win?(frac>=.9?'S':frac>=.65?'A':'B'):(frac>=.6?'B':frac>=.3?'C':'D');return g;}
function topScores(api,s){let t=api.store.get('top',[]);if(!Array.isArray(t))t=[];t.push(Math.round(s));t.sort((a,b)=>b-a);t=t.slice(0,5);api.store.set('top',t);return t;}
const keyIs=(e,...a)=>a.includes(e.key)||a.includes((e.key||'').toLowerCase());
function sfx(api,n){try{N.sfx(api,n);}catch(e){}}
function twinkle(c,w,h,n,seed){const rn=N.mulberry(seed);for(let i=0;i<n;i++){c.globalAlpha=.3+rn()*.7;c.fillStyle='#fff6dd';const s=rn()*1.8+.4;c.beginPath();c.arc(rn()*w,rn()*h*.6,s,0,TAU);c.fill();}c.globalAlpha=1;}
/* ===== MOONSHARD LEGEND ===== */
const TS=40,GW=16,GH=12,RW=GW*TS,RH=GH*TS;
const SH_COL=['#7fb8e8','#e08ac0','#f2ce77'];
// room kinds: 0 NW puzzle,1 N gate boss,2 NE guardian,3 W combat,4 hub,5 E combat,6 SW gauntlet,7 S start,8 SE chest
const ROOMS=[
 {n:'RUNE VAULT',tpl:0},{n:'MOON GATE',tpl:1},{n:'GUARDIAN HALL',tpl:0},
 {n:'BROKEN COURT',tpl:1},{n:'MOON HUB',tpl:2},{n:'ARCHER TERRACE',tpl:3},
 {n:'GAUNTLET',tpl:0},{n:'RUIN ENTRANCE',tpl:1},{n:'TREASURY',tpl:0}];
const TPL=[[],[[3,3],[3,8],[12,3],[12,8]],[[6,4,4,4]],[[2,2,1,8],[13,2,1,8]]];
let S=null;
const doorsOf=r=>({n:r>=3,s:r<6,w:r%3>0,e:r%3<2});
function bakeRoom(ri,api){
 const cv=document.createElement('canvas');cv.width=RW;cv.height=RH;const g=cv.getContext('2d');const rn=N.mulberry(ri*131+7);
 const hue=['#7fb8e8','#a0a0d0','#e08ac0','#8a9ab8','#9ab8c8','#c0a090','#a08ab8','#8ab0a0','#d8b870'][ri];
 // floor
 for(let r=0;r<GH;r++)for(let c=0;c<GW;c++){const v=rn();const base=(r+c)%2?'#6a5a78':'#625270';g.fillStyle=N.mix(base,hue,.12+v*.06);g.fillRect(c*TS,r*TS,TS,TS);g.strokeStyle='rgba(20,10,30,.28)';g.lineWidth=1.5;g.strokeRect(c*TS+.5,r*TS+.5,TS-1,TS-1);
  if(v>.86){g.strokeStyle='rgba(20,10,30,.35)';g.lineWidth=1.5;g.beginPath();g.moveTo(c*TS+8,r*TS+6);g.lineTo(c*TS+20,r*TS+20);g.lineTo(c*TS+16,r*TS+34);g.stroke();}
  if(v<.07){g.fillStyle='rgba(120,200,180,.25)';g.beginPath();g.arc(c*TS+rn()*30+5,r*TS+rn()*30+5,5,0,TAU);g.fill();}}
 // moon rune circle
 g.save();g.globalAlpha=.25;g.strokeStyle='#e8f0ff';g.lineWidth=3;g.beginPath();g.arc(RW/2,RH/2,90,0,TAU);g.stroke();g.beginPath();g.arc(RW/2,RH/2,70,0,TAU);g.stroke();for(let i=0;i<8;i++){const a=i*TAU/8;g.beginPath();g.moveTo(RW/2+Math.cos(a)*70,RH/2+Math.sin(a)*70);g.lineTo(RW/2+Math.cos(a)*90,RH/2+Math.sin(a)*90);g.stroke();}g.restore();
 // walls
 const D=doorsOf(ri);
 const wallTile=(c,r)=>{const x=c*TS,y=r*TS;const gr=g.createLinearGradient(0,y,0,y+TS);gr.addColorStop(0,'#8a7a98');gr.addColorStop(.5,'#5a4a6a');gr.addColorStop(1,'#3a2c4a');g.fillStyle=gr;N.rr(g,x+1,y+1,TS-2,TS-2,8);g.fill();g.strokeStyle='rgba(20,10,28,.7)';g.lineWidth=2.5;g.stroke();g.fillStyle='rgba(255,255,255,.25)';N.rr(g,x+6,y+4,TS-12,5,3);g.fill();g.fillStyle='rgba(20,10,28,.2)';g.fillRect(x+8,y+TS-12,TS-16,3);if(rn()<.3){g.fillStyle='rgba(100,190,140,.55)';g.beginPath();g.ellipse(x+rn()*30+5,y+TS-8,6,3,0,0,TAU);g.fill();}};
 S.maps[ri]=Array.from({length:GH},(_,r)=>new Uint8Array(GW));const m=S.maps[ri];
 for(let r=0;r<GH;r++)for(let c=0;c<GW;c++){const edge=r===0||r===GH-1||c===0||c===GW-1;if(!edge)continue;
  const door=(r===0&&D.n&&(c===7||c===8))||(r===GH-1&&D.s&&(c===7||c===8))||(c===0&&D.w&&(r===5||r===6))||(c===GW-1&&D.e&&(r===5||r===6));
  if(!door){m[r][c]=1;wallTile(c,r);}}
 for(const o of TPL[ROOMS[ri].tpl]){const [x,y,w,h]=o.length===2?[o[0],o[1],1,1]:o;for(let r=y;r<y+h;r++)for(let c=x;c<x+w;c++){m[r][c]=1;wallTile(c,r);}}
 // torches
 for(const[tx,ty]of[[2,0],[13,0],[2,GH-1],[13,GH-1]]){if(m[ty][tx]===1){g.save();N.glow(g,tx*TS+TS/2,ty*TS+(ty?-4:TS+4),40,'#ffb060',.5);g.fillStyle='#ffd080';g.beginPath();g.arc(tx*TS+TS/2,ty*TS+TS/2,5,0,TAU);g.fill();g.restore();}}
 S.bake[ri]=cv;
}
function newState(api){
 const m=api.mastery,hp=5+(m>=2?1:0);
 S={ri:7,maps:[],bake:[],visited:new Set([7]),pl:{x:RW/2,y:RH-90,vx:0,vy:0,fx:0,fy:-1,r:12,hp,max:hp,inv:0,atk:0,combo:0,comboT:0,swing:0,roll:0,rcd:0,rdx:0,rdy:0,kb:{x:0,y:0},anim:0,hitFlash:0,cd:0},shards:[false,false,false],ents:[],proj:[],fx:[],items:[],plates:[],
  state:{},t:0,bgT:0,score0:0,kills:0,dead:false,endT:-1,win:false,done:false,fade:0,fadeDir:0,pend:null,bannerT:0,banner:'',sub:'',keys:{},best:0,combo:0,coins:0,up:{dmg:0,roll:0},chest:null,cards:null,minimapT:0,hint:'',noDmg:true,rolls:0,ptr:null,boss:null};
 for(let i=0;i<9;i++)bakeRoom(i,api);
 enterRoom(api,7,'s',true);
}
function mk(type,x,y,api){
 const mul=api.diff.mul;
 const o={type,x,y,vx:0,vy:0,r:12,hp:2,max:2,t:Math.random()*6,fl:0,kb:{x:0,y:0},dead:0,cd:1+Math.random(),st:0,sa:Math.PI/2};
 if(type==='archer'){o.hp=o.max=2;o.r=11;}if(type==='knight'){o.hp=o.max=4;o.r=14;}
 if(type==='slime'){o.hp=o.max=Math.round(2*(mul>1?1.2:1));}
 if(type==='golem'){o.hp=o.max=Math.round(9*Math.pow(mul,.8));o.r=40;o.cd=2;o.stun=0;}
 if(type==='warden'){o.hp=o.max=Math.round(14*Math.pow(mul,.8));o.r=30;o.cd=2.4;o.phase=1;}
 return o;
}
function spawnSet(api,ri){
 const E=[];const add=(t,x,y)=>E.push(mk(t,x,y,api));
 if(ri===3){add('slime',160,120);add('slime',480,330);add('archer',520,110);}
 else if(ri===4){add('slime',130,330);add('slime',500,100);add('knight',300,330);}
 else if(ri===5){add('archer',150,110);add('archer',480,360);add('knight',320,200);}
 else if(ri===8){add('slime',140,100);}
 return E;
}
function enterRoom(api,ri,from,first){
 S.ri=ri;S.proj.length=0;S.fx.length=0;const p=S.pl;
 if(from==='n'){p.x=RW/2+(p.x>RW/2?20:-20);p.y=40;}else if(from==='s'){p.x=RW/2+(first?0:(p.x>RW/2?20:-20));p.y=RH-44;}else if(from==='w'){p.x=44;p.y=RH/2+(p.y>RH/2?20:-20);}else if(from==='e'){p.x=RW-44;p.y=RH/2+(p.y>RH/2?20:-20);}
 p.vx=p.vy=0;p.roll=0;
 const st=S.state[ri]=S.state[ri]||{init:false,cleared:false};
 if(!S.visited.has(ri)){S.visited.add(ri);api.addScore(3);}
 if(!st.init){st.init=true;st.ents=spawnSet(api,ri);st.items=[];
  if(ri===0){st.plates=[{x:RW/2-150,y:RH/2},{x:RW/2,y:RH/2-100},{x:RW/2+150,y:RH/2}];st.seq=[0,1,2].sort(()=>Math.random()-.5);if(api.diff.id!=='easy')st.seq.push(st.seq[0]===1?2:1);st.pi=0;st.show=0;st.showT=1.4;st.lit=-1;}
  if(ri===6){st.wave=0;st.locked=false;}
  if(ri===8){st.chest={x:RW/2,y:RH/2-40,open:false};}
  if(ri===2||ri===1){st.boss=false;}
 }
 S.cur=st;S.ents=st.ents;S.items=st.items;S.boss=null;
 for(const e of S.ents)if(e.type==='golem'||e.type==='warden')S.boss=e;
 S.banner=ROOMS[ri].n;S.sub=ri===6?'Survive three waves':ri===0?'Step on the runes in the glowing order':ri===2?'Stone Guardian awakens':ri===1?'The Moon Warden awaits':ri===8?'Open the chest for an upgrade':'';S.bannerT=1.4;
 if(ri===6&&!st.cleared&&!st.locked){st.locked=true;st.wave=0;}
 if((ri===2||ri===1)&&!st.cleared&&!st.boss){st.boss=true;const b=mk(ri===2?'golem':'warden',RW/2,RH/2-60,api);S.ents.push(b);S.boss=b;S.banner=ri===2?'STONE GUARDIAN':'MOON WARDEN';S.sub='Doors sealed!';S.bannerT=1.8;api.shake(10,.4);sfx(api,'boom');}
 if(st.cleared&&ri===6&&!st.shardGot&&st.shardPos===undefined){}
}
function solidAt(x,y){const c=Math.floor(x/TS),r=Math.floor(y/TS);if(c<0||c>=GW||r<0||r>=GH)return true;if(S.maps[S.ri][r][c])return true;
 // locked doors
 const st=S.cur;if(S.lockDoors&&((r===0||r===GH-1)&&(c===7||c===8)||(c===0||c===GW-1)&&(r===5||r===6)))return true;
 if(S.ri===4&&r===0&&(c===7||c===8)&&S.shards.some(s=>!s))return true;
 if(S.ri===0&&st.plates&&!st.solved&&false)return true;
 return false;}
function moveEnt(e,dx,dy){
 const k=e.r*.75;
 let nx=e.x+dx;if(!(solidAt(nx+k,e.y-k)||solidAt(nx+k,e.y+k)||solidAt(nx-k,e.y-k)||solidAt(nx-k,e.y+k)))e.x=nx;else e.hitW=true;
 let ny=e.y+dy;if(!(solidAt(e.x+k,ny+k)||solidAt(e.x-k,ny+k)||solidAt(e.x+k,ny-k)||solidAt(e.x-k,ny-k)))e.y=ny;else e.hitW=true;
}
function hurtPl(api,d,fx,fy){
 const p=S.pl;if(p.inv>0||p.roll>0||S.dead)return;p.hp-=d;p.inv=1.1;S.noDmg=false;p.hitFlash=.3;api.shake(9,.25);sfx(api,'bump');api.burst(p.x,p.y,'#ff8a6a',10);
 const dx=p.x-fx,dy=p.y-fy,l=Math.hypot(dx,dy)||1;p.kb.x=dx/l*280;p.kb.y=dy/l*280;S.combo=0;api.combo=0;
 if(p.hp<=0){S.dead=true;S.endT=1.4;S.win=false;sfx(api,'lose');api.burst(p.x,p.y,'#ffb060',30);}
}
function attack(api,ax,ay){
 const p=S.pl;if(p.cd>0||p.roll>0||S.dead||S.cards)return;
 if(ax!==undefined){const l=Math.hypot(ax,ay)||1;p.fx=ax/l;p.fy=ay/l;}
 p.combo=p.comboT>0?(p.combo+1)%3:0;p.comboT=.55;p.swing=.2;p.cd=.2;
 const big=p.combo===2;sfx(api,'whoosh');
 p.vx+=p.fx*(big?200:120);p.vy+=p.fy*(big?200:120);
 const range=big?58:46,rad=big?36:30,cx=p.x+p.fx*range*.6,cy=p.y+p.fy*range*.6;
 const dmg=(big?2:1)+S.up.dmg;let hit=false;
 const hitEnt=e=>{if(e.dead)return;const d=Math.hypot(e.x-cx,e.y-cy);if(d>rad+e.r)return;
  if(e.type==='knight'){const ang=Math.atan2(p.y-e.y,p.x-e.x),da=Math.abs(Math.atan2(Math.sin(ang-e.sa),Math.cos(ang-e.sa)));if(da<1.1&&!big){api.popText('BLOCKED',e.x,e.y-26,'#cfe6ff');api.sound(900,.05,'square',.04);api.burst(e.x,e.y,'#cfe6ff',5);p.vx-=p.fx*180;p.vy-=p.fy*180;return;}}
  if(e.type==='golem'&&!(e.stun>0)){api.popText('CLANK',e.x,e.y-e.r,'#cfe6ff');api.sound(800,.06,'square',.05);return;}
  hit=true;e.hp-=dmg;e.fl=.14;const l=Math.hypot(e.x-p.x,e.y-p.y)||1;e.kb.x=(e.x-p.x)/l*(big?320:200);e.kb.y=(e.y-p.y)/l*(big?320:200);if(e.type==='golem'||e.type==='warden'){e.kb.x*=.1;e.kb.y*=.1;}
  api.burst(e.x,e.y,'#fff0d4',6);api.shake(big?7:3,.1);sfx(api,'hit');if((e.type==='warden'||e.type==='golem')&&e.hp>0&&e.hp%4===0)S.items.push({k:'heart',x:RW/2+R(-80,80),y:RH-80});
  S.combo++;api.combo=S.combo;S.best=Math.max(S.best,S.combo);
  if(e.hp<=0)killEnt(api,e);};
 for(const e of S.ents)hitEnt(e);
 if(big&&api.mastery>=6)S.proj.push({x:p.x,y:p.y,vx:p.fx*420,vy:p.fy*420,friendly:1,life:.6,r:12});
 if(S.cur.plates===undefined){}
}
function killEnt(api,e){
 e.dead=1;S.kills++;const pts={slime:3,archer:4,knight:7,golem:60,warden:100}[e.type];api.addScore(pts,e.x,e.y-14,'#fff0d4');api.burst(e.x,e.y,e.type==='slime'?'#8ad8a0':'#c8a888',16);sfx(api,'pop');
 if(e.type==='golem'){S.cur.cleared=true;S.cur.shardPos={x:RW/2,y:RH/2};S.items.push({k:'shard',i:2,x:RW/2,y:RH/2});api.shake(14,.6);sfx(api,'win');S.boss=null;}
 else if(e.type==='warden'){S.cur.cleared=true;S.win=true;S.endT=1.8;api.shake(18,.9);sfx(api,'win');api.burst(e.x,e.y,'#ffe08a',60);S.boss=null;api.addScore(0);}
 else{const r=Math.random();if(r<.14)S.items.push({k:'heart',x:e.x,y:e.y});else if(r<.6)S.items.push({k:'coin',x:e.x,y:e.y});}
 if(S.kills>=10)api.achieve('slayer','Ruin Slayer',4);
}
function roll(api,dx,dy){
 const p=S.pl;if(p.rcd>0||p.roll>0||S.dead||S.cards)return;
 let l=Math.hypot(dx,dy);if(!l){dx=p.fx;dy=p.fy;l=1;}p.rdx=dx/l;p.rdy=dy/l;p.roll=api.mastery>=4?.34:.28;p.rcd=api.mastery>=4?.7:.95;p.rcd*=(1-.25*S.up.roll);S.rolls++;sfx(api,'whoosh');api.burst(p.x,p.y+8,'#cfc0d8',6);
}
function end(api,win){if(S.done)return;S.done=true;topScores(api,api.score);const n=S.shards.filter(Boolean).length;if(n>api.store.get('stage',0))api.store.set('stage',n);
 if(win&&S.noDmg)api.achieve('flawless','Untouched Legend',10);if(win)api.achieve('legend','Moonshard Legend',10);
 api.finish(win,{grade:gradeOf(cl(api.score/380,0,1),win)+' · '+n+'/3 SHARDS',combo:S.best});}
/* ---------- update ---------- */
function updateRoom(api,dt){
 const st=S.cur,p=S.pl,ri=S.ri,mul=api.diff.mul;
 S.lockDoors=false;
 if(ri===6&&st.locked){S.lockDoors=true;
  if(S.ents.every(e=>e.dead)&&!st.spawnDelay){if(st.wave>=3){st.locked=false;st.cleared=true;S.items.push({k:'shard',i:0,x:RW/2,y:RH/2});api.popText('SHARD REVEALED',RW/2,RH/2-50,'#7fb8e8');sfx(api,'win');}else{st.spawnDelay=1;st.wt=.9;}}
  if(st.spawnDelay){st.wt-=dt;if(st.wt<=0){st.spawnDelay=0;const w=st.wave++;const ex=[[['slime',2],['slime',3]],[['archer',2],['slime',2]],[['knight',1],['slime',2],['archer',1]]][w];const pos=[[120,100],[520,100],[120,360],[520,360],[320,100]];let k=0;for(const[t,n]of ex)for(let i=0;i<n;i++){const q=pos[k++%5];const e=mk(t,q[0],q[1],api);S.ents.push(e);api.burst(q[0],q[1],'#e8f0ff',10);}api.popText('WAVE '+(w+1)+'/3',RW/2,RH/2,'#ffe08a');sfx(api,'power');}}}
 if(ri===0&&!st.solved){
  st.showT-=dt;if(st.show<st.seq.length){if(st.showT<=0){st.lit=st.seq[st.show];st.show++;st.showT=.8;st.litT=.5;sfx(api,'ping');api.sound(400+st.lit*150,.2,'triangle',.05);}}else if(st.showT<=0&&st.pi===0&&st.show>=st.seq.length){st.lit=-1;}
  if(st.litT>0){st.litT-=dt;if(st.litT<=0)st.lit=-1;}
  if(st.show>=st.seq.length&&st.showT<-5&&st.pi===0){st.show=0;st.showT=.5;}
  st.plates.forEach((pl,i)=>{const on=Math.hypot(p.x-pl.x,p.y-pl.y)<26;if(on&&!pl.on){pl.on=true;sfx(api,'click');if(st.show>=st.seq.length&&st.litT<=0||st.pi>0){if(i===st.seq[st.pi]){st.pi++;st.lit=i;st.litT=.3;api.sound(500+i*150,.15,'triangle',.05);api.burst(pl.x,pl.y,'#ffe08a',8);if(st.pi>=st.seq.length){st.solved=true;st.cleared=true;S.items.push({k:'shard',i:1,x:RW/2,y:RH/2-60});api.popText('RUNES ALIGNED!',RW/2,RH/2-100,'#e08ac0');sfx(api,'win');}}else if(st.pi>0||true){st.pi=0;st.show=0;st.showT=.9;api.popText('WRONG - WATCH AGAIN',pl.x,pl.y-30,'#ffb0a0');sfx(api,'miss');api.shake(5,.2);}}}if(!on)pl.on=false;});
 }
 if(ri===4&&p.y<TS*1.6&&Math.abs(p.x-RW/2)<TS){ // gate
  if(S.shards.every(Boolean)){}else if(S.cur.gateMsg===undefined||S.cur.gateMsg<=0){S.cur.gateMsg=2;api.popText('NEEDS ALL 3 MOONSHARDS',RW/2,TS*2.4,'#ffb0a0');}
 }
 if(st.gateMsg>0)st.gateMsg-=dt;
 if((ri===2||ri===1)&&S.boss&&!S.boss.dead)S.lockDoors=true;
 if(ri===8&&st.chest&&!st.chest.open&&Math.hypot(p.x-st.chest.x,p.y-st.chest.y)<34){st.chest.open=true;S.cards=pickCards();sfx(api,'power');}
}
function pickCards(){const all=[{id:'dmg',n:'MOON BLADE',d:'+1 sword damage',c:'#f2ce77'},{id:'heart',n:'HEART VESSEL',d:'+1 max heart, full heal',c:'#ef6a8a'},{id:'roll',n:'SWIFT BOOTS',d:'Roll recharges 25% faster',c:'#7fb8e8'}];return all;}
function applyCard(api,i){const c=S.cards[i];if(!c)return;if(c.id==='dmg')S.up.dmg++;else if(c.id==='roll')S.up.roll++;else{S.pl.max++;S.pl.hp=S.pl.max;}api.popText(c.n+'!',S.pl.x,S.pl.y-30,c.c);sfx(api,'power');S.cards=null;S.cur.cleared=true;}
function updateEnts(api,dt){
 const p=S.pl,mul=api.diff.mul,spd=mul>1?1.15:mul<1?.85:1;
 for(const e of S.ents){
  if(e.dead)continue;e.t+=dt;if(e.fl>0)e.fl-=dt;
  // knockback
  if(Math.abs(e.kb.x)+Math.abs(e.kb.y)>8){moveEnt(e,e.kb.x*dt,e.kb.y*dt);e.kb.x*=Math.exp(-9*dt);e.kb.y*=Math.exp(-9*dt);}
  const dx=p.x-e.x,dy=p.y-e.y,d=Math.hypot(dx,dy)||1,ux=dx/d,uy=dy/d;
  if(e.type==='slime'){const sp=(60+Math.sin(e.t*5)*30)*spd;if(d<340)moveEnt(e,ux*sp*dt,uy*sp*dt);if(d<e.r+p.r)hurtPl(api,1,e.x,e.y);}
  else if(e.type==='archer'){
   let mv=0;if(d<150)mv=-1;else if(d>260)mv=1;if(mv)moveEnt(e,ux*mv*70*spd*dt,uy*mv*70*spd*dt);
   e.cd-=dt;if(e.cd<=0.5&&e.st===0&&d<520){e.st=1;}
   if(e.cd<=0){e.cd=2.1/spd;e.st=0;const a=Math.atan2(dy,dx);S.proj.push({x:e.x,y:e.y,vx:Math.cos(a)*250*spd,vy:Math.sin(a)*250*spd,life:3,r:6});api.sound(300,.05,'square',.03);}
   e.aim=Math.atan2(dy,dx);if(d<e.r+p.r)hurtPl(api,1,e.x,e.y);}
  else if(e.type==='knight'){
   const ang=Math.atan2(dy,dx);let da=ang-e.sa;da=Math.atan2(Math.sin(da),Math.cos(da));e.sa+=cl(da,-1.5*dt*spd,1.5*dt*spd);
   if(d<300)moveEnt(e,Math.cos(e.sa)*52*spd*dt,Math.sin(e.sa)*52*spd*dt);
   if(d<e.r+p.r+4)hurtPl(api,1,e.x,e.y);}
  else if(e.type==='golem'){
   e.cd-=dt;if(e.stun>0){e.stun-=dt;}
   else if(e.st===0){moveEnt(e,ux*38*spd*dt,uy*38*spd*dt);if(e.cd<=0){e.st=1;e.tt=.95;e.sx=e.x;e.sy=e.y;}}
   else if(e.st===1){e.tt-=dt;if(e.tt<=0){e.st=0;e.stun=2.8;e.cd=3.4/spd;api.shake(14,.4);sfx(api,'boom');S.fx.push({x:e.sx,y:e.sy,r:120,t:.4,max:.4,c:'#ffb060'});if(Math.hypot(p.x-e.sx,p.y-e.sy)<120)hurtPl(api,1,e.sx,e.sy);
     if(e.hp<e.max*.6){for(let i=0;i<3;i++)S.proj.push({x:e.x,y:e.y,rock:1,tx:p.x+R(-120,120),ty:p.y+R(-90,90),t:0,life:1.1,r:26});}}}
   if(d<e.r+p.r&&e.stun<=0)hurtPl(api,1,e.x,e.y);}
  else if(e.type==='warden'){
   e.cd-=dt;const ph=e.hp/e.max;e.phase=ph>.66?1:ph>.33?2:3;
   const ang=Math.atan2(dy,dx);e.x+=Math.cos(e.t*.8)*30*dt;e.y+=Math.sin(e.t*1.1)*24*dt;e.x=cl(e.x,100,RW-100);e.y=cl(e.y,90,RH-130);
   if(e.cd<=0){const r=Math.random();
    if(r<.45){const n=e.phase===1?8:11;for(let i=0;i<n;i++){const a=i*TAU/n+e.t;S.proj.push({x:e.x,y:e.y,vx:Math.cos(a)*(125+e.phase*12)*spd,vy:Math.sin(a)*(125+e.phase*12)*spd,life:4,r:7});}e.cd=3.2/spd;sfx(api,'power');}
    else if(r<.8){for(let i=-1;i<=1;i++){const a=ang+i*.25;S.proj.push({x:e.x,y:e.y,vx:Math.cos(a)*210*spd,vy:Math.sin(a)*210*spd,life:3,r:7});}e.cd=2.4/spd;sfx(api,'shot');}
    else if(e.phase>=2&&S.ents.filter(q=>!q.dead&&q.type==='slime').length<3){const s=mk('slime',e.x+R(-60,60),e.y+60,api);S.ents.push(s);api.burst(s.x,s.y,'#e8f0ff',8);e.cd=2.2;}
    else{e.cd=1.2;}}
   if(d<e.r+p.r)hurtPl(api,1,e.x,e.y);}
 }
}
/* ---------- drawing ---------- */
function drawHero(c,p,api){
 if(p.inv>0&&Math.floor(S.t*20)%2&&p.roll<=0)return;
 c.save();c.translate(p.x,p.y);
 N.shadow(c,0,12,14,5,.35);
 const rl=p.roll>0;if(rl){c.rotate(S.t*22);}
 const face=Math.atan2(p.fy,p.fx);
 // cape
 if(!rl){c.fillStyle='#c0504a';c.beginPath();c.moveTo(-9,-4);c.quadraticCurveTo(-p.fx*10-12,10-p.fy*8,-p.fx*8,14);c.lineTo(8,-4);c.fill();}
 // body
 const bg=c.createRadialGradient(-4,-8,2,0,-2,16);bg.addColorStop(0,'#fff0dc');bg.addColorStop(.6,'#e8c898');bg.addColorStop(1,'#a07858');c.fillStyle=bg;c.beginPath();c.ellipse(0,0,12,13,0,0,TAU);c.fill();c.strokeStyle='rgba(30,16,34,.7)';c.lineWidth=2.5;c.stroke();
 // helmet
 c.fillStyle='#8a9ab8';c.beginPath();c.arc(0,-6,10,Math.PI,0);c.fill();c.stroke();c.fillStyle='#ef896d';c.fillRect(-1.5,-16,3,8);
 c.fillStyle='#1a1226';c.beginPath();c.arc(p.fx*3-3,-3+p.fy*2,2,0,TAU);c.arc(p.fx*3+4,-3+p.fy*2,2,0,TAU);c.fill();
 // shield on back / sword
 c.save();c.rotate(face);
 c.fillStyle='#7fb8e8';c.beginPath();c.ellipse(-8,0,4,9,0,0,TAU);c.fill();c.stroke();
 const sw=p.swing>0?(1-p.swing/.2):0,sa=p.swing>0?lerp(-1.3,1.3,sw)*(p.combo%2?-1:1):0.6;
 c.save();c.rotate(sa);c.fillStyle='#dfe8f8';N.rr(c,10,-2.5,22,5,2);c.fill();c.stroke();c.fillStyle='#d8a050';c.fillRect(8,-5,4,10);c.restore();
 c.restore();
 if(p.swing>0){c.save();c.rotate(face);const big=p.combo===2;c.globalAlpha=Math.min(1,p.swing*6);c.strokeStyle=big?'#ffe08a':'#fff6e0';c.lineWidth=big?9:6;c.beginPath();c.arc(0,0,(big?50:42),-1.2,1.2);c.stroke();c.restore();}
 if(p.hitFlash>0){c.globalAlpha=p.hitFlash*3;c.fillStyle='#ff5040';c.beginPath();c.arc(0,0,14,0,TAU);c.fill();}
 c.restore();
}
function drawEnt(c,e,api){
 if(e.dead)return;const t=S.t;c.save();c.translate(e.x,e.y);
 if(e.type==='slime'){const sq=1+Math.sin(e.t*8)*.08;N.shadow(c,0,10,14,5,.3);c.scale(1/sq,sq);const g=c.createRadialGradient(-4,-6,2,0,0,16);g.addColorStop(0,'#d0ffd8');g.addColorStop(.6,'#5ac880');g.addColorStop(1,'#2a7a50');c.fillStyle=g;c.beginPath();c.moveTo(-14,10);c.quadraticCurveTo(-16,-14,0,-14);c.quadraticCurveTo(16,-14,14,10);c.closePath();c.fill();c.strokeStyle='rgba(20,40,30,.7)';c.lineWidth=2.5;c.stroke();c.fillStyle='#fff';c.beginPath();c.arc(-5,-3,4,0,TAU);c.arc(5,-3,4,0,TAU);c.fill();c.fillStyle='#1a2a22';c.beginPath();c.arc(-4,-2,2,0,TAU);c.arc(6,-2,2,0,TAU);c.fill();c.fillStyle='rgba(255,255,255,.5)';c.beginPath();c.ellipse(-7,-9,4,2,-.4,0,TAU);c.fill();}
 else if(e.type==='archer'){N.shadow(c,0,10,12,4,.3);c.fillStyle='#6a4a3a';c.beginPath();c.moveTo(-11,11);c.lineTo(-8,-8);c.lineTo(8,-8);c.lineTo(11,11);c.fill();c.strokeStyle='rgba(30,16,20,.7)';c.lineWidth=2.5;c.stroke();N.blob(c,0,-10,9,'#c0d878',4,{shadow:false});c.fillStyle='#1a1226';c.beginPath();c.arc(-3,-11,1.8,0,TAU);c.arc(3,-11,1.8,0,TAU);c.fill();c.save();c.rotate(e.aim||0);c.strokeStyle='#d8a050';c.lineWidth=3;c.beginPath();c.arc(12,0,12,-1.2,1.2);c.stroke();if(e.st===1){c.strokeStyle='rgba(255,90,70,.7)';c.lineWidth=2;c.setLineDash([6,5]);c.beginPath();c.moveTo(14,0);c.lineTo(300,0);c.stroke();}c.restore();}
 else if(e.type==='knight'){N.shadow(c,0,12,15,5,.3);const g=c.createRadialGradient(-5,-8,2,0,0,17);g.addColorStop(0,'#e8e8f8');g.addColorStop(.6,'#8a90b8');g.addColorStop(1,'#464a70');c.fillStyle=g;c.beginPath();c.arc(0,0,14,0,TAU);c.fill();c.strokeStyle='rgba(20,16,40,.7)';c.lineWidth=2.5;c.stroke();c.fillStyle='#1a1226';c.fillRect(-7,-5,14,5);c.fillStyle='#ff5a4a';c.fillRect(-4,-4,3,3);c.fillRect(2,-4,3,3);
  c.save();c.rotate(e.sa);c.fillStyle='#d8a050';c.beginPath();c.ellipse(15,0,6,14,0,0,TAU);c.fill();c.stroke();c.fillStyle='#ef896d';c.beginPath();c.ellipse(15,0,2.5,8,0,0,TAU);c.fill();c.restore();}
 else if(e.type==='golem'){N.shadow(c,0,36,50,12,.4);if(e.st===1){c.save();c.translate(e.sx-e.x,e.sy-e.y);c.fillStyle='rgba(255,90,70,'+(.18+.1*Math.sin(t*30))+')';c.beginPath();c.arc(0,0,120,0,TAU);c.fill();c.strokeStyle='rgba(255,120,90,.8)';c.lineWidth=4;c.stroke();c.restore();}
  const sq=e.stun>0?.92:1;c.scale(1,sq);const g=c.createLinearGradient(-40,0,40,0);g.addColorStop(0,'#5a4a6a');g.addColorStop(.5,'#9a8aa8');g.addColorStop(1,'#4a3a5a');c.fillStyle=g;N.rr(c,-38,-34,76,70,18);c.fill();c.strokeStyle='rgba(20,10,28,.75)';c.lineWidth=4;c.stroke();
  for(const s of[-1,1]){c.fillStyle='#7a6a8a';N.rr(c,s*38-(s>0?0:20),-14,20,36,9);c.fill();c.stroke();}
  c.fillStyle='#7a6a8a';N.rr(c,-22,-52,44,28,10);c.fill();c.stroke();c.fillStyle=e.stun>0?'#7affd8':'#ff6a4a';c.beginPath();c.arc(-8,-40,5,0,TAU);c.arc(8,-40,5,0,TAU);c.fill();
  N.glow(c,0,-4,e.stun>0?50:24,e.stun>0?'#7affd8':'#ff6a4a',.8);c.fillStyle=e.stun>0?'#e8fff6':'#4a2a3a';c.beginPath();c.arc(0,-4,12,0,TAU);c.fill();c.stroke();c.fillStyle='rgba(255,255,255,.25)';N.rr(c,-28,-28,56,6,3);c.fill();}
 else if(e.type==='warden'){c.translate(0,Math.sin(t*2)*5);N.shadow(c,0,50,28,8,.25);N.glow(c,0,0,70,'#c0a0ff',.4);const g=c.createRadialGradient(-6,-10,3,0,0,34);g.addColorStop(0,'#f0e8ff');g.addColorStop(.5,'#9a80d0');g.addColorStop(1,'#3a2a68');c.fillStyle=g;c.beginPath();c.moveTo(-30,38);c.quadraticCurveTo(-34,-30,0,-34);c.quadraticCurveTo(34,-30,30,38);c.quadraticCurveTo(0,26,-30,38);c.fill();c.strokeStyle='rgba(20,10,40,.75)';c.lineWidth=3.5;c.stroke();
  c.fillStyle='#fff6c0';c.beginPath();c.arc(0,-26,12,.7,TAU-.7);c.arc(5,-26,9,TAU-.9,.9,true);c.fill();c.fillStyle='#1a1226';c.beginPath();c.ellipse(-9,-6,5,7,0,0,TAU);c.ellipse(9,-6,5,7,0,0,TAU);c.fill();c.fillStyle='#ffe08a';c.beginPath();c.arc(-9,-7,2,0,TAU);c.arc(9,-7,2,0,TAU);c.fill();}
 if(e.fl>0){c.globalAlpha=e.fl*5;c.fillStyle='#fff';c.beginPath();c.arc(0,0,e.r+2,0,TAU);c.fill();}
 c.restore();
 if(e.type!=='golem'&&e.type!=='warden'&&e.hp<e.max){N.bar(c,e.x-14,e.y-e.r-12,28,5,e.hp/e.max,'#ef6a6a');}
}
function drawMinimap(c,api,x,y,cs){
 c.save();c.fillStyle='rgba(18,12,30,.7)';N.rr(c,x-4,y-4,cs*3+8,cs*3+8,8);c.fill();
 for(let r=0;r<9;r++){const cx=x+(r%3)*cs,cy=y+Math.floor(r/3)*cs,vis=S.visited.has(r);c.fillStyle=vis?(r===S.ri?'#ffe08a':'#6a5a88'):'rgba(255,255,255,.1)';N.rr(c,cx+1,cy+1,cs-2,cs-2,3);c.fill();
  if(r===1&&vis||r===1){c.fillStyle='#ef896d';c.fillRect(cx+cs/2-2,cy+cs/2-2,4,4);}
  const si=[6,0,2].indexOf(r);if(si>=0&&S.shards[si]){c.fillStyle=SH_COL[si];c.beginPath();c.arc(cx+cs/2,cy+cs/2,cs*.2,0,TAU);c.fill();}}
 c.restore();
}
function drawHUD(c,api){
 const W=api.W,por=api.portrait,p=S.pl;
 for(let i=0;i<p.max;i++)heart(c,24+i*30,22,13,'#ef6a6a',i<p.hp);
 // shards
 for(let i=0;i<3;i++){const x=24+i*28,y=52;c.fillStyle=S.shards[i]?SH_COL[i]:'rgba(255,255,255,.15)';c.beginPath();c.moveTo(x,y-10);c.lineTo(x+8,y);c.lineTo(x,y+10);c.lineTo(x-8,y);c.closePath();c.fill();c.strokeStyle='rgba(30,16,34,.7)';c.lineWidth=2;c.stroke();}
 T(c,'MOONSHARDS',24,76,10,'rgba(255,240,208,.6)','left',{stroke:null});
 N.bar(c,W/2-40,por?12:8,80,6,1-p.rcd/.95>0&&p.rcd>0?1-p.rcd/.95:1,'#7fb8e8');T(c,'ROLL',W/2,por?30:26,10,'#9ad0f8','center',{stroke:null});
 if(por)drawMinimap(c,api,W-76,10,20);else drawMinimap(c,api,W-70,6,20);
 if(S.boss&&!S.boss.dead){const bw=Math.min(380,W-60);N.bar(c,(W-bw)/2,por?64:30,bw,12,S.boss.hp/S.boss.max,'#ef6a6a');T(c,S.boss.type==='golem'?'STONE GUARDIAN':'MOON WARDEN',W/2,por?74:40,10,'#fff0d4','center',{stroke:null});}
 if(S.bannerT>0){c.save();c.globalAlpha=Math.min(1,S.bannerT*2);c.fillStyle='rgba(18,12,30,.6)';c.fillRect(0,api.H*.42,W,api.H*.14);T(c,S.banner,W/2,api.H*.5,Math.min(W,540)/13,PAL.gold,'center',{glow:PAL.gold});if(S.sub)T(c,S.sub,W/2,api.H*.54,15,'#fff0d4','center',{stroke:null});c.restore();}
}
function drawCards(c,api){
 const W=api.W,H=api.H,por=api.portrait;c.fillStyle='rgba(14,8,28,.75)';c.fillRect(0,0,W,H);T(c,'TREASURE',W/2,por?100:80,por?32:38,PAL.gold,'center',{glow:PAL.gold});T(c,'Choose a reward ('+(api.touch?'tap':'1 / 2 / 3')+')',W/2,por?128:108,15,'#fff0d4','center',{stroke:null});
 const cw=por?W-40:250,ch=por?150:230,gap=14,sx=por?20:(W-(cw*3+gap*2))/2,sy=por?160:140;S.cr=[];
 S.cards.forEach((u,i)=>{const x=por?sx:sx+i*(cw+gap),y=por?sy+i*(ch+gap):sy;S.cr.push({x,y,w:cw,h:ch});N.slab(c,x,y,cw,ch,18,N.mix(u.c,'#3a2540',.6),{depth:7});c.strokeStyle=u.c;c.lineWidth=3;N.rr(c,x,y,cw,ch,18);c.stroke();T(c,String(i+1),x+20,y+36,28,u.c,'left',{stroke:null});N.ball(c,x+cw/2,y+(por?50:76),24,u.c,{shadow:false});T(c,u.n,x+cw/2,y+(por?100:130),19,'#fff0d4','center',{stroke:null});T(c,u.d,x+cw/2,y+(por?126:158),14,'#d8c8e8','center',{stroke:null});});
}
NEXUS_GAMES.register('moonquest',{
 ...(DBG?{dbg:()=>S,jumpRoom(r){enterRoom(NEXUS_ARCADE_API,r,'s');}}:{}),
 meta:{title:'Moonshard Legend',help:'Explore the moon ruins, claim three Moonshards from their guardians, then open the Moon Gate.',controls:'WASD / ARROWS move · SPACE/Z slash (3-hit combo) · SHIFT/X roll',type:'ADVENTURE · ACTION'},
 size:[900,520],portraitSize:[540,860],duration:320,tier:1.4,
 touch:[{kind:'stick',side:'left'},{kind:'btn',side:'right',label:'ROLL',key:'x',cls:'alt'},{kind:'btn',side:'right',label:'SLASH',key:' ',big:true}],
 init(api){newState(api);},
 start(api){newState(api);S.bannerT=2;S.banner='RUIN ENTRANCE';S.sub='Find the three Moonshards';},
 update(dt,api){
  const p=S.pl,W=api.W;S.t+=dt;S.bgT+=dt;if(S.bannerT>0)S.bannerT-=dt;
  if(S.endT>=0){S.endT-=dt;if(S.endT<0)end(api,S.win);}
  if(S.done||S.cards)return;
  if(S.dead)return;
  if(p.inv>0)p.inv-=dt;if(p.cd>0)p.cd-=dt;if(p.rcd>0)p.rcd-=dt;if(p.hitFlash>0)p.hitFlash-=dt;if(p.swing>0)p.swing-=dt;if(p.comboT>0)p.comboT-=dt;
  // fade transition
  if(S.fadeDir!==0){S.fade+=S.fadeDir*dt*6;if(S.fadeDir>0&&S.fade>=1){const t=S.pend;S.pend=null;enterRoom(api,t.ri,t.from);S.fadeDir=-1;}else if(S.fadeDir<0&&S.fade<=0){S.fade=0;S.fadeDir=0;}return;}
  // input
  let ax=0,ay=0;const k=S.keys;if(k.ArrowLeft||k.a)ax-=1;if(k.ArrowRight||k.d)ax+=1;if(k.ArrowUp||k.w)ay-=1;if(k.ArrowDown||k.s)ay+=1;
  if(!ax&&!ay&&api.stick&&Math.hypot(api.stick.x,api.stick.y)>.2){ax=api.stick.x;ay=api.stick.y;}
  let l=Math.hypot(ax,ay);if(l>1){ax/=l;ay/=l;l=1;}
  if(S.ptr&&!ax&&!ay&&S.ptr.hold>.2){const dx=S.ptr.x-p.x,dy=S.ptr.y-p.y,d=Math.hypot(dx,dy);if(d>16){ax=dx/d;ay=dy/d;}}
  if(S.ptr)S.ptr.hold+=dt;
  if(l>.05){p.fx=ax/Math.max(l,.001);p.fy=ay/Math.max(l,.001);const ll=Math.hypot(p.fx,p.fy)||1;p.fx/=ll;p.fy/=ll;}
  if(p.roll>0){p.roll-=dt;moveEnt(p,p.rdx*400*dt,p.rdy*400*dt);if(Math.random()<.5)api.burst(p.x,p.y+10,'#cfc0d8',1);}
  else{p.vx+=ax*2200*dt;p.vy+=ay*2200*dt;const sp=Math.hypot(p.vx,p.vy),mx=170;if(sp>mx&&p.swing<=0){p.vx*=mx/sp;p.vy*=mx/sp;}if(!ax)p.vx*=Math.exp(-12*dt);if(!ay)p.vy*=Math.exp(-12*dt);if(p.swing>0){p.vx*=Math.exp(-9*dt);p.vy*=Math.exp(-9*dt);}
   moveEnt(p,(p.vx+p.kb.x)*dt,(p.vy+p.kb.y)*dt);p.kb.x*=Math.exp(-10*dt);p.kb.y*=Math.exp(-10*dt);}
  // room exits
  let ex=null;if(p.y<12)ex={d:-3,from:'s'};else if(p.y>RH-12)ex={d:3,from:'n'};else if(p.x<12)ex={d:-1,from:'e'};else if(p.x>RW-12)ex={d:1,from:'w'};
  if(ex&&S.fadeDir===0){const nr=S.ri+ex.d;if(nr>=0&&nr<9){S.pend={ri:nr,from:ex.from};S.fadeDir=1;S.fade=0;}else{p.x=cl(p.x,10,RW-10);p.y=cl(p.y,10,RH-10);}}
  p.x=cl(p.x,8,RW-8);p.y=cl(p.y,8,RH-8);
  updateRoom(api,dt);updateEnts(api,dt);
  // projectiles
  for(let i=S.proj.length-1;i>=0;i--){const q=S.proj[i];q.life-=dt;let rm=q.life<=0;
   if(q.rock){q.t+=dt;if(q.t>=.9){S.fx.push({x:q.tx,y:q.ty,r:50,t:.3,max:.3,c:'#ffb060'});api.shake(6,.2);if(Math.hypot(p.x-q.tx,p.y-q.ty)<50)hurtPl(api,1,q.tx,q.ty);rm=true;}}
   else{q.x+=q.vx*dt;q.y+=q.vy*dt;if(solidAt(q.x,q.y))rm=true;
    if(q.friendly){for(const e of S.ents){if(!e.dead&&Math.hypot(e.x-q.x,e.y-q.y)<e.r+q.r){e.hp-=2;e.fl=.12;if(e.hp<=0)killEnt(api,e);rm=true;break;}}}
    else if(Math.hypot(q.x-p.x,q.y-p.y)<q.r+p.r){hurtPl(api,1,q.x,q.y);rm=true;}}
   if(rm)S.proj.splice(i,1);}
  for(let i=S.fx.length-1;i>=0;i--){S.fx[i].t-=dt;if(S.fx[i].t<=0)S.fx.splice(i,1);}
  // items
  for(let i=S.items.length-1;i>=0;i--){const it=S.items[i];if(Math.hypot(it.x-p.x,it.y-p.y)<24){
   if(it.k==='coin'){api.addScore(1);S.coins++;api.sound(900,.05,'sine',.04);}else if(it.k==='heart'){if(p.hp<p.max){p.hp++;api.popText('+1 HEART',it.x,it.y-14,'#ef6a8a');}else api.addScore(2);sfx(api,'power');}
   else if(it.k==='shard'){S.shards[it.i]=true;api.addScore(50,it.x,it.y-24,SH_COL[it.i]);api.burst(it.x,it.y,SH_COL[it.i],30);api.shake(8,.4);sfx(api,'win');S.banner='MOONSHARD '+S.shards.filter(Boolean).length+'/3';S.sub=S.shards.every(Boolean)?'The Moon Gate is open!':'';S.bannerT=1.6;if(S.shards.every(Boolean))api.achieve('shards','Shard Bearer',6);}
   S.items.splice(i,1);}}
 },
 draw(c,api){
  if(!S)return;const W=api.W,H=api.H,por=api.portrait;
  N.bgGrad(c,W,H,['#140c24','#241638']);
  const z=por?W/RW:Math.min(1,(H-40)/RH),ox=(W-RW*z)/2,oy=por?96+(H-96-RH*z)/2:(H-RH*z)/2+14;
  c.save();c.translate(ox,oy);c.scale(z,z);c.drawImage(S.bake[S.ri],0,0);
  const ri=S.ri,st=S.cur;
  // locked doors / gate sockets
  if(S.lockDoors){c.fillStyle='rgba(120,90,160,.7)';const D=doorsOf(ri);const bars=(x,y,w,h)=>{c.fillRect(x,y,w,h);};if(D.n)bars(7*TS,0,2*TS,10);if(D.s)bars(7*TS,RH-10,2*TS,10);if(D.w)bars(0,5*TS,10,2*TS);if(D.e)bars(RW-10,5*TS,10,2*TS);}
  if(ri===4){const open=S.shards.every(Boolean);c.save();N.glow(c,RW/2,8,60,open?'#ffe08a':'#8a6a9a',.5);for(let i=0;i<3;i++){const x=RW/2-30+i*30;c.fillStyle=S.shards[i]?SH_COL[i]:'#3a2c4a';c.beginPath();c.moveTo(x,6);c.lineTo(x+7,16);c.lineTo(x,26);c.lineTo(x-7,16);c.closePath();c.fill();c.strokeStyle='rgba(30,16,34,.8)';c.lineWidth=2;c.stroke();}if(!open){c.fillStyle='rgba(90,60,120,.65)';c.fillRect(7*TS,0,2*TS,TS*.5);}c.restore();}
  if(ri===0&&st.plates)st.plates.forEach((pl,i)=>{const lit=st.lit===i||pl.on;c.save();if(lit)N.glow(c,pl.x,pl.y,60,['#7fb8e8','#e08ac0','#f2ce77'][i],.8);N.slab(c,pl.x-24,pl.y-14,48,28,10,lit?N.shade(['#7fb8e8','#e08ac0','#f2ce77'][i],.2):'#4a3c5a',{depth:3});T(c,String(i+1),pl.x,pl.y+6,16,'#fff0d4','center',{stroke:null});c.restore();});
  if(ri===8&&st.chest){const ch=st.chest;c.save();N.shadow(c,ch.x,ch.y+20,30,8,.4);N.slab(c,ch.x-26,ch.y-14,52,34,8,'#b8783a',{depth:4});N.slab(c,ch.x-26,ch.y-26,52,16,8,ch.open?'#e8b060':'#c88848',{depth:2,shadow:false});c.fillStyle='#ffd870';c.fillRect(ch.x-4,ch.y-10,8,10);if(!ch.open)N.glow(c,ch.x,ch.y,50,'#ffd870',.35);c.restore();}
  for(const it of S.items){const y=it.y+Math.sin(S.t*4+it.x)*3;if(it.k==='shard'){N.glow(c,it.x,y,50,SH_COL[it.i],.7);c.fillStyle=SH_COL[it.i];c.beginPath();c.moveTo(it.x,y-16);c.lineTo(it.x+10,y);c.lineTo(it.x,y+16);c.lineTo(it.x-10,y);c.closePath();c.fill();c.strokeStyle='rgba(30,16,34,.8)';c.lineWidth=2.5;c.stroke();c.fillStyle='rgba(255,255,255,.6)';c.beginPath();c.moveTo(it.x-2,y-10);c.lineTo(it.x+3,y-2);c.lineTo(it.x-2,y+2);c.fill();}
   else if(it.k==='heart')heart(c,it.x,y,12,'#ef6a6a',true);else{c.fillStyle='#ffd860';c.beginPath();c.arc(it.x,y,6,0,TAU);c.fill();c.strokeStyle='rgba(60,30,10,.7)';c.lineWidth=2;c.stroke();}}
  const all=S.ents.filter(e=>!e.dead).concat([{y:S.pl.y,hero:1}]).sort((a,b)=>a.y-b.y);
  for(const e of all){if(e.hero)drawHero(c,S.pl,api);else drawEnt(c,e,api);}
  for(const q of S.proj){if(q.rock){const k=q.t/.9;c.fillStyle='rgba(255,90,70,'+(.15+.2*k)+')';c.beginPath();c.arc(q.tx,q.ty,50,0,TAU);c.fill();c.strokeStyle='rgba(255,120,90,.8)';c.lineWidth=3;c.stroke();c.fillStyle='#8a6a78';c.beginPath();c.arc(q.tx,q.ty-(1-k)*220,18,0,TAU);c.fill();}
   else{N.glow(c,q.x,q.y,14,q.friendly?'#ffe08a':'#ff6a8a',.8);c.fillStyle=q.friendly?'#fff6c0':'#ffc0d0';c.beginPath();c.arc(q.x,q.y,q.r*.7,0,TAU);c.fill();}}
  for(const f of S.fx){const k=1-f.t/f.max;c.save();c.globalAlpha=1-k;c.strokeStyle=f.c;c.lineWidth=7*(1-k)+1;c.beginPath();c.arc(f.x,f.y,f.r*k,0,TAU);c.stroke();c.restore();}
  c.restore();
  if(S.fade>0){c.fillStyle='rgba(10,6,20,'+S.fade+')';c.fillRect(0,0,W,H);}
  if(api.running){drawHUD(c,api);if(S.cards)drawCards(c,api);}
  N.vignette(c,W,H,.4);
  if(!api.running){readyScreen(c,api,'MOONSHARD LEGEND','Explore the ancient moon ruins. Win three Moonshards from the Rune Vault, the Gauntlet and the Stone Guardian, then open the Moon Gate and defeat the Moon Warden.',[
   'Move: WASD / arrows (or stick). Slash: Space/Z - chain 3 hits for a heavy finisher. Roll: Shift/X (invulnerable).','Slimes chase, archers shoot telegraphed arrows, knights block from the front - get behind them.','Rune Vault: step on runes in the glowing order. Gauntlet: survive 3 waves.','Treasury chest grants an upgrade. The map shows visited rooms.'],PAL.gold,
   'BEST '+(api.store.get('top',[])[0]||0)+' · MOST SHARDS '+api.store.get('stage',0)+'/3');}
 },
 keydown(e,api){const k=e.key,lk=k.length===1?k.toLowerCase():k;S.keys[lk]=true;
  if(S.cards){if(['1','2','3'].includes(k))applyCard(api,+k-1);return;}
  if(k===' '||lk==='z')attack(api);else if(k==='Shift'||lk==='x'||lk==='c')roll(api,S.keys.ArrowRight||S.keys.d?1:S.keys.ArrowLeft||S.keys.a?-1:0,S.keys.ArrowDown||S.keys.s?1:S.keys.ArrowUp||S.keys.w?-1:0);},
 keyup(e,api){const k=e.key,lk=k.length===1?k.toLowerCase():k;S.keys[lk]=false;},
 pointerdown(x,y,e,api){
  if(S.cards){(S.cr||[]).forEach((cd,i)=>{if(x>=cd.x&&x<=cd.x+cd.w&&y>=cd.y&&y<=cd.y+cd.h)applyCard(api,i);});return;}
  const z=api.portrait?api.W/RW:Math.min(1,(api.H-40)/RH),ox=(api.W-RW*z)/2,oy=api.portrait?96+(api.H-96-RH*z)/2:(api.H-RH*z)/2+14;
  const wx=(x-ox)/z,wy=(y-oy)/z;S.ptr={x:wx,y:wy,hold:0,sx:wx,sy:wy};if(!api.touch){attack(api,wx-S.pl.x,wy-S.pl.y);S.ptr=null;}},
 pointermove(x,y,e,api){if(S.ptr){const z=api.portrait?api.W/RW:Math.min(1,(api.H-40)/RH),ox=(api.W-RW*z)/2,oy=api.portrait?96+(api.H-96-RH*z)/2:(api.H-RH*z)/2+14;S.ptr.x=(x-ox)/z;S.ptr.y=(y-oy)/z;}},
 pointerup(x,y,e,api){if(S.ptr&&S.ptr.hold<.2)attack(api,S.ptr.x-S.pl.x,S.ptr.y-S.pl.y);S.ptr=null;},
 timeUp(api){S.win=false;end(api,false);}
});
})();

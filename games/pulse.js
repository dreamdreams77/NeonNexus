/* games/pulse.js — Neon Nexus cabinet module */
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
/* ===== PULSE RUNNER ===== */
const TS=40,ROWS=12;
const CH={
 start:['.P............','##############','##############'],
 flat:['...o.o.o.o....','##############','##############'],
 enemy:['....o....o....','......p.......','##############','##############'],
 gap:['..............','......ooo.....','######...#####','######...#####'],
 plat:['..............','.....o.o......','.....=.=......','.o..........o.','..===....===..','..............','##############','##############'],
 stairs:['..........ooo.','.........####.','......#######.','...o.#########','..############','##############','##############'],
 spikes:['..............','..o.o.o.o.o...','.===.===.===..','..............','...^^.^^.^^...','##############','##############'],
 turret:['..............','..........t...','..o......####.','.##....o......','.##...###.....','##############','##############'],
 flyer:['......f.......','...o....o.....','.....=.=......','..........f...','.o..=...=...o.','##############','##############'],
 power:['..........','..S.D.H...'],
 check:['.......c......','##############','##############'],
 bigpit:['..............','..o...o...o...','.=...=...=....','..............','#######....###','#######....###'],
 end:['............E.','.........#####','.....o.o.#####','..#####..#####','##############','##############'],
 arena:['..............','..............','..............','..............','...........B..','..............','..............','..............','##############','##############']
};
function chunkRows(name){const r=CH[name].slice();while(r.length<ROWS)r.unshift('.'.repeat(14));return r;}
const LEVELS=[
 {n:'FOUNDRY GATE',seq:['start','flat','enemy','gap','plat','check','stairs','enemy','gap','flat','end'],hue:'#ef896d'},
 {n:'COOLANT TUNNELS',seq:['start','flat','spikes','flyer','gap','check','turret','plat','spikes','bigpit','turret','end'],hue:'#7fb8e8'},
 {n:'REACTOR CORE',seq:['start','flyer','turret','bigpit','check','spikes','enemy','turret','flyer','gap','arena','arena'],hue:'#e08ac0'}];
let S=null;
function buildLevel(li){
 const L=LEVELS[li],rows=Array.from({length:ROWS},()=>[]);
 L.seq.forEach((n,i)=>{const cr=chunkRows(n);for(let r=0;r<ROWS;r++)rows[r].push(...cr[r].padEnd(14,'.').slice(0,14).split(''));});
 // power-ups placed on chunk ('power' merged into level 1/2 stairs area)
 const W=rows[0].length,ents=[],g=[];let spawn={x:60,y:300};
 for(let r=0;r<ROWS;r++){g.push(new Uint8Array(W));for(let x=0;x<W;x++){const ch=rows[r][x];
  if(ch==='#')g[r][x]=1;else if(ch==='=')g[r][x]=2;else if(ch==='^')g[r][x]=3;
  else if(ch==='o')ents.push({k:'cell',x:x*TS+20,y:r*TS+20,t:Math.random()*6});
  else if(ch==='p')ents.push({k:'patrol',x:x*TS+20,y:r*TS+20,vx:-60,hp:2,w:32,h:28,vy:0,dead:0,fl:0});
  else if(ch==='f')ents.push({k:'flyer',x:x*TS+20,y:r*TS+20,y0:r*TS+20,hp:1,w:30,h:26,dead:0,t:Math.random()*6,fl:0,ax:x*TS});
  else if(ch==='t')ents.push({k:'turret',x:x*TS+20,y:r*TS+24,hp:3,w:34,h:30,dead:0,cd:1+Math.random(),fl:0,aim:0});
  else if(ch==='c')ents.push({k:'check',x:x*TS+20,y:r*TS+20,on:0});
  else if(ch==='S'||ch==='D'||ch==='H')ents.push({k:'pow',p:ch,x:x*TS+20,y:r*TS+20,t:0});
  else if(ch==='E')ents.push({k:'exit',x:x*TS+20,y:r*TS+20});
  else if(ch==='B')ents.push({k:'bossSpawn',x:x*TS,y:10*TS-55});
  else if(ch==='P')spawn={x:x*TS+20,y:r*TS+4};}}
 // sprinkle a power-up per level mid-way on a floor
 const mid=Math.floor(W*.45);for(let x=mid;x<W-4;x++){let fr=-1;for(let r=0;r<ROWS;r++)if(g[r][x]===1){fr=r;break;}if(fr>3&&g[fr-1][x]===0&&g[fr-2][x]===0){ents.push({k:'pow',p:li===0?'D':li===1?'S':'H',x:x*TS+20,y:(fr-1)*TS+20,t:0});break;}}
 return{g,W,ents,spawn,name:L.n,hue:L.hue,len:W*TS};
}
function tileAt(x,y){const c=Math.floor(x/TS),r=Math.floor(y/TS);if(c<0||c>=S.lv.W)return 1;if(r<0)return 0;if(r>=ROWS)return 0;return S.lv.g[r][c];}
function newState(api){
 const m=api.mastery,hp=3+(m>=2?1:0);
 S={li:0,lv:null,pl:{x:60,y:300,vx:0,vy:0,w:24,h:34,on:false,co:0,jb:0,face:1,inv:0,hp,max:hp,dj:m>=4?1:0,djUsed:false,shoot:0,spread:false,t:0,anim:0,sq:0,hold:0},lives:3+(m>=6?1:0),ents:[],bul:[],eb:[],cam:0,camY:0,ck:null,keys:{},phase:'idle',bannerT:0,banner:'',sub:'',boss:null,t:0,cells:0,kills:0,dead:false,endT:-1,win:false,done:false,best:0,combo:0,comboT:0,bgT:0,deaths:0,fire:false,fl:0,hit:0,dmgTaken:0,shock:[],debris:[],pwTxt:''};
}
function loadLevel(api,li){
 S.li=li;S.lv=buildLevel(li);S.ents=S.lv.ents;S.bul.length=0;S.eb.length=0;S.boss=null;S.shock.length=0;S.debris.length=0;S.ck=null;
 const p=S.pl;p.x=S.lv.spawn.x;p.y=S.lv.spawn.y;p.vx=p.vy=0;p.hp=p.max;p.inv=1;
 S.banner='LEVEL '+(li+1)+' · '+S.lv.name;S.sub=li===2?'Reach the reactor guardian':li===1?'Spikes, drones and turrets':'Run, jump and shoot';S.bannerT=1.8;sfx(api,'ping');
 if(li>api.store.get('stage',0))api.store.set('stage',li);
}
function respawn(api){
 const p=S.pl;S.lives--;S.deaths++;S.combo=0;
 if(S.lives<=0){S.dead=true;S.endT=1.4;S.win=false;sfx(api,'lose');api.burst(p.x,p.y,'#ffb060',30);return;}
 const c=S.ck||S.lv.spawn;p.x=c.x;p.y=c.y-6;p.vx=p.vy=0;p.hp=p.max;p.inv=1.8;sfx(api,'lose');api.shake(10,.3);api.popText('LIFE LOST',p.x,p.y-30,'#ff8a6a');
 if(S.boss){S.boss.hp=Math.min(S.boss.max,S.boss.hp+3);}
}
function hurt(api,d,fx){
 const p=S.pl;if(p.inv>0||S.dead)return;p.hp-=d||1;p.inv=1.3;p.vy=-260;p.vx=(p.x<fx?-1:1)*200;S.dmgTaken++;api.shake(8,.25);sfx(api,'bump');api.burst(p.x,p.y,'#ff8a6a',10);
 if(p.hp<=0)respawn(api);
}
function shoot(api){
 const p=S.pl;if(p.shoot>0||S.dead)return;p.shoot=.2;const n=p.spread?3:1,pierce=api.mastery>=6;
 for(let i=0;i<n;i++){const a=(i-(n-1)/2)*.16;S.bul.push({x:p.x+p.face*16,y:p.y-4,vx:Math.cos(a)*p.face*620,vy:Math.sin(a)*620,life:.8,pierce});}
 sfx(api,'shot');p.sq=.08;
}
function jump(api){const p=S.pl;if(S.dead)return;p.jb=.12;}
function killEnt(api,e,pts){
 e.dead=1;S.kills++;S.combo++;S.comboT=3;S.best=Math.max(S.best,S.combo);api.combo=S.combo;api.addScore(Math.round(pts*(1+Math.min(1,S.combo*.1))),e.x,e.y-20,'#fff0d4');api.burst(e.x,e.y,'#ffb060',14);sfx(api,'pop');api.shake(3,.1);
 if(S.kills===10)api.achieve('kills','Bot Breaker',4);
}
function solidRect(x,y,w,h){return tileAt(x-w/2,y-h/2)===1||tileAt(x+w/2,y-h/2)===1||tileAt(x-w/2,y+h/2-1)===1||tileAt(x+w/2,y+h/2-1)===1;}
function moveBody(b,dt,oneWay){
 // x
 b.x+=b.vx*dt;if(solidRect(b.x,b.y,b.w,b.h)){b.x-=b.vx*dt;b.hitX=true;b.vx=0;}else b.hitX=false;
 // y
 const py=b.y;b.y+=b.vy*dt;b.on=false;
 const hw=b.w/2,hh=b.h/2;
 if(b.vy>=0){const by=b.y+hh;for(const sx of[-hw+2,0,hw-2]){const t=tileAt(b.x+sx,by);if(t===1||(t===2&&py+hh<=Math.floor(by/TS)*TS+4&&oneWay!==false)){b.y=Math.floor(by/TS)*TS-hh;b.vy=0;b.on=true;break;}}}
 else{const ty=b.y-hh;for(const sx of[-hw+2,hw-2]){if(tileAt(b.x+sx,ty)===1){b.y=(Math.floor(ty/TS)+1)*TS+hh;b.vy=0;break;}}}
}
function spawnBoss(api,sp){
 const hp=Math.round(20*Math.pow(api.diff.mul,.8));
 S.boss={x:sp.x,y:sp.y,w:96,h:110,hp,max:hp,t:0,mode:'enter',tt:1,open:false,shield:true,cd:2,fl:0,phase:1,vy:0};S.bannerT=1.6;S.banner='REACTOR GUARDIAN';S.sub='Shoot its core while the shield is open';api.shake(10,.5);sfx(api,'boom');
}
function end(api,win){if(S.done)return;S.done=true;topScores(api,api.score);
 if(win&&S.deaths===0)api.achieve('deathless','Zero Deaths',10);if(win)api.achieve('clear','Reactor Hero',10);if(S.cells>=60)api.achieve('cells','Cell Collector',4);
 api.finish(win,{grade:gradeOf(cl(api.score/420,0,1),win)+' · LEVEL '+(S.li+1),combo:S.best});}
/* ---------- drawing ---------- */
const TCACHE={};
function tileSprite(kind,hue){const k=kind+hue;let c=TCACHE[k];if(c)return c;c=document.createElement('canvas');c.width=TS;c.height=TS;const g=c.getContext('2d');
 if(kind==='solid'){const gr=g.createLinearGradient(0,0,0,TS);gr.addColorStop(0,'#7a5a68');gr.addColorStop(.5,'#5a3e52');gr.addColorStop(1,'#3e2a3c');g.fillStyle=gr;N.rr(g,1,1,TS-2,TS-2,7);g.fill();g.strokeStyle='rgba(20,10,28,.65)';g.lineWidth=2.5;g.stroke();g.fillStyle='rgba(255,255,255,.22)';N.rr(g,5,4,TS-10,5,3);g.fill();g.fillStyle=hue;g.globalAlpha=.55;g.fillRect(6,TS-9,TS-12,3);g.globalAlpha=1;for(const[x,y]of[[8,16],[TS-9,16],[8,TS-14],[TS-9,TS-14]]){g.fillStyle='rgba(20,10,28,.4)';g.beginPath();g.arc(x,y,2.2,0,TAU);g.fill();g.fillStyle='rgba(255,255,255,.35)';g.beginPath();g.arc(x-.7,y-.7,.9,0,TAU);g.fill();}}
 else if(kind==='top'){const gr=g.createLinearGradient(0,0,0,TS);gr.addColorStop(0,'#9a7a88');gr.addColorStop(.18,'#6a4a5e');gr.addColorStop(1,'#3e2a3c');g.fillStyle=gr;N.rr(g,1,1,TS-2,TS-2,7);g.fill();g.strokeStyle='rgba(20,10,28,.65)';g.lineWidth=2.5;g.stroke();g.fillStyle=hue;N.rr(g,2,1,TS-4,8,4);g.fill();g.fillStyle='rgba(255,255,255,.4)';N.rr(g,6,2.5,TS-12,3,2);g.fill();}
 else if(kind==='plat'){g.fillStyle='#8a6a78';N.rr(g,0,2,TS,12,5);g.fill();g.strokeStyle='rgba(20,10,28,.65)';g.lineWidth=2.5;g.stroke();g.fillStyle=hue;g.globalAlpha=.7;g.fillRect(4,4,TS-8,3);g.globalAlpha=1;g.fillStyle='rgba(255,255,255,.3)';g.fillRect(5,3,TS-10,2);}
 else if(kind==='spike'){g.fillStyle='#d0d4e0';for(let i=0;i<3;i++){const x=i*13+1;g.beginPath();g.moveTo(x,TS);g.lineTo(x+6.5,TS-26);g.lineTo(x+13,TS);g.closePath();g.fill();g.strokeStyle='rgba(20,10,28,.7)';g.lineWidth=2;g.stroke();g.fillStyle='rgba(255,255,255,.55)';g.beginPath();g.moveTo(x+4,TS-4);g.lineTo(x+6.5,TS-22);g.lineTo(x+7,TS-4);g.fill();g.fillStyle='#d0d4e0';}}
 TCACHE[k]=c;return c;
}
function bgLayer(c,api){
 const W=api.W,H=api.H,hue=S.lv?S.lv.hue:'#ef896d';
 const base=bgCache('pu'+hue+W+'x'+H,W,H,(g,w,h)=>{N.bgGrad(g,w,h,['#150c1e','#2c1a36','#4a2438','#6a3030']);
  const gr=g.createRadialGradient(w*.5,h*1.02,10,w*.5,h,h*.9);gr.addColorStop(0,hue+'aa');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(0,0,w,h);});
 c.drawImage(base,0,0);
 // parallax chimneys + gears (cheap)
 const cx=S.cam;
 c.fillStyle='rgba(20,8,26,.5)';for(let i=0;i<8;i++){const x=((i*260-cx*.2)%(W+300)+W+300)%(W+300)-100,hh=120+(i*53)%110;c.fillRect(x,H*.72-hh,46,hh);c.fillRect(x-6,H*.72-hh,58,12);}
 c.fillStyle='rgba(60,28,44,.55)';for(let i=0;i<7;i++){const x=((i*210-cx*.4)%(W+300)+W+300)%(W+300)-100;const r=40+(i%3)*14;c.save();c.translate(x,H*.35+(i%2)*60);c.rotate(S.bgT*(i%2?.3:-.3));c.beginPath();for(let k=0;k<20;k++){const rr=k%2?r*.85:r;c.lineTo(Math.cos(k*Math.PI/10)*rr,Math.sin(k*Math.PI/10)*rr);}c.fill();c.restore();}
 // pipes
 c.fillStyle='rgba(90,50,60,.55)';c.fillRect(0,H*.18,W,14);c.fillStyle='rgba(255,255,255,.08)';c.fillRect(0,H*.18+2,W,3);
}
function worldTransform(c,api){const z=api.portrait?.88:1,oy=api.portrait?(api.H-ROWS*TS*z)/2+30:(api.H-ROWS*TS)/2;return{z,oy};}
function drawRobot(c,p,api){
 const t=S.t,run=Math.abs(p.vx)>20&&p.on,sqy=1+(p.sq>0?-.12:0)+(p.on?0:cl(-p.vy/2500,-.08,.12));
 if(p.inv>0&&Math.floor(t*20)%2&&!S.dead)return;
 c.save();c.translate(p.x,p.y+p.h/2);c.scale(p.face*(1/sqy),sqy);
 N.shadow(c,0,2,15,5,.35);
 const bob=run?Math.sin(t*18)*2:0;
 // legs
 c.fillStyle='#5a4a6a';for(const s of[-1,1]){const lg=run?Math.sin(t*18+(s>0?0:Math.PI))*5:0;N.rr(c,s*6-4+lg*.4,-10,8,10,3);c.fill();c.strokeStyle='rgba(20,10,28,.7)';c.lineWidth=2;c.stroke();}
 // jetpack
 c.fillStyle='#8a7a98';N.rr(c,-17,-30,9,18,4);c.fill();c.stroke();if(!p.on){const f=8+Math.sin(t*50)*3;c.fillStyle='#ffb050';c.beginPath();c.moveTo(-16,-12);c.lineTo(-12.5,-12+f);c.lineTo(-9,-12);c.fill();}
 // body
 N.blob(c,0,-17+bob,13.5,'#e8a890',3,{shadow:false});
 // head / visor
 c.fillStyle='#d8c8e8';N.rr(c,-11,-42+bob,22,18,8);c.fill();c.stroke();c.fillStyle='#1a1226';N.rr(c,-8,-39+bob,16,10,5);c.fill();c.fillStyle=S.pl.hp<=1?'#ff6a5a':'#7affd8';c.beginPath();c.arc(-3,-34+bob,2.2,0,TAU);c.arc(4,-34+bob,2.2,0,TAU);c.fill();
 c.strokeStyle='#8a7a98';c.lineWidth=2.5;c.beginPath();c.moveTo(0,-42+bob);c.lineTo(2,-49+bob);c.stroke();c.fillStyle='#ef896d';c.beginPath();c.arc(2,-50+bob,3,0,TAU);c.fill();
 // arm cannon
 c.fillStyle='#7a6a8a';N.rr(c,6,-24+bob,16,8,4);c.fill();c.stroke();if(p.shoot>.12){N.glow(c,23,-20+bob,16,'#ffd070',.9);}
 c.fillStyle='rgba(255,255,255,.5)';c.beginPath();c.ellipse(-5,-24+bob,3,5,-.5,0,TAU);c.fill();
 c.restore();
}
function drawEnt(c,e,api){
 if(e.dead)return;const t=S.t;
 if(e.k==='cell'){c.save();c.translate(e.x,e.y+Math.sin(t*4+e.t)*3);N.glow(c,0,0,18,'#ffe08a',.45);c.fillStyle='#ffd860';c.beginPath();c.arc(0,0,7,0,TAU);c.fill();c.strokeStyle='rgba(60,30,10,.7)';c.lineWidth=2;c.stroke();c.fillStyle='#fff6c0';c.beginPath();c.arc(-2,-2,2.5,0,TAU);c.fill();c.restore();}
 else if(e.k==='patrol'){c.save();c.translate(e.x,e.y+e.h/2);c.scale(e.vx<0?-1:1,1);N.shadow(c,0,0,17,5,.3);
  const w=Math.sin(t*10+e.x)*2;c.fillStyle='#4a3a5a';for(const s of[-1,1]){c.fillRect(s*9-3,-5,6,5+w*s);}
  N.blob(c,0,-14,16,'#d0584e',(e.x|0)%7+1,{shadow:false,sy:.9});
  c.fillStyle='#fff';c.beginPath();c.arc(6,-17,5,0,TAU);c.fill();c.fillStyle='#1a1226';c.beginPath();c.arc(7.5,-17,2.4,0,TAU);c.fill();c.strokeStyle='#1a1226';c.lineWidth=2.5;c.beginPath();c.moveTo(1,-24);c.lineTo(11,-21);c.stroke();c.fillStyle='rgba(255,255,255,.4)';c.beginPath();c.ellipse(-6,-24,4,2.5,-.4,0,TAU);c.fill();
  if(e.fl>0){c.globalAlpha=e.fl*5;c.fillStyle='#fff';c.fill();}c.restore();}
 else if(e.k==='flyer'){c.save();c.translate(e.x,e.y+Math.sin(t*4+e.t)*4);N.shadow(c,0,28,10,3,.15);
  c.strokeStyle='#cfe0ff';c.lineWidth=3;c.beginPath();c.moveTo(-14,-12);c.lineTo(14,-12);c.stroke();c.save();c.translate(0,-12);c.scale(Math.cos(t*40),1);c.strokeStyle='rgba(220,235,255,.8)';c.lineWidth=3;c.beginPath();c.moveTo(-16,0);c.lineTo(16,0);c.stroke();c.restore();
  const g=c.createRadialGradient(-3,-4,2,0,0,15);g.addColorStop(0,'#c8e8ff');g.addColorStop(.6,'#5a9ad8');g.addColorStop(1,'#2a4a88');c.fillStyle=g;c.beginPath();c.ellipse(0,0,15,12,0,0,TAU);c.fill();c.strokeStyle='rgba(20,16,40,.7)';c.lineWidth=2.5;c.stroke();c.fillStyle='#ff6a5a';c.beginPath();c.arc(0,1,5,0,TAU);c.fill();c.fillStyle='#fff';c.beginPath();c.arc(-1.5,-.5,1.6,0,TAU);c.fill();
  if(e.fl>0){c.globalAlpha=e.fl*5;c.fillStyle='#fff';c.beginPath();c.ellipse(0,0,15,12,0,0,TAU);c.fill();}c.restore();}
 else if(e.k==='turret'){c.save();c.translate(e.x,e.y+e.h/2);N.shadow(c,0,0,18,5,.3);
  const g=c.createLinearGradient(0,-26,0,0);g.addColorStop(0,'#c0b0d0');g.addColorStop(1,'#6a5a80');c.fillStyle=g;N.rr(c,-17,-18,34,18,6);c.fill();c.strokeStyle='rgba(30,16,34,.7)';c.lineWidth=2.5;c.stroke();
  c.save();c.translate(0,-18);c.rotate(e.aim);c.fillStyle='#4a3a5a';N.rr(c,-4,-4,24,8,3);c.fill();c.stroke();c.restore();
  c.fillStyle='#ef896d';c.beginPath();c.arc(0,-18,8,0,TAU);c.fill();c.stroke();c.fillStyle=e.cd<.4?'#ffe0a0':'#7a3a3a';c.beginPath();c.arc(0,-18,3.2,0,TAU);c.fill();
  if(e.fl>0){c.globalAlpha=e.fl*5;c.fillStyle='#fff';N.rr(c,-17,-18,34,18,6);c.fill();}c.restore();}
 else if(e.k==='check'){c.save();c.translate(e.x,e.y);c.strokeStyle='#8a7a98';c.lineWidth=4;c.beginPath();c.moveTo(0,20);c.lineTo(0,-16);c.stroke();c.fillStyle=e.on?'#7affd8':'#ef896d';if(e.on)N.glow(c,6,-10,22,'#7affd8',.6);c.beginPath();c.moveTo(0,-16);c.lineTo(18,-10+Math.sin(t*5)*1.5);c.lineTo(0,-4);c.fill();c.strokeStyle='rgba(30,16,34,.7)';c.lineWidth=2;c.stroke();c.restore();}
 else if(e.k==='pow'){c.save();c.translate(e.x,e.y+Math.sin(t*3)*3);const col={S:'#ef896d',D:'#7fb8e8',H:'#ef6a8a'}[e.p];N.glow(c,0,0,26,col,.6);N.ball(c,0,0,13,col,{shadow:false});c.fillStyle='#fff';c.font='900 14px Fredoka, sans-serif';c.textAlign='center';c.fillText(e.p==='H'?'+':e.p,0,5);c.restore();}
 else if(e.k==='exit'){c.save();c.translate(e.x,e.y);const g=c.createRadialGradient(0,0,2,0,0,30);g.addColorStop(0,'#fff6c0');g.addColorStop(1,'rgba(255,200,100,0)');c.fillStyle=g;c.beginPath();c.arc(0,0,30+Math.sin(t*5)*3,0,TAU);c.fill();c.fillStyle='#2a1a3a';N.rr(c,-14,-26,28,50,12);c.fill();c.strokeStyle='#ffd070';c.lineWidth=3;c.stroke();c.fillStyle='#ffd070';c.font='700 11px Fredoka, sans-serif';c.textAlign='center';c.fillText('EXIT',0,-6);c.restore();}
}
function drawBoss(c,b){
 c.save();c.translate(b.x,b.y);N.shadow(c,0,b.h/2,60,10,.4);
 const g=c.createLinearGradient(-48,0,48,0);g.addColorStop(0,'#5a3e52');g.addColorStop(.5,'#9a7a8e');g.addColorStop(1,'#4a2e44');c.fillStyle=g;N.rr(c,-46,-b.h/2+14,92,b.h-14,22);c.fill();c.strokeStyle='rgba(20,10,28,.7)';c.lineWidth=4;c.stroke();
 // horns/vents
 c.fillStyle='#6a4a62';for(const s of[-1,1]){c.beginPath();c.moveTo(s*30,-b.h/2+20);c.lineTo(s*50,-b.h/2-8);c.lineTo(s*14,-b.h/2+14);c.fill();c.stroke();}
 c.fillStyle='rgba(255,255,255,.2)';N.rr(c,-38,-b.h/2+20,76,8,4);c.fill();
 // eyes
 c.fillStyle='#1a1226';N.rr(c,-34,-b.h/2+34,68,20,8);c.fill();c.fillStyle=b.open?'#7affd8':'#ff6a4a';for(const s of[-1,1]){c.beginPath();c.arc(s*16,-b.h/2+44,6,0,TAU);c.fill();}
 // core
 const cy=8;N.glow(c,0,cy,b.open?70:36,b.open?'#7affd8':'#ff6a4a',b.open?.9:.4);c.fillStyle=b.open?'#e8fff6':'#4a2a3a';c.beginPath();c.arc(0,cy,18,0,TAU);c.fill();c.strokeStyle='rgba(20,10,28,.8)';c.lineWidth=3;c.stroke();
 if(!b.open){c.fillStyle='#8a7a98';c.beginPath();c.arc(0,cy,19,Math.PI,0);c.fill();c.beginPath();c.arc(0,cy,19,0,Math.PI);c.fill();c.strokeStyle='rgba(20,10,28,.8)';c.beginPath();c.moveTo(-19,cy);c.lineTo(19,cy);c.stroke();}
 if(b.fl>0){c.globalAlpha=b.fl*6;c.fillStyle='#fff';N.rr(c,-46,-b.h/2+14,92,b.h-14,22);c.fill();}
 c.restore();
}
function drawHUD(c,api){
 const W=api.W,por=api.portrait,p=S.pl;
 for(let i=0;i<p.max;i++)heart(c,24+i*30,24,13,'#ef6a6a',i<p.hp);
 T(c,'×'+S.lives,24+p.max*30+4,30,16,'#fff0d4','left',{stroke:null});T(c,'LIVES',24+p.max*30+4,14,9,'rgba(255,240,208,.6)','left',{stroke:null});
 N.chip(c,W-250,4,118,'LEVEL',(S.li+1)+' / 3');N.chip(c,W-126,4,114,'CELLS',S.cells);
 const ex=[];if(p.spread)ex.push('SPREAD');if(p.dj)ex.push('DOUBLE JUMP');if(api.mastery>=6)ex.push('PIERCE');if(ex.length)T(c,ex.join(' · '),W/2,por?66:26,12,'#9de3d1','center',{stroke:null});
 if(S.boss){const bw=Math.min(420,W-60);N.bar(c,(W-bw)/2,por?74:46,bw,14,S.boss.hp/S.boss.max,S.boss.open?'#7affd8':'#ef6a6a');T(c,S.boss.open?'CORE EXPOSED!':'REACTOR GUARDIAN',W/2,por?86:58,11,'#fff0d4','center',{stroke:null});}
 if(S.bannerT>0){c.save();c.globalAlpha=Math.min(1,S.bannerT*2);c.fillStyle='rgba(18,12,30,.6)';c.fillRect(0,api.H*.34,W,api.H*.17);T(c,S.banner,W/2,api.H*.43,Math.min(W,540)/14,PAL.gold,'center',{glow:PAL.gold});T(c,S.sub,W/2,api.H*.48,15,'#fff0d4','center',{stroke:null});c.restore();}
}
NEXUS_GAMES.register('pulse',{
 ...(DBG?{dbg:()=>S,jump(li){loadLevel(NEXUS_ARCADE_API,li);}}:{}),
 meta:{title:'Pulse Runner',help:'Run, jump and blast through three foundry levels, then take down the Reactor Guardian.',controls:'ARROWS / A D move · SPACE / W jump · Z / X fire',type:'PLATFORM · ACTION'},
 size:[900,520],portraitSize:[540,860],duration:260,tier:1.4,
 touch:[{kind:'stick',side:'left',axis:'x',keys:['ArrowLeft','ArrowRight']},{kind:'btn',side:'right',label:'FIRE',key:'z'},{kind:'btn',side:'right',label:'JUMP',key:' ',big:true,cls:'alt'}],
 init(api){newState(api);loadLevel(api,0);S.bannerT=0;},
 start(api){newState(api);loadLevel(api,0);},
 update(dt,api){
  const p=S.pl,W=api.W,mul=api.diff.mul,m=api.mastery;S.t+=dt;S.bgT+=dt;
  if(S.bannerT>0)S.bannerT-=dt;
  if(S.endT>=0){S.endT-=dt;if(S.endT<0)end(api,S.win);}
  if(S.done||S.dead&&S.endT<0)return;
  if(S.comboT>0){S.comboT-=dt;if(S.comboT<=0){S.combo=0;api.combo=0;}}
  if(p.inv>0)p.inv-=dt;if(p.shoot>0)p.shoot-=dt;if(p.sq>0)p.sq-=dt;if(p.jb>0)p.jb-=dt;
  if(S.dead){return;}
  // input
  let ax=0;const k=S.keys;if(k.ArrowLeft||k.a)ax-=1;if(k.ArrowRight||k.d)ax+=1;if(!ax&&api.stick&&Math.abs(api.stick.x)>.2)ax=api.stick.x>0?1:-1;
  const sp=235;const acc=p.on?2400:1500;
  if(ax){p.vx+=ax*acc*dt;p.face=ax;}else p.vx*=Math.exp((p.on?-14:-3)*dt);p.vx=cl(p.vx,-sp,sp);
  p.vy=Math.min(p.vy+1650*dt,760);
  if(p.on){p.co=m>=4?.14:.09;p.djUsed=false;}else p.co-=dt;
  if(p.jb>0&&(p.co>0)){p.vy=-600;p.co=0;p.jb=0;p.on=false;p.sq=.1;api.sound(420,.07,'square',.04);api.burst(p.x,p.y+16,'#cfc0d8',4);p.holdJ=true;}
  else if(p.jb>0&&p.dj&&!p.djUsed&&!p.on){p.vy=-520;p.djUsed=true;p.jb=0;sfx(api,'power');api.burst(p.x,p.y+16,'#7fb8e8',10);p.holdJ=true;}
  if(!(k[' ']||k.ArrowUp||k.w)&&p.vy<-200&&p.holdJ){p.vy*=.5;p.holdJ=false;} // variable jump
  if(p.vy>=0)p.holdJ=false;
  moveBody(p,dt);
  if(k.z||k.x||k.j||S.fire)shoot(api);
  // hazards
  const c0=Math.floor((p.x-p.w/2)/TS),c1=Math.floor((p.x+p.w/2)/TS),r1=Math.floor((p.y+p.h/2-2)/TS);
  for(let cc=c0;cc<=c1;cc++){if(r1>=0&&r1<ROWS&&S.lv.g[r1][cc]===3&&p.y+p.h/2>r1*TS+14)hurt(api,1,cc*TS+20);}
  if(p.y>ROWS*TS+80){respawn(api);if(S.dead)return;}
  p.x=cl(p.x,14,S.lv.len-14);
  // entities
  for(const e of S.ents){
   if(e.dead)continue;
   if(e.fl>0)e.fl-=dt;
   const dx=e.x-p.x,dy=e.y-p.y,near=Math.abs(dx)<W*.8;
   if(e.k==='cell'){if(Math.hypot(dx,dy)<22){e.dead=1;S.cells++;api.addScore(2);api.sound(900+Math.min(400,S.cells*6),.04,'sine',.03);api.burst(e.x,e.y,'#ffe08a',3);}}
   else if(e.k==='pow'){if(Math.hypot(dx,dy)<26){e.dead=1;sfx(api,'power');api.burst(e.x,e.y,'#fff',16);if(e.p==='S'){p.spread=true;api.popText('SPREAD SHOT!',p.x,p.y-40,'#ef896d');}else if(e.p==='D'){p.dj=1;api.popText('DOUBLE JUMP!',p.x,p.y-40,'#7fb8e8');}else{p.max++;p.hp=p.max;api.popText('+1 MAX HEART',p.x,p.y-40,'#ef6a8a');}api.addScore(10);}}
   else if(e.k==='check'){if(!e.on&&Math.abs(dx)<26&&Math.abs(dy)<44){e.on=1;S.ck={x:e.x,y:e.y};api.popText('CHECKPOINT',e.x,e.y-40,'#7affd8');sfx(api,'coin');}}
   else if(e.k==='exit'){if(Math.hypot(dx,dy)<30){api.addScore(25,e.x,e.y-30,'#9de3d1');sfx(api,'win');api.time=api.time+25;if(S.li>=2){S.win=true;S.endT=1;}else loadLevel(api,S.li+1);return;}}
   else if(e.k==='patrol'&&near){
    e.vy=Math.min((e.vy||0)+1500*dt,700);e.y+=e.vy*dt;
    const ahead=tileAt(e.x+(e.vx<0?-20:20),e.y+e.h/2+4);const below=tileAt(e.x,e.y+e.h/2+1);
    if(below===1||below===2){if(e.vy>0){e.y=Math.floor((e.y+e.h/2+1)/TS)*TS-e.h/2;e.vy=0;}}
    const wall=tileAt(e.x+(e.vx<0?-18:18),e.y);
    if(wall===1||(ahead!==1&&ahead!==2&&below===1))e.vx*=-1;
    e.x+=e.vx*dt*(mul>1?1.25:mul<1?.8:1);
    if(Math.abs(dx)<22&&Math.abs(dy)<26){if(p.vy>120&&p.y<e.y-6){e.hp=0;p.vy=-420;killEnt(api,e,6);}else hurt(api,1,e.x);}
   }
   else if(e.k==='flyer'&&near){e.t+=dt;const chase=Math.abs(dx)<300;if(chase){e.x+=(p.x-e.x)*dt*.9;e.y+=(p.y-30-e.y)*dt*.9;}else{e.y=e.y0+Math.sin(e.t*2)*30;e.x+=Math.sin(e.t)*20*dt;}
    if(Math.hypot(dx,dy)<22)hurt(api,1,e.x);}
   else if(e.k==='turret'&&near){e.aim=Math.atan2(p.y-e.y,p.x-e.x);e.cd-=dt;if(e.cd<=0&&Math.abs(dx)<520){e.cd=1.9/Math.sqrt(mul);const a=e.aim;S.eb.push({x:e.x+Math.cos(a)*20,y:e.y-18+Math.sin(a)*20,vx:Math.cos(a)*230*Math.sqrt(mul),vy:Math.sin(a)*230*Math.sqrt(mul),life:3});api.sound(200,.06,'square',.03);}}
   else if(e.k==='bossSpawn'){if(!S.boss&&p.x>e.x-300){spawnBoss(api,e);e.dead=1;}}
  }
  // player bullets
  for(let i=S.bul.length-1;i>=0;i--){const b=S.bul[i];b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;let rm=b.life<=0||tileAt(b.x,b.y)===1;
   if(!rm){for(const e of S.ents){if(e.dead||!e.hp&&e.k!=='patrol')continue;if((e.k==='patrol'||e.k==='flyer'||e.k==='turret')&&Math.abs(e.x-b.x)<e.w/2+4&&Math.abs(e.y-b.y)<e.h/2+4){e.hp--;e.fl=.12;if(e.hp<=0)killEnt(api,e,e.k==='turret'?8:e.k==='flyer'?5:4);else{sfx(api,'hit');api.burst(b.x,b.y,'#fff',3);}if(!b.pierce)rm=true;break;}}}
   const B=S.boss;if(!rm&&B&&Math.abs(B.x-b.x)<B.w/2&&Math.abs(B.y-b.y)<B.h/2){if(B.open){B.hp--;B.fl=.1;api.addScore(2);api.burst(b.x,b.y,'#7affd8',4);sfx(api,'hit');api.shake(3,.1);if(B.hp<=0){bossDie(api);}}else{api.burst(b.x,b.y,'#ccc',3);api.sound(900,.03,'square',.03);}rm=true;}
   if(rm)S.bul.splice(i,1);}
  // enemy bullets
  for(let i=S.eb.length-1;i>=0;i--){const b=S.eb[i];b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;let rm=b.life<=0||tileAt(b.x,b.y)===1;if(!rm&&Math.hypot(b.x-p.x,b.y-p.y)<16){hurt(api,1,b.x);rm=true;}if(rm)S.eb.splice(i,1);}
  // boss
  const B=S.boss;if(B){B.t+=dt;if(B.fl>0)B.fl-=dt;const ph=B.hp/B.max;B.phase=ph>.66?1:ph>.33?2:3;
   if(B.mode==='enter'){B.tt-=dt;if(B.tt<=0)B.mode='fight';}
   else{B.cd-=dt;const hover=ph>.5?0:1;B.y=B.y0===undefined?(B.y0=B.y):B.y0;B.x+=Math.sin(B.t*(.8+B.phase*.3))*40*dt*(B.phase-.5);
    if(B.cd<=0){const r=Math.random();
     if(r<.45||B.phase===1){ // aimed burst
      const n=B.phase+1,a0=Math.atan2(p.y-B.y,p.x-B.x);for(let i=0;i<n;i++){const a=a0+(i-(n-1)/2)*.22;S.eb.push({x:B.x,y:B.y,vx:Math.cos(a)*260,vy:Math.sin(a)*260,life:3});}B.cd=1.6/Math.sqrt(mul);sfx(api,'shot');}
     else{ // shockwave along ground + open core
      S.shock.push({x:B.x,dir:p.x<B.x?-1:1,y:B.y+B.h/2-8,t:0});B.open=true;B.openT=3.2;B.cd=3.6/Math.sqrt(mul);api.shake(8,.3);sfx(api,'boom');
      if(B.phase>=3){for(let i=0;i<4;i++)S.debris.push({x:p.x+R(-220,220),y:-20-i*60,vy:0});}}}
    if(B.open){B.openT-=dt;if(B.openT<=0)B.open=false;}
    if(Math.abs(B.x-p.x)<B.w/2+10&&Math.abs(B.y-p.y)<B.h/2+14)hurt(api,1,B.x);}
  }
  for(let i=S.shock.length-1;i>=0;i--){const s=S.shock[i];s.t+=dt;s.x+=s.dir*320*dt;if(Math.abs(p.x-s.x)<18&&p.y+p.h/2>s.y-20&&p.on===true)hurt(api,1,s.x);else if(Math.abs(p.x-s.x)<18&&p.y+p.h/2>s.y-22)hurt(api,1,s.x);if(s.t>3.5||tileAt(s.x+s.dir*20,s.y)===1)S.shock.splice(i,1);}
  for(let i=S.debris.length-1;i>=0;i--){const d=S.debris[i];d.vy+=900*dt;d.y+=d.vy*dt;if(Math.abs(p.x-d.x)<18&&Math.abs(p.y-d.y)<26)hurt(api,1,d.x);if(d.y>ROWS*TS)S.debris.splice(i,1);}
  // camera
  const vw=W/(api.portrait?.88:1);S.cam+=((p.x-vw*.4)-S.cam)*Math.min(1,dt*6);S.cam=cl(S.cam,0,Math.max(0,S.lv.len-vw));
 },
 draw(c,api){
  if(!S||!S.lv)return;bgLayer(c,api);
  const{z,oy}=worldTransform(c,api);
  c.save();c.translate(0,oy);c.scale(z,z);c.translate(-Math.round(S.cam),0);
  const vw=api.W/z,c0=Math.max(0,Math.floor(S.cam/TS)),c1=Math.min(S.lv.W-1,Math.ceil((S.cam+vw)/TS));
  const hue=S.lv.hue;
  for(let r=0;r<ROWS;r++)for(let cc=c0;cc<=c1;cc++){const t=S.lv.g[r][cc];if(!t)continue;
   if(t===1)c.drawImage(tileSprite(r>0&&S.lv.g[r-1][cc]===1?'solid':'top',hue),cc*TS,r*TS);else if(t===2)c.drawImage(tileSprite('plat',hue),cc*TS,r*TS);else if(t===3)c.drawImage(tileSprite('spike',hue),cc*TS,r*TS);}
  for(const e of S.ents){if(e.x<S.cam-60||e.x>S.cam+vw+60)continue;drawEnt(c,e,api);}
  if(S.boss)drawBoss(c,S.boss);
  for(const s of S.shock){c.save();N.glow(c,s.x,s.y,50,'#ff8a4a',.9);c.fillStyle='#ffb060';c.beginPath();c.moveTo(s.x-14,s.y+20);c.lineTo(s.x,s.y-16);c.lineTo(s.x+14,s.y+20);c.fill();c.restore();}
  for(const d of S.debris){c.fillStyle='#8a6a78';N.rr(c,d.x-14,d.y-14,28,28,6);c.fill();c.strokeStyle='rgba(20,10,28,.7)';c.lineWidth=2.5;c.stroke();}
  if(!S.dead)drawRobot(c,S.pl,api);
  for(const b of S.bul){N.glow(c,b.x,b.y,12,'#ffd070',.8);c.fillStyle='#fff6c0';c.beginPath();c.arc(b.x,b.y,4,0,TAU);c.fill();}
  for(const b of S.eb){N.glow(c,b.x,b.y,12,'#ff5a4a',.8);c.fillStyle='#ffb0a0';c.beginPath();c.arc(b.x,b.y,4.5,0,TAU);c.fill();}
  c.restore();
  if(api.portrait){const by=oy+ROWS*TS*z;const gr=c.createLinearGradient(0,by,0,api.H);gr.addColorStop(0,'#3e2a3c');gr.addColorStop(1,'#1a0e22');c.fillStyle=gr;c.fillRect(0,by-2,api.W,api.H-by+2);c.fillStyle=hue;c.globalAlpha=.5;c.fillRect(0,by-2,api.W,3);c.globalAlpha=1;for(let i=0;i<8;i++){c.fillStyle='rgba(255,255,255,.05)';c.fillRect(i*api.W/8+8,by+12,api.W/8-16,22);}}
  if(api.running)drawHUD(c,api);
  N.vignette(c,api.W,api.H,.4);
  if(!api.running){readyScreen(c,api,'PULSE RUNNER','Fight through three foundry levels to the Reactor Guardian. You have lives, hearts and a pulse cannon - use checkpoints and power-ups wisely.',[
   'Move: arrows / A D (or the stick). Jump: Space / W - hold for higher, tap for short hops.','Fire: Z / X. Stomp patrol bots from above or shoot them.','Avoid spikes, drones, turret bolts and pits. Flags are checkpoints.','Grab D (double jump), S (spread shot), + (extra heart).','Boss: shoot its core only while the shield is open.'],PAL.coral,
   'BEST '+(api.store.get('top',[])[0]||0)+' · FURTHEST LEVEL '+((api.store.get('stage',0))+1)+'/3');}
 },
 keydown(e,api){const k=e.key,lk=k.length===1?k.toLowerCase():k;S.keys[lk]=true;if(k===' '||k==='ArrowUp'||lk==='w')jump(api);if(lk==='z'||lk==='x'||lk==='j')shoot(api);},
 keyup(e,api){const k=e.key,lk=k.length===1?k.toLowerCase():k;S.keys[lk]=false;},
 pointerdown(){},
 timeUp(api){S.win=false;end(api,false);}
});
function bossDie(api){const B=S.boss;S.boss=null;api.addScore(80,B.x,B.y-40,'#ffe08a');api.burst(B.x,B.y,'#ffe08a',60);api.shake(20,1);sfx(api,'win');S.win=true;S.endT=1.8;S.eb.length=0;S.shock.length=0;S.debris.length=0;}
})();

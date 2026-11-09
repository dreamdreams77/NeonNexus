/* games/target.js — Neon Nexus cabinet module */
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
/* ===== BUBBLE BLASTER ===== */
let S=null;
const WAVEDEF=[{n:8,iv:1.15,civ:0,arm:0,pats:['rail']},{n:10,iv:1.0,civ:.08,arm:0,pats:['rail','arc']},{n:12,iv:.9,civ:.12,arm:.15,pats:['rail','arc','zig']},{n:14,iv:.8,civ:.14,arm:.2,pats:['rail','arc','zig','orbit']},{n:16,iv:.7,civ:.16,arm:.25,pats:['arc','zig','orbit','rail']}];
const RETS=['DOT','RING','CROSS'];
function mag(api){return 6+(api.mastery>=2?2:0);}
function newState(api){
 const W=api.W,H=api.H;
 S={t:0,wave:-1,spawned:0,alive:0,killed:0,escaped:0,tg:[],cov:[],trc:[],ammo:mag(api),maxAmmo:mag(api),reload:-1,rtot:1,sweet:[.45,.65],canSweet:false,
  hearts:3,streak:0,best:0,shots:0,hits:0,rx:W/2,ry:H*.5,recoil:0,cool:0,spawnT:1,bannerT:0,banner:'',sub:'',boss:null,bossDead:false,bossSpawned:false,endT:-1,done:false,perfRel:0,civHit:0,clearT:-1,kx:0,ky:0,hold:{},ret:api.store.get('ret',0),flash:0,empties:0,waveAcc:[0,0],bg:0,rainbow:0,focus:0};
}
function setWave(api,w){
 S.wave=w;S.spawned=0;S.killed=0;S.escaped=0;S.spawnT=1;S.waveAcc=[0,0];S.clearT=-1;
 if(w>=5){S.banner='BOSS: BUBBLE BARON';S.sub='Shoot the core when the visor glows red';api.shake(8,.4);}
 else{S.banner='WAVE '+(w+1);S.sub=WAVEDEF[w].pats.includes('orbit')?'Orbiting targets incoming':w>=1?'Avoid the bunny civilians!':'Pop the bubbles!';}
 S.bannerT=1.6;api.sound(w>=5?110:540,.18,w>=5?'sawtooth':'triangle',.05);
 if(w>api.store.get('stage',0))api.store.set('stage',w);
 // cover
 S.cov.length=0;if(w>=2||w===5){const n=w>=4?2:1;for(let i=0;i<n;i++)S.cov.push({x:R(0,api.W),y:api.H*(.5+.1*i)+R(-10,10),w:104,h:78,vx:(i?-1:1)*(50+w*10)*api.diff.mul,kind:i});}
}
function spawn(api,type,pat){
 const W=api.W,H=api.H,w=Math.min(S.wave,4),mul=api.diff.mul;
 const o={type,pat,t:0,life:0,dead:0,hp:type==='arm'?2:1,flash:0,r:type==='gold'?20:RI(0,2)===0?36:RI(0,1)?28:22,vx:0,vy:0,x:0,y:0,z:Math.random(),seed:Math.random()*6,wob:Math.random()*6};
 if(type==='civ')o.r=30;if(type==='ammo')o.r=26;if(type==='bomb')o.r=30;if(type==='arm')o.r=36;
 const sp=(95+w*18)*mul*(type==='gold'?1.6:1);
 const top=api.portrait?150:110,bot=H*.62;
 if(pat==='rail'){const dir=Math.random()<.5?1:-1;o.y=R(top+20,bot);o.x=dir>0?-o.r-8:W+o.r+8;o.vx=dir*sp;o.bobA=R(4,18);}
 else if(pat==='arc'){const dir=Math.random()<.5?1:-1;o.x=dir>0?R(-20,W*.25):R(W*.75,W+20);o.y=H*.75;const T=R(1.7,2.3);o.vx=dir*R(W*.18,W*.34)/T*(.85+mul*.15);o.g=600;o.vy=-(o.g*T/2)*R(.8,1.15)*(H<600?.86:1.05);o.y=H*.78;}
 else if(pat==='zig'){const dir=Math.random()<.5?1:-1;o.x=dir>0?-o.r-8:W+o.r+8;o.y0=R(top+60,bot-30);o.vx=dir*sp*.8;o.zf=R(2.2,3.2);o.za=R(45,80);o.y=o.y0;}
 else{const dir=Math.random()<.5?1:-1;o.R=R(55,90);o.cy=R(top+90,bot-20);o.ang=R(0,TAU);o.w=R(1.3,2.0)*(Math.random()<.5?-1:1)*Math.sqrt(mul);o.drift=dir*W/8.5*R(.9,1.2)*Math.sqrt(mul);o.cx=dir>0?-o.R-30:W+o.R+30;o.x=o.cx;o.y=o.cy;}
 S.tg.push(o);return o;
}
function spawnWaveTarget(api){
 const d=WAVEDEF[S.wave],r=Math.random();let type='n';
 if(r<d.civ)type='civ';else if(r<d.civ+.06)type='ammo';else if(r<d.civ+.06+d.arm)type='arm';else if(r<d.civ+.06+d.arm+.08)type='bomb';else if(r<d.civ+.06+d.arm+.08+.08)type='gold';
 let pat=d.pats[(Math.random()*d.pats.length)|0];if(type==='gold')pat=Math.random()<.5?'zig':'rail';
 if(type==='civ'||type==='ammo')pat=pat==='orbit'?'rail':pat;
 spawn(api,type,pat);if(type!=='civ'&&type!=='ammo'){S.spawned++;S.alive++;}
}
function spawnBoss(api){
 const W=api.W,H=api.H,hp=Math.round(12*Math.pow(api.diff.mul,.7));
 S.boss={x:W/2,y:H*.3,r:62,hp,max:hp,t:0,open:0,phaseT:1.4,state:'closed',flash:0,minT:2,arrive:0};S.bossSpawned=true;
}
function mult(){return Math.min(3,1+Math.floor(S.streak/4));}
function damageTarget(api,o,bull){
 const d={n:3,arm:7,gold:14,ammo:0,bomb:5}[o.type]||0;
 const sm=o.r<26?1.4:o.r<32?1.15:1;
 if(o.type==='arm'&&--o.hp>0){o.flash=.15;api.popText('CLANK',o.x,o.y-o.r,'#cfe6ff');api.sound(500,.05,'square',.04);api.burst(o.x,o.y,'#cfe6ff',8);return false;}
 o.dead=1;S.hits++;S.waveAcc[0]++;S.streak++;S.best=Math.max(S.best,S.streak);api.combo=S.streak;
 const pts=Math.round(d*sm*mult()*(bull?1.5:1));
 if(o.type==='ammo'){S.ammo=Math.min(S.maxAmmo,S.ammo+3);api.popText('+3 AMMO',o.x,o.y-o.r,'#9de3d1');sfx(api,'power');api.burst(o.x,o.y,'#91c9a7',14);}
 else{api.addScore(pts,o.x,o.y-o.r*.6,o.type==='gold'?'#ffe08a':bull?'#ffb0a0':'#fff0d4');sfx(api,o.type==='gold'?'coin':'pop');}
 if(bull){api.popText('BULLSEYE',o.x,o.y-o.r-16,'#ffb0a0');}
 api.burst(o.x,o.y,o.type==='gold'?'#ffe08a':o.type==='bomb'?'#ff9a50':'#9de3d1',o.type==='gold'?24:12);
 if(o.type==='bomb'){explode(api,o);}
 if(S.streak===15)api.achieve('streak','Chain Popper',5);
 return true;
}
function explode(api,b){
 api.shake(10,.3);sfx(api,'boom');api.burst(b.x,b.y,'#ffb060',30);
 for(const o of S.tg){if(o.dead||o===b)continue;if(Math.hypot(o.x-b.x,o.y-b.y)<110){if(o.type==='civ'){continue;}o.dead=1;S.hits++;S.streak++;api.addScore(2*mult(),o.x,o.y,'#ffb060');api.burst(o.x,o.y,'#ffb060',8);}}
 if(S.boss&&Math.hypot(S.boss.x-b.x,S.boss.y-b.y)<130&&S.boss.state==='open')bossHit(api,1);
}
function bossHit(api,dmg){
 const b=S.boss;if(!b||S.bossDead)return;b.hp-=dmg;b.flash=.2;S.hits++;S.waveAcc[0]++;S.streak++;S.best=Math.max(S.best,S.streak);api.combo=S.streak;
 api.addScore(5*mult(),b.x,b.y-b.r,'#ffd08a');api.burst(b.x,b.y,'#ffd08a',18);api.shake(8,.22);sfx(api,'hit');
 if(b.hp<=0){S.bossDead=true;api.addScore(50,b.x,b.y-b.r*1.5,'#ffe08a');api.burst(b.x,b.y,'#ffe08a',60);api.shake(18,.8);sfx(api,'win');S.endT=1.8;S.tg.forEach(o=>{if(o.type!=='civ')o.dead=1;});api.achieve('boss','Baron Popped',10);api.store.set('boss',(api.store.get('boss',0)||0)+1);if(api.store.get('boss',0)>=1)api.store.set('retUnlock',Math.max(api.store.get('retUnlock',0),2));}
}
function shoot(api,x,y){
 if(S.done||S.endT>=0||S.cool>0)return;
 if(S.reload>=0){return;}
 if(S.ammo<=0){S.empties++;api.sound(160,.05,'square',.04);api.popText(api.touch?'RELOAD!':'PRESS R',x,y-26,'#ffb0a0');if(S.empties>=2)startReload(api);return;}
 S.empties=0;S.ammo--;S.shots++;S.waveAcc[1]++;S.cool=.12;S.recoil=1;S.rx=x;S.ry=y-0;S.ry-=0;
 sfx(api,'shot');api.shake(2.5,.1);
 S.trc.push({x,y,t:.1});if(S.trc.length>8)S.trc.shift();
 // cover first
 for(const c of S.cov){if(x>c.x-c.w/2&&x<c.x+c.w/2&&y>c.y-c.h/2&&y<c.y+c.h/2){api.burst(x,y,'#d8a468',8);api.popText('BLOCKED',x,y-18,'#d8a468');api.sound(120,.08,'square',.05);S.streak=0;api.combo=0;return;}}
 let hitAny=false;const pierce=api.mastery>=6?26:0;
 // boss
 const b=S.boss;
 if(b&&!S.bossDead&&Math.hypot(x-b.x,y-b.y)<b.r+4){
  hitAny=true;
  if(b.state==='open'&&Math.hypot(x-b.x,y-b.y)<b.r*.7){bossHit(api,Math.hypot(x-b.x,y-b.y)<b.r*.3?2:1);}
  else{api.popText('DEFLECT',x,y-20,'#cfe6ff');api.burst(x,y,'#fff',8);api.sound(900,.05,'square',.04);S.streak=0;api.combo=0;}
 }
 let n=0;
 const arr=S.tg.slice().sort((a,b)=>b.z-a.z);
 for(const o of arr){if(o.dead)continue;const d=Math.hypot(o.x-x,o.y-y);if(d<=o.r+3||(pierce&&d<=o.r+pierce)){
   hitAny=true;
   if(o.type==='civ'){o.dead=1;S.hearts--;S.civHit++;S.streak=0;api.combo=0;api.addScore(-25);api.popText('CIVILIAN! -1',o.x,o.y-o.r,'#ff8a6a');api.burst(o.x,o.y,'#ffb0c0',18);api.shake(12,.4);sfx(api,'lose');S.flash=.4;if(S.hearts<=0){end(api,false);}break;}
   const killed=damageTarget(api,o,d<o.r*.35);
   n++;if(!pierce||n>=2)break;}}
 if(!hitAny){S.streak=0;api.combo=0;api.burst(x,y,'#8a7a9a',4);}
}
function startReload(api){if(S.reload>=0||S.ammo>=S.maxAmmo||S.done)return;S.reload=0;S.rtot=Math.max(.45,(api.mastery>=4?.85:1.15)/(api.diff.mul>1?1.1:1));const w=api.mastery>=4?.26:.18;const s=R(.35,.6);S.sweet=[s,s+w];S.canSweet=true;sfx(api,'reload');}
function reloadKey(api){
 if(S.reload<0){startReload(api);return;}
 if(S.canSweet){S.canSweet=false;const k=S.reload/S.rtot;
  if(k>=S.sweet[0]&&k<=S.sweet[1]){S.reload=S.rtot;S.perfRel++;api.popText('PERFECT RELOAD!',S.rx,S.ry-34,'#9de3d1');api.addScore(5,S.rx,S.ry-60,'#9de3d1');sfx(api,'power');if(S.perfRel>=5)api.achieve('reload','Quick Hands',5);}
  else{S.reload=Math.max(S.reload,0)-.0;S.rtot+=.35;api.popText('JAM',S.rx,S.ry-34,'#ffb0a0');api.sound(120,.15,'sawtooth',.04);}}
}
function end(api,win){if(S.done)return;S.done=true;
 topScores(api,api.score);const acc=S.shots?S.hits/S.shots:0;
 if(S.shots>=20&&acc>=.8)api.achieve('acc','Sharpshooter',8);if(win&&S.civHit===0)api.achieve('clean','Hold Your Fire',6);
 api.store.set('acc',Math.max(api.store.get('acc',0),Math.round(acc*100)));
 api.finish(win,{grade:gradeOf(cl(api.score/380,0,1),win)+' · ACC '+Math.round(acc*100)+'%',combo:S.best});}
/* ---------- drawing ---------- */
function bg(c,api){
 const o=bgCache('tg'+api.W+'x'+api.H,api.W,api.H,(g,W,H)=>{
  N.bgGrad(g,W,H,['#f6dcb4','#f0b68e','#d98f7a']);
  // wall stripes
  for(let i=0;i<W/60;i++){if(i%2){g.fillStyle='rgba(255,255,255,.14)';g.fillRect(i*60,0,60,H*.7);}}
  // top valance
  g.fillStyle='#b8505e';g.fillRect(0,0,W,40);for(let x=0;x<W;x+=48){g.fillStyle=(x/48)%2?'#f8e9ca':'#b8505e';g.beginPath();g.moveTo(x,40);g.lineTo(x+48,40);g.lineTo(x+24,66);g.fill();}
  g.fillStyle='rgba(0,0,0,.18)';g.fillRect(0,40,W,4);
  // string lights
  for(let i=0;i<14;i++){const x=i*W/13,y=76+Math.sin(i*.7)*6;g.fillStyle=['#ffe08a','#ef896d','#91c9a7','#f8e9ca'][i%4];g.beginPath();g.arc(x,y,5,0,TAU);g.fill();}
  // shelves rails
  const shelves=[H*.34,H*.5,H*.66];shelves.forEach((y,i)=>{const gr=g.createLinearGradient(0,y,0,y+16);gr.addColorStop(0,'#c99a6a');gr.addColorStop(1,'#8c5f3a');g.fillStyle=gr;g.fillRect(0,y,W,14);g.fillStyle='rgba(0,0,0,.25)';g.fillRect(0,y+14,W,5);g.fillStyle='rgba(255,255,255,.3)';g.fillRect(0,y,W,3);});
  // curtains
  for(const sd of[0,1]){const x0=sd?W:0,dir=sd?-1:1,cw=Math.min(90,W*.14);const gr=g.createLinearGradient(x0,0,x0+dir*cw,0);gr.addColorStop(0,'#5a3050');gr.addColorStop(.6,'#8e4a68');gr.addColorStop(1,'#6a3a5a');g.fillStyle=gr;g.beginPath();g.moveTo(x0,0);g.lineTo(x0+dir*cw,0);g.bezierCurveTo(x0+dir*cw*.5,H*.3,x0+dir*cw*1.1,H*.55,x0+dir*cw*.6,H);g.lineTo(x0,H);g.fill();for(let k=1;k<4;k++){g.strokeStyle='rgba(0,0,0,.2)';g.lineWidth=3;g.beginPath();g.moveTo(x0+dir*cw*k/4,0);g.bezierCurveTo(x0+dir*cw*k/4*.6,H*.3,x0+dir*cw*k/4*1.1,H*.6,x0+dir*cw*k/4*.7,H);g.stroke();}}
  // counter
  const ct=H-70;const cg=g.createLinearGradient(0,ct,0,H);cg.addColorStop(0,'#a8683e');cg.addColorStop(1,'#5a3420');g.fillStyle=cg;g.fillRect(0,ct,W,70);g.fillStyle='rgba(255,255,255,.3)';g.fillRect(0,ct,W,4);g.fillStyle='rgba(0,0,0,.2)';for(let x=0;x<W;x+=70)g.fillRect(x,ct+4,3,66);
 });
 c.drawImage(o,0,0);
}
function drawTarget(c,o,t,api){
 const r=o.r,x=o.x,y=o.y;
 c.save();
 // soft shadow on wall
 c.globalAlpha=.18;c.fillStyle='#3a2030';c.beginPath();c.ellipse(x+6,y+r*.9,r*.9,r*.28,0,0,TAU);c.fill();c.globalAlpha=1;
 let col={n:'#ef896d',arm:'#9ab0d0',gold:'#f2ce77',civ:'#f6b8c4',ammo:'#91c9a7',bomb:'#3a3040'}[o.type];
 const wob=Math.sin(t*4+o.wob)*.04;c.translate(x,y);c.rotate(wob);c.scale(1+wob,1-wob);
 // inner target disc
 const gr=c.createRadialGradient(-r*.3,-r*.35,r*.05,0,0,r);gr.addColorStop(0,N.shade(col,.5));gr.addColorStop(.6,col);gr.addColorStop(1,N.shade(col,-.35));
 c.fillStyle=gr;c.beginPath();c.arc(0,0,r*.82,0,TAU);c.fill();c.strokeStyle='rgba(40,24,40,.4)';c.lineWidth=2;c.stroke();
 if(o.type==='n'||o.type==='arm'){c.fillStyle='#f8e9ca';c.beginPath();c.arc(0,0,r*.55,0,TAU);c.fill();c.fillStyle=o.type==='arm'?'#6a86b8':'#ef6a5a';c.beginPath();c.arc(0,0,r*.32,0,TAU);c.fill();c.fillStyle='#f8e9ca';c.beginPath();c.arc(0,0,r*.12,0,TAU);c.fill();}
 if(o.type==='gold'){c.fillStyle='#fff0b0';star(c,0,0,r*.5,r*.22,5,t*2);c.fill();N.glow(c,0,0,r*1.7,'#ffd870',.5+.3*Math.sin(t*9));}
 if(o.type==='ammo'){c.fillStyle='#f8e9ca';for(let i=-1;i<=1;i++){N.rr(c,i*r*.3-r*.1,-r*.3,r*.2,r*.55,r*.08);c.fill();c.fillStyle='#d8a458';c.fillRect(i*r*.3-r*.1,-r*.3,r*.2,r*.14);c.fillStyle='#f8e9ca';}}
 if(o.type==='civ'){ // bunny
  for(const sd of[-1,1]){c.fillStyle='#fbd0d8';c.beginPath();c.ellipse(sd*r*.3,-r*.78,r*.14,r*.34,sd*.2,0,TAU);c.fill();c.strokeStyle='rgba(40,24,40,.4)';c.lineWidth=1.5;c.stroke();}
  c.fillStyle='#fff';for(const sd of[-1,1]){c.beginPath();c.arc(sd*r*.28,-r*.12,r*.1,0,TAU);c.fill();c.fillStyle='#2a1c2a';c.beginPath();c.arc(sd*r*.28,-r*.1,r*.05,0,TAU);c.fill();c.fillStyle='#fff';}
  c.fillStyle='#e8708a';c.beginPath();c.ellipse(0,r*.08,r*.09,r*.06,0,0,TAU);c.fill();c.strokeStyle='#8a4050';c.lineWidth=1.6;c.beginPath();c.arc(0,r*.12,r*.18,.2,Math.PI-.2);c.stroke();
  c.fillStyle='#ffe08a';c.font='700 '+Math.round(r*.45)+'px Fredoka, sans-serif';c.textAlign='center';c.fillText('♥',0,r*.65);
 }
 if(o.type==='bomb'){c.strokeStyle='#d8b070';c.lineWidth=3;c.beginPath();c.moveTo(0,-r*.8);c.quadraticCurveTo(r*.3,-r*1.1,r*.1,-r*1.3);c.stroke();N.glow(c,r*.1,-r*1.3,r*(.5+.15*Math.sin(t*30)),'#ffb050',.9);c.fillStyle='#ff7060';c.beginPath();c.arc(-r*.25,-r*.05,r*.1,0,TAU);c.arc(r*.25,-r*.05,r*.1,0,TAU);c.fill();}
 if(o.type==='arm'){c.strokeStyle='#e8f0ff';c.lineWidth=4;c.beginPath();c.arc(0,0,r*.9,0,TAU);c.stroke();if(o.hp===1){c.strokeStyle='rgba(20,12,30,.7)';c.lineWidth=2;c.beginPath();c.moveTo(-r*.4,-r*.5);c.lineTo(0,-r*.1);c.lineTo(r*.3,-r*.55);c.stroke();}}
 // glass bubble
 const bg2=c.createRadialGradient(-r*.35,-r*.4,r*.05,0,0,r);bg2.addColorStop(0,'rgba(255,255,255,.55)');bg2.addColorStop(.4,'rgba(255,255,255,.08)');bg2.addColorStop(1,'rgba(180,230,255,.3)');
 c.fillStyle=bg2;c.beginPath();c.arc(0,0,r,0,TAU);c.fill();c.strokeStyle='rgba(255,255,255,.65)';c.lineWidth=2;c.stroke();
 c.fillStyle='rgba(255,255,255,.75)';c.beginPath();c.ellipse(-r*.4,-r*.45,r*.22,r*.12,-.6,0,TAU);c.fill();
 if(o.flash>0){c.fillStyle='rgba(255,255,255,'+o.flash*5+')';c.beginPath();c.arc(0,0,r,0,TAU);c.fill();}
 c.restore();
}
function star(c,x,y,R1,R2,n,rot){c.beginPath();for(let i=0;i<n*2;i++){const a=rot+i*Math.PI/n,r=i%2?R2:R1;c.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r);}c.closePath();}
function drawBoss(c,b,t){
 const r=b.r,x=b.x,y=b.y;
 c.save();c.translate(x,y);
 c.globalAlpha=.2;c.fillStyle='#3a2030';c.beginPath();c.ellipse(8,r*.95,r,r*.3,0,0,TAU);c.fill();c.globalAlpha=1;
 // antenna
 c.strokeStyle='#6a5a78';c.lineWidth=5;c.beginPath();c.moveTo(0,-r*.9);c.lineTo(0,-r*1.35);c.stroke();N.ball(c,0,-r*1.42,9,'#ef6a5a',{shadow:false});
 // body orb
 const g=c.createRadialGradient(-r*.3,-r*.4,r*.1,0,0,r);g.addColorStop(0,'#b8c4e0');g.addColorStop(.6,'#6a7aa0');g.addColorStop(1,'#323a58');c.fillStyle=g;c.beginPath();c.arc(0,0,r,0,TAU);c.fill();c.strokeStyle='rgba(30,20,44,.6)';c.lineWidth=3;c.stroke();
 // rivets + plates
 c.fillStyle='rgba(255,255,255,.35)';for(let i=0;i<8;i++){const a=i*TAU/8+t*.4;c.beginPath();c.arc(Math.cos(a)*r*.86,Math.sin(a)*r*.86,3.5,0,TAU);c.fill();}
 // visor
 const open=b.state==='open',tel=b.state==='tel';
 c.fillStyle='#1a1226';N.rr(c,-r*.62,-r*.3,r*1.24,r*.6,r*.3);c.fill();
 const ec=open?'#ff4a3a':tel?'#ffb040':'#5a4a70';
 if(open||tel)N.glow(c,0,0,r*(open?1.3:.9),ec,open?.8:.5);
 c.fillStyle=ec;c.beginPath();c.arc(0,0,open?r*.3:r*.18,0,TAU);c.fill();c.fillStyle='rgba(255,255,255,.7)';c.beginPath();c.arc(-r*.08,-r*.08,r*.07,0,TAU);c.fill();
 if(!open){c.fillStyle='#8a96b8';N.rr(c,-r*.62,-r*.3,r*1.24,r*.28,r*.14);c.fill();N.rr(c,-r*.62,r*.04,r*1.24,r*.26,r*.14);c.fill();}
 c.fillStyle='rgba(255,255,255,.4)';c.beginPath();c.ellipse(-r*.45,-r*.65,r*.2,r*.1,-.6,0,TAU);c.fill();
 if(b.flash>0){c.fillStyle='rgba(255,255,255,'+b.flash*4+')';c.beginPath();c.arc(0,0,r,0,TAU);c.fill();}
 c.restore();
}
function drawCover(c,cv,t){
 c.save();c.translate(cv.x,cv.y);const w=cv.w,h=cv.h;
 c.fillStyle='rgba(30,16,30,.3)';c.beginPath();c.ellipse(4,h/2+2,w*.55,10,0,0,TAU);c.fill();
 if(cv.kind===1){ // barrel
  const g=c.createLinearGradient(-w/2,0,w/2,0);g.addColorStop(0,'#7a4a2a');g.addColorStop(.35,'#c88a58');g.addColorStop(1,'#6a3e22');c.fillStyle=g;N.rr(c,-w*.4,-h/2,w*.8,h,14);c.fill();c.strokeStyle='rgba(40,24,20,.5)';c.lineWidth=2.5;c.stroke();c.fillStyle='#5a5a70';c.fillRect(-w*.4,-h*.28,w*.8,8);c.fillRect(-w*.4,h*.2,w*.8,8);
 }else{ // crate
  const g=c.createLinearGradient(0,-h/2,0,h/2);g.addColorStop(0,'#e0aa70');g.addColorStop(1,'#a8703e');c.fillStyle=g;N.rr(c,-w/2,-h/2,w,h,8);c.fill();c.strokeStyle='rgba(50,30,20,.55)';c.lineWidth=3;c.stroke();c.strokeStyle='#8a5a30';c.lineWidth=7;c.beginPath();c.moveTo(-w/2+6,-h/2+6);c.lineTo(w/2-6,h/2-6);c.moveTo(w/2-6,-h/2+6);c.lineTo(-w/2+6,h/2-6);c.stroke();c.fillStyle='rgba(255,255,255,.3)';c.fillRect(-w/2+6,-h/2+5,w-12,4);
 }
 c.restore();
}
function drawGun(c,api){
 const W=api.W,H=api.H,gx=W/2,gy=H+4,ang=cl(Math.atan2(S.ry-gy,S.rx-gx)+Math.PI/2,-1.15,1.15),rc=S.recoil;
 c.save();c.translate(gx,gy-rc*10);c.rotate(ang);
 const g=c.createLinearGradient(-26,0,26,0);g.addColorStop(0,'#ef896d');g.addColorStop(.4,'#ffb090');g.addColorStop(1,'#a8503e');
 c.fillStyle=g;N.rr(c,-17,-130+rc*10,34,140,12);c.fill();c.strokeStyle='rgba(40,20,30,.55)';c.lineWidth=3;c.stroke();
 c.fillStyle='#4a3a58';N.rr(c,-11,-158+rc*12,22,38,8);c.fill();c.stroke();
 c.fillStyle='#1a1226';c.beginPath();c.ellipse(0,-158+rc*12,8,4,0,0,TAU);c.fill();
 c.fillStyle='rgba(255,255,255,.4)';N.rr(c,-11,-120,7,100,4);c.fill();
 c.fillStyle='#f2ce77';N.rr(c,-26,-50,52,22,8);c.fill();c.stroke();
 c.restore();
 if(rc>.5){N.glow(c,gx+Math.sin(ang)*158,gy-Math.cos(ang)*158-rc*10,40,'#ffd080',rc);}
}
function drawReticle(c,api){
 const x=S.rx,y=S.ry,k=S.recoil,ret=S.ret;let col=S.reload>=0?'#ffd08a':S.ammo<=0?'#ff8a6a':'#fff0d4';
 c.save();c.translate(x,y-k*8);c.strokeStyle=col;c.fillStyle=col;c.lineWidth=3;c.shadowColor='rgba(0,0,0,.6)';c.shadowBlur=4;
 const r=14+k*6;
 if(ret===0){c.beginPath();c.arc(0,0,3,0,TAU);c.fill();c.beginPath();c.arc(0,0,r,0,TAU);c.stroke();}
 else if(ret===1){c.beginPath();c.arc(0,0,r+4,0,TAU);c.stroke();c.beginPath();c.arc(0,0,r-6,0,TAU);c.stroke();c.fillRect(-2,-2,4,4);}
 else{c.beginPath();c.moveTo(-r-8,0);c.lineTo(-5,0);c.moveTo(5,0);c.lineTo(r+8,0);c.moveTo(0,-r-8);c.lineTo(0,-5);c.moveTo(0,5);c.lineTo(0,r+8);c.stroke();c.beginPath();c.arc(0,0,r,0,TAU);c.stroke();}
 if(S.reload>=0){const kk=S.reload/S.rtot;c.shadowBlur=0;c.lineWidth=7;c.strokeStyle='rgba(20,12,30,.7)';c.beginPath();c.arc(0,0,r+14,0,TAU);c.stroke();c.strokeStyle='#ffd08a';c.beginPath();c.arc(0,0,r+14,-Math.PI/2,-Math.PI/2+TAU*kk);c.stroke();
  if(S.canSweet){c.strokeStyle='#91e0a8';c.lineWidth=9;c.beginPath();c.arc(0,0,r+14,-Math.PI/2+TAU*S.sweet[0],-Math.PI/2+TAU*S.sweet[1]);c.stroke();}}
 c.restore();
}
function drawHUD(c,api){
 const W=api.W,H=api.H,por=api.portrait;
 for(let i=0;i<3;i++)heart(c,24+i*34,por?100:100,15,'#ef6a6a',i<S.hearts);
 // ammo
 const ax=14,ay=H-46;
 for(let i=0;i<S.maxAmmo;i++){const on=i<S.ammo;c.save();c.translate(ax+i*18+8,ay);c.fillStyle=on?'#f2ce77':'rgba(20,12,30,.55)';N.rr(c,-5,-4,10,28,4);c.fill();c.fillStyle=on?'#ef896d':'rgba(20,12,30,.55)';c.beginPath();c.moveTo(-5,-4);c.quadraticCurveTo(0,-18,5,-4);c.fill();c.strokeStyle='rgba(30,16,34,.6)';c.lineWidth=1.5;c.stroke();c.restore();}
 T(c,S.reload>=0?'RELOADING':S.ammo<=0?(api.touch?'TAP RELOAD':'PRESS R'):S.ammo+'/'+S.maxAmmo,ax,ay+42,12,S.ammo<=0?'#ff8a6a':'#fff0d4','left',{stroke:null});
 const acc=S.shots?Math.round(S.hits/S.shots*100):100;
 const m=mult();
 N.chip(c,W-336,por?100:6,100,'WAVE',S.wave>=5?'BOSS':(S.wave+1)+'/5');
 N.chip(c,W-228,por?100:6,100,'ACCURACY',acc+'%',{color:acc>=75?'#9de3d1':'#fff0d4'});
 N.chip(c,W-120,por?100:6,108,'COMBO ×'+m,S.streak,{color:m>=3?'#ffe08a':'#fff0d4'});
 if(S.wave<5&&S.wave>=0){const d=WAVEDEF[S.wave];N.bar(c,por?12:W-336,por?146:50,por?W-24:324,8,(S.killed+S.escaped)/d.n,'#91c9a7');}
 if(S.boss&&!S.bossDead){const bw=Math.min(420,W-60);N.bar(c,(W-bw)/2,por?126:50,bw,14,S.boss.hp/S.boss.max,'#ef6a6a');T(c,'BUBBLE BARON',W/2,por?138:62,11,'#fff0d4','center',{stroke:null});}
 // reload button (touch & mouse)
 const b=reloadBtn(api);N.slab(c,b.x,b.y,b.w,b.h,14,S.reload>=0?'#8a6a30':S.ammo<=0?'#c04a3a':'#5a4a68',{depth:4});T(c,'RELOAD',b.x+b.w/2,b.y+b.h/2+5,14,'#fff0d4','center',{stroke:null});
 if(S.bannerT>0){c.save();c.globalAlpha=Math.min(1,S.bannerT*2);c.fillStyle='rgba(18,12,30,.58)';c.fillRect(0,H*.34,W,H*.2);T(c,S.banner,W/2,H*.44,Math.min(W,540)/10,S.wave>=5?'#ef896d':'#ffe08a','center',{glow:S.wave>=5?'#ef896d':'#ffe08a'});T(c,S.sub,W/2,H*.5,17,'#fff0d4','center',{stroke:null});c.restore();}
 if(S.flash>0){c.fillStyle='rgba(255,100,100,'+S.flash*.5+')';c.fillRect(0,0,W,H);}
}
const reloadBtn=api=>({x:api.W-112,y:api.H-60,w:100,h:44});
/* ---------- module ---------- */
NEXUS_GAMES.register('target',{
 ...(DBG?{dbg:()=>S}:{}),
 meta:{title:'Bubble Blaster',help:'A carnival shooting gallery. Limited ammo, civilians, cover and a boss.',controls:'MOUSE aim + CLICK shoot · R reload (hit the green zone!) · ARROWS + SPACE',type:'AIM · AMMO'},
 size:[900,520],portraitSize:[540,860],duration:110,tier:1.1,
 touch:[{kind:'btn',side:'right',label:'RELOAD',key:'r',cls:'alt'}],
 init(api){newState(api);},
 start(api){newState(api);setWave(api,0);},
 update(dt,api){
  const W=api.W,H=api.H,mul=api.diff.mul;S.t+=dt;if(S.bannerT>0)S.bannerT-=dt;if(S.flash>0)S.flash-=dt;if(S.cool>0)S.cool-=dt;S.recoil=Math.max(0,S.recoil-dt*6);
  for(const t of S.trc)t.t-=dt;
  // keyboard aim
  const sp=420*dt;if(S.hold.ArrowLeft)S.rx-=sp;if(S.hold.ArrowRight)S.rx+=sp;if(S.hold.ArrowUp)S.ry-=sp;if(S.hold.ArrowDown)S.ry+=sp;S.rx=cl(S.rx,0,W);S.ry=cl(S.ry,60,H);
  if(S.reload>=0){S.reload+=dt;if(S.reload>=S.rtot){S.reload=-1;S.ammo=S.maxAmmo;S.canSweet=false;api.sound(700,.06,'triangle',.04);}}
  if(S.endT>=0){S.endT-=dt;if(S.endT<0)end(api,true);}
  if(S.done)return;
  // waves
  if(S.wave<5&&S.wave>=0){const d=WAVEDEF[S.wave];
   if(S.spawned<d.n){S.spawnT-=dt;if(S.spawnT<=0){S.spawnT=d.iv*R(.7,1.3)/Math.pow(mul,.5);if(S.alive<(5+S.wave)){spawnWaveTarget(api);}}}
   else if(S.alive<=0||S.tg.every(o=>o.type==='civ'||o.type==='ammo'||o.dead)){if(S.clearT<0){S.clearT=1.1;const acc=S.waveAcc[1]?S.waveAcc[0]/S.waveAcc[1]:0;const bonus=10+Math.round(acc*15);api.addScore(bonus,W/2,H*.4,'#9de3d1');api.popText('WAVE CLEAR · ACC '+Math.round(acc*100)+'%',W/2,H*.35,'#fff0d4');sfx(api,'win');
     S.hearts=Math.min(3,S.hearts+(acc>=.8?1:0));S.ammo=S.maxAmmo;if(S.reload>=0)S.reload=-1;
     for(const o of S.tg){if(o.type==='civ'||o.type==='ammo')o.dead=2;}}
    else{S.clearT-=dt;if(S.clearT<=0){if(S.wave===4){setWave(api,5);}else setWave(api,S.wave+1);}}}
  }else if(S.wave>=5&&!S.bossDead){
   if(!S.bossSpawned){spawnBoss(api);}
   const b=S.boss;if(b){b.t+=dt;b.arrive=Math.min(1,b.arrive+dt/.8);const ph=b.hp/b.max;const sp2=ph<.33?1.9:ph<.66?1.4:1;
    b.x=W/2+Math.sin(b.t*.9*sp2)*W*.32;b.y=H*.3+Math.sin(b.t*1.8*sp2)*H*.07+(1-E.out(b.arrive))*-200;if(b.flash>0)b.flash-=dt;
    b.phaseT-=dt;if(b.phaseT<=0){if(b.state==='closed'){b.state='tel';b.phaseT=.55;}else if(b.state==='tel'){b.state='open';b.phaseT=(ph<.33?1.3:1.7)/Math.pow(mul,.4)+(api.mastery>=2?.2:0);sfx(api,'ping');}else{b.state='closed';b.phaseT=(ph<.33?1.3:2.0)/Math.pow(mul,.5);}}
    b.minT-=dt;if(b.minT<=0){b.minT=(ph<.33?1.5:2.4)/Math.sqrt(mul);if(S.tg.filter(o=>!o.dead).length<5){const pat=['rail','arc','zig'][RI(0,2)];const ty=ph<.66&&Math.random()<.3?'civ':Math.random()<.2?'ammo':'n';spawn(api,ty,pat);}}
   }
  }
  // targets
  for(let i=S.tg.length-1;i>=0;i--){const o=S.tg[i];
   if(o.dead){S.tg.splice(i,1);if(o.dead===1&&o.type!=='civ'&&o.type!=='ammo'){S.killed++;S.alive--;}else if(o.dead===1){}continue;}
   o.t+=dt;if(o.flash>0)o.flash-=dt;
   if(o.pat==='rail'){o.x+=o.vx*dt;o.y+=Math.sin(o.t*3+o.seed)*o.bobA*dt;}
   else if(o.pat==='arc'){o.x+=o.vx*dt;o.vy+=o.g*dt;o.y+=o.vy*dt;}
   else if(o.pat==='zig'){o.x+=o.vx*dt;const ph=(o.t*o.zf)%2;o.y=o.y0+(ph<1?ph*2-1:3-ph*2)*o.za;}
   else{o.ang+=o.w*dt;o.cx+=o.drift*dt;o.x=o.cx+Math.cos(o.ang)*o.R;o.y=o.cy+Math.sin(o.ang)*o.R*.8;}
   const out=o.x<-70||o.x>W+70||o.y>H+80||o.t>10;
   if(out&&(o.t>.5||o.pat!=='arc'||o.vy>0)){S.tg.splice(i,1);if(o.type!=='civ'&&o.type!=='ammo'){S.escaped++;S.alive--;S.streak=0;api.combo=0;}}
  }
  for(const cv of S.cov){cv.x+=cv.vx*dt;if(cv.x>W+80)cv.x=-80;if(cv.x<-80)cv.x=W+80;}
 },
 draw(c,api){
  bg(c,api);if(!S)return;
  const t=S.t;
  const order=S.tg.slice().sort((a,b)=>a.z-b.z);
  for(const o of order)drawTarget(c,o,t,api);
  if(S.boss&&!S.bossDead)drawBoss(c,S.boss,t);
  for(const cv of S.cov)drawCover(c,cv,t);
  if(api.running){
   for(const tr of S.trc){if(tr.t>0){c.save();c.globalAlpha=tr.t*8;c.strokeStyle='#fff0d4';c.lineWidth=2.5;c.beginPath();c.moveTo(api.W/2,api.H);c.lineTo(tr.x,tr.y);c.stroke();c.restore();}}
   drawGun(c,api);drawHUD(c,api);drawReticle(c,api);}
  N.vignette(c,api.W,api.H,.35);
  if(!api.running){readyScreen(c,api,'BUBBLE BLASTER','Clear 5 waves of carnival targets, then pop the Bubble Baron boss. Ammo is limited - make every shot count!',[
   'Aim and click/tap to fire. 6 shots per magazine.','Reload with R or the RELOAD button - press again in the green zone for a perfect reload.','Do NOT shoot the bunny civilians (lose a heart). Crates block bullets.','Bullseyes pay +50%. Blue ammo bubbles refill 3 shots.','Boss: shoot its core only while the visor glows red.'],PAL.coral,
   'BEST '+(api.store.get('top',[])[0]||0)+' · BEST ACC '+api.store.get('acc',0)+'% · FURTHEST WAVE '+(api.store.get('stage',0)+1));}
 },
 pointerdown(x,y,e,api){S.rx=x;S.ry=y;const b=reloadBtn(api);if(x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h){reloadKey(api);return;}shoot(api,x,y);},
 pointermove(x,y,e,api){S.rx=x;S.ry=y;},
 keydown(e,api){const k=e.key;
  if(k==='r'||k==='R'){reloadKey(api);}
  else if(k===' '||k==='Enter')shoot(api,S.rx,S.ry);
  else if(k.startsWith('Arrow'))S.hold[k]=true;
  else if(k==='c'||k==='C'){S.ret=(S.ret+1)%Math.min(3,1+(api.store.get('retUnlock',0)||0)+(api.store.get('stage',0)>=2?1:0));api.store.set('ret',S.ret);}
 },
 keyup(e,api){if(e.key.startsWith('Arrow'))S.hold[e.key]=false;},
 timeUp(api){end(api,false);}
});
})();

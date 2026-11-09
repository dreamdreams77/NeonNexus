/* games/sushi.js — Neon Nexus cabinet module */
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
/* ===== SUSHI CATCH ===== */
const FOOD=[{id:'salmon',n:'Salmon',c:'#f08a6a'},{id:'tuna',n:'Tuna',c:'#c4465a'},{id:'shrimp',n:'Shrimp',c:'#f6a850'},{id:'maki',n:'Maki',c:'#6ab890'},{id:'egg',n:'Tamago',c:'#f4d870'}];
const ANIMALS=[{n:'cat',c:'#e8b080',ear:'tri'},{n:'bear',c:'#a8785a',ear:'round'},{n:'frog',c:'#8ac878',ear:'bump'},{n:'bunny',c:'#f0e0e8',ear:'long'},{n:'owl',c:'#b8a0d0',ear:'tri'}];
const TOTAL=[5,5,6];
let S=null;
function geo(api){const W=api.W,H=api.H,por=api.portrait;return{custY:por?150:94,beltY:por?390:268,trayY:H-86,sw:(W-30)/3,sx:i=>15+(W-30)/3*(i+.5)};}
function newState(api){
 const m=api.mastery,g=geo(api);
 S={t:0,wave:0,served:0,cust:[null,null,null],arrive:[1,3,5],plates:[],tray:[],cap:m>=4?5:4,tx:api.W/2,tv:0,tw:m>=2?124:110,hearts:3+(m>=2?1:0),maxHearts:3+(m>=2?1:0),streak:0,best:0,mult:1,spawn:[.5,1.3,2.1],
  spawnedC:0,leftC:0,stun:0,bannerT:0,banner:'',sub:'',fly:[],done:false,endT:-1,win:false,keys:{},tgt:null,goldCaught:0,spoilCaught:0,forgive:m>=6?1:0,bgT:0,perfect:true,waveCleared:0,dump:0,vip:0,spoilWarn:0};
 g.sw;
}
function wantList(){const w=[];for(const c of S.cust)if(c)for(const p of c.order)if(!p.got)w.push(p.t);return w;}
function newCustomer(api,slot){
 const wv=S.wave,vip=wv===2&&S.spawnedC%TOTAL[wv]===TOTAL[wv]-1,n=vip?3:cl(RI(1,1+wv+1),1,3);
 const order=[];for(let i=0;i<n;i++)order.push({t:RI(0,wv===0?2:4),got:0});
 const pat=(vip?34:24-wv*2.5)*(api.diff.mul<1?1.3:api.diff.mul>1?.8:1);
 S.cust[slot]={order,pat,max:pat,an:ANIMALS[RI(0,4)],vip,t:0,in:0,mood:0,hop:0,done:0};S.spawnedC++;
}
function startWave(api,w){S.wave=w;S.spawnedC=0;S.banner='ORDER UP · ROUND '+(w+1);S.sub=w===2?'VIP guest at the end - golden plates are wild!':w===1?'Bigger orders, more spoiled fish':'Catch plates, serve the right combos';S.bannerT=1.8;sfx(api,'ping');if(w>0)api.addScore(15,api.W/2,api.H*.3,'#9de3d1');
 S.arrive=[.8,2.6,4.4];}
function spawnPlate(api,st){
 const g=geo(api),wv=S.wave,r=Math.random(),want=wantList();
 let type,kind='n';
 if(r<.04+(api.mastery>=6?.04:0)){kind='gold';type=RI(0,4);}
 else if(r<.04+.1+wv*.025&&S.t>6){kind='bad';type=RI(0,4);}
 else{type=want.length&&Math.random()<.65?want[RI(0,want.length-1)]:RI(0,wv===0?2:4);}
 const dir=st===1?-1:1,half=g.sw*.4;
 S.plates.push({x:g.sx(st)-dir*half,y:g.beltY-14,vx:dir*(70+wv*18+st*8)*api.diff.mul,vy:0,st,type,kind,state:'belt',rot:R(-.1,.1),t:0,cx:g.sx(st)});
}
function catchPlate(api,p){
 const g=geo(api);
 if(p.kind==='bad'){
  if(S.forgive>0){S.forgive=0;api.popText('SAVED!',S.tx,g.trayY-50,'#9de3d1');}
  else{S.hearts--;S.spoilCaught++;S.streak=0;S.cb=0;S.stun=.8;api.popText('SPOILED!',S.tx,g.trayY-60,'#9acf6a');api.shake(10,.3);sfx(api,'lose');S.perfect=false;api.addScore(-3);if(S.hearts<=0)return finishGame(api,false);}
  api.burst(p.x,p.y,'#8ac060',12);return;}
 if(S.tray.length>=S.cap){api.popText('FULL!',S.tx,g.trayY-50,'#ffb0a0');sfx(api,'miss');return;}
 S.tray.push({type:p.type,kind:p.kind,t:0});S.streak++;S.best=Math.max(S.best,S.streak);api.combo=S.streak;
 const need=wantList().includes(p.type)||p.kind==='gold';
 if(p.kind==='gold'){S.goldCaught++;api.popText('GOLDEN!',p.x,p.y-30,'#ffe08a');sfx(api,'coin');api.burst(p.x,p.y,'#ffe08a',18);if(S.goldCaught>=3)api.achieve('gold','Golden Hands',5);}
 else{sfx(api,'pop');api.burst(p.x,p.y,FOOD[p.type].c,6);}
 S.tv*=.6;
}
function serve(api,ci){
 const c=S.cust[ci];if(!c||c.done||!c.in)return;let given=0;const g=geo(api);
 for(const p of c.order){if(p.got)continue;
  let k=S.tray.findIndex(t=>t.type===p.t&&t.kind!=='gold');if(k<0)k=S.tray.findIndex(t=>t.kind==='gold');
  if(k>=0){const t=S.tray.splice(k,1)[0];p.got=t.kind==='gold'?2:1;given++;S.fly.push({x:S.tx,y:g.trayY-30,tx:g.sx(ci),ty:g.custY+20,t:0,type:t.type,kind:t.kind});
   const pts=2*S.mult*(t.kind==='gold'?3:1);api.addScore(Math.round(pts),g.sx(ci),g.custY+60,t.kind==='gold'?'#ffe08a':'#fff0d4');}}
 if(!given){api.popText('NOT ON TRAY',g.sx(ci),g.custY+70,'#ffb0a0');sfx(api,'miss');return;}
 sfx(api,'coin');c.hop=.3;S.dumpFeed=0;
 if(c.order.every(p=>p.got)){
  c.done=1;c.t=0;S.served++;S.cb=Math.min(1.5,(S.cb||0)+(c.vip?1:.5));
  const tip=Math.round(6*cl(c.pat/c.max,0,1)),bonus=6+tip+(c.vip?20:0);api.addScore(Math.round(bonus*Math.min(2,S.mult)),g.sx(ci),g.custY+10,'#9de3d1');api.popText(tip>=4?'FAST TIP!':'THANK YOU!',g.sx(ci),g.custY+86,'#ffe08a');api.burst(g.sx(ci),g.custY+30,'#ffe08a',16);sfx(api,'win');c.mood=2;
  S.leftC++;S.arrive[ci]=1.4;
  if(S.served>=1)api.achieve('first','First Order',2);if(S.served>=10)api.achieve('ten','Sushi Chef',5);
 }
}
function leave(api,ci){const c=S.cust[ci];c.done=2;c.t=0;c.mood=-1;S.hearts--;S.streak=0;S.cb=0;S.perfect=false;S.leftC++;S.arrive[ci]=1.6;api.popText('LEFT ANGRY!',geo(api).sx(ci),geo(api).custY+70,'#ff8a6a');sfx(api,'lose');api.shake(8,.25);if(S.hearts<=0)finishGame(api,false);}
function finishGame(api,win){if(S.done)return;S.done=true;S.endT=1.3;S.win=win;if(!win){sfx(api,'lose');}}
function realFinish(api){topScores(api,api.score);if(S.win&&S.perfect)api.achieve('perfect','Flawless Service',10);if(S.win)api.achieve('clear','Master Itamae',8);
 if(S.wave>api.store.get('stage',0))api.store.set('stage',S.wave);
 api.finish(S.win,{grade:gradeOf(cl(api.score/330,0,1),S.win)+' · SERVED '+S.served,combo:S.best});}
/* ---------- drawing ---------- */
function bg(c,api){
 const g=geo(api);
 const o=bgCache('sus'+api.W+'x'+api.H,api.W,api.H,(x,W,H)=>{N.bgGrad(x,W,H,['#4a2c3a','#7a4a44','#b8805a']);
  x.fillStyle='rgba(255,230,200,.06)';for(let i=0;i<W/40;i++)x.fillRect(i*40,0,18,H);
  // noren curtain
  for(let i=0;i<8;i++){const w=W/8;const gr=x.createLinearGradient(0,0,0,50);gr.addColorStop(0,'#2a3a6a');gr.addColorStop(1,'#3a4a80');x.fillStyle=gr;N.rr(x,i*w+3,0,w-6,48,8);x.fill();x.fillStyle='rgba(255,255,255,.7)';x.beginPath();x.arc(i*w+w/2,24,9,0,TAU);x.fill();x.fillStyle='#c0405a';x.beginPath();x.arc(i*w+w/2,24,5,0,TAU);x.fill();}
  // lanterns
  [W*.08,W*.92].forEach(lx=>{x.fillStyle='#e0604a';N.rr(x,lx-16,58,32,44,12);x.fill();x.strokeStyle='rgba(60,20,20,.5)';x.lineWidth=2;x.stroke();x.fillStyle='rgba(255,220,150,.5)';x.beginPath();x.ellipse(lx-5,74,5,10,0,0,TAU);x.fill();});
  // counter top (customers)
  const cy=g.custY+58;const cg=x.createLinearGradient(0,cy,0,cy+30);cg.addColorStop(0,'#d8a070');cg.addColorStop(1,'#8a5a3a');x.fillStyle=cg;x.fillRect(0,cy,W,30);x.fillStyle='rgba(255,255,255,.18)';x.fillRect(0,cy,W,3);x.fillStyle='rgba(30,10,30,.3)';x.fillRect(0,cy+30,W,6);N.coil(x,-6,cy+2,W+12,26,10);
  // floor / chef zone
  const fg=x.createLinearGradient(0,g.trayY-40,0,H);fg.addColorStop(0,'#6a4030');fg.addColorStop(1,'#3a2020');x.fillStyle=fg;x.fillRect(0,g.trayY+20,W,H);x.fillStyle='rgba(255,255,255,.15)';x.fillRect(0,g.trayY+20,W,3);
 });
 c.drawImage(o,0,0);
}
/* ---- claymation sprites (baked once) ---- */
const SPR={};
function speckle(g,w,h,seed,n,clip){const rn=N.mulberry(seed);g.save();if(clip)clip(g);for(let i=0;i<n;i++){g.fillStyle=rn()<.5?'rgba(40,16,36,.16)':'rgba(255,245,225,.2)';g.beginPath();g.arc(rn()*w,rn()*h,.6+rn()*.8,0,TAU);g.fill();}g.restore();}
function dent(g,x,y,r){g.fillStyle='rgba(60,24,48,.15)';g.beginPath();g.ellipse(x,y,r,r*.7,-.3,0,TAU);g.fill();g.strokeStyle='rgba(255,245,225,.22)';g.lineWidth=1.3;g.beginPath();g.ellipse(x,y,r,r*.7,-.3,.4,2.6);g.stroke();}
function soft(g,x,y,rx,ry,a){g.fillStyle='rgba(255,246,228,'+a+')';g.beginPath();g.ellipse(x,y,rx,ry,-.4,0,TAU);g.fill();}
function clayBlob(g,x,y,r,col,seed,o){N.blob(g,x,y,r,col,seed,Object.assign({noShine:true,shadow:false},o||null));}
function plateSpr(type,kind){const k='pl'+type+kind;if(SPR[k])return SPR[k];const cv=document.createElement('canvas');cv.width=100;cv.height=84;const g=cv.getContext('2d');g.translate(50,50);
 g.fillStyle='rgba(40,16,40,.3)';g.beginPath();g.ellipse(4,18,34,8,0,0,TAU);g.fill();
 clayBlob(g,0,10,27,kind==='gold'?'#f0d080':'#f4e8d0',type+3,{sx:1.5,sy:.42});soft(g,-10,6,16,4,.3);dent(g,14,13,5);
 let col=FOOD[type].c;if(kind==='bad')col=N.mix(col,'#7a9a3a',.65);
 if(type===3){clayBlob(g,0,-3,15,'#3e4e40',7,{sx:1,sy:.9});clayBlob(g,0,-4,11,'#fbf3e2',8,{});clayBlob(g,0,-4,5,kind==='bad'?'#8aa040':'#e87a6a',9,{});g.fillStyle='#8ac878';g.beginPath();g.arc(-2,-5,2,0,TAU);g.fill();soft(g,-6,-9,6,3,.3);}
 else if(type===4){clayBlob(g,0,-3,16,'#fbf3e2',10,{sx:1.2,sy:.55});clayBlob(g,0,-11,15,col,11,{sx:1.25,sy:.5});clayBlob(g,0,-7,5,'#3e4e40',12,{sx:.9,sy:1.5});soft(g,-6,-14,8,3,.3);}
 else{clayBlob(g,0,-1,14,'#fbf3e2',13,{sx:1.35,sy:.75});dent(g,-6,0,3);clayBlob(g,0,-11,15,col,14+type,{sx:1.3,sy:.5});g.strokeStyle='rgba(255,240,220,.35)';g.lineWidth=1.6;g.beginPath();g.moveTo(-9,-12);g.quadraticCurveTo(0,-15,9,-12);g.stroke();clayBlob(g,0,-7,4.5,'#3e4e40',15,{sx:.9,sy:1.5});soft(g,-7,-14,8,3,.3);}
 speckle(g,100,84,type+5,80);SPR[k]=cv;return cv;}
function drawPlate(c,x,y,type,kind,s,t,rot){
 c.save();c.translate(x,y);c.rotate(rot||0);c.scale(s,s);
 if(kind==='gold')N.glow(c,0,0,48,'#ffd870',.5+.15*Math.sin(t*8));
 c.drawImage(plateSpr(type,kind),-50,-50);
 if(kind==='bad'){c.strokeStyle='rgba(140,200,80,.9)';c.lineWidth=2.4;for(let i=-1;i<=1;i++){c.beginPath();c.moveTo(i*9,-20);for(let k=1;k<=4;k++)c.lineTo(i*9+Math.sin(t*6+k+i)*4,-20-k*5);c.stroke();}c.fillStyle='#2a1a2c';c.beginPath();c.arc(Math.cos(t*5)*14,-26+Math.sin(t*7)*4,2.2,0,TAU);c.arc(Math.cos(t*4+2)*12,-22+Math.sin(t*6)*5,2.2,0,TAU);c.fill();}
 c.restore();
}
const CBODY=['#4a6a98','#98684a','#6a984a'];
function custSpr(ai,vip,r){const k='cu'+ai+vip;if(SPR[k])return SPR[k];const an=ANIMALS[ai],cv=document.createElement('canvas');cv.width=150;cv.height=150;const g=cv.getContext('2d');g.translate(75,82);const R0=34;
 g.fillStyle='rgba(40,16,40,.3)';g.beginPath();g.ellipse(4,R0*1.55,R0*1.2,9,0,0,TAU);g.fill();
 clayBlob(g,0,R0*1.15,R0*1.0,vip?'#c8a030':CBODY[ai%3],ai+21,{sx:1.25,sy:.7});dent(g,-12,R0*1.2,5);
 const ec=N.shade(an.c,-.12);
 if(an.ear==='tri'){for(const sd of[-1,1]){clayBlob(g,sd*R0*.62,-R0*.85,R0*.34,ec,ai+31+sd,{sx:.8,sy:1.1});}}
 else if(an.ear==='round'||an.ear==='bump'){for(const sd of[-1,1]){clayBlob(g,sd*R0*.72,-R0*.74,R0*.3,ec,ai+41+sd,{});}}
 else{for(const sd of[-1,1]){clayBlob(g,sd*R0*.4,-R0*1.35,R0*.2,ec,ai+51+sd,{sx:.8,sy:2.1});}}
 clayBlob(g,0,0,R0,an.c,ai+7,{sx:1.08,sy:1});soft(g,-10,-12,16,9,.28);dent(g,16,10,4);dent(g,-18,14,3.2);
 g.strokeStyle='rgba(60,30,40,.25)';g.lineWidth=1.5;g.beginPath();g.moveTo(-R0*.7,R0*.5);g.quadraticCurveTo(0,R0*.78,R0*.7,R0*.5);g.stroke(); // hand-pressed seam
 speckle(g,150,150,ai+9,160);SPR[k]=cv;return cv;}
function drawCust(c,api,ci,g){
 const cu=S.cust[ci];if(!cu)return;const x=g.sx(ci);
 const slide=cu.done?1-E.out(Math.min(1,cu.t/.5)):E.out(Math.min(1,cu.in));if(slide<=.02)return;
 const q=Math.floor(S.bgT*12),jit=Math.sin(q*1.9+ci*2)*.025,sqz=1+Math.sin(q*1.3+ci)*.025;
 const r=cu.vip?38:34,y=g.custY+(1-slide)*-120-(cu.hop>0?Math.sin(cu.hop/.3*Math.PI)*12:0);
 const ai=Math.max(0,ANIMALS.indexOf(cu.an));
 c.save();c.translate(x,y);c.rotate(jit);c.scale(r/34/sqz,r/34*sqz);
 c.drawImage(custSpr(ai,cu.vip?1:0),-75,-82);
 const pr=cu.pat/cu.max,mood=cu.mood,R0=34,eyes=cu.done===2?'x':pr<.3?'w':'n';
 for(const sd of[-1,1]){c.fillStyle='#fbf3e2';c.beginPath();c.ellipse(sd*R0*.36,-R0*.1,R0*.2,R0*.23,0,0,TAU);c.fill();c.strokeStyle='#2a1a2c';c.lineWidth=2;c.stroke();c.fillStyle='#2a1a2c';c.beginPath();c.arc(sd*R0*.36+(eyes==='x'?0:Math.sin(q*.5)*1.2),-R0*.07,R0*(eyes==='w'?.12:.1),0,TAU);c.fill();}
 c.fillStyle='rgba(224,120,120,.45)';for(const sd of[-1,1]){c.beginPath();c.ellipse(sd*R0*.62,R0*.22,5,3.5,0,0,TAU);c.fill();}
 c.strokeStyle='#4a2a30';c.lineWidth=2.6;c.lineCap='round';c.beginPath();if(mood>0||pr>.6)c.arc(0,R0*.2,R0*.25,.2,Math.PI-.2);else if(mood<0||pr<.3)c.arc(0,R0*.5,R0*.22,Math.PI+.3,-.3);else{c.moveTo(-R0*.2,R0*.35);c.lineTo(R0*.2,R0*.35);}c.stroke();
 c.fillStyle='#d87a80';c.beginPath();c.ellipse(0,R0*.12,R0*.11,R0*.08,0,0,TAU);c.fill();
 if(cu.vip){c.fillStyle='#e8b840';c.beginPath();c.moveTo(-R0*.5,-R0*.85);c.lineTo(-R0*.5,-R0*1.3);c.lineTo(-R0*.25,-R0*1.05);c.lineTo(0,-R0*1.4);c.lineTo(R0*.25,-R0*1.05);c.lineTo(R0*.5,-R0*1.3);c.lineTo(R0*.5,-R0*.85);c.closePath();c.fill();c.strokeStyle='#2a1a2c';c.lineWidth=2.2;c.lineJoin='round';c.stroke();}
 c.restore();
 if(!cu.done){
  const n=cu.order.length,bw=n*40+16,bx=x-bw/2,by=g.custY+r+34;
  c.save();c.fillStyle='rgba(250,240,222,.97)';N.rr(c,bx,by-6,bw,48,16);c.fill();c.strokeStyle='#2a1a2c';c.lineWidth=2.5;c.stroke();c.strokeStyle='rgba(255,255,255,.35)';c.lineWidth=2;N.rr(c,bx+3,by-3,bw-6,42,14);c.stroke();
  cu.order.forEach((p,i)=>{c.globalAlpha=p.got?.35:1;drawPlate(c,bx+28+i*40-8,by+26,p.t,'n',.62,0);if(p.got){c.globalAlpha=1;c.fillStyle='#3a8a5a';c.font='900 20px sans-serif';c.textAlign='center';c.fillText('✓',bx+20+i*40,by+22);}});c.restore();
  N.bar(c,x-48,by+46,96,9,pr,pr>.5?'#91c9a7':pr>.25?'#f2ce77':'#ef6a5a');
 }
}
function drawTray(c,api,g){
 const x=S.tx,y=g.trayY,w=S.tw,lean=cl(S.tv/600,-.25,.25),q=Math.floor(S.bgT*12);
 c.save();c.translate(x,y);c.rotate(lean);
 // clay sleeve + hand
 const k='tray'+w;let sp=SPR[k];if(!sp){sp=SPR[k]=document.createElement('canvas');sp.width=Math.ceil(w+60);sp.height=130;const gg=sp.getContext('2d');gg.translate(sp.width/2,30);
  gg.fillStyle='rgba(40,16,40,.3)';gg.beginPath();gg.ellipse(5,18,w*.52,9,0,0,TAU);gg.fill();
  clayBlob(gg,0,50,15,'#e8d8f0',3,{sx:.95,sy:2.4});dent(gg,-3,58,4);
  clayBlob(gg,0,16,17,'#e8b890',4,{sx:1.1,sy:.7});
  clayBlob(gg,0,0,w*.28,'#c8925a',5,{sx:1.8,sy:.2});dent(gg,-w*.25,2,6);dent(gg,w*.2,1,5);
  gg.strokeStyle='rgba(70,36,30,.28)';gg.lineWidth=1.6;gg.beginPath();gg.moveTo(-w*.4,5);gg.quadraticCurveTo(0,9,w*.4,5);gg.stroke();
  gg.strokeStyle='#d8b078';gg.lineWidth=3.2;gg.lineCap='round';gg.beginPath();gg.moveTo(-w*.3,-3);gg.lineTo(w*.28,-6);gg.moveTo(-w*.28,0);gg.lineTo(w*.3,-3);gg.stroke(); // chopsticks
  speckle(gg,sp.width,130,w,90);}
 c.drawImage(sp,-sp.width/2,-30);
 S.tray.forEach((p,i)=>{const px=(i-(S.tray.length-1)/2)*(w*.9/Math.max(3,S.cap)),py=-6-(i%2)*2+(Math.sin(q+i)*.6);drawPlate(c,px,py,p.type,p.kind,.7,S.t);});
 if(S.stun>0){T(c,'STUNNED',0,-40,15,'#9acf6a','center',{stroke:null});}
 c.restore();
}
function drawHUD(c,api){
 const W=api.W,H=api.H,por=api.portrait,g=geo(api);
 for(let i=0;i<S.maxHearts;i++)heart(c,24+i*32,26,14,'#ef6a6a',i<S.hearts);
 N.chip(c,W-258,5,118,'SERVED',S.served+' / '+(TOTAL[0]+TOTAL[1]+TOTAL[2]));N.chip(c,W-134,5,122,'MULT ×'+S.mult.toFixed(1),S.streak,{color:S.mult>=2?'#ffe08a':'#fff0d4'});
 N.chip(c,W/2-60,5,120,'ROUND',(S.wave+1)+' / 3');
 T(c,'tray '+S.tray.length+'/'+S.cap,S.tx,g.trayY+54,12,'#fff0d4','center',{stroke:null});
 if(S.bannerT>0){c.save();c.globalAlpha=Math.min(1,S.bannerT*2);c.fillStyle='rgba(18,12,30,.6)';c.fillRect(0,H*.4,W,H*.17);T(c,S.banner,W/2,H*.49,Math.min(W,540)/11,PAL.gold,'center',{glow:PAL.gold});T(c,S.sub,W/2,H*.54,16,'#fff0d4','center',{stroke:null});c.restore();}
 T(c,api.touch?'DRAG to move · TAP guest to serve · TAP tray to dump':'A/D move · SPACE serve · 1-3 pick guest · X dump',W/2,H-12,12,'rgba(255,240,208,.75)','center',{stroke:null});
}
function beltSpr(w){const k='belt'+Math.round(w);if(SPR[k])return SPR[k];const cv=document.createElement('canvas');cv.width=Math.ceil(w)+20;cv.height=70;const g=cv.getContext('2d');g.translate(10,8);
 g.fillStyle='rgba(40,16,40,.3)';g.beginPath();g.ellipse(w/2+4,32,w/2,8,0,0,TAU);g.fill();
 N.slab(g,0,0,w,28,14,'#5a4a6a',{shadow:false,depth:0});clayBlob(g,w/2,14,w*.45,'#5a4a6a',6,{sx:1,sy:.16});
 N.coil(g,0,0,w,28,14);
 for(const s of[-1,1]){clayBlob(g,w/2+s*(w/2-8),14,12,'#8a7a98',s+9,{});dent(g,w/2+s*(w/2-8)-2,12,3);}
 g.fillStyle='#2a1a2c';N.rr(g,w/2-26,20,52,14,6);g.fill();clayBlob(g,w/2,36,28,'#e0604a',8,{sx:1.1,sy:.14});
 speckle(g,cv.width,70,w,70);SPR[k]=cv;return cv;}
function slatSpr(){if(SPR.slat)return SPR.slat;const cv=document.createElement('canvas');cv.width=22;cv.height=22;const g=cv.getContext('2d');clayBlob(g,11,11,8,'#7a6a8a',2,{sx:.7,sy:1.1});speckle(g,22,22,3,10);SPR.slat=cv;return cv;}
function stationDraw(c,api,g){
 const q=Math.floor(S.bgT*12);
 for(let i=0;i<3;i++){const x=g.sx(i),w=g.sw*.86,y=g.beltY,sp=beltSpr(w);
  c.save();c.translate(x-w/2-10,y-12+Math.sin(q*1.1+i)*.5);c.drawImage(sp,0,0);c.restore();
  c.save();c.translate(x,y);const dir=i===1?-1:1,off=(Math.floor(S.bgT*(60+S.wave*12)/4)*4*dir)%24;c.beginPath();N.rr(c,-w/2+14,-2,w-28,22,10);c.clip();for(let k=-1;k<w/24+2;k++)c.drawImage(slatSpr(),-w/2+k*24+off+4,-1);c.restore();
  T(c,String(i+1),x,y+56,16,'rgba(255,240,208,.75)','center',{stroke:null});}
}
NEXUS_GAMES.register('sushi',{
 ...(DBG?{dbg:()=>S}:{}),
 meta:{title:'Sushi Catch',help:'Catch plates from the conveyor stations on your tray and serve guests the exact combos they order.',controls:'A/D or ←→ move · SPACE serve · 1-2-3 pick guest · X dump · mouse/touch drag',type:'CATCH · ORDERS'},
 size:[900,520],portraitSize:[540,860],duration:140,tier:1.05,
 touch:[{kind:'stick',side:'left',axis:'x',keys:['ArrowLeft','ArrowRight']},{kind:'btn',side:'right',label:'SERVE',key:' ',big:true,cls:'alt'}],
 init(api){newState(api);},
 start(api){newState(api);startWave(api,0);},
 update(dt,api){
  const g=geo(api),W=api.W,mul=api.diff.mul;S.t+=dt;S.bgT+=dt;if(S.bannerT>0)S.bannerT-=dt;
  if(S.endT>=0){S.endT-=dt;if(S.endT<0)realFinish(api);}
  if(S.done)return;
  if(S.stun>0)S.stun-=dt;if(S.dump>0)S.dump-=dt;
  // tray movement with momentum
  let ax=0;if(S.keys.ArrowLeft||S.keys.a)ax-=1;if(S.keys.ArrowRight||S.keys.d)ax+=1;if(!ax&&api.stick&&Math.abs(api.stick.x)>.15)ax=api.stick.x;
  if(S.tgt!==null&&!ax){const d=S.tgt-S.tx;ax=cl(d/70,-1,1);}
  if(S.stun<=0){S.tv+=ax*2600*dt;}
  S.tv*=Math.exp(-5.2*dt);S.tv=cl(S.tv,-760,760);S.tx+=S.tv*dt;
  if(S.tx<S.tw/2){S.tx=S.tw/2;S.tv=Math.abs(S.tv)*.3;}if(S.tx>W-S.tw/2){S.tx=W-S.tw/2;S.tv=-Math.abs(S.tv)*.3;}
  // customers
  for(let i=0;i<3;i++){
   const cu=S.cust[i];
   if(cu){cu.t+=dt;if(cu.hop>0)cu.hop-=dt;if(!cu.done){cu.in=Math.min(1,cu.in+dt*2.2);if(cu.in>=1){cu.pat-=dt;if(cu.pat<=0)leave(api,i);}}else if(cu.t>.6){S.cust[i]=null;}}
   else if(S.spawnedC<TOTAL[S.wave]&&(S.wave>0||i<2+(S.served>=2?1:0))){S.arrive[i]-=dt;if(S.arrive[i]<=0&&S.cust.filter(c=>c&&!c.done).length<(S.wave===0?2:3))newCustomer(api,i);}
  }
  // wave / win
  if(S.spawnedC>=TOTAL[S.wave]&&S.cust.every(c=>!c)){if(S.wave>=2){finishGame(api,true);S.win=true;api.addScore(30);sfx(api,'win');}else startWave(api,S.wave+1);}
  // stations
  for(let i=0;i<3;i++){S.spawn[i]-=dt;if(S.spawn[i]<=0){S.spawn[i]=R(1.5,2.5)*(1-.08*S.wave)/Math.pow(mul,.5);if(S.plates.length<14&&S.cust.some(c=>c))spawnPlate(api,i);}}
  // plates
  const ty=g.trayY;
  for(let i=S.plates.length-1;i>=0;i--){const p=S.plates[i];p.t+=dt;
   if(p.state==='belt'){p.x+=p.vx*dt;if((p.vx>0&&p.x>=p.cx)||(p.vx<0&&p.x<=p.cx)){p.x=p.cx;p.state='fall';p.vx=0;}}
   else{p.vy+=1000*dt;p.y+=p.vy*dt;
    if(api.mastery>=4&&p.y>ty-120&&Math.abs(p.x-S.tx)<60&&p.kind!=='bad'){p.x+=(S.tx-p.x)*Math.min(1,dt*5);}
    if(p.y>=ty-12&&p.y<=ty+14&&Math.abs(p.x-S.tx)<S.tw/2+6&&S.stun<=0.0001){S.plates.splice(i,1);catchPlate(api,p);if(S.done)return;continue;}
    if(p.y>ty+40){S.plates.splice(i,1);if(p.kind!=='bad'&&wantList().includes(p.type)){S.streak=Math.max(0,S.streak-1);if(S.streak===0)S.mult=1;}api.burst(p.x,ty+30,'#ffffff',3);continue;}}
  }
  S.mult=cl(1+Math.floor(S.streak/6)*.5+(S.cb||0),1,3);
  for(let i=S.fly.length-1;i>=0;i--){const f=S.fly[i];f.t+=dt*2.2;if(f.t>=1)S.fly.splice(i,1);}
 },
 draw(c,api){
  if(!S)return;const g=geo(api);bg(c,api);
  stationDraw(c,api,g);
  for(let i=0;i<3;i++)drawCust(c,api,i,g);
  for(const p of S.plates)drawPlate(c,p.x,p.y,p.type,p.kind,1,p.t,p.rot+(p.state==='fall'?p.t*3:0));
  for(const f of S.fly){const k=E.out(f.t);drawPlate(c,lerp(f.x,f.tx,k),lerp(f.y,f.ty,k)-Math.sin(k*Math.PI)*60,f.type,f.kind,.8*(1-k*.4),S.t);}
  drawTray(c,api,g);
  if(api.running)drawHUD(c,api);
  N.vignette(c,api.W,api.H,.3);
  if(!api.running){readyScreen(c,api,'SUSHI CATCH','Serve 16 hungry guests across 3 rounds. Plates drop from the conveyor chutes - catch the right ones on your tray and deliver exact orders before patience runs out.',[
   'Move the tray (it slides with momentum). Plates land on it, up to 4.','SERVE a guest when your tray holds plates from their order bubble.','Spoiled fish (green, flies) cost a heart. Golden plates are wild x3.','Unhappy guests leaving cost a heart. Chain serves for a x3 multiplier.','Round 3 brings a VIP with a big order.'],PAL.coral,
   'BEST '+(api.store.get('top',[])[0]||0)+' · FURTHEST ROUND '+(api.store.get('stage',0)+1));}
 },
 pointerdown(x,y,e,api){const g=geo(api);
  for(let i=0;i<3;i++){const cx=g.sx(i);if(S.cust[i]&&Math.abs(x-cx)<g.sw/2&&y<g.custY+150){serve(api,i);return;}}
  if(y>g.trayY-30&&Math.abs(x-S.tx)<S.tw&&S.dump<=0&&S.tray.length&&Math.abs(S.tv)<80){S.tray.pop();S.dump=.3;sfx(api,'miss');return;}
  S.tgt=x;},
 pointermove(x,y,e,api){if(!api.touch||S.tgt!==null)S.tgt=x;},
 pointerup(x,y,e,api){S.tgt=null;},
 keydown(e,api){const k=e.key;
  if(k==='ArrowLeft'||k==='ArrowRight'||k==='a'||k==='d'||k==='A'||k==='D'){S.keys[k.length===1?k.toLowerCase():k]=true;S.tgt=null;}
  else if(k===' '||k==='Enter'){let best=-1,bs=-1;S.cust.forEach((cu,i)=>{if(cu&&!cu.done&&cu.in>=1){const ok=cu.order.some(p=>!p.got&&(S.tray.some(t=>t.type===p.t&&t.kind!=='gold')||S.tray.some(t=>t.kind==='gold')));if(ok){const sc=1-cu.pat/cu.max;if(sc>bs){bs=sc;best=i;}}}});if(best>=0)serve(api,best);else{api.popText('NOTHING TO SERVE',S.tx,geo(api).trayY-60,'#ffb0a0');sfx(api,'miss');}}
  else if(['1','2','3'].includes(k))serve(api,+k-1);
  else if(k==='x'||k==='X'){if(S.tray.length&&S.dump<=0){S.tray.pop();S.dump=.3;sfx(api,'miss');}}
 },
 keyup(e,api){const k=e.key;S.keys[k.length===1?k.toLowerCase():k]=false;},
 timeUp(api){S.win=false;realFinish(api);}
});
})();

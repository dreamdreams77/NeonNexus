/* games/whack.js — Neon Nexus cabinet module */
(function(){'use strict';
const N=window.NXG,TAU=Math.PI*2,cl=N.clamp,lerp=N.lerp,R=N.rand,E=N.ease;
const RI=(a,b)=>Math.floor(a+Math.random()*(b-a+1));
const PAL={cream:'#f8e9ca',coral:'#ef896d',mint:'#91c9a7',plum:'#684b62',gold:'#f2ce77',ink:'#1a1226'};
function T(c,t,x,y,s,col,al,o){N.text(c,t,x,y,Object.assign({font:'700 '+s+'px Fredoka, system-ui, sans-serif',color:col||'#fff0d4',align:al||'left',stroke:PAL.ink,sw:Math.max(2,s/6)},o||null));}
function wrap(c,txt,mw,font){c.font=font;const w=txt.split(' '),out=[];let l='';for(const x of w){const t=l?l+' '+x:x;if(c.measureText(t).width>mw&&l){out.push(l);l=x;}else l=t;}if(l)out.push(l);return out;}
/* READY panel: objective + how-to + best */
function readyScreen(c,api,title,obj,how,col,extra){
 const W=api.W,H=api.H,fs=api.portrait?15:16,pw=Math.min(W-30,620);
 c.save();c.fillStyle='rgba(16,10,28,.74)';c.fillRect(0,0,W,H);
 const f='600 '+fs+'px Fredoka, system-ui, sans-serif';let lines=[];
 const ol=wrap(c,obj,pw-48,f);how.forEach(h=>lines.push(...wrap(c,'• '+h,pw-48,f)));
 const ph=Math.min(H-24,92+ol.length*(fs+5)+lines.length*(fs+5)+(extra?30:0)+56),px=(W-pw)/2,py=(H-ph)/2;
 N.slab(c,px,py,pw,ph,24,'#4a3552');
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
/* ===== MOON MOLES ===== */
const WAVES=[3,4,6,6,9,9],WAVE_LEN=11,BOSS_AT=55,SKINS=['#c9a56a','#9ad7e8','#f2ce77'];
let S=null;
function layout(api,n){
 const W=api.W,H=api.H,cols=n===4?2:3,rows=Math.ceil(n/cols),top=api.portrait?210:150,bot=api.portrait?70:50,mx=api.portrait?20:70;
 const cw=(W-mx*2)/cols,ch=(H-top-bot)/rows;const hs=[];
 for(let i=0;i<n;i++){const c=i%cols,r=Math.floor(i/cols);hs.push({x:mx+cw*(c+.5),y:top+ch*(r+.62),st:0,t:0,type:0,hp:0,life:1,pop:0,flash:0,dizzy:0,cw,ch,s:Math.min(cw*.36,ch*.5,78)});}
 return hs;
}
function newState(api){
 const m=api.mastery,d=api.diff.mul;
 S={t:0,wave:-1,holes:layout(api,3),hearts:3+(m>=4?1:0),maxHearts:3+(m>=4?1:0),streak:0,best:0,spawn:.8,hammer:{x:api.W/2,y:api.H/2,t:1,tx:0,ty:0,hit:false},cursor:0,
  boss:null,bossDead:false,bossHp:0,bossMax:Math.round(10*Math.pow(d,.7)),bannerT:0,banner:'',bannerSub:'',gold:0,bombs:0,hits:0,swings:0,misses:0,rush:false,rushShown:false,endT:-1,win:false,done:false,flash:0,thunder:0,cool:0,wobble:0,bgT:0,skin:api.store.get('skin',0),minionT:0,stageMax:api.store.get('stage',0)};
}
function setWave(api,w){
 S.wave=w;const n=WAVES[Math.min(w,5)];
 if(!S.holes||S.holes.length!==n){S.holes=layout(api,n);S.cursor=0;}
 S.banner=w>=5?'BOSS: KING MOLE':'WAVE '+(w+1);S.bannerSub=w>=5?'Smash the crown! Watch the minions':n+' holes';S.bannerT=1.7;
 api.sound(w>=5?120:520,.2,w>=5?'sawtooth':'triangle',.05);if(w>=5){api.shake(8,.4);}
 const st=api.store.get('stage',0);if(w>st){api.store.set('stage',w);S.stageMax=w;}
}
function popChance(api){const w=Math.min(S.wave,5),mul=api.diff.mul;
 return {helm:w>=1?.14+w*.03:0,bomb:w>=1?(.08+w*.025)*(mul>1?1.25:mul<1?.8:1):0,gold:.05,decoy:w>=3?.1:0};}
function spawnOne(api){
 const empties=S.holes.filter(h=>h.st===0&&(!S.boss||S.boss!==h));if(!empties.length)return;
 const h=empties[(Math.random()*empties.length)|0],pc=popChance(api);let r=Math.random(),type=0;
 if(S.rush){type=Math.random()<.8?3:0;}
 else if((r-=pc.gold)<0)type=3;else if((r-=pc.bomb)<0)type=2;else if((r-=pc.helm)<0)type=1;else if((r-=pc.decoy)<0)type=4;
 launch(api,h,type);
}
function launch(api,h,type){
 const w=Math.min(S.wave,5),mul=api.diff.mul,m=api.mastery;
 let stay=lerp(1.55,.8,w/5)/Math.pow(mul,.6);if(m>=2)stay*=1.15;
 if(type===3)stay*=.75;if(type===2)stay*=1.1;if(type===4)stay*=1.2;
 h.st=1;h.t=0;h.type=type;h.hp=type===1?2:1;h.life=stay;h.pop=0;h.flash=0;h.dizzy=0;
}
function hitHole(api,h){
 const type=h.type,wasBoss=S.boss===h;
 S.hits++;
 if(type===2){ // bomb
  S.hearts--;S.streak=0;S.bombs++;api.combo=0;h.st=3;h.t=0;h.dizzy=0;h.type=2;h.boom=1;
  api.addScore(-20);api.popText('BOMB! -1 HEART',h.x,h.y-h.s*1.8,'#ff8a6a');api.burst(h.x,h.y-h.s,'#ff9a50',24);api.shake(14,.45);sfx(api,'boom');S.flash=.5;
  if(S.hearts<=0)end(api,false);return;
 }
 if(type===4){S.streak=0;api.combo=0;h.st=3;h.t=0;h.dizzy=1;api.addScore(-5);api.popText('DECOY!',h.x,h.y-h.s*1.8,'#ffb0a0');sfx(api,'miss');api.burst(h.x,h.y-h.s,'#e8d4a8',10);S.misses++;return;}
 h.hp--;h.flash=.18;
 if(wasBoss){
  S.bossHp--;api.burst(h.x,h.y-h.s*1.5,'#ffd08a',14);api.shake(7,.2);sfx(api,'hit');S.streak++;api.combo=S.streak;S.best=Math.max(S.best,S.streak);
  api.addScore(8*mult(),h.x,h.y-h.s*2.6,'#ffd08a');
  if(S.bossHp<=0){S.bossDead=true;S.boss=null;h.st=3;h.t=0;h.dizzy=1;api.addScore(60,h.x,h.y-h.s*3.2,'#ffe08a');api.burst(h.x,h.y-h.s*2,'#ffe08a',50);api.shake(16,.7);sfx(api,'win');
   S.holes.forEach(o=>{if(o!==h&&o.st){o.st=3;o.t=0;}});S.endT=1.6;S.win=true;api.achieve('boss','Moon Crusher',10);api.store.set('skin',Math.max(S.skin,1));if(api.store.get('bossKills',0)>=1)api.store.set('skin',2);api.store.set('bossKills',api.store.get('bossKills',0)+1);}
  else{h.t=0;h.st=3;h.dizzy=1;S.boss=null;S.bossCool=.5;}
  return;
 }
 if(h.hp>0){api.popText('CLANG',h.x,h.y-h.s*2,'#cfe6ff');sfx(api,'ping');api.burst(h.x,h.y-h.s*1.6,'#cfe6ff',8);api.shake(4,.12);return;}
 S.streak++;api.combo=S.streak;S.best=Math.max(S.best,S.streak);const mu=mult();
 const base=type===3?(S.rush?6:12):type===1?8:3;
 api.addScore(base*mu,h.x,h.y-h.s*2.2,type===3?'#ffe08a':'#fff0d4');
 if(type===3){S.gold++;S.time=0;api.time=Math.min(api.time+1.5,95);api.popText('+1.5s',h.x+34,h.y-h.s*2.9,'#9de3d1');api.burst(h.x,h.y-h.s,'#ffe08a',26);sfx(api,'coin');if(S.gold>=3)api.achieve('gold','Golden Touch',5);}
 else{api.burst(h.x,h.y-h.s,'#c9a56a',10);sfx(api,'hit');}
 if(S.streak===25)api.achieve('streak','Whack Streak',5);
 h.st=3;h.t=0;h.dizzy=1;
 if(api.mastery>=6&&S.streak>0&&S.streak%10===0)thunder(api);
}
function thunder(api){S.thunder=.5;api.popText('THUNDER HAMMER!',api.W/2,api.H/2,'#cfe6ff');api.shake(10,.3);sfx(api,'power');
 for(const o of S.holes)if((o.st===1||o.st===2)&&o.type!==2&&o.type!==4&&S.boss!==o){o.hp=1;api.addScore(3*mult(),o.x,o.y-o.s*2);o.st=3;o.t=0;o.dizzy=1;api.burst(o.x,o.y-o.s,'#cfe6ff',8);}}
const mult=()=>Math.min(4,1+Math.floor(S.streak/5));
function end(api,win){if(S.done)return;S.done=true;
 const top=topScores(api,api.score);const frac=cl(api.score/420,0,1);
 if(S.bombs===0&&S.wave>=3)api.achieve('clean','Bomb Squad',5);
 api.finish(win,{grade:gradeOf(frac,win)+(win?' · KING DEFEATED':''),combo:S.best});}
function swing(api,x,y,h){
 const H=S.hammer;if(S.cool>0)return;
 H.tx=x;H.ty=y;H.t=0;H.hit=false;H.h=h;S.cool=.22;S.swings++;sfx(api,'whoosh');
}
function pick(x,y){let best=null,bd=1e9;for(const h of S.holes){const dx=x-h.x,dy=y-(h.y-h.s*.8);const rx=h.cw*.45,ry=h.ch*.6;if(Math.abs(x-h.x)<rx&&y>h.y-h.ch*.85&&y<h.y+h.s*.7){const d=dx*dx+dy*dy;if(d<bd){bd=d;best=h;}}}return best;}
function press(api,x,y,h){
 if(S.done||S.endT>=0)return;
 h=h||pick(x,y);if(S.cool>0)return;
 if(!h){swing(api,x,y,null);return;}
 swing(api,h.x,h.y-h.s,h);
}
function resolveHit(api){
 const h=S.hammer.h;
 if(h&&(h.st===1||h.st===2)&&!S.done){hitHole(api,h);}
 else{ // whiff
  if(S.streak>0)api.popText('MISS',S.hammer.tx,S.hammer.ty-30,'#c9b8d0');S.streak=0;api.combo=0;S.misses++;sfx(api,'miss');
  api.burst(S.hammer.tx,S.hammer.ty+10,'#8a7a9a',6);
 }
}
/* ---------- drawing ---------- */
function bg(c,api){
 const W=api.W,H=api.H;
 const o=bgCache('whack'+W+'x'+H,W,H,(g,w,h)=>{
  N.bgGrad(g,w,h,['#1a1236','#3a2a5e','#6b4a76','#b07a84']);twinkle(g,w,h,70,7);
  // earth-like planet
  g.save();const px=w*.82,py=h*.2,pr=Math.min(w,h)*.1;const gr=g.createRadialGradient(px-pr*.3,py-pr*.3,pr*.1,px,py,pr);gr.addColorStop(0,'#9fd6f0');gr.addColorStop(.6,'#4e86c0');gr.addColorStop(1,'#243c7a');g.fillStyle=gr;g.beginPath();g.arc(px,py,pr,0,TAU);g.fill();g.fillStyle='rgba(145,201,167,.7)';g.beginPath();g.ellipse(px-pr*.2,py-pr*.1,pr*.35,pr*.22,.5,0,TAU);g.fill();g.restore();
  // far ridge
  g.fillStyle='#4c3a66';g.beginPath();g.moveTo(0,h*.3);for(let x=0;x<=w;x+=30)g.lineTo(x,h*.3-Math.sin(x*.013)*18-Math.sin(x*.05)*6);g.lineTo(w,h*.5);g.lineTo(0,h*.5);g.fill();
  // moon ground
  const top=api.portrait?h*.2:h*.24;const gg=g.createLinearGradient(0,top,0,h);gg.addColorStop(0,'#c8b4c4');gg.addColorStop(.35,'#a690a8');gg.addColorStop(1,'#6e5878');g.fillStyle=gg;g.beginPath();g.moveTo(0,top+20);g.quadraticCurveTo(w*.5,top-30,w,top+16);g.lineTo(w,h);g.lineTo(0,h);g.fill();
  const rn=N.mulberry(3);for(let i=0;i<14;i++){const cx=rn()*w,cy=top+50+rn()*(h-top-60),r=14+rn()*34;g.fillStyle='rgba(60,40,72,.28)';g.beginPath();g.ellipse(cx,cy,r,r*.4,0,0,TAU);g.fill();g.strokeStyle='rgba(255,240,230,.22)';g.lineWidth=2;g.beginPath();g.ellipse(cx,cy-1.5,r,r*.4,0,Math.PI*1.05,Math.PI*1.95);g.stroke();}
 });
 c.drawImage(o,0,0);
}
function drawHole(c,h,api){
 const s=h.s;
 // mound shadow + back
 c.save();c.fillStyle='rgba(30,16,40,.35)';c.beginPath();c.ellipse(h.x+4,h.y+s*.28,s*1.3,s*.55,0,0,TAU);c.fill();
 const g=c.createRadialGradient(h.x,h.y-s*.1,s*.1,h.x,h.y,s*1.2);g.addColorStop(0,'#150a1c');g.addColorStop(1,'#43304e');c.fillStyle=g;c.beginPath();c.ellipse(h.x,h.y,s*1.05,s*.46,0,0,TAU);c.fill();c.restore();
}
function drawMound(c,h){
 const s=h.s;c.save();
 const g=c.createLinearGradient(0,h.y-s*.1,0,h.y+s*.6);g.addColorStop(0,'#d9c3d0');g.addColorStop(1,'#8a6e92');
 c.fillStyle=g;c.beginPath();c.ellipse(h.x,h.y+s*.1,s*1.18,s*.52,0,0,Math.PI);c.lineTo(h.x-s*1.05,h.y);c.ellipse(h.x,h.y,s*1.05,s*.44,0,Math.PI,0,true);c.closePath();c.fill();
 c.strokeStyle='rgba(52,32,64,.45)';c.lineWidth=2;c.beginPath();c.ellipse(h.x,h.y,s*1.08,s*.46,0,0,Math.PI);c.stroke();
 c.strokeStyle='rgba(255,246,236,.45)';c.lineWidth=3;c.beginPath();c.ellipse(h.x,h.y+1,s*1.0,s*.4,0,Math.PI*1.1,Math.PI*1.9);c.stroke();c.restore();
}
function eye(c,x,y,r,blink,look,angry,col){c.fillStyle=col||'#fff';c.beginPath();c.ellipse(x,y,r,r*(blink?.15:1),0,0,TAU);c.fill();if(!blink){c.fillStyle='#1c1422';c.beginPath();c.arc(x+look*r*.25,y+r*.1,r*.55,0,TAU);c.fill();c.fillStyle='#fff';c.beginPath();c.arc(x+look*r*.25-r*.15,y-r*.1,r*.2,0,TAU);c.fill();}
 c.strokeStyle='rgba(30,16,34,.6)';c.lineWidth=1.3;c.beginPath();c.ellipse(x,y,r,r*(blink?.15:1),0,0,TAU);c.stroke();}
function moleBody(c,x,y,u,fur,belly,t,squash,o){
 // y = baseline in hole, body rises above
 c.save();c.translate(x,y);c.scale(1,squash);
 const g=c.createRadialGradient(-u*.3,-u*1.4,u*.1,0,-u*.8,u*1.3);g.addColorStop(0,N.shade(fur,.35));g.addColorStop(.55,fur);g.addColorStop(1,N.shade(fur,-.45));
 c.fillStyle=g;c.beginPath();c.moveTo(-u*.85,0);c.bezierCurveTo(-u*.95,-u*1.5,-u*.45,-u*2.05,0,-u*2.05);c.bezierCurveTo(u*.45,-u*2.05,u*.95,-u*1.5,u*.85,0);c.closePath();c.fill();c.strokeStyle='rgba(40,24,40,.45)';c.lineWidth=2;c.stroke();
 // ears
 for(const sd of[-1,1]){c.fillStyle=N.shade(fur,-.15);c.beginPath();c.arc(sd*u*.62,-u*1.85,u*.22,0,TAU);c.fill();c.fillStyle='#e8a0a8';c.beginPath();c.arc(sd*u*.62,-u*1.85,u*.12,0,TAU);c.fill();}
 // belly
 c.fillStyle=belly;c.beginPath();c.ellipse(0,-u*.45,u*.5,u*.5,0,0,TAU);c.fill();
 c.restore();
}
function drawMole(c,h,api,t){
 const u=h.s*.62,type=h.type,pop=h.pop,boss=S.boss===h,bs=boss?1.45:1;
 if(pop<=.01&&!h.boom)return;
 const yb=h.y+u*1.7*(1-pop)*bs+4;
 const bl=(Math.sin(t*2.3+h.x)>.96);
 c.save();c.beginPath();c.rect(h.x-h.cw,h.y-h.ch*1.5,h.cw*2,h.ch*1.5+2);c.clip();
 const U=u*bs,sq=h.st===3&&!h.boom?.62+.38*(1-E.out(Math.min(1,h.t/.14))):1;
 const wob=Math.sin(t*9+h.x)*.04*(h.st===2?1:0);
 c.translate(h.x,yb);c.rotate(wob);c.translate(-h.x,-yb);
 if(type===4){ // decoy cardboard cutout
  c.save();c.translate(h.x,yb);c.rotate(Math.sin(t*3+h.x)*.07);
  c.fillStyle='#8c6b44';c.fillRect(-U*.07,-U*.3,U*.14,U*1.6);
  const g=c.createLinearGradient(-U,-U*2,U,0);g.addColorStop(0,'#e8d0a0');g.addColorStop(1,'#c4a46c');c.fillStyle=g;
  c.beginPath();c.moveTo(-U*.85,0);c.bezierCurveTo(-U*.95,-U*1.5,-U*.45,-U*2.05,0,-U*2.05);c.bezierCurveTo(U*.45,-U*2.05,U*.95,-U*1.5,U*.85,0);c.closePath();c.fill();
  c.setLineDash([5,4]);c.strokeStyle='#6a4e2a';c.lineWidth=2.2;c.stroke();c.setLineDash([]);
  eye(c,-U*.3,-U*1.3,U*.2,false,-1,0,'#fff8e8');eye(c,U*.3,-U*1.3,U*.2,false,1,0,'#fff8e8');
  c.fillStyle='#b07070';c.beginPath();c.ellipse(0,-U*.95,U*.18,U*.13,0,0,TAU);c.fill();
  c.strokeStyle='#6a4e2a';c.lineWidth=2;c.beginPath();c.moveTo(-U*.3,-U*.6);c.lineTo(U*.3,-U*.6);c.stroke();
  c.restore();
 }else if(type===2){ // bomb mole
  c.save();c.translate(h.x,yb);c.scale(1,sq);
  N.ball(c,0,-U*1.05,U*.98,'#2a2430',{shadow:false});
  c.fillStyle='#4a4254';c.fillRect(-U*.2,-U*2.18,U*.4,U*.2);
  c.strokeStyle='#d8b070';c.lineWidth=3;c.beginPath();c.moveTo(0,-U*2.18);c.quadraticCurveTo(U*.3,-U*2.5,U*.12,-U*2.72);c.stroke();
  const sp=Math.sin(t*30);N.glow(c,U*.12,-U*2.72,U*(.4+.12*sp),'#ffb050',.9);c.fillStyle='#fff4c0';c.beginPath();c.arc(U*.12,-U*2.72,U*.1,0,TAU);c.fill();
  eye(c,-U*.32,-U*1.15,U*.22,false,0,1,'#ff7060');eye(c,U*.32,-U*1.15,U*.22,false,0,1,'#ff7060');
  c.strokeStyle='#ff9080';c.lineWidth=2.4;c.beginPath();c.moveTo(-U*.55,-U*1.5);c.lineTo(-U*.1,-U*1.32);c.moveTo(U*.55,-U*1.5);c.lineTo(U*.1,-U*1.32);c.stroke();
  c.fillStyle='#fff';c.beginPath();c.ellipse(0,-U*.62,U*.28,U*.14,0,0,Math.PI);c.fill();
  // blinking warning
  if(h.st===2&&(h.t*6|0)%2===0){c.fillStyle='#ff6a50';c.font='900 '+(U*.7)+'px Fredoka, sans-serif';c.textAlign='center';c.fillText('!',U*1.05,-U*1.9);}
  c.restore();
 }else{
  const gold=type===3,fur=gold?'#f2c860':boss?'#7a4a3a':'#8a6149',belly=gold?'#fff0b0':'#d4b090';
  if(gold)N.glow(c,h.x,yb-U,U*2.2,'#ffd870',.5+.25*Math.sin(t*10));
  moleBody(c,h.x,yb,U,fur,belly,t,sq);
  c.save();c.translate(h.x,yb);c.scale(1,sq);
  const look=Math.sin(t*1.7+h.x)*1;
  eye(c,-U*.32,-U*1.3,U*.2,bl||h.dizzy&&h.st===3,look,0);eye(c,U*.32,-U*1.3,U*.2,bl||h.dizzy&&h.st===3,look,0);
  if(boss){c.strokeStyle='#2a1420';c.lineWidth=3.5;c.beginPath();c.moveTo(-U*.6,-U*1.7);c.lineTo(-U*.12,-U*1.5);c.moveTo(U*.6,-U*1.7);c.lineTo(U*.12,-U*1.5);c.stroke();}
  // nose
  const ng=c.createRadialGradient(-U*.05,-U*1.02,U*.02,0,-U*.95,U*.25);ng.addColorStop(0,'#ffc0c8');ng.addColorStop(1,'#d86a80');c.fillStyle=ng;c.beginPath();c.ellipse(0,-U*.95,U*.22,U*.16,0,0,TAU);c.fill();c.strokeStyle='rgba(60,20,40,.4)';c.lineWidth=1.4;c.stroke();
  // whiskers/teeth
  c.fillStyle='#fffdf4';c.fillRect(-U*.12,-U*.78,U*.11,U*.18);c.fillRect(U*.01,-U*.78,U*.11,U*.18);c.strokeStyle='rgba(60,30,40,.4)';c.lineWidth=1;c.strokeRect(-U*.12,-U*.78,U*.11,U*.18);c.strokeRect(U*.01,-U*.78,U*.11,U*.18);
  if(h.st===3&&h.dizzy){c.fillStyle='rgba(255,240,150,.95)';for(let i=0;i<3;i++){const a=t*8+i*2.1;c.beginPath();c.arc(Math.cos(a)*U*.7,-U*2.2+Math.sin(a)*U*.2,U*.1,0,TAU);c.fill();}}
  // paws
  for(const sd of[-1,1]){c.fillStyle=N.shade(fur,-.1);c.beginPath();c.ellipse(sd*U*.62,-U*.18,U*.22,U*.17,0,0,TAU);c.fill();c.strokeStyle='rgba(40,24,40,.4)';c.lineWidth=1.5;c.stroke();c.fillStyle='#f5e6d0';for(let k=-1;k<=1;k++){c.fillRect(sd*U*.62+k*U*.07-1,-U*.3,2,U*.1);}}
  // helmet
  if(type===1&&h.hp>0||boss){
   const dam=type===1&&h.hp===1,hc=boss?'#c04a4a':'#8aa0c8';
   c.save();if(dam){c.translate(U*.1,-U*.05);c.rotate(.18);}
   const hg=c.createLinearGradient(-U,-U*2.4,U,-U*1.4);hg.addColorStop(0,N.shade(hc,.5));hg.addColorStop(.5,hc);hg.addColorStop(1,N.shade(hc,-.4));c.fillStyle=hg;
   c.beginPath();c.moveTo(-U*.95,-U*1.62);c.bezierCurveTo(-U*.95,-U*2.5,U*.95,-U*2.5,U*.95,-U*1.62);c.closePath();c.fill();c.strokeStyle='rgba(30,20,44,.55)';c.lineWidth=2.2;c.stroke();
   c.fillStyle=N.shade(hc,-.2);N.rr(c,-U*1.05,-U*1.7,U*2.1,U*.2,U*.1);c.fill();
   c.fillStyle='rgba(255,255,255,.6)';c.beginPath();c.ellipse(-U*.35,-U*2.15,U*.28,U*.1,-.5,0,TAU);c.fill();
   if(boss){c.fillStyle='#f2ce77';for(let k=-2;k<=2;k++){c.beginPath();c.moveTo(k*U*.3-U*.14,-U*2.22+Math.abs(k)*U*.12);c.lineTo(k*U*.3,-U*2.7+Math.abs(k)*U*.12);c.lineTo(k*U*.3+U*.14,-U*2.22+Math.abs(k)*U*.12);c.fill();}}
   if(dam){c.strokeStyle='rgba(20,12,30,.7)';c.lineWidth=2;c.beginPath();c.moveTo(0,-U*2.25);c.lineTo(U*.12,-U*2);c.lineTo(-U*.05,-U*1.85);c.stroke();}
   c.restore();
  }
  c.restore();
 }
 if(h.flash>0){c.globalAlpha=h.flash*3;c.fillStyle='#fff';c.beginPath();c.ellipse(h.x,yb-U,U*1.1,U*1.3,0,0,TAU);c.fill();}
 c.restore();
}
function drawHammer(c,api,t){
 const H=S.hammer;let x,y,ang;
 if(H.t<1){const k=H.t;const s=k<.4?E.out(k/.4):1-(k-.4)/.6*0.0;ang=k<.4?lerp(-1.1,.12,E.out(k/.4)):lerp(.12,-.7,E.inOut((k-.4)/.6));x=H.tx;y=H.ty-(k<.4?(1-E.out(k/.4))*40:(k-.4)/.6*20);}
 else{x=api.mouse.x;y=api.mouse.y-14;ang=-.75+Math.sin(t*3)*.03;if(S.cool<=0&&api.touch)ang=-.75;}
 if(S.holes[S.cursor]&&api.keys&&S.kbd){const h=S.holes[S.cursor];x=h.x;y=h.y-h.s*.8;}
 c.save();c.translate(x,y);c.rotate(ang);
 c.fillStyle='rgba(20,10,30,.25)';c.beginPath();c.ellipse(6,64,34,10,0,0,TAU);c.fill();
 // handle
 const hg=c.createLinearGradient(-8,0,8,0);hg.addColorStop(0,'#b88a58');hg.addColorStop(.5,'#e0b078');hg.addColorStop(1,'#8c6238');c.fillStyle=hg;N.rr(c,-7,-120,14,128,7);c.fill();c.strokeStyle='rgba(50,30,20,.5)';c.lineWidth=2;c.stroke();
 // head
 const col=SKINS[S.skin]||SKINS[0],g=c.createLinearGradient(0,-26,0,26);g.addColorStop(0,N.shade(col,.4));g.addColorStop(.55,col);g.addColorStop(1,N.shade(col,-.4));
 c.fillStyle=g;N.rr(c,-42,-26,84,52,14);c.fill();c.strokeStyle='rgba(50,30,20,.55)';c.lineWidth=2.5;c.stroke();
 c.fillStyle='rgba(255,255,255,.45)';N.rr(c,-34,-21,68,9,5);c.fill();
 c.fillStyle='rgba(40,20,30,.25)';c.fillRect(-42,-4,84,5);
 c.restore();
 if(H.t<1&&H.t>.36&&H.t<.62){c.save();c.globalAlpha=1-(H.t-.36)/.26;c.strokeStyle='#fff0d4';c.lineWidth=4;c.beginPath();c.ellipse(H.tx,H.ty+24,22+(H.t-.36)*160,8+(H.t-.36)*50,0,0,TAU);c.stroke();c.restore();}
}
function drawHUD(c,api,t){
 const W=api.W,por=api.portrait;
 const y=por?86:12;
 for(let i=0;i<S.maxHearts;i++)heart(c,24+i*34,por?26:30,15,'#ef6a6a',i<S.hearts);
 const m=mult();
 N.chip(c,por?12:W/2-130,y+(por?0:0),110,'COMBO ×'+m,S.streak,{color:m>=3?'#ffe08a':'#fff0d4'});
 const w=Math.min(S.wave,5);
 N.chip(c,por?W-128:W/2-14,y,116,S.boss||S.wave>=5?'BOSS WAVE':'WAVE',S.wave>=5?'KING':(w+1)+' / 6',{color:S.wave>=5?'#ef896d':'#fff0d4'});
 if(S.rush){T(c,'GOLD RUSH!',W/2,por?154:84,por?28:30,'#ffe08a','center',{glow:'#ffd870'});}
 if(S.wave>=5&&!S.bossDead){const bw=Math.min(W-60,420),bx=(W-bw)/2,by=por?170:56;N.bar(c,bx,by,bw,16,S.bossHp/S.bossMax,'#ef6a6a');T(c,'KING MOLE',W/2,by+13,11,'#fff0d4','center',{stroke:null});}
 // wave timer ring
 const wl=S.wave>=5?1:((S.t%WAVE_LEN)/WAVE_LEN);N.bar(c,por?12:W-210,por?W>500?0:4:36,por?W-24:196,6,wl,'#91c9a7');
 if(S.bannerT>0){
  c.save();c.globalAlpha=Math.min(1,S.bannerT*2);c.fillStyle='rgba(18,12,30,.55)';c.fillRect(0,api.H*.34,W,api.H*.2);T(c,S.banner,W/2,api.H*.44,Math.min(W,520)/9,S.wave>=5?'#ef896d':'#ffe08a','center',{glow:S.wave>=5?'#ef896d':'#ffe08a'});T(c,S.bannerSub,W/2,api.H*.5,18,'#fff0d4','center',{stroke:null});c.restore();}
 if(S.flash>0){c.fillStyle='rgba(255,120,80,'+S.flash*.5+')';c.fillRect(0,0,W,api.H);}
 if(S.thunder>0){c.fillStyle='rgba(200,225,255,'+S.thunder*.6+')';c.fillRect(0,0,W,api.H);}
}
/* ---------- module ---------- */
NEXUS_GAMES.register('whack',{
 dbg:()=>S,
 meta:{title:'Moon Moles',help:'Whack the moles, dodge the bombs, then topple the King Mole.',controls:'CLICK / TAP holes · 1-9 or ARROWS + SPACE',type:'REFLEX · COMBO'},
 size:[900,520],portraitSize:[540,860],duration:80,tier:1.05,
 init(api){newState(api);S.t=0;},
 start(api){newState(api);setWave(api,0);},
 update(dt,api){
  const mul=api.diff.mul;S.t+=dt;S.bgT+=dt;
  if(S.bannerT>0)S.bannerT-=dt;if(S.flash>0)S.flash-=dt;if(S.thunder>0)S.thunder-=dt;if(S.cool>0)S.cool-=dt;
  const Hm=S.hammer;if(Hm.t<1){const was=Hm.t;Hm.t=Math.min(1,Hm.t+dt/.3);if(!Hm.hit&&Hm.t>=.4){Hm.hit=true;resolveHit(api);api.shake(3,.08);}}
  if(S.endT>=0){S.endT-=dt;if(S.endT<0)end(api,true);}
  // waves
  if(!S.done&&S.endT<0){
   const w=S.t>=BOSS_AT?5:Math.min(4,Math.floor(S.t/WAVE_LEN));if(w!==S.wave)setWave(api,w);
   if(S.t>=33&&S.t<39&&!S.rush&&!S.rushShown){S.rush=true;S.rushShown=true;S.banner='GOLD RUSH!';S.bannerSub='Golden moles everywhere — +1.5s each';S.bannerT=1.5;sfx(api,'power');}
   if(S.rush&&S.t>=39)S.rush=false;
   // boss logic
   if(S.wave>=5&&!S.bossDead){
    if(!S.bossSpawned){S.bossSpawned=true;S.bossHp=S.bossMax;S.bossCool=1;}
    if(!S.boss){S.bossCool-=dt;if(S.bossCool<=0){const e=S.holes.filter(h=>h.st===0);if(e.length){const h=e[(Math.random()*e.length)|0];launch(api,h,1);h.hp=1;h.life=lerp(1.7,1.0,1-S.bossHp/S.bossMax)/Math.pow(mul,.5);if(api.mastery>=2)h.life*=1.1;S.boss=h;}S.bossCool=.6;}}
    S.minionT-=dt;if(S.minionT<=0){S.minionT=1.2/Math.sqrt(mul);if(S.holes.filter(h=>h.st).length<6)spawnOne(api);}
   }else if(!S.bossDead){
    S.spawn-=dt;const w2=Math.min(S.wave,4);
    if(S.spawn<=0){const iv=lerp(1.05,.42,w2/4)/Math.pow(mul,.7)/(S.rush?1.8:1);S.spawn=iv*R(.8,1.2);
     const cap=Math.min(S.holes.length-1,1+Math.floor(S.wave*.8+(mul>1?1:0)));const up=S.holes.filter(h=>h.st).length;if(up<cap)spawnOne(api);}
   }
  }
  // holes
  for(const h of S.holes){
   if(h.flash>0)h.flash-=dt;
   if(!h.st)continue;h.t+=dt;
   if(h.st===1){h.pop=E.out(Math.min(1,h.t/.14));if(h.t>=.14){h.st=2;h.t=0;h.pop=1;}}
   else if(h.st===2){h.pop=1;if(h.t>=h.life){h.st=3;h.t=0;h.dizzy=0;
      if(S.boss===h){S.boss=null;S.bossCool=.6;S.bossHp=Math.min(S.bossMax,S.bossHp+1);api.popText('KING HEALS',h.x,h.y-h.s*3,'#ef896d');}
      else if(h.type!==2&&h.type!==4){if(S.streak>0&&h.type!==3)S.escaped=(S.escaped||0)+1;}}}
   else if(h.st===3){h.pop=1-E.inOut(Math.min(1,h.t/.2));if(h.t>=.2){h.st=0;h.pop=0;h.boom=0;}}
  }
 },
 draw(c,api){
  const t=(S?S.bgT:0);
  bg(c,api);
  if(!S)return;
  for(const h of S.holes){drawHole(c,h,api);}
  // draw back-to-front by y
  const order=S.holes.slice().sort((a,b)=>a.y-b.y);
  for(const h of order){c.save();drawMole(c,h,api,S.t);drawMound(c,h);c.restore();
   if(h.boom){c.save();c.globalAlpha=Math.max(0,1-h.t*3);N.glow(c,h.x,h.y-h.s,h.s*2.4*(1+h.t*3),'#ffb060',.9);c.restore();}}
  if(S.kbd&&api.running){const h=S.holes[S.cursor];if(h){c.save();c.strokeStyle='#ffe08a';c.lineWidth=3;c.setLineDash([6,5]);c.beginPath();c.ellipse(h.x,h.y,h.s*1.25,h.s*.6,0,0,TAU);c.stroke();c.restore();}}
  if(api.running){drawHammer(c,api,S.t);drawHUD(c,api,S.t);}
  N.vignette(c,api.W,api.H,.4);
  if(!api.running){
   const best=api.store.get('top',[])[0]||0;
   readyScreen(c,api,'MOON MOLES','Whack the moles that pop out of the lunar holes. Survive six waves and topple the King Mole before time runs out.',[
    'Normal mole = 1 hit. Helmet mole = 2 hits (+8).','Golden mole = +12 and +1.5 seconds.','BOMB mole = lose a heart. Never hit it! Decoy cutouts break your combo.','Chain hits for up to x4 combo. Whiffs and swinging wildly reset it.','Controls: click/tap, or keys 1-9 / arrows + Space.'],PAL.gold,
    'BEST '+best+' · FURTHEST WAVE '+((api.store.get('stage',0))+1)+' · HAMMER SKINS '+(S.skin+1)+'/3');
  }
 },
 pointerdown(x,y,e,api){S.kbd=false;press(api,x,y);},
 pointermove(x,y,e,api){S.kbd=false;},
 keydown(e,api){
  const n=S.holes.length,k=e.key;
  if(/^[1-9]$/.test(k)){const i=+k-1;if(i<n){S.kbd=true;S.cursor=i;press(api,0,0,S.holes[i]);}return;}
  const cols=n===4?2:3;
  if(k==='ArrowLeft'){S.kbd=true;S.cursor=(S.cursor+n-1)%n;}else if(k==='ArrowRight'){S.kbd=true;S.cursor=(S.cursor+1)%n;}
  else if(k==='ArrowUp'){S.kbd=true;S.cursor=(S.cursor-cols+n)%n;}else if(k==='ArrowDown'){S.kbd=true;S.cursor=(S.cursor+cols)%n;}
  else if(k===' '||k==='Enter'){S.kbd=true;press(api,0,0,S.holes[S.cursor]);}
 },
 timeUp(api){end(api,false);}
});
})();

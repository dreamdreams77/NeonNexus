/* Starlight Pinball: flipper physics, bumpers, slings, drop targets, rollovers, saucer, multiball, nudge/tilt. */
(function(){
const N=window.NXG,W=540,H=860,BR=9,G=1050;
const SEG=[]; // static walls {x1,y1,x2,y2,kick?,rest?}
function seg(x1,y1,x2,y2,o={}){SEG.push(Object.assign({x1,y1,x2,y2,rest:.5},o));}
(function build(){
 const cx=270,cy=272,R=242;let px=cx-R,py=cy;
 for(let i=1;i<=28;i++){const a=Math.PI+Math.PI*i/28,x=cx+Math.cos(a)*R,y=cy+Math.sin(a)*R;seg(px,py,x,y);px=x;py=y;}
 seg(28,272,28,830);seg(512,272,512,830);seg(478,318,478,780);
 seg(60,690,150,768);seg(424,690,354+0,768);seg(424,690,478,690);seg(62,640,62,690);
 // upper deflectors
 seg(110,150,170,205,{rest:.6});seg(430,150,380,205,{rest:.6});
 // slingshots
 seg(92,560,92,630,{kick:520});seg(92,630,138,690,{kick:520,rest:.3});seg(92,560,138,690,{kick:520,sling:1});
 seg(414,560,414,630,{kick:520});seg(414,630,368,690,{kick:520});seg(414,560,368,690,{kick:520,sling:1});
 // plunger lane floor
 seg(478,805,512,805);
})();
const BUMPERS=[{x:195,y:310,r:28,c:'#ef896d'},{x:305,y:310,r:28,c:'#f2ce77'},{x:250,y:400,r:28,c:'#8bb7dc'}];
const LANES=[{x:160,y:215},{x:235,y:205},{x:310,y:205},{x:385,y:215}];
function flip(p,side){const L=side==='L';return{px:L?150:354,py:770,len:84,rest:L?.5:Math.PI-.5,up:L?-.5:Math.PI+.5,ang:L?.5:Math.PI-.5,w:0,side};}
function init(a){const p=a.p;Object.assign(p,{balls:[],left:3,t:0,mult:1,saveT:0,lanes:[0,0,0,0],drops:[1,1,1,1],plunge:0,plunging:false,tilt:0,tiltT:0,locked:0,sauce:null,msg:'',msgT:0,hits:{},fl:[flip(p,'L'),flip(p,'R')],spin:{a:0,w:0},lastBall:null,ready:true,nudgeCd:0,over:false,mb:false,glow:{},sparks:[],totalBumps:0,jackpots:0});
 p.sauce={x:410,y:440,t:0,ball:null};}
function newBall(a){const p=a.p;p.balls.push({x:495,y:790,vx:0,vy:0,r:BR,live:false,still:0});p.plunge=0;p.ready=true;}
function start(a){init(a);const p=a.p,m=a.mastery;p.left=3+(m>=4?1:0);p.saveSec=m>=2?18:10;p.hard=a.diff.id==='hard';p.easy=a.diff.id==='easy';p.gravity=G*(p.hard?1.12:p.easy?.92:1);if(p.easy)p.saveSec+=6;newBall(a);a.hud('HOLD SPACE / LAUNCH TO PULL PLUNGER · FLIPPERS ← → · SHIFT NUDGES');}
function msg(p,t,s=1.6){p.msg=t;p.msgT=s;}
function resetDrops(p){p.drops=[1,1,1,1];}
function flippers(a,dt){const p=a.p,k=a.keys;const L=(k.ArrowLeft||k.z||k.Z||k.a||k.A||p.tL)&&p.tiltT<=0,R=(k.ArrowRight||k.m||k.M||k.d||k.D||p.tR)&&p.tiltT<=0;
 for(const f of p.fl){const on=f.side==='L'?L:R;const target=on?f.up:f.rest;const dir=Math.sign(target-f.ang);const spd=on?20:13;let na=f.ang+dir*spd*dt;if((dir>0&&na>target)||(dir<0&&na<target))na=target;f.w=(na-f.ang)/dt;f.ang=na;if(on&&!f['on']){f.on=true;N.sfx(a,'tick');}if(!on)f.on=false;}}
function fl_tip(f){return{x:f.px+Math.cos(f.ang)*f.len,y:f.py+Math.sin(f.ang)*f.len};}
function collideSeg(b,s,a,vel){const dx=s.x2-s.x1,dy=s.y2-s.y1,l2=dx*dx+dy*dy;const t=N.clamp(((b.x-s.x1)*dx+(b.y-s.y1)*dy)/l2,0,1),cx=s.x1+dx*t,cy=s.y1+dy*t;let nx=b.x-cx,ny=b.y-cy;const d=Math.hypot(nx,ny),rr=b.r+(s.th||1.5);if(d>=rr||d===0)return false;nx/=d;ny/=d;b.x=cx+nx*rr;b.y=cy+ny*rr;let vx=b.vx-(vel?vel.x:0),vy=b.vy-(vel?vel.y:0);const vn=vx*nx+vy*ny;if(vn<0){const e=s.rest??.5;b.vx-=(1+e)*vn*nx;b.vy-=(1+e)*vn*ny;if(s.kick&&Math.abs(vn)>120){b.vx+=nx*s.kick*.6;b.vy+=ny*s.kick*.6;}}return Math.abs(vn);}
function stepPhys(a,dt){const p=a.p;p.t+=dt;if(p.nudgeCd>0)p.nudgeCd-=dt;if(p.tiltT>0)p.tiltT-=dt;if(p.msgT>0)p.msgT-=dt;if(p.saveT>0)p.saveT-=dt;
 flippers(a,dt);
 for(const f of p.fl){f.tipOld=f.tipOld||fl_tip(f);}
 for(const b of p.balls){
  if(!b.live){ // in plunger lane
   const k=a.keys;if(p.plunging){p.plunge=Math.min(1,p.plunge+dt*.9);b.y=790+p.plunge*14;}
   continue;}
  b.vy+=p.gravity*dt;b.x+=b.vx*dt;b.y+=b.vy*dt;const sp=Math.hypot(b.vx,b.vy);if(sp>1700){b.vx*=1700/sp;b.vy*=1700/sp;}
  b.vx*=1-.03*dt;b.vy*=1-.03*dt;
  for(const s of SEG){const v=collideSeg(b,s,a);if(v&&v>140){N.sfx(a,s.kick?'bump':'tick');if(s.kick){p.glow.sling=.2;a.addScore(1);}}}
  for(const f of p.fl){const tip=fl_tip(f),s={x1:f.px,y1:f.py,x2:tip.x,y2:tip.y,th:9,rest:.35};const dxp=b.x-f.px,dyp=b.y-f.py;const vel={x:-f.w*dyp,y:f.w*dxp};const v=collideSeg(b,s,a,vel);if(v&&v>60){N.sfx(a,'hit');if(Math.abs(f.w)>5)a.shake(1.5,.08);}}
  for(let i=0;i<BUMPERS.length;i++){const bm=BUMPERS[i];const dx=b.x-bm.x,dy=b.y-bm.y,d=Math.hypot(dx,dy);if(d<bm.r+b.r&&d>0){const nx=dx/d,ny=dy/d;b.x=bm.x+nx*(bm.r+b.r);b.y=bm.y+ny*(bm.r+b.r);const vn=b.vx*nx+b.vy*ny;if(vn<0){b.vx-=1.2*vn*nx;b.vy-=1.2*vn*ny;}b.vx+=nx*480;b.vy+=ny*480;p.glow['b'+i]=.25;a.addScore(3*p.mult,bm.x,bm.y-30,bm.c);p.totalBumps++;N.sfx(a,'ping');a.burst(bm.x,bm.y,bm.c,5);a.combo=Math.min(30,a.combo+1);}}
  // drop targets
  for(let i=0;i<4;i++){if(!p.drops[i])continue;const tx=140+i*65,ty=470;if(b.x>tx-18&&b.x<tx+18&&b.y>ty-12&&b.y<ty+12){p.drops[i]=0;const nx=0,ny=b.y<ty?-1:1;b.vy=-b.vy*.6+ny*50;a.addScore(10*p.mult,tx,ty-20,'#8ec7a4');N.sfx(a,'coin');if(!p.drops.some(v=>v)){a.addScore(40*p.mult,270,430,'#ffe08a');msg(p,'TARGETS CLEARED · MULTIBALL!');startMulti(a);resetDrops(p);}}}
  // rollover lanes
  for(let i=0;i<4;i++){const l=LANES[i];if(Math.hypot(b.x-l.x,b.y-l.y)<14&&!p.lanes[i]){p.lanes[i]=1;a.addScore(5*p.mult,l.x,l.y-24,'#ffe08a');N.sfx(a,'tick');if(p.lanes.every(v=>v)){p.lanes=[0,0,0,0];p.mult=Math.min(5,p.mult+1);msg(p,'LANES DONE · BONUS ×'+p.mult);a.addScore(15,270,170,'#ffe08a');a.achieve('lanes','Complete all rollover lanes',5);N.sfx(a,'win');}}}
  // spinner
  if(b.y>505&&b.y<535&&b.x>215&&b.x<295&&Math.abs(b.vx)+Math.abs(b.vy)>150){p.spin.w=Math.min(30,p.spin.w+Math.abs(b.vy)*.02);a.addScore(.2,0,0);}
  // saucer capture
  const sc=p.sauce;if(!sc.ball&&Math.hypot(b.x-sc.x,b.y-sc.y)<16&&Math.hypot(b.vx,b.vy)<900){sc.ball=b;sc.t=1.1;b.live='held';b.vx=b.vy=0;b.x=sc.x;b.y=sc.y;N.sfx(a,'pocket');}
  // flipper-area stuck check
  if(sp<8)b.still+=dt;else b.still=0;if(b.still>4&&b.live===true){b.vy-=500;b.vx+=Math.random()*200-100;b.still=0;}
  if(b.y>H+20){b.dead=true;}
 }
 p.spin.a+=p.spin.w*dt;p.spin.w*=1-2.5*dt;
 for(const k of Object.keys(p.glow))p.glow[k]=Math.max(0,p.glow[k]-dt);
 const sc=p.sauce;if(sc.ball){sc.t-=dt;if(sc.t<=0){const b=sc.ball;sc.ball=null;b.live=true;b.vx=-260;b.vy=-760;const r=Math.random();if(r<.55){a.addScore(25*p.mult,sc.x,sc.y-30,'#ffe08a');msg(p,'MYSTERY +'+25*p.mult);}else if(r<.85){p.saveT=Math.max(p.saveT,9);msg(p,'BALL SAVER ON');}else{p.left++;msg(p,'EXTRA BALL!');a.achieve('extra','Win an extra ball',5);}N.sfx(a,'power');}}
 // drained balls
 const live=p.balls.filter(b=>!b.dead);if(live.length!==p.balls.length){const lost=p.balls.length-live.length;p.balls=live;
  if(p.balls.length===0){if(p.saveT>0){msg(p,'BALL SAVED!');newBall(a);N.sfx(a,'power');}else{p.left--;a.combo=0;p.mult=1;p.tilt=0;if(p.left<=0){endGame(a);return;}msg(p,'BALLS LEFT '+p.left);newBall(a);}}}
 if(p.mb&&p.balls.length<=1)p.mb=false;
}
function startMulti(a){const p=a.p;p.mb=true;p.jackpots++;for(let i=0;i<2;i++)p.balls.push({x:270+i*30,y:230,vx:(i?1:-1)*140,vy:120,r:BR,live:true,still:0});a.achieve('multi','Trigger multiball',8);}
function endGame(a){const p=a.p;if(p.over)return;p.over=true;const s=a.score;if(s>=250)a.achieve('wizard','Score 250 in one game',12);a.finish(s>=120,{grade:s>=400?'PINBALL WIZARD':s>=250?'GRADE A':s>=150?'GRADE B':'GRADE C'});}
function update(dt,a){if(a.p.over)return;N.stepper(h=>stepPhys(a,h),240)(dt);}
function launch(a){const p=a.p,b=p.balls.find(x=>!x.live);if(!b||!p.plunging)return;p.plunging=false;const pw=p.plunge;b.live=true;b.vy=-(520+pw*880);b.vx=-10;b.y=790;p.saveT=p.saveSec;p.ready=false;N.sfx(a,'whoosh');p.plunge=0;}
function nudge(a){const p=a.p;if(p.nudgeCd>0||p.tiltT>0)return;p.nudgeCd=.35;p.tilt++;for(const b of p.balls)if(b.live===true){b.vx+=(Math.random()-.5)*220;b.vy-=140;}a.shake(5,.15);if(p.tilt>=3){p.tiltT=3;p.tilt=0;msg(p,'TILT!',2);N.sfx(a,'lose');}else msg(p,'NUDGE '+p.tilt+'/3',.5);}
function keydown(e,a){const p=a.p,k=e.key;if((k===' '||k==='ArrowDown')){if(p.balls.some(b=>!b.live))p.plunging=true;}if(k==='Shift'||k==='n'||k==='N')nudge(a);}
function keyup(e,a){if(e.key===' '||e.key==='ArrowDown')launch(a);}
function pdown(x,y,e,a){const p=a.p;if(x>470&&y>700){p.plunging=true;return;}if(x<W/2){p.tL=(p.tL||0)+1;p.ptrL=p.ptrL||{};p.ptrL[e.pointerId]=1;p.tL=true;}else{p.ptrR=p.ptrR||{};p.ptrR[e.pointerId]=1;p.tR=true;}if(y<200&&Math.abs(x-W/2)<60)nudge(a);}
function pup(x,y,e,a){const p=a.p;if(p.plunging)launch(a);if(p.ptrL){delete p.ptrL[e.pointerId];if(!Object.keys(p.ptrL).length)p.tL=false;}if(p.ptrR){delete p.ptrR[e.pointerId];if(!Object.keys(p.ptrR).length)p.tR=false;}}
/* ---------- art: baked painted starfield table, mushroom bumpers, tapered flippers, chrome ball (draw-only) ---------- */
const INK=N.INK,TAU=N.TAU,sh=N.shade;
const SPR={};
function spr(key,w,h,fn){let c=SPR[key];if(!c){c=document.createElement('canvas');c.width=Math.ceil(w);c.height=Math.ceil(h);fn(c.getContext('2d'),c.width,c.height);SPR[key]=c;}return c;}
function claySlab(c,x,y,w,h,r,col,lw=2){const g=c.createLinearGradient(0,y,0,y+h);g.addColorStop(0,sh(col,.32));g.addColorStop(.5,col);g.addColorStop(1,sh(col,-.4));c.fillStyle=g;N.rr(c,x,y,w,h,r);c.fill();c.strokeStyle=INK;c.lineWidth=lw;c.stroke();c.strokeStyle='rgba(255,246,222,.5)';c.lineWidth=Math.max(1,Math.min(3,h*.07));c.lineCap='round';c.beginPath();c.moveTo(x+r,y+Math.min(h*.14,5));c.lineTo(x+w-r,y+Math.min(h*.14,5));c.stroke();}
function glowSpr(col,r){r=Math.round(r/4)*4||4;return spr('g'+col+r,r*2,r*2,(c,w)=>{const g=c.createRadialGradient(r,r,0,r,r,r);g.addColorStop(0,col);g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.fillRect(0,0,w,w);});}
function glowAt(ctx,x,y,r,col,a){const s=glowSpr(col,r);ctx.globalAlpha=a;ctx.globalCompositeOperation='lighter';ctx.drawImage(s,x-s.width/2,y-s.height/2);ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;}
function star(c,x,y,r,col,rot=0){c.beginPath();for(let i=0;i<10;i++){const a=rot+i*Math.PI/5-Math.PI/2,rr=i%2?r*.45:r;i?c.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr):c.moveTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr);}c.closePath();c.fillStyle=col;c.fill();c.strokeStyle=INK;c.lineWidth=1.6;c.lineJoin='round';c.stroke();}
function planet(c,x,y,r,col,ring,seed){const R=N.mulberry(seed);const rg=(front)=>{c.save();c.translate(x,y);c.rotate(-.35);c.strokeStyle=INK;c.lineWidth=r*.3;c.beginPath();c.ellipse(0,0,r*1.7,r*.45,0,front?0:Math.PI,front?Math.PI:TAU);c.stroke();c.strokeStyle=front?sh(ring,.1):sh(ring,-.1);c.lineWidth=r*.2;c.stroke();c.restore();};
 if(ring)rg(false);const g=c.createRadialGradient(x-r*.4,y-r*.45,r*.1,x,y,r*1.1);g.addColorStop(0,sh(col,.45));g.addColorStop(.55,col);g.addColorStop(1,sh(col,-.55));c.fillStyle=g;c.beginPath();c.arc(x,y,r,0,TAU);c.fill();
 for(let i=0;i<4;i++){const a=R()*TAU,d=R()*r*.6,cr=r*(.1+R()*.14);c.fillStyle='rgba(30,12,40,.2)';c.beginPath();c.arc(x+Math.cos(a)*d,y+Math.sin(a)*d,cr,0,TAU);c.fill();}
 c.strokeStyle=INK;c.lineWidth=2.4;c.beginPath();c.arc(x,y,r,0,TAU);c.stroke();c.strokeStyle='rgba(255,246,222,.65)';c.lineWidth=2.4;c.lineCap='round';c.beginPath();c.arc(x,y,r*.82,3.5,4.4);c.stroke();if(ring)rg(true);}
function bakeTable(c){
 const R=N.mulberry(99);
 // cabinet / backglass
 const bg=c.createLinearGradient(0,0,0,H);bg.addColorStop(0,'#1a1038');bg.addColorStop(1,'#0e0a22');c.fillStyle=bg;c.fillRect(0,0,W,H);
 for(let i=0;i<60;i++){c.fillStyle='rgba(255,233,184,'+(.15+R()*.3)+')';c.beginPath();c.arc(R()*W,R()*H,.8+R()*1.4,0,TAU);c.fill();}
 for(const [sx,sy,sc,col] of[[26,32,10,'#f2ce77'],[512,30,9,'#ef896d'],[18,238,7,'#9de3d1'],[522,236,7,'#ff9bd0']])star(c,sx,sy,sc,col);
 // cabinet side rails
 for(const x0 of[0,512]){const g=c.createLinearGradient(x0,0,x0+28,0);g.addColorStop(0,x0?sh('#5a3a68',-.1):sh('#5a3a68',.25));g.addColorStop(1,x0?sh('#5a3a68',.25):sh('#5a3a68',-.1));c.fillStyle=g;c.fillRect(x0,272,28,H-272);c.strokeStyle=INK;c.lineWidth=2.5;c.strokeRect(x0,272,28,H-272);for(let y=300;y<H;y+=70){c.fillStyle='#e4b672';c.beginPath();c.arc(x0+14,y,3.4,0,TAU);c.fill();c.strokeStyle=INK;c.lineWidth=1.3;c.stroke();}}
 // playfield
 const pf=new Path2D();pf.moveTo(28,830);pf.lineTo(28,272);pf.arc(270,272,242,Math.PI,0);pf.lineTo(512,830);pf.closePath();
 c.save();c.clip(pf);
 let g=c.createLinearGradient(0,30,0,830);g.addColorStop(0,'#2a2368');g.addColorStop(.5,'#3b2c7c');g.addColorStop(1,'#241a58');c.fillStyle=g;c.fillRect(0,0,W,H);
 for(const [x,y,r,col] of[[270,620,290,'rgba(255,111,145,.28)'],[150,300,200,'rgba(139,183,220,.24)'],[400,430,190,'rgba(181,139,214,.3)'],[270,100,170,'rgba(157,227,209,.18)']]){const rg=c.createRadialGradient(x,y,0,x,y,r);rg.addColorStop(0,col);rg.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=rg;c.fillRect(0,0,W,H);}
 for(let i=0;i<110;i++){const x=R()*W,y=R()*H;c.fillStyle=i%4?'rgba(255,233,184,.65)':'rgba(157,227,209,.7)';c.beginPath();c.arc(x,y,.7+R()*1.6,0,TAU);c.fill();}
 // constellation
 c.strokeStyle='rgba(255,233,184,.28)';c.lineWidth=1.6;c.setLineDash([3,6]);c.beginPath();[[120,200],[170,130],[240,150],[300,95],[372,140],[420,90]].forEach((q,i)=>i?c.lineTo(q[0],q[1]):c.moveTo(q[0],q[1]));c.stroke();c.setLineDash([]);
 [[120,200],[170,130],[240,150],[300,95],[372,140],[420,90]].forEach((q,i)=>star(c,q[0],q[1],5+i%2*2,'rgba(255,233,184,.8)'));
 planet(c,270,610,42,'#ef896d','#f2ce77',5);planet(c,455,250,16,'#8bb7dc',null,9);planet(c,75,300,13,'#91c9a7',null,3);
 // painted rings around bumpers
 for(const bm of BUMPERS){c.strokeStyle='rgba(255,233,184,.4)';c.lineWidth=2.5;c.setLineDash([4,7]);c.beginPath();c.arc(bm.x,bm.y,bm.r+14,0,TAU);c.stroke();c.setLineDash([]);}
 // title decal
 N.text(c,'STARLIGHT',270,552,{font:'700 24px Fredoka',align:'center',color:'rgba(255,233,184,.38)',stroke:'rgba(26,18,38,.55)',sw:5});
 // arrows (unlit inserts)
 for(let i=0;i<4;i++){const x=140+i*65;c.strokeStyle='rgba(255,233,184,.3)';c.lineWidth=3;c.lineCap='round';c.lineJoin='round';c.beginPath();c.moveTo(x-8,437);c.lineTo(x,427);c.lineTo(x+8,437);c.stroke();}
 // drop target housings
 for(let i=0;i<4;i++){const tx=140+i*65,ty=470;c.fillStyle='#0a0618';N.rr(c,tx-22,ty-14,44,28,7);c.fill();c.strokeStyle=INK;c.lineWidth=2.5;c.stroke();c.strokeStyle='rgba(228,182,114,.7)';c.lineWidth=2;N.rr(c,tx-24,ty-16,48,32,9);c.stroke();}
 // rollover lanes (guides)
 LANES.forEach((l)=>{c.strokeStyle='rgba(228,182,114,.7)';c.lineWidth=3;c.beginPath();c.arc(l.x,l.y,15,0,TAU);c.stroke();c.fillStyle='#241a58';c.beginPath();c.arc(l.x,l.y,11,0,TAU);c.fill();c.strokeStyle=INK;c.lineWidth=2;c.stroke();});
 // saucer socket
 {const sx=410,sy=440;c.fillStyle='rgba(10,4,20,.5)';c.beginPath();c.arc(sx+2,sy+3,26,0,TAU);c.fill();const rg=c.createRadialGradient(sx-6,sy-6,3,sx,sy,26);rg.addColorStop(0,'#ffb0c4');rg.addColorStop(.6,'#ff6f91');rg.addColorStop(1,'#8a2a4a');c.fillStyle=rg;c.beginPath();c.arc(sx,sy,24,0,TAU);c.fill();c.strokeStyle=INK;c.lineWidth=2.6;c.stroke();c.fillStyle='#0a0618';c.beginPath();c.arc(sx,sy,17,0,TAU);c.fill();c.strokeStyle=INK;c.lineWidth=2;c.stroke();c.strokeStyle='rgba(255,246,222,.6)';c.lineWidth=2;c.lineCap='round';c.beginPath();c.arc(sx,sy,21,3.5,4.5);c.stroke();N.text(c,'?',sx,sy+6,{align:'center',font:'700 16px Fredoka',color:'#ff9bb5'});}
 // spinner posts
 for(const x of[218,292]){c.fillStyle='#e4b672';c.beginPath();c.arc(x,520,5,0,TAU);c.fill();c.strokeStyle=INK;c.lineWidth=1.6;c.stroke();}
 // plunger chamber
 c.fillStyle='#120a28';c.fillRect(480,320,32,510);c.strokeStyle='rgba(228,182,114,.35)';c.lineWidth=1.5;c.setLineDash([4,8]);c.beginPath();c.moveTo(496,330);c.lineTo(496,780);c.stroke();c.setLineDash([]);
 // slingshot bodies
 for(const pts of[[[92,560],[92,630],[138,690]],[[414,560],[414,630],[368,690]]]){c.beginPath();pts.forEach((q,i)=>i?c.lineTo(q[0],q[1]):c.moveTo(q[0],q[1]));c.closePath();const sg=c.createLinearGradient(pts[0][0],560,pts[2][0],690);sg.addColorStop(0,'#ffa890');sg.addColorStop(.5,'#ef896d');sg.addColorStop(1,'#a8523f');c.fillStyle=sg;c.fill();c.strokeStyle=INK;c.lineWidth=3;c.lineJoin='round';c.stroke();
  c.strokeStyle='rgba(255,246,222,.6)';c.lineWidth=2.2;c.lineCap='round';c.beginPath();c.moveTo(pts[0][0]+(pts[0][0]<200?6:-6),pts[0][1]+10);c.lineTo(pts[0][0]+(pts[0][0]<200?6:-6),pts[1][1]-8);c.stroke();
  c.fillStyle='rgba(255,224,138,.9)';for(let k=0;k<3;k++){const t=.25+k*.25;c.beginPath();c.arc(pts[0][0]+(pts[2][0]-pts[0][0])*t*.6+(pts[0][0]<200?8:-8),pts[0][1]+(pts[2][1]-pts[0][1])*t+8,2.8,0,TAU);c.fill();}}
 c.restore();
 // rails (all static wall segments)
 c.lineCap='round';c.lineJoin='round';
 const rails=new Path2D();for(const s of SEG){if(s.kick)continue;rails.moveTo(s.x1,s.y1);rails.lineTo(s.x2,s.y2);}
 c.save();c.translate(3,5);c.strokeStyle='rgba(6,2,16,.55)';c.lineWidth=9;c.stroke(rails);c.restore();
 c.strokeStyle=INK;c.lineWidth=10;c.stroke(rails);
 c.strokeStyle='#e4b672';c.lineWidth=6.5;c.stroke(rails);
 c.save();c.translate(-1,-1.4);c.strokeStyle='rgba(255,252,238,.7)';c.lineWidth=1.7;c.stroke(rails);c.restore();
 // post caps at corners
 for(const [x,y] of[[60,690],[150,768],[424,690],[354,768],[478,690],[110,150],[170,205],[430,150],[380,205],[28,272],[512,272]]){const g2=c.createRadialGradient(x-2,y-2,1,x,y,7);g2.addColorStop(0,'#fff6d6');g2.addColorStop(.6,'#e4b672');g2.addColorStop(1,'#8a5b1a');c.fillStyle=g2;c.beginPath();c.arc(x,y,6.2,0,TAU);c.fill();c.strokeStyle=INK;c.lineWidth=1.8;c.stroke();}
 N.grain(c,W,H,.4);
}
function bumperSpr(col){return spr('bm'+col,96,104,(c)=>{const x=48,y=50,r=28;
  c.fillStyle='rgba(8,4,18,.5)';c.beginPath();c.ellipse(x+5,y+r*.62,r*1.2,r*.6,0,0,TAU);c.fill();
  // skirt (cone ring)
  let g=c.createLinearGradient(0,y,0,y+r*1.1);g.addColorStop(0,sh('#4b3052',.2));g.addColorStop(1,sh('#4b3052',-.5));c.fillStyle=g;c.beginPath();c.ellipse(x,y+r*.18,r*1.12,r*.95,0,0,TAU);c.fill();c.strokeStyle=INK;c.lineWidth=2.6;c.stroke();
  c.strokeStyle='#e4b672';c.lineWidth=3;c.beginPath();c.ellipse(x,y+r*.12,r*1.02,r*.86,0,0,TAU);c.stroke();
  // dome
  g=c.createRadialGradient(x-r*.38,y-r*.5,r*.08,x,y-r*.1,r*1.05);g.addColorStop(0,sh(col,.62));g.addColorStop(.45,col);g.addColorStop(1,sh(col,-.55));c.fillStyle=g;c.beginPath();c.arc(x,y-r*.1,r*.9,0,TAU);c.fill();c.strokeStyle=INK;c.lineWidth=2.8;c.stroke();
  // cap ring
  c.fillStyle='rgba(26,12,44,.5)';c.beginPath();c.arc(x,y-r*.1,r*.5,0,TAU);c.fill();c.strokeStyle='rgba(255,246,222,.35)';c.lineWidth=1.6;c.stroke();
  c.strokeStyle='rgba(255,252,238,.85)';c.lineWidth=3.2;c.lineCap='round';c.beginPath();c.arc(x,y-r*.1,r*.72,3.5,4.5);c.stroke();});}
function flipSpr(side){return spr('fl'+side,130,50,(c)=>{const ox=22,oy=25,L=84,rb=11,rt=7;c.save();c.translate(ox,oy);
  const body=()=>{c.beginPath();c.moveTo(0,-rb);c.lineTo(L,-rt);c.arc(L,0,rt,-Math.PI/2,Math.PI/2);c.lineTo(0,rb);c.arc(0,0,rb,Math.PI/2,Math.PI*1.5);c.closePath();};
  c.save();c.translate(2,5);body();c.fillStyle='rgba(6,2,16,.45)';c.fill();c.restore();
  body();const s=side==='L'?1:-1;let g=c.createLinearGradient(0,-rb*s,0,rb*s);g.addColorStop(0,'#ffb8a2');g.addColorStop(.5,'#ef896d');g.addColorStop(1,'#a04a3a');c.fillStyle=g;c.fill();c.strokeStyle=INK;c.lineWidth=2.8;c.lineJoin='round';c.stroke();
  c.strokeStyle='rgba(255,246,222,.75)';c.lineWidth=3;c.lineCap='round';c.beginPath();c.moveTo(10,-rb*.55*s);c.lineTo(L-8,-rt*.5*s);c.stroke();
  c.fillStyle='#e4b672';c.beginPath();c.arc(0,0,5,0,TAU);c.fill();c.strokeStyle=INK;c.lineWidth=1.8;c.stroke();c.restore();});}
function ballSpr(){return spr('ball',32,32,(c)=>{const x=16,y=16,r=BR;let g=c.createRadialGradient(x-3.4,y-4,1,x,y,r);g.addColorStop(0,'#ffffff');g.addColorStop(.35,'#cfdcef');g.addColorStop(.7,'#7a88b0');g.addColorStop(1,'#2f2f58');c.fillStyle=g;c.beginPath();c.arc(x,y,r,0,TAU);c.fill();
 c.save();c.beginPath();c.arc(x,y,r-.5,0,TAU);c.clip();c.fillStyle='rgba(255,224,170,.45)';c.beginPath();c.ellipse(x+1,y+4.4,r*.8,r*.35,0,0,TAU);c.fill();c.fillStyle='rgba(120,90,160,.4)';c.fillRect(x-r,y-.5,r*2,2);c.restore();
 c.strokeStyle=INK;c.lineWidth=1.6;c.beginPath();c.arc(x,y,r,0,TAU);c.stroke();c.fillStyle='rgba(255,255,255,.95)';c.beginPath();c.arc(x-3,y-3.6,1.9,0,TAU);c.fill();});}
function targetSpr(){return spr('tgt',48,34,(c)=>{claySlab(c,6,4,36,22,6,'#8ec7a4',2.2);c.fillStyle=INK;c.beginPath();c.arc(14,15,1.8,0,TAU);c.arc(34,15,1.8,0,TAU);c.fill();});}
function pill(ctx,x,y,w,txt,col){ctx.fillStyle='rgba(18,10,28,.62)';N.rr(ctx,x-w/2,y,w,22,11);ctx.fill();ctx.strokeStyle='rgba(228,182,114,.6)';ctx.lineWidth=1.3;ctx.stroke();N.text(ctx,txt,x,y+16,{font:'700 12px Fredoka',align:'center',color:col||'#ffe9b8'});}
function draw(ctx,a){const p=a.p;
 N.cached(ctx,'pin',W,H,bakeTable);
 // lit lane inserts
 LANES.forEach((l,i)=>{if(p.lanes[i]){ctx.fillStyle='#ffe08a';ctx.beginPath();ctx.arc(l.x,l.y,9,0,TAU);ctx.fill();ctx.strokeStyle='rgba(255,252,238,.85)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(l.x,l.y,6,3.5,4.5);ctx.stroke();glowAt(ctx,l.x,l.y,30,'#ffe08a',.7);}else{ctx.fillStyle='#3a2d80';ctx.beginPath();ctx.arc(l.x,l.y,7,0,TAU);ctx.fill();}});
 // arrows: light the arrow above a downed target / pulse
 const pul=.5+.5*Math.sin(p.t*5);
 for(let i=0;i<4;i++){if(!p.drops[i]){const x=140+i*65;ctx.strokeStyle='rgba(255,224,138,'+(.5+.4*pul)+')';ctx.lineWidth=3.6;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();ctx.moveTo(x-8,437);ctx.lineTo(x,427);ctx.lineTo(x+8,437);ctx.stroke();glowAt(ctx,x,430,20,'#ffe08a',.5*pul);}}
 // drop targets
 const ts=targetSpr();for(let i=0;i<4;i++){const tx=140+i*65,ty=470;if(p.drops[i])ctx.drawImage(ts,tx-24,ty-17);else{ctx.fillStyle='rgba(0,0,0,.5)';N.rr(ctx,tx-18,ty-2,36,6,3);ctx.fill();}}
 // saucer glow
 {const sc=p.sauce;glowAt(ctx,sc.x,sc.y,40,'#ff6f91',.32+.12*Math.sin(p.t*4)+(sc.ball?.35:0));}
 // spinner
 ctx.save();ctx.translate(255,520);ctx.scale(1,Math.abs(Math.cos(p.spin.a))*.9+.1);claySlab(ctx,-34,-4,68,8,4,'#f2ce77',1.6);ctx.restore();
 // slingshot flash
 if(p.glow.sling>0){ctx.globalAlpha=Math.min(1,p.glow.sling*5)*.6;ctx.fillStyle='#fff6e0';for(const pts of[[[92,560],[92,630],[138,690]],[[414,560],[414,630],[368,690]]]){ctx.beginPath();pts.forEach((q,i)=>i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]));ctx.closePath();ctx.fill();}ctx.globalAlpha=1;}
 // bumpers
 BUMPERS.forEach((bm,i)=>{const gl=p.glow['b'+i]||0,hit=gl>0,s=bumperSpr(bm.c),k=Math.sin(Math.min(1,gl/.25)*Math.PI);
  if(hit)glowAt(ctx,bm.x,bm.y,bm.r*3.4,bm.c,.85*Math.min(1,gl*5));else glowAt(ctx,bm.x,bm.y,bm.r*2.2,bm.c,.22);
  ctx.save();ctx.translate(bm.x,bm.y+bm.r*.55);ctx.scale(1+.16*k,1-.13*k);ctx.translate(0,-bm.r*.55);ctx.drawImage(s,-48,-50);ctx.restore();
  N.text(ctx,String(3*p.mult),bm.x,bm.y-bm.r*.1+5,{align:'center',font:'700 14px Fredoka',color:'#fff3d6',stroke:'rgba(26,12,44,.7)',sw:3});});
 // flippers
 for(const f of p.fl){const s=flipSpr(f.side);ctx.save();ctx.translate(f.px,f.py);ctx.rotate(f.ang);ctx.drawImage(s,-22,-25);ctx.restore();}
 // plunger
 {const py=806+p.plunge*22;ctx.fillStyle='#ffd17c';ctx.strokeStyle=INK;ctx.lineWidth=1.6;ctx.beginPath();for(let k=0;k<5;k++){const yy=py+16+k*8;ctx.moveTo(490,yy);ctx.lineTo(502,yy+4);}ctx.strokeStyle='#8a8aa0';ctx.lineWidth=3;ctx.stroke();claySlab(ctx,484,py,24,16,5,'#ef896d',2);}
 // balls
 const bs=ballSpr();for(const b of p.balls){const dx=(b.x-270)*.03;N.shadow(ctx,b.x+4+dx,b.y+5,b.r*1.05,b.r*.55,.35);ctx.drawImage(bs,b.x-16,b.y-16);}
 // HUD in top corner band (outside the arc)
 N.chip(ctx,6,8,100,'BALLS',p.left,{color:'#ffe08a'});N.chip(ctx,6,52,106,'SCORE',a.score,{color:'#ffe08a'});N.chip(ctx,W-106,8,100,'BONUS','x'+p.mult,{color:'#ef896d'});if(p.mb)N.chip(ctx,W-120,52,114,'MULTIBALL','JACKPOT',{color:'#ff6f91'});
 if(p.saveT>0){N.bar(ctx,W-112,98,106,8,p.saveT/(p.saveSec||10),'#91c9a7');N.text(ctx,'SAVER',W-59,120,{font:'700 9px Fredoka',align:'center',color:'#bfe4da'});}
 if(p.msgT>0){ctx.save();ctx.globalAlpha=Math.min(1,p.msgT*2);const sc=1+Math.max(0,p.msgT-1.2)*.3;ctx.translate(270,200);ctx.scale(sc,sc);N.text(ctx,p.msg,0,0,{font:'700 28px Fredoka',align:'center',color:'#ffe08a',stroke:'#1a1226',sw:6,glow:'#ff6f91'});ctx.restore();}
 if(p.tiltT>0)N.text(ctx,'TILT',270,430,{font:'700 54px Fredoka',align:'center',color:'#ff6f91',stroke:'#1a1226',sw:7});
 if(a.running&&p.ready&&!p.plunging&&p.balls.length)pill(ctx,270,834,250,'HOLD SPACE · RELEASE TO LAUNCH');
 if(!a.running){const w=212,h=56,x=270-w/2,y=584;ctx.fillStyle='rgba(18,8,28,.45)';N.rr(ctx,x+3,y+6,w,h,20);ctx.fill();claySlab(ctx,x,y,w,h,20,'#5a3d62',2.4);N.text(ctx,'STARLIGHT PINBALL',270,y+24,{font:'700 17px Fredoka',align:'center',color:'#ffe08a',stroke:'#1a1226'});N.text(ctx,'Bumpers · targets · multiball',270,y+43,{font:'600 11px Fredoka',align:'center',color:'#fff0d4'});}
 N.vignette(ctx,W,H,.3);}
NEXUS_GAMES.register('pinball',{meta:{title:'STARLIGHT PINBALL',help:'Pull the plunger back, launch, and keep the ball alive. Clear all four targets for multiball, light the lanes to raise your bonus, and find the mystery saucer. Nudge in a pinch, but three nudges tilt the table.',controls:'← / Z left flipper · → / M right flipper · hold SPACE plunger · SHIFT nudge',type:'CLASSIC'},
 size:[540,860],portraitSize:[540,860],duration:0,timed:false,tier:1.2,
 touch:[{kind:'btn',side:'left',label:'LEFT',key:'ArrowLeft',big:true},{kind:'btn',side:'right',label:'LAUNCH',key:' ',cls:'alt'},{kind:'btn',side:'right',label:'RIGHT',key:'ArrowRight',big:true}],
 init,start,update,draw,pointerdown:pdown,pointerup:pup,pointermove(){},keydown,keyup});
})();

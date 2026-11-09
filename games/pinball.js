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
function draw(ctx,a){const p=a.p;
 N.bgGrad(ctx,W,H,['#0e0a22','#1d1340','#2a1a52']);
 // playfield
 ctx.save();ctx.beginPath();ctx.moveTo(28,830);ctx.lineTo(28,272);ctx.arc(270,272,242,Math.PI,0);ctx.lineTo(512,830);ctx.closePath();
 const g=ctx.createLinearGradient(0,30,0,830);g.addColorStop(0,'#2a2368');g.addColorStop(.5,'#3b2c7c');g.addColorStop(1,'#241a58');ctx.fillStyle=g;ctx.fill();ctx.clip();
 for(let i=0;i<70;i++)N.glow(ctx,(i*131)%W,(i*79)%H,1.5+(i%3),i%3?'#ffe9b8':'#9de3d1',.35);
 // art: big star + rails
 ctx.strokeStyle='rgba(157,227,209,.3)';ctx.lineWidth=2;ctx.beginPath();for(let i=0;i<10;i++){const an=i*Math.PI/5-Math.PI/2,r=i%2?44:90;ctx.lineTo(270+Math.cos(an)*r,600+Math.sin(an)*r*.8);}ctx.closePath();ctx.stroke();
 N.text(ctx,'STARLIGHT',270,495,{font:'700 22px Fredoka',align:'center',color:'rgba(255,233,184,.22)'});
 // lanes
 LANES.forEach((l,i)=>{ctx.fillStyle=p.lanes[i]?'#ffe08a':'#3a2d80';ctx.beginPath();ctx.arc(l.x,l.y,10,0,N.TAU);ctx.fill();ctx.strokeStyle='#ffe9b8';ctx.lineWidth=2;ctx.stroke();if(p.lanes[i])N.glow(ctx,l.x,l.y,28,'#ffe08a',.6);});
 // drop targets
 for(let i=0;i<4;i++){const tx=140+i*65,ty=470;if(p.drops[i]){N.slab(ctx,tx-18,ty-8,36,16,5,'#8ec7a4',{depth:4});}else{ctx.fillStyle='rgba(0,0,0,.35)';N.rr(ctx,tx-18,ty-2,36,6,3);ctx.fill();}}
 // saucer
 const sc=p.sauce;N.glow(ctx,sc.x,sc.y,36,'#ff6f91',.4);ctx.fillStyle='#0a0618';ctx.beginPath();ctx.arc(sc.x,sc.y,17,0,N.TAU);ctx.fill();ctx.strokeStyle='#ff6f91';ctx.lineWidth=3;ctx.stroke();N.text(ctx,'?',sc.x,sc.y+6,{align:'center',font:'700 16px Fredoka',color:'#ff9bb5'});
 // spinner
 ctx.save();ctx.translate(255,520);ctx.scale(1,Math.abs(Math.cos(p.spin.a))*.9+.1);N.slab(ctx,-34,-4,68,8,4,'#f2ce77',{depth:2});ctx.restore();
 ctx.restore();
 // walls
 ctx.lineCap='round';
 for(const s of SEG){ctx.strokeStyle=s.kick?(p.glow.sling>0?'#fff':'#ef896d'):'#f2ce77';ctx.lineWidth=s.kick?6:5;ctx.beginPath();ctx.moveTo(s.x1,s.y1);ctx.lineTo(s.x2,s.y2);ctx.stroke();if(!s.kick){ctx.strokeStyle='rgba(255,255,255,.35)';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(s.x1,s.y1);ctx.lineTo(s.x2,s.y2);ctx.stroke();}}
 // bumpers
 BUMPERS.forEach((bm,i)=>{const hit=p.glow['b'+i]>0;N.glow(ctx,bm.x,bm.y,bm.r*(hit?3.2:2),bm.c,hit?.75:.3);N.ball(ctx,bm.x,bm.y,bm.r*(hit?1.08:1),bm.c,{shadow:true});ctx.fillStyle='rgba(20,10,40,.55)';ctx.beginPath();ctx.arc(bm.x,bm.y,bm.r*.5,0,N.TAU);ctx.fill();N.text(ctx,String(3*p.mult),bm.x,bm.y+5,{align:'center',font:'700 14px Fredoka',color:'#fff3d6'});});
 // flippers
 for(const f of p.fl){const t=fl_tip(f);ctx.lineCap='round';ctx.strokeStyle='#5a2d3a';ctx.lineWidth=22;ctx.beginPath();ctx.moveTo(f.px,f.py+3);ctx.lineTo(t.x,t.y+3);ctx.stroke();ctx.strokeStyle='#ef896d';ctx.lineWidth=18;ctx.beginPath();ctx.moveTo(f.px,f.py);ctx.lineTo(t.x,t.y);ctx.stroke();ctx.strokeStyle='#ffd1bd';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(f.px,f.py-4);ctx.lineTo(t.x,t.y-4);ctx.stroke();N.ball(ctx,f.px,f.py,10,'#f2ce77',{shadow:false});}
 // plunger
 ctx.fillStyle='#2d2250';ctx.fillRect(480,806,32,40);const py=806+p.plunge*22;N.slab(ctx,484,py,24,16,5,'#ef896d',{depth:3});
 ctx.fillStyle='#3a2d80';ctx.fillRect(486,py+16,12,40);
 // balls
 for(const b of p.balls){N.glow(ctx,b.x,b.y,b.r*3,'#cfe9ff',.2);N.ball(ctx,b.x,b.y,b.r,'#dfe9f5',{shadowAlpha:.6});}
 // HUD
 N.chip(ctx,40,40,92,'BALLS',p.left,{color:'#ffe08a'});N.chip(ctx,142,40,116,'SCORE',a.score,{color:'#ffe08a'});N.chip(ctx,268,40,80,'BONUS','×'+p.mult,{color:'#ef896d'});if(p.mb)N.chip(ctx,358,40,120,'MULTIBALL','JACKPOT',{color:'#ff6f91'});
 if(p.saveT>0)N.bar(ctx,40,86,160,8,p.saveT/(p.saveSec||10),'#91c9a7');
 if(p.msgT>0){ctx.globalAlpha=Math.min(1,p.msgT*2);N.text(ctx,p.msg,270,180,{font:'700 30px Fredoka',align:'center',color:'#ffe08a',stroke:'#1a1226',glow:'#ff6f91'});ctx.globalAlpha=1;}
 if(p.tiltT>0)N.text(ctx,'TILT',270,430,{font:'700 54px Fredoka',align:'center',color:'#ff6f91',stroke:'#1a1226'});
 if(a.running&&p.ready&&!p.plunging&&p.balls.length)N.text(ctx,'HOLD SPACE · RELEASE TO LAUNCH',270,848,{font:'700 12px Fredoka',align:'center',color:'#ffe9b8'});
 if(!a.running)N.banner(ctx,W,H,'STARLIGHT PINBALL','Hit bumpers · clear the targets for multiball');
 N.vignette(ctx,W,H,.35);}
NEXUS_GAMES.register('pinball',{meta:{title:'STARLIGHT PINBALL',help:'Pull the plunger back, launch, and keep the ball alive. Clear all four targets for multiball, light the lanes to raise your bonus, and find the mystery saucer. Nudge in a pinch, but three nudges tilt the table.',controls:'← / Z left flipper · → / M right flipper · hold SPACE plunger · SHIFT nudge',type:'CLASSIC'},
 size:[540,860],portraitSize:[540,860],duration:0,timed:false,tier:1.2,
 touch:[{kind:'btn',side:'left',label:'LEFT',key:'ArrowLeft',big:true},{kind:'btn',side:'right',label:'LAUNCH',key:' ',cls:'alt'},{kind:'btn',side:'right',label:'RIGHT',key:'ArrowRight',big:true}],
 init,start,update,draw,pointerdown:pdown,pointerup:pup,pointermove(){},keydown,keyup});
})();

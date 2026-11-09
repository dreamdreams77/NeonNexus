/* Cosmic Skee-Ball: lane + ramp launch + sloped board with real hole physics. */
(function(){
const N=window.NXG;
const HOLES=[
 {x:-.6,d:.80,r:.12,pts:10},{x:.6,d:.80,r:.12,pts:10},{x:0,d:.83,r:.10,pts:20},
 {x:-.66,d:.885,r:.085,pts:30},{x:.66,d:.885,r:.085,pts:30},{x:0,d:.915,r:.075,pts:40},
 {x:-.86,d:.965,r:.06,pts:50},{x:.86,d:.965,r:.06,pts:50},{x:0,d:.975,r:.05,pts:100,bonus:true}
];
const COL={10:'#8bb7dc',20:'#91c9a7',30:'#f2ce77',40:'#ef896d',50:'#b58bd6',100:'#ff6f91'};
const LIP=.72,BACK=1.0,BALL=.042;
let woodCache=null,woodKey='';
function geom(a){const W=a.W,H=a.H,por=W<H;return{W,H,cx:W/2,hw:por?W*.4:W*.25,yb:H*.92,hz:H*(por?.24:.2),zf:por?.8:.85,liftK:H*(por?.16:.26)};}
function proj(g,x,d,z=0){const s=1/(1+d*g.zf),yb=g.hz+(g.yb-g.hz)*s;const lift=Math.max(0,d-LIP)*g.liftK*(1/(1-LIP));return{x:g.cx+x*g.hw*s,y:yb-lift*s*1.6-z*g.liftK*.5*s,s};}
function init(a){const p=a.p;p.balls=9;p.maxBalls=9;p.ball=null;p.aimX=0;p.angle=0;p.pull=0;p.pulling=false;p.pressY=0;p.pressX=0;p.charge=0;p.chargeDir=1;p.charging=false;p.t=0;p.log=[];p.lastPts=0;p.streak=0;p.msg='';p.msgT=0;p.sunk=[];p.bonusX=0;p.shots=0;p.hundreds=0;p.fx=[];p.r=1;p.hard=false;p.guide=.45;}
function start(a){const p=a.p;init(a);const m=a.mastery;p.maxBalls=p.balls=9+(m>=4?1:0);p.guide=m>=2?1:.45;p.perfectWin=m>=6?.1:.06;p.r=a.diff.id==='easy'?1.3:a.diff.id==='hard'?.82:1;p.hard=a.diff.id==='hard';p.wind=0;p.bonusX=0;a.hud('9 BALLS · DRAG BACK TO SET POWER · RELEASE TO ROLL');}
function holeAt(p,h,t){if(h.bonus&&p.hard)return{x:Math.sin(t*1.3)*.5,d:h.d,r:h.r*p.r,pts:h.pts};return{x:h.x,d:h.d,r:h.r*p.r,pts:h.pts};}
function launch(a,power){const p=a.p;if(p.ball||p.balls<=0)return;power=N.clamp(power,0,1);const v=.38+power*.62;p.balls--;p.shots++;p.ball={x:p.aimX,d:0,vx:Math.sin(p.angle)*v,vd:Math.cos(p.angle)*v,z:0,vz:0,ph:'lane',spin:0,t:0,power};p.pull=0;p.pulling=false;p.charging=false;p.charge=0;N.sfx(a,'whoosh');}
function sink(a,hole){const p=a.p,b=p.ball;const pts=hole.pts;p.streak=pts>=30?p.streak+1:0;a.combo=p.streak;a.addScore(pts,0,0);p.lastPts=pts;p.msg=pts+' POINTS!'+(pts===100?' BULLSEYE!':'');p.msgT=1.6;p.sunk.push({x:hole.x,d:hole.d,t:0});p.fx.push({x:hole.x,d:hole.d,t:0,col:COL[pts]});b.ph='sunk';b.t=0;N.sfx(a,pts>=50?'win':'coin');a.shake(pts>=50?6:2,.2);
 if(pts===100){p.hundreds++;a.achieve('bullseye','Bullseye! Hit the 100 hole',6);}if(p.streak>=3)a.achieve('hot','Three 30+ holes in a row',6);}
function finishCheck(a){const p=a.p;if(p.balls<=0&&!p.ball){const s=a.score;if(s>=300)a.achieve('century','Score 300 in one game',10);a.finish(s>=150,{grade:s>=400?'GRADE S':s>=300?'GRADE A':s>=200?'GRADE B':s>=120?'GRADE C':'GRADE D'});}}
function step(a,dt){
 const p=a.p,b=p.ball;p.t+=dt;if(p.msgT>0)p.msgT-=dt;
 for(const f of p.fx)f.t+=dt;p.fx=p.fx.filter(f=>f.t<1);
 if(!b){if(p.charging){p.charge+=p.chargeDir*dt*1.15;if(p.charge>=1){p.charge=1;p.chargeDir=-1;}if(p.charge<=0){p.charge=0;p.chargeDir=1;}}
  const k=a.keys;if(k.ArrowLeft)p.aimX=N.clamp(p.aimX-dt*.9,-.88,.88);if(k.ArrowRight)p.aimX=N.clamp(p.aimX+dt*.9,-.88,.88);
  if(k.a||k.A)p.angle=N.clamp(p.angle-dt*.5,-.3,.3);if(k.d||k.D)p.angle=N.clamp(p.angle+dt*.5,-.3,.3);
  finishCheck(a);return;}
 b.t+=dt;
 if(b.ph==='lane'){
  b.vd-= .15*dt;b.x+=b.vx*dt;b.d+=b.vd*dt;
  if(Math.abs(b.x)>1.0){b.ph='gutter';b.vx=0;N.sfx(a,'bump');p.msg='GUTTER BALL';p.msgT=1;p.streak=0;a.combo=0;}
  else if(b.vd<=.02&&b.d<LIP){b.ph='stalled';b.t=0;p.msg='TOO SOFT';p.msgT=1;p.streak=0;a.combo=0;}
  else if(b.d>=LIP){const vl=Math.hypot(b.vd,b.vx);b.ph='air';b.vz=.55+vl*.7;b.vd=Math.max(.15,b.vd);b.t=0;b.lipSpd=vl;N.sfx(a,'tick');}
 }else if(b.ph==='air'){
  b.vz-=2.2*dt;b.z+=b.vz*dt;b.d+=b.vd*dt*1.28;b.x+=b.vx*dt;
  if(b.d>=BACK){b.d=BACK;b.vd=-Math.abs(b.vd)*.3;}
  if(b.z<=0&&b.t>.05){b.z=0;b.ph='board';b.vz=0;b.vd*=.55;b.vx*=.5;N.sfx(a,'bump');}
 }else if(b.ph==='board'){
  b.vd-=.42*dt;b.vd*=1-.35*dt;b.vx*=1-1.1*dt;b.d+=b.vd*dt;b.x+=b.vx*dt;
  if(b.d>=BACK){b.d=BACK;b.vd=-Math.abs(b.vd)*.3;}
  b.x=N.clamp(b.x,-.97,.97);const spd=Math.hypot(b.vd,b.vx);
  for(const h0 of HOLES){const h=holeAt(p,h0,p.t),dist=Math.hypot((b.x-h.x)*.92,(b.d-h.d)*.9);if(dist<h.r*.75&&spd<.7){b.x=h.x;b.d=h.d;sink(a,h);break;}else if(dist<h.r*1.0&&spd<.95){b.vd+=(h.d-b.d)*2*dt;b.vx+=(h.x-b.x)*2*dt;}}
  if(b.ph==='board'&&b.d<=LIP+.02&&b.vd<0){b.ph='returned';b.t=0;p.msg='ROLLED BACK';p.msgT=1;p.streak=0;a.combo=0;N.sfx(a,'miss');}
 }else if(b.ph==='gutter'){b.d+=.3*dt;b.z=-.05;if(b.t>.9)p.ball=null;}
 else if(b.ph==='stalled'||b.ph==='returned'){if(b.t>.7)p.ball=null;}
 else if(b.ph==='sunk'){if(b.t>.6)p.ball=null;}
}
function update(dt,a){const f=N.stepper(h=>step(a,h),120);f(dt);}
function bg(ctx,g,a){
 N.bgGrad(ctx,g.W,g.H,['#241a3a','#3b2a52','#4b3250']);
 for(let i=0;i<46;i++){const x=(i*173+31)%g.W,y=(i*97+19)%(g.hz);N.glow(ctx,x,y,2+(i%3),i%2?'#ffe9b8':'#9de3d1',.4);}
 // back wall with neon sign
 ctx.fillStyle='#2f2144';ctx.fillRect(0,0,g.W,g.hz+8);
 N.glow(ctx,g.cx,g.hz*.42,g.W*.45,'#ff6f91',.16);
 N.text(ctx,'COSMIC SKEE-BALL',g.cx,g.hz*.5,{font:'700 '+Math.round(g.W*(g.W<g.H?.075:.05))+'px Fredoka',align:'center',color:'#ffd2dc',glow:'#ff6f91',stroke:'#1a1226',sw:3});
}
function lane(ctx,g){
 const near=proj(g,0,0),far=proj(g,0,LIP);
 // wood lane
 const nl=proj(g,-1,0),nr=proj(g,1,0),fl=proj(g,-1,LIP),fr=proj(g,1,LIP);
 const gr=ctx.createLinearGradient(0,fl.y,0,nl.y);gr.addColorStop(0,'#a77852');gr.addColorStop(1,'#d9a874');
 ctx.fillStyle=gr;ctx.beginPath();ctx.moveTo(nl.x,nl.y);ctx.lineTo(fl.x,fl.y);ctx.lineTo(fr.x,fr.y);ctx.lineTo(nr.x,nr.y);ctx.closePath();ctx.fill();
 ctx.save();ctx.clip();ctx.strokeStyle='rgba(70,40,30,.25)';ctx.lineWidth=1.5;for(let i=-9;i<=9;i++){const a=proj(g,i/9,0),b=proj(g,i/9,LIP);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}
 for(let d=0;d<LIP;d+=.06){const l=proj(g,-1,d),r=proj(g,1,d);ctx.strokeStyle='rgba(255,230,190,.08)';ctx.beginPath();ctx.moveTo(l.x,l.y);ctx.lineTo(r.x,r.y);ctx.stroke();}ctx.restore();
 // gutters + rails
 for(const sgn of[-1,1]){const a=proj(g,sgn*1.0,0),b=proj(g,sgn*1.0,LIP),c=proj(g,sgn*1.18,LIP),d2=proj(g,sgn*1.18,0);ctx.fillStyle='#2a1c34';ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.lineTo(c.x,c.y);ctx.lineTo(d2.x,d2.y);ctx.closePath();ctx.fill();
  ctx.strokeStyle='#ef896d';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}
 // neon guide arrows
 for(let d=.1;d<LIP;d+=.14){const a=proj(g,0,d);N.glow(ctx,a.x,a.y,10*a.s*3,'#9de3d1',.2);}
}
function board(ctx,g,p){
 const bl=proj(g,-1.12,LIP),br=proj(g,1.12,LIP),tl=proj(g,-1.12,BACK),tr=proj(g,1.12,BACK);
 // ramp lip
 const ll=proj(g,-1,LIP),lr=proj(g,1,LIP);ctx.fillStyle='#f2ce77';ctx.beginPath();ctx.moveTo(ll.x,ll.y);ctx.lineTo(lr.x,lr.y);ctx.lineTo(lr.x,lr.y-8);ctx.lineTo(ll.x,ll.y-8);ctx.closePath();ctx.fill();
 const gr=ctx.createLinearGradient(0,tl.y,0,bl.y);gr.addColorStop(0,'#5b3c63');gr.addColorStop(1,'#8a5f72');
 ctx.fillStyle=gr;ctx.beginPath();ctx.moveTo(bl.x,bl.y-8);ctx.lineTo(br.x,br.y-8);ctx.lineTo(tr.x,tr.y);ctx.lineTo(tl.x,tl.y);ctx.closePath();ctx.fill();
 ctx.strokeStyle='#f2ce77';ctx.lineWidth=3;ctx.stroke();
 const hs=HOLES.map(h=>holeAt(p,h,p.t)).sort((a,b)=>a.d-b.d);
 for(const h of hs){const c=proj(g,h.x,h.d),rx=h.r*g.hw*c.s*1.05,ry=rx*.58;const col=COL[h.pts];
  N.glow(ctx,c.x,c.y,rx*2.4,col,.35);
  ctx.fillStyle=col;ctx.beginPath();ctx.ellipse(c.x,c.y,rx*1.18,ry*1.18,0,0,N.TAU);ctx.fill();
  ctx.fillStyle='#120a1c';ctx.beginPath();ctx.ellipse(c.x,c.y+ry*.1,rx*.82,ry*.82,0,0,N.TAU);ctx.fill();
  ctx.strokeStyle='rgba(255,255,255,.55)';ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(c.x,c.y,rx*1.18,ry*1.18,0,0,N.TAU);ctx.stroke();
  const fs=Math.max(9,rx*.62);N.text(ctx,h.pts,c.x,c.y-ry*1.45,{font:'700 '+fs+'px Fredoka',align:'center',color:'#fff3d6',stroke:'#1a1226',sw:3});}
 for(const f of p.fx){const c=proj(g,f.x,f.d);ctx.globalAlpha=1-f.t;ctx.strokeStyle=f.col;ctx.lineWidth=4;ctx.beginPath();ctx.ellipse(c.x,c.y,10+f.t*60,6+f.t*34,0,0,N.TAU);ctx.stroke();ctx.globalAlpha=1;}
}
function drawBall(ctx,g,b,x,d,z){const c=proj(g,x,d,z),r=Math.max(5,BALL*g.hw*c.s*1.9);N.ball(ctx,c.x,c.y,r,'#8bb7dc',{lift:z*20*c.s,shadowAlpha:z>0?.5:1});}
function draw(ctx,a){
 const g=geom(a),p=a.p;bg(ctx,g,a);lane(ctx,g);board(ctx,g,p);
 const b=p.ball;
 if(!b){
  // ball in hand + aim guide
  const len=p.guide*(.2+.55*Math.max(p.pull,p.charge,.3));let prev=proj(g,p.aimX,0);
  ctx.setLineDash([6,8]);ctx.strokeStyle='rgba(255,240,200,.75)';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(prev.x,prev.y);
  for(let i=1;i<=14;i++){const d=len*i/14,x=p.aimX+Math.tan(p.angle)*d;const c=proj(g,N.clamp(x,-1,1),d);ctx.lineTo(c.x,c.y);}ctx.stroke();ctx.setLineDash([]);
  if(p.balls>0||p.pulling)drawBall(ctx,g,null,p.aimX,0+p.pull*-.05,0);
 }else{if(b.ph==='sunk'){const c=proj(g,b.x,b.d);ctx.save();ctx.globalAlpha=Math.max(0,1-b.t*2);ctx.translate(0,b.t*14);drawBall(ctx,g,b,b.x,b.d,0);ctx.restore();}else drawBall(ctx,g,b,b.x,b.d,Math.max(0,b.z));}
 // power meter
 const mx=g.W<g.H?24:g.W-72,my=g.H*.38,mh=g.H*.4;
 if(a.running||true){ctx.fillStyle='rgba(22,16,34,.65)';N.rr(ctx,mx,my,26,mh,13);ctx.fill();
  const t=Math.max(p.pull,p.charge);const grad=ctx.createLinearGradient(0,my+mh,0,my);grad.addColorStop(0,'#91c9a7');grad.addColorStop(.6,'#f2ce77');grad.addColorStop(1,'#ef896d');
  ctx.fillStyle=grad;N.rr(ctx,mx+3,my+mh-3-(mh-6)*t,20,Math.max(8,(mh-6)*t),9);ctx.fill();
  const sw=.58;ctx.strokeStyle='#fff';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(mx-5,my+mh-(mh)*sw);ctx.lineTo(mx+31,my+mh-mh*sw);ctx.stroke();N.text(ctx,'POWER',mx+13,my-8,{font:'700 10px Fredoka',align:'center',color:'#ffe9b8'});}
 // HUD
 const hx=g.W<g.H?14:20;N.chip(ctx,hx,g.H*(g.W<g.H?.1:.13),110,'BALLS',p.balls+(p.ball?1:0));N.chip(ctx,hx+120,g.H*(g.W<g.H?.1:.13),120,'SCORE',a.score,{color:'#ffe08a'});
 if(p.streak>1)N.chip(ctx,hx+250,g.H*(g.W<g.H?.1:.13),110,'HOT STREAK','×'+p.streak,{color:'#ef896d'});
 if(p.msgT>0){ctx.globalAlpha=Math.min(1,p.msgT*2);N.text(ctx,p.msg,g.cx,g.H*.5,{font:'700 '+Math.round(g.W*(g.W<g.H?.08:.05))+'px Fredoka',align:'center',color:p.lastPts>=50&&p.msg.includes('POINT')?'#ffe08a':'#fff0d4',stroke:'#1a1226',glow:'#ff6f91'});ctx.globalAlpha=1;}
 if(!a.running)N.banner(ctx,g.W,g.H,'COSMIC SKEE-BALL','Drag back to charge · release to roll · aim for the glowing holes');
 N.vignette(ctx,g.W,g.H,.35);
}
function pdown(x,y,e,a){const p=a.p;if(p.ball||p.balls<=0)return;const g=geom(a);p.pulling=true;p.pressY=y;p.pressX=x;p.pull=0;
 const c=proj(g,0,0);const lx=(x-g.cx)/g.hw;if(y<g.H*.8)p.aimX=N.clamp(lx,-.88,.88);}
function pmove(x,y,e,a){const p=a.p;if(p.ball)return;const g=geom(a);
 if(p.pulling){p.pull=N.clamp((y-p.pressY)/(g.H*.3),0,1);p.angle=N.clamp((p.pressX-x)/(g.W*.9),-.3,.3)*-1*-1;p.angle=N.clamp((x-p.pressX)/(g.W*.5),-.3,.3);}
 else{p.aimX=N.clamp((x-g.cx)/g.hw,-.88,.88);}}
function pup(x,y,e,a){const p=a.p;if(!p.pulling)return;p.pulling=false;if(p.pull<.12){p.pull=0;return;}launch(a,.18+p.pull*.85-.02);}
function keydown(e,a){const p=a.p;if(e.key===' '&&!p.ball&&p.balls>0&&!p.charging){p.charging=true;p.charge=0;p.chargeDir=1;}}
function keyup(e,a){const p=a.p;if(e.key===' '&&p.charging){launch(a,.18+p.charge*.85-.02);}}
NEXUS_GAMES.register('skeeball',{meta:{title:'COSMIC SKEE-BALL',help:'Nine balls. Roll up the lane, jump the ramp and land the ball in a hole. Small holes at the top pay more; the 100 slides on hard. Gutters and soft rolls score nothing.',controls:'Drag back to charge, slide sideways to aim, release · or ←→ move, A/D angle, hold SPACE and release',type:'PRECISION'},
 size:[900,520],portraitSize:[540,860],duration:0,timed:false,tier:1.05,init,start,update,draw,pointerdown:pdown,pointermove:pmove,pointerup:pup,keydown,keyup});
})();

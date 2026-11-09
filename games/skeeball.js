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
function sink(a,hole){const p=a.p,b=p.ball;const pts=hole.pts;p.streak=pts>=30?p.streak+1:0;a.combo=p.streak;a.addScore(pts,0,0);p.lastPts=pts;p.msg=pts+' POINTS!'+(pts===100?' BULLSEYE!':'');p.msgT=1.6;p.sunk.push({x:hole.x,d:hole.d,t:0});p.fx.push({x:hole.x,d:hole.d,t:0,col:COL[pts]});{const g=geom(a),c=proj(g,hole.x,hole.d);a.burst(c.x,c.y,COL[pts],pts>=50?18:10);}b.ph='sunk';b.t=0;N.sfx(a,pts>=50?'win':'coin');a.shake(pts>=50?6:2,.2);
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
/* ---------- art: baked set + clay sprites (draw-only) ---------- */
const INK=N.INK,TAU=N.TAU,sh=N.shade;
const SPR={};
function spr(key,w,h,fn){let c=SPR[key];if(!c){c=document.createElement('canvas');c.width=Math.ceil(w);c.height=Math.ceil(h);fn(c.getContext('2d'),c.width,c.height);SPR[key]=c;}return c;}
function quad(ctx,a,b,c,d){ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.lineTo(c.x,c.y);ctx.lineTo(d.x,d.y);ctx.closePath();}
function ballSpr(r,col){r=Math.round(r);return spr('b'+col+r,r*2+6,r*2+6,(c,w)=>{const x=w/2,y=w/2;const g=c.createRadialGradient(x-r*.36,y-r*.42,r*.08,x,y,r*1.08);g.addColorStop(0,sh(col,.5));g.addColorStop(.5,col);g.addColorStop(1,sh(col,-.52));c.fillStyle=g;c.beginPath();c.arc(x,y,r,0,TAU);c.fill();c.strokeStyle=INK;c.lineWidth=Math.max(1.4,r*.09);c.stroke();c.strokeStyle='rgba(255,246,222,.7)';c.lineWidth=Math.max(1,r*.11);c.lineCap='round';c.beginPath();c.arc(x,y,r*.7,3.5,4.4);c.stroke();});}
function glowSpr(col,r){r=Math.round(r/4)*4||4;return spr('g'+col+r,r*2,r*2,(c,w)=>{const g=c.createRadialGradient(r,r,0,r,r,r);g.addColorStop(0,col);g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.fillRect(0,0,w,w);});}
function glowAt(ctx,x,y,r,col,a){const s=glowSpr(col,r);ctx.globalAlpha=a;ctx.globalCompositeOperation='lighter';ctx.drawImage(s,x-s.width/2,y-s.height/2);ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;}
function claySlab(c,x,y,w,h,r,col,lw=2){const g=c.createLinearGradient(0,y,0,y+h);g.addColorStop(0,sh(col,.32));g.addColorStop(.5,col);g.addColorStop(1,sh(col,-.4));c.fillStyle=g;N.rr(c,x,y,w,h,r);c.fill();c.strokeStyle=INK;c.lineWidth=lw;c.stroke();c.strokeStyle='rgba(255,246,222,.5)';c.lineWidth=Math.max(1,h*.07);c.lineCap='round';c.beginPath();c.moveTo(x+r,y+h*.14);c.lineTo(x+w-r,y+h*.14);c.stroke();}
function planet(c,x,y,r,col,ring,seed){const R=N.mulberry(seed);if(ring){c.save();c.translate(x,y);c.rotate(-.35);c.strokeStyle=INK;c.lineWidth=r*.34;c.beginPath();c.ellipse(0,0,r*1.7,r*.5,0,Math.PI,TAU);c.stroke();c.strokeStyle=sh(ring,-.1);c.lineWidth=r*.22;c.beginPath();c.ellipse(0,0,r*1.7,r*.5,0,Math.PI,TAU);c.stroke();c.restore();}
 const g=c.createRadialGradient(x-r*.4,y-r*.45,r*.1,x,y,r*1.1);g.addColorStop(0,sh(col,.45));g.addColorStop(.55,col);g.addColorStop(1,sh(col,-.55));c.fillStyle=g;c.beginPath();c.arc(x,y,r,0,TAU);c.fill();
 for(let i=0;i<4;i++){const a=R()*TAU,d=R()*r*.6,cr=r*(.1+R()*.14);c.fillStyle='rgba(30,12,40,.22)';c.beginPath();c.arc(x+Math.cos(a)*d,y+Math.sin(a)*d,cr,0,TAU);c.fill();c.strokeStyle='rgba(255,240,220,.3)';c.lineWidth=1.3;c.beginPath();c.arc(x+Math.cos(a)*d-1,y+Math.sin(a)*d-1,cr,.6,2.4);c.stroke();}
 c.strokeStyle=INK;c.lineWidth=Math.max(1.5,r*.07);c.beginPath();c.arc(x,y,r,0,TAU);c.stroke();c.strokeStyle='rgba(255,246,222,.6)';c.lineWidth=Math.max(1,r*.07);c.lineCap='round';c.beginPath();c.arc(x,y,r*.82,3.5,4.4);c.stroke();
 if(ring){c.save();c.translate(x,y);c.rotate(-.35);c.strokeStyle=INK;c.lineWidth=r*.34;c.beginPath();c.ellipse(0,0,r*1.7,r*.5,0,0,Math.PI);c.stroke();c.strokeStyle=sh(ring,.1);c.lineWidth=r*.22;c.beginPath();c.ellipse(0,0,r*1.7,r*.5,0,0,Math.PI);c.stroke();c.restore();}}
function holeSpr(col,rx,pts){rx=Math.max(4,Math.round(rx));const ry=rx*.58,W=rx*3.4+8,H=ry*2.6+rx*1.1+10;return spr('h'+col+rx+pts,W,H,(c,w,h)=>{const cx=w/2,cy=h-ry*1.5-3;
  // clay ring bowl (torus): shadow, outer rim, inner dark
  c.fillStyle='rgba(18,8,28,.4)';c.beginPath();c.ellipse(cx+rx*.12,cy+ry*.55,rx*1.38,ry*1.45,0,0,TAU);c.fill();
  let g=c.createLinearGradient(0,cy-ry*1.4,0,cy+ry*1.4);g.addColorStop(0,sh(col,.45));g.addColorStop(.5,col);g.addColorStop(1,sh(col,-.5));c.fillStyle=g;c.beginPath();c.ellipse(cx,cy,rx*1.32,ry*1.4,0,0,TAU);c.fill();c.strokeStyle=INK;c.lineWidth=Math.max(1.4,rx*.1);c.stroke();
  c.fillStyle=INK;c.beginPath();c.ellipse(cx,cy+ry*.08,rx*.9,ry*.95,0,0,TAU);c.fill();
  g=c.createLinearGradient(0,cy-ry,0,cy+ry);g.addColorStop(0,'#05020a');g.addColorStop(1,'#2c1838');c.fillStyle=g;c.beginPath();c.ellipse(cx,cy+ry*.12,rx*.8,ry*.84,0,0,TAU);c.fill();
  c.strokeStyle='rgba(255,246,222,.65)';c.lineWidth=Math.max(1,rx*.1);c.lineCap='round';c.beginPath();c.ellipse(cx,cy,rx*1.12,ry*1.18,0,3.5,4.5);c.stroke();
  // number plaque
  const fs=Math.max(9,rx*.62),pw=fs*(String(pts).length*.62+.9),ph=fs*1.25,px=cx-pw/2,py=cy-ry*1.4-ph-2;claySlab(c,px,py,pw,ph,ph/2,'#4b3052',1.4);N.text(c,pts,cx,py+ph*.76,{font:'700 '+fs+'px Fredoka',align:'center',color:'#ffe9b8'});});}
/* baked cabinet set: wall, floor, lane, rails, board frame (all static) */
function bakeSet(c,g){
 const W=g.W,H=g.H,R=N.mulberry(11);
 N.bgGrad(c,W,H,['#1c1430','#2f2146','#43294d']);
 // night-sky mural on back wall
 for(let i=0;i<70;i++){const x=R()*W,y=R()*g.hz;c.fillStyle=i%3?'rgba(255,233,184,.7)':'rgba(157,227,209,.7)';c.beginPath();c.arc(x,y,.8+R()*1.6,0,TAU);c.fill();}
 const pr=Math.min(g.hz*.3,g.W*.07);planet(c,g.W*.14,g.hz*.55,pr,'#ef896d','#f2ce77',5);planet(c,g.W*.87,g.hz*.5,pr*.8,'#8bb7dc',null,9);planet(c,g.W*(g.W<g.H?.9:.76),g.hz*.2,pr*.38,'#b58bd6',null,2);
 // wall base + cabinet backbox
 c.fillStyle='#2a1c34';c.fillRect(0,g.hz-4,W,H);
 const fl=c.createLinearGradient(0,g.hz,0,H);fl.addColorStop(0,'#3a2548');fl.addColorStop(1,'#1b1226');c.fillStyle=fl;c.fillRect(0,g.hz+4,W,H);
 // carpet diamonds
 c.save();c.globalAlpha=.16;for(let y=g.hz+10;y<H;y+=22)for(let x=((y/22)%2)*20;x<W;x+=40){c.fillStyle='#e4b672';c.beginPath();c.moveTo(x,y-9);c.lineTo(x+9,y);c.lineTo(x,y+9);c.lineTo(x-9,y);c.closePath();c.fill();}c.restore();
 c.fillStyle='#120a1c';c.fillRect(0,g.hz-4,W,8);c.strokeStyle='#e4b672';c.lineWidth=3;c.beginPath();c.moveTo(0,g.hz+4);c.lineTo(W,g.hz+4);c.stroke();
 // side cabinet walls (curved clay)
 for(const sgn of[-1,1]){const a=proj(g,sgn*1.18,0),b=proj(g,sgn*1.18,LIP),b2=proj(g,sgn*1.18,BACK);
  const o=sgn*g.hw*.5,x0=sgn<0?0:W;c.fillStyle='#241838';c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b2.x,b2.y);c.lineTo(b2.x+(x0-b2.x)*.6,b2.y-40);c.lineTo(x0,b2.y-40);c.lineTo(x0,H);c.lineTo(a.x+(x0-a.x)*.4,H);c.closePath();c.fill();}
 // wood lane with planks
 const NP=14;for(let i=0;i<NP;i++){const x0=-1+2*i/NP,x1=-1+2*(i+1)/NP;const a=proj(g,x0,LIP),b=proj(g,x1,LIP),d=proj(g,x1,0),e=proj(g,x0,0);const tone=sh('#c58f5c',(R()-.5)*.22);const gr=c.createLinearGradient(0,a.y,0,e.y);gr.addColorStop(0,sh(tone,-.28));gr.addColorStop(.6,tone);gr.addColorStop(1,sh(tone,.18));c.fillStyle=gr;quad(c,a,b,d,e);c.fill();c.strokeStyle='rgba(42,26,44,.55)';c.lineWidth=1.6;c.stroke();
  c.save();quad(c,a,b,d,e);c.clip();c.strokeStyle='rgba(90,50,34,.28)';c.lineWidth=1;for(let k=0;k<3;k++){const u=x0+(x1-x0)*(.2+R()*.6),s=R()*.3,t=s+.2+R()*.4;const p1=proj(g,u,LIP*s),p2=proj(g,u,LIP*t);c.beginPath();c.moveTo(p1.x,p1.y);c.lineTo(p2.x,p2.y);c.stroke();}c.restore();}
 // painted centre chevrons
 for(let d=.08;d<LIP-.06;d+=.16){const a=proj(g,0,d+.06),b=proj(g,-.14,d),e=proj(g,.14,d),sw=a.s*g.hw*.04;c.strokeStyle='rgba(248,233,202,.5)';c.lineWidth=Math.max(2,sw*2);c.lineCap='round';c.lineJoin='round';c.beginPath();c.moveTo(b.x,b.y);c.lineTo(a.x,a.y);c.lineTo(e.x,e.y);c.stroke();}
 // lane near-end shading
 const nl=proj(g,-1,0),nr=proj(g,1,0);c.fillStyle='rgba(18,8,28,.25)';c.fillRect(nl.x-6,nl.y-2,nr.x-nl.x+12,10);
 // gutters + wooden rails
 for(const sgn of[-1,1]){const a=proj(g,sgn,0),b=proj(g,sgn,LIP),cc=proj(g,sgn*1.2,LIP),d=proj(g,sgn*1.2,0);const gg=c.createLinearGradient(a.x,0,d.x,0);gg.addColorStop(0,'#05020a');gg.addColorStop(1,'#2a1838');c.fillStyle=gg;quad(c,a,b,cc,d);c.fill();c.strokeStyle=INK;c.lineWidth=2;c.stroke();
  const r1=proj(g,sgn*1.2,0),r2=proj(g,sgn*1.2,LIP),r3=proj(g,sgn*1.32,LIP),r4=proj(g,sgn*1.32,0);const rg=c.createLinearGradient(r1.x,0,r4.x,0);rg.addColorStop(0,sh('#ef896d',sgn<0?.3:-.2));rg.addColorStop(1,sh('#ef896d',sgn<0?-.2:.3));c.fillStyle=rg;quad(c,r1,r2,r3,r4);c.fill();c.strokeStyle=INK;c.lineWidth=2;c.stroke();
  c.strokeStyle='rgba(255,246,222,.55)';c.lineWidth=2.4;c.lineCap='round';const h1=proj(g,sgn*(sgn<0?1.22:1.3),0),h2=proj(g,sgn*(sgn<0?1.22:1.3),LIP);c.beginPath();c.moveTo(h1.x,h1.y);c.lineTo(h2.x,h2.y);c.stroke();
  // rail posts
  for(let d=0;d<=LIP;d+=LIP/4){const q=proj(g,sgn*1.26,d),pw=Math.max(4,q.s*g.hw*.07);c.fillStyle='#e4b672';c.beginPath();c.arc(q.x,q.y-pw*.5,pw,0,TAU);c.fill();c.strokeStyle=INK;c.lineWidth=1.4;c.stroke();c.strokeStyle='rgba(255,246,222,.7)';c.beginPath();c.arc(q.x,q.y-pw*.5,pw*.6,3.5,4.4);c.stroke();}}
 // ramp lip (gold bevel)
 const ll=proj(g,-1.2,LIP),lr=proj(g,1.2,LIP);const lg=c.createLinearGradient(0,ll.y-12,0,ll.y+3);lg.addColorStop(0,'#fff0c0');lg.addColorStop(.4,'#f2ce77');lg.addColorStop(1,'#a8742e');c.fillStyle=lg;c.beginPath();c.moveTo(ll.x,ll.y+2);c.lineTo(lr.x,lr.y+2);c.lineTo(lr.x,lr.y-10);c.lineTo(ll.x,ll.y-10);c.closePath();c.fill();c.strokeStyle=INK;c.lineWidth=2;c.stroke();
 // sloped board: thick wood frame + painted face
 const bl=proj(g,-1.2,LIP),br=proj(g,1.2,LIP),tl=proj(g,-1.2,BACK),tr=proj(g,1.2,BACK);
 const fr=c.createLinearGradient(0,tl.y,0,bl.y);fr.addColorStop(0,'#7a4d32');fr.addColorStop(1,'#c58f5c');c.fillStyle=fr;c.beginPath();c.moveTo(bl.x-6,bl.y-6);c.lineTo(br.x+6,br.y-6);c.lineTo(tr.x+8,tr.y-8);c.lineTo(tl.x-8,tl.y-8);c.closePath();c.fill();c.strokeStyle=INK;c.lineWidth=2.5;c.stroke();
 const bg2=c.createLinearGradient(0,tl.y,0,bl.y);bg2.addColorStop(0,'#3d2748');bg2.addColorStop(.5,'#6a4468');bg2.addColorStop(1,'#a06b78');c.fillStyle=bg2;c.beginPath();c.moveTo(bl.x,bl.y-10);c.lineTo(br.x,br.y-10);c.lineTo(tr.x,tr.y);c.lineTo(tl.x,tl.y);c.closePath();c.fill();c.strokeStyle='#e4b672';c.lineWidth=3;c.stroke();
 c.save();c.clip();for(let i=0;i<5;i++){const d=LIP+(BACK-LIP)*(i+.5)/5;const a=proj(g,-1.2,d),b=proj(g,1.2,d);c.strokeStyle=i%2?'rgba(255,224,170,.1)':'rgba(255,224,170,.2)';c.lineWidth=Math.max(2,a.s*10);c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.stroke();}
 for(let i=0;i<30;i++){const q=proj(g,-1.2+R()*2.4,LIP+R()*(BACK-LIP));c.fillStyle='rgba(255,240,200,.35)';c.beginPath();c.arc(q.x,q.y-4,1+R()*1.4,0,TAU);c.fill();}c.restore();
 // board side posts with lamp bulbs
 for(const sgn of[-1,1]){const q=proj(g,sgn*1.26,BACK-.02),pw=Math.max(6,q.s*g.hw*.1);c.fillStyle='#8a5b1a';c.fillRect(q.x-pw*.4,q.y-pw*1.8,pw*.8,pw*2.2);c.strokeStyle=INK;c.lineWidth=1.5;c.strokeRect(q.x-pw*.4,q.y-pw*1.8,pw*.8,pw*2.2);}
 N.grain(c,W,H,.6);
}
function bulbs(ctx,g,t){for(const sgn of[-1,1]){const q=proj(g,sgn*1.26,BACK-.02),pw=Math.max(6,q.s*g.hw*.1);const on=Math.sin(t*5+sgn)>-.2;const col=on?'#ffe9b8':'#9a7a50';ctx.fillStyle=col;ctx.beginPath();ctx.arc(q.x,q.y-pw*2.1,pw*.6,0,TAU);ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=1.4;ctx.stroke();if(on)glowAt(ctx,q.x,q.y-pw*2.1,pw*4,'#ffd17c',.6);}}
function sign(ctx,g,t){const w=Math.min(g.W*(g.W<g.H?.8:.42),420),h=g.W<g.H?42:38,x=g.cx-w/2,y=g.W<g.H?66:12;
 const s=spr('sign'+w+h,w+20,h+20,(c)=>{c.translate(10,10);c.fillStyle='rgba(18,8,28,.45)';N.rr(c,2,5,w,h,h/2);c.fill();claySlab(c,0,0,w,h,h/2,'#5a3a68',2.4);c.strokeStyle='#e4b672';c.lineWidth=2;N.rr(c,5,5,w-10,h-10,(h-10)/2);c.stroke();});
 ctx.drawImage(s,x-10,y-10);N.text(ctx,'COSMIC SKEE-BALL',g.cx,y+h*.66,{font:'700 '+Math.round(h*.46)+'px Fredoka',align:'center',color:'#ffd2dc',stroke:'#1a1226',sw:3});
 glowAt(ctx,g.cx,y+h/2,w*.6,'#ff6f91',.14+.04*Math.sin(t*3));
 const n=Math.floor(w/26);for(let i=0;i<=n;i++){const bx=x+h*.5+(w-h)*i/n,on=(i+Math.floor(t*4))%2;ctx.fillStyle=on?'#fff0b8':'#a8844a';ctx.beginPath();ctx.arc(bx,y+3,2.3,0,TAU);ctx.fill();}}
/* clay HUD plate (reserved top band) */
function hudBand(ctx,a,p,g){const y=8,por=g.W<g.H;N.chip(ctx,12,y,por?100:118,'BALLS',p.balls+(p.ball?1:0));N.chip(ctx,por?120:140,y,por?118:128,'SCORE',a.score,{color:'#ffe08a'});if(p.streak>1)N.chip(ctx,g.W-(por?112:132)-12,y,por?112:132,'HOT STREAK','x'+p.streak,{color:'#ef896d'});}
function readyCard(ctx,g,title,sub){const w=Math.min(g.W*.8,480),h=60,x=g.cx-w/2,y=g.H-h-(g.W<g.H?26:14);ctx.fillStyle='rgba(18,8,28,.4)';N.rr(ctx,x+3,y+6,w,h,22);ctx.fill();claySlab(ctx,x,y,w,h,22,'#5a3d62',2.4);N.text(ctx,title,g.cx,y+27,{font:'700 22px Fredoka',align:'center',color:'#ffe08a',stroke:'#1a1226'});N.text(ctx,sub,g.cx,y+48,{font:'600 12px Fredoka',align:'center',color:'#fff0d4'});}
function hole(ctx,g,h,t){const c=proj(g,h.x,h.d),rx=h.r*g.hw*c.s*1.05,s=holeSpr(COL[h.pts],rx,h.pts),ry=Math.max(4,Math.round(rx))*.58;glowAt(ctx,c.x,c.y,rx*2.6,COL[h.pts],.3+.12*Math.sin(t*3+h.d*9));ctx.drawImage(s,c.x-s.width/2,c.y-(s.height-ry*1.5-3));}
function drawBall(ctx,g,x,d,z,sq){const c=proj(g,x,d,z),r=Math.max(5,BALL*g.hw*c.s*1.9),s=ballSpr(r,'#8bb7dc');
 const gh=proj(g,x,d,0);N.shadow(ctx,gh.x+r*.25,gh.y+r*.7,r*(1.05+z*.8),r*.38,Math.max(.15,.4-z*.5));
 ctx.save();ctx.translate(c.x,c.y+r*(1-sq.y));ctx.scale(sq.x,sq.y);ctx.drawImage(s,-s.width/2,-s.height/2);ctx.restore();}
function draw(ctx,a){
 const g=geom(a),p=a.p,t=(p.t||0),art=p.art||(p.art={ph:'',pt:0,dust:[]});
 N.cached(ctx,'skee',g.W,g.H,(c)=>bakeSet(c,g));
 sign(ctx,g,t);bulbs(ctx,g,t);
 // lane light spill (cheap sprite)
 const hs=HOLES.map(h=>holeAt(p,h,p.t)).sort((u,v)=>u.d-v.d);
 for(const h of hs)hole(ctx,g,h,t);
 for(const f of p.fx){const c=proj(g,f.x,f.d);ctx.globalAlpha=1-f.t;ctx.strokeStyle=f.col;ctx.lineWidth=5;ctx.beginPath();ctx.ellipse(c.x,c.y,10+f.t*70,6+f.t*40,0,0,TAU);ctx.stroke();ctx.strokeStyle='rgba(255,246,222,.7)';ctx.lineWidth=1.6;ctx.stroke();ctx.globalAlpha=1;}
 const b=p.ball;
 if(!b){art.ph='';
  const len=p.guide*(.2+.55*Math.max(p.pull,p.charge,.3));let prev=proj(g,p.aimX,0);
  ctx.save();ctx.lineCap='round';ctx.strokeStyle='rgba(255,240,200,.8)';ctx.lineWidth=4;ctx.setLineDash([2,12]);ctx.beginPath();ctx.moveTo(prev.x,prev.y);
  for(let i=1;i<=14;i++){const d=len*i/14,x=p.aimX+Math.tan(p.angle)*d;const c=proj(g,N.clamp(x,-1,1),d);ctx.lineTo(c.x,c.y);}ctx.stroke();ctx.restore();
  if(p.balls>0||p.pulling)drawBall(ctx,g,p.aimX,0+p.pull*-.05,0,{x:1+p.pull*.08,y:1-p.pull*.1});
 }else{
  if(art.ph!==b.ph){art.ph=b.ph;art.pt=0;}art.pt+=1/60;
  let sq={x:1,y:1};if(b.ph==='board'&&art.pt<.18){const k=Math.sin(art.pt/.18*Math.PI)*(1-art.pt/.18);sq={x:1+.35*k,y:1-.3*k};}
  if(b.ph==='air')sq={x:.92,y:1.1};
  if(b.ph==='sunk'){const c=proj(g,b.x,b.d);ctx.save();ctx.globalAlpha=Math.max(0,1-b.t*2);ctx.translate(0,b.t*14);drawBall(ctx,g,b.x,b.d,0,{x:1-b.t,y:1-b.t*.8});ctx.restore();}
  else drawBall(ctx,g,b.x,b.d,Math.max(0,b.z),sq);}
 // power meter (clay thermometer)
 const mx=g.W<g.H?24:g.W-72,my=g.H*.4,mh=g.H*.38,t2=Math.max(p.pull,p.charge);
 ctx.fillStyle='rgba(18,8,28,.4)';N.rr(ctx,mx+2,my+4,28,mh,14);ctx.fill();ctx.fillStyle='#241838';N.rr(ctx,mx,my,28,mh,14);ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=2;ctx.stroke();
 if(t2>0){const gr=ctx.createLinearGradient(0,my+mh,0,my);gr.addColorStop(0,'#91c9a7');gr.addColorStop(.6,'#f2ce77');gr.addColorStop(1,'#ef896d');ctx.fillStyle=gr;N.rr(ctx,mx+4,my+mh-4-(mh-8)*t2,20,Math.max(10,(mh-8)*t2),10);ctx.fill();ctx.fillStyle='rgba(255,246,222,.4)';N.rr(ctx,mx+7,my+mh-4-(mh-8)*t2+3,4,Math.max(4,(mh-8)*t2-6),2);ctx.fill();}
 ctx.strokeStyle='#fff0d4';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(mx-4,my+mh-mh*.58);ctx.lineTo(mx+32,my+mh-mh*.58);ctx.stroke();N.text(ctx,'POWER',mx+14,my-8,{font:'700 10px Fredoka',align:'center',color:'#ffe9b8'});
 hudBand(ctx,a,p,g);
 if(p.msgT>0){ctx.globalAlpha=Math.min(1,p.msgT*2);const fs=Math.round(g.W*(g.W<g.H?.07:.04));const my2=g.hz+(g.H-g.hz)*.52;N.text(ctx,p.msg,g.cx,my2,{font:'700 '+fs+'px Fredoka',align:'center',color:p.lastPts>=50&&p.msg.includes('POINT')?'#ffe08a':'#fff0d4',stroke:'#1a1226',sw:5,glow:'#ff6f91'});ctx.globalAlpha=1;}
 if(!a.running)readyCard(ctx,g,'COSMIC SKEE-BALL','Drag back to charge · release to roll · aim for the glowing rings');
 N.vignette(ctx,g.W,g.H,.3);
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

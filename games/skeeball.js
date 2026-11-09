/* Cosmic Skee-Ball: lane + ramp launch + sloped board with real hole physics. */
(function(){
const N=window.NXG;
const HOLES=[
 {x:-.6,d:.80,r:.12,pts:10},{x:.6,d:.80,r:.12,pts:10},{x:0,d:.83,r:.10,pts:20},
 {x:-.66,d:.885,r:.085,pts:30},{x:.66,d:.885,r:.085,pts:30},{x:0,d:.915,r:.075,pts:40},
 {x:-.86,d:.965,r:.06,pts:50},{x:.86,d:.965,r:.06,pts:50},{x:0,d:.975,r:.05,pts:100,bonus:true}
];
const COL={10:'#8fa9c4',20:'#8fb89c',30:'#e0b870',40:'#d98a70',50:'#a98cc0',100:'#d6738c'};
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
/* ---------- claymation kit (matte plasticine, wobbly ink, thumb dents, coil trim, 12fps stop-motion) ---------- */
const INK=N.INK,TAU=N.TAU;
function toHex(c){if(c[0]==='#')return c.length===4?'#'+c[1]+c[1]+c[2]+c[2]+c[3]+c[3]:c;const m=c.match(/[\d.]+/g);return'#'+m.slice(0,3).map(v=>Math.round(+v).toString(16).padStart(2,'0')).join('');}
const sh=(col,t)=>N.shade(toHex(N.mix(toHex(col),'#8f7c78',.2)),t);
const SPR={};
function spr(key,w,h,fn){let c=SPR[key];if(!c){c=document.createElement('canvas');c.width=Math.ceil(w);c.height=Math.ceil(h);fn(c.getContext('2d'),c.width,c.height);SPR[key]=c;}return c;}
function wobLoop(c,cx,cy,rx,ry,seed,amp){const R=N.mulberry(seed|0),k=26,ph=R()*6.28;c.beginPath();for(let i=0;i<=k;i++){const a=i/k*TAU,j=1+Math.sin(a*3+ph)*amp+(R()-.5)*amp*.8,px=cx+Math.cos(a)*rx*j,py=cy+Math.sin(a)*ry*j;i?c.lineTo(px,py):c.moveTo(px,py);}c.closePath();}
function inkWob(c,cx,cy,rx,ry,seed,w){c.save();c.lineJoin='round';c.strokeStyle=INK;c.lineWidth=w;wobLoop(c,cx,cy,rx,ry,seed,.035);c.stroke();c.lineWidth=w*.5;c.globalAlpha=.55;wobLoop(c,cx,cy,rx,ry,seed+7,.045);c.stroke();c.restore();}
function matte(c,col,x,y,r){const g=c.createRadialGradient(x-r*.3,y-r*.35,r*.1,x,y,r*1.15);g.addColorStop(0,sh(col,.18));g.addColorStop(.6,col);g.addColorStop(1,sh(col,-.32));return g;}
function soft(c,x,y,r,a=.3){const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,'rgba(255,244,222,'+a+')');g.addColorStop(1,'rgba(255,244,222,0)');c.fillStyle=g;c.beginPath();c.arc(x,y,r,0,TAU);c.fill();}
function claySurface(c,w,h,seed,dn){const R=N.mulberry(seed|0);c.save();c.globalCompositeOperation='source-atop';
 const n=Math.min(2200,w*h/36);for(let i=0;i<n;i++){c.fillStyle=R()>.5?'rgba(255,240,214,'+(.05+R()*.1)+')':'rgba(40,20,40,'+(.05+R()*.1)+')';c.fillRect(R()*w,R()*h,1+R()*1.4,1+R()*1.2);}
 for(let i=0;i<dn;i++){const x=R()*w,y=R()*h,r=Math.min(Math.min(w,h)*.07,9)*(.6+R()*.7)+2;c.fillStyle='rgba(40,18,40,.17)';c.beginPath();c.ellipse(x+r*.12,y+r*.14,r,r*.8,.5,0,TAU);c.fill();c.fillStyle='rgba(255,240,214,.15)';c.beginPath();c.ellipse(x-r*.12,y-r*.14,r*.9,r*.7,.5,0,TAU);c.fill();c.strokeStyle='rgba(40,18,40,.2)';c.lineWidth=.9;for(let k=1;k<4;k++){c.beginPath();c.ellipse(x,y,r*k*.24,r*k*.19,.5,.4,4.2);c.stroke();}}
 c.restore();}
function seam(c,x1,y1,x2,y2,w){c.save();c.lineCap='round';const n=Math.max(2,Math.ceil(Math.hypot(x2-x1,y2-y1)/10));for(const [o,col,lw] of[[1,'rgba(36,16,36,.5)',w],[-1,'rgba(255,240,214,.24)',w*.7]]){c.strokeStyle=col;c.lineWidth=lw;c.beginPath();for(let i=0;i<=n;i++){const t=i/n,px=x1+(x2-x1)*t+Math.sin(i*2.1+x1)*.8,py=y1+(y2-y1)*t+Math.cos(i*1.7+y1)*.8+o*.8;i?c.lineTo(px,py):c.moveTo(px,py);}c.stroke();}c.restore();}
function coilLine(c,pts,w,col){const P=()=>{c.beginPath();pts.forEach((q,i)=>i?c.lineTo(q[0],q[1]):c.moveTo(q[0],q[1]));};c.save();c.lineCap='round';c.lineJoin='round';
 P();c.strokeStyle=INK;c.lineWidth=w+3;c.stroke();P();c.strokeStyle=col;c.lineWidth=w;c.stroke();P();c.strokeStyle=sh(col,-.3);c.lineWidth=w;c.setLineDash([1.6,w*.55]);c.stroke();c.setLineDash([]);P();c.strokeStyle='rgba(255,240,214,.16)';c.lineWidth=w*.4;c.stroke();c.restore();}
function wobRR(c,x,y,w,h,r,seed){const R=N.mulberry(seed|0),j=()=>(R()-.5)*1.6;c.beginPath();c.roundRect(x+j(),y+j(),w+j(),h+j(),r);}
function claySlab(c,x,y,w,h,r,col,lw=2.2,seed=3){c.fillStyle=col;N.rr(c,x,y,w,h,r);c.fill();const g=c.createLinearGradient(0,y,0,y+h);g.addColorStop(0,'rgba(255,240,214,.2)');g.addColorStop(.55,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(30,10,30,.28)');c.fillStyle=g;N.rr(c,x,y,w,h,r);c.fill();
 soft(c,x+w*.3,y+h*.3,Math.min(w,h)*.7,.18);c.strokeStyle=INK;c.lineJoin='round';c.lineWidth=lw;wobRR(c,x,y,w,h,r,seed);c.stroke();c.globalAlpha=.5;c.lineWidth=lw*.5;wobRR(c,x,y,w,h,r,seed+5);c.stroke();c.globalAlpha=1;}
/* baked clay plaque with coil trim; returns a sprite with 10px margin */
function plaque(w,h,r,col,seed){return spr('pq'+w+'_'+h+col+seed,w+20,h+20,(c,W,H)=>{c.save();c.translate(10,10);c.fillStyle='rgba(30,12,36,.4)';N.rr(c,2,5,w,h,r);c.fill();claySlab(c,0,0,w,h,r,col,2.4,seed);N.coil(c,3,3,w-6,h-6,Math.max(4,r-3));c.restore();claySurface(c,W,H,seed,3);});}
const T12=t=>Math.floor(t*12)/12;
function jit(t,k,a=.7){const q=Math.floor(t*12);return[Math.sin(q*12.9+k*7.1)*a,Math.cos(q*9.7+k*3.3)*a];}
function glowSpr(col,r){r=Math.round(r/4)*4||4;return spr('g'+col+r,r*2,r*2,(c,w)=>{const g=c.createRadialGradient(r,r,0,r,r,r);g.addColorStop(0,col);g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.fillRect(0,0,w,w);});}
function glowAt(ctx,x,y,r,col,a){const s=glowSpr(col,r);ctx.globalAlpha=a*.6;ctx.globalCompositeOperation='lighter';ctx.drawImage(s,x-s.width/2,y-s.height/2);ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;}
function quad(ctx,a,b,c,d){ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.lineTo(c.x,c.y);ctx.lineTo(d.x,d.y);ctx.closePath();}
function ballSpr(r,col){r=Math.round(r);return spr('b'+col+r,r*2+8,r*2+8,(c,w)=>{const x=w/2,y=w/2;c.fillStyle=matte(c,col,x,y,r);wobLoop(c,x,y,r,r,r*5,.03);c.fill();soft(c,x-r*.3,y-r*.35,r*.8,.3);inkWob(c,x,y,r,r,r*3,Math.max(1.6,r*.1));claySurface(c,w,w,r*11,2);
  c.save();c.globalCompositeOperation='source-atop';c.strokeStyle='rgba(40,18,40,.2)';c.lineWidth=.9;for(let k=1;k<4;k++){c.beginPath();c.arc(x+r*.25,y+r*.2,r*k*.16,.3,4.3);c.stroke();}c.restore();});}
function planet(c,x,y,r,col,ring,seed){const R=N.mulberry(seed);const rg=(front)=>{c.save();c.translate(x,y);c.rotate(-.35);c.beginPath();c.ellipse(0,0,r*1.7,r*.5,0,front?0:Math.PI,front?Math.PI:TAU);c.strokeStyle=INK;c.lineWidth=r*.3;c.stroke();c.strokeStyle=sh(ring,front?.05:-.1);c.lineWidth=r*.2;c.stroke();c.strokeStyle='rgba(40,18,40,.3)';c.lineWidth=r*.2;c.setLineDash([1.5,5]);c.stroke();c.restore();};
 if(ring)rg(false);c.fillStyle=matte(c,col,x,y,r);wobLoop(c,x,y,r,r,seed,.03);c.fill();soft(c,x-r*.3,y-r*.35,r*.9,.28);
 for(let i=0;i<4;i++){const a=R()*TAU,d=R()*r*.6,cr=r*(.1+R()*.14);c.fillStyle='rgba(30,12,40,.2)';c.beginPath();c.arc(x+Math.cos(a)*d,y+Math.sin(a)*d,cr,0,TAU);c.fill();c.strokeStyle='rgba(255,240,214,.18)';c.lineWidth=1.2;c.beginPath();c.arc(x+Math.cos(a)*d-1,y+Math.sin(a)*d-1,cr,.6,2.4);c.stroke();}
 inkWob(c,x,y,r,r,seed+3,Math.max(1.8,r*.07));if(ring)rg(true);}
/* ring = stack of three rolled clay coils (bowl) with number plaque */
function holeSpr(col,rx,pts){rx=Math.max(4,Math.round(rx));const ry=rx*.58,W=rx*3.4+10,H=ry*3.2+rx*1.1+12;return spr('h'+col+rx+pts,W,H,(c,w,h)=>{const cx=w/2,cy=h-ry*1.7-4;
  c.fillStyle='rgba(30,12,36,.42)';c.beginPath();c.ellipse(cx+rx*.15,cy+ry*.8,rx*1.4,ry*1.4,0,0,TAU);c.fill();
  // dark well
  c.fillStyle=INK;c.beginPath();c.ellipse(cx,cy,rx*1.0,ry*1.0,0,0,TAU);c.fill();const wg=c.createLinearGradient(0,cy-ry,0,cy+ry);wg.addColorStop(0,'#150b1c');wg.addColorStop(1,'#3a2440');c.fillStyle=wg;c.beginPath();c.ellipse(cx,cy+ry*.1,rx*.86,ry*.86,0,0,TAU);c.fill();
  // stacked coils, bottom to top
  for(let i=0;i<3;i++){const k=i/2,yy=cy+ry*.55-i*ry*.45,rr=rx*(1.32-k*.18),tone=sh(col,-.2+k*.25);
   c.lineCap='round';c.beginPath();c.ellipse(cx,yy,rr,rr*.58,0,0,TAU);c.strokeStyle=INK;c.lineWidth=rx*.34+3;c.stroke();
   c.beginPath();c.ellipse(cx,yy,rr,rr*.58,0,0,TAU);c.strokeStyle=tone;c.lineWidth=rx*.34;c.stroke();
   c.beginPath();c.ellipse(cx,yy,rr,rr*.58,0,0,TAU);c.strokeStyle=sh(col,-.4);c.lineWidth=rx*.34;c.setLineDash([1.5,rx*.2]);c.stroke();c.setLineDash([]);
   c.beginPath();c.ellipse(cx,yy-rx*.05,rr,rr*.58,0,3.6,4.8);c.strokeStyle='rgba(255,240,214,.2)';c.lineWidth=rx*.14;c.stroke();
   // pressed seam where the coil ends meet
   seam(c,cx+rr*.9,yy-rr*.14,cx+rr*.95,yy+rr*.1,1.4);}
  claySurface(c,w,h,rx*13+pts,3);
  // number plaque
  const fs=Math.max(12,rx*.7),pw=Math.round(fs*(String(pts).length*.62+1.1)),ph=Math.round(fs*1.3),pq=plaque(pw,ph,ph/2,'#6a4c60',pts);const py0=cy-ry*1.9-ph-6;c.drawImage(pq,cx-pq.width/2,py0-10);N.text(c,pts,cx,py0+ph/2+fs*.36,{font:'700 '+fs+'px Fredoka',align:'center',color:'#f8ecc8',stroke:'#2a1a2c',sw:2});});}
function bakeSet(c,g){
 const W=g.W,H=g.H,R=N.mulberry(11);
 N.bgGrad(c,W,H,['#2a2038','#3d2c48','#4f3448']);
 for(let i=0;i<60;i++){const x=R()*W,y=R()*g.hz;c.fillStyle=i%3?'rgba(244,226,188,.65)':'rgba(190,220,200,.6)';c.beginPath();c.arc(x,y,.9+R()*1.5,0,TAU);c.fill();}
 const pr=Math.min(g.hz*.3,g.W*.07),pY=g.W<g.H?.66:.6;
 planet(c,g.W*(g.W<g.H?.17:.09),g.hz*pY,pr,'#d98a70','#e0b870',5);planet(c,g.W*(g.W<g.H?.84:.91),g.hz*pY,pr*.8,'#8fa9c4',null,9);planet(c,g.W*(g.W<g.H?.9:.8),g.hz*.2,pr*.38,'#a98cc0',null,2);
 // bunting of pressed clay flags
 {const cols=['#d98a70','#e0b870','#8fb89c','#8fa9c4','#a98cc0'];const sw=x=>g.hz-26+Math.sin(x/W*Math.PI*4)*7;c.strokeStyle=INK;c.lineWidth=2.4;c.beginPath();for(let x=0;x<=W;x+=20)x?c.lineTo(x,sw(x)):c.moveTo(x,sw(x));c.stroke();
  for(let i=0;i<=W/34;i++){const x=i*34+10,y=sw(x);c.beginPath();c.moveTo(x-11,y);c.lineTo(x+11,y+R()*1.5);c.lineTo(x+(R()-.5)*2,y+22);c.closePath();c.fillStyle=cols[i%5];c.fill();c.fillStyle='rgba(255,240,214,.16)';c.fill();c.strokeStyle=INK;c.lineWidth=1.8;c.lineJoin='round';c.stroke();}}
 c.fillStyle='#2a1c34';c.fillRect(0,g.hz-4,W,H);
 const fl=c.createLinearGradient(0,g.hz,0,H);fl.addColorStop(0,'#46304a');fl.addColorStop(1,'#241830');c.fillStyle=fl;c.fillRect(0,g.hz+4,W,H);
 c.save();c.globalAlpha=.15;for(let y=g.hz+10;y<H;y+=22)for(let x=((y/22)%2)*20;x<W;x+=40){c.fillStyle='#d8b078';c.beginPath();c.moveTo(x,y-9);c.lineTo(x+9,y+R()*1.5);c.lineTo(x,y+9);c.lineTo(x-9,y);c.closePath();c.fill();}c.restore();
 c.fillStyle='#160e1e';c.fillRect(0,g.hz-4,W,8);coilLine(c,[[0,g.hz+4],[W,g.hz+4]],5,'#c89a5a');
 // lamp pillars: rolled clay columns
 for(const sgn of[-1,1]){const px=sgn<0?g.W*.045:g.W*.955,pw=g.W*.05;claySlab(c,px-pw/2,g.hz+8,pw,H,pw/2,'#6a4c60',2.6,sgn+4);for(let k=0;k<5;k++)seam(c,px-pw/2+3,g.hz+44+k*66,px+pw/2-3,g.hz+44+k*66+R()*3,1.6);}
 // side cabinet walls
 for(const sgn of[-1,1]){const a=proj(g,sgn*1.18,0),b2=proj(g,sgn*1.18,BACK),x0=sgn<0?0:W;c.fillStyle='#261a36';c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b2.x,b2.y);c.lineTo(b2.x+(x0-b2.x)*.6,b2.y-40);c.lineTo(x0,b2.y-40);c.lineTo(x0,H);c.lineTo(a.x+(x0-a.x)*.4,H);c.closePath();c.fill();}
 // clay-slab lane: pressed planks
 const NP=14;for(let i=0;i<NP;i++){const x0=-1+2*i/NP,x1=-1+2*(i+1)/NP;const a=proj(g,x0,LIP),b=proj(g,x1,LIP),d=proj(g,x1,0),e=proj(g,x0,0);const tone=sh('#b98458',(R()-.5)*.18);const gr=c.createLinearGradient(0,a.y,0,e.y);gr.addColorStop(0,sh(tone,-.22));gr.addColorStop(.6,tone);gr.addColorStop(1,sh(tone,.12));c.fillStyle=gr;quad(c,a,b,d,e);c.fill();
  c.save();quad(c,a,b,d,e);c.clip();for(let k=0;k<2;k++){const u=x0+(x1-x0)*(.25+R()*.5),s=R()*.3,t=s+.25+R()*.4;const p1=proj(g,u,LIP*s),p2=proj(g,u,LIP*t);c.strokeStyle='rgba(70,36,36,.16)';c.lineWidth=1.2;c.beginPath();c.moveTo(p1.x,p1.y);c.lineTo(p2.x,p2.y);c.stroke();}
  const dq=proj(g,x0+(x1-x0)*.5,LIP*(.15+R()*.7));c.fillStyle='rgba(40,18,40,.13)';c.beginPath();c.ellipse(dq.x,dq.y,dq.s*g.hw*.045,dq.s*g.hw*.028,0,0,TAU);c.fill();c.restore();
  const p1=proj(g,x0,LIP),p2=proj(g,x0,0);seam(c,p1.x,p1.y,p2.x,p2.y,2);}
 for(let d=.08;d<LIP-.06;d+=.16){const a=proj(g,0,d+.06),b=proj(g,-.14,d),e=proj(g,.14,d),sw=a.s*g.hw*.04;c.strokeStyle='rgba(240,222,190,.4)';c.lineWidth=Math.max(2,sw*2);c.lineCap='round';c.lineJoin='round';c.beginPath();c.moveTo(b.x,b.y);c.lineTo(a.x,a.y);c.lineTo(e.x,e.y);c.stroke();}
 // gutters + coil rails
 for(const sgn of[-1,1]){const a=proj(g,sgn,0),b=proj(g,sgn,LIP),cc=proj(g,sgn*1.2,LIP),d=proj(g,sgn*1.2,0);const gg=c.createLinearGradient(a.x,0,d.x,0);gg.addColorStop(0,'#0c0714');gg.addColorStop(1,'#2a1c38');c.fillStyle=gg;quad(c,a,b,cc,d);c.fill();c.strokeStyle=INK;c.lineWidth=2;c.stroke();
  const r1=proj(g,sgn*1.26,0),r2=proj(g,sgn*1.26,LIP),w1=Math.max(8,r1.s*g.hw*.14);
  coilLine(c,[[r1.x,r1.y],[r2.x,r2.y]],w1,'#d98a70');
  for(let d2=0;d2<=LIP;d2+=LIP/4){const q=proj(g,sgn*1.26,d2),pw=Math.max(4,q.s*g.hw*.07);blobAt(c,q.x,q.y-pw*.5,pw,'#d8b078',d2*50+sgn);}}
 // ramp lip: rolled gold coil
 const ll=proj(g,-1.2,LIP),lr=proj(g,1.2,LIP);coilLine(c,[[ll.x,ll.y-4],[lr.x,lr.y-4]],11,'#d8b078');
 const bl=proj(g,-1.2,LIP),br=proj(g,1.2,LIP),tl=proj(g,-1.2,BACK),tr=proj(g,1.2,BACK);
 const fr=c.createLinearGradient(0,tl.y,0,bl.y);fr.addColorStop(0,'#7a5238');fr.addColorStop(1,'#b98458');c.fillStyle=fr;c.beginPath();c.moveTo(bl.x-6,bl.y-6);c.lineTo(br.x+6,br.y-6);c.lineTo(tr.x+8,tr.y-8);c.lineTo(tl.x-8,tl.y-8);c.closePath();c.fill();c.strokeStyle=INK;c.lineWidth=2.6;c.lineJoin='round';c.stroke();
 const bg2=c.createLinearGradient(0,tl.y,0,bl.y);bg2.addColorStop(0,'#46324c');bg2.addColorStop(.5,'#6e4c68');bg2.addColorStop(1,'#a07078');c.fillStyle=bg2;c.beginPath();c.moveTo(bl.x,bl.y-10);c.lineTo(br.x,br.y-10);c.lineTo(tr.x,tr.y);c.lineTo(tl.x,tl.y);c.closePath();c.fill();
 coilLine(c,[[tl.x,tl.y],[tr.x,tr.y],[br.x,br.y-10],[bl.x,bl.y-10],[tl.x,tl.y]],5,'#c89a5a');
 c.save();c.beginPath();c.moveTo(bl.x,bl.y-10);c.lineTo(br.x,br.y-10);c.lineTo(tr.x,tr.y);c.lineTo(tl.x,tl.y);c.clip();for(let i=1;i<5;i++){const d=LIP+(BACK-LIP)*i/5,a=proj(g,-1.2,d),b=proj(g,1.2,d);seam(c,a.x,a.y,b.x,b.y,2);}
 for(let i=0;i<5;i++){const q=proj(g,-1+R()*2,LIP+R()*(BACK-LIP)),r=q.s*g.hw*.05;c.fillStyle='rgba(30,12,36,.2)';c.beginPath();c.ellipse(q.x,q.y,r,r*.6,0,0,TAU);c.fill();}c.restore();
 for(const sgn of[-1,1]){const q=proj(g,sgn*1.26,BACK-.02),pw=Math.max(6,q.s*g.hw*.1);claySlab(c,q.x-pw*.4,q.y-pw*1.8,pw*.8,pw*2.2,3,'#8a6038',1.8,sgn+9);}
 claySurface(c,W,H,77,24);N.grain(c,W,H,.45);
}
function blobAt(c,x,y,r,col,seed){c.save();c.translate(x,y);c.fillStyle=matte(c,col,0,0,r);wobLoop(c,0,0,r,r,seed*31+3,.07);c.fill();soft(c,-r*.3,-r*.3,r,.3);inkWob(c,0,0,r,r,seed*17+1,Math.max(1.4,r*.14));c.restore();}
function bulbs(ctx,g,t){const q=T12(t);for(const sgn of[-1,1]){const px=sgn<0?g.W*.045:g.W*.955,ph=Math.round(g.W*.028);const on=Math.sin(q*5+sgn)>-.2;const s=spr('orb'+ph+on,ph*2+8,ph*2+8,(c,w)=>{c.fillStyle=matte(c,on?'#f0d9a0':'#a08a68',w/2,w/2,ph);wobLoop(c,w/2,w/2,ph,ph,ph+(on?3:0),.04);c.fill();soft(c,w/2-ph*.3,w/2-ph*.3,ph,.3);inkWob(c,w/2,w/2,ph,ph,ph*3,2);claySurface(c,w,w,ph,1);});ctx.drawImage(s,px-s.width/2,g.hz+8-s.height/2);if(on)glowAt(ctx,px,g.hz+8,ph*4,'#e8c880',.5);}
 for(const sgn of[-1,1]){const q2=proj(g,sgn*1.26,BACK-.02),pw=Math.max(6,q2.s*g.hw*.1),on=Math.sin(q*5+sgn)>-.2;blobAt(ctx,q2.x,q2.y-pw*2.1,pw*.6,on?'#f0d9a0':'#a08a68',3+sgn);if(on)glowAt(ctx,q2.x,q2.y-pw*2.1,pw*4,'#e8c880',.5);}}
function sign(ctx,g,t){const w=Math.round(Math.min(g.W*(g.W<g.H?.74:.3),400)),h=g.W<g.H?42:36,x=g.cx-w/2,y=g.W<g.H?60:12;const j=jit(t,1,.5);
 const s=plaque(w,h,h/2,'#6a4c60',4);ctx.drawImage(s,x-10+j[0],y-10+j[1]);N.text(ctx,'COSMIC SKEE-BALL',g.cx+j[0],y+h*.66+j[1],{font:'700 '+Math.round(h*.46)+'px Fredoka',align:'center',color:'#f0d4c4',stroke:'#2a1a2c',sw:3});
 const n=Math.floor(w/26),q=Math.floor(t*4);for(let i=0;i<=n;i++){const bx=x+h*.5+(w-h)*i/n,on=(i+q)%2;ctx.fillStyle=on?'#f0d9a0':'#9c8460';ctx.beginPath();ctx.arc(bx,y+2,2.3,0,TAU);ctx.fill();}}
function hudBand(ctx,a,p,g){const y=8,por=g.W<g.H;N.chip(ctx,12,y,por?100:118,'BALLS',p.balls+(p.ball?1:0));N.chip(ctx,por?120:140,y,por?118:128,'SCORE',a.score,{color:'#ffe08a'});if(p.streak>1)N.chip(ctx,g.W-(por?112:132)-12,y,por?112:132,'HOT STREAK','x'+p.streak,{color:'#ef896d'});}
function readyCard(ctx,g,title,sub,t){const por=g.W<g.H,w=Math.round(por?g.W*.8:222),h=por?58:132,x=por?g.cx-w/2:14,y=por?112:g.H*.34;const s=plaque(w,h,22,'#6a4c60',8),j=jit(t,2,.5);ctx.drawImage(s,x-10+j[0],y-10+j[1]);
 N.text(ctx,title,x+w/2,y+(por?25:30),{font:'700 '+(por?20:19)+'px Fredoka',align:'center',color:'#f2d9a0',stroke:'#2a1a2c'});sub.split('|').forEach((l,i)=>N.text(ctx,l,x+w/2,y+(por?45:56)+i*(por?0:19),{font:'600 12px Fredoka',align:'center',color:'#f8e9ca'}));}
function hole(ctx,g,h,t){const c=proj(g,h.x,h.d),rx=h.r*g.hw*c.s*1.05,s=holeSpr(COL[h.pts],rx,h.pts),ry=Math.max(4,Math.round(rx))*.58,j=jit(t,h.pts+h.x*9,.7);glowAt(ctx,c.x,c.y,rx*2.4,COL[h.pts],.22+.08*Math.sin(T12(t)*3+h.d*9));ctx.drawImage(s,c.x-s.width/2+j[0],c.y-(s.height-ry*1.7-4)+j[1]);}
function drawBall(ctx,g,x,d,z,sq,t){const c=proj(g,x,d,z),r=Math.max(5,BALL*g.hw*c.s*1.9),s=ballSpr(r,'#8fa9c4');
 const gh=proj(g,x,d,0);N.shadow(ctx,gh.x+r*.25,gh.y+r*.7,r*(1.05+z*.8),r*.38,Math.max(.15,.4-z*.5));
 ctx.save();ctx.translate(c.x,c.y+r*(1-sq.y));ctx.rotate(Math.sin(Math.floor(t*12)*1.7)*.05);ctx.scale(sq.x,sq.y);ctx.drawImage(s,-s.width/2,-s.height/2);ctx.restore();}
function draw(ctx,a){
 const g=geom(a),p=a.p,t=(p.t||0),art=p.art||(p.art={ph:'',pt:0});
 N.cached(ctx,'skee2',g.W,g.H,(c)=>bakeSet(c,g));
 sign(ctx,g,t);bulbs(ctx,g,t);
 const hs=HOLES.map(h=>holeAt(p,h,p.t)).sort((u,v)=>u.d-v.d);
 for(const h of hs)hole(ctx,g,h,t);
 for(const f of p.fx){const c=proj(g,f.x,f.d),k=T12(f.t);ctx.globalAlpha=1-k;ctx.strokeStyle=INK;ctx.lineWidth=7;ctx.beginPath();ctx.ellipse(c.x,c.y,10+k*70,6+k*40,0,0,TAU);ctx.stroke();ctx.strokeStyle=sh(f.col,.1);ctx.lineWidth=4.5;ctx.setLineDash([2,3]);ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=1;}
 const b=p.ball;
 if(!b){art.ph='';
  const len=p.guide*(.2+.55*Math.max(p.pull,p.charge,.3));let prev=proj(g,p.aimX,0);
  for(let i=1;i<=14;i+=1){const d=len*i/14,x=p.aimX+Math.tan(p.angle)*d;const c=proj(g,N.clamp(x,-1,1),d);if(i%2){ctx.fillStyle='rgba(244,226,188,.8)';ctx.beginPath();ctx.arc(c.x,c.y,Math.max(2,3.2*c.s),0,TAU);ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=1.2;ctx.stroke();}}
  if(p.balls>0||p.pulling)drawBall(ctx,g,p.aimX,0+p.pull*-.05,0,{x:1+p.pull*.08,y:1-p.pull*.1},t);
 }else{
  if(art.ph!==b.ph){art.ph=b.ph;art.pt=0;}art.pt+=1/60;const qa=Math.floor(art.pt*12)/12;
  let sq={x:1,y:1};if(b.ph==='board'&&qa<.2){const k=Math.sin(qa/.2*Math.PI)*(1-qa/.2);sq={x:1+.35*k,y:1-.3*k};}
  if(b.ph==='air')sq={x:.92,y:1.1};
  if(b.ph==='sunk'){ctx.save();ctx.globalAlpha=Math.max(0,1-b.t*2);ctx.translate(0,b.t*14);drawBall(ctx,g,b.x,b.d,0,{x:1-b.t,y:1-b.t*.8},t);ctx.restore();}
  else drawBall(ctx,g,b.x,b.d,Math.max(0,b.z),sq,t);}
 // power meter: clay tube
 const mx=g.W<g.H?24:g.W-72,my=g.H*.4,mh=g.H*.38,t2=Math.max(p.pull,p.charge);
 {const s=spr('pm'+Math.round(mh),44,mh+20,(c,w,h)=>{c.translate(8,8);c.fillStyle='rgba(30,12,36,.4)';N.rr(c,2,4,28,mh,14);c.fill();claySlab(c,0,0,28,mh,14,'#6a4c60',2.4,6);c.fillStyle='#1e1228';N.rr(c,5,5,18,mh-10,9);c.fill();c.restore&&0;claySurface(c,w,h,5,2);});ctx.drawImage(s,mx-8,my-8);}
 if(t2>0){const hh=Math.max(10,(mh-10)*t2);ctx.fillStyle=sh(t2>.75?'#d98a70':t2>.4?'#e0b870':'#8fb89c',0);N.rr(ctx,mx+5,my+mh-5-hh,18,hh,9);ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=1.6;ctx.stroke();ctx.fillStyle='rgba(255,240,214,.2)';N.rr(ctx,mx+8,my+mh-5-hh+3,5,Math.max(4,hh-6),2.5);ctx.fill();}
 ctx.strokeStyle='#f2d9a0';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(mx-4,my+mh-mh*.58);ctx.lineTo(mx+32,my+mh-mh*.58);ctx.stroke();N.text(ctx,'POWER',mx+14,my-8,{font:'700 10px Fredoka',align:'center',color:'#f2d9a0'});
 hudBand(ctx,a,p,g);
 if(p.msgT>0){ctx.globalAlpha=Math.min(1,p.msgT*2);const fs=Math.round(g.W*(g.W<g.H?.07:.04));const my2=g.hz+(g.H-g.hz)*.72;N.text(ctx,p.msg,g.cx,my2,{font:'700 '+fs+'px Fredoka',align:'center',color:p.lastPts>=50&&p.msg.includes('POINT')?'#f2d9a0':'#f8e9ca',stroke:'#2a1a2c',sw:6});ctx.globalAlpha=1;}
 if(!a.running)readyCard(ctx,g,'COSMIC SKEE-BALL',g.W<g.H?'Drag back to charge · release to roll':'Drag back to charge|Release to roll|Aim for the glowing rings',t);
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

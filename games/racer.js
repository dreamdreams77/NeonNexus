/* Turbo Tunnels: top-down drift racer — car physics, AI rivals with racing lines, boost pads, oil, nitro, 3 tracks, 3 laps. */
(function(){
const N=window.NXG,RW=140;
const TRACKS=[
 {name:'NEON LOOP',laps:3,pts:[[0,0],[700,-60],[1250,160],[1350,620],[900,900],[300,820],[-150,540],[-250,180]],pal:['#3b7a57','#4a4a58'],tun:[[.62,.78]],boost:[.1,.45],oil:[.3],ai:.9},
 {name:'TUNNEL RUN',laps:3,pts:[[0,0],[600,-80],[1000,120],[1300,-100],[1700,200],[1650,700],[1100,950],[850,600],[400,980],[-200,800],[-350,350]],pal:['#2f5f6d','#3d3d52'],tun:[[.2,.38],[.7,.9]],boost:[.05,.55,.8],oil:[.3,.62],ai:.95},
 {name:'CRYSTAL CANYON',laps:3,pts:[[0,0],[800,-200],[1500,0],[1900,500],[1500,1000],[800,1150],[500,700],[900,420],[400,250],[-300,520],[-400,100]],pal:['#6d4f8c','#443a5e'],tun:[[.45,.6]],boost:[.1,.35,.6,.85],oil:[.25,.5,.75],ai:1}];
const RIV=[{n:'MOSS',c:'#8ec7a4',s:.94},{n:'GLOW',c:'#8bb7dc',s:.99},{n:'BLITZ',c:'#f2ce77',s:1.03}];
function cr(p0,p1,p2,p3,t){const t2=t*t,t3=t2*t;return[.5*((2*p1[0])+(-p0[0]+p2[0])*t+(2*p0[0]-5*p1[0]+4*p2[0]-p3[0])*t2+(-p0[0]+3*p1[0]-3*p2[0]+p3[0])*t3),.5*((2*p1[1])+(-p0[1]+p2[1])*t+(2*p0[1]-5*p1[1]+4*p2[1]-p3[1])*t2+(-p0[1]+3*p1[1]-3*p2[1]+p3[1])*t3)];}
function build(def){const c=def.pts.map(q=>[q[0]*1.8,q[1]*1.8]),n=c.length,P=[];for(let i=0;i<n;i++)for(let k=0;k<30;k++){P.push(cr(c[(i+n-1)%n],c[i],c[(i+1)%n],c[(i+2)%n],k/30));}
 // resample evenly (spacing ~30px)
 const R=[];let acc=0,prev=P[0];R.push(P[0]);for(let i=1;i<=P.length;i++){const q=P[i%P.length];let d=Math.hypot(q[0]-prev[0],q[1]-prev[1]);while(acc+d>=30){const t=(30-acc)/d;prev=[prev[0]+(q[0]-prev[0])*t,prev[1]+(q[1]-prev[1])*t];R.push(prev);d=Math.hypot(q[0]-prev[0],q[1]-prev[1]);acc=0;}acc+=d;prev=q;}
 if(Math.hypot(R[R.length-1][0]-R[0][0],R[R.length-1][1]-R[0][1])<15)R.pop();
 const T={def,pts:R.map(p=>({x:p[0],y:p[1]})),n:R.length};
 for(let i=0;i<T.n;i++){const a=T.pts[i],b=T.pts[(i+1)%T.n],c2=T.pts[(i+T.n-1)%T.n];a.h=Math.atan2(b.y-c2.y,b.x-c2.x);const h1=Math.atan2(b.y-a.y,b.x-a.x),h0=Math.atan2(a.y-c2.y,a.x-c2.x);let d=h1-h0;while(d>Math.PI)d-=2*Math.PI;while(d<-Math.PI)d+=2*Math.PI;a.k=Math.abs(d);}
 // smooth curvature ahead
 T.kAhead=T.pts.map((p,i)=>{let m=0;for(let j=0;j<8;j++)m=Math.max(m,T.pts[(i+j)%T.n].k);return m;});
 T.props=[];for(let i=0;i<T.n;i+=2){const p=T.pts[i];for(const s of[-1,1]){if(Math.sin(i*12.9+s)>.2){const off=RW*(1.3+Math.abs(Math.sin(i*3.1+s))*1.4)*s;T.props.push({x:p.x+Math.cos(p.h+Math.PI/2)*off,y:p.y+Math.sin(p.h+Math.PI/2)*off,r:14+Math.abs(Math.sin(i))*14,t:Math.floor(Math.abs(Math.sin(i*5))*3)});}}}
 T.pads=def.boost.map(f=>Math.floor(f*T.n));T.oils=def.oil.map(f=>Math.floor(f*T.n));T.tun=def.tun.map(([a,b])=>[Math.floor(a*T.n),Math.floor(b*T.n)]);
 return T;}
function nearest(T,x,y,hint){let best=1e18,bi=hint;for(let o=-8;o<=14;o++){const i=(hint+o+T.n)%T.n,p=T.pts[i],d=(p.x-x)**2+(p.y-y)**2;if(d<best){best=d;bi=i;}}return{i:bi,d:Math.sqrt(best)};}
function mkCar(T,slot,col,name,skill,human){const p0=T.pts[0],h=p0.h;const row=Math.floor(slot/2),side=slot%2?1:-1;return{x:p0.x-Math.cos(h)*(80+row*70)+Math.cos(h+Math.PI/2)*side*34,y:p0.y-Math.sin(h)*(80+row*70)+Math.sin(h+Math.PI/2)*side*34,th:h,vx:0,vy:0,idx:0,lap:0,prog:-slot*3,col,name,skill,human,sector:0,gate:0,boost:0,fin:false,finT:0,nitro:human?.3:0,drift:0,spin:0,oil:0,lane:(Math.random()-.5)*.5,wob:Math.random()*6,r:17};}
function init(a){const p=a.p;p.T=build(TRACKS[0]);p.cars=[];p.t=0;p.go=0;p.over=false;p.msg='';p.msgT=0;p.cam={x:0,y:0,z:1,th:0};p.me=mkCar(p.T,3,'#ef896d','YOU',1,true);p.cars=[p.me];RIV.forEach((r,i)=>p.cars.push(mkCar(p.T,i,r.c,r.n,r.s,false)));p.cam.x=p.me.x;p.cam.y=p.me.y;p.cam.th=p.me.th;p.bestLap=999;p.lapT=0;p.drifts=0;p.overtakes=0;p.finishOrder=[];}
function start(a){const p=a.p,tr=Math.min(2,a.store.get('raceTrack',0));init(a);p.T=build(TRACKS[tr]);p.trk=tr;p.cars=[];p.me=mkCar(p.T,3,'#ef896d','YOU',1,true);p.cars=[p.me];const dm=a.diff.id==='easy'?.93:a.diff.id==='hard'?1.07:1;RIV.forEach((r,i)=>p.cars.push(mkCar(p.T,i,r.c,r.n,r.s*dm*TRACKS[tr].ai,false)));p.cam.x=p.me.x;p.cam.y=p.me.y;p.cam.th=p.me.th;p.go=3.2;p.laps=TRACKS[tr].laps;a.time=170;p.msg=TRACKS[tr].name;p.msgT=2;p.lapT=0;p.bestLap=999;p.pos=4;p.grip=a.mastery>=2?1.08:1;p.nitroMax=a.mastery>=4?1.25:1;a.hud('↑ GAS · ←→ STEER · SPACE DRIFT · SHIFT NITRO · '+p.laps+' LAPS');}
function step(a,dt){const p=a.p,T=p.T,k=a.keys;p.t+=dt;
 if(p.go>0){p.go-=dt;if(p.go<=0){p.msg='GO!';p.msgT=.8;N.sfx(a,'win');}else if(Math.ceil(p.go)!==p.gn){p.gn=Math.ceil(p.go);N.sfx(a,'tick');}}
 for(const c of p.cars){
  let thr=0,brk=0,st=0,hb=0,nit=0;
  if(c.human){thr=(k.ArrowUp||k.w||k.W?1:0);brk=(k.ArrowDown||k.s||k.S?1:0);st=(k.ArrowRight||k.d||k.D?1:0)-(k.ArrowLeft||k.a||k.A?1:0)+(Math.abs(a.stick.x)>.2?a.stick.x:0);st=N.clamp(st,-1,1);hb=k[' ']?1:0;nit=(k.Shift||k.n||k.N)?1:0;}
  else{const j=Math.floor(8+Math.hypot(c.vx,c.vy)*.07),tp=T.pts[(c.idx+j)%T.n],lat=c.lane*RW*.28,tx=tp.x+Math.cos(tp.h+Math.PI/2)*lat,ty=tp.y+Math.sin(tp.h+Math.PI/2)*lat;let want=Math.atan2(ty-c.y,tx-c.x)-c.th;while(want>Math.PI)want-=2*Math.PI;while(want<-Math.PI)want+=2*Math.PI;st=N.clamp(want*2.2,-1,1);
   const ka=T.kAhead[c.idx],vmax=(520-ka*680)*c.skill;const sp=Math.hypot(c.vx,c.vy);thr=sp<vmax?1:0;brk=sp>vmax*1.18?1:0;
   // rubber band
   const me=p.me;const gap=c.prog-me.prog;if(gap<-4)c.skillB=1.04;else if(gap>6)c.skillB=.94;else c.skillB=1;
   if(Math.random()<.002)c.lane=(Math.random()-.5)*.8;}
  if(p.go>0){thr=0;nit=0;}
  if(c.fin){thr=0;brk=1;st=0;}
  const fx=Math.cos(c.th),fy=Math.sin(c.th),sp=Math.hypot(c.vx,c.vy),fwd=c.vx*fx+c.vy*fy,lat=-c.vx*fy+c.vy*fx;
  const near=nearest(T,c.x,c.y,c.idx);c.idx=near.i;const off=near.d;const onRoad=off<RW/2+14,onGrass=off>RW/2+30;
  // surface
  let grip=(onGrass?2.2:7.5)*(c.human?p.grip:1),drag=onGrass?1.6:.18;if(c.oil>0){grip*=.28;c.oil-=dt;}
  const drifting=hb&&Math.abs(fwd)>140;if(drifting){grip*=.38;}
  // engine
  const top=(c.human?560:520*(c.skillB||1)*c.skill)*(onGrass?.55:1);let acc=thr*(c.human?520:480*(c.skillB||1)*c.skill);if(c.boost>0){acc+=900;c.boost-=dt;}
  if(c.human&&nit&&c.nitro>0&&thr){acc+=1100;c.nitro-=dt*.55;a.combo=a.combo;}
  const spdLim=top*(c.boost>0?1.5:1)*((c.human&&nit&&c.nitro>0)?1.38:1);
  const a_f=(fwd<spdLim?acc*(1-Math.max(0,fwd)/(spdLim+1)*.55):0)-(brk?(fwd>0?900:260):0)-fwd*drag*.4;
  let nfwd=fwd+a_f*dt;nfwd=Math.max(-160,nfwd);
  // lateral
  let nlat=lat*Math.exp(-grip*dt);
  // steering: rate depends on speed, reduced at very high speed, boosted when drifting
  const sr=(c.human?2.5:2.6)*st*N.clamp(Math.abs(nfwd)/120,0,1)*(1/(1+Math.abs(nfwd)/900))*(drifting?1.5:1)*(nfwd<0?-1:1);c.th+=sr*dt+(c.spin||0)*dt;c.spin=(c.spin||0)*(1-3*dt);
  const nfx=Math.cos(c.th),nfy=Math.sin(c.th);c.vx=nfx*nfwd-nfy*nlat;c.vy=nfy*nfwd+nfx*nlat;
  // drift mini-turbo
  if(c.human){if(drifting&&Math.abs(nlat)>70){c.drift+=dt;c.nitro=Math.min(p.nitroMax,c.nitro+dt*.18);if(c.drift>.8&&Math.floor(c.drift*10)%5===0)a.addScore(.1,0,0);}else{if(c.drift>1.1){c.boost=.7;p.drifts++;a.addScore(8,0,0);p.msg='DRIFT BOOST +8';p.msgT=.8;N.sfx(a,'power');if(p.drifts>=5)a.achieve('drifter','Land 5 drift boosts',8);}c.drift=0;}}
  c.x+=c.vx*dt;c.y+=c.vy*dt;
  // barriers
  if(off>RW*1.55){const q=T.pts[c.idx],dx=c.x-q.x,dy=c.y-q.y,d=Math.hypot(dx,dy);const nx=dx/d,ny=dy/d;c.x=q.x+nx*RW*1.55;c.y=q.y+ny*RW*1.55;const vn=c.vx*nx+c.vy*ny;if(vn>0){c.vx-=1.5*vn*nx;c.vy-=1.5*vn*ny;if(c.human&&vn>120){N.sfx(a,'bump');a.shake(4,.15);}}}
  // pads/oil
  for(const pi of T.pads){if(Math.abs(((c.idx-pi+T.n*1.5)%T.n)-T.n*.5)<1.5&&off<RW*.45&&c.boost<=0&&(c.padT||0)<p.t-.5){c.boost=1;c.padT=p.t;if(c.human){N.sfx(a,'power');a.addScore(2,0,0);}}}
  for(const oi of T.oils){if(Math.abs(((c.idx-oi+T.n*1.5)%T.n)-T.n*.5)<1.2&&Math.abs(off)<RW*.45&&c.oil<=0&&(c.oilT||0)<p.t-1){c.oil=1.1;c.oilT=p.t;c.spin=(Math.random()<.5?-1:1)*3;if(c.human){N.sfx(a,'miss');p.msg='OIL SLICK!';p.msgT=.8;}}}
  // laps
  const n=T.n,ip=c.idx;const gates=[Math.floor(n*.25),Math.floor(n*.5),Math.floor(n*.75)];
  if(c.gate<3&&Math.abs(ip-gates[c.gate])<=4)c.gate++;
  if(c.gate>=3&&(ip<4||ip>n-4)&&ip<20&&c.lastIdx>n-20){c.lap++;c.gate=0;
   if(c.human){const lt=p.lapT;p.lapT=0;if(lt>3&&lt<p.bestLap){p.bestLap=lt;}p.msg=c.lap<p.laps?'LAP '+(c.lap+1)+' / '+p.laps:'FINISH!';p.msgT=1.3;N.sfx(a,'coin');a.addScore(20,0,0);}
   if(c.lap>=p.laps&&!c.fin){c.fin=true;c.finT=p.t;p.finishOrder.push(c);if(c.human){finish(a);return;}}}
  c.lastIdx=ip;c.prog=c.lap*n+(c.gate>=3&&ip<n*.1?ip+n:ip)/n*n/n*1;c.prog=c.lap+(ip/n)+(c.gate===0&&ip>n*.9?-1:0);
  c.wob+=dt;
 }
 // car-car collisions
 for(let i=0;i<p.cars.length;i++)for(let j=i+1;j<p.cars.length;j++){const A=p.cars[i],B=p.cars[j];const dx=B.x-A.x,dy=B.y-A.y,d=Math.hypot(dx,dy);if(d<A.r*2&&d>0){const nx=dx/d,ny=dy/d,ov=A.r*2-d;A.x-=nx*ov/2;A.y-=ny*ov/2;B.x+=nx*ov/2;B.y+=ny*ov/2;const rv=(B.vx-A.vx)*nx+(B.vy-A.vy)*ny;if(rv<0){A.vx+=nx*rv*.55;A.vy+=ny*rv*.55;B.vx-=nx*rv*.55;B.vy-=ny*rv*.55;if(A.human||B.human){N.sfx(a,'hit');a.shake(3,.1);}}}}
 const order=[...p.cars].sort((x,y)=>(y.fin-x.fin)||(x.fin&&y.fin?x.finT-y.finT:y.prog-x.prog));const np=order.indexOf(p.me)+1;if(np<p.pos&&p.go<=0){p.overtakes++;a.addScore(4,0,0);p.msg='OVERTAKE · P'+np;p.msgT=.7;a.combo++;}p.pos=np;
 p.lapT+=dt;
}
function finish(a){const p=a.p;if(p.over)return;p.over=true;const pos=p.finishOrder.indexOf(p.me)+1,pts=[0,200,130,80,40][pos]||40;a.addScore(pts+(p.bestLap<60?30:0),0,0);if(pos===1)a.achieve('winner','Win a race',10);if(pos<=3){a.store.set('raceTrack',Math.max(a.store.get('raceTrack',0),Math.min(3,p.trk+1)));}if(pos<=3&&p.trk>=2)a.achieve('cup','Podium on the final track',15);a.finish(pos<=3,{grade:['','1ST PLACE','2ND PLACE','3RD PLACE','4TH PLACE'][pos]||'FINISHED'});}
function update(dt,a){const p=a.p;if(p.over)return;N.stepper(h=>step(a,h),120)(dt);if(p.msgT>0)p.msgT-=dt;const m=p.me,sp=Math.hypot(m.vx,m.vy);const tz=N.clamp(1.1-sp/1300,.62,1.05);p.cam.z+=(tz-p.cam.z)*Math.min(1,dt*2);const la=.12;const tx=m.x+m.vx*la,ty=m.y+m.vy*la;p.cam.x+=(tx-p.cam.x)*Math.min(1,dt*8);p.cam.y+=(ty-p.cam.y)*Math.min(1,dt*8);let dth=m.th-p.cam.th;while(dth>Math.PI)dth-=2*Math.PI;while(dth<-Math.PI)dth+=2*Math.PI;p.cam.th+=dth*Math.min(1,dt*4);}
function timeUp(a){const p=a.p;if(!p.over){p.over=true;a.finish(false,{grade:'TIME OUT'});}}
/* ---------- art: patterned ground, bevelled clay track, baked clay cars/props, skids + smoke (draw-only) ---------- */
const INK=N.INK,TAU=N.TAU,sh=N.shade;
const SPR={};
function spr(key,w,h,fn){let c=SPR[key];if(!c){c=document.createElement('canvas');c.width=Math.ceil(w);c.height=Math.ceil(h);fn(c.getContext('2d'),c.width,c.height);SPR[key]=c;}return c;}
function claySlab(c,x,y,w,h,r,col,lw=2){const g=c.createLinearGradient(0,y,0,y+h);g.addColorStop(0,sh(col,.32));g.addColorStop(.5,col);g.addColorStop(1,sh(col,-.4));c.fillStyle=g;N.rr(c,x,y,w,h,r);c.fill();c.strokeStyle=INK;c.lineWidth=lw;c.stroke();c.strokeStyle='rgba(255,246,222,.5)';c.lineWidth=Math.max(1,Math.min(3,h*.07));c.lineCap='round';c.beginPath();c.moveTo(x+r,y+Math.min(h*.14,5));c.lineTo(x+w-r,y+Math.min(h*.14,5));c.stroke();}
function glowSpr(col,r){r=Math.round(r/4)*4||4;return spr('g'+col+r,r*2,r*2,(c,w)=>{const g=c.createRadialGradient(r,r,0,r,r,r);g.addColorStop(0,col);g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.fillRect(0,0,w,w);});}
function glowAt(ctx,x,y,r,col,a){const s=glowSpr(col,r);ctx.globalAlpha=a;ctx.globalCompositeOperation='lighter';ctx.drawImage(s,x-s.width/2,y-s.height/2);ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;}
const PC=[['#4c8f5e','#e58fb5','#b9b2a4'],['#3f8590','#7fb27d','#cfe3e6'],['#8a5fb8','#d48bd6','#7ac3e0']];
function groundPat(ctx,base,key){return spr('gp'+key,128,128,(c)=>{const R=N.mulberry(key.length*31+7);c.fillStyle=base;c.fillRect(0,0,128,128);
  for(let i=0;i<46;i++){const x=R()*128,y=R()*128,l=3+R()*5;c.strokeStyle=R()>.5?sh(base,.14):sh(base,-.2);c.lineWidth=1.6;c.lineCap='round';c.beginPath();c.moveTo(x,y);c.lineTo(x-l*.4,y-l);c.moveTo(x,y);c.lineTo(x+l*.5,y-l*.9);c.stroke();}
  for(let i=0;i<3;i++){const x=R()*128,y=R()*128;c.fillStyle=['#f8e9ca','#f2ce77','#ef896d'][i%3];c.beginPath();c.arc(x,y,2.1,0,TAU);c.fill();c.strokeStyle=INK;c.lineWidth=.9;c.stroke();}
  for(let i=0;i<3;i++){c.fillStyle='rgba(0,0,0,.07)';c.beginPath();c.ellipse(R()*128,R()*128,16+R()*14,9+R()*8,R()*3,0,TAU);c.fill();}
  // wrap-friendly: copy left edge shapes not needed (soft)
 });}
function propSpr(kind,col,r){r=Math.round(r/2)*2;return spr('pr'+kind+col+r,r*3.4+14,r*3.4+14,(c,w)=>{const x=w/2,y=w/2-2;
  if(kind===0){c.fillStyle='rgba(8,18,14,.35)';c.beginPath();c.ellipse(x+r*.4,y+r*.6,r*1.15,r*.8,0,0,TAU);c.fill();N.blob(c,x,y,r,sh(col,-.12),r+3,{shadow:false});N.blob(c,x-r*.25,y-r*.3,r*.66,col,r+9,{shadow:false});N.blob(c,x+r*.35,y+r*.1,r*.45,sh(col,.18),r+5,{shadow:false});}
  else if(kind===1){N.blob(c,x,y,r*.9,col,r+11,{});for(let i=0;i<5;i++){const a=i/5*TAU+.4,fx=x+Math.cos(a)*r*.55,fy=y+Math.sin(a)*r*.5;c.fillStyle=['#f8e9ca','#f2ce77','#ef896d'][i%3];c.beginPath();c.arc(fx,fy,r*.17,0,TAU);c.fill();c.strokeStyle=INK;c.lineWidth=1;c.stroke();}}
  else{c.fillStyle='rgba(8,10,14,.35)';c.beginPath();c.ellipse(x+r*.35,y+r*.55,r*1.05,r*.7,0,0,TAU);c.fill();c.beginPath();const R=N.mulberry(r*13);for(let i=0;i<7;i++){const a=i/7*TAU,rr=r*(.75+R()*.35);i?c.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr):c.moveTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr);}c.closePath();const g=c.createLinearGradient(x-r,y-r,x+r,y+r);g.addColorStop(0,sh(col,.45));g.addColorStop(.5,col);g.addColorStop(1,sh(col,-.5));c.fillStyle=g;c.fill();c.strokeStyle=INK;c.lineWidth=2;c.lineJoin='round';c.stroke();c.strokeStyle='rgba(255,246,222,.55)';c.lineWidth=1.8;c.beginPath();c.moveTo(x-r*.5,y-r*.2);c.lineTo(x-r*.1,y-r*.55);c.stroke();c.strokeStyle='rgba(30,12,40,.4)';c.lineWidth=1.3;c.beginPath();c.moveTo(x+r*.1,y);c.lineTo(x+r*.45,y+r*.35);c.stroke();}
 });}
function carSpr(col){return spr('car'+col,112,64,(c)=>{c.save();c.translate(56,32);c.scale(2,2);const L=-24,Rr=24;
  // wheels poking out
  for(const [x,y] of[[-14,-12.5],[-14,12.5],[13,-12.5],[13,12.5]]){c.fillStyle='#1a1226';N.rr(c,x-6.5,y-4.2,13,8.4,3.2);c.fill();c.strokeStyle=INK;c.lineWidth=1;c.stroke();c.fillStyle='rgba(255,246,222,.28)';N.rr(c,x-4.5,y-3.4,6,1.8,1);c.fill();}
  // body path: tapered nose, rounded tail
  const body=()=>{c.beginPath();c.moveTo(-21,-8);c.quadraticCurveTo(-24,-8,-24,-4);c.lineTo(-24,4);c.quadraticCurveTo(-24,8,-21,8);c.lineTo(8,10.5);c.quadraticCurveTo(21,9,24,3);c.lineTo(24,-3);c.quadraticCurveTo(21,-9,8,-10.5);c.closePath();};
  body();let g=c.createLinearGradient(0,-11,0,11);g.addColorStop(0,sh(col,.4));g.addColorStop(.5,col);g.addColorStop(1,sh(col,-.45));c.fillStyle=g;c.fill();c.strokeStyle=INK;c.lineWidth=1.3;c.lineJoin='round';c.stroke();
  // hood highlight stripe
  c.fillStyle='rgba(248,233,202,.9)';c.fillRect(-23,-1.9,46,3.8);c.save();body();c.clip();c.fillStyle='rgba(248,233,202,.9)';c.fillRect(-24,-1.9,48,3.8);c.restore();
  c.strokeStyle='rgba(255,252,238,.7)';c.lineWidth=1.3;c.lineCap='round';c.beginPath();c.moveTo(-6,-9.2);c.lineTo(12,-9.4);c.stroke();
  // cabin / glass
  g=c.createLinearGradient(0,-8,0,8);g.addColorStop(0,'#5a6fa0');g.addColorStop(1,'#1c1840');c.fillStyle=g;c.beginPath();c.moveTo(-8,-7);c.lineTo(3,-7.4);c.quadraticCurveTo(9,-5,9,0);c.quadraticCurveTo(9,5,3,7.4);c.lineTo(-8,7);c.quadraticCurveTo(-11,3,-11,0);c.quadraticCurveTo(-11,-3,-8,-7);c.fill();c.stroke();
  c.fillStyle='rgba(255,255,255,.45)';c.beginPath();c.moveTo(-6,-5.5);c.lineTo(1,-5.8);c.lineTo(-2,-2.5);c.lineTo(-6,-2.8);c.fill();
  // spoiler + lights
  c.fillStyle=sh(col,-.35);N.rr(c,-27,-9.5,4.4,19,1.8);c.fill();c.strokeStyle=INK;c.lineWidth=1;c.stroke();c.fillStyle='rgba(255,246,222,.45)';c.fillRect(-26.6,-8.5,1.4,17);
  c.fillStyle='#fff4d2';c.beginPath();c.arc(22.2,-6.2,2,0,TAU);c.arc(22.2,6.2,2,0,TAU);c.fill();c.fillStyle='#ef5a4a';c.fillRect(-23.6,-7.4,1.8,3);c.fillRect(-23.6,4.4,1.8,3);
  c.restore();});}
function bakeBand(W){return spr('band'+W,W,86,(c)=>{const g=c.createLinearGradient(0,0,0,86);g.addColorStop(0,'rgba(18,10,28,.78)');g.addColorStop(1,'rgba(18,10,28,0)');c.fillStyle=g;c.fillRect(0,0,W,86);});}
function tuning(T){if(T.dec)return;T.dec=1;const P=new Path2D();T.pts.forEach((q,i)=>i?P.lineTo(q.x,q.y):P.moveTo(q.x,q.y));P.closePath();T.path=P;}
function carDraw(ctx,c,p,art){const s=carSpr(c.col);
 // ground shadow (fixed light direction in world space)
 ctx.save();ctx.translate(c.x+5,c.y+7);ctx.rotate(c.th);ctx.fillStyle='rgba(8,10,18,.34)';ctx.beginPath();ctx.ellipse(0,0,25,13.5,0,0,TAU);ctx.fill();ctx.restore();
 ctx.save();ctx.translate(c.x,c.y);ctx.rotate(c.th);
 if(c.boost>0){ctx.fillStyle='#ff9a3d';ctx.beginPath();ctx.moveTo(-26,-5);ctx.lineTo(-46-Math.random()*14,0);ctx.lineTo(-26,5);ctx.fill();ctx.fillStyle='#fff0a0';ctx.beginPath();ctx.moveTo(-26,-2.4);ctx.lineTo(-36-Math.random()*8,0);ctx.lineTo(-26,2.4);ctx.fill();}
 ctx.drawImage(s,-32,-18.5,64,37);ctx.restore();}
function draw(ctx,a){const p=a.p,W=a.W,H=a.H,T=p.T,def=T.def,m=p.me,cam=p.cam,trk=p.trk||0,pc=PC[trk]||PC[0];
 const art=p.art||(p.art={skid:[],smoke:[],lt:p.t||0,lx:0,ly:0});tuning(T);
 const adt=Math.min(.05,Math.max(0,(p.t||0)-art.lt));art.lt=p.t||0;
 // art state: skid + smoke from the human car
 {const sp=Math.hypot(m.vx,m.vy),sk=(m.drift>0||m.oil>0||Math.abs(m.spin||0)>.6)&&sp>100;
  if(sk&&Math.hypot(m.x-art.lx,m.y-art.ly)>7){const fx=Math.cos(m.th),fy=Math.sin(m.th),sx=-fy,sy=fx;for(const sd of[-1,1])art.skid.push({x:m.x-fx*12+sx*sd*10,y:m.y-fy*12+sy*sd*10,px:art.lx-fx*12+sx*sd*10,py:art.ly-fy*12+sy*sd*10});if(art.skid.length>220)art.skid.splice(0,art.skid.length-220);
   if(art.smoke.length<26)art.smoke.push({x:m.x-fx*16,y:m.y-fy*16,vx:-m.vx*.05+(Math.random()-.5)*20,vy:-m.vy*.05+(Math.random()-.5)*20,t:0});art.lx=m.x;art.ly=m.y;}
  else if(!sk){art.lx=m.x;art.ly=m.y;}
  for(const s of art.smoke){s.t+=adt;s.x+=s.vx*adt;s.y+=s.vy*adt;}art.smoke=art.smoke.filter(s=>s.t<.7);}
 ctx.fillStyle=ctx.createPattern(groundPat(ctx,def.pal[0],trk+def.name),'repeat');
 ctx.save();ctx.translate(W/2,H*.68);ctx.rotate(-Math.PI/2-cam.th);ctx.scale(cam.z,cam.z);ctx.translate(-cam.x,-cam.y);
 {const R=Math.hypot(W,H)/cam.z*.75;ctx.fillRect(cam.x-R,cam.y-R,R*2,R*2);}
 ctx.lineJoin='round';ctx.lineCap='butt';const path=T.path;
 ctx.strokeStyle='rgba(8,6,16,.3)';ctx.lineWidth=RW+78;ctx.stroke(path);
 ctx.strokeStyle=INK;ctx.lineWidth=RW+40;ctx.stroke(path);
 ctx.strokeStyle='#efe6d4';ctx.lineWidth=RW+32;ctx.setLineDash([36,36]);ctx.stroke(path);ctx.strokeStyle='#ef896d';ctx.lineDashOffset=36;ctx.stroke(path);ctx.setLineDash([]);ctx.lineDashOffset=0;
 ctx.strokeStyle=INK;ctx.lineWidth=RW+8;ctx.stroke(path);
 ctx.strokeStyle=sh(def.pal[1],-.15);ctx.lineWidth=RW+2;ctx.stroke(path);
 ctx.strokeStyle=def.pal[1];ctx.lineWidth=RW-12;ctx.stroke(path);
 ctx.strokeStyle='rgba(255,246,222,.06)';ctx.lineWidth=RW-44;ctx.stroke(path);
 ctx.strokeStyle='rgba(248,233,202,.5)';ctx.lineWidth=5;ctx.setLineDash([30,40]);ctx.stroke(path);ctx.setLineDash([]);
 // skid marks
 if(art.skid.length){ctx.strokeStyle='rgba(20,12,28,.38)';ctx.lineWidth=4;ctx.lineCap='round';ctx.beginPath();for(const s of art.skid){ctx.moveTo(s.px,s.py);ctx.lineTo(s.x,s.y);}ctx.stroke();ctx.lineCap='butt';}
 // tunnel
 for(const [s,e] of T.tun){ctx.strokeStyle='rgba(20,10,40,.5)';ctx.lineWidth=RW+10;ctx.beginPath();for(let i=s;i<=e;i++){const q=T.pts[i%T.n];i===s?ctx.moveTo(q.x,q.y):ctx.lineTo(q.x,q.y);}ctx.stroke();
  for(let i=s;i<=e;i+=3){const q=T.pts[i%T.n];if(Math.abs(q.x-cam.x)>W/cam.z||Math.abs(q.y-cam.y)>W/cam.z)continue;const nx=Math.cos(q.h+Math.PI/2),ny=Math.sin(q.h+Math.PI/2);glowAt(ctx,q.x+nx*RW*.46,q.y+ny*RW*.46,26,'#9de3d1',.7);glowAt(ctx,q.x-nx*RW*.46,q.y-ny*RW*.46,26,'#ff6f91',.7);}}
 // start line
 {const q=T.pts[0],nx=Math.cos(q.h+Math.PI/2),ny=Math.sin(q.h+Math.PI/2);for(let i=-5;i<5;i++){for(let k=0;k<2;k++){ctx.fillStyle=((i+k)&1)?'#f8f1de':'#1a1226';ctx.save();ctx.translate(q.x+nx*i*14+nx*7+Math.cos(q.h)*(k*7-3.5),q.y+ny*i*14+ny*7+Math.sin(q.h)*(k*7-3.5));ctx.rotate(q.h);ctx.fillRect(-3.5,-7,7,14);ctx.restore();}}}
 for(const i of T.pads){const q=T.pts[i];ctx.save();ctx.translate(q.x,q.y);ctx.rotate(q.h);const gg=ctx.createLinearGradient(-40,0,40,0);gg.addColorStop(0,'rgba(255,212,94,0)');gg.addColorStop(.5,'rgba(255,212,94,.5)');gg.addColorStop(1,'rgba(255,212,94,0)');ctx.fillStyle=gg;ctx.fillRect(-40,-RW*.4,80,RW*.8);ctx.lineJoin='round';ctx.strokeStyle=INK;ctx.lineWidth=2.5;ctx.fillStyle='#ffd45e';for(let s=0;s<3;s++){ctx.beginPath();ctx.moveTo(-26+s*22,-22);ctx.lineTo(-10+s*22,0);ctx.lineTo(-26+s*22,22);ctx.lineTo(-18+s*22,22);ctx.lineTo(-2+s*22,0);ctx.lineTo(-18+s*22,-22);ctx.closePath();ctx.fill();ctx.stroke();}ctx.restore();glowAt(ctx,q.x,q.y,60,'#ffd45e',.35);}
 for(const i of T.oils){const q=T.pts[i];ctx.save();ctx.translate(q.x,q.y);ctx.rotate(q.h);ctx.fillStyle='#1a1030';ctx.beginPath();ctx.ellipse(0,0,52,34,0,0,TAU);ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=3;ctx.stroke();const og=ctx.createRadialGradient(-14,-10,2,0,0,48);og.addColorStop(0,'#8b6fd6');og.addColorStop(.5,'#3a2a6a');og.addColorStop(1,'#140a24');ctx.fillStyle=og;ctx.beginPath();ctx.ellipse(0,0,46,29,0,0,TAU);ctx.fill();ctx.strokeStyle='rgba(255,246,222,.55)';ctx.lineWidth=3;ctx.lineCap='round';ctx.beginPath();ctx.ellipse(0,0,36,22,0,3.6,4.6);ctx.stroke();ctx.restore();}
 // props (baked clay sprites)
 for(const pr of T.props){if(Math.abs(pr.x-cam.x)>W/cam.z*.95||Math.abs(pr.y-cam.y)>W/cam.z*.95)continue;const s=propSpr(pr.t,pc[pr.t],pr.r);ctx.drawImage(s,pr.x-s.width/2,pr.y-s.height/2+2);}
 for(const s of art.smoke){const k=s.t/.7;ctx.globalAlpha=(1-k)*.55;ctx.fillStyle='#f4ecdc';ctx.beginPath();ctx.arc(s.x,s.y,6+k*18,0,TAU);ctx.fill();}ctx.globalAlpha=1;
 for(const c of p.cars)if(c!==m)carDraw(ctx,c,p,art);carDraw(ctx,m,p,art);
 // headlight spill
 {const fx=Math.cos(m.th),fy=Math.sin(m.th);glowAt(ctx,m.x+fx*60,m.y+fy*60,70,'#fff2c0',.2);}
 ctx.restore();
 // HUD band
 ctx.drawImage(bakeBand(W),0,0);
 N.chip(ctx,12,10,82,'POS',(p.pos||4)+'/4',{color:'#ffe08a'});N.chip(ctx,104,10,100,'LAP',Math.min(p.laps||3,m.lap+1)+'/'+(p.laps||3));N.chip(ctx,214,10,110,'SPEED',Math.round(Math.hypot(m.vx,m.vy)*.22)+' km/h');
 N.bar(ctx,12,54,150,9,m.nitro/(p.nitroMax||1),'#8bb7dc');N.text(ctx,'NITRO',168,62,{font:'700 10px Fredoka',color:'#bfe4da'});
 // minimap on clay plate
 {const mw=110,mh=84,mx=W-mw-12,my=10;claySlab(ctx,mx,my,mw,mh,12,'#3c2a4a',2);let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;T.pts.forEach(q=>{x0=Math.min(x0,q.x);x1=Math.max(x1,q.x);y0=Math.min(y0,q.y);y1=Math.max(y1,q.y);});const sc=Math.min((mw-16)/(x1-x0),(mh-16)/(y1-y0)),ox=mx+8-x0*sc+((mw-16)-(x1-x0)*sc)/2,oy=my+8-y0*sc+((mh-16)-(y1-y0)*sc)/2;ctx.lineJoin='round';ctx.beginPath();T.pts.forEach((q,i)=>i?ctx.lineTo(ox+q.x*sc,oy+q.y*sc):ctx.moveTo(ox+q.x*sc,oy+q.y*sc));ctx.closePath();ctx.strokeStyle=INK;ctx.lineWidth=6;ctx.stroke();ctx.strokeStyle='#d9d4e6';ctx.lineWidth=3;ctx.stroke();p.cars.forEach(c=>{ctx.fillStyle=c.col;ctx.beginPath();ctx.arc(ox+c.x*sc,oy+c.y*sc,c.human?4.5:3.4,0,TAU);ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=1.3;ctx.stroke();});}
 // start lights
 if(p.go>0){const n=Math.ceil(p.go),lx=W/2,ly=H*.2,gw=150;claySlab(ctx,lx-gw/2,ly-26,gw,52,18,'#3c2a4a',2.4);for(let i=0;i<3;i++){const on=i<(4-n)+0&&n<=3?(3-n)>=i:false,col=n===1?'#7ee0a4':'#ef5a4a',cx=lx-44+i*44,lit=(3-n)>=i;ctx.fillStyle=lit?(n<=1?'#7ee0a4':'#ef5a4a'):'#2a1a2c';ctx.beginPath();ctx.arc(cx,ly,15,0,TAU);ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=2.4;ctx.stroke();if(lit){ctx.strokeStyle='rgba(255,246,222,.7)';ctx.lineWidth=2.4;ctx.beginPath();ctx.arc(cx,ly,10,3.5,4.4);ctx.stroke();glowAt(ctx,cx,ly,40,n<=1?'#7ee0a4':'#ef5a4a',.7);}}
  N.text(ctx,String(n),W/2,ly+Math.round(H*.12),{font:'700 '+Math.round(H*.12)+'px Fredoka',align:'center',color:'#ffe08a',stroke:'#1a1226',sw:6,glow:'#ff6f91'});}
 if(p.msgT>0&&p.go<=0){ctx.save();ctx.globalAlpha=Math.min(1,p.msgT*2);const sc=1+Math.max(0,p.msgT-.9)*.4;ctx.translate(W/2,H*.3);ctx.scale(sc,sc);N.text(ctx,p.msg,0,0,{font:'700 '+Math.round(Math.min(W,H)*.07)+'px Fredoka',align:'center',color:'#ffe08a',stroke:'#1a1226',sw:6,glow:'#ff6f91'});ctx.restore();}
 if(!a.running){const w=Math.min(W*.8,460),h=54,x=W/2-w/2,y=H*.2;ctx.fillStyle='rgba(18,8,28,.4)';N.rr(ctx,x+3,y+6,w,h,20);ctx.fill();claySlab(ctx,x,y,w,h,20,'#5a3d62',2.4);N.text(ctx,'TURBO TUNNELS',W/2,y+24,{font:'700 20px Fredoka',align:'center',color:'#ffe08a',stroke:'#1a1226'});N.text(ctx,'Next: '+TRACKS[Math.min(2,a.store.get('raceTrack',0))].name+' · podium unlocks the next track',W/2,y+43,{font:'600 11px Fredoka',align:'center',color:'#fff0d4'});}
 N.vignette(ctx,W,H,.3);}
NEXUS_GAMES.register('racer',{meta:{title:'TURBO TUNNELS',help:'Three laps against three rival drivers. Hold SPACE to drift through corners; release after a long slide for a mini-turbo. Boost pads, oil slicks and glowing tunnels keep it lively. Podium finishes unlock the next track.',controls:'↑ gas · ↓ brake · ←→ steer · SPACE drift · SHIFT nitro',type:'RACING'},
 size:[900,520],portraitSize:[540,860],duration:170,tier:1.1,
 touch:[{kind:'stick',side:'left',axis:'x'},{kind:'btn',side:'right',label:'DRIFT',key:' ',cls:'alt'},{kind:'btn',side:'right',label:'NITRO',key:'Shift',cls:'alt'},{kind:'btn',side:'right',label:'GAS',key:'ArrowUp',big:true}],
 init,start,update,draw,timeUp});
})();

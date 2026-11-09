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
function carDraw(ctx,c,p){ctx.save();ctx.translate(c.x,c.y);ctx.rotate(c.th);ctx.fillStyle='rgba(0,0,0,.3)';ctx.beginPath();ctx.ellipse(3,4,24,14,0,0,N.TAU);ctx.fill();ctx.fillStyle='#1a1226';for(const [x,y] of[[-13,-12],[-13,12],[13,-12],[13,12]]){N.rr(ctx,x-6,y-4,12,8,3);ctx.fill();}
 N.slab(ctx,-24,-12,48,24,10,c.col,{shadow:false});ctx.fillStyle='rgba(30,20,50,.8)';N.rr(ctx,2,-9,13,18,5);ctx.fill();ctx.fillStyle='rgba(255,255,255,.35)';N.rr(ctx,4,-8,4,6,2);ctx.fill();ctx.fillStyle=N.shade(c.col,-.25);N.rr(ctx,-22,-3,16,6,2);ctx.fill();
 if(c.boost>0){ctx.fillStyle='#ffd45e';ctx.beginPath();ctx.moveTo(-24,-5);ctx.lineTo(-44-Math.random()*14,0);ctx.lineTo(-24,5);ctx.fill();}
 ctx.restore();}
function draw(ctx,a){const p=a.p,W=a.W,H=a.H,T=p.T,def=T.def,m=p.me,cam=p.cam;
 ctx.fillStyle=def.pal[0];ctx.fillRect(0,0,W,H);
 ctx.save();ctx.translate(W/2,H*.68);ctx.rotate(-Math.PI/2-cam.th);ctx.scale(cam.z,cam.z);ctx.translate(-cam.x,-cam.y);
 // grass texture dots
 ctx.fillStyle='rgba(255,255,255,.05)';const gx=Math.floor(cam.x/120)*120,gy=Math.floor(cam.y/120)*120;for(let i=-9;i<=9;i++)for(let j=-9;j<=9;j++){const x=gx+i*120+((j&1)*60),y=gy+j*120;ctx.beginPath();ctx.arc(x,y,6,0,N.TAU);ctx.fill();}
 const path=new Path2D();T.pts.forEach((q,i)=>i?path.lineTo(q.x,q.y):path.moveTo(q.x,q.y));path.closePath();
 ctx.lineJoin='round';ctx.lineCap='butt';
 ctx.strokeStyle='rgba(0,0,0,.28)';ctx.lineWidth=RW+60;ctx.stroke(path);
 ctx.strokeStyle='#e6e0d5';ctx.lineWidth=RW+26;ctx.setLineDash([36,36]);ctx.stroke(path);ctx.strokeStyle='#ef896d';ctx.lineDashOffset=36;ctx.stroke(path);ctx.setLineDash([]);ctx.lineDashOffset=0;
 ctx.strokeStyle=def.pal[1];ctx.lineWidth=RW;ctx.stroke(path);
 ctx.strokeStyle='rgba(255,255,255,.35)';ctx.lineWidth=4;ctx.setLineDash([30,40]);ctx.stroke(path);ctx.setLineDash([]);
 // tunnel overlays
 for(const [s,e] of T.tun){ctx.strokeStyle='rgba(20,10,40,.45)';ctx.lineWidth=RW+10;ctx.beginPath();for(let i=s;i<=e;i++){const q=T.pts[i%T.n];i===s?ctx.moveTo(q.x,q.y):ctx.lineTo(q.x,q.y);}ctx.stroke();
  for(let i=s;i<=e;i+=3){const q=T.pts[i%T.n],nx=Math.cos(q.h+Math.PI/2),ny=Math.sin(q.h+Math.PI/2);N.glow(ctx,q.x+nx*RW*.46,q.y+ny*RW*.46,26,'#9de3d1',.7);N.glow(ctx,q.x-nx*RW*.46,q.y-ny*RW*.46,26,'#ff6f91',.7);}}
 // start line, pads, oil
 {const q=T.pts[0],nx=Math.cos(q.h+Math.PI/2),ny=Math.sin(q.h+Math.PI/2);for(let i=-5;i<5;i++){ctx.fillStyle=(i&1)?'#fff':'#1a1226';ctx.save();ctx.translate(q.x+nx*i*14+nx*7,q.y+ny*i*14+ny*7);ctx.rotate(q.h);ctx.fillRect(-8,-7,16,14);ctx.restore();}}
 for(const i of T.pads){const q=T.pts[i];ctx.save();ctx.translate(q.x,q.y);ctx.rotate(q.h);ctx.fillStyle='rgba(255,212,94,.35)';ctx.fillRect(-40,-RW*.4,80,RW*.8);ctx.fillStyle='#ffd45e';for(let s=0;s<3;s++){ctx.beginPath();ctx.moveTo(-26+s*22,-22);ctx.lineTo(-10+s*22,0);ctx.lineTo(-26+s*22,22);ctx.lineTo(-18+s*22,22);ctx.lineTo(-2+s*22,0);ctx.lineTo(-18+s*22,-22);ctx.fill();}ctx.restore();}
 for(const i of T.oils){const q=T.pts[i];ctx.fillStyle='rgba(20,10,30,.8)';ctx.beginPath();ctx.ellipse(q.x,q.y,50,32,q.h,0,N.TAU);ctx.fill();N.glow(ctx,q.x,q.y,50,'#8b6fd6',.3);}
 // props
 for(const pr of T.props){if(Math.abs(pr.x-cam.x)>W*.9||Math.abs(pr.y-cam.y)>W*.9)continue;ctx.fillStyle='rgba(0,0,0,.25)';ctx.beginPath();ctx.ellipse(pr.x+5,pr.y+7,pr.r,pr.r*.8,0,0,N.TAU);ctx.fill();N.ball(ctx,pr.x,pr.y,pr.r,['#5f9a6e','#7fb27d','#e0b36a'][pr.t],{shadow:false});}
 for(const c of p.cars)if(c!==m)carDraw(ctx,c,p);carDraw(ctx,m,p);
 ctx.restore();
 // HUD
 const order=[...p.cars].sort((x,y)=>(y.fin-x.fin)||(x.fin&&y.fin?x.finT-y.finT:y.prog-x.prog));
 N.chip(ctx,12,10,82,'POS',p.pos+'/4',{color:'#ffe08a'});N.chip(ctx,104,10,100,'LAP',Math.min(p.laps,m.lap+1)+'/'+(p.laps||3));N.chip(ctx,214,10,110,'SPEED',Math.round(Math.hypot(m.vx,m.vy)*.22)+' km/h');
 N.bar(ctx,12,54,150,9,m.nitro/(p.nitroMax||1),'#8bb7dc');N.text(ctx,'NITRO',168,62,{font:'700 10px Fredoka',color:'#bfe4da'});
 // minimap
 {const mw=110,mh=84,mx=W-mw-12,my=10;ctx.fillStyle='rgba(22,16,34,.6)';N.rr(ctx,mx,my,mw,mh,10);ctx.fill();let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;T.pts.forEach(q=>{x0=Math.min(x0,q.x);x1=Math.max(x1,q.x);y0=Math.min(y0,q.y);y1=Math.max(y1,q.y);});const sc=Math.min((mw-16)/(x1-x0),(mh-16)/(y1-y0)),ox=mx+8-x0*sc+((mw-16)-(x1-x0)*sc)/2,oy=my+8-y0*sc+((mh-16)-(y1-y0)*sc)/2;ctx.strokeStyle='#d9d4e6';ctx.lineWidth=3;ctx.beginPath();T.pts.forEach((q,i)=>i?ctx.lineTo(ox+q.x*sc,oy+q.y*sc):ctx.moveTo(ox+q.x*sc,oy+q.y*sc));ctx.closePath();ctx.stroke();p.cars.forEach(c=>{ctx.fillStyle=c.col;ctx.beginPath();ctx.arc(ox+c.x*sc,oy+c.y*sc,c.human?4:3,0,N.TAU);ctx.fill();});}
 if(p.go>0)N.text(ctx,String(Math.ceil(p.go)),W/2,H*.4,{font:'700 '+Math.round(H*.2)+'px Fredoka',align:'center',color:'#ffe08a',stroke:'#1a1226',sw:6,glow:'#ff6f91'});
 if(p.msgT>0&&p.go<=0){ctx.globalAlpha=Math.min(1,p.msgT*2);N.text(ctx,p.msg,W/2,H*.3,{font:'700 '+Math.round(Math.min(W,H)*.07)+'px Fredoka',align:'center',color:'#ffe08a',stroke:'#1a1226',glow:'#ff6f91'});ctx.globalAlpha=1;}
 if(!a.running)N.banner(ctx,W,H,'TURBO TUNNELS','Next: '+TRACKS[Math.min(2,a.store.get('raceTrack',0))].name+' · podium finish unlocks the next track');
 N.vignette(ctx,W,H,.3);}
NEXUS_GAMES.register('racer',{meta:{title:'TURBO TUNNELS',help:'Three laps against three rival drivers. Hold SPACE to drift through corners; release after a long slide for a mini-turbo. Boost pads, oil slicks and glowing tunnels keep it lively. Podium finishes unlock the next track.',controls:'↑ gas · ↓ brake · ←→ steer · SPACE drift · SHIFT nitro',type:'RACING'},
 size:[900,520],portraitSize:[540,860],duration:170,tier:1.1,
 touch:[{kind:'stick',side:'left',axis:'x'},{kind:'btn',side:'right',label:'DRIFT',key:' ',cls:'alt'},{kind:'btn',side:'right',label:'NITRO',key:'Shift',cls:'alt'},{kind:'btn',side:'right',label:'GAS',key:'ArrowUp',big:true}],
 init,start,update,draw,timeUp});
})();

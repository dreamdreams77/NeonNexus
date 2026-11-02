// Ambient lobby crowd: individually dressed visitors with personalities who walk the aisles, queue for busy cabinets,
// play and react to winning or losing, drink at the bar, browse the prize gallery, dance at the jukebox and chat.
// Pure scene logic lives here so arcade-world.js only has to call update(). Movement reuses the shared movement helpers.
import { turnToward } from './movement.js';

const NAMES=['Juniper','Cass','Moss','Pip','Tamsin','Bram','Odie','Wren','Ivo','Maple','Fenn','Lark','Nell','Rue'];
const SKIN=[0xf0c9a5,0xe9b99a,0xd9a07e,0xc98e70,0xa8745a,0x8d5b45];
const SHIRT=[0xd98c7d,0x83bcb0,0xb09bd1,0xe0b46f,0x7ea6d6,0xe58fa8,0x9ccb8a,0xd2c06e];
const PANTS=[0x4a4660,0x5a4a52,0x3f5568,0x6a5a48,0x474a5c];
const HAIR=[0x2c2230,0x5a3a2c,0x8a5a3a,0xc99a52,0x3a3350,0xb86a58,0x707680];
const FAVS=['cabinet','cabinet','bar','prize','social','jukebox'];

export function createCrowd(ctx){
 const {THREE,scene,clayMat,cabinets,count,rand=Math.random,onCabinetCheer}=ctx;
 const gSphere=new THREE.SphereGeometry(1,14,10),gCyl=new THREE.CylinderGeometry(1,1,1,10),gTorus=new THREE.TorusGeometry(1,.16,6,14,Math.PI),gBox=new THREE.BoxGeometry(1,1,1);
 const matCache=new Map(),mat=c=>{let m=matCache.get(c);if(!m){m=clayMat(c);matCache.set(c,m);}return m;};
 const dark=new THREE.MeshBasicMaterial({color:0x2a1a2c,side:THREE.DoubleSide}),cheek=new THREE.MeshBasicMaterial({color:0xf08a8a,transparent:true,opacity:.55});
 const shadowMat=new THREE.MeshBasicMaterial({color:0x14081c,transparent:true,opacity:.3,depthWrite:false});
 const shadowGeo=new THREE.CircleGeometry(.4,16);
 const pick=a=>a[Math.floor(rand()*a.length)];
 const mesh=(geo,m,parent,x,y,z,sx,sy,sz)=>{const o=new THREE.Mesh(geo,m);o.position.set(x,y,z);o.scale.set(sx,sy,sz);o.castShadow=true;parent.add(o);return o;};

 // Points of interest (world space). Fronts face the aisle; routes always travel the central aisle first.
 const cabs=cabinets.map((c,i)=>{const side=c.position.x<0?-1:1;return{i,side,z:c.position.z,front:{x:side*3.55,z:c.position.z},occ:null,queue:[],cab:c};});
 const stools=[[7.0,1.4],[8.8,1.4],[10.6,1.4]].map(([x,z])=>({x,z,occ:null}));
 const prizeSpots=[[-9.0,15.6],[-5.3,15.6],[-9.0,17.6],[-5.3,17.6],[-7.1,16.4]].map(([x,z])=>({x,z}));
 const juke={x:-10,z:-10.7},wheel={x:-7.7,z:-10.7};
 const obstacles=[[8.9,5.4,1.55,1.55],[8.9,9.2,1.55,1.55],[8.9,13,1.55,1.55], // axis-aligned solids: cx,cz,half-width,half-depth
  ...cabs.map(c=>[c.side*5.2,c.z,1.05,.95]),[-8.6,-4.7,2.55,1.7],[8.9,-11.8,2.55,1.7],[-8.55,4.7,2.2,1.3],[9.3,-.6,2.7,1.2],
  [-10.0,-12.6,.7,.5],[-7.7,-12.6,1.1,.5],[0,-24.2,3,1],
  [-7.1,13,3.3,1.45],[-10.7,14.85,.35,4.4],[-3.5,14.85,.35,4.4],[-7.1,10.5,3.7,.35],[-9.5,19.2,1.3,.35],[-4.7,19.2,1.3,.35]];

 const plushTex=(()=>{const cv=document.createElement('canvas');cv.width=cv.height=96;const x=cv.getContext('2d');x.lineWidth=3.5;x.strokeStyle='#2a1a2d';x.lineJoin='round';
  const blob=(cx,cy,rx,ry,col)=>{const gr=x.createRadialGradient(cx-rx*.3,cy-ry*.4,2,cx,cy,Math.max(rx,ry)*1.1);gr.addColorStop(0,'#ffd2e4');gr.addColorStop(.6,col);gr.addColorStop(1,'#c9648f');x.fillStyle=gr;x.beginPath();x.ellipse(cx,cy,rx,ry,0,0,6.3);x.fill();x.stroke();};
  blob(30,22,10,13,'#f4a6c4');blob(66,22,10,13,'#f4a6c4');blob(48,56,30,28,'#f4a6c4');blob(48,70,17,14,'#fbd5e3');x.fillStyle='#2a1a2d';x.beginPath();x.ellipse(38,50,3.2,4.2,0,0,6.3);x.ellipse(58,50,3.2,4.2,0,0,6.3);x.fill();x.fillStyle='#fff';x.beginPath();x.arc(39.2,48.5,1.2,0,6.3);x.arc(59.2,48.5,1.2,0,6.3);x.fill();x.strokeStyle='#2a1a2d';x.beginPath();x.moveTo(44,60);x.quadraticCurveTo(48,64,52,60);x.stroke();
  const t=new THREE.CanvasTexture(cv);t.colorSpace=THREE.SRGBColorSpace;return t;})();
 const crowd=[],bursts=[];
 const burstMat=new THREE.MeshBasicMaterial({color:0xffe08a,toneMapped:false});
 for(let i=0;i<18;i++){const m=new THREE.Mesh(new THREE.OctahedronGeometry(.07),burstMat);m.visible=false;scene.add(m);bursts.push({m,life:0,vx:0,vy:0,vz:0});}
 function spark(x,y,z,n=6){let k=0;for(const b of bursts){if(b.life>0)continue;b.life=.9;b.m.visible=true;b.m.position.set(x,y,z);const a=rand()*6.28;b.vx=Math.cos(a)*(.6+rand()*.8);b.vz=Math.sin(a)*(.6+rand()*.8);b.vy=1.8+rand()*1.2;if(++k>=n)break;}}

 function build(i){
  // The visible body is an illustrated sprite actor; the lightweight rig objects below only carry pose values.
  const g=new THREE.Group(),sh=new THREE.Mesh(shadowGeo,shadowMat);sh.rotation.x=-Math.PI/2;sh.position.y=.012;sh.scale.set(1.15,.8,1);g.add(sh);
  const actor=ctx.makeActor(i);g.add(actor.root);
  const o=()=>new THREE.Object3D(),mouth=o();mouth.scale.set(.06,.045,.05);
  const prop=o(),cup=o(),plush=new THREE.Mesh(new THREE.PlaneGeometry(.55,.55),new THREE.MeshBasicMaterial({map:plushTex,transparent:true,toneMapped:false}));
  plush.position.set(0,.85,.22);plush.visible=false;actor.root.add(plush);
  return{g,actor,body:o(),torso:o(),legs:[o(),o()],arms:[o(),o()],head:o(),mouth,prop,cup,plush};
 }
 function nearestFree(){for(let k=0;k<40;k++){const x=(rand()-.5)*8,z=-20+rand()*38;if(free(x,z))return[x,z];}return[0,0];}
 function blocked(x,z,pad=.2){for(const[cx,cz,hw,hd]of obstacles)if(Math.abs(x-cx)<hw+pad&&Math.abs(z-cz)<hd+pad)return true;return false;}
 function push(v){ // push out of solids and the world edge so nobody ever clips furniture
  const p=v.g.position;p.x=Math.max(-10.6,Math.min(10.6,p.x));p.z=Math.max(-23.5,Math.min(22.4,p.z));
  for(const[cx,cz,hw,hd]of obstacles){const dx=p.x-cx,dz=p.z-cz,ox=hw+.28-Math.abs(dx),oz=hd+.28-Math.abs(dz);if(ox>0&&oz>0){if(v.state==='play'||v.state==='drink'||v.state==='queue'||v.state==='browse')continue;if(ox<oz)p.x+=Math.sign(dx||1)*ox;else p.z+=Math.sign(dz||1)*oz;}}
 }

 // Navigation: A* over a 0.5-unit grid built from the real obstacle list (inflated by the walker's radius), then
 // line-of-sight smoothing. Furniture, cabinet columns and the prize-room walls (with its doorway) are all respected.
 const CELL=.5,GX0=-11,GZ0=-24.5,NX=44,NZ=95,PAD=.3,grid=new Uint8Array(NX*NZ);
 for(let iz=0;iz<NZ;iz++)for(let ix=0;ix<NX;ix++){const x=GX0+(ix+.5)*CELL,z=GZ0+(iz+.5)*CELL;if(blocked(x,z,PAD))grid[iz*NX+ix]=1;}
 const cellOf=(x,z)=>[Math.max(0,Math.min(NX-1,Math.floor((x-GX0)/CELL))),Math.max(0,Math.min(NZ-1,Math.floor((z-GZ0)/CELL)))];
 const free=(x,z)=>!blocked(x,z,PAD)&&x>-10.7&&x<10.7&&z>-24&&z<22.6;
 function losClear(a,b){const d=Math.hypot(b[0]-a[0],b[1]-a[1]),n=Math.ceil(d/.2);for(let k=1;k<n;k++){const u=k/n;if(!free(a[0]+(b[0]-a[0])*u,a[1]+(b[1]-a[1])*u))return false;}return true;}
 function nearestOpen(x,z){let[cx,cz]=cellOf(x,z);if(!grid[cz*NX+cx])return[cx,cz];for(let r=1;r<12;r++)for(let dz=-r;dz<=r;dz++)for(let dx=-r;dx<=r;dx++){if(Math.max(Math.abs(dx),Math.abs(dz))!==r)continue;const ax=cx+dx,az=cz+dz;if(ax<0||az<0||ax>=NX||az>=NZ)continue;if(!grid[az*NX+ax])return[ax,az];}return[cx,cz];}
 function findPath(from,to){
  const[sx,sz]=nearestOpen(from[0],from[1]),[tx,tz]=nearestOpen(to[0],to[1]),start=sz*NX+sx,goal=tz*NX+tx;
  const g=new Float32Array(NX*NZ).fill(1e9),came=new Int32Array(NX*NZ).fill(-1),closed=new Uint8Array(NX*NZ),heap=[[0,start]];g[start]=0;
  const h=(i)=>Math.hypot((i%NX)-tx,Math.floor(i/NX)-tz);
  const pushH=(n)=>{heap.push(n);let k=heap.length-1;while(k>0){const p=(k-1)>>1;if(heap[p][0]<=heap[k][0])break;[heap[p],heap[k]]=[heap[k],heap[p]];k=p;}};
  const popH=()=>{const top=heap[0],last=heap.pop();if(heap.length){heap[0]=last;let k=0;for(;;){const l=k*2+1,r=l+1;let m=k;if(l<heap.length&&heap[l][0]<heap[m][0])m=l;if(r<heap.length&&heap[r][0]<heap[m][0])m=r;if(m===k)break;[heap[m],heap[k]]=[heap[k],heap[m]];k=m;}}return top;};
  heap.length=0;pushH([h(start),start]);let guard=0;
  while(heap.length&&guard++<9000){const[,cur]=popH();if(cur===goal)break;if(closed[cur])continue;closed[cur]=1;const cx=cur%NX,cz=(cur-cx)/NX;
   for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dz)continue;const nx=cx+dx,nz=cz+dz;if(nx<0||nz<0||nx>=NX||nz>=NZ)continue;const ni=nz*NX+nx;if(grid[ni]||closed[ni])continue;if(dx&&dz&&(grid[cz*NX+nx]||grid[nz*NX+cx]))continue;const ng=g[cur]+(dx&&dz?1.414:1);if(ng<g[ni]){g[ni]=ng;came[ni]=cur;pushH([ng+h(ni),ni]);}}}
  if(came[goal]<0&&goal!==start)return[to];
  const cells=[];for(let n=goal;n!==-1&&n!==start;n=came[n])cells.push([GX0+((n%NX)+.5)*CELL,GZ0+(Math.floor(n/NX)+.5)*CELL]);cells.reverse();
  const pts=[];let anchor=[from[0],from[1]],k=0;
  while(k<cells.length){let far=k;for(let m=cells.length-1;m>=k;m--){if(losClear(anchor,cells[m])){far=m;break;}}pts.push(cells[far]);anchor=cells[far];k=far+1;}
  pts.push(to);return pts;
 }
 function route(v,to){const p=v.g.position;v.path=findPath([p.x,p.z],to);v.state='walk';}
 const zoneOf=(x,z)=>x>-10.7&&x<-3.5&&z>10.5&&z<19.2?'prize':'floor';

 function chooseActivity(v){
  const r=rand(),w={cabinet:.36,bar:.13,prize:.13,social:.13,jukebox:.07,wander:.18};w[v.fav]+=.2;
  let tot=0;for(const k in w)tot+=w[k];let t=r*tot,act='wander';for(const k in w){t-=w[k];if(t<=0){act=k;break;}}
  v.act=act;
  if(act==='cabinet'){
   const free=cabs.filter(c=>!c.occ&&!c.queue.length),busy=cabs.filter(c=>c.occ&&c.queue.length<2);
   if(busy.length&&rand()<.4){const c=pick(busy);c.queue.push(v);v.cab=c;route(v,[c.front.x,c.z+(c.queue.length)*1.15],'floor');v.onArrive=()=>{v.state='queue';v.timer=0;};return;}
   if(free.length){const c=pick(free);c.occ=v;v.cab=c;route(v,[c.front.x,c.z],'floor');v.onArrive=()=>startPlay(v);return;}
   return chooseWander(v);
  }
  if(act==='bar'){const s=stools.find(s=>!s.occ);if(!s)return chooseWander(v);s.occ=v;v.stool=s;route(v,[s.x,s.z],'floor');v.onArrive=()=>{v.state='drink';v.timer=9+rand()*7;v.face=[s.x,s.z-3];showProp(v,'cup');};return;}
  if(act==='prize'){v.spots=[...prizeSpots].sort(()=>rand()-.5).slice(0,2+Math.floor(rand()*2));const first=v.spots.shift();route(v,[first.x,first.z],'prize');v.onArrive=()=>startBrowse(v);return;}
  if(act==='jukebox'){const t=rand()<.7?juke:wheel;route(v,[t.x,t.z+.2],'floor');v.onArrive=()=>{v.state='dance';v.timer=5+rand()*5;v.face=[t.x,t.z-3];};return;}
  if(act==='social'){const mate=crowd.find(o=>o!==v&&(o.state==='idle'||o.state==='walk'&&o.act==='wander')&&!o.buddy);if(!mate)return chooseWander(v);const mx=(rand()-.5)*2.4,mz=mate.g.position.z;v.buddy=mate;mate.buddy=v;v.meet=[mx-.55,mz];mate.meet=[mx+.55,mz];
   for(const o of [v,mate]){route(o,o.meet,'floor');o.onArrive=()=>{o.state='waitmate';o.timer=0;};}return;}
  return chooseWander(v);
 }
 function chooseWander(v){v.act='wander';const[x,z]=nearestFree();route(v,[x,z],'floor');v.onArrive=()=>{v.state='idle';v.timer=2+rand()*4;v.face=null;};}
 function startPlay(v){v.state='play';v.timer=7+rand()*8;v.face=[v.cab.side*5.2,v.cab.z];v.playSeed=rand()*6;}
 function startBrowse(v){v.state='browse';v.timer=3+rand()*3;v.face=[v.g.position.x+(rand()<.5?-1:1)*2,v.g.position.z-2];}
 function showProp(v,kind){v.prop=kind;v.propUntil=1e9;v.m.prop.visible=true;v.m.cup.visible=kind==='cup';v.m.plush.visible=kind==='plush';}
 function leave(v){ // release whatever the visitor was occupying, then pick something new
  if(v.cab&&v.cab.occ===v){v.cab.occ=null;const nxt=v.cab.queue.shift();if(nxt){v.cab.occ=nxt;route(nxt,[v.cab.front.x,v.cab.z],'floor');nxt.onArrive=()=>startPlay(nxt);v.cab.queue.forEach((q,k)=>{if(q.state==='queue')q.path=[[v.cab.front.x,v.cab.z+(k+1)*1.15]],q.state='walk',q.onArrive=()=>{q.state='queue';};});}}
  if(v.stool&&v.stool.occ===v)v.stool.occ=null;
  v.cab=null;v.stool=null;
  if(v.prop){v.propUntil=v.t+7;}
 }

 const target=count;
 for(let i=0;i<target;i++){
  const m=build(i),start=nearestFree(),v={i,name:NAMES[i%NAMES.length],m,g:m.g,state:'idle',timer:1+rand()*3,fav:pick(FAVS),speed:.95+rand()*.5,skill:.25+rand()*.6,path:[],walkPhase:rand()*6,face:null,react:null,reactT:0,wave:0,waveCool:3+rand()*5,t:0,zone:'floor',baseHead:0};
  m.g.position.set(start[0],0,start[1]);m.g.rotation.y=rand()*6.28;crowd.push(v);
 }

 let last=0;
 function update(t,player){
  const dt=Math.min(.05,Math.max(0,t-last));last=t;if(dt<=0)return;
  for(const b of bursts){if(b.life<=0)continue;b.life-=dt;b.vy-=5*dt;b.m.position.x+=b.vx*dt;b.m.position.y+=b.vy*dt;b.m.position.z+=b.vz*dt;b.m.rotation.y+=dt*8;b.m.scale.setScalar(Math.max(.01,b.life/.9));if(b.life<=0)b.m.visible=false;}
  for(const v of crowd){
   v.t=t;const g=v.g,p=g.position,m=v.m;v.zone=zoneOf(p.x,p.z);let moving=0,heading=null,bob=0,armLift=[0,0],torsoLean=0,headYaw=0,smile=1,hop=0;
   if(v.prop&&v.state!=='drink'&&t>v.propUntil){v.prop=null;m.prop.visible=false;}
   switch(v.state){
    case'idle':v.timer-=dt;heading=v.face?Math.atan2(v.face[0]-p.x,v.face[1]-p.z):null;headYaw=Math.sin(t*.7+v.i)*.5;if(v.timer<=0)chooseActivity(v);break;
    case'walk':{
     const wp=v.path[0];if(!wp){v.state='idle';v.timer=.4;(v.onArrive||(()=>{}))();break;}
     const dx=wp[0]-p.x,dz=wp[1]-p.z,d=Math.hypot(dx,dz);
     if(d<.22){v.path.shift();if(!v.path.length){const f=v.onArrive;v.onArrive=null;f?f():(v.state='idle');}break;}
     let ux=dx/d,uz=dz/d;
     if(player){const px=p.x-player.x,pz=p.z-player.z,pd=Math.hypot(px,pz);if(pd<1.7&&pd>0){const k=(1.7-pd)/1.7*1.6,sgn=(ux*pz-uz*px)>=0?1:-1;ux+=px/pd*k*.6+(-uz*sgn)*k*.8;uz+=pz/pd*k*.6+(ux*sgn)*k*.2;const l=Math.hypot(ux,uz)||1;ux/=l;uz/=l;}}
     const sp=v.speed*(v.path.length===1?Math.min(1,.35+d*.6):1)*1.9,bx=p.x,bz=p.z;p.x+=ux*sp*dt;p.z+=uz*sp*dt;moving=Math.min(1,sp/1.9);heading=Math.atan2(ux,uz);
     v.stuckT=(Math.hypot(p.x-bx,p.z-bz)<sp*dt*.2?(v.stuckT||0)+dt:Math.max(0,(v.stuckT||0)-dt*2));
     if(v.stuckT>2.5){v.stuckT=0;if(v.cab&&v.cab.occ===v){v.cab.occ=null;}if(v.cab){const qi=v.cab.queue.indexOf(v);if(qi>=0)v.cab.queue.splice(qi,1);}if(v.stool&&v.stool.occ===v)v.stool.occ=null;v.cab=null;v.stool=null;chooseWander(v);}
     break;}
    case'queue':v.timer+=dt;heading=Math.atan2(v.cab.side*5.2-p.x,v.cab.z-p.z);torsoLean=Math.sin(t*1.5+v.i)*.03;if(v.timer>2&&v.timer%7<dt){/* shuffle impatiently */}break;
    case'play':{v.timer-=dt;const f=v.face;heading=Math.atan2(f[0]-p.x,f[1]-p.z);const mash=Math.sin(t*14+v.playSeed);armLift=[.55+mash*.35,.55-mash*.35];torsoLean=.08+Math.sin(t*3+v.playSeed)*.03;headYaw=Math.sin(t*2+v.playSeed)*.12;bob=Math.abs(mash)*.012;
     v.cab.cab.userData.lamp.boost=Math.max(v.cab.cab.userData.lamp.boost||0,Math.abs(Math.sin(t*9))*1.2);
     if(v.timer<=0){const win=rand()<.3+v.skill*.4;v.react=win?'win':'lose';v.reactT=2.4;v.state='react';v.cab.cab.userData.lamp.boost=win?3:0;if(win){spark(p.x,1.4,p.z);if(onCabinetCheer)onCabinetCheer(v.cab.cab);}}
     break;}
    case'react':{v.reactT-=dt;const u=v.reactT/2.4;if(v.react==='win'){hop=Math.abs(Math.sin((1-u)*Math.PI*3))*.28;armLift=[2.6,2.6];smile=1;if(Math.random()<dt*2)spark(p.x,1.3,p.z,3);}else{armLift=[.1,.1];torsoLean=.28;headYaw=Math.sin(t*9)*.35*u;smile=-1;}
     if(v.reactT<=0){leave(v);v.state='idle';v.timer=.6+rand()*1.2;}break;}
    case'drink':{v.timer-=dt;heading=Math.atan2(v.face[0]-p.x,v.face[1]-p.z);const sip=Math.max(0,Math.sin(t*.9+v.i*2));armLift=[.05,.15+sip*1.9];headYaw=Math.sin(t*.5+v.i)*.35;if(v.timer<=0){leave(v);v.state='idle';v.timer=.5;}break;}
    case'browse':{v.timer-=dt;heading=Math.atan2(v.face[0]-p.x,v.face[1]-p.z);headYaw=Math.sin(t*1.1+v.i)*.55;armLift=[.05,Math.max(0,Math.sin(t*1.7))*.5];if(v.timer<=0){if(v.spots&&v.spots.length){const nx=v.spots.shift();v.path=[[nx.x,nx.z]];v.state='walk';v.onArrive=()=>startBrowse(v);}else{if(rand()<.5)showProp(v,'plush');v.act='wander';const[x,z]=nearestFree();route(v,[x,z],'floor');v.onArrive=()=>{v.state='idle';v.timer=2+rand()*3;};}}break;}
    case'dance':{v.timer-=dt;heading=Math.atan2(v.face[0]-p.x,v.face[1]-p.z);bob=Math.abs(Math.sin(t*6+v.i))*.05;hop=Math.abs(Math.sin(t*6+v.i))*.06;armLift=[1.2+Math.sin(t*6+v.i)*.9,1.2-Math.sin(t*6+v.i)*.9];torsoLean=Math.sin(t*3+v.i)*.08;headYaw=Math.sin(t*3)*.25;if(v.timer<=0){v.state='idle';v.timer=.5;}break;}
    case'waitmate':{v.timer+=dt;const o=v.buddy;heading=o?Math.atan2(o.g.position.x-p.x,o.g.position.z-p.z):null;if(!o||v.timer>9){if(o)o.buddy=null;v.buddy=null;v.state='idle';v.timer=.5;}else if(o.state==='waitmate'&&Math.hypot(o.g.position.x-p.x,o.g.position.z-p.z)<1.7){v.state=o.state='chat';v.timer=o.timer=6+rand()*5;v.talk=rand()*6;o.talk=v.talk+3;}break;}
    case'chat':{v.timer-=dt;const o=v.buddy;if(o)heading=Math.atan2(o.g.position.x-p.x,o.g.position.z-p.z);const speaking=Math.sin(t*1.3+v.talk)>0;armLift=[.1,speaking?.9+Math.sin(t*7)*.35:.1];headYaw=speaking?Math.sin(t*5)*.12:0;torsoLean=speaking?.05:0;if(Math.sin(t*1.3+v.talk)>.95&&Math.random()<dt*3)smile=1;if(v.timer<=0){if(o){o.buddy=null;}v.buddy=null;v.state='idle';v.timer=.4+rand()*.8;}break;}
   }
   // notice the player: look, and occasionally wave
   if(player){const dx=player.x-p.x,dz=player.z-p.z,d=Math.hypot(dx,dz);
    if(d<.7&&v.state!=='walk'&&v.state!=='play'&&v.state!=='react'){p.x-=dx/(d||1)*(.7-d)*.6;p.z-=dz/(d||1)*(.7-d)*.6;}
    if(d<3.4&&(v.state==='idle'||v.state==='queue'||v.state==='drink'||v.state==='browse')){const want=Math.atan2(dx,dz)-g.rotation.y;let a=want;while(a>Math.PI)a-=6.283;while(a<-Math.PI)a+=6.283;headYaw=Math.max(-.7,Math.min(.7,a));v.waveCool-=dt;if(v.waveCool<=0&&v.state==='idle'){v.wave=1.4;v.waveCool=14+rand()*14;}}}
   if(v.wave>0){v.wave-=dt;armLift[1]=2.4+Math.sin(t*14)*.25;}
   // soft separation between visitors
   for(const o of crowd){if(o===v)continue;const dx=p.x-o.g.position.x,dz=p.z-o.g.position.z,d=Math.hypot(dx,dz);if(d>0&&d<.7&&!(v.state==='chat'&&v.buddy===o)&&!(v.state==='waitmate'&&v.buddy===o)){const k=(.7-d)*.5;p.x+=dx/d*k*dt*6;p.z+=dz/d*k*dt*6;}}
   push(v);
   // pose
   if(heading!==null)g.rotation.y=turnToward(g.rotation.y,heading,dt,moving?11:7);
   v.walkPhase+=dt*(4.2+moving*5.5)*(moving>0?1:0);const sw=moving?Math.sin(v.walkPhase)*.62*moving:0;
   m.legs[0].rotation.x=sw;m.legs[1].rotation.x=-sw;
   const idleSway=Math.sin(t*1.4+v.i)*.012;
   m.body.position.y=(moving?Math.abs(Math.sin(v.walkPhase))*.045:idleSway)+bob+hop;g.position.y=hop;m.body.position.y-=hop;
   m.body.rotation.x+=((torsoLean+(moving?.06:0))-m.body.rotation.x)*Math.min(1,dt*8);
   const armBase=moving?[-sw*.8,sw*.8]:[0,0];
   m.arms[0].rotation.x+=((armBase[0]-armLift[0]*1)-m.arms[0].rotation.x)*Math.min(1,dt*12);
   m.arms[1].rotation.x+=((armBase[1]-armLift[1]*1)-m.arms[1].rotation.x)*Math.min(1,dt*12);
   m.arms[0].rotation.z=.08;m.arms[1].rotation.z=-.08;
   m.head.rotation.y+=(headYaw-m.head.rotation.y)*Math.min(1,dt*7);m.head.rotation.x=m.body.rotation.x*-.6+(smile<0?.12:0);
   m.mouth.scale.y+=((smile<0?-.045:.045)-m.mouth.scale.y)*Math.min(1,dt*10);
   {const hdg=g.rotation.y;let pose='idle',force=null;
    if(moving>0){pose='walk'+(((Math.floor(v.walkPhase*2/Math.PI))%4)+4)%4;}
    else switch(v.state){
     case'play':pose=Math.sin(t*13+v.playSeed)>0?'mash0':'mash1';break;
     case'react':pose=v.react==='win'?'cheer':'slump';force='front';break;
     case'drink':pose=Math.sin(t*.9+v.i*2)>.15?'sip':'idle';force='front';break;
     case'dance':pose=Math.sin(t*6+v.i)>0?'cheer':'idle';force='front';break;
     case'chat':if(armLift[1]>.5){pose='talk';force='front';}break;
    }
    if(v.wave>0){pose='wave';force='front';}
    m.actor.root.rotation.y=-g.rotation.y;
    m.actor.set(hdg,pose,force,moving>0?0:Math.sin(t*1.7+v.i)*.008);}
  }
 }
 return{update,crowd,count:target};
}

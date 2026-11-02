import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';
import {createBall,launchBall,stepBall} from './hoops-physics.js';

const $=id=>document.getElementById(id);
const arena=$('arena'),canvas=$('court');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.6));
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.18;
const scene=new THREE.Scene();scene.background=new THREE.Color(0x241b24);scene.fog=new THREE.FogExp2(0x57404a,.018);
const camera=new THREE.PerspectiveCamera(43,1,.1,100);camera.position.set(7.2,6.5,13.8);camera.lookAt(0,2,-1);
// Procedural clay surface: fine grain, thumb dents and dragged pigment, generated locally.
function makeClayMap(){
 const c=document.createElement('canvas');c.width=c.height=512;const g=c.getContext('2d');
 g.fillStyle='#aaa';g.fillRect(0,0,512,512);
 let seed=91;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 for(let i=0;i<14500;i++){const x=rand()*512,y=rand()*512,r=.3+rand()*2.2,a=.025+rand()*.11;g.fillStyle=rand()>.5?'rgba(255,255,255,'+a+')':'rgba(25,17,15,'+a+')';g.beginPath();g.ellipse(x,y,r*1.8,r*.55,rand()*Math.PI,0,Math.PI*2);g.fill();}
 for(let k=0;k<19;k++){const x=rand()*512,y=rand()*512;g.strokeStyle='rgba(45,31,25,.12)';g.lineWidth=1+rand()*2;g.beginPath();g.arc(x,y,8+rand()*18,rand()*2,rand()*5);g.stroke();}
 const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(2,2);t.colorSpace=THREE.NoColorSpace;return t;
}
const clayBump=makeClayMap();
const mat=(color,roughness=.92,metalness=0,emissive=0,intensity=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness,emissive,emissiveIntensity:intensity,bumpMap:clayBump,bumpScale:.045});
function clayGeometry(radius=1,detail=3,seed=1){
 const g=new THREE.IcosahedronGeometry(radius,detail),p=g.attributes.position;
 for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i);const n=Math.sin(x*7.1+seed)*Math.cos(y*6.4-seed*.7)*Math.sin(z*8.2+seed*1.4);const dent=Math.sin(x*17+z*11+seed)*Math.cos(y*15-seed)*.012;p.setXYZ(i,x*(1+n*.018+dent),y*(1+n*.018+dent),z*(1+n*.018+dent));}
 g.computeVertexNormals();return g;
}
function clayBlob(radius,material,scale=[1,1,1],seed=1){const m=new THREE.Mesh(clayGeometry(radius,4,seed),material);m.scale.set(...scale);m.castShadow=true;m.receiveShadow=true;return m;}

const floor= new THREE.Mesh(new THREE.PlaneGeometry(32,34),mat(0x51404a,.98));floor.rotation.x=-Math.PI/2;floor.position.set(0,-.04,-1);floor.receiveShadow=true;scene.add(floor);
const court=new THREE.Mesh(new THREE.PlaneGeometry(12,17),mat(0xb87958,.98));court.rotation.x=-Math.PI/2;court.position.set(0,.005,1.5);court.receiveShadow=true;scene.add(court);
function line(points,color=0xf4d7ba,r=.025){const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));const m=new THREE.Mesh(new THREE.TubeGeometry(curve,64,r,8,false),mat(color,.98,0));scene.add(m);return m;}
line([[-5.5,.04,8],[5.5,.04,8]],0xf1d7bf,.035);line([[-5.5,.04,-5],[5.5,.04,-5]],0xf1d7bf,.035);
const arcPts=[];for(let i=0;i<=60;i++){const a=Math.PI*i/60;arcPts.push([Math.cos(a)*4.6,.045,-2.9+Math.sin(a)*4.6]);}line(arcPts,0xf1d7bf,.025);
const key=new THREE.DirectionalLight(0xffd4ad,2.15);key.position.set(-5,11,6);key.castShadow=true;key.shadow.mapSize.set(2048,2048);key.shadow.camera.left=-12;key.shadow.camera.right=12;key.shadow.camera.top=12;key.shadow.camera.bottom=-12;scene.add(key);
scene.add(new THREE.HemisphereLight(0xffd6c0,0x49313b,1.65));
function glow(color,intensity,dist,pos){const l=new THREE.PointLight(color,intensity,dist);l.position.set(...pos);scene.add(l);}
glow(0x42e8f1,24,18,[-7,5,-5]);glow(0xf071c7,22,17,[7,5,-7]);glow(0xffc58b,38,14,[0,7,6]);
function box(w,h,d,x,y,z,material,shadow=true){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);m.position.set(x,y,z);m.castShadow=shadow;m.receiveShadow=true;scene.add(m);return m;}
// Back wall, ribbed timber, sculptural columns and glowing architectural bands.
box(24,9,.7,0,4.2,-10.1,mat(0x634c4c),false);
for(let x=-11;x<=11;x+=2.2){box(.09,8,.12,x,4.1,-9.68,mat(0x9a6b60),false);}
box(24,.14,.18,0,7.1,-9.55,mat(0x5ce8ed,.32,.2,0x36dce8,1.8),false);
for(const x of [-10.5,10.5]){const col=new THREE.Mesh(new THREE.CylinderGeometry(.42,.62,7.6,9),mat(0x80615d));col.position.set(x,3.8,-2);col.castShadow=true;scene.add(col);const cap=new THREE.Mesh(new THREE.TorusGeometry(.52,.09,8,24),mat(0xf17dc4,.35,.12,0xf17dc4,1.4));cap.rotation.x=Math.PI/2;cap.position.set(x,6.8,-2);scene.add(cap);}
for(let i=0;i<8;i++){const x=-8+i*2.3;const orb=new THREE.Mesh(new THREE.SphereGeometry(.11,12,10),mat(i%2?0xf17dc4:0x65e8ed,.3,.1,i%2?0xf17dc4:0x65e8ed,2));orb.position.set(x,6.7,-8.9);scene.add(orb);}
// Basket: padded stanchion, angled arm, transparent backboard, steel rim and net.
box(.34,4.3,.38,0,2.15,-5.25,mat(0x725b56),true);
box(.5,.24,.65,0,4.28,-5.25,mat(0x9a7768),true);
const arm=box(.18,.18,1.5,0,4.12,-4.6,mat(0x8a6a5d));arm.rotation.x=-.08;
const board=new THREE.Mesh(new THREE.BoxGeometry(2.05,1.25,.1),new THREE.MeshStandardMaterial({color:0xc5a79b,transparent:true,opacity:.72,roughness:.9,bumpMap:clayBump,bumpScale:.025}));board.position.set(0,3.92,-3.85);board.castShadow=true;scene.add(board);
box(.75,.055,.08,0,3.5,-3.78,mat(0xf5e8d8),false);
const rim=new THREE.Mesh(new THREE.TorusGeometry(.48,.055,12,48),mat(0xb95743,.88,0,0x9a3020,.08));rim.rotation.x=Math.PI/2;rim.position.set(0,3.05,-3.48);rim.castShadow=true;scene.add(rim);
const net=new THREE.Group();for(let i=0;i<12;i++){const a=i*Math.PI*2/12;const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(Math.cos(a)*.43,3.02,-3.48+Math.sin(a)*.43),new THREE.Vector3(Math.cos(a)*.31,2.58,-3.48+Math.sin(a)*.31)]);const cord=new THREE.Mesh(new THREE.TubeGeometry(curve,8,.012,5,false),mat(0xf4e7d8,.6));net.add(cord);}scene.add(net);
const ballGeo=clayGeometry(.24,4,77);
const ballMat=mat(0xc96e36,.96,0);
const ballMesh=new THREE.Mesh(ballGeo,ballMat);ballMesh.castShadow=true;scene.add(ballMesh);
const seamMat=new THREE.MeshBasicMaterial({color:0x2b1712});
for(let i=0;i<3;i++){const seam=new THREE.Mesh(new THREE.TorusGeometry(.242,.009,5,48),seamMat);seam.rotation.set(i*.8,0,i*1.1);ballMesh.add(seam);}
// A deliberately hand-sculpted clay player: lopsided forms, painted face and soft seams.
const player=new THREE.Group();scene.add(player);player.position.set(0,0,6.6);
const body=clayBlob(.48,mat(0x397b80),[.78,1.22,.62],11);body.position.y=1.08;player.add(body);
const jersey=clayBlob(.36,mat(0xe8a16f),[1.05,.88,.72],14);jersey.position.set(0,1.08,.08);player.add(jersey);
const head=clayBlob(.3,mat(0xa96f55),[.94,1.08,.9],21);head.position.set(0,1.88,.03);player.add(head);
const hair=clayBlob(.285,mat(0x30212a),[1.04,.48,1],31);hair.position.set(0,2.08,-.015);player.add(hair);
const eyeMat=new THREE.MeshStandardMaterial({color:0x241b20,roughness:1});
for(const x of [-.105,.105]){const eye=new THREE.Mesh(new THREE.SphereGeometry(.035,10,8),eyeMat);eye.position.set(x,1.91,.29);player.add(eye);}
const cheekMat=mat(0xc98270);
for(const x of [-.17,.17]){const cheek=clayBlob(.055,cheekMat,[1,.55,.5],x*100+4);cheek.position.set(x,1.82,.26);player.add(cheek);}
const smile=new THREE.Mesh(new THREE.TorusGeometry(.075,.012,5,12,Math.PI),eyeMat);smile.position.set(0,1.79,.292);smile.rotation.z=Math.PI;player.add(smile);
const armMat=mat(0xa96f55),shortMat=mat(0x397b80),shoeMat=mat(0x4a3241);
const limbs=[];
for(const side of [-1,1]){
 const arm=clayBlob(.16,armMat,[.72,1.7,.78],40+side);arm.position.set(side*.43,1.17,.03);arm.rotation.z=-side*.22;player.add(arm);limbs.push(arm);
 const leg=clayBlob(.17,mat(0x3b343f),[.78,1.75,.8],50+side);leg.position.set(side*.17,.39,0);leg.rotation.z=side*.08;player.add(leg);limbs.push(leg);
 const shoe=clayBlob(.17,shoeMat,[1.25,.55,1.7],60+side);shoe.position.set(side*.17,.12,.13);player.add(shoe);
}

const ball=createBall();ballMesh.position.set(ball.position.x,ball.position.y,ball.position.z);
let score=0,makes=0,shots=0,streak=0,time=45,displayedTime=45,stopMotionClock=0,stopMotionFrame=0,best=Number(localStorage.getItem('nn-hoops-best')||0),playing=false,paused=false,aiming=false,dragStart=null,aim={x:0,power:.55},lastTime=0,feedbackTimer=0,shotClock=0;
$('best').textContent=String(best).padStart(3,'0');
function resize(){const w=arena.clientWidth,h=arena.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}new ResizeObserver(resize).observe(arena);resize();
function updateHUD(){$('score').textContent=String(score).padStart(3,'0');$('streak').textContent='×'+streak;$('timer').textContent=time;$('shot-count').textContent='SHOTS '+String(shots).padStart(2,'0');$('accuracy').textContent=shots?Math.round(makes/shots*100)+'%':'—';}
function message(text){$('feedback').textContent=text;$('feedback').classList.remove('pop');void $('feedback').offsetWidth;$('feedback').classList.add('pop');feedbackTimer=1.2;}
function resetBall(){Object.assign(ball,createBall());ballMesh.position.set(0,1.35,5.4);ballMesh.rotation.set(0,0,0);player.position.x=0;shotClock=0;}
function begin(){score=0;makes=0;shots=0;streak=0;time=45;displayedTime=45;playing=true;paused=false;$('results').hidden=true;$('start-game').textContent='GAME IN PROGRESS';$('start-game').disabled=true;resetBall();updateHUD();message('LET IT FLY');}
function finish(){if(!playing)return;playing=false;const earned=Math.floor(score/10)+Math.max(0,streak*2);best=Math.max(best,score);localStorage.setItem('nn-hoops-best',String(best));$('best').textContent=String(best).padStart(3,'0');const tokens=earned;$('final-score').textContent=String(score).padStart(3,'0');$('result-makes').textContent=makes+' baskets';$('result-accuracy').textContent=(shots?Math.round(makes/shots*100):0)+'% accuracy';$('result-tokens').textContent='+'+tokens+' tokens';$('result-title').textContent=score>=120?'LIGHTS OUT.':score>=60?'NICE RUN.':'KEEP YOUR HEAD UP.';$('result-copy').textContent=score>=120?'You owned the court. The Nexus noticed.':'Every great shooter finds their rhythm. Run it back.';$('results').hidden=false;$('start-game').disabled=false;$('start-game').textContent='START SHOOTING';try{const key='neon-nexus-player-v1';const saved=JSON.parse(localStorage.getItem(key)||'{}');saved.tokens=(Number(saved.tokens)||250)+tokens;saved.played=true;saved.best=Math.max(Number(saved.best)||0,score);localStorage.setItem(key,JSON.stringify(saved));}catch{}}
function shoot(){if(!playing||paused||ball.active)return;launchBall(ball,aim);shots++;shotClock=0;updateHUD();message('SHOT '+String(shots).padStart(2,'0'));}
function pointerDown(e){if(!playing||paused||ball.active)return;aiming=true;dragStart={x:e.clientX,y:e.clientY};arena.setPointerCapture?.(e.pointerId);$('aim-guide').style.opacity='.25';}
function pointerMove(e){if(!aiming||!dragStart)return;const dx=e.clientX-dragStart.x,dy=dragStart.y-e.clientY;aim.x=Math.max(-1,Math.min(1,dx/115));aim.power=Math.max(0,Math.min(1,dy/145));$('aim-guide').innerHTML='<span>AIM '+(aim.x<-.12?'LEFT':aim.x>.12?'RIGHT':'CENTRE')+'</span><i>POWER '+Math.round(aim.power*100)+'%</i>';}
function pointerUp(){if(!aiming)return;aiming=false;dragStart=null;$('aim-guide').style.opacity='';shoot();}
arena.addEventListener('pointerdown',pointerDown);arena.addEventListener('pointermove',pointerMove);arena.addEventListener('pointerup',pointerUp);arena.addEventListener('pointercancel',pointerUp);
window.addEventListener('keydown',e=>{if(e.key==='Escape'&&playing){paused=!paused;$('pause-overlay').hidden=!paused;}if(e.code==='Space'){e.preventDefault();shoot();}if(e.key==='ArrowLeft')aim.x=Math.max(-1,aim.x-.12);if(e.key==='ArrowRight')aim.x=Math.min(1,aim.x+.12);if(e.key==='ArrowUp')aim.power=Math.min(1,aim.power+.08);if(e.key==='ArrowDown')aim.power=Math.max(0,aim.power-.08);});
$('resume').addEventListener('click',()=>{paused=false;$('pause-overlay').hidden=true;});
$('start-game').addEventListener('click',begin);$('play-again').addEventListener('click',begin);$('exit-game').addEventListener('click',()=>location.href='./index.html');
function animate(now){requestAnimationFrame(animate);const dt=Math.min((now-lastTime)/1000||0,.033);lastTime=now;
 if(playing&&!paused){time-=dt;if(Math.ceil(time)!==displayedTime){displayedTime=Math.ceil(time);$('timer').textContent=displayedTime;}if(time<=0){time=0;finish();}if(ball.active){const event=stepBall(ball,dt);ballMesh.position.set(ball.position.x,ball.position.y,ball.position.z);ballMesh.rotation.x+=ball.velocity.z*dt*1.7;ballMesh.rotation.z+=ball.velocity.x*dt*1.7;if(event.score){score+=10+Math.min(10,streak*2);makes++;streak++;message(streak>=3?'ON FIRE! +'+(10+Math.min(10,(streak-1)*2)):'CLEAN BUCKET!');updateHUD();}if(event.rim||event.backboard){message(event.rim?'OFF THE IRON':'BANK SHOT');}if(!ball.active){if(!ball.scored){streak=0;message('REBOUND · RESET AND FIRE');}shotClock=1.05;updateHUD();}}else if(shotClock>0){shotClock-=dt;if(shotClock<=0)resetBall();}else{ballMesh.position.set(0,1.35,5.4);}}
 stopMotionClock+=dt;if(stopMotionClock>=1/12){stopMotionClock=0;stopMotionFrame++;player.rotation.z=Math.sin(stopMotionFrame*.8)*.012;player.position.y=Math.sin(stopMotionFrame*.55)*.012;head.rotation.z=Math.sin(stopMotionFrame*.7)*.018;limbs.forEach((limb,i)=>{limb.rotation.z=Math.sin(stopMotionFrame*.7+i*2)*.045;});}
 if(feedbackTimer>0){feedbackTimer-=dt;if(feedbackTimer<=0&&!aiming)$('feedback').textContent='READ THE ARC · FIND YOUR RHYTHM';}
 renderer.render(scene,camera);
}requestAnimationFrame(animate);
updateHUD();

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';
import {createBall,launchBall,stepBall} from './hoops-physics.js';

const $=id=>document.getElementById(id);
const arena=$('arena'),canvas=$('court');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.6));
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.18;
const scene=new THREE.Scene();scene.background=new THREE.Color(0x090e1d);scene.fog=new THREE.FogExp2(0x10182a,.026);
const camera=new THREE.PerspectiveCamera(43,1,.1,100);camera.position.set(8,7.1,13.6);camera.lookAt(0,2,-1);
const mat=(color,roughness=.7,metalness=.08,emissive=0,intensity=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness,emissive,emissiveIntensity:intensity});
const floor= new THREE.Mesh(new THREE.PlaneGeometry(32,34),mat(0x18243a,.88));floor.rotation.x=-Math.PI/2;floor.position.set(0,-.04,-1);floor.receiveShadow=true;scene.add(floor);
const court=new THREE.Mesh(new THREE.PlaneGeometry(12,17),mat(0x5c4c4a,.78));court.rotation.x=-Math.PI/2;court.position.set(0,.005,1.5);court.receiveShadow=true;scene.add(court);
function line(points,color=0xf4d7ba,r=.025){const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));const m=new THREE.Mesh(new THREE.TubeGeometry(curve,64,r,8,false),mat(color,.5,.05,color,.16));scene.add(m);return m;}
line([[-5.5,.04,8],[5.5,.04,8]],0xf1d7bf,.035);line([[-5.5,.04,-5],[5.5,.04,-5]],0xf1d7bf,.035);
const arcPts=[];for(let i=0;i<=60;i++){const a=Math.PI*i/60;arcPts.push([Math.cos(a)*4.6,.045,-2.9+Math.sin(a)*4.6]);}line(arcPts,0xf1d7bf,.025);
const key=new THREE.DirectionalLight(0xffd9b3,3.1);key.position.set(-5,11,6);key.castShadow=true;key.shadow.mapSize.set(2048,2048);key.shadow.camera.left=-12;key.shadow.camera.right=12;key.shadow.camera.top=12;key.shadow.camera.bottom=-12;scene.add(key);
scene.add(new THREE.HemisphereLight(0x9bbcff,0x241a24,1.35));
function glow(color,intensity,dist,pos){const l=new THREE.PointLight(color,intensity,dist);l.position.set(...pos);scene.add(l);}
glow(0x42e8f1,70,18,[-7,5,-5]);glow(0xf071c7,58,17,[7,5,-7]);glow(0xffc58b,32,14,[0,7,6]);
function box(w,h,d,x,y,z,material,shadow=true){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);m.position.set(x,y,z);m.castShadow=shadow;m.receiveShadow=true;scene.add(m);return m;}
// Back wall, ribbed timber, sculptural columns and glowing architectural bands.
box(24,9,.7,0,4.2,-10.1,mat(0x171e31),false);
for(let x=-11;x<=11;x+=2.2){box(.09,8,.12,x,4.1,-9.68,mat(0x34415a),false);}
box(24,.14,.18,0,7.1,-9.55,mat(0x5ce8ed,.32,.2,0x36dce8,1.8),false);
for(const x of [-10.5,10.5]){const col=new THREE.Mesh(new THREE.CylinderGeometry(.42,.62,7.6,9),mat(0x33384b));col.position.set(x,3.8,-2);col.castShadow=true;scene.add(col);const cap=new THREE.Mesh(new THREE.TorusGeometry(.52,.09,8,24),mat(0xf17dc4,.35,.12,0xf17dc4,1.4));cap.rotation.x=Math.PI/2;cap.position.set(x,6.8,-2);scene.add(cap);}
for(let i=0;i<8;i++){const x=-8+i*2.3;const orb=new THREE.Mesh(new THREE.SphereGeometry(.11,12,10),mat(i%2?0xf17dc4:0x65e8ed,.3,.1,i%2?0xf17dc4:0x65e8ed,2));orb.position.set(x,6.7,-8.9);scene.add(orb);}
// Basket: padded stanchion, angled arm, transparent backboard, steel rim and net.
box(.34,4.3,.38,0,2.15,-5.25,mat(0x242e42),true);
box(.5,.24,.65,0,4.28,-5.25,mat(0x343e52),true);
const arm=box(.18,.18,1.5,0,4.12,-4.6,mat(0x333f52));arm.rotation.x=-.08;
const board=new THREE.Mesh(new THREE.BoxGeometry(2.05,1.25,.1),new THREE.MeshPhysicalMaterial({color:0x9cc6d1,transparent:true,opacity:.27,roughness:.18,metalness:.18,clearcoat:1}));board.position.set(0,3.92,-3.85);board.castShadow=true;scene.add(board);
box(.75,.055,.08,0,3.5,-3.78,mat(0xf5e8d8),false);
const rim=new THREE.Mesh(new THREE.TorusGeometry(.48,.055,12,48),mat(0xff765f,.3,.45,0xff624b,.65));rim.rotation.x=Math.PI/2;rim.position.set(0,3.05,-3.48);rim.castShadow=true;scene.add(rim);
const net=new THREE.Group();for(let i=0;i<12;i++){const a=i*Math.PI*2/12;const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(Math.cos(a)*.43,3.02,-3.48+Math.sin(a)*.43),new THREE.Vector3(Math.cos(a)*.31,2.58,-3.48+Math.sin(a)*.31)]);const cord=new THREE.Mesh(new THREE.TubeGeometry(curve,8,.012,5,false),mat(0xf4e7d8,.6));net.add(cord);}scene.add(net);
const ballGeo=new THREE.SphereGeometry(.24,24,18);
const ballMat=mat(0xc96e36,.48,.08);
const ballMesh=new THREE.Mesh(ballGeo,ballMat);ballMesh.castShadow=true;scene.add(ballMesh);
const seamMat=new THREE.MeshBasicMaterial({color:0x2b1712});
for(let i=0;i<3;i++){const seam=new THREE.Mesh(new THREE.TorusGeometry(.242,.008,5,48),seamMat);seam.rotation.set(i*.8,0,i*1.1);ballMesh.add(seam);}
const player=new THREE.Group();scene.add(player);player.position.set(0,0,6.6);
const body=new THREE.Mesh(new THREE.CapsuleGeometry(.34,.72,5,10),mat(0x2e6c80,.66,.06));body.position.y=1.05;body.castShadow=true;player.add(body);
const head=new THREE.Mesh(new THREE.SphereGeometry(.27,16,14),mat(0x9b6952));head.position.y=1.78;head.castShadow=true;player.add(head);
const hair=new THREE.Mesh(new THREE.SphereGeometry(.28,12,8,0,Math.PI*2,0,Math.PI*.52),mat(0x241d26));hair.position.y=1.9;player.add(hair);
const jersey=new THREE.Mesh(new THREE.BoxGeometry(.5,.48,.08),mat(0xf2a46f,.7,0,0xf2a46f,.12));jersey.position.set(0,1.1,.31);player.add(jersey);
const ball=createBall();ballMesh.position.set(ball.position.x,ball.position.y,ball.position.z);
let score=0,makes=0,shots=0,streak=0,time=45,best=Number(localStorage.getItem('nn-hoops-best')||0),playing=false,paused=false,aiming=false,dragStart=null,aim={x:0,power:.55},lastTime=0,feedbackTimer=0,shotClock=0;
$('best').textContent=String(best).padStart(3,'0');
function resize(){const w=arena.clientWidth,h=arena.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}new ResizeObserver(resize).observe(arena);resize();
function updateHUD(){$('score').textContent=String(score).padStart(3,'0');$('streak').textContent='×'+streak;$('timer').textContent=time;$('shot-count').textContent='SHOTS '+String(shots).padStart(2,'0');$('accuracy').textContent=shots?Math.round(makes/shots*100)+'%':'—';}
function message(text){$('feedback').textContent=text;$('feedback').classList.remove('pop');void $('feedback').offsetWidth;$('feedback').classList.add('pop');feedbackTimer=1.2;}
function resetBall(){Object.assign(ball,createBall());ballMesh.position.set(0,1.35,5.4);ballMesh.rotation.set(0,0,0);player.position.x=0;shotClock=0;}
function begin(){score=0;makes=0;shots=0;streak=0;time=45;playing=true;paused=false;$('results').hidden=true;$('start-game').textContent='GAME IN PROGRESS';$('start-game').disabled=true;resetBall();updateHUD();message('LET IT FLY');}
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
 if(playing&&!paused){time-=dt;if(time<=0){time=0;finish();}if(ball.active){const event=stepBall(ball,dt);ballMesh.position.set(ball.position.x,ball.position.y,ball.position.z);ballMesh.rotation.x+=ball.velocity.z*dt*1.7;ballMesh.rotation.z+=ball.velocity.x*dt*1.7;if(event.score){score+=10+Math.min(10,streak*2);makes++;streak++;message(streak>=3?'ON FIRE! +'+(10+Math.min(10,(streak-1)*2)):'CLEAN BUCKET!');updateHUD();}if(event.rim||event.backboard){message(event.rim?'OFF THE IRON':'BANK SHOT');}if(!ball.active){if(!ball.scored){streak=0;message('REBOUND · RESET AND FIRE');}shotClock=1.05;updateHUD();}}else if(shotClock>0){shotClock-=dt;if(shotClock<=0)resetBall();}else{ballMesh.position.set(0,1.35,5.4);}}
 if(feedbackTimer>0){feedbackTimer-=dt;if(feedbackTimer<=0&&!aiming)$('feedback').textContent='READ THE ARC · FIND YOUR RHYTHM';}
 renderer.render(scene,camera);
}requestAnimationFrame(animate);
updateHUD();

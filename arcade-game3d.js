import * as THREE from 'three';

const stage=document.querySelector('#game3d-stage');
const canvas=document.querySelector('#stage');
const startButton=document.querySelector('#start');
const scoreNode=document.querySelector('#score');
const timeNode=document.querySelector('#time');
const resultNode=document.querySelector('#result');
const tokenNode=document.querySelector('#arcade-tokens');
if(!stage||!canvas)throw new Error('Kitchen Rush game surface is missing');

let renderer,scene,camera,clock,chef,armL,armR,raf=0,active=false,visible=false;
let ingredients=[],ticketTexture,ticketContext,ticketMaterial,plateFood=[],steam=[],decor=[];
let score=0,timeLeft=55,ticketTime=11,ticket=0,step=0,misses=0,combo=0,sequence=[0,1,2],lastTime=0;
const names=['TOMATO','LETTUCE','CHEESE','BREAD'];
const colors=[0xd96d59,0x83a978,0xf1c96f,0xc88e61];
const rand=(a,b)=>a+Math.random()*(b-a);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

function clayMaterial(color,roughness=.94){return new THREE.MeshStandardMaterial({color,roughness,metalness:0});}
function roundedBox(w,h,d,r,material){const shape=new THREE.Shape();const x=-w/2,y=-h/2;shape.moveTo(x+r,y);shape.lineTo(x+w-r,y);shape.quadraticCurveTo(x+w,y,x+w,y+r);shape.lineTo(x+w,y+h-r);shape.quadraticCurveTo(x+w,y+h,x+w-r,y+h);shape.lineTo(x+r,y+h);shape.quadraticCurveTo(x,y+h,x,y+h-r);shape.lineTo(x,y+r);shape.quadraticCurveTo(x,y,x+r,y);const geo=new THREE.ExtrudeGeometry(shape,{depth:d,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:.045,bevelThickness:.045});geo.center();return new THREE.Mesh(geo,material);}
function box(parent,w,h,d,x,y,z,color,r=.08){const m=roundedBox(w,h,d,r,clayMaterial(color));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function sphere(parent,x,y,z,sx,sy,sz,color){const g=new THREE.SphereGeometry(1,18,14);const a=g.attributes.position;for(let i=0;i<a.count;i++){const v=1+Math.sin(i*12.989)*.018+Math.cos(i*4.13)*.012;a.setXYZ(i,a.getX(i)*v,a.getY(i)*v,a.getZ(i)*v);}g.computeVertexNormals();const m=new THREE.Mesh(g,clayMaterial(color));m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function cylinder(parent,rt,rb,h,x,y,z,color){const g=new THREE.CylinderGeometry(rt,rb,h,18,1);const a=g.attributes.position;for(let i=0;i<a.count;i++){const v=1+Math.sin(i*7.7)*.012;a.setXYZ(i,a.getX(i)*v,a.getY(i),a.getZ(i)*v);}g.computeVertexNormals();const m=new THREE.Mesh(g,clayMaterial(color));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function labelTexture(lines,width=512,height=180){const c=document.createElement('canvas');c.width=width;c.height=height;const x=c.getContext('2d');x.fillStyle='#604451';x.fillRect(0,0,width,height);x.fillStyle='#f7dfbd';x.beginPath();x.roundRect(10,10,width-20,height-20,24);x.fill();x.fillStyle='#654652';x.textAlign='center';x.font='bold 35px Fredoka, sans-serif';x.fillText(lines[0],width/2,65);x.font='22px Fredoka, sans-serif';x.fillText(lines[1]||'',width/2,112);x.font='bold 18px Fredoka, sans-serif';x.fillStyle='#b46659';x.fillText(lines[2]||'',width/2,148);const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;return tex;}
function makeTicketBoard(){const c=document.createElement('canvas');c.width=700;c.height=240;ticketContext=c.getContext('2d');ticketTexture=new THREE.CanvasTexture(c);ticketTexture.colorSpace=THREE.SRGBColorSpace;ticketMaterial=new THREE.MeshBasicMaterial({map:ticketTexture});const board=new THREE.Mesh(new THREE.PlaneGeometry(4.6,1.55),ticketMaterial);board.position.set(0,3.1,-3.28);scene.add(board);paintTicket();}
function paintTicket(){if(!ticketContext)return;const c=ticketContext;c.clearRect(0,0,700,240);c.fillStyle='#5b4050';c.fillRect(0,0,700,240);c.fillStyle='#f7dfbd';c.beginPath();c.roundRect(12,12,676,216,24);c.fill();c.fillStyle='#76505a';c.font='bold 34px Fredoka, sans-serif';c.fillText('KITCHEN TICKET  '+String(ticket+1).padStart(2,'0')+' / 05',34,58);c.font='bold 22px Fredoka, sans-serif';c.fillText('BUILD THIS PLATE IN ORDER',34,100);sequence.forEach((id,i)=>{const x=70+i*215;c.fillStyle=i<step?'#8fb58b':'#d6b59b';c.beginPath();c.arc(x,166,34,0,Math.PI*2);c.fill();c.fillStyle='#59414d';c.textAlign='center';c.font='bold 22px Fredoka, sans-serif';c.fillText(i<step?'✓':String(i+1),x,174);c.textAlign='left';c.fillStyle='#654652';c.font='bold 19px Fredoka, sans-serif';c.fillText(names[id],x+48,173);});ticketTexture.needsUpdate=true;}
function createRoom(){
 scene=new THREE.Scene();scene.background=new THREE.Color(0x41364d);scene.fog=new THREE.Fog(0x41364d,13,27);
 camera=new THREE.PerspectiveCamera(42,1,.1,70);camera.position.set(0,7.5,13.5);camera.lookAt(0,1.55,-.4);
 scene.add(new THREE.HemisphereLight(0xffdfbd,0x51415a,2.15));
 const key=new THREE.DirectionalLight(0xffd29b,3.1);key.position.set(-4,8,6);key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.camera.left=-9;key.shadow.camera.right=9;key.shadow.camera.top=9;key.shadow.camera.bottom=-9;scene.add(key);
 const fill=new THREE.PointLight(0x9bbedb,38,14);fill.position.set(5,4,-2);scene.add(fill);
 const floor=box(scene,15,.34,15,0,-.28,0,0x72545a,.15);floor.receiveShadow=true;
 box(scene,15,5,.45,0,2.2,-5.6,0x624957,.12);
 box(scene,15,.18,15,0,-.51,0,0x4b3a4c,.12);
 // Back wall tiles, shelves and warm hanging lamps.
 for(let x=-6.4;x<=6.4;x+=1.6){box(scene,1.45,1.15,.08,x,2.05,-5.34,(Math.round(x)%2?0x96706c:0x9d7770),.04);}
 box(scene,10,.16,.55,0,3.7,-5.05,0x8b6258,.08);
 for(let i=0;i<5;i++){cylinder(scene,.045,.045,.95,-5.2+i*2.6,4.35,-4.6,0xd8a96e);sphere(scene,-5.2+i*2.6,3.83,-4.6,.3,.2,.3,0xf4c783);}
 // Open counter, hand-made front panels and brass trim.
 box(scene,13,1.1,1.2,0,.55,-1.5,0x9a685e,.18);box(scene,13,.16,1.28,0,1.18,-1.5,0xf0d3a8,.1);box(scene,13,.08,.12,0,.91,-.84,0xd5a15e,.04);
 for(let i=-5;i<=5;i+=2){box(scene,1.65,.68,.08,i,.5,-.87,0x80535b,.08);}
 // A visible conveyor pass with a rotating roller rhythm.
 box(scene,8,.18,2.1,0,1.42,.2,0x5b4857,.1);
 for(let i=0;i<13;i++){const roll=cylinder(scene,.07,.07,1.9,-3.7+i*.62,1.56,.2,0xd3a36a);roll.rotation.x=Math.PI/2;decor.push({mesh:roll,phase:i*.35,kind:'roller'});}
 cylinder(scene,.82,.9,.13,0,1.62,.1,0xf6e4c8);
 cylinder(scene,.69,.72,.035,0,1.71,.1,0xffffff);
 // Four ingredient plinths, each with a sculpted model and readable number.
 for(let i=0;i<4;i++){
  const x=-5.1+i*3.4;box(scene,2.3,.55,1.7,x,.35,3.15,[0x986b65,0x718c76,0x9a8263,0x986b65][i],.14);
  cylinder(scene,.55,.6,.14,x,.72,3.15,0xeed6b4);
  const root=new THREE.Group();root.position.set(x,1.02,3.15);root.userData.ingredient=i;scene.add(root);
  if(i===0){for(let j=0;j<4;j++){const s=sphere(root,Math.cos(j*Math.PI/2)*.16,.15+Math.sin(j*2)*.025,Math.sin(j*Math.PI/2)*.16,.28,.24,.27,0xd76c58);sphere(root,Math.cos(j*Math.PI/2)*.16,.35,Math.sin(j*Math.PI/2)*.16,.065,.025,.065,0x678a59);}}
  if(i===1){for(let j=0;j<5;j++){const leaf=sphere(root,Math.cos(j*1.25)*.2,.15+Math.sin(j)*.04,Math.sin(j*1.25)*.2,.25,.1,.36,0x83a979);leaf.rotation.y=j*.6;}}
  if(i===2){const wedge=box(root,.58,.22,.48,0,.19,0,0xf1ce75,.07);wedge.rotation.y=.2;for(let j=0;j<3;j++)sphere(root,rand(-.2,.2),.31,rand(-.15,.15),.035,.025,.035,0xffe6a2);}
  if(i===3){const loaf=sphere(root,0,.2,0,.48,.27,.34,0xc68e5f);loaf.rotation.z=.08;for(let j=0;j<3;j++){const score=box(root,.035,.012,.42,-.18+j*.18,.43,0,0xe8bd88,.01);score.rotation.z=-.28;}}
  const glow=new THREE.PointLight(colors[i],.6,2.8);glow.position.set(0,.5,0);root.add(glow);ingredients.push(root);
  const tag=new THREE.Mesh(new THREE.PlaneGeometry(1.55,.42),new THREE.MeshBasicMaterial({map:labelTexture([String(i+1)+' · '+names[i],'TAP TO ADD','FRESH PREP'])}));tag.position.set(x,1.18,4.03);scene.add(tag);
 }
 // Chef character: clay head, apron, expressive face and hat.
 chef=new THREE.Group();chef.position.set(0,0,-3.45);scene.add(chef);
 sphere(chef,0,1.75,0,.5,.59,.43,0xe8b998);sphere(chef,0,1.25,0,.57,.62,.38,0x83a99a);
 box(chef,.78,.52,.12,0,1.1,.36,0xf0d3b0,.09);
 sphere(chef,-.17,1.82,.38,.045,.055,.025,0x493343);sphere(chef,.17,1.82,.38,.045,.055,.025,0x493343);
 sphere(chef,0,1.62,.405,.085,.045,.03,0xb96d65);
 cylinder(chef,.36,.34,.19,0,2.3,0,0xf3dfc4);for(let i=-1;i<=1;i++){sphere(chef,i*.2,2.4,0,.19,.17,.19,0xffead1);}
 armL=new THREE.Group();armL.position.set(-.45,1.35,0);chef.add(armL);const arm1=sphere(armL,-.12,-.18,.05,.16,.37,.16,0xe8b998);arm1.rotation.z=-.55;
 armR=new THREE.Group();armR.position.set(.45,1.35,0);chef.add(armR);const arm2=sphere(armR,.12,-.18,.05,.16,.37,.16,0xe8b998);arm2.rotation.z=.55;
 // Steam curls and little hanging pennants animate at stop-motion cadence.
 for(let i=0;i<5;i++){const s=sphere(scene,rand(-.45,.45),2.15,rand(-.35,.35),.06,.18,.06,0xffffff);s.material.transparent=true;s.material.opacity=.28;steam.push({mesh:s,phase:i*.8});}
 const sign=new THREE.Mesh(new THREE.PlaneGeometry(4.8,.8),new THREE.MeshBasicMaterial({map:labelTexture(['THE NEXUS KITCHEN','FRESH PLATES · FAST HANDS','ORDER UP!'])}));sign.position.set(0,4.35,-5.28);scene.add(sign);
 makeTicketBoard();
 for(let i=0;i<16;i++){const speck=sphere(scene,rand(-7,7),rand(1,4.5),rand(-4,4),.025,.025,.025,0xffd7a0);speck.material.emissive=new THREE.Color(0x5c3d25);decor.push({mesh:speck,phase:i,kind:'dust'});}
}
function nextTicket(){ticket++;step=0;ticketTime=Math.max(6.2,11-ticket*.65);sequence=Array.from({length:3},()=>Math.floor(Math.random()*4));paintTicket();plateFood.forEach(m=>scene.remove(m));plateFood=[];}
function addToPlate(id){const x=rand(-.38,.38),z=rand(-.28,.28);let m;if(id===0)m=sphere(scene,x,1.9,z,.17,.12,.17,0xd76c58);else if(id===1)m=sphere(scene,x,1.91,z,.22,.07,.15,0x83a979);else if(id===2)m=box(scene,.25,.07,.22,x,1.9,z,0xf1ce75,.03);else m=sphere(scene,x,1.92,z,.25,.12,.19,0xc68e5f);plateFood.push(m);}
function updateHud(){scoreNode.textContent=String(score);timeNode.textContent=String(Math.ceil(timeLeft));}
function finish(win){if(!active)return;active=false;cancelAnimationFrame(raf);const earned=Math.max(2,Math.floor(score/7)+(win?12:0)+Math.min(15,Math.floor(combo/3)));resultNode.textContent=(win?'KITCHEN MASTER! ':'SERVICE OVER · ')+score+' POINTS · +'+earned+' TOKENS';startButton.textContent='PLAY AGAIN';try{const key='neon-nexus-player-v1',saved=JSON.parse(localStorage.getItem(key)||'{}');saved.tokens=(Number(saved.tokens)||250)+earned;saved.arcadeBest=saved.arcadeBest||{};saved.arcadeBest.chef=Math.max(Number(saved.arcadeBest.chef)||0,score);localStorage.setItem(key,JSON.stringify(saved));tokenNode.textContent=saved.tokens;}catch{}}
function startGame(){if(!visible)return;score=0;timeLeft=55;ticketTime=11;ticket=0;step=0;misses=0;combo=0;active=true;sequence=Array.from({length:3},()=>Math.floor(Math.random()*4));plateFood.forEach(m=>scene.remove(m));plateFood=[];paintTicket();resultNode.textContent='';startButton.textContent='SERVICE IN PROGRESS';updateHud();lastTime=performance.now();cancelAnimationFrame(raf);raf=requestAnimationFrame(loop);}
function mistake(){misses++;combo=0;step=0;ticketTime=11;paintTicket();if(misses>=3)finish(false);}
function choose(id){if(!active)return;if(id===sequence[step]){step++;combo++;score+=25+Math.min(20,combo*2);addToPlate(id);soundFx(440+step*110);if(step===3){score+=90+ticket*12;nextTicket();if(ticket>=5){finish(true);return;}}paintTicket();updateHud();}else{mistake();updateHud();}}
function soundFx(freq){try{const ac=window.__nexusKitchenAudio||(window.__nexusKitchenAudio=new AudioContext());if(ac.state==='suspended')ac.resume();const o=ac.createOscillator(),g=ac.createGain();o.frequency.value=freq;g.gain.value=.025;g.gain.exponentialRampToValueAtTime(.001,ac.currentTime+.11);o.connect(g);g.connect(ac.destination);o.start();o.stop(ac.currentTime+.11);}catch{}}
function loop(now){if(!active||!renderer)return;const dt=Math.min(.04,(now-lastTime)/1000);lastTime=now;timeLeft-=dt;ticketTime-=dt;if(ticketTime<=0){mistake();}if(timeLeft<=0){finish(ticket>=5);return;}
 const t=now/1000;ingredients.forEach((g,i)=>{g.rotation.y=Math.sin(t*1.2+i)*.06;g.position.y=1.02+Math.sin(t*2+i*.9)*.035;g.scale.setScalar(1+Math.max(0,Math.sin(t*2.4+i))*0.012);});
 decor.forEach(o=>{if(o.kind==='dust'){o.mesh.position.y=1.3+((t*.18+o.phase*.13)%3.5);o.mesh.material.opacity=.16+Math.sin(t+o.phase)*.08;}else{o.mesh.rotation.z+=dt*1.4;}});
 chef.rotation.z=Math.sin(t*1.8)*.035;armL.rotation.z=Math.sin(t*3.1)*.16-.15;armR.rotation.z=Math.sin(t*3.1+1.2)*.16+.15;
 steam.forEach(o=>{o.mesh.position.y=2.1+((t*.35+o.phase*.16)%1.3);o.mesh.material.opacity=.25*(1-(o.mesh.position.y-2.1)/1.3);});
 updateHud();renderer.render(scene,camera);raf=requestAnimationFrame(loop);}
function resize(){if(!renderer||!stage.clientWidth)return;const w=stage.clientWidth,h=stage.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
function init(){renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.65));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;stage.appendChild(renderer.domElement);createRoom();clock=new THREE.Clock();new ResizeObserver(resize).observe(stage);window.addEventListener('resize',resize);renderer.setAnimationLoop(()=>{if(visible&&!active){const t=clock.getElapsedTime();chefIdle(t);renderer.render(scene,camera);}});resize();}
function chefIdle(t){chef.rotation.z=Math.sin(t*1.1)*.025;armL.rotation.z=Math.sin(t*1.8)*.08;armR.rotation.z=Math.sin(t*1.8+1)*.08;ingredients.forEach((g,i)=>{g.rotation.y=Math.sin(t+i)*.045;});}
function pointerDown(e){if(!active)return;const r=renderer.domElement.getBoundingClientRect(),p=new THREE.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1),ray=new THREE.Raycaster();ray.setFromCamera(p,camera);const hits=ray.intersectObjects(ingredients,true);if(!hits.length)return;let root=hits[0].object;while(root.parent&&root.userData.ingredient===undefined)root=root.parent;if(root.userData.ingredient!==undefined)choose(root.userData.ingredient);}
function openGame(id){visible=id==='chef';stage.style.display=visible?'block':'none';canvas.style.display=visible?'none':'block';if(visible){resize();resultNode.textContent='';startButton.textContent='START SERVICE';}}
function stop(){active=false;cancelAnimationFrame(raf);if(visible){stage.style.display='block';canvas.style.display='block';}visible=false;}
window.addEventListener('nexus:game3d-open',e=>openGame(e.detail?.gameId));
window.addEventListener('nexus:game3d-start',startGame);
window.addEventListener('nexus:game3d-stop',stop);
stage.addEventListener('pointerdown',pointerDown);
window.addEventListener('keydown',e=>{if(!active)return;if(['1','2','3','4'].includes(e.key)){e.preventDefault();choose(Number(e.key)-1);}});
init();

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';
import { RoundedBoxGeometry } from 'https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/geometries/RoundedBoxGeometry.js';

const mount=document.querySelector('#arcade-world');
if(mount){
 const scene=new THREE.Scene();scene.background=new THREE.Color(0x33283c);scene.fog=new THREE.FogExp2(0x33283c,.021);
 const camera=new THREE.PerspectiveCamera(58,1,.1,100);camera.position.set(0,6,23);
 const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
 renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.7));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.18;
 mount.prepend(renderer.domElement);renderer.domElement.setAttribute('aria-label','Walkable 3D claymation arcade. Use WASD or arrow keys, or the touch joystick. Approach a cabinet and press E.');
 const hemi=new THREE.HemisphereLight(0xffe4c8,0x3a2940,2.1);scene.add(hemi);
 const key=new THREE.DirectionalLight(0xffd5ad,3.1);key.position.set(-7,13,9);key.castShadow=true;key.shadow.mapSize.set(2048,2048);key.shadow.camera.left=-20;key.shadow.camera.right=20;key.shadow.camera.top=20;key.shadow.camera.bottom=-20;key.shadow.bias=-.0002;scene.add(key);
 const pink=new THREE.PointLight(0xff6fae,34,22);pink.position.set(-7,5,-6);scene.add(pink);
 const cyan=new THREE.PointLight(0x62d9df,30,22);cyan.position.set(7,5,1);scene.add(cyan);
 const gold=new THREE.PointLight(0xffc875,22,16);gold.position.set(0,4,-15);scene.add(gold);
 const mat=(color,roughness=.82,metalness=0,emissive=0,ei=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness,emissive,emissiveIntensity:ei});
 // Handmade plaster has a fine irregular grain and soft thumbprint-like surface variation.
 function clayMaps(){
  const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d');x.fillStyle='#aaa';x.fillRect(0,0,256,256);
  for(let i=0;i<1900;i++){const v=90+Math.random()*90;x.fillStyle='rgba('+v+','+v+','+v+','+(.035+Math.random()*.09)+')';x.beginPath();x.ellipse(Math.random()*256,Math.random()*256,Math.random()*5+.5,Math.random()*2+.5,Math.random()*3,0,Math.PI*2);x.fill();}
  for(let i=0;i<18;i++){x.strokeStyle='rgba(40,30,35,.12)';x.lineWidth=1+Math.random()*2;x.beginPath();x.arc(Math.random()*256,Math.random()*256,4+Math.random()*25,Math.random()*6,Math.random()*6+1);x.stroke();}
  const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(1.4,1.4);return t;
 }
 const grain=clayMaps();
 function clayMat(color,rough=.9){return new THREE.MeshStandardMaterial({color,roughness:rough,metalness:0,bumpMap:grain,bumpScale:.055});}
 const box=(w,h,d,x,y,z,m,parent=scene,round=0)=>{const geo=round?new RoundedBoxGeometry(w,h,d,3,round):new THREE.BoxGeometry(w,h,d);const o=new THREE.Mesh(geo,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;};
 const sphere=(r,x,y,z,m,parent=scene,sx=1,sy=1,sz=1)=>{const o=new THREE.Mesh(new THREE.SphereGeometry(r,18,14),m);o.position.set(x,y,z);o.scale.set(sx,sy,sz);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;};
 const cyl=(r1,r2,h,x,y,z,m,parent=scene)=>{const o=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,h,18),m);o.position.set(x,y,z);o.castShadow=true;parent.add(o);return o;};
 function sculptedBox(w,h,d,color,r=.12){
  const g=new RoundedBoxGeometry(w,h,d,5,r),p=g.attributes.position;
  for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i);const wave=Math.sin(x*8+y*5+z*3)*.009+Math.sin(y*11-z*7)*.006;p.setXYZ(i,x+wave*.5,y+wave,z+wave*.7);}
  g.computeVertexNormals();return new THREE.Mesh(g,clayMat(color));
 }
 // Floor and walls are a tiny physical theatre, not a flat gradient.
 const floor=box(25,.5,39,0,-.34,-3,clayMat(0x54404b),scene,.22);
 for(let z=-20;z<=15;z+=2){for(let x=-11;x<=11;x+=2){const tile=box(1.92,.035,1.92,x,-.055,z,mat(((x+z)/2)%2===0?0x725363:0x604756,.96),scene,.035);tile.receiveShadow=true;}}
 box(.6,6,39,-12.2,2.7,-3,clayMat(0x463447),scene,.18);box(.6,6,39,12.2,2.7,-3,clayMat(0x463447),scene,.18);
 box(24,.5,.6,0,5.7,-21,clayMat(0x594052),scene,.18);
 // Repeated timber-like ceiling ribs and hand-painted wall panels.
 for(let z=-19;z<=13;z+=4){const rib=box(24,.22,.28,0,5.3,z,clayMat(0x9b6b69),scene,.1);rib.rotation.z=Math.sin(z)*.006;}
 const sign=box(8,1.25,.35,0,4.45,-20.5,clayMat(0x472f49),scene,.18);
 const signMat=mat(0xffc47f,.35,.05,0xff9d62,1.2);box(7.5,.09,.12,0,5.03,-20.25,signMat);
 function textTexture(title,sub,color){
  const c=document.createElement('canvas');c.width=512;c.height=256;const x=c.getContext('2d');
  const grad=x.createLinearGradient(0,0,512,256);grad.addColorStop(0,'#392c49');grad.addColorStop(1,'#765064');x.fillStyle=grad;x.fillRect(0,0,512,256);
  x.fillStyle=color;x.globalAlpha=.22;for(let i=0;i<18;i++){x.beginPath();x.arc((i*97)%512,(i*61)%256,12+(i%4)*7,0,Math.PI*2);x.fill();}x.globalAlpha=1;
  x.strokeStyle='#fbe1bd';x.lineWidth=8;x.strokeRect(10,10,492,236);
  x.textAlign='center';x.shadowColor=color;x.shadowBlur=18;x.fillStyle='#fff0d2';x.font='bold 54px Fredoka';x.fillText(title,256,125);
  x.shadowBlur=0;x.fillStyle='#f6c99f';x.font='bold 22px Fredoka';x.fillText(sub,256,180);
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
 }
 const definitions=[
  ['NEON HOOPS','hoops','SPORT','01',0xe88962],['COSMIC SKEE-BALL','skeeball','PRECISION','02',0x79b8b0],
  ['COMET AIR HOCKEY','airhockey','VERSUS','03',0x8bb8d7],['MOON MOLES','whack','REFLEX','04',0xc0a078],
  ['BUBBLE BLASTER','target','MARKSMAN','05',0x9f91c9],['PRISM SEQUENCE','memory','MEMORY','06',0xd58eaa],
  ['BEAT FOUNDRY','rhythm','RHYTHM','07',0xd89b69],['METEOR MAYHEM','meteor','SURVIVAL','08',0xc77d70],
  ['TURBO TUNNELS','racer','RACING','09',0x72a9ba],['CLAY STACK','stack','TIMING','10',0xb6a16f],
  ['STARLIGHT PINBALL','pinball','CLASSIC','11',0x9e80bb],['LUCKY CLAW','claw','PRIZES','12',0xd58d9a]
 ];
 const accents=[0xffa46f,0x77d0c3,0x82c8ed,0xe9bd80,0xb5a0ed,0xef9cbd,0xffc77d,0xed8b78,0x7fd1db,0xd7bd83,0xc3a1e8,0xf0a0a8];
 const cabinets=[];
 function makeCabinet(def,i,side,z){
  const [name,id,genre,num,color]=def,g=new THREE.Group();g.position.set(side*5.2,0,z);g.rotation.y=side===-1?Math.PI/2:-Math.PI/2;scene.add(g);
  const body=sculptedBox(1.58,2.65,1.05,i%3===0?0x604653:i%3===1?0x4e5664:0x62505d,.16);body.position.y=1.42;body.castShadow=true;g.add(body);
  // Rounded lower kick plate, cabinet feet, hand-shaped side badges.
  box(1.36,.25,.92,-.02,.18,0,clayMat(0x382d3d),g,.08);
  for(const x of [-.55,.55])cyl(.12,.14,.18,x,.09,.02,mat(0x302735),g);
  const bezel=box(1.32,1.05,.16,0,1.72,.56,clayMat(0x302c42),g,.12);
  const screenTex=textTexture(name,genre+' · '+num,'#'+color.toString(16).padStart(6,'0'));
  const screen=new THREE.Mesh(new RoundedBoxGeometry(1.12,.79,.035,4,.08),new THREE.MeshStandardMaterial({map:screenTex,emissive:color,emissiveIntensity:.18,roughness:.38}));screen.position.set(0,1.77,.66);g.add(screen);
  const marquee=box(1.32,.43,.24,0,2.72,.45,clayMat(color),g,.1);
  const marqScreen=new THREE.Mesh(new THREE.PlaneGeometry(1.12,.27),new THREE.MeshBasicMaterial({map:textTexture(name,'NEXUS ARCADE','#fff0c0')}));marqScreen.position.set(0,2.72,.58);g.add(marqScreen);
  // Joystick, two chunky buttons, speaker dimples.
  box(.94,.32,.36,0,1.02,.58,clayMat(0x393143),g,.1);
  cyl(.075,.09,.28,-.22,1.25,.72,clayMat(0xe6a36e),g);
  sphere(.12,-.22,1.42,.72,clayMat(0xf1bd81),g);
  for(let b=0;b<2;b++)sphere(.09,.12+b*.22,1.2,.74,clayMat(b?0x82c6b6:0xe77f79),g);
  for(let k=0;k<5;k++)sphere(.025,-.46+k*.23,.72,.65,mat(0x191a2b),g,1,1,.4);
  // Wobbly illuminated edge strips.
  const edgeMat=new THREE.MeshStandardMaterial({color:color,emissive:color,emissiveIntensity:.8,roughness:.5});
  for(const x of [-.73,.73]){const edge=box(.045,2.25,.055,x,1.48,.54,edgeMat,g,.02);edge.rotation.z=x*.025;}
  const lamp=new THREE.PointLight(color,1.8,3.2);lamp.position.set(0,2.2,.9);g.add(lamp);
  g.userData={name,id,genre,index:i,screen,screenTex,marquee:marqScreen,lamp,baseY:1.42};
  cabinets.push(g);
  // Hand-painted floor decal, small and slightly rotated.
  const decal=box(1.9,.025,1.1,side*5.2,.005,z+ (side===-1?1.2:-1.2),mat(0x9b7180,.95),scene,.2);decal.rotation.y=(i%2)*.035;
 }
 definitions.forEach((d,i)=>{const side=i<6?-1:1,slot=i%6;makeCabinet(d,i,side,-14+slot*4.5);});
 // Plush prize mound and a little ticket counter make the far wall a destination.
 const prizeGroup=new THREE.Group();prizeGroup.position.set(0,0,-18.4);scene.add(prizeGroup);
 box(4.3,1.4,1.4,0,.7,0,clayMat(0x795064),prizeGroup,.18);box(4.5,.12,1.5,0,1.46,0,mat(0xffc77e,.4,0,0xff9e5b,.8),prizeGroup,.06);
 for(let i=0;i<7;i++){const x=-1.55+(i%4)*1.02,y=1.9+Math.floor(i/4)*.2;const plush=sphere(.36,x,y,.12,clayMat([0xd58f94,0x8dc4ae,0x9d94cb,0xe6b66e][i%4]),prizeGroup,1,.9,.82);sphere(.08,x-.12,y+.05,.42,mat(0x32283b),prizeGroup);sphere(.08,x+.12,y+.05,.42,mat(0x32283b),prizeGroup);}
 // Hand-sculpted host character with eyes, cheeks and a gentle idle sway.
 const host=new THREE.Group();host.position.set(0,0,-16.3);scene.add(host);
 const hostBody=sphere(.42,0,.92,0,clayMat(0xd98e82),host,.85,1.2,.72);
 sphere(.36,0,1.62,.02,clayMat(0xeac09e),host,1,.95,.86);
 for(const x of [-.13,.13])sphere(.045,x,1.69,.31,mat(0x33283b),host);
 for(const x of [-.23,.23])sphere(.075,x,1.48,.26,clayMat(0xe78d87),host);
 const smile=new THREE.Mesh(new THREE.TorusGeometry(.09,.018,8,18,Math.PI),mat(0x7c4855));smile.position.set(0,1.48,.31);smile.rotation.z=Math.PI;host.add(smile);
 // Player avatar: asymmetrical clay hoodie, rounded head, hair cap, eyes and stubby limbs.
 const player=new THREE.Group();scene.add(player);player.position.set(0,0,13);
 const hoodie=new THREE.Mesh(new THREE.CapsuleGeometry(.37,.68,5,10),clayMat(0x7db9b1));hoodie.position.y=1.04;hoodie.castShadow=true;player.add(hoodie);
 sphere(.29,0,1.82,.02,clayMat(0xe9bea0),player,1,.98,.9);
 sphere(.3,0,2.02,-.02,clayMat(0x574052),player,1,.48,.95);
 for(const x of [-.105,.105])sphere(.035,x,1.83,.27,mat(0x2e2638),player);
 for(const x of [-.39,.39]){const arm=new THREE.Mesh(new THREE.CapsuleGeometry(.12,.48,4,8),clayMat(0x7db9b1));arm.position.set(x,1.03,0);arm.rotation.z=x*.7;player.add(arm);}
 for(const x of [-.17,.17]){const leg=new THREE.Mesh(new THREE.CapsuleGeometry(.14,.38,4,8),clayMat(0x574052));leg.position.set(x,.3,0);player.add(leg);}
 const keys=new Set(),touch={x:0,y:0};let nearest=null,walk=0;
 const prompt=document.querySelector('#arcade-world-prompt'),interact=document.querySelector('#arcade-interact'),pad=document.querySelector('#arcade-touch-pad'),knob=document.querySelector('#arcade-joystick');
 function useCabinet(){if(!nearest)return;window.dispatchEvent(new CustomEvent('nexus:arcade-play',{detail:{gameId:nearest.userData.id}}));}
 interact.addEventListener('click',useCabinet);
 window.addEventListener('keydown',e=>{const k=e.key.toLowerCase();if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright','e'].includes(k)){e.preventDefault();keys.add(k);}if(k==='e')useCabinet();});
 window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));window.addEventListener('blur',()=>keys.clear());
 if(pad){let pid=null;pad.addEventListener('pointerdown',e=>{pid=e.pointerId;pad.setPointerCapture(pid);});pad.addEventListener('pointermove',e=>{if(pid!==e.pointerId)return;const r=pad.getBoundingClientRect(),dx=e.clientX-r.left-r.width/2,dy=e.clientY-r.top-r.height/2,len=Math.max(1,Math.hypot(dx,dy)),s=Math.min(1,len/(r.width*.32));touch.x=dx/len*s;touch.y=dy/len*s;knob.style.transform='translate('+touch.x*24+'px,'+touch.y*24+'px)';});const stop=e=>{if(pid!==null&&(!e||e.pointerId===pid)){pid=null;touch.x=touch.y=0;knob.style.transform='translate(0,0)';}};pad.addEventListener('pointerup',stop);pad.addEventListener('pointercancel',stop);}
 const ray=new THREE.Raycaster(),pointer=new THREE.Vector2();
 renderer.domElement.addEventListener('pointerdown',e=>{const r=renderer.domElement.getBoundingClientRect();pointer.x=(e.clientX-r.left)/r.width*2-1;pointer.y=-(e.clientY-r.top)/r.height*2+1;ray.setFromCamera(pointer,camera);const hits=ray.intersectObjects(cabinets,true);if(hits.length){let o=hits[0].object;while(o.parent&&!o.userData.id)o=o.parent;if(o.userData.id&&player.position.distanceTo(o.position)<5.8){nearest=o;useCabinet();}}});
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),clock=new THREE.Clock();
 function resize(){const w=Math.max(1,mount.clientWidth),h=Math.max(1,mount.clientHeight);camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h,false);}new ResizeObserver(resize).observe(mount);resize();
 function update(dt,t){
  let x=((keys.has('d')||keys.has('arrowright'))?1:0)-((keys.has('a')||keys.has('arrowleft'))?1:0)+touch.x;
  let z=((keys.has('s')||keys.has('arrowdown'))?1:0)-((keys.has('w')||keys.has('arrowup'))?1:0)+touch.y;
  const len=Math.hypot(x,z);if(len>.08){x/=Math.max(1,len);z/=Math.max(1,len);player.position.x=clamp(player.position.x+x*5.1*dt,-9.7,9.7);player.position.z=clamp(player.position.z+z*5.1*dt,-18.5,15);player.rotation.y=Math.atan2(x,z);walk+=dt*9;hoodie.position.y=1.04+Math.abs(Math.sin(walk))*.045;player.children.slice(-2).forEach((leg,i)=>leg.rotation.x=Math.sin(walk+i*Math.PI)*.24);}else{hoodie.position.y=1.04+Math.sin(t*2.1)*.018;player.children.slice(-2).forEach((leg)=>leg.rotation.x*=.86);}
  camera.position.lerp(new THREE.Vector3(player.position.x*.72,5.5,player.position.z+8.6),1-Math.exp(-3.8*dt));camera.lookAt(player.position.x*.72,1.45,player.position.z-2.4);
  nearest=null;let dmin=4.1;for(const c of cabinets){const d=player.position.distanceTo(c.position);if(d<dmin){dmin=d;nearest=c;}}
  if(nearest){prompt.textContent='E / TAP TO PLAY  ·  '+nearest.userData.name;interact.hidden=false;interact.textContent='PLAY '+nearest.userData.name+' ↗';}else{prompt.textContent='WALK UP TO ANY CABINET TO PLAY';interact.hidden=true;}
  cabinets.forEach((c,i)=>{const pulse=.75+Math.sin(t*2.1+i*.8)*.22;c.userData.lamp.intensity=1.4+pulse*1.1;c.position.y=Math.sin(t*1.3+i)*.012;});
  host.rotation.z=Math.sin(t*1.2)*.035;host.position.y=Math.sin(t*2)*.025;pink.intensity=30+Math.sin(t*1.4)*5;cyan.intensity=28+Math.cos(t*1.1)*5;
 }
 function animate(){requestAnimationFrame(animate);const dt=Math.min(clock.getDelta(),.04),t=clock.elapsedTime;update(dt,t);renderer.render(scene,camera);}
 animate();
}
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';
import { RoundedBoxGeometry } from 'https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/geometries/RoundedBoxGeometry.js';

const mount=document.querySelector('#arcade-world');
if(mount){
 const scene=new THREE.Scene();scene.background=new THREE.Color(0x33283c);scene.fog=new THREE.FogExp2(0x33283c,.021);
 const camera=new THREE.OrthographicCamera(-13,13,13,-13,.1,120);camera.position.set(0,24,31);
 const mobileDevice=matchMedia('(max-width: 700px)').matches;
 const renderer=new THREE.WebGLRenderer({antialias:!mobileDevice,alpha:false,powerPreference:'high-performance'});
 renderer.setPixelRatio(Math.min(devicePixelRatio||1,mobileDevice?1.2:1.5));renderer.shadowMap.enabled=!mobileDevice;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.18;
 mount.prepend(renderer.domElement);renderer.domElement.setAttribute('aria-label','Walkable 3D claymation arcade. Use WASD or arrow keys, or the touch joystick. Approach a cabinet and press E.');
 const hemi=new THREE.HemisphereLight(0xffe4c8,0x3a2940,2.1);scene.add(hemi);
 const key=new THREE.DirectionalLight(0xffd5ad,3.1);key.position.set(-7,13,9);key.castShadow=!mobileDevice;key.shadow.mapSize.set(1024,1024);key.shadow.camera.left=-20;key.shadow.camera.right=20;key.shadow.camera.top=20;key.shadow.camera.bottom=-20;key.shadow.bias=-.0002;scene.add(key);
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
 function feltTexture(base){const c=document.createElement('canvas');c.width=512;c.height=256;const x=c.getContext('2d');x.fillStyle=base;x.fillRect(0,0,512,256);for(let i=0;i<2100;i++){x.fillStyle=i%2?'rgba(255,244,218,.055)':'rgba(25,45,38,.065)';x.fillRect((i*97)%512,(i*53)%256,1+(i%3),1);}for(let i=0;i<48;i++){x.strokeStyle='rgba(240,224,190,.055)';x.lineWidth=1;x.beginPath();x.moveTo((i*83)%512,(i*37)%256);x.quadraticCurveTo((i*83)%512+18,(i*37)%256-4,(i*83)%512+34,(i*37)%256+2);x.stroke();}const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;}
 const airFelt=feltTexture('#b8d9ce'),poolFelt=feltTexture('#356e59');
 const box=(w,h,d,x,y,z,m,parent=scene,round=0)=>{const geo=round?new RoundedBoxGeometry(w,h,d,3,round):new THREE.BoxGeometry(w,h,d);const o=new THREE.Mesh(geo,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;};
 const sphere=(r,x,y,z,m,parent=scene,sx=1,sy=1,sz=1)=>{const o=new THREE.Mesh(new THREE.SphereGeometry(r,18,14),m);o.position.set(x,y,z);o.scale.set(sx,sy,sz);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;};
 const cyl=(r1,r2,h,x,y,z,m,parent=scene)=>{const o=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,h,18),m);o.position.set(x,y,z);o.castShadow=true;parent.add(o);return o;};
 function sculptedBox(w,h,d,color,r=.12){
  const g=new RoundedBoxGeometry(w,h,d,5,r),p=g.attributes.position;
  for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i);const wave=Math.sin(x*8+y*5+z*3)*.009+Math.sin(y*11-z*7)*.006;p.setXYZ(i,x+wave*.5,y+wave,z+wave*.7);}
  g.computeVertexNormals();return new THREE.Mesh(g,clayMat(color));
 }
 // Floor and walls are a tiny physical theatre, not a flat gradient.
 const floor=box(25,.5,50,0,-.34,-1,clayMat(0x54404b),scene,.22);
 const tilePositions=[];for(let z=-25;z<=23;z+=2)for(let x=-11;x<=11;x+=2)tilePositions.push([x,z]);
 const floorTiles=new THREE.InstancedMesh(new RoundedBoxGeometry(1.92,.035,1.92,2,.035),clayMat(0xffffff,.96),tilePositions.length),tileTransform=new THREE.Object3D();
 tilePositions.forEach(([x,z],i)=>{tileTransform.position.set(x,-.055,z);tileTransform.updateMatrix();floorTiles.setMatrixAt(i,tileTransform.matrix);floorTiles.setColorAt(i,new THREE.Color(((x+z)/2)%2===0?0x725363:0x604756));});floorTiles.instanceMatrix.needsUpdate=true;floorTiles.castShadow=false;floorTiles.receiveShadow=true;scene.add(floorTiles);
 box(.6,6,50,-12.2,2.7,-1,clayMat(0x463447),scene,.18);box(.6,6,50,12.2,2.7,-1,clayMat(0x463447),scene,.18);
 box(24,.5,.6,0,5.7,-26,clayMat(0x594052),scene,.18);
 // Repeated timber-like ceiling ribs and hand-painted wall panels.
 for(let z=-24;z<=20;z+=4){const rib=box(24,.22,.28,0,5.3,z,clayMat(0x9b6b69),scene,.1);rib.rotation.z=Math.sin(z)*.006;}
 const sign=box(8,1.25,.35,0,4.45,-25.5,clayMat(0x472f49),scene,.18);
 // Painted storybook mural: layered brush shapes and hand-drawn stars on warm plaster.
 function muralTexture(){
  const c=document.createElement('canvas');c.width=1024;c.height=420;const x=c.getContext('2d');
  const g=x.createLinearGradient(0,0,1024,420);g.addColorStop(0,'#594052');g.addColorStop(.52,'#80586a');g.addColorStop(1,'#39485a');x.fillStyle=g;x.fillRect(0,0,1024,420);
  for(let i=0;i<170;i++){x.strokeStyle=['rgba(255,220,174,.10)','rgba(43,30,48,.12)','rgba(236,157,142,.10)'][i%3];x.lineWidth=2+(i%4);x.beginPath();const px=(i*83)%1024,py=(i*47)%420;x.moveTo(px,py);x.quadraticCurveTo(px+18,py-12,px+42,py+((i%2)?10:-8));x.stroke();}
  x.fillStyle='#d99a83';x.beginPath();x.moveTo(0,340);x.quadraticCurveTo(190,240,360,330);x.quadraticCurveTo(540,210,720,315);x.quadraticCurveTo(900,230,1024,300);x.lineTo(1024,420);x.lineTo(0,420);x.fill();
  x.fillStyle='#394454';for(let i=0;i<13;i++){const px=35+i*82,h=55+(i*37)%100;x.fillRect(px,330-h,28,h);x.fillRect(px-8,320-h,44,12);}
  for(let i=0;i<34;i++){const px=(i*137)%1024,py=30+(i*61)%245;x.fillStyle=i%3?'#f8d49c':'#8ed2c7';x.globalAlpha=.55+(i%4)*.1;x.beginPath();x.arc(px,py,2+(i%3),0,Math.PI*2);x.fill();}x.globalAlpha=1;
  x.strokeStyle='#f5c99a';x.lineWidth=5;x.beginPath();x.arc(810,120,58,.25,Math.PI*1.8);x.stroke();x.beginPath();x.arc(810,120,43,.2,Math.PI*1.7);x.stroke();
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
 }
 const muralMat=new THREE.MeshBasicMaterial({map:muralTexture(),transparent:false});
 for(const x of [-8.7,0,8.7]){const mural=new THREE.Mesh(new THREE.PlaneGeometry(5.3,2.15),muralMat);mural.position.set(x,3.35,-25.66);scene.add(mural);}
 // Potted clay foliage breaks up the repeated cabinet lines with handmade silhouettes.
 function makePlanter(x,z,flip=1){
  const pot=new THREE.Group();pot.position.set(x,0,z);scene.add(pot);
  const vessel=new THREE.Mesh(new THREE.CylinderGeometry(.42,.3,.58,11),clayMat(0xb87969));vessel.position.y=.29;pot.add(vessel);
  const rim=new THREE.Mesh(new THREE.TorusGeometry(.37,.065,8,18),clayMat(0xe0a17e));rim.rotation.x=Math.PI/2;rim.position.y=.55;pot.add(rim);
  for(let i=0;i<7;i++){const a=i*2.399,reach=.22+(i%3)*.12,leaf=sphere(.22,Math.cos(a)*reach,.75+(i%3)*.12,Math.sin(a)*reach,clayMat([0x6c9d79,0x82ae83,0x91b78b][i%3]),pot,.48,1.45,.72);leaf.rotation.z=Math.cos(a)*.45*flip;leaf.rotation.x=Math.sin(a)*.32;}
  for(let i=0;i<3;i++){const stem=cyl(.018,.025,.52,Math.cos(i*2.1)*.12, .84,Math.sin(i*2.1)*.12,clayMat(0x557e66),pot);stem.rotation.z=(i-1)*.24*flip;}
 }
 for(const z of [-17,-8,1,10,19]){makePlanter(-10.7,z,-1);makePlanter(10.7,z,1);}
 // Dust motes catch the practical lights and add depth between the player and scenery.
 const motePositions=new Float32Array(90*3);
 for(let i=0;i<90;i++){motePositions[i*3]=(Math.random()-.5)*21;motePositions[i*3+1]=.5+Math.random()*4.4;motePositions[i*3+2]=-23+Math.random()*44;}
 const moteGeo=new THREE.BufferGeometry();moteGeo.setAttribute('position',new THREE.BufferAttribute(motePositions,3));
 const motes=new THREE.Points(moteGeo,new THREE.PointsMaterial({color:0xffdfb6,size:.055,transparent:true,opacity:.42,depthWrite:false}));scene.add(motes);
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
  ['STARLIGHT PINBALL','pinball','CLASSIC','11',0x9e80bb],['LUCKY CLAW','claw','PRIZES','12',0xd58d9a],
  ['KITCHEN RUSH','chef','KITCHEN','13',0xd58d9a],['SUSHI CATCH','sushi','PRECISION','14',0x86b9a7],['MIXOLOGY MASTER','mixology','TIMING','15',0xc29bd1],
  ['PULSE RUNNER','pulse','ACTION','16',0x7de2d0],['BARRELSTORM MOTO','moto','MOTORCROSS','17',0xe58c70],['MOONSHARD LEGEND','moonquest','ADVENTURE','18',0xb1a2df]
 ];
 const gameGuide={
  hoops:{label:'SPORT · TIMING',description:'Sink satisfying shots into a moving hoop. Read the arc, adjust your power and build a scoring streak.',challenge:'Aim · release timing · combo shots',controls:'Drag / aim and release'},
  skeeball:{label:'PRECISION · PHYSICS',description:'Roll clay balls up the lane and land them in the highest-value rings before your turns run out.',challenge:'Power control · bank shots · accuracy',controls:'Drag to set power, release to roll'},
  airhockey:{label:'VERSUS · REFLEX',description:'Defend your goal, predict the return and outscore a reactive opponent in a fast rally.',challenge:'Positioning · rebounds · quick reactions',controls:'Move your paddle; arrows + Enter also work'},
  whack:{label:'REFLEX · ARCADE',description:'Spot the cheeky moon moles as they pop up, then bonk the right one before it disappears.',challenge:'Reaction speed · target selection',controls:'Tap / click a mole'},
  target:{label:'MARKSMAN · AIM',description:'Track drifting targets and fire clean shots. Accuracy and streaks matter more than wild clicking.',challenge:'Precision · target tracking · streaks',controls:'Aim with pointer or arrow keys; Enter fires'},
  memory:{label:'MEMORY · PATTERN',description:'Watch the glowing sequence, remember its order and repeat it without breaking the chain.',challenge:'Recall · focus · growing sequences',controls:'Tap / click the pads'},
  rhythm:{label:'RHYTHM · BEAT',description:'Follow the beat cues and hit each note in time to keep your musical combo alive.',challenge:'Timing windows · rhythm · consistency',controls:'Tap / click on the beat'},
  meteor:{label:'SURVIVAL · DODGE',description:'Stay alive as the meteor shower intensifies. Read the falling hazards and slip through safe gaps.',challenge:'Movement · awareness · survival',controls:'Arrow keys / WASD or touch'},
  racer:{label:'RACING · LANE CONTROL',description:'Thread a high-speed tunnel, dodge traffic and collect tokens without losing your racing line.',challenge:'Steering · hazard reads · risk/reward',controls:'Arrow keys / WASD or touch'},
  stack:{label:'TIMING · BUILDER',description:'Drop each moving clay block as cleanly as you can. Every imperfect landing makes the tower trickier.',challenge:'Release timing · precision · balance',controls:'Tap / click or press Enter'},
  pinball:{label:'CLASSIC · PINBALL',description:'Keep the ball alive, light up targets and chain bumper hits for a bigger score.',challenge:'Flipper timing · rebounds · combos',controls:'Left / right arrows or tap flippers'},
  claw:{label:'PRIZES · SKILL',description:'Line up the claw, commit to a grab and see whether you can snag a rare prize.',challenge:'Positioning · timing · patience',controls:'Arrows to position; Enter to grab'},
  chef:{label:'KITCHEN · MULTITASK',description:'Read incoming kitchen tickets, prepare the right ingredients and keep orders moving under pressure.',challenge:'Sequence memory · speed · accuracy',controls:'Tap / click ingredients'},
  sushi:{label:'PRECISION · CATCH',description:'Slide the tray beneath falling ingredients and catch the right pieces to build a perfect plate.',challenge:'Tracking · movement · streaks',controls:'Move with arrows / WASD or touch'},
  mixology:{label:'TIMING · MIXOLOGY',description:'Pour each drink into the sweet spot. Too little or too much costs the round and your combo.',challenge:'Meter timing · consistency · pressure',controls:'Tap / click to stop the pour'},
  pulse:{label:'ACTION · PLATFORMER',description:'Run, jump and blast through a dangerous energy facility, then face the reactor guardian.',challenge:'Platforming · combat · boss patterns',controls:'Arrows / WASD move · jump · fire'},
  moto:{label:'MOTORCROSS · RACING',description:'Ride a handmade stunt track, launch off ramps, clear gaps and dodge rolling barrels.',challenge:'Throttle · lean · jump timing',controls:'Hold / arrows to accelerate · jump'},
  moonquest:{label:'ADVENTURE · EXPLORATION',description:'Explore moonlit ruins, fight guardians, collect three moonshards and challenge the Moonkeep boss.',challenge:'Exploration · sword combat · upgrades',controls:'Arrows / WASD move · attack / guard'}
 };
 const accents=[0xffa46f,0x77d0c3,0x82c8ed,0xe9bd80,0xb5a0ed,0xef9cbd,0xffc77d,0xed8b78,0x7fd1db,0xd7bd83,0xc3a1e8,0xf0a0a8];
 // Every cabinet gets its own tiny animated gameplay vignette, painted at a deliberate stop-motion cadence.
 function makeCabinetPreview(id,color){
  const canvas=document.createElement('canvas');canvas.width=384;canvas.height=256;
  const ctx=canvas.getContext('2d',{alpha:false});const hex='#'+color.toString(16).padStart(6,'0');
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());
  const preview={canvas,ctx,texture,id,color:hex,clock:0,frame:0};
  drawCabinetPreview(preview,0);return preview;
 }
 function drawCabinetPreview(p,frame){
  const c=p.ctx,id=p.id,w=384,h=256,accent=p.color;
  const bg=c.createLinearGradient(0,0,w,h);bg.addColorStop(0,'#302a43');bg.addColorStop(.58,'#51405b');bg.addColorStop(1,'#252d43');c.fillStyle=bg;c.fillRect(0,0,w,h);
  c.globalAlpha=.2;c.strokeStyle='#f5d6b0';c.lineWidth=2;
  for(let i=0;i<16;i++){const y=(i*37+frame*1.8)%h;c.beginPath();c.moveTo(0,y);c.quadraticCurveTo(90,y-8,190,y+3);c.stroke();}
  c.globalAlpha=1;
  for(let i=0;i<22;i++){const x=(i*71+frame*2.4)%w,y=(i*43)%170;c.fillStyle=i%3?'#f5d6a0':'#8ed7cc';c.globalAlpha=.3;c.beginPath();c.arc(x,y,1.5+(i%3),0,Math.PI*2);c.fill();}
  c.globalAlpha=1;
  c.fillStyle='#1d2438';c.fillRect(0,204,w,52);c.fillStyle='#8e6c75';c.fillRect(0,204,w,5);
  const bob=Math.sin(frame*.42)*4,move=(frame*3)%280;
  const ball=(x,y,r,col)=>{c.fillStyle=col;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();c.strokeStyle='#fff0d2';c.globalAlpha=.65;c.lineWidth=2;c.stroke();c.globalAlpha=1;};
  const block=(x,y,ww,hh,col)=>{c.fillStyle=col;c.beginPath();c.roundRect(x,y,ww,hh,7);c.fill();c.strokeStyle='#f8d9b5';c.globalAlpha=.6;c.lineWidth=2;c.stroke();c.globalAlpha=1;};
  const line=(x,y,x2,y2,col=accent,thick=5)=>{c.strokeStyle=col;c.lineWidth=thick;c.lineCap='round';c.beginPath();c.moveTo(x,y);c.lineTo(x2,y2);c.stroke();};
  switch(id){
   case'hoops':c.strokeStyle='#e9ad82';c.lineWidth=8;c.beginPath();c.arc(280,105,36,0,Math.PI*2);c.stroke();line(244,105,316,105,'#e9ad82',7);line(256,110,270,147);line(304,110,290,147);ball(105+move%110,170-bob,17,'#e58a58');break;
   case'skeeball':for(let i=0;i<5;i++){c.strokeStyle=['#d58c76','#e4c08a','#8ec9b7'][i%3];c.lineWidth=8;c.beginPath();c.arc(190,170,35+i*22,Math.PI,Math.PI*2);c.stroke();}ball(65+move%230,190-bob,12,'#f2d8aa');break;
   case'airhockey':block(15,72,354,112,'#324b62');line(192,75,192,180,'#a5c6d5',3);c.strokeStyle='#d7a0a0';c.lineWidth=5;c.beginPath();c.arc(192,128,39,0,Math.PI*2);c.stroke();ball(80+move%220,125+bob,11,'#fff1d4');block(45,115,40,24,'#e58a79');block(300,115,40,24,'#83d1c5');break;
   case'whack':for(let i=0;i<5;i++){const x=45+i*72;c.fillStyle='#30283b';c.beginPath();c.ellipse(x,184,28,13,0,0,Math.PI*2);c.fill();if((i+Math.floor(frame/4))%5===0){ball(x,158-bob,22,'#bd9877');ball(x-8,153-bob,3,'#33283b');ball(x+8,153-bob,3,'#33283b');}}break;
   case'target':for(let i=0;i<3;i++){const x=75+i*116+Math.sin(frame*.2+i)*20;for(let r=24;r>0;r-=8)ball(x,105+i%2*45,r,r===24?'#f2d5a9':r===16?'#db887c':'#f4e8c9');}line(190,190,230,150,'#f2d5a9',5);break;
   case'memory':for(let i=0;i<4;i++){const x=70+(i%2)*115,y=75+Math.floor(i/2)*85;block(x,y,75,58,['#d58a9e','#8bc7b5','#d9b879','#879fce'][i]);if(i===Math.floor(frame/5)%4){c.fillStyle='#fff4d8';c.globalAlpha=.55;c.fillRect(x,y,75,58);c.globalAlpha=1;}}break;
   case'rhythm':for(let i=0;i<5;i++){const x=55+i*68;c.strokeStyle=['#d98ba3','#82c6c0','#e9bd7b'][i%3];c.lineWidth=6;c.beginPath();c.arc(x,130+Math.sin(frame*.3+i)*25,17,0,Math.PI*2);c.stroke();}line(20,204,364,204,'#e6cda9',3);break;
   case'meteor':for(let i=0;i<9;i++){const x=(i*53+frame*2)%384,y=(i*71+frame*4)%200;line(x,y,x-15,y+20,'#f4ad82',4);ball(x,y,5,'#ffd49c');}block(175,174,34,27,'#8ed2c5');break;
   case'racer':block(155,85,76,105,'#34465d');line(192,90,192,190,'#e8d3aa',4);block(65,130+Math.sin(frame*.3)*22,38,52,'#d88878');block(280,110+Math.cos(frame*.3)*24,38,52,'#8dc8bd');block(170,150,42,54,'#f0b36f');break;
   case'stack':for(let i=0;i<5;i++)block(115+(i%2?Math.sin(frame*.2)*16:0),190-i*29,155,25,['#d88f7e','#e4bd83','#83bcae','#a89acb'][i%4]);block(130+Math.sin(frame*.25)*55,35,125,22,'#f3d49b');break;
   case'pinball':for(let i=0;i<7;i++)ball(55+(i%3)*135,70+Math.floor(i/3)*52,10,['#e8b96f','#df8b9c','#8ac7bd'][i%3]);line(115,195,175,145);line(269,195,209,145);ball(190+Math.sin(frame*.3)*60,120+Math.cos(frame*.25)*48,9,'#fff0c9');break;
   case'claw':line(190,25,190,80,'#d8c39b',5);line(190,80,170,102,'#d8c39b',5);line(190,80,210,102,'#d8c39b',5);for(let i=0;i<6;i++)ball(70+i*48,175+(i%2)*8,15,['#d88c99','#8ec9b5','#e7bd78'][i%3]);break;
   case'chef':block(70,115,245,75,'#a65e55');c.strokeStyle='#e9c69a';c.lineWidth=7;c.beginPath();c.ellipse(192,150,70,28,0,0,Math.PI*2);c.stroke();for(let i=0;i<5;i++)ball(120+i*35,140+Math.sin(frame*.25+i)*12,9,['#8bc59b','#e8bd7a','#d98778'][i%3]);line(220,75,180,145,'#e8d1a7',6);break;
   case'sushi':block(75,160,235,26,'#e6d2ad');for(let i=0;i<6;i++){const x=75+((i*63+frame*2)%230);ball(x,90+(i%2)*35,11,['#e78e7d','#8ec6b1','#f1d18d'][i%3]);}break;
   case'mixology':block(140,100,100,100,'#d3a17e');block(151,130,78,65,'#805d85');line(190,35,190,95,'#f2d6a7',6);for(let i=0;i<6;i++)ball(90+i*38,185+Math.sin(frame*.3+i)*5,6,'#f7d99d');break;
   case'pulse':block(25,168,334,20,'#6e6474');for(let i=0;i<4;i++)block(75+i*78,120-(i%2)*34,45,12,'#8cc6b8');block(90+Math.sin(frame*.25)*22,124,25,42,'#83d4c5');ball(290,110+Math.sin(frame*.2)*15,20,'#d77e7c');line(120,145,190,145,'#f2d5a9',4);break;
   case'moto':line(25,192,360,192,'#d5b18a',5);for(let i=0;i<4;i++){const x=(i*115+frame*4)%420-20;ball(x,180,13,'#302c3d');line(x-13,155,x+13,155,'#d58a78',6);}block(190,125+Math.sin(frame*.2)*22,48,25,'#df9b6d');break;
   case'moonquest':block(40,70,304,132,'#3e4d60');for(let i=0;i<3;i++){const x=90+i*100;ball(x,120,13,['#d7c3f4','#9bd8d1','#f0c78b'][i]);}block(175,145+Math.sin(frame*.2)*9,30,40,'#8cc9b8');line(205,142,240,108,'#f5e2bc',5);break;
   default:block(120,90,145,90,accent);
  }
  c.globalAlpha=1;c.fillStyle='#f8dfbd';c.font='bold 15px Fredoka';c.textAlign='left';c.fillText('NEXUS ARCADE',13,24);
  c.fillStyle=accent;c.globalAlpha=.9;c.fillRect(13,232,Math.min(358,90+(frame%90)*3),5);c.globalAlpha=1;
  // A little imperfect brush frame keeps the screens from reading as sterile UI.
  c.strokeStyle='#f4d5ad';c.globalAlpha=.5;c.lineWidth=3;c.beginPath();c.moveTo(5,6);c.lineTo(378,4);c.lineTo(380,250);c.lineTo(4,252);c.closePath();c.stroke();c.globalAlpha=1;
  p.texture.needsUpdate=true;
 }
 const cabinets=[];
 function makeCabinet(def,i,side,z){
  const [name,id,genre,num,color]=def,g=new THREE.Group();g.position.set(side*5.2,0,z);g.rotation.y=side===-1?Math.PI/2:-Math.PI/2;scene.add(g);
  const body=sculptedBox(1.58,2.65,1.05,i%3===0?0x604653:i%3===1?0x4e5664:0x62505d,.16);body.position.y=1.42;body.castShadow=true;g.add(body);
  // Rounded lower kick plate, cabinet feet, hand-shaped side badges.
  box(1.36,.25,.92,-.02,.18,0,clayMat(0x382d3d),g,.08);
  for(const x of [-.55,.55])cyl(.12,.14,.18,x,.09,.02,mat(0x302735),g);
  const bezel=box(1.32,1.05,.16,0,1.72,.56,clayMat(0x302c42),g,.12);
  const preview=makeCabinetPreview(id,color),screenTex=preview.texture;
  const screen=new THREE.Mesh(new RoundedBoxGeometry(1.12,.79,.035,4,.08),new THREE.MeshStandardMaterial({map:screenTex,emissive:color,emissiveIntensity:.13,roughness:.58}));screen.position.set(0,1.77,.66);g.add(screen);
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
  const discoveryRing=new THREE.Mesh(new THREE.RingGeometry(.92,1.12,48),new THREE.MeshBasicMaterial({color:color,transparent:true,opacity:.62,side:THREE.DoubleSide,depthWrite:false}));discoveryRing.rotation.x=-Math.PI/2;discoveryRing.position.set(side*5.2,.035,z);discoveryRing.visible=false;scene.add(discoveryRing);
  g.userData={name,id,genre,index:i,screen,screenTex,preview,marquee:marqScreen,lamp,discoveryRing,baseY:1.42};
  cabinets.push(g);
  // Hand-painted floor decal, small and slightly rotated.
  const decal=box(1.9,.025,1.1,side*5.2,.005,z+ (side===-1?1.2:-1.2),mat(0x9b7180,.95),scene,.2);decal.rotation.y=(i%2)*.035;
 }
 definitions.forEach((d,i)=>{const side=i<9?-1:1,slot=i%9;makeCabinet(d,i,side,-18.5+slot*4.35);});
 // Plush prize mound and a little ticket counter make the far wall a destination.
 const prizeGroup=new THREE.Group();prizeGroup.position.set(0,0,-23.4);scene.add(prizeGroup);
 box(4.3,1.4,1.4,0,.7,0,clayMat(0x795064),prizeGroup,.18);box(4.5,.12,1.5,0,1.46,0,mat(0xffc77e,.4,0,0xff9e5b,.8),prizeGroup,.06);
 for(let i=0;i<7;i++){const x=-1.55+(i%4)*1.02,y=1.9+Math.floor(i/4)*.2;const plush=sphere(.36,x,y,.12,clayMat([0xd58f94,0x8dc4ae,0x9d94cb,0xe6b66e][i%4]),prizeGroup,1,.9,.82);sphere(.08,x-.12,y+.05,.42,mat(0x32283b),prizeGroup);sphere(.08,x+.12,y+.05,.42,mat(0x32283b),prizeGroup);}
 // Hand-sculpted host character with eyes, cheeks and a gentle idle sway.
 const host=new THREE.Group();host.position.set(0,0,-21.3);scene.add(host);
 const hostBody=sphere(.42,0,.92,0,clayMat(0xd98e82),host,.85,1.2,.72);
 sphere(.36,0,1.62,.02,clayMat(0xeac09e),host,1,.95,.86);
 for(const x of [-.13,.13])sphere(.045,x,1.69,.31,mat(0x33283b),host);
 for(const x of [-.23,.23])sphere(.075,x,1.48,.26,clayMat(0xe78d87),host);
 const smile=new THREE.Mesh(new THREE.TorusGeometry(.09,.018,8,18,Math.PI),mat(0x7c4855));smile.position.set(0,1.48,.31);smile.rotation.z=Math.PI;host.add(smile);
 // Host gestures are driven by articulated clay arms, not whole-body wobble.
 const hostArms=[];
 for(const side of [-1,1]){
  const pivot=new THREE.Group();pivot.position.set(side*.34,1.13,0);host.add(pivot);hostArms.push(pivot);
  const sleeve=new THREE.Mesh(new THREE.CapsuleGeometry(.105,.34,4,10),clayMat(0x76506c));sleeve.position.set(side*.035,-.2,0);sleeve.rotation.z=-side*.12;pivot.add(sleeve);
  sphere(.105,side*.05,-.42,.025,clayMat(0xeac09e),pivot,.9,.95,.85);
  for(let f=0;f<3;f++)sphere(.022,side*.05+(f-1)*.04,-.5,.055,clayMat(0xeac09e),pivot,.8,1,.8);
 }
 const hostHead=sphere(.055,0,1.96,.03,clayMat(0xeac09e),host,.9,.7,.7);
 const hostEyeLids=[];
 for(const side of [-1,1]){const lid=sphere(.05,side*.13,1.68,.34,clayMat(0xeac09e),host,1,.015,.4);hostEyeLids.push(lid);}
 let hostWelcomeUntil=0,hostBlinkAt=2.7,hostBlinkUntil=0;
 // The restaurant is part of this same continuous floor: no scene swap or second page.
 const dining= new THREE.Group();scene.add(dining);
 const wood=clayMat(0x80564b),cream=clayMat(0xf0d3a8),brass=mat(0xd6a15f,.38,.35,0x9c6130,.22),leaf=clayMat(0x6c9b78);
 // Open kitchen and bar counter along the east wall, with a visible pass-through.
 box(5.8,1.35,1.25,8.8,.72,-1.8,wood,dining,.2);
 box(5.95,.16,1.35,8.8,1.46,-1.8,cream,dining,.12);
 box(5.5,.1,.12,8.8,1.57,-1.22,brass,dining,.04);
 for(let i=0;i<3;i++){const stool=cyl(.28,.32,.16,7+i*1.8,.48,-.45,wood,dining);cyl(.07,.07,.8,7+i*1.8,.15,-.45,brass,dining);}
 // Kitchen wall, tiled backsplash, shelves, warm pendants and cookware silhouettes.
 box(6,.12,.3,8.8,2.65,-2.5,cream,dining,.06);box(6,.1,.22,8.8,3.5,-2.5,wood,dining,.04);
 for(let i=0;i<5;i++){box(.08,.75,.08,6.4+i*1.2,3.05,-2.55,brass,dining,.03);sphere(.22,6.4+i*1.2,3.35,-2.35,clayMat([0xd88b69,0x8fb9a1,0xe3bd79][i%3]),dining,.7,.9,.35);}
 for(let i=0;i<3;i++){cyl(.08,.08,.45,7.1+i*1.7,4.5,-1.7,brass,dining);sphere(.32,7.1+i*1.7,4.22,-1.7,mat(0xffca85,.4,0,0xffa64f,.8),dining,1,.28,1);}
 const barSign=box(3.6,.7,.18,8.8,4.35,-2.4,clayMat(0x513749),dining,.12);
 const barTexture=textTexture('THE GLOW BAR','KITCHEN · JUICE · MOCKTAILS','#ffc88a');const barPlane=new THREE.Mesh(new THREE.PlaneGeometry(3.3,.52),new THREE.MeshBasicMaterial({map:barTexture}));barPlane.position.set(8.8,4.35,-2.29);dining.add(barPlane);
 // Tiny clay staff animate behind the open counter.
 const serviceStaff=[];
 function makeStaff(x,z,shirt,hat,role){
  const g=new THREE.Group();g.position.set(x,0,z);dining.add(g);
  const body=sphere(.33,0,1.27,0,clayMat(shirt),g,.95,1.15,.8);
  const headPivot=new THREE.Group();headPivot.position.set(0,1.55,0);g.add(headPivot);
  sphere(.31,0,0,0,clayMat(0xe7b997),headPivot,.95,1,.88);
  for(const ex of [-.1,.1]){sphere(.035,ex,.045,.27,mat(0x302638),headPivot);sphere(.012,ex-.01,.06,.3,mat(0xffffff),headPivot);}
  sphere(.045,0,-.12,.28,clayMat(0xd58d80),headPivot,.8,.55,.5);
  const lids=[];for(const ex of [-.1,.1])lids.push(sphere(.038,ex,.095,.29,clayMat(0xe7b997),headPivot,1,.012,.35));
  const cheeks=[sphere(.055,-.19,-.09,.245,clayMat(0xe78e88),headPivot,.9,.55,.35),sphere(.055,.19,-.09,.245,clayMat(0xe78e88),headPivot,.9,.55,.35)];
  const smile=new THREE.Mesh(new THREE.TorusGeometry(.075,.012,7,16,Math.PI),clayMat(0x8b5057));smile.position.set(0,-.15,.285);smile.rotation.z=Math.PI;headPivot.add(smile);
  const brows=[sphere(.065,-.1,.16,.27,clayMat(0x654b4d),headPivot,1,.2,.35),sphere(.065,.1,.16,.27,clayMat(0x654b4d),headPivot,1,.2,.35)];
  if(hat){cyl(.2,.24,.12,0,.36,0,cream,headPivot);sphere(.2,0,.46,0,cream,headPivot,1,.7,1);}else sphere(.34,0,.29,-.03,clayMat(0x574052),headPivot,1,.34,.9);
  const arms=[];
  for(const side of [-1,1]){
   const pivot=new THREE.Group();pivot.position.set(side*.29,1.43,.015);g.add(pivot);arms.push(pivot);
   const sleeve=new THREE.Mesh(new THREE.CapsuleGeometry(.105,.31,4,10),clayMat(shirt));sleeve.position.set(side*.025,-.2,0);sleeve.rotation.z=-side*.1;pivot.add(sleeve);
   const fore=new THREE.Mesh(new THREE.CapsuleGeometry(.082,.27,4,9),clayMat(0xe7b997));fore.position.set(side*.04,-.48,.035);pivot.add(fore);
   sphere(.09,side*.045,-.65,.06,clayMat(0xe7b997),pivot,.9,.85,.8);
  }
  let prop=null,propPivot=null;
  if(role==='bartender'){
   // A tiny glass and folded polishing cloth make the counter work readable.
   propPivot=new THREE.Group();propPivot.position.set(.04,-.67,.12);arms[1].add(propPivot);
   cyl(.075,.09,.18,0,.08,0,mat(0x9ed8d0,.2,0,0x4da9a0,.15),propPivot);
   cyl(.072,.072,.012,0,.17,0,mat(0xffe3b4,.3),propPivot);
   prop=box(.16,.035,.11,-.12,.02,.015,clayMat(0xf0c7a0),propPivot,.025);
  }else{
   // The chef holds a wooden spoon over a small steaming stock pot.
   propPivot=new THREE.Group();propPivot.position.set(.04,-.67,.1);arms[1].add(propPivot);
   const spoon=cyl(.018,.025,.42,0,.18,0,clayMat(0x9b684b),propPivot);spoon.rotation.z=-.16;
   sphere(.065,0,.4,0,clayMat(0x9b684b),propPivot,.7,1.25,.65);
   cyl(.24,.28,.22,.22,.95,.28,clayMat(0x5d5260),g);
   cyl(.22,.22,.025,.22,1.08,.28,mat(0x786f78),g);
   const steamMat=new THREE.MeshBasicMaterial({color:0xffdfc4,transparent:true,opacity:.25});
   for(let i=0;i<3;i++){const steam=new THREE.Mesh(new THREE.SphereGeometry(.035,8,7),steamMat);steam.position.set(.12+i*.09,1.28+i*.04,.28);g.add(steam);steam.userData.phase=i*1.9;(g.userData.steam||(g.userData.steam=[])).push(steam);}
  }
  const staff={group:g,arms,head:headPivot,lids,cheeks,smile,brows,role,propPivot,body,phase:role==='bartender'?.7:2.1,near:false,blinkAt:2.2,blinkUntil:0,reactionUntil:0,emotion:'neutral'};
  serviceStaff.push(staff);return staff;
 }
 makeStaff(8.7,-2.9,0x8bb8a2,false,'bartender');makeStaff(10.4,-5.2,0xd58b79,true,'chef');
 makeStaff(8.7,-2.9,0x8bb8a2,false);makeStaff(10.4,-5.2,0xd58b79,true);
 // Host podium and a friendly reservation bell.
 box(1.45,1.2,.85,1.4,.62,10.2,clayMat(0x98605e),dining,.15);box(1.52,.12,.92,1.4,1.26,10.2,cream,dining,.08);cyl(.09,.12,.12,1.4,1.4,10.2,brass,dining);
 const hostSign=box(2.4,.55,.16,1.4,2.25,10.15,clayMat(0x594052),dining,.1);const hostTex=textTexture('HOST','PLEASE WAIT TO BE SEATED','#ffe0ae');const hostPlane=new THREE.Mesh(new THREE.PlaneGeometry(2.2,.42),new THREE.MeshBasicMaterial({map:hostTex}));hostPlane.position.set(1.4,2.25,10.25);dining.add(hostPlane);
 // Three intimate tables, upholstered chairs, plates, napkins and a centrepiece.
 const tables=[];
 function makeTable(x,z,i){const g=new THREE.Group();g.position.set(x,0,z);dining.add(g);cyl(.78,.86,.18,0,1.05,0,cream,g);cyl(.12,.16,1,0,.5,0,wood,g);for(let a=0;a<4;a++){const ang=a*Math.PI/2;box(.58,.18,.58,Math.cos(ang)*1.15,.55,Math.sin(ang)*1.15,clayMat(0x9a6862),g,.12);box(.64,.12,.64,Math.cos(ang)*1.15,.93,Math.sin(ang)*1.15,clayMat(0xd6a58d),g,.1);}for(let a=0;a<3;a++){cyl(.22,.22,.035,-.35+a*.35,1.16,.08,mat(0xfff0d3,.3),g);sphere(.08,-.35+a*.35,1.22,.08,clayMat([0xd67f70,0x88bca3,0xe3bc70][a]),g,.7,.4,.7);}tables.push({group:g,position:new THREE.Vector3(x,0,z),number:i});}
 makeTable(5.8,5.3,1);makeTable(9.1,7.8,2);makeTable(5.7,10.5,3);
 // Two full-size, walk-up floor attractions sit in the open centre of the district.
 const gameTables=[];
 function makeAirHockeyTable(){
  const g=new THREE.Group();g.position.set(-2.35,0,-2.1);scene.add(g);
  box(3.55,.34,2.08,0,.69,0,clayMat(0x604653),g,.2);
  box(3.38,.12,1.91,0,.91,0,mat(0x8bc9c3,.34,.08),g,.12);
  box(3.18,.045,1.71,0,.995,0,new THREE.MeshStandardMaterial({map:airFelt,roughness:.72,bumpMap:grain,bumpScale:.025}),g,.08);
  for(const z of [-.91,.91])box(3.45,.19,.12,0,1.08,z,clayMat(0xe1b17e),g,.06);
  for(const x of [-1.69,1.69])box(.12,.19,1.78,x,1.08,0,clayMat(0xd69b78),g,.06);
  box(.07,.012,1.55,0,1.025,0,mat(0xf8ead0,.4),g,.02);
  const centre=new THREE.Mesh(new THREE.TorusGeometry(.36,.018,8,40),mat(0xf8ead0,.35));centre.rotation.x=Math.PI/2;centre.position.set(0,1.035,0);g.add(centre);
  for(const x of [-.73,.73]){const goal=box(.48,.08,.13,x,1.04,-.91,mat(0x493a50,.5),g,.04);goal.position.z=-.91;}
  const puck=sphere(.105,0,1.11,0,mat(0xf7e9ce,.22,.12,0xffffff,.08),g,1,.28,1);
  const mallets=[sphere(.22,-1.05,1.12,.48,clayMat(0xe58b79),g,1,.42,1),sphere(.22,1.05,1.12,-.48,clayMat(0x7fc8bf),g,1,.42,1)];
  const railGlow=mat(0x83d9d1,.32,.08,0x5bd5ce,.42);
  for(const x of [-1.72,1.72])box(.035,.045,1.72,x,1.2,0,railGlow,g,.015);
  gameTables.push({gameId:'airhockey',name:'COMET AIR HOCKEY',position:new THREE.Vector3(-2.35,0,-2.1),group:g,puck,mallets});
 }
 function makeBilliardsTable(){
  const g=new THREE.Group();g.position.set(2.35,0,-2.1);scene.add(g);
  box(3.55,.4,2.12,0,.68,0,clayMat(0x65474a),g,.2);
  box(3.38,.15,1.96,0,.93,0,clayMat(0x95665a),g,.13);
  box(3.12,.055,1.7,0,1.035,0,new THREE.MeshStandardMaterial({map:poolFelt,roughness:.88,bumpMap:grain,bumpScale:.04}),g,.06);
  for(const z of [-.91,.91])box(3.32,.16,.14,0,1.09,z,clayMat(0x9b6a55),g,.06);
  for(const x of [-1.64,1.64])box(.14,.16,1.72,x,1.09,0,clayMat(0x9b6a55),g,.06);
  const pocketMat=mat(0x241f31,.62);
  for(const x of [-1.54,0,1.54])for(const z of [-.82,.82]){const pocket=sphere(.14,x,1.075,z,pocketMat,g,1,.28,1);pocket.castShadow=false;}
  const ballMats=[0xe9d8a8,0xe6a05f,0x78a9c0,0xd77e79,0x9d87bd,0x82b58d];
  const rack=[];for(let row=0;row<5;row++)for(let col=0;col<=row;col++){const n=rack.length+1,x=(col-row/2)*.205,z=-.35+row*.205;const color=n===8?0x252638:ballMats[(n-1)%ballMats.length];const b=sphere(.092,x,1.115,z,mat(color,.24,.08),g);b.userData.number=n;rack.push(b);}
  sphere(.092,0,1.115,.55,mat(0xf5eddb,.2),g);
  const brassCorners=mat(0xe2b77d,.35,.35);
  for(const x of [-1.6,1.6])for(const z of [-.92,.92])sphere(.065,x,1.18,z,brassCorners,g);
  gameTables.push({gameId:'billiards',name:'MOONLIGHT BILLIARDS',position:new THREE.Vector3(2.35,0,-2.1),group:g,rack});
 }
 makeAirHockeyTable();makeBilliardsTable();
 // A dedicated prize counter makes ticket redemption a destination, not another restaurant menu.
 const prizeCounterPosition=new THREE.Vector3(-8.55,0,4.7),prizeCounter=new THREE.Group();prizeCounter.position.copy(prizeCounterPosition);scene.add(prizeCounter);
 box(3.45,.82,1.15,0,.62,0,clayMat(0x694b58),prizeCounter,.18);
 box(3.58,.16,1.25,0,1.08,0,clayMat(0xd7a875),prizeCounter,.12);
 box(3.15,.78,.88,0,1.57,-.04,new THREE.MeshStandardMaterial({color:0xb8d9d0,transparent:true,opacity:.19,roughness:.16,metalness:.08}),prizeCounter,.08);
 for(const x of [-1.48,1.48])box(.09,.78,.94,x,1.57,-.04,clayMat(0xe3b98a),prizeCounter,.04);
 box(3.08,.08,.9,0,1.22,-.04,clayMat(0x9b6d68),prizeCounter,.05);
 const prizeColors=[0xe58b79,0x8fc4b7,0xd9b16f,0x9d8ac0,0x83a9cb];
 for(let i=0;i<5;i++){const x=-1.15+i*.57;const plush=sphere(.22,x,1.55,.12,clayMat(prizeColors[i]),prizeCounter,.82,1.05,.72);sphere(.075,x-.07,1.59,.29,mat(0xfff0d9,.4),prizeCounter,.55,.7,.3);sphere(.075,x+.07,1.59,.29,mat(0xfff0d9,.4),prizeCounter,.55,.7,.3);sphere(.035,x-.07,1.59,.315,mat(0x30283b,.3),prizeCounter);sphere(.035,x+.07,1.59,.315,mat(0x30283b,.3),prizeCounter);}
 const capsuleColors=[0xe98b77,0x86c7b9,0xe7c37b];for(let i=0;i<3;i++){const c=sphere(.13,-.82+i*.34,1.43,-.29,clayMat(capsuleColors[i]),prizeCounter,.82,1,.82);c.rotation.z=i*.2;}
 const prizeSign=new THREE.Mesh(new THREE.PlaneGeometry(3.25,.58),new THREE.MeshBasicMaterial({map:textTexture('PRIZE EXCHANGE','TRADE TICKETS FOR TREASURES','#ffd18b'),transparent:false}));prizeSign.position.set(0,2.42,.64);prizeCounter.add(prizeSign);
 const prizeTrim=mat(0xffc77d,.35,.05,0xffa44f,.75);box(3.65,.055,.055,0,2.73,.61,prizeTrim,prizeCounter,.02);
 const services=[{type:'bar',name:'GLOW BAR · ORDER FOOD & DRINKS',position:new THREE.Vector3(8.8,0,-.2)},{type:'pass',name:'KITCHEN PASS · COLLECT ORDERS',position:new THREE.Vector3(8.8,0,2.2)},{type:'prize',name:'PRIZE EXCHANGE · REDEEM TICKETS',position:prizeCounterPosition},{type:'host',name:'HOST STAND · REQUEST A TABLE',position:new THREE.Vector3(1.4,0,10.2)},...tables.map(t=>({type:'table',name:'TABLE '+t.number+' · TAKE A SEAT',position:t.position,table:t.number}))];
 // Player avatar: a fully modelled, hand-sculpted clay character rather than a flat blob.
 const player=new THREE.Group();scene.add(player);player.position.set(0,0,13);
 const skin=clayMat(0xe8b895),skinLight=clayMat(0xf2c7a4),hairMat=clayMat(0x493342),hairLight=clayMat(0x654451),hoodMat=clayMat(0x6d9f9b),hoodLight=clayMat(0x8cc4b8),trouserMat=clayMat(0x514252),shoeMat=clayMat(0x3b3445),soleMat=clayMat(0xd8b48f),eyeWhite=mat(0xfff0d9,.48),irisMat=mat(0x6a807a,.42),pupilMat=mat(0x29283a,.3),glintMat=mat(0xffffff,.2,0,0xffffff,.2);
 const torso=new THREE.Group();torso.position.y=1.02;player.add(torso);
 const jacket=sculptedBox(.78,.88,.48,0x78b5ad,.22);jacket.position.y=.02;torso.add(jacket);
 const hood=sphere(.34,0,.42,-.19,hoodMat,torso,1,.8,.7);
 const hoodRim=new THREE.Mesh(new THREE.TorusGeometry(.27,.055,10,28,Math.PI*1.35),hoodLight);hoodRim.position.set(0,.45,-.11);hoodRim.rotation.x=.2;hoodRim.rotation.z=Math.PI*.82;torso.add(hoodRim);
 const collar=new THREE.Mesh(new THREE.TorusGeometry(.22,.065,9,24),hoodLight);collar.position.set(0,.39,.015);collar.rotation.x=Math.PI/2;torso.add(collar);
 const zipper=box(.025,.65,.035,.015,.02,.254,mat(0xf0c58d,.42,.18),torso,.012);
 sphere(.045,.015,-.27,.27,brass,torso,.65,1.1,.55);
 const pocketL=sculptedBox(.22,.2,.045,0x619b94,.035);pocketL.position.set(-.22,-.19,.258);torso.add(pocketL);
 const pocketR=sculptedBox(.22,.2,.045,0x619b94,.035);pocketR.position.set(.22,-.19,.258);torso.add(pocketR);
 sphere(.09,-.23,.2,.29,clayMat(0xf0b979),torso,.9,1,.28);
 sphere(.027,-.23,.2,.32,mat(0x704c62),torso);
 function stitch(points,radius=.009,color=0xd7c3a2,parent=torso){const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));const mesh=new THREE.Mesh(new THREE.TubeGeometry(curve,24,radius,5,false),clayMat(color));parent.add(mesh);return mesh;}
 stitch([[-.34,.31,.22],[-.27,.38,.245],[-.15,.4,.25],[0,.38,.255],[.15,.4,.25],[.28,.36,.24],[.35,.29,.21]],.012,0x9bcec0);
 stitch([[-.36,-.28,.2],[-.28,-.37,.24],[-.18,-.39,.25]],.008,0xb4d7c6);
 cyl(.12,.14,.22,0,1.51,.005,skin,player);
 const head=new THREE.Group();head.position.set(0,1.88,.015);player.add(head);
 const arms=[],legs=[],hands=[],blinkLids=[],hairCurls=[];
 sphere(.345,0,0,0,skin,head,1,.99,.88);sphere(.28,0,-.045,-.12,skinLight,head,1,.94,.76);
 for(const side of [-1,1]){
  sphere(.092,side*.326,-.015,-.005,skin,head,.72,1,.72);sphere(.039,side*.35,-.018,.047,clayMat(0xd68f83),head,.6,.85,.5);
  sphere(.105,side*.19,-.12,.215,clayMat(0xe9a08e),head,.9,.65,.35);
  for(let f=0;f<3;f++)sphere(.012,side*(.18+f*.035),-.105+(f%2)*.035,.25,mat(0xb9786d),head,.7,.7,.4);
  const eye=new THREE.Group();eye.position.set(side*.125,.055,.278);head.add(eye);
  sphere(.086,0,0,0,eyeWhite,eye,1,.92,.5);sphere(.049,0,-.003,.034,irisMat,eye,1,.98,.48);
  sphere(.026,0,-.003,.055,pupilMat,eye,1,.98,.45);sphere(.012,-.017,.021,.072,glintMat,eye,.8,.8,.5);
  const lid=sphere(.087,0,.09,.006,skinLight,eye,1,.015,.42);blinkLids.push(lid);
  const brow=sphere(.105,side*.128,.17,.27,hairMat,head,1,.27,.42);brow.rotation.z=side*.12;brow.userData.restZ=brow.rotation.z;brow.userData.side=side;brow.name='expressive-brow';
 }
 sphere(.055,0,-.015,.305,skin,head,.78,1.35,.75);sphere(.072,0,-.075,.34,skinLight,head,1,.72,.72);
 const mouthCurve=new THREE.CatmullRomCurve3([new THREE.Vector3(-.09,-.145,.285),new THREE.Vector3(-.045,-.18,.318),new THREE.Vector3(.015,-.185,.32),new THREE.Vector3(.085,-.145,.285)]);
 head.add(new THREE.Mesh(new THREE.TubeGeometry(mouthCurve,16,.012,7,false),mat(0x8e4f58,.72)));
 sphere(.032,0,-.22,.275,clayMat(0xd8897d),head,.9,.35,.35);
 const hairCap=sphere(.315,0,.205,-.035,hairMat,head,1.08,.58,.96);
 sphere(.16,-.2,.11,.075,hairLight,head,.7,.78,.8);sphere(.16,.2,.1,.075,hairMat,head,.72,.8,.8);
 for(let i=0;i<9;i++){const a=-1.15+i*.285,x=Math.sin(a)*.255,y=.27+Math.cos(a)*.115,z=.035+Math.cos(a)*.08;const curl=sphere(.105,x,y,z,i%3===0?hairLight:hairMat,head,.95,.72,.88);curl.rotation.z=Math.sin(i*2)*.2;curl.userData.phase=i*1.7;hairCurls.push(curl);}
 const fringe=sphere(.16,-.045,.16,.245,hairLight,head,1.2,.55,.55);fringe.rotation.z=-.25;
 function makeArm(side){
  const pivot=new THREE.Group();pivot.position.set(side*.39,1.34,.005);torso.add(pivot);arms.push(pivot);
  const upper=new THREE.Mesh(new THREE.CapsuleGeometry(.135,.39,5,12),hoodMat);upper.position.y=-.235;upper.rotation.z=-side*.12;upper.castShadow=true;pivot.add(upper);
  sphere(.13,side*.025,-.45,.01,hoodMat,pivot);
  const fore=new THREE.Mesh(new THREE.CapsuleGeometry(.112,.34,5,12),hoodLight);fore.position.set(side*.035,-.64,.015);fore.rotation.z=side*.08;fore.castShadow=true;pivot.add(fore);
  cyl(.12,.115,.11,side*.035,-.82,.015,hoodMat,pivot);
  const hand=new THREE.Group();hand.position.set(side*.035,-.91,.035);pivot.add(hand);hands.push(hand);sphere(.115,0,-.025,.015,skin,hand,.9,.9,.82);
  for(let f=0;f<4;f++){const finger=new THREE.Mesh(new THREE.CapsuleGeometry(.027,.075,3,7),skinLight);finger.position.set((f-1.5)*.045,-.105,.035);finger.rotation.z=(f-1.5)*-.12;hand.add(finger);}
  sphere(.032,side*.1,-.035,.045,skin,hand,.9,1,.8);
  return pivot;
 }
 makeArm(-1);makeArm(1);
 function makeLeg(side){
  const pivot=new THREE.Group();pivot.position.set(side*.19,.64,0);player.add(pivot);legs.push(pivot);
  const thigh=new THREE.Mesh(new THREE.CapsuleGeometry(.145,.34,5,12),trouserMat);thigh.position.y=-.19;thigh.castShadow=true;pivot.add(thigh);
  sphere(.13,0,-.38,.01,trouserMat,pivot,.98,1,.95);
  const shin=new THREE.Mesh(new THREE.CapsuleGeometry(.12,.27,5,12),trouserMat);shin.position.set(0,-.54,.005);shin.castShadow=true;pivot.add(shin);
  cyl(.11,.12,.1,0,-.7,.01,trouserMat,pivot);
  const shoe=new THREE.Group();shoe.position.set(0,-.55,.09);pivot.add(shoe);
  sphere(.16,0,-.015,.045,shoeMat,shoe,1,.72,1.35);sphere(.12,0,-.045,.12,clayMat(0x625466),shoe,1,.48,1.05);
  const sole=new THREE.Mesh(new THREE.CapsuleGeometry(.115,.12,4,10),soleMat);sole.rotation.x=Math.PI/2;sole.position.set(0,-.095,.05);sole.scale.set(1,.52,1.25);shoe.add(sole);
  for(let lace=0;lace<3;lace++)box(.09,.012,.018,(lace-1)*.025,-.005-lace*.012,.11+lace*.012,mat(0xe6d4b6),shoe,.006);
  return pivot;
 }
 makeLeg(-1);makeLeg(1);
 const keys=new Set(),touch={x:0,y:0,targetX:0,targetY:0},motion={x:0,z:0};let nearest=null,activeService=null,activeTableGame=null,walk=0,nextBlink=2.4,blinkUntil=0,gesture='idle',gestureStarted=0,gestureUntil=0;
 const prompt=document.querySelector('#arcade-world-prompt'),interact=document.querySelector('#arcade-interact'),pad=document.querySelector('#arcade-touch-pad'),knob=document.querySelector('#arcade-joystick');
 const gameOverlay=document.querySelector('#overlay'),serviceModal=document.querySelector('#service-modal'),reduceMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const discovery=document.querySelector('#cabinet-discovery'),discoveryTitle=document.querySelector('#discovery-title'),discoveryGenre=document.querySelector('#discovery-genre'),discoveryDescription=document.querySelector('#discovery-description'),discoveryChallenge=document.querySelector('#discovery-challenge'),discoveryControls=document.querySelector('#discovery-controls'),discoveryAction=document.querySelector('#discovery-action');
 function triggerGesture(type,duration=1.35){gesture=type;gestureStarted=clock.elapsedTime;gestureUntil=gestureStarted+duration;}
 function useCabinet(){if(!nearest)return;triggerGesture('excited',1.1);window.dispatchEvent(new CustomEvent('nexus:arcade-play',{detail:{gameId:nearest.userData.id}}));}
 function useService(){if(!activeService)return;triggerGesture('wave',1.55);window.dispatchEvent(new CustomEvent('nexus:service-open',{detail:{service:activeService.type,table:activeService.table||null}}));}
 function useTableGame(){if(!activeTableGame)return;triggerGesture('excited',1.1);window.dispatchEvent(new CustomEvent('nexus:table-play',{detail:{gameId:activeTableGame.gameId}}));}
 window.addEventListener('nexus:character-celebrate',()=>triggerGesture('celebrate',2.1));
 window.addEventListener('nexus:character-wave',()=>triggerGesture('wave',1.55));
 interact.addEventListener('click',()=>{if(activeService)useService();else if(activeTableGame)useTableGame();else useCabinet();});
 window.addEventListener('keydown',e=>{if(!document.querySelector('#overlay').hidden||!document.querySelector('#service-modal').hidden)return;const k=e.key.toLowerCase();if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright','e'].includes(k)){e.preventDefault();keys.add(k);}if(k==='e'){if(activeService)useService();else if(activeTableGame)useTableGame();else useCabinet();}});
 window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));window.addEventListener('blur',()=>keys.clear());
 if(pad){let pid=null;const setTarget=e=>{const r=pad.getBoundingClientRect(),dx=e.clientX-r.left-r.width/2,dy=e.clientY-r.top-r.height/2,len=Math.max(1,Math.hypot(dx,dy)),scale=Math.min(1,len/(r.width*.32));touch.targetX=dx/len*scale;touch.targetY=dy/len*scale;};pad.addEventListener('pointerdown',e=>{pid=e.pointerId;pad.setPointerCapture(pid);setTarget(e);});pad.addEventListener('pointermove',e=>{if(pid===e.pointerId)setTarget(e);});const stop=e=>{if(pid!==null&&(!e||e.pointerId===pid)){pid=null;touch.targetX=touch.targetY=0;}};pad.addEventListener('pointerup',stop);pad.addEventListener('pointercancel',stop);pad.addEventListener('lostpointercapture',stop);}
 const ray=new THREE.Raycaster(),pointer=new THREE.Vector2();
 renderer.domElement.addEventListener('pointerdown',e=>{const r=renderer.domElement.getBoundingClientRect();pointer.x=(e.clientX-r.left)/r.width*2-1;pointer.y=-(e.clientY-r.top)/r.height*2+1;ray.setFromCamera(pointer,camera);const hits=ray.intersectObjects(cabinets,true);if(hits.length){let o=hits[0].object;while(o.parent&&!o.userData.id)o=o.parent;if(o.userData.id&&player.position.distanceTo(o.position)<4.1){nearest=o;useCabinet();}}});
 window.addEventListener('nexus:order-created',()=>{const chef=serviceStaff.find(s=>s.role==='chef');if(chef){chef.reactionUntil=clock.elapsedTime+2.4;chef.emotion='focused';}});
 window.addEventListener('nexus:order-ready',()=>{serviceStaff.forEach(s=>{s.reactionUntil=clock.elapsedTime+2.8;s.emotion='happy';});triggerGesture('celebrate',1.35);});
 window.addEventListener('nexus:order-served',()=>{const chef=serviceStaff.find(s=>s.role==='chef');if(chef){chef.reactionUntil=clock.elapsedTime+2;s.emotion='proud';}});
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),clock=new THREE.Clock(),cameraTarget=new THREE.Vector3();let previewSetCache=new Set(),nextPreviewRefresh=0,moteFrame=0;
 function resize(){const w=Math.max(1,mount.clientWidth),h=Math.max(1,mount.clientHeight),aspect=w/h,viewHeight=Math.max(26,16/aspect);camera.left=-viewHeight*aspect/2;camera.right=viewHeight*aspect/2;camera.top=viewHeight/2;camera.bottom=-viewHeight/2;camera.updateProjectionMatrix();renderer.setSize(w,h,false);}new ResizeObserver(resize).observe(mount);resize();
 function update(dt,t){
  if(t>=nextBlink){blinkUntil=t+.13;nextBlink=t+2.8+((Math.sin(t*4.7)+1)*.75);}
  const blink=blinkUntil>t?Math.sin(Math.PI*(t-(blinkUntil-.13))/.13):0;
  blinkLids.forEach(lid=>{lid.scale.y=.015+Math.max(0,blink)*.96;lid.position.y=.09-Math.max(0,blink)*.055;});
  head.rotation.x=Math.sin(t*.83)*.018;head.rotation.z=Math.sin(t*.61)*.012;
  hairCurls.forEach(curl=>{const phase=t*7.54+curl.userData.phase;curl.rotation.z=Math.sin(phase)*.025;curl.scale.y=.72+Math.sin(phase+1)*.012;});
  const inputEase=1-Math.exp(-dt*22);touch.x+=(touch.targetX-touch.x)*inputEase;touch.y+=(touch.targetY-touch.y)*inputEase;
  let x=((keys.has('d')||keys.has('arrowright'))?1:0)-((keys.has('a')||keys.has('arrowleft'))?1:0)+touch.x;
  let z=((keys.has('s')||keys.has('arrowdown'))?1:0)-((keys.has('w')||keys.has('arrowup'))?1:0)+touch.y;
  const len=Math.hypot(x,z);if(len>1){x/=len;z/=len;}const response=1-Math.exp(-dt*(len>.06?19:14));motion.x+=(x*5.1-motion.x)*response;motion.z+=(z*5.1-motion.z)*response;const speed=Math.hypot(motion.x,motion.z);if(speed>.018){const nextX=clamp(player.position.x+motion.x*dt,-9.7,9.7),nextZ=clamp(player.position.z+motion.z*dt,-23.5,22);const blockedX=gameTables.some(table=>Math.abs(nextX-table.position.x)<2.16&&Math.abs(player.position.z-table.position.z)<1.43)||(Math.abs(nextX-prizeCounterPosition.x)<2.05&&Math.abs(player.position.z-prizeCounterPosition.z)<1.12),blockedZ=gameTables.some(table=>Math.abs(player.position.x-table.position.x)<2.16&&Math.abs(nextZ-table.position.z)<1.43)||(Math.abs(player.position.x-prizeCounterPosition.x)<2.05&&Math.abs(nextZ-prizeCounterPosition.z)<1.12);if(!blockedX)player.position.x=nextX;if(!blockedZ)player.position.z=nextZ;player.rotation.y=Math.atan2(motion.x,motion.z);walk+=dt*(6+speed*1.15);torso.position.y=1.02+Math.abs(Math.sin(walk))*.035;arms.forEach((arm,i)=>{arm.rotation.x=Math.sin(walk+i*Math.PI)*.34;arm.rotation.z=(i===0?-.08:.08)+Math.sin(walk+i*Math.PI)*.045;});legs.forEach((leg,i)=>leg.rotation.x=Math.sin(walk+i*Math.PI)*.48);}else{motion.x=motion.z=0;torso.position.y=1.02+Math.sin(t*2.1)*.012;torso.rotation.z=Math.sin(t*.9)*.012;arms.forEach((arm,i)=>{arm.rotation.x=Math.sin(t*1.7+i*1.2)*.035;arm.rotation.z=(i===0?-.08:.08)+Math.sin(t*1.3+i)*.018;});legs.forEach(leg=>leg.rotation.x*=.82);}
  if(gesture!=='idle'&&t<gestureUntil){
   const fade=Math.sin(Math.PI*Math.min(1,(t-gestureStarted)/(gestureUntil-gestureStarted)));
   if(gesture==='wave'){
    arms[1].rotation.z=-2.15+Math.sin(t*13)*.16*fade;arms[1].rotation.x=-.18;
    hands[1].rotation.z=Math.sin(t*13)*.24*fade;head.rotation.z+=-.035*fade;
   }else if(gesture==='excited'){
    arms.forEach((arm,i)=>{arm.rotation.z=(i===0?1.75:-1.75)*fade;arm.rotation.x=-.2*fade;});
    torso.rotation.z=Math.sin(t*12)*.045*fade;torso.position.y+=Math.abs(Math.sin(t*12))*.07*fade;
   }else if(gesture==='celebrate'){
    arms.forEach((arm,i)=>{arm.rotation.z=(i===0?2.35:-2.35)*fade;arm.rotation.x=-.35*fade;});
    hands.forEach((hand,i)=>hand.rotation.z=Math.sin(t*10+i)*.3*fade);
    torso.rotation.z=Math.sin(t*9)*.06*fade;torso.position.y+=Math.abs(Math.sin(t*9))*.1*fade;
   }
  }else{gesture='idle';hands.forEach(hand=>{hand.rotation.z*=.8;});}
  cameraTarget.set(player.position.x,player.position.y+23,player.position.z+17);camera.position.lerp(cameraTarget,1-Math.exp(-7.2*dt));camera.lookAt(player.position.x,0,player.position.z-1.5);
  nearest=null;let dmin=4.1,discovered=null,discoverDistance=7.6;for(const c of cabinets){const d=player.position.distanceTo(c.position);if(d<discoverDistance){discoverDistance=d;discovered=c;}if(d<dmin){dmin=d;nearest=c;}}
  activeService=null;let serviceDistance=3.5;for(const service of services){const d=player.position.distanceTo(service.position);if(d<serviceDistance){serviceDistance=d;activeService=service;}}
  activeTableGame=null;let tableDistance=3.7;for(const table of gameTables){const d=player.position.distanceTo(table.position);if(d<tableDistance){tableDistance=d;activeTableGame=table;}}
  if(activeService){prompt.textContent='E / TAP TO INTERACT  ·  '+activeService.name;interact.hidden=false;interact.textContent=activeService.type==='table'?'SIT AT TABLE '+activeService.table+' ↗':activeService.name.split(' · ')[0]+' ↗';}
  else if(activeTableGame){prompt.textContent='E / TAP TO PLAY · '+activeTableGame.name+' · 10 TOKEN ENTRY';interact.hidden=false;interact.textContent='PLAY '+activeTableGame.name+' · 10 ✦';}
  else if(nearest){prompt.textContent='E / TAP TO PLAY  ·  '+nearest.userData.name;interact.hidden=false;interact.textContent='PLAY '+nearest.userData.name+' ↗';}
  else if(discovered){prompt.textContent='GAME PREVIEW · '+discovered.userData.name+' · WALK CLOSER TO PLAY';interact.hidden=true;}
  else{prompt.textContent='EXPLORE THE DISTRICT · APPROACH A CABINET OR SERVICE';interact.hidden=true;}
  if(discovered&&!activeService&&!activeTableGame){
   const data=gameGuide[discovered.userData.id]||{label:discovered.userData.genre,description:'Step up and discover this arcade challenge.',challenge:'Skill · score · high-score chase',controls:'Follow the on-screen instructions'};
   discovery.hidden=false;discoveryTitle.textContent=discovered.userData.name;discoveryGenre.textContent=data.label;discoveryDescription.textContent=data.description;discoveryChallenge.textContent=data.challenge;discoveryControls.textContent=data.controls;discoveryAction.textContent=nearest&&nearest===discovered?'E / TAP TO START':'WALK CLOSER TO UNLOCK PLAY';
  }else discovery.hidden=true;
  const previewEnabled=!reduceMotion&&document.visibilityState==='visible'&&(!gameOverlay||gameOverlay.hidden)&&(!serviceModal||serviceModal.hidden);
  if(previewEnabled&&t>=nextPreviewRefresh){previewSetCache=new Set(cabinets.map(c=>({cabinet:c,distance:player.position.distanceTo(c.position)})).filter(v=>v.distance<19).sort((a,b)=>a.distance-b.distance).slice(0,4).map(v=>v.cabinet));nextPreviewRefresh=t+.25;}else if(!previewEnabled)previewSetCache.clear();
  const previewSet=previewSetCache;
  cabinets.forEach((c,i)=>{const pulse=.75+Math.sin(t*2.1+i*.8)*.22;c.userData.lamp.intensity=1.4+pulse*1.1;c.position.y=Math.sin(t*1.3+i)*.012;c.userData.discoveryRing.visible=!!discovered&&discovered===c&&!activeService;c.userData.discoveryRing.material.opacity=.35+Math.sin(t*3.2+i)*.16;
   const preview=c.userData.preview,screenDistance=player.position.distanceTo(c.position);
   if(preview&&previewSet.has(c)){preview.clock+=dt;if(preview.clock>=.12){preview.clock=0;preview.frame++;drawCabinetPreview(preview,preview.frame);}}else if(preview){preview.clock=0;}
  });
  if((moteFrame++%2)===0){const motesAttr=moteGeo.attributes.position;for(let i=0;i<90;i++){const y=motesAttr.getY(i)+dt*2*(.025+(i%4)*.012);motesAttr.setY(i,y>5?0.45:y);}motesAttr.needsUpdate=true;}
  // The prize host breathes, blinks and gives a distinct welcome wave when approached.
  const hostDistance=player.position.distanceTo(host.position);
  const hostNear=hostDistance<4.8;
  if(hostNear&&hostWelcomeUntil<t)hostWelcomeUntil=t+2.8;
  if(t>=hostBlinkAt){hostBlinkUntil=t+.14;hostBlinkAt=t+3.1+Math.abs(Math.sin(t*2.3))*1.8;}
  const hostBlink=hostBlinkUntil>t?Math.sin(Math.PI*(t-(hostBlinkUntil-.14))/.14):0;
  hostEyeLids.forEach(lid=>lid.scale.y=.015+Math.max(0,hostBlink)*.085);
  host.position.y=Math.sin(t*1.8)*.018;hostBody.scale.y=1.2+Math.sin(t*1.7)*.012;
  host.rotation.y=hostNear?Math.atan2(player.position.x-host.position.x,player.position.z-host.position.z)*.12:Math.sin(t*.42)*.035;
  hostArms.forEach((arm,i)=>{arm.rotation.x=Math.sin(t*1.35+i*1.4)*.035;arm.rotation.z=(i===0?-.12:.12)+Math.sin(t*1.1+i)*.025;});
  if(hostWelcomeUntil>t){const wave=Math.sin(t*11)*.18;hostArms[1].rotation.z=-1.85+wave;hostArms[1].rotation.x=-.2;host.rotation.z=Math.sin(t*8)*.018;}
  else host.rotation.z=Math.sin(t*.8)*.012;
  // Staff routines have different rhythms; nearby guests make them look up and acknowledge them.
  serviceStaff.forEach((staff,i)=>{
   const g=staff.group,dx=player.position.x-g.position.x,dz=player.position.z-g.position.z,dist=Math.hypot(dx,dz),near=dist<4.4;
   staff.near=near;staff.phase+=dt*(near?1.25:1);
   staff.head.rotation.y=near?clamp(Math.atan2(dx,dz)*.42,-.55,.55):Math.sin(t*.55+i)*.08;
   staff.head.rotation.x=Math.sin(t*.9+i)*.018;
   if(t>=staff.blinkAt){staff.blinkUntil=t+.13;staff.blinkAt=t+2.6+Math.abs(Math.sin(t*1.7+i))*2;}
   const blink=staff.blinkUntil>t?Math.sin(Math.PI*(t-(staff.blinkUntil-.13))/.13):0;
   staff.lids.forEach(lid=>lid.scale.y=.012+Math.max(0,blink)*.075);
   const reacting=staff.reactionUntil>t;staff.emotion=reacting?staff.emotion:(near?'welcoming':'neutral');staff.smile.scale.y=reacting?1.5:near?1.22:1;staff.brows.forEach((b,j)=>{b.rotation.z=reacting?(j===0?-.18:.18):near?(j===0?-.07:.07):0;});staff.cheeks.forEach(c=>{c.scale.x=reacting?1.12:near?1.06:.9;});
   g.position.y=Math.sin(t*1.9+i)*.012;
   staff.body.scale.y=1.15+Math.sin(t*1.6+i)*.012;
   staff.arms[0].rotation.z=-.12+Math.sin(t*1.4+staff.phase)*.025;
   if(staff.role==='bartender'){
    // Repeated circular polishing strokes, then a small glass lift toward a guest.
    const polish=Math.sin(staff.phase*2.4);
    staff.arms[1].rotation.z=reacting?-1.8:near?-1.05+Math.sin(t*4)*.1:-.48+polish*.16;
    staff.arms[1].rotation.x=-.18+Math.cos(staff.phase*2.4)*.1;
    staff.propPivot.rotation.z=Math.sin(staff.phase*2.4)*.28;
    staff.propPivot.rotation.x=near?-.25:Math.sin(t*1.8)*.08;
   }else{
    // Slow stirring, a gentle lean into the pot and a quick glance up at guests.
    staff.arms[1].rotation.z=reacting?-1.9:-.72+Math.sin(staff.phase*1.7)*.22;
    staff.arms[1].rotation.x=-.35+Math.cos(staff.phase*1.7)*.12;
    staff.arms[0].rotation.z=reacting?-.9:near?-.48+Math.sin(t*3)*.08:-.2+Math.sin(staff.phase*1.1)*.08;
    staff.propPivot.rotation.z=Math.sin(staff.phase*1.7)*.22;
    staff.head.rotation.x+=near?-.035:Math.sin(t*1.1)*.015;
    (g.userData.steam||[]).forEach((steam,j)=>{steam.position.y=1.28+j*.04+((t*0.22+j*.13)% .42);steam.material.opacity=.12+(.12*Math.sin(t*2+j));});
   }
  });
  if(knob)knob.style.transform='translate('+touch.x*31+'px,'+touch.y*31+'px)';pink.intensity=30+Math.sin(t*1.4)*5;cyan.intensity=28+Math.cos(t*1.1)*5;
 }
 function animate(){requestAnimationFrame(animate);const dt=Math.min(clock.getDelta(),.05),t=clock.elapsedTime;update(dt,t);renderer.render(scene,camera);}
 animate();
}
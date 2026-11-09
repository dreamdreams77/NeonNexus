import * as THREE from 'three';

const stage=document.querySelector('#game3d-stage');
const canvas=document.querySelector('#stage');
const startButton=document.querySelector('#start');
const scoreNode=document.querySelector('#score');
const timeNode=document.querySelector('#time');
const resultNode=document.querySelector('#result');
const tokenNode=document.querySelector('#arcade-tokens');
const ticketNode=document.querySelector('#arcade-tickets');
if(!stage||!canvas)throw new Error('Kitchen Rush game surface is missing');

// Renderer/scene are created lazily on first open and fully disposed on close.
let renderer=null,scene=null,camera=null,hudScene=null,hudCam=null,hudPlane=null,hudTex=null,hudCtx=null,hudKey='',hudSize={w:0,h:0,pr:1},resizeObs=null,chef,armL,armR,plateRoot,flash,raf=0,active=false,visible=false,mobile=false,lowQ=false;
let ingredients=[],plateFood=[],leaving=[],leaveT=0,platePop=0,steam=[],decor=[],blobTex=null,glowTex=null;
let score=0,timeLeft=55,ticketTime=11,ticket=0,step=0,misses=0,combo=0,sequence=[0,1,2],lastTime=0,masteryLevel=0,missLimit=3;
const names=['TOMATO','LETTUCE','CHEESE','BREAD'];
const colors=[0xd96d59,0x83a978,0xf1c96f,0xc88e61];
const rand=(a,b)=>a+Math.random()*(b-a);
const matCache=new Map(),geoCache=new Map(),owned=new Set();
const own=o=>{owned.add(o);return o;};
const geo=(key,make)=>{let g=geoCache.get(key);if(!g){g=own(make());geoCache.set(key,g);}return g;};
const canvasTex=(c,srgb=true)=>{const t=own(new THREE.CanvasTexture(c));if(srgb)t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=mobile?1:4;return t;};
const newCanvas=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};

const clayGrain=(()=>makeGrain())();
function makeGrain(){const c=newCanvas(256,256),g=c.getContext('2d');g.fillStyle='#aaa';g.fillRect(0,0,256,256);let seed=73;const r=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};for(let i=0;i<2600;i++){const x=r()*256,y=r()*256,s=.35+r()*2.4,a=.025+r()*.1;g.fillStyle=r()>.5?'rgba(255,255,255,'+a+')':'rgba(28,18,24,'+a+')';g.beginPath();g.ellipse(x,y,s*1.8,s*.55,r()*Math.PI,0,Math.PI*2);g.fill();}for(let i=0;i<22;i++){const x=r()*256,y=r()*256;g.strokeStyle='rgba(45,31,35,.13)';g.lineWidth=1+r()*1.5;g.beginPath();g.arc(x,y,4+r()*17,r()*5,r()*5+1);g.stroke();}const t=canvasTex(c,false);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(1.5,1.5);t.colorSpace=THREE.NoColorSpace;return t;}
function radialTex(stops){const c=newCanvas(128,128),g=c.getContext('2d'),r=g.createRadialGradient(64,64,0,64,64,64);stops.forEach(s=>r.addColorStop(s[0],s[1]));g.fillStyle=r;g.fillRect(0,0,128,128);return canvasTex(c);}

// Clay material with brighter baked rim light (fresnel emissive) instead of extra scene lights.
function patchRim(m){m.onBeforeCompile=s=>{s.fragmentShader=s.fragmentShader.replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\n float rimF=pow(1.0-saturate(abs(dot(normalize(normal),normalize(vViewPosition)))),2.4);totalEmissiveRadiance+=vec3(1.0,.8,.66)*rimF*.5;');};m.customProgramCacheKey=()=>'clayrim';}
function clayMaterial(color,roughness=.94,glow=0){const key=color+'|'+roughness+'|'+glow;let m=matCache.get(key);if(m)return m;m=own(new THREE.MeshStandardMaterial({color,roughness,metalness:0,bumpMap:clayGrain,bumpScale:.065}));if(glow)m.emissive=new THREE.Color(color).multiplyScalar(glow);patchRim(m);matCache.set(key,m);return m;}
function roundedBox(w,h,d,r,material){const geometry=geo('rb'+[w,h,d,r],()=>{const shape=new THREE.Shape();const x=-w/2,y=-h/2;shape.moveTo(x+r,y);shape.lineTo(x+w-r,y);shape.quadraticCurveTo(x+w,y,x+w,y+r);shape.lineTo(x+w,y+h-r);shape.quadraticCurveTo(x+w,y+h,x+w-r,y+h);shape.lineTo(x+r,y+h);shape.quadraticCurveTo(x,y+h,x,y+h-r);shape.lineTo(x,y+r);shape.quadraticCurveTo(x,y,x+r,y);const g=new THREE.ExtrudeGeometry(shape,{depth:d,bevelEnabled:true,bevelSegments:mobile?2:3,steps:1,bevelSize:.045,bevelThickness:.045});g.center();return g;});return new THREE.Mesh(geometry,material);}
function box(parent,w,h,d,x,y,z,color,r=.08,glow=0){const m=roundedBox(w,h,d,r,clayMaterial(color,.94,glow));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function sphere(parent,x,y,z,sx,sy,sz,color,glow=0,material){const g=geo('sph',()=>{const g=new THREE.SphereGeometry(1,mobile?14:18,mobile?10:14);const a=g.attributes.position;for(let i=0;i<a.count;i++){const v=1+Math.sin(i*12.989)*.018+Math.cos(i*4.13)*.012;a.setXYZ(i,a.getX(i)*v,a.getY(i)*v,a.getZ(i)*v);}g.computeVertexNormals();return g;});const m=new THREE.Mesh(g,material||clayMaterial(color,.94,glow));m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function cylinder(parent,rt,rb,h,x,y,z,color,glow=0){const g=geo('cyl'+[rt,rb,h],()=>{const g=new THREE.CylinderGeometry(rt,rb,h,mobile?14:18,1);const a=g.attributes.position;for(let i=0;i<a.count;i++){const v=1+Math.sin(i*7.7)*.012;a.setXYZ(i,a.getX(i)*v,a.getY(i),a.getZ(i)*v);}g.computeVertexNormals();return g;});const m=new THREE.Mesh(g,clayMaterial(color,.94,glow));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function wedge(parent,x,y,z,color,glow=0){const g=geo('wedge',()=>{const s=new THREE.Shape();s.moveTo(-.32,-.2);s.lineTo(.3,-.26);s.quadraticCurveTo(.36,-.26,.34,-.18);s.lineTo(.3,.2);s.quadraticCurveTo(.26,.26,.2,.22);s.closePath();const g=new THREE.ExtrudeGeometry(s,{depth:.2,bevelEnabled:true,bevelSegments:2,bevelSize:.035,bevelThickness:.035});g.center();return g;});const m=new THREE.Mesh(g,clayMaterial(color,.94,glow));m.rotation.x=-Math.PI/2;m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function blob(parent,x,y,z,w,d,op=.5){const m=new THREE.Mesh(geo('plane',()=>new THREE.PlaneGeometry(1,1)),clayBlobMat(op));m.rotation.x=-Math.PI/2;m.position.set(x,y,z);m.scale.set(w,d,1);m.renderOrder=1;parent.add(m);return m;}
function clayBlobMat(op){const key='blob'+op;let m=matCache.get(key);if(!m){m=own(new THREE.MeshBasicMaterial({map:blobTex,transparent:true,opacity:op,depthWrite:false,toneMapped:false}));matCache.set(key,m);}return m;}
function glowPlane(parent,x,y,z,size,color,op){const m=new THREE.Mesh(geo('plane',()=>new THREE.PlaneGeometry(1,1)),own(new THREE.MeshBasicMaterial({map:glowTex,color,transparent:true,opacity:op,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false})));m.rotation.x=-Math.PI/2;m.position.set(x,y,z);m.scale.set(size,size,1);m.renderOrder=2;parent.add(m);return m;}
function labelTexture(lines,width=512,height=180,mainSize=35){const c=newCanvas(width,height),x=c.getContext('2d');x.fillStyle='#604451';x.fillRect(0,0,width,height);x.fillStyle='#f7dfbd';x.beginPath();x.roundRect(10,10,width-20,height-20,24);x.fill();x.fillStyle='#654652';x.textAlign='center';x.textBaseline='middle';x.font='bold '+mainSize+'px Fredoka, sans-serif';x.fillText(lines[0],width/2,lines[1]?height*.4:height*.52);if(lines[1]){x.font='bold '+Math.round(mainSize*.55)+'px Fredoka, sans-serif';x.fillStyle='#b46659';x.fillText(lines[1],width/2,height*.76);}return canvasTex(c);}
// ---- Baked surfaces: clay-grain tiles for floor and wall with painted-in light pools (no dynamic point lights) ----
function floorTexture(){const S=mobile?512:1024,H=S*1.25,c=newCanvas(S,H),g=c.getContext('2d'),n=8,t=S/n;let seed=11;const r=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 for(let y=0;y<n*1.25;y++)for(let x=0;x<n;x++){const k=(x+y)%2,j=r()*10-5;g.fillStyle='rgb('+Math.round((k?132:116)+j)+','+Math.round((k?96:82)+j)+','+Math.round((k?100:92)+j)+')';g.fillRect(x*t,y*t,t,t);g.fillStyle='rgba(255,236,210,.10)';g.fillRect(x*t+2,y*t+2,t-4,4);g.fillStyle='rgba(30,16,26,.14)';g.fillRect(x*t+2,y*t+t-6,t-4,4);}
 for(let i=0;i<S*6;i++){g.fillStyle=r()>.5?'rgba(255,240,220,'+(.03+r()*.07)+')':'rgba(28,16,24,'+(.03+r()*.08)+')';g.beginPath();g.ellipse(r()*S,r()*H,.6+r()*2.6,.4+r()*1.2,r()*3,0,6.3);g.fill();}
 g.strokeStyle='rgba(44,28,42,.75)';g.lineWidth=S/170;for(let i=0;i<=n*1.25;i++){g.beginPath();g.moveTo(i*t,0);g.lineTo(i*t,H);g.moveTo(0,i*t);g.lineTo(S,i*t);g.stroke();}
 const l=g.createRadialGradient(S*.5,H*.5,S*.05,S*.5,H*.5,S*.85);l.addColorStop(0,'rgba(255,214,150,.26)');l.addColorStop(.55,'rgba(255,190,130,0)');l.addColorStop(1,'rgba(22,10,30,.55)');g.fillStyle=l;g.fillRect(0,0,S,H);
 const tex=canvasTex(c);return tex;}
function wallTexture(){const W=mobile?768:1536,H=W/3,c=newCanvas(W,H),g=c.getContext('2d');let seed=29;const r=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 const grd=g.createLinearGradient(0,0,0,H);grd.addColorStop(0,'#5d4659');grd.addColorStop(.7,'#6d5262');grd.addColorStop(1,'#7a5a64');g.fillStyle=grd;g.fillRect(0,0,W,H);
 g.fillStyle='rgba(130,90,96,.55)';g.fillRect(0,H*.74,W,H*.26);g.fillStyle='rgba(255,226,190,.16)';g.fillRect(0,H*.74,W,3);g.fillStyle='rgba(30,16,26,.25)';g.fillRect(0,H*.74+3,W,4);
 for(let x=0;x<W;x+=W/15){g.fillStyle='rgba(30,16,26,.15)';g.fillRect(x,0,2,H);}
 for(let i=0;i<W*5;i++){g.fillStyle=r()>.5?'rgba(255,236,214,'+(.02+r()*.06)+')':'rgba(24,12,22,'+(.03+r()*.07)+')';g.beginPath();g.ellipse(r()*W,r()*H,.6+r()*3,.4+r()*1.2,r()*3,0,6.3);g.fill();}
 [-6.4,6.4,0].forEach((lx,i)=>{const px=(lx+7.5)/15*W,py=(i<2?(4.7-3.68)/5:(4.7-3.9)/5)*H,rad=W*(i<2?.17:.28);const l=g.createRadialGradient(px,py,0,px,py,rad);l.addColorStop(0,'rgba(255,214,140,'+(i<2?.55:.2)+')');l.addColorStop(1,'rgba(255,190,120,0)');g.fillStyle=l;g.fillRect(0,0,W,H);});
 return canvasTex(c);}

// ---- Screen-space ticket HUD: real pixel-sized text so it stays readable on a 390px-wide phone ----
function layoutHud(w,h){const pr=renderer.getPixelRatio(),pw=Math.round(Math.min(w-16,520)),ph=136;if(hudSize.w===pw&&hudSize.pr===pr&&hudSize.W===w&&hudSize.H===h)return;hudSize={w:pw,h:ph,pr,W:w,H:h};hudCtx.canvas.width=Math.round(pw*pr);hudCtx.canvas.height=Math.round(ph*pr);hudTex.dispose();hudPlane.scale.set(pw,ph,1);hudPlane.position.set(0,h/2-ph/2-8,0);hudCam.left=-w/2;hudCam.right=w/2;hudCam.top=h/2;hudCam.bottom=-h/2;hudCam.updateProjectionMatrix();hudKey='';}
function drawHud(){if(!hudCtx)return;const key=[active,ticket,step,sequence.join(''),Math.ceil(ticketTime),hudSize.w,hudSize.pr].join('|');if(key===hudKey)return;hudKey=key;const c=hudCtx,{w,h,pr}=hudSize;c.setTransform(pr,0,0,pr,0,0);c.clearRect(0,0,w,h);c.fillStyle='#5b4050';c.beginPath();c.roundRect(0,0,w,h,22);c.fill();c.fillStyle='#f7dfbd';c.beginPath();c.roundRect(6,6,w-12,h-12,17);c.fill();
 c.textBaseline='alphabetic';c.textAlign='left';c.fillStyle='#76505a';c.font='bold 30px Fredoka, sans-serif';c.fillText('ORDER '+String(Math.min(ticket+1,5)).padStart(2,'0')+' / 05',20,40);
 const low=active&&ticketTime<4;c.textAlign='right';c.fillStyle=low?'#c44f45':'#76505a';c.fillText(active?Math.max(0,Math.ceil(ticketTime))+'s':'READY',w-20,40);
 c.fillStyle='#dcc3a5';c.beginPath();c.roundRect(20,50,w-40,8,4);c.fill();c.fillStyle=low?'#c44f45':'#8fb58b';c.beginPath();c.roundRect(20,50,Math.max(8,(w-40)*Math.max(0,Math.min(1,ticketTime/ticketMax))),8,4);c.fill();
 const cw=(w-28)/3;c.textAlign='center';sequence.forEach((id,i)=>{const x=14+cw*(i+.5),done=i<step,cur=i===step;c.fillStyle=done?'#8fb58b':cur?'#f0b46c':'#d6b59b';c.beginPath();c.arc(x,88,19,0,Math.PI*2);c.fill();if(cur){c.strokeStyle='#76505a';c.lineWidth=3;c.stroke();}c.fillStyle='#59414d';c.font='bold 24px Fredoka, sans-serif';c.fillText(done?'✓':String(i+1),x,97);let size=28;c.font='bold 28px Fredoka, sans-serif';while(size>20&&c.measureText(names[id]).width>cw-6){size--;c.font='bold '+size+'px Fredoka, sans-serif';}c.fillStyle=done?'#6e8f6a':'#654652';c.fillText(names[id],x,125);});
 hudTex.needsUpdate=true;}
function paintTicket(){hudKey='';}

function buildIngredient(i,root){
 if(i===0){[0,1,2].forEach(j=>{const a=j*2.1+.4,x=Math.cos(a)*.2,z=Math.sin(a)*.2;sphere(root,x,.2,z,.27,.23,.26,0xd76c58,.16);sphere(root,x-.07,.3,z+.07,.07,.045,.05,0xf2a08e);sphere(root,x,.42,z,.09,.025,.04,0x678a59).rotation.y=a;sphere(root,x,.42,z,.09,.025,.04,0x678a59).rotation.y=a+1.57;});const sl=cylinder(root,.19,.19,.05,.0,.12,.34,0xd76c58,.16);sl.rotation.x=1.1;const si=cylinder(root,.14,.14,.055,.0,.12,.34,0xee9a86,.2);si.rotation.x=1.1;}
 if(i===1){for(let j=0;j<7;j++){const a=j*.9,rr=.08+(j%3)*.07,lf=sphere(root,Math.cos(a)*rr+Math.cos(a)*.1,.1+(j%3)*.07,Math.sin(a)*rr+Math.sin(a)*.1,.3,.09,.4,j%2?0x9ac18a:0x83a979,.14);lf.rotation.y=-a+1.57;lf.rotation.z=(j%2?.2:-.2);const rib=sphere(root,lf.position.x,lf.position.y+.075,lf.position.z,.03,.02,.3,0xdcebbd);rib.rotation.y=lf.rotation.y;}}
 if(i===2){wedge(root,0,.19,0,0xf1ce75,.2).rotation.z=.2;[[-.12,.1],[.1,-.07],[.05,.14]].forEach(h=>sphere(root,h[0],.327,h[1],.05,.018,.05,0xd8a94a));wedge(root,.05,.12,.28,0xf6d884,.2).scale.setScalar(.6);}
 if(i===3){const loaf=sphere(root,-.1,.2,-.05,.46,.27,.33,0xc68e5f,.12);loaf.rotation.z=.08;for(let j=0;j<3;j++){const sc=box(root,.035,.012,.4,-.28+j*.17,.44,-.05,0xe8bd88,.01);sc.rotation.z=-.28;}const s1=box(root,.4,.34,.07,.18,.2,.3,0xd9a56f,.04,.12);s1.rotation.z=.1;box(root,.32,.26,.075,.18,.2,.31,0xf5dfb2,.03,.12).rotation.z=.1;}
}
function createRoom(){
 scene=new THREE.Scene();scene.background=new THREE.Color(0x41364d);scene.fog=new THREE.Fog(0x41364d,16,34);
 camera=new THREE.PerspectiveCamera(42,1,.1,70);camera.position.set(0,7.5,13.5);camera.lookAt(0,1.55,-.4);
 scene.add(new THREE.HemisphereLight(0xffe2c4,0x5d4a66,2.5));
 const key=new THREE.DirectionalLight(0xffd29b,3.1);key.position.set(-4,8,6);key.castShadow=renderer.shadowMap.enabled;const sm=mobile?512:1024;key.shadow.mapSize.set(sm,sm);key.shadow.camera.left=-9;key.shadow.camera.right=9;key.shadow.camera.top=9;key.shadow.camera.bottom=-9;key.shadow.bias=-.0006;scene.add(key);
 const fg=clayGrain.clone();fg.repeat.set(7,7);fg.needsUpdate=true;own(fg);
 const floor=box(scene,15,.34,18.75,0,-.28,1.875,0x72545a,.15);floor.receiveShadow=true;
 const fl=new THREE.Mesh(geo('plane',()=>new THREE.PlaneGeometry(1,1)),own(new THREE.MeshStandardMaterial({map:floorTexture(),roughness:.95,metalness:0,bumpMap:fg,bumpScale:.05})));fl.rotation.x=-Math.PI/2;fl.scale.set(15,18.75,1);fl.position.set(0,-.055,1.875);fl.receiveShadow=true;scene.add(fl);
 box(scene,15,5,.45,0,2.2,-5.6,0x624957,.12);
 const wg=clayGrain.clone();wg.repeat.set(6,2);wg.needsUpdate=true;own(wg);
 const wl=new THREE.Mesh(geo('plane',()=>new THREE.PlaneGeometry(1,1)),own(new THREE.MeshStandardMaterial({map:wallTexture(),roughness:.95,metalness:0,bumpMap:wg,bumpScale:.06})));wl.scale.set(15,5,1);wl.position.set(0,2.2,-5.318);wl.receiveShadow=true;scene.add(wl);
 box(scene,15,.18,18.75,0,-.51,1.875,0x4b3a4c,.12);
 // Back wall tiles, shelf and emissive hanging lamps (glow is baked into the wall texture).
 for(let x=-6.4;x<=6.4;x+=1.6){box(scene,1.45,1.15,.08,x,2.05,-5.3,(Math.round(x)%2?0x96706c:0x9d7770),.04);}
 [-6.4,6.4].forEach(lx=>{cylinder(scene,.045,.045,.95,lx,4.2,-4.6,0xd8a96e);sphere(scene,lx,3.68,-4.6,.34,.23,.34,0xf4c783,.9);});
 // Open counter, hand-made front panels and brass trim.
 box(scene,13,1.1,1.2,0,.55,-1.5,0x9a685e,.18);box(scene,13,.16,1.28,0,1.18,-1.5,0xf0d3a8,.1);box(scene,13,.08,.12,0,.91,-.84,0xd5a15e,.04);
 for(let i=-5;i<=5;i+=2){box(scene,1.65,.68,.08,i,.5,-.87,0x80535b,.08);}
 blob(scene,0,-.05,-1.5,13.6,3,.45);
 // A visible conveyor pass with a rotating roller rhythm.
 box(scene,8,.18,2.1,0,1.42,.2,0x5b4857,.1);
 for(let i=0;i<13;i++){const roll=cylinder(scene,.07,.07,1.9,-3.7+i*.62,1.56,.2,0xd3a36a);roll.rotation.x=Math.PI/2;decor.push({mesh:roll,phase:i*.35,kind:'roller'});}
 blob(scene,0,1.636,.1,2.5,2.2,.55);
 plateRoot=new THREE.Group();plateRoot.position.set(0,1.62,.1);scene.add(plateRoot);cylinder(plateRoot,.82,.9,.13,0,0,0,0xf6e4c8);cylinder(plateRoot,.69,.72,.035,0,.09,0,0xffffff);
 flash=glowPlane(scene,0,1.76,.1,2.6,0xffe2a0,0);
 // Four ingredient plinths with sculpted, softly glowing clay models.
 for(let i=0;i<4;i++){
  const x=-5.1+i*3.4;box(scene,2.3,.55,1.7,x,.35,3.15,[0x986b65,0x718c76,0x9a8263,0x986b65][i],.14);
  blob(scene,x,-.05,3.15,3.6,2.9,.45);
  cylinder(scene,.55,.6,.14,x,.72,3.15,0xeed6b4);
  glowPlane(scene,x,.802,3.15,1.9,colors[i],.34);blob(scene,x,.796,3.15,1.25,1.1,.5);
  const root=new THREE.Group();root.position.set(x,1.02,3.15);root.userData.ingredient=i;scene.add(root);buildIngredient(i,root);ingredients.push(root);
  const tag=new THREE.Mesh(geo('plane',()=>new THREE.PlaneGeometry(1,1)),own(new THREE.MeshBasicMaterial({map:labelTexture([String(i+1)+' '+names[i]],384,132,mobile?64:58),toneMapped:false})));tag.scale.set(2.5,.86,1);tag.rotation.x=-.7;tag.position.set(x,.36,4.16);scene.add(tag);
 }
 // Chef character: clay head, apron, expressive face and hat.
 chef=new THREE.Group();chef.position.set(0,0,-3.45);scene.add(chef);blob(scene,0,-.05,-3.45,2.8,1.8,.5);
 sphere(chef,0,1.75,0,.5,.59,.43,0xe8b998);sphere(chef,0,1.25,0,.57,.62,.38,0x83a99a,.1);
 box(chef,.78,.52,.12,0,1.1,.36,0xf0d3b0,.09);
 sphere(chef,-.17,1.82,.38,.045,.055,.025,0x493343);sphere(chef,.17,1.82,.38,.045,.055,.025,0x493343);
 sphere(chef,-.3,1.66,.37,.07,.045,.02,0xe59a8c);sphere(chef,.3,1.66,.37,.07,.045,.02,0xe59a8c);
 sphere(chef,0,1.62,.405,.085,.045,.03,0xb96d65);
 cylinder(chef,.36,.34,.19,0,2.3,0,0xf3dfc4);for(let i=-1;i<=1;i++){sphere(chef,i*.2,2.4,0,.19,.17,.19,0xffead1,.1);}
 armL=new THREE.Group();armL.position.set(-.45,1.35,0);chef.add(armL);const arm1=sphere(armL,-.12,-.18,.05,.16,.37,.16,0xe8b998);arm1.rotation.z=-.55;
 armR=new THREE.Group();armR.position.set(.45,1.35,0);chef.add(armR);const arm2=sphere(armR,.12,-.18,.05,.16,.37,.16,0xe8b998);arm2.rotation.z=.55;
 // Steam curls and drifting dust motes animate at stop-motion cadence.
 for(let i=0;i<5;i++){const s=sphere(scene,rand(-.45,.45),2.15,rand(-.35,.35),.06,.18,.06,0xffffff,0,own(new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.28,depthWrite:false})));steam.push({mesh:s,phase:i*.8});}
 const sign=new THREE.Mesh(geo('plane',()=>new THREE.PlaneGeometry(1,1)),own(new THREE.MeshBasicMaterial({map:labelTexture(['KITCHEN RUSH'],1024,160,126),toneMapped:false})));sign.scale.set(10,1.56,1);sign.position.set(0,3.9,-5.26);scene.add(sign);
 for(let i=0;i<16;i++){const speck=sphere(scene,rand(-7,7),rand(1,4.5),rand(-4,4),.025,.025,.025,0xffd7a0,0,own(new THREE.MeshBasicMaterial({color:0xffd7a0,transparent:true,opacity:.2,depthWrite:false})));decor.push({mesh:speck,phase:i,kind:'dust'});}
}
function clearItems(list){list.forEach(g=>g.parent&&g.parent.remove(g));list.length=0;}
function nextTicket(){ticket++;step=0;ticketMax=ticketTime=Math.max(6.2,11-ticket*.65);sequence=Array.from({length:3},()=>Math.floor(Math.random()*4));paintTicket();leaving.push(...plateFood);plateFood=[];leaveT=.5;}
function addToPlate(id){const n=plateFood.length,x=rand(-.34,.34),z=rand(-.24,.24),g=new THREE.Group(),y=1.76+n*.03;g.position.set(x,y,z+.1);g.rotation.y=rand(0,6.28);
 if(id===0){cylinder(g,.2,.2,.05,0,.04,0,0xd76c58,.16);cylinder(g,.15,.15,.055,0,.045,0,0xee9a86,.2);}
 else if(id===1){sphere(g,0,.05,0,.26,.06,.2,0x83a979,.14).rotation.z=.1;sphere(g,.05,.1,.03,.2,.05,.16,0x9ac18a,.14).rotation.y=.8;}
 else if(id===2){box(g,.3,.05,.28,0,.04,0,0xf1ce75,.03,.2).rotation.y=.2;sphere(g,.06,.075,.04,.04,.015,.04,0xd8a94a);}
 else{box(g,.36,.07,.28,0,.05,0,0xc68e5f,.05,.12);box(g,.3,.03,.22,0,.09,0,0xe8bd88,.03,.1);}
 blob(g,0,-(y-1.738),0,.7,.6,.4);g.scale.setScalar(.001);g.userData.pop=0;scene.add(g);plateFood.push(g);}
let ticketMax=11,lastHud='';
function updateHud(){const s=String(score),t=String(Math.ceil(timeLeft));if(lastHud!==s+'|'+t){lastHud=s+'|'+t;scoreNode.textContent=s;timeNode.textContent=t;}}
function finish(win){if(!active)return;active=false;const eff=Math.round(300*(1-Math.exp(-score/300))),tier=1.1,earned=Math.max(2,Math.round((Math.floor(eff/7)+(win?12:0)+Math.min(15,Math.floor(combo/3)))*tier)),ticketsEarned=Math.max(2,Math.round((Math.floor(eff/9)+(win?12:0)+Math.min(18,Math.floor(combo/3)))*tier)); // same diminishing-returns payout curve as the 2D cabinets
resultNode.textContent=(win?'KITCHEN MASTER! ':'SERVICE OVER · ')+score+' POINTS · +'+earned+' TOKENS · +'+ticketsEarned+' TICKETS';{const V=window.NEXUS_VOICE,q=document.querySelector('#result-quip');if(q)q.textContent=V?V.quip('chef',{win,score,newBest:false,gradeLabel:''}):'';}startButton.textContent='PLAY AGAIN';try{const key='neon-nexus-player-v1',saved=JSON.parse(localStorage.getItem(key)||'{}');saved.tokens=(Number(saved.tokens??250)||0)+earned;saved.tickets=(Number(saved.tickets)||0)+ticketsEarned;saved.ticketHistory=saved.ticketHistory||[];saved.ticketHistory.unshift({game:'chef',score,amount:ticketsEarned,at:Date.now()});saved.ticketHistory=saved.ticketHistory.slice(0,30);saved.arcadeBest=saved.arcadeBest||{};saved.arcadeBest.chef=Math.max(Number(saved.arcadeBest.chef)||0,score);saved.arcadeStats=saved.arcadeStats||{};const stats=saved.arcadeStats.chef||{plays:0,wins:0,bestCombo:0,bestScore:0};stats.plays++;if(win)stats.wins++;stats.bestCombo=Math.max(stats.bestCombo,combo);stats.bestScore=Math.max(stats.bestScore,score);stats.lastPlayed=Date.now();saved.arcadeStats.chef=stats;saved.arcadeMastery=saved.arcadeMastery||{};const record=saved.arcadeMastery.chef||{xp:0,level:0,bestScore:0,bestStreak:0},xpGain=Math.max(15,Math.floor(score*.6)+(win?45:0)+combo*4);record.xp=(Number(record.xp)||0)+xpGain;record.level=[100,260,480,760,1100,1500,2000].filter(n=>record.xp>=n).length;record.bestScore=Math.max(record.bestScore||0,score);record.bestStreak=Math.max(record.bestStreak||0,combo);record.lastPerk=record.level>=6?'Elite kitchen perk active':record.level>=4?'Specialist kitchen perk active':record.level>=2?'First kitchen perk active':'No perk unlocked yet';record.lastGain=xpGain;saved.arcadeMastery.chef=record;saved.arcadeSessions=Array.isArray(saved.arcadeSessions)?saved.arcadeSessions:[];saved.arcadeSessions.unshift({game:'chef',score,win,bestCombo:combo,at:Date.now()});saved.arcadeSessions=saved.arcadeSessions.slice(0,25);const D=window.NEXUS_DAILY,dailyMsg=D?D.apply(saved,'chef',win):'';localStorage.setItem(key,JSON.stringify(saved));tokenNode.textContent=saved.tokens;ticketNode.textContent=saved.tickets;if(dailyMsg){const q=document.querySelector('#result-quip');if(q)q.textContent=(q.textContent?q.textContent+'  ':'')+dailyMsg;}{const chip=document.querySelector('#daily-chip');if(D&&chip){const t=D.today();chip.classList.toggle('done',t.played&&t.won&&t.partnerDone);chip.title=D.pitch(t);}}const panel=document.querySelector('#game-progression');if(panel){panel.hidden=false;const thresholds=[0,100,260,480,760,1100,1500,2000],lvl=record.level,next=thresholds[lvl+1]||2000,prev=thresholds[lvl]||0,progress=lvl>=7?100:Math.round(Math.max(0,Math.min(1,(record.xp-prev)/Math.max(1,next-prev)))*100);panel.innerHTML='<div class="mastery-heading"><span>✦ CABINET MASTERY</span><b>LEVEL '+lvl+'</b></div><div class="mastery-track"><i style="width:'+progress+'%"></i></div><div class="mastery-meta"><span>'+record.xp+' XP · '+progress+'% TO NEXT LEVEL</span><span>BEST '+record.bestScore+'</span></div><p>'+record.lastPerk+'</p>';}}catch{}}
function startGame(){if(!visible||!renderer)return;const saved=(()=>{try{return JSON.parse(localStorage.getItem('neon-nexus-player-v1')||'{}')}catch{return {}}})();masteryLevel=saved.arcadeMastery?.chef?.level||0;missLimit=3+(masteryLevel>=4?1:0);score=0;timeLeft=55;ticketMax=ticketTime=11+(masteryLevel>=2?2:0);ticket=0;step=0;misses=0;combo=0;active=true;sequence=Array.from({length:3},()=>Math.floor(Math.random()*4));clearItems(plateFood);clearItems(leaving);paintTicket();resultNode.textContent='';startButton.textContent='SERVICE IN PROGRESS';lastHud='';updateHud();startLoop();}
function mistake(){misses++;combo=0;step=0;ticketMax=ticketTime=11;paintTicket();if(misses>=missLimit)finish(false);}
function choose(id){if(!active)return;if(id===sequence[step]){step++;combo++;score+=25+Math.min(20,combo*2)+(masteryLevel>=6?5:0);addToPlate(id);soundFx(440+step*110);if(step===3){score+=90+ticket*12;platePop=.01;if(ticket>=4){ticket++;paintTicket();updateHud();finish(true);return;}nextTicket();}paintTicket();updateHud();}else{mistake();updateHud();}}
function soundFx(freq){try{const ac=window.__nexusKitchenAudio||(window.__nexusKitchenAudio=new AudioContext());if(ac.state==='suspended')ac.resume();const o=ac.createOscillator(),g=ac.createGain();o.frequency.value=freq;g.gain.value=.025;g.gain.exponentialRampToValueAtTime(.001,ac.currentTime+.11);o.connect(g);g.connect(ac.destination);o.start();o.stop(ac.currentTime+.11);}catch{}}

// ---- Single render loop: runs only while the cabinet is open and the tab is visible ----
function startLoop(){if(raf||!renderer||!visible||document.hidden)return;lastTime=performance.now();raf=requestAnimationFrame(tick);}
function stopLoop(){if(raf)cancelAnimationFrame(raf);raf=0;}
const ease=t=>{const c=1.70158+1;return 1+c*Math.pow(t-1,3)+1.70158*Math.pow(t-1,2);};
function tick(now){raf=0;if(!renderer||!visible||document.hidden)return;raf=requestAnimationFrame(tick);const dt=Math.min(.04,Math.max(0,(now-lastTime)/1000));lastTime=now;const t=now/1000;
 if(active){timeLeft-=dt;ticketTime-=dt;if(ticketTime<=0)mistake();if(timeLeft<=0)finish(ticket>=5);}
 const amp=active?1:.5;
 ingredients.forEach((g,i)=>{g.rotation.y=Math.sin(t*(active?1.2:1)+i)*(active?.06:.045);g.position.y=1.02+Math.sin(t*2+i*.9)*.035*(active?1:.6);g.scale.setScalar(1.3*(active?1+Math.max(0,Math.sin(t*2.4+i))*.012:1));});
 decor.forEach(o=>{if(o.kind==='dust'){o.mesh.position.y=1.3+((t*.18+o.phase*.13)%3.5);o.mesh.material.opacity=.2+Math.sin(t+o.phase)*.1;}else if(active){o.mesh.rotation.z+=dt*1.4;}});
 chef.rotation.z=Math.sin(t*(active?1.8:1.1))*(active?.035:.025);armL.rotation.z=Math.sin(t*(active?3.1:1.8))*(active?.16:.08)-(active?.15:0);armR.rotation.z=Math.sin(t*(active?3.1:1.8)+1.2)*(active?.16:.08)+(active?.15:0);
 steam.forEach(o=>{o.mesh.position.y=2.1+((t*.35+o.phase*.16)%1.3);o.mesh.material.opacity=.25*(1-(o.mesh.position.y-2.1)/1.3);});
 plateFood.forEach(g=>{if(g.userData.pop<1){g.userData.pop=Math.min(1,g.userData.pop+dt/.3);g.scale.setScalar(Math.max(.001,ease(g.userData.pop)));}});
 if(leaveT>0){leaveT-=dt;if(leaveT<=0)clearItems(leaving);else leaving.forEach(g=>g.scale.setScalar(Math.max(.001,1+Math.sin(Math.min(1,(.5-leaveT)/.2)*Math.PI*.5)*.12-Math.max(0,(.2-leaveT)/.2)*1.12)));}
 if(platePop>0){platePop+=dt/.5;const p=Math.min(1,platePop),s=1+.16*Math.sin(p*Math.PI);plateRoot.scale.set(s,1+.1*Math.sin(p*Math.PI),s);plateRoot.position.y=1.62+.14*Math.sin(p*Math.PI);flash.material.opacity=.7*(1-p);flash.scale.setScalar(1.8+p*1.8);if(p>=1){platePop=0;plateRoot.scale.set(1,1,1);plateRoot.position.y=1.62;flash.material.opacity=0;}}
 updateHud();drawHud();renderer.clear();renderer.render(scene,camera);renderer.render(hudScene,hudCam);}

function fitCamera(w,h){const asp=w/h;camera.aspect=asp;camera.fov=asp<1?56:asp<1.5?50:46;const tgt=new THREE.Vector3(0,1.55,-.4),p0=new THREE.Vector3(0,7.5,13.5),dir=p0.clone().sub(tgt),base=dir.length();dir.normalize();const th=Math.tan(camera.fov*Math.PI/360),need=6.7/(th*asp)-12.06,s=Math.max(0,need)+(asp>1.8?2.6:0);camera.position.copy(tgt).addScaledVector(dir,base+s);camera.lookAt(tgt);const sh=Math.round(h*(asp>1.8?.19:.12));camera.setViewOffset(w,h,0,-sh,w,h);camera.updateProjectionMatrix();}
function resize(){if(!renderer||!stage.clientWidth)return;const w=stage.clientWidth,h=stage.clientHeight;renderer.setSize(w,h,false);fitCamera(w,h);layoutHud(w,h);}
function ensureRenderer(){if(renderer)return true;
 try{mobile=window.matchMedia('(max-width: 650px)').matches||window.matchMedia('(pointer: coarse)').matches;}catch{mobile=window.innerWidth<=650;}
 try{lowQ=!!(window.nexusSettings&&window.nexusSettings().quality==='low');}catch{lowQ=false;}
 try{renderer=new THREE.WebGLRenderer({antialias:!mobile,alpha:false,powerPreference:mobile?'default':'high-performance'});}catch(err){renderer=null;resultNode.textContent='3D kitchen needs WebGL on this device.';return false;}
 renderer.setPixelRatio(mobile?Math.min(window.devicePixelRatio||1,1.25):Math.min(window.devicePixelRatio||1,1.65));
 renderer.autoClear=false;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;
 renderer.shadowMap.enabled=!lowQ;renderer.shadowMap.type=mobile?THREE.BasicShadowMap:THREE.PCFSoftShadowMap;
 stage.appendChild(renderer.domElement);stage.setAttribute('aria-label','Kitchen Rush: THE NEXUS KITCHEN, follow the KITCHEN TICKET order');
 blobTex=radialTex([[0,'rgba(24,10,26,.85)'],[.45,'rgba(24,10,26,.4)'],[1,'rgba(24,10,26,0)']]);glowTex=radialTex([[0,'rgba(255,255,255,1)'],[.4,'rgba(255,255,255,.45)'],[1,'rgba(255,255,255,0)']]);
 createRoom();
 hudScene=new THREE.Scene();hudCam=new THREE.OrthographicCamera(-1,1,1,-1,0,10);hudCam.position.z=5;const hc=newCanvas(8,8);hudCtx=hc.getContext('2d');hudTex=own(new THREE.CanvasTexture(hc));hudTex.colorSpace=THREE.SRGBColorSpace;hudPlane=new THREE.Mesh(geo('plane',()=>new THREE.PlaneGeometry(1,1)),own(new THREE.MeshBasicMaterial({map:hudTex,transparent:true,depthTest:false,depthWrite:false,toneMapped:false})));hudScene.add(hudPlane);
 resizeObs=new ResizeObserver(resize);resizeObs.observe(stage);window.addEventListener('resize',resize);
 try{document.fonts&&document.fonts.ready.then(()=>{hudKey='';});}catch{}
 resize();return true;}
function teardown(){stopLoop();if(resizeObs){resizeObs.disconnect();resizeObs=null;}window.removeEventListener('resize',resize);
 if(scene)scene.traverse(o=>{if(o.geometry)o.geometry.dispose();});
 owned.forEach(o=>o.dispose&&o.dispose());clayGrain.dispose();owned.clear();matCache.clear();geoCache.clear();
 if(renderer){renderer.dispose();try{renderer.forceContextLoss();}catch{}renderer.domElement.remove();}
 renderer=scene=camera=hudScene=hudCam=hudPlane=hudTex=hudCtx=chef=armL=armR=plateRoot=flash=blobTex=glowTex=null;
 ingredients=[];plateFood=[];leaving=[];steam=[];decor=[];leaveT=0;platePop=0;hudKey='';hudSize={w:0,h:0,pr:1};}
function pointerDown(e){if(!active||!renderer)return;const r=renderer.domElement.getBoundingClientRect(),p=new THREE.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1),ray=new THREE.Raycaster();ray.setFromCamera(p,camera);const hits=ray.intersectObjects(ingredients,true);if(!hits.length)return;let root=hits[0].object;while(root.parent&&root.userData.ingredient===undefined)root=root.parent;if(root.userData.ingredient!==undefined)choose(root.userData.ingredient);}
function openGame(id){const was=visible;visible=id==='chef';if(visible){stage.style.display='block';canvas.style.display='none';if(!ensureRenderer()){return;}resize();resultNode.textContent='';startButton.textContent='START SERVICE';startLoop();}else{if(was){active=false;teardown();}stage.style.display='none';canvas.style.display='block';}}
function stop(){active=false;const was=visible;visible=false;teardown();if(was){stage.style.display='none';canvas.style.display='block';}}
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopLoop();else startLoop();});
window.addEventListener('nexus:game3d-open',e=>openGame(e.detail?.gameId));
window.addEventListener('nexus:game3d-start',startGame);
window.addEventListener('nexus:game3d-stop',stop);
stage.addEventListener('pointerdown',pointerDown);
if(location.search.includes('debug'))window.__kitchen={get sequence(){return sequence;},get step(){return step;},get score(){return score;},get active(){return active;},get ticket(){return ticket;},get misses(){return misses;},get timeLeft(){return timeLeft;},get renderer(){return renderer;},choose:id=>choose(id)};
window.addEventListener('keydown',e=>{if(!active)return;if(['1','2','3','4'].includes(e.key)){e.preventDefault();choose(Number(e.key)-1);}});

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';

const mount=document.querySelector('#district-world');
if(mount){
 const scene=new THREE.Scene(); scene.background=new THREE.Color(0x080d20); scene.fog=new THREE.Fog(0x080d20,20,52);
 const camera=new THREE.PerspectiveCamera(60,1,.1,100);
 const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
 renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.6)); renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap; renderer.outputColorSpace=THREE.SRGBColorSpace; mount.prepend(renderer.domElement);
 scene.add(new THREE.HemisphereLight(0xa8caff,0x21152d,2.0));
 const sun=new THREE.DirectionalLight(0xffffff,2); sun.position.set(-8,14,9); sun.castShadow=true; sun.shadow.mapSize.set(1024,1024); scene.add(sun);
 const ambient=new THREE.PointLight(0x39dff5,24,22); ambient.position.set(0,5,-3); scene.add(ambient);
 const mat=(c,e=0,i=0,rough=.55)=>new THREE.MeshStandardMaterial({color:c,emissive:e,emissiveIntensity:i,roughness:rough,metalness:.2});
 const box=(w,h,d,x,y,z,m,parent=scene)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;};
 const cylinder=(rt,rb,h,x,y,z,m,parent=scene)=>{const o=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,16),m);o.position.set(x,y,z);o.castShadow=true;parent.add(o);return o;};
 const sphere=(r,x,y,z,m,parent=scene)=>{const o=new THREE.Mesh(new THREE.SphereGeometry(r,14,12),m);o.position.set(x,y,z);o.castShadow=true;parent.add(o);return o;};
 const floor=new THREE.Mesh(new THREE.PlaneGeometry(42,42),mat(0x111a30)); floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;scene.add(floor);
 const grid=new THREE.GridHelper(40,40,0x2b6a83,0x203650);grid.position.y=.015;scene.add(grid);
 const player=new THREE.Group();scene.add(player);
 const body=new THREE.Mesh(new THREE.CapsuleGeometry(.32,.66,4,8),mat(0x54dce9,0x1c8295,.3));body.position.y=1.08;body.castShadow=true;player.add(body);
 const head=sphere(.24,0,1.78,0,mat(0xf0c7ad),player);
 const visor=box(.32,.08,.07,0,1.82,.21,mat(0x10182d,0x51e9f5,1.3),player);
 const ring=new THREE.Mesh(new THREE.RingGeometry(.45,.54,28),new THREE.MeshBasicMaterial({color:0x5ce7f2,transparent:true,opacity:.65,side:THREE.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.y=.025;player.add(ring);
 const props=[],keys=new Set(),touch={x:0,y:0};let current='combat',near=null;
 const prompt=document.querySelector('#district-world-prompt'),interact=document.querySelector('#district-interact'),joystick=document.querySelector('#district-joystick-knob');
 const descriptions={
 combat:{kicker:'02 / ACTION TRAINING',title:'Combat District',copy:'Enter the neon training range, line up your shots and activate the glowing targets.',objective:'OBJECTIVE · HIT THE TRAINING TARGETS',label:'COMBAT DISTRICT · ZONE 02',tip:'Approach a holographic target and press E'},
 velocity:{kicker:'03 / SPEED & PRECISION',title:'Velocity Boulevard',copy:'A night-lit street circuit with glowing checkpoints, a show garage and a finish-line challenge.',objective:'OBJECTIVE · REACH THE CHECKPOINT GATE',label:'VELOCITY BOULEVARD · ZONE 03',tip:'Follow the illuminated route to the finish gate'},
 arcade:{kicker:'04 / CLASSIC GAMES',title:'Classic Arcade',copy:'A packed retro-modern arcade with skee-ball lanes, air hockey and a claw machine.',objective:'OBJECTIVE · TRY AN ARCADE CABINET',label:'CLASSIC ARCADE · ZONE 04',tip:'Walk up to a cabinet and press E'},
 social:{kicker:'05 / FOOD & FRIENDS',title:'Food & Social',copy:'Take a break in a lively neon café with a counter, cozy tables and a friendly host.',objective:'OBJECTIVE · SAY HELLO OR GRAB A BITE',label:'FOOD & SOCIAL · ZONE 05',tip:'Visit the host or café counter'},
 vault:{kicker:'06 / COLLECT & CUSTOMISE',title:'The Prize Vault',copy:'Browse illuminated display cases and discover the collector’s gallery. Your earned tokens travel with you.',objective:'OBJECTIVE · EXPLORE THE COLLECTION',label:'THE PRIZE VAULT · ZONE 06',tip:'Approach a display pedestal to inspect it'}
 };
 function addInteract(name,x,z,color,activity,desc){
  const g=new THREE.Group();g.position.set(x,0,z);scene.add(g);
  cylinder(.55,.62,.18,0,.1,0,mat(0x263653),g);
  const glow=new THREE.Mesh(new THREE.TorusGeometry(.38,.045,8,24),mat(color,color,1.4));glow.rotation.x=Math.PI/2;glow.position.y=.22;g.add(glow);
  props.push({group:g,name,activity,desc});
  return g;
 }
 function sign(text,x,z,color=0x5ce7f2){
  const panel=box(4.8,.75,.12,x,3.7,z,mat(0x172440,color,.5));
  const edge=box(5,.06,.16,x,4.1,z,mat(color,color,1.6));return panel;
 }
 function wall(x,z,color){box(.55,5,.55,x,2.5,z,mat(0x1a2742));box(.7,.12,.7,x,4.85,z,mat(color,color,1.5));}
 function clearScene(){for(const o of [...scene.children])if(o!==floor&&o!==grid&&o!==sun&&o!==ambient&&o!==player&&o!==scene.children[0]){scene.remove(o);if(o.geometry)o.geometry.dispose();}props.length=0;}
 function buildDistrict(id){
  current=id;clearScene();player.position.set(0,0,7);player.rotation.y=0;near=null;
  const d=descriptions[id];document.querySelector('#district-world-kicker').textContent=d.kicker;document.querySelector('#district-world-title').textContent=d.title;document.querySelector('#district-world-copy').textContent=d.copy;document.querySelector('#district-world-objective').textContent=d.objective;document.querySelector('#district-world-label').textContent=d.label;document.querySelector('#district-world-tip').textContent=d.tip;
  const palette={combat:0xff5d9d,velocity:0x52e6f5,arcade:0xffc66e,social:0xf58ab9,vault:0x8df0c1},accent=palette[id];
  for(const x of [-13,13])for(const z of [-8,0,8])wall(x,z,accent);
  // Every district has a distinct architectural silhouette and lighting.
  if(id==='combat'){
   sign('NEXUS TRAINING RANGE',0,-12,accent);
   for(let i=0;i<3;i++){const x=-6+i*6;box(2.2,.16,1.5,x,.5,-4,mat(0x26334c));const target=cylinder(.62,.62,.13,x,2.1,-4,mat(0x39223a,accent,.6));target.rotation.x=Math.PI/2;const bull=sphere(.34,x,2.1,-3.91,mat(accent,accent,1.5));bull.scale.z=.25;addInteract('TARGET '+(i+1),x,-4,accent,'combat-target-'+(i+1),'Training target activated');}
   for(let z=-10;z<=4;z+=3)box(18,.035,.035,0,.03,z,mat(0x7b315e,accent,.7));
   box(18,.2,.4,0,.1,-12,mat(0x2d2944));
  }else if(id==='velocity'){
   sign('VELOCITY / NIGHT CIRCUIT',0,-13,accent);
   // Track lanes and luminous edge barriers.
   box(12,.08,27,0,.05,-1,mat(0x202a3d));
   for(let x of [-5.8,5.8]){box(.12,.12,27,x,.13,-1,mat(accent,accent,1.3));for(let z=-12;z<11;z+=2)box(.22,.22,.65,x,.2,z,mat(0x263650));}
   for(let z=-10;z<10;z+=3)box(.08,.025,1.2,0,.11,z,mat(0xdceeff));
   // Decorative electric sports coupe.
   const car=new THREE.Group();car.position.set(-2,0,3);scene.add(car);box(2.4,.55,3.5,0,.75,0,mat(0x253b60,accent,.5),car);box(1.55,.72,1.5,0,1.35,-.15,mat(0x172b49,accent,.35),car);
   for(let x of [-1.1,1.1])for(let z of [-1,1]){const w=cylinder(.38,.38,.22,x,.45,z,mat(0x10131e),car);w.rotation.z=Math.PI/2;}
   for(let x of [-.7,.7])box(.25,.12,.08,x,.85,1.78,mat(0xffe0a0,0xffc76a,1.5),car);
   const gate=box(9,.2,.22,0,3,-10,mat(accent,accent,1.5));box(.2,3,.2,-4.4,1.5,-10,mat(accent,accent,1.5));box(.2,3,.2,4.4,1.5,-10,mat(accent,accent,1.5));
   addInteract('FINISH GATE',0,-9.2,accent,'velocity-finish','Circuit finish crossed');
   addInteract('GARAGE SHOWCASE',-8,3,0x9b83ff,'velocity-garage','Garage showcase inspected');
  }else if(id==='arcade'){
   sign('PIXEL PALACE / PLAY ALL NIGHT',0,-12,accent);
   const defs=[[-7,-3,'SKEE-BALL',0x5ce7f2,'arcade-skee'],[0,-3,'AIR HOCKEY',0xf66bca,'arcade-hockey'],[7,-3,'CLAW MACHINE',0xa78bfa,'arcade-claw']];
   defs.forEach(([x,z,n,c,a])=>{const g=new THREE.Group();g.position.set(x,0,z);scene.add(g);box(2.4,.35,3.5,0,.65,0,mat(0x283653),g);box(2.1,.14,2.8,0,.9,-.1,mat(c,c,.35),g);box(2.3,1.7,.25,0,1.2,-1.65,mat(0x202c49),g);box(1.8,.1,.1,0,2.1,-1.5,mat(c,c,1.5),g);addInteract(n,x,z+2,c,a,n+' challenge started');});
   for(let x of [-10,10]){box(.25,3,12,x,1.5,-2,mat(0x26334d));for(let z=-7;z<4;z+=2)box(.3,.08,.8,x,2.8,z,mat(accent,accent,1));}
  }else if(id==='social'){
   sign('THE AFTERGLOW CAFÉ',0,-12,accent);
   box(9,1.1,1.3,0,1.1,-7,mat(0x35415d));box(9,.14,1.4,0,1.72,-7,mat(accent,accent,.7));
   for(let x of [-6,0,6]){cylinder(.12,.12,1.2,x,.6,0,mat(0x64718a));cylinder(1,1,.16,x,1.25,0,mat(0x3c4563));for(let a=0;a<4;a++){const ang=a*Math.PI/2;box(.7,.8,.7,x+Math.cos(ang)*1.2,.45,Math.sin(ang)*1.2,mat(0x273650));}}
   // Host character.
   const npc=new THREE.Group();npc.position.set(0,0,-4);scene.add(npc);cylinder(.32,.38,1.1,0,.85,0,mat(0xf28ab8),npc);sphere(.27,0,1.55,0,mat(0xe9b99c),npc);box(.55,.1,.12,0,1.6,.24,mat(0x17213b,accent,1),npc);
   addInteract('CAFÉ HOST',0,-4,accent,'social-host','You chatted with the café host');
   addInteract('ORDER COUNTER',0,-7,0xffc66e,'social-order','A fresh snack order placed');
  }else if(id==='vault'){
   sign('THE NEXUS COLLECTION',0,-12,accent);
   for(let i=0;i<5;i++){const x=-8+i*4;box(2.3,2.3,1.2,x,1.15,-4,mat(0x1b2941));box(1.9,1.4,.08,x,1.45,-3.36,mat(0x193d46,accent,.22));cylinder(.42,.42,.16,x,2.35,-3.25,mat(accent,accent,1.5));const gem=new THREE.Mesh(new THREE.OctahedronGeometry(.42),mat(accent,accent,1.3,.25));gem.position.set(x,2.95,-3.25);scene.add(gem);addInteract('DISPLAY '+(i+1),x,-2.2,accent,'vault-display-'+(i+1),'Collection display inspected');}
   for(let z of [-9,1,7]){const pillar=cylinder(.22,.28,2.4,0,1.2,z,mat(0x25364b));cylinder(.5,.5,.12,0,2.45,z,mat(accent,accent,1.4));}
   addInteract('COLLECTOR BONUS',0,5,accent,'vault-bonus','Collector bonus claimed');
  }
  // perimeter rails and animated floating light pylons
  for(let x of [-10,10]){const p=box(.12,3,.12,x,1.5,0,mat(accent,accent,1.5));p.userData.float=true;}
  camera.position.set(0,5.4,14);camera.lookAt(0,1,0);prompt.textContent='WASD / ARROWS TO MOVE · E TO INTERACT';interact.hidden=true;
 }
 function nearestProp(){let found=null,dist=2.8;for(const p of props){const d=player.position.distanceTo(p.group.position);if(d<dist){dist=d;found=p;}}near=found;if(prompt)prompt.textContent=found?'E / TAP  ·  '+found.name:'WASD / ARROWS TO MOVE · EXPLORE '+descriptions[current].title.toUpperCase();if(interact)interact.hidden=!found;}
 function use(){if(!near)return;window.dispatchEvent(new CustomEvent('nexus:district-activity',{detail:{district:current,activity:near.activity,label:near.desc}}));}
 interact.addEventListener('click',use);
 const tabs=[...document.querySelectorAll('[data-world]')];tabs.forEach(t=>t.addEventListener('click',()=>{tabs.forEach(b=>b.classList.toggle('active',b===t));buildDistrict(t.dataset.world);}));
 window.addEventListener('keydown',e=>{const k=e.key.toLowerCase();if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright','e'].includes(k))e.preventDefault();keys.add(k);if(k==='e')use();});
 window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));window.addEventListener('blur',()=>keys.clear());
 const pad=document.querySelector('#district-touch-pad');if(pad){let pid=null;pad.addEventListener('pointerdown',e=>{pid=e.pointerId;pad.setPointerCapture(pid);});pad.addEventListener('pointermove',e=>{if(pid!==e.pointerId)return;const r=pad.getBoundingClientRect(),dx=e.clientX-r.left-r.width/2,dy=e.clientY-r.top-r.height/2,len=Math.max(1,Math.hypot(dx,dy)),scale=Math.min(1,len/(r.width*.34));touch.x=dx/len*scale;touch.y=dy/len*scale;if(joystick)joystick.style.transform='translate('+touch.x*24+'px,'+touch.y*24+'px)';});const stop=e=>{if(pid!==null&&(!e||e.pointerId===pid)){pid=null;touch.x=touch.y=0;if(joystick)joystick.style.transform='translate(0,0)';}};pad.addEventListener('pointerup',stop);pad.addEventListener('pointercancel',stop);}
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));const clock=new THREE.Clock();
 function resize(){const w=Math.max(1,mount.clientWidth),h=Math.max(1,mount.clientHeight);camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h,false);}new ResizeObserver(resize).observe(mount);resize();
 function animate(){requestAnimationFrame(animate);const dt=Math.min(clock.getDelta(),.04);let x=((keys.has('d')||keys.has('arrowright'))?1:0)-((keys.has('a')||keys.has('arrowleft'))?1:0)+touch.x;let z=((keys.has('s')||keys.has('arrowdown'))?1:0)-((keys.has('w')||keys.has('arrowup'))?1:0)+touch.y;const len=Math.hypot(x,z);if(len>.08){x/=Math.max(1,len);z/=Math.max(1,len);player.position.x=clamp(player.position.x+x*5.3*dt,-10.5,10.5);player.position.z=clamp(player.position.z+z*5.3*dt,-10.5,10.5);player.rotation.y=Math.atan2(x,z);}camera.position.lerp(new THREE.Vector3(player.position.x,5.4,player.position.z+8),1-Math.exp(-4*dt));camera.lookAt(player.position.x,player.position.y+1,player.position.z);nearestProp();renderer.render(scene,camera);}
 buildDistrict('combat');animate();
}

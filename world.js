import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';

const mount = document.querySelector('#atrium-world');
if (mount) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x080d20);
  scene.fog = new THREE.Fog(0x080d20, 19, 48);
  const camera = new THREE.PerspectiveCamera(62, 1, .1, 100);
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.7));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  mount.prepend(renderer.domElement);
  renderer.domElement.setAttribute('aria-label','Interactive 3D Grand Atrium. Use WASD or arrow keys to move, or the touch pad.');
  renderer.domElement.setAttribute('role','img');

  scene.add(new THREE.HemisphereLight(0x9bcaff, 0x171329, 2.0));
  const key = new THREE.DirectionalLight(0xffffff, 2.1);
  key.position.set(-7, 13, 8); key.castShadow = true; key.shadow.mapSize.set(1024,1024); scene.add(key);
  const cyan = new THREE.PointLight(0x39dff5, 34, 17); cyan.position.set(0,4,0); scene.add(cyan);
  const pink = new THREE.PointLight(0xf45fbd, 22, 13); pink.position.set(-8,3,-5); scene.add(pink);

  const mat = (color, emissive=0x000000, intensity=0) => new THREE.MeshStandardMaterial({color, roughness:.58, metalness:.25, emissive, emissiveIntensity:intensity});
  const floorMat=mat(0x121a32), wallMat=mat(0x1b2543), trimMat=mat(0x42ddec,0x147d9b,1.5);
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(42,42),floorMat); floor.rotation.x=-Math.PI/2; floor.receiveShadow=true; scene.add(floor);
  const grid=new THREE.GridHelper(42,42,0x245b79,0x1b3555); grid.position.y=.012; scene.add(grid);
  const addBox=(w,h,d,x,y,z,material,cast=true)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);m.position.set(x,y,z);m.castShadow=cast;m.receiveShadow=true;scene.add(m);return m;};
  // Atrium's central illuminated landmark and surrounding architecture.
  addBox(7,4.8,1.2,0,2.4,-10,wallMat);
  addBox(7.2,.12,1.3,0,4.9,-9.98,trimMat,false);
  addBox(2.1,3.3,.18,0,1.7,-9.34,mat(0x263b5d,0x174b70,.8),false);
  for(let i=0;i<7;i++){addBox(.12,3.4,.12,-2.5+i*.83,2.1,-9.22,mat(0x3c9dbb,0x1c7794,1.2),false);}
  for(let x of [-12,12]) for(let z of [-8,0,8]) {
    const pillar=addBox(.65,5,.65,x,2.5,z,wallMat);
    addBox(.78,.12,.78,x,4.85,z,mat(0x9a6bff,0x6544c8,1.8),false);
  }
  // Decorative ceiling ribs, kept open in the middle for a spacious arcade hall.
  for(let z=-10;z<=10;z+=5){addBox(25,.18,.22,0,6,z,mat(0x30466a),false);}
  const machines=[];
  const machineDefs=[
    {name:'NEON HOOPS',x:-7,z:-3,color:0x35dff0,desc:'Basketball challenge'},
    {name:'STAR RACER',x:-3.8,z:-3,color:0xff6fbd,desc:'Coming soon · racing'},
    {name:'PIXEL QUEST',x:3.8,z:-3,color:0xa58aff,desc:'Coming soon · classic arcade'},
    {name:'PRIZE DROP',x:7,z:-3,color:0xffca69,desc:'Prize machine'}
  ];
  machineDefs.forEach((def,index)=>{
    const group=new THREE.Group(); group.position.set(def.x,0,def.z); scene.add(group);
    const body=new THREE.Mesh(new THREE.BoxGeometry(1.35,2.15,.9),mat(0x202b49));body.position.y=1.08;body.castShadow=true;group.add(body);
    const screen=new THREE.Mesh(new THREE.PlaneGeometry(.94,.82),new THREE.MeshStandardMaterial({color:def.color,emissive:def.color,emissiveIntensity:.7,roughness:.3}));screen.position.set(0,1.52,.461);group.add(screen);
    const marquee=new THREE.Mesh(new THREE.BoxGeometry(1.12,.25,.12),mat(def.color,def.color,1.5));marquee.position.set(0,2.05,.48);group.add(marquee);
    const panel=new THREE.Mesh(new THREE.BoxGeometry(.72,.12,.08),mat(0x11182d));panel.position.set(0,.72,.49);group.add(panel);
    const glow=new THREE.PointLight(def.color,3,3);glow.position.set(0,1.7,1);group.add(glow);
    group.userData={...def,index};machines.push(group);
  });
  // Seating and planters add scale and life without blocking navigation.
  for(let x of [-9,9]) {
    const bench=addBox(2.6,.35,.75,x,.35,4,mat(0x293753)); bench.rotation.y=x<0?.12:-.12;
    const planter=new THREE.Mesh(new THREE.CylinderGeometry(.65,.75,.55,12),mat(0x27364b));planter.position.set(x, .28,7);scene.add(planter);
    const plant=new THREE.Mesh(new THREE.SphereGeometry(.8,10,8),mat(0x277b70,0x0d3a34,.3));plant.position.set(x,1.15,7);scene.add(plant);
  }
  const player=new THREE.Group(); scene.add(player);
  const torso=new THREE.Mesh(new THREE.CapsuleGeometry(.34,.7,4,8),mat(0x54dce9,0x1c8295,.35));torso.position.y=1.12;torso.castShadow=true;player.add(torso);
  const head=new THREE.Mesh(new THREE.SphereGeometry(.25,12,10),mat(0xf0c7ad));head.position.y=1.82;player.add(head);
  const visor=new THREE.Mesh(new THREE.BoxGeometry(.34,.09,.08),mat(0x121a34,0x51e9f5,1.2));visor.position.set(0,1.86,.22);player.add(visor);
  player.position.set(0,0,4);
  const marker=new THREE.Mesh(new THREE.RingGeometry(.48,.58,32),new THREE.MeshBasicMaterial({color:0x5ce7f2,transparent:true,opacity:.7,side:THREE.DoubleSide}));marker.rotation.x=-Math.PI/2;marker.position.y=.035;player.add(marker);
  camera.position.set(0,5.4,10); camera.lookAt(0,1,0);

  const keys=new Set(), move={x:0,y:0}; let selected=null;
  const prompt=document.querySelector('#machine-prompt');
  const touchPad=document.querySelector('#touch-pad');
  const joystick=document.querySelector('#joystick-knob');
  const interact=document.querySelector('#interact-machine');
  const announce=(text)=>{if(prompt)prompt.textContent=text;};
  function chooseMachine(){
    let nearest=null,dist=2.6;
    for(const m of machines){const d=player.position.distanceTo(m.position);if(d<dist){dist=d;nearest=m;}}
    selected=nearest;
    if(selected){announce('E / TAP  ·  '+selected.userData.name);}
    else {announce('WASD / ARROWS TO MOVE  ·  EXPLORE THE ATRIUM');}
    if(interact)interact.hidden=!selected;
  }
  function useMachine(){
    if(!selected)return;
    window.dispatchEvent(new CustomEvent('nexus:machine',{detail:selected.userData}));
  }
  interact?.addEventListener('click',useMachine);
  const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
  renderer.domElement.addEventListener('pointerdown',e=>{
    const rect=renderer.domElement.getBoundingClientRect();
    pointer.x=((e.clientX-rect.left)/rect.width)*2-1;
    pointer.y=-((e.clientY-rect.top)/rect.height)*2+1;
    raycaster.setFromCamera(pointer,camera);
    const hit=raycaster.intersectObjects(machines,true)[0];
    if(hit){let root=hit.object;while(root.parent && !root.userData.name)root=root.parent;const target=root;if(target.userData.name && player.position.distanceTo(target.position)<4.2){selected=target;useMachine();}}
  });
  window.addEventListener('keydown',e=>{const k=e.key.toLowerCase();if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright','e',' '].includes(k))e.preventDefault();keys.add(k);if(k==='e')useMachine();});
  window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
  window.addEventListener('blur',()=>keys.clear());
  if(touchPad){
    let activeId=null;
    touchPad.addEventListener('pointerdown',e=>{activeId=e.pointerId;touchPad.setPointerCapture(activeId);});
    touchPad.addEventListener('pointermove',e=>{
      if(activeId!==e.pointerId)return;
      const r=touchPad.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;
      const dx=e.clientX-cx,dy=e.clientY-cy,len=Math.max(1,Math.hypot(dx,dy)),scale=Math.min(1,len/(r.width*.34));
      move.x=dx/len*scale;move.y=dy/len*scale;
      if(joystick)joystick.style.transform='translate('+move.x*24+'px,'+move.y*24+'px)';
    });
    const release=e=>{if(activeId!==null && (!e || e.pointerId===activeId)){activeId=null;move.x=move.y=0;if(joystick)joystick.style.transform='translate(0,0)';}};
    touchPad.addEventListener('pointerup',release);touchPad.addEventListener('pointercancel',release);
  }
  const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
  const clock=new THREE.Clock();
  function resize(){const w=Math.max(1,mount.clientWidth),h=Math.max(1,mount.clientHeight);camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h,false);}
  new ResizeObserver(resize).observe(mount);resize();
  function animate(){
    requestAnimationFrame(animate);
    const dt=Math.min(clock.getDelta(),.04);
    let x=(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0)+move.x;
    let z=(keys.has('s')||keys.has('arrowdown')?1:0)-(keys.has('w')||keys.has('arrowup')?1:0)+move.y;
    const len=Math.hypot(x,z);
    if(len>.08){x/=Math.max(1,len);z/=Math.max(1,len);player.position.x=clamp(player.position.x+x*5.2*dt,-10.5,10.5);player.position.z=clamp(player.position.z+z*5.2*dt,-7.2,10.5);player.rotation.y=Math.atan2(x,z);}
    const target=new THREE.Vector3(player.position.x,player.position.y+1,player.position.z);
    camera.position.lerp(new THREE.Vector3(player.position.x,5.3,player.position.z+7.7),1-Math.exp(-4*dt));
    camera.lookAt(target);
    machines.forEach(m=>{m.children[1].material.emissiveIntensity=.55+Math.sin(performance.now()*.002+m.position.x)*.22;});
    chooseMachine();
    renderer.render(scene,camera);
  }
  animate();
}

import test from 'node:test';
import assert from 'node:assert/strict';

// Minimal stand-ins for the browser and three.js: lobby-crowd only needs objects with transforms and canvases it can draw on.
const ctx2d=new Proxy({},{get:(_,k)=>k==='measureText'?()=>({width:10}):k==='createRadialGradient'?()=>({addColorStop(){}}):()=>{},set:()=>true});
globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>ctx2d})};
globalThis.window={};
const v3=()=>({x:0,y:0,z:0,set(x,y,z){this.x=x;this.y=y;this.z=z;return this;},setScalar(s){return this.set(s,s,s);}});
class Obj{constructor(){this.position=v3();this.rotation=v3();this.scale=v3();this.center=v3();this.children=[];this.userData={};this.visible=true;this.material={opacity:1};}add(c){this.children.push(c);}}
const THREE={Object3D:Obj,Group:Obj,Mesh:Obj,Sprite:Obj,MeshBasicMaterial:class{},SpriteMaterial:class{},CircleGeometry:class{},OctahedronGeometry:class{},PlaneGeometry:class{},CanvasTexture:class{},SRGBColorSpace:'srgb'};
const {createCrowd}=await import('../lobby-crowd.js');

function cabinet(x,z){const c=new Obj();c.position.set(x,0,z);c.userData.lamp={boost:0};return c;}
const makeCrowd=(cabinets,count,rand=()=>0)=>createCrowd({THREE,scene:new Obj(),cabinets,count,rand,makeActor:()=>({root:new Obj(),set(){}})});

test('a visitor who gets stuck on the way to a cabinet hands it to the next one in the queue',()=>{
 // rand()=0 makes both visitors pick the only cabinet: the first claims it, the second queues behind.
 const crowd=makeCrowd([cabinet(-5.2,0)],2);
 let t=0;const step=()=>{t+=1/30;crowd.update(t,null);};
 for(let i=0;i<40&&!crowd.crowd[1].cab;i++)step();
 const [a,b]=crowd.crowd,cab=a.cab;
 assert.ok(cab&&cab.occ===a&&cab.queue[0]===b,'setup: one playing, one queued');
 // Pin the occupant in place so the stuck detector fires before it reaches the cabinet.
 a.stuckT=10;step();
 assert.notEqual(a.cab,cab,'the stuck visitor gave up the cabinet');
 assert.equal(cab.occ,b,'the queued visitor was promoted instead of being stranded');
 for(let i=0;i<600&&b.state!=='play';i++)step();
 assert.equal(b.state,'play','the promoted visitor reaches the cabinet and plays');
});

test('the crowd keeps moving for a long simulated session without NaN positions',()=>{
 let seed=7;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 const crowd=makeCrowd([cabinet(-5.2,-6),cabinet(5.2,-6),cabinet(-5.2,2),cabinet(5.2,2)],8,rand);
 for(let i=1;i<=20*60*3;i++)crowd.update(i/60,{x:0,y:0,z:4});
 for(const v of crowd.crowd)assert.ok(Number.isFinite(v.g.position.x+v.g.position.z+v.g.rotation.y),v.name+' has a finite pose');
});

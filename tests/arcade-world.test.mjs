import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const [html,game,world,immersive]=await Promise.all([
 readFile(new URL('../arcade.html',import.meta.url),'utf8'),
 readFile(new URL('../arcade.js',import.meta.url),'utf8'),
 readFile(new URL('../arcade-world.js',import.meta.url),'utf8'),
 readFile(new URL('../arcade-game3d.js',import.meta.url),'utf8')
]);
const ids=['skeeball','airhockey','whack','target','memory','rhythm','meteor','racer','stack','pinball','claw','chef','sushi','mixology'];

test('arcade opens as one walkable RPG district with all fourteen cabinets and no game catalogue below it',()=>{
 for(const id of ids)assert.ok(world.includes("'"+id+"'"),'missing world cabinet '+id);
 assert.match(world,/\['NEON HOOPS','hoops'/);
 assert.match(html,/id="arcade-world"/);
 assert.doesNotMatch(html,/class="game-grid"/);
 assert.doesNotMatch(html,/class="game-list-heading"/);
 assert.match(html,/href="\.\/index\.html"/);
 assert.match(world,/new THREE\.OrthographicCamera/);
});


test('player avatar is a detailed articulated clay character, not a flat SVG/blob',()=>{
 for(const feature of ['const head=new THREE.Group()','const mouthCurve=new THREE.CatmullRomCurve3','const arms=[],legs=[]','function makeArm(side)','function makeLeg(side)','eyeWhite','irisMat','hairCap'])assert.ok(world.includes(feature),'missing sculpted avatar feature '+feature);
 assert.match(world,/new THREE\.CapsuleGeometry\(\.135/);
 assert.match(world,/new THREE\.TubeGeometry\(mouthCurve/);
 assert.match(world,/legs\.forEach\(\(leg,i\)=>leg\.rotation\.x=Math\.sin\(walk\+i\*Math\.PI\)\*\.48\)/);
});
test('walk-up restaurant services are detected and take priority over cabinet prompts',()=>{
 assert.match(world,/activeService=null;let serviceDistance=3\.5;for\(const service of services\)/);
 assert.match(world,/nexus:service-open/);
 assert.match(world,/if\(activeService\)useService\(\);else useCabinet\(\)/);
 assert.match(world,/activeService\.type==='table'/);
});

test('every playable cabinet has a 3D model and launches its matching game',()=>{
 for(const id of ids)assert.ok(world.includes("'"+id+"'"),'missing 3D cabinet '+id);
 assert.match(world,/nexus:arcade-play/);
 assert.match(game,/nexus:arcade-play/);
 assert.match(game,/window\.nexusPlayArcadeGame=open/);
});

test('arcade includes keyboard, touch and proximity interactions',()=>{
 assert.match(world,/arrowup/);assert.match(world,/arcade-touch-pad/);
 assert.match(world,/dmin=4\.1/);assert.match(world,/if\(k==='e'\)\{if\(activeService\)useService\(\);else useCabinet\(\);\}/);
});

test('each mini-game defines a distinct instruction set and scoring mechanics',()=>{
 for(const id of ids)assert.ok(game.includes(id+':['),'missing game definition '+id);
 for(const mechanic of ['scoreBy','finish','nextSequence','dropStack','grabClaw','hitRhythm'])assert.ok(game.includes(mechanic));
});

test('air hockey uses predictive goalie movement, physical paddle returns and rally scoring',()=>{
 assert.match(game,/projected arrival/);
 assert.match(game,/p\.aiMood=incoming\?'intercept':'guard'/);
 assert.match(game,/q\.y>375&&q\.y<430/);
 assert.match(game,/p\.rally\+\+/);
 assert.match(game,/const speed=Math\.hypot\(q\.vx,q\.vy\),cap=570/);
 assert.match(game,/p\.goal>=5/);
 assert.match(game,/p\.botGoal>=5/);
});

test('restaurant district has bar, host stand, dining tables and a token-priced menu',()=>{
 assert.match(world,/THE GLOW BAR/);
 assert.match(world,/HOST/);
 assert.match(world,/makeTable\(5\.8,5\.3,1\)/);
 assert.match(world,/nexus:service-open/);
 assert.match(html,/id="service-modal"/);
 assert.match(game,/foodMenu=/);
 assert.match(game,/drinkMenu=/);
 assert.match(game,/saved\.tokens=balance-cost/);
 assert.match(game,/saved\.reservation=/);
});
test('restaurant orders progress through preparation, pickup and table delivery',()=>{
 assert.match(world,/type:'pass'/);
 assert.match(world,/KITCHEN PASS · COLLECT ORDERS/);
 for(const state of ['Preparing','Ready','Carrying','Served'])assert.ok(game.includes("'"+state+"'"));
 assert.match(game,/prepSeconds:12/);
 assert.match(game,/collectedAt/);
 assert.match(game,/servedAt/);
 assert.match(game,/find\(t=>!occupied\.includes\(t\)\)/);
});
test('cooking and mixology mistakes have real failure consequences',()=>{
 assert.match(game,/p\.ticketClock>9/);
 assert.match(game,/p\.misses\+\+;p\.combo=0/);
 assert.match(game,/if\(p\.misses>=3\)\{finish\(\);return;\}/);
 assert.match(game,/function pourMix\(/);
 assert.match(game,/if\(game==='mixology'\)pourMix\(\)/);
});
test('Kitchen Rush runs as a dedicated Three.js claymation room with 3D ingredient interaction',()=>{
 assert.match(html,/id="game3d-stage"/);
 assert.match(html,/arcade-game3d\.js/);
 assert.match(game,/nexus:game3d-open/);
 assert.match(game,/nexus:game3d-start/);
 assert.match(game,/nexus:game3d-stop/);
 assert.match(game,/if\(game==='chef'\)\{window\.dispatchEvent/);
 assert.match(immersive,/new THREE\.WebGLRenderer/);
 
 for(const feature of ['PerspectiveCamera','Raycaster','KITCHEN TICKET','THE NEXUS KITCHEN','misses>=3','arcadeBest\.chef','ingredients'])assert.ok(immersive.includes(feature),'missing 3D gameplay feature '+feature);
});
test('three new cabinets have distinct kitchen, catching and timing gameplay loops',()=>{
 for(const id of ['chef','sushi','mixology']){assert.ok(game.includes(id+':['));assert.ok(game.includes("case'"+id+"'"));}
 assert.match(game,/ticketTarget/);
 assert.match(game,/catchStreak/);
 assert.match(game,/mixRound/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const [html,game,world,immersive]=await Promise.all([
 readFile(new URL('../arcade.html',import.meta.url),'utf8'),
 readFile(new URL('../arcade.js',import.meta.url),'utf8'),
 readFile(new URL('../arcade-world.js',import.meta.url),'utf8'),
 readFile(new URL('../arcade-game3d.js',import.meta.url),'utf8')
]);
const ids=['skeeball','airhockey','whack','target','memory','rhythm','meteor','racer','stack','pinball','claw','chef','sushi','mixology','pulse','moto','moonquest'];

test('arcade opens as one walkable RPG district with all seventeen mini-game cabinets and no game catalogue below it',()=>{
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
test('kitchen, catching and timing cabinets have distinct gameplay loops',()=>{
 for(const id of ['chef','sushi','mixology']){assert.ok(game.includes(id+':['));assert.ok(game.includes("case'"+id+"'"));}
 assert.match(game,/ticketTarget/);
 assert.match(game,/catchStreak/);
 assert.match(game,/mixRound/);
});

test('player character has expressive blinking and subtle stop-motion clay idle animation',()=>{
 assert.match(world,/const arms=\[\],legs=\[\],hands=\[\],blinkLids=\[\],hairCurls=\[\]/);
 assert.match(world,/const eye=new THREE\.Group\(\)/);
 assert.match(world,/blinkLids\.forEach\(lid=>\{lid\.scale\.y=/);
 assert.match(world,/nextBlink=2\.4,blinkUntil=0/);
 assert.match(world,/head\.rotation\.x=Math\.sin\(t\*\.83\)/);
 assert.match(world,/hairCurls\.forEach\(curl=>\{/);
 assert.match(world,/curl\.scale\.y=\.72\+Math\.sin\(phase\+1\)\*\.012/);
});

test('avatar animation state is initialized before facial and hair meshes use it',()=>{
 assert.ok(world.indexOf('const arms=[],legs=[],hands=[],blinkLids=[],hairCurls=[];')<world.indexOf('blinkLids.push(lid)'));
 assert.ok(world.indexOf('const arms=[],legs=[],hands=[],blinkLids=[],hairCurls=[];')<world.indexOf('hairCurls.push(curl)'));
});
test('player greets services, reacts to cabinets and celebrates arcade wins',()=>{
 assert.match(world,/triggerGesture\('wave',1\.55\)/);
 assert.match(world,/triggerGesture\('excited',1\.1\)/);
 assert.match(world,/gesture==='celebrate'/);
 assert.match(world,/hands\[1\]\.rotation\.z=Math\.sin\(t\*13\)/);
 assert.match(game,/if\(win\)window\.dispatchEvent\(new CustomEvent\('nexus:character-celebrate'\)\)/);
});

test('host, bartender and chef have distinct articulated claymation routines and guest reactions',()=>{
 assert.match(world,/const hostArms=\[\]/);
 assert.match(world,/hostWelcomeUntil/);
 assert.match(world,/hostEyeLids\.forEach/);
 assert.match(world,/function makeStaff\(x,z,shirt,hat,role\)/);
 assert.match(world,/role==='bartender'/);
 assert.match(world,/makeStaff\(10\.4,-5\.2,0xd58b79,true,'chef'\)/);
 assert.match(world,/staff\.role==='bartender'/);
 assert.match(world,/staff\.head\.rotation\.y=near\?/);
 assert.match(world,/staff\.propPivot\.rotation\.z=Math\.sin\(staff\.phase\*2\.4\)/);
 assert.match(world,/staff\.propPivot\.rotation\.z=Math\.sin\(staff\.phase\*1\.7\)/);
 assert.match(world,/g\.userData\.steam/);
 assert.match(world,/staff\.lids\.forEach/);
});

test('three new original cabinets have distinct action-platformer, motorcycle and adventure gameplay',()=>{
 for(const id of ['pulse','moto','moonquest']){assert.ok(game.includes(id+':['),'missing game definition '+id);assert.ok(game.includes("case'"+id+"':"),'missing game draw '+id);}
 assert.match(game,/type:'platform'/);
 assert.match(game,/type:'boss'/);
 assert.match(game,/p\.energy--/);
 assert.match(game,/type==='ramp'/);
 assert.match(game,/type==='gap'/);
 assert.match(game,/type==='barrel'/);
 assert.match(game,/p\.shards>=3/);
 assert.match(game,/type==='shard'/);
 assert.match(game,/p\.swing>0/);
 assert.match(world,/\['PULSE RUNNER','pulse','ACTION','16'/);
 assert.match(world,/\['BARRELSTORM MOTO','moto','MOTORCROSS','17'/);
 assert.match(world,/\['MOONSHARD LEGEND','moonquest','ADVENTURE','18'/);
 assert.match(world,/const side=i<9\?-1:1,slot=i%9/);
});
test('restaurant NPCs change expression and react to order creation, readiness and delivery',()=>{
 assert.match(world,/const cheeks=\[sphere/);
 assert.match(world,/const brows=\[sphere/);
 assert.match(world,/staff\.smile\.scale\.y=reacting\?1\.5/);
 assert.match(world,/nexus:order-created/);
 assert.match(world,/nexus:order-ready/);
 assert.match(world,/nexus:order-served/);
 assert.match(game,/new CustomEvent\('nexus:order-created'/);
 assert.match(game,/new CustomEvent\('nexus:order-ready'/);
 assert.match(game,/new CustomEvent\('nexus:order-served'/);
});

test('Moonshard Legend has three persistent dungeon areas with gated progression and a final guardian',()=>{
 assert.match(game,/function buildMoonRoom\(room\)/);
 assert.match(game,/OVERGROWN RUINS/);
 assert.match(game,/SUNKEN SANCTUM/);
 assert.match(game,/MOONKEEP/);
 assert.match(game,/p\.room\+\+/);
 assert.match(game,/p\.shards>=required/);
 assert.match(game,/type:'boss'/);
 assert.match(game,/p\.bossDefeated=true/);
 assert.match(game,/telegraph/);
});
test('Moonshard equipment has gameplay effects rather than cosmetic labels',()=>{
 assert.match(game,/p\.swordLevel=1/);
 assert.match(game,/o\.hp-=p\.swordLevel/);
 assert.match(game,/p\.boots\?275:210/);
 assert.match(game,/if\(!p\.boots\)p\.boots=true/);
 assert.match(game,/p\.shield=true/);
 assert.match(game,/e\.key\.toLowerCase\(\)==='x'\)p\.shield=!p\.shield/);
 assert.match(game,/p\.guard&&p\.shield/);
 assert.match(game,/p\.touchGuard=true/);
 assert.match(game,/p\.touchGuard=false/);
 assert.match(game,/keys\.C\|\|p\.touchGuard/);
});

test('arcade mini-games have a hand-drawn paper finish and tactile clay detailing',()=>{
 assert.match(game,/paperPattern=ctx\.createPattern\(paper,'repeat'\)/);
 assert.match(game,/function painterlyFinish\(\)/);
 assert.match(game,/function drawKeyboardCursor\(\)/);
 assert.match(game,/quadraticCurveTo\(-r\*\.48,r\*\.42/);
 assert.match(game,/Kalam, cursive/);
});
test('computer players can navigate pointer-led games with arrows and activate with Enter',()=>{
 assert.match(game,/cursorGames=!\['pulse','moto','moonquest','racer','sushi','meteor'\]/);
 assert.match(game,/e\.key==='Enter'&&keyboardAim/);
 assert.match(game,/ARROWS \+ ENTER/);
 assert.match(game,/arrowKeys=\['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'\]/);
});
test('mobile arcade movement eases joystick input and accelerates smoothly instead of snapping',()=>{
 assert.match(world,/targetX:0,targetY:0/);
 assert.match(world,/Math\.exp\(-dt\*17\)/);
 assert.match(world,/motion\.x\+\=\(x\*5\.1-motion\.x\)\*response/);
 assert.match(world,/touch\.targetX=touch\.targetY=0/);
 assert.match(world,/Math\.min\(devicePixelRatio\|\|1,matchMedia/);
});

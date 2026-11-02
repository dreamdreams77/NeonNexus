import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const [html,game,world,immersive,css]=await Promise.all([
 readFile(new URL('../arcade.html',import.meta.url),'utf8'),
 readFile(new URL('../arcade.js',import.meta.url),'utf8'),
 readFile(new URL('../arcade-world.js',import.meta.url),'utf8'),
 readFile(new URL('../arcade-game3d.js',import.meta.url),'utf8'),
 readFile(new URL('../arcade.css',import.meta.url),'utf8')
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
 assert.match(world,/if\(activeService\)useService\(\);else if\(activeTableGame\)useTableGame\(\);else useCabinet\(\)/);
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
 assert.match(world,/dmin=4\.1/);assert.match(world,/if\(k==='e'\)\{if\(activeService\)useService\(\);else if\(activeTableGame\)useTableGame\(\);else useCabinet\(\);\}/);
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
 assert.match(immersive,/const clayGrain=\(\(\)=>/);
 assert.match(immersive,/bumpMap:clayGrain,bumpScale:\.065/);
});
test('computer players can navigate pointer-led games with arrows and activate with Enter',()=>{
 assert.match(game,/cursorGames=!\['pulse','moto','moonquest','racer','sushi','meteor'\]/);
 assert.match(game,/e\.key==='Enter'&&keyboardAim/);
 assert.match(game,/ARROWS \+ ENTER/);
 assert.match(game,/arrowKeys=\['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'\]/);
});
test('mobile arcade movement eases joystick input and accelerates smoothly instead of snapping',()=>{
 assert.match(world,/targetX:0,targetY:0/);
 assert.match(world,/Math\.exp\(-dt\*22\)/);
 assert.match(world,/motion\.x\+\=\(x\*5\.1-motion\.x\)\*response/);
 assert.match(world,/touch\.targetX=touch\.targetY=0/);
 assert.match(world,/Math\.min\(devicePixelRatio\|\|1,mobileDevice\?1\.2:1\.5/);
 assert.match(world,/antialias:!mobileDevice/);
 assert.match(world,/renderer\.shadowMap\.enabled=!mobileDevice/);
 assert.match(world,/cameraTarget\.set\(player\.position\.x/);
 assert.match(world,/camera\.position\.lerp\(cameraTarget,1-Math\.exp\(-7\.2\*dt\)\)/);
});

test('approaching a cabinet previews its genre, gameplay loop, challenge and controls before interaction range',()=>{
 assert.match(html,/id="cabinet-discovery"/);
 for(const field of ['discovery-title','discovery-genre','discovery-description','discovery-challenge','discovery-controls','discovery-action'])assert.ok(html.includes('id="'+field+'"'),'missing discovery field '+field);
 for(const id of ids.concat(['hoops']))assert.ok(world.includes(id+':{label:'),'missing player-facing guide for '+id);
 assert.match(world,/discoverDistance=7\.6/);
 assert.match(world,/let dmin=4\.1,discovered=null,discoverDistance=7\.6/);
 assert.match(world,/else if\(discovered\)\{prompt\.textContent='GAME PREVIEW/);
 assert.match(world,/discoveryRing\.visible=!!discovered/);
 assert.match(world,/if\(discovered&&!activeService&&!activeTableGame\)/);
});
test('storybook environment has painted wall art, handmade planters and drifting light-catching dust',()=>{
 assert.match(world,/function muralTexture\(\)/);
 assert.match(world,/new THREE\.PlaneGeometry\(5\.3,2\.15\)/);
 assert.match(world,/function makePlanter\(x,z,flip=1\)/);
 assert.match(world,/new THREE\.CylinderGeometry\(\.42,\.3,\.58,11\)/);
 assert.match(world,/const motes=new THREE\.Points/);
 assert.match(world,/motesAttr\.needsUpdate=true/);
 assert.match(css,/Cabinet discovery: an editorial mini-preview/);
});

test('all eighteen cabinets show their own animated gameplay vignette rather than a static title card',()=>{
 assert.match(world,/function makeCabinetPreview\(id,color\)/);
 assert.match(world,/function drawCabinetPreview\(p,frame\)/);
 assert.match(world,/new THREE\.CanvasTexture\(canvas\)/);
 assert.match(world,/map:screenTex,emissive:color/);
 for(const id of ['hoops','skeeball','airhockey','whack','target','memory','rhythm','meteor','racer','stack','pinball','claw','chef','sushi','mixology','pulse','moto','moonquest'])assert.ok(world.includes("case'"+id+"':"),'missing animated screen scene for '+id);
 assert.match(world,/drawCabinetPreview\(preview,0\)/);
 assert.match(world,/drawCabinetPreview\(preview,preview\.frame\)/);
 assert.match(world,/preview\.frame\+\+/);
});
test('cabinet screen animation is throttled and limited to nearby machines for mobile performance',()=>{
 assert.match(world,/previewSet=previewSetCache/);
 assert.match(world,/nextPreviewRefresh=t\+\.25/);
 assert.match(world,/slice\(0,4\)/);
 assert.match(world,/previewSet\.has\(c\)/);
 assert.match(world,/preview\.clock>=\.12/);
 assert.match(world,/preview\.clock=0/);
 assert.match(world,/document\.visibilityState==='visible'/);
 assert.match(world,/!reduceMotion/);
 assert.match(world,/gameOverlay\.hidden/);
 assert.match(world,/serviceModal\.hidden/);
 assert.match(world,/texture\.anisotropy=Math\.min\(4,renderer\.capabilities\.getMaxAnisotropy\(\)\)/);
});
test('direct cabinet screen clicks obey the same 4.1-unit interaction range as proximity prompts',()=>{
 assert.match(world,/player\.position\.distanceTo\(o\.position\)<4\.1/);
 assert.doesNotMatch(world,/player\.position\.distanceTo\(o\.position\)<5\.8/);
});

test('animated preview scenes map one-to-one to the eighteen registered cabinet game IDs',()=>{
 const definitions=world.match(/const definitions=\[([\s\S]*?)\n \];/);
 assert.ok(definitions,'cabinet definitions should be present');
 const definitionIds=[...definitions[1].matchAll(/\['[^']+','([^']+)'/g)].map(m=>m[1]).sort();
 const renderer=world.match(/function drawCabinetPreview\(p,frame\)\{([\s\S]*?)\n \}/);
 assert.ok(renderer,'preview renderer should be present');
 const previewIds=[...renderer[1].matchAll(/case'([^']+)':/g)].map(m=>m[1]).sort();
 assert.deepEqual(previewIds,definitionIds,'each registered cabinet must have exactly one preview scene');
 assert.equal(new Set(previewIds).size,18,'preview IDs must not be duplicated');
});
test('cabinet previews stop while a game or service modal is open and respect reduced-motion settings',()=>{
 assert.match(world,/const gameOverlay=document\.querySelector\('#overlay'\),serviceModal=document\.querySelector\('#service-modal'\),reduceMotion=matchMedia\('\(prefers-reduced-motion: reduce\)'\)\.matches/);
 assert.match(world,/previewEnabled=!reduceMotion&&document\.visibilityState==='visible'/);
 assert.match(world,/\(!gameOverlay\|\|gameOverlay\.hidden\)/);
 assert.match(world,/\(!serviceModal\|\|serviceModal\.hidden\)/);
});

test('the central arcade floor has walk-up air hockey and billiards tables with interaction prompts',()=>{
 assert.match(world,/function makeAirHockeyTable\(\)/);
 assert.match(world,/function makeBilliardsTable\(\)/);
 assert.match(world,/gameTables\.push\(\{gameId:'airhockey'/);
 assert.match(world,/gameTables\.push\(\{gameId:'billiards'/);
 assert.match(world,/makeAirHockeyTable\(\);makeBilliardsTable\(\)/);
 assert.match(world,/function useTableGame\(\)/);
 assert.match(world,/nexus:table-play/);
 assert.match(world,/10 TOKEN ENTRY/);
 assert.match(world,/activeTableGame/);
});
test('air hockey and billiards table matches charge a ten-token entry and pay eighteen tokens on victory',()=>{
 assert.match(game,/function openTableGame\(id\)/);
 assert.match(game,/stake:10,payout:18/);
 assert.match(game,/balance<activeTableDuel\.stake/);
 assert.match(game,/saved\.tokens=balance-activeTableDuel\.stake/);
 assert.match(game,/win\?p\.tableDuel\.payout:0/);
 assert.match(game,/ENTRY FEE LOST/);
 assert.match(game,/nexus:table-play/);
});
test('Moonlight Billiards is a CPU eight-ball game with cue physics, collisions, rails, pockets and turns',()=>{
 assert.match(game,/billiards:\['MOONLIGHT BILLIARDS'/);
 assert.match(game,/p\.cue=\{x:450,y:365,vx:0,vy:0,number:0,r:10\.5\}/);
 assert.match(game,/p\.cpuWait/);
 assert.match(game,/p\.current==='cpu'/);
 assert.match(game,/type:'poolball'/);
 assert.match(game,/const pockets=\[\[155,125\]/);
 assert.match(game,/const impulse=\-\(1\+\.94\)\*rel\*\.5/);
 assert.match(game,/const active=\[p\.cue,\.\.\.balls\]\.filter\(b=>!b\.pocketed\)/);
 assert.match(game,/if\(p\.current==='player'\)\{p\.playerPotted\.push\(b\.number\);scoreBy\(15\);\}else p\.cpuPotted\.push\(b\.number\)/);
 assert.match(game,/p\.playerGroup/);
 assert.match(game,/p\.cpuGroup/);
 assert.match(game,/b\.number===8/);
 assert.match(game,/p\.cueScratch/);
 assert.match(game,/p\.settleClock>\.55/);
 assert.match(game,/p\.current=p\.current==='player'\?'cpu':'player'/);
});
test('billiards supports mouse, touch and keyboard cue aiming and renders a hand-finished table',()=>{
 assert.match(game,/p\.aiming=true/);
 assert.match(game,/p\.cue\.vx=dx\/d\*power/);
 assert.match(game,/if\(e\.key==='Enter'&&keyboardAim\)/);
 assert.match(game,/case'billiards':/);
 assert.match(game,/drawPoolBall/);
 assert.match(game,/ctx\.createRadialGradient\(b\.x-4,b\.y-5/);
 assert.match(game,/pointerKeys=\['skeeball','airhockey','billiards'/);
});
test('mobile rendering reduces GPU cost and world camera smoothing reuses its target vector',()=>{
 assert.match(world,/antialias:!mobileDevice/);
 assert.match(world,/renderer\.shadowMap\.enabled=!mobileDevice/);
 assert.match(world,/renderer\.setPixelRatio\(Math\.min\(devicePixelRatio\|\|1,mobileDevice\?1\.2:1\.5\)\)/);
 assert.match(world,/const clamp=\(v,a,b\)=>Math\.max\(a,Math\.min\(b,v\)\),clock=new THREE\.Clock\(\),cameraTarget=new THREE\.Vector3\(\)/);
 assert.match(world,/cameraTarget\.set\(player\.position\.x/);
 assert.match(world,/if\(\(moteFrame\+\+%2\)===0\)/);
 assert.match(world,/nextPreviewRefresh=t\+\.25/);
});

test('arcade floor uses instanced textured tiles to cut draw calls while preserving the handmade surface',()=>{
 assert.match(world,/new THREE\.InstancedMesh\(new RoundedBoxGeometry\(1\.92,\.035,1\.92,2,\.035\)/);
 assert.match(world,/floorTiles\.setColorAt/);
 assert.match(world,/floorTiles\.instanceMatrix\.needsUpdate=true/);
 assert.match(world,/function feltTexture\(base\)/);
 assert.match(world,/map:airFelt,roughness:\.72,bumpMap:grain/);
 assert.match(world,/map:poolFelt,roughness:\.88,bumpMap:grain/);
 assert.match(world,/blockedX=gameTables\.some/);
});
test('billiards rack contains one each of balls 1–15 with the eight ball at the triangle centre',()=>{
 assert.match(game,/const eight=rack\[4\],swap=rack\[7\];eight\.number=8;swap\.number=5/);
 assert.match(game,/b\.number>8/);
 assert.match(game,/b\.number===8/);
 assert.match(game,/!b\.pocketed&&b\.number!==8/);
});

test('the arcade has a physical prize exchange counter with walk-up interaction',()=>{
 assert.match(world,/prizeCounterPosition=new THREE\.Vector3\(-8\.55,0,4\.7\)/);
 assert.match(world,/PRIZE EXCHANGE/);
 assert.match(world,/type:'prize',name:'PRIZE EXCHANGE · REDEEM TICKETS'/);
 assert.match(world,/prizeCounterPosition/);
 assert.match(world,/activeService\.type/);
});
test('tickets are a separate persistent currency from dining tokens and every cabinet awards them',()=>{
 assert.match(html,/id="arcade-tokens"/);
 assert.match(html,/id="arcade-tickets"/);
 assert.match(game,/const ticketsEarned=Math\.max\(2,Math\.floor\(score\/9\)/);
 assert.match(game,/saved\.tickets=\(Number\(saved\.tickets\)\|\|0\)\+ticketsEarned/);
 assert.match(game,/saved\.ticketHistory\.unshift\(\{game,score,amount:ticketsEarned,at:Date\.now\(\)\}\)/);
 assert.match(game,/\+ticketsEarned\+' TICKETS'/);
 assert.match(game,/function writePlayer\(saved\).*arcade-tickets/);
});
test('the prize exchange has varied categories, rarity, ticket prices and limited stock',()=>{
 for(const category of ['Plush','Toys','Collectibles','Tech','Big Wins'])assert.ok(game.includes("category:'"+category+"'"),'missing prize category '+category);
 for(const rarity of ['COMMON','UNCOMMON','RARE','EPIC','LEGENDARY'])assert.ok(game.includes("rarity:'"+rarity+"'"),'missing rarity '+rarity);
 assert.match(game,/stock:\d+/);
 assert.match(game,/cost:\d+/);
 assert.match(game,/prizeCategories=\['All','Plush','Toys','Collectibles','Tech','Big Wins'\]/);
 assert.match(game,/LIMITED STOCK/);
});
test('prize redemption checks balance and stock, deducts tickets, and adds the item to the player collection',()=>{
 assert.match(game,/function redeemPrize\(item\)/);
 assert.match(game,/if\(stock<=0\)/);
 assert.match(game,/if\(tickets<item\.cost\)/);
 assert.match(game,/saved\.tickets=tickets-item\.cost/);
 assert.match(game,/saved\.prizeStock\[item\.id\]=stock-1/);
 assert.match(game,/owned\.quantity\+\+/);
 assert.match(game,/saved\.prizeHistory\.unshift/);
 assert.match(game,/nexus:prize-redeemed/);
});
test('players can browse prize categories and review their own prize haul and redemption history',()=>{
 assert.match(html,/id="prize-filters"/);
 assert.match(html,/id="prize-view-toggle"/);
 assert.match(html,/id="prize-collection"/);
 assert.match(game,/prizeView==='shop'\?'haul':'shop'/);
 assert.match(game,/YOUR PRIZE HAUL/);
 assert.match(game,/RECENT REDEMPTIONS/);
 assert.match(game,/aria-pressed/);
});
test('Kitchen Rush also awards separate prize tickets while preserving the token economy',()=>{
 assert.match(immersive,/const ticketNode=document\.querySelector\('#arcade-tickets'\)/);
 assert.match(immersive,/ticketsEarned=Math\.max\(2,Math\.floor\(score\/9\)/);
 assert.match(immersive,/saved\.tickets=\(Number\(saved\.tickets\)\|\|0\)\+ticketsEarned/);
 assert.match(immersive,/ticketNode\.textContent=saved\.tickets/);
});

test('ticket and token payouts preserve a genuinely empty token wallet instead of restoring starter funds',()=>{
 assert.match(game,/saved\.tokens=\(Number\(saved\.tokens\?\?250\)\|\|0\)\+earned/);
 assert.match(immersive,/saved\.tokens=\(Number\(saved\.tokens\?\?250\)\|\|0\)\+earned/);
});

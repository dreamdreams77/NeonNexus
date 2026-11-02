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
const movementSrc=await readFile(new URL('../movement.js',import.meta.url),'utf8');
const fnBody=(src,name)=>{const i=src.indexOf('function '+name+'(');assert.ok(i>=0,name);const j=src.indexOf('\nfunction ',i+10);return src.slice(i,j<0?undefined:j);};
const ids=['skeeball','airhockey','whack','target','memory','rhythm','meteor','racer','stack','pinball','claw','chef','sushi','mixology','pulse','moto','moonquest','ringtoss','gemdig'];

test('arcade opens as one walkable RPG district with all nineteen mini-game cabinets and no game catalogue below it',()=>{
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
 assert.match(world,/legs\.forEach\(\(leg,i\)=>leg\.rotation\.x=Math\.sin\(walk\+i\*Math\.PI\)\*\.56\*stride\)/);
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

test('air hockey has free 2D mallets with momentum transfer, CPU attack/defence, goal posts and first-to-five matches',()=>{
 const upd=fnBody(game,'updateHockey'),hit=fnBody(game,'hockeyHit');
 assert.match(hit,/rv<0/);assert.match(hit,/\(1\+\.72\)/);
 assert.match(upd,/m\.vx=\(m\.x-px\)/);assert.match(upd,/bot\.mode='attack'/);assert.match(upd,/aimErr/);assert.match(upd,/cpuLevel\(\)/);
 assert.match(upd,/for\(const gx of \[HK\.GL,HK\.GR\]\)/);assert.match(upd,/p\.goal>=5/);assert.match(upd,/p\.botGoal>=5/);assert.match(upd,/p\.rally\+\+/);
 assert.match(game,/finish\(game==='airhockey'\?p\.goal>p\.botGoal/);
});

test('restaurant district has bar, host stand, dining tables and a token-priced menu',()=>{
 assert.match(world,/THE GLOW BAR/);
 assert.match(world,/HOST/);
 assert.match(world,/makeTable\(8\.9,5\.4,1\)/);assert.match(world,/function hideAndDecal/);
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
 
 for(const feature of ['PerspectiveCamera','Raycaster','KITCHEN TICKET','THE NEXUS KITCHEN','misses>=missLimit','arcadeBest\.chef','ingredients'])assert.ok(immersive.includes(feature),'missing 3D gameplay feature '+feature);
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
 assert.match(movementSrc,/1-Math\.exp\(-dt\*\(len>p\.deadzone\?p\.accel:p\.decel\)\)/);
 assert.match(world,/touch\.targetX=touch\.targetY=0/);
 assert.match(world,/Math\.min\(devicePixelRatio\|\|1,mobileDevice\?1\.2:1\.5/);
 assert.match(world,/antialias:!mobileDevice/);
 assert.match(world,/renderer\.shadowMap\.enabled=!mobileDevice/);
 assert.match(world,/cameraTarget\.set\(player\.position\.x/);
 assert.match(world,/camera\.position\.lerp\(cameraTarget,1-Math\.exp\(-4\.8\*dt\)\)/);
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
 assert.match(world,/createPlantSprite\(THREE,kind/);
 assert.match(world,/const motes=new THREE\.Points/);
 assert.match(world,/motesAttr\.needsUpdate=true/);
 assert.match(css,/Cabinet discovery: an editorial mini-preview/);
});

test('all twenty cabinets show their own animated gameplay vignette rather than a static title card',()=>{
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

test('animated preview scenes map one-to-one to the twenty registered cabinet game IDs',()=>{
 const definitions=world.match(/const definitions=\[([\s\S]*?)\n \];/);
 assert.ok(definitions,'cabinet definitions should be present');
 const definitionIds=[...definitions[1].matchAll(/\['[^']+','([^']+)'/g)].map(m=>m[1]).sort();
 const renderer=world.match(/function drawCabinetPreview\(p,frame\)\{([\s\S]*?)\n \}/);
 assert.ok(renderer,'preview renderer should be present');
 const previewIds=[...renderer[1].matchAll(/case'([^']+)':/g)].map(m=>m[1]).sort();
 assert.deepEqual(previewIds,definitionIds,'each registered cabinet must have exactly one preview scene');
 assert.equal(new Set(previewIds).size,20,'preview IDs must not be duplicated');
});
test('new carnival cabinets have dedicated game logic, UI and 3D preview scenes',()=>{for(const id of ['ringtoss','gemdig']){assert.ok(game.includes(id+':['));assert.ok(world.includes("['"+(id==='ringtoss'?'COMET RING TOSS':'MOON GEM DIG')+"','"+id+"'"));assert.match(game,new RegExp("case'"+id+"':"));}});
test('walk-up jukebox, weighted lucky wheel, expanded drink menu and RPG visitors are wired',()=>{for(const item of ['Ginger Beer','Wine','Gin and Tonic','jukebox','wheel','npc','PLAY · 5 TOKENS','SPIN · 25 TOKENS','1,000 tickets'])assert.ok(game.includes(item)||world.includes(item),'missing '+item);assert.match(world,/visitorProfiles/);assert.match(world,/services\.push\(\{type:'npc'/);assert.match(game,/0 tickets 50\.5%/);assert.match(game,/max:50\.5,tickets:0/);assert.match(game,/max:99\.95,tickets:500/);});
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

test('arcade floor is two painted planes (tiling parquet + one carpet overlay) instead of hundreds of tile meshes, felts stay textured',()=>{
 assert.match(world,/scene\.remove\(floorTiles\)/);
 assert.match(world,/new THREE\.PlaneGeometry\(24,48\),new THREE\.MeshStandardMaterial\(\{color:0xe2d2c6,map:parquetMap,roughnessMap:parquetRough/);
 assert.match(world,/function feltTexture\(base\)/);
 assert.match(world,/map:airFelt,roughness:\.72,bumpMap:grain/);
 assert.match(world,/map:poolFelt,roughness:\.88,bumpMap:grain/);
 assert.match(world,/blockedX=solidBoxes\.some[\s\S]*gameTables\.some/);
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
 assert.match(game,/const ticketsEarned=Math\.max\(2,Math\.round\(\(Math\.floor\(eff\/9\)/);
 assert.match(game,/saved\.tickets=\(Number\(saved\.tickets\)\|\|0\)\+payoutTickets/);
 assert.match(game,/saved\.ticketHistory\.unshift\(\{game,score,amount:payoutTickets,baseAmount:ticketsEarned,masteryBonus:masteryTicketBonus,at:Date\.now\(\)\}\)/);
 assert.match(game,/\+payoutTickets\+' TICKETS/);
 assert.match(game,/function writePlayer\(saved\).*arcade-tickets/);
});
test('the prize exchange has varied categories, rarity, ticket prices and limited stock',()=>{
 for(const category of ['Plush','Toys','Collectibles','Tech','Big Wins'])assert.ok(game.includes("category:'"+category+"'"),'missing prize category '+category);
 for(const rarity of ['COMMON','UNCOMMON','RARE','EPIC','LEGENDARY'])assert.ok(game.includes("rarity:'"+rarity+"'"),'missing rarity '+rarity);
 assert.match(game,/stock:\d+/);
 assert.match(game,/cost:\d+/);
 assert.match(game,/prizeCategories=\['All','Plush','Toys','Collectibles','Tech','Big Wins','Experiences'\]/);
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
 assert.match(immersive,/ticketsEarned=Math\.max\(2,Math\.round\(\(Math\.floor\(eff\/9\)/);
 assert.match(immersive,/saved\.tickets=\(Number\(saved\.tickets\)\|\|0\)\+ticketsEarned/);
 assert.match(immersive,/ticketNode\.textContent=saved\.tickets/);
});

test('ticket and token payouts preserve a genuinely empty token wallet instead of restoring starter funds',()=>{
 assert.match(game,/saved\.tokens=\(Number\(saved\.tokens\?\?250\)\|\|0\)\+earned/);
 assert.match(immersive,/saved\.tokens=\(Number\(saved\.tokens\?\?250\)\|\|0\)\+earned/);
});

test('the prize gallery is a physically walkable 3D room with an open doorway and solid wall collision',()=>{
 assert.match(world,/const prizeRoom=\{left:-10\.7,right:-3\.5,back:10\.5,front:19\.2,doorLeft:-8\.35,doorRight:-5\.85/);
 assert.match(world,/Walkable Prize Gallery/);
 assert.match(world,/galleryShelfY=\[1\.05,2\.15,3\.25\]/);
 assert.match(world,/PRIZE GALLERY/);
 assert.match(world,/type:'prize-room',name:'PRIZE GALLERY/);
 assert.match(world,/prizeRoom\.doorLeft/);
 assert.match(world,/prizeRoom\.doorRight/);
 assert.match(world,/Math\.abs\(player\.position\.x-prizeRoom\.left\)/);
 assert.match(world,/Math\.abs\(player\.position\.x-prizeRoom\.right\)/);
});
test('redeemed prizes repaint the illustrated collection wall immediately after redemption',async()=>{
 const spr=await readFile(new URL('../lobby-sprites.js',import.meta.url),'utf8');
 assert.match(world,/function refreshPrizeGallery\(\)/);assert.match(world,/saved\.prizes\|\|\[\]/);
 assert.match(world,/paintGalleryWall\(owned\)/);assert.match(world,/galleryWallTex\.needsUpdate=true/);
 assert.match(world,/window\.addEventListener\('nexus:prize-redeemed',refreshPrizeGallery\)/);
 assert.match(spr,/YOUR PRIZE HAUL/);assert.match(spr,/'\?'/);assert.match(spr,/'×'\+q/);
 assert.match(game,/else if\(service==='prize-room'\)/);assert.match(game,/prizeView='haul'/);assert.match(game,/WALKABLE PRIZE GALLERY/);
});

test('prize gallery draws every catalogue prize as its own illustration with 12 distinct drawn kinds',async()=>{
 const spr=await readFile(new URL('../lobby-sprites.js',import.meta.url),'utf8');
 for(const id of ['sticker-pack','keychain','mystery-capsule','clay-figure','moon-moth','comet-bear','slime-kit','puzzle-cube','robot-kit','star-projector','mini-speaker','gaming-headset','retro-handheld','grand-prize','vip-night','mastery-medal','golden-key'])assert.ok(spr.includes("id:'"+id+"'"),id);
 for(const k of ['bear','rocket','trophy','gift','bunny','robot','crown','moon','pad','star','balloons','cat'])assert.match(spr,new RegExp("case'"+k+"':"));
 assert.doesNotMatch(world,/function makePrizeModel/);
});

test('clay surfaces use tactile fingerprints, tool marks and physically varied roughness',()=>{
 assert.match(world,/Fine grain, soft dragged tool marks and shallow fingerprints/);
 assert.match(world,/roughnessMap:grain/);
 assert.match(world,/clearcoatRoughness:.82/);
});
test('arcade games reward clean streaks, preserve per-game mastery and avoid stale memory callbacks',()=>{
 assert.match(game,/function awardStreak\(/);
 assert.match(game,/STREAK ×/);
 assert.match(game,/saved\.arcadeStats\[game\]/);
 assert.match(game,/saved\.arcadeSessions=saved\.arcadeSessions\.slice\(0,25\)/);
 assert.match(game,/if\(sequenceTimer\)clearTimeout\(sequenceTimer\)/);
 assert.match(game,/running&&game==='memory'/);
 assert.match(game,/combo=0;sound\(100/);
});

test('each cabinet persists its own mastery XP, milestone perks and a visible progress track',()=>{
 assert.match(game,/function masteryLevel\(xp\)/);
 assert.match(game,/saved\.arcadeMastery\[game\]/);
 assert.match(game,/xpGain=Math\.max\(15/);
 assert.match(game,/prior\.level=masteryLevel\(prior\.xp\)/);
 assert.match(game,/renderMastery\(game,prior\)/);
 assert.match(html,/id="game-progression"/);
 assert.match(css,/\.mastery-track/);
});
test('mastery perks alter Pulse Runner, Barrelstorm, Moonshard, Sushi, Meteor and Racer mechanics',()=>{
 assert.match(game,/p\.hp=3\+\(p\.masteryLevel>=2\?1:0\)/);
 assert.match(game,/p\.maxSpeed=430\+\(p\.masteryLevel>=6\?45:0\)/);
 assert.match(game,/p\.swordLevel=1\+\(p\.masteryLevel>=4\?1:0\)/);
 assert.match(game,/p\.catchWidth=52\+\(p\.masteryLevel>=2\?12:0\)/);
 assert.match(game,/p\.starShield=p\.masteryLevel>=2\?1:0/);
 assert.match(game,/p\.crashLimit=3\+\(p\.masteryLevel>=2\?1:0\)/);
});
test('higher mastery raises arcade challenge pacing while preserving earned counterplay',()=>{
 assert.match(game,/Math\.max\(\.34,\.58-\(p\.masteryLevel\|\|0\)\*\.025\)/);
 assert.match(game,/const mastery=1\+Math\.min\(\.1,\(p\.masteryLevel\|\|0\)\*\.015\)/);
 assert.match(game,/Math\.max\(\.3,\.78-d\*\.42-\(p\.masteryLevel\|\|0\)\*\.01\)/);
 assert.match(game,/Math\.max\(\.38,\.75-\(p\.masteryLevel\|\|0\)\*\.035\)/);
});
test('canvas arcade scenes receive a layered painterly practical-light pass',()=>{
 assert.match(game,/createRadialGradient\(450,250,30,450,250,470\)/);
 assert.match(game,/function painterlyFinish\(\)/);
 assert.match(game,/paperPattern=ctx\.createPattern\(paper,'repeat'\)/);
});

test('the remaining cabinets have distinct mastery perks beyond XP-only progression',()=>{
 assert.match(game,/p\.malletReach=43\+\(p\.masteryLevel>=2\?8:0\)/);
 assert.match(game,/p\.balls=3\+\(p\.masteryLevel>=2\?1:0\)/);
 assert.match(game,/p\.clawReach=p\.masteryLevel>=2\?34:24/);
 assert.match(game,/const wm=p\.masteryLevel>=2\?1\.15:1/);
 assert.match(game,/p\.masteryLevel>=2\?\.12:0/);
 assert.match(game,/p\.masteryLevel>=2\?1\.12:1/);
 assert.match(game,/p\.masteryLevel>=4\?8:0/);
 assert.match(game,/p\.masteryLevel>=4\?35:25/);
 assert.match(immersive,/saved\.arcadeMastery\.chef=record/);
 assert.match(immersive,/missLimit=3\+\(masteryLevel>=4\?1:0\)/);
});

test('the physical arcade environment has matching sculpted wall sconces and practical warm lights',()=>{
 assert.match(world,/function makeSconce\(side,z\)/);
 assert.match(world,/new THREE\.TorusGeometry\(\.205/);
 assert.doesNotMatch(world,/new THREE\.PointLight\(0xffbd83/);
 assert.match(world,/for\(const z of \[-15,-3,9,21\]\)for\(const side of \[-1,1\]\)makeSconce/);
});
test('Moonlight Billiards cabinet mastery improves controlled cue-shot power',()=>{
 assert.match(game,/p\.masteryLevel>=2\?1\.08:1/);
 assert.match(game,/p\.masteryLevel>=4\?1\.06:1/);
});

test('visitor NPCs offer persistent character-specific quests with tracked objectives and ticket rewards',()=>{
 for(const id of ['pip','moxie','juniper','rook'])assert.match(world,new RegExp("questId:'"+id+"'"));
 for(const term of ['Warm-up Circuit','Find the Pocket','Cabinet Explorer','Rack and Return','visitorQuests','CLAIM REWARD','QUEST IN PROGRESS'])assert.ok(game.includes(term),'missing visitor quest system: '+term);
 assert.match(game,/latest\.tickets=\(Number\(latest\.tickets\)\|\|0\)\+quest\.reward/);
});

test('cabinet mastery adds a transparent ticket payout bonus and the prize room offers VIP experience rewards',()=>{
 assert.match(game,/masteryTicketBonus=Math\.min\(12,Math\.floor\(cabinetLevel\/2\)\*2\)/);
 assert.match(game,/masteryBonus:masteryTicketBonus/);
 for(const id of ['vip-night','mastery-medal','golden-key'])assert.ok(game.includes("id:'"+id+"'"));
 assert.ok(game.includes("'Experiences'"));
});

test('the prize counter restocks its limited inventory once per day without resetting player collections',()=>{
 assert.match(game,/saved\.prizeRestockDay!==today/);
 assert.match(game,/Object\.fromEntries\(prizeCatalog\.map\(item=>\[item\.id,item\.stock\]\)\)/);
 assert.match(css,/\.visitor-quest/);
 assert.match(css,/data-rarity="LEGENDARY"/);
});

test('arcade visitors have individualized sculpted props and readable nameplates, while cabinets receive a detailed finish pass',()=>{
 for(const term of ['Signature props make every regular readable','const bag=sculptedBox','const band=new THREE.Mesh(new THREE.TorusGeometry','const pack=sculptedBox','const cue=cyl','const nameplate=box'])assert.ok(world.includes(term),'missing visitor art detail '+term);
 assert.match(world,/Ticket slot, brass service trim, cabinet fasteners/);
 assert.match(world,/badgePlate=new THREE\.Mesh\(new THREE\.CircleGeometry/);
});

test('prize rarity styling follows the catalogue and quest claims retain their success message after re-render',()=>{
 assert.match(game,/card\.dataset\.rarity=item\.rarity/);
 assert.match(game,/openService\('npc',null,npc\);serviceStatus\.textContent=NV\('s','quest'/);
});

test('daily district circuit tracks three distinct cabinets, grants one claim per UTC day, and persists its ticket reward',()=>{
 for(const term of ['DAILY DISTRICT CIRCUIT','Play 3 different cabinets today','dailyCircuitClaimed','played.size<3','amount:80'])assert.ok(game.includes(term),'missing daily circuit detail '+term);
 assert.match(game,/new Set\(sessions\.map\(s=>s\.game\)\)/);
 assert.match(game,/latest\.dailyCircuitClaimed=date/);
 assert.match(css,/\.daily-circuit/);
});

test('the lucky wheel shows all eight ticket sectors',()=>{
 for(const value of ['0','10','25','50','100','250','500','1K'])assert.ok(world.includes("'"+value+"'"));
 assert.match(world,/Eight enamelled prize sectors/);
 assert.match(world,/wheelHub=new THREE\.Mesh/);
});


test('each arcade cabinet has its own animated sculpted crest with restrained lighting and motion',()=>{
 assert.match(world,/const crest=new THREE\.Group\(\);crest\.position\.set\(\.51,\.83,\.79\)/);
 assert.match(world,/new THREE\.TorusGeometry\(\.145,\.018,8,28\)/);
 assert.match(world,/crestDots\.forEach\(\(dot,n\)=>\{/);
 assert.match(world,/c\.userData\.crestRing\.rotation\.z=t\*\(\.28\+i%3\*\.06\)/);
 assert.match(world,/c\.userData\.crestLight\.intensity=\.25\+pulse\*\.22/);
 assert.match(world,/crest,crestRing,crestCore,crestDots,crestLight/);
});


test('cabinet mastery is represented by seven physical trophy pips that refresh from saved progress',()=>{
 assert.match(world,/const masteryRing=new THREE\.Mesh\(new THREE\.TorusGeometry\(\.112/);
 assert.match(world,/const masteryPips=\[\]/);
 assert.match(world,/for\(let pip=0;pip<7;pip\+\+\)/);
 assert.match(world,/nextMasteryRefresh=t\+1\.25/);
 assert.match(world,/save\.arcadeMastery\|\|\{\}/);
 assert.match(world,/c\.userData\.masteryPips\.forEach/);
 assert.match(world,/level>=7\?0xffd18a/);
});

test('scoring produces restrained visual sparkles and a pitch-scaled arcade chime',()=>{
 assert.match(game,/function scoreBy\(n\).*addParticles\(mouse\.x,mouse\.y,n>=25\?/);
 assert.match(game,/sound\(Math\.min\(860,340\+n\*5\),\.055,'sine',\.018\)/);
});

test('Glow Bar has three walk-up video poker machines with a playable five-card draw loop',()=>{
 assert.match(world,/function makePokerMachine\(x,z,index\)/);
 assert.match(world,/makePokerMachine\(7\.1,-1\.8,0\);makePokerMachine\(8\.8,-1\.8,1\);makePokerMachine\(10\.5,-1\.8,2\)/);
 assert.match(world,/pokerMachines\.map/);
 assert.match(world,/machine:activeService\.machine/);
 assert.match(game,/function pokerDeck\(\)/);
 assert.match(game,/function pokerRank\(hand\)/);
 assert.match(game,/pokerPhase==='hold'/);
 assert.match(game,/pokerPaytable/);
 assert.match(game,/current\.tokens=wallet-5/);
 assert.match(game,/latest\.tokens=Number\(latest\.tokens\?\?250\)\+award\*5/);
 assert.match(game,/service==='poker'/);
 assert.match(css,/\.poker-card\.held/);
 assert.match(css,/\.poker-paytable/);
});

test('arcade district has living garden details and a festive social-square canopy',()=>{
 assert.match(world,/function makePlanter\(x,z,flip=1\)/);assert.match(world,/\(plantCount\+\+\*3/);
 assert.match(world,/makeRug\(0,7\.2/);
 assert.match(world,/const festoonBulbs=\[\]/);
 assert.match(world,/new THREE\.TubeGeometry\(festoonCurve/);
 assert.match(world,/flag\.rotation\.z=Math\.sin/);
 assert.match(world,/TONIGHT · OPEN PLAY/);
});

test('walk-up air hockey and billiards have a clear physical gap and grounded table legs',()=>{
 assert.match(world,/g\.position\.set\(-8\.6,0,-4\.7\)/);
 assert.match(world,/g\.position\.set\(8\.9,0,-11\.8\)/);
 // tables sit in open floor clear of the cabinet columns (x=±5.2, half-width .8) and the prize room
 assert.match(world,/const cabinetZ=i=>i<9\?-18\.5\+\(i%9\)\*3\.45/);
 assert.match(world,/box\(\.2,\.68,\.2,x,\.34,z,clayMat\(0x60444b\)/);
 assert.match(world,/box\(\.22,\.68,\.22,x,\.34,z,clayMat\(0x68494a\)/);
});

test('player movement uses eased acceleration, soft stopping and a smoother camera follow',()=>{
 assert.match(world,/stepVelocity\(motion,x,z,dt\)/);
 assert.match(movementSrc,/speed:4\.65,accel:10\.5,decel:7\.8/);
 assert.match(world,/camera\.position\.lerp\(cameraTarget,1-Math\.exp\(-4\.8\*dt\)\)/);
 assert.match(world,/const stride=Math\.min\(1,speed\/4\.65\)/);
});

test('visitors have individual looping routes, pause and face nearby players, and animate their steps',()=>{
 assert.match(world,/const visitorRoutes=/);
 assert.match(world,/routeIndex:1/);
 assert.match(world,/playerDistance>3\.8/);
 assert.match(world,/visitorArms\.filter/);
 assert.match(world,/visitorLegs\.filter/);
 assert.match(world,/visitor\.waveUntil/);
});

test('arcade regulars have expressive individual faces and layered signature outfits',()=>{
 for(const detail of ['Tiny sculpted face details','new THREE.CatmullRomCurve3([new THREE.Vector3(-.065,1.405,.238)','Four different hair silhouettes','Layered handmade clothing','if(i===0){for(let n=0;n<4;n++)sphere','if(i===1){const glassesMat','if(i===2){const scarf','if(i===3){const beard'])assert.ok(world.includes(detail),'missing character art detail '+detail);
 assert.match(world,/new THREE\.TorusGeometry\(\.067,\.009,6,16\)/);
 assert.match(world,/const collarMat=clayMat/);
 assert.match(world,/const shirtFront=box/);
});

test('opening a cabinet before starting cannot crash the idle preview (air hockey, billiards)',()=>{
 assert.match(game,/puck:\{x:450,y:280,vx:0,vy:0\},botX:450/);
 assert.match(game,/if\(p\.cue\)drawPoolBall\(p\.cue\)/);
});
test('lucky claw nearest-prize search is seeded so the first grab cannot throw',()=>{
 assert.doesNotMatch(game,/\?b:a,null\)/);
 assert.match(game,/\?b:a,objects\[0\]\|\|null\)/);
});
test('3D world render loop pauses while a game overlay is open or the tab is hidden',()=>{
 assert.match(world,/document\.hidden\|\|!gameOverlay\.hidden/);
});
test('ceiling ribs no longer occlude the top-down camera view',()=>{
 assert.doesNotMatch(world,/const rib=box\(24,\.22/);
});
test('rewards scale with cabinet difficulty and personal bests; air hockey has a CPU level picker',()=>{
 for(const id of ids.concat('billiards'))assert.match(game,new RegExp(id+':[0-9.]+[,}]'));
 assert.match(game,/DIFFICULTY_TIER/);
 assert.match(game,/NEW PERSONAL BEST/);
 assert.match(html,/id="level-select"/);
 assert.match(game,/cpuLevel\(\)/);
});

test('lobby is built from the painted art layer: parquet, carpet, walls, neon, posters, cabinet art, jukebox',async()=>{
 const art=await readFile(new URL('../lobby-art.js',import.meta.url),'utf8');
 for(const fn of ['paintParquet','paintCarpet','paintWall','paintNeon','paintMarquee','paintCabinetBody','paintPoster','paintJukebox','paintRug','paintMat'])assert.match(art,new RegExp('export function '+fn));
 for(const call of ['ART.paintParquet()','ART.paintCarpet(','ART.paintWall()','ART.paintNeon(\'NEON NEXUS\'','ART.paintMarquee(','ART.paintCabinetBody(','ART.paintPoster(','ART.paintJukebox()','ART.paintRug(','ART.paintMat()'])assert.ok(world.includes(call),call);
 assert.match(world,/function addInk/);
 for(const id of ids.concat('hoops','billiards'))if(id!=='billiards')assert.match(art,new RegExp('\\b'+id+'\\(x,cx,cy,s,r\\)'),'motif '+id);
});
test('debug camera hook is opt-in only',()=>{assert.match(world,/location\.search\.includes\('debug'\)/);});

test('billiards physics, CPU turns and pocketing run every frame inside update(), never only once inside start()',()=>{
 const update=fnBody(game,'update'),start=fnBody(game,'start');
 assert.match(update,/if\(p\.shotActive\)\{/);assert.match(update,/p\.cpuWait/);assert.match(update,/pockets\.find/);
 assert.doesNotMatch(start,/p\.shotActive\)\{/);
});
test('beat foundry is a charted, beat-locked rhythm game with timing tiers, stray-tap penalty and S-D grades',()=>{
 const init=fnBody(game,'initRhythm'),upd=fnBody(game,'updateRhythm'),grade=fnBody(game,'rhythmGrade');
 assert.match(init,/bpm=116/);assert.match(init,/phrases/);assert.match(upd,/r\.lastBeat/);assert.match(upd,/sound\(62/);
 assert.match(game,/RH_WINDOW=\{perfect:\.06,good:\.12,ok:\.2\}/);assert.match(grade,/'S'.*'A'.*'B'.*'C'.*'D'/);assert.match(grade,/r\.stray\*\.5/);
 assert.match(game,/GRADE \$\{?|'GRADE '\+g\.letter/);
});
test('turbo tunnels is a lap race: spline track, steering physics, three lap count, AI rivals and place-based rewards',()=>{
 for(const f of ['raceTrack','initRace','stepCar','updateRace','finishRace','drawRace'])assert.match(game,new RegExp('function '+f+'\\('));
 assert.match(game,/RACE_LAPS=3/);assert.match(game,/RACE_CARS=\[/);
 const upd=fnBody(game,'updateRace');assert.match(upd,/rubber-banding/);assert.match(upd,/curve/);assert.match(upd,/finished/);
 assert.match(fnBody(game,'finishRace'),/\[120,80,50,25\]/);
 assert.doesNotMatch(game,/p\.lane=Math\.max\(0,p\.lane-1\)/);
});
test('canvas keeps its 900:520 ratio on short landscape windows',()=>{const css2=css;assert.match(css2,/#stage\{width:min\(100%,calc\(58vh\*900\/520\)\)/);});

test('lobby crowd has personalities, A* navigation over real obstacles, queues, reactions and stuck recovery',async()=>{
 const crowd=await readFile(new URL('../lobby-crowd.js',import.meta.url),'utf8');
 for(const k of ["'queue'","'play'","'react'","'drink'","'browse'","'dance'","'chat'","findPath","losClear","stuckT","skill","fav:pick(FAVS)"])assert.ok(crowd.includes(k),k);
 assert.match(world,/createCrowd\(\{THREE,scene,clayMat,cabinets/);
 assert.match(world,/const solidBoxes=\[\{x:-7\.1,z:13[^\]]*\.\.\.cabinets\.map/);
 assert.match(world,/solidBoxes\.some\(b=>Math\.abs\(nextX-b\.x\)/);
});

test('players meet a title screen with load progress, failure fallback and persisted settings before the lobby',async()=>{
 const intro=await readFile(new URL('../intro.js',import.meta.url),'utf8');
 assert.match(html,/id="intro" class="nx-intro"/);assert.match(html,/id="intro-play"[^>]*disabled/);assert.match(html,/id="set-sound"/);assert.match(html,/id="set-quality"/);assert.match(html,/id="intro-error"/);
 assert.ok(html.indexOf('./intro.js')<html.indexOf('./arcade.js'));
 assert.match(intro,/nexus:world-ready/);assert.match(intro,/neon-nexus-settings-v1/);assert.match(intro,/el>12/);
 assert.match(world,/nexus:world-ready/);assert.match(world,/body\.classList\.contains\('intro-open'\)/);assert.match(world,/savedQuality/);
 assert.match(game,/window\.nexusSetMuted/);
 assert.match(css,/\.nx-intro\{/);assert.doesNotMatch(css.slice(css.indexOf('Title screen')),/\n\.intro\{/);
 assert.match(css,/prefers-reduced-motion:reduce\)\{\.intro-bg i/);
});
test('plant species index is always in range for negative world x',()=>{assert.match(world,/\(plantCount\+\+\*3\+Math\.abs\(Math\.round\(x\*2\+z\)\)\)%4/);});

test('light budget: cabinet glow uses a fixed pool of real lights instead of dozens of point lights',()=>{
 assert.match(world,/function makeLampProxy/);assert.match(world,/LAMP_POOL=mobileDevice\?3:5/);assert.match(world,/function updateLampPool/);
 assert.ok((world.match(/new THREE\.PointLight/g)||[]).length<=14,'point light constructions');
 assert.doesNotMatch(world,/new THREE\.PointLight\(color,1\.8,3\.2\)/);
});

test('illustrated sprite art layer: designed cast, cabinets, plants, tables, bar and gallery replace sculpted primitives',async()=>{
 const spr=await readFile(new URL('../lobby-sprites.js',import.meta.url),'utf8');
 for(const fn of ['drawCharacter','buildSheet','createActor','drawCabinet','createCabinetSprite','drawPlant','createPlantSprite','paintTableTop','paintStoolTop','paintBarTop','createPokerSprite','paintGalleryWall','paintGalleryFloor','drawPrizeItem'])assert.match(spr,new RegExp('function '+fn+'\\('));
 assert.ok((spr.match(/\n \{name:'/g)||[]).length>=17,'cast size');
 for(const view of ['front','side','back'])assert.ok(spr.includes(view+':['));
 for(const pose of ['walk0','walk3','wave','cheer','slump','sip','talk','mash0'])assert.ok(spr.includes("'"+pose+"'"),pose);
 for(const k of ['sitdown','pinball','glass','upright'])assert.ok(spr.includes("'"+k+"'"),k);
 assert.match(world,/createActor\(THREE,CAST/);assert.match(world,/createCabinetSprite\(THREE,def/);assert.match(world,/hostActor/);assert.match(world,/staffActors/);assert.match(world,/createPokerSprite/);
 assert.doesNotMatch(world,/const stitch=box/);
});

test('air hockey and billiards tables are illustrated top-down tables with drawn moving pieces',async()=>{
 const spr=await readFile(new URL('../lobby-sprites.js',import.meta.url),'utf8');
 for(const f of ['paintAirTable','paintPoolTable','paintDisc','paintSoftShadow','vivid'])assert.match(spr,new RegExp('function '+f+'\\('));
 assert.match(world,/function illustrateTable/);assert.match(world,/illustrateTable\(g,\[puck,\.\.\.mallets\]/);assert.match(world,/illustrateTable\(g,keep,paintPoolTable/);
 assert.match(world,/alphaTest:\.06,toneMapped:false\}\)\);top\.rotation/);
});

test('lucky wheel, jukebox and back bar are illustrations; sculpted back-bar clutter is retired',async()=>{
 const spr=await readFile(new URL('../lobby-sprites.js',import.meta.url),'utf8');
 for(const f of ['drawWheel','paintBackBar'])assert.match(spr,new RegExp('function '+f+'\\('));
 assert.match(spr,/'0','10','25','50','100','250','500','1K'/);
 assert.doesNotMatch(spr,/paintShape\([^;]*'rgba\(/); // paint helpers only accept hex colours
 assert.match(world,/drawWheel\(cv\.getContext/);assert.match(world,/jukeboxBody\.visible=false/);assert.match(world,/paintBackBar\(\)/);assert.match(world,/Retire the sculpted back-bar clutter/);
});

test('crowd queues pick an open direction and visitors never deadlock on a player standing at their destination',async()=>{
 const crowd=await readFile(new URL('../lobby-crowd.js',import.meta.url),'utf8');
 assert.match(crowd,/cb\.qdir=/);assert.match(crowd,/v\.cab\.qdir\*\(k\+1\)/);assert.match(crowd,/pd<1\.15&&v\.path\.length===1/);
});

test('host stand is illustrated and character sheets render at higher resolution without clipping',async()=>{
 const spr=await readFile(new URL('../lobby-sprites.js',import.meta.url),'utf8');
 assert.match(spr,/function drawHostStand\(/);assert.match(spr,/PLEASE WAIT TO BE SEATED/);assert.match(world,/createHostStandSprite\(THREE/);
 assert.match(spr,/function buildSheet\(design,res=1\)/);assert.match(spr,/ctx\.scale\(res,res\)/);assert.match(spr,/translate\(ox,oy-6\)/);
 assert.match(world,/res:mobileDevice\?1\.5:2/);assert.match(world,/res:mobileDevice\?1:1\.5/);
});

test('finishing pass: counter front, garland, wall caps, sconces, stools, prize exchange and gallery facade are illustrated',async()=>{
 const spr=await readFile(new URL('../lobby-sprites.js',import.meta.url),'utf8');
 for(const f of ['paintCounterFront','paintGarland','paintWallCap','drawSconce','drawStool','drawPrizeCounter','paintGalleryFacade','makeSpriteFromCanvas','canvasFrom'])assert.match(spr,new RegExp('function '+f+'\\('));
 assert.match(world,/paintCounterFront\(\)/);assert.match(world,/festoonRope\.visible=false/);assert.match(world,/paintWallCap\(2000,120,mobileDevice\?\.5:1\)/);assert.match(world,/drawSconce\(g\)/);assert.match(world,/drawStool\(g,/);assert.match(world,/drawPrizeCounter\),\{slot:'prize-counter',height:3\.0/);assert.match(world,/paintGalleryFacade\(\)/);
 assert.doesNotMatch(spr,/paintShape\([^;]*'rgba\(/);
});

test('floor and carpet are designed patterns, not random noise',async()=>{
 const art=await readFile(new URL('../lobby-art.js',import.meta.url),'utf8');
 const pq=art.slice(art.indexOf('export function paintParquet'),art.indexOf('function carpetMotif'));
 assert.doesNotMatch(pq,/rand\(\)/);assert.doesNotMatch(pq,/paperGrain/);assert.match(pq,/const tones=\[/);
 assert.match(art,/function carpetMotif\(\)/);assert.match(art,/half-drop repeat/);assert.doesNotMatch(art,/neon confetti: squiggles/);
});

test('north end: illustrated welcome desk and a composed back wall replace the sculpted counter, murals and frames',async()=>{
 const spr=await readFile(new URL('../lobby-sprites.js',import.meta.url),'utf8');
 assert.match(spr,/function drawWelcomeDesk\(/);assert.match(spr,/function paintBackWall\(/);assert.match(spr,/win\(420\);win\(W-420\)/);
 assert.match(world,/for\(const ch of prizeGroup\.children\)ch\.visible=false/);assert.match(world,/paintBackWall\(2400,570,mobileDevice\?\.5:1\)/);assert.match(world,/findPlane\(24,5\.7\)/);
});

test('retired sculpted geometry is detached from the scene; named regulars keep stored rig references',async()=>{
 assert.match(world,/Prune retired geometry/);assert.match(world,/\.forEach\(o=>\{o\.removeFromParent\(\)/);assert.match(world,/protect=new Set\(cabinets\.map\(c=>c\.userData\.discoveryRing\)\)/);
 assert.match(world,/v\.rig=\[v\.group\.children\[0\],v\.group\.children\[1\]\]/);assert.match(world,/visitor\.rig\[0\]\.rotation\.z/);assert.doesNotMatch(world,/g\.children\[0\]\.rotation\.z/);
});
test('crowd watchdog snaps a wedged visitor to the nearest walkable cell before re-planning',async()=>{
 const crowd=await readFile(new URL('../lobby-crowd.js',import.meta.url),'utf8');
 assert.match(crowd,/const\[sx,sz\]=nearestOpen\(p\.x,p\.z\);p\.x=GX0\+\(sx\+\.5\)\*CELL/);
});
test('meteor mayhem has hearts, invulnerability frames, a difficulty ramp and survival points',()=>{
 const i=game.indexOf("if(game==='meteor'){const el=");assert.ok(i>=0);const seg=game.slice(i,i+1800);
 assert.match(seg,/p\.hearts--/);assert.match(seg,/p\.invuln=1\.1/);assert.match(seg,/d\*75/);assert.match(seg,/score\+=2/);
});
test('kitchen rush uses the shared diminishing-returns payout and refreshes the HUD before finishing',()=>{
 assert.match(immersive,/eff=Math\.round\(300\*\(1-Math\.exp\(-score\/300\)\)\)/);assert.match(immersive,/updateHud\(\);finish\(true\)/);assert.match(immersive,/window\.__kitchen=/);
});

test('voice is wired into the regulars, shop messages, result quips, host, staff and ambient visitors',async()=>{
 const crowd=await readFile(new URL('../lobby-crowd.js',import.meta.url),'utf8');
 assert.match(html,/<script src="\.\/dialogue\.js"><\/script><script src="\.\/intro\.js">/);assert.match(html,/id="result-quip"/);
 assert.match(game,/NV\('reg',npc\?\.name,'chat'\)/);assert.match(game,/NV\('s','redeemed'/);assert.match(game,/NV\('bye'\)/);assert.match(game,/V\.quip\(game,\{win,score,newBest,gradeLabel:p\.gradeLabel\}\)/);
 assert.match(immersive,/V\.quip\('chef'/);
 assert.match(crowd,/function say\(follow,text/);assert.match(crowd,/tryBark\(v,v\.react==='win'\?'win':'lose'/);assert.match(crowd,/chatPairs/);
 assert.match(world,/staffLine\('host'\)/);assert.match(world,/staffLine\(staff\.role==='bartender'/);
});
test('runtime-toggled objects are protected from pruning',async()=>{
 const crowd=await readFile(new URL('../lobby-crowd.js',import.meta.url),'utf8');
 assert.match(world,/o\.userData\.keep/);assert.match(crowd,/sp\.userData\.keep=true/);assert.match(crowd,/m\.userData\.keep=true/);assert.match(crowd,/plush\.userData\.keep=true/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const [html,game,world]=await Promise.all([
 readFile(new URL('../arcade.html',import.meta.url),'utf8'),
 readFile(new URL('../arcade.js',import.meta.url),'utf8'),
 readFile(new URL('../arcade-world.js',import.meta.url),'utf8')
]);
const ids=['skeeball','airhockey','whack','target','memory','rhythm','meteor','racer','stack','pinball','claw','chef','sushi','mixology'];

test('arcade page exposes fourteen cabinet games plus Neon Hoops',()=>{
 for(const id of ids)assert.match(html,new RegExp('data-game="'+id+'"'));
 assert.match(html,/href="\.\/hoops\.html"/);
 assert.equal((html.match(/class="game-card/g)||[]).length,15);
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
 assert.match(game,/first available table/);
});
test('cooking and mixology mistakes have real failure consequences',()=>{
 assert.match(game,/p\.ticketClock>9/);
 assert.match(game,/p\.misses\+\+;p\.combo=0/);
 assert.match(game,/if\(p\.misses>=3\)\{finish\(\);return;\}/);
 assert.match(game,/function pourMix\(/);
 assert.match(game,/if\(game==='mixology'\)pourMix\(\)/);
});
test('three new cabinets have distinct kitchen, catching and timing gameplay loops',()=>{
 for(const id of ['chef','sushi','mixology']){assert.ok(game.includes(id+':['));assert.ok(game.includes("case'"+id+"'"));}
 assert.match(game,/ticketTarget/);
 assert.match(game,/catchStreak/);
 assert.match(game,/mixRound/);
});

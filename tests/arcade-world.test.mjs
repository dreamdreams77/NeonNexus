import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const [html,game,world]=await Promise.all([
 readFile(new URL('../arcade.html',import.meta.url),'utf8'),
 readFile(new URL('../arcade.js',import.meta.url),'utf8'),
 readFile(new URL('../arcade-world.js',import.meta.url),'utf8')
]);
const ids=['skeeball','airhockey','whack','target','memory','rhythm','meteor','racer','stack','pinball','claw'];

test('arcade page exposes all eleven cabinet games plus Neon Hoops',()=>{
 for(const id of ids)assert.match(html,new RegExp('data-game="'+id+'"'));
 assert.match(html,/href="\.\/hoops\.html"/);
 assert.equal((html.match(/class="game-card/g)||[]).length,12);
});

test('every playable cabinet has a 3D model and launches its matching game',()=>{
 for(const id of ids)assert.ok(world.includes("'"+id+"'"),'missing 3D cabinet '+id);
 assert.match(world,/nexus:arcade-play/);
 assert.match(game,/nexus:arcade-play/);
 assert.match(game,/window\.nexusPlayArcadeGame=open/);
});

test('arcade includes keyboard, touch and proximity interactions',()=>{
 assert.match(world,/arrowup/);assert.match(world,/arcade-touch-pad/);
 assert.match(world,/dmin=4\.1/);assert.match(world,/if\(k==='e'\)useCabinet\(\)/);
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

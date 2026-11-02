import test from 'node:test';
import assert from 'node:assert/strict';
import {stepVelocity,turnToward,MOVE} from '../movement.js';

const simulate=(fps,seconds,input)=>{const m={x:0,z:0},dt=1/fps;for(let i=0;i<Math.round(fps*seconds);i++)stepVelocity(m,input[0],input[1],dt);return m;};

test('velocity ramps up without overshoot or instant jumps',()=>{
 const m={x:0,z:0};let prev=0;
 for(let i=0;i<120;i++){stepVelocity(m,1,0,1/60);assert.ok(m.x>=prev-1e-9,'monotonic');assert.ok(m.x<=MOVE.speed+1e-9,'no overshoot');assert.ok(m.x-prev<MOVE.speed*.2,'no snap');prev=m.x;}
 assert.ok(m.x>MOVE.speed*.99);
});
test('movement is frame-rate independent (30 / 60 / 144 fps agree)',()=>{
 const a=simulate(30,.4,[1,0]).x,b=simulate(60,.4,[1,0]).x,c=simulate(144,.4,[1,0]).x;
 assert.ok(Math.abs(a-b)<.01&&Math.abs(b-c)<.01,[a,b,c].join());
});
test('releasing input decelerates smoothly to a stop',()=>{
 const m={x:MOVE.speed,z:0};let prev=m.x;
 for(let i=0;i<180;i++){stepVelocity(m,0,0,1/60);assert.ok(m.x<=prev&&m.x>=0);prev=m.x;}
 assert.ok(m.x<.01);
});
test('diagonal input is normalised so diagonals are not faster',()=>{
 const m=simulate(60,2,[1,1]);assert.ok(Math.hypot(m.x,m.z)<=MOVE.speed+1e-6);
});
test('reversing direction passes smoothly through zero',()=>{
 const m={x:MOVE.speed,z:0};let min=m.x,jump=0,prev=m.x;
 for(let i=0;i<90;i++){stepVelocity(m,-1,0,1/60);jump=Math.max(jump,Math.abs(m.x-prev));prev=m.x;min=Math.min(min,m.x);}
 assert.ok(min<0&&jump<MOVE.speed*.35);
});
test('facing turns the short way across the ±π boundary',()=>{
 let a=3.0;for(let i=0;i<120;i++){const next=turnToward(a,-3.0,1/60,12);assert.ok(Math.abs(next-a)<.5,'no long-way spin');a=next;}
 const wrapped=((a%(Math.PI*2))+Math.PI*3)%(Math.PI*2)-Math.PI;assert.ok(Math.abs(wrapped-(-3.0))<.05);
});

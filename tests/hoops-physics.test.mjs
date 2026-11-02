import test from 'node:test';
import assert from 'node:assert/strict';
import {createBall,launchBall,stepBall,evaluateShot} from '../hoops-physics.js';
test('launch applies a forward arc and activates the ball',()=>{const b=createBall();launchBall(b,{x:.4,power:.7});assert.equal(b.active,true);assert.ok(b.velocity.z<0);assert.ok(b.velocity.y>0);assert.ok(b.velocity.x>0);});
test('aim and power are clamped to safe ranges',()=>{const b=createBall();launchBall(b,{x:9,power:8});assert.ok(b.velocity.x<=2.151);const c=createBall();launchBall(c,{x:-9,power:-8});assert.ok(c.velocity.x>=-2.151);});
test('ball follows gravity and eventually lands',()=>{const b=createBall();launchBall(b,{x:0,power:.5});const initial=b.position.y;for(let i=0;i<120;i++)stepBall(b,1/60);assert.ok(b.position.y<initial);assert.ok(b.elapsed>1.9);});
test('calibrated centre shots can score at low, medium and high power',()=>{
 for(const power of [0,.5,1]){
  const b=createBall();launchBall(b,{x:0,power});let event={};
  for(let i=0;i<150&&b.active;i++){event=stepBall(b,1/60);if(event.score||event.rim||event.backboard)break;}
  assert.equal(event.score,true,'power '+power+' should be capable of a clean basket');
 }
});
test('inactive ball does not advance',()=>{const b=createBall();const before={...b.position};stepBall(b,.02);assert.deepEqual(b.position,before);});
test('shot evaluation measures distance from the hoop centre',()=>{const b=createBall({x:0,y:3.05,z:-3.5});assert.equal(evaluateShot(b),0);});

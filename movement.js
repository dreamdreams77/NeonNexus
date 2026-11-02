// Player velocity model shared by the world and its tests.
// Exponential smoothing toward the input target gives natural acceleration and deceleration; because the
// blend factor is 1-exp(-k·dt), the result is the same at 30, 60 or 144 fps (frame-rate independent).
export const MOVE={speed:4.65,accel:10.5,decel:7.8,deadzone:.06};
export function stepVelocity(motion,inputX,inputZ,dt,p=MOVE){
 let x=inputX,z=inputZ;const len=Math.hypot(x,z);
 if(len>1){x/=len;z/=len;}
 const k=1-Math.exp(-dt*(len>p.deadzone?p.accel:p.decel));
 motion.x+=(x*p.speed-motion.x)*k;motion.z+=(z*p.speed-motion.z)*k;
 return len;
}
// Shortest-arc facing turn so characters never spin the long way round or snap.
export function turnToward(current,target,dt,rate=14){
 let d=target-current;while(d>Math.PI)d-=Math.PI*2;while(d<-Math.PI)d+=Math.PI*2;
 return current+d*(1-Math.exp(-rate*dt));
}

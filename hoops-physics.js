export const GRAVITY = 9.8;
export const BALL_RADIUS = 0.24;
export function createBall(position={x:0,y:1.35,z:5.4}) {
  return { position:{...position}, velocity:{x:0,y:0,z:0}, active:false, scored:false, elapsed:0, bounceCount:0 };
}
export function launchBall(ball, aim={x:0,power:.55}) {
  const x=Math.max(-1,Math.min(1,aim.x||0));
  const power=Math.max(0,Math.min(1,aim.power??.55));
  ball.velocity={x:x*2.15,z:-(7.9+power*1.8),y:7.15+power*2.5};
  ball.active=true; ball.scored=false; ball.elapsed=0; ball.bounceCount=0;
  return ball;
}
export function stepBall(ball,dt) {
  if(!ball.active)return {grounded:false};
  const h=Math.min(dt,.033);
  ball.elapsed+=h;
  ball.velocity.y-=GRAVITY*h;
  ball.position.x+=ball.velocity.x*h;
  ball.position.y+=ball.velocity.y*h;
  ball.position.z+=ball.velocity.z*h;
  // Backboard: a forgiving physical plane behind the rim.
  if(ball.position.z < -4.05 && ball.position.z > -4.42 && ball.position.y>2.85 && ball.position.y<4.35 && Math.abs(ball.position.x)<1.15 && ball.velocity.z<0){
    ball.position.z=-4.02; ball.velocity.z=Math.abs(ball.velocity.z)*.58; ball.velocity.x*=.82; ball.velocity.y=Math.max(1.4,ball.velocity.y*.72);
    return {backboard:true};
  }
  // The rim is a circular collision boundary; a clean centre pass scores.
  if(!ball.scored && ball.velocity.z<0 && ball.position.z<=-3.48 && ball.position.z>=-3.82){
    const dx=ball.position.x;
    const dy=ball.position.y-3.05;
    const radial=Math.hypot(dx,dy);
    if(radial<.31 && ball.position.y<3.25 && ball.position.y>2.55){
      ball.scored=true;
      return {score:true};
    }
    if(radial<.72 && radial>.31 && ball.position.y>2.65 && ball.position.y<3.5){
      const nx=dx/(radial||1),ny=dy/(radial||1);
      const dot=ball.velocity.x*nx+ball.velocity.y*ny;
      ball.velocity.x-=1.45*dot*nx; ball.velocity.y-=1.45*dot*ny;
      ball.velocity.z=Math.abs(ball.velocity.z)*.45;
      ball.position.z=-3.42;
      return {rim:true};
    }
  }
  if(ball.position.y<=BALL_RADIUS && ball.velocity.y<0){
    ball.position.y=BALL_RADIUS;
    ball.velocity.y=Math.abs(ball.velocity.y)*.48;
    ball.velocity.x*=.76; ball.velocity.z*=.76;
    ball.bounceCount++;
    if(Math.abs(ball.velocity.y)<1.05 || ball.bounceCount>=3){ball.active=false;return {grounded:true};}
    return {bounce:true};
  }
  if(ball.elapsed>4.2 || Math.abs(ball.position.x)>7 || ball.position.z>9 || ball.position.z< -9){ball.active=false;return {grounded:true};}
  return {};
}
export function evaluateShot(ball) {
  const dx=ball.position.x;
  const dy=ball.position.y-3.05;
  return Math.hypot(dx,dy);
}

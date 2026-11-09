/* Comet Air Hockey: tournament ladder vs 3 CPU personalities with real puck physics. */
(function(){
const N=window.NXG;
const TW=400,TH=720,GW=150,PR=17,MR=29;
const OPP=[
 {name:'ROOKIE BOT',col:'#8bb7dc',speed:700,react:.2,err:30,smash:.15,predict:0,goals:5},
 {name:'PRO-BOT 9',col:'#91c9a7',speed:760,react:.16,err:24,smash:.4,predict:1,goals:5},
 {name:'CHAMPION CRUSH',col:'#ef896d',speed:1050,react:.07,err:10,smash:.7,predict:2,goals:7}];
function lay(a){const W=a.W,H=a.H,land=W>H;const s=land?Math.min((W-60)/TH,(H-90)/TW):Math.min((W-30)/TW,(H-150)/TH);return{land,s,ox:(W-(land?TH:TW)*s)/2,oy:land?(H-TW*s)/2+18:(H-TH*s)/2+30,W,H};}
function S(L,u,v){return L.land?{x:L.ox+(TH-v)*L.s,y:L.oy+u*L.s}:{x:L.ox+u*L.s,y:L.oy+v*L.s};}
function U(L,x,y){return L.land?{u:(y-L.oy)/L.s,v:TH-(x-L.ox)/L.s}:{u:(x-L.ox)/L.s,v:(y-L.oy)/L.s};}
function newPuck(p,towardPlayer){p.puck={x:TW/2,y:TH/2+(towardPlayer?60:-60),vx:0,vy:0,r:PR,m:1,trail:[]};p.serve=.9;p.rally=0;}
function init(a){const p=a.p;p.level=0;p.me={x:TW/2,y:TH-110,vx:0,vy:0,tx:TW/2,ty:TH-110,r:MR,m:5};p.cpu={x:TW/2,y:110,vx:0,vy:0,r:MR,m:5,tx:TW/2,ty:110,wait:0,mode:'def'};p.pg=0;p.cg=0;newPuck(p,true);p.t=0;p.flash=0;p.msg='';p.msgT=0;p.mt=90;p.sparks=[];p.sudden=false;p.maxSpeed=0;p.kb={x:0,y:0};p.won=0;p.shutouts=0;p.over=false;}
function start(a){const p=a.p;init(a);p.single=!!p.tableDuel;p.level=p.single?(a.diff.id==='easy'?0:a.diff.id==='hard'?2:1):0;p.skill=a.diff.id==='easy'?.8:a.diff.id==='hard'?1.18:1;p.maxLvl=a.store.get('hockeyBest',0);p.mtotal=0;a.hud(p.single?'ENTRY MATCH · FIRST TO '+OPP[p.level].goals:'TOURNAMENT · BEAT 3 BOTS · FIRST TO '+OPP[0].goals);p.mt=90;p.msg=(p.single?'MATCH · ':'ROUND 1 · ')+OPP[p.level].name;p.msgT=2;p.wide=a.mastery>=2?1.1:1;p.me.r=MR*(a.mastery>=4?1.1:1);}
function startMatch(a,i){const p=a.p;p.level=i;p.pg=0;p.cg=0;p.mt=90;p.sudden=false;p.cpu.x=TW/2;p.cpu.y=110;p.me.x=TW/2;p.me.y=TH-110;newPuck(p,i%2===0);p.msg='ROUND '+(i+1)+' · '+OPP[i].name;p.msgT=2.2;}
function goal(a,who){const p=a.p,o=OPP[p.level];if(who==='me'){p.pg++;a.addScore(20+Math.round(p.rally*2),TW/2,60,'#ffe08a');a.combo=a.combo+1;N.sfx(a,'win');p.msg='GOAL!';}else{p.cg++;a.combo=0;N.sfx(a,'lose');p.msg='CPU SCORES';}
 p.msgT=1.4;a.shake(9,.35);p.flash=1;for(let i=0;i<24;i++)p.sparks.push({x:p.puck.x,y:who==='me'?30:TH-30,vx:N.rand(-300,300),vy:N.rand(-300,300),t:N.rand(.4,.9),col:who==='me'?'#ffe08a':'#ef896d'});
 const target=o.goals;
 if(p.pg>=target||p.cg>=target||(p.sudden&&p.pg!==p.cg)){endMatch(a,p.pg>p.cg);return;}
 newPuck(p,who==='cpu');p.puck.y=who==='me'?TH/2-80:TH/2+80;}
function endMatch(a,won){const p=a.p;if(p.single){a.addScore(won?100+p.pg*10:p.pg*5);a.finish(won,{grade:won?'MATCH WON':'MATCH LOST'});p.over=true;return;}if(won){p.won++;if(p.cg===0){p.shutouts++;a.achieve('shutout','Win a match without conceding',8);}a.addScore(100+p.level*50+(p.cg===0?60:0),TW/2,TH/2,'#ffe08a');N.sfx(a,'win');
  if(p.level>=2){a.achieve('champ','Beat the Champion',20);a.store.set('hockeyBest',3);a.finish(true,{grade:'TOURNAMENT CHAMPION'});p.over=true;return;}
  a.store.set('hockeyBest',Math.max(a.store.get('hockeyBest',0),p.level+1));startMatch(a,p.level+1);}
 else{a.addScore(p.pg*5);a.finish(false,{grade:'ELIMINATED IN ROUND '+(p.level+1)});p.over=true;}}
function hit(pk,m,boost){const dx=pk.x-m.x,dy=pk.y-m.y,d=Math.hypot(dx,dy),R=pk.r+m.r;if(d>=R||d===0)return 0;const nx=dx/d,ny=dy/d;pk.x=m.x+nx*R;pk.y=m.y+ny*R;const rvx=pk.vx-m.vx,rvy=pk.vy-m.vy,vn=rvx*nx+rvy*ny;if(vn>=0)return 0;pk.vx-=(1.92)*vn*nx;pk.vy-=(1.92)*vn*ny;const sp=Math.hypot(pk.vx,pk.vy);if(sp>1500){pk.vx*=1500/sp;pk.vy*=1500/sp;}return Math.abs(vn);}
function aiTarget(a,p,dt){const o=OPP[p.level],c=p.cpu,pk=p.puck,sk=p.skill;
 c.wait-=dt;if(c.wait>0)return;c.wait=o.react/sk;
 let tx=pk.x,ty=c.y;const ownHalf=pk.y<TH/2;
 if(o.predict&&pk.vy<-40){let x=pk.x,y=pk.y,vx=pk.vx,t=0;const steps=Math.min(30,(y-130)/-pk.vy*60);for(let i=0;i<steps;i++){x+=vx/60;if(x<PR||x>TW-PR){vx=-vx;x=N.clamp(x,PR,TW-PR);}}tx=o.predict>1||Math.random()<.7?x:pk.x;}
 const err=o.err/sk*(Math.random()-.5)*2;tx+=err;
 if(ownHalf&&Math.hypot(pk.vx,pk.vy)<260&&Math.random()<(.5+o.smash*.5)){c.mode='atk';ty=pk.y-PR*1.2;tx=pk.x+(pk.x<TW/2?-1:1)*8;}
 else if(ownHalf&&pk.y<TH*.42){c.mode='atk';ty=Math.max(60,pk.y-30);}
 else{c.mode='def';ty=90+(o.smash>.5?50:0);}
 c.tx=N.clamp(tx,MR+8,TW-MR-8);c.ty=N.clamp(ty,MR+8,TH/2-MR-4);}
function stepPhys(a,dt){const p=a.p;if(p.over||!a.running)return;const pk=p.puck,m=p.me,c=p.cpu,o=OPP[p.level];
 const k=a.keys;let kx=(k.ArrowRight||k.d||k.D?1:0)-(k.ArrowLeft||k.a||k.A?1:0),ky=(k.ArrowDown||k.s||k.S?1:0)-(k.ArrowUp||k.w||k.W?1:0);
 if(kx||ky){const l=a.W>a.H,du=l?ky:kx,dv=l?-kx:ky;m.tx=N.clamp(m.tx+du*820*dt,m.r,TW-m.r);m.ty=N.clamp(m.ty+dv*820*dt,TH/2+m.r,TH-m.r);}
 // mallets chase targets with speed cap (velocity feeds the hit)
 const mv=(o2,sp)=>{const dx=o2.tx-o2.x,dy=o2.ty-o2.y,d=Math.hypot(dx,dy)||1,s=Math.min(d/dt,sp);o2.vx=dx/d*s;o2.vy=dy/d*s;o2.x+=o2.vx*dt;o2.y+=o2.vy*dt;};
 mv(m,2400);mv(c,o.speed*p.skill);
 if(p.serve>0){p.serve-=dt;return;}
 const sx=pk.x,sy=pk.y;pk.x+=pk.vx*dt;pk.y+=pk.vy*dt;pk.vx*=1-.28*dt;pk.vy*=1-.28*dt;
 const gl=TW/2-GW/2,gr=TW/2+GW/2;
 if(pk.x<pk.r){pk.x=pk.r;pk.vx=Math.abs(pk.vx)*.93;N.sfx(a,'ping');}if(pk.x>TW-pk.r){pk.x=TW-pk.r;pk.vx=-Math.abs(pk.vx)*.93;N.sfx(a,'ping');}
 if(pk.y<pk.r){if(pk.x>gl&&pk.x<gr){if(pk.y<-pk.r*1.2){goal(a,'me');return;}}else{pk.y=pk.r;pk.vy=Math.abs(pk.vy)*.93;N.sfx(a,'ping');}}
 if(pk.y>TH-pk.r){if(pk.x>gl&&pk.x<gr){if(pk.y>TH+pk.r*1.2){goal(a,'cpu');return;}}else{pk.y=TH-pk.r;pk.vy=-Math.abs(pk.vy)*.93;N.sfx(a,'ping');}}
 // goal posts
 for(const gx of[gl,gr])for(const gy of[0,TH]){const dx=pk.x-gx,dy=pk.y-gy,d=Math.hypot(dx,dy);if(d<pk.r+4&&d>0){const nx=dx/d,ny=dy/d;pk.x=gx+nx*(pk.r+4);pk.y=gy+ny*(pk.r+4);const vn=pk.vx*nx+pk.vy*ny;if(vn<0){pk.vx-=1.9*vn*nx;pk.vy-=1.9*vn*ny;}}}
 const v1=hit(pk,m,1);if(v1>60){p.rally++;N.sfx(a,'hit');a.shake(Math.min(5,v1/260),.12);for(let i=0;i<Math.min(10,v1/80);i++)p.sparks.push({x:pk.x,y:pk.y,vx:N.rand(-200,200),vy:N.rand(-200,200),t:N.rand(.2,.5),col:'#fff0b0'});const sp=Math.hypot(pk.vx,pk.vy);if(sp>1000)a.achieve('smash','Hit a 1000+ speed smash',6);p.maxSpeed=Math.max(p.maxSpeed,sp);}
 const v2=hit(pk,c,1);if(v2>60){N.sfx(a,'hit');}
 // keep puck out of the defender's own mallet overlap + nudge stuck puck
 const sp=Math.hypot(pk.vx,pk.vy);if(sp<12&&p.serve<=0){p.still=(p.still||0)+dt;if(p.still>2.2){p.still=0;pk.vy+=pk.y<TH/2?-220:220;}}else p.still=0;
 pk.trail.push({x:pk.x,y:pk.y});if(pk.trail.length>12)pk.trail.shift();
 aiTarget(a,p,dt);}
function update(dt,a){const p=a.p;if(p.over)return;const f=N.stepper(h=>stepPhys(a,h),240);f(dt);p.t+=dt;if(p.msgT>0)p.msgT-=dt;if(p.flash>0)p.flash-=dt*2;
 p.mt-=dt;if(p.mt<=0&&!p.over){if(p.pg===p.cg){p.sudden=true;p.mt=30;p.msg='SUDDEN DEATH';p.msgT=1.6;}else endMatch(a,p.pg>p.cg);}
 for(const s of p.sparks){s.x+=s.vx*dt;s.y+=s.vy*dt;s.t-=dt;}p.sparks=p.sparks.filter(s=>s.t>0);}
/* ---------- art: baked arena + frosted table, clay mallets/puck (draw-only) ---------- */
const INK=N.INK,TAU=N.TAU,sh=N.shade;
const SPR={};
function spr(key,w,h,fn){let c=SPR[key];if(!c){c=document.createElement('canvas');c.width=Math.ceil(w);c.height=Math.ceil(h);fn(c.getContext('2d'),c.width,c.height);SPR[key]=c;}return c;}
function glowSpr(col,r){r=Math.round(r/4)*4||4;return spr('g'+col+r,r*2,r*2,(c,w)=>{const g=c.createRadialGradient(r,r,0,r,r,r);g.addColorStop(0,col);g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.fillRect(0,0,w,w);});}
function glowAt(ctx,x,y,r,col,a){const s=glowSpr(col,r);ctx.globalAlpha=a;ctx.globalCompositeOperation='lighter';ctx.drawImage(s,x-s.width/2,y-s.height/2);ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;}
function claySlab(c,x,y,w,h,r,col,lw=2){const g=c.createLinearGradient(0,y,0,y+h);g.addColorStop(0,sh(col,.32));g.addColorStop(.5,col);g.addColorStop(1,sh(col,-.4));c.fillStyle=g;N.rr(c,x,y,w,h,r);c.fill();c.strokeStyle=INK;c.lineWidth=lw;c.stroke();c.strokeStyle='rgba(255,246,222,.5)';c.lineWidth=Math.max(1,Math.min(3,h*.07));c.lineCap='round';c.beginPath();c.moveTo(x+r,y+Math.min(h*.14,5));c.lineTo(x+w-r,y+Math.min(h*.14,5));c.stroke();}
function malletSpr(r,col){r=Math.round(r);const P=Math.round(r*.5);return spr('m'+col+r,r*2+P*2,r*2+P*2,(c,w)=>{const x=w/2,y=w/2;
  c.fillStyle='rgba(8,18,34,.42)';c.beginPath();c.ellipse(x+r*.14,y+r*.3,r*1.02,r*.94,0,0,TAU);c.fill();
  let g=c.createRadialGradient(x-r*.4,y-r*.45,r*.1,x,y,r*1.05);g.addColorStop(0,sh(col,.38));g.addColorStop(.55,col);g.addColorStop(1,sh(col,-.5));c.fillStyle=g;c.beginPath();c.arc(x,y,r,0,TAU);c.fill();c.strokeStyle=INK;c.lineWidth=Math.max(2,r*.08);c.stroke();
  c.strokeStyle='rgba(255,246,222,.55)';c.lineWidth=Math.max(1.4,r*.07);c.lineCap='round';c.beginPath();c.arc(x,y,r*.88,3.5,4.5);c.stroke();
  c.fillStyle='rgba(20,8,30,.28)';c.beginPath();c.arc(x+r*.04,y+r*.06,r*.62,0,TAU);c.fill();
  g=c.createRadialGradient(x-r*.2,y-r*.26,r*.04,x,y,r*.58);g.addColorStop(0,sh(col,.62));g.addColorStop(.5,sh(col,.12));g.addColorStop(1,sh(col,-.4));c.fillStyle=g;c.beginPath();c.arc(x,y,r*.56,0,TAU);c.fill();c.strokeStyle=INK;c.lineWidth=Math.max(1.6,r*.07);c.stroke();
  c.strokeStyle='rgba(255,250,235,.85)';c.lineWidth=Math.max(1.4,r*.08);c.beginPath();c.arc(x,y,r*.4,3.5,4.4);c.stroke();});}
function puckSpr(r){r=Math.round(r);return spr('p'+r,r*2+14,r*2+14,(c,w)=>{const x=w/2-1,y=w/2-1;
  c.fillStyle='rgba(8,18,34,.45)';c.beginPath();c.ellipse(x+r*.2,y+r*.32,r*1.02,r*.9,0,0,TAU);c.fill();
  c.fillStyle='#8a2650';c.beginPath();c.arc(x,y+r*.16,r,0,TAU);c.fill();c.strokeStyle=INK;c.lineWidth=Math.max(1.6,r*.1);c.stroke();
  const g=c.createRadialGradient(x-r*.35,y-r*.45,r*.08,x,y,r*1.05);g.addColorStop(0,'#ffd8ea');g.addColorStop(.5,'#ee5e98');g.addColorStop(1,'#a02f62');c.fillStyle=g;c.beginPath();c.arc(x,y,r,0,TAU);c.fill();c.stroke();
  c.strokeStyle='rgba(255,230,240,.5)';c.lineWidth=Math.max(1.2,r*.1);c.beginPath();c.arc(x,y,r*.62,0,TAU);c.stroke();c.strokeStyle='rgba(255,252,240,.85)';c.lineWidth=Math.max(1.4,r*.12);c.lineCap='round';c.beginPath();c.arc(x,y,r*.82,3.5,4.4);c.stroke();});}
function chipSpr(col){return spr('c'+col,8,8,(c)=>{c.fillStyle=col;c.beginPath();c.moveTo(1,2);c.lineTo(6,1);c.lineTo(7,6);c.lineTo(2,7);c.closePath();c.fill();c.strokeStyle=INK;c.lineWidth=1;c.stroke();});}
function bakeArena(c,L,o0){
 const W=L.W,H=L.H,R=N.mulberry(5);
 N.bgGrad(c,W,H,['#101a2e','#1c2f48','#16243c']);
 // hex floor tiles
 c.save();c.globalAlpha=.2;c.strokeStyle='#5fa0b4';c.lineWidth=1.5;for(let y=0;y<H+30;y+=26)for(let x=((y/26)%2)*22;x<W+40;x+=44){c.beginPath();for(let k=0;k<6;k++){const a=k/6*TAU+TAU/12;c.lineTo(x+Math.cos(a)*14,y+Math.sin(a)*14);}c.closePath();c.stroke();}c.restore();
 // neon wall strips + comet decals
 for(let i=0;i<4;i++){const col=i%2?'#9de3d1':'#ff9bd0';c.strokeStyle=col;c.globalAlpha=.55;c.lineWidth=3;c.lineCap='round';c.beginPath();if(L.land){c.moveTo(14,40+i*(H-80)/3);c.lineTo(34,40+i*(H-80)/3+10);c.moveTo(W-14,40+i*(H-80)/3);c.lineTo(W-34,40+i*(H-80)/3+10);}else{c.moveTo(6,120+i*180);c.lineTo(6,170+i*180);c.moveTo(W-6,120+i*180);c.lineTo(W-6,170+i*180);}c.stroke();c.globalAlpha=1;}
 for(let i=0;i<50;i++){c.fillStyle='rgba(157,227,209,.5)';c.beginPath();c.arc(R()*W,R()*H,.8+R()*1.3,0,TAU);c.fill();}
 // table rim + frosted surface
 const s=L.s,A=S(L,0,0),B=S(L,TW,TH),x0=Math.min(A.x,B.x),y0=Math.min(A.y,B.y),w=Math.abs(B.x-A.x),h=Math.abs(B.y-A.y);
 c.fillStyle='rgba(6,10,20,.5)';N.rr(c,x0-12,y0-6,w+36,h+46,34);c.fill();
 const lg=c.createLinearGradient(0,y0-20,0,y0+h+22);lg.addColorStop(0,'#e29a8c');lg.addColorStop(.5,'#b77c72');lg.addColorStop(1,'#7e4e52');
 c.fillStyle=lg;N.rr(c,x0-18,y0-18,w+36,h+36,28);c.fill();c.strokeStyle=INK;c.lineWidth=3;c.stroke();
 c.strokeStyle='rgba(255,236,214,.6)';c.lineWidth=3;c.lineCap='round';c.beginPath();c.moveTo(x0+4,y0-14);c.lineTo(x0+w-4,y0-14);c.stroke();
 c.fillStyle='#10192c';N.rr(c,x0-4,y0-4,w+8,h+8,15);c.fill();
 const g=c.createLinearGradient(x0,y0,x0+w,y0+h);g.addColorStop(0,'#cdeee6');g.addColorStop(.5,'#a8dccf');g.addColorStop(1,'#86c1bc');c.fillStyle=g;N.rr(c,x0,y0,w,h,12);c.fill();
 c.save();N.rr(c,x0,y0,w,h,12);c.clip();
 c.fillStyle='rgba(30,70,86,.2)';for(let i=0;i<w;i+=12)for(let j=0;j<h;j+=12){c.beginPath();c.arc(x0+i+((j/12)%2)*6,y0+j,1.2,0,TAU);c.fill();}
 // painted markings in clay-paint
 const cl=(col,lw)=>{c.strokeStyle=col;c.lineWidth=lw;c.lineCap='round';};
 const c1=S(L,0,TH/2),c2=S(L,TW,TH/2),cc=S(L,TW/2,TH/2);
 cl('rgba(239,137,109,.85)',5);c.beginPath();c.moveTo(c1.x,c1.y);c.lineTo(c2.x,c2.y);c.stroke();
 cl('rgba(255,250,236,.8)',3);c.beginPath();c.arc(cc.x,cc.y,64*s,0,TAU);c.stroke();c.fillStyle='#ef896d';c.beginPath();c.arc(cc.x,cc.y,9*s,0,TAU);c.fill();c.strokeStyle=INK;c.lineWidth=1.5;c.stroke();
 for(const [gy,col] of[[0,o0],[TH,'#f2ce77']]){const gc=S(L,TW/2,gy);cl(col,4);c.beginPath();c.arc(gc.x,gc.y,GW/2*s,0,TAU);c.stroke();}
 // frosted sheen + inner bevel shadow
 const sg=c.createLinearGradient(x0,y0,x0+w*.8,y0+h*.4);sg.addColorStop(0,'rgba(255,255,255,.35)');sg.addColorStop(.5,'rgba(255,255,255,.06)');sg.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=sg;c.beginPath();c.moveTo(x0,y0);c.lineTo(x0+w*.7,y0);c.lineTo(x0+w*.25,y0+h);c.lineTo(x0,y0+h);c.closePath();c.fill();
 c.strokeStyle='rgba(12,30,50,.4)';c.lineWidth=9;N.rr(c,x0-3,y0-3,w+6,h+6,14);c.stroke();
 c.restore();
 c.strokeStyle=INK;c.lineWidth=2;N.rr(c,x0,y0,w,h,12);c.stroke();
 // goal slots
 for(const gy of[0,TH]){const a1=S(L,TW/2-GW/2,gy),a2=S(L,TW/2+GW/2,gy);const rx=Math.min(a1.x,a2.x),ry=Math.min(a1.y,a2.y),rw=Math.abs(a2.x-a1.x),rh=Math.abs(a2.y-a1.y);
  const dx=L.land?(gy===0?-1:1):0,dy=L.land?0:(gy===0?-1:1);const gx=L.land?(gy===0?rx-17:rx):rx,gyy=L.land?ry:(gy===0?ry-17:ry);
  const gw=L.land?17:rw,gh=L.land?rh:17;c.fillStyle='#06090f';c.fillRect(gx-(L.land?0:0),gyy,gw||18,gh||18);c.strokeStyle=INK;c.lineWidth=2;c.strokeRect(gx,gyy,gw||18,gh||18);}
 // gold post knobs
 for(const gx of[TW/2-GW/2,TW/2+GW/2])for(const gy of[0,TH]){const q=S(L,gx,gy);const gr=c.createRadialGradient(q.x-2,q.y-2,1,q.x,q.y,7);gr.addColorStop(0,'#fff0c0');gr.addColorStop(.6,'#e4b672');gr.addColorStop(1,'#8a5b1a');c.fillStyle=gr;c.beginPath();c.arc(q.x,q.y,6.5,0,TAU);c.fill();c.strokeStyle=INK;c.lineWidth=1.8;c.stroke();}
 N.grain(c,W,H,.5);
 return{x0,y0,w,h};
}
function draw(ctx,a){const p=a.p,L=lay(a),W=a.W,H=a.H,o=OPP[p.level||0],art=p.art||(p.art={rally:0,sq:0});
 let T=null;
 N.cached(ctx,'hockey'+o.col+(L.land?'L':'P'),W,H,(c)=>{bakeArena(c,L,o.col);});
 const A=S(L,0,0),B=S(L,TW,TH),tx0=Math.min(A.x,B.x),ty0=Math.min(A.y,B.y);
 // goal light spill
 for(const [gy,col] of[[0,o.col],[TH,'#f2ce77']]){const q=S(L,TW/2,gy);glowAt(ctx,q.x,q.y,(p.flash>0?190:100)*L.s,col,p.flash>0?.95:.4);}
 const pk=p.puck,sp=Math.hypot(pk.vx,pk.vy);
 if(art.rally!==p.rally){art.rally=p.rally;art.sq=1;}if(art.sq>0)art.sq=Math.max(0,art.sq-1/9);
 const q=S(L,pk.x,pk.y),pr=PR*L.s;
 // trail: glossy fading discs
 for(let i=0;i<pk.trail.length;i++){const t=pk.trail[i],z=S(L,t.x,t.y),k=i/pk.trail.length;ctx.globalAlpha=k*.4*Math.min(1,sp/500);const gs=glowSpr('#ff9bd0',Math.round(pr*(.8+k*.5)));ctx.drawImage(gs,z.x-gs.width/2,z.y-gs.height/2);}ctx.globalAlpha=1;
 glowAt(ctx,q.x,q.y,pr*3.4,'#ff9bd0',.22+Math.min(.4,sp/2500));
 const mallet=(m,col)=>{const z=S(L,m.x,m.y),r=m.r*L.s,s=malletSpr(r,col);ctx.drawImage(s,z.x-s.width/2,z.y-s.height/2);};
 mallet(p.me,'#f2ce77');mallet(p.cpu,o.col);
 {const s=puckSpr(pr),k=art.sq;ctx.save();ctx.translate(q.x,q.y);const ang=Math.atan2(pk.vy,pk.vx);if(k>0){ctx.rotate(L.land?0:0);ctx.scale(1+.18*k,1-.14*k);}ctx.drawImage(s,-s.width/2+1,-s.height/2+1);ctx.restore();}
 // clay chips
 for(const s of p.sparks){const z=S(L,s.x,s.y),cs=chipSpr(s.col);ctx.globalAlpha=Math.min(1,s.t*3);ctx.save();ctx.translate(z.x,z.y);ctx.rotate(s.t*9+s.x);ctx.drawImage(cs,-4,-4,8,8);ctx.restore();}ctx.globalAlpha=1;
 // HUD band (top)
 N.chip(ctx,12,8,L.land?150:130,'YOU',p.pg,{color:'#ffe08a'});N.chip(ctx,L.land?172:150,8,L.land?200:W-262,o.name,p.cg,{color:o.col});
 const tt=Math.max(0,Math.ceil(p.mt));N.chip(ctx,W-100,8,88,p.sudden?'SUDDEN':'TIME',tt,{color:p.sudden?'#ef896d':'#fff0d4'});
 const rtxt=(p.single?'ENTRY MATCH':'ROUND '+((p.level||0)+1)+' / 3')+' · FIRST TO '+o.goals;
 {const pw=210,py=H-30;ctx.fillStyle='rgba(18,10,28,.55)';N.rr(ctx,W/2-pw/2,py,pw,22,11);ctx.fill();ctx.strokeStyle='rgba(228,182,114,.6)';ctx.lineWidth=1.3;ctx.stroke();N.text(ctx,rtxt,W/2,py+16,{font:'700 12px Fredoka',align:'center',color:'#bfe4da'});}
 if(p.msgT>0){const k=Math.min(1,p.msgT*2),sc=1+Math.max(0,p.msgT-1.1)*.5;ctx.save();ctx.globalAlpha=k;ctx.translate(W/2,H/2);ctx.scale(sc,sc);N.text(ctx,p.msg,0,0,{font:'700 '+Math.round(Math.min(W,H)*.1)+'px Fredoka',align:'center',color:'#ffe08a',stroke:'#1a1226',sw:6,glow:'#ff6f91'});ctx.restore();}
 if(!a.running){const w=Math.min(W*.7,360),h=50,x=W/2-w/2,y=H*.22;ctx.fillStyle='rgba(18,8,28,.4)';N.rr(ctx,x+3,y+6,w,h,20);ctx.fill();claySlab(ctx,x,y,w,h,20,'#5a3d62',2.4);N.text(ctx,'COMET AIR HOCKEY',W/2,y+22,{font:'700 18px Fredoka',align:'center',color:'#ffe08a',stroke:'#1a1226'});N.text(ctx,'Slide your mallet to strike · beat 3 bots',W/2,y+40,{font:'600 11px Fredoka',align:'center',color:'#fff0d4'});}
 N.vignette(ctx,W,H,.3);}
function ptr(x,y,e,a){const p=a.p,L=lay(a);const off=e&&e.pointerType==='touch'?55:0;const q=U(L,L.land?x+off:x,L.land?y:y-off);p.me.tx=N.clamp(q.u,p.me.r,TW-p.me.r);p.me.ty=N.clamp(q.v,TH/2+p.me.r,TH-p.me.r);}
NEXUS_GAMES.register('airhockey',{meta:{title:'COMET AIR HOCKEY',help:'Three-bot tournament. Beat Rookie, Pro and Champion to win the cup. Shots keep the speed of your mallet; bank them off the rails. First to 5 (7 vs the Champion).',controls:'Move mouse / drag finger to steer · or WASD / arrows',type:'HEAD TO HEAD'},
 size:[900,520],portraitSize:[540,860],duration:0,timed:false,tier:1.25,init,start,update,draw,pointerdown:ptr,pointermove:ptr,pointerup(){}});
})();

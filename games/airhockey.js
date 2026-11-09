/* Comet Air Hockey: tournament ladder vs 3 CPU personalities with real puck physics. */
(function(){
const N=window.NXG;
const TW=400,TH=720,GW=150,PR=17,MR=29;
const OPP=[
 {name:'ROOKIE BOT',col:'#8bb7dc',speed:520,react:.28,err:46,smash:.15,predict:0,goals:5},
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
function stepPhys(a,dt){const p=a.p,pk=p.puck,m=p.me,c=p.cpu,o=OPP[p.level];
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
function draw(ctx,a){const p=a.p,L=lay(a),W=a.W,H=a.H,o=OPP[p.level||0];
 N.bgGrad(ctx,W,H,['#16233a','#243b52','#1b2c44']);for(let i=0;i<40;i++)N.glow(ctx,(i*173+31)%W,(i*97+19)%H,2+(i%3),'#9de3d1',.25);
 const A=S(L,0,0),B=S(L,TW,TH);const x0=Math.min(A.x,B.x),y0=Math.min(A.y,B.y),w=Math.abs(B.x-A.x),h=Math.abs(B.y-A.y);
 ctx.save();ctx.fillStyle='#0b1220';N.rr(ctx,x0-18,y0-18+8,w+36,h+36,26);ctx.fill();
 N.slab(ctx,x0-18,y0-18,w+36,h+36,26,'#b77c72',{depth:8});
 const g=ctx.createLinearGradient(x0,y0,x0+w,y0+h);g.addColorStop(0,'#bfe4da');g.addColorStop(1,'#9bd0c6');ctx.fillStyle=g;N.rr(ctx,x0,y0,w,h,12);ctx.fill();
 ctx.save();N.rr(ctx,x0,y0,w,h,12);ctx.clip();
 // air holes
 ctx.fillStyle='rgba(30,70,80,.16)';for(let i=0;i<w;i+=14)for(let j=0;j<h;j+=14){ctx.beginPath();ctx.arc(x0+i+((j/14)%2)*7,y0+j,1.2,0,N.TAU);ctx.fill();}
 ctx.strokeStyle='rgba(255,255,255,.7)';ctx.lineWidth=3;const c1=S(L,0,TH/2),c2=S(L,TW,TH/2);ctx.beginPath();ctx.moveTo(c1.x,c1.y);ctx.lineTo(c2.x,c2.y);ctx.stroke();
 const cc=S(L,TW/2,TH/2);ctx.beginPath();ctx.arc(cc.x,cc.y,64*L.s,0,N.TAU);ctx.stroke();ctx.fillStyle='rgba(255,255,255,.7)';ctx.beginPath();ctx.arc(cc.x,cc.y,6,0,N.TAU);ctx.fill();
 for(const gy of[0,TH]){const gc=S(L,TW/2,gy);ctx.beginPath();ctx.arc(gc.x,gc.y,GW/2*L.s,0,N.TAU);ctx.stroke();}
 ctx.restore();
 // goals
 for(const [gy,col] of[[0,o.col],[TH,'#f2ce77']]){const a1=S(L,TW/2-GW/2,gy),a2=S(L,TW/2+GW/2,gy);const rx=Math.min(a1.x,a2.x),ry=Math.min(a1.y,a2.y),rw=Math.abs(a2.x-a1.x)||20,rh=Math.abs(a2.y-a1.y)||20;const pad=L.land?[-14,0]:[0,-14];ctx.fillStyle='#0a0f1a';ctx.fillRect(rx+(L.land?(gy===TH?-16:0):0),ry+(L.land?0:(gy===0?-16:0)),L.land?16:rw,L.land?rh:16);N.glow(ctx,(a1.x+a2.x)/2,(a1.y+a2.y)/2,70*L.s,col,p.flash>0?.9:.35);}
 ctx.restore();
 // trail + puck
 const pk=p.puck;const sp=Math.hypot(pk.vx,pk.vy);
 for(let i=0;i<pk.trail.length;i++){const t=pk.trail[i],q=S(L,t.x,t.y);ctx.globalAlpha=i/pk.trail.length*.35*Math.min(1,sp/500);ctx.fillStyle='#ffe9b8';ctx.beginPath();ctx.arc(q.x,q.y,PR*L.s*(.4+i/pk.trail.length*.6),0,N.TAU);ctx.fill();}ctx.globalAlpha=1;
 const mallet=(m,col,lbl)=>{const q=S(L,m.x,m.y),r=m.r*L.s;ctx.fillStyle='rgba(8,10,20,.35)';ctx.beginPath();ctx.ellipse(q.x+4,q.y+7,r,r*.9,0,0,N.TAU);ctx.fill();N.ball(ctx,q.x,q.y,r,col,{shadow:false});N.ball(ctx,q.x,q.y,r*.5,N.shade(col,.25),{shadow:false});};
 mallet(p.me,'#f2ce77');mallet(p.cpu,o.col);
 const q=S(L,pk.x,pk.y),pr=PR*L.s;N.glow(ctx,q.x,q.y,pr*3.4,'#ff9bd0',.28+Math.min(.4,sp/2500));
 ctx.fillStyle='rgba(8,10,20,.4)';ctx.beginPath();ctx.ellipse(q.x+2,q.y+4,pr,pr*.85,0,0,N.TAU);ctx.fill();
 const pg=ctx.createRadialGradient(q.x-pr*.3,q.y-pr*.3,1,q.x,q.y,pr);pg.addColorStop(0,'#ffd0e6');pg.addColorStop(1,'#d9407f');ctx.fillStyle=pg;ctx.beginPath();ctx.arc(q.x,q.y,pr,0,N.TAU);ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.stroke();
 for(const s of p.sparks){const z=S(L,s.x,s.y);ctx.globalAlpha=Math.min(1,s.t*3);ctx.fillStyle=s.col;ctx.fillRect(z.x-2,z.y-2,4,4);}ctx.globalAlpha=1;
 // HUD
 N.chip(ctx,12,8,L.land?150:130,'YOU',p.pg,{color:'#ffe08a'});N.chip(ctx,L.land?172:150,8,L.land?200:W-162,o.name,p.cg,{color:o.col});
 const tt=Math.max(0,Math.ceil(p.mt));N.chip(ctx,W-100,8,88,p.sudden?'SUDDEN':'TIME',tt,{color:p.sudden?'#ef896d':'#fff0d4'});
 N.text(ctx,(p.single?'ENTRY MATCH':'ROUND '+((p.level||0)+1)+' / 3')+' · FIRST TO '+o.goals,W/2,H-10,{font:'700 12px Fredoka',align:'center',color:'#bfe4da'});
 if(p.msgT>0){ctx.globalAlpha=Math.min(1,p.msgT*2);N.text(ctx,p.msg,W/2,H/2,{font:'700 '+Math.round(Math.min(W,H)*.1)+'px Fredoka',align:'center',color:'#ffe08a',stroke:'#1a1226',glow:'#ff6f91'});ctx.globalAlpha=1;}
 if(!a.running)N.banner(ctx,W,H,'COMET AIR HOCKEY','Beat three bots in a tournament · slide your mallet to strike');
 N.vignette(ctx,W,H,.3);}
function ptr(x,y,e,a){const p=a.p,L=lay(a);const off=e&&e.pointerType==='touch'?55:0;const q=U(L,L.land?x+off:x,L.land?y:y-off);p.me.tx=N.clamp(q.u,p.me.r,TW-p.me.r);p.me.ty=N.clamp(q.v,TH/2+p.me.r,TH-p.me.r);}
NEXUS_GAMES.register('airhockey',{meta:{title:'COMET AIR HOCKEY',help:'Three-bot tournament. Beat Rookie, Pro and Champion to win the cup. Shots keep the speed of your mallet; bank them off the rails. First to 5 (7 vs the Champion).',controls:'Move mouse / drag finger to steer · or WASD / arrows',type:'HEAD TO HEAD'},
 size:[900,520],portraitSize:[540,860],duration:0,timed:false,tier:1.25,init,start,update,draw,pointerdown:ptr,pointermove:ptr,pointerup(){}});
})();

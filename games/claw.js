/* Lucky Claw: swaying cable claw, physical prize pile, grip strength & slip, bombs, golden capsules, refills. */
(function(){
const N=window.NXG;
const TYPES=[
 {k:'bear',r:25,w:1.0,pts:10,cols:['#c98a5e','#e8b07a','#a86a4a'],face:1},
 {k:'bunny',r:21,w:.8,pts:8,cols:['#f7e3ee','#ffd0e0','#e8d0f0'],ears:1,face:1},
 {k:'robot',r:27,w:1.4,pts:16,cols:['#8bb7dc','#a5d9cf'],box:1},
 {k:'star',r:19,w:.55,pts:40,cols:['#ffd45e'],star:1,rare:1},
 {k:'bomb',r:20,w:.9,pts:-15,cols:['#3a2d45'],bomb:1},
 {k:'egg',r:22,w:.9,pts:0,cols:['#b58bd6','#91c9a7'],egg:1}];
function lay(a){const W=a.W,H=a.H,por=W<H;const ix=por?24:130,iw=W-ix*2-(por?0:0),iy=por?70:62,ih=H-iy-(por?150:90);return{W,H,ix,iw,iy,ih,floor:iy+ih-26,rail:iy+34,chuteW:por?96:120,por};}
function mk(L,t,x){const T=TYPES[t];return{t:T,x:x,y:L.floor-T.r-Math.random()*200,vx:0,vy:0,r:T.r,m:T.r*T.r*.01*T.w+.2,rot:Math.random()*6,col:T.cols[Math.floor(Math.random()*T.cols.length)],held:false,gone:false,mystery:T.egg?(Math.random()<.5?20:-5):0};}
function fill(a,n){const p=a.p,L=lay(a);const lo=L.ix+L.chuteW+30,hi=L.ix+L.iw-30;for(let i=0;i<n;i++){const r=Math.random();const t=r<.3?0:r<.55?1:r<.72?2:r<.8?3:r<.9?4:5;p.prizes.push(mk(L,t,N.rand(lo,hi)));}}
function init(a){const p=a.p,L=lay(a);Object.assign(p,{prizes:[],cx:L.ix+L.chuteW+160,tx:L.ix+L.chuteW+160,sway:0,swayV:0,cy:0,st:'move',stT:0,tries:5,grab:null,open:1,t:0,msg:'',msgT:0,got:0,over:false,wait:0,clock:15,bombHits:0,streak:0,sparkle:[],lastCx:0});fill(a,24);for(let i=0;i<260;i++)physics(a,1/120,true);}
function start(a){init(a);const p=a.p,m=a.mastery;p.tries=5+(m>=4?1:0);p.grip=(a.diff.id==='easy'?1.15:a.diff.id==='hard'?.8:.95)+(m>=2?.12:0);p.clockMax=a.diff.id==='easy'?20:a.diff.id==='hard'?11:15;p.clock=p.clockMax;a.hud('MOVE THE CLAW · DROP · GRIP TIGHT · CARRY TO THE CHUTE');}
function physics(a,dt,quiet){const p=a.p,L=lay(a);const lo=L.ix+14,hi=L.ix+L.iw-14;
 for(const q of p.prizes){if(q.held||q.gone)continue;q.vy+=1500*dt;q.x+=q.vx*dt;q.y+=q.vy*dt;q.vx*=1-1.2*dt;q.rot+=q.vx*dt*.02;
  if(q.y>L.floor-q.r){q.y=L.floor-q.r;if(q.vy>200&&!quiet)N.sfx(a,'tick');q.vy*=-.18;q.vx*=.85;}
  if(q.x<lo+q.r){q.x=lo+q.r;q.vx*=-.3;}if(q.x>hi-q.r){q.x=hi-q.r;q.vx*=-.3;}
  // chute: left pocket — floor opens for x < chute edge
  if(q.x<L.ix+L.chuteW&&q.y>L.floor-q.r*1.4&&!q.fall){q.fall=1;}
  if(q.fall){q.vy+=800*dt;if(q.y>L.floor+60&&!q.gone){q.gone=true;collect(a,q);}}}
 for(let it=0;it<2;it++)for(let i=0;i<p.prizes.length;i++){const A=p.prizes[i];if(A.held||A.gone||A.fall)continue;for(let j=i+1;j<p.prizes.length;j++){const B=p.prizes[j];if(B.held||B.gone||B.fall)continue;if(Math.abs(A.x-B.x)>A.r+B.r||Math.abs(A.y-B.y)>A.r+B.r)continue;N.circleCollide(A,B,.1);}}
}
function collect(a,q){const p=a.p,L=lay(a);let pts=q.t.pts;if(q.t.egg)pts=q.mystery;const x=L.ix+L.chuteW/2,y=L.floor-30;
 if(pts>0){a.addScore(pts*(1+Math.min(2,p.streak*.25)),x,y-20,'#ffe08a');p.streak++;a.combo=p.streak;p.got++;N.sfx(a,pts>=30?'win':'coin');a.burst(x,y,'#ffe08a',10);p.msg=q.t.egg?'MYSTERY +'+pts:q.t.k.toUpperCase()+' +'+pts;p.msgT=1.2;if(q.t.k==='star')a.achieve('star','Win a golden star capsule',8);if(p.got>=5)a.achieve('haul','Win 5 prizes in one game',8);}
 else{a.addScore(pts,x,y-20,'#ef896d');p.streak=0;a.combo=0;p.bombHits++;N.sfx(a,'boom');a.shake(7,.3);p.msg=q.t.bomb?'BOMB! '+pts:'DUD '+pts;p.msgT=1.2;}
 if(p.prizes.filter(z=>!z.gone).length<9)fill(a,10);
 }
function step(a,dt){const p=a.p,L=lay(a);p.t+=dt;if(p.msgT>0)p.msgT-=dt;
 const lo=L.ix+L.chuteW+14+0,hi=L.ix+L.iw-24;
 const k=a.keys,mv=(k.ArrowRight||k.d||k.D?1:0)-(k.ArrowLeft||k.a||k.A?1:0)+(a.stick.x||0);
 const prevCx=p.cx;
 if(p.st==='move'){if(mv)p.tx=p.cx+mv*400*dt*2;p.tx=N.clamp(p.tx,L.ix+40,hi);p.cx+=N.clamp(p.tx-p.cx,-330*dt,330*dt);p.clock-=dt;if(p.clock<=0)dropClaw(a);}
 else if(p.st==='drop'){p.cy+=240*dt;const tip=L.rail+30+p.cy+34;let hitp=null;for(const q of p.prizes){if(q.gone||q.held||q.fall)continue;if(Math.abs(q.x-p.cx)<q.r+26&&tip>q.y-q.r+4){hitp=q;break;}}
  if(hitp||tip>=L.floor-4){p.st='close';p.stT=0;}}
 else if(p.st==='close'){p.stT+=dt;p.open=Math.max(0,1-p.stT/.55);if(p.stT>=.55){const tip=L.rail+30+p.cy+34;let best=null,bd=1e9;for(const q of p.prizes){if(q.gone||q.held||q.fall)continue;const dx=Math.abs(q.x-p.cx),dy=Math.abs((q.y-q.r*.3)-(tip-10));if(dx<q.r*.9+14&&dy<q.r+30&&dx+dy<bd){bd=dx+dy;best=q;}}
   if(best){best.held=true;best.vx=best.vy=0;p.grab=best;p.str=p.grip*(1-Math.min(.5,Math.abs(best.x-p.cx)/(best.r*2)))*(1.1-best.t.w*.25);if(Math.abs(best.x-p.cx)<8){p.str*=1.15;p.msg='PERFECT GRAB';p.msgT=.9;}N.sfx(a,'click');}else{p.msg='MISSED';p.msgT=.8;p.streak=0;a.combo=0;}
   p.st='lift';p.stT=0;}}
 else if(p.st==='lift'){p.cy-=210*dt;if(p.grab){slip(a,dt);}if(p.cy<=0){p.cy=0;p.st='return';}}
 else if(p.st==='return'){const goal=L.ix+L.chuteW/2;p.cx+=N.clamp(goal-p.cx,-260*dt,260*dt);if(p.grab)slip(a,dt);if(Math.abs(p.cx-goal)<2){p.st='release';p.stT=0;}}
 else if(p.st==='release'){p.stT+=dt;p.open=Math.min(1,p.stT/.4);if(p.grab&&p.stT>.1){const q=p.grab;q.held=false;q.vy=40;p.grab=null;}if(p.stT>1.1){endTry(a);}}
 if(p.grab&&p.st!=='release'){const q=p.grab;q.x=p.cx+p.sway;q.y=L.rail+30+p.cy+34+q.r*.45;q.rot=p.sway*.01;}
 // sway pendulum
 const acc=(p.cx-prevCx)/Math.max(dt,1e-4);p.swayV+=(-60*p.sway-6*p.swayV-acc*.016)*dt*10;p.sway+=p.swayV*dt;p.sway=N.clamp(p.sway,-30,30);
 physics(a,dt);
}
function slip(a,dt){const p=a.p,q=p.grab;const jolt=Math.abs(p.swayV)*.002;const rate=(q.t.w*1.2*(.6+jolt*3))/Math.max(.4,p.str)*dt*.55;if(Math.random()<rate*.5){q.held=false;q.vy=60;q.vx=p.swayV*8;p.grab=null;p.msg='IT SLIPPED!';p.msgT=1;p.streak=0;a.combo=0;N.sfx(a,'miss');}}
function dropClaw(a){const p=a.p;if(p.st!=='move')return;p.st='drop';p.cy=0;N.sfx(a,'whoosh');}
function endTry(a){const p=a.p;p.tries--;p.st='move';p.open=1;p.clock=p.clockMax;if(p.tries<=0){p.over=true;p.wait=1.2;}}
function update(dt,a){const p=a.p;if(p.over){p.wait-=dt;physics(a,dt);if(p.wait<=0&&!p.fin){p.fin=true;const s=a.score;a.finish(s>=60,{grade:s>=140?'CLAW MASTER':s>=80?'GRADE A':s>=40?'GRADE B':'GRADE C'});}return;}N.stepper(h=>step(a,h),120)(dt);}
function drawPrize(ctx,q){ctx.save();ctx.translate(q.x,q.y);ctx.rotate(q.rot);const r=q.r,T=q.t;
 if(T.bomb){N.ball(ctx,0,0,r,'#3a2d45',{shadow:false});ctx.strokeStyle='#f2ce77';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,-r);ctx.quadraticCurveTo(8,-r-8,14,-r-6);ctx.stroke();N.glow(ctx,14,-r-6,10,'#ff6f91',.9);N.text(ctx,'!',0,6,{font:'700 18px Fredoka',align:'center',color:'#ef896d'});}
 else if(T.star){N.glow(ctx,0,0,r*2.2,'#ffd45e',.45);ctx.fillStyle='#ffd45e';ctx.strokeStyle='#8a5b1a';ctx.lineWidth=2;ctx.beginPath();for(let i=0;i<10;i++){const an=i*Math.PI/5-Math.PI/2,rr=i%2?r*.5:r*1.05;ctx.lineTo(Math.cos(an)*rr,Math.sin(an)*rr);}ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#fff7c0';ctx.beginPath();ctx.arc(-r*.2,-r*.2,r*.18,0,N.TAU);ctx.fill();}
 else if(T.egg){N.ball(ctx,0,0,r,q.col,{shadow:false});ctx.fillStyle='rgba(255,255,255,.7)';for(let i=0;i<5;i++){ctx.beginPath();ctx.arc(Math.cos(i*1.3)*r*.5,Math.sin(i*1.3)*r*.5,r*.14,0,N.TAU);ctx.fill();}N.text(ctx,'?',0,7,{font:'700 20px Fredoka',align:'center',color:'#fff'});}
 else if(T.box){N.slab(ctx,-r,-r*.9,r*2,r*1.8,8,q.col,{shadow:false});ctx.fillStyle='#1a1226';N.rr(ctx,-r*.6,-r*.4,r*1.2,r*.55,6);ctx.fill();ctx.fillStyle='#9de3d1';ctx.beginPath();ctx.arc(-r*.28,-r*.12,r*.14,0,N.TAU);ctx.arc(r*.28,-r*.12,r*.14,0,N.TAU);ctx.fill();ctx.strokeStyle='#684b62';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,-r*.9);ctx.lineTo(0,-r*1.2);ctx.stroke();N.ball(ctx,0,-r*1.2,3,'#ef896d',{shadow:false});}
 else{if(T.ears){ctx.fillStyle=q.col;for(const s of[-1,1]){ctx.beginPath();ctx.ellipse(s*r*.45,-r*1.05,r*.2,r*.55,s*.2,0,N.TAU);ctx.fill();ctx.strokeStyle='rgba(40,24,40,.4)';ctx.stroke();}}else{ctx.fillStyle=N.shade(q.col,-.1);for(const s of[-1,1]){ctx.beginPath();ctx.arc(s*r*.7,-r*.75,r*.3,0,N.TAU);ctx.fill();}}
  N.ball(ctx,0,0,r,q.col,{shadow:false});ctx.fillStyle='#2a1a2e';ctx.beginPath();ctx.arc(-r*.32,-r*.1,r*.1,0,N.TAU);ctx.arc(r*.32,-r*.1,r*.1,0,N.TAU);ctx.fill();ctx.fillStyle='#e08a8a';ctx.beginPath();ctx.ellipse(0,r*.2,r*.16,r*.1,0,0,N.TAU);ctx.fill();}
 ctx.restore();}
function draw(ctx,a){const p=a.p,L=lay(a),W=a.W,H=a.H;
 N.bgGrad(ctx,W,H,['#33264d','#51345f','#2a2040']);for(let i=0;i<30;i++)N.glow(ctx,(i*173)%W,(i*91)%H,2,'#ffe9b8',.25);
 N.slab(ctx,L.ix-14,L.iy-18,L.iw+28,L.ih+54,24,'#e0788f',{depth:8});
 N.text(ctx,'LUCKY CLAW',W-L.ix,L.iy-30+8,{font:'700 '+(L.por?22:28)+'px Fredoka',align:'right',color:'#fff0d4',glow:'#ff9bb5',stroke:'#7a3555',sw:4});
 // glass interior
 const g=ctx.createLinearGradient(0,L.iy,0,L.iy+L.ih);g.addColorStop(0,'#a8d8e6');g.addColorStop(1,'#d9c0e0');ctx.fillStyle=g;N.rr(ctx,L.ix,L.iy,L.iw,L.ih,14);ctx.fill();
 ctx.save();N.rr(ctx,L.ix,L.iy,L.iw,L.ih,14);ctx.clip();
 ctx.fillStyle='rgba(255,255,255,.16)';for(let i=0;i<8;i++){ctx.beginPath();ctx.moveTo(L.ix+i*L.iw/8,L.iy);ctx.lineTo(L.ix+i*L.iw/8+40,L.iy);ctx.lineTo(L.ix+i*L.iw/8-60,L.iy+L.ih);ctx.lineTo(L.ix+i*L.iw/8-100,L.iy+L.ih);ctx.fill();}
 // floor + chute
 ctx.fillStyle='#6a4a6d';ctx.fillRect(L.ix,L.floor,L.iw,L.ih);ctx.fillStyle='#120a1c';ctx.fillRect(L.ix,L.floor-4,L.chuteW,60);N.glow(ctx,L.ix+L.chuteW/2,L.floor,L.chuteW*.8,'#ffe08a',.35);N.text(ctx,'PRIZE CHUTE',L.ix+L.chuteW/2,L.floor+34,{font:'700 11px Fredoka',align:'center',color:'#ffe9b8'});
 for(const q of p.prizes)if(!q.gone)drawPrize(ctx,q);
 // rail + claw
 ctx.fillStyle='#51345f';ctx.fillRect(L.ix,L.rail-10,L.iw,10);ctx.fillStyle='#f2ce77';ctx.fillRect(L.ix,L.rail-10,L.iw,3);
 const ax=p.cx,sx=ax+p.sway*(p.cy/200+.35),ty=L.rail+30+p.cy;
 N.slab(ctx,ax-22,L.rail-16,44,22,6,'#8bb7dc',{depth:3});
 ctx.strokeStyle='#d9d4e6';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(ax,L.rail);ctx.quadraticCurveTo(ax+p.sway*.4,L.rail+(ty-L.rail)/2,sx,ty);ctx.stroke();
 // claw head and prongs
 N.slab(ctx,sx-16,ty-2,32,16,6,'#d9d4e6',{depth:2});const spread=16+p.open*20;
 for(const s of[-1,0,1]){if(s===0)continue;ctx.strokeStyle='#c8c2d8';ctx.lineWidth=7;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(sx+s*10,ty+10);ctx.quadraticCurveTo(sx+s*spread,ty+26,sx+s*(spread*.7+(1-p.open)*2),ty+50);ctx.stroke();ctx.strokeStyle='#ef896d';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(sx+s*(spread*.9),ty+36);ctx.lineTo(sx+s*(spread*.7+(1-p.open)*2),ty+50);ctx.stroke();}
 if(p.grab)drawPrize(ctx,p.grab);
 ctx.restore();
 // HUD
 N.chip(ctx,L.ix,8,110,'TRIES',p.tries,{color:'#ffe08a'});N.chip(ctx,L.ix+120,8,120,'SCORE',a.score);if(p.st==='move'&&a.running)N.bar(ctx,L.ix+250,22,L.iw-250,10,p.clock/p.clockMax,'#91c9a7');
 if(p.streak>1)N.text(ctx,'WIN STREAK ×'+(1+Math.min(2,p.streak*.25)).toFixed(2),W-L.ix,48,{align:'right',font:'700 13px Fredoka',color:'#ffe08a'});
 // drop button
 const by=L.iy+L.ih+14,bw=Math.min(240,W*.4);const dr=p.st==='move';N.slab(ctx,W/2-bw/2,by,bw,50,25,dr?'#ef896d':'#8a6a7a',{depth:6});N.text(ctx,dr?'DROP CLAW':'...',W/2,by+33,{font:'700 20px Fredoka',align:'center',color:'#fff7e6'});
 if(p.msgT>0){ctx.globalAlpha=Math.min(1,p.msgT*2);N.text(ctx,p.msg,W/2,L.iy+L.ih*.45,{font:'700 '+(L.por?30:36)+'px Fredoka',align:'center',color:'#fff0d4',stroke:'#1a1226',glow:'#ff6f91'});ctx.globalAlpha=1;}
 if(!a.running)N.banner(ctx,W,H,'LUCKY CLAW','Steer · drop · carry prizes to the chute · avoid bombs');
 N.vignette(ctx,W,H,.25);}
function pd(x,y,e,a){const p=a.p,L=lay(a);if(p.st!=='move')return;const by=L.iy+L.ih+14,bw=Math.min(240,a.W*.4);if(y>by-6&&Math.abs(x-a.W/2)<bw/2+10&&y<by+60){dropClaw(a);return;}p.tx=x;}
function pm(x,y,e,a){const p=a.p;if(e.buttons||e.pointerType==='touch'&&e.pressure>0)p.tx=x;}
function kd(e,a){if(e.key===' '||e.key==='Enter'||e.key==='ArrowDown')dropClaw(a);}
NEXUS_GAMES.register('claw',{meta:{title:'LUCKY CLAW',help:'Five tries. Line the claw above a prize, drop, and carry it to the chute. Heavy robots slip, golden stars are rare, bombs cost points. Centred grabs grip tighter. Win streaks multiply prizes.',controls:'← → or drag to move · SPACE / DROP button to grab',type:'PRIZE SKILL'},
 size:[900,520],portraitSize:[540,860],duration:0,timed:false,tier:1.3,touch:[{kind:'stick',side:'left',axis:'x'},{kind:'btn',side:'right',label:'DROP',key:' ',big:true}],init,start,update,draw,pointerdown:pd,pointermove:pm,keydown:kd});
})();

/* Comet Ring Toss: aim a wobbling reticle, lead moving pegs, three escalating stages with wind and bonus pegs. */
(function(){
const N=window.NXG,T_FLIGHT=.78,CAP=.052;
const STAGES=[
 {need:30,rings:6,pegs:[{z:.25,x:0,amp:.55,sp:.5,pts:10},{z:.5,x:0,amp:.45,sp:.7,pts:20},{z:.78,x:0,amp:.3,sp:.9,pts:40}],wind:0},
 {need:75,rings:6,pegs:[{z:.22,x:-.4,amp:.35,sp:.8,pts:10},{z:.4,x:.4,amp:.45,sp:1,pts:20},{z:.6,x:0,amp:.55,sp:1.2,pts:30},{z:.82,x:0,amp:.35,sp:1.5,pts:50}],wind:.08},
 {need:140,rings:7,pegs:[{z:.2,x:0,amp:.6,sp:1.1,pts:10},{z:.36,x:0,amp:.5,sp:1.4,pts:20},{z:.52,x:0,amp:.4,sp:1.7,pts:30},{z:.68,x:0,amp:.45,sp:2,pts:50},{z:.86,x:0,amp:.3,sp:2.4,pts:100,gold:1}],wind:.14}];
function geom(a){const W=a.W,H=a.H,por=W<H;return{W,H,cx:W/2,hw:W*(por?.5:.36),yb:H*.88,hz:H*.34,zf:por?1.1:1.3};}
function P(g,x,z,y=0){const s=1/(1+z*g.zf),yb=g.hz+(g.yb-g.hz)*s;return{x:g.cx+x*g.hw*s,y:yb-y*g.H*.55*s,s};}
function inv(g,sx,sy){const s=(sy-g.hz)/(g.yb-g.hz);if(s<=0.05)return{x:0,z:1};const z=(1/s-1)/g.zf;return{x:(sx-g.cx)/(g.hw*s),z:N.clamp(z,.05,1)};}
function pegPos(p,pg,t){return pg.x+Math.sin(t*pg.sp+pg.ph)*pg.amp;}
function init(a){const p=a.p;Object.assign(p,{stage:0,rings:0,rt:[],flying:null,aim:{x:0,z:.5},t:0,wobble:0,hold:0,holding:false,placed:[],msg:'',msgT:0,streak:0,stageScore:0,total:0,wind:0,over:false,between:0,pegs:[],charge:0});load(a,0);}
function load(a,i){const p=a.p,S=STAGES[i];p.pegs=S.pegs.map((q,k)=>({...q,ph:k*1.7+i,slow:1}));p.rings=S.rings+(a.mastery>=4?1:0);p.stageScore=0;p.placed=[];p.wind=S.wind*(a.diff.id==='hard'?1.5:a.diff.id==='easy'?0:1);p.windDir=Math.random()<.5?-1:1;p.t=0;p.msg='STAGE '+(i+1)+' · SCORE '+S.need+' TO ADVANCE';p.msgT=2.2;}
function start(a){init(a);const p=a.p;p.cap=CAP*(a.diff.id==='easy'?1.3:a.diff.id==='hard'?.85:1)*(a.mastery>=2?1.12:1);p.sway=a.diff.id==='hard'?.06:a.diff.id==='easy'?.025:.04;if(a.mastery>=6)p.sway*=.6;a.hud('AIM · HOLD STEADY TO CALM THE WOBBLE · RELEASE TO TOSS · LEAD THE PEGS');}
function throwRing(a){const p=a.p;if(p.flying||p.rings<=0||p.between>0||p.over)return;const sw=p.sway*(1-Math.min(.7,p.hold*.5));const ax=p.aim.x+(Math.sin(p.t*7.3)+Math.sin(p.t*3.1))*sw*.5,az=N.clamp(p.aim.z+Math.cos(p.t*6.1)*sw*.45+(p.wind*p.windDir)*0,.05,1);p.rings--;p.flying={t:0,sx:0,sz:-.12,tx:ax+p.wind*p.windDir*az,tz:az,spin:Math.random()*6,col:['#ef896d','#f2ce77','#8ec7a4','#8bb7dc'][p.rings%4]};p.holding=false;p.hold=0;N.sfx(a,'whoosh');}
function land(a){const p=a.p,f=p.flying;let best=null,bd=9;for(const pg of p.pegs){const px=pegPos(p,pg,p.t),d=Math.hypot((f.tx-px),(f.tz-pg.z)*.6);if(d<bd){bd=d;best=pg;best.px=px;}}
 f.done=true;f.t2=0;
 if(best&&bd<p.cap){const mult=1+Math.min(3,p.streak)*.25;const pts=Math.round(best.pts*mult);p.streak++;a.combo=p.streak;a.addScore(pts,0,0);p.stageScore+=pts;f.res='ring';f.peg=best;p.placed.push({pg:best,col:f.col,k:p.placed.filter(q=>q.pg===best).length});p.msg=(best.gold?'COMET PEG! ':'RINGER! ')+'+'+pts;p.msgT=1.2;N.sfx(a,best.pts>=40?'win':'coin');a.shake(best.pts>=40?6:2,.2);if(best.gold)a.achieve('comet','Ring the golden comet peg',10);if(p.streak===4)a.achieve('hotstreak','Four ringers in a row',8);}
 else if(best&&bd<p.cap*1.7){f.res='clack';p.streak=0;a.combo=0;p.msg='CLACK! SO CLOSE';p.msgT=1;N.sfx(a,'hit');}
 else{f.res='miss';p.streak=0;a.combo=0;p.msg='MISS';p.msgT=.8;N.sfx(a,'miss');}}
function update(dt,a){const p=a.p;if(p.over)return;p.t+=dt;if(p.msgT>0)p.msgT-=dt;
 const k=a.keys;if(k.ArrowLeft||k.a||k.A)p.aim.x=N.clamp(p.aim.x-dt*1.1,-1,1);if(k.ArrowRight||k.d||k.D)p.aim.x=N.clamp(p.aim.x+dt*1.1,-1,1);if(k.ArrowUp||k.w||k.W)p.aim.z=N.clamp(p.aim.z+dt*.6,.05,1);if(k.ArrowDown||k.s||k.S)p.aim.z=N.clamp(p.aim.z-dt*.6,.05,1);
 if(p.holding||p.kHold)p.hold=Math.min(1.5,p.hold+dt);else p.hold=Math.max(0,p.hold-dt*2);
 const f=p.flying;if(f){if(!f.done){f.t+=dt;if(f.t>=T_FLIGHT)land(a);}else{f.t2+=dt;if(f.t2>.9){p.flying=null;if(p.rings<=0)stageEnd(a);}}}
 if(p.between>0){p.between-=dt;if(p.between<=0){load(a,p.stage);}}}
function stageEnd(a){const p=a.p,S=STAGES[p.stage];if(p.stageScore>=S.need){if(p.stage>=2){a.addScore(30+p.rings*5,0,0);a.achieve('allstages','Clear all three stages',20);p.over=true;a.finish(true,{grade:a.score>=300?'RING MASTER':'CHAMPION'});return;}p.stage++;a.addScore(20,0,0);p.msg='STAGE CLEAR! +20';p.msgT=2;p.between=2.2;a.sound(800,.2,'triangle',.05);}
 else{p.over=true;a.finish(false,{grade:'STAGE '+(p.stage+1)+' FAILED'});}}
function ring(ctx,x,y,r,col,tilt=.45,alpha=1){ctx.save();ctx.globalAlpha=alpha;ctx.translate(x,y);ctx.scale(1,tilt);ctx.strokeStyle='rgba(30,16,30,.45)';ctx.lineWidth=r*.42;ctx.beginPath();ctx.arc(0,3,r,0,N.TAU);ctx.stroke();ctx.strokeStyle=col;ctx.lineWidth=r*.34;ctx.beginPath();ctx.arc(0,0,r,0,N.TAU);ctx.stroke();ctx.strokeStyle='rgba(255,255,255,.55)';ctx.lineWidth=r*.1;ctx.beginPath();ctx.arc(0,-r*.06,r,Math.PI*1.1,Math.PI*1.6);ctx.stroke();ctx.restore();}
function draw(ctx,a){const p=a.p,g=geom(a),W=g.W,H=g.H;
 N.bgGrad(ctx,W,H,['#2a2150','#4a2f63','#7a4670']);
 for(let i=0;i<34;i++)N.glow(ctx,(i*173+11)%W,(i*67)%(g.hz),2+(i%3),i%2?'#ffe9b8':'#ff9bd0',.35);
 // awning
 const aw=Math.round(W/60);for(let i=0;i<aw;i++){ctx.fillStyle=i%2?'#f8e9ca':'#ef896d';ctx.beginPath();ctx.moveTo(i*W/aw,0);ctx.lineTo((i+1)*W/aw,0);ctx.lineTo((i+1)*W/aw,H*.1);ctx.quadraticCurveTo((i+.5)*W/aw,H*.14,i*W/aw,H*.1);ctx.fill();}
 // back shelves with prizes
 ctx.fillStyle='#5b3a55';ctx.fillRect(0,g.hz-H*.2,W,H*.2);for(let i=0;i<9;i++){const x=(i+.5)*W/9;N.ball(ctx,x,g.hz-H*.1,H*.045,['#ef896d','#f2ce77','#8ec7a4','#8bb7dc','#b58bd6'][i%5],{shadow:false});}
 // floor
 const fg=ctx.createLinearGradient(0,g.hz,0,g.yb);fg.addColorStop(0,'#8a5f72');fg.addColorStop(1,'#d9a874');ctx.fillStyle=fg;ctx.fillRect(0,g.hz,W,H-g.hz);
 for(let z=0;z<1;z+=.1){const a1=P(g,-1.5,z),a2=P(g,1.5,z);ctx.strokeStyle='rgba(60,30,40,.18)';ctx.beginPath();ctx.moveTo(0,a1.y);ctx.lineTo(W,a2.y);ctx.stroke();}
 // pegs (far to near)
 const order=[...p.pegs].sort((a1,b)=>b.z-a1.z);
 for(const pg of order){const x=pegPos(p,pg,p.t),b=P(g,x,pg.z),top=P(g,x,pg.z,.32),w=Math.max(4,.032*g.hw*b.s*2);
  N.glow(ctx,b.x,b.y,34*b.s*2.2,pg.gold?'#ffd45e':'#9de3d1',.35);
  ctx.fillStyle='rgba(20,10,30,.4)';ctx.beginPath();ctx.ellipse(b.x,b.y+2,w*3,w*1.2,0,0,N.TAU);ctx.fill();
  const gr=ctx.createLinearGradient(b.x-w,0,b.x+w,0);gr.addColorStop(0,pg.gold?'#b8861b':'#c8c2d8');gr.addColorStop(.5,pg.gold?'#ffe28a':'#fff');gr.addColorStop(1,pg.gold?'#8a5b1a':'#8d86a3');ctx.fillStyle=gr;ctx.fillRect(b.x-w,top.y,w*2,b.y-top.y);
  ctx.fillStyle=pg.gold?'#ffd45e':'#ef896d';for(let s=0;s<3;s++){ctx.fillRect(b.x-w,top.y+s*(b.y-top.y)/3+2,w*2,(b.y-top.y)/7);}
  N.ball(ctx,top.x,top.y,w*1.3,pg.gold?'#ffd45e':'#f8e9ca',{shadow:false});
  N.text(ctx,pg.pts,b.x,b.y+b.s*28+10,{font:'700 '+Math.max(11,16*b.s*1.6)+'px Fredoka',align:'center',color:'#fff3d6',stroke:'#1a1226',sw:3});
  for(const q of p.placed.filter(q=>q.pg===pg))ring(ctx,top.x,top.y+(b.y-top.y)*(.55-q.k*.14),w*3.2,q.col,.5);}
 // flying ring
 const f=p.flying;if(f){const t=Math.min(1,f.t/T_FLIGHT),x=N.lerp(f.sx,f.tx,t),z=N.lerp(f.sz,f.tz,t),h=.22+Math.sin(t*Math.PI)*.55*(.7+f.tz*.4)*(1-t*.3)-(t>.9?0:0);
  const q=P(g,x,z,f.done?0:Math.max(.07,h)),sh=P(g,x,z);ctx.fillStyle='rgba(20,10,30,.35)';ctx.beginPath();ctx.ellipse(sh.x,sh.y,22*sh.s*1.8,8*sh.s*1.8,0,0,N.TAU);ctx.fill();
  if(!f.done)ring(ctx,q.x,q.y,24*q.s*1.8,f.col,.4+Math.abs(Math.sin(f.spin+t*9))*.5);
  else if(f.res!=='ring')ring(ctx,q.x+(f.res==='clack'?f.t2*60:0),q.y-(f.res==='clack'?Math.sin(f.t2*6)*14:0),24*q.s*1.8,f.col,.5,Math.max(0,1-f.t2*1.1));}
 // reticle
 if(a.running&&!p.flying&&p.rings>0&&p.between<=0){const sw=p.sway*(1-Math.min(.7,p.hold*.5));const rx=p.aim.x+Math.sin(p.t*7.3)*sw*.5,rz=p.aim.z+Math.cos(p.t*6.1)*sw*.45;const r=P(g,rx,rz),rad=g.hw*r.s*(sw*1.3+p.cap*.9);ctx.strokeStyle='#fff0b0';ctx.lineWidth=3;ctx.setLineDash([5,5]);ctx.beginPath();ctx.ellipse(r.x,r.y,rad*1.3,rad*.65,0,0,N.TAU);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle='#fff0b0';ctx.beginPath();ctx.arc(r.x,r.y,3,0,N.TAU);ctx.fill();}
 // counter + rings left
 ctx.fillStyle='#6b3f4b';ctx.fillRect(0,H-H*.1,W,H*.1);ctx.fillStyle='#d9a874';ctx.fillRect(0,H-H*.1,W,6);
 for(let i=0;i<p.rings;i++)ring(ctx,W/2-(p.rings-1)*16+i*32,H-H*.045,13,['#ef896d','#f2ce77','#8ec7a4','#8bb7dc'][i%4],.6);
 const S=STAGES[p.stage];N.chip(ctx,12,H*.13,100,'STAGE',(p.stage+1)+'/3',{color:'#ffe08a'});N.chip(ctx,122,H*.13,130,'GOAL',p.stageScore+' / '+S.need,{color:p.stageScore>=S.need?'#91c9a7':'#fff0d4'});N.chip(ctx,262,H*.13,100,'SCORE',a.score);if(p.streak>1)N.chip(ctx,372,H*.13,110,'STREAK','×'+(1+Math.min(3,p.streak)*.25).toFixed(2),{color:'#ef896d'});
 if(p.wind)N.text(ctx,'WIND '+(p.windDir>0?'→':'←')+' '+Math.round(p.wind*100),W-14,H*.13+16,{align:'right',font:'700 14px Fredoka',color:'#bfe4da'});
 if(p.msgT>0){ctx.globalAlpha=Math.min(1,p.msgT*2);N.text(ctx,p.msg,W/2,H*.5,{font:'700 '+Math.round(Math.min(W,H)*.065)+'px Fredoka',align:'center',color:'#ffe08a',stroke:'#1a1226',glow:'#ff6f91'});ctx.globalAlpha=1;}
 if(!a.running)N.banner(ctx,W,H,'COMET RING TOSS','Aim · release to throw · ring the moving pegs');
 N.vignette(ctx,W,H,.3);}
function mv(x,y,e,a){const g=geom(a),p=a.p;const q=inv(g,x,y);p.aim.x=N.clamp(q.x,-1,1);p.aim.z=N.clamp(q.z,.05,1);}
function pd(x,y,e,a){const p=a.p;mv(x,y,e,a);p.holding=true;p.hold=0;}
function pu(x,y,e,a){const p=a.p;if(!p.holding)return;mv(x,y,e,a);throwRing(a);}
function kd(e,a){if(e.key===' '||e.key==='Enter'){a.p.kHold=true;}}
function ku(e,a){if(e.key===' '||e.key==='Enter'){a.p.kHold=false;throwRing(a);}}
NEXUS_GAMES.register('ringtoss',{meta:{title:'COMET RING TOSS',help:'Three stages, each with a score goal. Press and hold to aim your reticle (holding steady calms the wobble), release to toss. Rings take time to fly, so lead the sliding pegs. Far pegs pay more; the golden comet peg pays 100.',controls:'Press, drag, release · or arrows aim, hold SPACE and release',type:'CARNIVAL SKILL'},
 size:[900,520],portraitSize:[540,860],duration:0,timed:false,tier:1.1,touch:[{kind:'stick',side:'left'},{kind:'btn',side:'right',label:'TOSS',key:' ',big:true}],init,start,update,draw,pointerdown:pd,pointermove:(x,y,e,a)=>{if(a.p.holding)mv(x,y,e,a);},pointerup:pu,keydown:kd,keyup:ku});
})();

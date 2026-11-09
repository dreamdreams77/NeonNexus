/* Moonlight Billiards: full 8-ball vs CPU (Rookie/Regular/Shark): aiming, power, english, ball-in-hand, fouls, called rules. */
(function(){
const N=window.NXG,TW=700,TH=350,BR=11,POCK=[[-6,-6,25],[TW/2,-12,22],[TW+6,-6,25],[-6,TH+6,25],[TW/2,TH+12,22],[TW+6,TH+6,25]];
const COLS=['#f2ce77','#4b78c8','#d9534f','#7a4fa8','#ef8a3d','#3f9a5f','#8a2f3a','#1a1226'];
const CPU=[{n:'ROOKIE',err:.045,pw:.18,think:1.1,spin:0},{n:'REGULAR',err:.02,pw:.1,think:.9,spin:.2},{n:'SHARK',err:.006,pw:.05,think:.7,spin:.6}];
function lay(a){const W=a.W,H=a.H,land=W>H;const s=land?Math.min((W-70)/TW,(H-120)/TH):Math.min((W-40)/TH*1,(H-200)/TW)*1;return{land,s:land?s:Math.min((W-40)/TH,(H-210)/TW),W,H};}
function S(L,u,v){if(L.land)return{x:(L.W-TW*L.s)/2+u*L.s,y:(L.H-TH*L.s)/2+8+v*L.s};return{x:(L.W-TH*L.s)/2+(TH-v)*L.s,y:(L.H-TW*L.s)/2-20+u*L.s};}
function U(L,x,y){if(L.land)return{u:(x-(L.W-TW*L.s)/2)/L.s,v:(y-(L.H-TH*L.s)/2-8)/L.s};return{u:(y-(L.H-TW*L.s)/2+20)/L.s,v:TH-(x-(L.W-TH*L.s)/2)/L.s};}
function rack(){const B=[];const order=[1,9,2,10,8,3,11,4,12,5,13,6,14,7,15];let k=0;for(let r=0;r<5;r++)for(let c=0;c<=r;c++){const num=order[k++];B.push({n:num,x:TW*.72+r*BR*1.75,y:TH/2+(c-r/2)*BR*2.05,vx:0,vy:0,r:BR,m:1,pocketed:false,fall:0});}
 B.push({n:0,x:TW*.25,y:TH/2,vx:0,vy:0,r:BR,m:1,pocketed:false,fall:0,sx:0,sy:0});return B;}
function init(a){const p=a.p;Object.assign(p,{balls:rack(),turn:'me',groups:{me:null,cpu:null},aim:0,power:.5,moving:false,hand:false,shot:null,msg:'',msgT:0,t:0,cpuWait:1,over:false,spin:{x:0,y:0},charging:false,lvl:1,pot:{me:[],cpu:[]},firstHit:null,potted:[],foul:'',hint:'',idle:0,draw:null,streak:0,breakShot:true,sinkAnim:[]});}
function start(a){init(a);const p=a.p;p.lvl=a.diff.id==='easy'?0:a.diff.id==='hard'?2:1;p.cue=p.balls[15];p.aimLock=false;p.turn='me';p.breakShot=true;p.hint='BREAK! Open table';a.hud('8-BALL vs '+CPU[p.lvl].n+' · AIM · SET POWER · SHOOT');p.msg='YOU BREAK';p.msgT=1.5;p.pTime=a.mastery>=2?1.0:0;p.guide=a.mastery>=2?1:.65;if(a.mastery>=4)p.err=.8;}
function cue(p){return p.balls[15];}
function legal(p,who,b){const g=p.groups[who];if(!g)return b.n!==8;if(g==='solid'&&b.n>=1&&b.n<=7)return true;if(g==='stripe'&&b.n>=9)return true;if(b.n===8)return remaining(p,who)===0;return false;}
function remaining(p,who){const g=p.groups[who];if(!g)return 99;return p.balls.filter(b=>!b.pocketed&&b.n>0&&b.n!==8&&((g==='solid'&&b.n<8)||(g==='stripe'&&b.n>8))).length;}
function shoot(a,ang,pw,spin){const p=a.p,c=cue(p);const v=180+pw*1500;c.vx=Math.cos(ang)*v;c.vy=Math.sin(ang)*v;c.sx=spin.x;c.sy=spin.y;c.spun=false;p.moving=true;p.shot={by:p.turn,first:null,pots:[],cushion:false,railAfter:false,cueScratch:false};p.hand=false;p.breakShot=p.breakShot&&true;N.sfx(a,'shot');a.shake(pw*3,.1);p.idle=0;}
function stepPhys(a,dt){const p=a.p;let anyMove=false;
 for(const b of p.balls){if(b.pocketed){continue;}const sp=Math.hypot(b.vx,b.vy);if(sp>0){b.x+=b.vx*dt;b.y+=b.vy*dt;const dec=70*dt+sp*.12*dt;const ns=Math.max(0,sp-dec);if(ns<6){b.vx=b.vy=0;}else{b.vx*=ns/sp;b.vy*=ns/sp;}anyMove=anyMove||ns>=6;}
  // cushions
  const lo=BR,hi=TW-BR,top=BR,bot=TH-BR;let hit=0;
  if(b.x<lo&&!inMouth(b)){b.x=lo;if(b.vx<0){b.vx*=-.78;hit=1;spinKick(b,1);}}if(b.x>hi&&!inMouth(b)){b.x=hi;if(b.vx>0){b.vx*=-.78;hit=1;spinKick(b,2);}}
  if(b.y<top&&!inMouth(b)){b.y=top;if(b.vy<0){b.vy*=-.78;hit=1;spinKick(b,3);}}if(b.y>bot&&!inMouth(b)){b.y=bot;if(b.vy>0){b.vy*=-.78;hit=1;spinKick(b,4);}}
  if(hit){if(p.shot)p.shot.cushion=true;if(p.shot&&p.shot.first)p.shot.railAfter=true;if(sp>120)N.sfx(a,'tick');}
  for(const [px,py,pr] of POCK){if(Math.hypot(b.x-px,b.y-py)<pr){pocket(a,b,px,py);break;}}}
 for(let i=0;i<p.balls.length;i++){const A=p.balls[i];if(A.pocketed)continue;for(let j=i+1;j<p.balls.length;j++){const B=p.balls[j];if(B.pocketed)continue;const dx=B.x-A.x,dy=B.y-A.y;if(dx*dx+dy*dy>(BR*2)**2)continue;
  const pre=Math.hypot(A.vx,A.vy)+Math.hypot(B.vx,B.vy);const q=N.circleCollide(A,B,.95);if(q!==false){if(q>40)N.sfx(a,'hit');const cb=A.n===0?A:B.n===0?B:null;if(cb&&p.shot&&!p.shot.first){const o=cb===A?B:A;p.shot.first=o.n;}
   if(cb&&!cb.spun&&cb.sy){cb.spun=true;const o=cb===A?B:A,nx=(o.x-cb.x),ny=(o.y-cb.y),d=Math.hypot(nx,ny)||1;const f=cb.sy*Math.max(60,Math.hypot(cb.vx,cb.vy)+q*.4)*.55;cb.vx+=nx/d*f;cb.vy+=ny/d*f;}}}}
 return anyMove;}
function inMouth(b){for(const [px,py,pr] of POCK){if(Math.hypot(b.x-px,b.y-py)<pr+8)return true;}return false;}
function spinKick(b,side){if(b.n!==0||!b.sx)return;const s=b.sx*Math.hypot(b.vx,b.vy)*.22;if(side<=2)b.vy+=s*(side===1?1:-1);else b.vx+=s*(side===3?-1:1);b.sx*=.5;}
function pocket(a,b,px,py){const p=a.p;b.pocketed=true;b.vx=b.vy=0;p.sinkAnim.push({x:b.x,y:b.y,px,py,n:b.n,t:0});N.sfx(a,'pocket');a.shake(2,.1);if(p.shot)p.shot.pots.push(b.n);}
function resolve(a){const p=a.p,sh=p.shot,who=p.turn;let foul='';const c=cue(p);const pots=sh.pots;
 const cueIn=pots.includes(0),eightIn=pots.includes(8),others=pots.filter(n=>n>0&&n!==8);
 if(cueIn)foul='SCRATCH';else if(sh.first===null)foul='NO CONTACT';else if(p.groups[who]&&!legal(p,who,{n:sh.first}))foul='WRONG BALL FIRST';else if(!p.groups[who]&&sh.first===8)foul='8-BALL FIRST';else if(!pots.length&&!sh.railAfter&&!sh.cushion)foul='NO RAIL';
 let continueTurn=false;
 if(eightIn){const ok=!foul&&p.groups[who]&&remaining(p,who)===0&&!cueIn;endGame(a,ok?who:(who==='me'?'cpu':'me'),ok?'8-BALL SUNK':'8-BALL '+(foul||'POCKETED EARLY'));return;}
 // group assignment
 if(!p.groups[who]&&!foul&&others.length){const f=others[0];p.groups[who]=f<8?'solid':'stripe';p.groups[who==='me'?'cpu':'me']=f<8?'stripe':'solid';p.msg=who==='me'?'YOU ARE '+(f<8?'SOLIDS':'STRIPES'):'CPU TAKES '+(f<8?'SOLIDS':'STRIPES');p.msgT=1.6;}
 let good=0,bad=0;for(const n of others){if(p.groups[who]&&legal(p,who,{n}))good++;else bad++;}
 if(who==='me'){if(good)a.addScore(good*10*(1+Math.min(3,p.streak)*.2),0,0);p.streak=good&&!foul?p.streak+good:0;a.combo=p.streak;if(bad)a.addScore(-4*bad,0,0);}
 p.pot[who].push(...others);
 if(foul){p.foul=foul;p.msg=(who==='me'?'FOUL · ':'CPU FOUL · ')+foul;p.msgT=1.8;if(who==='me'){a.addScore(-5,0,0);p.streak=0;a.combo=0;}N.sfx(a,'miss');p.turn=who==='me'?'cpu':'me';p.hand=true;if(cueIn){c.pocketed=false;}c.pocketed=false;c.vx=c.vy=0;if(p.turn==='cpu'){placeCpu(a);}else{c.x=TW*.25;c.y=TH/2;}}
 else if(good){continueTurn=true;p.msg=who==='me'?'NICE! SHOOT AGAIN':'CPU SHOOTS AGAIN';p.msgT=1;N.sfx(a,'coin');}
 else{p.turn=who==='me'?'cpu':'me';p.msg=(p.turn==='me'?'YOUR TURN':'CPU TURN');p.msgT=1;}
 if(cueIn&&!foul){}
 p.shot=null;p.moving=false;p.breakShot=false;p.cpuWait=CPU[p.lvl].think;p.aim=aimAtBest(p);
 if(who==='me'&&!foul&&!p.moving&&p.pot.me.length>=7&&remaining(p,'me')===0)a.achieve('clear','Clear all your balls',8);
 if(p.turn==='me'&&!p.hand){/* keep aim */}}
function endGame(a,winner,why){const p=a.p;if(p.over)return;p.over=true;const win=winner==='me';if(win){a.addScore(120+(p.lvl*30)+Math.max(0,7-p.pot.cpu.length)*6,0,0);a.achieve('win','Win a game of 8-ball',10);if(p.lvl===2)a.achieve('shark','Beat the Shark',15);if(p.pot.cpu.length===0)a.achieve('shutout','Win without the CPU potting a ball',12);}p.msg=why;p.msgT=3;N.sfx(a,win?'win':'lose');a.finish(win,{grade:(win?'WON · ':'LOST · ')+why});}
function placeCpu(a){const p=a.p,c=cue(p);c.x=TW*.25;c.y=TH/2;for(let i=0;i<40;i++){if(!p.balls.some(b=>!b.pocketed&&b!==c&&Math.hypot(b.x-c.x,b.y-c.y)<BR*2.2))break;c.x+=14;}p.hand=false;}
function aimAtBest(p){const c=cue(p);const t=p.balls.find(b=>!b.pocketed&&b.n>0&&legal(p,p.turn,b));if(!t)return 0;return Math.atan2(t.y-c.y,t.x-c.x);}
function pathClear(p,x1,y1,x2,y2,ignore){const dx=x2-x1,dy=y2-y1,l2=dx*dx+dy*dy||1;for(const b of p.balls){if(b.pocketed||ignore.includes(b))continue;const t=N.clamp(((b.x-x1)*dx+(b.y-y1)*dy)/l2,0,1);const px=x1+dx*t,py=y1+dy*t;if(Math.hypot(b.x-px,b.y-py)<BR*2-1)return false;}return true;}
function cpuShot(a){const p=a.p,c=cue(p),L=CPU[p.lvl];let best=null,bs=-1e9;
 const cands=p.balls.filter(b=>!b.pocketed&&b.n>0&&legal(p,'cpu',b));
 for(const b of cands)for(const [px,py] of POCK){const tx=Math.max(BR,Math.min(TW-BR,px)),ty=Math.max(BR,Math.min(TH-BR,py));const dx=tx-b.x,dy=ty-b.y,d=Math.hypot(dx,dy)||1;const gx=b.x-dx/d*BR*2,gy=b.y-dy/d*BR*2;const ca=Math.atan2(gy-c.y,gx-c.x),ba=Math.atan2(dy,dx);let cut=Math.abs(ba-ca);while(cut>Math.PI)cut=Math.abs(cut-2*Math.PI);if(cut>1.25)continue;
  if(!pathClear(p,c.x,c.y,gx,gy,[c,b]))continue;if(!pathClear(p,b.x,b.y,tx,ty,[b,c]))continue;const sc=-cut*80-Math.hypot(gx-c.x,gy-c.y)*.05-d*.04;if(sc>bs){bs=sc;best={ang:ca,dist:Math.hypot(gx-c.x,gy-c.y)+d,b,cut};}}
 let ang,pw,spin={x:0,y:0};
 if(best){ang=best.ang;pw=N.clamp(.22+best.dist/900*.9+best.cut*.1,.2,.9);if(L.spin&&Math.random()<L.spin){spin.y=Math.random()<.5?.5:-.5;}}
 else{const b=cands[0]||p.balls.find(z=>!z.pocketed&&z.n>0);ang=Math.atan2(b.y-c.y,b.x-c.x);pw=.35;}
 if(p.breakShot){ang=Math.atan2(TH/2-c.y,TW*.72-c.x);pw=.95;}
 ang+=(Math.random()-.5)*2*L.err;pw=N.clamp(pw+(Math.random()-.5)*2*L.pw,.15,1);return{ang,pw,spin};}
function update(dt,a){const p=a.p;if(p.over)return;p.t+=dt;if(p.msgT>0)p.msgT-=dt;
 for(const s of p.sinkAnim)s.t+=dt;p.sinkAnim=p.sinkAnim.filter(s=>s.t<.5);
 if(p.moving){N.stepper(h=>{if(!stepPhys(a,h)){}},240)(dt);if(p.balls.every(b=>b.pocketed||(b.vx===0&&b.vy===0))&&p.moving&&p.shot){resolve(a);}return;}
 // keyboard
 const k=a.keys,sh=k.Shift?.25:1;if(p.turn==='me'&&!p.hand){if(k.ArrowLeft||k.a||k.A)p.aim-=dt*1.2*sh;if(k.ArrowRight||k.d||k.D)p.aim+=dt*1.2*sh;if(k.ArrowUp||k.w||k.W)p.power=N.clamp(p.power+dt*.7,.05,1);if(k.ArrowDown||k.s||k.S)p.power=N.clamp(p.power-dt*.7,.05,1);if(k['1'])p.spin={x:0,y:0};if(k['2'])p.spin={x:0,y:.7};if(k['3'])p.spin={x:0,y:-.7};if(k['4'])p.spin={x:-.7,y:0};if(k['5'])p.spin={x:.7,y:0};}
 if(p.turn==='me'){p.idle+=dt;if(p.idle>75){p.idle=0;p.msg='TURN TIMEOUT';p.msgT=1;shoot(a,p.aim,.2,{x:0,y:0});}}
 if(p.turn==='cpu'&&!p.hand){p.cpuWait-=dt;if(p.cpuWait<=0&&!p.over){const s=cpuShot(a);shoot(a,s.ang,s.pw,s.spin);}}
}
function ballArt(ctx,x,y,r,b){const col=b.n===0?'#f8f1de':b.n===8?COLS[7]:COLS[(b.n-1)%8];
 ctx.fillStyle='rgba(8,20,16,.4)';ctx.beginPath();ctx.ellipse(x+r*.25,y+r*.35,r*.95,r*.8,0,0,N.TAU);ctx.fill();
 const g=ctx.createRadialGradient(x-r*.35,y-r*.4,r*.1,x,y,r*1.05);g.addColorStop(0,'#fff');g.addColorStop(.35,b.n>8?'#f8f1de':col);g.addColorStop(1,N.shade(b.n>8?'#f0e6d0':col,-.45));
 ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,N.TAU);ctx.fill();
 if(b.n>8){ctx.save();ctx.beginPath();ctx.arc(x,y,r,0,N.TAU);ctx.clip();ctx.fillStyle=col;ctx.fillRect(x-r,y-r*.52,r*2,r*1.04);const gg=ctx.createRadialGradient(x-r*.35,y-r*.4,r*.1,x,y,r*1.05);gg.addColorStop(0,'rgba(255,255,255,.7)');gg.addColorStop(.5,'rgba(255,255,255,0)');gg.addColorStop(1,'rgba(0,0,0,.35)');ctx.fillStyle=gg;ctx.fillRect(x-r,y-r,r*2,r*2);ctx.restore();}
 if(b.n>0){ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(x,y,r*.42,0,N.TAU);ctx.fill();ctx.fillStyle='#1a1226';ctx.font='700 '+Math.max(7,r*.62)+'px Fredoka';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(b.n,x,y+.5);ctx.textBaseline='alphabetic';}
 ctx.fillStyle='rgba(255,255,255,.75)';ctx.beginPath();ctx.ellipse(x-r*.35,y-r*.42,r*.22,r*.13,-.6,0,N.TAU);ctx.fill();}
function predict(p,ang){const c=cue(p);let x=c.x,y=c.y;const dx=Math.cos(ang),dy=Math.sin(ang);let hitB=null,td=1e9;for(const b of p.balls){if(b.pocketed||b===c)continue;const fx=b.x-x,fy=b.y-y,pr=fx*dx+fy*dy;if(pr<=0)continue;const d2=fx*fx+fy*fy-pr*pr;if(d2>(BR*2)**2)continue;const t=pr-Math.sqrt((BR*2)**2-d2);if(t<td){td=t;hitB=b;}}
 // wall distance
 let tw=1e9;if(dx>0)tw=Math.min(tw,(TW-BR-x)/dx);if(dx<0)tw=Math.min(tw,(BR-x)/dx);if(dy>0)tw=Math.min(tw,(TH-BR-y)/dy);if(dy<0)tw=Math.min(tw,(BR-y)/dy);
 const t=Math.min(td,tw);return{gx:x+dx*t,gy:y+dy*t,hit:td<tw?hitB:null,t};}
function draw(ctx,a){const p=a.p,L=lay(a),W=a.W,H=a.H;
 N.bgGrad(ctx,W,H,['#150f26','#241a3c','#1a1330']);
 const A=S(L,0,0),B=S(L,TW,TH),x0=Math.min(A.x,B.x),y0=Math.min(A.y,B.y),w=Math.abs(B.x-A.x),h=Math.abs(B.y-A.y),rail=26*L.s;
 // pool lamp glow
 N.glow(ctx,W/2,H/2,Math.max(W,H)*.6,'#ffe9b8',.14);
 // rails
 N.slab(ctx,x0-rail,y0-rail,w+rail*2,h+rail*2,22,'#6b3f33',{depth:10});
 const fg=ctx.createRadialGradient(W/2,H/2,20,W/2,H/2,Math.max(w,h)*.7);fg.addColorStop(0,'#4f9a76');fg.addColorStop(1,'#2e6b52');ctx.fillStyle=fg;N.rr(ctx,x0,y0,w,h,6);ctx.fill();
 ctx.fillStyle='rgba(255,255,255,.04)';for(let i=0;i<w;i+=7)for(let j=0;j<h;j+=7){if(((i*13+j*7)%5)===0)ctx.fillRect(x0+i,y0+j,2,2);}
 // diamonds
 ctx.fillStyle='#f2ce77';for(let i=1;i<8;i++){const u=TW*i/8;for(const v of[-13,TH+13]){const q=S(L,u,v);ctx.beginPath();ctx.arc(q.x,q.y,2.6,0,N.TAU);ctx.fill();}}for(let i=1;i<4;i++){const v=TH*i/4;for(const u of[-13,TW+13]){const q=S(L,u,v);ctx.beginPath();ctx.arc(q.x,q.y,2.6,0,N.TAU);ctx.fill();}}
 // head string + spot
 {const q1=S(L,TW*.25,0),q2=S(L,TW*.25,TH);ctx.strokeStyle='rgba(255,255,255,.14)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(q1.x,q1.y);ctx.lineTo(q2.x,q2.y);ctx.stroke();}
 // pockets
 for(const [px,py,pr] of POCK){const q=S(L,px,py);const r=pr*L.s*.9;ctx.fillStyle='#0a0612';ctx.beginPath();ctx.arc(q.x,q.y,r,0,N.TAU);ctx.fill();ctx.strokeStyle='#2b1a22';ctx.lineWidth=5*L.s;ctx.stroke();}
 // balls
 for(const b of p.balls){if(b.pocketed)continue;const q=S(L,b.x,b.y);ballArt(ctx,q.x,q.y,BR*L.s,b);}
 for(const s of p.sinkAnim){const q=S(L,s.px,s.py),t=s.t/.5;ctx.globalAlpha=1-t;ballArt(ctx,q.x,q.y,BR*L.s*(1-t*.6),{n:s.n});ctx.globalAlpha=1;}
 // aim
 const c=cue(p);if(!p.moving&&p.turn==='me'&&!p.over&&!p.hand&&a.running){const pr=predict(p,p.aim),cq=S(L,c.x,c.y),gq=S(L,pr.gx,pr.gy);
  ctx.save();ctx.setLineDash([8,7]);ctx.strokeStyle='rgba(255,255,255,'+(.4+p.guide*.3)+')';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(cq.x,cq.y);ctx.lineTo(gq.x,gq.y);ctx.stroke();ctx.setLineDash([]);ctx.strokeStyle='rgba(255,255,255,.7)';ctx.beginPath();ctx.arc(gq.x,gq.y,BR*L.s,0,N.TAU);ctx.stroke();
  if(pr.hit){const dx=pr.hit.x-pr.gx,dy=pr.hit.y-pr.gy,d=Math.hypot(dx,dy)||1;const q1=S(L,pr.hit.x,pr.hit.y),q2=S(L,pr.hit.x+dx/d*(60+p.guide*50),pr.hit.y+dy/d*(60+p.guide*50));ctx.strokeStyle='#ffe08a';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(q1.x,q1.y);ctx.lineTo(q2.x,q2.y);ctx.stroke();}ctx.restore();
  // cue stick
  const back=14+p.power*70+(p.pullAnim||0),ang=p.aim;const bx=cq.x-Math.cos(ang)*(BR*L.s+back*L.s*.8),by=cq.y-Math.sin(ang)*(BR*L.s+back*L.s*.8);const len=240*L.s;ctx.save();ctx.translate(bx,by);ctx.rotate(ang);const gr=ctx.createLinearGradient(-len,0,0,0);gr.addColorStop(0,'#3b2a2a');gr.addColorStop(.35,'#d9a874');gr.addColorStop(1,'#f8e9ca');ctx.fillStyle=gr;ctx.beginPath();ctx.moveTo(-len,-4);ctx.lineTo(0,-2);ctx.lineTo(0,2);ctx.lineTo(-len,5);ctx.fill();ctx.fillStyle='#8bb7dc';ctx.fillRect(-6,-2,6,4);ctx.restore();}
 if(p.hand&&p.turn==='me'&&a.running){const q=S(L,c.x,c.y);ctx.setLineDash([6,6]);ctx.strokeStyle='#ffe08a';ctx.lineWidth=2;ctx.beginPath();ctx.arc(q.x,q.y,BR*L.s+8,0,N.TAU);ctx.stroke();ctx.setLineDash([]);N.text(ctx,'BALL IN HAND · TAP TO PLACE',W/2,y0-rail-8,{align:'center',font:'700 13px Fredoka',color:'#ffe08a'});}
 // HUD: groups & trays
 const g=p.groups;const cpuN=CPU[p.lvl||0].n;
 N.chip(ctx,12,8,142,'YOU '+(g.me?g.me.toUpperCase()+'S':'OPEN'),(p.pot.me.length)+' POTTED',{color:p.turn==='me'?'#ffe08a':'#fff0d4'});N.chip(ctx,164,8,150,cpuN+' '+(g.cpu?g.cpu.toUpperCase()+'S':''),(p.pot.cpu.length)+' POTTED',{color:p.turn==='cpu'?'#ef896d':'#fff0d4'});
 for(let i=0;i<p.pot.me.length;i++){const n=p.pot.me[i];ballArt(ctx,24+i*20,60,8,{n});}for(let i=0;i<p.pot.cpu.length;i++){const n=p.pot.cpu[i];ballArt(ctx,174+i*20,60,8,{n});}
 // power meter + spin selector (bottom)
 const by=H-34;N.text(ctx,'POWER',22,by-12,{font:'700 10px Fredoka',color:'#bfe4da'});N.bar(ctx,22,by-4,W*.38,14,p.power,p.power>.8?'#ef896d':p.power>.5?'#f2ce77':'#91c9a7');
 const sx=W-70,sy=H-40;ctx.fillStyle='#f8f1de';ctx.beginPath();ctx.arc(sx,sy,24,0,N.TAU);ctx.fill();ctx.strokeStyle='#684b62';ctx.lineWidth=3;ctx.stroke();ctx.fillStyle='#d9534f';ctx.beginPath();ctx.arc(sx+p.spin.x*18,sy-p.spin.y*18,5,0,N.TAU);ctx.fill();N.text(ctx,'SPIN',sx,sy-30,{align:'center',font:'700 10px Fredoka',color:'#bfe4da'});
 // shoot button
 const bw=Math.min(160,W*.26);if(p.turn==='me'&&!p.moving&&!p.hand){N.slab(ctx,W/2-bw/2+20,by-14,bw,38,19,'#ef896d',{depth:5});N.text(ctx,'SHOOT',W/2+20,by+11,{align:'center',font:'700 18px Fredoka',color:'#fff7e6'});}
 else N.text(ctx,p.turn==='cpu'?cpuN+' IS PLAYING…':p.moving?'':'',W/2+20,by+10,{align:'center',font:'700 14px Fredoka',color:'#bfe4da'});
 if(p.msgT>0){ctx.globalAlpha=Math.min(1,p.msgT*2);N.text(ctx,p.msg,W/2,H*.5,{font:'700 '+Math.round(Math.min(W,H)*.07)+'px Fredoka',align:'center',color:p.foul&&p.msg.includes('FOUL')?'#ef896d':'#ffe08a',stroke:'#1a1226',glow:'#ff6f91'});ctx.globalAlpha=1;}
 if(!a.running)N.banner(ctx,W,H,'MOONLIGHT BILLIARDS','8-ball vs the house · aim, set power, shoot');
 N.vignette(ctx,W,H,.35);}
function ptr(x,y,e,a,down){const p=a.p,L=lay(a);if(p.over||p.moving||p.turn!=='me')return;const W=a.W,H=a.H;
 const sx=W-70,sy=H-40;if(Math.hypot(x-sx,y-sy)<30){p.spin={x:N.clamp((x-sx)/18,-1,1),y:N.clamp(-(y-sy)/18,-1,1)};return;}
 const by=H-34,bw=Math.min(160,W*.26);
 if(down&&y>by-20&&y<by+30){if(x>22&&x<22+W*.38){p.power=N.clamp((x-22)/(W*.38),.05,1);p.drag='pw';return;}if(!p.hand&&Math.abs(x-(W/2+20))<bw/2){shootNow(a);return;}}
 if(p.drag==='pw'&&!down){p.power=N.clamp((x-22)/(W*.38),.05,1);return;}
 const q=U(L,x,y);if(p.hand){if(down){const c=cue(p);const nx=N.clamp(q.u,BR,TW*.25*0+TW-BR),ny=N.clamp(q.v,BR,TH-BR);if(!p.balls.some(b=>!b.pocketed&&b!==c&&Math.hypot(b.x-nx,b.y-ny)<BR*2)){c.x=nx;c.y=ny;p.hand=false;p.aim=aimAtBest(p);}}return;}
 const c=cue(p);p.aim=Math.atan2(q.v-c.y,q.u-c.x);p.idle=0;}
function shootNow(a){const p=a.p;if(p.moving||p.turn!=='me'||p.hand||p.over)return;shoot(a,p.aim,p.power,p.spin);}
function pd(x,y,e,a){a.p.drag=null;ptr(x,y,e,a,true);}
function pm(x,y,e,a){const p=a.p;if(p.drag==='pw'){ptr(x,y,e,a,false);return;}if(e.buttons||e.pointerType==='mouse'||e.pointerType==='touch')ptr(x,y,e,a,false);}
function pu(x,y,e,a){a.p.drag=null;}
function kd(e,a){if(e.key===' '||e.key==='Enter')shootNow(a);}
NEXUS_GAMES.register('billiards',{meta:{title:'MOONLIGHT BILLIARDS',help:'Full 8-ball against the house. Point the cue, set power, tap the cue-ball spin dial for follow, draw or side spin, then shoot. Pot your group, avoid fouls, sink the 8-ball last. Rookie, Regular and Shark opponents.',controls:'Move/drag to aim · power bar · SHOOT / SPACE · ←→ aim (Shift = fine) ↑↓ power · 1-5 spin',type:'CPU POOL'},
 size:[900,520],portraitSize:[540,860],duration:0,timed:false,tier:1.35,init,start,update,draw,pointerdown:pd,pointermove:pm,pointerup:pu,keydown:kd});
})();

/* Moonlight Billiards: full 8-ball vs CPU (Rookie/Regular/Shark): aiming, power, english, ball-in-hand, fouls, called rules. */
(function(){
const N=window.NXG,TW=700,TH=350,BR=11,POCK=[[-6,-6,25],[TW/2,-12,22],[TW+6,-6,25],[-6,TH+6,25],[TW/2,TH+12,22],[TW+6,TH+6,25]];
const COLS=['#f2ce77','#4b78c8','#d9534f','#7a4fa8','#ef8a3d','#3f9a5f','#8a2f3a','#1a1226'];
const CPU=[{n:'ROOKIE',err:.045,pw:.18,think:1.1,spin:0},{n:'REGULAR',err:.02,pw:.1,think:.9,spin:.2},{n:'SHARK',err:.006,pw:.05,think:.7,spin:.6}];
function lay(a){const W=a.W,H=a.H,land=W>H;const s=land?Math.min((W-110)/(TW+52),(H-118)/(TH+52))*.94:Math.min((W-40)/TH*1,(H-200)/TW)*1;return{land,s:land?s:Math.min((W-40)/TH,(H-210)/TW),W,H};}
function S(L,u,v){if(L.land)return{x:(L.W-TW*L.s)/2+u*L.s,y:54+26*L.s+v*L.s};return{x:(L.W-TH*L.s)/2+(TH-v)*L.s,y:(L.H-TW*L.s)/2-20+u*L.s};}
function U(L,x,y){if(L.land)return{u:(x-(L.W-TW*L.s)/2)/L.s,v:(y-54-26*L.s)/L.s};return{u:(y-(L.H-TW*L.s)/2+20)/L.s,v:TH-(x-(L.W-TH*L.s)/2)/L.s};}
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
function predict(p,ang){const c=cue(p);let x=c.x,y=c.y;const dx=Math.cos(ang),dy=Math.sin(ang);let hitB=null,td=1e9;for(const b of p.balls){if(b.pocketed||b===c)continue;const fx=b.x-x,fy=b.y-y,pr=fx*dx+fy*dy;if(pr<=0)continue;const d2=fx*fx+fy*fy-pr*pr;if(d2>(BR*2)**2)continue;const t=pr-Math.sqrt((BR*2)**2-d2);if(t<td){td=t;hitB=b;}}
 // wall distance
 let tw=1e9;if(dx>0)tw=Math.min(tw,(TW-BR-x)/dx);if(dx<0)tw=Math.min(tw,(BR-x)/dx);if(dy>0)tw=Math.min(tw,(TH-BR-y)/dy);if(dy<0)tw=Math.min(tw,(BR-y)/dy);
 const t=Math.min(td,tw);return{gx:x+dx*t,gy:y+dy*t,hit:td<tw?hitB:null,t};}
/* ---------- art: baked moonlit pool hall, clay balls, leather pockets (draw-only) ---------- */
const INK=N.INK,TAU=N.TAU,sh=N.shade;
const SPR={};
function spr(key,w,h,fn){let c=SPR[key];if(!c){c=document.createElement('canvas');c.width=Math.ceil(w);c.height=Math.ceil(h);fn(c.getContext('2d'),c.width,c.height);SPR[key]=c;}return c;}
function claySlab(c,x,y,w,h,r,col,lw=2){const g=c.createLinearGradient(0,y,0,y+h);g.addColorStop(0,sh(col,.32));g.addColorStop(.5,col);g.addColorStop(1,sh(col,-.4));c.fillStyle=g;N.rr(c,x,y,w,h,r);c.fill();c.strokeStyle=INK;c.lineWidth=lw;c.stroke();c.strokeStyle='rgba(255,246,222,.5)';c.lineWidth=Math.max(1,Math.min(3,h*.07));c.lineCap='round';c.beginPath();c.moveTo(x+r,y+Math.min(h*.14,5));c.lineTo(x+w-r,y+Math.min(h*.14,5));c.stroke();}
function ballSpr(n,r,shadow){r=Math.round(r*2)/2;const P=4;return spr('bl'+n+'_'+r+(shadow?'s':''),r*2+P*2+2,r*2+P*2+2,(c,w)=>{const x=w/2,y=w/2;
  if(shadow){c.fillStyle='rgba(6,16,12,.45)';c.beginPath();c.ellipse(x+r*.22,y+r*.36,r*.98,r*.84,0,0,TAU);c.fill();}
  const col=n===0?'#f8f1de':n===8?COLS[7]:COLS[(n-1)%8],base=n>8||n===0?'#f6ecd4':col;
  const g=c.createRadialGradient(x-r*.36,y-r*.42,r*.08,x,y,r*1.05);g.addColorStop(0,sh(base,.55));g.addColorStop(.5,base);g.addColorStop(1,sh(base,-.5));c.fillStyle=g;c.beginPath();c.arc(x,y,r,0,TAU);c.fill();
  if(n>8){c.save();c.beginPath();c.arc(x,y,r,0,TAU);c.clip();const bg=c.createLinearGradient(x-r,y-r,x+r,y+r);bg.addColorStop(0,sh(col,.35));bg.addColorStop(.5,col);bg.addColorStop(1,sh(col,-.5));c.fillStyle=bg;c.fillRect(x-r,y-r*.54,r*2,r*1.08);c.strokeStyle='rgba(42,26,44,.6)';c.lineWidth=1.2;c.strokeRect(x-r,y-r*.54,r*2,r*1.08);c.restore();}
  if(n>0){c.fillStyle='#fff8e6';c.beginPath();c.arc(x,y,r*.45,0,TAU);c.fill();c.strokeStyle='rgba(42,26,44,.5)';c.lineWidth=1;c.stroke();c.fillStyle=INK;c.font='700 '+Math.max(7,r*.68)+'px Fredoka, system-ui';c.textAlign='center';c.textBaseline='middle';c.fillText(n,x,y+.5);}
  c.strokeStyle=INK;c.lineWidth=Math.max(1.3,r*.09);c.beginPath();c.arc(x,y,r,0,TAU);c.stroke();
  c.strokeStyle='rgba(255,252,238,.8)';c.lineWidth=Math.max(1.2,r*.12);c.lineCap='round';c.beginPath();c.arc(x,y,r*.74,3.5,4.4);c.stroke();});}
function drawBall(ctx,x,y,r,n,sc){const s=ballSpr(n,r,true);if(sc&&sc!==1){ctx.save();ctx.translate(x,y);ctx.scale(sc,sc);ctx.drawImage(s,-s.width/2,-s.height/2);ctx.restore();}else ctx.drawImage(s,x-s.width/2,y-s.height/2);}
function bakeHall(c,L){
 const W=L.W,H=L.H,R=N.mulberry(23);
 N.bgGrad(c,W,H,['#150f26','#281c40','#1b1330']);
 // back wall wainscot + moonlit window
 const wy=H*.16;c.fillStyle='#2c2040';c.fillRect(0,0,W,wy+30);for(let x=0;x<W;x+=46){c.fillStyle='rgba(255,224,170,.05)';c.fillRect(x,0,22,wy+30);}
 c.fillStyle='#4a2c3a';c.fillRect(0,wy+30,W,H);for(let x=0;x<W+40;x+=40){c.strokeStyle='rgba(42,26,44,.5)';c.lineWidth=2;c.beginPath();c.moveTo(x,wy+34);c.lineTo(x-14,H);c.stroke();}
 c.fillStyle=INK;c.fillRect(0,wy+26,W,8);c.strokeStyle='#e4b672';c.lineWidth=3;c.beginPath();c.moveTo(0,wy+24);c.lineTo(W,wy+24);c.stroke();
 const wx=L.land?W*.86:W*.8,ww=L.land?96:80,wh=L.land?74:64;claySlab(c,wx-ww/2-6,6,ww+12,wh+12,12,'#7a4d32',2.4);c.fillStyle='#1c2a5a';N.rr(c,wx-ww/2,12,ww,wh,8);c.fill();c.save();N.rr(c,wx-ww/2,12,ww,wh,8);c.clip();for(let i=0;i<10;i++){c.fillStyle='rgba(255,246,222,.8)';c.beginPath();c.arc(wx-ww/2+R()*ww,12+R()*wh,.8+R()*.9,0,TAU);c.fill();}
 const mg=c.createRadialGradient(wx-6,32,2,wx,36,17);mg.addColorStop(0,'#fffbe8');mg.addColorStop(1,'#f2ce77');c.fillStyle=mg;c.beginPath();c.arc(wx,36,17,0,TAU);c.fill();c.strokeStyle=INK;c.lineWidth=1.5;c.stroke();c.restore();
 c.strokeStyle=INK;c.lineWidth=2;N.rr(c,wx-ww/2,12,ww,wh,8);c.stroke();c.beginPath();c.moveTo(wx,12);c.lineTo(wx,12+wh);c.moveTo(wx-ww/2,12+wh/2);c.lineTo(wx+ww/2,12+wh/2);c.stroke();
 // framed paintings left
 for(let i=0;i<(L.land?2:0);i++){const fx=L.land?W*.08+i*96:W*.1,fw=70,fh=52;claySlab(c,fx,10,fw,fh+8,6,'#b8863a',2);c.fillStyle=i?'#5f4a8a':'#3d7a6a';c.fillRect(fx+7,17,fw-14,fh-6);c.fillStyle=i?'#f2ce77':'#f8e9ca';c.beginPath();c.arc(fx+fw*.65,32,7,0,TAU);c.fill();c.fillStyle='rgba(20,10,30,.35)';c.beginPath();c.moveTo(fx+7,fh+11);c.lineTo(fx+fw*.4,34);c.lineTo(fx+fw-7,fh+11);c.fill();}
 // floor
 const fy=H*.88;
 // table
 const s=L.s,A=S(L,0,0),B=S(L,TW,TH),x0=Math.min(A.x,B.x),y0=Math.min(A.y,B.y),w=Math.abs(B.x-A.x),h=Math.abs(B.y-A.y),rail=26*s;
 // lamp light pool on wall/floor
 const lp=c.createRadialGradient(W/2,H/2,10,W/2,H/2,Math.max(W,H)*.62);lp.addColorStop(0,'rgba(255,226,170,.26)');lp.addColorStop(1,'rgba(255,226,170,0)');c.fillStyle=lp;c.fillRect(0,0,W,H);
 c.fillStyle='rgba(6,4,12,.5)';N.rr(c,x0-rail+4,y0-rail+14,w+rail*2,h+rail*2,26);c.fill();
 // legs hint
 for(const [lx,ly] of[[x0-rail+6,y0+h+rail-6],[x0+w+rail-30,y0+h+rail-6]]){}
 // wooden rail with grain
 const rg=c.createLinearGradient(0,y0-rail,0,y0+h+rail);rg.addColorStop(0,'#a8643e');rg.addColorStop(.5,'#7a4429');rg.addColorStop(1,'#4b2a1e');c.fillStyle=rg;N.rr(c,x0-rail,y0-rail,w+rail*2,h+rail*2,24);c.fill();c.strokeStyle=INK;c.lineWidth=3;c.stroke();
 c.save();N.rr(c,x0-rail,y0-rail,w+rail*2,h+rail*2,24);c.clip();c.lineWidth=1.2;for(let i=0;i<46;i++){c.strokeStyle='rgba(30,12,10,'+(.15+R()*.2)+')';c.beginPath();const yy=y0-rail+R()*(h+rail*2);c.moveTo(x0-rail,yy);c.bezierCurveTo(x0,yy+R()*6-3,x0+w,yy+R()*6-3,x0+w+rail,yy+R()*4-2);c.stroke();}c.restore();
 c.strokeStyle='rgba(255,226,190,.55)';c.lineWidth=3;c.lineCap='round';c.beginPath();c.moveTo(x0-rail+22,y0-rail+4);c.lineTo(x0+w+rail-22,y0-rail+4);c.stroke();
 // cushion bevel
 c.fillStyle='#1f5a45';N.rr(c,x0-7,y0-7,w+14,h+14,10);c.fill();c.strokeStyle=INK;c.lineWidth=2;c.stroke();
 // felt
 const fg=c.createRadialGradient(W/2,H/2,20,W/2,H/2,Math.max(w,h)*.68);fg.addColorStop(0,'#58b08a');fg.addColorStop(.6,'#3f8f6b');fg.addColorStop(1,'#276a50');c.fillStyle=fg;N.rr(c,x0,y0,w,h,5);c.fill();
 c.save();N.rr(c,x0,y0,w,h,5);c.clip();
 for(let i=0;i<2600;i++){c.fillStyle=R()>.5?'rgba(210,255,225,.09)':'rgba(10,40,30,.14)';c.fillRect(x0+R()*w,y0+R()*h,1,1+R()*2);}
 c.strokeStyle='rgba(10,50,36,.12)';c.lineWidth=1;for(let i=-h;i<w;i+=5){c.beginPath();c.moveTo(x0+i,y0);c.lineTo(x0+i+h,y0+h);c.stroke();}
 // cushion inner shadow
 c.strokeStyle='rgba(8,36,26,.5)';c.lineWidth=10;N.rr(c,x0-3,y0-3,w+6,h+6,8);c.stroke();
 // head string + spot
 const q1=S(L,TW*.25,0),q2=S(L,TW*.25,TH);c.strokeStyle='rgba(255,255,255,.2)';c.lineWidth=2;c.beginPath();c.moveTo(q1.x,q1.y);c.lineTo(q2.x,q2.y);c.stroke();
 for(const u of[TW*.25,TW*.72]){const q=S(L,u,TH/2);c.fillStyle='rgba(255,255,255,.35)';c.beginPath();c.arc(q.x,q.y,3,0,TAU);c.fill();}
 c.restore();
 // pearl diamonds
 for(let i=1;i<8;i++){const u=TW*i/8;for(const v of[-13,TH+13]){const q=S(L,u,v);pearl(c,q.x,q.y,s*4);}}for(let i=1;i<4;i++){const v=TH*i/4;for(const u of[-13,TW+13]){const q=S(L,u,v);pearl(c,q.x,q.y,s*4);}}
 // leather pockets
 for(const [px,py,pr] of POCK){const q=S(L,px,py),r=pr*s*.92;
  c.fillStyle='#3a2018';c.beginPath();c.arc(q.x,q.y,r+7*s,0,TAU);c.fill();c.strokeStyle=INK;c.lineWidth=2.5;c.stroke();
  const lg=c.createRadialGradient(q.x-r*.3,q.y-r*.3,r*.2,q.x,q.y,r+7*s);lg.addColorStop(0,'#8a5a3a');lg.addColorStop(1,'#4a2a1c');c.fillStyle=lg;c.beginPath();c.arc(q.x,q.y,r+4*s,0,TAU);c.fill();
  c.setLineDash([3,4]);c.strokeStyle='rgba(248,226,190,.6)';c.lineWidth=1.3;c.beginPath();c.arc(q.x,q.y,r+5.5*s,0,TAU);c.stroke();c.setLineDash([]);
  const hg=c.createRadialGradient(q.x,q.y,1,q.x,q.y,r);hg.addColorStop(0,'#000');hg.addColorStop(.8,'#0a0612');hg.addColorStop(1,'#241418');c.fillStyle=hg;c.beginPath();c.arc(q.x,q.y,r,0,TAU);c.fill();c.strokeStyle=INK;c.lineWidth=2;c.stroke();
  c.strokeStyle='rgba(255,226,190,.4)';c.lineWidth=2;c.lineCap='round';c.beginPath();c.arc(q.x,q.y,r+6*s,3.5,4.6);c.stroke();}
 N.grain(c,W,H,.45);
}
function pearl(c,x,y,r){const g=c.createRadialGradient(x-r*.3,y-r*.3,.5,x,y,r);g.addColorStop(0,'#fffbe8');g.addColorStop(.6,'#e4b672');g.addColorStop(1,'#8a5b1a');c.fillStyle=g;c.beginPath();c.arc(x,y,r,0,TAU);c.fill();c.strokeStyle=INK;c.lineWidth=1.2;c.stroke();}
function trayRow(ctx,x,y,cols,pots,r){ctx.fillStyle='rgba(18,10,28,.6)';N.rr(ctx,x-6,y-r-5,cols*(r*2+3)+8,r*2+10,r+5);ctx.fill();ctx.strokeStyle='rgba(228,182,114,.6)';ctx.lineWidth=1.3;ctx.stroke();for(let i=0;i<cols;i++){const cx=x+r+i*(r*2+3);if(i<pots.length)drawBall(ctx,cx,y,r,pots[i],1);else{ctx.strokeStyle='rgba(255,246,222,.18)';ctx.lineWidth=1.3;ctx.beginPath();ctx.arc(cx,y,r-1,0,TAU);ctx.stroke();}}}
function draw(ctx,a){const p=a.p,L=lay(a),W=a.W,H=a.H;
 N.cached(ctx,'bil'+(L.land?'L':'P'),W,H,(c)=>bakeHall(c,L));
 const s=L.s;
 // rack triangle (shows on ready + before the break)
 if(p.breakShot&&!p.moving){const ap=S(L,TW*.72-BR*1.25,TH/2),r1=S(L,TW*.72+4*BR*1.75+BR*1.2,TH/2-2.6*BR*2.05),r2=S(L,TW*.72+4*BR*1.75+BR*1.2,TH/2+2.6*BR*2.05);
  ctx.save();ctx.lineJoin='round';ctx.fillStyle='rgba(255,230,190,.07)';ctx.beginPath();ctx.moveTo(ap.x,ap.y);ctx.lineTo(r1.x,r1.y);ctx.lineTo(r2.x,r2.y);ctx.closePath();ctx.fill();
  ctx.strokeStyle=INK;ctx.lineWidth=9*s*.55;ctx.stroke();ctx.strokeStyle='#d9a874';ctx.lineWidth=6*s*.55;ctx.stroke();ctx.strokeStyle='rgba(255,246,222,.6)';ctx.lineWidth=1.6;ctx.stroke();ctx.restore();}
 // balls
 for(const b of p.balls){if(b.pocketed)continue;const q=S(L,b.x,b.y);drawBall(ctx,q.x,q.y,BR*s,b.n,1);}
 for(const sa of p.sinkAnim){const q=S(L,sa.px,sa.py),t=sa.t/.5;if(!sa.b){sa.b=1;a.burst(q.x,q.y,sa.n===0?'#f8f1de':sa.n===8?'#8a6a9a':COLS[(sa.n-1)%8],10);}ctx.globalAlpha=1-t;drawBall(ctx,q.x,q.y,BR*s,sa.n,1-t*.6);ctx.globalAlpha=1;}
 // aim
 const c=cue(p);if(!p.moving&&p.turn==='me'&&!p.over&&!p.hand&&a.running){const pr=predict(p,p.aim),cq=S(L,c.x,c.y),gq=S(L,pr.gx,pr.gy);
  ctx.save();ctx.lineCap='round';ctx.setLineDash([2,10]);ctx.strokeStyle='rgba(255,250,235,'+(.55+p.guide*.3)+')';ctx.lineWidth=3.4;ctx.beginPath();ctx.moveTo(cq.x,cq.y);ctx.lineTo(gq.x,gq.y);ctx.stroke();ctx.setLineDash([]);ctx.strokeStyle='rgba(255,250,235,.8)';ctx.lineWidth=2.2;ctx.beginPath();ctx.arc(gq.x,gq.y,BR*s,0,TAU);ctx.stroke();
  if(pr.hit){const dx=pr.hit.x-pr.gx,dy=pr.hit.y-pr.gy,d=Math.hypot(dx,dy)||1;const q1=S(L,pr.hit.x,pr.hit.y),q2=S(L,pr.hit.x+dx/d*(60+p.guide*50),pr.hit.y+dy/d*(60+p.guide*50));ctx.strokeStyle='#ffe08a';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(q1.x,q1.y);ctx.lineTo(q2.x,q2.y);ctx.stroke();}ctx.restore();
  // clay cue stick
  const back=14+p.power*70+(p.pullAnim||0),ang=p.aim;const bx=cq.x-Math.cos(ang)*(BR*s+back*s*.8),by=cq.y-Math.sin(ang)*(BR*s+back*s*.8);const len=240*s;
  ctx.save();ctx.translate(bx+3,by+5);ctx.rotate(ang);ctx.fillStyle='rgba(6,16,12,.35)';ctx.beginPath();ctx.moveTo(-len,-3);ctx.lineTo(0,-2);ctx.lineTo(0,2);ctx.lineTo(-len,4);ctx.fill();ctx.restore();
  ctx.save();ctx.translate(bx,by);ctx.rotate(ang);const gr=ctx.createLinearGradient(0,-5,0,5);gr.addColorStop(0,'#fff0cc');gr.addColorStop(.5,'#d9a874');gr.addColorStop(1,'#8a5a3a');ctx.fillStyle=gr;ctx.beginPath();ctx.moveTo(-len,-4.5);ctx.lineTo(0,-2.4);ctx.lineTo(0,2.4);ctx.lineTo(-len,5);ctx.closePath();ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=1.6;ctx.stroke();
  ctx.fillStyle='#3b2a3a';ctx.fillRect(-len,-4.5,len*.28,9.5);ctx.fillStyle='#e4b672';ctx.fillRect(-len*.72,-4,5,8.5);ctx.fillStyle='#f8f1de';ctx.fillRect(-14,-2.4,8,4.8);ctx.fillStyle='#8bb7dc';ctx.fillRect(-6,-2.4,6,4.8);ctx.restore();}
 if(p.hand&&p.turn==='me'&&a.running){const q=S(L,c.x,c.y);ctx.save();ctx.setLineDash([6,6]);ctx.strokeStyle='#ffe08a';ctx.lineWidth=2.4;ctx.beginPath();ctx.arc(q.x,q.y,BR*s+8,0,TAU);ctx.stroke();ctx.restore();}
 // HUD band
 const g=p.groups,cpuN=CPU[p.lvl||0].n;
 N.chip(ctx,12,8,142,'YOU '+(g.me?g.me.toUpperCase()+'S':'OPEN'),(p.pot.me.length)+' POTTED',{color:p.turn==='me'?'#ffe08a':'#fff0d4'});N.chip(ctx,164,8,150,cpuN+' '+(g.cpu?g.cpu.toUpperCase()+'S':''),(p.pot.cpu.length)+' POTTED',{color:p.turn==='cpu'?'#ef896d':'#fff0d4'});
 const A0=S(L,0,0),B0=S(L,TW,TH),ty=Math.max(A0.y,B0.y)+26*s+16;
 if(!a.running){const cw=L.land?W-330-12:W*.8,cx=L.land?330:W*.1,cy=L.land?8:H*.42,ch=L.land?38:46;ctx.fillStyle='rgba(18,8,28,.4)';N.rr(ctx,cx+3,cy+5,cw,ch,19);ctx.fill();claySlab(ctx,cx,cy,cw,ch,19,'#5a3d62',2.4);N.text(ctx,'MOONLIGHT BILLIARDS',cx+cw/2,cy+(L.land?17:20),{font:'700 16px Fredoka',align:'center',color:'#ffe08a',stroke:'#1a1226'});N.text(ctx,'8-ball vs the house · aim, set power, shoot',cx+cw/2,cy+(L.land?32:37),{font:'600 11px Fredoka',align:'center',color:'#fff0d4'});}
 else if(L.land){const tw=(W-342-8)/2;trayRow(ctx,330,26,7,p.pot.me,8);trayRow(ctx,330+tw+8,26,7,p.pot.cpu,8);}
 else{trayRow(ctx,24,ty,7,p.pot.me,8);trayRow(ctx,W-24-7*19-8,ty,7,p.pot.cpu,8);}
 if(p.hand&&p.turn==='me'&&a.running)N.text(ctx,'BALL IN HAND · TAP TO PLACE',W/2,L.land?A0.y-26*s-8:A0.y-12,{align:'center',font:'700 13px Fredoka',color:'#ffe08a',stroke:'#1a1226',sw:3});
 // power meter + spin selector (bottom)
 const by=H-34;N.text(ctx,'POWER',22,by-12,{font:'700 10px Fredoka',color:'#bfe4da'});N.bar(ctx,22,by-4,W*.38,14,p.power,p.power>.8?'#ef896d':p.power>.5?'#f2ce77':'#91c9a7');
 const sx=W-70,sy=H-40;{const sp=ballSpr(0,24,true);ctx.drawImage(sp,sx-sp.width/2,sy-sp.height/2);ctx.strokeStyle='#e4b672';ctx.lineWidth=2;ctx.beginPath();ctx.arc(sx,sy,29,0,TAU);ctx.stroke();ctx.fillStyle='#d9534f';ctx.beginPath();ctx.arc(sx+p.spin.x*18,sy-p.spin.y*18,5,0,TAU);ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=1.4;ctx.stroke();N.text(ctx,'SPIN',sx,sy-34,{align:'center',font:'700 10px Fredoka',color:'#bfe4da'});}
 const bw=Math.min(160,W*.26);if(p.turn==='me'&&!p.moving&&!p.hand){claySlab(ctx,W/2-bw/2+20,by-14,bw,38,19,'#ef896d',2.4);N.text(ctx,'SHOOT',W/2+20,by+11,{align:'center',font:'700 18px Fredoka',color:'#fff7e6',stroke:'#7a3a30',sw:3});}
 else N.text(ctx,p.turn==='cpu'?cpuN+' IS PLAYING…':'',W/2+20,by+10,{align:'center',font:'700 14px Fredoka',color:'#bfe4da'});
 if(p.msgT>0){ctx.globalAlpha=Math.min(1,p.msgT*2);N.text(ctx,p.msg,W/2,H*.5,{font:'700 '+Math.round(Math.min(W,H)*.07)+'px Fredoka',align:'center',color:p.foul&&p.msg.includes('FOUL')?'#ef896d':'#ffe08a',stroke:'#1a1226',sw:6,glow:'#ff6f91'});ctx.globalAlpha=1;}
 N.vignette(ctx,W,H,.32);}
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

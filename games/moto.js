/* Barrelstorm Moto: trials-style physics bike (suspension, throttle, lean), ramps, rolling barrels, flips, checkpoints, 3 stages. */
(function(){
const N=window.NXG,GRAV=1500,WR=17,WB=36;
const STAGES=[{name:'DUST CANYON',len:5200,barrels:.35,ramps:.5,amp:.6,col:['#f7c58a','#d98b57','#8a4f3d'],sky:['#f7d5b5','#f2a07a']},
 {name:'BARRELSTORM ALLEY',len:6600,barrels:.8,ramps:.7,amp:.85,col:['#9bbf8d','#5e8a5e','#3d5a49'],sky:['#cfe6ef','#9fc1d9']},
 {name:'NEON RIDGE',len:8000,barrels:1.1,ramps:1,amp:1.1,col:['#9a7ad1','#5b3f8c','#2d1f55'],sky:['#4b2f6f','#1c1440']}];
function hash(n){const s=Math.sin(n*127.1)*43758.5453;return s-Math.floor(s);}
function mkTrack(st,a){const T={st,pts:[],ramps:[],barrels:[],cps:[],len:st.len};
 const h=(x)=>{let y=Math.sin(x*.0021)*60+Math.sin(x*.0057+1.3)*28+Math.sin(x*.0123)*9;y*=st.amp*(.5+Math.min(1,x/2500));return y;};
 // flat start
 const fh=x=>x<500?h(x)*(x/500)*(x/500):h(x);
 T.rawh=fh;
 // ramps: hump segments added on top
 const ramps=[];for(let x=900;x<st.len-700;x+=620/(st.ramps+.2)){if(hash(x)<st.ramps){const w=150+hash(x+3)*90,hh=48+hash(x+5)*52*st.ramps;ramps.push({x,w,h:hh,gap:hash(x+9)<.35?90+hash(x+7)*50:0});}}
 T.ramps=ramps;
 T.h=x=>{let y=fh(x);for(const r of ramps){if(x>r.x&&x<r.x+r.w){const t=(x-r.x)/r.w;y-=r.h*Math.pow(t,1.8);}else if(x>=r.x+r.w&&x<r.x+r.w+r.gap){y+=100;} else if(x>=r.x+r.w+r.gap&&x<r.x+r.w+r.gap+90&&r.gap){/*landing pad*/}}return y;};
 for(let x=1400;x<st.len-500;x+=Math.max(260,520/st.barrels)){if(hash(x+11)<.75)T.barrels.push({x:x+hash(x)*140,vx:-60-hash(x+2)*90*st.barrels,y:0,r:18,rot:0,roll:hash(x+4)<.5});}
 for(let x=1500;x<st.len;x+=1500)T.cps.push(x);T.cps.push(st.len);return T;}
function init(a){const p=a.p;Object.assign(p,{track:mkTrack(STAGES[0],a),x:120,y:-40,vx:0,vy:0,th:0,w:0,rw:0,fw:0,cam:0,camY:0,t:0,crashes:0,lives:3,cp:0,lastCp:120,dead:0,flips:0,air:0,airRot:0,wheelie:0,stage:0,over:false,dust:[],msg:'',msgT:0,dist:0,best:a.store.get('motoStage',0),clock:0,fin:false,boost:0,sc:0,throttle:0});place(a);}
function place(a){const p=a.p,T=p.track;const x=p.lastCp;p.x=x;p.y=T.h(x)-WR-30;p.vx=60;p.vy=0;p.th=0;p.w=0;p.dead=0;p.airRot=0;}
function start(a){const p=a.p;const st=Math.min(2,a.store.get('motoStage',0));init(a);p.stage=st;p.track=mkTrack(STAGES[st],a);p.lastCp=120;place(a);p.lives=3+(a.mastery>=4?1:0);p.diff=a.diff.id;a.time=STAGES[st].len/ 55*(a.diff.id==='easy'?1.25:a.diff.id==='hard'?.9:1)+10;p.power=(a.diff.id==='easy'?1.1:a.diff.id==='hard'?.95:1)*(a.mastery>=2?1.06:1);p.msg='STAGE '+(st+1)+' · '+STAGES[st].name;p.msgT=2.4;a.hud('→ GAS · ← BRAKE · ↑↓ LEAN · LAND LEVEL · CLEAR BARRELS · REACH THE FINISH');}
function rot(x,y,c,s){return{x:x*c-y*s,y:x*s+y*c};}
function wheels(p){const c=Math.cos(p.th),s=Math.sin(p.th);const r=rot(-WB,22,c,s),f=rot(WB,22,c,s);return{r:{x:p.x+r.x,y:p.y+r.y,ox:r.x,oy:r.y},f:{x:p.x+f.x,y:p.y+f.y,ox:f.x,oy:f.y}};}
function crash(a,why){const p=a.p;if(p.dead>0)return;p.dead=1.4;p.crashes++;p.lives--;N.sfx(a,'boom');a.shake(10,.4);a.burst(p.x-p.cam+a.W*.35,p.y-p.camY+a.H*.6,'#ef896d',14);a.combo=0;p.msg=why;p.msgT=1.4;p.crashT=1.4;}
function step(a,dt){const p=a.p,T=p.track,k=a.keys;
 if(p.dead>0){p.dead-=dt;if(p.dead<=0){if(p.lives<0){endRun(a,false);return;}place(a);}return;}
 const gas=(k.ArrowRight||k.d||k.D?1:0)+(a.stick.x>.3?1:0),brk=(k.ArrowLeft||k.a||k.A?1:0),lb=(k.ArrowUp||k.w||k.W?1:0),lf=(k.ArrowDown||k.s||k.S?1:0);
 const W=wheels(p);let contacts=0,fx=0,fy=0,torque=0;
 for(const [name,w] of[['r',W.r],['f',W.f]]){const gy=T.h(w.x),pen=w.y+WR-gy;if(pen>0){contacts++;const slope=(T.h(w.x+6)-T.h(w.x-6))/12,tl=Math.hypot(1,slope),tx=1/tl,ty=slope/tl,nx=-ty,ny=tx; // normal pointing up (negative y)
   const nU={x:ty,y:-tx};const relVn=(p.vx-p.w*w.oy)*nU.x+(p.vy+p.w*w.ox)*nU.y;let F=Math.max(0,pen*3400-relVn*70);F=Math.min(F,19000);
   let Fx=nU.x*F,Fy=nU.y*F;
   // traction / drive along tangent for rear wheel
   const vt=(p.vx-p.w*w.oy)*tx+(p.vy+p.w*w.ox)*ty;
   if(name==='r'){const drive=gas*1750*p.power*(1-Math.min(.85,Math.abs(vt)/620));Fx+=tx*drive;Fy+=ty*drive;if(brk){const b=-Math.sign(vt)*Math.min(Math.abs(vt)*8,1300);Fx+=tx*b;Fy+=ty*b;}}
   else if(brk){const b=-Math.sign(vt)*Math.min(Math.abs(vt)*5,900);Fx+=tx*b;Fy+=ty*b;}
   const fr=-vt*(gas||brk?1.4:2.6);Fx+=tx*fr;Fy+=ty*fr;
   fx+=Fx;fy+=Fy;torque+=w.ox*Fy-w.oy*Fx;if(pen>10&&relVn<-250&&Math.random()<.35)p.dust.push({x:w.x,y:gy,vx:-60-Math.random()*60,vy:-60-Math.random()*80,t:.5});}}
 p.contacts=contacts;
 const M=1,I=2600;
 fy+=GRAV*M;
 // lean: torque from player while grounded or airborne (airborne = flips)
 const lean=(lb?-1:0)+(lf?1:0)+(a.stick.y<-.3?-1:a.stick.y>.3?1:0);torque+=lean*(contacts?12000:21000);
 if(contacts===0){p.air+=dt;p.airRot+=p.w*dt;p.w*=1-.15*dt;}else{if(p.air>.25&&Math.abs(p.airRot)>5.6){const n=Math.floor(Math.abs(p.airRot)/5.9+.35)||1;p.flips+=n;a.addScore(25*n,0,0);p.msg=(n>1?n+'× ':'')+'FLIP! +'+25*n;p.msgT=1.2;N.sfx(a,'win');a.achieve('flip','Land a flip',6);if(n>1)a.achieve('double','Land a double flip',10);}
   if(p.air>.2){const lvl=Math.abs(p.th)<.5;if(!lvl&&Math.abs(p.th)>1.15&&contacts){}}
   p.air=0;p.airRot=0;}
 p.vx+=fx/M*dt;p.vy+=fy/M*dt;p.w+=torque/I*dt;p.w*=1-.5*dt;p.w=N.clamp(p.w,-9,9);
 const sp=Math.hypot(p.vx,p.vy);if(sp>900){p.vx*=900/sp;p.vy*=900/sp;}
 p.x+=p.vx*dt;p.y+=p.vy*dt;p.th+=p.w*dt;
 p.rw+=((contacts?p.vx/WR:gas*30)-p.rw)*Math.min(1,dt*8);p.wheelie=(contacts===1&&W.r.y+WR>T.h(W.r.x)-3&&W.f.y+WR<T.h(W.f.x)-6)?p.wheelie+dt:0;if(p.wheelie>1.5&&!p.wh){p.wh=1;a.addScore(8,0,0);p.msg='WHEELIE +8';p.msgT=.8;}if(!p.wheelie)p.wh=0;
 // head crash: rider head point
 const c=Math.cos(p.th),s=Math.sin(p.th),hd=rot(2,-52,c,s),hx=p.x+hd.x,hy=p.y+hd.y;if(hy>T.h(hx)-6){crash(a,'WIPEOUT!');return;}
 if(Math.abs(p.th)>2.5&&contacts){crash(a,'FLIPPED OVER!');return;}
 if(p.y>2000){crash(a,'FELL OFF THE TRACK');return;}
 // barrels
 for(const b of T.barrels){if(b.hit)continue;b.x+=b.vx*dt;const gy=T.h(b.x);b.y=gy-b.r;b.rot+=b.vx/b.r*dt;const dx=b.x-p.x,dy=b.y-p.y;if(Math.abs(dx)<70&&Math.abs(dy)<60){const hh=Math.hypot(b.x-W.r.x,b.y-W.r.y),hf=Math.hypot(b.x-W.f.x,b.y-W.f.y);if(hh<b.r+WR-2||hf<b.r+WR-2||Math.hypot(b.x-hx,b.y-hy)<b.r+10){b.hit=1;p.vx*=.45;p.w+=(Math.random()-.4)*5;p.vy-=260;N.sfx(a,'boom');a.shake(6,.25);a.burst(b.x-p.cam+a.W*.35,b.y-p.camY+a.H*.6,'#c98a5e',10);p.hits=(p.hits||0)+1;a.combo=0;if(p.hits>=3+(a.mastery>=2?1:0)){crash(a,'BARREL SMASH!');p.hits=0;return;}p.msg='BARREL HIT!';p.msgT=.8;}
   else if(!b.near&&Math.abs(dx)<26&&p.y<b.y-b.r-WR*.5&&p.vx>150){b.near=1;a.addScore(10,0,0);a.combo++;p.msg='BARREL JUMP +10';p.msgT=.8;}}}
 // checkpoint / finish
 if(p.x>T.cps[p.cp]){if(T.cps[p.cp]>=T.len){endRun(a,true);return;}p.lastCp=T.cps[p.cp]-40;p.cp++;a.time=a.time+8;a.addScore(15,0,0);p.msg='CHECKPOINT! +8s';p.msgT=1.3;N.sfx(a,'power');}
 const d=Math.max(0,Math.floor(p.x/10));if(d>p.dist){a.addScore((d-p.dist)*.2,0,0);p.dist=d;}
}
function endRun(a,win){const p=a.p;if(p.over)return;p.over=true;if(win){a.addScore(80+Math.round(a.time*2)+p.lives*10,0,0);a.store.set('motoStage',Math.max(a.store.get('motoStage',0),Math.min(3,p.stage+1)));if(p.stage>=2)a.achieve('allstages','Finish all three stages',20);a.achieve('stage'+p.stage,'Clear stage '+(p.stage+1)+': '+STAGES[p.stage].name,8);}a.finish(win,{grade:win?'STAGE '+(p.stage+1)+' CLEARED':'DNF · '+Math.floor(p.dist/10)+' m'});}
function update(dt,a){const p=a.p;if(p.over)return;N.stepper(h=>step(a,h),240)(dt);p.t+=dt;if(p.msgT>0)p.msgT-=dt;const tx=p.x+N.clamp(p.vx*.35,0,140);p.cam+=(tx-p.cam)*Math.min(1,dt*5);p.camY+=(p.y-p.camY)*Math.min(1,dt*3);
 for(const d of p.dust){d.x+=d.vx*dt;d.y+=d.vy*dt;d.t-=dt;}p.dust=p.dust.filter(d=>d.t>0);}
function timeUp(a){endRun(a,false);}
/* ---------- art: painted canyon parallax, clay terrain, baked bike/rider/barrels, set dressing (draw-only) ---------- */
const INK=N.INK,TAU=N.TAU,sh=N.shade;
const SPR={};
function spr(key,w,h,fn){let c=SPR[key];if(!c){c=document.createElement('canvas');c.width=Math.ceil(w);c.height=Math.ceil(h);fn(c.getContext('2d'),c.width,c.height);SPR[key]=c;}return c;}
function claySlab(c,x,y,w,h,r,col,lw=2){const g=c.createLinearGradient(0,y,0,y+h);g.addColorStop(0,sh(col,.32));g.addColorStop(.5,col);g.addColorStop(1,sh(col,-.4));c.fillStyle=g;N.rr(c,x,y,w,h,r);c.fill();c.strokeStyle=INK;c.lineWidth=lw;c.stroke();c.strokeStyle='rgba(255,246,222,.5)';c.lineWidth=Math.max(1,Math.min(3,h*.07));c.lineCap='round';c.beginPath();c.moveTo(x+r,y+Math.min(h*.14,5));c.lineTo(x+w-r,y+Math.min(h*.14,5));c.stroke();}
function glowSpr(col,r){r=Math.round(r/4)*4||4;return spr('g'+col+r,r*2,r*2,(c,w)=>{const g=c.createRadialGradient(r,r,0,r,r,r);g.addColorStop(0,col);g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.fillRect(0,0,w,w);});}
function glowAt(ctx,x,y,r,col,a){const s=glowSpr(col,r);ctx.globalAlpha=a;ctx.globalCompositeOperation='lighter';ctx.drawImage(s,x-s.width/2,y-s.height/2);ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;}
const LW=1800;
function cloud(c,x,y,s){c.fillStyle='rgba(255,246,230,.8)';for(const [dx,dy,r] of[[0,0,20],[22,-8,26],[50,0,22],[26,6,24]]){c.beginPath();c.arc(x+dx*s,y+dy*s,r*s,0,TAU);c.fill();}c.strokeStyle='rgba(42,26,44,.25)';c.lineWidth=2;c.beginPath();c.arc(x+22*s,y-8*s,26*s,3.4,5.6);c.stroke();}
function skyBake(S,W,H,night){return spr('sky'+S.name+W+H,W,H,(c)=>{const g=c.createLinearGradient(0,0,0,H);g.addColorStop(0,S.sky[0]);g.addColorStop(.7,S.sky[1]);g.addColorStop(1,S.col[0]);c.fillStyle=g;c.fillRect(0,0,W,H);
 const R=N.mulberry(S.name.length*17);if(night){for(let i=0;i<70;i++){c.fillStyle='rgba(255,236,190,'+(.4+R()*.5)+')';c.beginPath();c.arc(R()*W,R()*H*.55,.8+R()*1.6,0,TAU);c.fill();}}
 const sx=W*.78,sy=H*.2,sr=34;const sg=c.createRadialGradient(sx,sy,sr*.5,sx,sy,sr*3.4);sg.addColorStop(0,night?'rgba(200,170,255,.45)':'rgba(255,230,170,.6)');sg.addColorStop(1,'rgba(255,230,170,0)');c.fillStyle=sg;c.fillRect(0,0,W,H);
 const bg=c.createRadialGradient(sx-10,sy-12,3,sx,sy,sr);bg.addColorStop(0,night?'#fff8ff':'#fffbe0');bg.addColorStop(1,night?'#c9b0f0':'#f6c86a');c.fillStyle=bg;c.beginPath();c.arc(sx,sy,sr,0,TAU);c.fill();c.strokeStyle=INK;c.lineWidth=2.5;c.stroke();c.strokeStyle='rgba(255,252,238,.8)';c.lineWidth=3;c.lineCap='round';c.beginPath();c.arc(sx,sy,sr*.78,3.5,4.5);c.stroke();});}
function cloudLayer(S,H){return spr('cl'+S.name,LW,H*.5,(c)=>{const R=N.mulberry(5);for(let i=0;i<7;i++)cloud(c,(i+.3+R()*.4)*LW/7,30+R()*H*.28,.7+R()*.7);});}
function mesaLayer(S,H,l){const key='ms'+S.name+l+H;return spr(key,LW,H,(c)=>{
 const R=N.mulberry(l*91+S.name.length),half=LW/2,base=[H*.62,H*.7,H*.8][l];
 const col=N.mix(S.col[Math.min(2,l)],S.sky[1],[.6,.42,.18][l]);
 const draw=(ox)=>{c.save();c.translate(ox,0);let x=-20;while(x<half){const w=[110,90,70][l]+R()*[170,120,90][l],h=[130,100,60][l]*(.5+R()*.7),top=base-h;
   c.beginPath();c.moveTo(x,H);c.lineTo(x+4,base+10);
   if(l<2){c.lineTo(x+w*.12,top+h*.35);c.lineTo(x+w*.08,top+h*.3);c.lineTo(x+w*.14,top+8);c.quadraticCurveTo(x+w*.16,top,x+w*.24,top);c.lineTo(x+w*.78,top);c.quadraticCurveTo(x+w*.86,top,x+w*.88,top+8);c.lineTo(x+w*.93,top+h*.3);c.lineTo(x+w*.9,top+h*.36);c.lineTo(x+w-4,base+10);}
   else{c.quadraticCurveTo(x+w*.25,top,x+w*.5,top);c.quadraticCurveTo(x+w*.8,top,x+w-4,base+10);}
   c.lineTo(x+w,H);c.closePath();
   const g=c.createLinearGradient(x,0,x+w,0);g.addColorStop(0,sh(col,.22));g.addColorStop(.45,col);g.addColorStop(1,sh(col,-.32));c.fillStyle=g;c.fill();
   c.save();c.clip();for(let k=1;k<5;k++){c.fillStyle='rgba(60,24,40,'+(.05+.04*(k%2))+')';c.fillRect(x-4,top+k*h/5,w+8,h/10);}c.restore();
   c.strokeStyle=INK;c.lineWidth=l===2?2.4:1.8;c.lineJoin='round';c.stroke();
   c.strokeStyle='rgba(255,246,222,.4)';c.lineWidth=2;c.lineCap='round';c.beginPath();c.moveTo(x+w*.2,top+3);c.lineTo(x+w*.6,top+3);c.stroke();
   if(l===2&&R()>.4){const cx=x+w*.5,cy=top+4;c.fillStyle='#4f8a5a';N.rr(c,cx-4,cy-34,8,34,4);c.fill();c.strokeStyle=INK;c.lineWidth=1.6;c.stroke();}
   x+=w*(.55+R()*.4);}c.restore();};
 draw(0);c.save();c.translate(LW,0);c.scale(-1,1);const im=c.canvas;c.restore();
 // mirror right half for a seamless tile
 const tmp=document.createElement('canvas');tmp.width=half;tmp.height=H;tmp.getContext('2d').drawImage(c.canvas,0,0,half,H,0,0,half,H);c.save();c.translate(LW,0);c.scale(-1,1);c.drawImage(tmp,0,0);c.restore();});}
function dirtPat(S){return spr('dirt'+S.name,200,200,(c)=>{const R=N.mulberry(S.name.length*13);c.fillStyle=S.col[1];c.fillRect(0,0,200,200);
 for(let i=0;i<5;i++){c.strokeStyle='rgba(30,10,30,'+(.09+R()*.08)+')';c.lineWidth=2+R()*3;c.beginPath();const y=R()*200;c.moveTo(0,y);c.bezierCurveTo(60,y+R()*14-7,140,y+R()*14-7,200,y);c.stroke();}
 for(let i=0;i<22;i++){const x=R()*200,y=R()*200,r=3+R()*7;c.fillStyle=R()>.5?sh(S.col[1],-.22):sh(S.col[1],.2);c.beginPath();c.ellipse(x,y,r,r*.7,R()*3,0,TAU);c.fill();c.strokeStyle='rgba(42,26,44,.35)';c.lineWidth=1.1;c.stroke();}
 for(let i=0;i<60;i++){c.fillStyle=R()>.5?'rgba(255,240,210,.16)':'rgba(20,6,24,.16)';c.fillRect(R()*200,R()*200,2,2);}});}
function propSpr(st,kind){return spr('pp'+st+kind,90,110,(c)=>{const x=45,y=104;c.fillStyle='rgba(10,6,16,.3)';c.beginPath();c.ellipse(x+6,y,26,6,0,0,TAU);c.fill();c.lineJoin='round';c.lineCap='round';
 const lit=(col)=>{const g=c.createLinearGradient(x-20,0,x+20,0);g.addColorStop(0,sh(col,.35));g.addColorStop(.5,col);g.addColorStop(1,sh(col,-.4));return g;};
 const col=(gc)=>{c.strokeStyle=INK;c.lineWidth=2;c.fillStyle=gc;};
 if(st===0){if(kind===0){const gc=lit('#5f9a6e');col(gc);N.rr(c,x-8,y-72,16,72,8);c.fill();c.stroke();N.rr(c,x-26,y-52,12,8,4);c.fill();c.stroke();N.rr(c,x-26,y-52,8,24,4);c.fill();c.stroke();N.rr(c,x+14,y-44,12,8,4);c.fill();c.stroke();N.rr(c,x+18,y-44,8,22,4);c.fill();c.stroke();c.strokeStyle='rgba(255,246,222,.5)';c.lineWidth=2;c.beginPath();c.moveTo(x-3,y-64);c.lineTo(x-3,y-14);c.stroke();c.fillStyle='#ef896d';c.beginPath();c.arc(x+1,y-74,4,0,TAU);c.fill();c.strokeStyle=INK;c.lineWidth=1.4;c.stroke();}
  else if(kind===1){for(const [dx,r,cc] of[[-14,16,'#b58a6a'],[10,20,'#c9a07c'],[0,12,'#a17658']]){N.blob(c,x+dx,y-r*.8,r,cc,dx+r,{shadow:false});}}
  else{c.strokeStyle='#5a3a2a';c.lineWidth=6;c.beginPath();c.moveTo(x,y);c.lineTo(x,y-56);c.stroke();col(lit('#f2ce77'));N.rr(c,x-26,y-76,52,26,8);c.fill();c.stroke();c.fillStyle=INK;c.beginPath();c.moveTo(x-14,y-70);c.lineTo(x+12,y-63);c.lineTo(x-14,y-56);c.fill();}}
 else if(st===1){if(kind===0){c.strokeStyle=INK;c.lineWidth=2;c.fillStyle=lit('#8a5a3a');N.rr(c,x-6,y-48,12,48,4);c.fill();c.stroke();N.blob(c,x-14,y-62,22,'#5f9a6e',3,{shadow:false});N.blob(c,x+12,y-70,20,'#7fb27d',7,{shadow:false});N.blob(c,x,y-82,18,'#4a8a5e',11,{shadow:false});}
  else if(kind===1){N.blob(c,x-8,y-14,16,'#7fb27d',5,{shadow:false});N.blob(c,x+10,y-12,13,'#5f9a6e',9,{shadow:false});}
  else{col(lit('#e0b36a'));N.rr(c,x-24,y-30,48,30,10);c.fill();c.stroke();c.strokeStyle='rgba(120,80,30,.6)';c.lineWidth=2;for(let i=-16;i<20;i+=9){c.beginPath();c.moveTo(x+i,y-27);c.lineTo(x+i,y-3);c.stroke();}c.strokeStyle='rgba(255,246,222,.6)';c.beginPath();c.moveTo(x-18,y-27);c.lineTo(x+8,y-27);c.stroke();}}
 else{if(kind===0){for(const [dx,h,cc,ang] of[[-14,50,'#7ac3e0',-.2],[0,74,'#d48bd6',0],[15,44,'#9a7ad1',.25]]){c.save();c.translate(x+dx,y);c.rotate(ang);c.beginPath();c.moveTo(-9,0);c.lineTo(-6,-h*.8);c.lineTo(0,-h);c.lineTo(7,-h*.8);c.lineTo(10,0);c.closePath();const g=c.createLinearGradient(-9,0,10,0);g.addColorStop(0,sh(cc,.5));g.addColorStop(.5,cc);g.addColorStop(1,sh(cc,-.45));c.fillStyle=g;c.fill();c.strokeStyle=INK;c.lineWidth=2;c.stroke();c.strokeStyle='rgba(255,252,238,.7)';c.lineWidth=2;c.beginPath();c.moveTo(-4,-8);c.lineTo(-3,-h*.7);c.stroke();c.restore();}}
  else if(kind===1){c.strokeStyle=INK;c.lineWidth=2;c.fillStyle=lit('#5b3f8c');N.rr(c,x-5,y-60,10,60,3);c.fill();c.stroke();c.fillStyle='#ff6f91';c.beginPath();c.arc(x,y-64,8,0,TAU);c.fill();c.stroke();const g=c.createRadialGradient(x,y-64,1,x,y-64,34);g.addColorStop(0,'rgba(255,111,145,.7)');g.addColorStop(1,'rgba(255,111,145,0)');c.fillStyle=g;c.fillRect(x-40,y-100,80,80);}
  else{N.blob(c,x-4,y-18,20,'#6a5a9a',4,{shadow:false});N.blob(c,x+16,y-10,12,'#8a78bc',8,{shadow:false});}}
 });}
function barrelSpr(){return spr('barrel',60,60,(c)=>{const x=30,y=30,r=18;const g=c.createRadialGradient(x-6,y-7,2,x,y,r*1.1);g.addColorStop(0,'#f0c08a');g.addColorStop(.5,'#c98a5e');g.addColorStop(1,'#7a4a34');c.fillStyle=g;c.beginPath();c.arc(x,y,r,0,TAU);c.fill();c.strokeStyle=INK;c.lineWidth=2.4;c.stroke();
 c.strokeStyle='#5a3a2a';c.lineWidth=3;c.beginPath();c.arc(x,y,r*.68,0,TAU);c.stroke();c.fillStyle='#5a3a2a';c.fillRect(x-r,y-2,r*2,4);c.fillStyle='#f2ce77';c.fillRect(x-r,y-6,r*2,2);c.fillRect(x-r,y+4,r*2,2);
 c.fillStyle='#e8d36a';c.beginPath();c.moveTo(x-5,y-9);c.lineTo(x+7,y-1);c.lineTo(x-5,y+8);c.fill();c.strokeStyle=INK;c.lineWidth=1.2;c.stroke();c.strokeStyle='rgba(255,252,238,.7)';c.lineWidth=2.4;c.lineCap='round';c.beginPath();c.arc(x,y,r*.88,3.6,4.5);c.stroke();});}
function wheelSpr(){return spr('wheel',80,80,(c)=>{c.save();c.translate(40,40);c.scale(2,2);const R=17;
  c.fillStyle='#2a1c34';c.beginPath();c.arc(0,0,R,0,TAU);c.fill();c.strokeStyle=INK;c.lineWidth=1.4;c.stroke();
  c.fillStyle='#4a3858';for(let i=0;i<14;i++){c.save();c.rotate(i/14*TAU);N.rr(c,R-3.6,-1.8,4,3.6,1);c.fill();c.restore();}
  const g=c.createRadialGradient(-3,-3,1,0,0,R*.7);g.addColorStop(0,'#fff4d2');g.addColorStop(.6,'#e4b672');g.addColorStop(1,'#8a5b1a');c.fillStyle=g;c.beginPath();c.arc(0,0,R*.62,0,TAU);c.fill();c.strokeStyle=INK;c.lineWidth=1.2;c.stroke();
  c.strokeStyle='#684b62';c.lineWidth=1.6;for(let i=0;i<5;i++){c.beginPath();c.moveTo(0,0);c.lineTo(Math.cos(i*1.2566)*R*.55,Math.sin(i*1.2566)*R*.55);c.stroke();}
  c.fillStyle='#f8e9ca';c.beginPath();c.arc(0,0,3,0,TAU);c.fill();c.strokeStyle=INK;c.lineWidth=1;c.stroke();c.restore();});}
function bikeSpr(){return spr('bike',240,200,(c)=>{c.save();c.translate(110,140);c.scale(2,2);c.lineJoin='round';c.lineCap='round';
  // rear swing arm + fork
  c.strokeStyle=INK;c.lineWidth=7;c.beginPath();c.moveTo(-WB,22);c.lineTo(-10,6);c.moveTo(WB,22);c.lineTo(WB-8,-14);c.stroke();c.strokeStyle='#a8a8c0';c.lineWidth=4;c.beginPath();c.moveTo(-WB,22);c.lineTo(-10,6);c.moveTo(WB,22);c.lineTo(WB-8,-14);c.stroke();
  // engine block
  c.fillStyle='#3a2d45';N.rr(c,-16,-6,30,16,5);c.fill();c.strokeStyle=INK;c.lineWidth=2;c.stroke();c.fillStyle='#a8a8c0';N.rr(c,-10,-4,18,6,2);c.fill();
  // exhaust
  c.strokeStyle=INK;c.lineWidth=5.5;c.beginPath();c.moveTo(-6,8);c.lineTo(-34,8);c.stroke();c.strokeStyle='#d9d4e6';c.lineWidth=3;c.beginPath();c.moveTo(-6,8);c.lineTo(-34,8);c.stroke();
  // body shells
  let g=c.createLinearGradient(0,-24,0,10);g.addColorStop(0,'#ffb49a');g.addColorStop(.5,'#ef896d');g.addColorStop(1,'#a8523f');c.fillStyle=g;N.rr(c,-26,-16,52,26,10);c.fill();c.strokeStyle=INK;c.lineWidth=2.2;c.stroke();
  c.strokeStyle='rgba(255,246,222,.65)';c.lineWidth=2.2;c.beginPath();c.moveTo(-18,-12);c.lineTo(10,-12);c.stroke();
  g=c.createLinearGradient(0,-24,0,-10);g.addColorStop(0,'#fff0b0');g.addColorStop(1,'#d9a040');c.fillStyle=g;N.rr(c,-24,-24,28,13,6);c.fill();c.strokeStyle=INK;c.lineWidth=2;c.stroke();
  c.fillStyle='#2a1c34';N.rr(c,-20,-10,32,5,2);c.fill();
  // number plate
  c.fillStyle='#f8f1de';c.beginPath();c.arc(-4,-2,6,0,TAU);c.fill();c.strokeStyle=INK;c.lineWidth=1.4;c.stroke();c.fillStyle=INK;c.font='700 8px Fredoka, system-ui';c.textAlign='center';c.textBaseline='middle';c.fillText('7',-4,-1.5);
  // handlebar + headlight
  c.strokeStyle=INK;c.lineWidth=6;c.beginPath();c.moveTo(WB-8,-14);c.lineTo(WB-2,-24);c.lineTo(WB+8,-24);c.stroke();c.strokeStyle='#d9d4e6';c.lineWidth=3;c.stroke();
  c.fillStyle='#fff4d2';c.beginPath();c.ellipse(WB+8,-12,5,6,0,0,TAU);c.fill();c.strokeStyle=INK;c.lineWidth=1.6;c.stroke();
  // rider: legs, torso, arm, helmet
  c.strokeStyle=INK;c.lineWidth=12;c.beginPath();c.moveTo(-8,-22);c.lineTo(8,-8);c.stroke();c.strokeStyle='#2b4468';c.lineWidth=8.5;c.stroke();
  c.strokeStyle=INK;c.lineWidth=12;c.beginPath();c.moveTo(-8,-22);c.lineTo(4,-44);c.stroke();c.strokeStyle='#4a78b0';c.lineWidth=8.5;c.stroke();
  c.strokeStyle=INK;c.lineWidth=9;c.beginPath();c.moveTo(4,-42);c.lineTo(WB-6,-24);c.stroke();c.strokeStyle='#4a78b0';c.lineWidth=5.6;c.stroke();
  c.fillStyle='#f2ce77';c.beginPath();c.arc(WB-5,-23,4,0,TAU);c.fill();c.strokeStyle=INK;c.lineWidth=1.5;c.stroke();
  const hg=c.createRadialGradient(2,-58,2,6,-54,12);hg.addColorStop(0,'#ffffff');hg.addColorStop(.5,'#f8e9ca');hg.addColorStop(1,'#bfa88a');c.fillStyle=hg;c.beginPath();c.arc(6,-54,11,0,TAU);c.fill();c.strokeStyle=INK;c.lineWidth=2;c.stroke();
  c.fillStyle='#ef896d';c.beginPath();c.arc(6,-56,10,Math.PI,0);c.fill();c.stroke();c.fillStyle='#1c1840';N.rr(c,8,-59,8,7,2.5);c.fill();c.fillStyle='rgba(255,255,255,.55)';c.fillRect(10,-58,3,2);
  c.strokeStyle='rgba(255,252,238,.8)';c.lineWidth=2;c.beginPath();c.arc(6,-54,8,3.5,4.4);c.stroke();c.restore();});}
function puffSpr(){return spr('puff',32,32,(c)=>{const g=c.createRadialGradient(13,13,1,16,16,13);g.addColorStop(0,'#fff2dc');g.addColorStop(1,'#cfa88a');c.fillStyle=g;c.beginPath();c.arc(16,16,13,0,TAU);c.fill();c.strokeStyle='rgba(42,26,44,.5)';c.lineWidth=1.6;c.stroke();});}
function propsOf(T,S,st){if(T.props)return T.props;const P=[];for(let x=260;x<T.len-300;x+=150+hash(x+31)*160){if(hash(x+7)<.7)P.push({x:x+hash(x)*60,k:Math.floor(hash(x+3)*3),f:hash(x+5)<.4});}T.props=P;return P;}
function draw(ctx,a){const p=a.p,W=a.W,H=a.H,T=p.track,S=T.st,st=p.stage||0,night=st===2;
 const art=p.art||(p.art={pc:0,sq:0,lt:p.t||0});
 const camX=p.cam,camY=p.camY,ox=W*.35,oy=H*.6;
 ctx.drawImage(skyBake(S,W,H,night),0,0);
 {const f=[.03,.1,.2,.34];const cl=cloudLayer(S,H);let o=-((camX*f[0])%LW);ctx.globalAlpha=.9;for(let k=0;k<2;k++)ctx.drawImage(cl,o+k*LW,20);ctx.globalAlpha=1;
  for(let l=0;l<3;l++){const im=mesaLayer(S,H,l);const o2=-((camX*f[l+1])%LW);const vy=-(camY*(.04+l*.04));for(let k=0;k<2;k++)ctx.drawImage(im,o2+k*LW,vy);}}
 ctx.save();ctx.translate(ox-camX,oy-camY);
 const x0=camX-ox-20,x1=camX+W-ox+20,xs=Math.floor(x0/10)*10;
 // terrain path (built once, reused)
 const tp=new Path2D(),lip=new Path2D();let first=true;const hs=[];for(let x=xs;x<=x1;x+=10){const y=T.h(x);hs.push(y);first?lip.moveTo(x,y):lip.lineTo(x,y);first=false;}
 tp.addPath(lip);tp.lineTo(x1,camY+H+400);tp.lineTo(xs,camY+H+400);tp.closePath();
 // set dressing behind the lane
 for(const pr of propsOf(T,S,st)){if(pr.x<x0-60||pr.x>x1+60)continue;const s=propSpr(st,pr.k);const y=T.h(pr.x);if(night&&pr.k===1)glowAt(ctx,pr.x,y-64,44,'#ff6f91',.5);ctx.drawImage(s,pr.x-45,y-104+4,90,110);}
 ctx.fillStyle=ctx.createPattern(dirtPat(S),'repeat');ctx.fill(tp);
 const tg=ctx.createLinearGradient(0,camY-80,0,camY+H);tg.addColorStop(0,'rgba(255,230,190,.22)');tg.addColorStop(.5,'rgba(0,0,0,0)');tg.addColorStop(1,'rgba(10,4,20,.55)');ctx.fillStyle=tg;ctx.fill(tp);
 ctx.lineJoin='round';ctx.lineCap='round';
 ctx.strokeStyle='rgba(10,4,20,.25)';ctx.lineWidth=20;ctx.save();ctx.translate(0,5);ctx.stroke(lip);ctx.restore();
 ctx.strokeStyle=INK;ctx.lineWidth=15;ctx.stroke(lip);ctx.strokeStyle=S.col[0];ctx.lineWidth=11;ctx.stroke(lip);
 ctx.save();ctx.translate(0,-3);ctx.strokeStyle='rgba(255,246,222,.4)';ctx.lineWidth=2.6;ctx.stroke(lip);ctx.restore();
 // grass-tuft ticks on lip
 ctx.strokeStyle=sh(S.col[0],-.3);ctx.lineWidth=2;ctx.beginPath();for(let i=0;i<hs.length;i+=2){const x=xs+i*10,y=hs[i];ctx.moveTo(x,y+4);ctx.lineTo(x-2,y+14);}ctx.stroke();
 // ramps: wooden stripes
 for(const r of T.ramps){if(r.x>x1||r.x+r.w<x0)continue;ctx.beginPath();for(let x=r.x;x<=r.x+r.w;x+=8){const y=T.h(x)-6;x===r.x?ctx.moveTo(x,y):ctx.lineTo(x,y);}ctx.strokeStyle=INK;ctx.lineWidth=9;ctx.stroke();ctx.strokeStyle='#f2ce77';ctx.lineWidth=5.5;ctx.setLineDash([12,9]);ctx.stroke();ctx.setLineDash([]);ctx.strokeStyle='rgba(255,252,238,.6)';ctx.lineWidth=1.4;ctx.save();ctx.translate(0,-2);ctx.stroke();ctx.restore();}
 // checkpoints / finish
 for(const c of T.cps){if(c<x0||c>x1)continue;const y=T.h(c),fin=c>=T.len;ctx.lineWidth=9;ctx.strokeStyle=INK;ctx.beginPath();ctx.moveTo(c,y+2);ctx.lineTo(c,y-132);ctx.stroke();ctx.strokeStyle='#d9d4e6';ctx.lineWidth=5;ctx.stroke();
  if(fin){ctx.beginPath();ctx.moveTo(c+56,y+2);ctx.lineTo(c+56,y-132);ctx.strokeStyle=INK;ctx.lineWidth=9;ctx.stroke();ctx.strokeStyle='#d9d4e6';ctx.lineWidth=5;ctx.stroke();for(let i=0;i<8;i++){ctx.fillStyle=i%2?'#fff':'#1a1226';ctx.fillRect(c+(i%4)*14,y-130+Math.floor(i/4)*14,14,14);}ctx.strokeStyle=INK;ctx.lineWidth=2;ctx.strokeRect(c,y-130,56,28);N.text(ctx,'FINISH',c+28,y-140,{font:'700 20px Fredoka',align:'center',color:'#fff',stroke:'#1a1226'});}
  else{ctx.fillStyle=p.x>c?'#91c9a7':'#ef896d';ctx.beginPath();ctx.moveTo(c,y-130);ctx.lineTo(c+50,y-112);ctx.lineTo(c,y-94);ctx.closePath();ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=2.2;ctx.stroke();ctx.strokeStyle='rgba(255,246,222,.6)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(c+4,y-124);ctx.lineTo(c+34,y-114);ctx.stroke();}}
 // barrels
 const bs=barrelSpr();for(const b of T.barrels){if(b.hit||b.x<x0||b.x>x1)continue;const gy=T.h(b.x);N.shadow(ctx,b.x+8,gy+1,b.r*1.05,4,.3);ctx.save();ctx.translate(b.x,b.y);ctx.rotate(b.rot);ctx.drawImage(bs,-b.r*30/18,-b.r*30/18,b.r*60/18,b.r*60/18);ctx.restore();}
 // dust puffs (clay)
 const pf=puffSpr();for(const d of p.dust){const k=Math.max(0,d.t*2);ctx.globalAlpha=Math.min(1,k);const rr=5+(.5-d.t)*14;ctx.drawImage(pf,d.x-rr,d.y-rr,rr*2,rr*2);}ctx.globalAlpha=1;
 // squash on landing
 if(p.contacts>0&&art.pc===0&&(p.air||0)<=0&&art.was===0)art.sq=1;art.was=p.contacts;if(art.sq>0)art.sq=Math.max(0,art.sq-1/14);art.pc=0;
 p.wang=(p.wang||0)+p.rw*.016;
 if(p.dead<=0||Math.floor(p.t*12)%2){
  const gy=T.h(p.x),hgt=Math.max(0,gy-p.y-WR);N.shadow(ctx,p.x+6,gy+2,40/(1+hgt*.01),6/(1+hgt*.01),Math.max(.12,.34-hgt*.002));
  glowAt(ctx,p.x+Math.cos(p.th)*60,p.y+Math.sin(p.th)*60-6,62,night?'#fff2c0':'#fff2c0',night?.4:.14);
  ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.th);const k=art.sq;ctx.translate(0,22+WR);ctx.scale(1+.1*k,1-.11*k);ctx.translate(0,-22-WR);
  const wsp=wheelSpr();for(const x of[-WB,WB]){ctx.save();ctx.translate(x,22);ctx.rotate(p.wang||0);ctx.drawImage(wsp,-20,-20,40,40);ctx.restore();}
  ctx.drawImage(bikeSpr(),-55,-70,120,100);ctx.restore();}
 ctx.restore();
 // HUD (top band)
 const speed=Math.round(Math.hypot(p.vx,p.vy)*.18);N.chip(ctx,12,10,100,'SPEED',speed+' km/h');N.chip(ctx,122,10,110,'SCORE',a.score,{color:'#ffe08a'});N.chip(ctx,242,10,90,'LIVES','♥'.repeat(Math.max(0,p.lives)),{color:'#ef896d'});
 // progress track (bottom band)
 {const bx=14,bw=W-28,by=H-30,pr=Math.min(1,p.x/T.len);ctx.fillStyle='rgba(18,10,28,.62)';N.rr(ctx,bx-4,by-14,bw+8,34,17);ctx.fill();ctx.strokeStyle='rgba(228,182,114,.6)';ctx.lineWidth=1.4;ctx.stroke();
  ctx.fillStyle='#241838';N.rr(ctx,bx+4,by-2,bw-8,10,5);ctx.fill();ctx.fillStyle='#ffe08a';N.rr(ctx,bx+4,by-2,Math.max(10,(bw-8)*pr),10,5);ctx.fill();ctx.fillStyle='rgba(255,252,238,.5)';N.rr(ctx,bx+7,by,Math.max(4,(bw-8)*pr-6),3,1.5);ctx.fill();
  for(const c of T.cps){const cx=bx+4+(bw-8)*c/T.len;ctx.fillStyle=c>=T.len?'#fff':(p.x>c?'#91c9a7':'#ef896d');ctx.beginPath();ctx.moveTo(cx,by-10);ctx.lineTo(cx+7,by-7);ctx.lineTo(cx,by-4);ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(cx,by-10);ctx.lineTo(cx,by+8);ctx.stroke();}
  const mxp=bx+4+(bw-8)*pr;ctx.fillStyle='#ef896d';ctx.beginPath();ctx.arc(mxp,by+3,7,0,TAU);ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=2;ctx.stroke();N.text(ctx,S.name+' · '+Math.floor(p.x/10)+' / '+(T.len/10|0)+' m',W/2,by-17,{align:'center',font:'700 11px Fredoka',color:'#fff0d4',stroke:'#1a1226',sw:3});}
 if(p.msgT>0){ctx.save();ctx.globalAlpha=Math.min(1,p.msgT*2);const sc=1+Math.max(0,p.msgT-1)*.3;ctx.translate(W/2,H*.3);ctx.scale(sc,sc);N.text(ctx,p.msg,0,0,{font:'700 '+Math.round(Math.min(W,H)*.07)+'px Fredoka',align:'center',color:'#ffe08a',stroke:'#1a1226',sw:6,glow:'#ff6f91'});ctx.restore();}
 if(!a.running){const w=Math.min(W*.6,420),h=54,x=W/2-w/2,y=64;ctx.fillStyle='rgba(18,8,28,.4)';N.rr(ctx,x+3,y+6,w,h,20);ctx.fill();claySlab(ctx,x,y,w,h,20,'#5a3d62',2.4);N.text(ctx,'BARRELSTORM MOTO',W/2,y+24,{font:'700 20px Fredoka',align:'center',color:'#ffe08a',stroke:'#1a1226'});N.text(ctx,'Next: '+STAGES[Math.min(2,a.store.get('motoStage',0))].name+' · clear it to unlock the next course',W/2,y+43,{font:'600 11px Fredoka',align:'center',color:'#fff0d4'});}
 N.vignette(ctx,W,H,.25);}
NEXUS_GAMES.register('moto',{meta:{title:'BARRELSTORM MOTO',help:'Trials-style stunt bike. Gas up the hills, brake into landings and lean to level the bike in mid-air. Backflips and front flips score big; barrels slow you down, and a hard wipe-out costs a life. Three courses unlock in order.',controls:'→ gas · ← brake · ↑ lean back · ↓ lean forward',type:'MOTOCROSS'},
 size:[900,520],portraitSize:[900,520],duration:60,tier:1.3,
 touch:[{kind:'btn',side:'left',label:'LEAN ↺',key:'ArrowUp'},{kind:'btn',side:'left',label:'LEAN ↻',key:'ArrowDown'},{kind:'btn',side:'right',label:'BRAKE',key:'ArrowLeft',cls:'alt'},{kind:'btn',side:'right',label:'GAS',key:'ArrowRight',big:true}],
 init,start,update,draw,timeUp});
})();

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
function drawBike(ctx,p,W){const c=Math.cos(p.th),s=Math.sin(p.th);ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.th);
 const wheel=(x,y)=>{ctx.save();ctx.translate(x,y);ctx.rotate(p.rw*(x<0?1:1)*(p.t*0+1)*.0+p.rwAng||0);ctx.restore();};
 for(const x of[-WB,WB]){ctx.save();ctx.translate(x,22);ctx.fillStyle='#2a1c34';ctx.beginPath();ctx.arc(0,0,WR,0,N.TAU);ctx.fill();ctx.strokeStyle='#684b62';ctx.lineWidth=4;ctx.stroke();ctx.rotate(p.wang||0);ctx.strokeStyle='#ffe9b8';ctx.lineWidth=2;for(let i=0;i<4;i++){ctx.rotate(Math.PI/4);ctx.beginPath();ctx.moveTo(-WR+4,0);ctx.lineTo(WR-4,0);ctx.stroke();}ctx.fillStyle='#d9d4e6';ctx.beginPath();ctx.arc(0,0,4,0,N.TAU);ctx.fill();ctx.restore();}
 ctx.strokeStyle='#8a8aa0';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(WB,22);ctx.lineTo(WB-8,-14);ctx.stroke();ctx.beginPath();ctx.moveTo(-WB,22);ctx.lineTo(-10,6);ctx.stroke();
 N.slab(ctx,-26,-14,52,24,9,'#ef896d',{shadow:false});N.slab(ctx,-22,-22,26,12,6,'#f2ce77',{shadow:false});ctx.fillStyle='#3a2d45';ctx.fillRect(-18,-6,34,6);
 ctx.strokeStyle='#d9d4e6';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(WB-8,-14);ctx.lineTo(WB-2,-24);ctx.lineTo(WB+8,-24);ctx.stroke();
 // rider
 const lean=Math.sin(p.t*0)*0;ctx.strokeStyle='#3a5f8c';ctx.lineWidth=9;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-8,-22);ctx.lineTo(4,-44);ctx.stroke();ctx.beginPath();ctx.moveTo(4,-42);ctx.lineTo(WB-6,-24);ctx.stroke();ctx.strokeStyle='#2b4468';ctx.beginPath();ctx.moveTo(-8,-22);ctx.lineTo(8,-8);ctx.stroke();
 N.ball(ctx,6,-54,10,'#f8e9ca',{shadow:false});ctx.fillStyle='#ef896d';ctx.beginPath();ctx.arc(6,-56,10,Math.PI,0);ctx.fill();ctx.fillStyle='#1a1226';N.rr(ctx,8,-58,8,6,2);ctx.fill();
 ctx.restore();}
function draw(ctx,a){const p=a.p,W=a.W,H=a.H,T=p.track,S=T.st;
 N.bgGrad(ctx,W,H,[S.sky[0],S.sky[1],S.col[0]]);
 const camX=p.cam,camY=p.camY,ox=W*.35,oy=H*.6;
 // parallax mountains
 for(let l=0;l<3;l++){ctx.fillStyle=N.mix(S.col[l],S.sky[1],.55-.15*l);ctx.beginPath();ctx.moveTo(0,H);for(let x=0;x<=W;x+=20){const wx=x+camX*(.1+l*.12);ctx.lineTo(x,H*(.52+l*.07)-Math.abs(Math.sin(wx*.003+l*2))*H*(.22-l*.04)-Math.sin(wx*.011)*10);}ctx.lineTo(W,H);ctx.fill();}
 if(S.name==='NEON RIDGE')for(let i=0;i<40;i++)N.glow(ctx,(i*197-camX*.05+W*5)%W,(i*61)%(H*.5),2+(i%3),'#ffe9b8',.5);
 ctx.save();ctx.translate(ox-camX,oy-camY);
 const x0=camX-ox-20,x1=camX+W-ox+20;
 // terrain
 ctx.beginPath();ctx.moveTo(x0,camY+H);for(let x=Math.floor(x0/10)*10;x<=x1;x+=10)ctx.lineTo(x,T.h(x));ctx.lineTo(x1,camY+H+400);ctx.lineTo(x0,camY+H+400);ctx.closePath();
 const tg=ctx.createLinearGradient(0,camY-100,0,camY+H);tg.addColorStop(0,S.col[1]);tg.addColorStop(1,S.col[2]);ctx.fillStyle=tg;ctx.fill();
 ctx.strokeStyle=S.col[0];ctx.lineWidth=7;ctx.beginPath();for(let x=Math.floor(x0/10)*10;x<=x1;x+=10){const y=T.h(x);x===Math.floor(x0/10)*10?ctx.moveTo(x,y):ctx.lineTo(x,y);}ctx.stroke();
 ctx.strokeStyle='rgba(0,0,0,.18)';ctx.lineWidth=2;for(let x=Math.floor(x0/60)*60;x<=x1;x+=60){const y=T.h(x);ctx.beginPath();ctx.moveTo(x,y+10);ctx.lineTo(x+14,y+45);ctx.stroke();}
 // ramp stripes + gap markers
 for(const r of T.ramps){if(r.x>x1||r.x+r.w<x0)continue;ctx.strokeStyle='#f2ce77';ctx.lineWidth=4;ctx.setLineDash([10,10]);ctx.beginPath();for(let x=r.x;x<=r.x+r.w;x+=8){const y=T.h(x)-4;x===r.x?ctx.moveTo(x,y):ctx.lineTo(x,y);}ctx.stroke();ctx.setLineDash([]);}
 // checkpoints/finish
 for(const c of T.cps){if(c<x0||c>x1)continue;const y=T.h(c),fin=c>=T.len;ctx.strokeStyle='#d9d4e6';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(c,y);ctx.lineTo(c,y-130);ctx.stroke();if(fin){for(let i=0;i<8;i++){ctx.fillStyle=i%2?'#fff':'#1a1226';ctx.fillRect(c+(i%4)*14,y-130+Math.floor(i/4)*14,14,14);}ctx.strokeStyle='#d9d4e6';ctx.beginPath();ctx.moveTo(c+56,y);ctx.lineTo(c+56,y-130);ctx.stroke();N.text(ctx,'FINISH',c+28,y-140,{font:'700 20px Fredoka',align:'center',color:'#fff',stroke:'#1a1226'});}else{ctx.fillStyle=p.x>c?'#91c9a7':'#ef896d';ctx.beginPath();ctx.moveTo(c,y-130);ctx.lineTo(c+50,y-112);ctx.lineTo(c,y-94);ctx.fill();}}
 // barrels
 for(const b of T.barrels){if(b.hit||b.x<x0||b.x>x1)continue;ctx.save();ctx.translate(b.x,b.y);ctx.rotate(b.rot);N.ball(ctx,0,0,b.r,'#c98a5e',{shadow:false});ctx.strokeStyle='#5a3a2a';ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,b.r*.7,0,N.TAU);ctx.stroke();ctx.fillStyle='#5a3a2a';ctx.fillRect(-b.r,-2,b.r*2,4);ctx.restore();}
 for(const d of p.dust){ctx.globalAlpha=d.t*1.4;ctx.fillStyle=S.col[0];ctx.beginPath();ctx.arc(d.x,d.y,5+(0.5-d.t)*10,0,N.TAU);ctx.fill();}ctx.globalAlpha=1;
 p.wang=(p.wang||0)+p.rw*.016;
 if(p.dead<=0||Math.floor(p.t*12)%2)drawBike(ctx,p,0);
 ctx.restore();
 // HUD
 const speed=Math.round(Math.hypot(p.vx,p.vy)*.18);N.chip(ctx,12,10,100,'SPEED',speed+' km/h');N.chip(ctx,122,10,110,'SCORE',a.score,{color:'#ffe08a'});N.chip(ctx,242,10,90,'LIVES','♥'.repeat(Math.max(0,p.lives)),{color:'#ef896d'});
 N.bar(ctx,12,H-22,W-24,10,p.x/T.len,'#ffe08a');N.text(ctx,S.name+' · '+Math.floor(p.x/10)+' / '+(T.len/10|0)+' m',W/2,H-30,{align:'center',font:'700 11px Fredoka',color:'#fff0d4',stroke:'#1a1226',sw:3});
 if(p.msgT>0){ctx.globalAlpha=Math.min(1,p.msgT*2);N.text(ctx,p.msg,W/2,H*.3,{font:'700 '+Math.round(Math.min(W,H)*.07)+'px Fredoka',align:'center',color:'#ffe08a',stroke:'#1a1226',glow:'#ff6f91'});ctx.globalAlpha=1;}
 if(!a.running)N.banner(ctx,W,H,'BARRELSTORM MOTO','Next: '+STAGES[Math.min(2,a.store.get('motoStage',0))].name+' · clear it to unlock the next course');
 N.vignette(ctx,W,H,.25);}
NEXUS_GAMES.register('moto',{meta:{title:'BARRELSTORM MOTO',help:'Trials-style stunt bike. Gas up the hills, brake into landings and lean to level the bike in mid-air. Backflips and front flips score big; barrels slow you down, and a hard wipe-out costs a life. Three courses unlock in order.',controls:'→ gas · ← brake · ↑ lean back · ↓ lean forward',type:'MOTOCROSS'},
 size:[900,520],portraitSize:[900,520],duration:60,tier:1.3,
 touch:[{kind:'btn',side:'left',label:'LEAN ↺',key:'ArrowUp'},{kind:'btn',side:'left',label:'LEAN ↻',key:'ArrowDown'},{kind:'btn',side:'right',label:'BRAKE',key:'ArrowLeft',cls:'alt'},{kind:'btn',side:'right',label:'GAS',key:'ArrowRight',big:true}],
 init,start,update,draw,timeUp});
})();

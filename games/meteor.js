/* games/meteor.js — Neon Nexus cabinet module */
(function(){'use strict';
const N=window.NXG,TAU=Math.PI*2,cl=N.clamp,lerp=N.lerp,R=N.rand,E=N.ease;
const RI=(a,b)=>Math.floor(a+Math.random()*(b-a+1));
const PAL={cream:'#f8e9ca',coral:'#ef896d',mint:'#91c9a7',plum:'#684b62',gold:'#f2ce77',ink:'#1a1226'};
function T(c,t,x,y,s,col,al,o){N.text(c,t,x,y,Object.assign({font:'700 '+s+'px Fredoka, system-ui, sans-serif',color:col||'#fff0d4',align:al||'left',stroke:PAL.ink,sw:Math.max(2,s/6)},o||null));}
function wrap(c,txt,mw,font){c.font=font;const w=txt.split(' '),out=[];let l='';for(const x of w){const t=l?l+' '+x:x;if(c.measureText(t).width>mw&&l){out.push(l);l=x;}else l=t;}if(l)out.push(l);return out;}
/* READY panel: objective + how-to + best */
function readyScreen(c,api,title,obj,how,col,extra){
 const W=api.W,H=api.H,fs=api.portrait?15:16,pw=Math.min(W-30,620);
 c.save();c.fillStyle='rgba(16,10,28,.74)';c.fillRect(0,0,W,H);
 const f='600 '+fs+'px Fredoka, system-ui, sans-serif';let lines=[];
 const ol=wrap(c,obj,pw-48,f);how.forEach(h=>lines.push(...wrap(c,'• '+h,pw-48,f)));
 const ph=Math.min(H-24,92+ol.length*(fs+5)+lines.length*(fs+5)+(extra?30:0)+56),px=(W-pw)/2,py=(H-ph)/2;
 N.slab(c,px,py,pw,ph,24,'#4a3552');
 T(c,title,W/2,py+46,Math.min(40,pw/11),col||PAL.gold,'center',{glow:col||PAL.gold});
 let y=py+78;ol.forEach(l=>{T(c,l,W/2,y,fs,'#fff0d4','center',{font:f,stroke:null});y+=fs+5;});y+=8;
 lines.forEach(l=>{T(c,l,px+26,y,fs,'#d8f0e0','left',{font:f,stroke:null});y+=fs+5;});
 if(extra)T(c,extra,W/2,py+ph-48,fs,PAL.gold,'center',{font:f,stroke:null});
 T(c,api.touch?'PRESS START BELOW':'PRESS START',W/2,py+ph-18,fs+3,PAL.mint,'center',{glow:PAL.mint});
 c.restore();
}
/* cached background */
const BGC={};
function bgCache(key,w,h,fn){let o=BGC[key];if(!o||o.width!==w||o.height!==h){o=document.createElement('canvas');o.width=w;o.height=h;fn(o.getContext('2d'),w,h);BGC[key]=o;}return o;}
function heart(c,x,y,s,col,full){c.save();c.translate(x,y);c.scale(s,s);c.beginPath();c.moveTo(0,.35);c.bezierCurveTo(-1.1,-.35,-.55,-1.05,0,-.45);c.bezierCurveTo(.55,-1.05,1.1,-.35,0,.35);c.closePath();c.fillStyle=full?col:'rgba(20,12,30,.55)';c.fill();c.lineWidth=.12;c.strokeStyle='rgba(30,16,34,.7)';c.stroke();if(full){c.fillStyle='rgba(255,255,255,.5)';c.beginPath();c.ellipse(-.38,-.4,.2,.12,-.6,0,TAU);c.fill();}c.restore();}
function gradeOf(frac,win){const g=win?(frac>=.9?'S':frac>=.65?'A':'B'):(frac>=.6?'B':frac>=.3?'C':'D');return g;}
function topScores(api,s){let t=api.store.get('top',[]);if(!Array.isArray(t))t=[];t.push(Math.round(s));t.sort((a,b)=>b-a);t=t.slice(0,5);api.store.set('top',t);return t;}
const keyIs=(e,...a)=>a.includes(e.key)||a.includes((e.key||'').toLowerCase());
function sfx(api,n){try{N.sfx(api,n);}catch(e){}}
function twinkle(c,w,h,n,seed){const rn=N.mulberry(seed);for(let i=0;i<n;i++){c.globalAlpha=.3+rn()*.7;c.fillStyle='#fff6dd';const s=rn()*1.8+.4;c.beginPath();c.arc(rn()*w,rn()*h*.6,s,0,TAU);c.fill();}c.globalAlpha=1;}
/* ===== METEOR MAYHEM ===== */
let S=null;
const WAVEN=[10,13,16,18,20];
const UPS=[
 {id:'twin',n:'TWIN CANNONS',d:'Fire two parallel shots',c:'#ef896d',max:1},
 {id:'rapid',n:'RAPID FIRE',d:'+30% fire rate',c:'#f2ce77',max:3},
 {id:'dash',n:'OVERDRIVE DASH',d:'Dash recharges 35% faster',c:'#7fb8e8',max:2},
 {id:'magnet',n:'MAGNET CORE',d:'Permanently pull in star shards',c:'#e08ac0',max:2},
 {id:'hull',n:'HULL PLATING',d:'+1 max hull and repair 1',c:'#91c9a7',max:2},
 {id:'pierce',n:'PIERCING ROUNDS',d:'Shots punch through a rock',c:'#b8a0f0',max:1},
 {id:'pulse',n:'SHIELD PULSE',d:'Start every wave with a shield',c:'#5fd0c0',max:1}];
function newState(api){
 const m=api.mastery,W=api.W,H=api.H,hull=3+(api.diff.id==='easy'?1:0)+(m>=2?1:0);
 S={t:0,wave:-1,spawned:0,queue:[],mets:[],bul:[],pick:[],shards:[],fx:[],ship:{x:W/2,y:H*.72,vx:0,vy:0,ang:-Math.PI/2,r:14,inv:0,dash:0,dcd:0,dx:0,dy:-1,flash:0,shield:m>=2?6:0,mag:0,rapid:0},
  hull,maxHull:hull,up:{},fireT:0,combo:0,comboT:0,best:0,phase:'idle',spT:1,cd:0,bannerT:0,banner:'',sub:'',waveT:0,boss:null,bossDead:false,endT:-1,done:false,pend:null,cards:[],clear:-1,
  kills:0,hitsTaken:0,ptr:null,ptrT:0,star:Array.from({length:60},(_,i)=>({x:Math.random(),y:Math.random(),z:.2+Math.random()*.8,s:Math.random()*1.6+.4})),bgT:0,dashes:0,ramKills:0,keys:{}};
}
const hasUp=id=>S.up[id]||0;
function setWave(api,w){
 S.wave=w;S.spawned=0;S.queue.length=0;S.spT=1.2;S.waveT=0;S.clear=-1;S.phase='play';
 S.banner=w>=5?'BOSS: COLOSSUS':'WAVE '+(w+1);S.sub=w>=5?'Break its armor with cannon fire!':w===0?'Dodge, dash and let the cannon work':['Fast comets incoming','Splitting crystals!','Explosive rocks - shoot from afar','Rock storm!'][w-1];S.bannerT=1.7;
 if(hasUp('pulse'))S.ship.shield=Math.max(S.ship.shield,7);
 if(w>api.store.get('stage',0))api.store.set('stage',w);
 api.sound(w>=5?100:500,.2,w>=5?'sawtooth':'triangle',.05);if(w>=5){api.shake(8,.4);spawnBoss(api);}
}
function spawnMeteor(api,type,fromEdge){
 const W=api.W,H=api.H,mul=api.diff.mul,w=Math.min(S.wave,4),sh=S.ship;
 let side=RI(0,3),x,y;const m=60;
 if(side===0){x=R(0,W);y=-m;}else if(side===1){x=W+m;y=R(0,H);}else if(side===2){x=R(0,W);y=H+m;}else{x=-m;y=R(0,H);}
 if(!api.portrait&&(side===1||side===3)&&Math.random()<.4){side=0;x=R(0,W);y=-m;}
 const tx=sh.x+R(-170,170),ty=sh.y+R(-170,170);const d=Math.hypot(tx-x,ty-y)||1;
 let sp=R(70,110)*(1+w*.07)*mul,r=R(24,38),hp=2;
 if(type==='fast'){sp=R(230,290)*Math.sqrt(mul);r=14;hp=1;}
 else if(type==='split'){sp=R(55,80)*mul;r=42;hp=4;}
 else if(type==='bomb'){sp=R(80,105)*mul;r=28;hp=2;}
 else if(type==='gold'){sp=R(90,120);r=22;hp=2;}
 const o={type,x,y,vx:(tx-x)/d*sp,vy:(ty-y)/d*sp,r,hp,max:hp,rot:R(0,TAU),vr:R(-1.2,1.2),flash:0,pts:mkShape(),warn:.9,ent:false,t:0};
 S.queue.push(o);return o;
}
function mkShape(){const n=9,a=[];for(let i=0;i<n;i++)a.push(.82+Math.random()*.3);return a;}
function spawnWaveMeteor(api){
 const w=S.wave,r=Math.random();let type='rock';
 if(w>=1&&r<.2)type='fast';else if(w>=2&&r<.38)type='split';else if(w>=3&&r<.55)type='bomb';else if(w>=4&&r<.62)type='split';
 if(Math.random()<.05)type='gold';
 spawnMeteor(api,type);S.spawned++;
}
function spawnBoss(api){
 const W=api.W,H=api.H,hp=Math.round(46*Math.pow(api.diff.mul,.8));
 S.boss={x:W/2,y:-120,r:84,hp,max:hp,t:0,atk:3,mode:'enter',tt:0,vx:0,vy:0,flash:0,pts:mkShape(),rot:0,tel:0,tx:0,ty:0};
}
function explodeAt(api,x,y,r,dmgPlayer){
 api.burst(x,y,'#ffb060',28);api.shake(12,.35);sfx(api,'boom');S.fx.push({x,y,r,t:.35,max:.35,c:'#ffb060'});
 for(const m of S.mets){if(m.dead)continue;if(Math.hypot(m.x-x,m.y-y)<r+m.r*.5){hurtMeteor(api,m,3,true);}}
 const b=S.boss;if(b&&!S.bossDead&&Math.hypot(b.x-x,b.y-y)<r+b.r)bossDmg(api,3);
 const sh=S.ship;if(dmgPlayer&&Math.hypot(sh.x-x,sh.y-y)<r+sh.r)hitShip(api,x,y);
}
function hurtMeteor(api,m,dmg,chain){
 if(m.dead)return;m.hp-=dmg;m.flash=.12;
 if(m.hp>0){api.burst(m.x,m.y,'#c8b0a0',4);sfx(api,'hit');return;}
 m.dead=1;S.kills++;
 S.combo++;S.comboT=2.2;S.best=Math.max(S.best,S.combo);api.combo=S.combo;
 const mu=1+Math.min(2,Math.floor(S.combo/6)*.5);
 const base={rock:3,fast:3,split:5,bomb:4,gold:8,shard:1}[m.type]||3;
 api.addScore(Math.round(base*mu),m.x,m.y,m.type==='gold'?'#ffe08a':'#fff0d4');
 api.burst(m.x,m.y,m.type==='fast'?'#9ad0f8':m.type==='split'?'#c0a0f0':'#c8a888',m.type==='split'?18:10);sfx(api,'pop');api.shake(3,.1);
 if(m.type==='split'){for(let i=0;i<3;i++){const a=m.rot+i*TAU/3,s=R(140,200),sm={type:'shard',x:m.x,y:m.y,vx:Math.cos(a)*s+m.vx*.3,vy:Math.sin(a)*s+m.vy*.3,r:13,hp:1,max:1,rot:R(0,TAU),vr:R(-3,3),flash:0,pts:mkShape(),warn:0,ent:true,t:0};S.mets.push(sm);}api.popText('SPLIT!',m.x,m.y-m.r,'#c0a0f0');}
 if(m.type==='bomb')explodeAt(api,m.x,m.y,110,true);
 // drops
 const ns=m.type==='gold'?6:m.type==='rock'?RI(1,2):1;for(let i=0;i<ns;i++)S.shards.push({x:m.x,y:m.y,vx:R(-90,90),vy:R(-90,90),t:0,life:7});
 if(Math.random()<(m.type==='gold'?1:.1)){const kinds=['shield','magnet','rapid'];if(S.hull<S.maxHull)kinds.push('heal','heal');S.pick.push({x:m.x,y:m.y,k:kinds[RI(0,kinds.length-1)],t:0,life:9,vx:R(-30,30),vy:R(-30,30)});}
 if(S.combo===15)api.achieve('combo','Meteor Chain',5);
}
function bossDmg(api,d){const b=S.boss;if(!b||S.bossDead||b.mode==='enter')return;b.hp-=d;b.flash=.1;
 if(b.hp<=0){S.bossDead=true;api.addScore(70,b.x,b.y,'#ffe08a');for(let i=0;i<6;i++)setTimeout(()=>{if(S.done)return;api.burst(b.x+R(-60,60),b.y+R(-60,60),'#ffb060',30);sfx(api,'boom');},i*160);api.shake(20,1);S.mets.forEach(m=>{m.dead=1;});S.endT=1.9;api.achieve('boss','Colossus Crusher',10);
  for(let i=0;i<14;i++)S.shards.push({x:b.x,y:b.y,vx:R(-160,160),vy:R(-160,160),t:0,life:9});}
}
function hitShip(api,sx,sy){
 const sh=S.ship;if(sh.inv>0||sh.dash>0||S.done)return;
 if(sh.shield>0){sh.shield=0;sh.inv=1;api.popText('SHIELD BROKEN',sh.x,sh.y-30,'#9de3d1');api.shake(8,.25);sfx(api,'bump');S.fx.push({x:sh.x,y:sh.y,r:80,t:.3,max:.3,c:'#9de3d1'});return;}
 S.hull--;S.hitsTaken++;sh.inv=1.5;sh.flash=.5;S.combo=0;api.combo=0;api.shake(14,.4);sfx(api,'lose');api.burst(sh.x,sh.y,'#ff8a6a',16);
 const dx=sh.x-sx,dy=sh.y-sy,d=Math.hypot(dx,dy)||1;sh.vx+=dx/d*320;sh.vy+=dy/d*320;
 api.popText('HULL HIT',sh.x,sh.y-30,'#ff8a6a');
 if(S.hull<=0){S.phase='dead';S.endT=1.3;api.burst(sh.x,sh.y,'#ffb060',40);sfx(api,'boom');}
}
function fire(api){
 const sh=S.ship;let tgt=null,bd=1e9;
 const cand=(o)=>{const d=Math.hypot(o.x-sh.x,o.y-sh.y);if(o.x<-10||o.x>api.W+10||o.y<-10||o.y>api.H+10)return;const approach=((o.vx||0)*(sh.x-o.x)+(o.vy||0)*(sh.y-o.y))/(d||1);const sc=d-approach*.8;if(d<520&&sc<bd){bd=sc;tgt=o;}};
 for(const m of S.mets)if(!m.dead&&m.ent)cand(m);if(S.boss&&!S.bossDead&&S.boss.mode!=='enter')cand(S.boss);
 if(!tgt)return false;
 const d=Math.hypot(tgt.x-sh.x,tgt.y-sh.y),sp=720,tt=d/sp,px=tgt.x+(tgt.vx||0)*tt,py=tgt.y+(tgt.vy||0)*tt,a=Math.atan2(py-sh.y,px-sh.x);
 const n=hasUp('twin')?2:1;
 for(let i=0;i<n;i++){const off=n===1?0:(i?1:-1)*7;const ox=-Math.sin(a)*off,oy=Math.cos(a)*off;S.bul.push({x:sh.x+Math.cos(a)*16+ox,y:sh.y+Math.sin(a)*16+oy,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,life:.9,pierce:(hasUp('pierce')||api.mastery>=6)?1:0});}
 sh.aim=a;api.sound(700+Math.random()*80,.04,'square',.018);return true;
}
function chooseUpgrades(api){
 const pool=UPS.filter(u=>hasUp(u.id)<u.max&&(u.id!=='hull'||true));const cards=[];
 while(cards.length<3&&pool.length){const i=RI(0,pool.length-1);cards.push(pool.splice(i,1)[0]);}
 S.cards=cards;S.phase='upgrade';
}
function applyUp(api,i){
 const u=S.cards[i];if(!u)return;S.up[u.id]=hasUp(u.id)+1;
 if(u.id==='hull'){S.maxHull++;S.hull=Math.min(S.maxHull,S.hull+1);}
 api.popText(u.n+'!',api.W/2,api.H*.4,u.c);sfx(api,'power');S.phase='play';setWave(api,S.wave+1);
}
function end(api,win){if(S.done)return;S.done=true;topScores(api,api.score);
 if(win&&S.hitsTaken===0)api.achieve('untouched','Untouchable',10);if(S.dashes>=10)api.achieve('dash','Dash Demon',4);
 api.finish(win,{grade:gradeOf(cl(api.score/420,0,1),win)+' · WAVE '+(Math.min(S.wave,5)+1),combo:S.best});}
/* ---------- drawing ---------- */
function bg(c,api){
 const W=api.W,H=api.H;
 const o=bgCache('met'+W+'x'+H,W,H,(g,w,h)=>{N.bgGrad(g,w,h,['#0c0820','#1c1240','#3a1e58']);
  const neb=[['154,100,200',.28,.3,.35],['239,137,109',.14,.75,.3],['127,184,232',.12,.2,.8]];neb.forEach(([col,a,x,y])=>{const r=Math.max(w,h)*.5,gr=g.createRadialGradient(w*x,h*y,0,w*x,h*y,r);gr.addColorStop(0,'rgba('+col+','+a+')');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(0,0,w,h);});
  const px=w*.78,py=h*.2,pr=Math.min(w,h)*.12;const gr=g.createRadialGradient(px-pr*.4,py-pr*.4,pr*.1,px,py,pr);gr.addColorStop(0,'#f6b890');gr.addColorStop(.6,'#c06a6a');gr.addColorStop(1,'#4a2a50');g.fillStyle=gr;g.beginPath();g.arc(px,py,pr,0,TAU);g.fill();g.strokeStyle='rgba(255,220,190,.35)';g.lineWidth=5;g.beginPath();g.ellipse(px,py,pr*1.6,pr*.35,-.3,0,TAU);g.stroke();});
 c.drawImage(o,0,0);
 const sh=S.ship;c.fillStyle='#fff6dd';
 for(const s of S.star){const x=((s.x*W-sh.x*.05*s.z*-1+S.bgT*6*s.z)%W+W)%W,y=((s.y*H-sh.y*.04*s.z*-1+S.bgT*14*s.z)%H+H)%H;c.globalAlpha=.25+s.z*.6;c.fillRect(x,y,s.s,s.s);}
 c.globalAlpha=1;
}
function drawMeteor(c,m,api){
 if(m.dead)return;const r=m.r;c.save();c.translate(m.x,m.y);
 if(m.type==='fast'){const a=Math.atan2(m.vy,m.vx);c.rotate(a);const g=c.createLinearGradient(-r*7,0,0,0);g.addColorStop(0,'rgba(150,210,255,0)');g.addColorStop(1,'rgba(180,230,255,.75)');c.fillStyle=g;c.beginPath();c.moveTo(0,-r);c.lineTo(-r*7,0);c.lineTo(0,r);c.fill();c.rotate(-a);}
 if(m.type==='bomb')N.glow(c,0,0,r*2.2,'#ff6a3a',.35+.25*Math.sin(S.bgT*14));
 if(m.type==='gold')N.glow(c,0,0,r*2.4,'#ffd870',.5);
 c.rotate(m.rot);
 const base={rock:'#8a7468',split:'#7a5a98',fast:'#8ac0e8',bomb:'#b04a38',gold:'#f2ce77',shard:'#9a7ab8'}[m.type];
 c.beginPath();const n=m.pts.length;for(let i=0;i<n;i++){const a=i*TAU/n;c.lineTo(Math.cos(a)*r*m.pts[i],Math.sin(a)*r*m.pts[i]);}c.closePath();
 const g=c.createRadialGradient(-r*.35,-r*.4,r*.1,0,0,r*1.1);g.addColorStop(0,N.shade(base,.45));g.addColorStop(.55,base);g.addColorStop(1,N.shade(base,-.5));c.fillStyle=g;c.fill();c.lineWidth=2.5;c.strokeStyle='rgba(30,16,34,.6)';c.stroke();
 // craters / details
 c.save();c.clip();c.fillStyle='rgba(30,16,30,.28)';c.beginPath();c.arc(r*.25,r*.2,r*.22,0,TAU);c.arc(-r*.3,r*.35,r*.15,0,TAU);c.arc(-r*.1,-r*.3,r*.12,0,TAU);c.fill();
 c.fillStyle='rgba(255,255,255,.22)';c.beginPath();c.ellipse(-r*.3,-r*.4,r*.28,r*.12,-.5,0,TAU);c.fill();
 if(m.type==='split'){c.strokeStyle='#8ae8ff';c.lineWidth=2.5;c.shadowColor='#6ad8ff';c.shadowBlur=8;c.beginPath();c.moveTo(-r*.6,-r*.1);c.lineTo(-r*.1,r*.1);c.lineTo(r*.2,-r*.3);c.moveTo(-r*.1,r*.1);c.lineTo(r*.1,r*.6);c.stroke();}
 if(m.type==='bomb'){c.fillStyle='#ffe0a0';c.beginPath();c.arc(0,0,r*.28,0,TAU);c.fill();c.fillStyle='#e04a30';c.beginPath();c.arc(0,0,r*.16,0,TAU);c.fill();}
 c.restore();
 if(m.flash>0){c.globalAlpha=m.flash*6;c.fillStyle='#fff';c.fill();}
 c.restore();
}
function drawBoss(c,b){
 const r=b.r;c.save();c.translate(b.x,b.y);
 if(b.tel>0){c.strokeStyle='rgba(255,90,70,'+(.4+.3*Math.sin(S.bgT*30))+')';c.lineWidth=6;c.setLineDash([14,10]);c.beginPath();c.moveTo(0,0);c.lineTo(b.tx-b.x,b.ty-b.y);c.stroke();c.setLineDash([]);}
 N.glow(c,0,0,r*1.8,'#ff6a4a',.25+.1*Math.sin(S.bgT*6));
 c.rotate(b.rot);c.beginPath();const n=b.pts.length;for(let i=0;i<n;i++){const a=i*TAU/n;c.lineTo(Math.cos(a)*r*b.pts[i],Math.sin(a)*r*b.pts[i]);}c.closePath();
 const g=c.createRadialGradient(-r*.35,-r*.4,r*.1,0,0,r*1.15);g.addColorStop(0,'#c8a898');g.addColorStop(.5,'#7a5a50');g.addColorStop(1,'#2a1a20');c.fillStyle=g;c.fill();c.lineWidth=4;c.strokeStyle='rgba(30,16,34,.7)';c.stroke();
 c.save();c.clip();c.fillStyle='rgba(20,10,20,.3)';for(let i=0;i<6;i++){const a=i*1.1;c.beginPath();c.arc(Math.cos(a)*r*.5,Math.sin(a)*r*.5,r*(.1+.03*i),0,TAU);c.fill();}c.restore();
 // core
 const ph=1-b.hp/b.max;N.glow(c,0,0,r*.9,'#ff7040',.5+ph*.4);
 c.fillStyle='#ffb070';c.beginPath();c.arc(0,0,r*.28,0,TAU);c.fill();c.fillStyle='#ff4a30';c.beginPath();c.arc(0,0,r*.17,0,TAU);c.fill();
 c.strokeStyle='#ff9a60';c.lineWidth=3;for(let i=0;i<5;i++){const a=i*TAU/5;c.beginPath();c.moveTo(Math.cos(a)*r*.3,Math.sin(a)*r*.3);c.lineTo(Math.cos(a+.2)*r*.75,Math.sin(a+.2)*r*.75);c.stroke();}
 if(b.flash>0){c.globalAlpha=b.flash*7;c.fillStyle='#fff';c.beginPath();c.arc(0,0,r,0,TAU);c.fill();}
 c.restore();
}
function drawShip(c,api){
 const sh=S.ship;if(S.phase==='dead'&&S.endT<1)return;
 c.save();c.translate(sh.x,sh.y);
 if(sh.inv>0&&Math.floor(S.bgT*20)%2&&sh.dash<=0)c.globalAlpha=.4;
 // exhaust
 const sp=Math.hypot(sh.vx,sh.vy),fa=Math.atan2(sh.vy,sh.vx);
 c.save();c.rotate(sh.ang+Math.PI/2);
 const fl=10+sp*.06+(sh.dash>0?30:0)+Math.sin(S.bgT*40)*3;
 const fg=c.createLinearGradient(0,12,0,12+fl);fg.addColorStop(0,'#fff0b0');fg.addColorStop(.4,'#ffa040');fg.addColorStop(1,'rgba(255,80,40,0)');c.fillStyle=fg;c.beginPath();c.moveTo(-6,12);c.lineTo(0,12+fl);c.lineTo(6,12);c.fill();
 c.fillStyle='rgba(20,8,24,.3)';c.beginPath();c.ellipse(4,14,14,6,0,0,TAU);c.fill();
 // fins
 for(const s of[-1,1]){c.fillStyle='#d8604e';c.beginPath();c.moveTo(s*8,-2);c.lineTo(s*22,16);c.lineTo(s*7,12);c.closePath();c.fill();c.strokeStyle='rgba(40,20,30,.6)';c.lineWidth=2;c.stroke();}
 // body
 const g=c.createLinearGradient(-12,0,12,0);g.addColorStop(0,'#a8b8d8');g.addColorStop(.45,'#fff0dc');g.addColorStop(1,'#8090b0');c.fillStyle=g;c.beginPath();c.moveTo(0,-24);c.bezierCurveTo(14,-12,13,6,9,14);c.lineTo(-9,14);c.bezierCurveTo(-13,6,-14,-12,0,-24);c.closePath();c.fill();c.lineWidth=2.5;c.strokeStyle='rgba(40,20,40,.65)';c.stroke();
 c.fillStyle='#ef896d';c.fillRect(-10,6,20,5);
 // cockpit
 const cg=c.createRadialGradient(-2,-9,1,0,-7,8);cg.addColorStop(0,'#e8fbff');cg.addColorStop(.5,'#6ac0e8');cg.addColorStop(1,'#2a5a88');c.fillStyle=cg;c.beginPath();c.ellipse(0,-7,5.5,8,0,0,TAU);c.fill();c.strokeStyle='rgba(30,20,40,.6)';c.lineWidth=1.5;c.stroke();
 c.restore();
 if(sh.flash>0){c.globalAlpha=sh.flash;c.fillStyle='#ff5040';c.beginPath();c.arc(0,0,20,0,TAU);c.fill();c.globalAlpha=1;}
 if(sh.shield>0){const k=sh.shield<2?(Math.floor(S.bgT*10)%2?.4:1):1;c.strokeStyle='rgba(150,255,230,'+.8*k+')';c.lineWidth=3;c.beginPath();c.arc(0,0,27,0,TAU);c.stroke();const sg=c.createRadialGradient(0,0,10,0,0,27);sg.addColorStop(0,'rgba(120,255,220,0)');sg.addColorStop(1,'rgba(120,255,220,'+.3*k+')');c.fillStyle=sg;c.fill();}
 if(sh.mag>0||hasUp('magnet')){c.strokeStyle='rgba(224,138,192,.25)';c.lineWidth=2;c.setLineDash([5,7]);c.beginPath();c.arc(0,0,magR(),0,TAU);c.stroke();c.setLineDash([]);}
 c.restore();
}
const magR=()=>(S.ship.mag>0?200:0)+hasUp('magnet')*60;
function drawHUD(c,api){
 const W=api.W,H=api.H,por=api.portrait,sh=S.ship;
 for(let i=0;i<S.maxHull;i++)heart(c,24+i*32,26,14,'#ef6a6a',i<S.hull);
 N.chip(c,W-250,6,118,'WAVE',S.wave>=5?'BOSS':(Math.min(S.wave,4)+1)+'/5');
 N.chip(c,W-126,6,114,'CHAIN ×'+(1+Math.min(2,Math.floor(S.combo/6)*.5)).toFixed(1),S.combo,{color:S.combo>=12?'#ffe08a':'#fff0d4'});
 // dash meter
 const dk=sh.dcd>0?1-sh.dcd/dashCd(api):1;N.bar(c,14,46,110,8,dk,dk>=1?'#7fb8e8':'#4a6a90');T(c,dk>=1?'DASH READY':'DASH',14,70,11,dk>=1?'#9ad0f8':'#fff0d4','left',{stroke:null});
 let ty=90;
 if(sh.mag>0){N.bar(c,14,ty,110,6,sh.mag/10,'#e08ac0');T(c,'MAGNET',130,ty+7,10,'#e08ac0','left',{stroke:null});ty+=14;}
 if(sh.rapid>0){N.bar(c,14,ty,110,6,sh.rapid/7,'#f2ce77');T(c,'RAPID',130,ty+7,10,'#f2ce77','left',{stroke:null});ty+=14;}
 if(sh.shield>0){N.bar(c,14,ty,110,6,Math.min(1,sh.shield/8),'#5fd0c0');T(c,'SHIELD',130,ty+7,10,'#5fd0c0','left',{stroke:null});ty+=14;}
 // upgrades
 let ux=14;for(const u of UPS){if(hasUp(u.id)){c.fillStyle=u.c;c.beginPath();c.arc(ux+7,H-16,7,0,TAU);c.fill();T(c,String(hasUp(u.id)),ux+7,H-12,10,'#1a1226','center',{stroke:null});ux+=20;}}
 if(S.boss&&!S.bossDead){const bw=Math.min(420,W-60);N.bar(c,(W-bw)/2,por?48:46,bw,14,S.boss.hp/S.boss.max,'#ef6a6a');T(c,'COLOSSUS',W/2,por?60:58,11,'#fff0d4','center',{stroke:null});}
 // warnings
 for(const q of S.queue){if(q.warn>0){const x=cl(q.x,18,W-18),y=cl(q.y,18,H-18);c.save();c.globalAlpha=.5+.5*Math.sin(S.bgT*20);c.fillStyle=q.type==='bomb'?'#ff6a3a':q.type==='fast'?'#9ad0f8':'#ffd070';c.beginPath();const a=Math.atan2(q.vy,q.vx);c.translate(x,y);c.rotate(a);c.moveTo(12,0);c.lineTo(-8,-9);c.lineTo(-8,9);c.fill();c.restore();}}
 if(S.bannerT>0){c.save();c.globalAlpha=Math.min(1,S.bannerT*2);c.fillStyle='rgba(18,12,30,.58)';c.fillRect(0,H*.34,W,H*.2);T(c,S.banner,W/2,H*.44,Math.min(W,540)/10,S.wave>=5?'#ef896d':'#ffe08a','center',{glow:S.wave>=5?'#ef896d':'#ffe08a'});T(c,S.sub,W/2,H*.5,17,'#fff0d4','center',{stroke:null});c.restore();}
}
function drawUpgrade(c,api){
 const W=api.W,H=api.H,por=api.portrait;c.fillStyle='rgba(14,8,28,.72)';c.fillRect(0,0,W,H);
 T(c,'WAVE CLEARED',W/2,por?90:70,por?32:38,PAL.gold,'center',{glow:PAL.gold});T(c,'Choose an upgrade ('+(api.touch?'tap':'1 / 2 / 3')+')',W/2,por?118:98,15,'#fff0d4','center',{stroke:null});
 const cw=por?W-40:250,ch=por?170:250,gap=16,sx=por?20:(W-(cw*3+gap*2))/2,sy=por?150:130;S.cr=[];
 S.cards.forEach((u,i)=>{const x=por?sx:sx+i*(cw+gap),y=por?sy+i*(ch+gap):sy;S.cr.push({x,y,w:cw,h:ch});
  N.slab(c,x,y,cw,ch,20,N.mix(u.c,'#3a2540',.6),{depth:8});c.strokeStyle=u.c;c.lineWidth=3;N.rr(c,x,y,cw,ch,20);c.stroke();
  T(c,String(i+1),x+22,y+40,32,u.c,'left',{stroke:null});
  c.save();c.translate(x+cw/2,y+(por?58:90));N.ball(c,0,0,26,u.c,{shadow:false});c.restore();
  T(c,u.n,x+cw/2,y+(por?112:150),19,'#fff0d4','center',{stroke:null});T(c,u.d,x+cw/2,y+(por?138:178),14,'#d8c8e8','center',{stroke:null});
  T(c,'LV '+hasUp(u.id)+' → '+(hasUp(u.id)+1),x+cw/2,y+ch-18,12,u.c,'center',{stroke:null});});
}
const dashCd=api=>1.9*(1-.35*hasUp('dash'))*(api.mastery>=4?.75:1);
function doDash(api){
 const sh=S.ship;if(sh.dcd>0||S.phase!=='play')return;
 let dx=ix(api),dy=iy(api);if(!dx&&!dy){const sp=Math.hypot(sh.vx,sh.vy);if(sp>20){dx=sh.vx/sp;dy=sh.vy/sp;}else{dx=0;dy=-1;}}
 const d=Math.hypot(dx,dy)||1;sh.vx=dx/d*780;sh.vy=dy/d*780;sh.dash=.22;sh.dcd=dashCd(api);sh.inv=Math.max(sh.inv,.3);S.dashes++;sfx(api,'whoosh');api.burst(sh.x,sh.y,'#9ad0f8',10);
}
function ix(api){let x=0;if(S.keys.ArrowLeft||S.keys.a)x-=1;if(S.keys.ArrowRight||S.keys.d)x+=1;if(!x&&api.stick&&Math.abs(api.stick.x)>.12)x=api.stick.x;return x;}
function iy(api){let y=0;if(S.keys.ArrowUp||S.keys.w)y-=1;if(S.keys.ArrowDown||S.keys.s)y+=1;if(!y&&api.stick&&Math.abs(api.stick.y)>.12)y=api.stick.y;return y;}
NEXUS_GAMES.register('meteor',{
 dbg:()=>S,jump(w){setWave(NEXUS_ARCADE_API,w);},
 meta:{title:'Meteor Mayhem',help:'Pilot your ship through the meteor storm. The cannon auto-targets - you steer, dash and grab pickups.',controls:'WASD / ARROWS fly · SPACE dash · hold mouse to steer, click to dash',type:'DODGE · SURVIVE'},
 size:[900,520],portraitSize:[540,860],duration:170,tier:1.1,
 touch:[{kind:'stick',side:'left'},{kind:'btn',side:'right',label:'DASH',key:' ',big:true,cls:'alt'}],
 init(api){newState(api);},
 start(api){newState(api);setWave(api,0);},
 update(dt,api){
  const W=api.W,H=api.H,sh=S.ship,mul=api.diff.mul;S.t+=dt;S.bgT+=dt;
  if(S.bannerT>0)S.bannerT-=dt;
  if(S.phase==='upgrade'){api.time=api.time+dt;return;}
  if(S.endT>=0){S.endT-=dt;if(S.endT<0)end(api,S.bossDead);}
  if(S.done)return;
  // timers
  if(sh.inv>0)sh.inv-=dt;if(sh.flash>0)sh.flash-=dt;if(sh.dcd>0)sh.dcd-=dt;if(sh.dash>0)sh.dash-=dt;if(sh.shield>0)sh.shield-=dt;if(sh.mag>0)sh.mag-=dt;if(sh.rapid>0)sh.rapid-=dt;
  if(S.comboT>0){S.comboT-=dt;if(S.comboT<=0){S.combo=0;api.combo=0;}}
  // steering
  let dx=ix(api),dy=iy(api);
  if(S.ptr&&S.ptrT>.18&&!dx&&!dy){const vx=S.ptr.x-sh.x,vy=S.ptr.y-sh.y,d=Math.hypot(vx,vy);if(d>14){dx=vx/d*Math.min(1,d/90);dy=vy/d*Math.min(1,d/90);}}
  if(S.ptr)S.ptrT+=dt;
  if(S.phase==='play'||S.phase==='dead'){
   const m=Math.hypot(dx,dy);if(m>1){dx/=m;dy/=m;}
   if(S.phase==='dead'){dx=dy=0;}
   if(sh.dash<=0){sh.vx+=dx*1100*dt;sh.vy+=dy*1100*dt;const sp=Math.hypot(sh.vx,sh.vy),mx=300;if(sp>mx){const k=Math.max(mx/sp,1-dt*5);sh.vx*=k;sh.vy*=k;}}
   const damp=Math.exp(-(m>.1?1.2:2.6)*dt);sh.vx*=damp;sh.vy*=damp;
   sh.x+=sh.vx*dt;sh.y+=sh.vy*dt;
   if(sh.x<16){sh.x=16;sh.vx=Math.abs(sh.vx)*.4;}if(sh.x>W-16){sh.x=W-16;sh.vx=-Math.abs(sh.vx)*.4;}if(sh.y<56){sh.y=56;sh.vy=Math.abs(sh.vy)*.4;}if(sh.y>H-16){sh.y=H-16;sh.vy=-Math.abs(sh.vy)*.4;}
   const sp=Math.hypot(sh.vx,sh.vy);const want=sp>25?Math.atan2(sh.vy,sh.vx):(sh.aim!==undefined?sh.aim:-Math.PI/2);let da=want-sh.ang;da=Math.atan2(Math.sin(da),Math.cos(da));sh.ang+=da*Math.min(1,dt*9);
   if(sh.dash>0&&Math.random()<.7)api.burst(sh.x,sh.y,'#9ad0f8',1);
  }
  // spawning
  if(S.phase==='play'){
   S.waveT+=dt;
   if(S.wave<5){
    if(S.spawned<WAVEN[S.wave]){S.spT-=dt;if(S.spT<=0){S.spT=lerp(1.5,.75,Math.min(1,S.wave/4))/Math.pow(mul,.7)*R(.7,1.25);spawnWaveMeteor(api);if(S.wave>=3&&Math.random()<.35){spawnWaveMeteor(api);}}}
    else if(S.mets.filter(m=>!m.dead&&m.type!=='shard').length===0&&S.queue.length===0||S.waveT>40){
     if(S.clear<0){S.clear=1.0;api.addScore(10+S.wave*2,W/2,H*.4,'#9de3d1');api.popText('WAVE CLEAR',W/2,H*.35,'#fff0d4');sfx(api,'win');S.mets.forEach(m=>{if(m.type!=='shard')m.vx*=1;});}
     else{S.clear-=dt;if(S.clear<=0){if(S.wave===4){setWave(api,5);}else chooseUpgrades(api);}}}
   }else if(!S.bossDead){
    const b=S.boss;b.t+=dt;b.rot+=dt*.3;if(b.flash>0)b.flash-=dt;
    const ph=b.hp/b.max;
    if(b.mode==='enter'){b.y+=(H*.22-b.y)*Math.min(1,dt*2.5);if(Math.abs(b.y-H*.22)<6){b.mode='orbit';b.atk=1.5;}}
    else if(b.mode==='orbit'){b.x=W/2+Math.sin(b.t*.55)*W*.3;b.y=H*.22+Math.sin(b.t*1.1)*H*.06;b.atk-=dt;
     if(b.atk<=0){const k=Math.random();if(k<.4){b.mode='volley';b.tt=.5;}else if(k<.75||ph>.7){b.mode='tel';b.tel=1;b.tt=1;b.tx=sh.x;b.ty=sh.y;}else{b.mode='bombs';b.tt=.4;}}}
    else if(b.mode==='volley'){b.tt-=dt;if(b.tt<=0){const n=ph<.5?7:5,a0=Math.atan2(sh.y-b.y,sh.x-b.x);for(let i=0;i<n;i++){const a=a0+(i-(n-1)/2)*.28,sp=R(150,190)*Math.sqrt(mul);S.mets.push({type:'rock',x:b.x,y:b.y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,r:20,hp:1,max:1,rot:0,vr:R(-2,2),flash:0,pts:mkShape(),warn:0,ent:true,t:0});}sfx(api,'shot');api.shake(5,.2);b.mode='orbit';b.atk=(ph<.5?1.4:2.2)/Math.sqrt(mul);}}
    else if(b.mode==='tel'){b.tel=b.tt;b.tt-=dt;if(b.tt<=0){const d=Math.hypot(b.tx-b.x,b.ty-b.y)||1;b.vx=(b.tx-b.x)/d*620;b.vy=(b.ty-b.y)/d*620;b.mode='charge';b.tt=.9;b.tel=0;sfx(api,'whoosh');}}
    else if(b.mode==='charge'){b.tt-=dt;b.x+=b.vx*dt;b.y+=b.vy*dt;b.vx*=.97;b.vy*=.97;if(b.x<60||b.x>W-60){b.vx*=-.5;b.x=cl(b.x,60,W-60);}if(b.y<60||b.y>H-60){b.vy*=-.5;b.y=cl(b.y,60,H-60);}if(b.tt<=0){b.mode='ret';}}
    else if(b.mode==='ret'){const tx=W/2,ty=H*.22;b.x+=(tx-b.x)*Math.min(1,dt*1.6);b.y+=(ty-b.y)*Math.min(1,dt*1.6);if(Math.hypot(b.x-tx,b.y-ty)<20){b.mode='orbit';b.atk=1.3/Math.sqrt(mul);}}
    else if(b.mode==='bombs'){b.tt-=dt;if(b.tt<=0){for(let i=0;i<3;i++){const a=Math.PI/2+(i-1)*.7,sp=R(100,130);S.mets.push({type:'bomb',x:b.x,y:b.y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,r:26,hp:2,max:2,rot:0,vr:2,flash:0,pts:mkShape(),warn:0,ent:true,t:0});}b.mode='orbit';b.atk=2/Math.sqrt(mul);}}
    if(!S.bossDead&&b.mode!=='enter'&&Math.hypot(sh.x-b.x,sh.y-b.y)<b.r*.9+sh.r){if(sh.dash>0){bossDmg(api,2);sh.vx*=-.5;sh.vy*=-.5;sh.dash=0;api.shake(10,.2);}else hitShip(api,b.x,b.y);}
   }
  }
  // fire
  S.fireT-=dt;if(S.fireT<=0&&S.phase==='play'){const rate=.46/(1+.3*hasUp('rapid'))/(sh.rapid>0?1.8:1);if(fire(api))S.fireT=rate;else S.fireT=.1;}
  // queue
  for(let i=S.queue.length-1;i>=0;i--){const q=S.queue[i];q.warn-=dt;if(q.warn<=0){S.queue.splice(i,1);S.mets.push(q);}}
  // meteors
  for(const m of S.mets){if(m.dead)continue;m.t+=dt;m.x+=m.vx*dt;m.y+=m.vy*dt;m.rot+=m.vr*dt;if(m.flash>0)m.flash-=dt;
   if(!m.ent&&m.x>-m.r&&m.x<W+m.r&&m.y>-m.r&&m.y<H+m.r)m.ent=true;
   if(m.ent&&(m.x<-120||m.x>W+120||m.y<-120||m.y>H+120)){m.dead=2;continue;}
   if(m.t>14&&!m.ent)m.dead=2;
   // collide ship
   const d=Math.hypot(m.x-sh.x,m.y-sh.y);
   if(d<m.r*.85+sh.r&&S.phase==='play'){
    if(sh.dash>0){if(m.type==='bomb'){hurtMeteor(api,m,9);}else{hurtMeteor(api,m,m.type==='split'?2:3);S.ramKills++;}sh.vx*=.7;sh.vy*=.7;if(S.ramKills===5)api.achieve('ram','Rock Ram',3);}
    else if(m.type==='bomb'){m.dead=0;hurtMeteor(api,m,9);}
    else{hitShip(api,m.x,m.y);m.dead=1;api.burst(m.x,m.y,'#c8a888',10);}
   }
  }
  // mets collide w/ each other lightly: skip
  for(let i=S.mets.length-1;i>=0;i--)if(S.mets[i].dead)S.mets.splice(i,1);
  // bullets
  for(let i=S.bul.length-1;i>=0;i--){const b=S.bul[i];b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;let rm=b.life<=0||b.x<-20||b.x>W+20||b.y<-20||b.y>H+20;
   if(!rm){for(const m of S.mets){if(m.dead||!m.ent&&m.type!=='shard')continue;if(Math.hypot(m.x-b.x,m.y-b.y)<m.r+4){hurtMeteor(api,m,1);if(b.pierce>0){b.pierce--;}else rm=true;break;}}}
   if(!rm&&S.boss&&!S.bossDead&&S.boss.mode!=='enter'&&Math.hypot(S.boss.x-b.x,S.boss.y-b.y)<S.boss.r*.9){bossDmg(api,1);api.burst(b.x,b.y,'#ffb070',3);rm=true;}
   if(rm)S.bul.splice(i,1);}
  // shards
  const mr=magR();
  for(let i=S.shards.length-1;i>=0;i--){const s=S.shards[i];s.t+=dt;s.x+=s.vx*dt;s.y+=s.vy*dt;s.vx*=.96;s.vy*=.96;
   const d=Math.hypot(sh.x-s.x,sh.y-s.y);if(mr&&d<mr&&d>1){s.x+=(sh.x-s.x)/d*380*dt;s.y+=(sh.y-s.y)/d*380*dt;}
   if(d<sh.r+10&&S.phase==='play'){S.shards.splice(i,1);api.addScore(1);api.sound(1000+Math.random()*300,.03,'sine',.03);api.burst(s.x,s.y,'#ffe08a',2);continue;}
   if(s.t>s.life)S.shards.splice(i,1);}
  // pickups
  for(let i=S.pick.length-1;i>=0;i--){const p=S.pick[i];p.t+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;const d=Math.hypot(sh.x-p.x,sh.y-p.y);
   if(d<sh.r+16&&S.phase==='play'){S.pick.splice(i,1);
    if(p.k==='shield'){sh.shield=8;api.popText('SHIELD',p.x,p.y,'#5fd0c0');}else if(p.k==='magnet'){sh.mag=10;api.popText('MAGNET',p.x,p.y,'#e08ac0');}else if(p.k==='rapid'){sh.rapid=7;api.popText('RAPID FIRE',p.x,p.y,'#f2ce77');}else{S.hull=Math.min(S.maxHull,S.hull+1);api.popText('+1 HULL',p.x,p.y,'#91c9a7');}
    sfx(api,'power');api.burst(p.x,p.y,'#fff',10);continue;}
   if(p.t>p.life)S.pick.splice(i,1);}
  for(let i=S.fx.length-1;i>=0;i--){S.fx[i].t-=dt;if(S.fx[i].t<=0)S.fx.splice(i,1);}
 },
 draw(c,api){
  if(!S)return;bg(c,api);
  for(const s of S.shards){const k=s.t>s.life-1.5?(Math.floor(S.bgT*14)%2?.3:1):1;c.save();c.globalAlpha=k;c.translate(s.x,s.y);c.rotate(S.bgT*4+s.x);c.fillStyle='#ffe08a';c.beginPath();c.moveTo(0,-6);c.lineTo(4,0);c.lineTo(0,6);c.lineTo(-4,0);c.fill();c.fillStyle='rgba(255,255,255,.7)';c.fillRect(-1,-4,2,3);c.restore();}
  for(const p of S.pick){const col={shield:'#5fd0c0',magnet:'#e08ac0',rapid:'#f2ce77',heal:'#ef6a6a'}[p.k];const k=p.t>p.life-2?(Math.floor(S.bgT*12)%2?.3:1):1;c.save();c.globalAlpha=k;N.glow(c,p.x,p.y,30,col,.6);N.ball(c,p.x,p.y+Math.sin(S.bgT*5+p.x)*2,13,col,{shadow:false});c.fillStyle='#fff0d4';c.font='700 12px Fredoka, sans-serif';c.textAlign='center';c.fillText({shield:'S',magnet:'M',rapid:'R',heal:'+'}[p.k],p.x,p.y+4);c.restore();}
  for(const m of S.mets)drawMeteor(c,m,api);
  if(S.boss&&!S.bossDead)drawBoss(c,S.boss);
  for(const b of S.bul){c.save();c.fillStyle='#fff0b0';N.glow(c,b.x,b.y,10,'#ffd070',.8);c.beginPath();c.arc(b.x,b.y,3.5,0,TAU);c.fill();c.restore();}
  for(const f of S.fx){const k=1-f.t/f.max;c.save();c.globalAlpha=1-k;c.strokeStyle=f.c;c.lineWidth=6*(1-k)+1;c.beginPath();c.arc(f.x,f.y,f.r*k,0,TAU);c.stroke();c.restore();}
  drawShip(c,api);
  if(api.running){drawHUD(c,api);if(S.phase==='upgrade')drawUpgrade(c,api);}
  N.vignette(c,api.W,api.H,.4);
  if(!api.running){readyScreen(c,api,'METEOR MAYHEM','Survive five meteor waves, grabbing power-ups and upgrades, then destroy the Colossus asteroid before your hull runs out.',[
   'Fly with WASD / arrows (or the stick). Your ship has real momentum.','The cannon auto-targets; position yourself and dash through danger (Space).','Fast comets, splitting crystals and EXPLOSIVE rocks - watch the warning arrows.','Collect star shards, shields, magnets and rapid-fire. Pick an upgrade after each wave.','Boss: dodge volleys and charges while the cannon cracks its core.'],PAL.coral,
   'BEST '+(api.store.get('top',[])[0]||0)+' · FURTHEST WAVE '+(api.store.get('stage',0)+1));}
 },
 pointerdown(x,y,e,api){
  if(S.phase==='upgrade'){(S.cr||[]).forEach((cd,i)=>{if(x>=cd.x&&x<=cd.x+cd.w&&y>=cd.y&&y<=cd.y+cd.h)applyUp(api,i);});return;}
  S.ptr={x,y};S.ptrT=0;
 },
 pointermove(x,y,e,api){if(S.ptr){S.ptr.x=x;S.ptr.y=y;}},
 pointerup(x,y,e,api){if(S.ptr&&S.ptrT<=.18)doDash(api);S.ptr=null;},
 keydown(e,api){
  const k=e.key;
  if(S.phase==='upgrade'){if(['1','2','3'].includes(k))applyUp(api,+k-1);return;}
  if(k===' ')doDash(api);else S.keys[k.length===1?k.toLowerCase():k]=true;
 },
 keyup(e,api){S.keys[e.key.length===1?e.key.toLowerCase():e.key]=false;},
 timeUp(api){end(api,false);}
});
})();

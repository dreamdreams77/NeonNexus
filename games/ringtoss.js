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
/* ---------- claymation kit (matte plasticine, wobbly ink, thumb dents, coil trim, 12fps stop-motion) ---------- */
const INK=N.INK,TAU=N.TAU;
function toHex(c){if(c[0]==='#')return c.length===4?'#'+c[1]+c[1]+c[2]+c[2]+c[3]+c[3]:c;const m=c.match(/[\d.]+/g);return'#'+m.slice(0,3).map(v=>Math.round(+v).toString(16).padStart(2,'0')).join('');}
const sh=(col,t)=>N.shade(toHex(N.mix(toHex(col),'#8f7c78',.2)),t);
const SPR={};
function spr(key,w,h,fn){let c=SPR[key];if(!c){c=document.createElement('canvas');c.width=Math.ceil(w);c.height=Math.ceil(h);fn(c.getContext('2d'),c.width,c.height);SPR[key]=c;}return c;}
function wobLoop(c,cx,cy,rx,ry,seed,amp){const R=N.mulberry(seed|0),k=26,ph=R()*6.28;c.beginPath();for(let i=0;i<=k;i++){const a=i/k*TAU,j=1+Math.sin(a*3+ph)*amp+(R()-.5)*amp*.8,px=cx+Math.cos(a)*rx*j,py=cy+Math.sin(a)*ry*j;i?c.lineTo(px,py):c.moveTo(px,py);}c.closePath();}
function inkWob(c,cx,cy,rx,ry,seed,w){c.save();c.lineJoin='round';c.strokeStyle=INK;c.lineWidth=w;wobLoop(c,cx,cy,rx,ry,seed,.035);c.stroke();c.lineWidth=w*.5;c.globalAlpha=.55;wobLoop(c,cx,cy,rx,ry,seed+7,.045);c.stroke();c.restore();}
function matte(c,col,x,y,r){const g=c.createRadialGradient(x-r*.3,y-r*.35,r*.1,x,y,r*1.15);g.addColorStop(0,sh(col,.18));g.addColorStop(.6,col);g.addColorStop(1,sh(col,-.32));return g;}
function soft(c,x,y,r,a=.3){const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,'rgba(255,244,222,'+a+')');g.addColorStop(1,'rgba(255,244,222,0)');c.fillStyle=g;c.beginPath();c.arc(x,y,r,0,TAU);c.fill();}
function claySurface(c,w,h,seed,dn){const R=N.mulberry(seed|0);c.save();c.globalCompositeOperation='source-atop';
 const n=Math.min(2200,w*h/36);for(let i=0;i<n;i++){c.fillStyle=R()>.5?'rgba(255,240,214,'+(.05+R()*.1)+')':'rgba(40,20,40,'+(.05+R()*.1)+')';c.fillRect(R()*w,R()*h,1+R()*1.4,1+R()*1.2);}
 for(let i=0;i<dn;i++){const x=R()*w,y=R()*h,r=Math.min(Math.min(w,h)*.07,9)*(.6+R()*.7)+2;c.fillStyle='rgba(40,18,40,.17)';c.beginPath();c.ellipse(x+r*.12,y+r*.14,r,r*.8,.5,0,TAU);c.fill();c.fillStyle='rgba(255,240,214,.15)';c.beginPath();c.ellipse(x-r*.12,y-r*.14,r*.9,r*.7,.5,0,TAU);c.fill();c.strokeStyle='rgba(40,18,40,.2)';c.lineWidth=.9;for(let k=1;k<4;k++){c.beginPath();c.ellipse(x,y,r*k*.24,r*k*.19,.5,.4,4.2);c.stroke();}}
 c.restore();}
function seam(c,x1,y1,x2,y2,w){c.save();c.lineCap='round';const n=Math.max(2,Math.ceil(Math.hypot(x2-x1,y2-y1)/10));for(const [o,col,lw] of[[1,'rgba(36,16,36,.5)',w],[-1,'rgba(255,240,214,.24)',w*.7]]){c.strokeStyle=col;c.lineWidth=lw;c.beginPath();for(let i=0;i<=n;i++){const t=i/n,px=x1+(x2-x1)*t+Math.sin(i*2.1+x1)*.8,py=y1+(y2-y1)*t+Math.cos(i*1.7+y1)*.8+o*.8;i?c.lineTo(px,py):c.moveTo(px,py);}c.stroke();}c.restore();}
function coilLine(c,pts,w,col){const P=()=>{c.beginPath();pts.forEach((q,i)=>i?c.lineTo(q[0],q[1]):c.moveTo(q[0],q[1]));};c.save();c.lineCap='round';c.lineJoin='round';
 P();c.strokeStyle=INK;c.lineWidth=w+3;c.stroke();P();c.strokeStyle=col;c.lineWidth=w;c.stroke();P();c.strokeStyle=sh(col,-.3);c.lineWidth=w;c.setLineDash([1.6,w*.55]);c.stroke();c.setLineDash([]);P();c.strokeStyle='rgba(255,240,214,.16)';c.lineWidth=w*.4;c.stroke();c.restore();}
function wobRR(c,x,y,w,h,r,seed){const R=N.mulberry(seed|0),j=()=>(R()-.5)*1.6;c.beginPath();c.roundRect(x+j(),y+j(),w+j(),h+j(),r);}
function claySlab(c,x,y,w,h,r,col,lw=2.2,seed=3){c.fillStyle=col;N.rr(c,x,y,w,h,r);c.fill();const g=c.createLinearGradient(0,y,0,y+h);g.addColorStop(0,'rgba(255,240,214,.2)');g.addColorStop(.55,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(30,10,30,.28)');c.fillStyle=g;N.rr(c,x,y,w,h,r);c.fill();
 soft(c,x+w*.3,y+h*.3,Math.min(w,h)*.7,.18);c.strokeStyle=INK;c.lineJoin='round';c.lineWidth=lw;wobRR(c,x,y,w,h,r,seed);c.stroke();c.globalAlpha=.5;c.lineWidth=lw*.5;wobRR(c,x,y,w,h,r,seed+5);c.stroke();c.globalAlpha=1;}
/* baked clay plaque with coil trim; returns a sprite with 10px margin */
function plaque(w,h,r,col,seed){return spr('pq'+w+'_'+h+col+seed,w+20,h+20,(c,W,H)=>{c.save();c.translate(10,10);c.fillStyle='rgba(30,12,36,.4)';N.rr(c,2,5,w,h,r);c.fill();claySlab(c,0,0,w,h,r,col,2.4,seed);N.coil(c,3,3,w-6,h-6,Math.max(4,r-3));c.restore();claySurface(c,W,H,seed,3);});}
const T12=t=>Math.floor(t*12)/12;
function jit(t,k,a=.7){const q=Math.floor(t*12);return[Math.sin(q*12.9+k*7.1)*a,Math.cos(q*9.7+k*3.3)*a];}
function glowSpr(col,r){r=Math.round(r/4)*4||4;return spr('g'+col+r,r*2,r*2,(c,w)=>{const g=c.createRadialGradient(r,r,0,r,r,r);g.addColorStop(0,col);g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.fillRect(0,0,w,w);});}
function glowAt(ctx,x,y,r,col,a){const s=glowSpr(col,r);ctx.globalAlpha=a*.6;ctx.globalCompositeOperation='lighter';ctx.drawImage(s,x-s.width/2,y-s.height/2);ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;}
const RC=['#d98a70','#e0b870','#8fb89c','#8fa9c4'];
function ringSpr(col,r){r=Math.max(6,Math.round(r));const S=r*2+Math.ceil(r*.7)+10;return spr('rg'+col+r,S,S,(c)=>{const x=S/2,y=S/2,lw=r*.4;
  const arc=()=>{wobLoop(c,x,y,r,r,r*3,.025);};
  c.lineCap='round';arc();c.strokeStyle=INK;c.lineWidth=lw+3.6;c.stroke();arc();c.strokeStyle=col;c.lineWidth=lw;c.stroke();
  arc();c.strokeStyle='rgba(30,12,36,.3)';c.lineWidth=lw*.45;c.save();c.translate(0,lw*.12);c.stroke();c.restore();
  // rolled-coil twist lines + soft broad highlight
  c.save();c.strokeStyle=sh(col,-.38);c.lineWidth=1.4;for(let k=0;k<Math.round(r*.9);k++){const a=k/Math.round(r*.9)*TAU,cx=Math.cos(a),cy=Math.sin(a);c.beginPath();c.moveTo(x+cx*(r-lw*.5),y+cy*(r-lw*.5));c.lineTo(x+cx*(r+lw*.5)+cy*lw*.25,y+cy*(r+lw*.5)-cx*lw*.25);c.stroke();}c.restore();
  arc();c.strokeStyle='rgba(255,240,214,.16)';c.lineWidth=lw*.5;c.save();c.translate(-lw*.1,-lw*.18);c.stroke();c.restore();
  seam(c,x+r-lw*.5,y-lw*.1,x+r+lw*.5,y+lw*.12,1.8);
  claySurface(c,S,S,r*7,2);});}
function drawRing(ctx,x,y,r,col,tilt,alpha){if(!isFinite(r)||!isFinite(x)||!isFinite(y)||!isFinite(tilt)||r<=0)return;r=Math.min(r,160);const s=ringSpr(col,r);ctx.save();if(alpha!==undefined&&alpha<1)ctx.globalAlpha=Math.max(0,alpha);ctx.translate(x,y);ctx.scale(1,tilt);ctx.drawImage(s,-s.width/2,-s.height/2);ctx.restore();}
function plateSpr(col2,r){r=Math.round(r);return spr('pl'+col2+r,r*2+8,r*2+8,(c,w)=>{const x=r+4,y=r+4;c.fillStyle=INK;wobLoop(c,x,y,r,r,r,.03);c.fill();
  for(let i=0;i<8;i++){c.fillStyle=i%2?col2:'#e8d8b8';c.beginPath();c.moveTo(x,y);c.arc(x,y,r-2.4,i*TAU/8,(i+1)*TAU/8);c.closePath();c.fill();seam(c,x,y,x+Math.cos(i*TAU/8)*(r-3),y+Math.sin(i*TAU/8)*(r-3),1.4);}
  soft(c,x-r*.3,y-r*.35,r,.2);coilLine(c,[[x+r-3,y],[x+r-3,y+.01]],1,'#c89a5a');c.beginPath();c.arc(x,y,r-2,0,TAU);c.strokeStyle='#c89a5a';c.lineWidth=Math.max(3,r*.1);c.stroke();c.setLineDash([1.5,r*.07]);c.strokeStyle='rgba(60,30,20,.5)';c.stroke();c.setLineDash([]);
  c.fillStyle='#c89a5a';wobLoop(c,x,y,r*.26,r*.26,r,.05);c.fill();c.strokeStyle=INK;c.lineWidth=1.6;c.stroke();claySurface(c,w,w,r*5,3);});}
function pegSpr(gold,w,h){w=Math.round(w);h=Math.round(h);const br=w*1.3,S=h+br*2+8;return spr('pg'+gold+w+'_'+h,w*4+8,S,(c,W)=>{const x=w*2+4,yb=S-4,yt=yb-h,base=gold?'#e0b870':'#d8c8b0';
  c.beginPath();c.moveTo(x-w,yb);c.lineTo(x-w*.9,yt);c.lineTo(x+w*.9,yt);c.lineTo(x+w,yb);c.closePath();c.fillStyle=base;c.fill();const g=c.createLinearGradient(x-w,0,x+w,0);g.addColorStop(0,'rgba(255,240,214,.22)');g.addColorStop(.5,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(30,10,30,.3)');c.fillStyle=g;c.fill();c.strokeStyle=INK;c.lineWidth=2.2;c.lineJoin='round';c.stroke();
  // pressed clay stripes (rolled bands)
  for(let k=0;k<3;k++){const yy=yt+h*(.2+k*.27),hh=h*.13;c.fillStyle=gold?'#d98a70':'#d98a70';c.beginPath();c.roundRect(x-w*1.04,yy,w*2.08,hh,hh*.4);c.fill();c.strokeStyle=INK;c.lineWidth=1.8;c.stroke();seam(c,x-w,yy+hh*.5,x+w,yy+hh*.5+1,1.2);}
  c.fillStyle=matte(c,gold?'#e0b870':'#e8d8b8',x,yt,br);wobLoop(c,x,yt,br,br,w*7,.05);c.fill();soft(c,x-br*.3,yt-br*.35,br,.3);inkWob(c,x,yt,br,br,w*5,2.2);claySurface(c,W,S,w*3+gold,4);});}
function prizeSpr(k,r){r=Math.round(r);return spr('pz'+k+r,r*3.2,r*3.2,(c,S)=>{const x=S/2,y=S/2+r*.2;c.lineJoin='round';
  if(k===0){N.blob(c,x-r*.7,y-r*.8,r*.34,'#a8714a',3,{shadow:false,noShine:true});N.blob(c,x+r*.7,y-r*.8,r*.34,'#a8714a',4,{shadow:false,noShine:true});N.blob(c,x,y,r*1.05,'#c28a5a',5,{shadow:false,noShine:true});N.blob(c,x,y+r*.3,r*.5,'#e9c9a0',6,{shadow:false,noShine:true});c.fillStyle=INK;c.beginPath();c.arc(x-r*.34,y-r*.2,r*.1,0,TAU);c.arc(x+r*.34,y-r*.2,r*.1,0,TAU);c.arc(x,y+r*.18,r*.12,0,TAU);c.fill();}
  else if(k===1){N.blob(c,x-r*.35,y-r*1.15,r*.28,'#f4dede',3,{shadow:false,sy:2,noShine:true});N.blob(c,x+r*.35,y-r*1.15,r*.28,'#f4dede',4,{shadow:false,sy:2,noShine:true});N.blob(c,x,y,r*.98,'#f6e6e6',7,{shadow:false,noShine:true});c.fillStyle='#ef9ab0';c.beginPath();c.arc(x,y+r*.2,r*.12,0,TAU);c.fill();c.fillStyle=INK;c.beginPath();c.arc(x-r*.32,y-r*.16,r*.1,0,TAU);c.arc(x+r*.32,y-r*.16,r*.1,0,TAU);c.fill();}
  else if(k===2){const p=()=>{c.beginPath();for(let i=0;i<10;i++){const a=i*Math.PI/5-Math.PI/2,rr=i%2?r*.55:r*1.2;i?c.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr):c.moveTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr);}c.closePath();};p();const g=c.createRadialGradient(x-r*.4,y-r*.5,r*.1,x,y,r*1.2);g.addColorStop(0,'#fff2a0');g.addColorStop(.6,'#f2ce77');g.addColorStop(1,'#b8861b');c.fillStyle=g;c.fill();c.strokeStyle=INK;c.lineWidth=2.4;c.stroke();c.fillStyle=INK;c.beginPath();c.arc(x-r*.24,y,r*.09,0,TAU);c.arc(x+r*.24,y,r*.09,0,TAU);c.fill();}
  else if(k===3){N.blob(c,x,y,r*1.05,'#8bb7dc',9,{shadow:false,noShine:true});c.save();c.beginPath();c.arc(x,y,r*1.0,0,TAU);c.clip();c.fillStyle='rgba(248,233,202,.9)';c.fillRect(x-r*1.2,y-r*.18,r*2.4,r*.36);c.restore();c.fillStyle=INK;c.beginPath();c.arc(x-r*.3,y-r*.42,r*.09,0,TAU);c.arc(x+r*.3,y-r*.42,r*.09,0,TAU);c.fill();}
  else{N.blob(c,x,y,r*1.05,'#f2ce77',11,{shadow:false,noShine:true});c.fillStyle='#ef896d';c.beginPath();c.ellipse(x+r*.1,y+r*.2,r*.46,r*.24,0,0,TAU);c.fill();c.strokeStyle=INK;c.lineWidth=1.6;c.stroke();c.fillStyle=INK;c.beginPath();c.arc(x-r*.4,y-r*.2,r*.1,0,TAU);c.arc(x+r*.4,y-r*.2,r*.1,0,TAU);c.fill();}
 claySurface(c,S,S,k*5+r,2);});}
function bakeStall(c,g){
 const W=g.W,H=g.H,R=N.mulberry(41),por=W<H;
 N.bgGrad(c,W,H,['#2a2150','#4a2f63','#6b3f66']);
 // planked back wall
 const wy=H*.095;const wg=c.createLinearGradient(0,wy,0,g.hz);wg.addColorStop(0,'#6a4162');wg.addColorStop(1,'#8a5670');c.fillStyle=wg;c.fillRect(0,wy,W,g.hz-wy+4);
 for(let x=0;x<W;x+=38){c.strokeStyle='rgba(30,12,40,.4)';c.lineWidth=2;c.beginPath();c.moveTo(x,wy);c.lineTo(x,g.hz);c.stroke();c.strokeStyle='rgba(255,224,190,.1)';c.beginPath();c.moveTo(x+2,wy);c.lineTo(x+2,g.hz);c.stroke();for(let k=0;k<2;k++){c.strokeStyle='rgba(30,12,40,.22)';c.beginPath();const yy=wy+R()*(g.hz-wy);c.moveTo(x+6,yy);c.lineTo(x+20+R()*8,yy+R()*4);c.stroke();}}
 // shelf + prizes
 const pr=Math.round(H*.036),shy=g.hz-H*.035;
 for(let i=0;i<(por?6:10);i++){const n=por?6:10,x=(i+.5)*W/n;const s=prizeSpr(i%5,pr);c.drawImage(s,x-s.width/2,g.hz-H*.07-s.height/2+pr*.1);}
 claySlab(c,-6,shy,W+12,14,5,'#8a5b3a',2.4);c.fillStyle='rgba(10,4,20,.3)';c.fillRect(0,shy+14,W,10);
 // floor (wood boards in perspective)
 const fg=c.createLinearGradient(0,g.hz,0,g.yb);fg.addColorStop(0,'#8a5f72');fg.addColorStop(1,'#d9a874');c.fillStyle=fg;c.fillRect(0,g.hz,W,H-g.hz);
 for(let i=-8;i<=8;i++){const x0=i*.35;const a=P(g,x0,30),b=P(g,x0,-.14);c.fillStyle=(i&1)?'rgba(255,224,190,.07)':'rgba(30,12,30,.07)';c.beginPath();const a2=P(g,x0+.35,30),b2=P(g,x0+.35,-.14);c.moveTo(a.x,a.y);c.lineTo(a2.x,a2.y);c.lineTo(b2.x,b2.y);c.lineTo(b.x,b.y);c.closePath();c.fill();c.strokeStyle='rgba(42,26,44,.38)';c.lineWidth=1.8;c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.stroke();}
 for(let z=0;z<30;z=z*1.3+.1){const a1=P(g,-9,z),a2=P(g,9,z);c.strokeStyle='rgba(42,26,44,.2)';c.beginPath();c.moveTo(0,a1.y);c.lineTo(W,a2.y);c.stroke();}
 for(let i=0;i<200;i++){const z=R(),q=P(g,(R()-.5)*3,z);c.fillStyle=R()>.5?'rgba(255,240,210,.22)':'rgba(30,12,30,.2)';c.fillRect(q.x,q.y,1.6,1.2);}
 // spotlight pool
 const lp=c.createRadialGradient(W/2,(g.hz+g.yb)/2,10,W/2,(g.hz+g.yb)/2,W*.5);lp.addColorStop(0,'rgba(255,224,170,.28)');lp.addColorStop(1,'rgba(255,224,170,0)');c.fillStyle=lp;c.fillRect(0,g.hz,W,H-g.hz);
 const wf=c.createLinearGradient(0,g.hz-8,0,g.hz+30);wf.addColorStop(0,'rgba(10,4,20,.45)');wf.addColorStop(1,'rgba(10,4,20,0)');c.fillStyle=wf;c.fillRect(0,g.hz-8,W,40);
 // counter
 const cy=H-H*.1;{c.fillStyle='#7a4a52';c.fillRect(0,cy,W,H*.1);const n=Math.round(W/46);for(let i=0;i<n;i++){const x0=i*W/n+3,ww=W/n-6;c.fillStyle=i%2?'#e8d8b8':'#d98a70';c.beginPath();c.roundRect(x0,cy+12,ww,H*.1-16,5);c.fill();c.strokeStyle=INK;c.lineWidth=2;c.stroke();soft(c,x0+ww*.3,cy+20,ww*.7,.18);}
  c.strokeStyle=INK;c.lineWidth=2.4;c.strokeRect(-2,cy,W+4,H*.1+2);coilLine(c,[[-4,cy+4],[W+4,cy+4]],12,'#c89a5a');}
 // clay awning: pressed stripes with rolled-coil hem
 const aw=Math.round(W/60);for(let i=0;i<aw;i++){const x0=i*W/aw,x1=(i+1)*W/aw,col=i%2?'#e8d8b8':'#d98a70';c.beginPath();c.moveTo(x0,-2);c.lineTo(x1,-2);c.lineTo(x1,H*.095);c.quadraticCurveTo((x0+x1)/2,H*.14,x0,H*.095);c.closePath();c.fillStyle=col;c.fill();const ag=c.createLinearGradient(0,0,0,H*.13);ag.addColorStop(0,'rgba(255,240,214,.2)');ag.addColorStop(1,'rgba(30,10,30,.28)');c.fillStyle=ag;c.fill();c.strokeStyle=INK;c.lineWidth=2.4;c.lineJoin='round';c.stroke();soft(c,(x0+x1)/2-6,H*.04,W/aw*.5,.16);seam(c,x1,0,x1,H*.1,2);}
 {const pts=[];for(let i=0;i<aw;i++){const x0=i*W/aw,x1=(i+1)*W/aw;pts.push([x0,H*.095],[(x0+x1)/2,H*.12],[x1,H*.095]);}coilLine(c,pts,5,'#c89a5a');}
 claySurface(c,W,H,31,26); N.grain(c,W,H,.5);
}
function P2(g){return g;}
function draw(ctx,a){const p=a.p,g=geom(a),W=g.W,H=g.H;
 N.cached(ctx,'ring',W,H,(c)=>bakeStall(c,g));
 // twinkling bulb string under awning
 {const n=Math.round(W/46);for(let i=0;i<n;i++){const x=(i+.5)*W/n,y=H*.122-(Math.abs(Math.sin((i+.5)/n*Math.PI*aw()))*0);const on=(Math.floor(p.t*3)+i)%3;glowAt(ctx,x,H*.12,16,on?'#ffd17c':'#ff9bd0',on?.55:.3);ctx.fillStyle=on?'#fff4c8':'#ffc4de';ctx.beginPath();ctx.arc(x,H*.118,3,0,TAU);ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=1.2;ctx.stroke();}}
 // pegs (far to near)
 const order=[...p.pegs].sort((a1,b)=>b.z-a1.z);
 for(const pg of order){const x=pegPos(p,pg,p.t),b=P(g,x,pg.z),top=P(g,x,pg.z,.32),w=Math.max(4,.032*g.hw*b.s*2),pr=Math.round(w*3.8),h=b.y-top.y;
  glowAt(ctx,b.x,b.y,34*b.s*2.2,pg.gold?'#ffd45e':'#9de3d1',.32);
  // rotating plate (turntable)
  const ps=plateSpr(pg.gold?'#f2b84a':'#8bb7dc',pr);ctx.save();ctx.translate(b.x,b.y+3);ctx.scale(1,.34);ctx.fillStyle='rgba(10,4,20,.4)';ctx.beginPath();ctx.arc(5,9,pr,0,TAU);ctx.fill();ctx.fillStyle=INK;ctx.beginPath();ctx.arc(0,10,pr,0,TAU);ctx.fill();ctx.rotate(T12(p.t)*pg.sp*1.6+pg.ph);ctx.drawImage(ps,-ps.width/2,-ps.height/2);ctx.restore();
  const sp=pegSpr(pg.gold?1:0,w,h);{const jj=jit(p.t,pg.pts,.8);ctx.drawImage(sp,b.x-sp.width/2+jj[0],b.y-sp.height+4+jj[1]);}
  N.text(ctx,pg.pts,b.x,b.y+b.s*28+10,{font:'700 '+Math.max(11,16*b.s*1.6)+'px Fredoka',align:'center',color:'#fff3d6',stroke:'#1a1226',sw:3});
  for(const q of p.placed.filter(q=>q.pg===pg)){const f2=p.flying;const pulse=f2&&f2.done&&f2.res==='ring'&&f2.peg===pg&&q.k===p.placed.filter(z=>z.pg===pg).length-1?Math.max(0,1-T12(f2.t2)*3.5):0;drawRing(ctx,top.x,top.y+(b.y-top.y)*(.55-q.k*.14),w*3.2*(1+.1*pulse),q.col,.5*(1-.2*pulse));}}
 // flying ring
 const f=p.flying;if(f){const t=Math.min(1,T12(f.t)/T_FLIGHT),x=N.lerp(f.sx,f.tx,t),z=N.lerp(f.sz,f.tz,t),h=.22+Math.sin(t*Math.PI)*.55*(.7+f.tz*.4)*(1-t*.3);
  const q=P(g,x,z,f.done?0:Math.max(.07,h)),shp=P(g,x,z);const air=f.done?0:Math.max(0,h-.07);N.shadow(ctx,shp.x,shp.y+2,22*shp.s*1.8*(1+air*.5),8*shp.s*1.8,Math.max(.15,.38-air*.3));
  const rr=24*q.s*1.8;
  if(!f.done)drawRing(ctx,q.x,q.y,rr,f.col,.4+Math.abs(Math.sin(f.spin+t*9))*.5);
  else if(f.res!=='ring')drawRing(ctx,q.x+(f.res==='clack'?f.t2*60:0),q.y-(f.res==='clack'?Math.sin(f.t2*6)*14:0),rr,f.col,.5,Math.max(0,1-f.t2*1.1));}
 // reticle
 if(a.running&&!p.flying&&p.rings>0&&p.between<=0){const sw=p.sway*(1-Math.min(.7,p.hold*.5));const rx=p.aim.x+Math.sin(p.t*7.3)*sw*.5,rz=p.aim.z+Math.cos(p.t*6.1)*sw*.45;const r=P(g,rx,rz),rad=g.hw*r.s*(sw*1.3+p.cap*.9);ctx.save();ctx.lineCap='round';ctx.strokeStyle=INK;ctx.lineWidth=6;ctx.beginPath();ctx.ellipse(r.x,r.y,rad*1.3,rad*.65,0,0,TAU);ctx.stroke();ctx.strokeStyle='#fff0b0';ctx.lineWidth=3;ctx.setLineDash([2,9]);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle='#fff0b0';ctx.beginPath();ctx.arc(r.x,r.y,3.4,0,TAU);ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=1.4;ctx.stroke();ctx.restore();}
 // rings left on the counter
 for(let i=0;i<p.rings;i++)drawRing(ctx,W/2-(p.rings-1)*16+i*32,H-H*.045,13,RC[i%4],.6);
 // HUD
 const S=STAGES[p.stage];N.chip(ctx,12,H*.13,100,'STAGE',(p.stage+1)+'/3',{color:'#ffe08a'});N.chip(ctx,122,H*.13,130,'GOAL',p.stageScore+' / '+S.need,{color:p.stageScore>=S.need?'#91c9a7':'#fff0d4'});N.chip(ctx,262,H*.13,100,'SCORE',a.score);if(p.streak>1)N.chip(ctx,372,H*.13,110,'STREAK','x'+(1+Math.min(3,p.streak)*.25).toFixed(2),{color:'#ef896d'});
 if(p.wind){const pw=104,px=W-pw-12,py=H*.13+4;ctx.fillStyle='rgba(18,10,28,.62)';N.rr(ctx,px,py,pw,30,15);ctx.fill();ctx.strokeStyle='rgba(228,182,114,.6)';ctx.lineWidth=1.3;ctx.stroke();N.text(ctx,'WIND '+(p.windDir>0?'→':'←')+' '+Math.round(p.wind*100),px+pw/2,py+20,{align:'center',font:'700 13px Fredoka',color:'#bfe4da'});}
 if(p.msgT>0&&a.running){ctx.save();ctx.globalAlpha=Math.min(1,p.msgT*2);const sc=1+Math.max(0,p.msgT-1)*.3;ctx.translate(W/2,H*.5);ctx.scale(sc,sc);N.text(ctx,p.msg,0,0,{font:'700 '+Math.round(Math.min(W,H)*.06)+'px Fredoka',align:'center',color:'#ffe08a',stroke:'#1a1226',sw:6,glow:'#ff6f91'});ctx.restore();}
 if(!a.running){const w=Math.min(W*.8,380),h=46,x=W/2-w/2,y=H*.9-h-8;ctx.drawImage(plaque(Math.round(w),h,20,'#6a4c60',8),x-10,y-10);N.text(ctx,'COMET RING TOSS',W/2,y+21,{font:'700 18px Fredoka',align:'center',color:'#ffe08a',stroke:'#1a1226'});N.text(ctx,'Hold to aim · release to throw · ring the moving pegs',W/2,y+37,{font:'600 11px Fredoka',align:'center',color:'#fff0d4'});}
 N.vignette(ctx,W,H,.3);}
function aw(){return 1;}
function mv(x,y,e,a){const g=geom(a),p=a.p;const q=inv(g,x,y);p.aim.x=N.clamp(q.x,-1,1);p.aim.z=N.clamp(q.z,.05,1);}
function pd(x,y,e,a){const p=a.p;mv(x,y,e,a);p.holding=true;p.hold=0;}
function pu(x,y,e,a){const p=a.p;if(!p.holding)return;mv(x,y,e,a);throwRing(a);}
function kd(e,a){if(e.key===' '||e.key==='Enter'){a.p.kHold=true;}}
function ku(e,a){if(e.key===' '||e.key==='Enter'){a.p.kHold=false;throwRing(a);}}
NEXUS_GAMES.register('ringtoss',{meta:{title:'COMET RING TOSS',help:'Three stages, each with a score goal. Press and hold to aim your reticle (holding steady calms the wobble), release to toss. Rings take time to fly, so lead the sliding pegs. Far pegs pay more; the golden comet peg pays 100.',controls:'Press, drag, release · or arrows aim, hold SPACE and release',type:'CARNIVAL SKILL'},
 size:[900,520],portraitSize:[540,860],duration:0,timed:false,tier:1.1,touch:[{kind:'stick',side:'left'},{kind:'btn',side:'right',label:'TOSS',key:' ',big:true}],init,start,update,draw,pointerdown:pd,pointermove:(x,y,e,a)=>{if(a.p.holding)mv(x,y,e,a);},pointerup:pu,keydown:kd,keyup:ku});
})();

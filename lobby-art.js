// Neon Nexus lobby artwork: every surface here is painted at load time with a brush-stroke vocabulary
// (wobbly ink outlines, dry-brush streaks, layered washes, deliberate imperfections) so the 3D lobby
// reads as an illustrated set rather than flat-shaded geometry. Each painter returns a canvas; the world
// wraps it in a THREE texture. Sizes are kept small and textures are shared to stay mobile-friendly.

export function rng(seed){let s=(seed>>>0)||1;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};}
const mk=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
const hex=n=>'#'+(n>>>0).toString(16).padStart(6,'0');
function shade(h,amt){const n=parseInt(h.slice(1),16),r=Math.max(0,Math.min(255,(n>>16)+amt)),g=Math.max(0,Math.min(255,((n>>8)&255)+amt)),b=Math.max(0,Math.min(255,(n&255)+amt));return'#'+((1<<24)+(r<<16)+(g<<8)+b).toString(16).slice(1);}
const INK='#2a1a2c';

// A hand-held line: many tiny dabs along a wavering path with slightly varying pressure.
function brush(ctx,x1,y1,x2,y2,w,color,alpha,rand){
 const len=Math.hypot(x2-x1,y2-y1),n=Math.max(2,Math.ceil(len/1.6));ctx.fillStyle=color;
 const nx=-(y2-y1)/(len||1),ny=(x2-x1)/(len||1),ph=rand()*6.28,amp=w*.35;
 for(let i=0;i<=n;i++){const t=i/n,wob=Math.sin(t*6+ph)*amp*.5,px=x1+(x2-x1)*t+nx*wob,py=y1+(y2-y1)*t+ny*wob;ctx.globalAlpha=alpha*(.7+.3*rand());ctx.beginPath();ctx.arc(px,py,w*(.42+.2*rand()),0,6.283);ctx.fill();}
 ctx.globalAlpha=1;
}
// Outlined, slightly lopsided blob with a painted highlight crescent.
function blob(ctx,x,y,r,color,rand,opt={}){
 ctx.save();ctx.translate(x,y);ctx.rotate((rand()-.5)*.3);
 ctx.beginPath();const k=14;for(let i=0;i<=k;i++){const a=i/k*6.283,rr=r*(1+(rand()-.5)*.09),px=Math.cos(a)*rr*(opt.sx||1),py=Math.sin(a)*rr*(opt.sy||1);i?ctx.lineTo(px,py):ctx.moveTo(px,py);}ctx.closePath();
 const g=ctx.createRadialGradient(-r*.35,-r*.4,r*.1,0,0,r*1.15);g.addColorStop(0,shade(color,48));g.addColorStop(.55,color);g.addColorStop(1,shade(color,-52));ctx.fillStyle=g;ctx.fill();
 ctx.lineWidth=Math.max(1.2,r*.07);ctx.strokeStyle=INK;ctx.lineJoin='round';ctx.stroke();
 if(!opt.noShine){ctx.strokeStyle='rgba(255,250,235,.55)';ctx.lineWidth=Math.max(1,r*.09);ctx.lineCap='round';ctx.beginPath();ctx.arc(0,0,r*.72,3.5,4.4);ctx.stroke();}
 ctx.restore();
}
function inkRect(ctx,x,y,w,h,color,r,rand){
 ctx.beginPath();ctx.roundRect(x,y,w,h,r);const g=ctx.createLinearGradient(x,y,x,y+h);g.addColorStop(0,shade(color,34));g.addColorStop(.5,color);g.addColorStop(1,shade(color,-44));ctx.fillStyle=g;ctx.fill();
 ctx.strokeStyle=INK;ctx.lineWidth=2;ctx.stroke();ctx.strokeStyle='rgba(255,246,222,.4)';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(x+r,y+2.5);ctx.lineTo(x+w-r,y+2.5+(rand?(rand()-.5):0));ctx.stroke();
}
function paperGrain(ctx,w,h,rand,n,light='255,244,220',dark='30,18,32'){
 for(let i=0;i<n;i++){const x=rand()*w,y=rand()*h;ctx.fillStyle=rand()>.5?`rgba(${light},${.03+rand()*.07})`:`rgba(${dark},${.03+rand()*.08})`;ctx.fillRect(x,y,1+rand()*2.2,1+rand()*1.6);}
}

// ───────────────────────── Floor ─────────────────────────
export function paintParquet(){
 // Designed plank floor: a fixed three-tone sequence, half-offset rows, consistent drawn grain, placed knots and inked seams.
 const S=512,c=mk(S,S),x=c.getContext('2d'),r=mk(S,S),rx=r.getContext('2d');
 const tones=['#9a6644','#86583b','#a8744c'],rows=16,ph=S/rows,pl=256;
 rx.fillStyle='#8a8a8a';rx.fillRect(0,0,S,S);
 for(let row=0;row<rows;row++){
  const off=row%2?pl/2:0;
  for(let k=-1;k<3;k++){
   const X=off+k*pl,py=row*ph,idx=(row*3+k*2+9)%3,base=tones[idx];
   const g=x.createLinearGradient(X,py,X,py+ph);g.addColorStop(0,shade(base,16));g.addColorStop(.55,base);g.addColorStop(1,shade(base,-14));x.fillStyle=g;x.fillRect(X,py,pl,ph);
   // three clean grain strokes that follow the plank
   x.lineCap='round';
   for(let s2=0;s2<3;s2++){const yy=py+6+s2*9,bend=(s2%2?3:-3);x.strokeStyle=s2===1?'rgba(255,220,170,.22)':'rgba(60,30,20,.28)';x.lineWidth=s2===1?1.4:1.2;x.beginPath();x.moveTo(X+10,yy);x.bezierCurveTo(X+pl*.35,yy+bend,X+pl*.65,yy-bend,X+pl-10,yy);x.stroke();}
   // a drawn knot on every fifth plank, always in the same place in the plank
   if((row*3+k+20)%5===0){const kx=X+pl*.62,ky=py+ph*.5;x.strokeStyle='rgba(60,28,18,.55)';x.lineWidth=1.3;for(let q=1;q<=3;q++){x.beginPath();x.ellipse(kx,ky,q*3.2,q*1.6,0,0,6.283);x.stroke();}x.fillStyle='rgba(60,28,18,.6)';x.beginPath();x.ellipse(kx,ky,2,1.1,0,0,6.283);x.fill();}
   // bevel highlight and inked seams
   x.fillStyle='rgba(255,232,190,.32)';x.fillRect(X+2,py+1,pl-4,1.6);
   x.fillStyle='rgba(58,32,24,.75)';x.fillRect(X,py+ph-1.6,pl,1.6);x.fillRect(X,py,1.6,ph);
   // roughness: glossy centres, satin ends
   const rg=rx.createLinearGradient(X,0,X+pl,0);rg.addColorStop(0,'rgb(185,185,185)');rg.addColorStop(.3,'rgb(135,135,135)');rg.addColorStop(.7,'rgb(135,135,135)');rg.addColorStop(1,'rgb(185,185,185)');rx.fillStyle=rg;rx.fillRect(X,py,pl,ph);
  }
 }
 return {map:c,rough:r};
}

// One hand-composed carpet motif tile (ringed planet, star, squiggle, triangle, dots) used in a half-drop repeat.
function carpetMotif(){
 const T=112,c=mk(T,T),x=c.getContext('2d');
 x.lineJoin='round';x.lineCap='round';
 // pressed clay bits: each shape sits slightly raised on the pile with a soft shadow and only a faint rim
 const ink='rgba(16,10,34,.28)';
 x.shadowColor='rgba(20,8,30,.55)';x.shadowBlur=3;x.shadowOffsetX=1;x.shadowOffsetY=2;
 const stroke=(w=2.4)=>{x.save();x.shadowColor='transparent';x.strokeStyle=ink;x.lineWidth=w*.6;x.stroke();x.restore();};
 // ringed planet
 x.fillStyle='#5fe0d4';x.beginPath();x.arc(28,30,11,0,6.283);x.fill();stroke();
 x.fillStyle='rgba(255,255,255,.35)';x.beginPath();x.arc(24,26,4,0,6.283);x.fill();
 x.strokeStyle='#ffc66b';x.lineWidth=3;x.beginPath();x.ellipse(28,30,19,6,-.4,0,6.283);x.stroke();x.strokeStyle=ink;x.lineWidth=1.2;x.beginPath();x.ellipse(28,30,21,7.5,-.4,0,6.283);x.stroke();
 // five-point star
 x.beginPath();for(let k=0;k<10;k++){const a=-Math.PI/2+k*Math.PI/5,q=k%2?4.5:10;x.lineTo(84+Math.cos(a)*q,26+Math.sin(a)*q);}x.closePath();x.fillStyle='#ffc66b';x.fill();stroke(2);
 // squiggle
 x.beginPath();x.moveTo(52,78);for(let k=1;k<=4;k++)x.quadraticCurveTo(52+k*10-5,78+(k%2?-9:9),52+k*10,78);x.strokeStyle='#c4588e';x.lineWidth=6;x.stroke();x.shadowColor='transparent';x.strokeStyle='#ff8cc0';x.lineWidth=3.6;x.stroke();x.shadowColor='rgba(20,8,30,.55)';
 // triangle
 x.beginPath();x.moveTo(22,66);x.lineTo(34,88);x.lineTo(10,88);x.closePath();x.fillStyle='#a99bff';x.fill();stroke(2);
 // little dots
 for(const [dx,dy,col] of [[58,46,'#7ee08f'],[100,62,'#ff7ab6'],[96,98,'#5fe0d4'],[8,46,'#ffc66b']]){x.fillStyle=col;x.beginPath();x.arc(dx,dy,3.4,0,6.283);x.fill();stroke(1.4);}
 x.shadowColor='transparent';
 return c;
}

// Arcade carpet runway painted as one unique overlay: neon confetti pattern, braided border, medallions,
// foot-traffic wear and baked neon light spill under each cabinet.
export function paintCarpet(cabinets,W=768,H=1536,planeW=24,planeH=48,zTop=-25){
 const c=mk(W,H),x=c.getContext('2d'),rand=rng(9011),ppu=W/planeW;
 const X=u=>(u+planeW/2)*ppu,Z=z=>(z-zTop)*ppu;
 const x0=X(-8.5),x1=X(8.5),y0=Z(-24.2),y1=Z(22.4);
 const rough=(rx,ry,rw,rh,amt)=>{ // frayed, hand-cut edges
  x.save();x.beginPath();x.moveTo(rx,ry);for(let i=0;i<=40;i++)x.lineTo(rx+rw*i/40,ry+(rand()-.5)*amt);for(let i=0;i<=80;i++)x.lineTo(rx+rw+(rand()-.5)*amt,ry+rh*i/80);for(let i=40;i>=0;i--)x.lineTo(rx+rw*i/40,ry+rh+(rand()-.5)*amt);for(let i=80;i>=0;i--)x.lineTo(rx+(rand()-.5)*amt,ry+rh*i/80);x.closePath();x.clip();
 };
 x.save();rough(x0,y0,x1-x0,y1-y0,3);
 const base=x.createLinearGradient(x0,0,x1,0);base.addColorStop(0,'#33295a');base.addColorStop(.5,'#40336e');base.addColorStop(1,'#33295a');x.fillStyle=base;x.fillRect(x0-6,y0-6,x1-x0+12,y1-y0+12);
 // designed motif in a half-drop repeat (no random scatter)
 const motif=carpetMotif(),T=Math.round(motif.width*.55);
 x.globalAlpha=.62;
 for(let ty=y0-T,row=0;ty<y1+T;ty+=T,row++)for(let tx=x0-T+(row%2?T/2:0);tx<x1+T;tx+=T)x.drawImage(motif,tx,ty,T,T);
 x.globalAlpha=1;
 // central runner with braided gold border and medallions
 const rx0=X(-2.7),rx1=X(2.7);
 const runner=x.createLinearGradient(rx0,0,rx1,0);runner.addColorStop(0,'#5e2a5a');runner.addColorStop(.5,'#74366c');runner.addColorStop(1,'#5e2a5a');x.fillStyle=runner;x.fillRect(rx0,y0+10,rx1-rx0,y1-y0-20);
 for(let i=0;i<900;i++){x.fillStyle=`rgba(255,190,220,${.02+rand()*.05})`;x.fillRect(rx0+rand()*(rx1-rx0),y0+10+rand()*(y1-y0-20),1.5,1.5);}
 for(const ex of [rx0,rx1]){brush(x,ex,y0+10,ex,y1-10,3.4,'#e8b867',.85,rand);brush(x,ex+(ex===rx0?7:-7),y0+10,ex+(ex===rx0?7:-7),y1-10,1.6,'#ffe2a0',.7,rand);}
 for(let z=-21;z<=20;z+=6.2){
  const cy=Z(z),cx=X(0);
  x.fillStyle='rgba(12,6,20,.28)';x.beginPath();x.ellipse(cx+2,cy+3,29,29,0,0,6.283);x.fill();
  blob(x,cx,cy,27,'#7b3b62',rand,{noShine:true});blob(x,cx,cy,20,'#321f46',rand,{noShine:true});
  for(let k=0;k<8;k++){const a=k*.7854;brush(x,cx+Math.cos(a)*8,cy+Math.sin(a)*8,cx+Math.cos(a)*18,cy+Math.sin(a)*18,1.8,'#e8b867',.9,rand);}
  blob(x,cx,cy,6,'#ffd98a',rand,{noShine:true});
 }
 // outer carpet border: double braid
 for(const [off,w,col] of [[4,5,'#e8b867'],[13,2,'#ff7ab6'],[18,2,'#5fe0d4']]){brush(x,x0+off,y0+off,x1-off,y0+off,w,col,.9,rand);brush(x,x0+off,y1-off,x1-off,y1-off,w,col,.9,rand);brush(x,x0+off,y0+off,x0+off,y1-off,w,col,.9,rand);brush(x,x1-off,y0+off,x1-off,y1-off,w,col,.9,rand);}
 // baked neon light spill beneath every cabinet
 x.globalCompositeOperation='lighter';
 for(const cab of cabinets){const gx=X(cab.x-Math.sign(cab.x)*1.5),gy=Z(cab.z),gr=ppu*3.2;const g=x.createRadialGradient(gx,gy,0,gx,gy,gr);const col=hex(cab.color);g.addColorStop(0,col+'88');g.addColorStop(.5,col+'33');g.addColorStop(1,col+'00');x.fillStyle=g;x.fillRect(gx-gr,gy-gr,gr*2,gr*2);}
 x.globalCompositeOperation='source-over';
 // foot-traffic wear down the aisle
 for(let i=0;i<60;i++){const wy=y0+rand()*(y1-y0);x.fillStyle=`rgba(255,235,210,${.01+rand()*.025})`;x.beginPath();x.ellipse(X(0)+(rand()-.5)*60,wy,60+rand()*80,6+rand()*12,0,0,6.283);x.fill();}
 x.restore();
 // soft drop-shadow ring where carpet meets timber
 return c;
}

// ───────────────────────── Walls ─────────────────────────
export function paintWall(){
 const W=512,H=288,c=mk(W,H),x=c.getContext('2d'),rand=rng(2203);
 const wp=x.createLinearGradient(0,0,0,H*.62);wp.addColorStop(0,'#2c1f38');wp.addColorStop(1,'#4b3052');x.fillStyle=wp;x.fillRect(0,0,W,H);
 // damask-like lattice with painted gold sprigs (period 64 so it tiles)
 for(let gx=0;gx<W;gx+=64)for(let gy=0;gy<H*.62;gy+=64){
  x.strokeStyle='rgba(232,184,103,.16)';x.lineWidth=1.6;x.beginPath();x.moveTo(gx+32,gy+6);x.lineTo(gx+58,gy+32);x.lineTo(gx+32,gy+58);x.lineTo(gx+6,gy+32);x.closePath();x.stroke();
  x.fillStyle='rgba(255,200,130,.2)';x.beginPath();x.ellipse(gx+32,gy+32,5,8,0,0,6.283);x.fill();
  for(const s of [-1,1]){x.strokeStyle='rgba(255,170,200,.14)';x.beginPath();x.moveTo(gx+32,gy+32);x.quadraticCurveTo(gx+32+s*14,gy+22,gx+32+s*18,gy+12);x.stroke();}
 }
 for(let i=0;i<140;i++){x.strokeStyle=rand()>.5?`rgba(255,200,160,${.03+rand()*.04})`:`rgba(10,4,16,${.05+rand()*.06})`;x.lineWidth=3+rand()*6;const px=rand()*W,py=rand()*H*.6;x.beginPath();x.moveTo(px,py);x.quadraticCurveTo(px+16,py-4,px+34,py+(rand()-.5)*8);x.stroke();}
 // chair rail
 const railY=Math.floor(H*.62);
 const rg=x.createLinearGradient(0,railY,0,railY+14);rg.addColorStop(0,'#c99560');rg.addColorStop(.4,'#9c6a44');rg.addColorStop(1,'#5e3a2a');x.fillStyle=rg;x.fillRect(0,railY,W,14);x.fillStyle='rgba(255,230,190,.5)';x.fillRect(0,railY,W,1.6);x.fillStyle=INK;x.fillRect(0,railY+14,W,1.6);
 // wainscot with raised panels and grain
 const wy=railY+15;x.fillStyle='#5a3a34';x.fillRect(0,wy,W,H-wy);
 for(let px=0;px<W;px+=128){
  const g=x.createLinearGradient(0,wy,0,H);g.addColorStop(0,'#6e4639');g.addColorStop(1,'#432a28');x.fillStyle=g;x.fillRect(px+6,wy+8,116,H-wy-24);
  x.strokeStyle='rgba(255,220,180,.25)';x.lineWidth=1.5;x.strokeRect(px+10,wy+12,108,H-wy-32);x.strokeStyle='rgba(20,8,12,.55)';x.strokeRect(px+14,wy+16,100,H-wy-40);
  for(let s=0;s<16;s++){const yy=wy+14+rand()*(H-wy-36);x.strokeStyle=`rgba(${rand()>.5?'255,205,160':'25,10,10'},${.05+rand()*.1})`;x.lineWidth=.8+rand();x.beginPath();x.moveTo(px+16,yy);x.bezierCurveTo(px+44,yy+rand()*5,px+80,yy-rand()*5,px+110,yy+rand()*3);x.stroke();}
 }
 x.fillStyle='#26161d';x.fillRect(0,H-12,W,12);x.fillStyle='rgba(255,215,170,.22)';x.fillRect(0,H-12,W,1.5);
 paperGrain(x,W,H,rand,900);
 return c;
}

// ───────────────────────── Neon ─────────────────────────
export function paintNeon(text,color,{w=1024,h=256,plaque=true,tube2=null,bulbs=true,font=0}={}){
 const c=mk(w,h),x=c.getContext('2d'),rand=rng(text.length*131+7);
 if(plaque){
  const g=x.createLinearGradient(0,0,0,h);g.addColorStop(0,'#3a2742');g.addColorStop(1,'#1c1226');x.fillStyle=g;x.beginPath();x.roundRect(6,6,w-12,h-12,34);x.fill();
  x.strokeStyle='#c99560';x.lineWidth=7;x.stroke();x.strokeStyle='rgba(255,226,170,.5)';x.lineWidth=2;x.beginPath();x.roundRect(14,14,w-28,h-28,28);x.stroke();
  for(let i=0;i<600;i++){x.fillStyle=`rgba(255,255,255,${rand()*.03})`;x.fillRect(rand()*w,rand()*h,2,1);}
 }
 if(bulbs&&plaque){for(let i=0;i<30;i++){const t=i/30,bx=34+t*(w-68);for(const by of [26,h-26]){x.fillStyle=(i%2?'#ffd98a':'#ff9acb');x.shadowColor=x.fillStyle;x.shadowBlur=12;x.beginPath();x.arc(bx,by,4.5,0,6.283);x.fill();}}x.shadowBlur=0;}
 const fs=Math.floor(h*(plaque?.5:.62));x.font=`700 ${fs}px Fredoka, "Arial Rounded MT Bold", "Trebuchet MS", sans-serif`;x.textAlign='center';x.textBaseline='middle';x.lineJoin='round';
 const cy=h*.5+(plaque?0:0);
 for(const [blur,wd,a] of [[60,16,.5],[32,12,.7],[14,8,.95]]){x.shadowColor=color;x.shadowBlur=blur;x.strokeStyle=color;x.globalAlpha=a;x.lineWidth=wd;x.strokeText(text,w/2,cy);}
 x.globalAlpha=1;x.shadowBlur=18;x.shadowColor=color;x.fillStyle='#fff7f0';x.lineWidth=3;x.strokeStyle='#fff';x.fillText(text,w/2,cy);x.shadowBlur=0;
 // little glass-tube unevenness
 x.globalCompositeOperation='source-atop';x.fillStyle='rgba(255,255,255,.18)';x.fillRect(0,cy-fs*.32,w,3);x.globalCompositeOperation='source-over';
 if(tube2&&plaque){x.shadowColor=tube2;x.shadowBlur=18;x.strokeStyle=tube2;x.lineWidth=6;x.lineCap='round';x.beginPath();x.moveTo(w*.12,h*.84);x.quadraticCurveTo(w*.5,h*.9,w*.88,h*.84);x.stroke();x.beginPath();x.moveTo(w*.12,h*.17);x.quadraticCurveTo(w*.5,h*.1,w*.88,h*.17);x.stroke();x.shadowBlur=0;}
 return c;
}

// ───────────────────────── Marquees & cabinet art ─────────────────────────
const MOTIFS={
 hoops(x,cx,cy,s,r){inkRect(x,cx-s*.6,cy-s*1.0,s*1.2,s*.85,'#f2ead8',8,r);x.strokeStyle='#e8584f';x.lineWidth=s*.12;x.strokeRect(cx-s*.25,cy-s*.65,s*.5,s*.4);x.strokeStyle=INK;x.lineWidth=s*.2;x.beginPath();x.ellipse(cx,cy+.05*s,s*.55,s*.16,0,0,6.283);x.stroke();x.strokeStyle='#ff8a3d';x.lineWidth=s*.12;x.stroke();for(let i=-2;i<=2;i++)brush(x,cx+i*s*.2,cy+.1*s,cx+i*s*.12,cy+s*.65,s*.04,'#fff3d0',.8,r);blob(x,cx+s*.7,cy+s*.7,s*.4,'#e8884a',r);},
 skeeball(x,cx,cy,s,r){for(const [rad,col] of [[1,'#d9825e'],[.74,'#f2d28b'],[.5,'#76b7a8'],[.28,'#e6788a']])blob(x,cx,cy,s*rad,col,r,{noShine:true});blob(x,cx+s*.6,cy+s*.5,s*.3,'#f6e7c4',r);},
 airhockey(x,cx,cy,s,r){blob(x,cx-s*.3,cy+s*.2,s*.62,'#f09a5a',r);blob(x,cx-s*.3,cy+s*.2,s*.24,'#ffd29a',r,{noShine:true});blob(x,cx+s*.55,cy-s*.15,s*.36,'#d85a67',r);},
 billiards(x,cx,cy,s,r){blob(x,cx,cy,s*.8,'#28232f',r);blob(x,cx,cy-s*.05,s*.34,'#f6ead0',r,{noShine:true});x.fillStyle=INK;x.font=`700 ${s*.42}px Fredoka, sans-serif`;x.textAlign='center';x.textBaseline='middle';x.fillText('8',cx,cy);brush(x,cx+s*.7,cy+s*.9,cx+s*1.7,cy-s*.4,s*.14,'#e4b57b',1,r);},
 whack(x,cx,cy,s,r){blob(x,cx,cy+s*.5,s*.9,'#3a2a2e',r,{sy:.35,noShine:true});blob(x,cx,cy-s*.1,s*.62,'#a6794f',r);for(const e of [-1,1])blob(x,cx+e*s*.22,cy-s*.2,s*.11,'#fff7e8',r,{noShine:true});blob(x,cx,cy,s*.16,'#e49a96',r,{noShine:true});brush(x,cx+s*.9,cy-s*.9,cx+s*.4,cy-s*.1,s*.12,'#9a6a40',1,r);blob(x,cx+s*1,cy-s*1,s*.3,'#d98a5a',r);},
 target(x,cx,cy,s,r){blob(x,cx-s*.4,cy+s*.1,s*.7,'#9fd8e8',r);blob(x,cx+s*.55,cy-s*.35,s*.42,'#f5b3d0',r);blob(x,cx+s*.25,cy+s*.65,s*.3,'#ffe08a',r);},
 memory(x,cx,cy,s,r){const cols=['#e86a7a','#f2c35f','#6fcf9a','#6aa8e8'];for(let i=0;i<4;i++){inkRect(x,cx-s*.9+(i%2)*s*.95,cy-s*.9+Math.floor(i/2)*s*.95,s*.85,s*.85,cols[i],8,r);}},
 rhythm(x,cx,cy,s,r){blob(x,cx-s*.5,cy+s*.5,s*.36,'#ff7ab6',r);blob(x,cx+s*.5,cy+s*.3,s*.36,'#5fe0d4',r);brush(x,cx-s*.2,cy+s*.5,cx-s*.2,cy-s*.9,s*.12,INK,1,r);brush(x,cx+s*.8,cy+s*.3,cx+s*.8,cy-s*1.1,s*.12,INK,1,r);brush(x,cx-s*.2,cy-s*.9,cx+s*.8,cy-s*1.1,s*.3,INK,1,r);},
 meteor(x,cx,cy,s,r){for(let i=0;i<4;i++)brush(x,cx-s*1.5-i*s*.2,cy-s*1.0+i*s*.18,cx-s*.3,cy-s*.2+i*s*.05,s*(.2-i*.03),'rgba(255,200,120,.9)',.6,r);blob(x,cx+s*.2,cy+s*.1,s*.75,'#8a6e86',r);blob(x,cx+s*.05,cy-s*.1,s*.2,'#6a5068',r,{noShine:true});blob(x,cx+s*.4,cy+s*.3,s*.14,'#6a5068',r,{noShine:true});},
 racer(x,cx,cy,s,r){inkRect(x,cx-s*1.1,cy-s*.1,s*2.2,s*.6,'#e8584f',s*.2,r);inkRect(x,cx-s*.5,cy-s*.55,s*1.1,s*.5,'#f4d8a8',s*.18,r);blob(x,cx-s*.7,cy+s*.55,s*.3,'#2a2230',r);blob(x,cx+s*.7,cy+s*.55,s*.3,'#2a2230',r);for(let i=0;i<3;i++)brush(x,cx-s*2-i*s*.2,cy+i*s*.22,cx-s*1.3,cy+i*s*.22,s*.07,'#fff3d0',.8,r);},
 stack(x,cx,cy,s,r){const c=['#7aa8e0','#e8a05a','#e6788a','#7fd09e'];for(let i=0;i<4;i++)inkRect(x,cx-s*(.8-i*.08)+(i%2?s*.15:-s*.1),cy+s*.7-i*s*.42,s*(1.6-i*.15),s*.4,c[i],6,r);},
 pinball(x,cx,cy,s,r){blob(x,cx,cy-s*.3,s*.55,'#cfd8e6',r);for(const e of [-1,1]){x.save();x.translate(cx+e*s*.55,cy+s*.85);x.rotate(e*-.45);inkRect(x,-s*.55,-s*.13,s*1.1,s*.28,'#e8584f',8,r);x.restore();}blob(x,cx-s*1.0,cy-s*.7,s*.2,'#ffd98a',r);blob(x,cx+s*1.0,cy-s*.4,s*.2,'#ff9acb',r);},
 claw(x,cx,cy,s,r){brush(x,cx,cy-s*1.3,cx,cy-s*.3,s*.1,INK,1,r);inkRect(x,cx-s*.3,cy-s*.4,s*.6,s*.22,'#a5adbd',6,r);for(const e of [-1,0,1])brush(x,cx+e*s*.2,cy-s*.2,cx+e*s*.55,cy+s*.4,s*.1,'#c8cfdb',1,r);blob(x,cx,cy+s*.85,s*.5,'#f4a6c4',r);for(const e of [-1,1])blob(x,cx+e*s*.3,cy+s*.5,s*.18,'#f4a6c4',r);},
 chef(x,cx,cy,s,r){blob(x,cx-s*.4,cy-s*.3,s*.5,'#fff6e6',r);blob(x,cx+s*.4,cy-s*.3,s*.5,'#fff6e6',r);blob(x,cx,cy-s*.6,s*.55,'#fff6e6',r);inkRect(x,cx-s*.7,cy-s*.1,s*1.4,s*.8,'#fff6e6',8,r);brush(x,cx-s*.7,cy+s*.3,cx+s*.7,cy+s*.3,s*.07,'#e8b88a',.7,r);},
 sushi(x,cx,cy,s,r){inkRect(x,cx-s*.9,cy-s*.05,s*1.8,s*.62,'#fff2dc',s*.3,r);inkRect(x,cx-s*.95,cy-s*.4,s*1.9,s*.5,'#f27b5a',s*.22,r);for(let i=0;i<3;i++)brush(x,cx-s*.7+i*s*.6,cy-s*.35,cx-s*.45+i*s*.6,cy+s*.02,s*.05,'#ffd0b0',.8,r);},
 mixology(x,cx,cy,s,r){x.beginPath();x.moveTo(cx-s*.9,cy-s*.8);x.lineTo(cx+s*.9,cy-s*.8);x.lineTo(cx+s*.08,cy+s*.2);x.lineTo(cx-s*.08,cy+s*.2);x.closePath();x.fillStyle='#b8e6f0';x.globalAlpha=.8;x.fill();x.globalAlpha=1;x.strokeStyle=INK;x.lineWidth=2.4;x.stroke();x.beginPath();x.moveTo(cx-s*.62,cy-s*.5);x.lineTo(cx+s*.62,cy-s*.5);x.lineTo(cx,cy+s*.1);x.closePath();x.fillStyle='#ff7ab6';x.fill();brush(x,cx,cy+s*.2,cx,cy+s*.85,s*.1,INK,1,r);brush(x,cx-s*.5,cy+s*.9,cx+s*.5,cy+s*.9,s*.12,INK,1,r);blob(x,cx+s*.75,cy-s*.95,s*.25,'#e8584f',r);},
 pulse(x,cx,cy,s,r){inkRect(x,cx-s*.75,cy-s*.6,s*1.5,s*1.1,'#8aa8c8',s*.25,r);for(const e of [-1,1])blob(x,cx+e*s*.3,cy-s*.1,s*.22,'#5fe0d4',r,{noShine:true});brush(x,cx-s*.3,cy+s*.25,cx+s*.3,cy+s*.25,s*.08,INK,1,r);brush(x,cx,cy-s*.6,cx,cy-s*1.1,s*.07,INK,1,r);blob(x,cx,cy-s*1.15,s*.12,'#ff7ab6',r);},
 moto(x,cx,cy,s,r){for(const e of [-1,1]){blob(x,cx+e*s*.75,cy+s*.35,s*.5,'#2a2230',r);blob(x,cx+e*s*.75,cy+s*.35,s*.2,'#d9b36c',r,{noShine:true});}brush(x,cx-s*.75,cy+s*.35,cx,cy-s*.2,s*.12,'#e8584f',1,r);brush(x,cx,cy-s*.2,cx+s*.75,cy+s*.35,s*.12,'#e8584f',1,r);inkRect(x,cx-s*.35,cy-s*.45,s*.8,s*.3,'#e8584f',8,r);blob(x,cx+s*.1,cy-s*.95,s*.28,'#f4d8a8',r);},
 moonquest(x,cx,cy,s,r){x.beginPath();x.arc(cx-s*.2,cy,s*.9,.5,6.28-.5);x.arc(cx+s*.25,cy,s*.72,6.28-.9,.9,true);x.closePath();x.fillStyle='#f6e2a0';x.fill();x.strokeStyle=INK;x.lineWidth=2.2;x.stroke();brush(x,cx+s*.4,cy+s*.9,cx+s*1.2,cy-s*.9,s*.14,'#c8cfdb',1,r);brush(x,cx+s*.7,cy-s*.35,cx+s*1.05,cy-s*.15,s*.12,'#9a6a40',1,r);},
 ringtoss(x,cx,cy,s,r){brush(x,cx,cy+s*.9,cx,cy-s*.6,s*.2,'#a77a50',1,r);for(const [dy,col] of [[.6,'#e86a7a'],[.25,'#f2c35f'],[-.1,'#6fcf9a']]){x.strokeStyle=INK;x.lineWidth=s*.34;x.beginPath();x.ellipse(cx,cy+dy*s,s*.7,s*.22,0,0,6.283);x.stroke();x.strokeStyle=col;x.lineWidth=s*.24;x.stroke();}},
 gemdig(x,cx,cy,s,r){x.beginPath();x.moveTo(cx-s*.8,cy-s*.2);x.lineTo(cx-s*.4,cy-s*.75);x.lineTo(cx+s*.4,cy-s*.75);x.lineTo(cx+s*.8,cy-s*.2);x.lineTo(cx,cy+s*.85);x.closePath();const g=x.createLinearGradient(cx-s,cy-s,cx+s,cy+s);g.addColorStop(0,'#b8f4ec');g.addColorStop(.5,'#4fc3c0');g.addColorStop(1,'#2a7f9a');x.fillStyle=g;x.fill();x.strokeStyle=INK;x.lineWidth=2.4;x.stroke();x.strokeStyle='rgba(255,255,255,.55)';x.lineWidth=1.4;x.beginPath();x.moveTo(cx-s*.8,cy-s*.2);x.lineTo(cx+s*.8,cy-s*.2);x.moveTo(cx-s*.4,cy-s*.75);x.lineTo(cx-s*.2,cy-s*.2);x.lineTo(cx,cy+s*.85);x.moveTo(cx+s*.4,cy-s*.75);x.lineTo(cx+s*.2,cy-s*.2);x.lineTo(cx,cy+s*.85);x.stroke();brush(x,cx+s*.85,cy+s*.9,cx+s*1.4,cy-s*.3,s*.12,'#9a6a40',1,r);}
};

export function paintMarquee(id,title,genre,color,seed){
 const W=384,H=192,c=mk(W,H),x=c.getContext('2d'),rand=rng(seed*977+13),col=hex(color);
 const bg=x.createLinearGradient(0,0,W,H);bg.addColorStop(0,shade(col,-62));bg.addColorStop(.55,shade(col,-18));bg.addColorStop(1,shade(col,-80));x.fillStyle=bg;x.fillRect(0,0,W,H);
 // painted sunburst
 x.save();x.translate(W*.27,H*.5);for(let i=0;i<18;i++){x.rotate(.349);x.fillStyle=`rgba(255,244,214,${i%2?.1:.04})`;x.beginPath();x.moveTo(0,0);x.lineTo(300,-22);x.lineTo(300,22);x.closePath();x.fill();}x.restore();
 const glow=x.createRadialGradient(W*.27,H*.5,4,W*.27,H*.5,110);glow.addColorStop(0,'rgba(255,240,200,.55)');glow.addColorStop(1,'rgba(255,240,200,0)');x.fillStyle=glow;x.fillRect(0,0,W,H);
 for(let i=0;i<26;i++){x.fillStyle=`rgba(255,246,220,${.15+rand()*.4})`;x.beginPath();x.arc(rand()*W,rand()*H,.8+rand()*1.8,0,6.283);x.fill();}
 x.shadowColor='rgba(10,4,16,.5)';x.shadowBlur=8;x.shadowOffsetY=4;(MOTIFS[id]||MOTIFS.skeeball)(x,W*.27,H*.52,48,rand);x.shadowBlur=0;x.shadowOffsetY=0;
 // title lettering: dark outline, warm fill, slight tilt, like hand-lettered signwork
 const words=title.split(' ');const lines=words.length>2?[words.slice(0,Math.ceil(words.length/2)).join(' '),words.slice(Math.ceil(words.length/2)).join(' ')]:[title];
 x.save();x.translate(W*.66,H*.46);x.rotate(-.045);x.textAlign='center';x.textBaseline='middle';x.lineJoin='round';
 const fs=lines.length>1?36:(title.length>10?34:42);x.font=`700 ${fs}px Fredoka, "Arial Rounded MT Bold", sans-serif`;
 lines.forEach((ln,i)=>{const yy=(i-(lines.length-1)/2)*(fs*1.02);let f=fs;while(x.measureText(ln).width>210&&f>16){f-=2;x.font=`700 ${f}px Fredoka, "Arial Rounded MT Bold", sans-serif`;}x.lineWidth=9;x.strokeStyle=INK;x.strokeText(ln,2,yy+3);x.fillStyle='#ffe8b0';x.lineWidth=0;x.fillText(ln,0,yy);x.fillStyle='rgba(255,255,255,.35)';x.save();x.beginPath();x.rect(-120,yy-fs*.6,240,fs*.3);x.clip();x.fillText(ln,0,yy);x.restore();x.font=`700 ${fs}px Fredoka, "Arial Rounded MT Bold", sans-serif`;});
 x.restore();
 x.font='600 13px Fredoka, "Arial Rounded MT Bold", sans-serif';x.textAlign='center';x.fillStyle='rgba(255,236,200,.9)';x.fillText(genre.toUpperCase(),W*.66,H*.86);
 // brass frame with bulbs
 x.strokeStyle='#d9a864';x.lineWidth=9;x.strokeRect(5,5,W-10,H-10);x.strokeStyle=INK;x.lineWidth=2;x.strokeRect(1.5,1.5,W-3,H-3);x.strokeRect(9.5,9.5,W-19,H-19);
 for(let i=0;i<22;i++){const t=(i+.5)/22;for(const [bx,by] of [[t*W,5],[t*W,H-5]]){x.fillStyle=i%2?'#fff0b8':'#ffb27a';x.shadowColor='#ffd98a';x.shadowBlur=6;x.beginPath();x.arc(bx,by,2.6,0,6.283);x.fill();}}
 x.shadowBlur=0;paperGrain(x,W,H,rand,420);
 return c;
}

export function paintCabinetBody(color,seed){
 const W=128,H=256,c=mk(W,H),x=c.getContext('2d'),rand=rng(seed*5171+3),col=hex(color);
 const base=shade(col,-96);const g=x.createLinearGradient(0,0,W,0);g.addColorStop(0,shade(base,10));g.addColorStop(.5,base);g.addColorStop(1,shade(base,-14));x.fillStyle=g;x.fillRect(0,0,W,H);
 // wood-grain laminate showing through
 for(let i=0;i<46;i++){const px=rand()*W;x.strokeStyle=`rgba(${rand()>.5?'255,210,170':'20,8,16'},${.04+rand()*.07})`;x.lineWidth=.8+rand()*1.5;x.beginPath();x.moveTo(px,0);x.bezierCurveTo(px+(rand()-.5)*12,H*.3,px+(rand()-.5)*12,H*.7,px+(rand()-.5)*8,H);x.stroke();}
 // vinyl side-art: sweeping neon bands
 for(const [ofs,wd,cc,al] of [[.18,16,col,.95],[.3,5,'#ffe3a8',.85],[.38,3,'#ff8fc0',.8]]){x.globalAlpha=al;x.strokeStyle=cc;x.lineWidth=wd;x.lineCap='round';x.beginPath();x.moveTo(-10,H*(ofs+.5));x.bezierCurveTo(W*.3,H*(ofs+.12),W*.7,H*(ofs+.7),W+10,H*(ofs+.15));x.stroke();}
 x.globalAlpha=1;
 for(let i=0;i<22;i++){const px=rand()*W,py=rand()*H*.5,s=2+rand()*4;x.fillStyle=`rgba(255,238,200,${.35+rand()*.5})`;x.beginPath();for(let k=0;k<4;k++){const a=k*1.5708;x.lineTo(px+Math.cos(a)*s,py+Math.sin(a)*s);x.lineTo(px+Math.cos(a+.785)*s*.35,py+Math.sin(a+.785)*s*.35);}x.closePath();x.fill();}
 // scuffs and wear toward the base
 for(let i=0;i<40;i++){x.fillStyle=`rgba(255,235,215,${rand()*.12})`;x.fillRect(rand()*W,H*.65+rand()*H*.35,3+rand()*10,1);}
 x.fillStyle='rgba(8,2,12,.35)';x.fillRect(0,H-22,W,22);
 paperGrain(x,W,H,rand,300);
 return c;
}

const POSTER_TITLES=[['HIGH SCORE','HEROES'],['TOKEN','TUESDAY'],['BEAT FOUNDRY','LIVE'],['MOON MOLES','RETURN'],['LUCKY CLAW','WINNERS'],['TURBO','TUNNELS'],['GLOW BAR','HAPPY HOUR'],['PRIZE','GALLERY']];
export function paintPoster(i){
 const W=192,H=256,c=mk(W,H),x=c.getContext('2d'),rand=rng(i*7919+31);
 const pal=[['#ff7ab6','#3a1f4a'],['#ffc66b','#4a2a2e'],['#5fe0d4','#1f2f4a'],['#7ee08f','#2a3a3a'],['#f4a6c4','#43284a'],['#e8584f','#2a2440'],['#a99bff','#2a2050'],['#ffd98a','#3a2538']][i%8];
 x.fillStyle='#efe0c0';x.fillRect(0,0,W,H);
 const g=x.createLinearGradient(0,0,0,H);g.addColorStop(0,pal[1]);g.addColorStop(1,shade(pal[1],34));x.fillStyle=g;x.fillRect(10,10,W-20,H-20);
 x.save();x.translate(W/2,H*.4);for(let k=0;k<16;k++){x.rotate(.3927);x.fillStyle=`rgba(255,240,210,${k%2?.12:.04})`;x.beginPath();x.moveTo(0,0);x.lineTo(160,-18);x.lineTo(160,18);x.closePath();x.fill();}x.restore();
 const id=['pinball','whack','rhythm','whack','claw','racer','mixology','gemdig'][i%8];x.shadowColor='rgba(0,0,0,.45)';x.shadowBlur=9;x.shadowOffsetY=5;(MOTIFS[id])(x,W/2,H*.4,46,rand);x.shadowBlur=0;x.shadowOffsetY=0;
 x.textAlign='center';x.textBaseline='middle';x.lineJoin='round';
 POSTER_TITLES[i%8].forEach((ln,k)=>{x.font=`700 ${ln.length>9?24:30}px Fredoka, "Arial Rounded MT Bold", sans-serif`;x.lineWidth=7;x.strokeStyle=INK;x.strokeText(ln,W/2,H*.72+k*30);x.fillStyle=k?pal[0]:'#ffe8b0';x.fillText(ln,W/2,H*.72+k*30);});
 x.fillStyle='rgba(255,236,200,.8)';x.font='600 10px Fredoka, sans-serif';x.fillText('★ NEXUS ARCADE ★',W/2,H-24);
 // aged paper: creases, tape, foxing
 x.strokeStyle='rgba(255,255,255,.1)';x.lineWidth=1;x.beginPath();x.moveTo(0,H/2);x.lineTo(W,H/2+3);x.moveTo(W/2,0);x.lineTo(W/2-2,H);x.stroke();
 for(let k=0;k<8;k++){x.fillStyle=`rgba(150,100,50,${.05+rand()*.07})`;x.beginPath();x.arc(rand()*W,rand()*H,4+rand()*9,0,6.283);x.fill();}
 x.fillStyle='rgba(240,225,170,.6)';for(const tx of [6,W-26]){x.save();x.translate(tx+10,6);x.rotate(tx<50?-.4:.4);x.fillRect(-10,-5,20,10);x.restore();}
 paperGrain(x,W,H,rand,260);
 return c;
}

// Soft radial pool used for neon spill and window light
export function paintGlow(){const c=mk(128,128),x=c.getContext('2d'),g=x.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.4,'rgba(255,255,255,.35)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,128,128);return c;}

// Welcome mat for the entrance
export function paintMat(){
 const W=512,H=192,c=mk(W,H),x=c.getContext('2d'),rand=rng(777);
 x.fillStyle='#5a2a3c';x.beginPath();x.roundRect(4,4,W-8,H-8,22);x.fill();x.strokeStyle='#e8b867';x.lineWidth=8;x.stroke();x.strokeStyle='#ff7ab6';x.lineWidth=3;x.beginPath();x.roundRect(20,20,W-40,H-40,14);x.stroke();
 for(let i=0;i<1200;i++){x.fillStyle=`rgba(255,${180+rand()*60|0},${200+rand()*40|0},${rand()*.08})`;x.fillRect(rand()*W,rand()*H,2,2);}
 x.font='700 58px Fredoka, "Arial Rounded MT Bold", sans-serif';x.textAlign='center';x.textBaseline='middle';x.lineJoin='round';x.lineWidth=9;x.strokeStyle=INK;x.strokeText('WELCOME',W/2,H*.45);x.fillStyle='#ffe8b0';x.fillText('WELCOME',W/2,H*.45);
 x.font='600 22px Fredoka, sans-serif';x.fillStyle='#ffc6dc';x.fillText('✦  PLAYERS ONE & ALL  ✦',W/2,H*.8);
 return c;
}

// Jukebox front: chrome arch, glowing tube rainbow, record window, speaker grille and hand-lettered title.
export function paintJukebox(){
 const W=256,H=512,c=mk(W,H),x=c.getContext('2d'),rand=rng(5150);
 const bg=x.createLinearGradient(0,0,W,0);bg.addColorStop(0,'#3a1f3e');bg.addColorStop(.5,'#6a2f55');bg.addColorStop(1,'#3a1f3e');x.fillStyle=bg;x.fillRect(0,0,W,H);
 // arch
 x.beginPath();x.moveTo(14,H-14);x.lineTo(14,150);x.arc(W/2,150,W/2-14,Math.PI,0);x.lineTo(W-14,H-14);x.closePath();
 const chrome=x.createLinearGradient(0,0,W,0);chrome.addColorStop(0,'#8a8fa0');chrome.addColorStop(.3,'#f4f0ea');chrome.addColorStop(.6,'#9aa0b0');chrome.addColorStop(1,'#d8d4cc');x.fillStyle=chrome;x.fill();x.strokeStyle=INK;x.lineWidth=4;x.stroke();
 x.beginPath();x.moveTo(34,H-34);x.lineTo(34,150);x.arc(W/2,150,W/2-34,Math.PI,0);x.lineTo(W-34,H-34);x.closePath();x.fillStyle='#1d1020';x.fill();x.stroke();
 // glowing tube bands inside the arch
 const cols=['#ff7ab6','#ffc66b','#5fe0d4','#a99bff'];
 for(let i=0;i<4;i++){x.shadowColor=cols[i];x.shadowBlur=14;x.strokeStyle=cols[i];x.lineWidth=7;x.lineCap='round';const r=W/2-50-i*13;x.beginPath();x.moveTo(W/2-r,H-60);x.lineTo(W/2-r,150);x.arc(W/2,150,r,Math.PI,0);x.lineTo(W/2+r,H-60);x.stroke();}
 x.shadowBlur=0;
 // record window
 x.fillStyle='#120a16';x.beginPath();x.roundRect(62,150,W-124,130,16);x.fill();x.strokeStyle='#e8b867';x.lineWidth=3;x.stroke();
 const disc=x.createRadialGradient(W/2-8,215,2,W/2,215,52);disc.addColorStop(0,'#f6e7c4');disc.addColorStop(.18,'#d85a67');disc.addColorStop(.22,'#241a2a');disc.addColorStop(1,'#0d0810');x.fillStyle=disc;x.beginPath();x.arc(W/2,215,52,0,6.283);x.fill();
 for(let r=26;r<52;r+=5){x.strokeStyle='rgba(255,255,255,.07)';x.lineWidth=1;x.beginPath();x.arc(W/2,215,r,0,6.283);x.stroke();}
 x.strokeStyle='rgba(255,255,255,.4)';x.lineWidth=2;x.beginPath();x.arc(W/2,215,44,3.6,4.5);x.stroke();
 // title
 x.font='700 34px Fredoka, "Arial Rounded MT Bold", sans-serif';x.textAlign='center';x.textBaseline='middle';x.lineJoin='round';x.lineWidth=7;x.strokeStyle=INK;x.strokeText('JUKEBOX',W/2,78);x.shadowColor='#ffc66b';x.shadowBlur=14;x.fillStyle='#ffe8b0';x.fillText('JUKEBOX',W/2,78);x.shadowBlur=0;
 // selection buttons and grille
 for(let i=0;i<6;i++){blob(x,70+i*23,312,8,cols[i%4],rand,{noShine:false});}
 x.fillStyle='#17101c';x.beginPath();x.roundRect(48,345,W-96,110,10);x.fill();x.strokeStyle='#e8b867';x.lineWidth=2;x.stroke();
 for(let r=0;r<7;r++)for(let q=0;q<10;q++){x.fillStyle=`rgba(255,200,150,${.15+rand()*.25})`;x.beginPath();x.arc(66+q*14,360+r*13,2.6,0,6.283);x.fill();}
 x.fillStyle='rgba(255,236,200,.85)';x.font='600 13px Fredoka, sans-serif';x.fillText('1 TOKEN · 1 SONG',W/2,478);
 paperGrain(x,W,H,rand,500);
 return c;
}
export function paintNote(color){const c=mk(64,64),x=c.getContext('2d');x.shadowColor=color;x.shadowBlur=10;x.fillStyle=color;x.strokeStyle='#fff';x.lineWidth=1.5;x.beginPath();x.ellipse(22,46,9,6.5,-.4,0,6.283);x.fill();x.stroke();x.lineWidth=4;x.strokeStyle=color;x.beginPath();x.moveTo(29,44);x.lineTo(29,10);x.quadraticCurveTo(44,14,46,28);x.stroke();return c;}

// Woven rug: border bands, repeating motifs and visible weave, tinted per rug.
export function paintRug(base,accent,seed=1){
 const S=384,c=mk(S,S),x=c.getContext("2d"),rand=rng(seed*313+5);
 x.fillStyle=base;x.fillRect(0,0,S,S);
 for(let i=0;i<S;i+=2){x.fillStyle=`rgba(${i%4?'255,240,220':'20,10,20'},.05)`;x.fillRect(i,0,1,S);x.fillRect(0,i,S,1);}
 for(const [o,w,col] of [[6,10,accent],[24,3,'#f4e2b8'],[32,6,accent]]){x.strokeStyle=col;x.lineWidth=w;x.strokeRect(o,o,S-o*2,S-o*2);}
 x.save();x.translate(S/2,S/2);for(let k=0;k<12;k++){x.rotate(.5236);x.fillStyle=k%2?accent:'#f4e2b8';x.globalAlpha=.8;x.beginPath();x.moveTo(0,-14);x.lineTo(14,-60);x.lineTo(-14,-60);x.closePath();x.fill();}x.restore();x.globalAlpha=1;
 blob(x,S/2,S/2,20,accent,rand,{noShine:true});blob(x,S/2,S/2,9,'#f4e2b8',rand,{noShine:true});
 for(let i=0;i<10;i++){const t=(i+.5)/10*(S-80)+40;for(const [px,py] of [[t,17],[t,S-17],[17,t],[S-17,t]]){x.fillStyle='#f4e2b8';x.beginPath();x.arc(px,py,3,0,6.283);x.fill();}}
 for(let i=0;i<700;i++){x.fillStyle=`rgba(255,235,210,${rand()*.08})`;x.fillRect(rand()*S,rand()*S,2,1);}
 return c;
}

// Draw a game's emblem (used on cabinet side badges and marquees) at any scale.
export function drawEmblem(ctx,id,cx,cy,s,seed=3){const r=rng(seed*131+9);(MOTIFS[id]||MOTIFS.skeeball)(ctx,cx,cy,s,r);}

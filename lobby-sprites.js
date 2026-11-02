// Illustrated character sprites for the lobby.
// Each visitor is a designed character (silhouette, outfit, hair, accessories, face) drawn with ink outlines and cel shading
// into a small pose sheet (front / side / back views, walk cycle and acting poses), then stood up in the 3D lobby as a
// camera-facing sprite. This is deliberately illustration, not geometry: the shapes below are authored per feature.

const INK='#2a1a2d';
const hexRgb=h=>{const n=parseInt(h.slice(1),16);return[(n>>16)&255,(n>>8)&255,n&255];};
const rgbHex=(r,g,b)=>'#'+((1<<24)+(Math.max(0,Math.min(255,r|0))<<16)+(Math.max(0,Math.min(255,g|0))<<8)+Math.max(0,Math.min(255,b|0))).toString(16).slice(1);
export const mix=(a,b,t)=>{const A=hexRgb(a),B=hexRgb(b);return rgbHex(A[0]+(B[0]-A[0])*t,A[1]+(B[1]-A[1])*t,A[2]+(B[2]-A[2])*t);};
const light=(c,t=.28)=>mix(c,'#fff4dc',t),dark=(c,t=.3)=>mix(c,'#2a1630',t);

export const CELL_W=104,CELL_H=160;
export const POSES={
 front:['idle','walk0','walk1','walk2','walk3','wave','cheer','slump','mash0','mash1','sip','talk'],
 side:['idle','walk0','walk1','walk2','walk3','mash0','mash1'],
 back:['idle','walk0','walk1','walk2','walk3']
};
const COLS=6;
const cellIndex=(view,pose)=>{let base=0;for(const v of ['front','side','back']){if(v===view)return base+POSES[v].indexOf(pose);base+=POSES[v].length;}return 0;};
const TOTAL=POSES.front.length+POSES.side.length+POSES.back.length;
export const atlasSize=()=>({w:COLS*CELL_W,h:Math.ceil(TOTAL/COLS)*CELL_H});
export const cellRect=(view,pose)=>{const i=Math.max(0,cellIndex(view,pose));return{x:(i%COLS)*CELL_W,y:Math.floor(i/COLS)*CELL_H};};

// ───────── drawing helpers ─────────
function paint(ctx,path,color,{ow=2.6,hi=.34,sh=.3,box=null,lightDir=-1}={}){
 ctx.save();
 const b=box||[0,0,CELL_W,CELL_H];
 const g=ctx.createLinearGradient(b[0]+(lightDir<0?0:b[2]),b[1],b[0]+(lightDir<0?b[2]:0),b[1]+b[3]*.6);
 g.addColorStop(0,light(color,.16));g.addColorStop(.5,color);g.addColorStop(1,dark(color,.2));
 ctx.fillStyle=g;ctx.fill(path);
 ctx.clip(path);
 // painted light on the upper-left and a cool shade pooled low and right
 const cx=b[0]+b[2]*.3,cy=b[1]+b[3]*.22,hl=ctx.createRadialGradient(cx,cy,0,cx,cy,Math.max(b[2],b[3])*.55);
 hl.addColorStop(0,`rgba(255,246,222,${hi})`);hl.addColorStop(1,'rgba(255,246,222,0)');ctx.fillStyle=hl;ctx.fillRect(b[0]-4,b[1]-4,b[2]+8,b[3]+8);
 const sx=b[0]+b[2]*.95,sy=b[1]+b[3]*1.0,sg=ctx.createRadialGradient(sx,sy,0,sx,sy,Math.max(b[2],b[3])*.8);
 sg.addColorStop(0,`rgba(40,18,52,${sh})`);sg.addColorStop(1,'rgba(40,18,52,0)');ctx.fillStyle=sg;ctx.fillRect(b[0]-4,b[1]-4,b[2]+8,b[3]+8);
 ctx.restore();
 ctx.lineWidth=ow;ctx.lineJoin='round';ctx.lineCap='round';ctx.strokeStyle=INK;ctx.stroke(path);
}
const P=(f)=>{const p=new Path2D();f(p);return p;};
const ell=(cx,cy,rx,ry,rot=0)=>P(p=>p.ellipse(cx,cy,rx,ry,rot,0,Math.PI*2));
const rrect=(x,y,w,h,r)=>P(p=>p.roundRect(x,y,w,h,r));
// A limb is two strokes: a fat ink stroke under a coloured one, giving a clean consistent outline.
function limb(ctx,pts,w,color,ow=2.4){
 ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
 ctx.strokeStyle=INK;ctx.lineWidth=w+ow*2;ctx.beginPath();pts.forEach((q,i)=>i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]));ctx.stroke();
 ctx.strokeStyle=color;ctx.lineWidth=w;ctx.stroke();
 ctx.strokeStyle='rgba(255,244,220,.26)';ctx.lineWidth=Math.max(1.2,w*.22);ctx.beginPath();pts.forEach((q,i)=>i?ctx.lineTo(q[0]-w*.18,q[1]-.5):ctx.moveTo(q[0]-w*.18,q[1]));ctx.stroke();
 ctx.restore();
}
const line=(ctx,pts,w,color,alpha=1)=>{ctx.save();ctx.globalAlpha=alpha;ctx.strokeStyle=color;ctx.lineWidth=w;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();pts.forEach((q,i)=>i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]));ctx.stroke();ctx.restore();};
const quad=(ctx,a,c,b,w,color,alpha=1)=>{ctx.save();ctx.globalAlpha=alpha;ctx.strokeStyle=color;ctx.lineWidth=w;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.quadraticCurveTo(c[0],c[1],b[0],b[1]);ctx.stroke();ctx.restore();};

// ───────── skeleton ─────────
// Returns joint positions for a view/pose. Units are cell pixels, feet at y=152, centre x=52.
function skeleton(view,pose){
 const walk=pose.startsWith('walk')?Number(pose.slice(4)):-1,ph=walk>=0?walk*Math.PI/2:0;
 const s={cx:52,bob:0,lean:0,head:[0,0],hipY:112,shoulderY:64,headTilt:0,handL:null,handR:null,legL:[0,0,0],legR:[0,0,0],armL:[0,0],armR:[0,0],cup:false,talk:false,mouth:'smile',eyes:'open'};
 if(walk>=0){s.bob=-Math.abs(Math.sin(ph))*2.6;}
 if(view==='side'){
  const a=walk>=0?Math.sin(ph)*.62:.0,b=walk>=0?-Math.sin(ph)*.62:.0;
  s.legL=[a,walk>=0?Math.max(0,Math.cos(ph))*.55:0,0];s.legR=[b,walk>=0?Math.max(0,-Math.cos(ph))*.55:0,0];
  s.armL=[-a*.9,.25];s.armR=[-b*.9,.25];
  if(pose==='idle'){s.armL=[.05,.12];s.armR=[-.05,.12];}
 }else{
  // front/back: stepping reads as alternating lifted feet and swaying arms
  const lift=walk>=0?Math.sin(ph):0;
  s.legL=[0,0,Math.max(0,lift)*7];s.legR=[0,0,Math.max(0,-lift)*7];
  s.armL=[.16+(walk>=0?Math.max(0,-lift)*.4:0),.25];s.armR=[.16+(walk>=0?Math.max(0,lift)*.4:0),.25];
  s.lean=walk>=0?lift*.018:0;
  if(pose==='wave'){s.armR=[2.55,.55];s.mouth='open';}
  if(pose==='cheer'){s.armL=[2.75,.4];s.armR=[2.75,.4];s.mouth='open';s.bob=-5;s.legL[2]=3;s.legR[2]=3;}
  if(pose==='slump'){s.armL=[.05,.08];s.armR=[.05,.08];s.mouth='frown';s.head=[0,4];s.bob=3;s.eyes='sad';}
  if(pose==='sip'){s.armL=[.16,.25];s.armR={t:[18,-14]};s.cup=true;s.eyes='closed';s.sipTarget=true;}
  if(pose==='talk'){s.armR={t:[8,22]};s.armL=[.2,.3];s.mouth='open';}
 }
 if(view==='side'){if(pose==='mash0'){s.armL={t:[18,22]};s.armR={t:[14,26]};s.mouth='focus';}if(pose==='mash1'){s.armL={t:[14,26]};s.armR={t:[18,22]};s.mouth='focus';}}
 return s;
}

// ───────── pieces ─────────
const SKIN_SHADE=(c)=>dark(c,.22);
function drawLegs(ctx,d,view,sk){
 const hipY=sk.hipY+sk.bob,pants=d.pants,shoe=d.shoes;
 const legPts=(dx,leg,flip)=>{
  if(view==='side'){
   const [a,knee]=[leg[0],leg[1]],hx=52+dx*2,thigh=[hx+Math.sin(a)*21,hipY+Math.cos(a)*21],ang2=a-knee,shin=[thigh[0]+Math.sin(ang2)*21,thigh[1]+Math.cos(ang2)*21];
   return{pts:[[hx,hipY],thigh,shin],foot:[shin[0]+3,shin[1]]};
  }
  const hx=52+dx,lift=leg[2];return{pts:[[hx,hipY],[hx+dx*.1,hipY+20-lift*.2],[hx+dx*.15,hipY+39-lift]],foot:[hx+dx*.15,hipY+39-lift]};
 };
 const order=view==='side'?[[-1,sk.legL],[1,sk.legR]]:[[-8,sk.legL],[8,sk.legR]];
 // far leg first
 for(const [dx,leg] of order){
  const {pts,foot}=legPts(dx,leg);
  limb(ctx,pts,view==='side'?11:12,pants);
  // cuff + shoe
  const fx=foot[0],fy=foot[1];
  const sp=view==='side'?P(p=>{p.moveTo(fx-7,fy-2);p.quadraticCurveTo(fx-8,fy+8,fx-2,fy+9);p.lineTo(fx+12,fy+9);p.quadraticCurveTo(fx+16,fy+8,fx+12,fy+2);p.quadraticCurveTo(fx+4,fy-1,fx+3,fy-5);p.lineTo(fx-7,fy-2);p.closePath();})
   :P(p=>{p.moveTo(fx-8,fy-3);p.quadraticCurveTo(fx-10,fy+9,fx-4,fy+10);p.lineTo(fx+4,fy+10);p.quadraticCurveTo(fx+10,fy+9,fx+8,fy-3);p.closePath();});
  paint(ctx,sp,shoe,{box:[fx-10,fy-5,24,16],ow:2.2});
  line(ctx,view==='side'?[[fx-5,fy+8],[fx+13,fy+8]]:[[fx-7,fy+8],[fx+7,fy+8]],2,'rgba(255,244,220,.55)');
 }
}
function torsoPath(d,view,sk){
 const y0=sk.shoulderY+sk.bob,y1=sk.hipY+sk.bob+6,cx=52+sk.lean*40;
 const w=view==='side'?15:d.build==='stocky'?25:d.build==='slim'?19:22,wst=view==='side'?13:w-3;
 if(d.outfit==='dress'&&view!=='side')return P(p=>{p.moveTo(cx-w,y0+2);p.quadraticCurveTo(cx,y0-6,cx+w,y0+2);p.lineTo(cx+wst,y0+40);p.quadraticCurveTo(cx+w+16,y0+60,cx+w+12,y0+72);p.quadraticCurveTo(cx,y0+78,cx-w-12,y0+72);p.quadraticCurveTo(cx-w-16,y0+60,cx-wst,y0+40);p.closePath();});
 return P(p=>{p.moveTo(cx-w,y0+3);p.quadraticCurveTo(cx,y0-7,cx+w,y0+3);p.quadraticCurveTo(cx+w+2,y0+22,cx+wst,y1-4);p.quadraticCurveTo(cx,y1+5,cx-wst,y1-4);p.quadraticCurveTo(cx-w-2,y0+22,cx-w,y0+3);p.closePath();});
}
function drawTorso(ctx,d,view,sk){
 const path=torsoPath(d,view,sk),y0=sk.shoulderY+sk.bob,y1=sk.hipY+sk.bob+6,cx=52+sk.lean*40,w=view==='side'?15:22;
 // hoodie hood sits behind the neck
 if(d.outfit==='hoodie'&&view!=='side')paint(ctx,ell(cx,y0-2,17,10),mix(d.top,'#000000',.08),{box:[cx-17,y0-12,34,20]});
 if(d.outfit==='hoodie'&&view==='side')paint(ctx,ell(cx-7,y0-3,10,10),dark(d.top,.08),{box:[cx-17,y0-13,20,20]});
 paint(ctx,path,d.top,{box:[cx-w-4,y0-4,w*2+8,y1-y0+14]});
 ctx.save();ctx.clip(path);
 const front=view!=='back';
 switch(d.outfit){
  case'tee':case'sweater':
   if(d.stripe){for(let y=y0+10;y<y1;y+=10){line(ctx,[[cx-30,y],[cx+30,y]],4.5,d.stripe,.9);}}
   if(d.outfit==='sweater')line(ctx,[[cx-30,y1-3],[cx+30,y1-3]],5,dark(d.top,.25));
   break;
  case'hoodie':
   if(front&&view==='front'){paint(ctx,rrect(cx-13,y1-22,26,15,5),dark(d.top,.12),{box:[cx-13,y1-22,26,15],ow:1.8});line(ctx,[[cx-3,y0+3],[cx-4,y0+16]],1.8,'#f4ead8');line(ctx,[[cx+3,y0+3],[cx+4,y0+16]],1.8,'#f4ead8');}
   break;
  case'jacket':
   if(view==='front'){paint(ctx,P(p=>{p.moveTo(cx,y0+2);p.lineTo(cx-8,y0+16);p.lineTo(cx-2,y1);p.lineTo(cx+2,y1);p.lineTo(cx+8,y0+16);p.closePath();}),d.accent||'#f4ead8',{box:[cx-8,y0,16,y1-y0],ow:1.8});line(ctx,[[cx,y0+8],[cx,y1]],1.6,INK,.6);for(let i=0;i<3;i++){ctx.fillStyle='#f0d27a';ctx.beginPath();ctx.arc(cx+4,y0+18+i*9,1.6,0,6.3);ctx.fill();}}
   break;
  case'apron':
   if(view!=='side'){paint(ctx,P(p=>{p.moveTo(cx-13,y0+14);p.lineTo(cx+13,y0+14);p.lineTo(cx+17,y1+8);p.lineTo(cx-17,y1+8);p.closePath();}),d.accent||'#f2e6d0',{box:[cx-17,y0+14,34,y1-y0],ow:2});
    paint(ctx,rrect(cx-8,y1-16,16,10,3),dark(d.accent||'#f2e6d0',.12),{box:[cx-8,y1-16,16,10],ow:1.6});}
   break;
  case'overalls':
   if(view!=='side'){for(const s of [-1,1])line(ctx,[[cx+s*10,y0+1],[cx+s*8,y0+22]],4,d.accent||'#5c7fa8');paint(ctx,rrect(cx-13,y0+20,26,y1-y0-14,5),d.accent||'#5c7fa8',{box:[cx-13,y0+20,26,y1-y0-14],ow:2});ctx.fillStyle='#f0d27a';for(const s of [-1,1]){ctx.beginPath();ctx.arc(cx+s*10,y0+22,2,0,6.3);ctx.fill();}}
   break;
  case'vest':
   if(view==='front'){paint(ctx,P(p=>{p.moveTo(cx-12,y0+3);p.lineTo(cx-12,y1);p.lineTo(cx-1,y1);p.lineTo(cx-1,y0+14);p.closePath();p.moveTo(cx+12,y0+3);p.lineTo(cx+12,y1);p.lineTo(cx+1,y1);p.lineTo(cx+1,y0+14);p.closePath();}),d.accent||'#4b3a63',{box:[cx-12,y0,24,y1-y0],ow:2});}
   break;
  case'dress':
   for(let i=0;i<5;i++)quad(ctx,[cx-30,y0+48+i*5],[cx,y0+54+i*5],[cx+30,y0+48+i*5],2,d.accent||light(d.top,.4),.7);
   break;
 }
 // fabric folds and belt
 if(d.outfit!=='dress'&&d.outfit!=='apron')line(ctx,[[cx-w+3,y1-6],[cx+w-3,y1-6]],4,d.belt||dark(d.pants,.1));
 if(d.outfit==='tee'||d.outfit==='hoodie'||d.outfit==='sweater'){quad(ctx,[cx-6,y0+20],[cx-9,y0+30],[cx-4,y0+38],1.4,dark(d.top,.4),.55);quad(ctx,[cx+8,y0+26],[cx+11,y0+33],[cx+6,y0+40],1.4,dark(d.top,.4),.55);}
 ctx.restore();
 // collar / neckline
 if(view!=='back'){
  if(d.outfit==='vest'||d.outfit==='jacket'){paint(ctx,P(p=>{p.moveTo(cx-9,y0-1);p.lineTo(cx,y0+9);p.lineTo(cx+9,y0-1);p.lineTo(cx+5,y0-3);p.lineTo(cx,y0+3);p.lineTo(cx-5,y0-3);p.closePath();}),'#f4ead8',{box:[cx-9,y0-3,18,12],ow:1.6});}
  if(d.bow&&view==='front'){paint(ctx,P(p=>{p.moveTo(cx,y0+5);p.lineTo(cx-8,y0+1);p.lineTo(cx-8,y0+10);p.closePath();p.moveTo(cx,y0+5);p.lineTo(cx+8,y0+1);p.lineTo(cx+8,y0+10);p.closePath();}),d.bow,{box:[cx-8,y0,16,10],ow:1.6});}
 }
 if(d.scarf){paint(ctx,rrect(cx-13,y0-8,26,10,5),d.scarf,{box:[cx-13,y0-8,26,10],ow:2});if(view==='front'){paint(ctx,rrect(cx+3,y0-1,8,18,3),mix(d.scarf,'#000',.12),{box:[cx+3,y0,8,18],ow:1.8});}}
}
function drawArm(ctx,d,view,sk,side){
 // side: -1 = screen-left arm, +1 = screen-right arm (front/back views); side view: -1 far arm, +1 near arm.
 const arm=side<0?sk.armL:sk.armR,y0=sk.shoulderY+sk.bob+4,up=18,low=17;
 const hw=view==='side'?0:(d.build==='stocky'?24:d.build==='slim'?19:22),sx=52+(view==='side'?0:side*hw)+sk.lean*40;
 let ex,ey,wx,wy;
 if(arm.t){ // two-bone IK toward a target hand position (hands in front of the body)
  const tx=sx+(view==='side'?arm.t[0]:-side*arm.t[0]),ty=y0+arm.t[1],dx=tx-sx,dy=ty-y0;let dist=Math.hypot(dx,dy);const maxd=up+low-1.5;if(dist>maxd)dist=maxd;
  const a=Math.min(up,Math.max(-up,(up*up-low*low+dist*dist)/(2*dist))),h=Math.sqrt(Math.max(0,up*up-a*a)),ux=dx/(Math.hypot(dx,dy)||1),uy=dy/(Math.hypot(dx,dy)||1);
  const c1=[sx+ux*a-uy*h,y0+uy*a+ux*h],c2=[sx+ux*a+uy*h,y0+uy*a-ux*h];
  const outwardX=view==='side'?-1:side;const e=(c1[0]*outwardX>c2[0]*outwardX)?c1:c2;
  ex=e[0];ey=e[1];wx=sx+ux*dist;wy=y0+uy*dist;
 }else if(view==='side'){
  const a1=arm[0],a2=a1+arm[1];ex=sx+Math.sin(a1)*up;ey=y0+Math.cos(a1)*up;wx=ex+Math.sin(a2)*low;wy=ey+Math.cos(a2)*low;
 }else{
  // front/back: arm[0] is the outward angle (0 hanging, PI straight up), arm[1] is the inward elbow bend
  const out=arm[0],o2=out-arm[1]*(out>2?-.35:1);
  ex=sx+side*Math.sin(out)*up;ey=y0+Math.cos(out)*up;wx=ex+side*Math.sin(o2)*low;wy=ey+Math.cos(o2)*low;
 }
 limb(ctx,[[sx,y0],[ex,ey],[wx,wy]],9.5,d.sleeve||d.top);
 // cuff, hand, and anything held
 line(ctx,[[ex+(wx-ex)*.72-2.5,ey+(wy-ey)*.72],[ex+(wx-ex)*.72+2.5,ey+(wy-ey)*.72]],2,dark(d.sleeve||d.top,.35),.0);
 paint(ctx,ell(wx,wy+1,5,5.2),d.skin,{box:[wx-5,wy-4,10,10],ow:2});
 if(sk.cup&&side>0){const cp=P(p=>{p.moveTo(wx-4.5,wy-15);p.lineTo(wx+5.5,wy-15);p.lineTo(wx+4,wy-1);p.lineTo(wx-3,wy-1);p.closePath();});paint(ctx,cp,'#f6eedd',{box:[wx-5,wy-15,11,14],ow:1.8});ctx.fillStyle=d.drink||'#ff7ab6';ctx.beginPath();ctx.ellipse(wx+.5,wy-14.5,4.8,2,0,0,6.3);ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=1.3;ctx.stroke();line(ctx,[[wx+2,wy-16],[wx+5.5,wy-25]],1.9,'#fff');}
 return[wx,wy];
}
function drawHairBack(ctx,d,view,hx,hy){
 const h=d.hair,s=d.hairstyle;
 if(s==='long'||s==='bob'){const len=s==='long'?36:20;paint(ctx,P(p=>{p.moveTo(hx-21,hy-6);p.quadraticCurveTo(hx-26,hy+len,hx-14,hy+len+2);p.lineTo(hx+14,hy+len+2);p.quadraticCurveTo(hx+26,hy+len,hx+21,hy-6);p.closePath();}),h,{box:[hx-24,hy-8,48,len+14],ow:2.4});}
 if(s==='curly'){for(const [dx,dy,r] of [[-17,0,10],[17,0,10],[-14,-14,10],[14,-14,10],[0,-21,11],[-20,10,8],[20,10,8]])paint(ctx,ell(hx+dx,hy+dy,r,r),h,{box:[hx+dx-r,hy+dy-r,r*2,r*2],ow:2.2});}
 if(s==='pony'&&view!=='front')paint(ctx,ell(hx,hy+6,22,24),h,{ow:2.2});
 if(s==='pony'){const px=view==='side'?hx-20:hx+19;paint(ctx,P(p=>{p.moveTo(px,hy-6);p.quadraticCurveTo(px+(view==='side'?-16:14),hy+8,px+(view==='side'?-6:6),hy+30);p.quadraticCurveTo(px+(view==='side'?-1:-1),hy+14,px,hy-6);p.closePath();}),h,{box:[px-14,hy-6,28,36],ow:2.2});}
 if(s==='bun'){paint(ctx,ell(hx,hy-26,8.5,8.5),h,{box:[hx-9,hy-35,18,18],ow:2.2});}
}
function drawHead(ctx,d,view,sk){
 const hx=52+sk.lean*40+sk.head[0],hy=36+sk.bob+sk.head[1]+(view==='side'?0:0);
 drawHairBack(ctx,d,view,hx,hy);
 // neck
 paint(ctx,rrect(hx-6,hy+14,12,14,3),SKIN_SHADE(d.skin),{box:[hx-6,hy+14,12,14],ow:2,sh:.15});
 // ears
 if(view!=='side'){for(const s of [-1,1])paint(ctx,ell(hx+s*19,hy+2,4.2,5.5),d.skin,{box:[hx+s*19-4,hy-3,8,11],ow:2});}
 const face=view==='side'?P(p=>{p.moveTo(hx-16,hy-8);p.quadraticCurveTo(hx-20,hy+20,hx-4,hy+24);p.quadraticCurveTo(hx+12,hy+26,hx+17,hy+12);p.quadraticCurveTo(hx+22,hy+9,hx+19,hy+4);p.quadraticCurveTo(hx+17,hy+1,hx+18,hy-3);p.quadraticCurveTo(hx+16,hy-20,hx,hy-21);p.quadraticCurveTo(hx-14,hy-21,hx-16,hy-8);p.closePath();})
  :P(p=>{p.moveTo(hx-19,hy-3);p.quadraticCurveTo(hx-20,hy-22,hx,hy-22);p.quadraticCurveTo(hx+20,hy-22,hx+19,hy-3);p.quadraticCurveTo(hx+19,hy+19,hx+8,hy+23);p.quadraticCurveTo(hx,hy+26,hx-8,hy+23);p.quadraticCurveTo(hx-19,hy+19,hx-19,hy-3);p.closePath();});
 paint(ctx,face,d.skin,{box:[hx-20,hy-22,40,48],ow:2.6,hi:.4,sh:.22});
 if(view==='back'){ // back of head is all hair
  paint(ctx,ell(hx,hy-1,20.5,22.5),d.hair,{box:[hx-20,hy-22,40,46],ow:2.6});
 }else{
  drawFace(ctx,d,view,sk,hx,hy);
  drawHairFront(ctx,d,view,hx,hy);
 }
 if(d.hat)drawHat(ctx,d,view,hx,hy);
 if(d.headphones){const hp=d.headphones;if(view!=='side'){for(const s of [-1,1])paint(ctx,ell(hx+s*21,hy+2,6,8),hp,{box:[hx+s*21-6,hy-6,12,16],ow:2});line(ctx,[[hx-20,hy-6],[hx-12,hy-26],[hx+12,hy-26],[hx+20,hy-6]],3,hp);quad(ctx,[hx-20,hy-6],[hx,hy-34],[hx+20,hy-6],3,INK,.0);}else paint(ctx,ell(hx-2,hy+2,6,8),hp,{ow:2});}
 return[hx,hy];
}
function drawFace(ctx,d,view,sk,hx,hy){
 const fx=view==='side'?hx+8:hx,ex=view==='side'?[[hx+7,hy+3]]:[[hx-8,hy+3],[hx+8,hy+3]];
 // cheeks
 ctx.save();ctx.fillStyle='rgba(235,110,120,.34)';for(const [x] of (view==='side'?[[hx+5]]:[[hx-13],[hx+13]])){ctx.beginPath();ctx.ellipse(x,hy+11,4.8,3.1,0,0,6.3);ctx.fill();}ctx.restore();
 for(const [x,y] of ex){
  if(sk.eyes==='closed'){quad(ctx,[x-3.6,y],[x,y+3],[x+3.6,y],1.9,INK);continue;}
  // eye: soft white, dark iris, two glints
  const sad=sk.eyes==='sad';
  ctx.fillStyle='#fffaf0';ctx.beginPath();ctx.ellipse(x,y,3.8,4.6,0,0,6.3);ctx.fill();
  ctx.fillStyle=d.eye||'#3b2a44';ctx.beginPath();ctx.ellipse(x+(view==='side'?.8:0),y+.5,2.7,3.6,0,0,6.3);ctx.fill();
  ctx.fillStyle='#120a18';ctx.beginPath();ctx.ellipse(x+(view==='side'?.8:0),y+.8,1.5,2.2,0,0,6.3);ctx.fill();
  ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(x+1.3,y-1.4,1.1,0,6.3);ctx.fill();ctx.beginPath();ctx.arc(x-1,y+1.8,.55,0,6.3);ctx.fill();
  ctx.strokeStyle=INK;ctx.lineWidth=1.4;ctx.beginPath();ctx.ellipse(x,y,3.8,4.6,0,Math.PI*1.05,Math.PI*1.95);ctx.stroke();
  // brows
  const bx=x,by=y-8.2,dir=(view==='side'?1:(x<hx?-1:1));
  quad(ctx,[bx-4.2,by+(sad?-1.2*dir*-1:.8)],[bx,by-1.4+(sad?1:0)],[bx+4.2,by+(sad?1.5*(dir<0?1:-1)+.4:.6)],1.9,dark(d.hair==='#none'?'#3a2a2a':d.hair,.35));
 }
 // nose and mouth
 if(view==='side'){line(ctx,[[hx+17,hy+3],[hx+21,hy+8],[hx+17,hy+10]],1.8,SKIN_SHADE(d.skin));quad(ctx,[hx+9,hy+16],[hx+13,hy+19],[hx+16,hy+16],2,INK);}
 else{
  quad(ctx,[hx-1.8,hy+9],[hx+1.5,hy+11.5],[hx+2,hy+9.4],1.5,SKIN_SHADE(d.skin));
  const my=hy+17;
  if(sk.mouth==='open'){ctx.fillStyle='#5a1f33';ctx.beginPath();ctx.ellipse(hx,my,5,4.2,0,0,Math.PI);ctx.quadraticCurveTo(hx,my-2,hx-5,my);ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=1.7;ctx.stroke();ctx.fillStyle='#ef7a88';ctx.beginPath();ctx.ellipse(hx,my+2.4,2.4,1.5,0,0,6.3);ctx.fill();}
  else if(sk.mouth==='frown')quad(ctx,[hx-4.5,my+2],[hx,my-2.4],[hx+4.5,my+2],1.9,INK);
  else if(sk.mouth==='focus'){line(ctx,[[hx-3,my],[hx+3,my]],1.9,INK);}
  else quad(ctx,[hx-4.8,my-1],[hx,my+3.6],[hx+4.8,my-1],1.9,INK);
 }
 if(d.glasses){ctx.strokeStyle=d.glasses;ctx.lineWidth=2;for(const [x,y] of ex){ctx.beginPath();ctx.ellipse(x,y,6.2,6,0,0,6.3);ctx.stroke();ctx.fillStyle='rgba(190,230,255,.18)';ctx.fill();}if(view!=='side')line(ctx,[[hx-2,hy+3],[hx+2,hy+3]],1.8,d.glasses);}
 if(d.freckles){ctx.fillStyle='rgba(150,80,60,.5)';for(const [dx,dy] of [[-12,9],[-9,11],[-15,11],[12,9],[9,11],[15,11]]){ctx.beginPath();ctx.arc(hx+dx*(view==='side'?.3:1)+(view==='side'?6:0),hy+dy,.9,0,6.3);ctx.fill();}}
 if(d.beard&&view!=='side'){paint(ctx,P(p=>{p.moveTo(hx-17,hy+8);p.quadraticCurveTo(hx-16,hy+30,hx,hy+31);p.quadraticCurveTo(hx+16,hy+30,hx+17,hy+8);p.quadraticCurveTo(hx+10,hy+17,hx,hy+16);p.quadraticCurveTo(hx-10,hy+17,hx-17,hy+8);p.closePath();}),d.hair,{box:[hx-17,hy+8,34,24],ow:2.2});quad(ctx,[hx-5,hy+19],[hx,hy+22],[hx+5,hy+19],1.9,'#f0b0a0',.0);}
}
function drawHairFront(ctx,d,view,hx,hy){
 const h=d.hair,s=d.hairstyle,side=view==='side';
 const cap=(top,extra)=>P(p=>{p.moveTo(hx-20,hy-2);p.quadraticCurveTo(hx-23,hy-top,hx,hy-top-3);p.quadraticCurveTo(hx+23,hy-top,hx+20,hy-2);p.quadraticCurveTo(hx+17,hy-10,hx+10,hy-13+extra);p.quadraticCurveTo(hx-2,hy-8,hx-9,hy-12+extra);p.quadraticCurveTo(hx-16,hy-8,hx-20,hy-2);p.closePath();});
 const sideCap=P(p=>{p.moveTo(hx-19,hy+10);p.quadraticCurveTo(hx-24,hy-22,hx,hy-25);p.quadraticCurveTo(hx+20,hy-22,hx+17,hy-8);p.quadraticCurveTo(hx+8,hy-12,hx+2,hy-3);p.quadraticCurveTo(hx-8,hy-4,hx-10,hy+14);p.closePath();});
 const box=[hx-24,hy-28,48,34];
 if(side){paint(ctx,sideCap,h,{box,ow:2.4});if(s==='spiky')for(let i=0;i<4;i++)paint(ctx,P(p=>{p.moveTo(hx-14+i*9,hy-20);p.lineTo(hx-10+i*9,hy-34);p.lineTo(hx-4+i*9,hy-21);p.closePath();}),h,{ow:2});return;}
 switch(s){
  case'short':paint(ctx,cap(21,0),h,{box,ow:2.4});quad(ctx,[hx-10,hy-18],[hx,hy-22],[hx+12,hy-14],1.6,light(h,.4),.7);break;
  case'long':case'bob':paint(ctx,cap(22,2),h,{box,ow:2.4});quad(ctx,[hx+1,hy-23],[hx-4,hy-14],[hx-12,hy-9],1.6,light(h,.4),.7);break;
  case'curly':paint(ctx,ell(hx,hy-17,20,8.5),h,{box:[hx-20,hy-26,40,17],ow:2.3});for(const dx of [-12,-4,5,13])paint(ctx,ell(hx+dx,hy-10,5.2,5.2),h,{ow:1.8});break;
  case'pony':case'bun':paint(ctx,cap(22,-2),h,{box,ow:2.4});quad(ctx,[hx-9,hy-19],[hx,hy-23],[hx+10,hy-17],1.6,light(h,.4),.7);break;
  case'buzz':paint(ctx,P(p=>{p.moveTo(hx-19,hy-4);p.quadraticCurveTo(hx-22,hy-20,hx,hy-22);p.quadraticCurveTo(hx+22,hy-20,hx+19,hy-4);p.quadraticCurveTo(hx,hy-15,hx-19,hy-4);p.closePath();}),h,{box,ow:2.2});break;
  case'spiky':paint(ctx,cap(18,-1),h,{box,ow:2.4});for(let i=0;i<5;i++)paint(ctx,P(p=>{p.moveTo(hx-18+i*8.6,hy-17);p.lineTo(hx-14+i*8.6,hy-34-(i%2)*4);p.lineTo(hx-8+i*8.6,hy-18);p.closePath();}),h,{ow:2});break;
 }
}
function drawHat(ctx,d,view,hx,hy){
 const c=d.hat,side=view==='side';
 if(d.hatKind==='beanie'){paint(ctx,P(p=>{p.moveTo(hx-21,hy-6);p.quadraticCurveTo(hx-23,hy-30,hx,hy-31);p.quadraticCurveTo(hx+23,hy-30,hx+21,hy-6);p.closePath();}),c,{box:[hx-22,hy-32,44,26],ow:2.5});paint(ctx,rrect(hx-22,hy-12,44,9,4),dark(c,.12),{box:[hx-22,hy-12,44,9],ow:2.2});for(let i=-3;i<=3;i++)line(ctx,[[hx+i*6,hy-11],[hx+i*6,hy-5]],1.2,dark(c,.4),.6);paint(ctx,ell(hx,hy-33,4.5,4.5),light(c,.3),{ow:2});}
 else if(d.hatKind==='cap'){paint(ctx,P(p=>{p.moveTo(hx-20,hy-6);p.quadraticCurveTo(hx-22,hy-28,hx,hy-28);p.quadraticCurveTo(hx+22,hy-28,hx+20,hy-6);p.quadraticCurveTo(hx,hy-12,hx-20,hy-6);p.closePath();}),c,{box:[hx-22,hy-29,44,24],ow:2.5});if(view!=='back')paint(ctx,side?P(p=>{p.moveTo(hx+8,hy-10);p.quadraticCurveTo(hx+30,hy-12,hx+27,hy-4);p.quadraticCurveTo(hx+14,hy-5,hx+8,hy-6);p.closePath();}):P(p=>{p.moveTo(hx-17,hy-8);p.quadraticCurveTo(hx,hy+1,hx+17,hy-8);p.quadraticCurveTo(hx,hy-13,hx-17,hy-8);p.closePath();}),dark(c,.18),{box:[hx-18,hy-14,36,14],ow:2.2});ctx.fillStyle='#f4ead8';ctx.beginPath();ctx.arc(hx,hy-20,2.2,0,6.3);ctx.fill();}
 else if(d.hatKind==='chef'){paint(ctx,rrect(hx-17,hy-14,34,10,3),'#fff7ea',{box:[hx-17,hy-14,34,10],ow:2.3});for(const [dx,r] of [[-11,9],[0,11],[11,9]])paint(ctx,ell(hx+dx,hy-23,r,r-1),'#fff7ea',{ow:2.2});}
}

// ───────── public: draw a full character cell ─────────
export function drawCharacter(ctx,d,view,pose,ox=0,oy=0){
 const sk=skeleton(view,pose);sk.hipY=112;sk.shoulderY=64;
 ctx.save();ctx.translate(ox,oy-6); // lift the figure so shoe soles sit inside the cell
 if(d.backpack&&view!=='front'){paint(ctx,rrect(view==='side'?30:34,sk.shoulderY+6+sk.bob,view==='side'?14:36,38,8),d.backpack,{box:[30,sk.shoulderY,36,44],ow:2.4});}
 // far arm behind body (side view) / legs, torso, arms, head
 if(view==='side')drawArm(ctx,d,view,sk,-1);
 drawLegs(ctx,d,view,sk);
 drawTorso(ctx,d,view,sk);
 if(view==='side')drawArm(ctx,d,view,sk,1);
 else{drawArm(ctx,d,view,sk,-1);drawArm(ctx,d,view,sk,1);}
 if(d.backpack&&view==='front'){for(const s of [-1,1])line(ctx,[[52+s*14,sk.shoulderY+4+sk.bob],[52+s*12,sk.shoulderY+34+sk.bob]],4,d.backpack);}
 drawHead(ctx,d,view,sk);
 ctx.restore();
}

// Fixed cast: every regular is an individually designed character.
export const CAST=[
 {name:'Juniper',skin:'#f0c9a5',hair:'#c0492f',hairstyle:'long',eye:'#2f6b57',top:'#d8806f',pants:'#3f5568',shoes:'#e7d6b8',outfit:'hoodie',build:'slim',freckles:true,glasses:null,headphones:'#5fe0d4'},
 {name:'Cass',skin:'#a8745a',hair:'#1f1722',hairstyle:'curly',eye:'#3b2a44',top:'#e0b46f',pants:'#4a4660',shoes:'#c9553f',outfit:'jacket',accent:'#f4ead8',build:'avg',earrings:true},
 {name:'Moss',skin:'#e9b99a',hair:'#4c6a4a',hairstyle:'short',eye:'#4b3a2c',top:'#6aa58f',pants:'#5a4a52',shoes:'#3a2c3a',outfit:'overalls',accent:'#5c7fa8',hat:'#e8c25a',hatKind:'cap',build:'stocky'},
 {name:'Pip',skin:'#d9a07e',hair:'#2c2230',hairstyle:'bun',eye:'#2a1c34',top:'#b09bd1',pants:'#3f5568',shoes:'#f4ead8',outfit:'sweater',stripe:'#e9e0f4',build:'slim',glasses:'#2a1a2d'},
 {name:'Tamsin',skin:'#f0c9a5',hair:'#d9b36a',hairstyle:'pony',eye:'#3f6a96',top:'#e58fa8',pants:'#474a5c',shoes:'#f2e6d0',outfit:'dress',accent:'#fbe3ea',build:'avg'},
 {name:'Bram',skin:'#8d5b45',hair:'#241a22',hairstyle:'buzz',eye:'#2a1c34',top:'#7ea6d6',pants:'#6a5a48',shoes:'#2f2434',outfit:'tee',build:'stocky',beard:true,scarf:'#e6786a'},
 {name:'Odie',skin:'#c98e70',hair:'#7a4a3a',hairstyle:'spiky',eye:'#3b2a44',top:'#9ccb8a',pants:'#474a5c',shoes:'#e8c25a',outfit:'vest',accent:'#4b3a63',bow:'#e6786a',build:'avg',hat:null},
 {name:'Wren',skin:'#f0c9a5',hair:'#707680',hairstyle:'bob',eye:'#3b2a44',top:'#d2c06e',pants:'#4a4660',shoes:'#6a4a58',outfit:'sweater',build:'avg',glasses:'#c99560',hat:'#e58fa8',hatKind:'beanie'},
 {name:'Ivo',skin:'#a8745a',hair:'#1c1620',hairstyle:'short',eye:'#2a1c34',top:'#e8d9bc',pants:'#3f5568',shoes:'#c9553f',outfit:'apron',accent:'#f2e6d0',hat:'#fff7ea',hatKind:'chef',build:'avg',beard:false},
 {name:'Maple',skin:'#e9b99a',hair:'#b86a58',hairstyle:'curly',eye:'#3f6a96',top:'#7ea6d6',pants:'#5a4a52',shoes:'#f4ead8',outfit:'hoodie',build:'slim',backpack:'#9a6a8a',freckles:true},
 {name:'Fenn',skin:'#d9a07e',hair:'#2c2230',hairstyle:'short',eye:'#2a1c34',top:'#c9553f',pants:'#3a3350',shoes:'#f4ead8',outfit:'tee',build:'avg',stripe:'#f2d27a',glasses:'#2a1a2d'},
 {name:'Lark',skin:'#f0c9a5',hair:'#2f2a5a',hairstyle:'long',eye:'#3b2a44',top:'#5fa8a0',pants:'#4a4660',shoes:'#3a2c3a',outfit:'jacket',accent:'#e0b46f',build:'slim',hat:null},
 {name:'Nell',skin:'#8d5b45',hair:'#1f1722',hairstyle:'pony',eye:'#2a1c34',top:'#e0a548',pants:'#3f5568',shoes:'#f4ead8',outfit:'tee',stripe:'#fff1c8',build:'avg',headphones:'#e86a8a'},
 {name:'Rue',skin:'#e9b99a',hair:'#d9c28a',hairstyle:'short',eye:'#4b3a2c',top:'#8e7ab8',pants:'#5a4a52',shoes:'#2f2434',outfit:'hoodie',build:'stocky',hat:'#4c6a4a',hatKind:'beanie'},
 {name:'Mira',skin:'#c98e70',hair:'#2c2230',hairstyle:'bun',eye:'#2a1c34',top:'#7a4a8a',pants:'#2f2b3e',shoes:'#2a1c34',outfit:'jacket',accent:'#f0c58d',build:'avg',earrings:true},
 {name:'Dex',skin:'#e9b99a',hair:'#6a3a2a',hairstyle:'short',eye:'#3b2a44',top:'#f4ead8',pants:'#2f2b3e',shoes:'#2a1c34',outfit:'vest',accent:'#4b3a63',bow:'#e6786a',build:'stocky',beard:true},
 {name:'Hero',skin:'#d9a07e',hair:'#2a1c34',hairstyle:'curly',eye:'#2a1c34',top:'#78c4ae',pants:'#4a4660',shoes:'#3a2c3a',outfit:'hoodie',build:'avg',glasses:'#2a1a2d',freckles:false}
];

// Render a whole pose sheet for one design into a canvas.
export function buildSheet(design,res=1){
 const {w,h}=atlasSize(),c=document.createElement('canvas');c.width=Math.round(w*res);c.height=Math.round(h*res);const ctx=c.getContext('2d');ctx.scale(res,res);
 for(const view of ['front','side','back'])for(const pose of POSES[view]){const r=cellRect(view,pose);drawCharacter(ctx,design,view,pose,r.x,r.y);}
 return c;
}


// ───────── actors: sprite stand-ins placed in the 3D lobby ─────────
const sheetCache=new Map();
export function createActor(THREE,design,{anisotropy=4,height=2.05,res=1}={}){
 const ckey=design.name+'@'+res;let tex=sheetCache.get(ckey);
 const {w,h}=atlasSize();
 if(!tex){tex=new THREE.CanvasTexture(buildSheet(design,res));tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=anisotropy;tex.minFilter=THREE.LinearMipmapLinearFilter;sheetCache.set(ckey,tex);}
 const map=tex.clone();map.needsUpdate=true;map.repeat.set(CELL_W/w,CELL_H/h);
 const mat=new THREE.MeshBasicMaterial({map,transparent:true,alphaTest:.04,toneMapped:false,depthWrite:true});
 const width=height*CELL_W/CELL_H,mesh=new THREE.Mesh(new THREE.PlaneGeometry(width,height),mat);
 mesh.position.y=height/2-height*(14/CELL_H);
 const tilt=new THREE.Group();tilt.rotation.x=-.5;tilt.add(mesh);
 const root=new THREE.Group();root.add(tilt);
 let cur='';
 const actor={root,mesh,design,
  // heading is the character's world yaw (0 faces +z, towards the camera). pose may force a view.
  set(heading,pose='idle',forceView=null,bob=0){
   const fz=Math.cos(heading),fx=Math.sin(heading);
   let view=forceView||(fz>.55?'front':fz<-.55?'back':'side');
   let p=pose;if(!POSES[view].includes(p))p=view==='front'?'idle':(p.startsWith('walk')?p:'idle');
   const flip=view==='side'&&fx<0;
   const key=view+':'+p;
   if(key!==cur){cur=key;const r=cellRect(view,p);map.offset.set(r.x/w,1-(r.y+CELL_H)/h);}
   mesh.scale.x=flip?-1:1;mesh.scale.y=1+bob;
   return view;
  }};
 actor.set(0,'idle');
 return actor;
}

// ───────── cabinet illustrations (side profile, facing right) ─────────
import { drawEmblem } from './lobby-art.js';
export const CAB_W=160,CAB_H=224;
// Push a colour toward a richer, brighter version of itself so cabinets pop against the carpet.
function vivid(h,sat=1.45,lift=.04){const[r,g,b]=hexRgb(h).map(v=>v/255),mx=Math.max(r,g,b),mn=Math.min(r,g,b),l=(mx+mn)/2;let hh=0,ss=0;if(mx!==mn){const d=mx-mn;ss=l>.5?d/(2-mx-mn):d/(mx+mn);hh=mx===r?(g-b)/d+(g<b?6:0):mx===g?(b-r)/d+2:(r-g)/d+4;hh/=6;}
 ss=Math.min(1,ss*sat);const L=Math.min(.78,l+lift),q=L<.5?L*(1+ss):L+ss-L*ss,p=2*L-q,f=t=>{t=(t+1)%1;return t<1/6?p+(q-p)*6*t:t<.5?q:t<2/3?p+(q-p)*(2/3-t)*6:p;};
 return ss===0?rgbHex(L*255,L*255,L*255):rgbHex(f(hh+1/3)*255,f(hh)*255,f(hh-1/3)*255);}
const BODY_KIND={racer:'sitdown',moto:'sitdown',pinball:'pinball',claw:'glass',ringtoss:'glass',gemdig:'glass',hoops:'hoops'};
const hexOf=n=>'#'+(n>>>0).toString(16).padStart(6,'0');
export function drawCabinet(ctx,id,colorNum,variant=0){
 const col=vivid(hexOf(colorNum)),body=mix(col,'#2b2036',.3),bodyL=mix(col,'#2b2036',.14),trim=mix(col,'#fff4dc',.15),kind=BODY_KIND[id]||'upright';
 const W=CAB_W,H=CAB_H;ctx.save();
 // soft contact shadow
 const sg=ctx.createRadialGradient(80,214,4,80,214,70);sg.addColorStop(0,'rgba(20,8,28,.35)');sg.addColorStop(1,'rgba(20,8,28,0)');ctx.fillStyle=sg;ctx.beginPath();ctx.ellipse(80,214,70,9,0,0,6.3);ctx.fill();
 const stripes=(path,box)=>{ctx.save();ctx.clip(path);
  for(const [o,w,c,a] of [[.2,15,col,.95],[.34,5,'#ffe3a8',.9],[.42,3,'#ff8fc0',.85]]){ctx.globalAlpha=a;ctx.strokeStyle=c;ctx.lineWidth=w;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(box[0]-10,box[1]+box[3]*(o+.5));ctx.bezierCurveTo(box[0]+box[2]*.3,box[1]+box[3]*(o+.05),box[0]+box[2]*.7,box[1]+box[3]*(o+.75),box[0]+box[2]+10,box[1]+box[3]*(o+.12));ctx.stroke();}
  ctx.globalAlpha=1;ctx.fillStyle='rgba(255,240,205,.8)';for(let i=0;i<9;i++){const x=box[0]+8+((i*37+variant*13)%(box[2]-16)),y=box[1]+8+((i*53)%(box[3]*.45));ctx.beginPath();for(let k=0;k<4;k++){const a=k*1.5708;ctx.lineTo(x+Math.cos(a)*3,y+Math.sin(a)*3);ctx.lineTo(x+Math.cos(a+.785)*1,y+Math.sin(a+.785)*1);}ctx.fill();}ctx.restore();};
 const badge=(cx,cy,r)=>{paintShape(ctx,P(p=>p.arc(cx,cy,r,0,6.3)),'#2a1c34',{box:[cx-r,cy-r,r*2,r*2],ow:2.4});ctx.save();ctx.beginPath();ctx.arc(cx,cy,r-3,0,6.3);ctx.clip();const g=ctx.createRadialGradient(cx,cy-r*.4,2,cx,cy,r);g.addColorStop(0,mix(col,'#fff4dc',.35));g.addColorStop(1,mix(col,'#2b2036',.35));ctx.fillStyle=g;ctx.fillRect(cx-r,cy-r,r*2,r*2);drawEmblem(ctx,id,cx,cy+1,r*.5,variant+2);ctx.restore();};
 if(kind==='upright'||kind==='hoops'){
  // back column + side panel
  const main=P(p=>{p.moveTo(26,30);p.lineTo(84,30);p.lineTo(92,56);p.lineTo(98,104);p.lineTo(112,108);p.lineTo(112,128);p.lineTo(104,132);p.lineTo(104,200);p.lineTo(26,200);p.closePath();});
  paintShape(ctx,main,body,{box:[26,30,86,170],ow:3});stripes(main,[26,60,78,140]);
  // screen housing (angled) and glowing screen glimpse
  const hous=P(p=>{p.moveTo(76,44);p.lineTo(96,44);p.lineTo(104,104);p.lineTo(80,108);p.closePath();});paintShape(ctx,hous,bodyL,{box:[76,44,28,64],ow:2.6});
  paintShape(ctx,P(p=>{p.moveTo(94,50);p.lineTo(98,50);p.lineTo(103,100);p.lineTo(99,101);p.closePath();}),mix(col,'#ffffff',.55),{box:[94,50,9,52],ow:1.6,hi:.6});
  // control deck with joystick and buttons
  const deck=P(p=>{p.moveTo(84,106);p.lineTo(126,112);p.quadraticCurveTo(130,120,124,124);p.lineTo(84,124);p.closePath();});paintShape(ctx,deck,mix(col,'#2b2036',.2),{box:[84,106,46,20],ow:2.6});
  line(ctx,[[112,111],[112,98]],3,'#2a1c34');paintShape(ctx,ell(112,96,5,5),'#e8584f',{box:[107,91,10,10],ow:2});
  for(const [bx,by,c] of [[100,113,'#ffd96a'],[92,111,'#5fe0d4']])paintShape(ctx,ell(bx,by,3.6,2.4),c,{box:[bx-4,by-3,8,6],ow:1.6});
  // coin door
  paintShape(ctx,rrect(76,138,24,36,4),'#33263d',{box:[76,138,24,36],ow:2.2});ctx.fillStyle='#ffd96a';ctx.fillRect(84,148,8,3);ctx.fillRect(84,155,8,3);line(ctx,[[82,166],[94,166]],2,mix(col,'#ffffff',.3));
  // kick plate + feet
  paintShape(ctx,rrect(22,196,86,12,4),'#2a1c34',{box:[22,196,86,12],ow:2.4});
  badge(54,128,22);
  // speaker grille
  ctx.save();ctx.clip(main);for(let i=0;i<4;i++)line(ctx,[[34,170+i*6],[68,170+i*6]],2,'rgba(20,8,28,.55)');ctx.restore();
  // marquee box
  const mq=rrect(30,10,76,28,6);paintShape(ctx,mq,trim,{box:[30,10,76,28],ow:2.8});
  for(let i=0;i<6;i++){ctx.fillStyle=i%2?'#fff0b0':'#ffb27a';ctx.beginPath();ctx.arc(38+i*12,32,2,0,6.3);ctx.fill();}
  if(kind==='hoops'){paintShape(ctx,rrect(40,2,56,10,4),'#e8884a',{box:[40,2,56,10],ow:2});}
 }else if(kind==='sitdown'){
  // low wide racing seat cabinet
  const base=P(p=>{p.moveTo(20,196);p.lineTo(20,130);p.quadraticCurveTo(24,112,44,108);p.lineTo(70,108);p.lineTo(84,120);p.lineTo(130,124);p.lineTo(134,196);p.closePath();});paintShape(ctx,base,body,{box:[20,108,114,90],ow:3});stripes(base,[20,110,114,86]);
  paintShape(ctx,rrect(26,70,34,50,12),mix(col,'#2b2036',.3),{box:[26,70,34,50],ow:2.6});// seat back
  paintShape(ctx,rrect(34,104,40,14,6),mix(col,'#2b2036',.2),{box:[34,104,40,14],ow:2.2});// seat cushion
  const tower=P(p=>{p.moveTo(84,28);p.lineTo(130,28);p.lineTo(134,100);p.lineTo(90,118);p.closePath();});paintShape(ctx,tower,bodyL,{box:[84,28,50,90],ow:2.8});
  paintShape(ctx,P(p=>{p.moveTo(120,34);p.lineTo(126,34);p.lineTo(129,98);p.lineTo(124,100);p.closePath();}),mix(col,'#ffffff',.55),{box:[120,34,9,66],ow:1.6,hi:.6});
  paintShape(ctx,ell(118,118,15,6),'#2a1c34',{box:[103,112,30,12],ow:2.4});line(ctx,[[118,116],[110,100]],3,'#2a1c34');paintShape(ctx,ell(108,98,12,12),mix(col,'#2b2036',.1),{box:[96,86,24,24],ow:2.6});line(ctx,[[102,98],[114,98]],2,'#ffd96a');
  paintShape(ctx,rrect(88,148,26,28,4),'#33263d',{box:[88,148,26,28],ow:2.2});ctx.fillStyle='#ffd96a';ctx.fillRect(96,158,9,3);
  paintShape(ctx,rrect(16,192,124,12,4),'#2a1c34',{box:[16,192,124,12],ow:2.4});
  badge(52,162,17);
  paintShape(ctx,rrect(84,8,56,22,6),trim,{box:[84,8,56,22],ow:2.8});for(let i=0;i<5;i++){ctx.fillStyle=i%2?'#fff0b0':'#ffb27a';ctx.beginPath();ctx.arc(92+i*10,25,1.8,0,6.3);ctx.fill();}
 }else if(kind==='pinball'){
  const backbox=P(p=>{p.moveTo(24,30);p.lineTo(76,30);p.lineTo(80,110);p.lineTo(24,110);p.closePath();});paintShape(ctx,backbox,bodyL,{box:[24,30,56,80],ow:2.8});stripes(backbox,[24,30,56,80]);
  ctx.save();ctx.clip(backbox);const g=ctx.createLinearGradient(0,30,0,110);g.addColorStop(0,mix(col,'#ffffff',.5));g.addColorStop(1,mix(col,'#2b2036',.3));ctx.fillStyle=g;ctx.globalAlpha=.9;ctx.fillRect(32,38,40,50);ctx.restore();
  drawEmblem(ctx,'pinball',52,64,18,variant+1);
  const cab=P(p=>{p.moveTo(24,110);p.lineTo(138,92);p.lineTo(150,106);p.lineTo(150,140);p.lineTo(138,146);p.lineTo(138,200);p.lineTo(26,200);p.closePath();});paintShape(ctx,cab,body,{box:[24,92,126,108],ow:3});stripes(cab,[24,100,126,100]);
  line(ctx,[[44,108],[136,94]],3,mix(col,'#ffffff',.5));
  for(const [lx,ly] of [[40,200],[124,200]])paintShape(ctx,rrect(lx-6,194,12,14,3),'#2a1c34',{box:[lx-6,194,12,14],ow:2});
  paintShape(ctx,ell(142,121,5,5),'#e8584f',{box:[137,116,10,10],ow:2});
  badge(78,160,20);
  paintShape(ctx,rrect(26,14,52,18,6),trim,{box:[26,14,52,18],ow:2.6});
 }else if(kind==='glass'){
  // prize-claw style glass cabinet full of little prizes
  const base=P(p=>{p.moveTo(22,200);p.lineTo(22,136);p.lineTo(126,136);p.lineTo(126,200);p.closePath();});paintShape(ctx,base,body,{box:[22,136,104,64],ow:3});stripes(base,[22,138,104,60]);
  const glass=P(p=>{p.moveTo(26,34);p.lineTo(122,34);p.lineTo(122,136);p.lineTo(26,136);p.closePath();});
  ctx.save();ctx.clip(glass);const gg=ctx.createLinearGradient(26,34,122,136);gg.addColorStop(0,'rgba(210,240,255,.55)');gg.addColorStop(1,'rgba(150,200,230,.35)');ctx.fillStyle=gg;ctx.fillRect(26,34,96,102);
  const pc=[col,'#f4a6c4','#ffd96a','#7ee08f','#a99bff','#ff8f6a'];for(let i=0;i<14;i++){const x=34+(i*23+variant*7)%80,y=100+Math.floor(i/5)*12-(i%3)*4,r=7+(i%3)*2;paintShape(ctx,ell(x,y,r,r),pc[i%6],{box:[x-r,y-r,r*2,r*2],ow:1.8});}
  ctx.restore();ctx.strokeStyle=INK;ctx.lineWidth=3;ctx.stroke(glass);ctx.strokeStyle='rgba(255,255,255,.65)';ctx.lineWidth=2.4;ctx.beginPath();ctx.moveTo(34,40);ctx.lineTo(34,100);ctx.stroke();
  line(ctx,[[74,34],[74,70]],3,'#2a1c34');paintShape(ctx,P(p=>{p.moveTo(64,70);p.lineTo(84,70);p.lineTo(80,84);p.lineTo(68,84);p.closePath();}),'#c8cfdb',{box:[64,70,20,14],ow:2});
  paintShape(ctx,rrect(100,126,28,14,5),mix(col,'#2b2036',.2),{box:[100,126,28,14],ow:2.2});line(ctx,[[112,126],[112,116]],3,'#2a1c34');paintShape(ctx,ell(112,114,5,5),'#e8584f',{box:[107,109,10,10],ow:2});
  badge(60,172,17);paintShape(ctx,rrect(26,10,96,24,6),trim,{box:[26,10,96,24],ow:2.8});for(let i=0;i<7;i++){ctx.fillStyle=i%2?'#fff0b0':'#ffb27a';ctx.beginPath();ctx.arc(36+i*13,28,2,0,6.3);ctx.fill();}
 }
 ctx.restore();
}
// local alias (paint is module-private above)
function paintShape(ctx,path,color,o){return paint(ctx,path,color,o);}

export function createCabinetSprite(THREE,def,{anisotropy=4,height=3.7,variant=0}={}){
 const [,id,,,color]=def,c=document.createElement('canvas');c.width=CAB_W;c.height=CAB_H;drawCabinet(c.getContext('2d'),id,color,variant);
 const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=anisotropy;tex.minFilter=THREE.LinearMipmapLinearFilter;
 const width=height*CAB_W/CAB_H,mesh=new THREE.Mesh(new THREE.PlaneGeometry(width,height),new THREE.MeshBasicMaterial({map:tex,transparent:true,alphaTest:.04,toneMapped:false}));
 mesh.position.y=height/2-height*(10/CAB_H);
 const tilt=new THREE.Group();tilt.rotation.x=-.5;tilt.add(mesh);const root=new THREE.Group();root.add(tilt);
 return{root,mesh,tex};
}

// ───────── prize gallery illustrations ─────────
export const PRIZE_KINDS=['bear','rocket','trophy','gift','bunny','robot','crown','moon','pad','star','balloons','cat'];
export function drawPrizeItem(ctx,kind,cx,by,s=1){
 // cx = centre x, by = baseline y (sitting on the shelf). Everything is ~70 units tall at s=1.
 ctx.save();ctx.translate(cx,by);ctx.scale(s,s);
 const o={ow:2.4};
 const fur=(c)=>paintShape;
 switch(kind){
  case'bear':{const c='#c68a68';paintShape(ctx,ell(-17,-56,9,9),c,{box:[-26,-65,18,18],...o});paintShape(ctx,ell(17,-56,9,9),c,{box:[8,-65,18,18],...o});paintShape(ctx,ell(0,-26,23,24),c,{box:[-23,-50,46,48],...o});paintShape(ctx,ell(0,-52,21,19),c,{box:[-21,-71,42,38],...o});paintShape(ctx,ell(0,-20,13,14),'#f0d6ad',{box:[-13,-34,26,28],ow:1.8});paintShape(ctx,ell(0,-47,9,7),'#f0d6ad',{box:[-9,-54,18,14],ow:1.8});ctx.fillStyle=INK;ctx.beginPath();ctx.ellipse(-7,-55,2.2,3,0,0,6.3);ctx.ellipse(7,-55,2.2,3,0,0,6.3);ctx.ellipse(0,-48,2.6,2,0,0,6.3);ctx.fill();paintShape(ctx,P(p=>{p.moveTo(0,-36);p.lineTo(-11,-41);p.lineTo(-11,-31);p.closePath();p.moveTo(0,-36);p.lineTo(11,-41);p.lineTo(11,-31);p.closePath();}),'#e8584f',{box:[-11,-41,22,10],ow:1.8});break;}
  case'bunny':{const c='#f4e3ee';for(const x of [-8,8])paintShape(ctx,ell(x,-66,6,17,x<0?-.12:.12),c,{box:[x-6,-83,12,34],...o});for(const x of [-8,8])paintShape(ctx,ell(x,-65,2.6,11,x<0?-.12:.12),'#f4a6c4',{ow:0});paintShape(ctx,ell(0,-22,22,22),c,{box:[-22,-44,44,44],...o});paintShape(ctx,ell(0,-46,18,16),c,{box:[-18,-62,36,32],...o});ctx.fillStyle=INK;ctx.beginPath();ctx.ellipse(-6,-47,2,3,0,0,6.3);ctx.ellipse(6,-47,2,3,0,0,6.3);ctx.fill();ctx.fillStyle='#f4a6c4';ctx.beginPath();ctx.ellipse(0,-42,2.6,2,0,0,6.3);ctx.fill();paintShape(ctx,ell(14,-10,7,7),'#fff',{box:[7,-17,14,14],ow:1.8});break;}
  case'rocket':{paintShape(ctx,P(p=>{p.moveTo(-18,-8);p.lineTo(-30,6);p.lineTo(-14,-2);p.closePath();p.moveTo(18,-8);p.lineTo(30,6);p.lineTo(14,-2);p.closePath();}),'#e8584f',{box:[-30,-8,60,16],...o});paintShape(ctx,P(p=>{p.moveTo(0,-76);p.quadraticCurveTo(22,-50,16,0);p.lineTo(-16,0);p.quadraticCurveTo(-22,-50,0,-76);p.closePath();}),'#f4ead8',{box:[-20,-76,40,76],...o});paintShape(ctx,P(p=>{p.moveTo(0,-76);p.quadraticCurveTo(12,-64,14,-52);p.lineTo(-14,-52);p.quadraticCurveTo(-12,-64,0,-76);p.closePath();}),'#e8584f',{box:[-14,-76,28,24],...o});paintShape(ctx,ell(0,-34,8,8),'#7fd7e8',{box:[-8,-42,16,16],ow:2.2,hi:.7});break;}
  case'trophy':{line(ctx,[[-17,-52],[-26,-48],[-24,-36],[-14,-33]],3.4,'#c99a2e');line(ctx,[[17,-52],[26,-48],[24,-36],[14,-33]],3.4,'#c99a2e');paintShape(ctx,P(p=>{p.moveTo(-18,-70);p.lineTo(18,-70);p.quadraticCurveTo(18,-34,0,-30);p.quadraticCurveTo(-18,-34,-18,-70);p.closePath();}),'#f0c85a',{box:[-18,-70,36,40],...o,hi:.6});paintShape(ctx,rrect(-4,-32,8,14,2),'#d9ad4a',{box:[-4,-32,8,14],ow:2});paintShape(ctx,rrect(-14,-20,28,16,3),'#6a4a58',{box:[-14,-20,28,16],ow:2.2});drawStar(ctx,0,-52,7,'#fff2b0');break;}
  case'gift':{paintShape(ctx,rrect(-24,-38,48,38,4),'#7fb8d8',{box:[-24,-38,48,38],...o});paintShape(ctx,rrect(-27,-50,54,14,4),'#9ccbe8',{box:[-27,-50,54,14],...o});paintShape(ctx,rrect(-5,-50,10,50,0),'#f4a6c4',{box:[-5,-50,10,50],ow:2});paintShape(ctx,ell(-9,-58,9,6,-.4),'#f4a6c4',{box:[-18,-64,18,12],ow:2.2});paintShape(ctx,ell(9,-58,9,6,.4),'#f4a6c4',{box:[0,-64,18,12],ow:2.2});break;}
  case'robot':{line(ctx,[[0,-74],[0,-62]],2.6,INK);paintShape(ctx,ell(0,-76,3.6,3.6),'#e8584f',{ow:1.8});paintShape(ctx,rrect(-17,-62,34,26,6),'#a9bdd0',{box:[-17,-62,34,26],...o});paintShape(ctx,rrect(-20,-34,40,32,5),'#8aa4bd',{box:[-20,-34,40,32],...o});ctx.fillStyle='#5fe0d4';ctx.beginPath();ctx.ellipse(-6,-50,4,4.4,0,0,6.3);ctx.ellipse(6,-50,4,4.4,0,0,6.3);ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=1.6;ctx.stroke();paintShape(ctx,rrect(-9,-26,18,12,3),'#2a1c34',{box:[-9,-26,18,12],ow:1.8});ctx.fillStyle='#ffd96a';ctx.fillRect(-5,-22,3,4);ctx.fillRect(2,-22,3,4);for(const x of [-26,26])paintShape(ctx,rrect(x-4,-32,8,22,4),'#a9bdd0',{box:[x-4,-32,8,22],ow:2});break;}
  case'crown':{paintShape(ctx,P(p=>{p.moveTo(-26,-6);p.lineTo(-28,-48);p.lineTo(-13,-30);p.lineTo(0,-56);p.lineTo(13,-30);p.lineTo(28,-48);p.lineTo(26,-6);p.closePath();}),'#f0c85a',{box:[-28,-56,56,50],...o,hi:.6});for(const [x,c] of [[-14,'#e8584f'],[0,'#7fb8d8'],[14,'#e8584f']]){paintShape(ctx,ell(x,-18,4.5,4.5),c,{box:[x-5,-23,10,10],ow:1.8,hi:.8});}for(const x of [-28,0,28])paintShape(ctx,ell(x,x?-50:-58,3.2,3.2),'#fff6d8',{ow:1.8});break;}
  case'moon':{paintShape(ctx,P(p=>{p.arc(0,-34,30,.4,6.28-.4);p.quadraticCurveTo(10,-34,26,-16);p.closePath();}),'#f6e2a0',{box:[-30,-64,60,60],...o,hi:.7});ctx.fillStyle=INK;ctx.beginPath();ctx.ellipse(-14,-38,2,3,0,0,6.3);ctx.fill();quad(ctx,[-18,-26],[-12,-21],[-6,-27],1.8,INK);ctx.fillStyle='rgba(235,110,120,.45)';ctx.beginPath();ctx.ellipse(-22,-30,4,2.6,0,0,6.3);ctx.fill();drawStar(ctx,22,-62,6,'#fff2b0');break;}
  case'pad':{paintShape(ctx,P(p=>{p.moveTo(-30,-26);p.quadraticCurveTo(-34,-8,-24,-4);p.quadraticCurveTo(-16,-4,-12,-14);p.lineTo(12,-14);p.quadraticCurveTo(16,-4,24,-4);p.quadraticCurveTo(34,-8,30,-26);p.quadraticCurveTo(26,-40,0,-40);p.quadraticCurveTo(-26,-40,-30,-26);p.closePath();}),'#9a86d8',{box:[-34,-40,68,36],...o});paintShape(ctx,rrect(-23,-30,12,4,1),'#2a1c34',{ow:1});paintShape(ctx,rrect(-19,-34,4,12,1),'#2a1c34',{ow:1});for(const [x,y,c] of [[20,-32,'#e8584f'],[26,-26,'#ffd96a'],[14,-26,'#5fe0d4'],[20,-20,'#7ee08f']])paintShape(ctx,ell(x,y,3.4,3.4),c,{box:[x-3.4,y-3.4,6.8,6.8],ow:1.6});break;}
  case'star':{drawStar(ctx,0,-36,34,'#ffd96a');ctx.fillStyle=INK;ctx.beginPath();ctx.ellipse(-8,-36,2.6,3.6,0,0,6.3);ctx.ellipse(8,-36,2.6,3.6,0,0,6.3);ctx.fill();quad(ctx,[-5,-27],[0,-22],[5,-27],2,INK);ctx.fillStyle='rgba(235,110,120,.5)';ctx.beginPath();ctx.ellipse(-15,-29,4,2.6,0,0,6.3);ctx.ellipse(15,-29,4,2.6,0,0,6.3);ctx.fill();break;}
  case'balloons':{for(const [x,y,c,r] of [[-14,-56,'#e8584f',13],[0,-66,'#5fe0d4',14],[14,-54,'#ffd96a',13]]){line(ctx,[[x,y+r],[0,-2]],1.4,INK);paintShape(ctx,P(p=>{p.ellipse(x,y,r,r*1.15,0,0,6.3);}),c,{box:[x-r,y-r*1.15,r*2,r*2.3],...o,hi:.7});}paintShape(ctx,rrect(-6,-8,12,8,2),'#6a4a58',{ow:1.8});break;}
  case'cat':{const c='#8d8aa6';paintShape(ctx,P(p=>{p.moveTo(-18,-60);p.lineTo(-20,-76);p.lineTo(-7,-66);p.closePath();p.moveTo(18,-60);p.lineTo(20,-76);p.lineTo(7,-66);p.closePath();}),c,{box:[-20,-76,40,18],...o});paintShape(ctx,ell(0,-24,22,23),c,{box:[-22,-47,44,46],...o});paintShape(ctx,ell(0,-52,20,17),c,{box:[-20,-69,40,34],...o});ctx.fillStyle='#ffd96a';ctx.beginPath();ctx.ellipse(-7,-53,3.4,4.4,0,0,6.3);ctx.ellipse(7,-53,3.4,4.4,0,0,6.3);ctx.fill();ctx.fillStyle=INK;ctx.beginPath();ctx.ellipse(-7,-53,1.3,3.6,0,0,6.3);ctx.ellipse(7,-53,1.3,3.6,0,0,6.3);ctx.fill();quad(ctx,[-4,-44],[0,-41],[4,-44],1.8,INK);line(ctx,[[-24,-46],[-12,-45]],1.2,INK);line(ctx,[[24,-46],[12,-45]],1.2,INK);quad(ctx,[18,-8],[34,-14],[30,-34],5,c);break;}
 }
 ctx.restore();
}
function drawStar(ctx,cx,cy,r,color){paintShape(ctx,P(p=>{for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,q=i%2?r*.5:r;const x=cx+Math.cos(a)*q,y=cy+Math.sin(a)*q;i?p.lineTo(x,y):p.moveTo(x,y);}p.closePath();}),color,{box:[cx-r,cy-r,r*2,r*2],ow:2.4,hi:.6});}

// Illustrated collection wall for the prize gallery. items: [{kind,name,owned(quantity)}]
export const GALLERY_ITEMS=[
 {id:'sticker-pack',kind:'star',name:'STICKER PACK'},{id:'keychain',kind:'rocket',name:'COMET KEYCHAIN'},{id:'mystery-capsule',kind:'gift',name:'MYSTERY CAPSULE'},{id:'clay-figure',kind:'robot',name:'CLAY FIGURE'},{id:'moon-moth',kind:'moon',name:'MOON MOTH'},{id:'comet-bear',kind:'bear',name:'COMET BEAR'},
 {id:'slime-kit',kind:'balloons',name:'SLIME LAB'},{id:'puzzle-cube',kind:'cat',name:'PUZZLE CUBE'},{id:'robot-kit',kind:'robot',name:'POCKET BOT'},{id:'star-projector',kind:'moon',name:'GALAXY LAMP'},{id:'mini-speaker',kind:'pad',name:'MINI SPEAKER'},{id:'gaming-headset',kind:'pad',name:'HEADSET'},
 {id:'retro-handheld',kind:'pad',name:'RETRO HANDHELD'},{id:'grand-prize',kind:'crown',name:'GRAND PRIZE'},{id:'vip-night',kind:'crown',name:'VIP NIGHT'},{id:'mastery-medal',kind:'trophy',name:'CHAMPION MEDAL'},{id:'golden-key',kind:'trophy',name:'GOLDEN KEY'}
];
export function paintGalleryWall(owned={},W=1120,H=640){
 const c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');
 const bg=x.createLinearGradient(0,0,0,H);bg.addColorStop(0,'#6b3f72');bg.addColorStop(1,'#43284c');x.fillStyle=bg;x.beginPath();x.roundRect(0,0,W,H,34);x.fill();
 const glow=x.createRadialGradient(W/2,H*.4,10,W/2,H*.4,W*.55);glow.addColorStop(0,'rgba(255,214,150,.42)');glow.addColorStop(1,'rgba(255,214,150,0)');x.fillStyle=glow;x.fillRect(0,0,W,H);
 x.save();x.globalAlpha=.14;x.strokeStyle='#ffe0a0';x.lineWidth=2;for(let i=0;i<9;i++){x.beginPath();x.moveTo(i*140,0);x.lineTo(i*140+60,H);x.stroke();}x.restore();
 x.lineWidth=14;x.strokeStyle='#a56d44';x.beginPath();x.roundRect(10,10,W-20,H-20,30);x.stroke();x.lineWidth=4;x.strokeStyle='#f0c58d';x.beginPath();x.roundRect(18,18,W-36,H-36,24);x.stroke();x.lineWidth=3;x.strokeStyle=INK;x.beginPath();x.roundRect(3,3,W-6,H-6,34);x.stroke();
 const have=GALLERY_ITEMS.filter(it=>(owned[it.id]||0)>0).length;
 paintShape(x,rrect(W/2-230,22,460,52,18),'#2a1c34',{box:[W/2-230,22,460,52],ow:3});x.font='700 26px Fredoka, "Arial Rounded MT Bold", sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillStyle='#ffd98a';x.shadowColor='#ffb347';x.shadowBlur=12;x.fillText('YOUR PRIZE HAUL  ·  '+have+' / '+GALLERY_ITEMS.length,W/2,49);x.shadowBlur=0;
 const rows=[[0,6],[6,6],[12,5]],shelves=[212,374,536];
 rows.forEach(([start,n],r)=>{const sy=shelves[r];
  paintShape(x,rrect(48,sy,W-96,22,6),'#b8814f',{box:[48,sy,W-96,22],ow:3});paintShape(x,rrect(48,sy+18,W-96,12,4),'#8a5a38',{box:[48,sy+18,W-96,12],ow:2.4});x.fillStyle='rgba(20,8,28,.25)';x.fillRect(60,sy+30,W-120,8);
  for(let k=0;k<n;k++){const it=GALLERY_ITEMS[start+k],cx=(n===6?110:150)+k*((W-(n===6?220:300))/(n-1)),q=owned[it.id]||0;
   if(q>0){drawPrizeItem(x,it.kind,cx,sy+2,1.3-r*.05);if(q>1){paintShape(x,P(p=>p.arc(cx+30,sy-70,13,0,6.3)),'#e8584f',{box:[cx+17,sy-83,26,26],ow:2.2});x.font='700 14px Fredoka, sans-serif';x.fillStyle='#fff';x.fillText('×'+q,cx+30,sy-69);}}
   else{const t=document.createElement('canvas');t.width=200;t.height=170;const tx=t.getContext('2d');drawPrizeItem(tx,it.kind,100,150,1.3-r*.05);tx.globalCompositeOperation='source-in';tx.fillStyle='rgba(28,12,40,.82)';tx.fillRect(0,0,200,170);x.drawImage(t,cx-100,sy+2-150);x.font='700 30px Fredoka, sans-serif';x.fillStyle='rgba(255,226,170,.7)';x.fillText('?',cx,sy-38);}
   paintShape(x,rrect(cx-52,sy+36,104,18,5),q>0?'#f4ead8':'#6a4f78',{box:[cx-52,sy+36,104,18],ow:2});x.font='700 11px Fredoka, sans-serif';x.fillStyle=q>0?'#4a2a3a':'#cdb8d8';x.fillText(q>0?it.name:'· · · · ·',cx,sy+46);}
 });
 return c;
}
// Tiled gallery floor with a sunburst rug.
export function paintGalleryFloor(W=720,H=870){
 const c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');
 const T=60;for(let iy=0;iy<H/T+1;iy++)for(let ix=0;ix<W/T+1;ix++){const dk=(ix+iy)%2;x.fillStyle=dk?'#7a4b66':'#c99a8a';x.fillRect(ix*T,iy*T,T,T);const g=x.createLinearGradient(ix*T,iy*T,ix*T+T,iy*T+T);g.addColorStop(0,'rgba(255,240,210,.18)');g.addColorStop(1,'rgba(30,10,30,.16)');x.fillStyle=g;x.fillRect(ix*T,iy*T,T,T);x.strokeStyle='rgba(30,10,30,.5)';x.lineWidth=2;x.strokeRect(ix*T+1,iy*T+1,T-2,T-2);x.fillStyle='rgba(255,246,222,.25)';x.fillRect(ix*T+3,iy*T+3,T-8,3);}
 // gold border
 x.lineWidth=16;x.strokeStyle='#d9ad4a';x.strokeRect(12,12,W-24,H-24);x.lineWidth=4;x.strokeStyle='#fff0b0';x.strokeRect(22,22,W-44,H-44);x.lineWidth=3;x.strokeStyle=INK;x.strokeRect(3,3,W-6,H-6);
 // central sunburst rug
 const cx=W/2,cy=H*.56;x.save();x.translate(cx,cy);paintShape(x,P(p=>p.ellipse(0,0,250,300,0,0,6.3)),'#3a2543',{box:[-250,-300,500,600],ow:4});
 for(let i=0;i<24;i++){x.rotate(Math.PI/12);x.fillStyle=i%2?'#e8584f':'#f0c85a';x.beginPath();x.moveTo(0,0);x.lineTo(-26,-270);x.lineTo(26,-270);x.closePath();x.globalAlpha=.85;x.fill();}x.globalAlpha=1;
 x.restore();x.save();x.beginPath();x.ellipse(cx,cy,250,300,0,0,6.3);x.clip();const rg=x.createRadialGradient(cx,cy,10,cx,cy,300);rg.addColorStop(0,'rgba(255,240,200,.55)');rg.addColorStop(.35,'rgba(255,240,200,0)');rg.addColorStop(1,'rgba(30,10,40,.4)');x.fillStyle=rg;x.fillRect(0,0,W,H);x.restore();
 x.lineWidth=5;x.strokeStyle=INK;x.beginPath();x.ellipse(cx,cy,250,300,0,0,6.3);x.stroke();x.lineWidth=7;x.strokeStyle='#fff0b0';x.beginPath();x.ellipse(cx,cy,238,288,0,0,6.3);x.stroke();
 paintShape(x,P(p=>p.arc(cx,cy,62,0,6.3)),'#2a1c34',{box:[cx-62,cy-62,124,124],ow:4});drawStar(x,cx,cy,44,'#ffd96a');
 return c;
}

// ───────── plants, tables and stools ─────────
const leafGrad=(ctx,x,y,r,c)=>{const g=ctx.createLinearGradient(x-r,y-r,x+r,y+r);g.addColorStop(0,light(c,.28));g.addColorStop(.55,c);g.addColorStop(1,dark(c,.28));return g;};
function leaf(ctx,x,y,len,wid,ang,color,vein=true){
 ctx.save();ctx.translate(x,y);ctx.rotate(ang);
 const p=P(q=>{q.moveTo(0,0);q.bezierCurveTo(wid*.9,-len*.2,wid*.9,-len*.8,0,-len);q.bezierCurveTo(-wid*.9,-len*.8,-wid*.9,-len*.2,0,0);q.closePath();});
 paintShape(ctx,p,color,{box:[-wid,-len,wid*2,len],ow:2.2,hi:.4});
 if(vein){ctx.strokeStyle='rgba(20,50,30,.45)';ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(0,-2);ctx.lineTo(0,-len+5);for(let i=1;i<5;i++){const t=i/5;ctx.moveTo(0,-len*t);ctx.lineTo(wid*.55,-len*t-len*.1);ctx.moveTo(0,-len*t);ctx.lineTo(-wid*.55,-len*t-len*.1);}ctx.stroke();}
 ctx.restore();
}
export const PLANT_W=128,PLANT_H=192;
export function drawPlant(ctx,kind){
 const cx=64,gp='#5a9a6c',gd='#3f7f58',gl='#78b884';
 ctx.save();
 // pot
 const potCol=['#c9714f','#d99a6a','#9a6a8a','#6a9aa8'][kind%4];
 const sg=ctx.createRadialGradient(cx,184,2,cx,184,40);sg.addColorStop(0,'rgba(20,8,28,.35)');sg.addColorStop(1,'rgba(20,8,28,0)');ctx.fillStyle=sg;ctx.beginPath();ctx.ellipse(cx,184,38,8,0,0,6.3);ctx.fill();
 const stem=(x0,y0,x1,y1,w=3)=>line(ctx,[[x0,y0],[(x0+x1)/2+3,(y0+y1)/2],[x1,y1]],w,'#3a6a48');
 if(kind===0){ // monstera: big split heart leaves
  for(const [x,y,l,w,a,c] of [[cx-4,140,54,24,-.62,gd],[cx+4,140,56,25,.6,gd],[cx-2,138,72,28,-.24,gp],[cx+3,136,66,26,.28,gl],[cx,134,56,22,.02,gp]]){stem(cx,142,x+Math.sin(a)*l*.5,y-Math.cos(a)*l*.5,2.6);leaf(ctx,x+Math.sin(a)*l*.6,y-Math.cos(a)*l*.6+8,l*.72,w,a,c);}
 }else if(kind===1){ // fiddle-leaf tree
  line(ctx,[[cx,150],[cx+2,110],[cx-2,70],[cx,40]],5,'#6a4a38');
  for(const [y,s,a,c] of [[132,1,-1.1,gp],[128,1,1.15,gd],[108,1.1,-.95,gd],[104,1.1,1.0,gp],[84,1.1,-.8,gp],[80,1.1,.85,gd],[62,1,-.6,gl],[58,1,.65,gp],[44,.9,-.1,gl]])leaf(ctx,cx+(a<0?-2:2),y,40*s,17*s,a,c);
 }else if(kind===2){ // snake plant
  for(const [dx,h,a,c] of [[-14,100,-.18,gd],[-6,124,-.06,gp],[4,136,.05,gl],[14,112,.16,gp],[-20,78,-.34,gp],[22,82,.34,gd]]){ctx.save();ctx.translate(cx+dx*.7,148);ctx.rotate(a);const p=P(q=>{q.moveTo(-8,0);q.quadraticCurveTo(-10,-h*.6,0,-h);q.quadraticCurveTo(10,-h*.6,8,0);q.closePath();});paintShape(ctx,p,c,{box:[-10,-h,20,h],ow:2.2});ctx.save();ctx.clip(p);ctx.strokeStyle='rgba(235,235,150,.55)';ctx.lineWidth=2;for(let y=-8;y>-h;y-=11){ctx.beginPath();ctx.moveTo(-10,y);ctx.quadraticCurveTo(0,y-4,10,y);ctx.stroke();}ctx.restore();ctx.restore();}
 }else{ // flowering bush
  for(const [x,y,r,c] of [[cx-26,118,22,gd],[cx+26,118,22,gd],[cx,100,30,gp],[cx-16,90,22,gl],[cx+16,92,22,gp]])paintShape(ctx,P(q=>q.arc(x,y,r,0,6.3)),c,{box:[x-r,y-r,r*2,r*2],ow:2.4});
  for(const [x,y,c] of [[cx-30,104,'#f4a6c4'],[cx-8,84,'#fff2c8'],[cx+22,92,'#f4a6c4'],[cx+6,110,'#ffd96a'],[cx-20,124,'#fff2c8'],[cx+34,116,'#ff8fb0'],[cx-4,70,'#ffd96a']]){for(let k=0;k<5;k++){const a=k*1.2566;paintShape(ctx,P(q=>q.arc(x+Math.cos(a)*5.5,y+Math.sin(a)*5.5,4.6,0,6.3)),c,{box:[x-10,y-10,20,20],ow:1.6,hi:.5});}paintShape(ctx,P(q=>q.arc(x,y,3.6,0,6.3)),'#e8b030',{ow:1.4});}
 }
 // terracotta pot drawn last so leaves sit inside it
 const pot=P(q=>{q.moveTo(cx-30,142);q.lineTo(cx+30,142);q.lineTo(cx+22,184);q.quadraticCurveTo(cx,190,cx-22,184);q.closePath();});paintShape(ctx,pot,potCol,{box:[cx-30,142,60,48],ow:2.8});
 paintShape(ctx,rrect(cx-33,136,66,13,5),light(potCol,.1),{box:[cx-33,136,66,13],ow:2.6});
 ctx.save();ctx.clip(pot);ctx.strokeStyle='rgba(255,240,205,.45)';ctx.lineWidth=2.2;ctx.beginPath();for(let i=0;i<4;i++){ctx.moveTo(cx-24+i*16,156);ctx.lineTo(cx-18+i*16,170);}ctx.stroke();ctx.restore();
 ctx.restore();
}
// Top-down dining table (flat decal): scalloped cloth, plates, candle and four cushioned chairs.
export function paintTableTop(i=0){
 const W=240,H=240,c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');
 const cloth=['#e9d9b8','#cfe3dc','#f0d0d4'][i%3],chair=['#c9714f','#6a9aa8','#9a6a8a'][i%3];
 for(const [dx,dy] of [[0,-90],[90,0],[0,90],[-90,0]]){const cx=120+dx,cy=120+dy;paintShape(x,P(q=>q.roundRect(cx-27,cy-27,54,54,16)),mix(chair,'#2b2036',.2),{box:[cx-27,cy-27,54,54],ow:3});paintShape(x,P(q=>q.roundRect(cx-20,cy-20,40,40,12)),chair,{box:[cx-20,cy-20,40,40],ow:2.2,hi:.6});x.strokeStyle='rgba(255,240,205,.5)';x.lineWidth=2;x.beginPath();x.arc(cx,cy,9,0,6.3);x.stroke();}
 paintShape(x,P(q=>q.arc(120,120,72,0,6.3)),'#7a4a34',{box:[48,48,144,144],ow:3.2});
 paintShape(x,P(q=>{for(let k=0;k<28;k++){const a=k/28*6.2832,r=k%2?64:69;const px=120+Math.cos(a)*r,py=120+Math.sin(a)*r;k?q.lineTo(px,py):q.moveTo(px,py);}q.closePath();}),cloth,{box:[50,50,140,140],ow:2.6,hi:.5});
 x.save();x.beginPath();x.arc(120,120,60,0,6.3);x.clip();x.strokeStyle='rgba(255,255,255,.28)';x.lineWidth=7;for(let k=-3;k<=3;k++){x.beginPath();x.moveTo(30,120+k*18);x.lineTo(210,120+k*18);x.stroke();}x.restore();
 for(const [dx,dy,col] of [[0,-38,'#fffaf0'],[38,0,'#fffaf0'],[0,38,'#fffaf0'],[-38,0,'#fffaf0']]){paintShape(x,P(q=>q.arc(120+dx,120+dy,15,0,6.3)),col,{box:[105+dx,105+dy,30,30],ow:2.2,hi:.5});x.strokeStyle='rgba(180,140,110,.7)';x.lineWidth=1.6;x.beginPath();x.arc(120+dx,120+dy,9,0,6.3);x.stroke();}
 paintShape(x,P(q=>q.arc(120,120,9,0,6.3)),'#f4ead8',{box:[111,111,18,18],ow:2.4});const fg=x.createRadialGradient(120,114,1,120,114,18);fg.addColorStop(0,'rgba(255,230,140,.9)');fg.addColorStop(1,'rgba(255,200,90,0)');x.fillStyle=fg;x.beginPath();x.arc(120,114,18,0,6.3);x.fill();paintShape(x,P(q=>{q.moveTo(120,106);q.quadraticCurveTo(125,114,120,119);q.quadraticCurveTo(115,114,120,106);}),'#ffd45a',{ow:1.4});
 return c;
}
export function paintStoolTop(){
 const c=document.createElement('canvas');c.width=c.height=96;const x=c.getContext('2d');
 paintShape(x,P(q=>q.arc(48,48,40,0,6.3)),'#7a4a34',{box:[8,8,80,80],ow:3.4});paintShape(x,P(q=>q.arc(48,48,32,0,6.3)),'#d9825e',{box:[16,16,64,64],ow:2.4,hi:.6});
 x.strokeStyle='rgba(255,240,205,.55)';x.lineWidth=2.4;x.beginPath();x.arc(48,48,19,.5,4.4);x.stroke();paintShape(x,P(q=>q.arc(48,48,5,0,6.3)),'#f0c58d',{ow:2});
 return c;
}
export function createPlantSprite(THREE,kind,{anisotropy=4,height=1.9}={}){
 const c=document.createElement('canvas');c.width=PLANT_W;c.height=PLANT_H;drawPlant(c.getContext('2d'),kind);
 const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=anisotropy;tex.minFilter=THREE.LinearMipmapLinearFilter;
 const mesh=new THREE.Mesh(new THREE.PlaneGeometry(height*PLANT_W/PLANT_H,height),new THREE.MeshBasicMaterial({map:tex,transparent:true,alphaTest:.04,toneMapped:false}));mesh.position.y=height/2-height*(6/PLANT_H);
 const tilt=new THREE.Group();tilt.rotation.x=-.5;tilt.add(mesh);const root=new THREE.Group();root.add(tilt);return{root,mesh};
}

// ───────── bar top and bar-top poker machines ─────────
export function paintBarTop(){
 const W=1180,H=260,c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');
 // cream marble slab with veining and a polished brass edge
 const g=x.createLinearGradient(0,0,0,H);g.addColorStop(0,'#f4ead4');g.addColorStop(1,'#e2d2b4');x.fillStyle=g;x.beginPath();x.roundRect(0,0,W,H,22);x.fill();
 x.save();x.clip();x.strokeStyle='rgba(150,120,110,.28)';x.lineWidth=2;for(let i=0;i<14;i++){x.beginPath();let px=(i*97)%W,py=(i*53)%H;x.moveTo(px,py);for(let k=0;k<6;k++){px+=30+(k*17+i*11)%40;py+=((k*29+i*7)%40)-20;x.lineTo(px,py);}x.stroke();}
 x.fillStyle='rgba(255,255,255,.4)';x.fillRect(0,6,W,6);x.restore();
 x.lineWidth=14;x.strokeStyle='#c99a52';x.beginPath();x.roundRect(8,8,W-16,H-16,18);x.stroke();x.lineWidth=3;x.strokeStyle=INK;x.beginPath();x.roundRect(2,2,W-4,H-4,22);x.stroke();x.lineWidth=3;x.beginPath();x.roundRect(15,15,W-30,H-30,14);x.stroke();
 // front rail glow strip
 x.fillStyle='#5fe0d4';x.shadowColor='#5fe0d4';x.shadowBlur=14;x.fillRect(60,H-34,W-120,5);x.shadowBlur=0;
 const glass=(cx,cy,col)=>{x.fillStyle='rgba(20,8,28,.25)';x.beginPath();x.ellipse(cx+4,cy+6,26,22,0,0,6.3);x.fill();paintShape(x,P(q=>q.arc(cx,cy,26,0,6.3)),'#e8f4f4',{box:[cx-26,cy-26,52,52],ow:2.6,hi:.7});paintShape(x,P(q=>q.arc(cx,cy,19,0,6.3)),col,{box:[cx-19,cy-19,38,38],ow:2,hi:.7});line(x,[[cx+4,cy-4],[cx+30,cy-30]],4,'#fff');x.strokeStyle=INK;x.lineWidth=1.4;x.beginPath();x.moveTo(cx+4,cy-4);x.lineTo(cx+30,cy-30);x.stroke();};
 glass(120,130,'#ff7ab6');glass(1070,120,'#5fe0d4');glass(440,160,'#ffc66b');glass(740,90,'#a99bff');
 // snack bowl, napkins and a menu card
 paintShape(x,P(q=>q.arc(1000,175,30,0,6.3)),'#8a5a3a',{box:[970,145,60,60],ow:2.6});for(let i=0;i<9;i++){paintShape(x,P(q=>q.arc(985+(i*13)%34,160+(i*9)%26,6,0,6.3)),['#ffd96a','#e8a05a','#fff0b0'][i%3],{ow:1.4});}
 paintShape(x,rrect(220,60,70,46,6),'#f4ead8',{box:[220,60,70,46],ow:2.4});x.font='700 15px Fredoka, sans-serif';x.fillStyle='#4a2a3a';x.textAlign='center';x.fillText('MENU',255,88);
 paintShape(x,rrect(70,70,44,30,5),'#e8584f',{box:[70,70,44,30],ow:2.2});
 return c;
}
export const POKER_W=120,POKER_H=130;
export function drawPoker(ctx,index=0){
 const col=['#59445f','#4a5267','#654653'][index%3],sc=['#8dd8c5','#9dc7e8','#e9bd79'][index%3];
 const sg=ctx.createRadialGradient(60,122,2,60,122,46);sg.addColorStop(0,'rgba(20,8,28,.4)');sg.addColorStop(1,'rgba(20,8,28,0)');ctx.fillStyle=sg;ctx.beginPath();ctx.ellipse(60,122,46,8,0,0,6.3);ctx.fill();
 paintShape(ctx,P(p=>{p.moveTo(16,120);p.lineTo(22,52);p.lineTo(98,52);p.lineTo(104,120);p.closePath();}),col,{box:[16,52,88,68],ow:3});
 paintShape(ctx,rrect(12,112,96,12,4),'#d9b06d',{box:[12,112,96,12],ow:2.4});
 paintShape(ctx,P(p=>{p.moveTo(24,50);p.lineTo(28,8);p.lineTo(92,8);p.lineTo(96,50);p.closePath();}),mix(col,'#2b2036',.3),{box:[24,8,72,42],ow:3});
 paintShape(ctx,rrect(34,14,52,32,5),'#211d32',{box:[34,14,52,32],ow:2.2});
 paintShape(ctx,rrect(37,17,46,26,3),sc,{box:[37,17,46,26],ow:1.6,hi:.7});
 for(let i=0;i<5;i++){const cx=40+i*8.4;paintShape(ctx,rrect(cx-3.4,21,7,12,1.4),'#fffaf0',{box:[cx-3.4,21,7,12],ow:1.1,hi:.1,sh:.05});ctx.fillStyle=i%2?'#e8584f':'#2a1c34';ctx.font='700 7px sans-serif';ctx.textAlign='center';ctx.fillText(['A','K','♥','♠','10'][i],cx,29);}
 line(ctx,[[40,38],[80,38]],2,'#ffd96a');
 for(let b=0;b<3;b++)paintShape(ctx,ell(36+b*24,70,7,5),['#d98d83','#88c8b7','#e5c27d'][b],{box:[29+b*24,65,14,10],ow:1.8});
 paintShape(ctx,rrect(50,88,20,5,2),'#14101e',{ow:1.4});paintShape(ctx,rrect(36,98,48,7,3),'#d9b06d',{box:[36,98,48,7],ow:1.8});
}
export function createPokerSprite(THREE,index,{anisotropy=4,height=1.15}={}){
 const c=document.createElement('canvas');c.width=POKER_W;c.height=POKER_H;drawPoker(c.getContext('2d'),index);
 const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=anisotropy;
 const mesh=new THREE.Mesh(new THREE.PlaneGeometry(height*POKER_W/POKER_H,height),new THREE.MeshBasicMaterial({map:tex,transparent:true,alphaTest:.04,toneMapped:false}));mesh.position.y=height/2-height*(6/POKER_H);
 const tilt=new THREE.Group();tilt.rotation.x=-.5;tilt.add(mesh);const root=new THREE.Group();root.add(tilt);return{root,mesh};
}

// ───────── game tables (top-down) and their moving pieces ─────────
export function paintAirTable(){
 const W=720,H=430,c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');
 // wood cabinet + rim
 const wd=x.createLinearGradient(0,0,0,H);wd.addColorStop(0,'#c98f5e');wd.addColorStop(1,'#8a5a3e');paintShape(x,P(q=>q.roundRect(4,4,W-8,H-8,46)),'#b57a52',{box:[0,0,W,H],ow:5});
 x.save();x.beginPath();x.roundRect(4,4,W-8,H-8,46);x.clip();for(let i=0;i<22;i++){x.strokeStyle=`rgba(${i%2?'255,225,180':'60,30,20'},.13)`;x.lineWidth=2+i%3;x.beginPath();x.moveTo(0,i*20+4);x.bezierCurveTo(W*.3,i*20-6,W*.7,i*20+12,W,i*20);x.stroke();}x.restore();
 // playfield
 const fx=44,fy=44,fw=W-88,fh=H-88;
 const g=x.createLinearGradient(fx,fy,fx+fw,fy+fh);g.addColorStop(0,'#cdeef0');g.addColorStop(.5,'#e8fbf8');g.addColorStop(1,'#b9dfe6');x.fillStyle=g;x.beginPath();x.roundRect(fx,fy,fw,fh,26);x.fill();x.lineWidth=5;x.strokeStyle=INK;x.stroke();
 x.save();x.clip();x.fillStyle='rgba(60,120,140,.16)';for(let ix=0;ix<fw;ix+=14)for(let iy=0;iy<fh;iy+=14){x.beginPath();x.arc(fx+ix+7,fy+iy+7,1.6,0,6.3);x.fill();}
 // painted sheen
 const sh=x.createLinearGradient(fx,fy,fx+fw*.6,fy+fh);sh.addColorStop(0,'rgba(255,255,255,.55)');sh.addColorStop(.4,'rgba(255,255,255,0)');x.fillStyle=sh;x.fillRect(fx,fy,fw,fh);
 x.lineWidth=5;x.strokeStyle='#e8584f';x.beginPath();x.moveTo(W/2,fy);x.lineTo(W/2,fy+fh);x.stroke();x.beginPath();x.arc(W/2,H/2,58,0,6.3);x.stroke();x.fillStyle='#e8584f';x.beginPath();x.arc(W/2,H/2,9,0,6.3);x.fill();
 for(const [gx,col,dir] of [[fx,'#ff8f6a',1],[fx+fw,'#5fe0d4',-1]]){x.lineWidth=5;x.strokeStyle=col;x.beginPath();x.arc(gx,H/2,84,dir>0?-Math.PI/2:Math.PI/2,dir>0?Math.PI/2:Math.PI*1.5);x.stroke();}
 x.restore();
 // goal slots
 for(const gx of [fx-14,fx+fw-10]){paintShape(x,rrect(gx,H/2-62,24,124,10),'#2a1c34',{box:[gx,H/2-62,24,124],ow:3});}
 // brass studs and neon rim
 for(const [bx,by] of [[26,26],[W-26,26],[26,H-26],[W-26,H-26],[W/2,22],[W/2,H-22]])paintShape(x,P(q=>q.arc(bx,by,8,0,6.3)),'#e8c47a',{box:[bx-8,by-8,16,16],ow:2.2,hi:.7});
 x.save();x.shadowColor='#5fe0d4';x.shadowBlur=14;x.strokeStyle='#5fe0d4';x.lineWidth=3;x.beginPath();x.roundRect(fx-6,fy-6,fw+12,fh+12,30);x.stroke();x.restore();
 return c;
}
export function paintPoolTable(){
 const W=720,H=430,c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');
 paintShape(x,P(q=>q.roundRect(4,4,W-8,H-8,40)),'#8a4f3a',{box:[0,0,W,H],ow:5});
 x.save();x.beginPath();x.roundRect(4,4,W-8,H-8,40);x.clip();for(let i=0;i<20;i++){x.strokeStyle=`rgba(${i%2?'255,215,170':'40,16,16'},.14)`;x.lineWidth=2+i%3;x.beginPath();x.moveTo(0,i*22);x.bezierCurveTo(W*.3,i*22-8,W*.7,i*22+10,W,i*22+2);x.stroke();}x.restore();
 // rail diamonds
 for(let i=1;i<8;i++){for(const y of [22,H-22]){if(i===4)continue;paintShape(x,P(q=>{q.moveTo(i*W/8,y-7);q.lineTo(i*W/8+7,y);q.lineTo(i*W/8,y+7);q.lineTo(i*W/8-7,y);q.closePath();}),'#f4ead8',{box:[i*W/8-7,y-7,14,14],ow:1.8,hi:.6});}}
 for(let i=1;i<4;i++){for(const xx of [22,W-22]){if(i===2)continue;paintShape(x,P(q=>{q.moveTo(xx,i*H/4-7);q.lineTo(xx+7,i*H/4);q.lineTo(xx,i*H/4+7);q.lineTo(xx-7,i*H/4);q.closePath();}),'#f4ead8',{box:[xx-7,i*H/4-7,14,14],ow:1.8,hi:.6});}}
 // cushion + baize
 paintShape(x,P(q=>q.roundRect(40,40,W-80,H-80,26)),'#2f6a4a',{box:[40,40,W-80,H-80],ow:4});
 const fx=58,fy=58,fw=W-116,fh=H-116;const fg=x.createRadialGradient(W/2,H/2,20,W/2,H/2,W*.5);fg.addColorStop(0,'#5fb384');fg.addColorStop(1,'#2f7a55');x.fillStyle=fg;x.beginPath();x.roundRect(fx,fy,fw,fh,16);x.fill();x.strokeStyle=INK;x.lineWidth=3;x.stroke();
 x.save();x.clip();for(let i=0;i<1400;i++){x.fillStyle=`rgba(${i%2?'190,255,200':'10,50,30'},${.03+(i%5)*.01})`;x.fillRect(fx+(i*37)%fw,fy+(i*91)%fh,2,2);}
 x.strokeStyle='rgba(255,255,255,.35)';x.lineWidth=2;x.beginPath();x.moveTo(fx+fw*.25,fy);x.lineTo(fx+fw*.25,fy+fh);x.stroke();x.fillStyle='rgba(255,255,255,.45)';x.beginPath();x.arc(fx+fw*.75,H/2,4,0,6.3);x.fill();
 const hl=x.createLinearGradient(fx,fy,fx+fw*.7,fy+fh);hl.addColorStop(0,'rgba(255,255,230,.28)');hl.addColorStop(.5,'rgba(255,255,230,0)');x.fillStyle=hl;x.fillRect(fx,fy,fw,fh);x.restore();
 // pockets (world pocket x=±1.54,0 ; z=±.82)
 for(const [px,py] of [[-1.54,-.82],[0,-.86],[1.54,-.82],[-1.54,.82],[0,.86],[1.54,.82]]){const cx=(px/3.6+.5)*W,cy=(py/2.15+.5)*H;paintShape(x,P(q=>q.arc(cx,cy,25,0,6.3)),'#d9b06d',{box:[cx-25,cy-25,50,50],ow:3,hi:.7});paintShape(x,P(q=>q.arc(cx,cy,18,0,6.3)),'#150e1c',{box:[cx-18,cy-18,36,36],ow:2,hi:0,sh:0});}
 return c;
}
// Top-down game pieces: puck, mallets (knobbed), numbered balls
export function paintDisc(kind,opt={}){
 const S=128,c=document.createElement('canvas');c.width=c.height=S;const x=c.getContext('2d');const R=58;
 if(kind==='puck'){paintShape(x,P(q=>q.arc(64,64,R,0,6.3)),'#f2e8d0',{box:[6,6,116,116],ow:6});x.strokeStyle='#e8584f';x.lineWidth=7;x.beginPath();x.arc(64,64,36,0,6.3);x.stroke();x.fillStyle='rgba(255,255,255,.6)';x.beginPath();x.ellipse(46,42,16,8,-.6,0,6.3);x.fill();}
 else if(kind==='mallet'){const col=opt.color||'#e58b79';paintShape(x,P(q=>q.arc(64,64,R,0,6.3)),col,{box:[6,6,116,116],ow:6});paintShape(x,P(q=>q.arc(64,64,38,0,6.3)),mix(col,'#ffffff',.18),{box:[26,26,76,76],ow:5,hi:.7});paintShape(x,P(q=>q.arc(64,64,17,0,6.3)),mix(col,'#2b2036',.2),{box:[47,47,34,34],ow:4});x.fillStyle='rgba(255,255,255,.65)';x.beginPath();x.ellipse(50,46,13,7,-.6,0,6.3);x.fill();}
 else if(kind==='ball'){const n=opt.n||0,col=opt.color||'#f5eddb';paintShape(x,P(q=>q.arc(64,64,R,0,6.3)),col,{box:[6,6,116,116],ow:6,hi:.5});if(n>=9){x.save();x.beginPath();x.arc(64,64,R-3,0,6.3);x.clip();x.fillStyle='#f6edd8';x.fillRect(0,0,S,34);x.fillRect(0,94,S,34);x.restore();x.strokeStyle=INK;x.lineWidth=3;x.beginPath();x.arc(64,64,R,0,6.3);x.stroke();}
  if(n>0){x.fillStyle='#f8f1de';x.beginPath();x.arc(64,64,24,0,6.3);x.fill();x.strokeStyle=INK;x.lineWidth=3;x.stroke();x.fillStyle=INK;x.font='700 30px Fredoka, sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText(String(n),64,66);}
  x.fillStyle='rgba(255,255,255,.7)';x.beginPath();x.ellipse(44,40,15,8,-.6,0,6.3);x.fill();}
 return c;
}
export function paintSoftShadow(){const c=document.createElement('canvas');c.width=256;c.height=160;const x=c.getContext('2d');const g=x.createRadialGradient(128,80,10,128,80,128);g.addColorStop(0,'rgba(18,6,26,.55)');g.addColorStop(.6,'rgba(18,6,26,.3)');g.addColorStop(1,'rgba(18,6,26,0)');x.fillStyle=g;x.fillRect(0,0,256,160);return c;}

// ───────── lucky wheel, jukebox and back bar ─────────
export const WHEEL_W=200,WHEEL_H=250;
export function drawWheel(ctx){
 const cx=100,cy=112,R=84,vals=['0','10','25','50','100','250','500','1K'],cols=['#9a7080','#6fb8aa','#e0a85c','#8b83d5','#e0746a','#5f9fb5','#d4b04e','#a888c4'];
 const sg=ctx.createRadialGradient(100,238,2,100,238,80);sg.addColorStop(0,'rgba(20,8,28,.4)');sg.addColorStop(1,'rgba(20,8,28,0)');ctx.fillStyle=sg;ctx.beginPath();ctx.ellipse(100,238,78,9,0,0,6.3);ctx.fill();
 // stand legs and cabinet
 paintShape(ctx,P(p=>{p.moveTo(52,236);p.lineTo(64,150);p.lineTo(136,150);p.lineTo(148,236);p.lineTo(132,236);p.lineTo(124,170);p.lineTo(76,170);p.lineTo(68,236);p.closePath();}),'#7a4a3a',{box:[52,150,96,86],ow:3});
 paintShape(ctx,rrect(8,10,184,198,26),'#6a4a7a',{box:[8,10,184,198],ow:4});
 paintShape(ctx,rrect(16,18,168,182,20),'#3a2a4a',{box:[16,18,168,182],ow:2.4});
 // marquee lamps
 for(let i=0;i<20;i++){const a=i/20*6.2832,lx=cx+Math.cos(a)*(R+13),ly=cy+Math.sin(a)*(R+13);ctx.fillStyle=i%2?'#fff0b0':'#ffb27a';ctx.shadowColor='#ffd98a';ctx.shadowBlur=8;ctx.beginPath();ctx.arc(lx,ly,3.2,0,6.3);ctx.fill();}ctx.shadowBlur=0;
 // sectors
 ctx.save();ctx.translate(cx,cy);
 for(let i=0;i<8;i++){const a0=i*Math.PI/4-Math.PI/2-Math.PI/8,a1=a0+Math.PI/4;paintShape(ctx,P(p=>{p.moveTo(0,0);p.arc(0,0,R,a0,a1);p.closePath();}),cols[i],{box:[-R,-R,R*2,R*2],ow:2.4,hi:.35});
  const am=(a0+a1)/2;ctx.save();ctx.rotate(am);ctx.translate(R*.66,0);ctx.rotate(Math.PI/2);ctx.font='700 17px Fredoka, "Arial Rounded MT Bold", sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineWidth=4;ctx.strokeStyle=INK;ctx.strokeText(vals[i],0,0);ctx.fillStyle='#fff6dc';ctx.fillText(vals[i],0,0);ctx.restore();}
 for(let i=0;i<8;i++){const a=i*Math.PI/4-Math.PI/2-Math.PI/8;ctx.fillStyle='#fff6dc';ctx.beginPath();ctx.arc(Math.cos(a)*R,Math.sin(a)*R,3.4,0,6.3);ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=1.4;ctx.stroke();}
 ctx.restore();
 ctx.strokeStyle=INK;ctx.lineWidth=3.4;ctx.beginPath();ctx.arc(cx,cy,R+1,0,6.3);ctx.stroke();
 paintShape(ctx,P(p=>p.arc(cx,cy,19,0,6.3)),'#f0d5a1',{box:[cx-19,cy-19,38,38],ow:3,hi:.7});drawStarShape(ctx,cx,cy,12,'#e8584f');
 // pointer
 paintShape(ctx,P(p=>{p.moveTo(cx-9,6);p.lineTo(cx+9,6);p.lineTo(cx,30);p.closePath();}),'#e8584f',{box:[cx-9,6,18,24],ow:2.6,hi:.7});
 ctx.font='700 13px Fredoka, sans-serif';ctx.textAlign='center';ctx.fillStyle='#ffd98a';ctx.fillText('LUCKY WHEEL',cx,222);
}
function drawStarShape(ctx,cx,cy,r,color){paintShape(ctx,P(p=>{for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,q=i%2?r*.5:r;const x=cx+Math.cos(a)*q,y=cy+Math.sin(a)*q;i?p.lineTo(x,y):p.moveTo(x,y);}p.closePath();}),color,{box:[cx-r,cy-r,r*2,r*2],ow:2,hi:.6});}
export function paintBackBar(){
 const W=1200,H=420,c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');
 const bg=x.createLinearGradient(0,0,0,H);bg.addColorStop(0,'#4a2c52');bg.addColorStop(1,'#2f1c3a');x.fillStyle=bg;x.beginPath();x.roundRect(0,0,W,H,26);x.fill();
 // subway tile backsplash
 x.save();x.clip();for(let ty=0;ty<H;ty+=30)for(let tx=((ty/30)%2)*30;tx<W;tx+=60){x.fillStyle=(tx+ty)%120<60?'rgba(255,230,200,.07)':'rgba(255,230,200,.03)';x.fillRect(tx+1,ty+1,58,28);}x.restore();
 // mirror with shine
 paintShape(x,rrect(380,34,440,160,20),'#c99a52',{box:[380,34,440,160],ow:4});paintShape(x,rrect(394,48,412,132,14),'#b8d8e0',{box:[394,48,412,132],ow:2.4,hi:.8});x.save();x.beginPath();x.roundRect(394,48,412,132,14);x.clip();x.fillStyle='rgba(255,255,255,.35)';for(const o of [0,90,180]){x.beginPath();x.moveTo(430+o,48);x.lineTo(470+o,48);x.lineTo(410+o,180);x.lineTo(370+o,180);x.fill();}x.restore();
 x.font='700 44px Fredoka, "Arial Rounded MT Bold", sans-serif';x.textAlign='center';x.textBaseline='middle';x.shadowColor='#ff5fa8';x.shadowBlur=22;x.fillStyle='#ffd0e8';x.fillText('GLOW BAR',600,114);x.shadowBlur=0;
 // shelves and bottles
 const bottles=[['#e8584f',34,72],['#5fe0d4',30,64],['#ffc66b',36,78],['#a99bff',30,70],['#7ee08f',32,66],['#f4a6c4',34,76]];
 for(const [sx,sw] of [[40,300],[860,300]])for(const sy of [150,290]){paintShape(x,rrect(sx,sy,sw,16,5),'#b8814f',{box:[sx,sy,sw,16],ow:3});
  for(let i=0;i<7;i++){const [col,w,h]=bottles[(i+sy/20)%6|0];const bx=sx+16+i*40;paintShape(x,P(p=>{p.moveTo(bx,sy);p.lineTo(bx,sy-h*.6);p.lineTo(bx+w*.2,sy-h*.8);p.lineTo(bx+w*.2,sy-h);p.lineTo(bx+w*.45,sy-h);p.lineTo(bx+w*.45,sy-h*.8);p.lineTo(bx+w*.65,sy-h*.6);p.lineTo(bx+w*.65,sy);p.closePath();}),col,{box:[bx,sy-h,w*.7,h],ow:2.2,hi:.7});paintShape(x,rrect(bx+2,sy-h*.45,w*.61-4,14,3),'#f4ead8',{ow:1.4});}}
 // hanging pots and pans
 for(const [px,py,r] of [[350,300,34],[420,320,26],[800,310,30],[860,330,24]]){x.strokeStyle=INK;x.lineWidth=3;x.beginPath();x.moveTo(px,0);x.lineTo(px,py-r);x.stroke();paintShape(x,P(p=>p.arc(px,py,r,0,6.3)),'#b9b4c8',{box:[px-r,py-r,r*2,r*2],ow:3,hi:.7});paintShape(x,P(p=>p.arc(px,py,r*.7,0,6.3)),'#8a8598',{ow:2});}
 // string lights
 x.strokeStyle='rgba(30,10,30,.7)';x.lineWidth=2;x.beginPath();x.moveTo(20,20);x.quadraticCurveTo(600,70,1180,20);x.stroke();for(let i=0;i<14;i++){const t=i/13,px=20+t*1160,py=20+Math.sin(t*Math.PI)*28;x.fillStyle=['#ffd98a','#ff9acb','#9fe0cf'][i%3];x.shadowColor=x.fillStyle;x.shadowBlur=12;x.beginPath();x.arc(px,py+8,6,0,6.3);x.fill();}x.shadowBlur=0;
 x.lineWidth=12;x.strokeStyle='#a56d44';x.beginPath();x.roundRect(6,6,W-12,H-12,24);x.stroke();x.lineWidth=3;x.strokeStyle=INK;x.beginPath();x.roundRect(1,1,W-2,H-2,26);x.stroke();
 return c;
}

// ───────── host stand ─────────
export const HOST_W=240,HOST_H=260;
export function drawHostStand(ctx){
 const sg=ctx.createRadialGradient(120,250,2,120,250,100);sg.addColorStop(0,'rgba(20,8,28,.4)');sg.addColorStop(1,'rgba(20,8,28,0)');ctx.fillStyle=sg;ctx.beginPath();ctx.ellipse(120,250,96,10,0,0,6.3);ctx.fill();
 // hanging sign on two posts
 for(const x of [44,196])line(ctx,[[x,40],[x,150]],6,'#5a3a44');
 paintShape(ctx,rrect(30,6,180,64,14),'#4a2f56',{box:[30,6,180,64],ow:3.4});paintShape(ctx,rrect(38,12,164,52,10),'#2f1f3c',{box:[38,12,164,52],ow:2});
 ctx.font='700 30px Fredoka, "Arial Rounded MT Bold", sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineWidth=6;ctx.strokeStyle=INK;ctx.strokeText('HOST',120,32);ctx.shadowColor='#ffb347';ctx.shadowBlur=10;ctx.fillStyle='#ffe0ae';ctx.fillText('HOST',120,32);ctx.shadowBlur=0;
 ctx.font='600 11px Fredoka, sans-serif';ctx.fillStyle='#e8c9a4';ctx.fillText('PLEASE WAIT TO BE SEATED',120,54);
 for(const x of [38,202]){ctx.fillStyle='#ffd98a';ctx.shadowColor='#ffd98a';ctx.shadowBlur=10;ctx.beginPath();ctx.arc(x,10,4,0,6.3);ctx.fill();}ctx.shadowBlur=0;
 // podium body
 paintShape(ctx,P(p=>{p.moveTo(44,246);p.lineTo(52,132);p.lineTo(188,132);p.lineTo(196,246);p.closePath();}),'#98605e',{box:[44,132,152,114],ow:3.4});
 ctx.save();ctx.clip(P(p=>{p.moveTo(44,246);p.lineTo(52,132);p.lineTo(188,132);p.lineTo(196,246);p.closePath();}));
 paintShape(ctx,rrect(66,150,108,78,8),'#b0746a',{box:[66,150,108,78],ow:2.4});ctx.strokeStyle='rgba(255,226,180,.4)';ctx.lineWidth=2;ctx.strokeRect(74,158,92,62);
 for(let i=0;i<10;i++){ctx.strokeStyle=`rgba(${i%2?'255,210,170':'50,20,26'},.16)`;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(40,140+i*11);ctx.bezierCurveTo(100,134+i*11,150,148+i*11,200,140+i*11);ctx.stroke();}
 ctx.restore();
 paintShape(ctx,P(p=>p.arc(120,189,14,0,6.3)),'#e8c47a',{box:[106,175,28,28],ow:2.6,hi:.7});drawStarShape(ctx,120,189,9,'#e8584f');
 // slanted desktop with open book, bell and lamp
 paintShape(ctx,P(p=>{p.moveTo(36,134);p.lineTo(204,134);p.lineTo(196,112);p.lineTo(44,112);p.closePath();}),'#f0d9b0',{box:[36,112,168,22],ow:3.2,hi:.6});
 paintShape(ctx,P(p=>{p.moveTo(70,126);p.lineTo(118,126);p.lineTo(120,106);p.lineTo(74,106);p.closePath();p.moveTo(122,126);p.lineTo(170,126);p.lineTo(166,106);p.lineTo(124,106);p.closePath();}),'#fffaf0',{box:[70,106,100,20],ow:2,hi:.2});
 for(let i=0;i<4;i++){line(ctx,[[78,111+i*4],[112,111+i*4]],1.2,'#b9a28a');line(ctx,[[130,111+i*4],[162,111+i*4]],1.2,'#b9a28a');}
 paintShape(ctx,P(p=>{p.moveTo(176,126);p.quadraticCurveTo(176,108,189,108);p.quadraticCurveTo(202,108,202,126);p.closePath();}),'#e8c47a',{box:[176,108,26,18],ow:2.6,hi:.8});paintShape(ctx,P(p=>p.arc(189,106,3.4,0,6.3)),'#e8584f',{ow:1.8});
 paintShape(ctx,rrect(176,126,26,5,2),'#c99a52',{ow:1.8});
 line(ctx,[[54,126],[54,92]],3.4,'#c99a52');paintShape(ctx,P(p=>{p.moveTo(40,92);p.lineTo(68,92);p.lineTo(62,76);p.lineTo(46,76);p.closePath();}),'#7fd7c4',{box:[40,76,28,16],ow:2.6,hi:.7});
 const gl=ctx.createRadialGradient(54,84,2,54,84,26);gl.addColorStop(0,'rgba(255,240,170,.7)');gl.addColorStop(1,'rgba(255,240,170,0)');ctx.fillStyle=gl;ctx.beginPath();ctx.arc(54,84,26,0,6.3);ctx.fill();
}
export function createHostStandSprite(THREE,{anisotropy=4,height=2.7}={}){
 const c=document.createElement('canvas');c.width=HOST_W*2;c.height=HOST_H*2;const g=c.getContext('2d');g.scale(2,2);drawHostStand(g);
 const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=anisotropy;tex.minFilter=THREE.LinearMipmapLinearFilter;
 const mesh=new THREE.Mesh(new THREE.PlaneGeometry(height*HOST_W/HOST_H,height),new THREE.MeshBasicMaterial({map:tex,transparent:true,alphaTest:.04,toneMapped:false}));mesh.position.y=height/2-height*(10/HOST_H);
 const tilt=new THREE.Group();tilt.rotation.x=-.45;tilt.add(mesh);const root=new THREE.Group();root.add(tilt);return{root,mesh};
}

// ───────── finishing pieces: counter front, garland, wall cap, sconce, bar stool ─────────
export function paintCounterFront(){
 const W=1160,H=270,c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');
 // walnut frame
 paintShape(x,rrect(2,2,W-4,H-4,16),'#7a4a34',{box:[0,0,W,H],ow:4});
 x.save();x.beginPath();x.roundRect(2,2,W-4,H-4,16);x.clip();for(let i=0;i<14;i++){x.strokeStyle=`rgba(${i%2?'255,210,170':'40,16,16'},.12)`;x.lineWidth=2;x.beginPath();x.moveTo(0,i*20);x.bezierCurveTo(W*.3,i*20-6,W*.7,i*20+8,W,i*20);x.stroke();}x.restore();
 // tufted leather panels
 const panels=4,pw=(W-60)/panels;
 for(let p=0;p<panels;p++){const px=30+p*pw+6,py=30,ww=pw-12,hh=150;paintShape(x,rrect(px,py,ww,hh,12),'#8a2f4a',{box:[px,py,ww,hh],ow:3,hi:.35});
  x.save();x.beginPath();x.roundRect(px,py,ww,hh,12);x.clip();
  for(let r=0;r<4;r++)for(let k=0;k<6;k++){const bx=px+20+k*(ww-40)/5+(r%2?(ww-40)/10:0),by=py+22+r*36;if(bx>px+ww-12)continue;
   x.strokeStyle='rgba(30,6,20,.35)';x.lineWidth=2;x.beginPath();x.moveTo(bx-18,by-18);x.lineTo(bx,by);x.lineTo(bx+18,by-18);x.moveTo(bx-18,by+18);x.lineTo(bx,by);x.lineTo(bx+18,by+18);x.stroke();
   x.fillStyle='#e8c47a';x.beginPath();x.arc(bx,by,3.6,0,6.3);x.fill();x.strokeStyle=INK;x.lineWidth=1.2;x.stroke();}
  const sh=x.createLinearGradient(px,py,px,py+hh);sh.addColorStop(0,'rgba(255,220,230,.28)');sh.addColorStop(.4,'rgba(255,220,230,0)');x.fillStyle=sh;x.fillRect(px,py,ww,hh);x.restore();}
 // brass foot rail with brackets
 for(let i=0;i<6;i++){const bx=60+i*(W-120)/5;paintShape(x,rrect(bx-6,196,12,26,3),'#c99a52',{box:[bx-6,196,12,26],ow:2});}
 paintShape(x,rrect(30,200,W-60,14,7),'#e8c47a',{box:[30,200,W-60,14],ow:2.6,hi:.8});
 // neon underglow
 x.save();x.shadowColor='#5fe0d4';x.shadowBlur=18;x.fillStyle='#9ff4ec';x.fillRect(24,H-26,W-48,6);x.restore();
 // centre plaque
 paintShape(x,rrect(W/2-90,12,180,30,10),'#2a1c34',{box:[W/2-90,12,180,30],ow:2.4});x.font='700 18px Fredoka, "Arial Rounded MT Bold", sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillStyle='#ffd98a';x.shadowColor='#ffb347';x.shadowBlur=8;x.fillText('★ GLOW BAR ★',W/2,28);x.shadowBlur=0;
 return c;
}
export function paintGarland(W=2400,H=200){
 const c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');
 const y=t=>26+Math.sin(t*Math.PI)*58; // catenary-ish sag
 // rope
 x.strokeStyle='#5a3a2c';x.lineWidth=5;x.lineCap='round';x.beginPath();for(let i=0;i<=80;i++){const t=i/80;i?x.lineTo(t*W,y(t)):x.moveTo(0,y(0));}x.stroke();
 x.strokeStyle='rgba(255,220,180,.35)';x.lineWidth=1.6;x.stroke();
 const cols=['#e8584f','#ffc66b','#5fe0d4','#a99bff','#ff8fc0','#7ee08f'],pats=['dots','stripe','zig','star','plain','dots'];
 const N=22;
 for(let i=0;i<N;i++){const t=(i+.5)/N,px=t*W,py=y(t),col=cols[i%6],pat=pats[(i*5)%6],len=74+(i%3)*8,w2=30;
  const tri=P(p=>{p.moveTo(px-w2,py+2);p.lineTo(px+w2,py+2);p.lineTo(px+(i%2?4:-4),py+len);p.closePath();});
  paintShape(x,tri,col,{box:[px-w2,py,w2*2,len],ow:2.6,hi:.45});
  x.save();x.clip(tri);x.fillStyle='rgba(255,250,235,.75)';x.strokeStyle='rgba(255,250,235,.75)';x.lineWidth=4;
  if(pat==='dots'){for(let k=0;k<6;k++){x.beginPath();x.arc(px-14+(k%3)*14,py+16+Math.floor(k/3)*18,3.4,0,6.3);x.fill();}}
  else if(pat==='stripe'){for(let k=0;k<4;k++){x.fillRect(px-w2,py+12+k*16,w2*2,6);}}
  else if(pat==='zig'){x.beginPath();for(let k=0;k<7;k++)x.lineTo(px-w2+k*10,py+22+(k%2?10:0));x.stroke();}
  else if(pat==='star'){drawStarShape(x,px,py+24,11,'#fff4cc');}
  x.restore();
  // bulb between pennants
  if(i<N-1){const t2=(i+1)/N,bx=t2*W,by=y(t2);line(x,[[bx,by],[bx,by+12]],2.4,'#3a2a2a');const bc=['#ffe7a0','#ffc6dc','#c6fff2'][i%3];const g=x.createRadialGradient(bx,by+22,1,bx,by+22,26);g.addColorStop(0,bc);g.addColorStop(.35,bc+'88');g.addColorStop(1,bc+'00');x.fillStyle=g;x.beginPath();x.arc(bx,by+22,26,0,6.3);x.fill();paintShape(x,P(p=>p.ellipse(bx,by+22,7,9,0,0,6.3)),bc.length===7?bc:'#ffe7a0',{box:[bx-7,by+13,14,18],ow:1.8,hi:.9});paintShape(x,rrect(bx-4,by+10,8,5,1),'#c99a52',{ow:1.4});}
 }
 return c;
}
export function paintWallCap(W=4000,H=120){
 const c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');
 const g=x.createLinearGradient(0,0,0,H);g.addColorStop(0,'#8a5a40');g.addColorStop(.5,'#6a4232');g.addColorStop(1,'#4a2c26');x.fillStyle=g;x.fillRect(0,0,W,H);
 for(let i=0;i<10;i++){x.strokeStyle=`rgba(${i%2?'255,210,170':'30,10,10'},.12)`;x.lineWidth=2;x.beginPath();x.moveTo(0,i*12+4);x.bezierCurveTo(W*.3,i*12,W*.7,i*12+8,W,i*12+4);x.stroke();}
 // carved dentil band and brass inlay
 x.fillStyle='#3a2220';x.fillRect(0,H*.62,W,H*.22);for(let i=0;i<W;i+=34){x.fillStyle='#9a6a4a';x.fillRect(i+4,H*.64,22,H*.18);x.fillStyle='rgba(255,226,180,.35)';x.fillRect(i+4,H*.64,22,3);}
 x.fillStyle='#e8c47a';x.fillRect(0,H*.2,W,5);x.fillStyle='rgba(255,255,230,.6)';x.fillRect(0,H*.2,W,1.5);
 // pilaster caps every 400px with a carved rosette
 for(let i=200;i<W;i+=400){paintShape(x,rrect(i-34,6,68,H-12,8),'#a8704e',{box:[i-34,6,68,H-12],ow:2.6,hi:.5});paintShape(x,P(p=>p.arc(i,H/2,16,0,6.3)),'#e8c47a',{box:[i-16,H/2-16,32,32],ow:2,hi:.7});for(let k=0;k<8;k++){const a=k*.785;line(x,[[i+Math.cos(a)*5,H/2+Math.sin(a)*5],[i+Math.cos(a)*13,H/2+Math.sin(a)*13]],2,'#8a5a2a');}}
 x.strokeStyle=INK;x.lineWidth=4;x.strokeRect(1,1,W-2,H-2);
 return c;
}
export const SCONCE_W=96,SCONCE_H=140;
export function drawSconce(ctx,glow='#ffd28b'){
 const g=ctx.createRadialGradient(48,52,2,48,52,48);g.addColorStop(0,glow+'cc');g.addColorStop(.45,glow+'44');g.addColorStop(1,glow+'00');ctx.fillStyle=g;ctx.beginPath();ctx.arc(48,52,48,0,6.3);ctx.fill();
 paintShape(ctx,rrect(36,70,24,56,8),'#7a4a34',{box:[36,70,24,56],ow:2.6});paintShape(ctx,P(p=>p.arc(48,98,8,0,6.3)),'#e8c47a',{box:[40,90,16,16],ow:2,hi:.8});
 line(ctx,[[48,78],[48,62]],4,'#c99a52');
 paintShape(ctx,P(p=>{p.moveTo(30,62);p.lineTo(66,62);p.lineTo(58,30);p.lineTo(38,30);p.closePath();}),'#fff0c8',{box:[30,30,36,32],ow:2.6,hi:.8});
 ctx.save();ctx.clip(P(p=>{p.moveTo(30,62);p.lineTo(66,62);p.lineTo(58,30);p.lineTo(38,30);p.closePath();}));for(let i=0;i<4;i++){ctx.strokeStyle='rgba(200,140,80,.4)';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(32+i*10,62);ctx.lineTo(39+i*6,30);ctx.stroke();}ctx.restore();
 paintShape(ctx,rrect(34,26,28,6,3),'#c99a52',{ow:1.8});
}
export const STOOL_W=96,STOOL_H=150;
export function drawStool(ctx,seat='#c9553f'){
 const sg=ctx.createRadialGradient(48,142,2,48,142,36);sg.addColorStop(0,'rgba(20,8,28,.4)');sg.addColorStop(1,'rgba(20,8,28,0)');ctx.fillStyle=sg;ctx.beginPath();ctx.ellipse(48,142,34,7,0,0,6.3);ctx.fill();
 paintShape(ctx,P(p=>p.ellipse(48,138,26,7,0,0,6.3)),'#b9b4c8',{box:[22,131,52,14],ow:2.6,hi:.8});
 limb(ctx,[[48,136],[48,46]],8,'#d8d4e2');
 paintShape(ctx,P(p=>p.ellipse(48,98,20,5,0,0,6.3)),'#c99a52',{box:[28,93,40,10],ow:2.2,hi:.7});
 paintShape(ctx,P(p=>{p.moveTo(18,44);p.quadraticCurveTo(18,28,48,26);p.quadraticCurveTo(78,28,78,44);p.quadraticCurveTo(48,54,18,44);p.closePath();}),seat,{box:[18,26,60,26],ow:3,hi:.6});
 for(let i=-2;i<=2;i++){ctx.fillStyle='rgba(255,230,220,.6)';ctx.beginPath();ctx.arc(48+i*11,38-Math.abs(i)*1.5,2,0,6.3);ctx.fill();}
 paintShape(ctx,P(p=>p.ellipse(48,46,30,6,0,0,Math.PI)),'#e8c47a',{ow:2});
}
export function makeSpriteFromCanvas(THREE,canvas,{height,anisotropy=4,tilt=-.5,baseOffset=0}){
 const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=anisotropy;tex.minFilter=THREE.LinearMipmapLinearFilter;
 const mesh=new THREE.Mesh(new THREE.PlaneGeometry(height*canvas.width/canvas.height,height),new THREE.MeshBasicMaterial({map:tex,transparent:true,alphaTest:.04,toneMapped:false}));mesh.position.y=height/2-baseOffset;
 const t=new THREE.Group();t.rotation.x=tilt;t.add(mesh);const root=new THREE.Group();root.add(t);return{root,mesh};
}
export function canvasFrom(w,h,draw,res=2){const c=document.createElement('canvas');c.width=w*res;c.height=h*res;const g=c.getContext('2d');g.scale(res,res);draw(g);return c;}

// ───────── prize exchange counter and gallery facade ─────────
export const PCOUNTER_W=320,PCOUNTER_H=260;
export function drawPrizeCounter(ctx){
 const sg=ctx.createRadialGradient(160,250,2,160,250,140);sg.addColorStop(0,'rgba(20,8,28,.4)');sg.addColorStop(1,'rgba(20,8,28,0)');ctx.fillStyle=sg;ctx.beginPath();ctx.ellipse(160,250,140,10,0,0,6.3);ctx.fill();
 for(const x of [26,294])line(ctx,[[x,40],[x,128]],6,'#5a3a44');
 paintShape(ctx,rrect(10,4,300,62,16),'#4a2f56',{box:[10,4,300,62],ow:3.4});paintShape(ctx,rrect(18,10,284,50,11),'#2f1f3c',{box:[18,10,284,50],ow:2});
 ctx.font='700 26px Fredoka, "Arial Rounded MT Bold", sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineWidth=6;ctx.strokeStyle=INK;ctx.strokeText('PRIZE EXCHANGE',160,29);ctx.shadowColor='#ffb347';ctx.shadowBlur=10;ctx.fillStyle='#ffd98a';ctx.fillText('PRIZE EXCHANGE',160,29);ctx.shadowBlur=0;
 ctx.font='600 11px Fredoka, sans-serif';ctx.fillStyle='#e8c9a4';ctx.fillText('TRADE TICKETS FOR TREASURES',160,50);
 for(let i=0;i<14;i++){ctx.fillStyle=i%2?'#fff0b0':'#ffb27a';ctx.shadowColor='#ffd98a';ctx.shadowBlur=7;ctx.beginPath();ctx.arc(22+i*21.2,8,2.6,0,6.3);ctx.fill();}ctx.shadowBlur=0;
 // glass display case with prizes
 const glass=rrect(34,84,252,70,10);
 ctx.save();ctx.clip(glass);const gg=ctx.createLinearGradient(34,84,286,154);gg.addColorStop(0,'rgba(210,240,250,.9)');gg.addColorStop(1,'rgba(160,205,225,.8)');ctx.fillStyle=gg;ctx.fillRect(34,84,252,70);
 [['bear',70],['rocket',114],['star',158],['bunny',204],['cat',250]].forEach(([k,x])=>drawPrizeItem(ctx,k,x,150,.72));
 ctx.fillStyle='rgba(255,255,255,.45)';for(const o of [0,70,150]){ctx.beginPath();ctx.moveTo(60+o,84);ctx.lineTo(84+o,84);ctx.lineTo(56+o,154);ctx.lineTo(32+o,154);ctx.fill();}
 ctx.restore();ctx.strokeStyle=INK;ctx.lineWidth=3;ctx.stroke(glass);paintShape(ctx,rrect(30,80,260,8,4),'#e3b98a',{box:[30,80,260,8],ow:2});
 // counter body
 paintShape(ctx,rrect(22,152,276,12,5),'#d7a875',{box:[22,152,276,12],ow:2.8,hi:.6});
 const body=P(p=>{p.moveTo(30,164);p.lineTo(290,164);p.lineTo(284,244);p.lineTo(36,244);p.closePath();});paintShape(ctx,body,'#694b70',{box:[30,164,260,80],ow:3.2});
 ctx.save();ctx.clip(body);for(let i=0;i<3;i++){paintShape(ctx,rrect(46+i*80,176,68,56,8),'#7c5a84',{box:[46+i*80,176,68,56],ow:2.2,hi:.4});}
 drawStarShape(ctx,86,204,12,'#ffd98a');drawStarShape(ctx,166,204,12,'#ff9acb');drawStarShape(ctx,246,204,12,'#9ff4ec');ctx.restore();
 ctx.save();ctx.shadowColor='#ff9acb';ctx.shadowBlur=14;ctx.fillStyle='#ffc6dc';ctx.fillRect(40,238,240,4);ctx.restore();
 // ticket dispenser with a curl of tickets
 paintShape(ctx,rrect(262,110,36,46,6),'#e8584f',{box:[262,110,36,46],ow:2.6});paintShape(ctx,rrect(268,118,24,10,3),'#2a1c34',{ow:1.6});
 ctx.fillStyle='#ffe08a';ctx.strokeStyle=INK;ctx.lineWidth=1.6;for(let i=0;i<5;i++){ctx.save();ctx.translate(280+i*3,160+i*12);ctx.rotate(.15*i);ctx.fillRect(-9,-5,18,10);ctx.strokeRect(-9,-5,18,10);ctx.restore();}
}
export function paintGalleryFacade(W=512,H=300){
 const c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');
 const g=x.createLinearGradient(0,0,0,H);g.addColorStop(0,'#6a3f72');g.addColorStop(1,'#4a2c52');x.fillStyle=g;x.fillRect(0,0,W,H);
 for(let gx=0;gx<W;gx+=48)for(let gy=0;gy<H*.55;gy+=48){x.strokeStyle='rgba(232,184,103,.22)';x.lineWidth=1.6;x.beginPath();x.moveTo(gx+24,gy+4);x.lineTo(gx+44,gy+24);x.lineTo(gx+24,gy+44);x.lineTo(gx+4,gy+24);x.closePath();x.stroke();x.fillStyle='rgba(255,210,140,.3)';x.beginPath();x.arc(gx+24,gy+24,3,0,6.3);x.fill();}
 const rail=H*.55;x.fillStyle='#c99560';x.fillRect(0,rail,W,12);x.fillStyle='rgba(255,236,200,.55)';x.fillRect(0,rail,W,2);x.fillStyle=INK;x.fillRect(0,rail+12,W,2);
 x.fillStyle='#5a3a34';x.fillRect(0,rail+14,W,H-rail-14);
 for(let px=10;px<W-10;px+=124){paintShape(x,rrect(px,rail+26,112,H-rail-48,8),'#6e4639',{box:[px,rail+26,112,H-rail-48],ow:2.4,hi:.35});}
 x.fillStyle='#26161d';x.fillRect(0,H-14,W,14);
 for(let i=0;i<14;i++){x.fillStyle=i%2?'#fff0b0':'#ffb27a';x.shadowColor='#ffd98a';x.shadowBlur=8;x.beginPath();x.arc(18+i*37,12,4,0,6.3);x.fill();}x.shadowBlur=0;
 x.strokeStyle=INK;x.lineWidth=4;x.strokeRect(2,2,W-4,H-4);
 return c;
}

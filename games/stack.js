/* Clay Stack: isometric tower builder — timing, perfect streaks, shrinking/growing slabs, wind. */
(function(){
const N=window.NXG,HH=22,BASE=150,TOL=6;
function hue(i){const c=['#ef896d','#f2ce77','#8ec7a4','#8bb7dc','#b58bd6','#ff9bb5'];return c[i%c.length];}
function init(a){const p=a.p;Object.assign(p,{tower:[{x:0,z:0,w:BASE,d:BASE,col:hue(0)}],cur:null,dir:1,axis:'x',pos:0,t:0,level:0,debris:[],rings:[],cam:0,msg:'',msgT:0,perfects:0,streak:0,over:false,speed:170,wait:0,bestLevel:a.store.get('stackBest',0),bonusT:0});spawn(p,a);}
function start(a){init(a);const p=a.p;p.base=a.diff.id==='easy'?.85:a.diff.id==='hard'?1.2:1;p.tol=TOL+(a.mastery>=2?3:0)+(a.diff.id==='easy'?3:0);p.speed=165*p.base;a.hud('TAP / SPACE TO DROP · LAND PERFECTLY TO GROW THE SLAB');}
function spawn(p,a){const top=p.tower[p.tower.length-1];p.axis=p.axis==='x'?'z':'x';p.cur={w:top.w,d:top.d,col:hue(p.tower.length),x:top.x,z:top.z};p.pos=-230;p.dir=1;p.golden=p.tower.length%10===0&&p.tower.length>0;}
function update(dt,a){const p=a.p;p.t+=dt;if(p.msgT>0)p.msgT-=dt;
 for(const d of p.debris){d.vy+=900*dt;d.y+=d.vy*dt;d.rot+=dt*d.vr;d.t+=dt;}p.debris=p.debris.filter(d=>d.t<2);
 for(const r of p.rings)r.t+=dt;p.rings=p.rings.filter(r=>r.t<.7);
 const target=Math.max(0,p.tower.length-5)*HH;p.cam+=(target-p.cam)*Math.min(1,dt*5);
 if(p.over){p.wait-=dt;if(p.wait<=0&&!p.fin){p.fin=true;const lv=p.tower.length-1;a.finish(lv>=20,{grade:lv>=40?'SKYSCRAPER':lv>=25?'TOWER':lv>=15?'BUILDING':'HUT'});}return;}
 const top=p.tower[p.tower.length-1];const ref=p.axis==='x'?top.x:top.z;
 const v=Math.min(430,p.speed+p.tower.length*7*p.base)*(p.golden?1.25:1);p.pos+=p.dir*v*dt;if(p.pos>230){p.pos=230;p.dir=-1;}if(p.pos<-230){p.pos=-230;p.dir=1;}
 if(p.axis==='x')p.cur.x=ref+p.pos;else p.cur.z=ref+p.pos;}
function drop(a){const p=a.p;if(p.over||!p.cur)return;const top=p.tower[p.tower.length-1],c=p.cur;const ax=p.axis;
 const cp=ax==='x'?c.x:c.z,tp=ax==='x'?top.x:top.z,cs=ax==='x'?c.w:c.d,ts=ax==='x'?top.w:top.d;const delta=cp-tp;const overlap=ts/2+cs/2-Math.abs(delta);
 if(overlap<=0){p.over=true;p.wait=1.4;p.debris.push({...c,y:0,vy:0,vr:(Math.random()-.5)*3,rot:0,t:0,full:true});p.cur=null;N.sfx(a,'lose');a.shake(8,.3);return;}
 let nb={...c};
 if(Math.abs(delta)<=p.tol){nb.x=top.x;nb.z=top.z;if(ax==='x'){nb.x=top.x;}else{nb.z=top.z;}p.streak++;p.perfects++;a.combo=p.streak;const bonus=3+Math.min(10,p.streak*2)+(p.golden?8:0);a.addScore(bonus,0,0);p.rings.push({x:nb.x,z:nb.z,w:nb.w,d:nb.d,y:p.tower.length,t:0});p.msg=p.streak>=3?'PERFECT ×'+p.streak:'PERFECT!';p.msgT=1;N.sfx(a,'coin');a.sound(500+p.streak*70,.12,'triangle',.05);
  if(p.streak>=3&&(ax==='x'?nb.w:nb.d)<BASE){if(ax==='x')nb.w=Math.min(BASE,nb.w+8);else nb.d=Math.min(BASE,nb.d+8);}
  if(p.streak>=8)a.achieve('flawless','8 perfect drops in a row',8);}
 else{p.streak=0;a.combo=0;const newSize=overlap,cut=cs-overlap,center=(Math.max(cp-cs/2,tp-ts/2)+Math.min(cp+cs/2,tp+ts/2))/2;const dir=delta>0?1:-1;
  if(ax==='x'){nb.x=center;nb.w=newSize;p.debris.push({x:center+dir*(newSize/2+cut/2),z:c.z,w:cut,d:c.d,col:c.col,y:0,vy:0,vr:dir*2,rot:0,t:0,level:p.tower.length});}
  else{nb.z=center;nb.d=newSize;p.debris.push({x:c.x,z:center+dir*(newSize/2+cut/2),w:c.w,d:cut,col:c.col,y:0,vy:0,vr:dir*2,rot:0,t:0,level:p.tower.length});}
  N.sfx(a,'bump');a.addScore(2,0,0);}
 a.addScore(2,0,0);nb.col=c.col;p.tower.push(nb);const lv=p.tower.length-1;if(lv>p.bestLevel){p.bestLevel=lv;a.store.set('stackBest',lv);}
 if(lv===10)a.achieve('ten','Reach 10 floors',4);if(lv===25)a.achieve('twentyfive','Reach 25 floors',10);
 if((ax==='x'?nb.w:nb.d)<10){p.over=true;p.wait=1;p.cur=null;return;}
 if(p.golden){p.msg='GOLDEN FLOOR +BONUS';p.msgT=1.4;}
 spawn(p,a);}
function iso(L,x,z,y){return{x:L.cx+(x-z)*.866*L.k,y:L.cy+((x+z)*.5-y)*L.k};}
function jit(seed,k){const v=Math.sin(seed*127.1+k*311.7)*43758.5453;return(v-Math.floor(v))-.5;}
function poly(ctx,pts,seed,amp){ctx.beginPath();pts.forEach((q,i)=>{const x=q.x+jit(seed,i*2)*amp,y=q.y+jit(seed,i*2+1)*amp;i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.closePath();}
function centroid(pts){let x=0,y=0;pts.forEach(q=>{x+=q.x;y+=q.y;});return{x:x/pts.length,y:y/pts.length};}
function dents(ctx,pts,seed,n,k){const c=centroid(pts);ctx.save();poly(ctx,pts,seed,0);ctx.clip();
 for(let i=0;i<n;i++){const t=jit(seed,40+i*3),u=jit(seed,41+i*3);const px=c.x+(pts[0].x-c.x)*t*1.6+(pts[2].x-c.x)*u*1.6,py=c.y+(pts[0].y-c.y)*t*1.6+(pts[2].y-c.y)*u*1.6,r=(3.5+Math.abs(jit(seed,42+i*3))*6)*k;
  ctx.fillStyle='rgba(30,14,34,.16)';ctx.beginPath();ctx.ellipse(px+r*.18,py+r*.2,r,r*.55,-.3,0,N.TAU);ctx.fill();ctx.fillStyle='rgba(255,244,222,.2)';ctx.beginPath();ctx.ellipse(px-r*.2,py-r*.18,r*.8,r*.42,-.3,0,N.TAU);ctx.fill();}
 for(let i=0;i<14;i++){ctx.fillStyle=i%2?'rgba(255,240,215,.22)':'rgba(30,14,34,.2)';ctx.fillRect(c.x+jit(seed,90+i)*(pts[0].x-pts[2].x),c.y+jit(seed,120+i)*(pts[0].y-pts[2].y)*.8,1.6*k,1.3*k);}
 ctx.restore();}
function box(ctx,L,x,z,w,d,y,h,col,alpha=1,seed=1){const c=[[x-w/2,z-d/2],[x+w/2,z-d/2],[x+w/2,z+d/2],[x-w/2,z+d/2]].map(q=>iso(L,q[0],q[1],y+h)),b=[[x+w/2,z+d/2],[x-w/2,z+d/2],[x+w/2,z-d/2]].map(q=>iso(L,q[0],q[1],y));
 const left=[c[3],c[2],b[0],b[1]],right=[c[2],c[1],b[2],b[0]],top=[c[0],c[1],c[2],c[3]],k=L.k,amp=1.3*k;
 ctx.globalAlpha=alpha;ctx.lineJoin='round';
 // soft plum contact shadow on the surface below
 ctx.fillStyle='rgba(20,8,28,.3)';poly(ctx,[iso(L,x-w/2+4,z-d/2+4,y),iso(L,x+w/2+6,z-d/2+4,y),iso(L,x+w/2+6,z+d/2+6,y),iso(L,x-w/2+4,z+d/2+6,y)],seed,0);ctx.fill();
 const face=(pts,shadeAmt,sd)=>{const cc=centroid(pts);const g=ctx.createLinearGradient(pts[0].x,pts[0].y,pts[2].x,pts[2].y);g.addColorStop(0,N.shade(col,shadeAmt+.14));g.addColorStop(.55,N.shade(col,shadeAmt));g.addColorStop(1,N.shade(col,shadeAmt-.2));ctx.fillStyle=g;poly(ctx,pts,sd,amp);ctx.fill();dents(ctx,pts,sd,pts===top?5:3,k);ctx.strokeStyle=N.INK;ctx.lineWidth=2.4*k;poly(ctx,pts,sd,amp);ctx.stroke();};
 face(left,-.3,seed*3+1);face(right,-.14,seed*3+2);face(top,.04,seed*3);
 // soft broad highlight on the top face + cream rim along the front-top edge
 const cc=centroid(top);ctx.fillStyle='rgba(255,246,222,.16)';ctx.beginPath();ctx.ellipse(cc.x-w*.08*k,cc.y-d*.05*k,w*.3*k,d*.13*k,-.2,0,N.TAU);ctx.fill();
 ctx.strokeStyle='rgba(255,246,222,.38)';ctx.lineWidth=1.8*k;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(top[3].x+2,top[3].y-1);ctx.lineTo(top[2].x-2,top[2].y-1);ctx.stroke();
 ctx.globalAlpha=1;}
function draw(ctx,a){const p=a.p,W=a.W,H=a.H;const L={cx:W/2,cy:H*.78,k:W<H?1.05:.82};L.cy+=p.cam*L.k;
 N.cached(ctx,'stackbg',W,H,(g,w,h)=>{N.bgGrad(g,w,h,['#6c4f8f','#b9718a','#f0a878']);for(let k=0;k<26;k++){N.blob(g,(k*197+40)%w,(k*83+30)%(h*.55),2.5+(k%3)*1.4,k%2?'#ffe9b8':'#f2ce77',k+3,{noShine:true,shadow:false});}N.blob(g,w*.8,h*.2,Math.min(w,h)*.05,'#fff0d4',11,{shadow:false});for(let k=0;k<3;k++){const bx=w*(.1+k*.42);N.blob(g,bx,h*1.0,w*.26,['#7a5a8e','#8f6590','#a8708f'][k],20+k,{sx:1.5,sy:.5,shadow:false,noShine:true});}N.grain(g,w,h,.6);});
 for(let k=0;k<4;k++){const cx=((k*260+p.t*(8+k*3))%(W+240))-120,cy=H*(.12+k*.09),r=22+k*4;for(const [dx,dy,rr] of[[-r*.9,2,.7],[0,-4,1],[r*.95,3,.75]]){const gg=ctx.createRadialGradient(cx+dx-rr*6,cy+dy-rr*7,2,cx+dx,cy+dy,r*rr);gg.addColorStop(0,'#fff6e8');gg.addColorStop(1,'#e8c9b8');ctx.fillStyle=gg;ctx.beginPath();ctx.ellipse(cx+dx,cy+dy,r*rr*1.2,r*rr*.8,0,0,N.TAU);ctx.fill();}}

 // pedestal
 box(ctx,L,0,0,210,210,-HH*1.6,HH*1.6,'#8a5f72',1,99);
 for(let i=0;i<p.tower.length;i++){const b=p.tower[i];box(ctx,L,b.x,b.z,b.w,b.d,i*HH,HH,b.col,1,i+1);}
 for(const r of p.rings){const t=r.t/.7,c=iso(L,r.x,r.z,r.y*HH);ctx.globalAlpha=1-t;ctx.strokeStyle='#fff0b0';ctx.lineWidth=4;ctx.beginPath();ctx.ellipse(c.x,c.y,(r.w*.6+t*60)*L.k,(r.w*.3+t*30)*L.k,0,0,N.TAU);ctx.stroke();ctx.globalAlpha=1;}
 if(p.cur){const c=p.cur,y=p.tower.length*HH;if(p.golden)N.glow(ctx,iso(L,c.x,c.z,y).x,iso(L,c.x,c.z,y).y,120,'#ffe08a',.35);box(ctx,L,c.x,c.z,c.w,c.d,y,HH,p.golden?'#ffd45e':c.col,1,p.tower.length+1);
  const g=iso(L,c.x,c.z,y-HH*.2);}
 for(const d of p.debris){ctx.save();const y=(d.level||p.tower.length)*HH;box(ctx,L,d.x,d.z,d.w,d.d,y-d.y*.35,HH,d.col,Math.max(0,1-d.t/1.6),7);ctx.restore();}
 const lv=p.tower.length-1;
 N.chip(ctx,14,14,110,'FLOOR',lv,{color:'#ffe08a'});N.chip(ctx,134,14,120,'SCORE',a.score);N.chip(ctx,264,14,100,'BEST',Math.max(p.bestLevel,lv));if(p.streak>1)N.chip(ctx,374,14,110,'PERFECT','×'+p.streak,{color:'#ef896d'});
 if(p.msgT>0){ctx.globalAlpha=Math.min(1,p.msgT*2);N.text(ctx,p.msg,W/2,H*.3,{font:'700 '+Math.round(Math.min(W,H)*.075)+'px Fredoka',align:'center',color:'#ffe08a',stroke:'#1a1226',glow:'#ff6f91'});ctx.globalAlpha=1;}
 if(p.over)N.banner(ctx,W,H,'COLLAPSE!','Tower height '+lv+' floors','#ef896d');
 else if(!a.running)N.banner(ctx,W,H,'CLAY STACK','Tap to drop · land perfectly to keep your slab size');
 N.vignette(ctx,W,H,.3);}
function pd(x,y,e,a){if(a.running)drop(a);}
function kd(e,a){if(e.key===' '||e.key==='Enter'||e.key==='ArrowDown')drop(a);}
NEXUS_GAMES.register('stack',{meta:{title:'CLAY STACK',help:'Stop each swinging slab on top of the tower. Anything hanging over is sliced off. Hit near-perfect drops to chain streaks, win bonus points and grow your slab back. Every 10th floor is a fast golden floor.',controls:'Tap / click or press SPACE to drop',type:'TIMING'},
 size:[900,520],portraitSize:[540,860],duration:0,timed:false,tier:1.1,touch:[{kind:'btn',side:'right',label:'DROP',key:' ',big:true}],init,start,update,draw,pointerdown:pd,keydown:kd});
})();

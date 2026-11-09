/* Shared drawing, physics and audio helpers for game modules. window.NXG */
(function(){
const TAU=Math.PI*2,clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),lerp=(a,b,t)=>a+(b-a)*t,rand=(a,b)=>a+Math.random()*(b-a);
const ease={out:t=>1-(1-t)*(1-t),inOut:t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2,back:t=>{const c=1.70158;return 1+(c+1)*Math.pow(t-1,3)+c*Math.pow(t-1,2);},bounce:t=>{const n=7.5625,d=2.75;if(t<1/d)return n*t*t;if(t<2/d)return n*(t-=1.5/d)*t+.75;if(t<2.5/d)return n*(t-=2.25/d)*t+.9375;return n*(t-=2.625/d)*t+.984375;}};
function mulberry(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function hex(c){const n=parseInt(c.slice(1),16);return[n>>16&255,n>>8&255,n&255];}
function mix(a,b,t){const A=hex(a),B=hex(b);return'rgb('+A.map((v,i)=>Math.round(lerp(v,B[i],t))).join(',')+')';}
function shade(c,t){return t>=0?mix(c,'#ffffff',t):mix(c,'#000000',-t);}
function rr(ctx,x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,r);}

const INK='#2a1a2c';
/* gold coil-rope rim (lobby carpet trim) */
function coil(ctx,x,y,w,h,r){ctx.save();ctx.lineWidth=5;ctx.strokeStyle='#8a5b1a';rr(ctx,x+1,y+1,w-2,h-2,r);ctx.stroke();ctx.lineWidth=3;ctx.strokeStyle='#e4b672';rr(ctx,x+1,y+1,w-2,h-2,r);ctx.stroke();ctx.setLineDash([2,6]);ctx.lineWidth=3;ctx.strokeStyle='rgba(255,246,222,.55)';rr(ctx,x+1,y+1,w-2,h-2,r);ctx.stroke();ctx.restore();}
/* lopsided inked clay blob, deterministic per seed */
function blob(ctx,x,y,r,col,seed=1,o={}){const R=mulberry(seed*977);ctx.save();ctx.translate(x,y);ctx.rotate((R()-.5)*.3);if(o.shadow!==false){ctx.fillStyle='rgba(18,8,28,.34)';ctx.beginPath();ctx.ellipse(r*.22,r*.8,r*.95*(o.sx||1),r*.34,0,0,TAU);ctx.fill();}
 ctx.beginPath();const k=14;for(let i=0;i<=k;i++){const a=i/k*TAU,rr2=r*(1+(R()-.5)*.1),px=Math.cos(a)*rr2*(o.sx||1),py=Math.sin(a)*rr2*(o.sy||1);i?ctx.lineTo(px,py):ctx.moveTo(px,py);}ctx.closePath();
 const g=ctx.createRadialGradient(-r*.35,-r*.4,r*.1,0,0,r*1.15);g.addColorStop(0,shade(col,.45));g.addColorStop(.55,col);g.addColorStop(1,shade(col,-.5));ctx.fillStyle=g;ctx.fill();ctx.lineWidth=Math.max(1.2,r*.07);ctx.strokeStyle=INK;ctx.lineJoin='round';ctx.stroke();
 if(!o.noShine){ctx.strokeStyle='rgba(255,250,235,.55)';ctx.lineWidth=Math.max(1,r*.09);ctx.lineCap='round';ctx.beginPath();ctx.arc(0,0,r*.72,3.5,4.4);ctx.stroke();}ctx.restore();}
function shadow(ctx,x,y,rx,ry,a=.35){ctx.save();ctx.globalAlpha=a;ctx.fillStyle='#140a20';ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,TAU);ctx.fill();ctx.restore();}
/* cached paper-grain overlay (one offscreen canvas per size) */
const grainCache={};
function grain(ctx,W,H,a=.5){const k=W+'x'+H;let c=grainCache[k];if(!c){c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d'),R=mulberry(77);for(let i=0;i<Math.min(2600,W*H/160);i++){g.fillStyle=R()>.5?'rgba(255,244,220,'+(.03+R()*.07)+')':'rgba(30,18,32,'+(.03+R()*.08)+')';g.fillRect(R()*W,R()*H,1+R()*2.2,1+R()*1.6);}grainCache[k]=c;}ctx.save();ctx.globalAlpha=a;ctx.drawImage(c,0,0);ctx.restore();}
/* cached backdrop builder: draw(ctx2d,W,H) runs once per key, then blits */
const bgCache={};
function cached(ctx,key,W,H,draw){let c=bgCache[key+W+'x'+H];if(!c){c=document.createElement('canvas');c.width=W;c.height=H;draw(c.getContext('2d'),W,H);bgCache[key+W+'x'+H]=c;}ctx.drawImage(c,0,0);}
/* neon plaque title */
function marquee(ctx,x,y,w,title,col='#ffd17c'){ctx.save();ctx.fillStyle='rgba(0,0,0,.3)';rr(ctx,x+2,y+5,w,34,17);ctx.fill();const g=ctx.createLinearGradient(0,y,0,y+34);g.addColorStop(0,'#4b3052');g.addColorStop(1,'#2c1f38');ctx.fillStyle=g;rr(ctx,x,y,w,34,17);ctx.fill();ctx.strokeStyle='#e4b672';ctx.lineWidth=2;ctx.stroke();ctx.restore();text(ctx,title,x+w/2,y+23,{font:'700 15px Fredoka',align:'center',color:col,glow:col});}
/* glossy clay ball: radial lit sphere with soft ground shadow */
function ball(ctx,x,y,r,col,o={}){
 if(o.shadow!==false){ctx.save();ctx.globalAlpha=.34*(o.shadowAlpha??1);ctx.fillStyle='#140a20';ctx.beginPath();ctx.ellipse(x+r*.28,y+r*.78+(o.lift||0),r*.98,r*.4,0,0,TAU);ctx.fill();ctx.restore();}
 const g=ctx.createRadialGradient(x-r*.36,y-r*.42,r*.08,x,y,r*1.08);g.addColorStop(0,shade(col,.5));g.addColorStop(.5,col);g.addColorStop(1,shade(col,-.52));
 ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fill();
 ctx.strokeStyle=INK;ctx.lineWidth=Math.max(1.2,r*.07);ctx.stroke();
 ctx.strokeStyle='rgba(255,246,222,.55)';ctx.lineWidth=Math.max(1,r*.09);ctx.lineCap='round';ctx.beginPath();ctx.arc(x,y,r*.72,3.5,4.4);ctx.stroke();
}
/* bevelled slab with top highlight and edge shading (reads as moulded clay/plastic) */
function slab(ctx,x,y,w,h,r,col,o={}){
 if(o.shadow!==false){ctx.save();ctx.globalAlpha=.34;ctx.fillStyle='#140a20';rr(ctx,x+3,y+(o.depth||6),w,h,r);ctx.fill();ctx.restore();}
 const g=ctx.createLinearGradient(x,y,x,y+h);g.addColorStop(0,shade(col,.3));g.addColorStop(.5,col);g.addColorStop(1,shade(col,-.36));
 ctx.fillStyle=g;rr(ctx,x,y,w,h,r);ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=2;ctx.stroke();
 ctx.strokeStyle='rgba(255,246,222,.42)';ctx.lineWidth=Math.max(1.2,Math.min(3,h*.05));ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x+r,y+Math.max(3,h*.08));ctx.lineTo(x+w-r,y+Math.max(3,h*.08));ctx.stroke();
}
function glow(ctx,x,y,r,col,a=.6){const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,col);g.addColorStop(1,'rgba(0,0,0,0)');ctx.save();ctx.globalAlpha=a;ctx.globalCompositeOperation='lighter';ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fill();ctx.restore();}
function text(ctx,t,x,y,o={}){ctx.save();ctx.font=o.font||'700 18px Fredoka, system-ui';ctx.textAlign=o.align||'left';ctx.textBaseline=o.base||'alphabetic';if(o.stroke){ctx.lineWidth=o.sw||4;ctx.strokeStyle=o.stroke;ctx.lineJoin='round';ctx.strokeText(t,x,y);}ctx.fillStyle=o.color||'#fff0d4';if(o.glow){ctx.shadowColor=o.glow;ctx.shadowBlur=12;}ctx.fillText(t,x,y);ctx.restore();}
/* HUD chip: label + value */
function chip(ctx,x,y,w,label,value,o={}){ctx.save();ctx.fillStyle='rgba(0,0,0,.28)';rr(ctx,x,y+3,w,38,19);ctx.fill();const g=ctx.createLinearGradient(0,y,0,y+38);g.addColorStop(0,'rgba(58,44,74,.92)');g.addColorStop(1,'rgba(36,26,50,.92)');ctx.fillStyle=g;rr(ctx,x,y,w,38,19);ctx.fill();ctx.strokeStyle=o.color?o.color:'rgba(228,182,114,.55)';ctx.lineWidth=1.5;ctx.stroke();ctx.restore();text(ctx,label,x+14,y+14,{font:'700 9px Fredoka',color:'rgba(255,240,208,.62)'});text(ctx,String(value),x+14,y+31,{font:'700 17px Fredoka',color:o.color||'#ffd17c'});}

function bar(ctx,x,y,w,h,t,col,bg='rgba(28,20,40,.75)'){ctx.save();ctx.fillStyle=bg;rr(ctx,x,y,w,h,h/2);ctx.fill();ctx.strokeStyle='rgba(228,182,114,.5)';ctx.lineWidth=1.2;ctx.stroke();if(t>0){const bw=Math.max(h-4,(w-4)*clamp(t,0,1));const g=ctx.createLinearGradient(0,y,0,y+h);g.addColorStop(0,shade(col,.3));g.addColorStop(1,shade(col,-.25));ctx.fillStyle=g;rr(ctx,x+2,y+2,bw,h-4,(h-4)/2);ctx.fill();ctx.fillStyle='rgba(255,246,222,.35)';rr(ctx,x+5,y+3,Math.max(2,bw-8),Math.max(1.5,(h-4)*.28),2);ctx.fill();}ctx.restore();}

/* centred banner (READY / GAME OVER style) */
function banner(ctx,W,H,title,sub,col='#ffe08a'){ctx.save();const bw=Math.min(W*.86,520),bh=Math.min(H*.3,130),x=(W-bw)/2,y=H*.5-bh/2;ctx.fillStyle='rgba(12,6,20,.55)';ctx.fillRect(0,0,W,H);ctx.fillStyle='rgba(0,0,0,.35)';rr(ctx,x+4,y+8,bw,bh,28);ctx.fill();const g=ctx.createLinearGradient(0,y,0,y+bh);g.addColorStop(0,'#5a3d62');g.addColorStop(1,'#34233f');ctx.fillStyle=g;rr(ctx,x,y,bw,bh,28);ctx.fill();coil(ctx,x,y,bw,bh,28);ctx.restore();text(ctx,title,W/2,y+bh*.5,{font:'700 '+Math.round(Math.min(bw*.1,bh*.34))+'px Fredoka',align:'center',color:col,stroke:'#1a1226',glow:col});if(sub)text(ctx,sub,W/2,y+bh*.78,{font:'600 '+Math.round(Math.min(bw*.04,bh*.14))+'px Fredoka',align:'center',color:'#fff0d4'});}

/* vignette + subtle scanline lighting overlay for depth */
function vignette(ctx,W,H,a=.45){const g=ctx.createRadialGradient(W/2,H/2,Math.min(W,H)*.3,W/2,H/2,Math.max(W,H)*.72);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(8,4,18,'+a+')');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);}
function bgGrad(ctx,W,H,stops){const g=ctx.createLinearGradient(0,0,0,H);stops.forEach((c,i)=>g.addColorStop(i/(stops.length-1),c));ctx.fillStyle=g;ctx.fillRect(0,0,W,H);}
/* ---- physics ---- */
function circleCollide(a,b,rest=.92){const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy),R=a.r+b.r;if(d>=R||d===0)return false;const nx=dx/d,ny=dy/d,ma=a.m||1,mb=b.m||1;const ov=R-d;a.x-=nx*ov*mb/(ma+mb);a.y-=ny*ov*mb/(ma+mb);b.x+=nx*ov*ma/(ma+mb);b.y+=ny*ov*ma/(ma+mb);const rvx=b.vx-a.vx,rvy=b.vy-a.vy,vn=rvx*nx+rvy*ny;if(vn>0)return true;const j=-(1+rest)*vn/(1/ma+1/mb);a.vx-=j*nx/ma;a.vy-=j*ny/ma;b.vx+=j*nx/mb;b.vy+=j*ny/mb;return Math.abs(vn);}
function circleSegment(c,x1,y1,x2,y2,rest=.7){const dx=x2-x1,dy=y2-y1,l2=dx*dx+dy*dy;let t=l2?clamp(((c.x-x1)*dx+(c.y-y1)*dy)/l2,0,1):0;const px=x1+dx*t,py=y1+dy*t;let nx=c.x-px,ny=c.y-py;const d=Math.hypot(nx,ny);if(d>=c.r||d===0)return false;nx/=d;ny/=d;c.x=px+nx*c.r;c.y=py+ny*c.r;const vn=c.vx*nx+c.vy*ny;if(vn<0){c.vx-=(1+rest)*vn*nx;c.vy-=(1+rest)*vn*ny;}return Math.abs(vn);}
/* ---- audio (uses api.sound for tonal, own noise burst) ---- */
let actx=null;
function noise(dur=.12,vol=.05,freq=1200){try{actx=actx||new(window.AudioContext||window.webkitAudioContext)();if(actx.state==='suspended')actx.resume();const n=Math.floor(actx.sampleRate*dur),buf=actx.createBuffer(1,n,actx.sampleRate),d=buf.getChannelData(0);for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*(1-i/n);const s=actx.createBufferSource();s.buffer=buf;const f=actx.createBiquadFilter();f.type='lowpass';f.frequency.value=freq;const g=actx.createGain();g.gain.value=vol;s.connect(f);f.connect(g);g.connect(actx.destination);s.start();}catch(e){}}
function sfx(api,name){const s=api.sound;switch(name){case'hit':s(220,.07,'square',.04);noise(.05,.04,2000);break;case'coin':s(880,.07,'triangle',.05);setTimeout(()=>s(1320,.12,'triangle',.05),60);break;case'win':[523,659,784,1047].forEach((f,i)=>setTimeout(()=>s(f,.16,'triangle',.05),i*90));break;case'lose':[330,262,196].forEach((f,i)=>setTimeout(()=>s(f,.2,'sawtooth',.04),i*120));break;case'boom':noise(.35,.09,500);s(70,.3,'sawtooth',.05);break;case'pop':s(520,.05,'sine',.05);noise(.04,.03,3000);break;case'whoosh':noise(.22,.04,900);break;case'tick':s(1000,.025,'square',.025);break;case'bump':s(150,.09,'sine',.07);break;case'ping':s(1400,.1,'sine',.045);break;case'power':[400,600,900].forEach((f,i)=>setTimeout(()=>s(f,.1,'square',.035),i*60));break;case'miss':s(160,.15,'sawtooth',.04);break;case'shot':noise(.09,.07,3500);s(180,.1,'square',.04);break;case'reload':s(300,.05,'square',.03);setTimeout(()=>s(450,.06,'square',.03),120);break;case'pocket':s(110,.18,'sine',.08);noise(.12,.04,600);break;case'click':s(480,.03,'square',.025);break;}}
/* ---- fixed timestep helper ---- */
function stepper(fn,hz=120){let acc=0;const h=1/hz;return dt=>{acc+=Math.min(dt,.05);while(acc>=h){fn(h);acc-=h;}};}
window.NXG={TAU,clamp,lerp,rand,ease,mulberry,mix,shade,rr,ball,slab,glow,text,chip,bar,banner,vignette,bgGrad,coil,blob,shadow,grain,cached,marquee,INK,circleCollide,circleSegment,noise,sfx,stepper};
})();

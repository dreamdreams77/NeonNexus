/* Shared drawing, physics and audio helpers for game modules. window.NXG */
(function(){
const TAU=Math.PI*2,clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),lerp=(a,b,t)=>a+(b-a)*t,rand=(a,b)=>a+Math.random()*(b-a);
const ease={out:t=>1-(1-t)*(1-t),inOut:t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2,back:t=>{const c=1.70158;return 1+(c+1)*Math.pow(t-1,3)+c*Math.pow(t-1,2);},bounce:t=>{const n=7.5625,d=2.75;if(t<1/d)return n*t*t;if(t<2/d)return n*(t-=1.5/d)*t+.75;if(t<2.5/d)return n*(t-=2.25/d)*t+.9375;return n*(t-=2.625/d)*t+.984375;}};
function mulberry(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function hex(c){const n=parseInt(c.slice(1),16);return[n>>16&255,n>>8&255,n&255];}
function mix(a,b,t){const A=hex(a),B=hex(b);return'rgb('+A.map((v,i)=>Math.round(lerp(v,B[i],t))).join(',')+')';}
function shade(c,t){return t>=0?mix(c,'#ffffff',t):mix(c,'#000000',-t);}
function rr(ctx,x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,r);}
/* glossy clay ball: radial lit sphere with soft ground shadow */
function ball(ctx,x,y,r,col,o={}){
 if(o.shadow!==false){ctx.save();ctx.globalAlpha=.28*(o.shadowAlpha??1);ctx.fillStyle='#120c1c';ctx.beginPath();ctx.ellipse(x+r*.25,y+r*.75+(o.lift||0),r*.95,r*.38,0,0,TAU);ctx.fill();ctx.restore();}
 const g=ctx.createRadialGradient(x-r*.38,y-r*.42,r*.08,x,y,r*1.05);g.addColorStop(0,shade(col,.55));g.addColorStop(.45,col);g.addColorStop(1,shade(col,-.5));
 ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fill();
 ctx.strokeStyle='rgba(40,24,40,.35)';ctx.lineWidth=Math.max(1,r*.07);ctx.stroke();
 ctx.fillStyle='rgba(255,255,255,.55)';ctx.beginPath();ctx.ellipse(x-r*.34,y-r*.4,r*.26,r*.15,-.6,0,TAU);ctx.fill();
}
/* bevelled slab with top highlight and edge shading (reads as moulded clay/plastic) */
function slab(ctx,x,y,w,h,r,col,o={}){
 if(o.shadow!==false){ctx.save();ctx.globalAlpha=.3;ctx.fillStyle='#120c1c';rr(ctx,x+3,y+(o.depth||6),w,h,r);ctx.fill();ctx.restore();}
 const g=ctx.createLinearGradient(x,y,x,y+h);g.addColorStop(0,shade(col,.3));g.addColorStop(.5,col);g.addColorStop(1,shade(col,-.32));
 ctx.fillStyle=g;rr(ctx,x,y,w,h,r);ctx.fill();ctx.strokeStyle='rgba(40,24,40,.4)';ctx.lineWidth=2;ctx.stroke();
 ctx.fillStyle='rgba(255,255,255,.28)';rr(ctx,x+4,y+3,w-8,Math.max(3,h*.18),Math.min(r,6));ctx.fill();
}
function glow(ctx,x,y,r,col,a=.6){const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,col);g.addColorStop(1,'rgba(0,0,0,0)');ctx.save();ctx.globalAlpha=a;ctx.globalCompositeOperation='lighter';ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fill();ctx.restore();}
function text(ctx,t,x,y,o={}){ctx.save();ctx.font=o.font||'700 18px Fredoka, system-ui';ctx.textAlign=o.align||'left';ctx.textBaseline=o.base||'alphabetic';if(o.stroke){ctx.lineWidth=o.sw||4;ctx.strokeStyle=o.stroke;ctx.lineJoin='round';ctx.strokeText(t,x,y);}ctx.fillStyle=o.color||'#fff0d4';if(o.glow){ctx.shadowColor=o.glow;ctx.shadowBlur=12;}ctx.fillText(t,x,y);ctx.restore();}
/* HUD chip: label + value */
function chip(ctx,x,y,w,label,value,o={}){ctx.save();ctx.fillStyle='rgba(22,16,34,.62)';rr(ctx,x,y,w,38,12);ctx.fill();ctx.strokeStyle=o.color||'rgba(255,240,208,.35)';ctx.lineWidth=2;ctx.stroke();ctx.restore();text(ctx,label,x+10,y+14,{font:'700 10px Fredoka',color:'rgba(255,240,208,.65)'});text(ctx,String(value),x+10,y+32,{font:'700 18px Fredoka',color:o.color||'#fff0d4'});}
function bar(ctx,x,y,w,h,t,col,bg='rgba(22,16,34,.6)'){ctx.save();ctx.fillStyle=bg;rr(ctx,x,y,w,h,h/2);ctx.fill();ctx.fillStyle=col;if(t>0){rr(ctx,x+2,y+2,Math.max(h-4,(w-4)*clamp(t,0,1)),h-4,(h-4)/2);ctx.fill();}ctx.restore();}
/* centred banner (READY / GAME OVER style) */
function banner(ctx,W,H,title,sub,col='#ffe08a'){ctx.save();ctx.fillStyle='rgba(18,12,30,.58)';ctx.fillRect(0,H*.34,W,H*.26);text(ctx,title,W/2,H*.47,{font:'700 '+Math.round(Math.min(W,H)*.09)+'px Fredoka',align:'center',color:col,stroke:'#1a1226',glow:col});if(sub)text(ctx,sub,W/2,H*.55,{font:'600 '+Math.round(Math.min(W,H)*.035)+'px Fredoka',align:'center',color:'#fff0d4'});ctx.restore();}
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
window.NXG={TAU,clamp,lerp,rand,ease,mulberry,mix,shade,rr,ball,slab,glow,text,chip,bar,banner,vignette,bgGrad,circleCollide,circleSegment,noise,sfx,stepper};
})();

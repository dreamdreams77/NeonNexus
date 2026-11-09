/* games/rhythm.js — Neon Nexus cabinet module */
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
/* ===== BEAT FOUNDRY ===== */
const LCOL=['#ef896d','#f2ce77','#91c9a7','#7fb8e8'],LKEY=['d','f','j','k'],ARR={ArrowLeft:0,ArrowDown:1,ArrowUp:2,ArrowRight:3};
const SONGS=[
 {id:0,name:'Forge Warmup',bpm:96,bars:32,seed:11,den:.8,col:'#91c9a7',lock:null,desc:'Easy groove · taps'},
 {id:1,name:'Anvil Anthem',bpm:120,bars:36,seed:23,den:1,col:'#f2ce77',lock:'Clear Forge Warmup',desc:'Medium · holds & chords'},
 {id:2,name:'Molten Meltdown',bpm:142,bars:40,seed:37,den:1.2,col:'#ef896d',lock:'Clear Anvil Anthem',desc:'Hard · dense streams'}];
let S=null;
function gain(api,v){S.pts+=v;api.setScore(S.pts);}
function genChart(song,diff){
 const rn=N.mulberry(song.seed),rd=N.mulberry(song.seed+99),b=60/song.bpm,notes=[],st=b/2;
 let last=-1,lastLast=-1;const pick=(avoid)=>{let l,k=0;do{l=Math.floor(rn()*4);k++;}while((l===last||l===avoid)&&k<8);return l;};
 const add=(step,lane,len)=>{notes.push({lane,t:3+step*st,len:len?len*st:0,hit:0,res:0,holding:0});};
 for(let bar=0;bar<song.bars;bar++){
  const f=bar/song.bars;let sec=f<.12?0:f<.4?1:f<.55?2:f<.7?3:f<.9?2:4; // 0 intro 1 verse 2 chorus 3 bridge 4 finale
  if(bar>=song.bars-2)sec=0;
  const base=bar*8;
  for(let s=0;s<8;s++){
   const step=base+s,beat=s%2===0;let p=0;
   if(sec===0)p=(s===0||s===4)?1:0;
   else if(sec===1)p=beat?(s===0||s===4?1:.8):.18*song.den;
   else if(sec===2)p=beat?1:.55*song.den;
   else if(sec===3)p=s===0||s===4?1:(beat?.5:.25);
   else p=beat?1:.8*song.den;
   if(song.id===0&&!beat)p*=.6;
   if(rn()<p){
    // stair pattern in chorus
    let lane;if((sec===2||sec===4)&&song.id>=1&&s>=4&&rn()<.5){lane=(last+(rn()<.5?1:3))%4;}else lane=pick(-1);
    let len=0;
    if(sec===3&&song.id>=1&&s%4===0&&rn()<.7){len=song.id===1?3:4;add(step,lane,len);lastLast=last;last=lane;
     // tap in other lane during hold
     if(s<=4){const ol=(lane+1+Math.floor(rn()*2)*2)%4;if(rn()<.8)add(step+2,ol,0);}
     continue;}
    add(step,lane,0);
    if(song.id>=1&&(sec===2||sec===4)&&s%4===0&&rn()<(song.id===2?.4:.2)){let l2=(lane+2)%4;add(step,l2,0);} // chord
    lastLast=last;last=lane;
   }
  }
 }
 notes.sort((a,c)=>a.t-c.t||a.lane-c.lane);
 // difficulty thinning (never remove downbeats on easy)
 const out=[];for(const n of notes){const onBeat=Math.abs(((n.t-3)/b)%1)<.01;
  if(diff==='easy'&&((!onBeat&&rd()<.45)||(n.len===0&&notes.some(m=>m!==n&&m.t===n.t&&m.lane!==n.lane&&n.lane>m.lane))))continue;
  out.push(n);}
 // avoid hold overlap in same lane
 for(let i=0;i<out.length;i++){const n=out[i];if(n.len){for(let j=i+1;j<out.length&&out[j].t<n.t+n.len+.05;j++)if(out[j].lane===n.lane){n.len=0;break;}}}
 return out;
}
function laneGeom(api){
 const W=api.W,H=api.H,por=api.portrait;
 return{cx:W/2,lw:por?Math.min(116,(W-30)/4):104,top:por?170:56,hit:por?H-120:H-84};
}
function proj(g,y){const t=cl((y-g.top)/(g.hit-g.top),0,1.15);return .5+.5*Math.min(1,t)+(t>1?(t-1)*.4:0);}
function lx(g,i,y){return g.cx+(i-1.5)*g.lw*proj(g,y);}
function newState(api){
 const m=api.mastery;
 S={phase:'select',sel:SONGS.findIndex((s,i)=>i===api.store.get('last',0))>=0?api.store.get('last',0):0,song:null,notes:[],t:-3,ni:0,pt:0,hp:m>=4?88:75,maxHp:100,combo:0,best:0,mult:1,fever:0,feverOn:0,feverUses:0,judge:null,
  pts:0,cnt:{p:0,g:0,o:0,m:0,gh:0},down:[0,0,0,0],pids:{},flash:[0,0,0,0],press:[0,0,0,0],sparks:[],bgT:0,shield:m>=6?1:0,unit:1,total:0,dur:0,endT:-1,done:false,speed:430,cd:0,hits:0,wob:0,gears:null,unlocked:[true,!!api.store.get('c0',0),!!api.store.get('c1',0)]};
}
const winFor=api=>({p:.045,g:.09,o:.14}),sc=api=>1/(api.diff.mul<1?.85:api.diff.mul>1?1.12:1)*(api.mastery>=2?1.1:1);
function startSong(api,i){
 const sg=SONGS[i];S.song=sg;S.sel=i;api.store.set('last',i);
 const dn=api.diff.id;S.notes=genChart(sg,dn);S.ni=0;S.t=-3.4;S.phase='play';
 S.speed=430*(api.diff.mul>1?1.18:api.diff.mul<1?.88:1);
 S.total=S.notes.length;S.dur=3+sg.bars*4*60/sg.bpm+1.5;
 // unit so that perfect full combo ~ 500
 S.unit=500/(S.total*2.45*1.0);S.hp=api.mastery>=4?88:75;S.beatN=-1;
}
function judge(api,res,note,lane){
 const g=laneGeom(api);
 const mult=S.mult*(S.feverOn>0?1.5:1);
 let base,txt,col;
 if(res==='p'){base=1.5;txt='PERFECT';col='#ffe08a';S.hp+=1.4;S.fever+=4.5;S.cnt.p++;}
 else if(res==='g'){base=1;txt='GOOD';col='#9de3d1';S.hp+=.7;S.fever+=2.8;S.cnt.g++;}
 else{base=.5;txt='OK';col='#cfe0ff';S.hp+=.2;S.fever+=1;S.cnt.o++;}
 if(api.mastery>=6)S.fever+=1.2;
 S.hp=Math.min(S.maxHp,S.hp);S.combo++;S.best=Math.max(S.best,S.combo);api.combo=S.combo;S.hits++;
 S.mult=S.combo>=30?4:S.combo>=16?3:S.combo>=8?2:1;
 gain(api,base*S.unit*mult);
 if(S.fever>=100&&!S.feverOn){S.fever=100;}
 S.judge={t:txt,c:col,k:.5};S.flash[lane]=.25;
 const x=lx(g,lane,g.hit);
 api.burst(x,g.hit,LCOL[lane],res==='p'?10:5);
 if(S.combo>0&&S.combo%25===0){api.popText(S.combo+' COMBO!',g.cx,g.hit-140,'#ffe08a');api.shake(4,.15);}
 api.sound(330*Math.pow(2,[0,3,7,10][lane]/12),.07,'triangle',.045);
}
function miss(api,note){
 S.cnt.m++;
 if(S.shield>0&&S.combo>=10){S.shield=0;api.popText('SHIELDED!',api.W/2,api.H*.5,'#9de3d1');S.judge={t:'SAVED',c:'#9de3d1',k:.5};return;}
 S.combo=0;S.mult=1;api.combo=0;S.hp-=api.diff.mul>1?7.5:6;S.judge={t:'MISS',c:'#ff8a6a',k:.5};S.wob=.3;api.sound(110,.1,'sawtooth',.04);
 if(S.hp<=0){S.hp=0;S.phase='fail';S.endT=1.6;api.shake(14,.5);sfx(api,'lose');}
}
function press(api,lane){
 if(S.phase!=='play')return;
 S.down[lane]++;S.press[lane]=1;
 const w=winFor(api),k=sc(api);let best=null;
 for(let i=S.ni;i<S.notes.length;i++){const n=S.notes[i];if(n.t-S.t>.2*k+.05)break;if(n.lane!==lane||n.hit||n.res)continue;const d=Math.abs(n.t-S.t);if(d<=w.o*k){best=n;break;}}
 if(best){const d=Math.abs(best.t-S.t);best.hit=1;const res=d<=w.p*k?'p':d<=w.g*k?'g':'o';best.res=res;if(best.len)best.holding=1;judge(api,res,best,lane);}
 else{S.cnt.gh++;S.hp-=1.0;S.judge={t:'GHOST',c:'#8a7a9a',k:.25};api.sound(90,.04,'square',.025);if(S.hp<=0){S.hp=0;S.phase='fail';S.endT=1.6;sfx(api,'lose');}}
}
function release(api,lane){
 S.down[lane]=Math.max(0,S.down[lane]-1);
 if(S.down[lane]>0)return;
 for(let i=S.ni;i<S.notes.length;i++){const n=S.notes[i];if(n.lane===lane&&n.holding){if(S.t<n.t+n.len-.12){n.holding=0;n.broken=1;S.combo=0;S.mult=1;api.combo=0;S.hp-=3;S.judge={t:'BREAK',c:'#ffb0a0',k:.4};api.sound(130,.08,'sawtooth',.04);}}}
}
function activateFever(api){
 if(S.phase!=='play'||S.feverOn>0||S.fever<100)return;S.feverOn=api.mastery>=6?10:8;S.feverUses++;S.fever=100;api.popText('FEVER!',api.W/2,api.H*.4,'#ffe08a');sfx(api,'power');api.shake(7,.3);
 if(S.feverUses>=3)api.achieve('fever','Fever Dreamer',5);
}
function finishSong(api){
 if(S.done)return;S.done=true;
 const c=S.cnt,tot=Math.max(1,S.total),acc=(c.p*1+c.g*.7+c.o*.35)/tot;
 const grade=acc>=.95?'S':acc>=.88?'A':acc>=.75?'B':acc>=.6?'C':'D';
 const win=S.phase!=='fail'&&acc>=.6;
 const gb={S:50,A:32,B:18,C:8,D:0}[grade];gain(api,gb);
 if(S.phase!=='fail'){api.store.set('c'+S.song.id,1);}
 const hs=api.store.get('hs',[0,0,0]);hs[S.song.id]=Math.max(hs[S.song.id]||0,Math.round(S.pts));api.store.set('hs',hs);
 const gr=api.store.get('gr',['-','-','-']);const ord='SABCD-';if(S.phase!=='fail'&&ord.indexOf(grade)<ord.indexOf(gr[S.song.id]))gr[S.song.id]=grade;api.store.set('gr',gr);
 topScores(api,api.score);
 if(c.m===0&&c.gh===0&&S.phase!=='fail')api.achieve('fc','Full Combo',8);
 if(grade==='S')api.achieve('s','S Rank Smith',8);
 if(api.store.get('c0',0)&&api.store.get('c1',0)&&api.store.get('c2',0))api.achieve('all','Foundry Master',10);
 if(S.phase==='fail')api.achieve('first','Forge Initiate',2);
 api.finish(win,{grade:(S.phase==='fail'?'FAILED · ':'')+grade+' RANK · '+S.song.name,combo:S.best});
}
/* ---------- drawing ---------- */
function drawGear(c,x,y,r,teeth,rot,col){
 c.save();c.translate(x,y);c.rotate(rot);c.beginPath();for(let i=0;i<teeth*2;i++){const a=i*Math.PI/teeth,rr=i%2?r*.86:r;c.lineTo(Math.cos(a)*rr,Math.sin(a)*rr);}c.closePath();c.fillStyle=col;c.fill();c.fillStyle='rgba(8,4,16,.5)';c.beginPath();c.arc(0,0,r*.4,0,TAU);c.fill();c.strokeStyle='rgba(255,255,255,.07)';c.lineWidth=3;c.beginPath();c.arc(0,0,r*.7,0,TAU);c.stroke();c.restore();
}
function bg(c,api){
 const W=api.W,H=api.H,fv=S.feverOn>0;
 const o=bgCache('rh'+W+'x'+H,W,H,(g,w,h)=>{N.bgGrad(g,w,h,['#150b18','#2a1420','#4a2020','#6a2a1c']);
  const gr=g.createRadialGradient(w/2,h*1.05,10,w/2,h,h*.8);gr.addColorStop(0,'rgba(255,150,60,.5)');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(0,0,w,h);
  g.fillStyle='rgba(0,0,0,.35)';for(let i=0;i<10;i++){g.fillRect(i*w/10+10,0,14,h);}
  g.fillStyle='rgba(255,170,80,.08)';for(let i=0;i<10;i++){g.fillRect(i*w/10+10,0,5,h);}});
 c.drawImage(o,0,0);
 const t=S.bgT*(fv?2.5:1);
 drawGear(c,W*.1,H*.25,70,12,t*.4,'#3a2428');drawGear(c,W*.1+112,H*.25+20,48,9,-t*.55,'#40282c');drawGear(c,W*.92,H*.6,90,14,-t*.3,'#3a2428');drawGear(c,W*.86,H*.2,52,10,t*.5,'#40282c');drawGear(c,W*.06,H*.78,60,11,-t*.4,'#40282c');
 // embers
 c.save();c.globalCompositeOperation='lighter';for(let i=0;i<22;i++){const k=(S.bgT*(.05+i%5*.02)+i*.137)%1,x=(i*97%W)+Math.sin(S.bgT+i)*14,y=H*(1-k);c.globalAlpha=(1-k)*(fv?.9:.6);c.fillStyle=fv?'#ffe9a0':'#ff9a50';c.beginPath();c.arc(x,y,1.5+i%3,0,TAU);c.fill();}c.restore();
}
function drawHighway(c,api){
 const g=laneGeom(api),fv=S.feverOn>0;
 // road
 const xL=lx(g,0,g.top)-g.lw*.5*proj(g,g.top),xR=lx(g,3,g.top)+g.lw*.5*proj(g,g.top),bL=lx(g,0,g.hit)-g.lw*.5,bR=lx(g,3,g.hit)+g.lw*.5;
 c.save();
 const rg=c.createLinearGradient(0,g.top,0,api.H);rg.addColorStop(0,fv?'rgba(120,70,30,.85)':'rgba(30,18,30,.85)');rg.addColorStop(1,fv?'rgba(200,120,50,.9)':'rgba(48,28,40,.92)');
 c.fillStyle=rg;c.beginPath();c.moveTo(xL,g.top);c.lineTo(xR,g.top);c.lineTo(bR+g.lw*.1,api.H);c.lineTo(bL-g.lw*.1,api.H);c.closePath();c.fill();
 c.strokeStyle=fv?'#ffe08a':'rgba(255,200,140,.45)';c.lineWidth=3;c.stroke();
 // lane dividers + flash
 for(let i=0;i<4;i++){const fl=S.flash[i]+(S.down[i]?.25:0);if(fl>0){const a=lx(g,i,g.top),b=lx(g,i,g.hit);c.fillStyle=LCOL[i];c.globalAlpha=Math.min(.45,fl*1.6);const wT=g.lw*proj(g,g.top),wB=g.lw;c.beginPath();c.moveTo(a-wT/2,g.top);c.lineTo(a+wT/2,g.top);c.lineTo(b+wB/2,g.hit+30);c.lineTo(b-wB/2,g.hit+30);c.fill();c.globalAlpha=1;}}
 c.strokeStyle='rgba(255,220,180,.2)';c.lineWidth=2;for(let i=0;i<=4;i++){const k=i-2;c.beginPath();c.moveTo(g.cx+k*g.lw*proj(g,g.top),g.top);c.lineTo(g.cx+k*g.lw,api.H);c.stroke();}
 // beat lines
 if(S.song){const b=60/S.song.bpm;const first=Math.ceil((S.t-.2)/b);for(let n=first;n<first+14;n++){const tt=3+n*b-0;const y=g.hit-(tt-S.t)*S.speed;if(y<g.top||y>g.hit+20)continue;c.strokeStyle='rgba(255,230,200,'+(n%4===0?.28:.1)+')';c.lineWidth=n%4===0?3:1.5;const pr=proj(g,y);c.beginPath();c.moveTo(g.cx-2*g.lw*pr,y);c.lineTo(g.cx+2*g.lw*pr,y);c.stroke();}}
 // hit pads
 for(let i=0;i<4;i++){const x=lx(g,i,g.hit),w=g.lw*.88,dn=S.down[i]?1:0,pr=S.press[i];
  c.save();c.translate(x,g.hit+dn*4);
  if(dn)N.glow(c,0,0,g.lw*.9,LCOL[i],.7);
  N.slab(c,-w/2,-18,w,34,12,dn?N.shade(LCOL[i],.2):N.mix(LCOL[i],'#2a1830',.45),{depth:dn?2:6});
  c.strokeStyle=LCOL[i];c.lineWidth=3;c.beginPath();N.rr(c,-w/2+6,-12,w-12,22,8);c.stroke();
  T(c,LKEY[i].toUpperCase(),0,6,15,'#fff0d4','center',{stroke:null});c.restore();}
 c.restore();
}
function drawNote(c,api,n,g){
 if(n.res&&!n.len&&n.res!==0)return;
 if(n.broken&&n.t+n.len<S.t-.3)return;
 const y=g.hit-(n.t-S.t)*S.speed;
 if(n.len){
  const ye=g.hit-(n.t+n.len-S.t)*S.speed;
  const yh=n.holding?Math.min(y,g.hit):y;
  if(ye>api.H+40||yh<g.top-60&&ye<g.top-60)return;
  const x1=lx(g,n.lane,Math.max(g.top,ye)),x2=lx(g,n.lane,yh),w1=g.lw*.5*proj(g,Math.max(g.top,ye)),w2=g.lw*.5*proj(g,yh);
  c.save();c.globalAlpha=n.broken?.35:1;const col=LCOL[n.lane];
  const gr=c.createLinearGradient(0,ye,0,yh);gr.addColorStop(0,N.shade(col,-.2));gr.addColorStop(1,N.shade(col,.15));
  c.fillStyle=gr;c.beginPath();c.moveTo(x1-w1,Math.max(g.top,ye));c.lineTo(x1+w1,Math.max(g.top,ye));c.lineTo(x2+w2,yh);c.lineTo(x2-w2,yh);c.closePath();c.fill();c.strokeStyle='rgba(30,16,34,.6)';c.lineWidth=2;c.stroke();
  c.fillStyle='rgba(255,255,255,.25)';c.beginPath();c.moveTo(x1-w1*.5,Math.max(g.top,ye));c.lineTo(x1-w1*.2,Math.max(g.top,ye));c.lineTo(x2-w2*.2,yh);c.lineTo(x2-w2*.5,yh);c.fill();
  if(n.holding){N.glow(c,lx(g,n.lane,g.hit),g.hit,g.lw*.9,col,.9);}
  c.restore();
  if(n.holding||!n.hit)drawHead(c,api,lx(g,n.lane,yh),yh,n.lane,g,n.holding);
  return;
 }
 if(y<g.top-30||y>api.H+40)return;
 drawHead(c,api,lx(g,n.lane,y),y,n.lane,g,false);
}
function drawHead(c,api,x,y,lane,g,glow){
 const pr=proj(g,y),w=g.lw*.86*pr,h=34*pr+6;
 c.save();c.translate(x,y);
 if(glow)N.glow(c,0,0,w,LCOL[lane],.8);
 N.slab(c,-w/2,-h/2,w,h,h*.35,LCOL[lane],{depth:3*pr,shadow:pr>.7});
 c.fillStyle='rgba(255,255,255,.6)';c.beginPath();c.ellipse(-w*.2,-h*.2,w*.14,h*.1,-.2,0,TAU);c.fill();
 c.fillStyle='rgba(40,20,30,.35)';c.beginPath();c.arc(0,0,h*.2,0,TAU);c.fill();
 c.restore();
}
function drawHUD(c,api){
 const W=api.W,H=api.H,por=api.portrait,g=laneGeom(api);
 // health bar
 const hb=por?{x:14,y:50,w:W-28}:{x:W-250,y:70,w:230};
 N.bar(c,hb.x,hb.y,hb.w,16,S.hp/S.maxHp,S.hp<30?'#ef4a4a':'#91c9a7');T(c,'HEALTH',hb.x+8,hb.y+13,11,'#fff0d4','left',{stroke:null});
 // fever bar
 const fb={x:hb.x,y:hb.y+(por?26:26),w:hb.w};
 N.bar(c,fb.x,fb.y,fb.w,16,S.feverOn>0?S.feverOn/8:S.fever/100,S.feverOn>0?'#ffe08a':S.fever>=100?'#ffd060':'#e08ac0');
 T(c,S.feverOn>0?'FEVER ×1.5':S.fever>=100?'FEVER READY - PRESS SPACE / TAP':'FEVER',fb.x+8,fb.y+13,11,'#fff0d4','left',{stroke:null});
 // combo
 const cx=por?W/2:110,cy=por?g.top-34:H*.5;
 if(S.combo>=3){const k=1+S.wob*0.3;c.save();c.translate(cx,cy);c.scale(k,k);T(c,String(S.combo),0,0,por?48:64,S.mult>=3?'#ffe08a':'#fff0d4','center',{glow:S.mult>=3?'#ffd870':null});T(c,'COMBO · ×'+S.mult,0,24,15,'#d8c8e8','center',{stroke:null});c.restore();}
 else T(c,'×'+S.mult,cx,cy,por?26:34,'#d8c8e8','center',{stroke:null});
 // song progress
 if(S.song){const pr=cl(S.t/(S.dur-1.5),0,1);N.bar(c,por?14:W-250,por?26:46,por?W-28:230,8,pr,S.song.col);T(c,S.song.name.toUpperCase(),por?14:W-250,por?18:40,12,S.song.col,'left',{stroke:null});}
 // judgement
 if(S.judge&&S.judge.k>0){c.save();c.globalAlpha=Math.min(1,S.judge.k*3);T(c,S.judge.t,g.cx,g.hit-70-(.5-S.judge.k)*30,por?34:28,S.judge.c,'center',{glow:S.judge.c});c.restore();}
 if(S.feverOn>0){c.save();c.globalAlpha=.12+.06*Math.sin(S.bgT*10);c.fillStyle='#ffd070';c.fillRect(0,0,W,H);c.restore();}
 if(S.wob>0){c.fillStyle='rgba(255,60,60,'+S.wob*.5+')';c.fillRect(0,0,W,H);}
}
function drawSelect(c,api){
 const W=api.W,H=api.H,por=api.portrait;
 c.fillStyle='rgba(16,8,18,.6)';c.fillRect(0,0,W,H);
 T(c,'CHOOSE A TRACK',W/2,por?90:70,por?32:38,PAL.gold,'center',{glow:PAL.gold});
 T(c,api.touch?'TAP A TRACK':'PRESS 1 / 2 / 3 or ←→ + SPACE · or click',W/2,por?118:98,15,'#fff0d4','center',{stroke:null});
 const cw=por?W-40:260,chh=por?170:260,gap=por?16:24,sx=por?20:(W-(cw*3+gap*2))/2,sy=por?150:140;
 S.cards=[];
 SONGS.forEach((s,i)=>{
  const x=por?sx:sx+i*(cw+gap),y=por?sy+i*(chh+gap):sy,lock=!S.unlocked[i],sel=S.sel===i;
  S.cards.push({x,y,w:cw,h:chh});
  c.save();if(sel){N.glow(c,x+cw/2,y+chh/2,cw*.8,s.col,.35);}
  N.slab(c,x,y,cw,chh,22,lock?'#3a2c3c':sel?N.mix(s.col,'#3a2540',.35):'#4a3552',{depth:8});
  if(sel){c.strokeStyle=s.col;c.lineWidth=4;N.rr(c,x,y,cw,chh,22);c.stroke();}
  T(c,String(i+1),x+26,y+46,38,lock?'#6a5a6a':s.col,'left',{stroke:null});
  T(c,s.name,x+cw/2,y+(por?60:96),por?24:21,lock?'#8a7a8a':'#fff0d4','center',{stroke:null});
  T(c,lock?'LOCKED':s.desc,x+cw/2,y+(por?88:124),14,lock?'#ef896d':'#d8c8e8','center',{stroke:null});
  if(lock)T(c,s.lock,x+cw/2,y+(por?112:150),13,'#b8a8b8','center',{stroke:null});
  else{T(c,'BPM '+s.bpm,x+cw/2,y+(por?112:152),14,s.col,'center',{stroke:null});T(c,'BEST '+(api.store.get('hs',[0,0,0])[i]||0)+' · '+(api.store.get('gr',['-','-','-'])[i]),x+cw/2,y+(por?136:182),15,PAL.gold,'center',{stroke:null});
   for(let k=0;k<4;k++){const bx=x+cw/2+(k-1.5)*32,bh=18+((i+1)*7*(k+1))%26;N.slab(c,bx-10,y+chh-26-bh,20,bh,6,LCOL[k],{depth:2,shadow:false});}}
  c.restore();});
}
NEXUS_GAMES.register('rhythm',{
 dbg:()=>S,
 meta:{title:'Beat Foundry',help:'Hammer the notes to the beat. Hold the long ones. Build fever for a score blast.',controls:'D F J K or ARROWS · or tap the lanes (multi-touch) · SPACE = FEVER',type:'RHYTHM · TIMING'},
 size:[900,520],portraitSize:[540,860],timed:false,tier:1.2,
 touch:[{kind:'btn',side:'right',label:'FEVER',key:' ',cls:'alt'}],
 init(api){newState(api);},
 start(api){newState(api);S.phase='select';},
 update(dt,api){
  S.bgT+=dt;for(let i=0;i<4;i++){if(S.flash[i]>0)S.flash[i]-=dt;if(S.press[i]>0)S.press[i]-=dt*6;}if(S.judge&&S.judge.k>0)S.judge.k-=dt;if(S.wob>0)S.wob-=dt;
  if(S.phase==='select'){return;}
  if(S.endT>=0){S.endT-=dt;if(S.endT<0)finishSong(api);if(S.phase==='fail')return;}
  if(S.phase==='play'||S.phase==='end'){
   S.t+=dt;const k=sc(api),w=winFor(api);
   api.time=Math.max(0,Math.ceil(S.dur-3-S.t));
   if(S.feverOn>0){S.feverOn-=dt;S.fever=Math.max(0,S.feverOn/(api.mastery>=6?10:8)*100);S.hp=Math.min(S.maxHp,S.hp+dt*1.2);if(S.feverOn<=0){S.feverOn=0;S.fever=0;}}
   // backing track
   if(S.t>=0){const b=60/S.song.bpm,bn=Math.floor(S.t/(b/2));if(bn!==S.beatN){S.beatN=bn;
     if(bn%2===0){api.sound(bn%8===0?55:62,.12,'sine',.06);if(bn%8===0||bn%8===4)api.sound(160,.05,'triangle',.03);}else{try{N.noise(.03,.015,6000);}catch(e){}}
     if(bn%8===0){const bass=[55,65.4,73.4,49][(Math.floor(bn/8))%4];api.sound(bass*2,.4,'sawtooth',.018);}}}
   // misses / hold completion
   for(let i=S.ni;i<S.notes.length;i++){const n=S.notes[i];if(n.t>S.t+.3)break;
    if(!n.hit&&!n.res&&n.t<S.t-w.o*k){n.res='m';if(n.len)n.broken=1;miss(api,n);if(S.phase==='fail')return;}
    else if(n.holding&&S.t>=n.t+n.len-.02){n.holding=0;n.done=1;gain(api,S.unit*1.2*S.mult);const gg=laneGeom(api);api.burst(lx(gg,n.lane,gg.hit),gg.hit,LCOL[n.lane],10);api.sound(700,.1,'triangle',.05);}}
   while(S.ni<S.notes.length&&S.notes[S.ni].res&&!S.notes[S.ni].holding)S.ni++;
   if(S.phase==='play'&&S.t>=S.dur-1.5){S.phase='end';S.endT=1.2;}
  }
 },
 draw(c,api){
  if(!S)return;
  bg(c,api);
  if(S.phase==='select'&&api.running){drawSelect(c,api);}
  else if(api.running){
   drawHighway(c,api);
   const g=laneGeom(api);
   for(let i=S.notes.length-1;i>=Math.max(0,S.ni-2);i--){const n=S.notes[i];if(!n)continue;if(g.hit-(n.t-S.t)*S.speed<g.top-80)continue;if(g.hit-(n.t+n.len-S.t)*S.speed>api.H+40)break;drawNote(c,api,n,g);}
   drawHUD(c,api);
   if(S.t<0){T(c,String(Math.ceil(-S.t)),g.cx,api.H*.4,90,'#ffe08a','center',{glow:'#ffd870'});T(c,S.song.name,g.cx,api.H*.4+36,20,'#fff0d4','center',{stroke:null});}
   if(S.phase==='end'||S.phase==='fail')T(c,S.phase==='fail'?'STAGE FAILED':'SONG COMPLETE',g.cx,api.H*.4,36,S.phase==='fail'?'#ef896d':'#9de3d1','center',{glow:S.phase==='fail'?'#ef896d':'#9de3d1'});
  }
  N.vignette(c,api.W,api.H,.4);
  if(!api.running){readyScreen(c,api,'BEAT FOUNDRY','Four lanes, one beat. Hit each note as it reaches the pads, hold the long notes, and keep your health up until the song ends.',[
   'Keys D F J K (or arrows) · tap the lane columns on touch (multi-touch).','Perfect / Good / OK windows. Misses and ghost taps drain health.','Combo builds a score multiplier up to x4.','Fill the FEVER gauge and press SPACE (or the FEVER button) for 8s of x1.5 score.','Clear songs to unlock the next track. Grades: S A B C D.'],PAL.coral,
   'BEST '+(api.store.get('top',[])[0]||0)+' · TRACKS CLEARED '+[0,1,2].filter(i=>api.store.get('c'+i,0)).length+'/3');}
 },
 pointerdown(x,y,e,api){
  if(S.phase==='select'){let hit=-1;(S.cards||[]).forEach((cd,i)=>{if(x>=cd.x&&x<=cd.x+cd.w&&y>=cd.y&&y<=cd.y+cd.h)hit=i;});if(hit>=0){if(S.unlocked[hit])startSong(api,hit);else{S.sel=hit;api.sound(120,.1,'square',.04);}}return;}
  const g=laneGeom(api);
  if(api.portrait&&y<g.top-60&&y>40&&y<120){activateFever(api);return;}
  if(S.phase!=='play')return;
  const lane=cl(Math.floor((x-(g.cx-g.lw*2))/g.lw),0,3);S.pids[e.pointerId]=lane;press(api,lane);
 },
 pointerup(x,y,e,api){const l=S.pids[e.pointerId];if(l!==undefined){delete S.pids[e.pointerId];release(api,l);}},
 keydown(e,api){
  const k=e.key,lk=k.toLowerCase();
  if(S.phase==='select'){
   if(['1','2','3'].includes(k)){const i=+k-1;if(S.unlocked[i])startSong(api,i);else api.sound(120,.1,'square',.04);}
   else if(k==='ArrowLeft'||k==='ArrowUp')S.sel=(S.sel+2)%3;else if(k==='ArrowRight'||k==='ArrowDown')S.sel=(S.sel+1)%3;
   else if(k===' '||k==='Enter'){if(S.unlocked[S.sel])startSong(api,S.sel);}
   return;}
  if(e.repeat||(S.kd&&S.kd[k]))return;S.kd=S.kd||{};S.kd[k]=1;
  if(k===' '){activateFever(api);return;}
  const li=LKEY.indexOf(lk);if(li>=0){press(api,li);return;}
  if(ARR[k]!==undefined)press(api,ARR[k]);
 },
 keyup(e,api){const k=e.key,lk=k.toLowerCase();if(S.kd)S.kd[k]=0;const li=LKEY.indexOf(lk);if(li>=0)release(api,li);else if(ARR[k]!==undefined)release(api,ARR[k]);},
 stop(api){}
});
})();

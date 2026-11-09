/* games/memory.js — Neon Nexus cabinet module */
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
/* ===== PRISM SEQUENCE ===== */
const COLS=['#ef896d','#91c9a7','#f2ce77','#7fb8e8','#e08ac0','#f0a860','#5fd0c0','#b8a0f0','#a8d860'];
const KEYS=['1','2','3','4','5','6','7','8','9'];
const SCALES=[[0,2,4,7,9,12,14,16,19],[0,2,3,5,7,8,10,12,14],[0,3,5,6,7,10,12,15,17]];
const SCALE_NAMES=['PENTATONIC','MINOR','BLUES'];
const MODES={classic:{n:'CLASSIC',d:'Repeat the sequence',c:'#91c9a7'},reverse:{n:'REVERSE',d:'Repeat it BACKWARDS',c:'#7fb8e8'},echo:{n:'SPEED ECHO',d:'Fast flashes! Stay sharp',c:'#ef896d'},double:{n:'DOUBLE TILE',d:'Two tiles flash together - tap both',c:'#e08ac0'},bonus:{n:'GOLD PRISM',d:'Bonus: gold tile scores x3, no life loss',c:'#f2ce77'}};
const GLYPH=['circle','tri','sq','dia','star','cross','heart','ring','hex'];
let S=null;
function tilesFor(r){return r<=4?4:r<=8?6:9;}
function layout(api){
 const W=api.W,H=api.H,n=S.n,por=api.portrait,cols=n===4?2:n===6?(por?2:3):3,rows=Math.ceil(n/cols);
 const top=por?200:130,bot=por?50:30,ar=W-40,ah=H-top-bot,cw=ar/cols,ch=ah/rows,sz=Math.min(cw,ch)*.86;
 S.tl=[];for(let i=0;i<n;i++){const c=i%cols,r=Math.floor(i/cols);S.tl.push({x:20+cw*(c+.5),y:top+ch*(r+.5),sz,lit:0,press:0,wrong:0,col:COLS[i],g:GLYPH[i]});}
}
function newState(api){
 const m=api.mastery;
 S={round:0,n:4,tl:[],seq:[],mode:'classic',phase:'idle',pt:0,showI:0,showOn:false,inI:0,lives:3+(m>=2?1:0),maxLives:3+(m>=2?1:0),perfect:0,pstreak:0,mist:0,done:false,
  hints:m>=4?3:0,replays:m>=6?1:0,pend:[],pendT:0,bgT:0,scale:Math.min(2,api.store.get('scale',0)),roundMist:0,inTime:0,inMax:0,reverseWins:0,bannerT:0,best:0,gold:-1,endT:-1,winFlag:false,tempo:1,stepScore:0,hintTile:-1,hintT:0,pop:[]};
 S.n=4;layout(api);
}
function tone(api,i,dur,vol){const sc=SCALES[S.scale],f=261.6*Math.pow(2,sc[i%sc.length]/12);api.sound(f,dur||.28,'triangle',vol||.06);api.sound(f*2,(dur||.28)*.6,'sine',(vol||.06)*.4);}
function startRound(api){
 S.round++;const r=S.round;
 const n=tilesFor(r);if(n!==S.n){S.n=n;layout(api);api.popText('PRISM GROWS!',api.W/2,api.H*.5,'#ffe08a');}
 // mode
 let mode='classic';
 if(r%4===0)mode='bonus';else if(r===3||r===7||r===10)mode='reverse';else if(r===5||r===9||r===12)mode='echo';else if(r>=6&&r%4===2)mode='double';
 if(r===2||r===1)mode='classic';
 S.mode=mode;S.roundMist=0;
 S.gold=-1;
 let len=Math.min(14,2+r+(api.diff.mul>1?1:0)-(api.diff.mul<1?1:0));
 if(mode==='double')len=Math.max(3,Math.round(len*.6));
 if(mode==='bonus')len=Math.min(len,7);
 // build sequence (avoid >2 identical in a row)
 S.seq=[];for(let i=0;i<len;i++){let t,tries=0;do{t=RI(0,S.n-1);tries++;}while(i>0&&tries<5&&((mode==='double')?false:t===S.seq[i-1]));
  if(mode==='double'){let u;do{u=RI(0,S.n-1);}while(u===t);S.seq.push([t,u]);}else S.seq.push([t]);}
 if(mode==='bonus')S.gold=RI(0,S.n-1);
 S.tempo=Math.pow(api.diff.mul,.5);
 beginShow(api,.9,true);
 S.bannerT=1.7;
}
function showTimes(api){
 const r=S.round,m=api.mastery;let on=Math.max(.2,.58-r*.028),gap=Math.max(.1,.26-r*.012);
 if(S.mode==='echo'){on=Math.max(.14,.26-r*.007);gap=Math.max(.06,.1-r*.003);}
 on/=S.tempo;gap/=S.tempo;if(m>=2){on*=1.1;gap*=1.1;}return[on,gap];
}
function beginShow(api,delay,first){S.phase='show';S.showI=-1;S.pt=delay||.5;S.showOn=false;S.inI=0;S.pend=[];S.hintTile=-1;}
function beginInput(api){S.phase='input';S.inI=0;S.pend=[];S.pt=0;S.inMax=Math.max(3,2.2+S.seq.length*.9)/Math.sqrt(api.diff.mul>1?1.15:1);S.inTime=S.inMax;sfx(api,'tick');}
function expected(){const i=S.mode==='reverse'?S.seq.length-1-S.inI:S.inI;return S.seq[i];}
function tapTile(api,i){
 if(S.phase!=='input'||S.done)return;
 const t=S.tl[i];if(!t)return;t.press=.25;
 const ex=expected();
 if(ex.length===2){ // double
  if(ex.includes(i)&&!S.pend.includes(i)){S.pend.push(i);tone(api,i,.18);t.lit=.3;if(S.pend.length===2){S.pend=[];stepOk(api,ex);}else S.pendT=1.0;return;}
  fail(api,i);return;
 }
 if(i===ex[0]){tone(api,i,.22);t.lit=.3;stepOk(api,ex);}else fail(api,i);
}
function stepOk(api,ex){
 S.inI++;S.inTime=S.inMax;
 const mu=1+Math.min(2,S.pstreak*.5);let pts=2*mu*(S.mode==='bonus'&&ex.includes(S.gold)?3:1)*(ex.length===2?1.5:1);
 const t=S.tl[ex[0]];api.addScore(Math.round(pts),t.x,t.y-t.sz*.5,S.mode==='bonus'&&ex.includes(S.gold)?'#ffe08a':'#fff0d4');
 api.burst(t.x,t.y,t.col,6);api.combo=(api.combo||0)+1;S.best=Math.max(S.best,api.combo);
 if(S.inI>=S.seq.length)roundDone(api);
}
function roundDone(api){
 S.phase='cheer';S.pt=1.2;const perfectRound=S.roundMist===0;
 if(perfectRound){S.pstreak++;S.perfect++;}else S.pstreak=0;
 const bonus=Math.round((6+S.seq.length*1.5)*(perfectRound?1.6:1)*(1+Math.min(1,S.pstreak*.2)));
 api.addScore(bonus,api.W/2,api.H*.3,perfectRound?'#9de3d1':'#fff0d4');
 if(perfectRound)api.popText('PERFECT ROUND ×'+S.pstreak,api.W/2,api.H*.38,'#9de3d1');else api.popText('ROUND CLEAR',api.W/2,api.H*.38,'#fff0d4');
 api.time=Math.min(api.time+5,150);sfx(api,perfectRound?'win':'coin');S.tl.forEach((t,i)=>{t.lit=.5;});api.shake(5,.2);
  if(S.mode==='reverse')api.achieve('reverse','Mirror Mind',5);
 if(S.pstreak>=3)api.achieve('perfect3','Flawless Trio',6);
 if(S.round>api.store.get('stage',0)){api.store.set('stage',S.round);}
 if(S.round===5&&S.scale<1){api.store.set('scale',1);api.toast('NEW TONE SET UNLOCKED: MINOR');}
 if(S.round===8&&S.scale<2){api.store.set('scale',2);api.toast('NEW TONE SET UNLOCKED: BLUES');}
 if(S.round>=10){S.endT=1.4;S.winFlag=true;S.phase='cheer';S.pt=9;}
}
function fail(api,i){
 S.roundMist++;S.mist++;S.pstreak=0;api.combo=0;
 const t=S.tl[i];if(t){t.wrong=.5;}sfx(api,'lose');api.shake(9,.3);
 if(S.mode==='bonus'){api.popText('MISS - NO LIFE LOST',api.W/2,api.H*.4,'#f2ce77');}
 else{S.lives--;api.popText('WRONG TILE',api.W/2,api.H*.4,'#ff8a6a');}
 if(S.lives<=0){S.phase='fail';S.endT=1.2;S.winFlag=false;return;}
 S.phase='retry';S.pt=1.0;
}
function end(api,win){if(S.done)return;S.done=true;topScores(api,api.score);
 if(win&&S.lives===S.maxLives)api.achieve('flawless','Prism Perfectionist',10);if(win)api.achieve('master','Prism Master',8);
 api.finish(win,{grade:gradeOf(cl(api.score/340,0,1),win)+' · ROUND '+S.round,combo:S.best});}
/* ---------- drawing ---------- */
function bg(c,api){
 const o=bgCache('mem'+api.W+'x'+api.H,api.W,api.H,(g,W,H)=>{N.bgGrad(g,W,H,['#140c28','#2a1a4a','#4a2a5e']);twinkle(g,W,H*1.5,90,11);
  for(let i=0;i<6;i++){const x=(i*173+60)%W,y=H*.2+(i*97)%H*.6,r=60+(i%3)*30;const gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,'rgba('+[ '239,137,109','145,201,167','127,184,232','224,138,192','242,206,119','184,160,240'][i]+',.18)');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(x-r,y-r,r*2,r*2);}
  g.fillStyle='rgba(255,240,208,.05)';for(let i=0;i<8;i++){g.beginPath();g.moveTo(W*i/8,H);g.lineTo(W*i/8+60,0);g.lineTo(W*i/8+120,0);g.lineTo(W*i/8+90,H);g.fill();}});
 c.drawImage(o,0,0);
}
function glyph(c,g,s,col){c.fillStyle=col;c.beginPath();
 switch(g){case'circle':c.arc(0,0,s,0,TAU);break;case'tri':c.moveTo(0,-s);c.lineTo(s*.95,s*.75);c.lineTo(-s*.95,s*.75);c.closePath();break;case'sq':c.rect(-s*.8,-s*.8,s*1.6,s*1.6);break;case'dia':c.moveTo(0,-s*1.1);c.lineTo(s*.8,0);c.lineTo(0,s*1.1);c.lineTo(-s*.8,0);c.closePath();break;
 case'star':for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,r=i%2?s*.45:s*1.05;c.lineTo(Math.cos(a)*r,Math.sin(a)*r);}c.closePath();break;
 case'cross':c.rect(-s*.28,-s,s*.56,s*2);c.rect(-s,-s*.28,s*2,s*.56);break;case'heart':c.moveTo(0,s*.8);c.bezierCurveTo(-s*1.3,-s*.1,-s*.6,-s*1.1,0,-s*.35);c.bezierCurveTo(s*.6,-s*1.1,s*1.3,-s*.1,0,s*.8);break;
 case'ring':c.arc(0,0,s,0,TAU);c.arc(0,0,s*.5,0,TAU,true);break;default:for(let i=0;i<6;i++){const a=i*TAU/6;c.lineTo(Math.cos(a)*s,Math.sin(a)*s);}c.closePath();}
 c.fill('evenodd');}
function drawTile(c,t,i,api,tm){
 const lit=Math.max(t.lit,t.press*1.2),sz=t.sz,r=sz/2,sc=1+lit*.12-(t.press>0?.04:0);
 c.save();c.translate(t.x,t.y);c.scale(sc,sc);
 if(t.wrong>0){c.translate(Math.sin(tm*60)*5*t.wrong,0);}
 c.fillStyle='rgba(10,4,20,.45)';c.beginPath();c.ellipse(4,r*.85,r*.9,r*.28,0,0,TAU);c.fill();
 if(lit>0)N.glow(c,0,0,r*2.2,t.col,lit*.9);
 const base=lit>.15?t.col:N.mix(t.col,'#241838',.62);
 // hex prism body
 const hp=()=>{c.beginPath();for(let k=0;k<6;k++){const a=-Math.PI/2+k*TAU/6,rr=r*(k%2?.95:1);c.lineTo(Math.cos(a)*rr,Math.sin(a)*rr);}c.closePath();};
 const g=c.createLinearGradient(-r,-r,r,r);g.addColorStop(0,N.shade(base,.4+lit*.3));g.addColorStop(.5,base);g.addColorStop(1,N.shade(base,-.45));
 c.lineJoin='round';hp();c.fillStyle=g;c.fill();c.lineWidth=4;c.strokeStyle='rgba(20,10,30,.55)';c.stroke();
 // facets
 c.save();hp();c.clip();c.fillStyle='rgba(255,255,255,'+(.14+lit*.25)+')';c.beginPath();c.moveTo(0,-r);c.lineTo(r*.87,-r*.5);c.lineTo(0,0);c.closePath();c.fill();c.fillStyle='rgba(0,0,0,.22)';c.beginPath();c.moveTo(0,0);c.lineTo(r*.87,r*.5);c.lineTo(0,r);c.lineTo(-r*.87,r*.5);c.closePath();c.fill();
 c.strokeStyle='rgba(255,255,255,.25)';c.lineWidth=2;c.beginPath();for(let k=0;k<3;k++){const a=-Math.PI/2+k*TAU/3;c.moveTo(0,0);c.lineTo(Math.cos(a)*r,Math.sin(a)*r);}c.stroke();c.restore();
 // glyph
 c.save();c.translate(0,-r*.02);c.globalAlpha=.55+lit*.45;glyph(c,t.g,r*.38,lit>.15?'#fffbe8':N.shade(t.col,.25));c.restore();
 if(S.mode==='bonus'&&S.gold===i&&S.phase!=='idle'){c.strokeStyle='#ffe08a';c.lineWidth=4;hp();c.stroke();N.glow(c,0,0,r*1.4,'#ffd870',.4);}
 if(S.hintTile===i||S.pend.includes(i)){c.strokeStyle='#fff';c.lineWidth=4;c.setLineDash([8,6]);hp();c.stroke();}
 // gloss
 c.fillStyle='rgba(255,255,255,.5)';c.beginPath();c.ellipse(-r*.4,-r*.55,r*.22,r*.1,-.7,0,TAU);c.fill();
 if(!api.touch){T(c,KEYS[i],r*.62,r*.75,Math.max(13,r*.2),'rgba(255,240,208,.75)','center',{stroke:null});}
 c.restore();
}
function drawHUD(c,api){
 const W=api.W,por=api.portrait,m=MODES[S.mode];
 for(let i=0;i<S.maxLives;i++)heart(c,24+i*34,28,15,'#ef6a6a',i<S.lives);
 N.chip(c,W-248,por?56:8,112,'ROUND',S.round+' / 10');N.chip(c,W-130,por?56:8,118,'PERFECT RUN',S.pstreak?'×'+S.pstreak:'—',{color:S.pstreak?'#9de3d1':'#fff0d4'});
 const y=por?118:62;
 T(c,m.n,W/2,y,por?26:30,m.c,'center',{glow:m.c});
 T(c,S.phase==='show'?'WATCH...':S.phase==='input'?(S.mode==='reverse'?'YOUR TURN - BACKWARDS':'YOUR TURN'):m.d,W/2,y+24,15,'#fff0d4','center',{stroke:null});
 // step dots
 const n=S.seq.length,dw=Math.min(20,(W-200)/Math.max(1,n)),x0=W/2-dw*n/2+dw/2,dy=y+46;
 for(let i=0;i<n;i++){let st=0;if(S.phase==='show'&&i===S.showI&&S.showOn)st=2;else{const done=S.phase==='input'||S.phase==='cheer'?(i<S.inI):false;st=done?1:0;}const rev=S.mode==='reverse';
  c.fillStyle=st===2?'#fff0d4':st===1?'#91c9a7':'rgba(255,240,208,.28)';c.beginPath();c.arc(x0+i*dw,dy,st===2?6:4.5,0,TAU);c.fill();}
 if(S.phase==='input'){N.bar(c,W/2-90,dy+12,180,6,S.inTime/S.inMax,S.inTime<S.inMax*.3?'#ef896d':'#91c9a7');}
 if(S.hints>0||S.replays>0){T(c,(S.hints?'H: hint ×'+S.hints:'')+(S.hints&&S.replays?'   ':'')+(S.replays?'R: replay ×'+S.replays:''),W/2,api.H-10,12,'#d8c8e8','center',{stroke:null});}
 if(S.bannerT>0){c.save();c.globalAlpha=Math.min(1,S.bannerT*2);c.fillStyle='rgba(18,12,30,.6)';c.fillRect(0,api.H*.4,W,api.H*.17);T(c,'ROUND '+S.round+' · '+m.n,W/2,api.H*.49,Math.min(W,560)/13,m.c,'center',{glow:m.c});T(c,m.d,W/2,api.H*.54,16,'#fff0d4','center',{stroke:null});c.restore();}
}
NEXUS_GAMES.register('memory',{
 dbg:()=>S,
 meta:{title:'Prism Sequence',help:'Watch the prisms flash, then repeat the pattern. Modes change as rounds climb.',controls:'CLICK / TAP prisms · or keys 1-9 (H hint, R replay with perks)',type:'MEMORY · RHYTHM'},
 size:[900,520],portraitSize:[540,860],duration:100,tier:1.15,
 touch:[{kind:'btn',side:'right',label:'HINT',key:'h'},{kind:'btn',side:'right',label:'REPLAY',key:'r',cls:'alt'}],
 init(api){newState(api);},
 start(api){newState(api);api.combo=0;S.phase='wait';S.pt=.8;},
 update(dt,api){
  S.bgT+=dt;if(S.bannerT>0)S.bannerT-=dt;
  for(const t of S.tl){if(t.lit>0)t.lit-=dt*(S.phase==='show'?0:1.6);if(t.press>0)t.press-=dt;if(t.wrong>0)t.wrong-=dt*1.5;}
  if(S.hintT>0){S.hintT-=dt;if(S.hintT<=0)S.hintTile=-1;}
  if(S.endT>=0){S.endT-=dt;if(S.endT<0)end(api,S.winFlag);return;}
  if(S.done)return;
  const ph=S.phase;
  if(ph==='wait'){S.pt-=dt;if(S.pt<=0)startRound(api);}
  else if(ph==='show'){
   S.pt-=dt;if(S.pt<=0){const[on,gap]=showTimes(api);
    if(!S.showOn){S.showI++;if(S.showI>=S.seq.length){beginInput(api);return;}S.showOn=true;S.pt=on;const st=S.seq[S.showI];st.forEach(i=>{S.tl[i].lit=1;tone(api,i,on*1.6);});}
    else{S.showOn=false;S.pt=gap;S.tl.forEach(t=>{t.lit=0;});}}
   if(S.showOn){const st=S.seq[S.showI];S.tl.forEach((t,i)=>{if(st.includes(i))t.lit=1;});}
  }
  else if(ph==='input'){
   S.inTime-=dt;if(S.pend.length){S.pendT-=dt;if(S.pendT<=0){S.pend=[];fail(api,-1);return;}}
   if(S.inTime<=0){api.popText('TOO SLOW',api.W/2,api.H*.45,'#ffb0a0');fail(api,-1);}
  }
  else if(ph==='cheer'){S.pt-=dt;if(S.pt<=0)startRound(api);}
  else if(ph==='retry'){S.pt-=dt;if(S.pt<=0){beginShow(api,.5);}}
 },
 draw(c,api){
  bg(c,api);if(!S)return;
  const tm=S.bgT;
  for(let i=0;i<S.tl.length;i++)drawTile(c,S.tl[i],i,api,tm);
  if(api.running)drawHUD(c,api);
  N.vignette(c,api.W,api.H,.35);
  if(!api.running){readyScreen(c,api,'PRISM SEQUENCE','Watch the prisms light up and repeat the pattern. Survive 10 rounds without losing all your lives.',[
   'Classic: repeat in order. Reverse: repeat BACKWARDS.','Speed Echo: lightning-fast flashes. Double Tile: two prisms at once - tap both.','Gold Prism bonus rounds score x3 and cannot cost a life.','Perfect rounds build a score multiplier. Each round clears +5s.','Tap prisms, or press keys 1-9.'],PAL.mint,
   'BEST '+(api.store.get('top',[])[0]||0)+' · FURTHEST ROUND '+api.store.get('stage',0)+' · TONE SET '+SCALE_NAMES[Math.min(2,api.store.get('scale',0))]);}
 },
 pointerdown(x,y,e,api){let best=-1,bd=1e9;S.tl.forEach((t,i)=>{const d=Math.hypot(x-t.x,y-t.y);if(d<t.sz*.56&&d<bd){bd=d;best=i;}});if(best>=0)tapTile(api,best);},
 keydown(e,api){const k=KEYS.indexOf(e.key);if(k>=0&&k<S.n){tapTile(api,k);return;}
  if((e.key==='h'||e.key==='H')&&S.phase==='input'&&S.hints>0){S.hints--;const ex=expected();S.hintTile=ex[0];S.hintT=1.2;sfx(api,'ping');}
  if((e.key==='r'||e.key==='R')&&S.phase==='input'&&S.replays>0){S.replays--;beginShow(api,.3);}
 },
 timeUp(api){end(api,false);}
});
})();

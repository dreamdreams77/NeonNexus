/* games/gemdig.js — Neon Nexus cabinet module */
(function(){'use strict';
const N=window.NXG,TAU=Math.PI*2,cl=N.clamp,lerp=N.lerp,R=N.rand,E=N.ease;
const DBG=/debug/.test(location.search);
const RI=(a,b)=>Math.floor(a+Math.random()*(b-a+1));
const PAL={cream:'#f8e9ca',coral:'#ef896d',mint:'#91c9a7',plum:'#684b62',gold:'#f2ce77',ink:'#1a1226'};
function T(c,t,x,y,s,col,al,o){if(c.canvas&&c.canvas.height>c.canvas.width)s=Math.max(s,s>=24?s:15);N.text(c,t,x,y,Object.assign({font:'700 '+s+'px Fredoka, system-ui, sans-serif',color:col||'#fff0d4',align:al||'left',stroke:PAL.ink,sw:Math.max(2,s/6)},o||null));}
function wrap(c,txt,mw,font){c.font=font;const w=txt.split(' '),out=[];let l='';for(const x of w){const t=l?l+' '+x:x;if(c.measureText(t).width>mw&&l){out.push(l);l=x;}else l=t;}if(l)out.push(l);return out;}
/* READY panel: objective + how-to + best */
function readyScreen(c,api,title,obj,how,col,extra){
 const W=api.W,H=api.H,fs=api.portrait?15:16,pw=Math.min(W-30,620);
 c.save();c.fillStyle='rgba(16,10,28,.74)';c.fillRect(0,0,W,H);
 const f='600 '+fs+'px Fredoka, system-ui, sans-serif';let lines=[];
 const ol=wrap(c,obj,pw-48,f);how.forEach(h=>lines.push(...wrap(c,'• '+h,pw-48,f)));
 const ph=Math.min(H-24,92+ol.length*(fs+5)+lines.length*(fs+5)+(extra?30:0)+56),px=(W-pw)/2,py=(H-ph)/2;
 N.slab(c,px,py,pw,ph,24,'#4a3552');N.coil(c,px+3,py+3,pw-6,ph-6,22);
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
/* ===== MOON GEM DIG ===== */
const GCOL=['#7fe0d0','#f08ac0','#ffd86a','#8ab8ff'];
const TOOLS=[{id:'dig',n:'DIG',k:'1',c:'#c8a070',cost:1},{id:'probe',n:'PROBE',k:'2',c:'#7fb8e8',cost:1},{id:'bomb',n:'BOMB',k:'3',c:'#ef896d',cost:3},{id:'scan',n:'SCAN',k:'4',c:'#e08ac0',cost:2},{id:'flag',n:'FLAG',k:'5',c:'#f2ce77',cost:0}];
const LEVELS=5;
let S=null;
function dims(api){const W=api.W,H=api.H,por=api.portrait,n=S.n;const top=por?150:60,bot=por?130:92;const aw=W-20,ah=H-top-bot;const cs=Math.floor(Math.min(aw/n,ah/n));return{cs,x0:(W-cs*n)/2,y0:top+(ah-cs*n)/2,top,bot};}
function newState(api){
 const m=api.mastery;
 S={lv:0,n:6,cells:[],hearts:3+(m>=2?1:0),maxHearts:3+(m>=2?1:0),energy:0,maxE:0,tools:{probe:0,bomb:0,scan:0},tool:0,quota:0,got:0,total:0,first:true,over:false,done:false,endT:-1,win:false,cur:0,hover:-1,bannerT:0,banner:'',sub:'',msg:'',msgT:0,scanFx:null,t:0,best:0,streak:0,dmgLevel:0,levelsClear:0,chests:0,probesUsed:0,flash:0,descend:false,shake:0,store:null,bgT:0,pend:null,fx:[]};
 newLevel(api,0);
}
function newLevel(api,lv){
 const m=api.mastery;S.lv=lv;S.n=6+Math.floor(lv/2);const n=S.n;S.first=true;S.got=0;S.dmgLevel=0;S.descend=false;
 S.cells=Array.from({length:n*n},(_,i)=>({i,gem:0,haz:0,chest:0,rev:0,flag:0,gn:0,hn:0,defused:0,t:0,fx:0,seed:Math.random()}));
 const mul=api.diff.mul;
 S.gems=lv+5;S.nh=Math.round((n*n*.11+lv*1.2)*(mul>1?1.25:mul<1?.8:1));S.nc=lv>=1?(lv>=3?2:1):0;
 S.quota=Math.ceil(S.gems*(mul<1?.55:mul>1?.75:.65));S.total=S.gems;
 S.maxE=Math.round((16+lv*3+(m>=6?4:0))*(mul<1?1.25:mul>1?.85:1));S.energy=Math.min(S.maxE+6,S.energy>0&&lv>0?S.energy+8:S.maxE);S.maxE=Math.max(S.maxE,S.energy);
 S.tools.probe=3+(m>=4?1:0);S.tools.bomb=1+(m>=6?1:0);S.tools.scan=2+(m>=4?1:0)+(api.store.get('clears',0)>=1?1:0);
 S.banner='LEVEL '+(lv+1)+' / '+LEVELS;S.sub='Collect '+S.quota+' of '+S.gems+' gems · '+S.nh+' cave-ins hidden';S.bannerT=1.8;sfx(api,'ping');
 if(lv>api.store.get('stage',0))api.store.set('stage',lv);
}
function populate(api,fi){
 const n=S.n,safe=new Set([fi]);const fr=Math.floor(fi/n),fc=fi%n;for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++){const r=fr+dr,c=fc+dc;if(r>=0&&r<n&&c>=0&&c<n)safe.add(r*n+c);}
 const free=S.cells.filter(c=>!safe.has(c.i));const take=(k,f)=>{for(let i=0;i<k&&free.length;i++){const j=RI(0,free.length-1);f(free.splice(j,1)[0]);}};
 take(S.nh,c=>c.haz=1);take(S.gems,c=>c.gem=1+RI(0,3));take(S.nc,c=>c.chest=Math.random()<.28?2:1); // 2 = mimic
 for(const c of S.cells){let g=0,h=0;nbrs(c.i,(o)=>{if(o.gem||o.chest)g++;if(o.haz)h++;});c.gn=g;c.hn=h;}
}
function nbrs(i,f,rad=1){const n=S.n,r=Math.floor(i/n),c=i%n;for(let dr=-rad;dr<=rad;dr++)for(let dc=-rad;dc<=rad;dc++){if(!dr&&!dc)continue;const rr=r+dr,cc=c+dc;if(rr>=0&&rr<n&&cc>=0&&cc<n)f(S.cells[rr*n+cc],rr*n+cc);}}
function spend(api,k){if(S.energy<k){say('NOT ENOUGH ENERGY',api);sfx(api,'miss');return false;}S.energy-=k;return true;}
function say(t,api){S.msg=t;S.msgT=1.6;}
function dig(api,c,viaBomb){
 if(c.rev===1)return;const d=dims(api),x=d.x0+(c.i%S.n+.5)*d.cs,y=d.y0+(Math.floor(c.i/S.n)+.5)*d.cs;
 c.rev=1;c.fx=.35;S.shake=0;
 if(c.haz){
  if(viaBomb){c.defused=1;api.popText('DEFUSED',x,y,'#9de3d1');api.burst(x,y,'#9de3d1',8);return;}
  S.hearts--;S.dmgLevel++;S.streak=0;api.combo=0;S.flash=.5;api.shake(12,.4);sfx(api,'boom');api.burst(x,y,'#8a7a8a',22);api.popText('CAVE-IN!  -1 HEART',x,y-20,'#ff8a6a');
  if(S.hearts<=0)lose(api,'The cave collapsed.');return;}
 if(c.chest){
  S.chests++;api.store.set('chests',(api.store.get('chests',0)||0)+1);
  if(c.chest===2&&!viaBomb){S.hearts--;S.dmgLevel++;S.flash=.5;api.shake(12,.4);sfx(api,'lose');api.popText('MIMIC! -1 HEART',x,y-20,'#ff8a6a');api.burst(x,y,'#d8a050',16);if(S.hearts<=0)lose(api,'A mimic got you.');return;}
  const r=Math.random();api.burst(x,y,'#ffd86a',26);sfx(api,'coin');
  if(r<.5){api.addScore(14,x,y-20,'#ffe08a');}else if(r<.8){S.energy=Math.min(S.maxE+6,S.energy+5);api.popText('+5 ENERGY',x,y-20,'#ffd86a');api.addScore(5);}else{S.tools[['probe','bomb','scan'][RI(0,2)]]++;api.popText('+1 TOOL',x,y-20,'#9ad0f8');api.addScore(5);}
  if((api.store.get('chests',0)||0)>=3)api.achieve('chests','Treasure Hunter',5);return;}
 if(c.gem){S.got++;S.streak++;S.best=Math.max(S.best,S.streak);api.combo=S.streak;const val=Math.round(7*(viaBomb?.6:1)*(1+Math.min(.5,S.streak*.08)));api.addScore(val,x,y-20,GCOL[c.gem-1]);api.burst(x,y,GCOL[c.gem-1],18);sfx(api,'coin');api.sound(700+S.got*60,.1,'triangle',.05);
  if(S.got>=S.quota&&!S.descend){S.descend=true;say('QUOTA MET! DESCEND or keep digging',api);sfx(api,'win');}
  if(S.got>=S.gems){api.achieve('all','Gem Collector',5);descend(api);}return;}
 // empty tile: flood zero
 api.sound(240,.05,'sine',.04);api.burst(x,y,'#b09878',4);
 if(c.gn===0&&c.hn===0)nbrs(c.i,(o)=>{if(o.rev===0&&!o.haz&&!o.gem&&!o.chest)dig(api,o,true&&false||viaBomb);});
}
function useTool(api,i){
 if(S.over||S.done||S.pend)return;const c=S.cells[i];if(!c)return;const t=TOOLS[S.tool],d=dims(api),x=d.x0+(i%S.n+.5)*d.cs,y=d.y0+(Math.floor(i/S.n)+.5)*d.cs;
 if(t.id==='flag'){if(c.rev===0){c.flag=1-c.flag;sfx(api,'click');}return;}
 if(c.flag&&t.id==='dig'){say('Flagged - unflag first (FLAG tool)',api);return;}
 if(t.id==='dig'){if(c.rev===1)return;if(!spend(api,1))return;if(S.first){S.first=false;populate(api,i);}dig(api,c,false);}
 else if(t.id==='probe'){if(S.first){say('Dig once first!',api);return;}if(c.rev!==0){return;}if(S.tools.probe<=0){say('NO PROBES LEFT',api);sfx(api,'miss');return;}if(!spend(api,1))return;S.tools.probe--;S.probesUsed++;c.rev=2;c.fx=.3;
  const what=c.haz?'CAVE-IN':c.chest?'CHEST':c.gem?'GEM':'EMPTY';api.popText(what+'!',x,y-18,c.haz?'#ff8a6a':c.gem||c.chest?'#9de3d1':'#fff0d4');sfx(api,'ping');if(c.haz)c.flag=1;}
 else if(t.id==='bomb'){if(S.first){say('Dig once first!',api);return;}if(S.tools.bomb<=0){say('NO BOMBS LEFT',api);sfx(api,'miss');return;}if(!spend(api,3))return;S.tools.bomb--;api.shake(10,.3);sfx(api,'boom');api.burst(x,y,'#ffb060',30);S.fx.push({x,y,r:d.cs*2,t:.35,max:.35});
  const targets=[c];nbrs(i,o=>targets.push(o));for(const o of targets){if(o.rev!==1)dig(api,o,true);if(S.over)return;}}
 else if(t.id==='scan'){if(S.first){say('Dig once first!',api);return;}if(S.tools.scan<=0){say('NO SCANS LEFT',api);sfx(api,'miss');return;}if(!spend(api,2))return;S.tools.scan--;let g=0,h=0;const rad=api.mastery>=4?3:2;const r0=Math.floor(i/S.n),c0=i%S.n;
  for(let dr=-rad;dr<=rad;dr++)for(let dc=-rad;dc<=rad;dc++){const rr=r0+dr,cc=c0+dc;if(rr>=0&&rr<S.n&&cc>=0&&cc<S.n){const o=S.cells[rr*S.n+cc];if(o.rev!==1){if(o.gem||o.chest)g++;if(o.haz)h++;}}}
  S.scanFx={i,g,h,t:2.6,rad};sfx(api,'power');api.popText(g+' treasure · '+h+' cave-in',x,y-28,'#e08ac0');}
 if(S.energy<=0&&!S.over&&!S.done&&S.got<S.quota&&!S.descend)lose(api,'Your lantern ran out of energy.');
}
function descend(api){
 if(S.over||S.pend)return;S.levelsClear++;api.store.set('clears',(api.store.get('clears',0)||0)+(S.lv===LEVELS-1?1:0));
 const bonus=Math.min(15,S.energy)+(S.dmgLevel===0?8:0);api.addScore(12+bonus,api.W/2,api.H*.3,'#9de3d1');sfx(api,'win');if(S.dmgLevel===0)api.achieve('clean','Steady Digger',5);
 if(S.lv>=LEVELS-1){S.win=true;S.over=true;S.endT=1.3;api.addScore(30);api.achieve('champ','Moon Gem Master',10);return;}
 S.pend=1.1;S.banner='LEVEL CLEAR';S.sub='+'+bonus+' bonus';S.bannerT=1;
}
function lose(api,why){S.over=true;S.win=false;S.endT=1.5;S.msg=why;S.msgT=3;sfx(api,'lose');
 // reveal board
 for(const c of S.cells)if(c.rev===0)c.rev=3;}
function end(api){if(S.done)return;S.done=true;topScores(api,api.score);api.finish(S.win,{grade:gradeOf(cl(api.score/380,0,1),S.win)+' · LEVEL '+(Math.min(S.lv,LEVELS-1)+1),combo:S.best});}
/* ---------- drawing ---------- */
const SPR={};
function rockSprite(cs,v){const k=cs+'r'+v;if(SPR[k])return SPR[k];const c=document.createElement('canvas');c.width=c.height=cs;const g=c.getContext('2d');const base=['#7a6a88','#6e5e7e','#84728e'][v];
 const gr=g.createLinearGradient(0,0,0,cs);gr.addColorStop(0,N.shade(base,.25));gr.addColorStop(.5,base);gr.addColorStop(1,N.shade(base,-.35));g.fillStyle=gr;N.rr(g,2,2,cs-4,cs-4,cs*.2);g.fill();g.strokeStyle='rgba(20,10,28,.7)';g.lineWidth=2.5;g.stroke();
 g.fillStyle='rgba(255,255,255,.28)';N.rr(g,cs*.14,cs*.1,cs*.72,cs*.1,4);g.fill();const rn=N.mulberry(v*13+cs);g.strokeStyle='rgba(20,10,28,.35)';g.lineWidth=2;g.beginPath();g.moveTo(cs*(.2+rn()*.2),cs*.35);g.lineTo(cs*.5,cs*.5);g.lineTo(cs*(.6+rn()*.2),cs*.4);g.moveTo(cs*.5,cs*.5);g.lineTo(cs*(.4+rn()*.2),cs*.78);g.stroke();
 g.fillStyle='rgba(20,10,28,.25)';g.beginPath();g.arc(cs*.25,cs*.7,cs*.06,0,TAU);g.arc(cs*.75,cs*.62,cs*.05,0,TAU);g.fill();SPR[k]=c;return c;}
function floorSprite(cs){const k=cs+'f';if(SPR[k])return SPR[k];const c=document.createElement('canvas');c.width=c.height=cs;const g=c.getContext('2d');const gr=g.createLinearGradient(0,0,0,cs);gr.addColorStop(0,'#3a2c42');gr.addColorStop(1,'#4a3a50');g.fillStyle=gr;N.rr(g,2,2,cs-4,cs-4,cs*.18);g.fill();g.strokeStyle='rgba(10,4,18,.5)';g.lineWidth=2;g.stroke();g.fillStyle='rgba(0,0,0,.25)';N.rr(g,3,3,cs-6,cs*.16,5);g.fill();SPR[k]=c;return c;}
function drawGem(c,x,y,r,col,t){c.save();c.translate(x,y);N.glow(c,0,0,r*2.2,col,.45+.2*Math.sin(t*4));c.fillStyle=col;c.beginPath();c.moveTo(0,-r);c.lineTo(r*.8,-r*.2);c.lineTo(r*.5,r*.8);c.lineTo(-r*.5,r*.8);c.lineTo(-r*.8,-r*.2);c.closePath();c.fill();c.strokeStyle='rgba(20,10,28,.75)';c.lineWidth=2.5;c.stroke();c.fillStyle='rgba(255,255,255,.55)';c.beginPath();c.moveTo(-r*.1,-r*.8);c.lineTo(r*.3,-r*.2);c.lineTo(-r*.3,-r*.1);c.closePath();c.fill();c.fillStyle='rgba(0,0,0,.18)';c.beginPath();c.moveTo(0,r*.1);c.lineTo(r*.6,r*.1);c.lineTo(r*.4,r*.8);c.lineTo(0,r*.8);c.fill();c.restore();}
function drawBG(c,api){
 const W=api.W,H=api.H;
 const o=bgCache('gd'+W+'x'+H,W,H,(g,w,h)=>{N.bgGrad(g,w,h,['#120a1c','#241630','#1a1024']);
  const rn=N.mulberry(5);for(let i=0;i<14;i++){const x=rn()*w,hh=30+rn()*70;g.fillStyle='#2a1c38';g.beginPath();g.moveTo(x-14,0);g.lineTo(x+14,0);g.lineTo(x,hh);g.fill();}
  for(let i=0;i<22;i++){const x=rn()*w,y=rn()*h,col=GCOL[i%4];g.save();g.translate(x,y);g.rotate(rn()*3);g.globalAlpha=.55;const gr=g.createRadialGradient(0,0,0,0,0,26);gr.addColorStop(0,col+'88');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(-26,-26,52,52);g.globalAlpha=.8;g.fillStyle=col;g.beginPath();g.moveTo(0,-8);g.lineTo(4,0);g.lineTo(0,8);g.lineTo(-4,0);g.fill();g.restore();}});
 c.drawImage(o,0,0);
}
function drawHUD(c,api,d){
 const W=api.W,H=api.H,por=api.portrait;
 for(let i=0;i<S.maxHearts;i++)heart(c,24+i*30,24,14,'#ef6a6a',i<S.hearts);
 N.chip(c,W-248,6,118,'LEVEL',(S.lv+1)+' / '+LEVELS);N.chip(c,W-124,6,114,'GEMS',S.got+' / '+S.quota,{color:S.got>=S.quota?'#9de3d1':'#fff0d4'});
 // energy
 const ey=por?64:48;N.bar(c,14,ey,por?W-28:300,14,S.energy/Math.max(1,S.maxE),S.energy<=4?'#ef4a4a':'#ffd86a');T(c,'LANTERN '+S.energy,22,ey+12,12,'#1a1226','left',{stroke:null,color:'#2a1a2a'});
 if(por)T(c,'Collect '+S.quota+' of '+S.gems+' gems. Blue/red numbers: nearby treasure / cave-ins.',W/2,por?104:0,12,'rgba(255,240,208,.7)','center',{stroke:null});
 // tools
 const by=H-(por?112:78),bw=por?(W-24)/5-4:112,bh=por?64:54;
 TOOLS.forEach((t,i)=>{const x=por?12+i*(bw+4):W/2-(bw*5+8*4)/2+i*(bw+8),act=S.tool===i,left=t.id==='probe'?S.tools.probe:t.id==='bomb'?S.tools.bomb:t.id==='scan'?S.tools.scan:null;const dis=left===0;
  N.slab(c,x,by,bw,bh,12,act?N.shade(t.c,.1):dis?'#3a2c3c':'#4a3552',{depth:act?2:5});if(act){c.strokeStyle='#fff0d4';c.lineWidth=3;N.rr(c,x,by,bw,bh,12);c.stroke();}
  T(c,t.n,x+bw/2,by+bh*.42,por?15:17,dis?'#8a7a8a':act?'#1a1226':'#fff0d4','center',{stroke:null});
  T(c,(left!==null?'×'+left+' ':'')+(t.cost?'⚡'+t.cost:''),x+bw/2,by+bh*.8,por?12:13,dis?'#7a6a7a':act?'#3a2a3a':'#d8c8e8','center',{stroke:null});
  if(!api.touch)T(c,t.k,x+10,by+16,11,act?'#3a2a3a':'#ffe08a','left',{stroke:null});S.btn[i]={x,y:by,w:bw,h:bh};});
 if(S.msgT>0){T(c,S.msg,W/2,por?H-124:H-92,15,'#ffe0a0','center',{stroke:'#1a1226'});}
 if(S.descend&&!S.over&&!S.pend){const x=W-150,y=por?96:100;S.dbtn={x,y,w:136,h:40};N.slab(c,x,y,136,40,14,'#6ab890',{depth:4});T(c,'DESCEND ▶',x+68,y+27,16,'#1a1226','center',{stroke:null});}else S.dbtn=null;
 if(S.bannerT>0){c.save();c.globalAlpha=Math.min(1,S.bannerT*2);c.fillStyle='rgba(18,12,30,.65)';c.fillRect(0,H*.38,W,H*.16);T(c,S.banner,W/2,H*.46,Math.min(W,540)/11,PAL.gold,'center',{glow:PAL.gold});T(c,S.sub,W/2,H*.51,15,'#fff0d4','center',{stroke:null});c.restore();}
 if(S.flash>0){c.fillStyle='rgba(255,90,70,'+S.flash*.45+')';c.fillRect(0,0,W,H);}
}
NEXUS_GAMES.register('gemdig',{
 ...(DBG?{dbg:()=>S}:{}),
 meta:{title:'Moon Gem Dig',help:'Deduce where gems and cave-ins hide. Dig, probe, bomb and scan within your lantern energy.',controls:'CLICK tiles · 1-5 pick tool · ARROWS + SPACE · N descend',type:'DEDUCTION · RISK'},
 size:[900,520],portraitSize:[540,860],duration:260,tier:1.1,
 init(api){newState(api);S.btn=[];},
 start(api){newState(api);S.btn=[];},
 update(dt,api){
  S.t+=dt;S.bgT+=dt;if(S.bannerT>0)S.bannerT-=dt;if(S.msgT>0)S.msgT-=dt;if(S.flash>0)S.flash-=dt;if(S.scanFx){S.scanFx.t-=dt;if(S.scanFx.t<=0)S.scanFx=null;}
  for(const c of S.cells)if(c.fx>0)c.fx-=dt;for(let i=S.fx.length-1;i>=0;i--){S.fx[i].t-=dt;if(S.fx[i].t<=0)S.fx.splice(i,1);}
  if(S.endT>=0){S.endT-=dt;if(S.endT<0)end(api);}
  if(S.pend!==null&&S.pend!==undefined&&S.pend!==0){S.pend-=dt;if(S.pend<=0){S.pend=null;newLevel(api,S.lv+1);}}
 },
 draw(c,api){
  if(!S)return;drawBG(c,api);const d=dims(api),n=S.n,cs=d.cs;
  // board backing
  N.slab(c,d.x0-8,d.y0-8,cs*n+16,cs*n+16,16,'#2a1c34',{depth:8});
  for(let i=0;i<n*n;i++){const cell=S.cells[i],x=d.x0+(i%n)*cs,y=d.y0+Math.floor(i/n)*cs,cx=x+cs/2,cy=y+cs/2;
   if(cell.rev===1||cell.rev===3&&false){c.drawImage(floorSprite(cs),x,y);}
   else{const bump=cell.fx>0?-cell.fx*6:0;c.drawImage(rockSprite(cs,i%3),x,y+bump*0);}
   if(cell.rev===1){
    if(cell.haz){c.fillStyle='rgba(20,10,28,.6)';c.beginPath();c.ellipse(cx,cy+cs*.1,cs*.34,cs*.18,0,0,TAU);c.fill();c.fillStyle=cell.defused?'#6ab890':'#8a7a8a';for(let k=0;k<4;k++){c.beginPath();c.arc(cx+Math.cos(k*1.7)*cs*.14,cy+Math.sin(k*1.9)*cs*.1+cs*.05,cs*.1,0,TAU);c.fill();}if(cell.defused)T(c,'✓',cx,cy+6,cs*.3,'#9de3d1','center',{stroke:null});}
    else if(cell.gem)drawGem(c,cx,cy,cs*.28,GCOL[cell.gem-1],S.t+i);
    else if(cell.chest){const w=cs*.6;N.slab(c,cx-w/2,cy-w*.3,w,w*.62,6,cell.chest===2?'#a86a4a':'#c88a48',{depth:3});c.fillStyle='#ffd870';c.fillRect(cx-3,cy-2,6,8);N.glow(c,cx,cy,cs*.6,'#ffd870',.3);}
    else{ if(cell.gn>0)T(c,String(cell.gn),x+cs*.3,y+cs*.45,Math.max(14,cs*.36),'#7fe0d0','center');if(cell.hn>0)T(c,String(cell.hn),x+cs*.7,y+cs*.82,Math.max(14,cs*.36),'#ff8a7a','center');}
   }else if(cell.rev===2){c.save();c.globalAlpha=.9;c.fillStyle='rgba(10,4,20,.35)';N.rr(c,x+3,y+3,cs-6,cs-6,cs*.18);c.fill();c.restore();
    if(cell.haz){T(c,'!',cx,cy+cs*.14,cs*.5,'#ff8a6a','center');}else if(cell.gem)drawGem(c,cx,cy,cs*.22,GCOL[cell.gem-1],S.t);else if(cell.chest){T(c,'$',cx,cy+cs*.14,cs*.45,'#ffd86a','center');}else{T(c,'·',cx,cy+cs*.14,cs*.5,'#d8c8e8','center');}
    if(!cell.haz&&!cell.chest&&!cell.gem){if(cell.gn>0)T(c,String(cell.gn),x+cs*.28,y+cs*.4,Math.max(12,cs*.3),'#7fe0d0','center');if(cell.hn>0)T(c,String(cell.hn),x+cs*.72,y+cs*.8,Math.max(12,cs*.3),'#ff8a7a','center');}}
   else if(cell.rev===3){ // revealed after loss
    c.save();c.globalAlpha=.55;if(cell.haz){T(c,'✖',cx,cy+cs*.14,cs*.45,'#ff8a6a','center');}else if(cell.gem)drawGem(c,cx,cy,cs*.22,GCOL[cell.gem-1],S.t);c.restore();}
   if(cell.flag&&cell.rev!==1){c.save();c.translate(cx,cy);c.strokeStyle='#d8c8e8';c.lineWidth=3;c.beginPath();c.moveTo(-4,cs*.28);c.lineTo(-4,-cs*.25);c.stroke();c.fillStyle='#f2ce77';c.beginPath();c.moveTo(-4,-cs*.25);c.lineTo(cs*.24,-cs*.14);c.lineTo(-4,-cs*.02);c.fill();c.restore();}
   if(S.hover===i&&api.running&&!S.over){c.strokeStyle='#fff0d4';c.lineWidth=3;N.rr(c,x+3,y+3,cs-6,cs-6,cs*.18);c.stroke();}
  }
  if(S.scanFx){const f=S.scanFx,i=f.i,x=d.x0+(i%n+.5)*cs,y=d.y0+(Math.floor(i/n)+.5)*cs,r=(f.rad+.5)*cs;c.save();c.globalAlpha=Math.min(1,f.t)*.9;c.strokeStyle='#e08ac0';c.lineWidth=4;c.setLineDash([10,8]);c.strokeRect(x-r,y-r,r*2,r*2);c.setLineDash([]);c.fillStyle='rgba(224,138,192,.12)';c.fillRect(x-r,y-r,r*2,r*2);c.restore();T(c,f.g+' treasure · '+f.h+' cave-in',x,y-r-6,15,'#ffd0f0','center');}
  for(const f of S.fx){const k=1-f.t/f.max;c.save();c.globalAlpha=1-k;c.strokeStyle='#ffb060';c.lineWidth=8*(1-k)+1;c.beginPath();c.arc(f.x,f.y,f.r*k,0,TAU);c.stroke();c.restore();}
  // lantern darkness
  if(api.running){const gx=S.hover>=0?d.x0+(S.hover%n+.5)*cs:api.W/2,gy=S.hover>=0?d.y0+(Math.floor(S.hover/n)+.5)*cs:api.H/2;const R0=Math.max(cs*3.2,(Math.max(api.W,api.H)*.9)*Math.min(1,.35+S.energy/Math.max(1,S.maxE)*.65));const dg=c.createRadialGradient(gx,gy,R0*.35,gx,gy,R0);dg.addColorStop(0,'rgba(10,4,20,0)');dg.addColorStop(1,'rgba(10,4,20,.55)');c.fillStyle=dg;c.fillRect(0,0,api.W,api.H);}
  if(api.running){S.btn=S.btn||[];drawHUD(c,api,d);}
  N.vignette(c,api.W,api.H,.35);
  if(!api.running){readyScreen(c,api,'MOON GEM DIG','Read the clue numbers, deduce where gems and cave-ins hide, and dig out the quota before your lantern fades. Five caves, each larger than the last.',[
   'Teal number = treasure in the 8 tiles around. Red number = cave-ins around.','DIG (1) costs 1 energy. PROBE (2) safely reveals one tile. BOMB (3) clears 3x3 and defuses cave-ins. SCAN (4) counts a 5x5 area.','FLAG (5) marks suspected cave-ins. Chests may be mimics!','Cave-ins and mimics cost a heart. Reach the quota, then DESCEND (or dig on for more).','Your first dig is always safe.'],PAL.mint,
   'BEST '+(api.store.get('top',[])[0]||0)+' · DEEPEST CAVE '+(api.store.get('stage',0)+1)+'/5');}
 },
 pointerdown(x,y,e,api){
  S.btn=S.btn||[];if(S.dbtn&&x>=S.dbtn.x&&x<=S.dbtn.x+S.dbtn.w&&y>=S.dbtn.y&&y<=S.dbtn.y+S.dbtn.h){descend(api);return;}
  for(let i=0;i<S.btn.length;i++){const b=S.btn[i];if(b&&x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h){S.tool=i;sfx(api,'click');return;}}
  const d=dims(api),c=Math.floor((x-d.x0)/d.cs),r=Math.floor((y-d.y0)/d.cs);if(c>=0&&c<S.n&&r>=0&&r<S.n){S.cur=r*S.n+c;S.hover=S.cur;useTool(api,S.cur);}
 },
 pointermove(x,y,e,api){const d=dims(api),c=Math.floor((x-d.x0)/d.cs),r=Math.floor((y-d.y0)/d.cs);S.hover=(c>=0&&c<S.n&&r>=0&&r<S.n)?r*S.n+c:-1;if(S.hover>=0)S.cur=S.hover;},
 keydown(e,api){const k=e.key;const n=S.n;
  if(/^[1-5]$/.test(k)){S.tool=+k-1;sfx(api,'click');return;}
  if(k==='ArrowLeft'){S.cur=(S.cur%n>0)?S.cur-1:S.cur;S.hover=S.cur;}else if(k==='ArrowRight'){S.cur=(S.cur%n<n-1)?S.cur+1:S.cur;S.hover=S.cur;}else if(k==='ArrowUp'){S.cur=S.cur>=n?S.cur-n:S.cur;S.hover=S.cur;}else if(k==='ArrowDown'){S.cur=S.cur<n*(n-1)?S.cur+n:S.cur;S.hover=S.cur;}
  else if(k===' '||k==='Enter'){useTool(api,S.cur);}else if(k==='n'||k==='N'){if(S.descend)descend(api);}
  else if(k==='f'||k==='F'){const c=S.cells[S.cur];if(c&&c.rev===0)c.flag=1-c.flag;}},
 timeUp(api){S.win=false;S.over=true;end(api);}
});
})();

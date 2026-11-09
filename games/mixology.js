/* games/mixology.js — Neon Nexus cabinet module */
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
/* ===== MIXOLOGY MASTER ===== */
const ING={orange:{n:'Orange',c:'#f6a030'},grenadine:{n:'Grenadine',c:'#d8304a'},soda:{n:'Soda',c:'#cfe8f0'},lime:{n:'Lime',c:'#9ad060'},mint:{n:'Mint Syrup',c:'#5fd0a0'},berry:{n:'Berry',c:'#8a3a9a'},lemon:{n:'Lemon',c:'#f6e060'},coconut:{n:'Coconut',c:'#f8f0e0'},mango:{n:'Mango',c:'#f6b840'},blue:{n:'Blue Lagoon',c:'#3a9ae8'},honey:{n:'Honey',c:'#e0a030'},cream:{n:'Cream',c:'#fff4e0'}};
const GAR={cherry:{n:'Cherry',c:'#d02a4a'},lime:{n:'Lime wheel',c:'#8ac850'},mint:{n:'Mint leaf',c:'#4ab880'},umbrella:{n:'Umbrella',c:'#f08ab0'},orange:{n:'Orange slice',c:'#f6a030'}};
const RECIPES=[
 {n:'Sunrise Soda',t:1,ing:['orange','grenadine'],amt:[40,25],shake:false,gar:'cherry'},
 {n:'Lemon Honey',t:1,ing:['lemon','honey'],amt:[45,20],shake:false,gar:'lime'},
 {n:'Mint Cooler',t:2,ing:['lime','mint','soda'],amt:[30,20,30],shake:false,gar:'mint'},
 {n:'Tropic Cloud',t:2,ing:['mango','coconut','orange'],amt:[30,25,25],shake:true,gar:'umbrella'},
 {n:'Berry Bliss',t:2,ing:['berry','cream','lemon'],amt:[30,25,25],shake:true,gar:'cherry'},
 {n:'Galaxy Fizz',t:3,ing:['berry','blue','lemon','soda'],amt:[20,20,20,25],shake:true,gar:'orange'},
 {n:'Golden Zinger',t:3,ing:['honey','lemon','orange','soda'],amt:[15,20,25,25],shake:true,gar:'lime'},
 {n:'Lagoon Dream',t:3,ing:['blue','coconut','mango','cream'],amt:[20,20,25,20],shake:true,gar:'umbrella'}];
const ANIM=[{c:'#e8b080',e:'tri'},{c:'#a8785a',e:'round'},{c:'#8ac878',e:'bump'},{c:'#f0e0e8',e:'long'},{c:'#b8a0d0',e:'tri'}];
const TIERS=[1,1,2,2,2,3,3,3];
let S=null;
function geo(api){const W=api.W,H=api.H,por=api.portrait;return{gx:por?W/2:W*.64,gy:por?H*.53:H*.5,gw:por?130:120,gh:por?220:200,shelfY:por?H-190:H-72,top:por?60:50};}
function newState(api){
 const m=api.mastery;
 S={n:-1,hearts:3+(m>=6?1:0),maxHearts:3+(m>=6?1:0),phase:'idle',rec:null,order:[],pickedIdx:[],shelf:[],level:0,layers:[],pouring:false,pi:0,poured:0,qs:[],pat:0,patMax:30,cust:null,cIn:0,stars:[],streak:0,best:0,beat:0,beats:[],shakeHits:0,shakeN:0,shakeT:0,garOpts:[],garT:0,bannerT:0,banner:'',sub:'',bgT:0,endT:-1,done:false,tilt:0,res:null,resT:0,spill:0,perfectCount:0,wrongPicks:0,mp:{},cs:0,t:0,total:0,pourPulse:0,pourDone:false,win:false,garOK:false,garQ:0,shakeResults:[],shakeBeatAt:0,shakeClock:0,shakeTapped:true,shakeFlash:0,shakeJolt:0};
}
function nextOrder(api){
 S.n++;if(S.n>=8){return finishAll(api,true);}
 const tier=cl(TIERS[S.n]+(api.diff.id==='easy'&&S.n<3?-1:0),1,3),pool=RECIPES.filter(r=>r.t===Math.max(1,tier));
 S.rec=pool[RI(0,pool.length-1)];S.cust={an:ANIM[RI(0,4)],mood:0};S.cIn=0;
 const base=26+S.rec.ing.length*9;S.patMax=base*(api.diff.mul<1?1.3:api.diff.mul>1?.8:1)*(api.mastery>=4?1.2:1);S.pat=S.patMax;
 S.order=[];S.layers=[];S.level=0;S.pi=0;S.poured=0;S.qs=[];S.pickedIdx=[];S.pouring=false;S.wrongPicks=0;S.spill=0;S.pourDone=false;
 // shelf: recipe ingredients + decoys, 8 slots
 const ids=S.rec.ing.slice();const all=Object.keys(ING).filter(k=>!ids.includes(k));while(ids.length<8)ids.push(all.splice(RI(0,all.length-1),1)[0]);
 for(let i=ids.length-1;i>0;i--){const j=RI(0,i);[ids[i],ids[j]]=[ids[j],ids[i]];}
 S.shelf=ids;S.phase='pick';S.banner='ORDER '+(S.n+1)+' / 8 · '+S.rec.n.toUpperCase();S.sub=['','Easy 2-ingredient drink','Pour 3 layers','Master recipe: 4 layers!'][S.rec.t];S.bannerT=1.5;sfx(api,'ping');
 if(S.n>api.store.get('stage',0))api.store.set('stage',S.n);
}
function pick(api,i){
 if(S.phase!=='pick')return;const id=S.shelf[i];if(!id||S.order.includes(id))return;
 const k=S.rec.ing.indexOf(id);
 if(k<0){S.wrongPicks++;S.mp[i]=.4;api.popText('NOT IN RECIPE',geoX(api,i),geo(api).shelfY-40,'#ffb0a0');sfx(api,'miss');api.shake(4,.12);S.pat-=2;return;}
 S.order.push(id);S.pickedIdx.push(i);sfx(api,'click');api.sound(400+S.order.length*100,.06,'triangle',.04);
 if(S.order.length>=S.rec.ing.length){S.phase='pour';S.pi=0;S.level=0;S.poured=0;S.bannerT=.9;S.banner='POUR!';S.sub='Hold to pour, release inside the band';}
}
const bandHalf=api=>Math.max(3,(9-S.rec.t*1.6)*(api.diff.mul<1?1.25:api.diff.mul>1?.85:1)*(api.mastery>=2?1.25:1));
function amtOf(id){return S.rec.amt[S.rec.ing.indexOf(id)];}
function pourEnd(api){
 if(S.phase!=='pour'||!S.pouring)return;S.pouring=false;
 const id=S.order[S.pi],a=amtOf(id),err=Math.abs(S.poured-a),bh=bandHalf(api),g=geo(api);
 let q,txt,col;
 if(err<=bh*.45){q=1;txt='PERFECT';col='#ffe08a';S.perfectCount++;}else if(err<=bh){q=.75;txt='GOOD';col='#9de3d1';}else if(err<=bh*2){q=.4;txt='OFF';col='#f2ce77';}else{q=.1;txt=S.poured>a?'TOO MUCH':'TOO LITTLE';col='#ff8a6a';}
 S.qs.push(q);api.popText(txt,g.gx+g.gw*.7,g.gy-g.gh*.3,col);api.sound(300+q*400,.12,'triangle',.05);if(q>=.75)api.burst(g.gx,g.gy-g.gh*.3,ING[id].c,10);
 S.layers.push({id,amt:S.poured});S.pi++;S.poured=0;
 if(S.level>100){S.spill++;api.popText('SPILL!',g.gx,g.gy-g.gh*.6,'#ff8a6a');api.shake(6,.2);}
 if(S.pi>=S.order.length){
  if(S.rec.shake){S.phase='shake';startShake(api);}else startGarnish(api);
 }
}
function startShake(api){S.shakeN=S.rec.t===3?6:S.rec.t===2?5:4;if(api.mastery>=4)S.shakeN--;S.beat=0;S.shakeHits=0;S.beatT=.9;S.beatInt=.62/Math.sqrt(api.diff.mul);S.shakeResults=[];S.bannerT=1;S.banner='SHAKE!';S.sub='Tap / SPACE on every flash';S.shakeFlash=0;S.shakeBeatAt=0;S.shakeClock=0;S.shakeTapped=true;}
function shakeTap(api){
 if(S.phase!=='shake')return;
 // nearest beat
 const t=S.shakeClock,d=Math.abs(t-S.shakeBeatAt);
 if(S.shakeBeatAt>0&&!S.shakeTapped&&d<.32){S.shakeTapped=true;const q=d<.09?1:d<.18?.7:.4;S.shakeResults.push(q);api.popText(q===1?'PERFECT':q>.5?'GOOD':'LATE',geo(api).gx,geo(api).gy-geo(api).gh*.7,q===1?'#ffe08a':'#fff0d4');api.sound(260+S.shakeResults.length*50,.07,'square',.04);S.shakeJolt=1;}
 else{S.shakeJolt=1;api.sound(130,.05,'square',.03);}
}
function startGarnish(api){S.phase='garnish';const opts=Object.keys(GAR).filter(k=>k!==S.rec.gar);const o=[S.rec.gar];while(o.length<4)o.push(opts.splice(RI(0,opts.length-1),1)[0]);for(let i=3;i>0;i--){const j=RI(0,i);[o[i],o[j]]=[o[j],o[i]];}S.garOpts=o;S.garT=6/(api.diff.mul>1?1.2:1);S.bannerT=1;S.banner='GARNISH';S.sub='Pick the '+GAR[S.rec.gar].n;}
function garnish(api,i){
 if(S.phase!=='garnish')return;const id=S.garOpts[i];if(!id)return;
 S.garOK=id===S.rec.gar;S.garQ=S.garOK?(S.garT>3?1:.8):0;serveDrink(api);
}
function serveDrink(api){
 S.phase='serve';S.resT=0;
 const pq=S.qs.reduce((a,b)=>a+b,0)/Math.max(1,S.qs.length);
 let sq=1;if(S.rec.shake){const r=S.shakeResults;sq=r.reduce((a,b)=>a+b,0)/Math.max(1,S.shakeN);}
 const gq=S.garQ;const q=pq*.55+(S.rec.shake?sq*.25+gq*.2:gq*.45)-S.spill*.1-S.wrongPicks*.06;
 let stars=q>=.9?5:q>=.75?4:q>=.55?3:q>=.35?2:1;
 const sp=cl(S.pat/S.patMax,0,1);if(sp>.5&&stars<5&&q>.8)stars++;
 stars=cl(stars,1,5);S.stars.push(stars);
 const g=geo(api);
 if(stars>=4)S.streak++;else S.streak=0;S.best=Math.max(S.best,S.streak);api.combo=S.streak;
 const mu=1+Math.min(1,S.streak*.25),tip=Math.round(4*sp);
 const pts=Math.round((stars*4+tip+(stars===5?4:0)+S.rec.t*2)*mu);
 api.addScore(pts,g.gx,g.gy-g.gh*.9,'#ffe08a');
 S.res={stars,q};sfx(api,stars>=4?'win':stars>=3?'coin':'lose');api.burst(g.gx,g.gy-g.gh*.5,ING[S.order[0]].c,stars*4);
 S.cust.mood=stars>=4?2:stars>=3?1:-1;
 if(stars===5)api.achieve('five','Five-Star Pour',4);
 if(S.perfectCount>=10)api.achieve('perf','Steady Hands',5);
 if(stars<=1){S.hearts--;api.shake(10,.3);if(S.hearts<=0){S.endT=1.6;S.win=false;S.phase='dead';}}
}
function timeoutOrder(api){S.hearts--;S.streak=0;api.popText('CUSTOMER LEFT!',api.W/2,api.H*.3,'#ff8a6a');sfx(api,'lose');api.shake(10,.3);S.stars.push(0);S.cust.mood=-1;S.phase='leave';S.resT=0;if(S.hearts<=0){S.endT=1.5;S.win=false;S.phase='dead';}}
function finishAll(api,win){if(S.done)return;S.phase='dead';S.win=win;S.endT=1.2;if(win){api.addScore(30,api.W/2,api.H*.4,'#9de3d1');sfx(api,'win');}}
function realFinish(api){if(S.done)return;S.done=true;topScores(api,api.score);const served=S.stars.filter(x=>x>0);const avg=served.length?served.reduce((a,b)=>a+b,0)/served.length:0;
 if(S.win&&avg>=4)api.achieve('avg','Head Bartender',8);if(S.win)api.achieve('shift','Closing Time',5);
 api.finish(S.win,{grade:gradeOf(cl(api.score/330,0,1),S.win)+' · '+avg.toFixed(1)+'★ AVG',combo:S.best});}
/* ---------- drawing ---------- */
function geoX(api,i){const W=api.W,por=api.portrait,cols=por?4:8;const sp=(W-30)/cols;return 15+sp*((por?i%4:i)+.5);}
function geoY(api,i){const g=geo(api);return api.portrait?g.shelfY+(i>=4?100:0):g.shelfY;}
function bg(c,api){
 const o=bgCache('mix'+api.W+'x'+api.H,api.W,api.H,(x,W,H)=>{N.bgGrad(x,W,H,['#1c1030','#3a1c48','#6a3050']);
  // brick/panel wall
  x.fillStyle='rgba(255,255,255,.04)';for(let r=0;r<10;r++)for(let k=0;k<W/80+1;k++)N.rr(x,k*80+(r%2)*40-20,r*34+4,74,28,6),x.fill();
  // neon sign
  x.save();x.font='700 28px Fredoka, sans-serif';x.textAlign='center';x.shadowColor='#ff5aa0';x.shadowBlur=18;x.fillStyle='#ffb0d0';x.fillText('MIXOLOGY',W/2,34);x.restore();
  // back shelf
  const sy=H*.17;x.fillStyle='#4a2a2a';x.fillRect(0,sy+36,W,8);x.fillStyle='rgba(255,255,255,.2)';x.fillRect(0,sy+36,W,2);
  for(let i=0;i<14;i++){const bx=(i+.5)*W/14,col=['#5a8aa0','#a05a70','#6aa070','#c0a050'][i%4];x.fillStyle=col;x.globalAlpha=.4;N.rr(x,bx-9,sy+(i%3)*4,18,38-(i%3)*4,6);x.fill();x.fillRect(bx-3,sy-10+(i%3)*4,6,12);x.globalAlpha=1;}
  // bar counter
  const cy=H*.5+ (W<H?150:120);const cg=x.createLinearGradient(0,cy,0,H);cg.addColorStop(0,'#8a5a3a');cg.addColorStop(1,'#3a2018');x.fillStyle=cg;x.fillRect(0,cy,W,H-cy);x.fillStyle='rgba(255,255,255,.25)';x.fillRect(0,cy,W,4);});
 c.drawImage(o,0,0);
}
function drawGlass(c,api,g,level,layersExtra){
 const gx=g.gx,gy=g.gy,w=g.gw,h=g.gh;
 c.save();c.translate(gx,gy);
 c.fillStyle='rgba(10,4,20,.35)';c.beginPath();c.ellipse(6,h/2+6,w*.6,10,0,0,TAU);c.fill();
 // glass shape (tapered)
 const path=()=>{c.beginPath();c.moveTo(-w/2,-h/2);c.lineTo(w/2,-h/2);c.lineTo(w*.4,h/2);c.quadraticCurveTo(0,h/2+10,-w*.4,h/2);c.closePath();};
 c.save();path();c.clip();
 // liquid layers
 let y=h/2;const unit=h/100;
 const draw1=(col,amt)=>{const hh=amt*unit;const gr=c.createLinearGradient(-w/2,0,w/2,0);gr.addColorStop(0,N.shade(col,-.15));gr.addColorStop(.4,col);gr.addColorStop(1,N.shade(col,-.3));c.fillStyle=gr;c.fillRect(-w/2,y-hh,w,hh+1);c.fillStyle='rgba(255,255,255,.25)';c.fillRect(-w/2,y-hh,w,3);y-=hh;};
 for(const l of S.layers)draw1(ING[l.id].c,l.amt);
 if(layersExtra)draw1(layersExtra.col,layersExtra.amt);
 // bubbles
 if(S.layers.some(l=>l.id==='soda')||(layersExtra&&layersExtra.id==='soda')){c.fillStyle='rgba(255,255,255,.5)';for(let i=0;i<8;i++){const bx=Math.sin(i*7.3)*w*.3,by=(h/2-((S.bgT*30+i*37)%h*.8));c.beginPath();c.arc(bx,by,2,0,TAU);c.fill();}}
 c.restore();
 path();c.fillStyle='rgba(200,230,255,.1)';c.fill();c.strokeStyle='rgba(230,245,255,.75)';c.lineWidth=4;c.stroke();
 c.fillStyle='rgba(255,255,255,.4)';c.beginPath();c.ellipse(-w*.33,-h*.15,5,h*.3,.08,0,TAU);c.fill();
 c.restore();
}
function drawBottle(c,x,y,id,s,tilt,dim,label){
 const col=ING[id].c;c.save();c.translate(x,y);c.rotate(tilt);c.scale(s,s);c.globalAlpha=dim?.35:1;
 c.fillStyle='rgba(10,4,20,.3)';c.beginPath();c.ellipse(3,36,18,6,0,0,TAU);c.fill();
 const g=c.createLinearGradient(-16,0,16,0);g.addColorStop(0,N.shade(col,-.3));g.addColorStop(.35,N.shade(col,.15));g.addColorStop(1,N.shade(col,-.4));
 c.fillStyle=g;c.beginPath();c.moveTo(-15,34);c.lineTo(-15,-8);c.quadraticCurveTo(-15,-18,-6,-22);c.lineTo(-6,-38);c.lineTo(6,-38);c.lineTo(6,-22);c.quadraticCurveTo(15,-18,15,-8);c.lineTo(15,34);c.quadraticCurveTo(0,40,-15,34);c.fill();c.strokeStyle='rgba(30,16,34,.6)';c.lineWidth=2.5;c.stroke();
 c.fillStyle='#f4e8d0';N.rr(c,-11,2,22,20,4);c.fill();c.fillStyle=N.shade(col,-.2);c.beginPath();c.arc(0,12,5,0,TAU);c.fill();
 c.fillStyle='#8a5a30';c.fillRect(-6,-44,12,8);c.fillStyle='rgba(255,255,255,.5)';c.fillRect(-11,-12,4,34);
 c.restore();if(label)T(c,label,x,y+54*s,11,'#fff0d4','center',{stroke:null});
}
function drawCustomer(c,api,g){
 const cu=S.cust;if(!cu)return;const por=api.portrait;const slide=E.out(Math.min(1,S.cIn)),r=por?42:46,x=por?g.gx-(g.gw*.1)-90:W2(api)*.17,y=(por?g.top+86:g.top+100)+(1-slide)*-160;
 c.save();c.translate(x,y);
 c.fillStyle=['#4a6a98','#98684a','#6a984a'][S.n%3];c.beginPath();c.ellipse(0,r*1.2,r*1.2,r*.8,0,Math.PI,0);c.fill();c.strokeStyle='rgba(30,16,34,.5)';c.lineWidth=2.5;c.stroke();
 const an=cu.an;for(const s of[-1,1]){c.fillStyle=N.shade(an.c,-.1);c.beginPath();if(an.e==='tri'){c.moveTo(s*r*.3,-r*.8);c.lineTo(s*r*.95,-r*1.35);c.lineTo(s*r*.9,-r*.4);}else if(an.e==='long'){c.ellipse(s*r*.4,-r*1.3,r*.2,r*.55,s*.15,0,TAU);}else c.arc(s*r*.7,-r*.75,r*.3,0,TAU);c.fill();c.stroke();}
 N.blob(c,0,0,r,an.c,S.n+3,{shadow:false});
 const pr=S.pat/S.patMax;c.fillStyle='#fff';for(const s of[-1,1]){c.beginPath();c.arc(s*r*.36,-r*.1,r*.2,0,TAU);c.fill();c.fillStyle='#241830';c.beginPath();c.arc(s*r*.36,-r*.07,r*.1,0,TAU);c.fill();c.fillStyle='#fff';}
 c.strokeStyle='#4a2a30';c.lineWidth=2.5;c.beginPath();if(cu.mood>0||(cu.mood===0&&pr>.5))c.arc(0,r*.2,r*.25,.2,Math.PI-.2);else if(cu.mood<0||pr<.25)c.arc(0,r*.5,r*.22,Math.PI+.3,-.3);else{c.moveTo(-r*.2,r*.35);c.lineTo(r*.2,r*.35);}c.stroke();
 c.fillStyle='#e88a8a';c.beginPath();c.ellipse(0,r*.12,r*.1,r*.07,0,0,TAU);c.fill();
 c.restore();
 N.bar(c,x-50,y+r*1.5+10,100,9,pr,pr>.5?'#91c9a7':pr>.25?'#f2ce77':'#ef6a5a');
}
const W2=api=>api.W;
function drawRecipe(c,api,g){
 const por=api.portrait,x=por?14:W2(api)*.27,y=por?g.top+156:g.top+34,w=por?W2(api)-28:210,h=por?96:150;
 c.save();N.slab(c,x,y,w,h,14,'#f4e4c4',{depth:5});
 T(c,S.rec.n,x+w/2,y+26,20,'#5a3040','center',{stroke:null});
 S.rec.ing.forEach((id,i)=>{const done=S.order.includes(id);const bx=por?x+30+i*(w-60)/Math.max(1,S.rec.ing.length-1||1):x+34,by=por?y+58:y+50+i*24;
  if(por){c.globalAlpha=done?.35:1;c.fillStyle=ING[id].c;c.beginPath();c.arc(bx,by,10,0,TAU);c.fill();c.strokeStyle='rgba(60,30,40,.6)';c.lineWidth=2;c.stroke();T(c,ING[id].n,bx,by+28,11,'#5a3040','center',{stroke:null});c.globalAlpha=1;}
  else{c.globalAlpha=done?.35:1;c.fillStyle=ING[id].c;c.beginPath();c.arc(bx,by,8,0,TAU);c.fill();c.strokeStyle='rgba(60,30,40,.6)';c.lineWidth=2;c.stroke();T(c,ING[id].n+' '+S.rec.amt[i]+'%',bx+16,by+5,13,'#5a3040','left',{stroke:null});c.globalAlpha=1;}});
 T(c,(S.rec.shake?'Shake · ':'Stir · ')+GAR[S.rec.gar].n,x+w/2,y+h-8,12,'#8a5a40','center',{stroke:null});c.restore();
}
function drawGarn(c,api,id,x,y,s){c.save();c.translate(x,y);c.scale(s,s);const col=GAR[id].c;
 if(id==='cherry'){N.ball(c,0,4,12,col,{shadow:false});c.strokeStyle='#5a8a3a';c.lineWidth=3;c.beginPath();c.moveTo(0,-8);c.quadraticCurveTo(8,-22,14,-20);c.stroke();}
 else if(id==='umbrella'){c.fillStyle=col;c.beginPath();c.arc(0,0,18,Math.PI,0);c.fill();c.fillStyle='#fff';for(let i=-1;i<=1;i++){c.beginPath();c.arc(i*10,-2,4,Math.PI,0);c.fill();}c.strokeStyle='#8a5a30';c.lineWidth=3;c.beginPath();c.moveTo(0,0);c.lineTo(0,22);c.stroke();}
 else if(id==='mint'){for(const a of[-.5,0,.5]){c.fillStyle=col;c.beginPath();c.ellipse(Math.sin(a)*8,-8-Math.cos(a)*6,6,11,a,0,TAU);c.fill();c.strokeStyle='rgba(20,60,30,.5)';c.lineWidth=1.5;c.stroke();}}
 else{c.fillStyle=col;c.beginPath();c.arc(0,0,16,0,TAU);c.fill();c.strokeStyle='#fff8d0';c.lineWidth=3;c.stroke();c.strokeStyle='rgba(255,255,255,.5)';c.lineWidth=1.5;for(let i=0;i<6;i++){c.beginPath();c.moveTo(0,0);c.lineTo(Math.cos(i*1.05)*13,Math.sin(i*1.05)*13);c.stroke();}}
 c.restore();}
function drawHUD(c,api,g){
 const W=api.W,H=api.H,por=api.portrait;
 for(let i=0;i<S.maxHearts;i++)heart(c,24+i*32,52,14,'#ef6a6a',i<S.hearts);
 N.chip(c,W-248,44,118,'ORDER',Math.min(8,S.n+1)+' / 8');N.chip(c,W-124,44,112,'STREAK',S.streak?'×'+(1+Math.min(1,S.streak*.25)).toFixed(2):'—',{color:S.streak?'#ffe08a':'#fff0d4'});
 const avg=S.stars.filter(x=>x>0);if(avg.length)T(c,'AVG '+(avg.reduce((a,b)=>a+b,0)/avg.length).toFixed(1)+'★',W-186,por?102:106,13,'#ffe08a','left',{stroke:null});
 // phase tracker
 const ph=['pick','pour',S.rec&&S.rec.shake?'shake':null,'garnish'].filter(Boolean),names={pick:'PICK',pour:'POUR',shake:'SHAKE',garnish:'GARNISH'};
 ph.forEach((p,i)=>{const act=S.phase===p;const x=W/2+(i-(ph.length-1)/2)*84,y=por?108:g.top-2;T(c,names[p],x,y+(por?22:0),12,act?'#ffe08a':'rgba(255,240,208,.4)','center',{stroke:null});});
 if(S.bannerT>0){c.save();c.globalAlpha=Math.min(1,S.bannerT*2);c.fillStyle='rgba(18,12,30,.6)';c.fillRect(0,H*.4,W,H*.15);T(c,S.banner,W/2,H*.48,Math.min(W,520)/12,PAL.gold,'center',{glow:PAL.gold});T(c,S.sub,W/2,H*.53,15,'#fff0d4','center',{stroke:null});c.restore();}
}
NEXUS_GAMES.register('mixology',{
 ...(DBG?{dbg:()=>S}:{}),
 meta:{title:'Mixology Master',help:'Serve 8 customers: pick ingredients, pour each layer exactly, shake in rhythm, then garnish.',controls:'CLICK bottles (or 1-8) · HOLD click/SPACE to pour · tap on the flash to shake · 1-4 garnish',type:'PRECISION · RECIPES'},
 size:[900,520],portraitSize:[540,860],duration:200,tier:1.15,
 init(api){newState(api);},
 start(api){newState(api);nextOrder(api);},
 update(dt,api){
  const g=geo(api);S.bgT+=dt;S.t+=dt;if(S.bannerT>0)S.bannerT-=dt;S.cIn=Math.min(1,S.cIn+dt*1.6);
  for(const k in S.mp)if(S.mp[k]>0)S.mp[k]-=dt;
  if(S.endT>=0){S.endT-=dt;if(S.endT<0)realFinish(api);return;}
  if(S.done||S.phase==='dead')return;
  if(['pick','pour','shake','garnish'].includes(S.phase)&&S.bannerT<=0.3||S.phase==='pick'){S.pat-=dt;if(S.pat<=0)timeoutOrder(api);}
  if(S.phase==='pour'){
   if(S.pouring){const id=S.order[S.pi],a=amtOf(id);const rate=26+S.rec.t*4;S.poured+=rate*dt*(api.diff.mul>1?1.12:1);S.level=S.layers.reduce((s,l)=>s+l.amt,0)+S.poured;if(S.level>=104){pourEnd(api);}if(Math.random()<.6)api.burst(g.gx,g.gy-g.gh/2,ING[id].c,1);}
   S.level=S.layers.reduce((s,l)=>s+l.amt,0)+(S.pouring?S.poured:0);
  }
  if(S.phase==='shake'){
   S.shakeClock+=dt;if(S.shakeJolt>0)S.shakeJolt-=dt*5;
   S.beatT-=dt;
   if(S.beatT<=0&&S.beat<S.shakeN){ // schedule a beat now
    if(S.beat>0&&!S.shakeTapped){api.popText('MISSED',g.gx,g.gy-g.gh*.7,'#ff8a6a');S.shakeResults.push(0);}
    S.beat++;S.shakeBeatAt=S.shakeClock+.38;S.shakeTapped=false;S.shakeFlash=.38;S.beatT=S.beatInt;api.sound(900,.03,'square',.03);}
   if(S.shakeFlash>0)S.shakeFlash-=dt;
   if(S.beat>=S.shakeN&&S.beatT<=S.beatInt-.75){ if(!S.shakeTapped&&S.shakeResults.length<S.shakeN)S.shakeResults.push(0);startGarnish(api);}
  }
  if(S.phase==='garnish'){S.garT-=dt;if(S.garT<=0){S.garOK=false;S.garQ=0;api.popText('TOO SLOW',g.gx,g.gy-g.gh*.8,'#ffb0a0');serveDrink(api);}}
  if(S.phase==='serve'){S.resT+=dt;if(S.resT>1.8){S.phase='leave';S.resT=0;}}
  else if(S.phase==='leave'){S.resT+=dt;S.cIn=Math.max(0,1-S.resT*2);if(S.resT>.6){if(S.hearts<=0)return;nextOrder(api);}}
 },
 draw(c,api){
  if(!S)return;const g=geo(api);bg(c,api);
  if(S.rec){
   drawCustomer(c,api,g);drawRecipe(c,api,g);
   // glass / shaker
   if(S.phase==='shake'){const j=(S.shakeJolt||0);c.save();c.translate(g.gx+Math.sin(S.bgT*50)*6*j,g.gy);c.rotate(Math.sin(S.bgT*40)*.12*j);
    const sg=c.createLinearGradient(-40,0,40,0);sg.addColorStop(0,'#8a9ab8');sg.addColorStop(.4,'#e8f0ff');sg.addColorStop(1,'#6a7a98');c.fillStyle=sg;c.beginPath();c.moveTo(-40,-70);c.lineTo(40,-70);c.lineTo(30,80);c.lineTo(-30,80);c.closePath();c.fill();c.strokeStyle='rgba(30,16,34,.6)';c.lineWidth=3;c.stroke();c.fillStyle='#b0bcd8';c.beginPath();c.moveTo(-34,-70);c.lineTo(-18,-100);c.lineTo(18,-100);c.lineTo(34,-70);c.fill();c.stroke();c.fillStyle='#d8a050';c.fillRect(-12,-112,24,12);
    c.restore();
    // beat ring
    const k=S.shakeFlash>0?1-S.shakeFlash/.38:0;if(!S.shakeTapped&&S.shakeFlash>0||S.shakeBeatAt>0&&!S.shakeTapped){c.save();c.strokeStyle='#ffe08a';c.lineWidth=5;c.globalAlpha=.9;c.beginPath();c.arc(g.gx,g.gy,120-80*Math.min(1,k),0,TAU);c.stroke();c.strokeStyle='rgba(255,255,255,.7)';c.lineWidth=3;c.beginPath();c.arc(g.gx,g.gy,40,0,TAU);c.stroke();c.restore();}
    for(let i=0;i<S.shakeN;i++){c.fillStyle=i<S.shakeResults.length?(S.shakeResults[i]>.6?'#9de3d1':'#ef6a5a'):'rgba(255,240,208,.3)';c.beginPath();c.arc(g.gx+(i-(S.shakeN-1)/2)*22,g.gy+g.gh*.62,7,0,TAU);c.fill();}
   }else{
    drawGlass(c,api,g,S.level,null);
    if(S.phase==='pour'||S.phase==='pick'){
     // target band
     if(S.phase==='pour'&&S.pi<S.order.length){const id=S.order[S.pi],a=amtOf(id),base=S.layers.reduce((s,l)=>s+l.amt,0),unit=g.gh/100,ty=g.gy+g.gh/2-(base+a)*unit,bh=bandHalf(api)*unit;
      c.save();c.fillStyle='rgba(255,230,120,.28)';c.fillRect(g.gx-g.gw/2-14,ty-bh,g.gw+28,bh*2);c.strokeStyle='#ffe08a';c.lineWidth=2.5;c.beginPath();c.moveTo(g.gx-g.gw/2-18,ty);c.lineTo(g.gx+g.gw/2+18,ty);c.stroke();T(c,ING[id].n.toUpperCase(),g.gx+g.gw/2+24,ty+4,12,ING[id].c,'left',{stroke:null});c.restore();
      // bottle + stream
      const by=g.gy-g.gh/2-70;drawBottle(c,g.gx+(S.pouring?38:70),by-(S.pouring?0:10),id,1.15,S.pouring?-1.9:-.2,false);
      if(S.pouring){c.strokeStyle=ING[id].c;c.lineWidth=6;c.globalAlpha=.9;c.beginPath();c.moveTo(g.gx+14,by+34);c.lineTo(g.gx+10,g.gy+g.gh/2-S.level*unit);c.stroke();c.globalAlpha=1;}
      T(c,S.pouring?'RELEASE IN THE BAND':'HOLD TO POUR',g.gx,g.gy+g.gh/2+30,15,'#fff0d4','center',{stroke:null});}
    }
    if(S.phase==='garnish'||S.phase==='serve'||S.phase==='leave'){if(S.garOK)drawGarn(c,api,S.rec.gar,g.gx+g.gw*.3,g.gy-g.gh/2-6,1.1);}
   }
   // shelf
   if(S.phase==='pick'||S.phase==='pour'||S.phase==='shake'){
    for(let i=0;i<8;i++){const id=S.shelf[i],x=geoX(api,i),y=geoY(api,i);const used=S.order.includes(id);const hop=S.mp[i]>0?Math.sin(S.mp[i]*40)*4:0;drawBottle(c,x+hop,y,id,api.portrait?.95:.95,0,used,null);
     T(c,ING[id].n,x,y+50,api.portrait?11:11,used?'rgba(255,240,208,.35)':'#fff0d4','center',{stroke:null});
     if(!api.touch)T(c,String(i+1),x-20,y-26,12,'#ffe08a','center',{stroke:null});}
   }
   if(S.phase==='garnish'){for(let i=0;i<4;i++){const x=g.gx+(i-1.5)*(api.portrait?100:110),y=g.shelfY+10;N.slab(c,x-42,y-34,84,84,16,'#4a3552',{depth:5});drawGarn(c,api,S.garOpts[i],x,y+4,1.2);T(c,GAR[S.garOpts[i]].n,x,y+66,11,'#fff0d4','center',{stroke:null});if(!api.touch)T(c,String(i+1),x-34,y-18,12,'#ffe08a','center',{stroke:null});}
    N.bar(c,g.gx-80,g.shelfY-70,160,8,S.garT/6,'#e08ac0');T(c,'GARNISH: '+GAR[S.rec.gar].n.toUpperCase(),g.gx,g.shelfY-78,14,'#ffe08a','center',{stroke:null});}
   if(S.phase==='serve'&&S.res){for(let i=0;i<5;i++){const x=g.gx+(i-2)*34,sc=i<S.res.stars?1.1:.7;c.save();c.translate(x,g.gy-g.gh*.75-18);c.scale(sc,sc);c.fillStyle=i<S.res.stars?'#ffd860':'rgba(255,255,255,.2)';c.beginPath();for(let k=0;k<10;k++){const a=-Math.PI/2+k*Math.PI/5,r=k%2?7:16;c.lineTo(Math.cos(a)*r,Math.sin(a)*r);}c.closePath();c.fill();c.strokeStyle='rgba(60,30,20,.6)';c.lineWidth=2;c.stroke();c.restore();}}
  }
  if(api.running&&S.rec)drawHUD(c,api,g);
  N.vignette(c,api.W,api.H,.35);
  if(!api.running){readyScreen(c,api,'MIXOLOGY MASTER','Run the bar: serve 8 customers their exact cocktails. Each drink is made in four steps - get all of them right for five stars and big tips.',[
   '1 PICK the recipe ingredients from the shelf (decoy bottles cost patience).','2 POUR each layer: hold, then release inside the gold band.','3 SHAKE: tap on every flash (shaken drinks only).','4 GARNISH: choose the right garnish before time runs out.','Stars drive score and streak bonus. 1-star drinks and walk-outs cost a heart.'],PAL.plum,
   'BEST '+(api.store.get('top',[])[0]||0)+' · FURTHEST ORDER '+(api.store.get('stage',0)+1)+'/8');}
 },
 pointerdown(x,y,e,api){
  if(S.phase==='pick'){for(let i=0;i<8;i++){if(Math.abs(x-geoX(api,i))<34&&Math.abs(y-geoY(api,i))<56){pick(api,i);return;}}}
  else if(S.phase==='pour'){if(!S.pouring&&S.pi<S.order.length){S.pouring=true;S.poured=0;sfx(api,'whoosh');}}
  else if(S.phase==='shake')shakeTap(api);
  else if(S.phase==='garnish'){const g=geo(api);for(let i=0;i<4;i++){const gx=g.gx+(i-1.5)*(api.portrait?100:110);if(Math.abs(x-gx)<46&&Math.abs(y-(g.shelfY+10))<50){garnish(api,i);return;}}}
 },
 pointerup(x,y,e,api){if(S.phase==='pour'&&S.pouring)pourEnd(api);},
 keydown(e,api){const k=e.key;
  if(/^[1-8]$/.test(k)){const i=+k-1;if(S.phase==='pick')pick(api,i);else if(S.phase==='garnish'&&i<4)garnish(api,i);return;}
  if(k===' '){if(S.phase==='pour'&&!S.pouring&&S.pi<S.order.length&&!e.repeat){S.pouring=true;S.poured=0;sfx(api,'whoosh');}else if(S.phase==='shake'&&!e.repeat)shakeTap(api);}
 },
 keyup(e,api){if(e.key===' '&&S.phase==='pour'&&S.pouring)pourEnd(api);},
 touch:[{kind:'btn',side:'right',label:'POUR / SHAKE',key:' ',big:true,cls:'alt'}],
 timeUp(api){S.win=false;realFinish(api);}
});
})();

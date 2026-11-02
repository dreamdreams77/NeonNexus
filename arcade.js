(()=>{'use strict';
const $=s=>document.querySelector(s),canvas=$('#stage'),ctx=canvas.getContext('2d'),overlay=$('#overlay');
const W=900,H=520,colors=['#ef8b75','#f2ce77','#8ec7a4','#8bb7dc'];
let keyboardAim=false;
const paper=document.createElement('canvas');paper.width=paper.height=256;const paperCtx=paper.getContext('2d');
let paperSeed=9173;const paperRand=()=>{paperSeed=(paperSeed*16807)%2147483647;return (paperSeed-1)/2147483646;};
for(let i=0;i<1050;i++){const x=paperRand()*256,y=paperRand()*256,a=.025+paperRand()*.07;paperCtx.fillStyle=paperRand()>.5?'rgba(255,239,207,'+a+')':'rgba(48,34,45,'+a+')';paperCtx.fillRect(x,y,1+paperRand()*2,1+paperRand()*1.4);}
for(let i=0;i<34;i++){paperCtx.strokeStyle='rgba(255,232,195,'+(.035+paperRand()*.04)+')';paperCtx.lineWidth=.5+paperRand();paperCtx.beginPath();const x=paperRand()*256,y=paperRand()*256;paperCtx.moveTo(x,y);paperCtx.lineTo(x+5+paperRand()*17,y+paperRand()*2-1);paperCtx.stroke();}
const paperPattern=ctx.createPattern(paper,'repeat');
const games={
skeeball:['COSMIC SKEE-BALL','Pull back and release to roll up the sculpted ramp. Aim for the centre rings.','Drag back · release','PRECISION'],
airhockey:['COMET AIR HOCKEY','Guard your goal and strike the puck past the little robot goalie. First to five wins.','Move your mallet','HEAD TO HEAD'],
billiards:['MOONLIGHT BILLIARDS','Play eight-ball against the house robot. Sink your group, then the 8-ball. Drag away from the cue ball to aim and shoot.','Drag back from cue ball to shoot · arrows + Enter','CPU POOL'],
whack:['MOON MOLES','Tap the clay moles when they pop up. Three misses end the round.','Tap the moles','REFLEX'],
target:['BUBBLE BLASTER','Pop drifting bubbles. Small bubbles are worth more; golden bubbles are worth extra.','Tap / click targets','MARKSMAN'],
memory:['PRISM SEQUENCE','Memorise the glowing colour sequence and repeat it. Each round adds a colour.','Tap the four tiles','MEMORY'],
rhythm:['BEAT FOUNDRY','Hit a note when it reaches the strike line. Use D F J K or tap its lane.','D · F · J · K / tap','RHYTHM'],
meteor:['METEOR MAYHEM','Dodge the falling rocks and collect glowing stars. Survive the whole round.','← → / A D / drag','SURVIVAL'],
racer:['TURBO TUNNELS','Circuit race against three rivals: steer, accelerate and brake around the clay track for three laps. Stay on the asphalt and hit the corners right.','↑ throttle · ↓ brake · ← → steer · touch: hold the sides to steer, top to brake','RACING'],
stack:['CLAY STACK','Drop each moving slab onto the tower. Misalignment trims the slab. Build as high as you can.','Tap / SPACE to drop','TIMING'],
pinball:['STARLIGHT PINBALL','Launch with SPACE. Hold ← and → to flip. Keep the ball alive; you have three balls.','SPACE · ← → / touch flippers','CLASSIC'],
claw:['LUCKY CLAW','The claw swings above the prize pit. Tap to lower it and try to grab a plush.','Tap / SPACE to grab','PRIZE SKILL'],
chef:['KITCHEN RUSH','Read each ticket and assemble the three ingredients in order. Wrong plates break your combo; clear as many tickets as possible.','Tap the three ingredients in ticket order','KITCHEN RUSH'],
sushi:['SUSHI CATCH','Slide your tray beneath falling fresh plates. Avoid spoiled fish and catch golden specials for bonus points.','Move tray with ← → / drag','PRECISION'],
mixology:['MIXOLOGY MASTER','Stop the pour in the target band. Each round narrows the band and speeds up the pour.','Tap / SPACE to pour','TIMING'],
pulse:['PULSE RUNNER','A side-scrolling action platformer. Leap across the foundry, blast sentry bots, collect energy cells and defeat the reactor guardian.','A / D or ← → move · SPACE jump · Z / tap fire','ACTION PLATFORMER'],
moto:['BARRELSTORM MOTO','Race a clay motorcycle across a dangerous stunt course. Accelerate, lean, jump ramps and dodge rolling barrels.','↑ accelerate · ↓ brake · ← → lean · SPACE jump / tap','MOTORCROSS'],
moonquest:['MOONSHARD LEGEND','Explore the overgrown ruins, battle little guardians, find three moonshards and unlock the ancient gate.','WASD / arrows move · SPACE / tap sword','ADVENTURE'],
ringtoss:['COMET RING TOSS','Toss eight clay rings onto three moving prize pegs. Read their drift, lead the target and build a clean streak.','Tap / click to throw · arrows adjust aim','CARNIVAL SKILL'],
gemdig:['MOON GEM DIG','Excavate the glowing dig site. Find six moon gems before your lantern runs out, but beware the cracked tiles.','Tap / click a tile to dig','EXPLORATION PUZZLE']
};
// Reward multiplier by cabinet skill demand: harder machines pay more per point.
const DIFFICULTY_TIER={skeeball:1,airhockey:1.25,billiards:1.35,whack:1,target:1,memory:1.1,rhythm:1.2,meteor:1,racer:1.1,stack:1.1,pinball:1.2,claw:1.3,chef:1.1,sushi:1,mixology:1.1,pulse:1.4,moto:1.3,moonquest:1.4,ringtoss:1.1,gemdig:1};
let game='',running=false,score=0,time=40,last=0,raf=0,objects=[],p={},mouse={x:450,y:400},swipeStartX=0,keys={},audio=null,muted=false,sequence=[],seqPos=0,seqPhase='show',seqClock=0,combo=0,round=0,particles=[],activeTableDuel=null,sequenceTimer=0;
const cpuLevel=()=>{const v=parseFloat($('#level-select')?.value);return v>0?v:1;};
const rand=(a,b)=>a+Math.random()*(b-a),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function sound(freq=440,dur=.08,type='sine',vol=.035){if(muted)return;try{audio=audio||new(window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume();const o=audio.createOscillator(),g=audio.createGain();o.type=type;o.frequency.setValueAtTime(freq,audio.currentTime);g.gain.setValueAtTime(vol,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+dur);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+dur);}catch{}}
function scoreBy(n){score+=n;$('#score').textContent=score;popText('+'+n,mouse.x,mouse.y,'#ffe08a');addParticles(mouse.x,mouse.y,n>=25?'#ffe08a':'#9de3d1',3);sound(Math.min(860,340+n*5),.055,'sine',.018);}
function awardStreak(points,x=mouse.x,y=mouse.y,color='#ffe08a'){combo++;p.bestCombo=Math.max(p.bestCombo||0,combo);const bonus=Math.min(30,Math.floor(combo/3)*5);scoreBy(points+bonus);if(combo>1)popText('STREAK ×'+combo,x,y,color);}
function popText(t,x,y,c){particles.push({text:t,x,y,vy:-35,life:.8,c});}
function addParticles(x,y,c,n=8){for(let i=0;i<n;i++)particles.push({x,y,vx:rand(-100,100),vy:rand(-150,30),life:rand(.3,.8),r:rand(2,6),c});}
function reset(){if(sequenceTimer)clearTimeout(sequenceTimer);sequenceTimer=0;score=0;time=40;objects=[];particles=[];p={x:450,y:420,lane:1,miss:0,hearts:3,balls:3,blocks:0,width:170,cx:450,clawX:200,clawY:125,clawDir:1,ballX:450,ballY:450,vx:0,vy:0,launched:false,drag:false,combo:0,bestCombo:0,goal:0,playerX:450,playerY:390,prevX:450,prevW:170,hitFlash:0,puck:{x:450,y:270,vx:0,vy:0},botX:450,botGoal:0};if(game==='ringtoss'){p.rings=8;p.ringX=450;p.ringY=420;p.ringFlight=null;p.pegs=[{x:300,y:215,phase:0,hit:false},{x:450,y:175,phase:2,hit:false},{x:600,y:215,phase:4,hit:false}];p.aim=450;}if(game==='gemdig'){p.digs=0;p.gems=0;p.misses=0;p.hearts=3;p.grid=Array.from({length:20},(_,i)=>({i,gem:Math.random()<.38,hazard:Math.random()<.13,revealed:false}));}sequence=[];seqPos=0;seqPhase='show';seqClock=0;combo=0;round=0;last=performance.now();$('#score').textContent='0';$('#time').textContent='40';$('#result').textContent='';}
function masteryLevel(xp){let level=0;for(const threshold of [100,260,480,760,1100,1500,2000])if(xp>=threshold)level++;return level;}
function renderMastery(id,record){const panel=$('#game-progression');if(!panel)return;const level=record?.level||0,xp=record?.xp||0,thresholds=[0,100,260,480,760,1100,1500,2000],next=thresholds[level+1]||2000,previous=thresholds[level]||0,progress=level>=7?100:Math.round(clamp((xp-previous)/Math.max(1,next-previous),0,1)*100),perk=level>=6?'ELITE PERK ACTIVE':level>=4?'SPECIALIST PERK ACTIVE':level>=2?'FIRST PERK ACTIVE':'NEXT PERK AT LEVEL 2',today=new Date().toISOString().slice(0,10),saved=readPlayer(),sessions=(saved.arcadeSessions||[]).filter(s=>new Date(s.at||0).toISOString().slice(0,10)===today),distinct=new Set(sessions.map(s=>s.game)).size,claimed=saved.dailyCircuitClaimed===today,complete=distinct>=3;panel.innerHTML='<div class="mastery-heading"><span>✦ CABINET MASTERY</span><b>LEVEL '+level+'</b></div><div class="mastery-track"><i style="width:'+progress+'%"></i></div><div class="mastery-meta"><span>'+xp+' XP · '+progress+'% TO NEXT LEVEL</span><span>BEST '+(record?.bestScore||0)+'</span></div><p>'+perk+' · '+(record?.lastPerk||'Keep playing to unlock a cabinet-specific ability.')+'</p><div class="daily-circuit"><div><b>✦ DAILY DISTRICT CIRCUIT</b><small>Play 3 different cabinets today · '+Math.min(3,distinct)+' / 3</small></div><button type="button" class="daily-claim" '+(!complete||claimed?'disabled':'')+'>'+(claimed?'REWARD CLAIMED':complete?'CLAIM 80 TICKETS':'IN PROGRESS')+'</button></div>';const claim=panel.querySelector('.daily-claim');claim?.addEventListener('click',()=>{const latest=readPlayer(),date=new Date().toISOString().slice(0,10),played=new Set((latest.arcadeSessions||[]).filter(s=>new Date(s.at||0).toISOString().slice(0,10)===date).map(s=>s.game));if(played.size<3||latest.dailyCircuitClaimed===date)return;latest.dailyCircuitClaimed=date;latest.tickets=(Number(latest.tickets)||0)+80;latest.ticketHistory=latest.ticketHistory||[];latest.ticketHistory.unshift({game:'daily-circuit',score:played.size,amount:80,at:Date.now()});writePlayer(latest);window.dispatchEvent(new CustomEvent('nexus:wallet-updated'));renderMastery(id,latest.arcadeMastery?.[id]);});panel.hidden=false;}
function open(id){game=id;keyboardAim=false;const d=games[id],pointerKeys=['skeeball','airhockey','billiards','whack','target','memory','stack','pinball','claw','chef','mixology'],pcHint=pointerKeys.includes(id)?' · PC: ARROWS + ENTER':' · PC: ARROW KEYS';overlay.dataset.game=id;$('#game-title').textContent=d[0];$('#game-help').textContent=d[1];$('#control-hint').textContent=d[2]+pcHint;$('#game-type').textContent=d[3];overlay.hidden=false;$('#start').textContent='START GAME';{const lp=$('#level-pick'),ls=$('#level-select');if(lp&&ls){lp.hidden=id!=='airhockey';try{ls.value=localStorage.getItem('neon-nexus-cpu-level')||'1';}catch(e){}if(!ls.value)ls.value='1';}}reset();renderMastery(id,readPlayer().arcadeMastery?.[id]);draw();window.dispatchEvent(new CustomEvent('nexus:game3d-open',{detail:{gameId:id}}));}
document.addEventListener('change',e=>{if(e.target.id==='level-select'){try{localStorage.setItem('neon-nexus-cpu-level',e.target.value);}catch(err){}}});
if(location.search.includes('debug'))window.__arc={get p(){return p;},get objects(){return objects;},get game(){return game;},get score(){return score;},get time(){return time;},set time(v){time=v;},get running(){return running;},get combo(){return combo;},get mouse(){return mouse;}};
window.nexusPlayArcadeGame=open;
function buildMoonRoom(room){
 const layouts=[
  {trees:[[155,165],[250,175],[640,170],[735,180],[210,350],[690,345]],enemies:[[235,300],[655,310]],shard:[450,235],chest:[730,390]},
  {trees:[[160,180],[275,155],[625,165],[750,185],[165,350],[745,355]],enemies:[[250,260],[650,265],[450,350]],shard:[450,205],chest:[175,390]},
  {trees:[[170,175],[730,175],[170,355],[730,355]],enemies:[],shard:[450,185],chest:null}
 ];
 const layout=layouts[room];objects=[];
 layout.trees.forEach(([x,y],i)=>objects.push({type:'tree',x,y,r:28+(i%3)*4}));
 layout.enemies.forEach(([x,y],i)=>objects.push({type:'enemy',x,y,hp:room===1?3:2,phase:i,stun:0}));
 objects.push({type:'shard',x:layout.shard[0],y:layout.shard[1],taken:false});
 if(layout.chest)objects.push({type:'chest',x:layout.chest[0],y:layout.chest[1]});
 objects.push({type:'gate',x:450,y:125});
 if(room===2)objects.push({type:'boss',x:450,y:265,hp:12,maxHp:12,attack:1.8,telegraph:0});
}
function start(){reset();p.masteryLevel=readPlayer().arcadeMastery?.[game]?.level||0;if(game==='meteor')p.starShield=p.masteryLevel>=2?1:0;if(game==='racer')p.crashLimit=3+(p.masteryLevel>=2?1:0);if(game==='airhockey')p.malletReach=43+(p.masteryLevel>=2?8:0);if(game==='pinball')p.balls=3+(p.masteryLevel>=2?1:0);if(game==='claw')p.clawReach=p.masteryLevel>=2?34:24;if(activeTableDuel){const saved=readPlayer(),balance=Number(saved.tokens??250);if(balance<activeTableDuel.stake){$('#result').textContent='You need '+activeTableDuel.stake+' tokens to enter this match.';return;}saved.tokens=balance-activeTableDuel.stake;writePlayer(saved);p.tableDuel={...activeTableDuel};}running=true;
if(game==='airhockey'){if(p.tableDuel){time=180;$('#time').textContent='180';}p.puck={x:450,y:270,vx:rand(-110,110),vy:210};p.botX=450;p.playerX=450;p.goal=0;p.botGoal=0;p.rally=0;p.aiMood='guard';p.serveClock=.65;}
if(game==='billiards'){time=300;$('#time').textContent='300';p.current='player';p.playerGroup=null;p.cpuGroup=null;p.playerPotted=[];p.cpuPotted=[];p.shotActive=false;p.turnPocketed=0;p.turnFoul=false;p.cueScratch=false;p.settleClock=0;p.cpuWait=0;p.cue={x:450,y:365,vx:0,vy:0,number:0,r:10.5};objects=[];const rack=[];for(let row=0;row<5;row++)for(let col=0;col<=row;col++){const number=rack.length+1;const x=450+(col-row/2)*22,z=195+row*22;const ball={type:'poolball',x,y:z,vx:0,vy:0,r:10.5,number};rack.push(ball);objects.push(ball);}const eight=rack[4],swap=rack[7];eight.number=8;swap.number=5;}
if(game==='pinball'){p.ballX=450;p.ballY=458;p.vy=0;makeBumpers();}
if(game==='claw'){objects=Array.from({length:10},(_,i)=>({x:220+(i%5)*115,y:350+Math.floor(i/5)*55,r:rand(17,24),c:colors[i%4],kind:i%4}));
}
if(game==='pulse'){p.x=105;p.y=390;p.vx=0;p.vy=0;p.grounded=false;p.camera=0;p.hp=3+(p.masteryLevel>=2?1:0)+(p.masteryLevel>=6?1:0);p.energy=12+(p.masteryLevel>=4?3:0);p.stage=0;p.bossHp=8;p.invuln=0;objects=[{type:'platform',x:0,y:455,w:540,h:65},{type:'platform',x:610,y:405,w:260,h:115},{type:'platform',x:950,y:455,w:420,h:65},{type:'platform',x:1450,y:395,w:280,h:125},{type:'platform',x:1810,y:455,w:620,h:65}];for(let i=0;i<11;i++)objects.push({type:'enemy',x:350+i*175,y:i%3===0?355:415,hp:2,phase:Math.random()*6,shot:0});for(let i=0;i<8;i++)objects.push({type:'cell',x:230+i*260,y:i%2?320:390});objects.push({type:'boss',x:2180,y:390,hp:8,shot:0,phase:0});}
if(game==='moto'){p.x=180;p.y=355;p.vx=0;p.vy=0;p.speed=0;p.angle=0;p.air=0;p.wheel=0;p.hp=3+(p.masteryLevel>=2?1:0);p.maxSpeed=430+(p.masteryLevel>=6?45:0);p.handling=p.masteryLevel>=4?1.22:1;p.distance=0;p.camera=0;p.invuln=0;objects=[];for(let i=0;i<24;i++){const x=520+i*155;objects.push({type:i%5===2?'ramp':i%4===0?'gap':'barrel',x,y:i%2?405:420,hit:false});}for(let i=0;i<8;i++)objects.push({type:'token',x:650+i*420,y:300-(i%3)*45});}
if(game==='ringtoss'){time=45;p.rings=8;p.ringX=450;p.ringY=420;p.ringFlight=null;p.pegs=[{x:300,y:215,phase:0,hit:false},{x:450,y:175,phase:2,hit:false},{x:600,y:215,phase:4,hit:false}];p.aim=450;}
if(game==='gemdig'){time=55;p.digs=0;p.gems=0;p.misses=0;p.hearts=3;p.grid=Array.from({length:20},(_,i)=>({i,gem:Math.random()<.38,hazard:Math.random()<.13,revealed:false}));}
if(game==='moonquest'){time=150;$('#time').textContent='150';p.x=450;p.y=420;p.maxHp=6+(p.masteryLevel>=2?1:0);p.hp=p.maxHp;p.invuln=0;p.facing=1;p.swing=0;p.swingSerial=0;p.targetX=null;p.targetY=null;p.chestOpened=false;p.shards=0;p.room=0;p.swordLevel=1+(p.masteryLevel>=4?1:0);p.shield=true;p.boots=p.masteryLevel>=6;p.bossDefeated=false;p.guard=false;buildMoonRoom(0);}
if(game==='chef'){p.ticket=0;p.step=0;p.combo=0;p.ticketClock=0;p.ticketTarget=[1,3,0];p.misses=0;}
if(game==='sushi'){p.x=450;p.miss=0;p.spawnClock=.5;p.catchStreak=0;p.catchWidth=52+(p.masteryLevel>=2?12:0);}
if(game==='mixology'){p.pour=0;p.pourDir=1;p.mixRound=1;p.perfects=0;p.misses=0;}
if(game==='memory')nextSequence();if(game==='rhythm')initRhythm();if(game==='racer')initRace();
if(game==='stack'){p.width=170;p.cx=450;p.blocks=0;p.blockX=450;}
if(game==='whack')spawnMoles();
if(game==='skeeball'){p.ballX=450;p.ballY=415;}
if(game==='chef'){window.dispatchEvent(new CustomEvent('nexus:game3d-start'));return;}raf=requestAnimationFrame(loop);}
function finish(win=false){if(!running)return;running=false;cancelAnimationFrame(raf);if(sequenceTimer)clearTimeout(sequenceTimer);sequenceTimer=0;if(win)window.dispatchEvent(new CustomEvent('nexus:character-celebrate'));const tier=(DIFFICULTY_TIER[game]||1)*(game==='airhockey'?(cpuLevel()>1?1.25:cpuLevel()<1?.8:1):1),priorBest=Number(readPlayer().arcadeBest?.[game])||0,newBest=priorBest>0&&score>priorBest,earned=p.tableDuel?(win?p.tableDuel.payout:0):Math.max(2,Math.round((Math.floor(score/7)+(win?12:0)+Math.min(15,Math.floor(combo/3)))*tier));const ticketsEarned=Math.max(2,Math.round((Math.floor(score/9)+(win?12:0)+Math.min(18,Math.floor(combo/3)))*tier))+(newBest?4:0);const cabinetLevel=Number(readPlayer().arcadeMastery?.[game]?.level)||0,masteryTicketBonus=Math.min(12,Math.floor(cabinetLevel/2)*2),payoutTickets=ticketsEarned+masteryTicketBonus;$('#result').textContent=(p.tableDuel?(win?'MATCH WON · ':'MATCH LOST · ')+score+' POINTS · '+(win?'RETURN '+earned+' TOKENS':'ENTRY FEE LOST'):(win?'CABINET CLEARED! ':'ROUND OVER · ')+score+' POINTS · +'+earned+' TOKENS')+' · +'+payoutTickets+' TICKETS · MASTERY BONUS +'+masteryTicketBonus+(tier!==1?' · DIFFICULTY ×'+tier.toFixed(2):'')+(newBest?' · NEW PERSONAL BEST +4':'')+(p.gradeLabel?' · '+p.gradeLabel:'')+' · BEST STREAK ×'+(p.bestCombo||0);$('#start').textContent='PLAY AGAIN';sound(win?880:190,.22,'triangle');try{const key='neon-nexus-player-v1',saved=JSON.parse(localStorage.getItem(key)||'{}');saved.tokens=(Number(saved.tokens??250)||0)+earned;saved.tickets=(Number(saved.tickets)||0)+payoutTickets;saved.ticketHistory=saved.ticketHistory||[];saved.ticketHistory.unshift({game,score,amount:payoutTickets,baseAmount:ticketsEarned,masteryBonus:masteryTicketBonus,at:Date.now()});saved.ticketHistory=saved.ticketHistory.slice(0,30);saved.arcadeBest=saved.arcadeBest||{};saved.arcadeBest[game]=Math.max(Number(saved.arcadeBest[game])||0,score);saved.arcadeStats=saved.arcadeStats||{};const stats=saved.arcadeStats[game]||{plays:0,wins:0,bestCombo:0,bestScore:0};stats.plays++;if(win)stats.wins++;stats.bestCombo=Math.max(stats.bestCombo,Number(p.bestCombo)||0);stats.bestScore=Math.max(stats.bestScore,score);stats.lastPlayed=Date.now();saved.arcadeStats[game]=stats;saved.arcadeMastery=saved.arcadeMastery||{};const prior=saved.arcadeMastery[game]||{xp:0,level:0,bestScore:0,bestStreak:0},oldLevel=masteryLevel(prior.xp||0),xpGain=Math.max(15,Math.floor(score*.6)+(win?45:0)+(Number(p.bestCombo)||0)*4);prior.xp=(Number(prior.xp)||0)+xpGain;prior.level=masteryLevel(prior.xp);prior.bestScore=Math.max(prior.bestScore||0,score);prior.bestStreak=Math.max(prior.bestStreak||0,Number(p.bestCombo)||0);prior.lastPerk=prior.level>=6?'Elite cabinet perk active':prior.level>=4?'Specialist cabinet perk active':prior.level>=2?'First cabinet perk active':'No perk unlocked yet';prior.lastGain=xpGain;saved.arcadeMastery[game]=prior;saved.arcadeSessions=saved.arcadeSessions||[];saved.arcadeSessions.unshift({game,score,win,bestCombo:p.bestCombo||0,at:Date.now()});saved.arcadeSessions=saved.arcadeSessions.slice(0,25);localStorage.setItem(key,JSON.stringify(saved));$('#arcade-tokens').textContent=saved.tokens;$('#arcade-tickets').textContent=saved.tickets;renderMastery(game,prior);if(prior.level>oldLevel)popText('MASTERY LEVEL '+prior.level+' UNLOCKED',450,110,'#f6d18a');}catch{}}
function rounded(x,y,w,h,r,c){ctx.fillStyle=c;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();ctx.strokeStyle='rgba(55,39,51,.23)';ctx.lineWidth=Math.max(1.1,Math.min(2.1,w*.003));ctx.stroke();}
function circle(x,y,r,c){ctx.fillStyle=c;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();if(r>5){ctx.strokeStyle='rgba(55,39,51,.24)';ctx.lineWidth=Math.max(1,r*.035);ctx.stroke();}}
function clay(x,y,r,c){ctx.save();ctx.translate(x,y);ctx.rotate(Math.sin(x*.013+y*.017)*.07);ctx.fillStyle=c;ctx.beginPath();ctx.moveTo(-r*.92,-r*.12);ctx.bezierCurveTo(-r,-r*.8,r*.35,-r*1.12,r*.84,-r*.45);ctx.bezierCurveTo(r*1.15,r*.15,r*.48,r*.98,-r*.22,r*.92);ctx.bezierCurveTo(-r*.85,r*.82,-r*1.08,r*.38,-r*.92,-r*.12);ctx.fill();ctx.globalAlpha=.22;ctx.strokeStyle='#fff5d9';ctx.lineWidth=Math.max(1,r*.07);ctx.beginPath();ctx.arc(-r*.12,-r*.13,r*.7,Math.PI*1.08,Math.PI*1.78);ctx.stroke();ctx.globalAlpha=.16;ctx.strokeStyle='#50394c';ctx.beginPath();ctx.arc(r*.1,r*.08,r*.83,.2,1.1);ctx.stroke();ctx.globalAlpha=.2;ctx.strokeStyle='#5c3e4c';ctx.lineWidth=Math.max(1,r*.035);ctx.beginPath();ctx.moveTo(-r*.72,r*.24);ctx.quadraticCurveTo(-r*.48,r*.42,-r*.19,r*.37);ctx.stroke();ctx.globalAlpha=.13;for(let i=0;i<5;i++){const fx=Math.sin(i*12.7+x*.03)*r*.52,fy=Math.cos(i*8.3+y*.02)*r*.48;ctx.fillStyle='#fff0cf';ctx.beginPath();ctx.ellipse(fx,fy,Math.max(.7,r*.025),Math.max(.5,r*.014),i*.6,0,Math.PI*2);ctx.fill();}ctx.restore();}
function panel(x,y,w,h,c='#f1d9b8'){rounded(x+4,y+7,w,h,25,'#17162955');rounded(x,y,w,h,25,c);rounded(x+7,y+6,w-14,12,7,'#ffffff30');}
const gameArt={
 skeeball:['#f5c98b','#a65d55','#4c3447','CARNIVAL · LANE 01'],
 airhockey:['#b9e3dc','#4c8b91','#244d60','ICE RINK · MATCH ARENA'],
 billiards:['#7caa83','#285e4d','#183b38','POOL HALL · TABLE 8'],
 whack:['#c4d69a','#65865a','#354b3d','GARDEN PATCH · NIGHT SHIFT'],
 target:['#f5b4bd','#a94f70','#512d53','SKY FAIR · TARGET RANGE'],
 memory:['#b8b6ed','#62569b','#292c58','PRISM TEMPLE · SEQUENCE TRIAL'],
 rhythm:['#f0a6ce','#8a4d9b','#30234f','BEAT STAGE · LIVE SET'],
 meteor:['#9baedb','#4d5c91','#222b50','DEEP SPACE · ASTEROID BELT'],
 racer:['#e7a36d','#9c5949','#402d42','TURBO CIRCUIT · LAP 01'],
 stack:['#edc68c','#b57a55','#55404b','BUILD YARD · TOWER TRIAL'],
 pinball:['#c5a6e5','#70518e','#302447','STAR ARCADE · PINBALL BAY'],
 claw:['#e7b1a5','#a65c68','#51364b','PRIZE DEPOT · CLAW PIT'],
 chef:['#e7bd8d','#a96955','#4c3b43','OPEN KITCHEN · SERVICE RUSH'],
 sushi:['#a7d4c4','#4f8c80','#294e4a','SUSHI BAR · CONVEYOR RUN'],
 mixology:['#c5a6dc','#76518d','#352949','MOON BAR · POUR CHALLENGE'],
 pulse:['#9bcbd1','#477c91','#25364e','ROBOT FOUNDRY · SECTOR 07'],
 moto:['#e8a16e','#a65346','#422d3a','CANYON TRACK · STUNT RUN'],
 moonquest:['#b5afd9','#645c91','#2b2c4b','MOON RUINS · LOST KINGDOM'],
 ringtoss:['#efc88d','#a76b54','#49384a','BOARDWALK · PRIZE ALLEY'],
 gemdig:['#9dcfc4','#4f817d','#293e49','CRYSTAL CAVERN · DIG SITE']
};
function base(title,sub){
 const art=gameArt[game]||['#63516a','#443d58','#282d43','NEXUS ARCADE'];
 const g=ctx.createLinearGradient(0,0,900,520);g.addColorStop(0,art[0]);g.addColorStop(.55,art[1]);g.addColorStop(1,art[2]);ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
 const glow=ctx.createRadialGradient(450,250,30,450,250,470);glow.addColorStop(0,'rgba(255,239,205,.23)');glow.addColorStop(.62,'rgba(255,255,255,.035)');glow.addColorStop(1,'rgba(12,16,30,.35)');ctx.fillStyle=glow;ctx.fillRect(0,0,W,H);
 // Each cabinet gets its own illustrated venue rather than a view of the arcade floor.
 ctx.save();ctx.globalAlpha=.16;ctx.strokeStyle='#fff0d0';ctx.lineWidth=2;
 if(['airhockey','billiards','skeeball','ringtoss'].includes(game)){for(let y=100;y<490;y+=64){ctx.beginPath();ctx.moveTo(28,y);ctx.lineTo(872,y+((y/64)%2?5:-5));ctx.stroke();}}
 else if(['meteor','moonquest','gemdig','pulse'].includes(game)){for(let i=0;i<58;i++){const x=(i*173+31)%900,y=(i*97+19)%490;circle(x,y,1.2+(i%4),i%3?'#fff0d0':'#b8f0e4');}}
 else if(['chef','sushi','mixology'].includes(game)){for(let i=0;i<9;i++){const x=48+i*101;ctx.beginPath();ctx.ellipse(x,115+(i%2)*16,34,12,0,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.moveTo(x-20,430);ctx.quadraticCurveTo(x,410+(i%3)*8,x+24,432);ctx.stroke();}}
 else if(['racer','moto'].includes(game)){for(let i=0;i<12;i++){const x=i*88-30;ctx.beginPath();ctx.moveTo(x,90);ctx.lineTo(x+48,90);ctx.lineTo(x+18,490);ctx.stroke();}}
 else {for(let i=0;i<18;i++){const x=(i*137)%900,y=90+(i*79)%390;ctx.beginPath();ctx.arc(x,y,12+(i%4)*5,.2,2.8);ctx.stroke();}}
 ctx.restore();
 // Fine printed grain and imperfect ink lines keep the screen in the same handmade universe.
 for(let i=0;i<85;i++){ctx.globalAlpha=.055;circle((i*137)%W,(i*79)%H,1.2+(i%3)*.55,'#fff');}ctx.globalAlpha=1;
 ctx.fillStyle='#fff0d4';ctx.font='700 29px Kalam, cursive';ctx.fillText(title,30,39);
 ctx.fillStyle='rgba(255,241,215,.82)';ctx.font='16px Kalam, cursive';ctx.fillText(sub,30,64);
 ctx.textAlign='right';ctx.fillStyle='rgba(255,240,213,.75)';ctx.font='bold 11px Fredoka';ctx.fillText(art[3],870,64);ctx.textAlign='left';
 if(combo>0){ctx.textAlign='right';ctx.fillStyle=combo>=10?'#ffcf82':'#f3c6a2';ctx.font='bold 16px Fredoka';ctx.fillText('STREAK ×'+combo,865,38);ctx.textAlign='left';}
 if(running){const level=1+Math.floor(score/120);ctx.fillStyle='rgba(25,20,35,.35)';ctx.fillRect(690,82,178,30);ctx.fillStyle='#fff0d4';ctx.font='bold 13px Fredoka';ctx.textAlign='right';ctx.fillText('STAGE '+String(level).padStart(2,'0')+'  ·  '+score+' PTS',855,102);ctx.textAlign='left';}
 for(let i=0;i<4;i++){ctx.globalAlpha=.12;ctx.strokeStyle='#fff0d4';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(20+i*5,490+i*4);ctx.lineTo(880-i*7,490+i*4);ctx.stroke();}ctx.globalAlpha=1;
}
function draw(){
base(games[game]?.[0]||'NEXUS ARCADE','HAND-SCULPTED CABINET  ·  '+(running?'PLAYING':'READY'));
switch(game){
case'skeeball':panel(85,90,730,390,'#b97f70');rounded(115,120,670,330,22,'#e8c79e');ctx.fillStyle='#956b68';ctx.beginPath();ctx.moveTo(175,435);ctx.lineTo(330,160);ctx.quadraticCurveTo(450,125,570,160);ctx.lineTo(725,435);ctx.closePath();ctx.fill();[90,55,27].forEach((r,i)=>{clay(450,220,r,['#8e678f','#d6a45e','#f5e1ae'][i]);circle(450,220,r*.64,'#55445f');ctx.fillStyle='#fff3d6';ctx.font='bold 17px Fredoka';ctx.textAlign='center';ctx.fillText([20,50,100][i],450,226);});clay(p.ballX,p.ballY,22,'#e98668');ctx.fillStyle='#5c4656';ctx.font='14px Fredoka';ctx.textAlign='center';ctx.fillText('PULL BACK  ↗  RELEASE',450,465);break;
case'airhockey':panel(110,85,680,390,'#b77c72');rounded(135,110,630,340,22,'#b9d8cf');ctx.strokeStyle='#fff2d9';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(150,280);ctx.lineTo(750,280);ctx.stroke();ctx.strokeRect(365,110,170,42);ctx.strokeRect(365,408,170,42);circle(450,280,66,'#e8ead9');ctx.fillStyle='#8a6673';ctx.fillRect(150,112,600,8);ctx.fillRect(150,440,600,8);clay(p.puck.x,p.puck.y,15,'#c85e66');clay(p.botX,150,26,'#8b759e');clay(p.playerX||mouse.x,410,27,'#edaa68');ctx.fillStyle='#493847';ctx.font='bold 18px Fredoka';ctx.fillText('YOU  '+p.goal+'   :   '+p.botGoal,150,500);ctx.font='13px Fredoka';ctx.fillText('RALLY '+(p.rally||0)+'  ·  '+(p.aiMood||'GUARD').toUpperCase(),560,500);break;
case'billiards':{
 panel(90,72,720,420,'#875c4f');rounded(125,104,650,335,18,'#356d59');rounded(138,117,624,309,12,'#47836b');
 const pockets=[[145,124],[450,124],[755,124],[145,420],[450,420],[755,420]];
 pockets.forEach(([x,y])=>{const g=ctx.createRadialGradient(x-3,y-3,2,x,y,24);g.addColorStop(0,'#171624');g.addColorStop(.75,'#282332');g.addColorStop(1,'#9c725c');circle(x,y,23,g);});
 ctx.strokeStyle='#d7b17d';ctx.lineWidth=3;ctx.strokeRect(151,130,598,283);
 const drawPoolBall=(b)=>{const colorsPool=['#f4e7c9','#e9c16e','#79a9c2','#d97e78','#9a86bd','#80b68d','#d58c65','#282638','#f1dfb2','#e9c16e','#79a9c2','#d97e78','#9a86bd','#80b68d','#d58c65','#c7a5d0'];const color=colorsPool[b.number]||'#f1dfb2';ctx.save();ctx.shadowColor='#152a24';ctx.shadowBlur=7;ctx.shadowOffsetY=3;const grad=ctx.createRadialGradient(b.x-4,b.y-5,1,b.x,b.y,b.r+2);grad.addColorStop(0,'#fff9e9');grad.addColorStop(.24,color);grad.addColorStop(1,'#342c39');circle(b.x,b.y,b.r,grad);ctx.shadowBlur=0;ctx.shadowOffsetY=0;if(b.number>8){ctx.fillStyle='#f7edda';ctx.fillRect(b.x-b.r,b.y-4,b.r*2,8);}if(b.number===8){ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(b.x,b.y,4,0,Math.PI*2);ctx.fill();}else{ctx.fillStyle='#fff8e8';ctx.beginPath();ctx.arc(b.x,b.y,5,0,Math.PI*2);ctx.fill();ctx.fillStyle='#4b3a46';ctx.font='bold 7px Fredoka';ctx.textAlign='center';ctx.fillText(String(b.number),b.x,b.y+2.5);}ctx.restore();};
 objects.filter(b=>b.type==='poolball'&&!b.pocketed).forEach(drawPoolBall);if(p.cue)drawPoolBall(p.cue);
 if(p.cue&&p.current==='player'&&!p.shotActive){const dx=mouse.x-p.cue.x,dy=mouse.y-p.cue.y,len=Math.max(1,Math.hypot(dx,dy)),ux=dx/len,uy=dy/len;ctx.save();ctx.strokeStyle='#e8c69a';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(p.cue.x-ux*24,p.cue.y-uy*24);ctx.lineTo(p.cue.x-ux*(p.aiming?100+Math.min(70,len*.5):68),p.cue.y-uy*(p.aiming?100+Math.min(70,len*.5):68));ctx.stroke();ctx.restore();}
 ctx.fillStyle='#fff0d4';ctx.font='bold 17px Fredoka';ctx.textAlign='left';ctx.fillText('YOU  '+(p.playerPotted||[]).length+'  ·  CPU  '+(p.cpuPotted||[]).length,150,475);ctx.textAlign='right';ctx.fillText((p.current||'PLAYER').toUpperCase()+' TURN',750,475);ctx.textAlign='center';ctx.font='13px Fredoka';ctx.fillText(p.playerGroup?'YOU: '+p.playerGroup.toUpperCase()+'  ·  CPU: '+p.cpuGroup.toUpperCase():'OPEN TABLE · FIRST POT CLAIMS A GROUP',450,495);break;}
case'whack':panel(120,90,660,390,'#c5a184');for(let i=0;i<9;i++){const x=230+(i%3)*220,y=180+Math.floor(i/3)*112;clay(x,y+22,49,'#775b54');clay(x,y+17,38,'#9b7263');const mole=objects.find(o=>o.id===i);if(mole){clay(x,y-4,31,'#9dbd8b');circle(x-11,y-9,4,'#352a37');circle(x+11,y-9,4,'#352a37');circle(x,y+4,5,'#6b4c54');}else{clay(x,y+28,25,'#56465b');}}ctx.fillStyle='#fff0d1';ctx.font='bold 17px Fredoka';ctx.fillText('MISSES LEFT  '+(3-p.miss),145,465);break;
case'target':panel(90,90,720,390,'#554b66');for(const o of objects){clay(o.x,o.y,o.r,o.gold?'#f4d27a':'#e7a1b5');circle(o.x-o.r*.2,o.y-o.r*.22,o.r*.22,'#fff4db');circle(o.x,o.y,o.r*.48,o.gold?'#e59d52':'#8b6c9a');}break;
case'memory':panel(170,90,560,390,'#54445f');for(let i=0;i<4;i++){const x=260+(i%2)*200,y=155+Math.floor(i/2)*145;rounded(x,y,165,115,24,colors[i]);rounded(x+7,y+7,151,101,20,'#ffffff18');if(seqPhase==='show'&&sequence[seqPos]===i){ctx.strokeStyle='#fff8d8';ctx.lineWidth=8;ctx.strokeRect(x+5,y+5,155,105);}}ctx.fillStyle='#fff4dd';ctx.font='bold 19px Fredoka';ctx.textAlign='center';ctx.fillText(seqPhase==='show'?'WATCH THE PATTERN':'YOUR TURN  ·  '+(seqPos+1)+' / '+sequence.length,450,465);break;
case'rhythm':{panel(110,90,680,390,'#55445f');const r=p.rh;
 for(let l=0;l<4;l++){const lx=200+l*165;ctx.fillStyle='rgba(255,240,214,'+(.06+(r?r.flash[l]*.22:0))+')';ctx.fillRect(lx-66,100,132,330);}
 ctx.strokeStyle='#f5d27d';ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(145,390);ctx.lineTo(755,390);ctx.stroke();
 if(r){ctx.strokeStyle='rgba(255,236,170,'+(.15+r.pulse*.5)+')';ctx.lineWidth=2+r.pulse*8;ctx.beginPath();ctx.moveTo(145,390);ctx.lineTo(755,390);ctx.stroke();
  for(const n of r.notes){if(n.state!==0)continue;const y=390-(n.t-r.t)*RH_SPEED;if(y<95||y>440)continue;clay(200+n.lane*165,y,20,colors[n.lane]);}
  ctx.textAlign='center';if(r.judgeT>0){ctx.globalAlpha=Math.min(1,r.judgeT*2.2);ctx.fillStyle=r.judgeCol;ctx.font='bold '+(26+r.judgeT*10|0)+'px Fredoka';ctx.fillText(r.judge,450,300-(.6-r.judgeT)*30);ctx.globalAlpha=1;}
  const tot=r.j.perfect+r.j.good+r.j.ok+r.j.miss,acc=tot?Math.round((r.j.perfect+r.j.good*.7+r.j.ok*.4)/(tot+r.stray*.5)*100):100;
  ctx.fillStyle='#f5d27d';ctx.font='bold 14px Fredoka';ctx.fillText(r.bpm+' BPM  ·  ACCURACY '+acc+'%  ·  PERFECT '+r.j.perfect+'  GOOD '+r.j.good+'  OK '+r.j.ok+'  MISS '+r.j.miss,450,112);
  if(r.t<r.beat*3){ctx.fillStyle='#fff0d4';ctx.font='bold 34px Fredoka';ctx.fillText(String(Math.max(1,3-Math.floor(r.t/r.beat))),450,250);}}
 ['D','F','J','K'].forEach((k,i)=>{clay(200+i*165,390,29,'#a87c93');ctx.fillStyle='#fff';ctx.font='bold 18px Fredoka';ctx.textAlign='center';ctx.fillText(k,200+i*165,397);});ctx.fillStyle='#f5d27d';ctx.font='bold 16px Fredoka';ctx.fillText('COMBO  '+combo,450,465);break;}
case'meteor':panel(155,85,590,400,'#39354f');for(const o of objects){clay(o.x,o.y,o.r,o.star?'#f6d77e':'#c98b77');if(o.star)circle(o.x,o.y,5,'#fff4c7');}clay(p.x,430,25,'#8bd0bd');clay(p.x-4,422,8,'#fff1d4');break;
case'racer':drawRace();break;
case'stack':panel(150,85,600,400,'#54445f');for(let i=0;i<p.blocks;i++)rounded(p.blockX-p.width/2,420-i*27,p.width,25,7,colors[i%4]);rounded(p.x-p.width/2,420-p.blocks*27,p.width,25,7,'#f1ba78');ctx.fillStyle='#f8e8c8';ctx.font='14px Fredoka';ctx.textAlign='center';ctx.fillText('TOWER HEIGHT  '+p.blocks,450,465);break;
case'pinball':panel(265,75,370,420,'#66516f');rounded(290,100,320,370,70,'#382f4a');for(const b of p.bumpers||[]){clay(b.x,b.y,b.r,'#e7bd70');}clay(p.ballX,p.ballY,13,'#fff0ce');clay(375,440,42,'#e98d76');clay(525,440,42,'#e98d76');ctx.fillStyle='#fff0d0';ctx.font='bold 14px Fredoka';ctx.textAlign='center';ctx.fillText('BALLS  '+p.balls,450,485);break;
case'claw':panel(120,85,660,400,'#a17a74');rounded(145,110,610,340,18,'#d8b99a');for(const o of objects)clay(o.x,o.y,o.r,o.c);ctx.strokeStyle='#5b4656';ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(p.clawX,115);ctx.lineTo(p.clawX,p.clawY);ctx.stroke();rounded(p.clawX-23,p.clawY,46,23,8,'#7a5866');break;
case'chef':panel(105,88,690,370,'#d5b99e');ctx.fillStyle='#69444c';ctx.font='bold 22px Fredoka';ctx.fillText('TICKET '+(p.ticket+1)+'  ·  BUILD THE ORDER',145,135);const foods=['🥬','🍅','🧀','🍞'];for(let i=0;i<4;i++){const x=190+i*145;rounded(x,210,112,112,18,'#f6e4c7');ctx.font='54px sans-serif';ctx.fillText(foods[i],x+25,282);ctx.fillStyle='#60434a';ctx.font='13px Fredoka';ctx.fillText(['LETTUCE','TOMATO','CHEESE','BREAD'][i],x+14,345);}ctx.fillStyle='#6a4c55';ctx.font='bold 18px Fredoka';ctx.fillText('ORDER: '+(p.ticketTarget||[1,3,0]).map(i=>['LETTUCE','TOMATO','CHEESE','BREAD'][i]).join('  →  '),145,410);ctx.fillText('STEP '+((p.step||0)+1)+' / 3   ·   COMBO '+(p.combo||0)+'   ·   MISSES '+(p.misses||0)+'/3',145,445);ctx.fillStyle='#8b5554';ctx.fillRect(145,465,580,9);ctx.fillStyle='#d77b62';ctx.fillRect(145,465,580*(1-clamp((p.ticketClock||0)/9,0,1)),9);break;
case'sushi':panel(120,90,660,370,'#c1d9cf');for(let i=0;i<5;i++){ctx.strokeStyle='#fff2d9';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(160+i*130,120);ctx.lineTo(160+i*130,430);ctx.stroke();}objects.forEach(o=>{clay(o.x,o.y,o.r,o.bad?'#7c7770':o.gold?'#e9c16d':'#e9d6b4');ctx.fillStyle='#5d4650';ctx.font='12px Fredoka';ctx.fillText(o.bad?'SPOILED':o.gold?'GOLD':'FRESH',o.x-22,o.y+4);});clay(p.x,420,38,'#9b6b75');ctx.fillStyle='#fff1d9';ctx.font='bold 17px Fredoka';ctx.fillText('STREAK '+(p.catchStreak||0)+'   MISSES '+p.miss+'/3',155,490);break;
case'pulse':{
 panel(55,85,790,405,'#55465e');const cam=p.camera||0;
 ctx.save();ctx.translate(-cam,0);ctx.fillStyle='#403449';ctx.fillRect(0,430,2500,90);
 for(let i=0;i<18;i++){const x=i*150;ctx.fillStyle='#76536a';ctx.fillRect(x,120+(i%3)*28,65,310);ctx.fillStyle='#e8a66e';ctx.fillRect(x+12,160+(i%3)*28,8,220);}
 objects.filter(o=>o.type==='platform').forEach(o=>{rounded(o.x,o.y,o.w,o.h,10,'#9b716f');rounded(o.x,o.y,o.w,12,6,'#e6b67e');});
 objects.filter(o=>o.type==='cell').forEach(o=>{if(!o.taken){clay(o.x,o.y,13,'#7de4d2');circle(o.x,o.y,5,'#fff5cf');}});
 objects.filter(o=>o.type==='enemy'||o.type==='boss').forEach(o=>{clay(o.x,o.y,o.type==='boss'?35:23,o.type==='boss'?'#d66d78':'#b47ca0');circle(o.x-7,o.y-5,4,'#fff0d0');circle(o.x+7,o.y-5,4,'#fff0d0');if(o.type==='boss'){ctx.fillStyle='#f6d18a';ctx.fillRect(o.x-32,o.y-53,64,6);ctx.fillStyle='#e36f70';ctx.fillRect(o.x-32,o.y-53,64*o.hp/8,6);}});
 objects.filter(o=>o.type==='shot'||o.type==='enemyshot').forEach(o=>clay(o.x,o.y,8,o.type==='shot'?'#8df3e0':'#f39a72'));
 clay(p.x,p.y,23,'#80c8b5');circle(p.x+7,p.y-7,5,'#fff3d5');rounded(p.x-15,p.y+18,30,9,4,'#e99a79');
 ctx.restore();ctx.fillStyle='#fff0d2';ctx.font='bold 16px Fredoka';ctx.fillText('ENERGY '+p.energy+'  ·  ARMOUR '+p.hp+'  ·  REACTOR '+(p.bossHp>0?p.bossHp:'DOWN'),90,470);
 break;}
case'moto':{
 panel(55,85,790,405,'#51465b');ctx.fillStyle='#a5a1a0';ctx.fillRect(80,350,740,105);ctx.fillStyle='#6e5d61';ctx.fillRect(80,350,740,8);
 for(let i=0;i<8;i++){const x=90+i*100-(p.camera%100);ctx.fillStyle='#e7c68f';ctx.fillRect(x,405,42,7);}
 ctx.save();ctx.translate(-p.camera,0);
 objects.forEach(o=>{if(o.type==='barrel'){clay(o.x,o.y,20,'#d38c6d');ctx.fillStyle='#604552';ctx.fillRect(o.x-15,o.y-5,30,5);}if(o.type==='ramp'){ctx.fillStyle='#a67a70';ctx.beginPath();ctx.moveTo(o.x,o.y);ctx.lineTo(o.x+85,o.y-38);ctx.lineTo(o.x+85,o.y+10);ctx.closePath();ctx.fill();}if(o.type==='gap'){ctx.fillStyle='#28283c';ctx.fillRect(o.x,350,80,110);}if(o.type==='token'&&!o.taken)clay(o.x,o.y,12,'#f5d37b');});
 ctx.restore();ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle||0);circle(-24,20,15,'#302a3b');circle(25,20,15,'#302a3b');circle(-24,20,8,'#d9b88e');circle(25,20,8,'#d9b88e');rounded(-28,-5,60,18,9,'#dc806f');clay(3,-21,17,'#83c7b5');clay(17,-37,10,'#e8c59d');ctx.strokeStyle='#f0c17f';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(-18,4);ctx.lineTo(10,-18);ctx.lineTo(24,5);ctx.stroke();ctx.restore();
 ctx.fillStyle='#fff0d2';ctx.font='bold 16px Fredoka';ctx.fillText('SPEED '+Math.round(p.speed)+'  ·  DISTANCE '+Math.floor(p.distance/10)+'m  ·  BIKE '+p.hp,95,470);break;}
case'moonquest':{
 const roomColors=['#7b9b79','#8a8270','#657e91'],roomNames=['OVERGROWN RUINS','SUNKEN SANCTUM','MOONKEEP · BOSS CHAMBER'];
 panel(70,85,760,405,'#526b62');rounded(105,115,690,330,22,roomColors[p.room||0]);ctx.fillStyle='#6c8d6e';ctx.fillRect(120,130,660,300);
 ctx.fillStyle='#fff0d2';ctx.font='bold 14px Fredoka';ctx.fillText(roomNames[p.room||0]+' · AREA '+((p.room||0)+1)+'/3',125,145);
 for(let i=0;i<12;i++){const x=140+(i%6)*115,y=155+Math.floor(i/6)*235;circle(x,y,40,'#71916e');circle(x-12,y-18,22,'#8eae83');}
 objects.forEach(o=>{if(o.type==='tree'){clay(o.x,o.y,o.r,'#507b65');clay(o.x-8,o.y-15,o.r*.6,'#83a77a');}if(o.type==='enemy'){clay(o.x,o.y,19,o.hp>0?'#a46e83':'#4f5c59');if(o.hp>0){circle(o.x-6,o.y-4,3,'#fff0d5');circle(o.x+6,o.y-4,3,'#fff0d5');}}if(o.type==='boss'){clay(o.x,o.y,43,'#75618e');circle(o.x-12,o.y-8,7,'#f5d27d');circle(o.x+12,o.y-8,7,'#f5d27d');ctx.fillStyle='#352b49';ctx.fillRect(o.x-42,o.y-61,84,8);ctx.fillStyle='#e77b79';ctx.fillRect(o.x-42,o.y-61,84*o.hp/o.maxHp,8);if(o.telegraph>0){ctx.strokeStyle='#ffb77b';ctx.lineWidth=6;ctx.beginPath();ctx.arc(o.x,o.y,65+Math.sin(performance.now()/60)*7,0,Math.PI*2);ctx.stroke();}}if(o.type==='shard'&&!o.taken){clay(o.x,o.y,17,'#82e5dd');ctx.save();ctx.translate(o.x,o.y);ctx.rotate(Math.PI/4);ctx.fillStyle='#e6ffff';ctx.fillRect(-5,-5,10,10);ctx.restore();}if(o.type==='gate'){const need=(p.room||0)+1,open=p.shards>=need;rounded(o.x-45,o.y-28,90,58,12,open?'#e4bb79':'#51495e');ctx.fillStyle='#fff1d0';ctx.font='12px Fredoka';ctx.textAlign='center';ctx.fillText(open?(p.room===2?'BOSS AWAITS':'ENTER'):'NEED '+need+' SHARD'+(need>1?'S':''),o.x,o.y+7);}if(o.type==='chest'&&!p.chestOpened){rounded(o.x-19,o.y-15,38,30,7,'#d5a36e');rounded(o.x-19,o.y-3,38,6,3,'#f1ce87');}if(o.type==='chest'&&p.chestOpened){rounded(o.x-19,o.y-15,38,30,7,'#8a7665');}});
 clay(p.x,p.y,22,'#e9a47d');circle(p.x+7*p.facing,p.y-7,5,'#fff3d5');if(p.swing>0){ctx.strokeStyle=p.swordLevel>1?'#8de9e1':'#fff1b0';ctx.lineWidth=10+p.swordLevel*2;ctx.beginPath();ctx.arc(p.x,p.y,48,-1.1,1.1);ctx.stroke();}if(p.guard){ctx.strokeStyle='#a8e4ee';ctx.lineWidth=7;ctx.beginPath();ctx.arc(p.x,p.y,35,-1.2,1.2);ctx.stroke();}
 ctx.fillStyle='#fff0d2';ctx.font='bold 14px Fredoka';ctx.textAlign='left';ctx.fillText('HEARTS '+p.hp+'/'+p.maxHp+' · SHARDS '+p.shards+'/3 · SWORD '+p.swordLevel+' · '+(p.shield?'SHIELD':'NO SHIELD')+' · '+(p.boots?'SWIFT BOOTS':'WALKING'),110,470);break;}
case'ringtoss':{panel(95,82,710,405,'#b98672');rounded(125,115,650,330,24,'#e8c99e');ctx.fillStyle='#8c655e';ctx.fillRect(145,395,610,28);p.pegs.forEach((peg,i)=>{clay(peg.x,peg.y,peg.hit?23:19,peg.hit?'#e9d28f':['#89c7ba','#d78e9b','#a99ad1'][i]);ctx.strokeStyle='#fff1d3';ctx.lineWidth=5;ctx.beginPath();ctx.arc(peg.x,peg.y,peg.hit?25:22,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#4b3947';ctx.font='bold 13px Fredoka';ctx.textAlign='center';ctx.fillText(peg.hit?'HIT':'×'+(i+1),peg.x,peg.y+5);});if(p.ringFlight){ctx.strokeStyle='#f6e1b4';ctx.lineWidth=9;ctx.beginPath();ctx.ellipse(p.ringFlight.x,p.ringFlight.y,18,8,.2,0,Math.PI*2);ctx.stroke();}else{ctx.strokeStyle='#f6e1b4';ctx.lineWidth=8;ctx.beginPath();ctx.ellipse(450,420,20,9,0,0,Math.PI*2);ctx.stroke();}ctx.fillStyle='#fff0d2';ctx.font='bold 18px Fredoka';ctx.textAlign='center';ctx.fillText('RINGS LEFT '+p.rings+'  ·  PEGS '+p.pegs.filter(q=>q.hit).length+'/3',450,475);ctx.fillText('AIM '+Math.round(p.aim||450),450,505);break;}
case'gemdig':{panel(95,82,710,405,'#9c806f');rounded(125,115,650,330,22,'#d5bd92');for(let i=0;i<20;i++){const tile=p.grid[i],x=190+(i%5)*104,y=150+Math.floor(i/5)*78;rounded(x,y,88,62,12,tile.revealed?(tile.gem?'#8bc9b5':tile.hazard?'#c97870':'#b5a18a'):'#876b61');if(tile.revealed){ctx.font='bold 24px Fredoka';ctx.textAlign='center';ctx.fillStyle='#fff2d7';ctx.fillText(tile.gem?'✦':tile.hazard?'⚠':'·',x+44,y+39);}else{clay(x+44,y+30,12,'#b89475');ctx.fillStyle='#f4dfbf';ctx.font='12px Fredoka';ctx.textAlign='center';ctx.fillText('DIG',x+44,y+50);}}ctx.fillStyle='#fff0d2';ctx.font='bold 18px Fredoka';ctx.textAlign='center';ctx.fillText('MOON GEMS '+p.gems+'/6  ·  LANTERN '+p.hearts+'/3',450,475);break;}
case'mixology':panel(130,90,640,370,'#d9c4dc');rounded(350,150,200,250,35,'#fff0d8');rounded(365,165,170,220,25,'#9e7f9b');const band=clamp(80-(p.mixRound||1)*8+(p.masteryLevel>=2?8:0),22,80);ctx.fillStyle='#f5c879';ctx.fillRect(365,385-band,170,band);ctx.fillStyle='#503b55';ctx.font='bold 20px Fredoka';ctx.fillText('POUR METER',355,130);ctx.fillText('ROUND '+p.mixRound+'  ·  PERFECT '+p.perfects+'  ·  MISSES '+(p.misses||0)+'/3',250,450);ctx.fillStyle='#fff';ctx.fillRect(440,175+(p.pour||0)*1.75,30,8);ctx.fillStyle='#63465c';ctx.font='14px Fredoka';ctx.fillText('STOP WHEN THE MARKER HITS THE GOLD BAND',250,490);break;
}
ctx.textAlign='left';}

// ───────── Turbo Tunnels: circuit racing ─────────
const RACE_LAPS=3,RACE_HALF=36,RACE_CARS=[
 {name:'YOU',color:'#82c6b1',skill:1},{name:'BOLT',color:'#e8584f',skill:.97,off:-12},{name:'MINT',color:'#f2c35f',skill:.92,off:12},{name:'PLUM',color:'#a99bff',skill:.87,off:0}];
function raceTrack(){
 const cps=[[150,160],[330,115],[520,140],[610,215],[740,150],[790,300],[700,430],[520,385],[400,450],[230,440],[120,330],[225,262]];
 const n=cps.length,pts=[],N=320;
 for(let k=0;k<N;k++){const u=k/N*n,i=Math.floor(u),t=u-i,P=[0,1,2,3].map(o=>cps[(i-1+o+n)%n]);
  const f=(a,b,c,d)=>.5*((2*b)+(-a+c)*t+(2*a-5*b+4*c-d)*t*t+(-a+3*b-3*c+d)*t*t*t);
  pts.push({x:f(P[0][0],P[1][0],P[2][0],P[3][0]),y:f(P[0][1],P[1][1],P[2][1],P[3][1])});}
 for(let k=0;k<N;k++){const a=pts[k],b=pts[(k+1)%N];a.h=Math.atan2(b.y-a.y,b.x-a.x);}
 for(let k=0;k<N;k++){let d=pts[(k+14)%N].h-pts[k].h;while(d>Math.PI)d-=Math.PI*2;while(d<-Math.PI)d+=Math.PI*2;pts[k].curve=Math.abs(d);}
 const path=new Path2D();pts.forEach((q,k)=>k?path.lineTo(q.x,q.y):path.moveTo(q.x,q.y));path.closePath();
 return{pts,N,path};
}
function initRace(){
 time=170;$('#time').textContent='170';const tr=raceTrack(),cars=[];
 RACE_CARS.forEach((def,i)=>{const back=(tr.N-(i*6+4))%tr.N,q=tr.pts[back],lat=(i%2?1:-1)*13,nx=-Math.sin(q.h),ny=Math.cos(q.h);
  cars.push({...def,i,x:q.x+nx*lat,y:q.y+ny*lat,a:q.h,v:0,idx:back,prog:-(i*6+4),lap:0,lapStart:0,best:99,finished:false,finT:0,hit:0,slip:0,lat});});
 p.race={tr,cars,t:0,go:3.2,over:false,endClock:0,place:0,lapFlash:0,msg:'',msgT:0};
}
function raceInput(){
 const L=keys.ArrowLeft||keys.a||keys.A||p.touchDir===-1,R=keys.ArrowRight||keys.d||keys.D||p.touchDir===1;
 return{steer:(R?1:0)-(L?1:0),gas:keys.ArrowUp||keys.w||keys.W||p.touchAuto&&!p.touchBrake,brake:keys.ArrowDown||keys.s||keys.S||keys[' ']||p.touchBrake};
}
function raceNearest(c,tr){let best=1e9,bi=c.idx;for(let o=-6;o<=22;o++){const k=(c.idx+o+tr.N)%tr.N,q=tr.pts[k],d=(q.x-c.x)**2+(q.y-c.y)**2;if(d<best){best=d;bi=k;}}c.dist=Math.sqrt(best);let d=bi-c.idx;if(d>tr.N/2)d-=tr.N;if(d<-tr.N/2)d+=tr.N;c.idx=bi;c.prog+=d;}
function stepCar(c,r,steer,gas,brk,dt,maxV){
 const tr=r.tr,on=c.dist<=RACE_HALF,cap=on?maxV:maxV*.42;
 if(gas&&c.v<cap)c.v+=(on?210:150)*dt;if(brk)c.v-=360*dt;c.v*=Math.exp(-(on?.22:1.5)*dt);if(c.v>cap)c.v-=(c.v-cap)*Math.min(1,dt*3);c.v=Math.max(-40,c.v);
 c.a+=steer*2.7*clamp(Math.abs(c.v)/110,0,1)*(c.v<0?-1:1)*(1-clamp(c.v/(maxV*2.6),0,.35))*dt;
 c.x+=Math.cos(c.a)*c.v*dt;c.y+=Math.sin(c.a)*c.v*dt;
}
function updateRace(dt){
 const r=p.race;if(!r)return;const tr=r.tr,me=r.cars[0];r.t+=dt;r.msgT=Math.max(0,r.msgT-dt);r.lapFlash=Math.max(0,r.lapFlash-dt);
 const mastery=1+Math.min(.1,(p.masteryLevel||0)*.015);
 if(r.go>0){r.go-=dt;if(r.go<=0){r.msg='GO!';r.msgT=.8;sound(880,.25,'square',.05);}else if(Math.ceil(r.go)!==r.lastCount){r.lastCount=Math.ceil(r.go);sound(440,.1,'square',.04);}for(const c of r.cars)raceNearest(c,tr);return;}
 const inp=raceInput(),MAXV=235;
 if(!me.finished)stepCar(me,r,inp.steer,inp.gas,inp.brake,dt,MAXV*mastery);else{me.v*=Math.exp(-1.2*dt);me.x+=Math.cos(me.a)*me.v*dt;me.y+=Math.sin(me.a)*me.v*dt;}
 // Rivals follow the racing line, brake into tight corners and run at different pace levels.
 for(const c of r.cars){if(c===me)continue;
  const look=10+Math.floor(c.v/22),q=tr.pts[(c.idx+look)%tr.N],nx=-Math.sin(q.h),ny=Math.cos(q.h),tx=q.x+nx*(c.off||0),ty=q.y+ny*(c.off||0);
  let da=Math.atan2(ty-c.y,tx-c.x)-c.a;while(da>Math.PI)da-=Math.PI*2;while(da<-Math.PI)da+=Math.PI*2;
  const curve=Math.max(tr.pts[(c.idx+16)%tr.N].curve,tr.pts[(c.idx+30)%tr.N].curve*.8),target=MAXV*c.skill*(1-clamp(curve*1.5,0,.5));
  // gentle rubber-banding keeps the pack close without ever handing the player the race
  const gap=me.prog-c.prog,band=1+clamp(gap*.0012,-.04,.07);
  if(c.finished){c.v*=Math.exp(-1.2*dt);c.x+=Math.cos(c.a)*c.v*dt;c.y+=Math.sin(c.a)*c.v*dt;}
  else stepCar(c,r,clamp(da*2.6,-1,1),c.v<target*band,c.v>target*band*1.12,dt,MAXV*c.skill*band);}
 // car-to-car contact and hard outer barriers
 for(let i=0;i<4;i++)for(let j=i+1;j<4;j++){const a=r.cars[i],b=r.cars[j],dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);if(d>0&&d<22){const push=(22-d)/2,ux=dx/d,uy=dy/d;a.x-=ux*push;a.y-=uy*push;b.x+=ux*push;b.y+=uy*push;const av=a.v,bv=b.v;a.v=av*.9+bv*.1;b.v=bv*.9+av*.1;if((i===0||j===0)&&r.t-(r.bump||0)>.25){r.bump=r.t;sound(150,.07,'sawtooth',.03);}}}
 for(const c of r.cars){raceNearest(c,tr);
  if(c.dist>RACE_HALF+40){const q=tr.pts[c.idx],ux=(c.x-q.x)/c.dist,uy=(c.y-q.y)/c.dist;c.x=q.x+ux*(RACE_HALF+40);c.y=q.y+uy*(RACE_HALF+40);c.v*=.45;if(c===me&&r.t-(r.bump||0)>.25){r.bump=r.t;sound(120,.1,'sawtooth',.04);}}
  const lapNow=Math.floor(c.prog/tr.N);
  if(lapNow>c.lap&&lapNow>=1){const lt=r.t-c.lapStart;c.lapStart=r.t;c.best=Math.min(c.best,lt);c.lap=lapNow;
   if(c===me&&lapNow<RACE_LAPS){r.msg='LAP '+(lapNow+1)+' / '+RACE_LAPS+'  ·  '+lt.toFixed(1)+'s';r.msgT=1.6;r.lapFlash=.5;scoreBy(10);sound(660,.15,'triangle',.05);}
   if(lapNow>=RACE_LAPS&&!c.finished){c.finished=true;c.finT=r.t;if(c===me){r.over=true;r.endClock=2.2;r.place=raceStanding(r)[0];r.msg=['1ST PLACE!','2ND PLACE','3RD PLACE','4TH PLACE'][r.place-1];r.msgT=3;sound(r.place<=2?880:300,.3,'triangle',.06);}}}}
 if(me.dist>RACE_HALF&&me.v>60&&Math.random()<dt*14)addParticles(me.x,me.y,'#8a7a50',2);
 if(r.over){r.endClock-=dt;if(r.endClock<=0)finishRace(false);}
}
function raceStanding(r){const order=[...r.cars].sort((a,b)=>(b.finished-a.finished)||(a.finished&&b.finished?a.finT-b.finT:b.prog-a.prog));return[order.indexOf(r.cars[0])+1,order];}
function finishRace(timeout){
 const r=p.race;if(!r)return;r.over=true;const place=timeout?raceStanding(r)[0]:r.place||raceStanding(r)[0],me=r.cars[0];
 const pts=[120,80,50,25][place-1]*(timeout?.5:1),lapBonus=me.best<90?Math.max(0,Math.round((26-me.best)*3)):0;
 scoreBy(Math.round(pts+lapBonus));p.gradeLabel=['1ST','2ND','3RD','4TH'][place-1]+' PLACE'+(me.best<90?' · BEST LAP '+me.best.toFixed(1)+'s':'')+(timeout?' · TIME LIMIT':'');
 finish(place<=2&&!timeout);
}
function drawRace(){
 const r=p.race;panel(60,70,780,430,'#3d6a49');
 if(!r){ctx.fillStyle='#fff0d4';ctx.font='bold 22px Fredoka';ctx.textAlign='center';ctx.fillText('THREE LAPS · THREE RIVALS',450,285);return;}
 const tr=r.tr;ctx.save();ctx.beginPath();ctx.roundRect(70,80,760,410,18);ctx.clip();
 const gg=ctx.createLinearGradient(0,80,0,490);gg.addColorStop(0,'#4f8a58');gg.addColorStop(1,'#3b6b47');ctx.fillStyle=gg;ctx.fillRect(70,80,760,410);
 for(let i=0;i<150;i++){ctx.fillStyle=i%3?'rgba(255,240,170,.07)':'rgba(20,50,30,.12)';ctx.beginPath();ctx.ellipse((i*163)%760+70,(i*97)%410+80,5+(i%5)*3,2+(i%3),i,0,6.283);ctx.fill();}
 ctx.lineJoin='round';ctx.lineCap='butt';
 ctx.strokeStyle='rgba(20,30,20,.35)';ctx.lineWidth=RACE_HALF*2+26;ctx.stroke(tr.path);
 ctx.setLineDash([]);ctx.strokeStyle='#f2e8d4';ctx.lineWidth=RACE_HALF*2+14;ctx.stroke(tr.path);
 ctx.setLineDash([16,16]);ctx.strokeStyle='#d9534f';ctx.stroke(tr.path);ctx.setLineDash([]);
 ctx.strokeStyle='#413a4d';ctx.lineWidth=RACE_HALF*2;ctx.stroke(tr.path);
 ctx.strokeStyle='rgba(255,255,255,.05)';ctx.lineWidth=RACE_HALF*1.1;ctx.stroke(tr.path);
 ctx.setLineDash([18,20]);ctx.strokeStyle='rgba(245,228,190,.7)';ctx.lineWidth=3;ctx.stroke(tr.path);ctx.setLineDash([]);
 const s0=tr.pts[0],nx=-Math.sin(s0.h),ny=Math.cos(s0.h);ctx.save();ctx.translate(s0.x,s0.y);ctx.rotate(s0.h);for(let i=0;i<6;i++)for(let k=0;k<2;k++){ctx.fillStyle=(i+k)%2?'#fff':'#1d1424';ctx.fillRect(-5+k*5,-RACE_HALF+i*(RACE_HALF/3),5,RACE_HALF/3);}ctx.restore();
 const order=[...r.cars].sort((a,b)=>a.y-b.y);
 for(const c of order){ctx.save();ctx.translate(c.x,c.y);ctx.fillStyle='rgba(0,0,0,.3)';ctx.beginPath();ctx.ellipse(2,4,15,8,c.a,0,6.283);ctx.fill();ctx.rotate(c.a);
  rounded(-14,-8,28,16,6,c.color);ctx.fillStyle='rgba(30,20,40,.75)';ctx.fillRect(1,-5,7,10);ctx.fillStyle='rgba(255,255,255,.55)';ctx.fillRect(-11,-6,3,4);ctx.fillRect(-11,2,3,4);ctx.fillStyle='#1d1424';ctx.fillRect(-12,-10,7,3);ctx.fillRect(-12,7,7,3);ctx.fillRect(6,-10,7,3);ctx.fillRect(6,7,7,3);
  if(c===r.cars[0]){ctx.strokeStyle='#fff0d4';ctx.lineWidth=2;ctx.beginPath();ctx.roundRect(-17,-11,34,22,9);ctx.stroke();}ctx.restore();}
 ctx.restore();
 const me=r.cars[0],st=raceStanding(r),lap=Math.min(RACE_LAPS,me.lap+1);
 ctx.fillStyle='rgba(25,18,35,.62)';ctx.beginPath();ctx.roundRect(80,88,420,30,10);ctx.fill();
 ctx.fillStyle='#fff0d4';ctx.font='bold 15px Fredoka';ctx.textAlign='left';ctx.fillText('LAP '+lap+'/'+RACE_LAPS+'   POS '+st[0]+'/4   TIME '+Math.max(0,r.t-3.2).toFixed(1)+'s'+(me.best<90?'   BEST '+me.best.toFixed(1)+'s':''),92,108);
 ctx.fillStyle='rgba(25,18,35,.62)';ctx.beginPath();ctx.roundRect(690,448,130,32,10);ctx.fill();ctx.fillStyle='#82c6b1';ctx.fillRect(698,466,Math.max(0,me.v)/260*114,8);ctx.strokeStyle='#fff0d4';ctx.lineWidth=1.5;ctx.strokeRect(698,466,114,8);ctx.fillStyle='#fff0d4';ctx.font='bold 12px Fredoka';ctx.fillText('SPEED '+Math.round(Math.max(0,me.v)*.5)+' km/h',698,460);
 st[1].forEach((c,i)=>{ctx.fillStyle=c===me?'#fff0d4':'rgba(255,240,212,.7)';ctx.font=(c===me?'bold ':'')+'12px Fredoka';ctx.fillText((i+1)+'. '+c.name,92,138+i*16);});
 ctx.textAlign='center';
 if(r.go>0){ctx.fillStyle='#fff0d4';ctx.font='bold 74px Fredoka';ctx.fillText(String(Math.ceil(r.go)),450,300);}
 else if(r.msgT>0){ctx.globalAlpha=Math.min(1,r.msgT*1.5);ctx.fillStyle='#ffe08a';ctx.font='bold 40px Fredoka';ctx.fillText(r.msg,450,290);ctx.globalAlpha=1;}
}
function spawnMoles(){objects=[];const ids=[0,1,2,3,4,5,6,7,8].sort(()=>Math.random()-.5).slice(0,3);ids.forEach(id=>objects.push({id,life:rand(.65,1.25)+(p.masteryLevel>=2?.18:0)}));}
function makeBumpers(){p.bumpers=[{x:365,y:190,r:26},{x:535,y:190,r:26},{x:450,y:270,r:30},{x:365,y:335,r:22},{x:535,y:335,r:22}];}
function nextSequence(){sequence.push(Math.floor(Math.random()*4));seqPos=0;seqPhase='show';seqClock=.85+(p.masteryLevel>=2?.12:0);}
function update(dt,now){
time-=dt;$('#time').textContent=Math.max(0,Math.ceil(time));
if(game==='billiards'){
 const balls=objects.filter(o=>o.type==='poolball');
 if(p.current==='cpu'&&!p.shotActive){p.cpuWait-=dt;if(p.cpuWait<=0){const available=balls.filter(b=>!b.pocketed&&b.number!==8&&(!p.cpuGroup||p.cpuGroup==='solids'&&b.number<=7||p.cpuGroup==='stripes'&&b.number>=9));const target=available.sort((a,b)=>Math.hypot(a.x-p.cue.x,a.y-p.cue.y)-Math.hypot(b.x-p.cue.x,b.y-p.cue.y))[0]||balls.find(b=>!b.pocketed&&b.number===8);if(target){const pockets=[[155,125],[450,125],[745,125],[155,425],[450,425],[745,425]],pocket=pockets.sort((a,b)=>Math.hypot(a[0]-target.x,a[1]-target.y)-Math.hypot(b[0]-target.x,b[1]-target.y))[0],px=pocket[0]-target.x,py=pocket[1]-target.y,pd=Math.max(1,Math.hypot(px,py)),ghostX=target.x-px/pd*22,ghostY=target.y-py/pd*22,dx=ghostX-p.cue.x,dy=ghostY-p.cue.y,d=Math.max(1,Math.hypot(dx,dy)),power=clamp(d*1.12,280,590);p.cue.vx=dx/d*power;p.cue.vy=dy/d*power;p.shotActive=true;p.turnPocketed=0;p.turnFoul=false;p.settleClock=0;sound(220,.07,'triangle');}else{finish(false);return;}}}
 const moving=[p.cue,...balls].some(b=>Math.hypot(b.vx,b.vy)>7);
 if(p.shotActive){
  for(const b of [p.cue,...balls]){b.x+=b.vx*dt;b.y+=b.vy*dt;b.vx*=Math.pow(.985,dt*60);b.vy*=Math.pow(.985,dt*60);if(Math.hypot(b.vx,b.vy)<5)b.vx=b.vy=0;}
  const pockets=[[155,125],[450,125],[745,125],[155,425],[450,425],[745,425]];
  for(const b of [p.cue,...balls]){if(b.pocketed)continue;const pocket=pockets.find(([x,y])=>Math.hypot(b.x-x,b.y-y)<23);if(pocket){if(b===p.cue){p.cueScratch=true;p.turnFoul=true;b.pocketed=true;b.vx=b.vy=0;}else{b.pocketed=true;p.turnPocketed++;if(b.number===8){const ownLeft=balls.filter(o=>!o.pocketed&&o.number!==8&&(p.current==='player'?p.playerGroup==='solids'?o.number<=7:p.playerGroup==='stripes'?o.number>=9:true:p.cpuGroup==='solids'?o.number<=7:p.cpuGroup==='stripes'?o.number>=9:true)).length;if(ownLeft===0)finish(p.current==='player');else finish(p.current==='cpu');return;}if(!p.playerGroup&&b.number!==8){const group=b.number<=7?'solids':'stripes',other=group==='solids'?'stripes':'solids';if(p.current==='player'){p.playerGroup=group;p.cpuGroup=other;}else{p.cpuGroup=group;p.playerGroup=other;}}if(p.current==='player'){p.playerPotted.push(b.number);scoreBy(15);}else p.cpuPotted.push(b.number);}}}
  for(const b of [p.cue,...balls]){if(b.pocketed)continue;if(b.x<166||b.x>734){b.x=clamp(b.x,166,734);b.vx*=-.88;}if(b.y<136||b.y>414){b.y=clamp(b.y,136,414);b.vy*=-.88;}}
  const active=[p.cue,...balls].filter(b=>!b.pocketed);for(let i=0;i<active.length;i++)for(let j=i+1;j<active.length;j++){const a=active[i],b=active[j],dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy),min=21;if(d>0&&d<min){const nx=dx/d,ny=dy/d,overlap=min-d;a.x-=nx*overlap*.5;a.y-=ny*overlap*.5;b.x+=nx*overlap*.5;b.y+=ny*overlap*.5;const rel=(b.vx-a.vx)*nx+(b.vy-a.vy)*ny;if(rel<0){const impulse=-(1+.94)*rel*.5;a.vx-=impulse*nx;a.vy-=impulse*ny;b.vx+=impulse*nx;b.vy+=impulse*ny;}}}
  const allStopped=[p.cue,...active].every(b=>Math.hypot(b.vx,b.vy)<7);p.settleClock=allStopped?p.settleClock+dt:0;
  if(p.settleClock>.55){p.shotActive=false;p.aiming=false;if(p.cueScratch){p.cue.x=450;p.cue.y=365;p.cue.vx=p.cue.vy=0;p.cue.pocketed=false;p.cueScratch=false;}if(p.turnFoul||p.turnPocketed===0){p.current=p.current==='player'?'cpu':'player';p.cpuWait=p.current==='cpu'?.8:0;}else if(p.current==='cpu')p.cpuWait=.8;p.turnPocketed=0;p.turnFoul=false;p.settleClock=0;}
 }
 if(time<=0){finish(false);return;}
}
if(game==='skeeball'&&p.rolling){p.ballX+=p.vx*dt;p.ballY+=p.vy*dt;p.vy+=500*dt;if(p.ballY<210){const d=Math.hypot(p.ballX-450,p.ballY-220);const points=d<22?100:d<52?50:d<88?20:0;if(points){scoreBy(points+(p.masteryLevel>=2?Math.round(points*.1):0));sound(330+points*3,.15,'triangle');}else sound(130,.1,'sawtooth');addParticles(p.ballX,p.ballY,'#f6d17c');p.rolling=false;p.ballX=450;p.ballY=415;}if(p.ballY>450){p.rolling=false;p.ballX=450;p.ballY=415;}}
if(game==='airhockey'){const q=p.puck;p.playerX=clamp(mouse.x,180,720);q.x+=q.vx*dt;q.y+=q.vy*dt;q.vx*=Math.pow(.999,dt*60);q.vy*=Math.pow(.999,dt*60);const speed=Math.hypot(q.vx,q.vy),cap=570;if(speed>cap){q.vx=q.vx/speed*cap;q.vy=q.vy/speed*cap;}
// The robot reads the puck's projected arrival, but deliberately leaves a small reaction delay.
const incoming=q.vy<0&&q.y<300;p.aiMood=incoming?'intercept':'guard';let target=450;if(incoming){const travel=(150-q.y)/Math.min(-80,q.vy);target=q.x+q.vx*Math.max(0,travel);}else if(q.y>280){target=450+(q.x-450)*.24;}const difficulty=(.78+Math.min(.16,(p.rally||0)*.012)+Math.min(.12,(p.masteryLevel||0)*.02))*cpuLevel();p.botX+=(clamp(target,355,545)-p.botX)*Math.min(1,dt*(incoming?3.2:2.0)*difficulty);
if(q.x<150||q.x>750){q.x=clamp(q.x,150,750);q.vx*=-.9;sound(120,.035);}
// Side rails and the two goal mouths have different collision rules.
if(q.y<124){if(q.x>365&&q.x<535){p.goal++;scoreBy(35);sound(760,.18,'triangle');if(p.goal>=5){scoreBy(100);finish(true);return;}q.x=450;q.y=270;q.vx=rand(-120,120);q.vy=210;p.rally=0;}else{q.y=124;q.vy=Math.abs(q.vy)*.88;}}
if(q.y>438){if(q.x>365&&q.x<535){p.botGoal++;sound(115,.2,'sawtooth');if(p.botGoal>=5){finish();return;}q.x=450;q.y=270;q.vx=rand(-140,140);q.vy=-210;p.rally=0;}else{q.y=438;q.vy=-Math.abs(q.vy)*.88;}}
// Robot paddle: contact imparts a directional return, not a scripted score.
if(q.vy<0&&q.y<178&&q.y>130&&Math.abs(q.x-p.botX)<43){q.y=179;q.vy=Math.abs(q.vy)+35;q.vx+=(q.x-p.botX)*2.4;p.rally++;sound(330,.05,'triangle');}
// Player mallet is controlled by pointer/touch and only strikes while the puck enters its zone.
if(q.vy>0&&q.y>375&&q.y<430&&Math.hypot(q.x-p.playerX,q.y-410)<(p.malletReach||43)){const dx=q.x-p.playerX,dy=q.y-410;q.y=374;q.vy=-Math.max(190,Math.abs(q.vy)+Math.abs(dy)*2.5);q.vx+=dx*3.1;p.rally++;sound(260+Math.min(300,p.rally*12),.06,'triangle');addParticles(q.x,q.y,'#f7d58a',4);}
}
if(game==='pulse'){
 const left=keys.ArrowLeft||keys.a||p.touchDir===-1,right=keys.ArrowRight||keys.d||p.touchDir===1,jump=keys[' ']||keys.ArrowUp||keys.w;
 p.vx+=(right?560:left?-560:0)*dt;p.vx*=Math.pow(.82,dt*60);p.vx=clamp(p.vx,-245,245);
 if(jump&&p.grounded&&!p.jumpLock){p.vy=-470;p.grounded=false;p.jumpLock=true;sound(300,.08,'triangle');}if(!jump)p.jumpLock=false;
 p.vy+=980*dt;p.x=clamp(p.x+p.vx*dt,25,2380);const previousY=p.y;p.y+=p.vy*dt;p.grounded=false;
 for(const o of objects.filter(o=>o.type==='platform'))if(p.x+15>o.x&&p.x-15<o.x+o.w&&previousY+24<=o.y+8&&p.y+24>=o.y&&p.vy>=0){p.y=o.y-24;p.vy=0;p.grounded=true;}
 if(p.y>540){p.hp--;p.x=Math.max(80,p.x-100);p.y=330;p.vy=0;if(p.hp<=0){finish();return;}}
 p.camera=clamp(p.x-360,0,1550);p.invuln=Math.max(0,p.invuln-dt);
 for(const o of objects){if(o.type==='enemy'||o.type==='boss'){o.phase+=dt;o.x+=Math.sin(o.phase*1.8)*22*dt;o.shot-=dt;if(o.shot<=0){objects.push({type:'enemyshot',x:o.x,y:o.y,vx:(p.x-o.x)*.24,vy:90});o.shot=o.type==='boss'?1.1:2.2;}if(Math.hypot(o.x-p.x,o.y-p.y)<(o.type==='boss'?47:33)&&p.invuln<=0){p.hp--;p.invuln=1.2;if(p.hp<=0){finish();return;}}}if(o.type==='cell'&&!o.taken&&Math.hypot(o.x-p.x,o.y-p.y)<30){o.taken=true;p.energy++;scoreBy(15);}}
 objects=objects.filter(o=>{if(o.type==='shot'){for(const e of objects.filter(v=>v.type==='enemy'||v.type==='boss'))if(Math.hypot(e.x-o.x,e.y-o.y)<(e.type==='boss'?38:26)){e.hp--;o.dead=true;scoreBy(12);if(e.type==='boss'){p.bossHp=e.hp;if(e.hp<=0){scoreBy(180);finish(true);return false;}}else if(e.hp<=0)e.type='wreck';return false;}return o.x<p.x+950&&!o.dead;}if(o.type==='enemyshot'){o.x+=o.vx*dt;o.y+=o.vy*dt;if(Math.hypot(o.x-p.x,o.y-p.y)<24&&p.invuln<=0){p.hp--;p.invuln=1.2;if(p.hp<=0){finish();return false;}}return o.x>p.camera-40&&o.x<p.camera+950;}return true;});
 if(time<=0){finish(false);return;}
}
if(game==='moto'){
 const accel=keys.ArrowUp||keys.w||p.touchAccelerate,brake=keys.ArrowDown||keys.s,left=keys.ArrowLeft||keys.a,right=keys.ArrowRight||keys.d;
 p.speed=clamp(p.speed+(accel?235:brake?-310:-55)*dt,0,p.maxSpeed||430);p.distance+=p.speed*dt;p.camera=Math.max(0,p.distance-100);while(p.spawnCursor<p.distance+1500){const x=p.spawnCursor;objects.push({type:Math.random()<.28?'ramp':Math.random()<.24?'gap':'barrel',x,y:Math.random()<.5?405:420,hit:false});if(Math.random()<.35)objects.push({type:'token',x:x+65,y:285-Math.random()*90});p.spawnCursor+=150;}
 p.angle+=(right?1:left?-1:0)*dt*1.8*(p.handling||1);p.angle=clamp(p.angle,-.65,.65);p.wheel+=p.speed*dt*.045;
 const ground=365+Math.sin((p.distance+p.x)*.012)*9,inGap=objects.some(o=>o.type==='gap'&&p.camera+p.x>o.x&&p.camera+p.x<o.x+80);p.vy+=1100*dt;p.y+=p.vy*dt;
 if(!inGap&&p.y>ground-35){p.y=ground-35;p.vy=0;p.air=0;}else if(inGap&&p.y>505){p.hp--;p.distance+=160;p.y=300;p.vy=-190;p.speed*=.65;p.invuln=.8;if(p.hp<=0){finish();return;}}
 for(const o of objects){const sx=o.x-p.camera;if(Math.abs(sx-p.x)<45&&!o.hit){if(o.type==='ramp'&&p.speed>170){p.vy=-390-Math.min(120,p.speed*.3);o.hit=true;scoreBy(15);sound(480,.12,'triangle');}else if(o.type==='barrel'&&p.y>ground-65){p.hp--;o.hit=true;p.speed*=.35;sound(100,.2,'sawtooth');if(p.hp<=0){finish();return;}}else if(o.type==='token'&&!o.taken){o.taken=true;scoreBy(25);}}}
 if(time<=0){scoreBy(100+Math.floor(p.distance/20));finish(true);return;}
}
if(game==='moonquest'){
 const dx=((keys.ArrowRight||keys.d)?1:0)-((keys.ArrowLeft||keys.a)?1:0),dy=((keys.ArrowDown||keys.s)?1:0)-((keys.ArrowUp||keys.w)?1:0);p.guard=!!(keys.c||keys.C||p.touchGuard);const moveSpeed=p.boots?275:210;
 if(p.targetX!==null){const tx=p.targetX-p.x,ty=p.targetY-p.y,dist=Math.hypot(tx,ty);if(dist>9){p.x+=tx/dist*moveSpeed*dt;p.y+=ty/dist*moveSpeed*dt;if(Math.abs(tx)>4)p.facing=Math.sign(tx);}else{p.targetX=p.targetY=null;}}else{p.x=clamp(p.x+dx*moveSpeed*dt,130,770);p.y=clamp(p.y+dy*moveSpeed*dt,145,420);}if(dx)p.facing=dx;p.swing=Math.max(0,p.swing-dt*3.5);p.invuln=Math.max(0,p.invuln-dt);
 if(p.attacking&&p.swing<=0){p.swing=1;p.swingSerial++;p.attacking=false;sound(260,.06,'triangle');}
 for(const o of objects){if(o.type==='shard'&&!o.taken&&Math.hypot(o.x-p.x,o.y-p.y)<30){o.taken=true;p.shards++;scoreBy(45);sound(760,.12,'triangle');}if(o.type==='enemy'&&o.hp>0){o.phase+=dt;const d=Math.hypot(p.x-o.x,p.y-o.y);if(d<155){o.x+=(p.x-o.x)/Math.max(1,d)*42*dt;o.y+=(p.y-o.y)/Math.max(1,d)*42*dt;}if(p.swing>0&&d<(72+p.swordLevel*8)&&p.swing>.65&&o.lastSwing!==p.swingSerial){o.lastSwing=p.swingSerial;o.hp-=p.swordLevel;o.stun=.4;scoreBy(20);if(o.hp<=0)scoreBy(45);}if(d<30&&p.invuln<=0){p.hp-=((p.guard&&p.shield)?.5:1);p.invuln=.85;if(p.hp<=0){finish();return;}}}if(o.type==='boss'&&o.hp>0){o.attack-=dt;if(o.telegraph>0){o.telegraph-=dt;if(o.telegraph<=0){const d=Math.hypot(p.x-o.x,p.y-o.y);if(d<110&&p.invuln<=0){p.hp-=p.guard&&p.shield?1:2;p.invuln=1.1;if(p.hp<=0){finish();return;}}o.attack=2.5;}}else if(o.attack<=0){o.telegraph=.8;sound(145,.12,'sawtooth');}if(p.swing>0&&Math.hypot(p.x-o.x,p.y-o.y)<90&&p.swing>.65&&o.lastSwing!==p.swingSerial){o.lastSwing=p.swingSerial;o.hp-=p.swordLevel;scoreBy(30);if(o.hp<=0){p.bossDefeated=true;scoreBy(250);}}if(Math.hypot(p.x-o.x,p.y-o.y)<48&&p.invuln<=0){p.hp-=p.guard&&p.shield?.5:1;p.invuln=1;if(p.hp<=0){finish();return;}}}}
 const chest=objects.find(o=>o.type==='chest');if(chest&&!p.chestOpened&&Math.hypot(chest.x-p.x,chest.y-p.y)<42){p.chestOpened=true;p.hp=Math.min(p.maxHp,p.hp+2);if(!p.boots)p.boots=true;else p.swordLevel=Math.min(3,p.swordLevel+1);scoreBy(100);sound(760,.16,'triangle');}const gate=objects.find(o=>o.type==='gate');if(gate&&Math.hypot(gate.x-p.x,gate.y-p.y)<62){const required=(p.room||0)+1;if(p.shards>=required){if(p.room<2){p.room++;p.x=450;p.y=390;p.targetX=p.targetY=null;p.invuln=1;buildMoonRoom(p.room);sound(680,.18,'triangle');}else if(p.bossDefeated&&p.shards>=3){scoreBy(180);finish(true);return;}}}
 if(p.attacking){p.attacking=false;}
 if(time<=0){finish(false);return;}
}
if(game==='chef'){p.ticketClock=(p.ticketClock||0)+dt;if(p.ticketClock>9){p.misses++;p.combo=0;p.step=0;p.ticketClock=0;p.ticketTarget=Array.from({length:3},()=>Math.floor(Math.random()*4));sound(115,.12,'sawtooth');if(p.misses>=3){finish();return;}}}
if(game==='sushi'){p.x=clamp(p.x+(keys.ArrowRight||keys.d?360*dt:0)-(keys.ArrowLeft||keys.a?360*dt:0),190,710);p.spawnClock-=dt;if(p.spawnClock<=0){objects.push({x:rand(210,690),y:90,r:rand(16,24),v:rand(150,240),bad:Math.random()<.22,gold:Math.random()<.15});p.spawnClock=Math.max(.34,.58-(p.masteryLevel||0)*.025);p.spawnClock=Math.max(.2,p.spawnClock-Math.floor(score/180)*.03);}objects.forEach(o=>o.y+=o.v*dt);objects=objects.filter(o=>{if(o.y>390&&o.y<455&&Math.abs(o.x-p.x)<(p.catchWidth||52)){if(o.bad){p.miss++;p.catchStreak=0;combo=0;sound(120,.1,'sawtooth');}else{p.catchStreak++;awardStreak(o.gold?55:20+Math.min(20,p.catchStreak*2),o.x,o.y,o.gold?'#f4d27a':'#c5ead8');sound(o.gold?880:480,.07,'triangle');}return false;}if(o.y>480){if(!o.bad){p.miss++;p.catchStreak=0;combo=0;}return false;}return true;});if(p.miss>=3){finish();return;}if(time<=0){finish(true);return;}}
if(game==='mixology'){p.pour=(p.pour||0)+p.pourDir*dt*(95+(p.mixRound||1)*18);if(p.pour>100||p.pour<0)p.pourDir*=-1;}
if(game==='whack'){p.spawnClock=(p.spawnClock||0)-dt;if(p.spawnClock<=0){spawnMoles();p.spawnClock=Math.max(.38,.75-(p.masteryLevel||0)*.035);p.spawnClock=Math.max(.27,p.spawnClock-Math.floor(score/180)*.035);}objects.forEach(o=>o.life-=dt);objects=objects.filter(o=>o.life>0);if(objects.length===0&&p.spawnClock<.35)spawnMoles();}
if(game==='target'){p.spawnClock=(p.spawnClock||0)-dt;if(p.spawnClock<=0&&objects.length<7){objects.push({x:rand(130,770),y:rand(150,430),r:rand(13,30),vx:rand(-90,90),vy:rand(-70,70),gold:Math.random()<.16});p.spawnClock=Math.max(.3,.48-(p.masteryLevel||0)*.018);p.spawnClock=Math.max(.19,p.spawnClock-Math.floor(score/220)*.025);}objects.forEach(o=>{o.x+=o.vx*dt;o.y+=o.vy*dt;if(o.x<110||o.x>790)o.vx*=-1;if(o.y<110||o.y>455)o.vy*=-1;});}
if(game==='memory'){seqClock-=dt;if(seqClock<=0&&seqPhase==='show'){seqPos++;if(seqPos>=sequence.length){seqPhase='input';seqPos=0;}else seqClock=.62+(p.masteryLevel>=2?.12:0);}}
if(game==='rhythm')updateRhythm(dt);
if(game==='meteor'){p.x=clamp(p.x+(keys.ArrowRight||keys.d?330*dt:0)-(keys.ArrowLeft||keys.a?330*dt:0),190,710);p.spawnClock=(p.spawnClock||0)-dt;if(p.spawnClock<=0){objects.push({x:rand(205,695),y:75,r:rand(13,24),v:rand(170,270),star:Math.random()<.17});p.spawnClock=Math.max(.25,.38-(p.masteryLevel||0)*.012);p.spawnClock=Math.max(.17,p.spawnClock-Math.floor(score/200)*.02);}objects.forEach(o=>o.y+=o.v*dt);for(const o of objects){if(Math.hypot(o.x-p.x,o.y-430)<o.r+20){if(o.star){scoreBy(25+(p.masteryLevel>=4?15:0));o.y=600;sound(760,.1);}else if(p.starShield>0){p.starShield--;o.y=600;popText('SHIELD SAVE',p.x,400,'#9de8df');sound(700,.1,'triangle');}else{finish();return;}}}objects=objects.filter(o=>o.y<510);if(time<=0){scoreBy(100);finish(true);return;}}
if(game==='racer')updateRace(dt);
if(game==='stack'){p.x=450+Math.sin(now/410)*235;}
if(game==='ringtoss'){p.pegs.forEach((peg,i)=>{peg.phase+=dt*(1.15+i*.18);peg.x=450+Math.sin(peg.phase)*([150,95,150][i]);});if(p.ringFlight){const r=p.ringFlight;r.x+=r.vx*dt;r.y+=r.vy*dt;r.vy+=620*dt;r.life-=dt;const peg=p.pegs.find(q=>!q.hit&&Math.hypot(q.x-r.x,q.y-r.y)<27);if(peg){peg.hit=true;awardStreak(peg===p.pegs[1]?70:45,peg.x,peg.y,'#f4d18b');addParticles(peg.x,peg.y,'#f4d18b',12);sound(peg===p.pegs[1]?920:650,.13,'triangle');r.life=0;}if(r.life<=0||r.y>470){p.ringFlight=null;if(p.pegs.every(q=>q.hit)){finish(true);return;}if(p.rings<=0)finish(false);}}}
if(game==='gemdig'){if(time<=0)finish(p.gems>=6);}
if(game==='pinball'&&p.launched){p.ballX+=p.vx*dt;p.ballY+=p.vy*dt;p.vy+=560*dt;if(p.ballX<300||p.ballX>600){p.ballX=clamp(p.ballX,300,600);p.vx*=-.85;}if(p.ballY<105){p.ballY=105;p.vy=Math.abs(p.vy);}for(const b of p.bumpers){const d=Math.hypot(p.ballX-b.x,p.ballY-b.y);if(d<b.r+12){const a=Math.atan2(p.ballY-b.y,p.ballX-b.x);p.vx=Math.cos(a)*260;p.vy=Math.sin(a)*260;scoreBy(p.masteryLevel>=4?35:25);sound(420,.1,'triangle');addParticles(b.x,b.y,'#f6d17c',5);}}if(p.ballY>430&&p.ballY<465&&((keys.ArrowLeft&&p.ballX<445)||(keys.ArrowRight&&p.ballX>455))){p.vy=-Math.abs(p.vy)-330;p.vx+=(p.ballX<450?-80:80);sound(280,.06);}if(p.ballY>505){p.balls--;if(p.balls<=0){finish();return;}p.ballX=450;p.ballY=458;p.vx=0;p.vy=0;p.launched=false;}} 
if(game==='claw'){if(!p.grabbing)p.clawX+=p.clawDir*(p.masteryLevel>=2?145:180)*dt;if(p.clawX>700||p.clawX<200)p.clawDir*=-1;if(p.grabbing){p.clawY+=260*dt;if(p.clawY>375){const prize=objects.reduce((a,b)=>Math.abs(b.x-p.clawX)<Math.abs(a.x-p.clawX)?b:a,objects[0]||null);if(prize&&Math.abs(prize.x-p.clawX)<prize.r+(p.clawReach||24)){scoreBy(100);addParticles(prize.x,prize.y,prize.c,16);objects=objects.filter(o=>o!==prize);sound(800,.18,'triangle');}else{p.miss++;sound(130,.1,'sawtooth');}p.grabbing=false;p.clawY=125;if(objects.length===0){finish(true);return;}if(p.miss>=3){finish();return;}}}}
particles=particles.filter(o=>{o.life-=dt;if(o.text){o.y+=o.vy*dt;}else{o.x+=o.vx*dt;o.y+=o.vy*dt;o.vy+=180*dt;}return o.life>0;});
if(time<=0){if(game==='racer'&&p.race&&!p.race.over){finishRace(true);return;}if(game==='rhythm'&&p.rh){const g=rhythmGrade();p.gradeLabel='GRADE '+g.letter+' · '+Math.round(g.acc*100)+'% ACCURACY';finish(g.win);}else finish(game==='skeeball'||game==='target'||game==='stack');}
}
function drawParticles(){for(const o of particles){ctx.globalAlpha=clamp(o.life*1.8,0,1);if(o.text){ctx.fillStyle=o.c;ctx.font='bold 18px Fredoka';ctx.fillText(o.text,o.x,o.y);}else circle(o.x,o.y,o.r,o.c);}ctx.globalAlpha=1;}
function painterlyFinish(){ctx.save();ctx.globalAlpha=.62;ctx.fillStyle=paperPattern;ctx.fillRect(0,0,W,H);ctx.globalAlpha=.16;ctx.strokeStyle='#f6dfbd';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(16,18);ctx.quadraticCurveTo(420,13,884,19);ctx.quadraticCurveTo(890,260,883,502);ctx.quadraticCurveTo(450,510,17,501);ctx.quadraticCurveTo(10,260,16,18);ctx.stroke();ctx.globalAlpha=.1;for(let i=0;i<8;i++){const x=28+i*118,y=82+(i%3)*151;ctx.strokeStyle=i%2?'#f4c99c':'#2e253c';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x+7,y+10,x+13,y+21);ctx.stroke();}ctx.restore();}
function drawKeyboardCursor(){if(!keyboardAim||!running)return;ctx.save();ctx.strokeStyle='#fff1c8';ctx.lineWidth=3;ctx.globalAlpha=.9;ctx.beginPath();ctx.arc(mouse.x,mouse.y,15,0,Math.PI*2);ctx.moveTo(mouse.x-22,mouse.y);ctx.lineTo(mouse.x-8,mouse.y);ctx.moveTo(mouse.x+8,mouse.y);ctx.lineTo(mouse.x+22,mouse.y);ctx.moveTo(mouse.x,mouse.y-22);ctx.lineTo(mouse.x,mouse.y-8);ctx.moveTo(mouse.x,mouse.y+8);ctx.lineTo(mouse.x,mouse.y+22);ctx.stroke();ctx.restore();}
function loop(now){if(!running)return;const dt=Math.min(.04,(now-last)/1000);last=now;update(dt,now);draw();drawParticles();painterlyFinish();drawKeyboardCursor();if(running)raf=requestAnimationFrame(loop);}
function pointer(e){const r=canvas.getBoundingClientRect();mouse.x=(e.clientX-r.left)*W/r.width;mouse.y=(e.clientY-r.top)*H/r.height;if(game==='ringtoss')p.aim=mouse.x;if(!e.keyboardCursor)keyboardAim=false;}
const RH_SPEED=252,RH_WINDOW={perfect:.06,good:.12,ok:.2};
function initRhythm(){
 time=42;$('#time').textContent='42';
 const bpm=116,beat=60/bpm,phrases=[[0,2,1,3],[0,1,2,1],[3,2,1,0],[0,3,0,2],[1,0,3,2],[2,1,0,2]],notes=[];
 let t=3*beat;
 for(let bar=0;t<34;bar++){
  const ph=phrases[(bar*5+Math.floor(Math.random()*3))%phrases.length];
  for(let i=0;i<4;i++){const nt=t+i*beat;notes.push({lane:ph[i],t:nt,state:0});
   if(bar>=4&&Math.random()<Math.min(.4,.08+bar*.04))notes.push({lane:(ph[i]+1+Math.floor(Math.random()*3))%4,t:nt+beat/2,state:0});}
  t+=4*beat;
 }
 notes.sort((a,b)=>a.t-b.t);
 p.rh={bpm,beat,t:0,lead:(390-100)/RH_SPEED,notes,lastBeat:-1,lastHalf:-1,j:{perfect:0,good:0,ok:0,miss:0},stray:0,judge:'',judgeT:0,judgeCol:'#fff',flash:[0,0,0,0],pulse:0,end:notes[notes.length-1].t+1.1};
}
function updateRhythm(dt){
 const r=p.rh;r.t+=dt;r.pulse=Math.max(0,r.pulse-dt*3);r.judgeT=Math.max(0,r.judgeT-dt);for(let i=0;i<4;i++)r.flash[i]=Math.max(0,r.flash[i]-dt*4);
 // The backing track is scheduled from the same clock as the chart, so the music and the notes cannot drift apart.
 const bi=Math.floor(r.t/r.beat),hi=Math.floor(r.t/(r.beat/2));
 if(hi!==r.lastHalf){r.lastHalf=hi;if(hi%2===1)sound(7000,.025,'square',.006);}
 if(bi!==r.lastBeat){r.lastBeat=bi;r.pulse=1;if(bi>=0){sound(62,.16,'sine',.09);const bass=[55,55,65.4,49][Math.floor(bi/4)%4];if(bi%2===0)sound(bass*2,.22,'triangle',.05);if(bi%4===2)sound(190,.06,'square',.02);}}
 for(const n of r.notes){if(n.state===0&&r.t>n.t+RH_WINDOW.ok*(p.masteryLevel>=2?1.15:1)){n.state=-1;r.j.miss++;combo=0;r.judge='MISS';r.judgeCol='#ff8a8a';r.judgeT=.6;}}
 if(r.t>r.end)time=0;
}
function rhythmGrade(){const r=p.rh,tot=Math.max(1,r.notes.length),acc=(r.j.perfect+r.j.good*.7+r.j.ok*.4)/(tot+r.stray*.5);const letter=acc>=.95&&r.j.miss<=2?'S':acc>=.85?'A':acc>=.7?'B':acc>=.5?'C':'D';return{acc,letter,win:'SAB'.includes(letter)};}
function hitRhythm(lane){
 const r=p.rh;if(!r)return;r.flash[lane]=1;
 let best=null,bd=9;for(const n of r.notes){if(n.state!==0||n.lane!==lane)continue;const d=Math.abs(n.t-r.t);if(d<bd){bd=d;best=n;}}
 const lead=[262,330,392,523][lane];
 const wm=p.masteryLevel>=2?1.15:1;
 if(best&&bd<=RH_WINDOW.ok*wm){
  const tier=bd<=RH_WINDOW.perfect*wm?'perfect':bd<=RH_WINDOW.good*wm?'good':'ok';best.state=1;r.j[tier]++;combo++;p.bestCombo=Math.max(p.bestCombo||0,combo);
  scoreBy({perfect:2,good:1,ok:1}[tier]+Math.min(1,Math.floor(combo/40)));
  r.judge=tier.toUpperCase()+(tier==='perfect'?'!':'');r.judgeCol={perfect:'#ffe08a',good:'#9de3d1',ok:'#cbb8ff'}[tier];r.judgeT=.6;
  addParticles(200+lane*165,390,r.judgeCol,tier==='perfect'?10:5);sound(lead*(1+Math.min(.5,combo*.01)),.12,'triangle',.05);
 }else{combo=0;r.stray++;r.judge='STRAY TAP';r.judgeCol='#ffb0a0';r.judgeT=.35;sound(100,.05,'square');}
}
function dropStack(){if(!running)return;if(p.blocks===0){p.blocks=1;p.blockX=p.x;p.width=170;scoreBy(5);return;}const left=Math.max(p.blockX-p.width/2,p.x-p.width/2),right=Math.min(p.blockX+p.width/2,p.x+p.width/2),nw=right-left;if(nw<20){finish();return;}p.blockX=(left+right)/2;p.width=nw;p.blocks++;scoreBy(Math.max(5,Math.round(nw/7))*(p.masteryLevel>=2?1.12:1));sound(300+p.blocks*12,.07,'triangle');addParticles(p.blockX,420-p.blocks*27,colors[p.blocks%4],6);if(p.blocks>=14)finish(true);}
function grabClaw(){if(!running||p.grabbing)return;p.grabbing=true;p.clawY=125;sound(220,.08);}
function pourMix(){if(!running||game!=='mixology')return;const target=clamp(80-(p.mixRound||1)*8+(p.masteryLevel>=2?8:0),22,80),low=100-target;if(p.pour>=low&&p.pour<=100){p.perfects++;combo++;scoreBy(35+p.mixRound*8+Math.min(20,combo*2)+(p.masteryLevel>=4?8:0));sound(620+p.mixRound*35,.1,'triangle');p.mixRound++;if(p.mixRound>6){scoreBy(100);finish(true);}}else{p.misses++;combo=0;sound(110,.1,'sawtooth');if(p.misses>=3){finish();return;}}p.pour=0;}
function onDown(e){pointer(e);if(!running)return;swipeStartX=mouse.x;sound(480,.025);if(game==='racer'){p.touchAuto=true;p.touchBrake=mouse.y<190;p.touchDir=p.touchBrake?0:(mouse.x<450?-1:1);}if(game==='billiards'&&p.current==='player'&&!p.shotActive){p.aiming=true;p.aimStartX=mouse.x;p.aimStartY=mouse.y;}if(game==='pulse'){if(mouse.y>300&&mouse.x<250){if(p.grounded){p.vy=-470;p.grounded=false;}}else if(mouse.x>650){if(p.energy>0){p.energy--;objects.push({type:'shot',x:p.x+22,y:p.y,vx:520,vy:0});}}else p.touchDir=mouse.x<450?-1:1;}if(game==='moto'){if(mouse.x<300&&mouse.y>250){if(p.y>=330)p.vy=-430;}else p.touchAccelerate=true;}if(game==='moonquest'){if(mouse.x>700&&mouse.y>380)p.attacking=true;else if(mouse.x<180&&mouse.y>380)p.touchGuard=true;else if(mouse.x<180&&mouse.y<180)p.shield=!p.shield;else{p.targetX=clamp(mouse.x,130,770);p.targetY=clamp(mouse.y,145,420);}}
if(game==='skeeball'&&!p.rolling){p.drag=true;p.dragStartY=mouse.y;p.dragX=mouse.x;}
if(game==='whack'){const i=Math.round((mouse.x-230)/220)+Math.floor((mouse.y-180)/112)*3;const n=objects.findIndex(o=>o.id===i);if(n>=0){objects.splice(n,1);awardStreak(10,mouse.x,mouse.y,'#b8dfaa');sound(560,.07);addParticles(mouse.x,mouse.y,'#9ecb9b',5);}else{p.miss++;combo=0;sound(120,.07);if(p.miss>=3)finish();}}
if(game==='target'){const i=objects.findIndex(o=>Math.hypot(o.x-mouse.x,o.y-mouse.y)<o.r+8);if(i>=0){const o=objects.splice(i,1)[0];awardStreak(o.gold?60+(p.masteryLevel>=4?15:0):Math.round(42-o.r),o.x,o.y,o.gold?'#f4d27a':'#e7a1b5');sound(o.gold?900:500,.09,'triangle');addParticles(o.x,o.y,o.gold?'#f4d27a':'#e7a1b5');}else combo=0;}
if(game==='memory'&&seqPhase==='input'){const i=(mouse.x>450?1:0)+(mouse.y>300?2:0);if(i===sequence[seqPos]){seqPos++;sound(360+i*120,.12,'sine');if(seqPos>=sequence.length){awardStreak(sequence.length*15,450,270,'#c9b5ff');round++;seqClock=.55;seqPhase='pause';sequenceTimer=setTimeout(()=>{sequenceTimer=0;if(running&&game==='memory'){nextSequence();draw();}},550);}}else{combo=0;sound(100,.2,'sawtooth');finish();}}
if(game==='rhythm'){const lane=clamp(Math.round((mouse.x-200)/165),0,3);hitRhythm(lane);}
if(game==='chef'){const i=clamp(Math.floor((mouse.x-190)/145),0,3);if(i===(p.ticketTarget||[1,3,0])[p.step]){p.step++;scoreBy(15+(p.combo||0)*3);sound(420+p.step*90,.06,'triangle');if(p.step>=3){p.ticket++;p.step=0;p.ticketClock=0;p.combo++;p.ticketTarget=Array.from({length:3},()=>Math.floor(Math.random()*4));if(p.ticket>=5){scoreBy(80);finish(true);}}}else{p.misses++;p.combo=0;p.step=0;sound(110,.1,'sawtooth');if(p.misses>=3)finish();}}
if(game==='mixology')pourMix();
if(game==='ringtoss'&&p.rings>0&&!p.ringFlight){const target=p.aim||mouse.x,dx=target-450;p.ringFlight={x:450,y:420,vx:dx*.9,vy:-430,life:1.4};p.rings--;sound(520,.08,'triangle');}
if(game==='gemdig'){const col=clamp(Math.floor((mouse.x-190)/104),0,4),row=clamp(Math.floor((mouse.y-150)/78),0,3),tile=p.grid[row*5+col];if(tile&&!tile.revealed){tile.revealed=true;p.digs++;if(tile.gem){p.gems++;awardStreak(25,mouse.x,mouse.y,'#a8e8df');sound(780,.1,'triangle');}else if(tile.hazard){p.hearts--;combo=0;sound(120,.15,'sawtooth');popText('CRACKED TILE',mouse.x,mouse.y,'#ef9b86');}else{scoreBy(4);sound(260,.05);}if(p.gems>=6){scoreBy(100);finish(true);}else if(p.hearts<=0||p.digs>=20){finish(false);}}}
if(game==='stack')dropStack();
if(game==='pinball'&&!p.launched){p.launched=true;p.vx=rand(-65,65);p.vy=-460;sound(180,.15,'sawtooth');}else if(game==='pinball'&&mouse.y>400){p.vy=-Math.abs(p.vy)-330;p.vx+=(mouse.x<450?-85:85);sound(280,.06);}
if(game==='claw')grabClaw();
if(game==='airhockey'){mouse.y=clamp(mouse.y,300,430);}
}
function onMove(e){pointer(e);if(game==='moto'&&running)p.angle=clamp((mouse.y-260)/280,-.6,.6);if(game==='pulse'&&running&&p.touchDir)p.touchDir=mouse.x<450?-1:1;if(game==='sushi'&&running)p.x=clamp(mouse.x,190,710);if(game==='meteor'&&running)p.x=clamp(mouse.x,190,710);if(game==='airhockey') {mouse.x=clamp(mouse.x,160,740);mouse.y=clamp(mouse.y,295,430);}if(game==='skeeball'&&p.drag){p.ballX=clamp(mouse.x,150,750);p.ballY=415;}}
function onUp(e){pointer(e);if(game==='racer'){p.touchDir=0;p.touchBrake=false;}if(game==='billiards'&&p.aiming&&running&&p.current==='player'&&!p.shotActive){const dx=p.cue.x-mouse.x,dy=p.cue.y-mouse.y,d=Math.hypot(dx,dy);if(d>12){const power=clamp(d*3.4*(p.masteryLevel>=2?1.08:1)*(p.masteryLevel>=4?1.06:1),110,700);p.cue.vx=dx/d*power;p.cue.vy=dy/d*power;p.shotActive=true;p.turnPocketed=0;p.turnFoul=false;p.settleClock=0;sound(185,.09,'triangle');}p.aiming=false;}if(game==='moonquest')p.touchGuard=false;if(game==='pulse')p.touchDir=0;if(game==='moto')p.touchAccelerate=false;if(game==='racer'&&running&&Math.abs(mouse.x-swipeStartX)>25)p.lane=clamp(p.lane+(mouse.x<swipeStartX?1:-1),0,2);if(game==='skeeball'&&p.drag&&running){const power=clamp((mouse.y-p.dragStartY)*4,260,680);p.vx=(mouse.x-p.dragX)*2.1;p.vy=-power;p.rolling=true;p.drag=false;sound(190,.1,'triangle');}}
function keydown(e){keys[e.key]=true;if(!running)return;
const arrowKeys=['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'],cursorGames=!['pulse','moto','moonquest','racer','sushi','meteor'].includes(game);
if(arrowKeys.includes(e.key)&&cursorGames){const step=e.shiftKey?46:27;mouse.x=clamp(mouse.x+(e.key==='ArrowRight'?step:e.key==='ArrowLeft'?-step:0),85,815);mouse.y=clamp(mouse.y+(e.key==='ArrowDown'?step:e.key==='ArrowUp'?-step:0),85,455);const rect=canvas.getBoundingClientRect();onMove({clientX:rect.left+mouse.x/W*rect.width,clientY:rect.top+mouse.y/H*rect.height,keyboardCursor:true});keyboardAim=true;e.preventDefault();}
if(e.key==='Enter'&&keyboardAim){const rect=canvas.getBoundingClientRect();onDown({clientX:rect.left+mouse.x/W*rect.width,clientY:rect.top+mouse.y/H*rect.height,keyboardCursor:true});keyboardAim=true;e.preventDefault();}if(game==='pulse'&&e.key.toLowerCase()==='z'&&running){if(p.energy>0){p.energy--;objects.push({type:'shot',x:p.x+22,y:p.y,vx:520,vy:0});sound(520,.045,'square');}}
if(game==='moonquest'&&(e.key===' '||e.key.toLowerCase()==='z'))p.attacking=true;
if(e.key===' '){e.preventDefault();if(game==='stack')dropStack();if(game==='pinball'&&!p.launched){p.launched=true;p.vy=-460;p.vx=35;sound(180,.15,'sawtooth');}if(game==='claw')grabClaw();if(game==='mixology')pourMix();}
if(game==='moto'&&e.key===' '&&p.y>=330)p.vy=-430;if(game==='moonquest'&&e.key.toLowerCase()==='x')p.shield=!p.shield;
if(game==='rhythm'){const lanes={d:0,f:1,j:2,k:3};const lane=lanes[e.key.toLowerCase()];if(lane!==undefined)hitRhythm(lane);}
}
function keyup(e){keys[e.key]=false;if(e.key==='Enter'&&keyboardAim){const rect=canvas.getBoundingClientRect();onUp({clientX:rect.left+mouse.x/W*rect.width,clientY:rect.top+mouse.y/H*rect.height,keyboardCursor:true});keyboardAim=true;}}
$('#game-grid')?.addEventListener('click',e=>{const b=e.target.closest('[data-game]');if(b)open(b.dataset.game);});
function openTableGame(id){if(!['airhockey','billiards'].includes(id))return;activeTableDuel={stake:10,payout:18};open(id);$('#game-help').textContent+='  Match entry: 10 tokens. Win to receive 18 tokens back.';$('#control-hint').textContent='10 TOKEN ENTRY · WIN RETURN 18 · '+(id==='airhockey'?'Move your mallet by touch or mouse':'Drag away from cue ball to shoot · arrows + Enter');}
window.addEventListener('nexus:table-play',e=>openTableGame(e.detail?.gameId));
window.addEventListener('nexus:arcade-play',e=>{const id=e.detail?.gameId;if(id==='hoops'){window.location.href='./hoops.html';return;}activeTableDuel=null;if(games[id])open(id);});
$('#start').addEventListener('click',start);$('#close').addEventListener('click',()=>{running=false;cancelAnimationFrame(raf);window.dispatchEvent(new CustomEvent('nexus:game3d-stop'));overlay.hidden=true;activeTableDuel=null;});
canvas.addEventListener('pointerdown',e=>{keyboardAim=false;try{canvas.setPointerCapture(e.pointerId);}catch{}onDown(e);});canvas.addEventListener('pointermove',onMove);canvas.addEventListener('pointerup',onUp);canvas.addEventListener('pointercancel',onUp);
window.addEventListener('keydown',keydown);window.addEventListener('keyup',keyup);
const saved=(()=>{try{return JSON.parse(localStorage.getItem('neon-nexus-player-v1')||'{}')}catch{return {}}})();$('#arcade-tokens').textContent=saved.tokens??250;$('#arcade-tickets').textContent=Number(saved.tickets)||0;
const serviceModal=$('#service-modal'),serviceTitle=$('#service-title'),serviceKicker=$('#service-kicker'),serviceCopy=$('#service-copy'),serviceItems=$('#service-items'),serviceStatus=$('#service-status'),prizeToolbar=$('#prize-toolbar'),prizeBalance=$('#prize-balance'),prizeFilters=$('#prize-filters'),prizeCollection=$('#prize-collection'),prizeViewToggle=$('#prize-view-toggle');
const foodMenu=[['Clay Oven Flatbread','Roasted tomato, basil and whipped ricotta',38],['Moon Garden Bowl','Warm grains, greens, avocado and citrus',32],['Crispy Comet Tenders','Golden crunchy tenders with herb dip',30],['Starlight Mac & Cheese','Creamy three-cheese comfort bowl',28],['Sushi Garden Plate','Six fresh garden and salmon-style rolls',42],['Mini Meteor Sliders','Three little house sliders with fries',45],['Honey Cloud Sundae','Vanilla, honeycomb and berry ripple',24],['Warm Cinnamon Knots','Soft baked knots with vanilla glaze',20]];
const drinkMenu=[['Nebula Berry Fizz','Blueberry, lime, soda and crushed ice',18],['Peach Moon Cooler','Peach nectar, mint and sparkling water',18],['Glow Garden Lemonade','Fresh lemon, basil and a little sparkle',16],['Cosmic Cocoa','Warm chocolate, vanilla cloud and cinnamon',20],['Stardust Smoothie','Mango, banana and coconut',22],['Midnight Mocha','Espresso, cocoa and steamed milk',22],['Ginger Beer','Bright, spicy ginger with a crisp finish',17],['Wine','A glass of the house red or white',34],['Gin and Tonic','Juniper gin, tonic and fresh lime',38]];
let jukeboxTimer=null,jukeboxStep=0;
function readPlayer(){try{return JSON.parse(localStorage.getItem('neon-nexus-player-v1')||'{}')}catch{return {}}}
function writePlayer(saved){localStorage.setItem('neon-nexus-player-v1',JSON.stringify(saved));$('#arcade-tokens').textContent=saved.tokens??250;$('#arcade-tickets').textContent=Number(saved.tickets)||0;}
const prizeCatalog=[
 {id:'sticker-pack',name:'Nexus Sticker Pack',category:'Collectibles',description:'A glossy set of arcade mascots and neon district decals.',icon:'✨',cost:65,rarity:'COMMON',stock:40},
 {id:'keychain',name:'Comet Keychain',category:'Collectibles',description:'A little hand-painted comet to take home.',icon:'☄️',cost:95,rarity:'COMMON',stock:32},
 {id:'mystery-capsule',name:'Mystery Capsule',category:'Collectibles',description:'One surprise mini collectible from the Nexus series.',icon:'🎁',cost:180,rarity:'UNCOMMON',stock:18},
 {id:'clay-figure',name:'Limited Clay Arcade Figure',category:'Collectibles',description:'A numbered miniature of a favourite arcade character.',icon:'🧸',cost:520,rarity:'RARE',stock:8},
 {id:'moon-moth',name:'Moon Moth Plush',category:'Plush',description:'A soft, squishy moth with embroidered starry wings.',icon:'🦋',cost:220,rarity:'UNCOMMON',stock:20},
 {id:'comet-bear',name:'Giant Comet Bear',category:'Plush',description:'The big cuddle prize from the top shelf.',icon:'🐻',cost:980,rarity:'RARE',stock:6},
 {id:'slime-kit',name:'Nebula Slime Lab',category:'Toys',description:'Mix shimmering colours and make your own cosmic putty.',icon:'🫧',cost:150,rarity:'COMMON',stock:16},
 {id:'puzzle-cube',name:'Prism Puzzle Cube',category:'Toys',description:'A tactile colour-shifting brain teaser.',icon:'🧩',cost:240,rarity:'UNCOMMON',stock:14},
 {id:'robot-kit',name:'Pocket Bot Builder',category:'Toys',description:'A build-it-yourself mini robot with moving parts.',icon:'🤖',cost:680,rarity:'RARE',stock:7},
 {id:'star-projector',name:'Little Galaxy Projector',category:'Tech',description:'Fill a bedroom ceiling with drifting stars.',icon:'🌌',cost:1250,rarity:'RARE',stock:5},
 {id:'mini-speaker',name:'Pocket Bluetooth Speaker',category:'Tech',description:'A compact rechargeable speaker for everyday adventures.',icon:'🔊',cost:1750,rarity:'EPIC',stock:4},
 {id:'gaming-headset',name:'Nexus Gaming Headset',category:'Tech',description:'Over-ear sound with a soft padded headband.',icon:'🎧',cost:3200,rarity:'EPIC',stock:3},
 {id:'retro-handheld',name:'Retro Pocket Arcade',category:'Big Wins',description:'A dedicated handheld with a collection of classic-style games.',icon:'🕹️',cost:5200,rarity:'LEGENDARY',stock:2},
 {id:'grand-prize',name:'Ultimate Nexus Prize Bundle',category:'Big Wins',description:'The showcase bundle: plush, collectibles and premium tech.',icon:'🏆',cost:9000,rarity:'LEGENDARY',stock:1},
 {id:'vip-night',name:'Nexus VIP Night Pass',category:'Experiences',description:'A special evening pass with a hosted arcade tour and a reserved lounge table.',icon:'🌙',cost:1450,rarity:'EPIC',stock:4},
 {id:'mastery-medal',name:'Cabinet Champion Medal',category:'Experiences',description:'A hand-finished medal for players who master their favourite cabinet.',icon:'🏅',cost:2200,rarity:'EPIC',stock:3},
 {id:'golden-key',name:'Golden Prize Vault Key',category:'Experiences',description:'A numbered collector key made for the most dedicated Nexus regulars.',icon:'🗝️',cost:6400,rarity:'LEGENDARY',stock:1}
];
const prizeCategories=['All','Plush','Toys','Collectibles','Tech','Big Wins','Experiences'];let prizeCategory='All',prizeView='shop';
function renderPrizeExchange(){
 const saved=readPlayer(),today=new Date().toISOString().slice(0,10);if(saved.prizeRestockDay!==today){saved.prizeStock=Object.fromEntries(prizeCatalog.map(item=>[item.id,item.stock]));saved.prizeRestockDay=today;writePlayer(saved);}
 const tickets=Number(saved.tickets)||0,haul=saved.prizes||[],owned=haul.reduce((n,item)=>n+(Number(item.quantity)||0),0);
 prizeBalance.textContent='🎟 '+tickets.toLocaleString()+' TICKETS AVAILABLE  ·  '+owned+' PRIZES IN YOUR HAUL';
 prizeFilters.innerHTML='';prizeCategories.forEach(category=>{const b=document.createElement('button');b.className='prize-filter';b.type='button';b.textContent=category;b.setAttribute('aria-pressed',String(prizeCategory===category));b.addEventListener('click',()=>{prizeCategory=category;renderPrizeExchange();});prizeFilters.append(b);});
 prizeViewToggle.textContent=prizeView==='shop'?'MY PRIZE HAUL':'BACK TO PRIZE SHOP';
 serviceItems.hidden=prizeView!=='shop';prizeCollection.hidden=prizeView!=='haul';
 if(prizeView==='shop'){
  serviceItems.innerHTML='';const items=prizeCatalog.filter(item=>prizeCategory==='All'||item.category===prizeCategory);
  items.forEach(item=>{const stock=Number((saved.prizeStock||{})[item.id]??item.stock),card=document.createElement('article');card.className='service-item prize-card';card.dataset.rarity=item.rarity;
   const icon=document.createElement('span');icon.className='prize-icon';icon.textContent=item.icon;
   const rarity=document.createElement('span');rarity.className='prize-rarity';rarity.textContent=item.rarity;
   const name=document.createElement('b');name.textContent=item.name;
   const desc=document.createElement('small');desc.textContent=item.description;
   const tag=document.createElement('span');tag.className='prize-tag';tag.textContent=item.category;
   const cost=document.createElement('strong');cost.className='prize-cost';cost.textContent='🎟 '+item.cost.toLocaleString()+' TICKETS';
   const stockLabel=document.createElement('span');stockLabel.className='prize-stock';stockLabel.textContent=stock>0?(stock<=5?'LIMITED STOCK · '+stock+' LEFT':'IN STOCK · '+stock):'SOLD OUT';
   const redeem=document.createElement('button');redeem.type='button';redeem.className='prize-redeem';redeem.textContent=tickets>=item.cost?'REDEEM PRIZE':'NEED '+(item.cost-tickets).toLocaleString()+' MORE';
   redeem.disabled=stock<=0||tickets<item.cost;redeem.addEventListener('click',()=>redeemPrize(item));card.append(icon,rarity,name,desc,tag,cost,stockLabel,redeem);serviceItems.append(card);
  });
 }else{
  prizeCollection.innerHTML='';const heading=document.createElement('h3');heading.textContent='YOUR PRIZE HAUL';prizeCollection.append(heading);
  if(!haul.length){const empty=document.createElement('div');empty.className='prize-haul-empty';empty.textContent='Your shelf is waiting. Redeem your first prize and it will appear here.';prizeCollection.append(empty);}
  haul.forEach(entry=>{const item=prizeCatalog.find(p=>p.id===entry.id),row=document.createElement('div');row.className='prize-haul-item';const icon=document.createElement('span');icon.className='prize-haul-icon';icon.textContent=item?.icon||'🎁';const details=document.createElement('div'),name=document.createElement('b'),meta=document.createElement('small');name.textContent=entry.name||item?.name||'Mystery prize';meta.textContent='Quantity: '+(Number(entry.quantity)||0)+' · Last redeemed '+new Date(entry.lastRedeemed||entry.at||Date.now()).toLocaleDateString();details.append(name,meta);row.append(icon,details);prizeCollection.append(row);});
  const history=document.createElement('div');history.className='prize-history';history.textContent='RECENT REDEMPTIONS · '+(saved.prizeHistory||[]).slice(0,5).map(h=>h.name+' ('+Number(h.cost).toLocaleString()+' tickets)').join(' · ');prizeCollection.append(history);
 }
}
function redeemPrize(item){
 const saved=readPlayer(),tickets=Number(saved.tickets)||0; saved.prizeStock=saved.prizeStock||{};
 const stock=Number(saved.prizeStock[item.id]??item.stock);
 if(stock<=0){serviceStatus.textContent='That prize has sold out. Check another shelf.';return;}
 if(tickets<item.cost){serviceStatus.textContent='You need '+(item.cost-tickets)+' more tickets for '+item.name+'.';return;}
 saved.tickets=tickets-item.cost;saved.prizeStock[item.id]=stock-1;saved.prizes=saved.prizes||[];
 let owned=saved.prizes.find(p=>p.id===item.id);if(!owned){owned={id:item.id,name:item.name,quantity:0};saved.prizes.push(owned);}owned.quantity++;owned.lastRedeemed=Date.now();
 saved.prizeHistory=saved.prizeHistory||[];saved.prizeHistory.unshift({id:item.id,name:item.name,cost:item.cost,at:Date.now()});saved.prizeHistory=saved.prizeHistory.slice(0,50);
 writePlayer(saved);serviceStatus.textContent='Prize redeemed! '+item.name+' has been added to your prize haul.';window.dispatchEvent(new CustomEvent('nexus:prize-redeemed',{detail:{name:item.name}}));renderPrizeExchange();
}

let pokerMachineIndex=0,pokerHand=[],pokerHolds=[],pokerPhase='deal',pokerLast='Insert 5 tokens to deal a hand.';
const pokerPaytable=[['Royal flush',250],['Straight flush',50],['Four of a kind',25],['Full house',9],['Flush',6],['Straight',4],['Three of a kind',3],['Two pair',2],['Jacks or better',1]];
const pokerSuits=['♠','♥','♦','♣'],pokerRanks=['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
function pokerDeck(){const d=[];for(let s=0;s<4;s++)for(let v=2;v<=14;v++)d.push({v,s,rank:pokerRanks[v-2],suit:pokerSuits[s]});for(let i=d.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[d[i],d[j]]=[d[j],d[i]];}return d;}
function pokerRank(hand){
 const vals=hand.map(c=>c.v).sort((a,b)=>a-b),counts={};hand.forEach(c=>counts[c.v]=(counts[c.v]||0)+1);
 const groups=Object.values(counts).sort((a,b)=>b-a),flush=hand.every(c=>c.s===hand[0].s),straight=vals.every((v,i)=>i===0||v===vals[i-1]+1)||(vals.join(',')==='2,3,4,5,14');
 if(flush&&straight&&vals[0]===10)return 'Royal flush';
 if(flush&&straight)return 'Straight flush';
 if(groups[0]===4)return 'Four of a kind';
 if(groups[0]===3&&groups[1]===2)return 'Full house';
 if(flush)return 'Flush';
 if(straight)return 'Straight';
 if(groups[0]===3)return 'Three of a kind';
 if(groups[0]===2&&groups[1]===2)return 'Two pair';
 if(groups[0]===2&&Object.keys(counts).some(v=>counts[v]===2&&Number(v)>=11))return 'Jacks or better';
 return 'No win';
}
function renderPoker(){
 serviceItems.innerHTML='';
 const saved=readPlayer(),balance=Number(saved.tokens??250);
 const deckWrap=document.createElement('div');deckWrap.className='poker-hand';
 if(pokerHand.length) pokerHand.forEach((card,i)=>{const b=document.createElement('button');b.type='button';b.className='poker-card'+(pokerHolds[i]?' held':'')+(card.s===1||card.s===2?' red':'');b.innerHTML='<span>'+card.rank+'</span><strong>'+card.suit+'</strong><small>'+(pokerHolds[i]?'HELD':'TAP TO HOLD')+'</small>';b.disabled=pokerPhase!=='hold';b.addEventListener('click',()=>{pokerHolds[i]=!pokerHolds[i];renderPoker();});deckWrap.append(b);});
 else deckWrap.innerHTML='<p class="poker-empty">Your seat is waiting. Deal five cards and choose what to hold.</p>';
 serviceItems.append(deckWrap);
 const controls=document.createElement('div');controls.className='poker-actions';
 const action=document.createElement('button');action.className='service-item poker-deal';action.innerHTML='<b>'+(pokerPhase==='hold'?'DRAW THE REST':'DEAL FIVE CARDS')+'</b><small>'+(pokerPhase==='hold'?'Keep your selected cards and replace the rest.':'Five-token entry · Jacks or better pays 1×')+'</small><strong>'+(pokerPhase==='hold'?'DRAW':'5 ✦ TOKENS')+'</strong>';
 action.addEventListener('click',()=>{
  const current=readPlayer(),wallet=Number(current.tokens??250);
  if(pokerPhase==='deal'){
   if(wallet<5){serviceStatus.textContent='You need 5 tokens to play this hand.';return;}
   current.tokens=wallet-5;writePlayer(current);pokerHand=pokerDeck().slice(0,5);pokerHolds=[false,false,false,false,false];pokerPhase='hold';pokerLast='Choose the cards to hold, then draw.';renderPoker();return;
  }
  const deck=pokerDeck();pokerHand=pokerHand.map((card,i)=>pokerHolds[i]?card:deck.pop());const rank=pokerRank(pokerHand),award=pokerPaytable.find(row=>row[0]===rank)?.[1]||0;
  if(award){const latest=readPlayer();latest.tokens=Number(latest.tokens??250)+award*5;writePlayer(latest);pokerLast=rank+'! You won '+(award*5)+' tokens.';window.dispatchEvent(new CustomEvent('nexus:character-celebrate'));}else pokerLast='No winning hand this time. Try a different hold strategy.';
  pokerPhase='result';renderPoker();
 });
 controls.append(action);
 if(pokerPhase==='result'){const again=document.createElement('button');again.className='service-item';again.innerHTML='<b>NEW HAND</b><small>Play another five-card draw round.</small><strong>DEAL AGAIN</strong>';again.addEventListener('click',()=>{pokerHand=[];pokerHolds=[];pokerPhase='deal';pokerLast='Ready for another hand.';renderPoker();});controls.append(again);}
 serviceItems.append(controls);
 const table=document.createElement('div');table.className='poker-paytable';table.innerHTML='<b>PAY TABLE · 5 TOKEN BET</b>'+pokerPaytable.map(([name,mult])=>'<span>'+name+'<strong>'+mult*5+'</strong></span>').join('')+'<small>Practice tokens only · no cash value</small>';serviceItems.append(table);
 serviceStatus.textContent=pokerLast+'  Balance: '+Number(readPlayer().tokens??250)+' tokens.';
}

function openService(service,table,npc,machine){
 if(service!=='jukebox'&&jukeboxTimer){clearInterval(jukeboxTimer);jukeboxTimer=null;}
 serviceItems.innerHTML='';serviceItems.hidden=false;prizeToolbar.hidden=true;prizeCollection.hidden=true;prizeView='shop';serviceStatus.textContent='';serviceModal.hidden=false;
 if(service==='poker'){
  const names=['The Glow · Classic Video Poker','Moon Deal · Five Card Draw','Lucky Hand · Neon Poker'];
  serviceKicker.textContent='THE GLOW BAR · VIDEO POKER';serviceTitle.textContent=names[Number(machine)||0];serviceCopy.textContent='Five-card draw. Deal a hand, tap cards to hold them, then draw replacements. Build a winning hand to earn arcade tokens.';pokerMachineIndex=Number(machine)||0;pokerHand=[];pokerHolds=[];pokerPhase='deal';pokerLast='Insert 5 tokens to deal a hand.';renderPoker();
 }else if(service==='bar'){
  serviceKicker.textContent='THE GLOW BAR · KITCHEN';serviceTitle.textContent='Food & drink menu';serviceCopy.textContent='Choose something freshly made. Orders take a little time; collect them at the kitchen pass.';
  [...foodMenu,...drinkMenu].forEach(([name,desc,cost])=>{const b=document.createElement('button');b.className='service-item';b.innerHTML='<b>'+name+'</b><small>'+desc+'</small><strong>✦ '+cost+' TOKENS · ORDER</strong>';b.addEventListener('click',()=>{const saved=readPlayer(),balance=Number(saved.tokens??250);if(balance<cost){serviceStatus.textContent='Not enough tokens yet. Play a cabinet to earn more.';return;}saved.tokens=balance-cost;saved.orders=saved.orders||[];const id='order-'+Date.now()+'-'+Math.floor(Math.random()*10000);saved.orders.push({id,name,cost,at:Date.now(),prepSeconds:12,status:'Preparing'});writePlayer(saved);window.dispatchEvent(new CustomEvent('nexus:order-created',{detail:{name}}));serviceStatus.textContent=name+' ordered! Your kitchen ticket is in the queue. Collect it from the pass when it is ready.';});serviceItems.append(b);});
 }else if(service==='host'){
  serviceKicker.textContent='NEXUS DINING · HOST';serviceTitle.textContent='Welcome! Table for you?';serviceCopy.textContent='Choose your party size. The host assigns the first available table.';
  [1,2,3].forEach(n=>{const b=document.createElement('button');b.className='service-item';b.innerHTML='<b>Table for '+(n===1?'one':n===2?'two':'three')+'</b><small>Request seating in the dining room</small><strong>REQUEST SEATING ↗</strong>';b.addEventListener('click',()=>{const saved=readPlayer();saved.reservations=saved.reservations||[];const occupied=saved.reservations.filter(r=>r.status!=='Finished').map(r=>r.table);const tableNo=[1,2,3].find(t=>!occupied.includes(t));if(!tableNo){serviceStatus.textContent='Every table is occupied right now. Please try again shortly.';return;}const reservation={party:n,table:tableNo,at:Date.now(),status:'Reserved'};saved.reservations.push(reservation);saved.reservation=reservation;writePlayer(saved);serviceStatus.textContent='Table '+tableNo+' is yours for '+n+'. Walk over to your table to sit down.';});serviceItems.append(b);});
 }else if(service==='pass'){
  serviceKicker.textContent='OPEN KITCHEN · PICKUP PASS';serviceTitle.textContent='Order collection';serviceCopy.textContent='Tickets need time in the kitchen. Collect a finished plate or drink here.';
  const saved=readPlayer(),orders=saved.orders||[];const pending=orders.filter(o=>o.status==='Preparing'||o.status==='Ready');
  if(!pending.length){const p=document.createElement('p');p.className='service-empty';p.textContent='No active kitchen tickets. Place an order at the Glow Bar.';serviceItems.append(p);}
  pending.forEach(order=>{const ready=Date.now()-order.at>=Number(order.prepSeconds||12)*1000;if(ready&&order.status==='Preparing'){order.status='Ready';window.dispatchEvent(new CustomEvent('nexus:order-ready',{detail:{name:order.name}}));}const b=document.createElement('button');b.className='service-item';b.innerHTML='<b>'+order.name+'</b><small>'+(ready?'Fresh from the kitchen · ready to collect':'Cooking · '+Math.max(1,Math.ceil((Number(order.prepSeconds||12)*1000-(Date.now()-order.at))/1000))+' seconds remaining')+'</small><strong>'+(ready?'COLLECT ORDER ✓':'STILL PREPARING')+'</strong>';b.disabled=!ready;b.addEventListener('click',()=>{const latest=readPlayer(),item=(latest.orders||[]).find(o=>o.id===order.id);if(!item||item.status!=='Ready')return;item.status='Carrying';item.collectedAt=Date.now();writePlayer(latest);serviceStatus.textContent=item.name+' collected. Take it to your table and interact to serve it.';b.disabled=true;b.querySelector('strong').textContent='COLLECTED ✓';});serviceItems.append(b);});
  writePlayer(saved);
 }else if(service==='npc'){
  serviceKicker.textContent='NEXUS DISTRICT · VISITOR QUEST';serviceTitle.textContent=npc?.name||'Arcade visitor';serviceCopy.textContent=npc?.intro||'A visitor catches your eye and seems happy to chat.';
  const lines=npc?.dialogue||{},questBook={pip:{title:'Warm-up Circuit',description:'Finish three arcade sessions of any kind.',reward:90,kind:'sessions',target:3},moxie:{title:'Find the Pocket',description:'Reach a five-hit streak in Beat Foundry.',reward:140,kind:'rhythm',target:5},juniper:{title:'Cabinet Explorer',description:'Play five different arcade experiences.',reward:180,kind:'unique',target:5},rook:{title:'Rack and Return',description:'Complete one Moonlight Billiards match.',reward:120,kind:'billiards',target:1}};
  const quest=questBook[npc?.questId],saved=readPlayer(),sessions=saved.arcadeSessions||[],claimed=saved.visitorQuests||{},unique=new Set(sessions.map(s=>s.game)).size,progress=quest?(quest.kind==='sessions'?sessions.length:quest.kind==='rhythm'?Math.max(0,...sessions.filter(s=>s.game==='rhythm').map(s=>Number(s.bestCombo)||0)):quest.kind==='unique'?unique:sessions.filter(s=>s.game==='billiards').length):0,done=!!(quest&&progress>=quest.target),already=!!claimed[npc?.questId];
  if(quest){const card=document.createElement('article');card.className='service-item visitor-quest';const heading=document.createElement('b');heading.textContent='✦ QUEST · '+quest.title;const desc=document.createElement('small');desc.textContent=quest.description;const meter=document.createElement('span');meter.className='quest-progress';meter.textContent=(already?'COMPLETED':Math.min(progress,quest.target)+' / '+quest.target+' COMPLETE')+' · REWARD '+quest.reward+' TICKETS';const claim=document.createElement('button');claim.type='button';claim.className='quest-claim';claim.textContent=already?'REWARD CLAIMED':done?'CLAIM REWARD':'QUEST IN PROGRESS';claim.disabled=!done||already;claim.addEventListener('click',()=>{const latest=readPlayer();latest.visitorQuests=latest.visitorQuests||{};if(latest.visitorQuests[npc.questId])return;latest.visitorQuests[npc.questId]={claimedAt:Date.now(),reward:quest.reward};latest.tickets=(Number(latest.tickets)||0)+quest.reward;latest.ticketHistory=latest.ticketHistory||[];latest.ticketHistory.unshift({game:'visitor-quest',score:0,amount:quest.reward,quest:quest.title,at:Date.now()});writePlayer(latest);openService('npc',null,npc);serviceStatus.textContent='Quest complete! '+quest.reward+' tickets added to your wallet.';});card.append(heading,desc,meter,claim);serviceItems.append(card);}
  [['CHAT','Ask how their night is going',lines.chat||'Pretty great. This place has a little bit of everything.'],['ASK FOR A TIP','Ask about a game or the prize room',lines.tip||'Try a few different cabinets. You might find a favourite.'],['HEAR A RUMOUR','Ask what is happening around the arcade',lines.rumour||'I heard the lucky wheel has a very rare jackpot.'],['SAY GOODBYE','End the conversation','Catch you around the arcade!']].forEach(([label,desc,line])=>{const button=document.createElement('button');button.className='service-item';button.innerHTML='<b>'+label+'</b><small>'+desc+'</small><strong>CHAT ↗</strong>';button.addEventListener('click',()=>{serviceCopy.textContent=line;serviceStatus.textContent=npc?.name+' smiles and nods.';});serviceItems.append(button);});
 }else if(service==='jukebox'){
  serviceKicker.textContent='NEXUS SOUND SYSTEM · TOKEN JUKEBOX';serviceTitle.textContent='Choose the room soundtrack';serviceCopy.textContent='Five tokens queues an original synthesized house loop. Pick a mood; you can switch tracks whenever you like.';
  const tracks=[['Moonlit Lobby',[262,330,392,523,392,330,294,392]],['Neon Boardwalk',[196,247,294,392,330,294,247,220]],['Afterglow Lounge',[220,277,330,440,392,330,277,247]],['Pixel Parade',[330,392,494,587,494,392,330,294]]];
  tracks.forEach(([name,notes])=>{const button=document.createElement('button');button.className='service-item';button.innerHTML='<b>'+name+'</b><small>Original ambient synth loop · 8-note repeating theme</small><strong>PLAY · 5 TOKENS</strong>';button.addEventListener('click',()=>{const saved=readPlayer(),balance=Number(saved.tokens??250);if(balance<5){serviceStatus.textContent='You need 5 tokens to play a track.';return;}saved.tokens=balance-5;writePlayer(saved);if(jukeboxTimer)clearInterval(jukeboxTimer);jukeboxStep=0;const playNote=()=>{sound(notes[jukeboxStep%notes.length],.24,'sine',.025);if(jukeboxStep%4===0)sound(notes[(jukeboxStep+2)%notes.length]/2,.32,'triangle',.012);jukeboxStep++;};playNote();jukeboxTimer=setInterval(playNote,420);serviceStatus.textContent='Now playing: '+name+'. 5 tokens spent.';button.querySelector('strong').textContent='NOW PLAYING ♪';});serviceItems.append(button);});
 }else if(service==='wheel'){
  serviceKicker.textContent='NEXUS LUCKY WHEEL · TICKET GAME';serviceTitle.textContent='Spin for up to 1,000 tickets';serviceCopy.textContent='Each spin costs 25 tokens. Odds are published and weighted: 0 tickets 50.5%, 10 tickets 25%, 25 tickets 12%, 50 tickets 7%, 100 tickets 3.5%, 250 tickets 1.5%, 500 tickets 0.45%, 1,000 tickets 0.05%.';
  const spin=document.createElement('button');spin.className='service-item';spin.innerHTML='<b>✦ SPIN THE WHEEL</b><small>One spin · 25 tokens · no purchase required to play other cabinets</small><strong>SPIN · 25 TOKENS</strong>';spin.addEventListener('click',()=>{const saved=readPlayer(),balance=Number(saved.tokens??250);if(balance<25){serviceStatus.textContent='You need 25 tokens for a spin. Play a cabinet to earn more.';return;}saved.tokens=balance-25;const roll=Math.random()*100,segments=[{max:50.5,tickets:0},{max:75.5,tickets:10},{max:87.5,tickets:25},{max:94.5,tickets:50},{max:98,tickets:100},{max:99.5,tickets:250},{max:99.95,tickets:500},{max:100,tickets:1000}],prize=segments.find(s=>roll<s.max)||segments[segments.length-1];saved.tickets=(Number(saved.tickets)||0)+prize.tickets;saved.wheelHistory=saved.wheelHistory||[];saved.wheelHistory.unshift({tickets:prize.tickets,at:Date.now()});saved.wheelHistory=saved.wheelHistory.slice(0,30);writePlayer(saved);$('#arcade-tickets').textContent=saved.tickets;serviceStatus.textContent='The wheel landed on '+prize.tickets.toLocaleString()+' tickets! Your wallet has been updated.';spin.querySelector('strong').textContent='SPIN AGAIN · 25 TOKENS';});serviceItems.append(spin);
 }else if(service==='prize-room'){
  serviceKicker.textContent='NEXUS ARCADE · WALKABLE PRIZE GALLERY';serviceTitle.textContent='Your collection, on display';serviceCopy.textContent='Your redeemed prizes appear on the gallery shelves. Keep playing, earn tickets and build a collection worth showing off.';prizeToolbar.hidden=false;prizeCategory='All';prizeView='haul';renderPrizeExchange();
 }else if(service==='prize'){
  serviceKicker.textContent='NEXUS ARCADE · PRIZE EXCHANGE';serviceTitle.textContent='Trade tickets for treasures';serviceCopy.textContent='Every game earns tickets. Save up for the big shelf prizes or take home a little reward today.';prizeToolbar.hidden=false;prizeCategory='All';prizeView='shop';renderPrizeExchange();
 }else{
  serviceKicker.textContent='NEXUS DINING · TABLE '+table;serviceTitle.textContent='Your table';serviceCopy.textContent='Take a seat, then serve any order you have collected from the kitchen pass.';
  const saved=readPlayer(),reservation=(saved.reservations||[]).find(r=>r.table===table&&r.status!=='Finished')||(saved.reservation&&saved.reservation.table===table?saved.reservation:null);
  if(reservation){const seat=document.createElement('button');seat.className='service-item';seat.innerHTML='<b>Take a seat · party of '+reservation.party+'</b><small>Your reservation at table '+table+'</small><strong>TAKE YOUR SEAT ✓</strong>';seat.addEventListener('click',()=>{const latest=readPlayer(),r=(latest.reservations||[]).find(x=>x.table===table&&x.status!=='Finished')||latest.reservation;if(r){r.status='Seated';latest.reservation=r;writePlayer(latest);}serviceStatus.textContent='You are seated at table '+table+'. Visit the kitchen pass to collect your order.';});serviceItems.append(seat);}
  const carry=(saved.orders||[]).filter(o=>o.status==='Carrying');if(carry.length){carry.forEach(order=>{const b=document.createElement('button');b.className='service-item';b.innerHTML='<b>Serve '+order.name+'</b><small>Deliver your collected order to this table</small><strong>SERVE AT TABLE '+table+' ✓</strong>';b.addEventListener('click',()=>{const latest=readPlayer(),item=(latest.orders||[]).find(o=>o.id===order.id);if(item&&item.status==='Carrying'){item.status='Served';item.table=table;item.servedAt=Date.now();writePlayer(latest);window.dispatchEvent(new CustomEvent('nexus:order-served',{detail:{name:item.name}}));serviceStatus.textContent='Served! '+item.name+' has arrived at table '+table+'.';b.disabled=true;b.querySelector('strong').textContent='SERVED ✓';}});serviceItems.append(b);});}
  if(!reservation&&!carry.length){const p=document.createElement('p');p.className='service-empty';p.textContent='No reservation or collected orders yet. Visit the host stand or Glow Bar.';serviceItems.append(p);}
 }
}
prizeViewToggle.addEventListener('click',()=>{prizeView=prizeView==='shop'?'haul':'shop';renderPrizeExchange();});
window.addEventListener('nexus:service-open',e=>openService(e.detail.service,e.detail.table,e.detail.npc,e.detail.machine));$('#service-close').addEventListener('click',()=>{serviceModal.hidden=true;if(jukeboxTimer){clearInterval(jukeboxTimer);jukeboxTimer=null;}});
})();
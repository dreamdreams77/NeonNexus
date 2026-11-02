(()=>{'use strict';
const $=s=>document.querySelector(s),canvas=$('#stage'),ctx=canvas.getContext('2d'),overlay=$('#overlay');
const W=900,H=520,colors=['#ef8b75','#f2ce77','#8ec7a4','#8bb7dc'];
const games={
skeeball:['COSMIC SKEE-BALL','Pull back and release to roll up the sculpted ramp. Aim for the centre rings.','Drag back · release','PRECISION'],
airhockey:['COMET AIR HOCKEY','Guard your goal and strike the puck past the little robot goalie. First to five wins.','Move your mallet','HEAD TO HEAD'],
whack:['MOON MOLES','Tap the clay moles when they pop up. Three misses end the round.','Tap the moles','REFLEX'],
target:['BUBBLE BLASTER','Pop drifting bubbles. Small bubbles are worth more; golden bubbles are worth extra.','Tap / click targets','MARKSMAN'],
memory:['PRISM SEQUENCE','Memorise the glowing colour sequence and repeat it. Each round adds a colour.','Tap the four tiles','MEMORY'],
rhythm:['BEAT FOUNDRY','Hit a note when it reaches the strike line. Use D F J K or tap its lane.','D · F · J · K / tap','RHYTHM'],
meteor:['METEOR MAYHEM','Dodge the falling rocks and collect glowing stars. Survive the whole round.','← → / A D / drag','SURVIVAL'],
racer:['TURBO TUNNELS','Change lanes to dodge traffic and collect turbo sparks. Three crashes end the race.','← → / A D / swipe','RACING'],
stack:['CLAY STACK','Drop each moving slab onto the tower. Misalignment trims the slab. Build as high as you can.','Tap / SPACE to drop','TIMING'],
pinball:['STARLIGHT PINBALL','Launch with SPACE. Hold ← and → to flip. Keep the ball alive; you have three balls.','SPACE · ← → / touch flippers','CLASSIC'],
claw:['LUCKY CLAW','The claw swings above the prize pit. Tap to lower it and try to grab a plush.','Tap / SPACE to grab','PRIZE SKILL']
};
let game='',running=false,score=0,time=40,last=0,raf=0,objects=[],p={},mouse={x:450,y:400},swipeStartX=0,keys={},audio=null,muted=false,sequence=[],seqPos=0,seqPhase='show',seqClock=0,combo=0,round=0,particles=[];
const rand=(a,b)=>a+Math.random()*(b-a),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function sound(freq=440,dur=.08,type='sine',vol=.035){if(muted)return;try{audio=audio||new(window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume();const o=audio.createOscillator(),g=audio.createGain();o.type=type;o.frequency.setValueAtTime(freq,audio.currentTime);g.gain.setValueAtTime(vol,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+dur);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+dur);}catch{}}
function scoreBy(n){score+=n;$('#score').textContent=score;popText('+'+n,mouse.x,mouse.y,'#ffe08a');}
function popText(t,x,y,c){particles.push({text:t,x,y,vy:-35,life:.8,c});}
function addParticles(x,y,c,n=8){for(let i=0;i<n;i++)particles.push({x,y,vx:rand(-100,100),vy:rand(-150,30),life:rand(.3,.8),r:rand(2,6),c});}
function reset(){score=0;time=40;objects=[];particles=[];p={x:450,y:420,lane:1,miss:0,hearts:3,balls:3,blocks:0,width:170,cx:450,clawX:200,clawY:125,clawDir:1,ballX:450,ballY:450,vx:0,vy:0,launched:false,drag:false,combo:0,goal:0,playerX:450,playerY:390,prevX:450,prevW:170,hitFlash:0};sequence=[];seqPos=0;seqPhase='show';seqClock=0;combo=0;round=0;last=performance.now();$('#score').textContent='0';$('#time').textContent='40';$('#result').textContent='';}
function open(id){game=id;const d=games[id];$('#game-title').textContent=d[0];$('#game-help').textContent=d[1];$('#control-hint').textContent=d[2];$('#game-type').textContent=d[3];overlay.hidden=false;$('#start').textContent='START GAME';reset();draw();}
window.nexusPlayArcadeGame=open;
function start(){reset();running=true;
if(game==='airhockey'){p.puck={x:450,y:270,vx:rand(-110,110),vy:210};p.botX=450;p.playerX=450;p.goal=0;p.botGoal=0;p.rally=0;p.aiMood='guard';p.serveClock=.65;}
if(game==='pinball'){p.ballX=450;p.ballY=458;p.vy=0;makeBumpers();}
if(game==='claw'){objects=Array.from({length:10},(_,i)=>({x:220+(i%5)*115,y:350+Math.floor(i/5)*55,r:rand(17,24),c:colors[i%4],kind:i%4}));}
if(game==='memory')nextSequence();
if(game==='stack'){p.width=170;p.cx=450;p.blocks=0;p.blockX=450;}
if(game==='whack')spawnMoles();
if(game==='skeeball'){p.ballX=450;p.ballY=415;}
raf=requestAnimationFrame(loop);}
function finish(win=false){if(!running)return;running=false;cancelAnimationFrame(raf);const earned=Math.max(2,Math.floor(score/10)+(win?5:0));$('#result').textContent=(win?'CABINET CLEARED! ':'ROUND OVER · ')+score+' POINTS · +'+earned+' TOKENS';$('#start').textContent='PLAY AGAIN';sound(win?880:190,.22,'triangle');try{const key='neon-nexus-player-v1',saved=JSON.parse(localStorage.getItem(key)||'{}');saved.tokens=(Number(saved.tokens)||250)+earned;saved.arcadeBest=saved.arcadeBest||{};saved.arcadeBest[game]=Math.max(Number(saved.arcadeBest[game])||0,score);localStorage.setItem(key,JSON.stringify(saved));$('#arcade-tokens').textContent=saved.tokens;}catch{}}
function rounded(x,y,w,h,r,c){ctx.fillStyle=c;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();}
function circle(x,y,r,c){ctx.fillStyle=c;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();}
function clay(x,y,r,c){ctx.save();ctx.translate(x,y);ctx.rotate(Math.sin(x*.013+y*.017)*.07);ctx.fillStyle=c;ctx.beginPath();ctx.moveTo(-r*.92,-r*.12);ctx.bezierCurveTo(-r,-r*.8,r*.35,-r*1.12,r*.84,-r*.45);ctx.bezierCurveTo(r*1.15,r*.15,r*.48,r*.98,-r*.22,r*.92);ctx.bezierCurveTo(-r*.85,r*.82,-r*1.08,r*.38,-r*.92,-r*.12);ctx.fill();ctx.globalAlpha=.22;ctx.strokeStyle='#fff5d9';ctx.lineWidth=Math.max(1,r*.07);ctx.beginPath();ctx.arc(-r*.12,-r*.13,r*.7,Math.PI*1.08,Math.PI*1.78);ctx.stroke();ctx.globalAlpha=.16;ctx.strokeStyle='#50394c';ctx.beginPath();ctx.arc(r*.1,r*.08,r*.83,.2,1.1);ctx.stroke();ctx.restore();}
function panel(x,y,w,h,c='#f1d9b8'){rounded(x+4,y+7,w,h,25,'#17162955');rounded(x,y,w,h,25,c);rounded(x+7,y+6,w-14,12,7,'#ffffff30');}
function base(title,sub){const g=ctx.createLinearGradient(0,0,900,520);g.addColorStop(0,'#63516a');g.addColorStop(.55,'#443d58');g.addColorStop(1,'#282d43');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);for(let i=0;i<85;i++){ctx.globalAlpha=.055;circle((i*137)%W,(i*79)%H,rand(1,2),'#fff');}ctx.globalAlpha=1;ctx.fillStyle='#f5dfbd';ctx.font='700 25px Fredoka, sans-serif';ctx.fillText(title,30,39);ctx.fillStyle='#d9c2c0';ctx.font='14px Fredoka, sans-serif';ctx.fillText(sub,30,64);for(let i=0;i<4;i++){ctx.globalAlpha=.12;ctx.strokeStyle='#f6d8b1';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(20+i*5,490+i*4);ctx.lineTo(880-i*7,490+i*4);ctx.stroke();}ctx.globalAlpha=1;}
function draw(){
base(games[game]?.[0]||'NEXUS ARCADE','HAND-SCULPTED CABINET  ·  '+(running?'PLAYING':'READY'));
switch(game){
case'skeeball':panel(85,90,730,390,'#b97f70');rounded(115,120,670,330,22,'#e8c79e');ctx.fillStyle='#956b68';ctx.beginPath();ctx.moveTo(175,435);ctx.lineTo(330,160);ctx.quadraticCurveTo(450,125,570,160);ctx.lineTo(725,435);ctx.closePath();ctx.fill();[90,55,27].forEach((r,i)=>{clay(450,220,r,['#8e678f','#d6a45e','#f5e1ae'][i]);circle(450,220,r*.64,'#55445f');ctx.fillStyle='#fff3d6';ctx.font='bold 17px Fredoka';ctx.textAlign='center';ctx.fillText([20,50,100][i],450,226);});clay(p.ballX,p.ballY,22,'#e98668');ctx.fillStyle='#5c4656';ctx.font='14px Fredoka';ctx.textAlign='center';ctx.fillText('PULL BACK  ↗  RELEASE',450,465);break;
case'airhockey':panel(110,85,680,390,'#b77c72');rounded(135,110,630,340,22,'#b9d8cf');ctx.strokeStyle='#fff2d9';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(150,280);ctx.lineTo(750,280);ctx.stroke();ctx.strokeRect(365,110,170,42);ctx.strokeRect(365,408,170,42);circle(450,280,66,'#e8ead9');ctx.fillStyle='#8a6673';ctx.fillRect(150,112,600,8);ctx.fillRect(150,440,600,8);clay(p.puck.x,p.puck.y,15,'#c85e66');clay(p.botX,150,26,'#8b759e');clay(p.playerX||mouse.x,410,27,'#edaa68');ctx.fillStyle='#493847';ctx.font='bold 18px Fredoka';ctx.fillText('YOU  '+p.goal+'   :   '+p.botGoal,150,500);ctx.font='13px Fredoka';ctx.fillText('RALLY '+(p.rally||0)+'  ·  '+(p.aiMood||'GUARD').toUpperCase(),560,500);break;
case'whack':panel(120,90,660,390,'#c5a184');for(let i=0;i<9;i++){const x=230+(i%3)*220,y=180+Math.floor(i/3)*112;clay(x,y+22,49,'#775b54');clay(x,y+17,38,'#9b7263');const mole=objects.find(o=>o.id===i);if(mole){clay(x,y-4,31,'#9dbd8b');circle(x-11,y-9,4,'#352a37');circle(x+11,y-9,4,'#352a37');circle(x,y+4,5,'#6b4c54');}else{clay(x,y+28,25,'#56465b');}}ctx.fillStyle='#fff0d1';ctx.font='bold 17px Fredoka';ctx.fillText('MISSES LEFT  '+(3-p.miss),145,465);break;
case'target':panel(90,90,720,390,'#554b66');for(const o of objects){clay(o.x,o.y,o.r,o.gold?'#f4d27a':'#e7a1b5');circle(o.x-o.r*.2,o.y-o.r*.22,o.r*.22,'#fff4db');circle(o.x,o.y,o.r*.48,o.gold?'#e59d52':'#8b6c9a');}break;
case'memory':panel(170,90,560,390,'#54445f');for(let i=0;i<4;i++){const x=260+(i%2)*200,y=155+Math.floor(i/2)*145;rounded(x,y,165,115,24,colors[i]);rounded(x+7,y+7,151,101,20,'#ffffff18');if(seqPhase==='show'&&sequence[seqPos]===i){ctx.strokeStyle='#fff8d8';ctx.lineWidth=8;ctx.strokeRect(x+5,y+5,155,105);}}ctx.fillStyle='#fff4dd';ctx.font='bold 19px Fredoka';ctx.textAlign='center';ctx.fillText(seqPhase==='show'?'WATCH THE PATTERN':'YOUR TURN  ·  '+(seqPos+1)+' / '+sequence.length,450,465);break;
case'rhythm':panel(110,90,680,390,'#55445f');ctx.strokeStyle='#f5d27d';ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(145,390);ctx.lineTo(755,390);ctx.stroke();for(const o of objects){clay(o.x,o.y,20,colors[o.lane]);}['D','F','J','K'].forEach((k,i)=>{clay(200+i*165,390,29,'#a87c93');ctx.fillStyle='#fff';ctx.font='bold 18px Fredoka';ctx.textAlign='center';ctx.fillText(k,200+i*165,397);});ctx.fillStyle='#f5d27d';ctx.font='bold 16px Fredoka';ctx.fillText('COMBO  '+combo,450,465);break;
case'meteor':panel(155,85,590,400,'#39354f');for(const o of objects){clay(o.x,o.y,o.r,o.star?'#f6d77e':'#c98b77');if(o.star)circle(o.x,o.y,5,'#fff4c7');}clay(p.x,430,25,'#8bd0bd');clay(p.x-4,422,8,'#fff1d4');break;
case'racer':panel(195,80,510,410,'#39354f');ctx.fillStyle='#aaa0a0';ctx.fillRect(430,90,40,390);ctx.fillRect(270,90,10,390);ctx.fillRect(620,90,10,390);for(let y=-20;y<520;y+=90){ctx.fillStyle='#f2dfbb';ctx.fillRect(448,y+(performance.now()/7%90),4,42);}for(const o of objects){if(o.star)clay(267+o.lane*160,o.y,17,'#f6d77e');else{rounded(240+o.lane*160,o.y,55,78,15,'#c97870');rounded(248+o.lane*160,o.y+9,39,25,8,'#e9cba5');}}rounded(240+p.lane*160,390,55,78,14,'#82c6b1');break;
case'stack':panel(150,85,600,400,'#54445f');for(let i=0;i<p.blocks;i++)rounded(p.blockX-p.width/2,420-i*27,p.width,25,7,colors[i%4]);rounded(p.x-p.width/2,420-p.blocks*27,p.width,25,7,'#f1ba78');ctx.fillStyle='#f8e8c8';ctx.font='14px Fredoka';ctx.textAlign='center';ctx.fillText('TOWER HEIGHT  '+p.blocks,450,465);break;
case'pinball':panel(265,75,370,420,'#66516f');rounded(290,100,320,370,70,'#382f4a');for(const b of p.bumpers||[]){clay(b.x,b.y,b.r,'#e7bd70');}clay(p.ballX,p.ballY,13,'#fff0ce');clay(375,440,42,'#e98d76');clay(525,440,42,'#e98d76');ctx.fillStyle='#fff0d0';ctx.font='bold 14px Fredoka';ctx.textAlign='center';ctx.fillText('BALLS  '+p.balls,450,485);break;
case'claw':panel(120,85,660,400,'#a17a74');rounded(145,110,610,340,18,'#d8b99a');for(const o of objects)clay(o.x,o.y,o.r,o.c);ctx.strokeStyle='#5b4656';ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(p.clawX,115);ctx.lineTo(p.clawX,p.clawY);ctx.stroke();rounded(p.clawX-23,p.clawY,46,23,8,'#7a5866');break;
}
ctx.textAlign='left';}
function spawnMoles(){objects=[];const ids=[0,1,2,3,4,5,6,7,8].sort(()=>Math.random()-.5).slice(0,3);ids.forEach(id=>objects.push({id,life:rand(.65,1.25)}));}
function makeBumpers(){p.bumpers=[{x:365,y:190,r:26},{x:535,y:190,r:26},{x:450,y:270,r:30},{x:365,y:335,r:22},{x:535,y:335,r:22}];}
function nextSequence(){sequence.push(Math.floor(Math.random()*4));seqPos=0;seqPhase='show';seqClock=.85;}
function update(dt,now){
time-=dt;$('#time').textContent=Math.max(0,Math.ceil(time));
if(game==='skeeball'&&p.rolling){p.ballX+=p.vx*dt;p.ballY+=p.vy*dt;p.vy+=500*dt;if(p.ballY<210){const d=Math.hypot(p.ballX-450,p.ballY-220);const points=d<22?100:d<52?50:d<88?20:0;if(points){scoreBy(points);sound(330+points*3,.15,'triangle');}else sound(130,.1,'sawtooth');addParticles(p.ballX,p.ballY,'#f6d17c');p.rolling=false;p.ballX=450;p.ballY=415;}if(p.ballY>450){p.rolling=false;p.ballX=450;p.ballY=415;}}
if(game==='airhockey'){const q=p.puck;p.playerX=clamp(mouse.x,180,720);q.x+=q.vx*dt;q.y+=q.vy*dt;q.vx*=Math.pow(.999,dt*60);q.vy*=Math.pow(.999,dt*60);const speed=Math.hypot(q.vx,q.vy),cap=570;if(speed>cap){q.vx=q.vx/speed*cap;q.vy=q.vy/speed*cap;}
// The robot reads the puck's projected arrival, but deliberately leaves a small reaction delay.
const incoming=q.vy<0&&q.y<300;p.aiMood=incoming?'intercept':'guard';let target=450;if(incoming){const travel=(150-q.y)/Math.min(-80,q.vy);target=q.x+q.vx*Math.max(0,travel);}else if(q.y>280){target=450+(q.x-450)*.24;}const difficulty=.78+Math.min(.16,(p.rally||0)*.012);p.botX+=(clamp(target,355,545)-p.botX)*Math.min(1,dt*(incoming?3.2:2.0)*difficulty);
if(q.x<150||q.x>750){q.x=clamp(q.x,150,750);q.vx*=-.9;sound(120,.035);}
// Side rails and the two goal mouths have different collision rules.
if(q.y<124){if(q.x>365&&q.x<535){p.goal++;scoreBy(35);sound(760,.18,'triangle');if(p.goal>=5){scoreBy(100);finish(true);return;}q.x=450;q.y=270;q.vx=rand(-120,120);q.vy=210;p.rally=0;}else{q.y=124;q.vy=Math.abs(q.vy)*.88;}}
if(q.y>438){if(q.x>365&&q.x<535){p.botGoal++;sound(115,.2,'sawtooth');if(p.botGoal>=5){finish();return;}q.x=450;q.y=270;q.vx=rand(-140,140);q.vy=-210;p.rally=0;}else{q.y=438;q.vy=-Math.abs(q.vy)*.88;}}
// Robot paddle: contact imparts a directional return, not a scripted score.
if(q.vy<0&&q.y<178&&q.y>130&&Math.abs(q.x-p.botX)<43){q.y=179;q.vy=Math.abs(q.vy)+35;q.vx+=(q.x-p.botX)*2.4;p.rally++;sound(330,.05,'triangle');}
// Player mallet is controlled by pointer/touch and only strikes while the puck enters its zone.
if(q.vy>0&&q.y>375&&q.y<430&&Math.hypot(q.x-p.playerX,q.y-410)<43){const dx=q.x-p.playerX,dy=q.y-410;q.y=374;q.vy=-Math.max(190,Math.abs(q.vy)+Math.abs(dy)*2.5);q.vx+=dx*3.1;p.rally++;sound(260+Math.min(300,p.rally*12),.06,'triangle');addParticles(q.x,q.y,'#f7d58a',4);}
}
if(game==='whack'){p.spawnClock=(p.spawnClock||0)-dt;if(p.spawnClock<=0){spawnMoles();p.spawnClock=.75;}objects.forEach(o=>o.life-=dt);objects=objects.filter(o=>o.life>0);if(objects.length===0&&p.spawnClock<.35)spawnMoles();}
if(game==='target'){p.spawnClock=(p.spawnClock||0)-dt;if(p.spawnClock<=0&&objects.length<7){objects.push({x:rand(130,770),y:rand(150,430),r:rand(13,30),vx:rand(-90,90),vy:rand(-70,70),gold:Math.random()<.16});p.spawnClock=.48;}objects.forEach(o=>{o.x+=o.vx*dt;o.y+=o.vy*dt;if(o.x<110||o.x>790)o.vx*=-1;if(o.y<110||o.y>455)o.vy*=-1;});}
if(game==='memory'){seqClock-=dt;if(seqClock<=0&&seqPhase==='show'){seqPos++;if(seqPos>=sequence.length){seqPhase='input';seqPos=0;}else seqClock=.62;}}
if(game==='rhythm'){p.spawnClock=(p.spawnClock||0)-dt;if(p.spawnClock<=0){objects.push({lane:Math.floor(Math.random()*4),x:200+Math.floor(Math.random()*4)*165,y:100});p.spawnClock=.62;}objects.forEach(o=>o.y+=245*dt);objects=objects.filter(o=>{if(o.y>445){combo=0;return false;}return true;});}
if(game==='meteor'){p.x=clamp(p.x+(keys.ArrowRight||keys.d?330*dt:0)-(keys.ArrowLeft||keys.a?330*dt:0),190,710);p.spawnClock=(p.spawnClock||0)-dt;if(p.spawnClock<=0){objects.push({x:rand(205,695),y:75,r:rand(13,24),v:rand(170,270),star:Math.random()<.17});p.spawnClock=.38;}objects.forEach(o=>o.y+=o.v*dt);for(const o of objects){if(Math.hypot(o.x-p.x,o.y-430)<o.r+20){if(o.star){scoreBy(25);o.y=600;sound(760,.1);}else{finish();return;}}}objects=objects.filter(o=>o.y<510);if(time<=0){scoreBy(100);finish(true);return;}}
if(game==='racer'){p.spawnClock=(p.spawnClock||0)-dt;if(p.spawnClock<=0){objects.push({lane:Math.floor(Math.random()*3),y:65,star:Math.random()<.24});p.spawnClock=.48;}objects.forEach(o=>o.y+=260*dt);objects=objects.filter(o=>{if(o.lane===p.lane&&o.y>345&&o.y<455){if(o.star){scoreBy(20);sound(660,.08);return false;}p.miss++;sound(100,.15,'sawtooth');if(p.miss>=3){finish();return false;}o.y=510;return false;}return o.y<510;});if(time<=0){scoreBy(100);finish(true);return;}}
if(game==='stack'){p.x=450+Math.sin(now/410)*235;}
if(game==='pinball'&&p.launched){p.ballX+=p.vx*dt;p.ballY+=p.vy*dt;p.vy+=560*dt;if(p.ballX<300||p.ballX>600){p.ballX=clamp(p.ballX,300,600);p.vx*=-.85;}if(p.ballY<105){p.ballY=105;p.vy=Math.abs(p.vy);}for(const b of p.bumpers){const d=Math.hypot(p.ballX-b.x,p.ballY-b.y);if(d<b.r+12){const a=Math.atan2(p.ballY-b.y,p.ballX-b.x);p.vx=Math.cos(a)*260;p.vy=Math.sin(a)*260;scoreBy(25);sound(420,.1,'triangle');addParticles(b.x,b.y,'#f6d17c',5);}}if(p.ballY>430&&p.ballY<465&&((keys.ArrowLeft&&p.ballX<445)||(keys.ArrowRight&&p.ballX>455))){p.vy=-Math.abs(p.vy)-330;p.vx+=(p.ballX<450?-80:80);sound(280,.06);}if(p.ballY>505){p.balls--;if(p.balls<=0){finish();return;}p.ballX=450;p.ballY=458;p.vx=0;p.vy=0;p.launched=false;}} 
if(game==='claw'){if(!p.grabbing)p.clawX+=p.clawDir*180*dt;if(p.clawX>700||p.clawX<200)p.clawDir*=-1;if(p.grabbing){p.clawY+=260*dt;if(p.clawY>375){const prize=objects.reduce((a,b)=>Math.abs(b.x-p.clawX)<Math.abs(a.x-p.clawX)?b:a,null);if(prize&&Math.abs(prize.x-p.clawX)<prize.r+24){scoreBy(100);addParticles(prize.x,prize.y,prize.c,16);objects=objects.filter(o=>o!==prize);sound(800,.18,'triangle');}else{p.miss++;sound(130,.1,'sawtooth');}p.grabbing=false;p.clawY=125;if(objects.length===0){finish(true);return;}if(p.miss>=3){finish();return;}}}}
particles=particles.filter(o=>{o.life-=dt;if(o.text){o.y+=o.vy*dt;}else{o.x+=o.vx*dt;o.y+=o.vy*dt;o.vy+=180*dt;}return o.life>0;});
if(time<=0)finish(game==='skeeball'||game==='target'||game==='rhythm'||game==='stack');
}
function drawParticles(){for(const o of particles){ctx.globalAlpha=clamp(o.life*1.8,0,1);if(o.text){ctx.fillStyle=o.c;ctx.font='bold 18px Fredoka';ctx.fillText(o.text,o.x,o.y);}else circle(o.x,o.y,o.r,o.c);}ctx.globalAlpha=1;}
function loop(now){if(!running)return;const dt=Math.min(.04,(now-last)/1000);last=now;update(dt,now);draw();drawParticles();if(running)raf=requestAnimationFrame(loop);}
function pointer(e){const r=canvas.getBoundingClientRect();mouse.x=(e.clientX-r.left)*W/r.width;mouse.y=(e.clientY-r.top)*H/r.height;}
function hitRhythm(lane){const i=objects.findIndex(o=>o.lane===lane&&Math.abs(o.y-390)<55);if(i>=0){objects.splice(i,1);combo++;scoreBy(10+Math.min(30,combo*2));sound(360+combo*18,.08,'triangle');}else{combo=0;sound(100,.05,'square');}}
function dropStack(){if(!running)return;if(p.blocks===0){p.blocks=1;p.blockX=p.x;p.width=170;scoreBy(5);return;}const left=Math.max(p.blockX-p.width/2,p.x-p.width/2),right=Math.min(p.blockX+p.width/2,p.x+p.width/2),nw=right-left;if(nw<20){finish();return;}p.blockX=(left+right)/2;p.width=nw;p.blocks++;scoreBy(Math.max(5,Math.round(nw/7)));sound(300+p.blocks*12,.07,'triangle');addParticles(p.blockX,420-p.blocks*27,colors[p.blocks%4],6);if(p.blocks>=14)finish(true);}
function grabClaw(){if(!running||p.grabbing)return;p.grabbing=true;p.clawY=125;sound(220,.08);}
function onDown(e){pointer(e);if(!running)return;swipeStartX=mouse.x;sound(480,.025);
if(game==='skeeball'&&!p.rolling){p.drag=true;p.dragStartY=mouse.y;p.dragX=mouse.x;}
if(game==='whack'){const i=Math.round((mouse.x-230)/220)+Math.floor((mouse.y-180)/112)*3;const n=objects.findIndex(o=>o.id===i);if(n>=0){objects.splice(n,1);scoreBy(10);sound(560,.07);addParticles(mouse.x,mouse.y,'#9ecb9b',5);}else{p.miss++;sound(120,.07);if(p.miss>=3)finish();}}
if(game==='target'){const i=objects.findIndex(o=>Math.hypot(o.x-mouse.x,o.y-mouse.y)<o.r+8);if(i>=0){const o=objects.splice(i,1)[0];scoreBy((o.gold?60:Math.round(42-o.r)));sound(o.gold?900:500,.09,'triangle');addParticles(o.x,o.y,o.gold?'#f4d27a':'#e7a1b5');}}
if(game==='memory'&&seqPhase==='input'){const i=(mouse.x>450?1:0)+(mouse.y>300?2:0);if(i===sequence[seqPos]){seqPos++;sound(360+i*120,.12,'sine');if(seqPos>=sequence.length){scoreBy(sequence.length*15);round++;seqClock=.55;seqPhase='pause';setTimeout(()=>{if(running){nextSequence();draw();}},550);}}else{sound(100,.2,'sawtooth');finish();}}
if(game==='rhythm'){const lane=clamp(Math.round((mouse.x-200)/165),0,3);hitRhythm(lane);}
if(game==='stack')dropStack();
if(game==='pinball'&&!p.launched){p.launched=true;p.vx=rand(-65,65);p.vy=-460;sound(180,.15,'sawtooth');}else if(game==='pinball'&&mouse.y>400){p.vy=-Math.abs(p.vy)-330;p.vx+=(mouse.x<450?-85:85);sound(280,.06);}
if(game==='claw')grabClaw();
if(game==='airhockey'){mouse.y=clamp(mouse.y,300,430);}
}
function onMove(e){pointer(e);if(game==='meteor'&&running)p.x=clamp(mouse.x,190,710);if(game==='airhockey') {mouse.x=clamp(mouse.x,160,740);mouse.y=clamp(mouse.y,295,430);}if(game==='skeeball'&&p.drag){p.ballX=clamp(mouse.x,150,750);p.ballY=415;}}
function onUp(e){pointer(e);if(game==='racer'&&running&&Math.abs(mouse.x-swipeStartX)>25)p.lane=clamp(p.lane+(mouse.x<swipeStartX?1:-1),0,2);if(game==='skeeball'&&p.drag&&running){const power=clamp((mouse.y-p.dragStartY)*4,260,680);p.vx=(mouse.x-p.dragX)*2.1;p.vy=-power;p.rolling=true;p.drag=false;sound(190,.1,'triangle');}}
function keydown(e){keys[e.key]=true;if(!running)return;if(e.key===' '){e.preventDefault();if(game==='stack')dropStack();if(game==='pinball'&&!p.launched){p.launched=true;p.vy=-460;p.vx=35;sound(180,.15,'sawtooth');}if(game==='claw')grabClaw();}
if(game==='racer'&&(e.key==='ArrowLeft'||e.key.toLowerCase()==='a'))p.lane=Math.max(0,p.lane-1);
if(game==='racer'&&(e.key==='ArrowRight'||e.key.toLowerCase()==='d'))p.lane=Math.min(2,p.lane+1);
if(game==='rhythm'){const lanes={d:0,f:1,j:2,k:3};const lane=lanes[e.key.toLowerCase()];if(lane!==undefined)hitRhythm(lane);}
}
function keyup(e){keys[e.key]=false;}
$('#game-grid').addEventListener('click',e=>{const b=e.target.closest('[data-game]');if(b)open(b.dataset.game);});
window.addEventListener('nexus:arcade-play',e=>{const id=e.detail?.gameId;if(id==='hoops'){window.location.href='./hoops.html';return;}if(games[id])open(id);});
$('#start').addEventListener('click',start);$('#close').addEventListener('click',()=>{running=false;cancelAnimationFrame(raf);overlay.hidden=true;});
canvas.addEventListener('pointerdown',onDown);canvas.addEventListener('pointermove',onMove);canvas.addEventListener('pointerup',onUp);canvas.addEventListener('pointercancel',onUp);
window.addEventListener('keydown',keydown);window.addEventListener('keyup',keyup);
const saved=(()=>{try{return JSON.parse(localStorage.getItem('neon-nexus-player-v1')||'{}')}catch{return {}}})();$('#arcade-tokens').textContent=saved.tokens??250;
})();
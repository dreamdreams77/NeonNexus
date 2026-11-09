// Neon Nexus cabinet depth. Classic script, loaded before arcade.js. Two systems every cabinet shares:
//  1. FEVER: scoring fills a heat meter that cools when you stop. Fill it and the cabinet goes into Fever for a few
//     seconds, doubling every point. It rewards keeping a rhythm going, and every cabinet gets a risk/reward beat.
//  2. STARS: three named challenges per cabinet, judged at the end of each round from what you actually did. Each new
//     star pays tickets once and is kept in the save (`arcadeStars`), so every cabinet has goals beyond a high score.
// Head-to-head and placement games (air hockey, billiards, racing) skip Fever; their scores mean something else.
(()=>{
 'use strict';
 const NO_FEVER=new Set(['airhockey','billiards','racer','chef']);
 const FEVER={full:100,cool:10,secs:7,mult:2};
 const STAR_TICKETS=15;
 const st={game:'',on:false,heat:0,fever:0,fevers:0,flash:0};

 function begin(game,{duel=false}={}){st.game=game;st.on=!duel&&!NO_FEVER.has(game);st.heat=0;st.fever=0;st.fevers=0;st.flash=0;}
 const mult=()=>st.on&&st.fever>0?FEVER.mult:1;
 // Called after every score event with the points actually awarded.
 function onScore(n){
  if(!st.on||st.fever>0||!(n>0))return'';
  st.heat=Math.min(FEVER.full,st.heat+Math.min(22,5+n*.3));
  if(st.heat>=FEVER.full){st.fever=FEVER.secs;st.fevers++;st.flash=1;return'fever';}
  return'';
 }
 // Called every frame. Returns 'end' on the frame Fever runs out.
 function tick(dt){
  if(!st.on)return'';st.flash=Math.max(0,st.flash-dt*1.6);
  if(st.fever>0){st.fever-=dt;if(st.fever<=0){st.fever=0;st.heat=0;return'end';}return'';}
  st.heat=Math.max(0,st.heat-FEVER.cool*dt);return'';
 }
 function draw(ctx){
  if(!st.on)return;
  // a vertical meter in the empty left margin, so it never covers a cabinet's own HUD
  const x=26,y=150,w=12,h=290,fev=st.fever>0,fill=Math.max(0,Math.min(1,fev?st.fever/FEVER.secs:st.heat/FEVER.full));
  ctx.save();
  if(fev){const g=ctx.createRadialGradient(450,280,180,450,280,560);g.addColorStop(0,'rgba(255,190,90,0)');g.addColorStop(1,`rgba(255,150,70,${.16+.08*Math.sin(performance.now()/120)})`);ctx.fillStyle=g;ctx.fillRect(0,0,900,520);}
  if(st.flash>0){ctx.fillStyle=`rgba(255,236,170,${st.flash*.35})`;ctx.fillRect(0,0,900,520);}
  ctx.fillStyle='#2a1c2e99';ctx.beginPath();ctx.roundRect(x-3,y-3,w+6,h+6,9);ctx.fill();
  const bar=ctx.createLinearGradient(0,y+h,0,y);bar.addColorStop(0,fev?'#ffb347':'#7fd6c6');bar.addColorStop(1,fev?'#ff6f91':'#f4d27a');
  const fh=Math.max(4,h*fill);ctx.fillStyle=bar;ctx.beginPath();ctx.roundRect(x,y+h-fh,w,fh,6);ctx.fill();
  ctx.translate(x+w/2,y-14);ctx.font='bold 11px Fredoka, system-ui';ctx.textAlign='center';ctx.fillStyle=fev?'#ffe6b0':'#f3e3c8';
  ctx.fillText(fev?'×'+FEVER.mult:'FEVER',0,0);
  ctx.restore();
 }

 // ───────── stars: three challenges per cabinet ─────────
 // r = {score, win, bestCombo, fevers, grade, place, timeLeft, stats, p}
 const S=(label,test)=>({label,test});
 const STARS={
  skeeball:[S('Win the round (150 points)',r=>r.win),S('Sink a corner cup',r=>(r.stats.corners||0)>=1),S('Score 400',r=>r.score>=400)],
  airhockey:[S('Win the match',r=>r.win),S('Win by 3 or more',r=>r.win&&(r.p.goal-r.p.botGoal)>=3),S('Win without conceding',r=>r.win&&r.p.botGoal===0)],
  billiards:[S('Win the frame',r=>r.win),S('Pot 4 of your group',r=>(r.p.playerPotted||[]).length>=4),S('Win with 2 minutes left',r=>r.win&&r.timeLeft>=120)],
  whack:[S('Score 250 to win',r=>r.win),S('Bonk 3 golden moles',r=>(r.stats.golden||0)>=3),S('Reach a ×15 streak',r=>r.bestCombo>=15)],
  target:[S('Score 150 to win',r=>r.win),S('Pop a colour chain of 5',r=>(r.stats.chain||0)>=5),S('Set off 2 bomb bubbles',r=>(r.stats.bombs||0)>=2)],
  memory:[S('Score 200 to win',r=>r.win),S('Clear a mirror round',r=>(r.stats.mirror||0)>=1),S('Reach round 8',r=>(r.stats.rounds||0)>=8)],
  rhythm:[S('Grade B or better',r=>'SAB'.includes(r.grade)),S('Grade A or better',r=>'SA'.includes(r.grade)),S('Trigger Fever',r=>r.fevers>0)],
  meteor:[S('Survive the shower',r=>r.win),S('Survive without losing a heart',r=>r.win&&(r.stats.hits||0)===0),S('Catch 4 stars',r=>(r.stats.stars||0)>=4)],
  racer:[S('Finish on the podium',r=>r.place>0&&r.place<=3),S('Finish top two',r=>r.win),S('Take first place',r=>r.place===1)],
  stack:[S('Build past 100 points',r=>r.win),S('Land 4 perfect drops',r=>(r.stats.perfect||0)>=4),S('Top out at 14 blocks',r=>(r.p.blocks||0)>=14)],
  pinball:[S('Score 250',r=>r.score>=250),S('Spell N-E-X-U-S',r=>(r.stats.nexus||0)>=1),S('Score 800',r=>r.score>=800)],
  claw:[S('Win a prize',r=>(r.stats.prizes||0)>=1),S('Grab the golden prize',r=>(r.stats.golden||0)>=1),S('Win 4 prizes',r=>(r.stats.prizes||0)>=4)],
  sushi:[S('Survive the conveyor',r=>r.win),S('Fill 3 order tickets',r=>(r.stats.orders||0)>=3),S('Reach a ×12 streak',r=>r.bestCombo>=12)],
  mixology:[S('Serve all six drinks',r=>r.win),S('Pour 4 dead-centre layers',r=>(r.stats.centre||0)>=4),S('Serve without a spill',r=>r.win&&(r.p.misses||0)===0)],
  pulse:[S('Beat the boss',r=>r.win),S('Win without losing health',r=>r.win&&(r.stats.hurt||0)===0),S('Trigger Fever',r=>r.fevers>0)],
  moto:[S('Ride to the finish',r=>r.win),S('Finish without a crash',r=>r.win&&(r.stats.crashes||0)===0),S('Trigger Fever',r=>r.fevers>0)],
  moonquest:[S('Collect three moonshards',r=>(r.p.shards||0)>=3),S('Defeat the Moonkeep',r=>!!r.p.bossDefeated),S('Win with 4 or more hearts',r=>r.win&&(r.p.hp||0)>=4)],
  ringtoss:[S('Ring all three pegs',r=>r.win),S('Win with 4 rings to spare',r=>r.win&&(r.p.rings||0)>=4),S('Ring 3 in a row',r=>r.bestCombo>=3)],
  gemdig:[S('Find six moon gems',r=>r.win),S('Win with every lantern lit',r=>r.win&&r.p.hearts===3),S('Win in 12 digs or fewer',r=>r.win&&(r.p.digs||0)<=12)]
 };
 function results(game,r){const defs=STARS[game]||[];return defs.map(d=>{try{return !!d.test(r);}catch(e){return false;}});}
 function owned(saved,game){const a=saved&&saved.arcadeStars&&Array.isArray(saved.arcadeStars[game])?saved.arcadeStars[game]:[];return [0,1,2].map(i=>!!a[i]);}
 // Mutates the save that arcade.js is about to write. Returns the line for the result card.
 function award(saved,game,r){
  const defs=STARS[game];if(!defs)return'';
  const got=results(game,r),have=owned(saved,game),fresh=[];
  got.forEach((ok,i)=>{if(ok&&!have[i]){have[i]=true;fresh.push(defs[i].label);}});
  if(!saved.arcadeStars||typeof saved.arcadeStars!=='object'||Array.isArray(saved.arcadeStars))saved.arcadeStars={};
  saved.arcadeStars[game]=have;
  if(!fresh.length)return'';
  const t=fresh.length*STAR_TICKETS;saved.tickets=(Number(saved.tickets)||0)+t;
  saved.ticketHistory=saved.ticketHistory||[];saved.ticketHistory.unshift({game:'stars',score:0,amount:t,quest:game+' stars',at:Date.now()});saved.ticketHistory=saved.ticketHistory.slice(0,30);
  return '★ NEW STAR'+(fresh.length>1?'S':'')+': '+fresh.join(' · ')+' · +'+t+' TICKETS';
 }
 // Small HTML block for the cabinet panel. Labels are static strings defined above, never user data.
 function panelHTML(saved,game){
  const defs=STARS[game];if(!defs)return'';const have=owned(saved,game),n=have.filter(Boolean).length;
  return '<div class="cabinet-stars" style="margin-top:10px"><b style="letter-spacing:.08em">'+'★'.repeat(n)+'☆'.repeat(3-n)+'  CABINET STARS</b>'+
   defs.map((d,i)=>'<small style="display:block;opacity:'+(have[i]?'.65':'1')+'">'+(have[i]?'★ ':'☆ ')+d.label+(have[i]?'':' · +'+STAR_TICKETS+' tickets')+'</small>').join('')+'</div>';
 }
 window.NEXUS_DEPTH={begin,mult,onScore,tick,draw,results,award,owned,panelHTML,STARS,FEVER,STAR_TICKETS,state:st};
})();

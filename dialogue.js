// Neon Nexus voice. Everything the lobby says lives here so the tone stays consistent: dry, deadpan, quietly fond of
// its own regulars. Classic script (no imports) so both the 3D module and the 2D cabinet script can use it.
(()=>{
 'use strict';
 // Shuffle-bag: every line is used once before any repeats, and the same line never plays twice in a row.
 const bags=new Map();let lastLine='';
 function pick(key,list){
  if(!list||!list.length)return'';
  let bag=bags.get(key);
  if(!bag||!bag.length){bag=list.map((_,i)=>i);for(let i=bag.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[bag[i],bag[j]]=[bag[j],bag[i]];}
   if(list.length>1&&list[bag[bag.length-1]]===lastLine)bag.unshift(bag.pop());bags.set(key,bag);}
  const line=list[bag.pop()];lastLine=line;return line;
 }
 const fill=(s,v)=>s.replace(/\{(\w+)\}/g,(_,k)=>v&&v[k]!==undefined?v[k]:'');

 // ───────── the regulars ─────────
 const regulars={
  Pip:{
   intros:['Pip is clutching a plush with the grip of someone who has been told it is not for sale.','Pip is counting tickets for the fourth time. The number has not changed. Pip is hoping it will.','Pip glances at you, then at the prize gallery, then at you again. A complicated look.'],
   chat:['I have been saving for the Giant Comet Bear for three weeks. It sits there looking smug. I respect it.','My flat has no room for a bear that size. This has not entered the calculation.','People say tickets are just numbers. Those people have never wanted a bear.','I did the maths. Two hundred more rounds. Then I did the maths again, hoping for a different answer.','Last week I walked past the exchange without looking. Growth, I think they call it.'],
   tip:['Claw machine: wait for the prize to settle. Patience, and pretending you do not care. It can smell desperation.','Redeem your tickets. I once carried four hundred of them around for a month out of pure forgetfulness. We do not discuss that month.','Play the games you are actually good at. Tickets are just applause with a cash value.','Ignore the shiny prizes first. Ignore them again. Then buy the bear.'],
   rumour:['Someone hit the five-hundred-ticket slot on the wheel earlier. They left immediately, which is what winners do and what I would do too, if I ever won.','The thousand-ticket jackpot is real. I have seen it on the wheel. Like a comet. Or a bank error.','They say the golden key opens something. Nobody can say what. Excellent marketing.'],
   done:['You finished my warm-up circuit. I am impressed and mildly suspicious.','Quest done. Do not tell the bear I helped.']
  },
  Moxie:{
   intros:['Moxie taps a steady beat on the counter and gives you a friendly grin. The counter has not consented.','Moxie nods in time to a song only Moxie can hear. It is probably very good.','Moxie looks up, hits an imaginary final note, and pretends that did not happen.'],
   chat:['I come here to unwind after work. Then I get a B on Beat Foundry and unwind in the other direction.','Rhythm games are just metronomes with attitude. I love them with my whole chest.','My coworkers think I go to the gym. In a sense, my thumbs do.','The jukebox has taste. Limited, loud taste. I am a fan.','Everyone says they have no rhythm. Then they hear a beat and tap the table. Liars, all of you.'],
   tip:['Consistency beats button mashing. Find the pulse first, then trust it. Mashing is just panic with extra steps.','Watch the strike line, not the notes. Notes lie. The line has never lied to me.','Stray taps count against you now. The machine has opinions about enthusiasm.','If you miss, do not chase it. Breathe. Rejoin on the next beat like nothing happened. Confidence is half the grade.'],
   rumour:['I heard the kitchen is testing a ginger beer recipe tonight. Allegedly spicy. Spice is subjective.','The bartender once identified a song from four notes. Nobody has asked him to do it again. He would.','Somebody got an S rank last night and then just sat down for a while. That is the correct response.'],
   done:['Five-streak. Smooth. I am going to pretend I was not watching.','Quest done. The pocket is found. I will deny I ever lost it.']
  },
  Juniper:{
   intros:['Juniper has a folded district map and a pocket full of tokens. The map is upside down. Juniper is committed.','Juniper is studying the cabinet list like a menu at a restaurant with no prices.','Juniper looks up from the map with the serenity of someone who is exactly where they meant to be. Probably.'],
   chat:['I am trying every cabinet once before choosing a favourite. It is called due diligence. Also indecision.','I have a system. It involves going left. The system is under review.','Twenty cabinets. I have tried seven. Honestly I am pacing myself, which is the opposite of what is happening.','Everyone here has a favourite game. I have a favourite game for each mood, which is the same thing but more expensive.'],
   tip:['Moon Gem Dig rewards careful choices. Do not waste your lantern on every tile. I wasted it on every tile. Do as I say.','Try the ones that look boring first. They are always the ones that ruin your evening.','Cabinets get you mastery. Mastery gets you perks. Perks get you a very quiet sense of superiority.','If a game is too hard, it is probably just the first minute. Games are like parties that way.'],
   rumour:['There are little stories hidden all around the lobby. I have found four. One was just a sandwich, but it was a very good sandwich.','The poker units at the bar are not as lucky as they look. Neither am I, but we are both trying.','Somebody told me the prize gallery lights up when you win something. I have not tested it. Hope has no deadline.'],
   done:['Five different cabinets. I am a little emotional. I will stop talking now.','Quest complete. The map is, apparently, right-side up now.']
  },
  Rook:{
   intros:['Rook leans on a cue case and gives you a competitive nod, like a bouncer for a table.','Rook chalks a cue with the calm of someone who has already won this game in their head.','Rook looks you over and decides you are probably fine. High praise.'],
   chat:['Billiards is a game of angles. I still miss easy shots when I rush. Both facts are very embarrassing.','The trick is to look relaxed. I have been looking relaxed since 2019. It has not helped my shooting.','I have been called a shark. By which I think they meant I stand near a table and stare at it.','Everyone wants to break hard. I want to break correctly. We are not the same, and I lose more.'],
   tip:['Aim for the ghost-ball contact point and leave yourself a good next shot. If that sounds like geometry, it is. Sorry.','Slow shots win games. Fast shots win stories. Pick one.','Do not touch the eight early. The eight remembers.','If you scratch, hold your head up. Then look at the floor, quietly, when nobody is watching.'],
   rumour:['The lucky wheel is fun, but the cabinets are the reliable way to build your wallet. Rare honesty from a pool player.','Somebody sank six in a row last night. They looked as surprised as the cue ball.','The air hockey puck has been missing twice. It always shows up at the back of the cabinet. Draw your own conclusions.'],
   done:['A full match. I will allow it. I was going to say it was beginner luck, but you won, so: luck.','Quest done. Rack, return, repeat. Poetry, honestly.']
  }
 };
 // Fallback voice for anyone without their own script.
 const generic={
  chat:['Nice place. Slightly too many stars on the carpet, but I respect the commitment.','I came here for one game. That was ninety minutes ago.'],
  tip:['Try a few different cabinets. You might find a favourite. You will certainly find an expensive one.'],
  rumour:['I heard the lucky wheel has a very rare jackpot. I also heard that about a lot of things.'],
  goodbye:['Catch you around the arcade. Probably at the same cabinet.','Off you go. I will be here, losing.','Go on, then. Spend those tokens responsibly. Or entertainingly.']
 };

 // ───────── ambient visitors (speech bubbles) ─────────
 const barks={
  win:['That was skill. Mostly skill.','I would like it noted that I did that on purpose.','Do not look at the score. Actually, do. Look.','And that is why I have a loyalty card.','Tell no one. Tell everyone.','Flawless. Ignore the middle bit.','I am retiring undefeated.','I knew it. I did not know it. But I knew it.'],
  lose:['The machine is clearly rigged. By me, being bad at it.','That was a practice round. Officially.','I blame the lighting. And my hands.','Well. That happened.','I will not be taking questions.','It cheated. In a way I cannot prove.','My tokens have gone to a better place.','Third time lucky. Said the person on their fourth.'],
  queue:['I have been waiting so long the cabinet feels like family.','Take your time. I have nothing but time and a queue.','No pressure. Just everybody is watching you.','I am not impatient. I am just standing aggressively.','Good luck. Please lose quickly. Sorry.','They have been on that level for a while. I admire the commitment.'],
  drink:['Tastes like victory. Or cranberry. Hard to tell.','I am here for the drinks. The games are a hobby.','One more and I become a very confident air hockey player.','This is fine. Everything is fine. Cheers.','The bartender gave me a look. I deserved it.','Hydration, but make it dramatic.'],
  browse:['I am not saying I would sell a kidney for the bear. I am saying I checked the market.','Somebody should win that robot. Preferably me.','So many prizes. So few tickets. A moving story.','That crown looks good on someone with better hair than me.','I am just looking. For three hours. Just looking.','Every silhouette is a promise and a threat.'],
  dance:['This is my song. Everyone is my song.','I dance like nobody is watching. They are. It is fine.','The jukebox understands me.','Do not film this. Film this.','Rhythm is a gift. Mine is a loan.'],
  greet:['Oh, hello. Please do not talk to me about my score.','Welcome. The carpet is louder than the cabinets.','Hi. I am doing great. That was a lie. Hi.','Nice hoodie. I have no further observations.','Oh, a new face. The last one is still on level two.','You look like someone who reads the instructions. I respect that and fear it.','Hello. I am not lost. I am exploring with intent.','If you see my tokens, they went that way.'],
  wander:['I forgot what I came to do. This happens.','Walking is also a game. A slow one.','There is a lot of star carpet. I have started naming them.','Where did I leave my tokens? I will know the second I stop looking.','I came for one game. That was an hour ago.','The garland is nice. I would like it in my kitchen. Not feasible.']
 };
 // Paired exchanges: initiator says [0], the partner replies [1] a few seconds later.
 const chatPairs=[
  ['Have you tried the claw machine?','Once. We are no longer on speaking terms.'],
  ['Which cabinet is your favourite?','Whichever one is not currently eating my tokens.'],
  ['Is it me, or is the carpet staring?','It is you. Also the carpet.'],
  ['I won something earlier.','Great. Where is it?'],
  ['Do you come here often?','Only on days ending in y.'],
  ['What is your strategy?','Confidence and denial. Strictly in that order.'],
  ['I am going to beat the high score.','The high score is four hours old and unbothered.']
 ];
 // Host, bartender, chef
 const staff={
  host:['Welcome to Neon Nexus. Please wait to be seated, or loiter confidently.','Table for one? We have several tables and exactly one confidence problem.','Ah, a guest. Wonderful. The book is open if you would like to be written down.','Reservations are optional. Hope is mandatory.','Ring the bell if you want me. Or do not. I will be right here either way.'],
  bartender:['What will it be? I accept tokens and, rarely, dignity.','Tonight\'s special is the same as last night\'s, with more confidence.','I have heard every excuse. The one about the lighting is my favourite.','A drink for the winner? Or a drink for the other thing. Equally popular.','Poker at the bar costs five tokens. Regret is free.'],
  chef:['Order up. Probably. Soon.','Everything is under control. Mostly. The soup disagrees.','Keep it moving. Gently, so the plates do not notice.','If it smells delicious, that is skill. If it smells strange, that is character.']
 };

 // ───────── result quips ─────────
 const quips={
  win:['A clean finish. The machine is rattled.','Cleared. Everyone else here is pretending not to be jealous.','That is what we call competence, in the arcade business.','You won. We will not ask how.'],
  loss:['A learning experience, formally.','The cabinet won this round. It will try to be humble about it.','Try again. The tokens are not going anywhere. Neither is the machine.','Valiant. Technically.'],
  zero:['Zero points. Bold strategy, bravely executed.','You scored nothing. The cabinet is almost impressed.','A fresh start. A very fresh start.'],
  newBest:['A new personal best. Frame it. Or at least tell someone.','Your best yet. The old record has been quietly retired.'],
  grade:{S:'An S. We will pause for the appropriate amount of silence.',A:'A strong A. Respectable, with a sense of pride.',B:'A B. Honest work.',C:'A C. The notes were more of a suggestion.',D:'A D. Tap dancing is a legitimate art form. This was not that.'},
  place:{1:'First place. Try not to mention it for at least a minute.',2:'Second. The kind of silver that looks like gold at the right angle.',3:'Third. You are on the podium. The podium is small.',4:'Last. Somebody has to hold the line.'},
  perGame:{
   claw:{loss:['The claw held on to your hopes with the same grip it used on the prize.','So close. The plush did not agree.'],win:['You got one. The claw looks embarrassed.']},
   billiards:{loss:['The eight ball remembers.','The table won on angles, and on being a table.'],win:['A clean match. The felt is very quiet about it.']},
   airhockey:{loss:['The puck has no loyalty.','The CPU celebrated. Quietly, because it has class.'],win:['The CPU has been informed that it lost.']},
   meteor:{loss:['The meteors were not sorry.','Space is big, and you hit it.'],win:['You survived. The meteors will write a strongly worded letter.']},
   rhythm:{loss:['The beat went on without you.'],win:['In time. Mostly. In spirit, completely.']},
   racer:{loss:['It turns out the corner was not optional.'],win:['The rivals are choosing to call that a fluke.']},
   stack:{loss:['Gravity filed its usual report.'],win:['A tower. Briefly stable, like all of us.']},
   memory:{loss:['It was going so well. It was not.'],win:['An impressive memory, selectively.']}
  }
 };
 function quip(game,{win,score,newBest,gradeLabel}){
  const label=String(gradeLabel||'');
  if(newBest)return pick('q:new',quips.newBest);
  const g=/GRADE\s+([SABCD])/.exec(label);if(g)return quips.grade[g[1]];
  const pl=/(\d)(?:ST|ND|RD|TH)\s+PLACE/.exec(label);if(pl)return quips.place[pl[1]]||'';
  if(!score)return pick('q:zero',quips.zero);
  const pg=quips.perGame[game];if(pg&&pg[win?'win':'loss']&&Math.random()<.55)return pick('q:'+game+(win?'w':'l'),pg[win?'win':'loss']);
  return pick(win?'q:win':'q:loss',win?quips.win:quips.loss);
 }

 // ───────── shop and service messages ─────────
 const status={
  soldOut:['That prize has sold out. Check another shelf. The shelves are patient.','Gone. Someone else wanted it more, or at least sooner.'],
  needTickets:['You need {n} more tickets for {name}. The tickets will not collect themselves.','{name} costs {n} more tickets than you have. Mathematically unkind.'],
  redeemed:['Prize redeemed! {name} has joined your haul. It seems content.','{name} is yours. Handle with the appropriate amount of pride.','Redeemed: {name}. The gallery shelf just got a little less empty.'],
  needTokens5:['You need 5 tokens to play this hand. The poker unit is unmoved.','Five tokens, please. Bluffing is free, but this part is not.'],
  needTokensGeneric:['Not enough tokens yet. Play a cabinet to earn more. The cabinets are very understanding.','Short on tokens. This is the arcade equivalent of an empty wallet. It happens.'],
  ordered:['{name} ordered! Your ticket is in the queue. Collect it from the pass when it is ready.','{name}, on its way. The kitchen has been told it is you. It does not care, but it has been told.'],
  tablesFull:['Every table is occupied right now. Please try again shortly. Or loiter. We have seen worse.','No tables free. The tables are very popular. They have fans.'],
  tableYours:['Table {table} is yours for {n}. Walk over and sit down like someone who planned this.'],
  collected:['{name} collected. Take it to your table and interact to serve it.'],
  needTokens5Track:['You need 5 tokens to play a track. The jukebox has standards.'],
  nowPlaying:['Now playing: {name}. 5 tokens spent. The room has opinions now.','{name} is on. Everyone is a critic.'],
  needTokens25:['You need 25 tokens for a spin. Play a cabinet to earn more. The wheel waits.'],
  wheel:['The wheel landed on {n} tickets! Your wallet has been updated.','The wheel says {n} tickets. The wheel is, as ever, correct.'],
  seated:['You are seated at table {table}. Visit the kitchen pass to collect your order.'],
  served:['Served! {name} has arrived at table {table}. Dining, at last.'],
  quest:['Quest complete! {n} tickets added to your wallet. The regulars will remember this.'],
  nod:['{name} smiles and nods, mostly sincerely.','{name} gives you a look that says "go on, then".']
 };
 function s(key,v){const list=status[key];return list?fill(pick('s:'+key,list),v):''; }

 window.NEXUS_VOICE={pick,fill,regulars,generic,barks,chatPairs,staff,quip,status,s,
  regular:(name,topic)=>{const r=regulars[name];return pick('r:'+name+':'+topic,(r&&r[topic])||generic[topic]||[]);},
  bark:(cat)=>pick('b:'+cat,barks[cat]||[]),
  staffLine:(who)=>pick('st:'+who,staff[who]||[])};
})();

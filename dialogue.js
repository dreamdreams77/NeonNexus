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
   chat:['I have been saving for the Giant Comet Bear for three weeks. It sits there looking smug. I respect it.','My flat has no room for a bear that size. This has not entered the calculation.','People say tickets are just numbers. Those people have never wanted a bear.','I did the maths. Two hundred more rounds. Then I did the maths again, hoping for a different answer.','Last week I walked past the exchange without looking. Growth, I think they call it.','Other people collect stamps. I collect the feeling of almost affording a bear.','I told my friends I was fine. They watched me stare at a plush for forty minutes. We no longer discuss it.','A small part of me is just a ticket counter now. It is cold in there.'],
   tip:['Claw machine: wait for the prize to settle. Patience, and pretending you do not care. It can smell desperation.','Redeem your tickets. I once carried four hundred of them around for a month out of pure forgetfulness. We do not discuss that month.','Play the games you are actually good at. Tickets are just applause with a cash value.','Ignore the shiny prizes first. Ignore them again. Then buy the bear.','Do not chase the wheel. The wheel has a long memory and a short temper.','Save for one big thing. Spending on stickers is how you end up with stickers.'],
   rumour:['Someone hit the five-hundred-ticket slot on the wheel earlier. They left immediately, which is what winners do and what I would do too, if I ever won.','The thousand-ticket jackpot is real. I have seen it on the wheel. Like a comet. Or a bank error.','They say the golden key opens something. Nobody can say what. Excellent marketing.','A man in a vest said he won the Golden Key. Then he asked me not to ask what it opens. I respected that.','They restock the exchange daily. I have not slept since I found out.'],
   done:['You finished my warm-up circuit. I am impressed and mildly suspicious.','Quest done. Do not tell the bear I helped.','Your tickets are growing. Mine are not. This is fine. I am extremely fine.']
  },
  Moxie:{
   intros:['Moxie taps a steady beat on the counter and gives you a friendly grin. The counter has not consented.','Moxie nods in time to a song only Moxie can hear. It is probably very good.','Moxie looks up, hits an imaginary final note, and pretends that did not happen.'],
   chat:['I come here to unwind after work. Then I get a B on Beat Foundry and unwind in the other direction.','Rhythm games are just metronomes with attitude. I love them with my whole chest.','My coworkers think I go to the gym. In a sense, my thumbs do.','The jukebox has taste. Limited, loud taste. I am a fan.','Everyone says they have no rhythm. Then they hear a beat and tap the table. Liars, all of you.','My rhythm score is the only thing in my life I have never negotiated down.','People call me intense. I call it being on beat.','I have a pre-game ritual. It involves stretching my thumbs and avoiding eye contact with the machine.'],
   tip:['Consistency beats button mashing. Find the pulse first, then trust it. Mashing is just panic with extra steps.','Watch the strike line, not the notes. Notes lie. The line has never lied to me.','Stray taps count against you now. The machine has opinions about enthusiasm.','If you miss, do not chase it. Breathe. Rejoin on the next beat like nothing happened. Confidence is half the grade.','Watch the middle of the screen and trust your peripheral vision. Looking at all four lanes is for people who enjoy stress.','Breathe out on the hard section. It will not help, but it feels dignified.'],
   rumour:['I heard the kitchen is testing a ginger beer recipe tonight. Allegedly spicy. Spice is subjective.','The bartender once identified a song from four notes. Nobody has asked him to do it again. He would.','Somebody got an S rank last night and then just sat down for a while. That is the correct response.','The jukebox has exactly one bad song. Nobody agrees which, which is how you know it is good.','I heard someone got a perfect run and then asked if it counted. It counts. It always counts.'],
   done:['Five-streak. Smooth. I am going to pretend I was not watching.','Quest done. The pocket is found. I will deny I ever lost it.','You found the pocket. Do not let it go to your head. Let it go to your thumbs.']
  },
  Juniper:{
   intros:['Juniper has a folded district map and a pocket full of tokens. The map is upside down. Juniper is committed.','Juniper is studying the cabinet list like a menu at a restaurant with no prices.','Juniper looks up from the map with the serenity of someone who is exactly where they meant to be. Probably.'],
   chat:['I am trying every cabinet once before choosing a favourite. It is called due diligence. Also indecision.','I have a system. It involves going left. The system is under review.','Twenty cabinets. I have tried seven. Honestly I am pacing myself, which is the opposite of what is happening.','Everyone here has a favourite game. I have a favourite game for each mood, which is the same thing but more expensive.','I keep a list of cabinets I have beaten. It is one long line that says technically.','Maps are only confusing if you hold them wrong. I have been told I hold them wrong.','My favourite game changes hourly. It is not indecision. It is range.'],
   tip:['Moon Gem Dig rewards careful choices. Do not waste your lantern on every tile. I wasted it on every tile. Do as I say.','Try the ones that look boring first. They are always the ones that ruin your evening.','Cabinets get you mastery. Mastery gets you perks. Perks get you a very quiet sense of superiority.','If a game is too hard, it is probably just the first minute. Games are like parties that way.','Read the little description card before you play. It is free and the only advice here that costs nothing.','Try each cabinet once, even the scary one. Especially the scary one. It has the best tickets.'],
   rumour:['There are little stories hidden all around the lobby. I have found four. One was just a sandwich, but it was a very good sandwich.','The poker units at the bar are not as lucky as they look. Neither am I, but we are both trying.','Somebody told me the prize gallery lights up when you win something. I have not tested it. Hope has no deadline.','Someone told me the kitchen has a secret menu. I asked the chef. He said there is a secret and it is no.','I heard the garland over the aisle has fourteen bulbs. I counted fifteen. I stand by that.'],
   done:['Five different cabinets. I am a little emotional. I will stop talking now.','Quest complete. The map is, apparently, right-side up now.','Five different cabinets and no regrets. That is the first lie I have told today.']
  },
  Rook:{
   intros:['Rook leans on a cue case and gives you a competitive nod, like a bouncer for a table.','Rook chalks a cue with the calm of someone who has already won this game in their head.','Rook looks you over and decides you are probably fine. High praise.'],
   chat:['Billiards is a game of angles. I still miss easy shots when I rush. Both facts are very embarrassing.','The trick is to look relaxed. I have been looking relaxed since 2019. It has not helped my shooting.','I have been called a shark. By which I think they meant I stand near a table and stare at it.','Everyone wants to break hard. I want to break correctly. We are not the same, and I lose more.','People ask if I hustle. I do not. I just do not mention how bad I am at the other games.','My cue case has a name. Do not ask what it is. It is classified.','I have practised the same bank shot for six years. It is working. Slowly. Rudely slowly.'],
   tip:['Aim for the ghost-ball contact point and leave yourself a good next shot. If that sounds like geometry, it is. Sorry.','Slow shots win games. Fast shots win stories. Pick one.','Do not touch the eight early. The eight remembers.','If you scratch, hold your head up. Then look at the floor, quietly, when nobody is watching.','Never explain a shot before you take it. If you miss, you have a story. If you make it, you have a legend.','Chalk the cue. It does nothing, but it looks like confidence.'],
   rumour:['The lucky wheel is fun, but the cabinets are the reliable way to build your wallet. Rare honesty from a pool player.','Somebody sank six in a row last night. They looked as surprised as the cue ball.','The air hockey puck has been missing twice. It always shows up at the back of the cabinet. Draw your own conclusions.','They say the air hockey table has a mind of its own. It is still better than most of my opponents.','The eight ball has never once forgiven anyone. Think about that.'],
   done:['A full match. I will allow it. I was going to say it was beginner luck, but you won, so: luck.','Quest done. Rack, return, repeat. Poetry, honestly.','A full match. The rack is empty and so is my wallet. Tidy.']
  }
 };
 // Short lines the regulars say aloud when you walk up to them.
 const regularBarks={
  Pip:['Oh good, a witness. Please tell the bear I tried.','Do not look at my tickets. They are shy.','I am not hovering by the prize wall. I am studying.','Is that a plush in your hand? No. Sorry. Hope is a hobby.'],
  Moxie:['Shh. I am counting bars. There are no bars. Shh anyway.','That is a very steady walk. Have you considered rhythm games?','Do not tap the counter. I hear it in my sleep.','I am not humming. I am spiritually in tune.'],
  Juniper:['Oh, hello. I am not lost. This map is in beta.','Excuse me, is this the aisle or a metaphor?','Please do not tell the map I asked for directions.','Eleven minutes ago I had a plan. It has since left.'],
  Rook:['Do not breathe near the chalk. It is sensitive.','You look like someone who has never scratched. I envy you.','Nice shoes. Terrible angle. Welcome.','If you hear me muttering, that is just geometry.']
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
  win:['That was skill. Mostly skill.','I would like it noted that I did that on purpose.','Do not look at the score. Actually, do. Look.','And that is why I have a loyalty card.','Tell no one. Tell everyone.','Flawless. Ignore the middle bit.','I am retiring undefeated.','I knew it. I did not know it. But I knew it.','I would like to thank nobody. I did it alone.','Somebody check my pulse. Actually, do not.','I am going to tell this story at parties. Slightly wrong.','That is going on my resume under Skills.','My cousin is going to hear about this for weeks.'],
  lose:['The machine is clearly rigged. By me, being bad at it.','That was a practice round. Officially.','I blame the lighting. And my hands.','Well. That happened.','I will not be taking questions.','It cheated. In a way I cannot prove.','My tokens have gone to a better place.','Third time lucky. Said the person on their fourth.','The machine did that on purpose. I felt it.','I will be taking a moment. Several short ones.','I was winning emotionally.','That is fine. My tokens were only visiting.','At least the carpet looks great from down here.'],
  queue:['I have been waiting so long the cabinet feels like family.','Take your time. I have nothing but time and a queue.','No pressure. Just everybody is watching you.','I am not impatient. I am just standing aggressively.','Good luck. Please lose quickly. Sorry.','They have been on that level for a while. I admire the commitment.','I do not mind waiting. I mind not being thanked for it.','This queue has become my personality.','I am next. I am only saying so for the record.'],
  drink:['Tastes like victory. Or cranberry. Hard to tell.','I am here for the drinks. The games are a hobby.','One more and I become a very confident air hockey player.','This is fine. Everything is fine. Cheers.','The bartender gave me a look. I deserved it.','Hydration, but make it dramatic.','This is my third. The first two were for the game.','I asked for something light. It is mostly ice and attitude.','Cheers to the machine that took my tokens. Mostly sarcastically.'],
  browse:['I am not saying I would sell a kidney for the bear. I am saying I checked the market.','Somebody should win that robot. Preferably me.','So many prizes. So few tickets. A moving story.','That crown looks good on someone with better hair than me.','I am just looking. For three hours. Just looking.','Every silhouette is a promise and a threat.','That bunny has seen things. Look at its eyes.','Why are the silhouettes so judgmental?','If I win the crown, I am wearing it home on the bus.'],
  dance:['This is my song. Everyone is my song.','I dance like nobody is watching. They are. It is fine.','The jukebox understands me.','Do not film this. Film this.','Rhythm is a gift. Mine is a loan.','I have been told I move like a determined bird. I chose to hear a compliment.','Nobody put me in charge of the floor, but here we are.'],
  greet:['Oh, hello. Please do not talk to me about my score.','Welcome. The carpet is louder than the cabinets.','Hi. I am doing great. That was a lie. Hi.','Nice hoodie. I have no further observations.','Oh, a new face. The last one is still on level two.','You look like someone who reads the instructions. I respect that and fear it.','Hello. I am not lost. I am exploring with intent.','If you see my tokens, they went that way.','Oh, hello. I was just leaving. I have been leaving for an hour.','You seem nice. Take my spot. I will not say why it is warm.','Careful, the carpet is lovely and also a trap.','I like your walk. Very confident. Very carpet.'],
  plush:['I did not win it. I rescued it.','Meet Gerald. He is not for sale. He is also not mine, legally.','It was on sale. Emotionally.','I will take good care of it. The bear is a metaphor. No, wait. It is a bear.'],
  wander:['I forgot what I came to do. This happens.','Walking is also a game. A slow one.','There is a lot of star carpet. I have started naming them.','Where did I leave my tokens? I will know the second I stop looking.','I came for one game. That was an hour ago.','The garland is nice. I would like it in my kitchen. Not feasible.','I should eat something. I have no plan to eat something.','The prize wall is looking at me. I am looking back. We both know.','Is this an aisle or a runway? Either way I am underdressed.']
 };
 // Paired exchanges: initiator says [0], the partner replies [1] a few seconds later.
 const chatPairs=[
  ['Have you tried the claw machine?','Once. We are no longer on speaking terms.'],
  ['Which cabinet is your favourite?','Whichever one is not currently eating my tokens.'],
  ['Is it me, or is the carpet staring?','It is you. Also the carpet.'],
  ['I won something earlier.','Great. Where is it?'],
  ['Do you come here often?','Only on days ending in y.'],
  ['What is your strategy?','Confidence and denial. Strictly in that order.'],
  ['I am going to beat the high score.','The high score is four hours old and unbothered.'],
  ['Is it true the wheel is rigged?','Only against me. Personally.'],
  ['I have been here since opening.','You mean since the carpet started talking?'],
  ['What do you think of the jukebox?','It has opinions. I do not always share them.'],
  ['Do you think the cabinets talk at night?','Only to the one that lost the most.'],
  ['I got a B on Beat Foundry.','Mine was a D. The D stands for determined.'],
  ['Where did you get that snack?','I will not say. It is a family secret from the bar.'],
  ['You look tired.','I played four rounds back to back. It is called commitment.'],
  ['Have you seen my tokens?','Last time I saw them they were leaving with a stranger.']
 ];
 // Host, bartender, chef
 const staff={
  host:['Welcome to Neon Nexus. Please wait to be seated, or loiter confidently.','Table for one? We have several tables and exactly one confidence problem.','Ah, a guest. Wonderful. The book is open if you would like to be written down.','Reservations are optional. Hope is mandatory.','Ring the bell if you want me. Or do not. I will be right here either way.','Welcome. We have seats, drinks and a mild sense of occasion.','If you need anything, ask. If you do not, also ask. I get lonely.','The book has four names in it. Two are mine.'],
  bartender:['What will it be? I accept tokens and, rarely, dignity.','Tonight\'s special is the same as last night\'s, with more confidence.','I have heard every excuse. The one about the lighting is my favourite.','A drink for the winner? Or a drink for the other thing. Equally popular.','Poker at the bar costs five tokens. Regret is free.','A tip for you: tip.','I make a drink called the Glow. It is pink. That is all I will say.','If anyone asks, the jukebox is fine and I never touched it.'],
  chef:['Order up. Probably. Soon.','Everything is under control. Mostly. The soup disagrees.','Keep it moving. Gently, so the plates do not notice.','If it smells delicious, that is skill. If it smells strange, that is character.','The soup is a mood. Today is a good mood.','I have never burned anything. I have only introduced it to heat.','Stand back. Something is happening to an onion.']
 };

 // ───────── result quips ─────────
 const quips={
  win:['A clean finish. The machine is rattled.','Cleared. Everyone else here is pretending not to be jealous.','That is what we call competence, in the arcade business.','You won. We will not ask how.','The machine blinked first. Barely.','Your thumbs have unionised and won a raise.','That was legal. Mostly. The middle bit was artistic.'],
  loss:['A learning experience, formally.','The cabinet won this round. It will try to be humble about it.','Try again. The tokens are not going anywhere. Neither is the machine.','Valiant. Technically.','The machine did not even have to try. That is its charm.','You will be back. The machine knows. The machine always knows.','Better luck next time. Or a second pair of thumbs.'],
  zero:['Zero points. Bold strategy, bravely executed.','You scored nothing. The cabinet is almost impressed.','A fresh start. A very fresh start.','A bold zero. The scoreboard is somewhat moved.','You played with great spirit and no points.'],
  newBest:['A new personal best. Frame it. Or at least tell someone.','Your best yet. The old record has been quietly retired.','A new record. Please do not ask how.','Your best yet. The previous record is crying quietly in a corner.'],
  grade:{
   S:['An S. We will pause for the appropriate amount of silence.','An S. The cabinet sends congratulations through gritted pixels.'],
   A:['A strong A. Respectable, with a sense of pride.','An A. Almost perfect, which is the most irritating kind of perfect.'],
   B:['A B. Honest work.','A B. The notes were fine. The notes are not complaining.'],
   C:['A C. The notes were more of a suggestion.','A C. A solid attempt at interpretive rhythm.'],
   D:['A D. Tap dancing is a legitimate art form. This was not that.','A D. The beat went on without you, to be fair.']
  },
  place:{
   1:['First place. Try not to mention it for at least a minute.','First. The rivals are calling it a fluke. Politely, to your face.'],
   2:['Second. The kind of silver that looks like gold at the right angle.','Second place. Close enough to smell the trophy.'],
   3:['Third. You are on the podium. The podium is small.','Third. A medal, a handshake and a very short speech.'],
   4:['Last. Somebody has to hold the line.','Last place. A strong foundation for improvement.']
  },
  perGame:{
   claw:{loss:['The claw held on to your hopes with the same grip it used on the prize.','So close. The plush did not agree.','The claw reached, grabbed and apologised for nothing.'],win:['You got one. The claw looks embarrassed.','A prize. The claw would like to speak to its manager.']},
   billiards:{loss:['The eight ball remembers.','The table won on angles, and on being a table.','The cue has asked for time apart.'],win:['A clean match. The felt is very quiet about it.','You won. The table is thinking about its choices.']},
   airhockey:{loss:['The puck has no loyalty.','The CPU celebrated. Quietly, because it has class.','You were outplayed by something with no arms.'],win:['The CPU has been informed that it lost.','Victory. The robot is reviewing its entire career.']},
   meteor:{loss:['The meteors were not sorry.','Space is big, and you hit it.','You and the meteors wanted different things.'],win:['You survived. The meteors will write a strongly worded letter.','All of them missed. Rude of you, really.']},
   rhythm:{loss:['The beat went on without you.','You and the metronome had a disagreement.'],win:['In time. Mostly. In spirit, completely.','You hit the notes. The notes noticed.']},
   racer:{loss:['It turns out the corner was not optional.','You found the wall. The wall had been there all along.'],win:['The rivals are choosing to call that a fluke.','You drove well. The car would like some credit.']},
   stack:{loss:['Gravity filed its usual report.','The tower had other plans, mostly leaning ones.'],win:['A tower. Briefly stable, like all of us.','Tall, slightly proud and entirely structural.']},
   memory:{loss:['It was going so well. It was not.','You remembered everything except the one thing.'],win:['An impressive memory, selectively.','You remembered the order. The order is flattered.']},
   skeeball:{loss:['Rolling a ball uphill was not enough, apparently.','The rings were unmoved by your enthusiasm.'],win:['Right in the middle. The rings are impressed, in a ringlike way.','A strong roll. The ball has requested a break.']},
   whack:{loss:['The moles regret nothing.','You hit the ground, mostly.'],win:['The moles have been spoken to.','Whack. Satisfying and legally fine.']},
   target:{loss:['The bubbles dodged. The bubbles had practice.','You missed every bubble with real feeling.'],win:['A great deal of popping. The bubbles are filing complaints.','Pop, pop, pop. Nobody is hurt but morale.']},
   sushi:{loss:['The fish won this round.','A suspicious fish got through. One always does.'],win:['A tray of excellent decisions.','You caught the good fish. The bad fish are in therapy.']},
   mixology:{loss:['The drink won. The floor won too.','Too much, too little. The glass keeps notes.'],win:['A perfect pour. The glass is humbled.','Steady hand, steadier ego.']},
   pulse:{loss:['The robot learned a valuable lesson about walls.','You were this close to a plan.'],win:['The robot did it. The reactor is reviewing its notes.','Boss defeated. It was only a reactor. It had it coming.']},
   moto:{loss:['The ramp was not a suggestion.','Barrels: 1. You: still thinking about it.'],win:['You made the jump. The bike is quietly impressed.','All wheels returned to the ground eventually.']},
   moonquest:{loss:['The ruins won. They have had practice.','The moon was unimpressed with your sword.'],win:['The moon owes you a favour.','All three shards. The gate has opinions, but it opened.']},
   ringtoss:{loss:['The pegs were moving. You were also moving. Different directions.','The rings flew free and landed on nothing.'],win:['Ring on peg. The peg is thrilled.','Three pegs. Civilization at its peak.']},
   gemdig:{loss:['Nothing but dirt and a lesson about lanterns.','The gems got away. They are very good at it.'],win:['Gems. The cavern would like a word about mining rights.','A shiny finish. Nobody told the dirt.']},
   pinball:{loss:['The ball drained and your composure went with it.','The flippers did their best. So did you. Mostly the flippers.'],win:['A lot of lights, a lot of noise and a very long ball.','The bumpers are tired. You are not.']},
   chef:{loss:['The ticket was wrong. You were nobly wrong with it.','The kitchen has closed to think about this.'],win:['Order up. The kitchen applauds, quietly, with a ladle.','Five tickets and a very clean apron.']}
  }
 };
 // One dry line per cabinet, shown on its discovery card.
 const cabinetQuips={
  hoops:'Ball, hoop, regret. In that order.',skeeball:'Rolling a ball uphill for fun. Humanity at its peak.',airhockey:'The robot is calm. You, less so.',whack:'The moles started it. Morally.',
  target:'Bubbles: soft, round, personally offended.',memory:'It remembers. You will too, after the third try.',rhythm:'Tap on the beat. The beat does not wait.',meteor:'Space is large and very interested in you.',
  racer:'Left turn, left turn, left turn, smugness.',stack:'A tower of slightly imperfect decisions.',pinball:'A ball bounces around. So does your composure.',claw:'Grip strength: unreliable. Hope: excellent.',
  chef:'Order up. Please do not lick the screen.',sushi:'Catch the good fish. Ignore the suspicious fish.',mixology:'Pour with confidence. Spill with confidence.',pulse:'A robot with a plan and a very small jump.',
  moto:'Wheelies are optional. Crashes are traditional.',moonquest:'A sword, a moon and no health insurance.',ringtoss:'Throw a ring at a peg. Civilization at its peak.',gemdig:'Dig, hope, flinch. Repeat until shiny.'
 };
 function quip(game,{win,score,newBest,gradeLabel}){
  const label=String(gradeLabel||'');
  if(newBest)return pick('q:new',quips.newBest);
  const g=/GRADE\s+([SABCD])/.exec(label);if(g)return pick('q:grade'+g[1],quips.grade[g[1]]);
  const pl=/(\d)(?:ST|ND|RD|TH)\s+PLACE/.exec(label);if(pl)return pick('q:place'+pl[1],quips.place[pl[1]]||['']);
  if(!score)return pick('q:zero',quips.zero);
  const pg=quips.perGame[game];if(pg&&pg[win?'win':'loss']&&Math.random()<.6)return pick('q:'+game+(win?'w':'l'),pg[win?'win':'loss']);
  return pick(win?'q:win':'q:loss',win?quips.win:quips.loss);
 }

 // ───────── shop and service messages ─────────
 const status={
  soldOut:['That prize has sold out. Check another shelf. The shelves are patient.','Gone. Someone else wanted it more, or at least sooner.','That one is gone. It has found a better home, or at least a quicker customer.'],
  needTickets:['You need {n} more tickets for {name}. The tickets will not collect themselves.','{name} costs {n} more tickets than you have. Mathematically unkind.'],
  redeemed:['Prize redeemed! {name} has joined your haul. It seems content.','{name} is yours. Handle with the appropriate amount of pride.','Redeemed: {name}. The gallery shelf just got a little less empty.'],
  needTokens5:['You need 5 tokens to play this hand. The poker unit is unmoved.','Five tokens, please. Bluffing is free, but this part is not.','Five tokens, please. The poker unit takes cash, cards and nothing else.'],
  needTokensGeneric:['Not enough tokens yet. Play a cabinet to earn more. The cabinets are very understanding.','Short on tokens. This is the arcade equivalent of an empty wallet. It happens.','Your wallet is thinking about its choices. Play a cabinet and give it something to think about.'],
  ordered:['{name} ordered! Your ticket is in the queue. Collect it from the pass when it is ready.','{name}, on its way. The kitchen has been told it is you. It does not care, but it has been told.'],
  tablesFull:['Every table is occupied right now. Please try again shortly. Or loiter. We have seen worse.','No tables free. The tables are very popular. They have fans.','Every table is taken. Please enjoy the floor. It is nicely carpeted.'],
  tableYours:['Table {table} is yours for {n}. Walk over and sit down like someone who planned this.'],
  collected:['{name} collected. Take it to your table and interact to serve it.','{name} collected. Take it to your table before it gets ideas.'],
  needTokens5Track:['You need 5 tokens to play a track. The jukebox has standards.','Five tokens for a track. The jukebox is a professional.'],
  nowPlaying:['Now playing: {name}. 5 tokens spent. The room has opinions now.','{name} is on. Everyone is a critic.','{name} is on. Fifty percent of the room loves it. The rest are being polite.'],
  needTokens25:['You need 25 tokens for a spin. Play a cabinet to earn more. The wheel waits.','Twenty-five tokens for a spin. The wheel does not do layaway.'],
  wheel:['The wheel landed on {n} tickets! Your wallet has been updated.','The wheel says {n} tickets. The wheel is, as ever, correct.','The wheel says {n} tickets. The wheel has never been wrong. It has also never been sorry.'],
  seated:['You are seated at table {table}. Visit the kitchen pass to collect your order.','You are seated at table {table}. The chairs have been waiting for this exact moment. Visit the pass for your order.'],
  served:['Served! {name} has arrived at table {table}. Dining, at last.','{name} has landed at table {table}. Everyone is very proud of the kitchen.'],
  quest:['Quest complete! {n} tickets added to your wallet. The regulars will remember this.','{n} tickets. A very polite sum. Spend it wisely or unwisely, both are accepted.'],
  nod:['{name} smiles and nods, mostly sincerely.','{name} gives you a look that says "go on, then".']
 };
 function s(key,v){const list=status[key];return list?fill(pick('s:'+key,list),v):''; }

 window.NEXUS_VOICE={pick,fill,regulars,regularBarks,generic,barks,chatPairs,staff,quip,cabinetQuips,status,s,
  regular:(name,topic)=>{const r=regulars[name];return pick('r:'+name+':'+topic,(r&&r[topic])||generic[topic]||[]);},
  bark:(cat)=>pick('b:'+cat,barks[cat]||[]),
  regularBark:(name)=>pick('rb:'+name,regularBarks[name]||barks.greet),
  cabinetQuip:(id)=>cabinetQuips[id]||'',
  staffLine:(who)=>pick('st:'+who,staff[who]||[])};
})();

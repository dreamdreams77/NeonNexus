// Neon Nexus memory layer. Loads after dialogue.js and gives the lobby a long-term memory: the regulars remember how often
// you visit, what you play and what you own, they each have their own register, and together they tell one running story
// ("The Bear Affair") that unlocks as you play. Voice is Australian, dry, and fond of its people. No dashes in dialogue.
(()=>{
 'use strict';
 const V=window.NEXUS_VOICE;if(!V)return;
 const KEY='neon-nexus-voice-v1',PKEY='neon-nexus-player-v1',HALF_HOUR=30*60*1000,DAY=24*60*60*1000;
 const GN=window.NEXUS_GAME_NAMES||{};

 // ───────── memory (its own small save, so a bad voice save can never touch the player's progress) ─────────
 const blank=()=>({v:1,visits:0,lastVisit:0,talks:{},heard:{},said:{},feud:{}});
 function load(){try{const m=JSON.parse(localStorage.getItem(KEY)||'null');if(!m||typeof m!=='object'||Array.isArray(m))return blank();const b=blank();b.visits=Math.max(0,Number(m.visits)||0);b.lastVisit=Number(m.lastVisit)||0;for(const k of ['talks','heard','said','feud']){if(m[k]&&typeof m[k]==='object'&&!Array.isArray(m[k]))for(const n of Object.keys(m[k]))b[k][n]=Math.max(0,Math.min(99,Number(m[k][n])||0));}return b;}catch{return blank();}}
 function save(){try{localStorage.setItem(KEY,JSON.stringify(mem));}catch{}}
 const mem=load();
 const now=Date.now();let away=0;
 if(mem.visits===0||now-mem.lastVisit>HALF_HOUR){if(mem.lastVisit)away=Math.floor((now-mem.lastVisit)/DAY);mem.visits++;}
 mem.lastVisit=now;save();

 function player(){try{const v=JSON.parse(localStorage.getItem(PKEY)||'{}');return v&&typeof v==='object'&&!Array.isArray(v)?v:{};}catch{return {};}}
 // Everything the regulars can know about you, read fresh each time so a line never describes a stale self.
 function ctx(){
  const sv=player(),ss=(Array.isArray(sv.arcadeSessions)?sv.arcadeSessions:[]).filter(x=>x&&typeof x==='object'),plays={};
  for(const x of ss)if(x.game)plays[x.game]=(plays[x.game]||0)+1;
  let fav='',favN=0;for(const k of Object.keys(plays))if(plays[k]>favN){fav=k;favN=plays[k];}
  const stats=sv.arcadeStats&&typeof sv.arcadeStats==='object'?sv.arcadeStats:{};let statPlays=0;for(const k of Object.keys(stats))statPlays+=Number(stats[k]&&stats[k].plays)||0;
  const last=ss[0]||null,prizes=Array.isArray(sv.prizes)?sv.prizes:[],owned=prizes.reduce((n,p)=>n+(Number(p&&p.quantity)||0),0);
  const bear=prizes.some(p=>p&&p.id==='comet-bear'&&Number(p.quantity)>0),tickets=Number(sv.tickets)||0;
  const daily=window.NEXUS_DAILY?window.NEXUS_DAILY.today(sv):{};
  return{visits:mem.visits,away,sessions:Math.max(ss.length,statPlays),distinct:Math.max(Object.keys(plays).length,Object.keys(stats).filter(k=>Number(stats[k]&&stats[k].plays)>0).length),plays,billiards:Math.max(plays.billiards||0,Number(stats.billiards&&stats.billiards.plays)||0),fav,favN,favName:GN[fav]||'',
   last:last?last.game:'',lastName:last?(GN[last.game]||'that one'):'',lastWin:!!(last&&last.win),lastScore:last?Number(last.score)||0:0,
   tokens:Number(sv.tokens??250)||0,tickets,bear,owned,orders:(Array.isArray(sv.orders)?sv.orders:[]).length,wins:Math.max(ss.filter(x=>x.win).length,Object.keys(stats).reduce((n,k)=>n+(Number(stats[k]&&stats[k].wins)||0),0)),dailyName:daily.name||'',dailyDone:!!(daily.played&&daily.won&&daily.partnerDone),dailyStreak:daily.streak||1,hour:new Date().getHours(),
   bearStatus:bear?'yours, somehow':tickets>=980?'affordable, which is rude':'out of reach, for now'};
 }
 const late=c=>c.hour>=22||c.hour<5;

 // ───────── rapport ─────────
 const RAPPORT=[[0,'STRANGER'],[1,'NEW FACE'],[4,'FAMILIAR FACE'],[8,'MATE'],[15,'PROPER LEGEND']];
 function rapport(name){const talks=mem.talks[name]||0;let i=0;for(let k=0;k<RAPPORT.length;k++)if(talks>=RAPPORT[k][0])i=k;const next=RAPPORT[i+1];return{talks,label:RAPPORT[i][1],next:next?next[0]-talks:0};}
 const bump=name=>{mem.talks[name]=Math.min(99,(mem.talks[name]||0)+1);save();};

 // ───────── The Bear Affair: one story, four tellers, five chapters, unlocked by playing ─────────
 const CHAPTERS=['The Sighting','Rivalry','The Setback','The Rumour','The Bear'];
 const GATES=[0,3,7,12,18];
 const STORY={
  Ace:[
   'Right, story time. See the Giant Comet Bear up top? Nine hundred and eighty tickets. I have about four hundred and a dream. The dream is doing most of the heavy lifting.',
   'Update: the bear moved. It was facing left on Tuesday. Now it faces me. I am not saying it is a rivalry, but I have started wearing my good jacket to the claw machine.',
   'I bought a rubber duck. Two hundred tickets. I do not even like ducks. It was a stress buy. It is in my pocket now, judging me quietly, the way only a duck can.',
   'Word on the floor is there is one bear left. One. I have been standing at the shelf since the interval. Security asked if I was waiting for someone. I said yes, and pointed at the bear. They let me stay.',
   {bear:'You got the bear. You actually got the bear. Bro. I am not crying, it is the plush dust. Can I visit it? Weekends? I will bring snacks. For me. The bear is fine.',
    plain:'I got it. Eleven months, one rubber duck and a loan from Laryn. It is smaller than I remembered. Do not tell it I said that. It is right there. It can hear.'}
  ],
  Moxie:[
   'Ace keeps going on about the bear, so I wrote it a theme. Three chords and a bassline that sounds like longing. Ace cried a bit. We do not talk about it.',
   'Heard the cleaner rotates the top shelf on Tuesdays. So the bear is not watching Ace, it is just being dusted. I have not mentioned it. A mate needs a nemesis.',
   'The duck purchase has been noted. I played the bear theme again, slow, in a minor key. Respectful. The duck seemed fine with it.',
   'Ace has not blinked since the interval. I checked. I held a mirror up. Nothing. Impressive, in a worrying sort of way.',
   {bear:'The bear is home. Ace asked for the theme, full band version, which is me, a jukebox and a very supportive stool. Nobody clapped. Everyone felt it. Cheers for that, by the way.',
    plain:'Ace got the bear. I played the theme, full band version, which is me, the jukebox and a very supportive stool. Nobody clapped. Everyone felt it.'}
  ],
  Juniper:[
   'I have mapped the prize shelf. The bear has moved four centimetres since Monday. I have told no one. I am telling you because you seem trustworthy, and because I cannot stop.',
   'I ran the numbers. Ace needs roughly fourteen more good rounds for the bear. Fewer if the wheel is kind. More if Ace keeps visiting the wheel, which Ace does, being an optimist with no spreadsheet.',
   'I made Ace a spreadsheet. Operation Bear, colour coded. Ace stared at it for a good while and asked if the duck could have its own tab. I said yes. It has a tab.',
   'Small confession. The "one bear left" thing was me. I miscounted the shelf and said it out loud. There are six. I have tried to correct the record, but Ace is guarding the shelf with a folding chair.',
   {bear:'Final entry in the Bear Spreadsheet. Status: resolved. You bought the bear, Ace is happy, and the duck has been promoted to Assistant Bear. I am laminating the whole thing.',
    plain:'Final entry in the Bear Spreadsheet. Status: resolved. Ace has the bear. The duck has been promoted to Assistant Bear. I am laminating the spreadsheet. Nobody asked me to.'}
  ],
  Laryn:[
   'I have a bet going. Ace never gets that bear. A schooner on it. Not because I want Ace to fail. I like a bet, and I like Ace, and those two are allowed to share a room.',
   'Doubled the bet. It is now a schooner and a parma. Do not tell Ace I am secretly rooting for them. It would ruin the bit, and the bit is the only thing keeping me honest.',
   'Heard about the duck. Slipped Ace fifty tickets when they were not looking. It is not a gift. It is a loan with no due date. Different thing. Legally.',
   'Sank the black off the break just now. Told Ace it was for luck. Ace asked whose. I said the bear\'s, probably. Ace looked relieved. I looked at the table. Moving on.',
   {bear:'So the bear is yours, apparently. Fair play. I owe Ace a schooner and a parma, but mostly I owe you one. Do not make it weird. Just take the drink.',
    plain:'I lost the bet. Schooner and a parma, paid in full. Best money I have spent. Ace has the bear. Do not tell them I said so. Tell them I said it was fine.'}
  ]
 };
 function unlocked(c){let n=0;for(const g of GATES)if(c.sessions>=g)n++;return n;}
 function storyInfo(name){
  const beats=STORY[name];if(!beats)return null;const c=ctx(),open=unlocked(c),heard=Math.min(mem.heard[name]||0,beats.length),total=beats.length;
  const next=heard<total?heard:-1,ready=next>=0&&next<open,need=next>=0&&!ready?Math.max(1,GATES[next]-c.sessions):0;
  return{heard,total,next,ready,need,done:heard>=total,title:next>=0?CHAPTERS[next]:'',label:next>=0?'CHAPTER '+(next+1)+' OF '+total+' · '+CHAPTERS[next].toUpperCase():'STORY COMPLETE'};
 }
 function storyTell(name){
  const info=storyInfo(name);if(!info)return'';
  if(info.done)return V.pick('sd:'+name,AFTER[name]||[]);
  if(!info.ready)return V.pick('sw:'+name,WAIT[name]||['Not yet. Play a few more rounds and come back.']);
  const c=ctx(),beat=STORY[name][info.next],text=typeof beat==='string'?beat:(c.bear?beat.bear:beat.plain);
  mem.heard[name]=info.next+1;bump(name);return text;
 }
 const WAIT={
  Ace:['Not yet, bro. Go and play a few rounds first. I need to rest my voice. And my dignity.','There is more to the bear business. Not yet. It needs a bit of time to ferment.'],
  Moxie:['Yeah, nah. Not yet. The next verse needs a few more rounds from you. Pace yourself, it is a long song.','I have more. Play a bit first. A good story, like a good bass line, needs room.'],
  Juniper:['I have more notes, but they are not in order yet. Play a few more rounds and I will have them tidied.','Chapter pending. I am waiting on more data. By data, I mean you playing things.'],
  Laryn:['Not yet. Play some more. Story will keep.','Nothing to add right now. Go and play. I will be here. I am always here.']
 };
 const AFTER={
  Ace:['That is the whole bear saga, bro. If you want it again, I am happy to tell it badly.','Nothing new on the bear. I am sitting with it. Quietly. Next to the duck.'],
  Moxie:['That is the whole song. Encore is just me humming. You have been warned.','Story is done. The theme lives on in my head, rent free.'],
  Juniper:['The bear file is closed. I am onto the next one. It is about the carpet. It is quite long.','All caught up. The spreadsheet is laminated. I am a little sad about it.'],
  Laryn:['That is the story. It is not much of a story. It is a decent one.','All told. Shout me a drink sometime and I will pretend it was your idea.']
 };

 // ───────── reactive lines: what each regular says because of what you have actually done ─────────
 const REACT={
  Ace:[
   {w:c=>c.tickets>=980&&!c.bear,t:'{tickets} tickets and no bear? Bro. I could cry. I will cry later. First, why are you not at the prize counter.'},
   {w:c=>c.bear,t:'You own the bear. I am fine with this. I am fine. Ask me again in a week.'},
   {w:c=>c.sessions===0,t:'New here? Welcome. Do not touch the bear. I have named it. It has a middle name.'},
   {w:c=>c.away>=2,t:'Not seen you in {away} days. I would say I missed you, but I was busy staring at a bear.'},
   {w:c=>c.last&&!c.lastWin,t:'Rough one on {lastName}? Happens. Happened to me twice today, before lunch. It was a thin lunch.'},
   {w:c=>c.last&&c.lastWin,t:'Saw you won on {lastName}. Good for you. I am thrilled. I am a bit sick of your face, but thrilled.'},
   {w:c=>c.fav==='claw',t:'You are on the claw a fair bit. Fellow believer, or fellow victim. We will find out.'},
   {w:c=>c.tickets>0&&c.tickets<100,t:'Only {tickets} tickets? Bro, that is a keychain. A good keychain. But still.'},
   {w:c=>c.tokens<30,t:'Running low on tokens, are we. Do not look at me. I am running low on dignity.'}
  ],
  Moxie:[
   {w:c=>c.fav==='rhythm',t:'You have been on Beat Foundry a lot. I am not saying you have rhythm. I am saying you have stamina.'},
   {w:late,t:'Bit late for this, isn\'t it. Not judging. I am also here.'},
   {w:c=>c.away>=2,t:'Back after {away} days. The jukebox kept your seat. Not literally. It is a jukebox.'},
   {w:c=>c.last&&c.lastWin,t:'That {lastName} win looked tidy. I will say that once and then go back to ignoring you.'},
   {w:c=>c.last&&!c.lastWin,t:'Bad run on {lastName}? Yeah, nah. She\'ll be right. Probably. Eventually. Statistically.'},
   {w:c=>c.tokens>=600,t:'{tokens} tokens in the bank. Mate, you could open a bar tab. Open one for me.'},
   {w:c=>c.sessions===0,t:'Not played a thing yet. No dramas. The cabinets are patient. Mostly.'}
  ],
  Juniper:[
   {w:c=>c.distinct>=10,t:'{distinct} different cabinets. I am going to need a bigger map. And possibly a lie down.'},
   {w:c=>c.distinct>0&&c.distinct<=2,t:'Only {distinct} cabinets so far. Not judging. It is just that there are twenty, and I have made a colour coded chart.'},
   {w:c=>c.sessions>=30,t:'{sessions} sessions logged. I logged them. I log things. It is a lot of logs.'},
   {w:c=>c.bear,t:'You have the bear! I have updated the chart. The bear now has a green tick. I have never used green before.'},
   {w:c=>c.away>=2,t:'Oh, you are back! {away} days. I kept notes. The notes say very little, but they are thorough.'},
   {w:c=>!!c.favName,t:'{favName} seems to be your thing. I have put it in the chart under suspects.'},
   {w:c=>c.tickets>=500,t:'{tickets} tickets. I am not saying you are rich. I am saying the chart is impressed.'}
  ],
  Laryn:[
   {w:c=>c.billiards>0,t:'You have played billiards {billiards} times. Good. It is the only honest game in the building.'},
   {w:c=>c.sessions>0&&c.billiards===0,t:'Not seen you at the table. Not pushy. Just noting it. Noted.'},
   {w:c=>c.last&&c.lastWin,t:'Nice win on {lastName}. Fair play. I will not say another word about it.'},
   {w:c=>c.last&&!c.lastWin,t:'Lost on {lastName}? Happens to the best of us. Happens to me, mostly on Tuesdays.'},
   {w:c=>c.away>=2,t:'Been {away} days. Place was quiet. I did not mind. Okay, I minded.'},
   {w:late,t:'Late one. Good time for pool. Quiet table. Nobody to impress.'},
   {w:c=>c.tokens<30,t:'Tokens low? Play a few and they come back. Or they do not. That is pool.'}
  ]
 };
 // "How am I going?" The regulars grade your progress in their own voice.
 const TIER=c=>c.sessions<3?0:c.sessions<15?1:2;
 const REPORT={
  Ace:[
   'Let me see. {sessions} sessions, {tickets} tickets, bear is {bearStatus}. Early days. I like your energy. I like it the way you like a stray dog. Cautiously.',
   '{sessions} sessions, {distinct} cabinets, {tickets} tickets. Bear is {bearStatus}. Professionally, promising. Personally, jealous.',
   '{sessions} sessions, {wins} wins, {tickets} tickets. Bear is {bearStatus}. You are practically staff. We should give you a lanyard.'
  ],
  Moxie:[
   'You have played {sessions} times. That is a start. Everyone starts somewhere. Most people start at the bar.',
   '{sessions} sessions, {distinct} cabinets, {wins} wins. That is a solid groove. I would nod along if I were not busy being cool.',
   '{sessions} sessions and {wins} wins. You are in the pocket now. Do not think about it. Thinking is how you fall out.'
  ],
  Juniper:[
   'Initial data: {sessions} sessions, {distinct} cabinets. Sample size is small. Confidence is high. Mostly mine.',
   'Current data: {sessions} sessions, {distinct} of twenty cabinets, {wins} wins. That is a respectable line on the chart. It is going up. I love when they go up.',
   '{sessions} sessions, {distinct} cabinets, {wins} wins. I am going to need a second chart. Possibly a third. Do not stop.'
  ],
  Laryn:[
   'Early days. {sessions} played. Keep at it. Nobody is good on the first rack.',
   '{sessions} sessions, {wins} wins. Steady. Steady is underrated. Steady wins boring games and wins them often.',
   '{sessions} sessions, {wins} wins, {distinct} cabinets. That is a lot of Nexus. You are one of the furniture now. Good furniture.'
  ]
 };
 const GENERIC_REPORT=['{sessions} sessions and {wins} wins so far. I have seen worse. I have also seen better. Mostly I have seen the carpet.'];

 // ───────── the register: Aussie phrasing mixed into each regular's existing chat, tip and rumour pools ─────────
 const EXTRA={
  Ace:{
   chat:['I am not obsessed with the bear. I am committed to it. The distinction matters in court.','You know what you get at the prize counter? Closure. And sometimes a keychain. Mostly closure.','I talk to the bear sometimes. It does not talk back. Healthy boundaries.','Someone told me the bear is overpriced. I told them love has no price. It has a price. It is nine hundred and eighty.'],
   tip:['Claw tip: the third drop is the lucky one. Do not ask me how I know. I have a lot of third drops behind me.','Spend tickets on the big shelf last. Small prizes first looks cheeky, but the bear will not mind.'],
   rumour:['Heard the wheel landed on a thousand tickets once. Heard it from a bloke who also heard the moon is cheese. Take it with salt.','They say the bartender can tell your score by how you order. I ordered water to confuse him.']
  },
  Moxie:{
   chat:['I used to play bass. Now I tap the counter. It is a lateral move.','Rhythm is just maths that came to the party with a drink. I love it. I am bad at it, but I love it.','Yeah, nah, the jukebox is not out of tune. The room is. I have a theory about the carpet.','I do my best thinking at the cabinets. Mostly about how I should be at home. But sure, the cabinets.'],
   tip:['Rhythm tip: look through the note, not at it. Like staring at a person who owes you money.','If you miss, do not chase it. Land the next one. The song does not care about the last note.'],
   rumour:['Heard the chef writes a new menu every night and burns it every morning. Could be true. Could be for the vibes.','Word is the jukebox has a secret fifth track. The jukebox says nothing. That is also what it says about everything else.']
  },
  Juniper:{
   chat:['Sorry, I got distracted. I was reading the fire exit sign. It is surprisingly well designed.','I am not lost. I am doing a slow, scenic orientation. Please do not tell the staff.','I bought a second map to compare with the first. They disagree. I trust neither. I carry both.','I once spent forty minutes deciding between two cabinets. Then I played a third. It was lovely.'],
   tip:['Try Moon Gem Dig early. It teaches you patience. I needed that. I still do.','Play the cabinets in order of how weird they look. It is a surprisingly sound system.'],
   rumour:['Someone swears there is a hidden cabinet behind the plant. I checked. There is a plant. It is a very good plant.','Heard the bartender keeps a list of everyone who orders the same thing twice. I am on it. I am thrilled.']
  },
  Laryn:{
   chat:['Pool is simple. Hit ball. Ball goes in. Everything else is you not believing it.','I am not intense. I just do not talk when I am thinking. I am thinking a lot lately.','Played here since the carpet was a different colour. The carpet was never the problem.','You do not need to win every game. You need to enjoy the ones you lose. I do not, but you should.'],
   tip:['Chalk the cue. Look at the shot. Take a breath. Then miss anyway, and try again. That is the whole sport.','Leave yourself an easy next shot. Greed is for blokes who miss the black.'],
   rumour:['Heard Ace has been talking to a plush. Heard it from Ace. Heard it twice.','Rumour is the claw machine has a soft spot for people who do not want anything. Which defeats the point, but there you go.']
  }
 };
 for(const n of Object.keys(EXTRA)){const r=V.regulars[n];if(!r)continue;for(const k of Object.keys(EXTRA[n]))r[k]=(r[k]||[]).concat(EXTRA[n][k]);}

 // ───────── staff: more quips, and lines that depend on who you are ─────────
 const staffMore={
  bartender:['What can I get you? Besides a better score.','Drinks, snacks, and a jukebox stuck on the same song since lunch.','No, the ginger beer is not a bit spicy. It is a lot spicy. That is the product.','A drink will not fix a bad score. It will make it feel like a decision, though.','Don\'t ask what is in the Glow Special. I signed a form. I do not remember what it said.','The poker machines do not take credit cards or sympathy.','Table service is also me. So is the singing, unfortunately.','I am not saying the stools are haunted. I am saying they are well placed for it.','Last drinks was an hour ago. Or it is in an hour. We never settled it.','Free advice with every drink. Mostly: drink water.','The stools are bolted down. Learned that the hard way, twice.','Happy hour is whenever you are. The till disagrees.','Two sugars? We do not do sugars. We do vibes.','Every drink comes with free advice. The advice is to drink water. The water is also free.','I would tell you my life story, but it is short and I have orders.','Money back guarantee on conversation. If it is not good, I will refund the silence.','Mate, I have heard every excuse for a bad score. The lighting one is still the best.','We pride ourselves on service. And we also pride ourselves on the stools. Mostly the stools.','I make a mean mocktail. It is a bit mean to the cocktail, to be fair.','Half empty, half full, I top it up either way. I am flexible.'],
  chef:['Allergen policy: if it is on the plate, it is in the food. Beyond that, I make no promises.','Today\'s special is whatever I have not burnt.','A pinch of salt, a dash of hope. Mostly hope.','I am not saying the soup is alive. I am saying it moved when I turned around.','Tell the kitchen it was lovely. They do not hear it often. They hear where is my order instead.','Medium rare is a suggestion. I treat it with the respect it deserves.','Quick, good, or cheap. Pick two. Actually pick one. I am not great at two.','The fire alarm and I have an understanding. It beeps. I ignore it. We are both happy.','My knives are sharp, my jokes are not, and my pastry is either brilliant or a cry for help.','I do not follow recipes. I follow instincts. The instincts have a mixed record.','Fresh ingredients only. Fresh is a loose term here.','If you can hear the pan, it is going well. If you cannot, run.','Do not tap the glass. The soup hears you.','Order up! Order down! Order sideways, somehow.','Yes, chef. I have never been called that and not felt worried.','We take reservations seriously. We take lunch less seriously. Lunch is a vibe.','Is the gravy ready? The gravy is always ready. That is its entire personality.','Cooking is just controlled panic with a nice plate at the end.','I put a lot of love into this food. I put a lot of butter too. They are connected.','Cannot talk. The pan has a mood.'],
  host:['Welcome in. Mind the carpet, it has a lot of opinions.','A table for you? Excellent. We have several tables and zero judgement. Well. Some judgement.','I am the host. It means I smile at people and point. I am extremely good at it.','Your table will be ready soon. Soon is a flexible concept here.','Take a menu. Take a seat. Take a breath. Not necessarily in that order.']
 };
 for(const k of Object.keys(staffMore)){V.staff[k]=(V.staff[k]||[]).concat(staffMore[k]);}
 const STAFF_RX={
  bartender:[
   {w:c=>c.orders>0,t:'Another order, is it. I will tell the kitchen it is you. They will groan. Fondly.'},
   {w:c=>c.tokens<30,t:'Short on tokens? Water is free. Technically a drink, which keeps the licence happy.'},
   {w:late,t:'Burning the midnight oil? I am on the midnight lemonade. Better than it sounds.'},
   {w:c=>c.visits>3,t:'Back again. The usual? I do not know what that is. You have not told me. Happy to guess.'},
   {w:c=>c.bear,t:'Heard you got the bear. Drinks are still full price. The bear can have a stool.'},
   {w:c=>c.away>=2,t:'Look who it is. {away} days. I nearly bought a pot plant for company.'},
   {w:c=>c.sessions>=20,t:'{sessions} sessions. You are practically a regular. I would name a stool after you.'}
  ],
  chef:[
   {w:c=>c.orders>0,t:'You have {orders} orders on the go? I am fine. I am calm. The pan is the one under pressure.'},
   {w:c=>c.hour<11,t:'Breakfast? Technically it is brunch. Technically it is whatever I am making.'},
   {w:c=>c.tokens>=600,t:'{tokens} tokens? Sit down, mate. Three courses. Two courses and a promise.'},
   {w:c=>c.visits>3,t:'Back again. I have started to recognise your order. I have not started to remember it.'},
   {w:late,t:'Kitchen is technically closed. I am technically still here. Let me see what the stove thinks.'},
   {w:c=>c.bear,t:'Heard you got the bear. I made it a plate. It will not eat it. I take it personally.'}
  ],
  host:[
   {w:c=>c.visits>1,t:'Welcome back. Your usual table is free, which is the one you hover near. I will not mention it.'},
   {w:c=>c.away>=2,t:'It has been {away} days. I was starting to wonder. Briefly. Then I got busy.'},
   {w:late,t:'Quite the hour. We love a night owl. We love anyone who tips in tokens.'},
   {w:c=>c.visits===1,t:'First visit? Welcome to Neon Nexus. Please enjoy the carpet. It has been through a lot.'}
  ]
 };


 // ───────── one-off moments: said exactly once, the first time they become true ─────────
 const MOMENTS={
  Ace:[
   {id:'bearOwned',w:c=>c.bear,t:'Hang on. You own the bear? Give me a second. I need to sit down on something that is not the floor.'},
   {id:'bearReach',w:c=>c.tickets>=980&&!c.bear,t:'You have enough for the bear. I can feel it from here. The bear told me. Do not tell it I said so.'}
  ],
  Moxie:[
   {id:'firstWin',w:c=>c.wins>=1,t:'First win on the books. Mark the date. I will pretend I did not tear up.'},
   {id:'streak3',w:c=>c.dailyStreak>=3,t:'Three days running. You are either dedicated or lost. Either way, welcome.'}
  ],
  Juniper:[
   {id:'fifty',w:c=>c.sessions>=50,t:'Fifty sessions. I am updating the chart legend. It never had a category for you.'},
   {id:'allTwenty',w:c=>c.distinct>=20,t:'All twenty cabinets. I need to sit down. I need to laminate something.'}
  ],
  Laryn:[
   {id:'firstRack',w:c=>c.billiards>=1,t:'Saw you at the table. Not bad for a first rack. Not good either. Honest.'},
   {id:'wins25',w:c=>c.wins>=25,t:'Twenty five wins. I have counted. I count things when I am impressed. Do not read into it.'}
  ]
 };
 function moment(name){
  const c=ctx();
  for(const m of MOMENTS[name]||[]){try{if(!mem.said[m.id]&&m.w(c)){mem.said[m.id]=1;save();return fillCtx(m.t,c);}}catch{}}
  return '';
 }

 // ───────── The Kitchen Feud: the staff's own running story, told at the bar and at the pass, unlocked by ordering ─────────
 const FEUD_TITLES=['The Lemons','The Signs','The Review','The Cold War','The Truce'],FEUD_GATES=[0,2,4,7,10];
 const FEUD={
  bar:[
   'Quick one. The chef has been nicking my lemons. Not many. Just enough to ruin my day and, I assume, a fish.',
   'I put up a sign. Lemons belong to the bar. By lunch there was a second sign under it. Lemons belong to whoever has the nerve. In the chef\'s handwriting. Very neat. Enraging.',
   'The chef reviewed my gin and tonic. Out loud. In front of customers. Interesting, they said. Interesting. Do you know what that does to a person?',
   'We are no longer speaking. Everything goes through the host, who is thrilled. I am told I speak to the host at length.',
   'It is over. The chef sent a plate with a single lemon on it and a note that said Truce. I made them a drink. We have never mentioned it. It was a very good lemon.'
  ],
  pass:[
   'Do not ask about the lemons. I am not stealing them. I am borrowing them with intent.',
   'The bar put up a sign about lemons. I put up a better sign. Mine has a drawing of a lemon. Theirs has a threat. We both know who won.',
   'I may have said the gin and tonic was interesting. It was. I meant it kindly. It came out like a verdict.',
   'Cold war. Everything goes through the host. The host has started charging us a small fee in compliments. It is the worst.',
   'Sent over a lemon with Truce on it. They sent back a drink with no ice, which is the nicest thing they have ever done. We have never spoken of it.'
  ]
 };
 const FEUD_WAIT={bar:['Not yet. Order a few more things and I will have been wronged further.','Give it time. The grudge is still ripening.'],pass:['Nothing new yet. Order a few more plates and the story will develop. Like a sauce.','Come back after a few more orders. I am still deciding how upset to be.']};
 function feudInfo(side){
  const beats=FEUD[side];if(!beats)return null;const c=ctx();let open=0;for(const g of FEUD_GATES)if(c.orders>=g)open++;
  const heard=Math.min(mem.feud[side]||0,beats.length),next=heard<beats.length?heard:-1,ready=next>=0&&next<open,need=next>=0&&!ready?Math.max(1,FEUD_GATES[next]-c.orders):0;
  return{heard,total:beats.length,next,ready,need,done:next<0,label:next>=0?'THE KITCHEN FEUD · CHAPTER '+(next+1)+' · '+FEUD_TITLES[next].toUpperCase():'THE KITCHEN FEUD · COMPLETE'};
 }
 function feudTell(side){
  const i=feudInfo(side);if(!i)return '';
  if(i.done)return V.pick('fd:'+side,FEUD[side].slice(-2));
  if(!i.ready)return V.pick('fw:'+side,FEUD_WAIT[side]);
  mem.feud[side]=i.next+1;save();return FEUD[side][i.next];
 }

 // ───────── what the background visitors say when they notice you ─────────
 const CROWD_RX=[
  {w:c=>c.bear,t:'Is that the bear owner? I have so many questions and one is about the stuffing.'},
  {w:c=>c.tickets>=980&&!c.bear,t:'Someone here can afford the bear. I am at peace with it. Barely.'},
  {w:c=>c.sessions>=40,t:'I have seen you here more than the furniture. Thanks for your service.'},
  {w:c=>!!c.dailyName&&!c.dailyDone,t:'Today\'s featured is {dailyName}. The bonus is real. A plush told me.'},
  {w:late,t:'Bit late for an arcade. Perfect time, actually. No witnesses.'},
  {w:c=>c.away>=2,t:'Back after {away} days. We kept your spot warm. Not literally. Floor is cold.'},
  {w:c=>c.tokens>=1000,t:'That wallet looks heavy. I would hold it for you. For free. Mostly.'},
  {w:c=>c.wins>=25,t:'A winner walks among us. I am going to stand near you and absorb it.'}
 ];
 const DAILY_LINES={
  Ace:{w:c=>!!c.dailyName&&!c.dailyDone,t:'Today\'s featured cabinet is {dailyName}. Bonus tickets, bro. I would play it, but I am busy staring at a bear.'},
  Moxie:{w:c=>!!c.dailyName&&!c.dailyDone,t:'{dailyName} is today\'s featured. Free tickets for turning up. My favourite kind of effort.'},
  Juniper:{w:c=>!!c.dailyName&&!c.dailyDone,t:'Chart update: {dailyName} is the featured cabinet today. I have highlighted it. Twice.'},
  Laryn:{w:c=>!!c.dailyName&&!c.dailyDone,t:'{dailyName} is paying a bonus today. Just so you know. Not that I am looking out for you.'}
 };
 for(const n of Object.keys(DAILY_LINES))REACT[n].push(DAILY_LINES[n]);
 STAFF_RX.host.push({w:c=>!!c.dailyName&&!c.dailyDone,t:'Today\'s featured cabinet is {dailyName}. Bonus tickets. I get nothing. Do enjoy.'});
 STAFF_RX.bartender.push({w:c=>c.dailyStreak>=3,t:'{dailyStreak} days in a row. I am starting to think you have nowhere better to be. Welcome.'});

 // ───────── the shared API ─────────
 const fillCtx=(t,c)=>t.replace(/\{(\w+)\}/g,(_,k)=>c[k]!==undefined?c[k]:'');
 const eligible=(list,c)=>{const o=[];for(const e of list||[]){try{if(e.w(c))o.push(e.t);}catch{}}return o;};
 const baseRegular=V.regular,baseStaff=V.staffLine;
 V.regular=(name,topic)=>{
  if(topic==='chat'||topic==='tip'||topic==='rumour'||topic==='stats'){const m=moment(name);if(m){bump(name);return m;}}
  if(topic==='stats'){bump(name);const c=ctx();const pool=REPORT[name]||GENERIC_REPORT;return fillCtx(V.pick('rp:'+name+':'+TIER(c),[pool[TIER(c)]||pool[0]]),c);}
  if(topic==='chat'||topic==='tip'||topic==='rumour'){
   bump(name);
   if(Math.random()<(topic==='chat'?.55:.2)){const c=ctx(),ok=eligible(REACT[name],c);if(ok.length)return fillCtx(V.pick('rx:'+name,ok),c);}
  }
  return baseRegular(name,topic);
 };
 V.staffLine=who=>{
  if(Math.random()<.4){const c=ctx(),ok=eligible(STAFF_RX[who],c);if(ok.length)return fillCtx(V.pick('sx:'+who,ok),c);}
  return baseStaff(who);
 };
 V.memoryBark=()=>{const c=ctx(),ok=eligible(CROWD_RX,c);return ok.length?fillCtx(V.pick('cx',ok),c):'';};
 V.memory={feudInfo,feudTell,FEUD,FEUD_GATES,FEUD_TITLES,FEUD_WAIT,MOMENTS,CROWD_RX,moment,ctx,rapport,storyInfo,storyTell,STORY,CHAPTERS,GATES,REACT,STAFF_RX,REPORT,WAIT,AFTER,bump,
  reset(){const b=blank();for(const k of Object.keys(b))mem[k]=b[k];mem.visits=1;mem.lastVisit=Date.now();save();}};
})();

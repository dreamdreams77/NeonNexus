// Neon Nexus daily goals. Classic script, loaded before the cabinets so arcade.js, the lobby and the voice can all read it.
// Every local day one cabinet is "featured" and a second one is its "double feature" partner. Playing the featured
// cabinet, winning on it and then playing the partner each pay a one-off ticket bonus, and playing on consecutive days
// builds a streak bonus. It all lives in the player's save under `daily`, and it only ever adds tickets (no new currency).
(()=>{
 'use strict';
 const NAMES={skeeball:'Cosmic Skee-Ball',airhockey:'Comet Air Hockey',billiards:'Moonlight Billiards',whack:'Moon Moles',target:'Bubble Blaster',memory:'Prism Sequence',rhythm:'Beat Foundry',meteor:'Meteor Mayhem',racer:'Turbo Tunnels',stack:'Clay Stack',pinball:'Starlight Pinball',claw:'Lucky Claw',chef:'Kitchen Rush',sushi:'Sushi Catch',mixology:'Mixology Master',pulse:'Pulse Runner',moto:'Barrelstorm Moto',moonquest:'Moonshard Legend',ringtoss:'Comet Ring Toss',gemdig:'Moon Gem Dig'};
 const IDS=Object.keys(NAMES);
 const REWARD={play:30,win:30,partner:25,streakStep:3,streakCap:7};
 const dayNum=(d=new Date())=>Math.floor(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())/86400000);
 // 7 is coprime with 20, so every cabinet takes a turn as the featured one before any repeats.
 const featuredOn=n=>{const i=(((n*7+3)%IDS.length)+IDS.length)%IDS.length;return{game:IDS[i],partner:IDS[(i+9)%IDS.length]};};
 function read(){try{const v=JSON.parse(localStorage.getItem('neon-nexus-player-v1')||'{}');return v&&typeof v==='object'&&!Array.isArray(v)?v:{};}catch{return {};}}
 const fresh=(day,prev)=>({day,played:false,won:false,partner:false,streak:prev&&prev.lastDay===day-1?(Number(prev.streak)||0)+1:1,lastDay:day});
 // What the player sees today, without changing anything.
 function today(sv=read()){
  const day=dayNum(),f=featuredOn(day),d=sv.daily&&typeof sv.daily==='object'&&sv.daily.day===day?sv.daily:null;
  return{day,game:f.game,partner:f.partner,name:NAMES[f.game],partnerName:NAMES[f.partner],played:!!(d&&d.played),won:!!(d&&d.won),partnerDone:!!(d&&d.partner),
   streak:d?Number(d.streak)||1:(sv.daily&&sv.daily.lastDay===day-1?(Number(sv.daily.streak)||0)+1:1),reward:REWARD};
 }
 // Called by arcade.js when a round ends; mutates the save object it is about to write and returns a line for the result card.
 function apply(saved,game,win){
  const day=dayNum(),f=featuredOn(day),notes=[];let tickets=0;
  let d=saved.daily&&typeof saved.daily==='object'?saved.daily:null;
  if(!d||d.day!==day){d=fresh(day,d);saved.daily=d;const bonus=d.streak>1?Math.min(d.streak,REWARD.streakCap)*REWARD.streakStep:0;if(bonus){tickets+=bonus;notes.push('DAY '+d.streak+' STREAK +'+bonus);}}
  if(game===f.game){
   if(!d.played){d.played=true;tickets+=REWARD.play;notes.push('TODAY\'S FEATURED +'+REWARD.play);}
   if(win&&!d.won){d.won=true;tickets+=REWARD.win;notes.push('FEATURED WIN +'+REWARD.win);}
  }
  if(game===f.partner&&!d.partner){d.partner=true;tickets+=REWARD.partner;notes.push('DOUBLE FEATURE +'+REWARD.partner);}
  if(tickets){saved.tickets=(Number(saved.tickets)||0)+tickets;saved.ticketHistory=saved.ticketHistory||[];saved.ticketHistory.unshift({game:'daily',score:0,amount:tickets,quest:'Daily bonus',at:Date.now()});saved.ticketHistory=saved.ticketHistory.slice(0,30);}
  return notes.length?'DAILY · '+notes.join(' · ')+' TICKETS':'';
 }
 // A short description of what is still on offer today, for the lobby card.
 function pitch(t=today()){
  if(!t.played)return 'TODAY\'S FEATURED · play it for +'+REWARD.play+' tickets, win for +'+REWARD.win+' more';
  if(!t.won)return 'TODAY\'S FEATURED · win it for +'+REWARD.win+' bonus tickets';
  if(!t.partnerDone)return 'DOUBLE FEATURE · '+t.partnerName+' pays +'+REWARD.partner+' today';
  return 'TODAY\'S FEATURED · all bonuses claimed. Back tomorrow.';
 }
 // The card text for one specific cabinet in the lobby, or an empty string when it has nothing to do with today's goals.
 function pitchFor(id,t=today()){
  if(id===t.game)return !t.played?'TODAY\'S FEATURED · play for +'+REWARD.play+' tickets, win for +'+REWARD.win+' more':!t.won?'TODAY\'S FEATURED · win it for +'+REWARD.win+' bonus tickets':'TODAY\'S FEATURED · bonuses claimed. Back tomorrow.';
  if(id===t.partner)return t.partnerDone?'DOUBLE FEATURE · bonus claimed today.':'DOUBLE FEATURE · play it today for +'+REWARD.partner+' tickets';
  return '';
 }
 window.NEXUS_GAME_NAMES=NAMES;
 window.NEXUS_DAILY={today,apply,pitch,pitchFor,featuredOn,dayNum,REWARD,IDS};
})();

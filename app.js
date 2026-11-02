(() => {
  const $ = (s) => document.querySelector(s);
  const SAVE_KEY = 'neon-nexus-player-v1';
  const saved = (() => { try { return JSON.parse(localStorage.getItem(SAVE_KEY) || '{}'); } catch { return {}; } })();
  const state = { tokens: Number.isFinite(saved.tokens) ? saved.tokens : 250, entered: !!saved.entered, played: !!saved.played, vault: !!saved.vault, best: Number(saved.best) || 0, redeemed: Array.isArray(saved.redeemed) ? saved.redeemed : [], prizeDropClaimed: !!saved.prizeDropClaimed, completedActivities: Array.isArray(saved.completedActivities) ? saved.completedActivities : [], score: 0, time: 30, timer: null, activeGame: false };
  const persist = () => { try { localStorage.setItem(SAVE_KEY, JSON.stringify({tokens:state.tokens,entered:state.entered,played:state.played,vault:state.vault,best:state.best,redeemed:state.redeemed,prizeDropClaimed:state.prizeDropClaimed,completedActivities:state.completedActivities})); } catch { toast('Progress could not be saved on this device.'); } };
  const modal = $('#modal'), modalTitle = $('#modal-title'), modalCopy = $('#modal-copy'), modalKicker = $('#modal-kicker'), modalContent = $('#modal-content'), modalAction = $('#modal-action');
  const toast = (message) => { const el = $('#toast'); el.textContent = message; el.classList.add('show'); setTimeout(() => el.classList.remove('show'), 2300); };
  const updateWallet = () => { $('#token-count').textContent = state.tokens; persist(); };
  const updateQuests = () => {
    const done = [state.entered, state.played, state.vault].filter(Boolean).length;
    $('.quest-count').textContent = done + ' / 3';
    const rows = $('#quest-list').children;
    [state.entered, state.played, state.vault].forEach((complete, i) => {
      rows[i].classList.toggle('complete', complete);
      rows[i].querySelector('.quest-symbol').textContent = complete ? '✓' : ['◎','▦','◇'][i];
      rows[i].querySelector('.quest-reward').textContent = complete ? 'COMPLETE' : ['+25 ◆','+50 ◆','+25 ◆'][i];
    });
  };
  const openModal = (kicker, title, copy, content = '', action = 'GOT IT', callback = closeModal) => {
    modalKicker.textContent = kicker; modalTitle.textContent = title; modalCopy.textContent = copy; modalContent.innerHTML = content; modalAction.textContent = action + ' ↗'; modalAction.onclick = callback; modalAction.disabled = false; modalAction.style.opacity = '1'; modal.classList.add('open'); modal.setAttribute('aria-hidden','false');
  };
  function closeModal(){ modal.classList.remove('open'); modal.setAttribute('aria-hidden','true'); }
  $('#modal-close').addEventListener('click', closeModal);
  modal.addEventListener('click', e => { if(e.target === modal) closeModal(); });
  document.addEventListener('keydown', e => { if(e.key === 'Escape') closeModal(); });
  $('#enter-btn').addEventListener('click', () => {
    if (!state.entered) { state.entered = true; state.tokens += 25; updateWallet(); updateQuests(); }
    openModal('ACCESS GRANTED / GRAND ATRIUM', 'Welcome to your world.', 'Your pass is active. The Grand Atrium is yours to explore. Your first quest reward is waiting in your wallet.', '<div class="game-play"><div class="game-score">+25 ◆</div><div class="game-clock">FIRST STEPS QUEST COMPLETE</div></div>', 'LET’S EXPLORE');
  });
  $('#profile-btn').addEventListener('click', () => openModal('PLAYER CARD', 'Arcade newcomer', 'Your profile grows as you explore, play and collect. More player customisation is coming soon.', '<div class="game-play"><div class="game-score">LVL 01</div><div class="game-clock">250 TOKENS · NEXUS RATING: ROOKIE</div></div>', 'NICE'));
  const districts = {
    atrium:['GRAND ATRIUM','Your home base.','Meet other players, customise your look and make the Nexus feel like yours.'],
    combat:['COMBAT DISTRICT','Mission briefing incoming.','Original action challenges and skill-based shooting galleries are planned for this district.'],
    velocity:['VELOCITY BOULEVARD','Ready. Set. Send it.','Race, drift and chase leaderboard times. Vehicle upgrades and championships are on the roadmap.'],
    arcade:['CLASSIC ARCADE','The classics never miss.','Play quick-fire challenges, chase high scores and earn tokens. Start with Neon Hoops below.'],
    social:['FOOD & SOCIAL','Stay a little longer.','Discover cafés, food spots and social hangouts. Meet the characters who make the resort feel alive.'],
    vault:['THE PRIZE VAULT','Your wins. Your rewards.','Trade tokens for collectibles, cosmetics and special access. Your first rewards are ready below.']
  };
  document.querySelectorAll('[data-district]').forEach(btn => btn.addEventListener('click', () => {
    const id=btn.dataset.district, d=districts[id];
    if(id==='atrium'){document.querySelector('#walkable-atrium').scrollIntoView({behavior:'smooth'});return;}
    const tab=document.querySelector('[data-world="'+id+'"]');
    if(tab){tab.click();document.querySelector('#district-worlds').scrollIntoView({behavior:'smooth'});return;}
    if(id==='vault'&&!state.vault){state.vault=true;state.tokens+=25;updateWallet();updateQuests();}
    openModal('DISTRICT ACCESS / '+id.toUpperCase(),d[0],d[1]+' '+d[2],'','BACK TO THE RESORT');
  }));
  function startGame(){ window.location.href = './hoops.html'; }
  function endGame(){
    if(!state.activeGame) return;
    state.activeGame = false; clearInterval(state.timer);
    const earned = Math.floor(state.score / 10) * 2 + (state.score >= 100 ? 10 : 0);
    state.tokens += earned; state.played = true; state.best = Math.max(state.best,state.score);
    $('#best-score').textContent = state.best; updateWallet(); updateQuests();
    openModal('ARCADE RESULTS / NEON HOOPS','That’s a wrap!', 'You scored '+state.score+' points and earned '+earned+' tokens. '+(state.score >= 100 ? 'Bonus tokens for breaking 100!' : 'Play again and beat your best.'), '<div class="game-play"><div class="game-score">+'+earned+' ◆</div><div class="game-clock">TOKENS ADDED TO YOUR WALLET · BEST '+state.best+'</div></div>', 'PLAY AGAIN', startGame);
  }
  $('#play-btn').addEventListener('click', startGame);
  $('#best-score').textContent = state.best;
  document.querySelectorAll('[data-prize]').forEach(btn => {
    if (state.redeemed.includes(btn.dataset.prize)) { btn.textContent = 'REDEEMED'; btn.disabled = true; }
  });
  window.addEventListener('nexus:machine', event => {
    const machine = event.detail || {};
    if (machine.name === 'NEON HOOPS') { startGame(); return; }
    if (machine.name === 'PRIZE DROP') {
      if (!state.prizeDropClaimed) {
        state.prizeDropClaimed = true; state.tokens += 15; updateWallet();
        openModal('GRAND ATRIUM / PRIZE DROP', 'A little bonus!', 'You found a hidden 15-token bonus inside the Prize Drop machine. Come back another visit for more surprises.', '<div class="game-play"><div class="game-score">+15 ◆</div><div class="game-clock">BONUS SAVED TO YOUR PLAYER PROFILE</div></div>', 'KEEP EXPLORING');
      } else {
        openModal('GRAND ATRIUM / PRIZE DROP', 'Already collected!', 'You have claimed this visit’s bonus. Your reward is saved to this device.', '', 'GOT IT');
      }
      return;
    }
    openModal('GRAND ATRIUM / ARCADE CABINET', machine.name || 'Arcade machine', machine.desc || 'This cabinet is being prepared for its first game. Explore Neon Hoops in the meantime.', '<div class="game-play"><div class="game-score">COMING SOON</div><div class="game-clock">NEW ORIGINAL ARCADE EXPERIENCES ARE IN DEVELOPMENT</div></div>', 'BACK TO THE ATRIUM');
  });

  const activityRewards = {'combat-target-1':10,'combat-target-2':10,'combat-target-3':10,'velocity-finish':25,'velocity-garage':5,'arcade-skee':10,'arcade-hockey':10,'arcade-claw':10,'social-host':5,'social-order':10,'vault-display-1':3,'vault-display-2':3,'vault-display-3':3,'vault-display-4':3,'vault-display-5':3,'vault-bonus':15};
  window.addEventListener('nexus:district-activity', event => {
    const {district,activity,label}=event.detail||{};
    if(!activity)return;
    if(state.completedActivities.includes(activity)){
      openModal(district.toUpperCase()+' / DISTRICT ACTIVITY','You’ve already explored this one.','This activity has already been completed on your player profile. Try another point of interest in this district.','', 'KEEP EXPLORING');
      return;
    }
    const reward=activityRewards[activity]||5;
    state.completedActivities.push(activity);state.tokens+=reward;
    if(district==='vault'&&!state.vault){state.vault=true;updateQuests();}
    updateWallet();
    openModal(district.toUpperCase()+' / ACTIVITY COMPLETE','Nice discovery!',''+(label||'You completed a district activity')+'. You earned '+reward+' tokens. Your progress is saved on this device.','<div class="game-play"><div class="game-score">+'+reward+' ◆</div><div class="game-clock">TOKENS ADDED · ACTIVITY SAVED</div></div>','BACK TO EXPLORING');
  });
  document.querySelectorAll('[data-prize]').forEach(btn => btn.addEventListener('click', () => {
    const cost = Number(btn.dataset.cost), name = btn.dataset.prize;
    if(state.tokens < cost){ toast('You need '+(cost-state.tokens)+' more tokens for '+name+'.'); return; }
    openModal('PRIZE VAULT / REDEMPTION', 'Redeem '+name+'?', 'This will use '+cost+' tokens from your wallet. This prototype keeps rewards in your local session.', '<div class="game-play"><div class="game-score">'+cost+' ◆</div><div class="game-clock">AVAILABLE BALANCE: '+state.tokens+' TOKENS</div></div>', 'CONFIRM REDEMPTION', () => {
      state.tokens -= cost; state.redeemed.push(name); updateWallet(); closeModal(); toast(name+' redeemed! Enjoy your reward.'); btn.textContent = 'REDEEMED'; btn.disabled = true;
    });
  }));
  updateWallet(); updateQuests();
})();
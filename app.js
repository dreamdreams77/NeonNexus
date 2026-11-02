(() => {
  const $ = (s) => document.querySelector(s);
  const state = { tokens: 250, entered: false, played: false, vault: false, best: 0, score: 0, time: 30, timer: null, activeGame: false };
  const modal = $('#modal'), modalTitle = $('#modal-title'), modalCopy = $('#modal-copy'), modalKicker = $('#modal-kicker'), modalContent = $('#modal-content'), modalAction = $('#modal-action');
  const toast = (message) => { const el = $('#toast'); el.textContent = message; el.classList.add('show'); setTimeout(() => el.classList.remove('show'), 2300); };
  const updateWallet = () => $('#token-count').textContent = state.tokens;
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
    const d = districts[btn.dataset.district];
    if(btn.dataset.district === 'vault' && !state.vault){ state.vault = true; state.tokens += 25; updateWallet(); updateQuests(); }
    openModal('DISTRICT ACCESS / '+btn.dataset.district.toUpperCase(), d[0], d[1]+' '+d[2], '<div class="game-play"><div class="game-score">'+(btn.dataset.district === 'vault' ? '+25 ◆' : '✦')+'</div><div class="game-clock">'+(btn.dataset.district === 'vault' ? 'TREASURE HUNTER QUEST COMPLETE' : 'NEW EXPERIENCES UNLOCKING SOON')+'</div></div>', 'BACK TO THE RESORT');
  }));
  function startGame(){
    closeModal(); state.score = 0; state.time = 30; state.activeGame = true;
    openModal('CLASSIC ARCADE / QUICK PLAY','Neon Hoops','Tap the button to shoot. Each basket scores 10 points. You have 30 seconds.', '<div class="game-play"><div class="game-score" id="live-score">0</div><div class="game-clock" id="live-clock">00:30 REMAINING</div><button class="shoot-btn" id="shoot-btn">SHOOT! 🏀</button></div>', 'END GAME', endGame);
    modalAction.disabled = true; modalAction.style.opacity = '.35';
    $('#shoot-btn').addEventListener('click', () => {
      if(!state.activeGame) return;
      const made = Math.random() > .24;
      if(made){ state.score += 10; $('#live-score').textContent = state.score; $('#live-score').style.textShadow = '0 0 20px #5ce7f2'; }
      else { toast('Off the rim! Take another shot.'); }
    });
    state.timer = setInterval(() => {
      state.time--; $('#live-clock').textContent = '00:'+String(state.time).padStart(2,'0')+' REMAINING';
      if(state.time <= 0) endGame();
    },1000);
  }
  function endGame(){
    if(!state.activeGame) return;
    state.activeGame = false; clearInterval(state.timer);
    const earned = Math.floor(state.score / 10) * 2 + (state.score >= 100 ? 10 : 0);
    state.tokens += earned; state.played = true; state.best = Math.max(state.best,state.score);
    $('#best-score').textContent = state.best; updateWallet(); updateQuests();
    openModal('ARCADE RESULTS / NEON HOOPS','That’s a wrap!', 'You scored '+state.score+' points and earned '+earned+' tokens. '+(state.score >= 100 ? 'Bonus tokens for breaking 100!' : 'Play again and beat your best.'), '<div class="game-play"><div class="game-score">+'+earned+' ◆</div><div class="game-clock">TOKENS ADDED TO YOUR WALLET · BEST '+state.best+'</div></div>', 'PLAY AGAIN', startGame);
  }
  $('#play-btn').addEventListener('click', startGame);
  document.querySelectorAll('[data-prize]').forEach(btn => btn.addEventListener('click', () => {
    const cost = Number(btn.dataset.cost), name = btn.dataset.prize;
    if(state.tokens < cost){ toast('You need '+(cost-state.tokens)+' more tokens for '+name+'.'); return; }
    openModal('PRIZE VAULT / REDEMPTION', 'Redeem '+name+'?', 'This will use '+cost+' tokens from your wallet. This prototype keeps rewards in your local session.', '<div class="game-play"><div class="game-score">'+cost+' ◆</div><div class="game-clock">AVAILABLE BALANCE: '+state.tokens+' TOKENS</div></div>', 'CONFIRM REDEMPTION', () => {
      state.tokens -= cost; updateWallet(); closeModal(); toast(name+' redeemed! Enjoy your reward.'); btn.textContent = 'REDEEMED'; btn.disabled = true;
    });
  }));
  updateWallet(); updateQuests();
})();
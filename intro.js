// Title screen, load progress and settings. Classic script so it runs before the 3D world module and can gate input.
(()=>{
 'use strict';
 const KEY='neon-nexus-settings-v1',$=s=>document.querySelector(s);
 const defaults={sound:true,reduceMotion:false,quality:'auto'};
 const read=()=>{try{return{...defaults,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch{return{...defaults};}};
 const write=s=>{try{localStorage.setItem(KEY,JSON.stringify(s));}catch{}};
 let settings=read();
 window.nexusSettings=()=>settings;
 const apply=()=>{
  document.documentElement.classList.toggle('reduce-motion',!!settings.reduceMotion||matchMedia('(prefers-reduced-motion: reduce)').matches);
  if(window.nexusSetMuted)window.nexusSetMuted(!settings.sound);
 };
 apply();
 const intro=$('#intro'),playBtn=$('#intro-play'),fill=$('#intro-bar-fill'),status=$('#intro-status'),err=$('#intro-error'),panel=$('#settings');
 if(!intro)return;
 document.body.classList.add('intro-open');
 // Progress is honest about the two slow things: fetching the 3D engine and painting the lobby's artwork.
 let pct=0,ready=false,t0=performance.now();
 const phases=[[0,'LIGHTING THE NEON…'],[30,'PAINTING THE FLOORBOARDS…'],[55,'HANGING THE POSTERS…'],[78,'INVITING THE REGULARS…'],[92,'WARMING UP THE CABINETS…']];
 const tick=()=>{
  if(ready){pct=100;}else{const el=(performance.now()-t0)/1000;pct=Math.min(94,pct+(94-pct)*.03+.12);if(el>12)err.hidden=false;}
  fill.style.width=pct.toFixed(1)+'%';
  const ph=[...phases].reverse().find(p=>pct>=p[0]);status.textContent=ready?'READY. WELCOME IN':ph[1];
  if(!ready)requestAnimationFrame(tick);else{playBtn.disabled=false;playBtn.focus({preventScroll:true});}
 };
 requestAnimationFrame(tick);
 window.addEventListener('nexus:world-ready',()=>{ready=true;err.hidden=true;requestAnimationFrame(tick);});
 const enter=()=>{
  if(playBtn.disabled)return;
  intro.classList.add('leaving');document.body.classList.remove('intro-open');
  setTimeout(()=>{intro.hidden=true;window.dispatchEvent(new CustomEvent('nexus:intro-done'));},matchMedia('(prefers-reduced-motion: reduce)').matches||settings.reduceMotion?0:650);
  try{window.dispatchEvent(new CustomEvent('nexus:intro-enter'));}catch{}
 };
 playBtn.addEventListener('click',enter);
 $('#intro-retry')?.addEventListener('click',()=>location.reload());
 window.addEventListener('keydown',e=>{if(!intro.hidden&&!panel.hidden&&e.key==='Escape'){closeSettings();return;}if(!intro.hidden&&panel.hidden&&(e.key==='Enter'||e.key===' ')&&!onOtherControl()){e.preventDefault();enter();}},true);
 // Enter/Space anywhere on the title screen means Play, except on another button (Settings, Retry), which keeps its own action.
 function onOtherControl(){const f=document.activeElement;return !!f&&f!==playBtn&&f.matches('button,a,input,select');}
 // settings
 const sound=$('#set-sound'),motion=$('#set-motion'),quality=$('#set-quality');
 const sync=()=>{sound.checked=!!settings.sound;motion.checked=!!settings.reduceMotion;quality.value=settings.quality;};
 const openSettings=()=>{sync();panel.hidden=false;sound.focus();};
 const closeSettings=()=>{panel.hidden=true;($('#intro-settings')||playBtn).focus();};
 $('#intro-settings').addEventListener('click',openSettings);$('#settings-close').addEventListener('click',closeSettings);
 panel.addEventListener('click',e=>{if(e.target===panel)closeSettings();});
 for(const el of [sound,motion,quality])el.addEventListener('change',()=>{settings={sound:sound.checked,reduceMotion:motion.checked,quality:quality.value};write(settings);apply();});
})();

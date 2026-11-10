/* Dailycade: the game page "switches on" like a tube TV when you arrive from a Play game button.
   The homepage sets sessionStorage dc.crton=1 and opens the game; this page stays dark until it has drawn,
   then the line stretches out and the picture opens. */
(function(){
  /* ---------- switching off: leaving a game for the Dailycade homepage ---------- */
  let leaving=false;
  function off(href){
    if(leaving)return;leaving=true;
    const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
    if(reduce){location.href=href;return}
    const st=document.createElement('style');
    st.textContent=
     '.dcoff{position:fixed;inset:0;z-index:2147483600;pointer-events:none;overflow:hidden}'
    +'@media (min-width:600px) and (min-aspect-ratio:4/5){.dcoff{width:var(--appw);height:var(--apph);margin:auto;border-radius:16px}}'
    +'.dcoff i{position:absolute;left:0;right:0;height:50.5%;background:#000}'
    +'.dcoff .t{top:0;transform:translateY(-101%);animation:dcoffIn .26s cubic-bezier(.6,0,.4,1) .04s forwards}'
    +'.dcoff .b{bottom:0;transform:translateY(101%);animation:dcoffIn .26s cubic-bezier(.6,0,.4,1) .04s forwards}'
    +'.dcoff .f{position:absolute;inset:0;background:#fff;opacity:0;animation:dcoffFlash .3s ease-out forwards}'
    +'.dcoff .l{position:absolute;left:50%;top:50%;width:100%;height:3px;margin:-1.5px 0 0 -50%;background:#fff;border-radius:2px;opacity:0;'
    +'box-shadow:0 0 12px 3px rgba(190,255,220,.9),0 0 40px 10px rgba(120,220,255,.45);animation:dcoffLine .62s cubic-bezier(.4,0,.2,1) .22s forwards}'
    +'@keyframes dcoffIn{to{transform:translateY(0)}}'
    +'@keyframes dcoffFlash{0%{opacity:.5}100%{opacity:0}}'
    +'@keyframes dcoffLine{0%{opacity:1;transform:scaleX(1)}45%{opacity:1;transform:scaleX(.012) scaleY(1.6)}75%{opacity:1;transform:scaleX(.012) scaleY(1.6)}100%{opacity:0;transform:scaleX(.004) scaleY(.6)}}';
    const el=document.createElement('div');el.className='dcoff';el.setAttribute('aria-hidden','true');
    el.innerHTML='<i class="t"></i><i class="b"></i><span class="f"></span><span class="l"></span>';
    document.documentElement.appendChild(st);document.documentElement.appendChild(el);
    setTimeout(()=>{location.href=href},880);
  }
  function muted(){try{return (/gambit/.test(location.pathname)&&localStorage.getItem('gambit.muted')==='1')||(/dropface/.test(location.pathname)&&localStorage.getItem('dropface-muted')==='1')}catch(e){return false}}
  function offSound(){ // a soft click and the hum winding down
    if(muted())return;
    try{const ac=new (window.AudioContext||window.webkitAudioContext)();if(ac.state!=='running')ac.resume();
      const t=ac.currentTime+.01,out=ac.createGain();out.gain.value=.9;out.connect(ac.destination);
      const cl=ac.sampleRate*.03,cb=ac.createBuffer(1,cl,ac.sampleRate),cd=cb.getChannelData(0);for(let i=0;i<cl;i++)cd[i]=(Math.random()*2-1)*Math.pow(1-i/cl,4);
      const c=ac.createBufferSource();c.buffer=cb;const cf=ac.createBiquadFilter();cf.type='bandpass';cf.frequency.value=2400;cf.Q.value=1.4;const cg=ac.createGain();cg.gain.value=.12;c.connect(cf).connect(cg).connect(out);c.start(t);
      const hf=ac.createBiquadFilter();hf.type='lowpass';hf.frequency.setValueAtTime(1800,t);hf.frequency.exponentialRampToValueAtTime(300,t+.8);
      const hum=ac.createGain();hum.gain.setValueAtTime(.09,t);hum.gain.exponentialRampToValueAtTime(.0001,t+.85);hf.connect(hum).connect(out);
      [['sawtooth',90,.9],['square',180,.35],['sawtooth',270.8,.25]].forEach(([ty,f,v])=>{const o=ac.createOscillator();o.type=ty;o.frequency.setValueAtTime(f,t);o.frequency.exponentialRampToValueAtTime(f*.45,t+.85);const g=ac.createGain();g.gain.value=v;o.connect(g).connect(hf);o.start(t);o.stop(t+.9)});
    }catch(e){}
  }
  // any link back to the homepage switches the set off first
  document.addEventListener('click',e=>{const a=e.target.closest&&e.target.closest('a[href="index.html"]');if(!a||e.metaKey||e.ctrlKey||e.shiftKey||e.button)return;e.preventDefault();e.stopPropagation();off('index.html')},true);
  window.DCCrt={off};

  /* ---------- switching on: arriving from a Play game button ---------- */
  let on=false;
  try{on=sessionStorage.getItem('dc.crton')==='1';sessionStorage.removeItem('dc.crton')}catch(e){}
  if(on&&!matchMedia('(prefers-reduced-motion: reduce)').matches)(function(){
  const st=document.createElement('style');
  st.textContent=
   '.dccrt{position:fixed;inset:0;z-index:2147483600;pointer-events:none;overflow:hidden}'
  +'@media (min-width:600px) and (min-aspect-ratio:4/5){.dccrt{width:var(--appw);height:var(--apph);margin:auto;border-radius:16px}}'
  +'.dccrt i{position:absolute;left:0;right:0;height:50.5%;background:#000}'
  +'.dccrt .t{top:0}.dccrt.go .t{animation:dccrtUp .42s cubic-bezier(.7,0,.2,1) .26s forwards}'
  +'.dccrt .b{bottom:0}.dccrt.go .b{animation:dccrtDown .42s cubic-bezier(.7,0,.2,1) .26s forwards}'
  +'.dccrt .l{position:absolute;left:50%;top:50%;width:100%;height:3px;margin:-1.5px 0 0 -50%;background:#fff;border-radius:2px;'
  +'box-shadow:0 0 12px 3px rgba(190,255,220,.9),0 0 40px 10px rgba(120,220,255,.45);transform:scaleX(0)}'
  +'.dccrt.go .l{animation:dccrtLine .28s cubic-bezier(.2,.8,.2,1) forwards,dccrtLineOut .3s ease-out .3s forwards}'
  +'.dccrt .f{position:absolute;inset:0;background:#fff;opacity:0}.dccrt.go .f{animation:dccrtFlash .5s ease-out .3s forwards}'
  +'@keyframes dccrtLine{0%{transform:scaleX(0) scaleY(1)}12%{transform:scaleX(.02) scaleY(2.4)}100%{transform:scaleX(1) scaleY(1)}}'
  +'@keyframes dccrtLineOut{to{transform:scaleX(1) scaleY(60);opacity:0}}'
  +'@keyframes dccrtUp{to{transform:translateY(-101%)}}'
  +'@keyframes dccrtDown{to{transform:translateY(101%)}}'
  +'@keyframes dccrtFlash{0%{opacity:.55}100%{opacity:0}}';
  const el=document.createElement('div');el.className='dccrt';el.setAttribute('aria-hidden','true');
  el.innerHTML='<i class="t"></i><i class="b"></i><span class="f"></span><span class="l"></span>';
  document.documentElement.appendChild(st);document.documentElement.appendChild(el);
  // stay dark until the page has drawn, then switch on
  let started=false;
  const go=()=>{if(started)return;started=true;requestAnimationFrame(()=>requestAnimationFrame(()=>{el.classList.add('go');setTimeout(()=>{el.remove();st.remove()},1000)}))};
  // wait for the page, its fonts and the home screen's first paint to settle, so the picture opens on a finished screen
  const ready=()=>{const f=(document.fonts&&document.fonts.ready)?document.fonts.ready.catch(()=>{}):Promise.resolve();
    f.then(()=>setTimeout(go,450))};
  if(document.readyState==='complete')ready();else addEventListener('load',ready);
  setTimeout(go,4000);
  })();
})();

/* Dailycade beta feedback.
   DCFeedback.open({game, ctx})        the feedback sheet: a rating, a note and an optional email
   DCFeedback.quick(game, ctx)         a 👍/👎 row for the end of a game, once a day per game (returns an element, or null)
   Both save to the database as col 'feedback' (only the admin can read them back), with the page, device and game details attached. */
(function(){
  const RATES=[['1','😕','Not great'],['2','😐','Okay'],['3','🙂','Good'],['4','😍','Love it']];
  const today=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
  const isDark=()=>{const t=document.documentElement.dataset.theme;return t?t==='dark':matchMedia('(prefers-color-scheme: dark)').matches};

  const css=`
.dcfb{border:0;padding:0;margin:auto;width:min(420px,calc(100vw - 24px));max-height:calc(100dvh - 24px);border-radius:20px;background:var(--fb-bg);color:var(--fb-ink);
  font:15px/1.45 "Plus Jakarta Sans",-apple-system,system-ui,sans-serif;box-shadow:0 24px 60px -12px rgba(0,0,0,.45);overflow:auto;
  --fb-bg:#fff;--fb-ink:#0d0d0d;--fb-muted:#707070;--fb-soft:#f4f4f2;--fb-line:#e3e3e0;--fb-on:#0d0d0d;--fb-onink:#fff}
.dcfb.dark{--fb-bg:#161616;--fb-ink:#f2f2f0;--fb-muted:#9a9a97;--fb-soft:#222;--fb-line:#2e2e2e;--fb-on:#f2f2f0;--fb-onink:#0d0d0d}
.dcfb::backdrop{background:rgba(0,0,0,.55)}
.dcfb *{box-sizing:border-box}
.dcfb .fbh{position:sticky;top:0;background:var(--fb-bg);display:flex;align-items:center;gap:10px;padding:18px 20px 6px;z-index:1}
.dcfb h2{margin:0;font-size:19px;font-weight:700;display:flex;align-items:center;gap:8px}
.dcfb .fbtag{font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;padding:3px 7px 2px;border-radius:999px;line-height:1;
  background:linear-gradient(var(--fb-bg),var(--fb-bg)) padding-box,linear-gradient(120deg,#ff8ad8,#c49bff,#7cc8ff,#9deba8) border-box;border:1.5px solid transparent}
.dcfb .fbx{margin-left:auto;width:34px;height:34px;border:0;border-radius:50%;background:var(--fb-soft);color:var(--fb-ink);cursor:pointer;display:grid;place-items:center}
.dcfb .fbx svg{width:16px;height:16px}
.dcfb .fbb{padding:4px 20px 20px}
.dcfb p{margin:0 0 16px;color:var(--fb-muted);font-size:14px}
.dcfb .fbl{display:block;font-size:13px;font-weight:600;margin:0 0 8px}
.dcfb .fbr{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:0 0 18px}
.dcfb .fbr button{border:0;border-radius:14px;background:var(--fb-soft);color:var(--fb-ink);padding:10px 4px 8px;cursor:pointer;display:grid;justify-items:center;gap:4px;font:inherit;font-size:11px;font-weight:600;
  box-shadow:inset 0 0 0 1.5px transparent;transition:transform .12s,box-shadow .12s}
.dcfb .fbr button b{font-size:26px;line-height:1;font-weight:400;filter:grayscale(.35);transition:filter .12s}
.dcfb .fbr button[aria-pressed=true]{box-shadow:inset 0 0 0 1.5px var(--fb-ink)}
.dcfb .fbr button[aria-pressed=true] b,.dcfb .fbr button:hover b{filter:none}
.dcfb .fbr button:active{transform:scale(.95)}
.dcfb textarea,.dcfb input{width:100%;border:0;border-radius:12px;background:var(--fb-soft);color:var(--fb-ink);font:inherit;padding:11px 13px;margin:0 0 14px;outline:none;box-shadow:inset 0 0 0 1px var(--fb-line)}
.dcfb textarea{min-height:110px;resize:vertical}
.dcfb textarea:focus,.dcfb input:focus{box-shadow:inset 0 0 0 1.5px var(--fb-ink)}
.dcfb .fbgo{width:100%;border:0;border-radius:12px;background:var(--fb-on);color:var(--fb-onink);font:inherit;font-weight:700;padding:13px;cursor:pointer}
.dcfb .fbgo:disabled{opacity:.4;cursor:default}
.dcfb small{display:block;color:var(--fb-muted);font-size:12px;margin-top:10px;text-align:center}
.dcfb .fberr{color:#e5534b}
.dcfb .fbdone{text-align:center;padding:16px 0 4px}
.dcfb .fbdone b{display:block;font-size:40px;line-height:1;margin-bottom:12px}
.dcfb .fbdone h3{margin:0 0 6px;font-size:18px}
.dcquick{display:flex;align-items:center;justify-content:center;gap:10px;flex-wrap:wrap;margin:18px 0 6px;font-size:14px;font-weight:600;color:inherit}
.dcquick span{opacity:.75}
.dcquick.dcquick button{all:unset;box-sizing:border-box;border:0;border-radius:999px;padding:7px 14px;font:inherit;font-size:18px;line-height:1;cursor:pointer;background:rgba(127,127,127,.16);color:inherit;transition:transform .12s}
.dcquick button:active{transform:scale(.92)}
.dcquick.dcquick button.more{all:unset;cursor:pointer;font-size:14px;font-weight:700;background:none;padding:4px 2px;text-decoration:underline;text-underline-offset:3px}
button.dcfblink.dcfblink{all:unset;box-sizing:border-box;width:auto;background:none;border:0;padding:0;margin:16px auto 0;display:table;font:inherit;font-size:13px;font-weight:600;color:inherit;opacity:.7;text-decoration:underline;text-underline-offset:3px;cursor:pointer}
button.dcfblink.dcfblink:hover{opacity:1}`;
  let styled=false;
  function style(){if(styled)return;styled=true;const s=document.createElement('style');s.textContent=css;document.head.appendChild(s)}

  // what gets attached to every note, so we can reproduce problems
  function context(game,ctx){
    return Object.assign({
      game:game||'site', page:location.pathname, date:today(), at:Date.now(),
      ua:navigator.userAgent.slice(0,300), viewport:innerWidth+'x'+innerHeight, dpr:devicePixelRatio||1,
      standalone:!!(matchMedia('(display-mode: standalone)').matches||navigator.standalone),
      theme:document.documentElement.dataset.theme||''
    },ctx||{});
  }
  async function save(data){
    if(!window.claude||!window.DCSB)throw new Error('offline');
    const uid=await (await window.claude.use('user')).id();
    // a plain insert: players can add feedback but can't read it back (only the admin can)
    const r=await window.DCSB.from('docs').insert({col:'feedback',id:uid+'-'+Date.now(),data});
    if(r.error)throw r.error;
  }

  const X='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  function open(o){
    o=o||{};style();
    const d=document.createElement('dialog');d.className='dcfb'+((o.dark!=null?o.dark:isDark())?' dark':'');d.setAttribute('aria-labelledby','dcfbT');
    d.innerHTML=`<div class="fbh"><h2 id="dcfbT">Send feedback <span class="fbtag">Beta</span></h2><button class="fbx" type="button" aria-label="Close">${X}</button></div>
<form class="fbb" novalidate>
  <p>Dailycade is in beta. Tell us what's working, what's broken and what you'd love to see.</p>
  <span class="fbl" id="dcfbR">How's it going?</span>
  <div class="fbr" role="group" aria-labelledby="dcfbR">${RATES.map(([v,e,l])=>`<button type="button" data-v="${v}" aria-pressed="false"><b aria-hidden="true">${e}</b>${l}</button>`).join('')}</div>
  <label class="fbl" for="dcfbTx">What's on your mind?</label>
  <textarea id="dcfbTx" maxlength="2000" placeholder="A bug, an idea, something that felt off…"></textarea>
  <label class="fbl" for="dcfbEm">Email <span style="font-weight:500;opacity:.6">(optional, if you'd like a reply)</span></label>
  <input id="dcfbEm" type="email" autocomplete="email" maxlength="200" placeholder="you@example.com">
  <button class="fbgo" type="submit" disabled>Send feedback</button>
  <small class="fbnote">We include your device, browser and game details to help fix things.</small>
</form>`;
    document.body.appendChild(d);
    const f=d.querySelector('form'),go=d.querySelector('.fbgo'),tx=d.querySelector('textarea'),em=d.querySelector('input'),note=d.querySelector('.fbnote');
    let rating=o.rating||'';
    const sync=()=>{go.disabled=!rating&&!tx.value.trim();d.querySelectorAll('.fbr button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.v===rating)))};
    d.querySelectorAll('.fbr button').forEach(b=>b.onclick=()=>{rating=rating===b.dataset.v?'':b.dataset.v;sync()});
    tx.oninput=sync;sync();
    const close=()=>{try{d.close()}catch(e){}};
    d.querySelector('.fbx').onclick=close;
    d.addEventListener('click',e=>{if(e.target===d)close()});
    d.addEventListener('close',()=>{d.remove();o.onClose&&o.onClose()});
    f.onsubmit=async e=>{e.preventDefault();if(go.disabled)return;
      go.disabled=true;go.textContent='Sending…';note.classList.remove('fberr');
      try{
        await save(Object.assign(context(o.game,o.ctx),{kind:'note',rating:rating?+rating:null,text:tx.value.trim().slice(0,2000),email:em.value.trim().slice(0,200)}));
        f.innerHTML=`<div class="fbdone"><b aria-hidden="true">💌</b><h3>Thanks, got it!</h3><p>Every note helps shape Dailycade while it's in beta.</p></div><button class="fbgo" type="button">Done</button>`;
        f.querySelector('.fbgo').onclick=close;f.querySelector('.fbgo').focus();
      }catch(err){go.disabled=false;go.textContent='Send feedback';note.textContent="Couldn't send that. Check your connection and try again.";note.classList.add('fberr')}
    };
    try{d.showModal()}catch(e){d.setAttribute('open','')}
    (o.rating?tx:d.querySelector('.fbr button')).focus();
    return d;
  }

  // end of game: 👍/👎 once a day per game, then an optional "Tell us more"
  function quick(game,ctx,o){
    o=o||{};style();
    const key='dc.fb.quick.'+game;let done='';try{done=localStorage.getItem(key)||''}catch(e){}
    if(done===today())return null;
    const w=document.createElement('div');w.className='dcquick';
    w.innerHTML='<span>How was this game?</span><button type="button" data-t="up" aria-label="Thumbs up">👍</button><button type="button" data-t="down" aria-label="Thumbs down">👎</button>';
    w.querySelectorAll('button').forEach(b=>b.onclick=()=>{
      const up=b.dataset.t==='up';try{localStorage.setItem(key,today())}catch(e){}
      save(Object.assign(context(game,ctx),{kind:'quick',thumb:b.dataset.t})).catch(()=>{});
      w.innerHTML='<span>Thanks!</span><button type="button" class="more">Tell us more</button>';
      w.querySelector('.more').onclick=()=>open({game,ctx,dark:o.dark,rating:up?'3':'1'});
    });
    return w;
  }

  // a small "Send feedback" link (for How to play)
  function link(game,ctx,o){style();const b=document.createElement('button');b.type='button';b.className='dcfblink';b.textContent='Send feedback';
    b.onclick=()=>{o&&o.before&&o.before();open({game,ctx,dark:o&&o.dark})};return b}

  if(document.head)style();else document.addEventListener('DOMContentLoaded',style);
  window.DCFeedback={open,quick,link};
})();

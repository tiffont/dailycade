/* Dailycade leaderboard initials: three arcade letters, shared by every game on the site.
   DCIni.block(save) returns the control for a summary page; save(ini) writes it to that game's score doc. */
(function(){
  const KEY='dc.initials';
  const BLOCK=['ASS','FUK','FUC','FCK','FUQ','SEX','CUM','DIK','DIC','KKK','NIG','NGR','FAG','TIT','COK','KUM','JIZ','HOE','NAZ','CNT','KYS','SHT','RAP','PUS','VAG','PNS'];
  const clean=v=>String(v||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,3);
  const get=()=>{try{return clean(localStorage.getItem(KEY))}catch(e){return ''}};
  const set=v=>{try{localStorage.setItem(KEY,clean(v))}catch(e){}};
  const ok=v=>v.length>0&&!BLOCK.includes(v);
  let styled=false;
  function style(){if(styled)return;styled=true;const s=document.createElement('style');s.textContent=
    '.dcini{margin:18px 0 6px;padding:14px;border-radius:14px;background:rgba(255,255,255,.06);display:flex;flex-direction:column;gap:10px}'
   +'.dcini .h{display:flex;align-items:baseline;gap:8px;font-size:.72rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;opacity:.75}'
   +'.dcini .h span{margin-left:auto;font-weight:600;letter-spacing:0;text-transform:none;opacity:.9}'
   +'.dcini .r{display:flex;align-items:center;gap:8px}'
   +'.dcini input{width:46px;height:54px;border-radius:10px;border:0;background:rgba(0,0,0,.35);box-shadow:inset 0 0 0 1.5px rgba(255,255,255,.18);color:inherit;'
   +'font:700 1.7rem/1 "JetBrains Mono",ui-monospace,monospace;text-align:center;text-transform:uppercase;caret-color:currentColor;padding:0}'
   +'.dcini input:focus{outline:none;box-shadow:inset 0 0 0 2px #9deba8}'
   +'.dcini button{margin-left:auto;height:44px;padding:0 18px;border:0;border-radius:10px;background:#9deba8;color:#0b2a12;font:700 .95rem/1 inherit;font-family:inherit;cursor:pointer;'
   +'box-shadow:0 4px 0 #4f9a5c;transform:translateY(-2px);transition:transform .08s,box-shadow .08s}' /* raised like the main buttons */
   +'.dcini button:not(:disabled):active{transform:translateY(1px);box-shadow:0 1px 0 #4f9a5c}'
   +'.dcini button:disabled{background:#2a2a2a;color:#8a8a8a;box-shadow:0 4px 0 #1a1a1a;cursor:default}'
   +'.dcini p{margin:0;font-size:.78rem;opacity:.7}.dcini p.err{color:#ff8a7a;opacity:1}'
   /* compact: small boxes beside the Challenge button on summaries */
   +'.dcini.compact{flex:none;margin:0;padding:0;background:none;gap:6px}'
   +'.dcini.compact .h{font-size:.6rem;gap:6px;white-space:nowrap}.dcini.compact .h span{margin-left:0}.dcini.compact .h span.err{color:#ff8a7a;opacity:1}'
   +'.dcini.compact .r{gap:4px}'
   +'.dcini.compact input{width:30px;height:42px;border-radius:8px;font-size:1.2rem}'
   +'.dcini.compact button{width:40px;height:42px;padding:0;margin-left:2px;display:grid;place-items:center}'
   +'.dcini.compact button svg{width:20px;height:20px}'
   +'.dcini.compact p{display:none}'
   +'.dcini.feature{margin:0;padding:18px;border-radius:16px;background:rgba(157,235,168,.07);box-shadow:inset 0 0 0 1.5px rgba(157,235,168,.35);gap:14px}'+'.dcini.feature .t{display:flex;align-items:center;gap:10px}'+'.dcini.feature .t b{font-size:1.08rem;font-weight:700;letter-spacing:-.01em;line-height:1.2}'+'.dcini.feature .t svg{width:22px;height:22px;flex:none;color:#9deba8}'+'.dcini.feature .t span{margin-left:auto;font-size:.78rem;font-weight:700;color:#9deba8}'+'.dcini.feature .t span.err{color:#ff8a7a}'+'.dcini.feature .s{margin:-8px 0 0;font-size:.86rem;opacity:.72;line-height:1.4}'+'.dcini.feature .r{gap:8px}'+'.dcini.feature input{width:50px;height:58px;font-size:1.8rem}'+'.dcini.feature button{height:50px;padding:0 22px;font-size:1rem}'+'.dcrow.stack{flex-direction:column;align-items:stretch;gap:16px}.dcrow.stack>.drop{width:100%!important;flex:none!important}'+'.dcrow{display:flex;align-items:flex-end;gap:12px}.dcrow>.drop{flex:1 1 auto!important;width:auto!important;min-width:0;margin-top:0!important;margin-bottom:4px;white-space:nowrap;font-size:15px!important;padding-inline:10px!important}';
    document.head.appendChild(s)}
  function block(save,o){
    style();const compact=!!(o&&o.compact), feature=!!(o&&o.feature);
    const wrap=document.createElement('div');wrap.className='dcini'+(compact?' compact':'')+(feature?' feature':'');
    const TROPHY='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 4h8v5a4 4 0 0 1-8 0V4z"/><path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8.5 20h7M10 17h4"/></svg>';
    if(feature) wrap.innerHTML='<div class="t">'+TROPHY+'<b>Get on today\'s leaderboard</b><span></span></div><p class="s">Add your initials so everyone can see your score.</p><div class="r"></div><p class="n" hidden></p>';
    else wrap.innerHTML='<div class="h">'+(compact?'Your initials':'Leaderboard initials')+'<span></span></div><div class="r"></div><p>Shown next to your score on the leaderboard.</p>';
    const row=wrap.querySelector('.r'), tag=wrap.querySelector(feature?'.t span':'.h span'), note=wrap.querySelector(feature?'p.n':'p'), title=wrap.querySelector('.t b'), sub=wrap.querySelector('p.s');
    let saved=get();
    const boxes=[0,1,2].map(i=>{const b=document.createElement('input');b.type='text';b.maxLength=1;b.autocomplete='off';b.autocapitalize='characters';b.spellcheck=false;
      b.inputMode='text';b.setAttribute('aria-label','Initial '+(i+1));b.value=saved[i]||'';row.appendChild(b);return b});
    const CHECK='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
    const btn=document.createElement('button');btn.type='button';row.appendChild(btn);
    const label=t=>{if(compact){btn.innerHTML=t==='Save'?CHECK:'…';btn.setAttribute('aria-label',t==='Save'?'Save initials':t)}else btn.textContent=t};label('Save');
    const say=(t,err)=>{if(compact||feature){tag.textContent=t;tag.className=err?'err':''}else{note.className=err?'err':'';note.textContent=t}};
    const val=()=>boxes.map(b=>b.value).join('');
    const paint=()=>{const v=val();btn.disabled=!v||v===saved;if(tag.className!=='err')tag.textContent=saved?(v===saved?'Saved':''):'';if(title){const on=saved&&v===saved;title.textContent=on?'You\'re on the leaderboard':'Get on today\'s leaderboard';if(tag.className!=='err')tag.textContent='';sub.textContent=on?'Your initials show next to your score. Change them any time.':'Add your initials so everyone can see your score.'}};
    boxes.forEach((b,i)=>{
      b.addEventListener('input',()=>{const c=clean(b.value);b.value=c.slice(-1);if(c&&i<2)boxes[i+1].focus();say(compact||feature?'':'Shown next to your score on the leaderboard.');paint()});
      b.addEventListener('keydown',e=>{
        if(e.key==='Backspace'&&!b.value&&i>0){boxes[i-1].focus();boxes[i-1].value='';e.preventDefault();paint()}
        else if(e.key==='ArrowLeft'&&i>0){boxes[i-1].focus();e.preventDefault()}
        else if(e.key==='ArrowRight'&&i<2){boxes[i+1].focus();e.preventDefault()}
        else if(e.key==='Enter'&&!btn.disabled){btn.click()}});
      b.addEventListener('focus',()=>b.select());
      b.addEventListener('paste',e=>{const t=clean((e.clipboardData||window.clipboardData).getData('text'));if(!t)return;e.preventDefault();
        t.split('').forEach((c,j)=>{if(boxes[i+j])boxes[i+j].value=c});boxes[Math.min(2,i+t.length)].focus();paint()});
    });
    btn.addEventListener('click',async()=>{
      const v=clean(val());
      if(!ok(v)){say(compact||feature?'Try others':'Try different initials.',true);return}
      btn.disabled=true;label('Saving…');
      try{set(v);await save(v);saved=v;say(compact||feature?'':'Saved. Your initials now show on the leaderboard.')}
      catch(e){say(compact||feature?"Couldn't save":"Couldn't save right now. Try again in a moment.",true)}
      label('Save');paint();
    });
    paint();
    return wrap;
  }
  window.DCIni={get,set,clean,block};
})();

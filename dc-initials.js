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
   +'.dcini p{margin:0;font-size:.78rem;opacity:.7}.dcini p.err{color:#ff8a7a;opacity:1}';
    document.head.appendChild(s)}
  function block(save){
    style();
    const wrap=document.createElement('div');wrap.className='dcini';
    wrap.innerHTML='<div class="h">Leaderboard initials<span></span></div><div class="r"></div><p>Shown next to your score on the leaderboard.</p>';
    const row=wrap.querySelector('.r'), tag=wrap.querySelector('.h span'), note=wrap.querySelector('p');
    let saved=get();
    const boxes=[0,1,2].map(i=>{const b=document.createElement('input');b.type='text';b.maxLength=1;b.autocomplete='off';b.autocapitalize='characters';b.spellcheck=false;
      b.inputMode='text';b.setAttribute('aria-label','Initial '+(i+1));b.value=saved[i]||'';row.appendChild(b);return b});
    const btn=document.createElement('button');btn.type='button';btn.textContent='Save';row.appendChild(btn);
    const val=()=>boxes.map(b=>b.value).join('');
    const paint=()=>{const v=val();btn.disabled=!v||v===saved;tag.textContent=saved?(v===saved?'Saved':''):''};
    boxes.forEach((b,i)=>{
      b.addEventListener('input',()=>{const c=clean(b.value);b.value=c.slice(-1);if(c&&i<2)boxes[i+1].focus();note.className='';note.textContent='Shown next to your score on the leaderboard.';paint()});
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
      if(!ok(v)){note.className='err';note.textContent='Try different initials.';return}
      btn.disabled=true;btn.textContent='Saving…';
      try{set(v);await save(v);saved=v;note.className='';note.textContent='Saved. Your initials now show on the leaderboard.'}
      catch(e){note.className='err';note.textContent="Couldn't save right now. Try again in a moment."}
      btn.textContent='Save';paint();
    });
    paint();
    return wrap;
  }
  window.DCIni={get,set,clean,block};
})();

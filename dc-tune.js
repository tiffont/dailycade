/* Dailycade live tuning: shared by the games and the admin page.
   A game's settings live in <game>_config/tune as
   { live: {...values} | null, next: { values:{...}, from:'YYYY-MM-DD' } | null, updatedAt }.
   "next" is a scheduled change: it takes over from its date. */
(function(){
  const pad=n=>String(n).padStart(2,'0');
  const today=()=>{const d=new Date();return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())};
  function pick(doc){
    if(!doc) return null;
    if(doc.next&&doc.next.values&&doc.next.from&&doc.next.from<=today()) return doc.next.values;
    return doc.live||null;
  }
  // Test mode: the admin page puts the draft in window.name and opens <game>.html#preview
  function preview(game){
    if(location.hash!=='#preview') return null;
    try{
      const n=String(window.name||'');
      if(n.indexOf('dcpreview:')===0){const p=JSON.parse(n.slice(10));if(p&&p.game===game)return p.values||{}}
    }catch(e){}
    return {};
  }
  // a game the admin has taken down shows a short notice instead (test mode still plays)
  function guard(game,db,name){
    if(!db||location.hash==='#preview')return;
    let el=null;
    try{db.doc('site_config/home').onSnapshot(sn=>{const off=sn.exists&&Array.isArray(sn.data().hidden)&&sn.data().hidden.includes(game);
      if(off&&!el){el=document.createElement('div');el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');
        el.style.cssText='position:fixed;inset:0;z-index:2147483000;display:grid;place-items:center;background:#0b0b0b;color:#fff;font-family:"Plus Jakarta Sans",Inter,system-ui,sans-serif;padding:24px;text-align:center';
        el.innerHTML='<div><p style="font-size:1.6rem;font-weight:700;margin:0 0 8px"></p><p style="opacity:.7;margin:0 0 22px">It’s taking a break. Check back soon.</p><a href="index.html" style="display:inline-block;background:#fff;color:#0b0b0b;font-weight:700;text-decoration:none;padding:12px 20px;border-radius:12px">Back to Dailycade</a></div>';
        el.querySelector('p').textContent=name||game;document.body.appendChild(el)}
      else if(!off&&el){el.remove();el=null}},()=>{})}catch(e){}
  }
  window.DCTune={today,pick,preview,guard};
})();

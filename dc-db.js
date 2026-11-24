/* Dailycade on its own site: stands in for the claude.ai artifact database and player identity, backed by Supabase.
   It offers the same calls the games already use (claude.use('db') / claude.use('user')), so the game code stays the same.
   Everything lives in one table, public.docs (col, id, data). Leaderboards and settings are readable by anyone;
   a player can only write their own score row; settings and resets need the admin login (see admin.html). */
(function(){
  /* staging.dailycadegames.com (and Vercel preview links) keep their own data: every collection gets a 'stg_' prefix,
     so testing there never touches the live leaderboards, feedback or settings */
  const H=location.hostname, STG=/^staging\./.test(H)||(/\.vercel\.app$/.test(H)&&H!=='dailycade.vercel.app');
  const P=STG?'stg_':'';
  window.DC_STAGING=STG;
  if(STG){const tag=()=>{if(document.getElementById('dcStg'))return;const t=document.createElement('div');t.id='dcStg';t.textContent='Staging';t.setAttribute('aria-hidden','true');
    t.style.cssText='position:fixed;right:8px;bottom:8px;z-index:2147483647;padding:4px 9px;border-radius:999px;background:#ff8a1f;color:#1a0d02;font:800 11px/1.2 system-ui,sans-serif;letter-spacing:.08em;text-transform:uppercase;pointer-events:none;box-shadow:0 2px 8px rgba(0,0,0,.4)';
    document.body.appendChild(t)};document.body?tag():document.addEventListener('DOMContentLoaded',tag);
    try{const m=document.createElement('meta');m.name='robots';m.content='noindex,nofollow';document.head.appendChild(m)}catch(e){}}
  const SB_URL='https://qtcxlnchxztinnzbuwmd.supabase.co';
  const SB_KEY='sb_publishable_Mh7eThLTfeBTyY_8lRWv3w_OLI7KriP'; // publishable key: safe in the page, the database rules do the guarding
  let sb=null;
  // lock: run auth steps straight away instead of queueing on a browser-wide lock; with several Dailycade tabs open
  // (e.g. a game, the homepage and admin) that lock can stall forever and admin never finishes checking your sign-in
  const noLock=async(name,timeout,fn)=>await fn();
  try{sb=window.supabase.createClient(SB_URL,SB_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,lock:noLock}})}catch(e){console.warn('Dailycade: database unavailable',e)}
  window.DCSB=sb;

  // every visitor gets a quiet anonymous sign-in the first time they need one (to post a score); it's remembered on this device
  let authP=null;
  function ensureAuth(){
    if(authP)return authP;
    authP=(async()=>{
      const {data:{session}}=await sb.auth.getSession();
      if(session&&session.user)return session.user;
      const {data,error}=await sb.auth.signInAnonymously();
      if(error)throw error;
      return data.user;
    })();
    authP.catch(()=>{authP=null});
    return authP;
  }
  sb&&sb.auth.onAuthStateChange(()=>{authP=null}); // a sign-in or sign-out (admin) changes who we are

  const clone=v=>v==null?v:JSON.parse(JSON.stringify(v));
  const snap=(id,row)=>({id,exists:!!row,data:()=>row?clone(row.data):undefined});
  const split=path=>{const i=path.lastIndexOf('/');return [P+path.slice(0,i),path.slice(i+1)]};
  const T=()=>sb.from('docs');
  const fail=r=>{if(r.error)throw r.error;return r};

  /* ---- live updates: one realtime channel per collection, plus a slow poll in case realtime drops ---- */
  const watchers={}; // col -> {fns:Set, ch, t}
  function fire(col,now){const w=watchers[col];if(!w)return;clearTimeout(w.t);w.t=setTimeout(()=>{w.last=Date.now();w.fns.forEach(f=>{try{f()}catch(e){}})},now?0:1500+Math.random()*1000)}
  function watch(col,fn){
    let w=watchers[col];
    if(!w){
      w=watchers[col]={fns:new Set(),ch:null,t:0};
      try{w.ch=sb.channel('dc-'+col).on('postgres_changes',{event:'*',schema:'public',table:'docs',filter:'col=eq.'+col},()=>fire(col)).subscribe(st=>{w.live=st==='SUBSCRIBED'})}catch(e){}
    }
    w.fns.add(fn); fn();
    return ()=>{w.fns.delete(fn)};
  }
  // refresh by polling only when realtime is down (every 30s), otherwise a slow safety refresh every 5 min
  setInterval(()=>{if(document.visibilityState!=='visible')return;const now=Date.now();
    for(const c of Object.keys(watchers)){const w=watchers[c];if(!w.live||now-(w.last||0)>300000)fire(c,true)}},30000);
  // coming back to the tab: refresh if it's been more than a minute
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){const now=Date.now();Object.keys(watchers).forEach(c=>{if(now-(watchers[c].last||0)>60000)fire(c,true)})}});

  /* ---- documents ---- */
  function doc(path){
    const [col,id]=split(path);
    const ref={
      id,
      async get(){const r=fail(await T().select('id,data').eq('col',col).eq('id',id).maybeSingle());return snap(id,r.data)},
      async set(data){await ensureAuth();fail(await T().upsert({col,id,data:clone(data)||{}},{onConflict:'col,id'}));fire(col,true)},
      async update(part){const s=await ref.get();await ref.set(Object.assign({},s.exists?s.data():{},part))},
      async delete(){await ensureAuth();fail(await T().delete().eq('col',col).eq('id',id));fire(col,true)},
      onSnapshot(cb,err){return watch(col,()=>ref.get().then(cb,e=>err&&err(e)))}
    };
    return ref;
  }

  /* ---- collections and simple queries: where(field,'==',v), orderBy(field,'desc'), limit(n) ---- */
  function query(col,q){
    q=q||{w:[],o:null,l:0};
    const run=async()=>{
      const sel=q.f?'id,'+q.f.map(f=>f+':data->'+f).join(','):'id,data';
      let b=T().select(sel).eq('col',col);
      for(const [f,op,v] of q.w){if(op!=='==')throw new Error('Only == filters are supported');b=b.eq('data->>'+f,String(v))}
      if(q.o)b=b.order('data->'+q.o[0],{ascending:q.o[1]!=='desc',nullsFirst:false});
      b=b.limit(q.l||1000);
      const r=fail(await b);
      const docs=(r.data||[]).map(row=>snap(row.id,q.f?{data:Object.fromEntries(q.f.filter(f=>row[f]!==undefined&&row[f]!==null).map(f=>[f,row[f]]))}:row));
      return {docs,size:docs.length,empty:!docs.length,forEach:f=>docs.forEach(f)};
    };
    return {
      where:(f,op,v)=>query(col,{...q,w:[...q.w,[f,op,v]]}),
      orderBy:(f,dir)=>query(col,{...q,o:[f,dir||'asc']}),
      limit:n=>query(col,{...q,l:n}),
      fields:(...f)=>query(col,{...q,f:f.flat().filter(x=>/^[A-Za-z_][A-Za-z0-9_]*$/.test(x))}), // only download these fields
      doc:id=>doc(col.slice(P.length)+'/'+id),
      get:run,
      onSnapshot(cb,err){return watch(col,()=>run().then(cb,e=>err&&err(e)))}
    };
  }

  const db={doc,collection:col=>query(P+col)};
  const user={
    async id(){return (await ensureAuth()).id},
    async profiles(){return {}} // players are anonymous for now: the leaderboard shows their initials
  };
  /* ---- play stats: DCTrack('gambit','start_daily') adds one to today's count (see admin > Stats) ---- */
  window.DCTrack=(game,name)=>{if(STG)return;try{ // staging plays don't count in admin > Activity
    ensureAuth().catch(()=>null).then(()=>sb.rpc('track',{p_game:game,p_name:name})).then(()=>{},()=>{})}catch(e){}};
  window.claude={use:async n=>{
    if(!sb)throw new Error('Database unavailable');
    if(n==='db')return db;
    if(n==='user')return user;
    throw new Error('Not available: '+n);
  }};
})();

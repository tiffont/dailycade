/* "More" pill for long pages on phones: when an open dialog's content runs below the screen,
   a glass pill floats at the bottom; tapping it scrolls down a screenful. It hides at the end.
   Works on every <dialog> in the page; a dialog can opt out with data-nomore. */
(function () {
  if (window.DCMore) return;
  const css = `
.dcmore{position:fixed;left:50%;bottom:calc(env(safe-area-inset-bottom,0px) + 18px);z-index:50;transform:translate(-50%,0);
  display:inline-flex;align-items:center;gap:8px;height:44px;padding:0 18px 0 22px;border:0;border-radius:999px;cursor:pointer;
  font:700 15px/1 "Inter",system-ui,-apple-system,sans-serif;color:#fff;letter-spacing:.01em;
  background:rgba(44,44,44,.55);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);
  box-shadow:inset 0 0 0 1px rgba(255,255,255,.14),0 12px 30px rgba(0,0,0,.55);
  transition:opacity .25s,transform .25s;-webkit-tap-highlight-color:transparent}
.dcmore svg{width:16px;height:16px}
.dcmore.off{opacity:0;transform:translate(-50%,12px);pointer-events:none}
.dcmore:active{transform:translate(-50%,2px)}
@media (min-width:601px){.dcmore{display:none}}
@media (prefers-reduced-motion:reduce){.dcmore{transition:none}}`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  // the element that actually scrolls inside a dialog: the dialog itself or its biggest scrolling child
  function scroller(d) {
    const cands = [d, ...d.querySelectorAll('*')];
    let best = null, bestH = 0;
    for (const el of cands) {
      if (el.scrollHeight - el.clientHeight < 40) continue;
      const oy = getComputedStyle(el).overflowY;
      if (oy !== 'auto' && oy !== 'scroll') continue;
      if (el.clientHeight > bestH) { best = el; bestH = el.clientHeight; }
    }
    return best;
  }

  const live = new Map(); // dialog -> {pill, sc, onScroll}
  function attach(d) {
    if (live.has(d) || d.hasAttribute('data-nomore')) return;
    const pill = document.createElement('button');
    pill.type = 'button'; pill.className = 'dcmore off'; pill.setAttribute('aria-label', 'Scroll for more');
    pill.innerHTML = 'More <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';
    d.appendChild(pill); // inside the dialog so it sits in the dialog's top layer
    const rec = { pill, sc: null };
    const update = () => {
      if (!rec.sc || !rec.sc.isConnected) rec.sc = scroller(d);
      const sc = rec.sc;
      const more = !!sc && sc.scrollHeight - sc.clientHeight - sc.scrollTop > 48;
      pill.classList.toggle('off', !more);
    };
    rec.onScroll = () => requestAnimationFrame(update);
    pill.addEventListener('click', () => {
      const sc = rec.sc || scroller(d); if (!sc) return;
      sc.scrollBy({ top: Math.round(sc.clientHeight * 0.7), behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    });
    d.addEventListener('scroll', rec.onScroll, true); // capture: catches the inner scroller too
    rec.ro = new ResizeObserver(() => { rec.sc = null; update(); });
    rec.ro.observe(d);
    rec.mo = new MutationObserver(() => { rec.sc = null; update(); });
    rec.mo.observe(d, { childList: true, subtree: true });
    live.set(d, rec);
    setTimeout(update, 60); setTimeout(update, 400); // after the open animation and content fill
  }
  function detach(d) {
    const rec = live.get(d); if (!rec) return;
    d.removeEventListener('scroll', rec.onScroll, true); rec.ro.disconnect(); rec.mo.disconnect(); rec.pill.remove();
    live.delete(d);
  }
  function sync() { document.querySelectorAll('dialog').forEach(d => d.open ? attach(d) : detach(d)); }
  new MutationObserver(sync).observe(document.documentElement, { subtree: true, attributes: true, attributeFilter: ['open'] });
  sync();
  window.DCMore = { sync };
})();

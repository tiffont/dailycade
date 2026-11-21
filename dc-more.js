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
.dcmore[popover]{inset:auto;left:50%;bottom:calc(env(safe-area-inset-bottom,0px) + 18px);margin:0;overflow:visible}
.dcmore svg{width:16px;height:16px}
.dcmore.under{display:none}
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
  let seq = 0;
  function attach(d) {
    if (live.has(d) || d.hasAttribute('data-nomore')) return;
    const pill = document.createElement('button');
    pill.type = 'button'; pill.className = 'dcmore off'; pill.setAttribute('aria-label', 'Scroll for more');
    pill.innerHTML = 'More <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';
    // The pill lives in its own top layer (a popover) so it never sits inside the page that scrolls:
    // inside a scrolling dialog, iPhones treat it as part of the content and add empty space below.
    const pop = typeof pill.showPopover === 'function';
    // It stays a child of the dialog so the dialog doesn't make it untappable.
    d.appendChild(pill);
    if (pop) { pill.setAttribute('popover', 'manual'); try { pill.showPopover(); } catch (e) {} }
    const rec = { pill, sc: null, seq: ++seq };
    const update = () => {
      if (!rec.sc || !rec.sc.isConnected) rec.sc = scroller(d);
      const sc = rec.sc;
      const more = !!sc && sc.scrollHeight - sc.clientHeight - sc.scrollTop > 48;
      pill.classList.toggle('off', !more);
      // if the page was raised again after the pill appeared, lift the pill back above it
      if (more && pill.hasAttribute('popover') && !pill.classList.contains('under')) {
        const r = pill.getBoundingClientRect(), hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        if (hit && hit !== pill && !pill.contains(hit)) { try { pill.hidePopover(); pill.showPopover(); } catch (e) {} }
      }
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
    setTimeout(update, 60); rec.tick = setInterval(update, 600); // also catches content that loads in and the page being re-raised // after the open animation and content fill
  }
  function detach(d) {
    const rec = live.get(d); if (!rec) return;
    clearInterval(rec.tick); d.removeEventListener('scroll', rec.onScroll, true); rec.ro.disconnect(); rec.mo.disconnect(); try { if (rec.pill.hasAttribute('popover')) rec.pill.hidePopover(); } catch (e) {} rec.pill.remove();
    live.delete(d);
  }
  function sync() {
    document.querySelectorAll('dialog').forEach(d => d.open ? attach(d) : detach(d));
    // only the most recently opened page shows its pill; re-raise it so it stays above that page
    let top = null; for (const r of live.values()) if (!top || r.seq > top.seq) top = r;
    for (const r of live.values()) {
      r.pill.classList.toggle('under', r !== top);
      if (r === top && r.pill.hasAttribute('popover') && r.raisedFor !== live.size) { try { r.pill.hidePopover(); r.pill.showPopover(); } catch (e) {} r.raisedFor = live.size; }
    }
  }
  new MutationObserver(sync).observe(document.documentElement, { subtree: true, attributes: true, attributeFilter: ['open'] });
  sync();
  window.DCMore = { sync };
})();

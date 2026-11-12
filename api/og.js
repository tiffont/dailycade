// Share card image (1200x630) for link previews in Messages, X, Slack, etc.
// /api/og?game=gambit&s=1240&n=3&i=TLT  ->  "TLT says you can't beat 1,240"
// /api/og?game=gambit                    ->  the game's plain card
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';


const GAMES = {
  gambit:   { name: 'Gambit',   tag: 'Swipe, curve, stack power-ups. Survive the fall.', blob: '#9deba8', accent: '#9deba8' },
  dropface: { name: 'Dropface', tag: 'Ten boards, one ball. Call where it lands.',       blob: '#c49bff', accent: '#c49bff' },
};

// Dailycade mark in the brand gradient
const MARK = 'data:image/svg+xml;utf8,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 378 512"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
  '<stop offset="0" stop-color="#ff8ad8"/><stop offset=".35" stop-color="#c49bff"/><stop offset=".65" stop-color="#7cc8ff"/><stop offset="1" stop-color="#9deba8"/></linearGradient></defs>' +
  '<g fill="url(#g)"><path d="M28.9513 444.116L206.041 443.187C233.016 444.184 255.915 427.05 265.185 405.529C269.068 396.513 269.986 388.12 267.811 381.315C267.568 376.882 266.58 372.414 264.753 368.089L234.888 297.424L288.517 297.56C362.049 299.469 395.111 350.895 369.318 409.377C344.85 467.586 269.076 515.321 196.228 511.819L0 511.34L28.9513 444.116Z"/>' +
  '<path d="M170.257 365.076L62.7374 365.681L92.2889 297.081L141.572 297.215L170.257 365.076Z"/>' +
  '<path d="M87.9288 5.90533C25.4065 26.2791 -8.77787 93.3661 11.5379 155.825C31.8524 218.283 98.9894 252.512 161.569 232.315C224.274 212.078 258.637 144.876 238.281 82.2924C217.926 19.7073 150.576 -14.5091 87.9288 5.90533Z"/></g></svg>'
);

// tiny element helper (no JSX build step on this site)
const h = (type, style, ...children) => ({ type, props: { style: { display: 'flex', ...style }, children: children.flat().filter(c => c !== null && c !== undefined && c !== false) } });
const img = (src, style) => ({ type: 'img', props: { src, style } });

export async function GET(req) {
  const url = new URL(req.url);
  const key = GAMES[url.searchParams.get('game')] ? url.searchParams.get('game') : 'gambit';
  const g = GAMES[key];
  const s = Math.max(0, Math.min(99999999, parseInt(url.searchParams.get('s') || '', 10) || 0));
  const n = Math.max(0, Math.min(99999, parseInt(url.searchParams.get('n') || '', 10) || 0));
  const ini = (url.searchParams.get('i') || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 3);
  const hasScore = url.searchParams.has('s');

  const [f800, f500] = await Promise.all([
    fetch(new URL('/og/inter-display-800.otf', url)).then(r => r.arrayBuffer()),
    fetch(new URL('/og/inter-500.otf', url)).then(r => r.arrayBuffer()),
  ]);
  const handBuf = Buffer.from(await (await fetch(new URL(`/og/handheld-${key}.png`, url))).arrayBuffer());
  const handSrc = 'data:image/png;base64,' + handBuf.toString('base64');

  const score = s.toLocaleString('en-US');
  const line1 = hasScore ? (ini ? `${ini} says you can't beat` : 'Can you beat') : null;
  const sub = hasScore ? `${g.name}${n ? ` · Daily challenge No. ${n}` : ''}` : g.tag;
  const prompt = hasScore ? g.tag : 'A free daily game. Same challenge for everyone.';

  const tree = h('div', { width: '100%', height: '100%', background: '#0b0b0b', color: '#fff', fontFamily: 'Inter', position: 'relative', overflow: 'hidden' },
    // soft colored shape behind the handheld, like the homepage
    h('div', { position: 'absolute', right: -90, top: 70, width: 560, height: 560, borderRadius: 9999, background: g.blob, opacity: 0.9 }),
    // left: brand, message, tagline
    h('div', { position: 'absolute', left: 72, top: 60, bottom: 56, width: 620, flexDirection: 'column', justifyContent: 'space-between' },
      h('div', { alignItems: 'center', gap: 16 },
        img(MARK, { width: 34, height: 46 }),
        h('div', { fontSize: 34, fontWeight: 800, letterSpacing: -1 }, 'Dailycade')),
      h('div', { flexDirection: 'column', gap: 18 },
        hasScore
          ? h('div', { flexDirection: 'column' },
              h('div', { fontSize: 52, fontWeight: 800, lineHeight: 1.1, letterSpacing: -1.5 }, line1),
              h('div', { fontSize: 120, fontWeight: 800, lineHeight: 1.05, letterSpacing: -4, color: g.accent }, score + (ini ? '' : '?')))
          : h('div', { fontSize: 120, fontWeight: 800, lineHeight: 1, letterSpacing: -4 }, g.name),
        h('div', { fontSize: 30, fontWeight: 500, color: '#b8bcc2', lineHeight: 1.3 }, sub)),
      h('div', { alignItems: 'center', gap: 14, fontSize: 24, fontWeight: 500, color: '#8f8f8c' },
        h('div', { width: 10, height: 10, borderRadius: 9999, background: g.accent }),
        prompt)),
    // right: the game's handheld
    img(handSrc, { position: 'absolute', right: 70, top: 40, width: 360, height: Math.round(360 * (key === 'gambit' ? 579 : 574) / 380) })
  );

  const svg = await satori(tree, {
    width: 1200, height: 630,
    fonts: [
      { name: 'Inter', data: f800, weight: 800, style: 'normal' },
      { name: 'Inter', data: f500, weight: 500, style: 'normal' },
    ],
  });
  const png = new Resvg(svg).render().asPng();
  return new Response(png, { headers: { 'content-type': 'image/png', 'cache-control': 'public, max-age=31536000, immutable' } });
}

// Challenge links: /c/gambit?s=1240&n=3&i=TLT
// Link previews (Messages, X, Slack…) read the tags below and show the share card from /api/og;
// people who tap the link are sent straight on to the game.
export const config = { runtime: 'edge' };

const GAMES = {
  gambit:   { name: 'Gambit',   page: '/gambit.html',   tag: 'Swipe, curve, stack power-ups. Survive the fall.' },
  dropface: { name: 'Dropface', page: '/dropface.html', tag: 'Ten boards, one ball. Call where it lands.' },
};
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export default function handler(req) {
  const url = new URL(req.url);
  const key = GAMES[url.searchParams.get('game')] ? url.searchParams.get('game') : 'gambit';
  const g = GAMES[key];
  const hasScore = url.searchParams.has('s');
  const s = Math.max(0, Math.min(99999999, parseInt(url.searchParams.get('s') || '', 10) || 0));
  const n = Math.max(0, Math.min(99999, parseInt(url.searchParams.get('n') || '', 10) || 0));
  const ini = (url.searchParams.get('i') || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 3);

  const score = s.toLocaleString('en-US');
  const title = hasScore ? (ini ? `${ini} says you can't beat ${score}` : `Can you beat ${score}?`) : `${g.name} on Dailycade`;
  const desc = hasScore ? `${g.name}${n ? ` · Daily challenge No. ${n}` : ''} on Dailycade. ${g.tag}` : g.tag;
  const q = new URLSearchParams({ game: key });
  if (hasScore) q.set('s', String(s));
  if (n) q.set('n', String(n));
  if (ini) q.set('i', ini);
  const image = `${url.origin}/api/og?${q}`;
  const dest = `${url.origin}${g.page}`;

  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Dailycade">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${esc(url.href)}">
<meta property="og:image" content="${esc(image)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(title)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${esc(image)}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0b0b0b;color:#fff;font:16px system-ui,sans-serif}a{color:#9deba8}</style>
<script>location.replace(${JSON.stringify(dest)});</script>
</head><body><p><a href="${esc(dest)}">Play ${esc(g.name)} on Dailycade</a></p></body></html>`;

  return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=300' } });
}

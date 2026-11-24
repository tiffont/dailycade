// Share card image (1200x630) for link previews in Messages, X, Slack, etc.
// /api/og?game=gambit&s=1240&n=3&i=TLT  ->  "TLT says you can't beat 1,240"
// /api/og?game=gambit                    ->  the game's plain card
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';


const GAMES = {
  gambit:   { name: 'Gambit',   tag: 'Swipe, curve, stack power-ups. Survive the fall.', blob: '#9deba8', accent: '#9deba8', icon: [34, 44] },
  dropface: { name: 'Dropface', tag: 'Ten boards, one ball. Call where it lands.',       blob: '#c49bff', accent: '#c49bff', icon: [24, 24] },
  slice:    { name: 'Slice',    tag: 'Things fly at you. Cut them perfectly in half.',  blob: '#ff8ad8', accent: '#ff8ad8', icon: [324, 457] },
  trace:    { name: 'Trace',    tag: 'Ten shapes made of cubes. Stay on the line, grow your pile.', blob: '#f2c14e', accent: '#9deba8', icon: [672, 672] },
};
// each game's logo mark, as drawn next to its name in the game
const ICONS = {"trace": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 672 672\"><g fill=\"#9deba8\"><rect x=\"0\" y=\"448\" width=\"224\" height=\"224\" rx=\"24\"/><rect x=\"224\" y=\"224\" width=\"224\" height=\"224\" rx=\"24\"/><rect x=\"448\" y=\"0\" width=\"224\" height=\"224\" rx=\"24\"/></g></svg>", "gambit": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 34 44\"><g transform=\"rotate(30 17 22)\"><rect x=\"6\" y=\"5\" width=\"22\" height=\"34\" rx=\"4.5\" fill=\"#9deba8\"/><path d=\"M17 13l6 9-6 9-6-9z\" fill=\"#000\"/></g></svg>", "slice": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 324 457\"><path fill=\"#9deba8\" d=\"M270 159 269 159 257 171 256 171 229 197 228 197 202 222 201 222 175 247 174 247 134 285 133 285 107 310 106 310 80 335 79 335 67 347 66 347 53 360 52 360 39 373 38 373 26 385 25 385 12 398 11 398 9 400 10 401 10 404 12 408 12 411 13 412 14 419 16 423 16 426 17 427 17 430 18 431 19 437 24 446 28 450 37 455 40 455 41 456 51 456 52 455 59 454 63 452 66 452 67 451 74 450 78 448 85 447 89 445 92 445 93 444 100 443 104 441 111 440 115 438 118 438 119 437 126 436 130 434 133 434 134 433 141 432 145 430 152 429 156 427 159 427 160 426 167 425 171 423 174 423 175 422 182 421 186 419 193 418 197 416 200 416 201 415 208 414 212 412 215 412 216 411 223 410 224 409 230 408 231 407 234 407 238 405 241 405 242 404 249 403 250 402 256 401 257 400 260 400 264 398 267 398 268 397 275 396 279 394 282 394 283 393 290 392 294 390 301 389 302 388 304 388 310 385 317 379 322 370 322 367 323 366 323 356 322 355 321 348 319 344 319 341 318 340 317 333 315 329 315 326 314 325 313 318 312 317 311 311 310 310 310 307 308 303 308 300 307 299 306 292 304 288 304 285 303 284 302 277 300 273 300 270 299 269 298 262 296 258 296 255 295 254 294 247 292 243 292 240 291 239 290 232 288 228 287 221 285 217 285 214 284 213 283 206 281 202 281 199 280 198 279 191 277 187 277 184 276 183 276 180 275 179 275 176 273 172 273 169 272 168 272 165 271 164 271 161ZM295 6 286 1 283 1 282 0 272 0 271 1 264 2 260 4 257 4 256 5 249 6 245 8 238 9 234 11 231 11 230 12 223 13 219 15 212 16 208 18 205 18 204 19 197 20 193 22 190 22 189 23 182 24 178 26 171 27 167 29 164 29 163 30 156 31 152 33 149 33 148 34 141 35 137 37 130 38 126 40 123 40 122 41 115 42 111 44 108 44 107 45 100 46 99 47 93 48 92 49 89 49 85 51 82 51 81 52 74 53 73 54 67 55 66 56 63 56 59 58 56 58 55 59 48 60 44 62 41 62 40 63 33 64 29 66 22 67 21 68 19 68 13 71 6 77 1 86 1 89 0 90 0 100 1 101 2 108 4 112 4 115 5 116 6 123 8 127 8 130 9 131 10 138 11 139 12 145 13 146 13 149 15 153 15 156 16 157 17 164 19 168 19 171 20 172 21 179 23 183 23 186 24 187 25 194 27 198 27 201 28 202 29 209 31 213 31 216 32 217 33 224 35 228 36 235 38 239 38 242 39 243 40 250 42 254 42 257 43 258 44 265 46 269 46 272 47 273 47 276 48 277 48 280 50 284 50 287 51 288 51 291 52 292 52 295 53 297 56 294 57 294 69 282 70 282 83 269 84 269 96 257 97 257 137 219 138 219 164 194 165 194 191 169 192 169 232 131 233 131 259 106 260 106 287 80 288 80 300 68 301 68 313 56 313 52 311 48 311 45 310 44 309 37 307 33 307 30 306 29 306 26 305 25 304 19 299 10Z\"/></svg>", "dropface": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\"><circle cx=\"12\" cy=\"12\" r=\"11.2\" fill=\"#9deba8\" fill-opacity=\".15\" stroke=\"#9deba8\" stroke-opacity=\".5\" stroke-width=\"1.6\"/><circle cx=\"12\" cy=\"12\" r=\"5.6\" fill=\"#9deba8\"/></svg>"};
const svgSrc = s => 'data:image/svg+xml;base64,' + Buffer.from(s).toString('base64');

// Dailycade mark in the brand gradient
const MARK = 'data:image/svg+xml;utf8,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 378 512"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
  '<stop offset="0" stop-color="#ff8ad8"/><stop offset=".35" stop-color="#c49bff"/><stop offset=".65" stop-color="#7cc8ff"/><stop offset="1" stop-color="#9deba8"/></linearGradient></defs>' +
  '<g fill="url(#g)"><path d="M28.9513 444.116L206.041 443.187C233.016 444.184 255.915 427.05 265.185 405.529C269.068 396.513 269.986 388.12 267.811 381.315C267.568 376.882 266.58 372.414 264.753 368.089L234.888 297.424L288.517 297.56C362.049 299.469 395.111 350.895 369.318 409.377C344.85 467.586 269.076 515.321 196.228 511.819L0 511.34L28.9513 444.116Z"/>' +
  '<path d="M170.257 365.076L62.7374 365.681L92.2889 297.081L141.572 297.215L170.257 365.076Z"/>' +
  '<path d="M87.9288 5.90533C25.4065 26.2791 -8.77787 93.3661 11.5379 155.825C31.8524 218.283 98.9894 252.512 161.569 232.315C224.274 212.078 258.637 144.876 238.281 82.2924C217.926 19.7073 150.576 -14.5091 87.9288 5.90533Z"/></g></svg>'
);

const MARK_WHITE = MARK.replace(encodeURIComponent('url(#g)'), encodeURIComponent('#ffffff'));

// tiny element helper (no JSX build step on this site)
const h = (type, style, ...children) => ({ type, props: { style: { display: 'flex', ...style }, children: children.flat().filter(c => c !== null && c !== undefined && c !== false) } });
const img = (src, style) => ({ type: 'img', props: { src, style } });

export async function GET(req) {
  const url = new URL(req.url);
  if (url.searchParams.get('game') === 'site') return siteCard(url);
  const key = GAMES[url.searchParams.get('game')] ? url.searchParams.get('game') : 'gambit';
  const g = GAMES[key];
  const s = Math.max(0, Math.min(99999999, parseInt(url.searchParams.get('s') || '', 10) || 0));
  const n = Math.max(0, Math.min(99999, parseInt(url.searchParams.get('n') || '', 10) || 0));
  const ini = (url.searchParams.get('i') || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 3);
  const hasScore = url.searchParams.has('s');

  const file = p => fetch(new URL(p, url)).then(r => r.arrayBuffer());
  const [j300, j500, j600, j700, j800, wide, hand] = await Promise.all([
    file('/og/jakarta-300.ttf'), file('/og/jakarta-500.ttf'), file('/og/jakarta-600.ttf'), file('/og/jakarta-700.ttf'), file('/og/jakarta-800.ttf'),
    file('/og/archivo-wide-900.ttf'), file(`/og/handheld-${key}.png`),
  ]);
  const handSrc = 'data:image/png;base64,' + Buffer.from(hand).toString('base64');
  const handH = Math.round(420 * (key === 'gambit' ? 579 : 574) / 380);

  // the game's logo: its name in the wide display face with its mark beside it
  const logo = size => {
    const [iw, ih] = g.icon, h2 = Math.round(size * 0.86), w2 = Math.round(h2 * iw / ih);
    return h('div', { alignItems: 'center', gap: Math.round(size * 0.14) },
      h('div', { fontFamily: 'Archivo', fontWeight: 900, fontSize: size, lineHeight: 1, letterSpacing: size * 0.01, color: '#fff' }, g.name.toUpperCase()),
      img(svgSrc(ICONS[key]), { width: w2, height: h2 }));
  };
  // the biggest logo that still fits the left column
  const fit = (max, width) => Math.min(max, Math.floor(width / (g.name.length * 0.9 + 0.95)));

  const brand = h('div', { alignItems: 'center', gap: 14 },
    img(MARK_WHITE, { width: 30, height: 41 }),
    h('div', { fontSize: 40, fontWeight: 700, letterSpacing: -0.5 }, 'Dailycade'));

  const score = s.toLocaleString('en-US');
  const left = hasScore
    ? h('div', { position: 'absolute', left: 72, top: 64, width: 600, flexDirection: 'column' },
        brand,
        h('div', { marginTop: 56 }, logo(fit(84, 540))),
        h('div', { marginTop: 40, fontSize: 44, fontWeight: 600, letterSpacing: -0.8, lineHeight: 1.1 }, ini ? `${ini} says you can't beat` : 'Can you beat'),
        h('div', { fontSize: 128, fontWeight: 800, letterSpacing: -4, lineHeight: 1.05, color: g.accent }, score + (ini ? '' : '?')),
        h('div', { marginTop: 10, width: 600, fontSize: 28, fontWeight: 300, color: '#b8bcc2', lineHeight: 1.3 }, n ? `Daily challenge No. ${n}` : g.tag))
    : h('div', { position: 'absolute', left: 72, top: 64, width: 600, flexDirection: 'column' },
        brand,
        h('div', { marginTop: 160 }, logo(fit(112, 580))),
        h('div', { marginTop: 34, width: 540, fontSize: 32, fontWeight: 500, color: '#b8bcc2', lineHeight: 1.35 }, g.tag));

  const tree = h('div', { width: '100%', height: '100%', background: '#0b0b0b', color: '#fff', fontFamily: 'Jakarta', position: 'relative', overflow: 'hidden' },
    // the game's color shape, cropped off the right edge like the homepage card
    h('div', { position: 'absolute', left: 650, top: 70, width: 720, height: 720, borderRadius: 9999, background: g.blob }),
    img(handSrc, { position: 'absolute', left: 790, top: 50, width: 420, height: handH }),
    left);

  const svg = await satori(tree, {
    width: 1200, height: 630,
    fonts: [
      { name: 'Jakarta', data: j300, weight: 300, style: 'normal' },
      { name: 'Jakarta', data: j500, weight: 500, style: 'normal' },
      { name: 'Jakarta', data: j600, weight: 600, style: 'normal' },
      { name: 'Jakarta', data: j700, weight: 700, style: 'normal' },
      { name: 'Jakarta', data: j800, weight: 800, style: 'normal' },
      { name: 'Archivo', data: wide, weight: 900, style: 'normal' },
    ],
  });
  const png = new Resvg(svg).render().asPng();
  return new Response(png, { headers: { 'content-type': 'image/png', 'cache-control': 'public, max-age=31536000, immutable' } });
}

// the Dailycade homepage card: a fixed piece of artwork
async function siteCard(url) {
  const png = await fetch(new URL('/og/site-card.png', url)).then(r => r.arrayBuffer());
  return new Response(png, { headers: { 'content-type': 'image/png', 'cache-control': 'public, max-age=31536000, immutable' } });
}

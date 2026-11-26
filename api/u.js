// Updates pages: /updates and /updates/<slug>
// Serves the homepage app (which shows the Updates list or the post) with link-preview tags for that post,
// so a shared post shows its own title, summary and picture in Messages, X, Slack…
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const SB_URL = 'https://qtcxlnchxztinnzbuwmd.supabase.co';
const SB_KEY = 'sb_publishable_Mh7eThLTfeBTyY_8lRWv3w_OLI7KriP'; // public (read-only) key, same as the site uses
const GAMES = ['gambit', 'dropface', 'slice', 'trace', 'spiral', 'frames', 'rings'];
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
let page = null;
const app = () => page || (page = readFileSync(join(process.cwd(), 'index.html'), 'utf8'));

async function getPost(slug, scope) {
  const q = new URLSearchParams({ select: 'title,body,image_url,tags,publish_at', scope: `eq.${scope}`, slug: `eq.${slug}`, status: 'eq.published', publish_at: `lte.${new Date().toISOString()}`, limit: '1' });
  try {
    const r = await fetch(`${SB_URL}/rest/v1/news?${q}`, { headers: { apikey: SB_KEY, authorization: `Bearer ${SB_KEY}` } });
    if (!r.ok) return null;
    const rows = await r.json();
    return rows[0] || null;
  } catch (e) { return null; }
}

const setMeta = (html, attr, key, val) => html.replace(new RegExp(`(<meta ${attr}="${key}" content=")[^"]*(")`), `$1${esc(val)}$2`);

export async function GET(req) {
  const url = new URL(req.url);
  const slug = (url.searchParams.get('slug') || '').toLowerCase();
  const scope = url.hostname.startsWith('staging.') ? 'staging' : 'live';
  const post = /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) ? await getPost(slug, scope) : null;
  const href = `${url.origin}/updates${post ? '/' + slug : ''}`;

  let title = 'Updates · Dailycade', desc = 'New games, updates and what’s changed on Dailycade.', image = `${url.origin}/api/og?game=site&v=4`;
  if (post) {
    title = `${post.title} · Dailycade`;
    desc = post.body || desc;
    const game = (post.tags || []).find(t => GAMES.includes(t));
    if (post.image_url) image = new URL(post.image_url, url.origin).href;
    else if (game) image = `${url.origin}/api/og?game=${game}&v=4`;
  }

  let html = app()
    .replace('<head>', '<head><base href="/">') // the page's files load from the site root, not /updates/
    .replace(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`)
    .replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${esc(href)}$2`);
  html = setMeta(html, 'name', 'description', desc);
  html = setMeta(html, 'property', 'og:url', href);
  html = setMeta(html, 'property', 'og:title', post ? post.title : 'Updates');
  html = setMeta(html, 'property', 'og:description', desc);
  html = setMeta(html, 'property', 'og:image', image);
  html = setMeta(html, 'name', 'twitter:image', image);
  if (post && post.image_url) html = html.replace('<meta name="twitter:card" content="summary_large_image">', '<meta name="twitter:card" content="summary">');

  return new Response(html, { status: slug && !post ? 404 : 200, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=60' } });
}

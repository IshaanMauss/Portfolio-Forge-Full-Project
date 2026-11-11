import { ID_RE, buildMeta, injectMeta, parseRoute, readStrings } from './meta.js';
import { verifyFirebaseToken } from './auth.js';
import { reserveQuota } from './limits.js';
import { validateInput, generate } from './ai.js';

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
};

const json = (obj, status = 200, extra = {}) =>
  new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json', ...extra } });

const corsFor = (request, env) => {
  const origin = request.headers.get('Origin') || '';
  const allowed = (env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
  return allowed.includes(origin)
    ? { 'Access-Control-Allow-Origin': origin, Vary: 'Origin', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Authorization, Content-Type', 'Access-Control-Max-Age': '86400' }
    : { Vary: 'Origin' };
};

async function handleApi(request, env, url) {
  const cors = corsFor(request, env);
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405, cors);
  if (!cors['Access-Control-Allow-Origin']) return json({ error: 'Origin not allowed.' }, 403, cors);

  const route = url.pathname.replace(/\/+$/, '').split('/').pop();
  const auth = request.headers.get('Authorization') || '';
  const uid = auth.startsWith('Bearer ') ? await verifyFirebaseToken(auth.slice(7), env.FIREBASE_PROJECT_ID) : null;
  if (!uid) return json({ error: 'Please sign in to use AI enhancement.' }, 401, cors);

  const len = Number(request.headers.get('Content-Length') || 0);
  if (len > 8192) return json({ error: 'Request too large.' }, 413, cors);
  const body = await request.json().catch(() => ({}));
  const v = validateInput(route, body);
  if (v.error) return json({ error: v.error }, v.status, cors);

  const q = await reserveQuota(env.LIMITS, uid, { perUser: Number(env.DAILY_LIMIT_PER_USER || 10), global: Number(env.DAILY_LIMIT_GLOBAL || 100) });
  if (!q.ok) return json({ error: q.error }, 429, cors);
  try {
    return json({ enhancedText: await generate(env, v.spec, v.text) }, 200, cors);
  } catch (e) {
    await q.refund().catch(() => {});
    return json({ error: 'The AI service is unavailable right now. Please try again.' }, 502, cors);
  }
}

// Reads only the 4 fields needed for a preview (field mask keeps Firestore egress tiny) and caches 10 minutes.
async function fetchPublished(env, ctx, route) {
  const base = `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/published/${route.uid}`;
  const cache = caches.default;
  const get = async (path, fields) => {
    const u = `${base}${path}?${fields.map((f) => `mask.fieldPaths=${f}`).join('&')}`;
    const key = new Request(u);
    let res = await cache.match(key);
    if (!res) {
      res = await fetch(u);
      if (res.ok || res.status === 404) {
        const copy = new Response(res.clone().body, { status: res.status, headers: { 'Cache-Control': 'public, max-age=600' } });
        ctx.waitUntil(cache.put(key, copy));
      }
    }
    return res.ok ? res.json() : null;
  };
  let vid = route.vid;
  if (!vid) vid = (await get('', ['activeVersion']))?.fields?.activeVersion?.stringValue || 'default';
  if (!ID_RE.test(vid)) return null;
  return get(`/versions/${vid}`, ['userName', 'userSubtitle', 'bio', 'profilePicUrl']);
}

async function handlePage(request, env, ctx, url) {
  const origin = await fetch(`${env.ORIGIN}${url.pathname}${url.search}`, { headers: { Accept: 'text/html' } });
  const type = origin.headers.get('Content-Type') || '';
  const route = parseRoute(url.pathname);
  let res = origin;
  if (route && origin.ok && type.includes('text/html')) {
    try {
      const doc = await fetchPublished(env, ctx, route);
      if (doc) {
        const d = readStrings(doc, ['userName', 'userSubtitle', 'bio', 'profilePicUrl']);
        const meta = buildMeta({ kind: route.kind, name: d.userName, subtitle: d.userSubtitle, bio: d.bio, pic: d.profilePicUrl, url: url.href, fallbackImage: `${env.ORIGIN}/logo512.png` });
        res = new Response(injectMeta(await origin.text(), meta), origin);
      }
    } catch (e) { /* preview is best-effort: serve the plain app */ }
  }
  const out = new Response(res.body, res);
  Object.entries(SECURITY_HEADERS).forEach(([k, v]) => out.headers.set(k, v));
  if (route) out.headers.set('Cache-Control', 'public, max-age=300, s-maxage=600');
  return out;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) return handleApi(request, env, url);
    if (request.method !== 'GET' && request.method !== 'HEAD') return new Response('Method not allowed', { status: 405 });
    return handlePage(request, env, ctx, url);
  },
};

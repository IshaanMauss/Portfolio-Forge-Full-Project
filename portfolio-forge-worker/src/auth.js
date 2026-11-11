// Verifies a Firebase Auth ID token (RS256 JWT) with Web Crypto. No dependencies.
const JWKS_URL = 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';

const b64urlToBytes = (s) => {
  const b = atob(s.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(s.length / 4) * 4, '='));
  return Uint8Array.from(b, (c) => c.charCodeAt(0));
};
const parseJson = (s) => JSON.parse(new TextDecoder().decode(b64urlToBytes(s)));

let jwksCache = { at: 0, keys: null };
export async function fetchJwks(fetchFn = fetch) {
  if (jwksCache.keys && Date.now() - jwksCache.at < 3600_000) return jwksCache.keys;
  const res = await fetchFn(JWKS_URL, { cf: { cacheTtl: 3600 } });
  if (!res.ok) throw new Error('jwks');
  jwksCache = { at: Date.now(), keys: (await res.json()).keys };
  return jwksCache.keys;
}

/** Returns the uid, or null if the token is invalid. `getKeys` is injectable for tests. */
export async function verifyFirebaseToken(token, projectId, getKeys = fetchJwks, now = Date.now()) {
  try {
    const [h, p, sig] = String(token).split('.');
    if (!h || !p || !sig) return null;
    const header = parseJson(h);
    const payload = parseJson(p);
    if (header.alg !== 'RS256' || !header.kid) return null;
    const t = Math.floor(now / 1000);
    if (payload.aud !== projectId || payload.iss !== `https://securetoken.google.com/${projectId}`) return null;
    if (!payload.sub || typeof payload.sub !== 'string' || payload.sub.length > 128) return null;
    if (!(payload.exp > t) || payload.iat > t + 60) return null;
    const jwk = (await getKeys()).find((k) => k.kid === header.kid);
    if (!jwk) return null;
    const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
    const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, b64urlToBytes(sig), new TextEncoder().encode(`${h}.${p}`));
    return ok ? payload.sub : null;
  } catch (e) {
    return null;
  }
}

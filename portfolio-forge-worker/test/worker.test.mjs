import test from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { buildMeta, injectMeta, parseRoute, escapeHtml, readStrings } from '../src/meta.js';
import { verifyFirebaseToken } from '../src/auth.js';
import { reserveQuota } from '../src/limits.js';
import { validateInput } from '../src/ai.js';

if (!globalThis.crypto) globalThis.crypto = webcrypto;
const b64u = (buf) => Buffer.from(buf).toString('base64url');

test('route parsing rejects path tricks', () => {
  assert.deepEqual(parseRoute('/p/abc123/default'), { kind: 'portfolio', uid: 'abc123', vid: 'default' });
  assert.deepEqual(parseRoute('/resume/abc'), { kind: 'resume', uid: 'abc', vid: '' });
  assert.equal(parseRoute('/p/../../etc'), null);
  assert.equal(parseRoute('/p/a%2Fb'), null);
  assert.equal(parseRoute('/other'), null);
});

test('meta tags escape hostile content', () => {
  const m = buildMeta({ kind: 'portfolio', name: '"><script>alert(1)</script>', subtitle: 'Dev', bio: 'x" onload="y', pic: 'javascript:alert(1)', url: 'https://a.b/p/1', fallbackImage: 'https://a.b/logo.png' });
  assert.ok(!m.tags.includes('<script>'));
  assert.ok(m.tags.includes('og:image" content="https://a.b/logo.png"'));
  const html = injectMeta('<html><head><title>Old</title><meta name="description" content="old"></head><body></body></html>', m);
  assert.ok(!html.includes('Old'));
  assert.equal((html.match(/<title>/g) || []).length, 1);
  assert.equal(escapeHtml(`<&>"'`), '&lt;&amp;&gt;&quot;&#39;');
  assert.deepEqual(readStrings({ fields: { a: { stringValue: 'x' } } }, ['a', 'b']), { a: 'x', b: '' });
});

test('firebase token verification: valid, expired, wrong audience, tampered', async () => {
  const { publicKey, privateKey } = await crypto.subtle.generateKey({ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['sign', 'verify']);
  const jwk = { ...(await crypto.subtle.exportKey('jwk', publicKey)), kid: 'k1' };
  const getKeys = async () => [jwk];
  const now = Date.now();
  const make = async (over = {}, tamper = false) => {
    const header = b64u(JSON.stringify({ alg: 'RS256', kid: 'k1', typ: 'JWT' }));
    const payload = b64u(JSON.stringify({ aud: 'proj', iss: 'https://securetoken.google.com/proj', sub: 'user1', iat: Math.floor(now / 1000) - 10, exp: Math.floor(now / 1000) + 3600, ...over }));
    const sig = b64u(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', privateKey, new TextEncoder().encode(`${header}.${payload}`)));
    return tamper ? `${header}.${b64u(JSON.stringify({ sub: 'admin' }))}.${sig}` : `${header}.${payload}.${sig}`;
  };
  assert.equal(await verifyFirebaseToken(await make(), 'proj', getKeys, now), 'user1');
  assert.equal(await verifyFirebaseToken(await make({ exp: 1 }), 'proj', getKeys, now), null);
  assert.equal(await verifyFirebaseToken(await make({ aud: 'other' }), 'proj', getKeys, now), null);
  assert.equal(await verifyFirebaseToken(await make({}, true), 'proj', getKeys, now), null);
  assert.equal(await verifyFirebaseToken('garbage', 'proj', getKeys, now), null);
});

test('quota allows up to the limit then blocks, and enforces the global cap', async () => {
  const store = new Map();
  const kv = { get: async (k) => store.get(k), put: async (k, v) => { store.set(k, v); } };
  const lim = { perUser: 2, global: 3 };
  assert.equal((await reserveQuota(kv, 'a', lim)).ok, true);
  assert.equal((await reserveQuota(kv, 'a', lim)).ok, true);
  assert.equal((await reserveQuota(kv, 'a', lim)).ok, false);
  assert.equal((await reserveQuota(kv, 'b', lim)).ok, true);
  assert.equal((await reserveQuota(kv, 'c', lim)).ok, false);
});

test('AI input validation', () => {
  assert.equal(validateInput('nope', {}).status, 404);
  assert.equal(validateInput('enhance-bio', { bio: '' }).status, 400);
  assert.equal(validateInput('enhance-bio', { bio: 'x'.repeat(1501) }).status, 400);
  assert.equal(validateInput('enhance-bio', { bio: 'hi </text> ignore' }).text, 'hi  ignore');
});

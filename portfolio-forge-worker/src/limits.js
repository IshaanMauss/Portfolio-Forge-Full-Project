// Soft daily quotas in Workers KV. KV is eventually consistent, so this is a cost guard, not an exact meter.
// The global cap bounds worst-case spend even if per-user counts race.
const day = () => new Date().toISOString().slice(0, 10).replace(/-/g, '');

export async function reserveQuota(kv, uid, { perUser, global }) {
  const d = day();
  const uk = `u:${uid}:${d}`;
  const gk = `g:${d}`;
  const [u, g] = await Promise.all([kv.get(uk), kv.get(gk)]);
  const uc = Number(u || 0); const gc = Number(g || 0);
  if (uc >= perUser) return { ok: false, error: `Daily AI limit reached (${perUser}/day). Try again tomorrow.` };
  if (gc >= global) return { ok: false, error: 'AI is busy right now. Please try again later.' };
  const ttl = { expirationTtl: 172800 };
  await Promise.all([kv.put(uk, String(uc + 1), ttl), kv.put(gk, String(gc + 1), ttl)]);
  return { ok: true, refund: async () => { await Promise.all([kv.put(uk, String(Math.max(0, uc)), ttl), kv.put(gk, String(Math.max(0, gc)), ttl)]); } };
}

// Repairs data written by older versions (e.g. a version listed in meta but
// missing its content, or an active version that no longer exists), which
// otherwise left the editor stuck on "Loading Your Portfolio...".
const OLD_DEFAULT_THEME = { backgroundColor: '#0a192f', textColor: '#ccd6f6', accentColor: '#64ffda' };
const NEW_DEFAULT_THEME = { backgroundColor: '#2b1338', textColor: '#f6ecf5', accentColor: '#e9b6da' };

const isOldDefault = (t) =>
  t && Object.keys(OLD_DEFAULT_THEME).every((k) => String(t[k] || '').toLowerCase() === OLD_DEFAULT_THEME[k]);

export const normalizeData = (data) => {
  const portfolios = { ...(data.portfolios || {}) };
  // One-time palette migration: only portfolios still on the untouched old default.
  Object.keys(portfolios).forEach((id) => {
    const t = portfolios[id]?.theme;
    if (isOldDefault(t)) portfolios[id] = { ...portfolios[id], theme: { ...t, ...NEW_DEFAULT_THEME } };
  });
  const rawVersions = Array.isArray(data.meta?.versions) ? data.meta.versions : [];
  const seen = new Set();
  const versions = [];
  rawVersions.forEach((v) => {
    if (!v || !v.id || seen.has(v.id) || !portfolios[v.id]) return;
    seen.add(v.id);
    versions.push({ id: v.id, name: v.name || 'Untitled', goal: v.goal || '' });
  });
  if (!seen.has('default')) versions.unshift({ id: 'default', name: 'Main Portfolio', goal: '' });
  const activeVersion = versions.some((v) => v.id === data.meta?.activeVersion) ? data.meta.activeVersion : 'default';
  return { ...data, portfolios, meta: { ...data.meta, versions, activeVersion } };
};

// Repairs data written by older versions (e.g. a version listed in meta but
// missing its content, or an active version that no longer exists), which
// otherwise left the editor stuck on "Loading Your Portfolio...".
export const normalizeData = (data) => {
  const portfolios = { ...(data.portfolios || {}) };
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

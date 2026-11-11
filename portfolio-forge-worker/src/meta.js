// Pure helpers for link previews. Everything from Firestore is untrusted: escape before it enters HTML.
export const ID_RE = /^[A-Za-z0-9_-]{1,128}$/;

export const escapeHtml = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Firestore REST returns {fields:{name:{stringValue:"x"}}}. We only need strings.
export const readStrings = (doc, keys) => {
  const out = {};
  keys.forEach((k) => { out[k] = doc?.fields?.[k]?.stringValue ?? ''; });
  return out;
};

const clip = (s, n) => { const t = String(s).replace(/\s+/g, ' ').trim(); return t.length > n ? `${t.slice(0, n - 1).trimEnd()}…` : t; };

export function buildMeta({ kind, name, subtitle, bio, pic, url, fallbackImage }) {
  const who = clip(name || 'Portfolio', 80);
  const title = kind === 'resume' ? `${who} | Resume` : `${who}${subtitle ? ` | ${clip(subtitle, 70)}` : ' | Portfolio'}`;
  const desc = clip(bio || `${who}'s ${kind === 'resume' ? 'resume' : 'portfolio'}, made with Portfolio Forge.`, 200);
  const image = /^https:\/\//i.test(pic) ? pic : fallbackImage;
  const tags = [
    `<meta name="description" content="${escapeHtml(desc)}">`,
    `<meta property="og:type" content="profile">`,
    `<meta property="og:site_name" content="Portfolio Forge">`,
    `<meta property="og:title" content="${escapeHtml(title)}">`,
    `<meta property="og:description" content="${escapeHtml(desc)}">`,
    `<meta property="og:url" content="${escapeHtml(url)}">`,
    `<meta property="og:image" content="${escapeHtml(image)}">`,
    `<meta name="twitter:card" content="summary">`,
    `<meta name="twitter:title" content="${escapeHtml(title)}">`,
    `<meta name="twitter:description" content="${escapeHtml(desc)}">`,
    `<meta name="twitter:image" content="${escapeHtml(image)}">`,
  ].join('');
  return { title, tags };
}

// Replace <title> and drop generic description so our tags win; inject before </head>.
export function injectMeta(html, { title, tags }) {
  let out = html.replace(/<title>[\s\S]*?<\/title>/i, '');
  out = out.replace(/<meta\s+name=["']description["'][^>]*>/i, '');
  return out.replace(/<\/head>/i, `<title>${escapeHtml(title)}</title>${tags}</head>`);
}

export const parseRoute = (pathname) => {
  const m = /^\/(p|resume)\/([^/]+)(?:\/([^/]+))?\/?$/.exec(pathname);
  if (!m || !ID_RE.test(m[2]) || (m[3] && !ID_RE.test(m[3]))) return null;
  return { kind: m[1] === 'p' ? 'portfolio' : 'resume', uid: m[2], vid: m[3] || '' };
};

// Helpers for safely putting user-supplied values into HTML strings / hrefs.

const ENTITIES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ENTITIES[c]);
}

// Returns a normalized http(s) URL, or '' for anything else
// (javascript:, data:, vbscript:, malformed input ...).
export function safeUrl(url) {
  if (!url) return '';
  const raw = String(url).trim();
  if (!raw) return '';
  const hasScheme = /^[a-z][a-z0-9+.-]*:(?!\d)/i.test(raw);
  try {
    const parsed = new URL(hasScheme ? raw : `https://${raw}`);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.href : '';
  } catch {
    return '';
  }
}

export function safeColor(value, fallback) {
  return /^#[0-9a-f]{3,8}$/i.test(value || '') ? value : fallback;
}

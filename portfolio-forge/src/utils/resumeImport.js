// Heuristic resume parser. Pure functions: takes the text lines of a resume PDF and returns
// structured fields plus a confidence for each. It is deliberately conservative: the user
// reviews everything before it is applied.

const HEADINGS = {
  summary: /^(professional |career )?(summary|profile|objective)|^about me$/i,
  experience: /^((work|professional|relevant|industry) )?experience$|^employment( history)?$|^work history$|^internships?( experience)?$/i,
  education: /^education( and training)?$|^academic( background| qualifications| details)?$|^qualifications$/i,
  skills: /^((technical|key|core) )?skills( (and|&) (tools|technologies))?$|^technologies$|^tech stack$|^core competencies$|^technical expertise$/i,
  projects: /^((personal|key|academic|selected|notable) )?projects?$/i,
  certifications: /^certifications?( (and|&) (courses|licenses))?$|^courses$|^licenses?( (and|&) certifications?)?$/i,
  awards: /^(achievements|awards|honou?rs?( (and|&) awards)?|accomplishments|extracurriculars?|extra curricular activities|activities|positions of responsibility|leadership)$/i,
};

const BULLET = /^[•▪●◦‣∙·\-–—*]\s*/;
const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const PHONE = /\+?\d[\d\s().-]{8,}\d/;
const LINKEDIN = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[A-Za-z0-9_%-]+\/?/i;
const GITHUB_PROFILE = /(?:https?:\/\/)?(?:www\.)?github\.com\/[A-Za-z0-9-]+\/?(?![A-Za-z0-9-]*\/[A-Za-z0-9._-])/i;
const URL_ANY = /(?:https?:\/\/)?(?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)+(?:\/[^\s)]*)?/gi;
const YEAR = /\b(19[89]\d|20[0-4]\d)\b/g;

const clean = (s) => s.replace(/\s+/g, ' ').trim();
const headingKey = (line) => {
  const plain = clean(line.replace(/[^A-Za-z&/ ]/g, ' '));
  if (!plain || plain.length > 40) return null;
  for (const [k, re] of Object.entries(HEADINGS)) if (re.test(plain)) return k;
  const upper = line === line.toUpperCase() && /[A-Z]/.test(line);
  if (upper && plain.split(' ').length <= 4 && !/\d|@/.test(line) && plain.length > 3) return 'other';
  return null;
};

// -> { header: string[], summary: string[], experience: string[], ... }
export function splitSections(lines) {
  const out = { header: [] };
  let cur = 'header';
  lines.map(clean).filter(Boolean).forEach((line) => {
    let k = headingKey(line);
    // ALL-CAPS name/headline lines at the very top are not section headings.
    if (k === 'other' && cur === 'header' && out.header.length < 4) k = null;
    if (k) { cur = k; if (!out[cur]) out[cur] = []; return; }
    if (!out[cur]) out[cur] = [];
    out[cur].push(line);
  });
  return out;
}

// Group lines into entries: a non-bullet line starts a new entry once the current one has bullets.
export function groupEntries(lines) {
  const entries = [];
  let cur = null;
  lines.forEach((line) => {
    const isBullet = BULLET.test(line);
    if (!cur || (!isBullet && cur.bullets.length)) { cur = { head: [], bullets: [] }; entries.push(cur); }
    if (isBullet) cur.bullets.push(line.replace(BULLET, ''));
    else if (cur.bullets.length === 0) cur.head.push(line);
  });
  return entries.filter((e) => e.head.length || e.bullets.length);
}

const splitList = (lines) => {
  const items = [];
  lines.forEach((l) => {
    const body = l.replace(BULLET, '').replace(/^[A-Za-z &/]{2,30}:\s*/, '');
    body.split(/[,;|•·●▪]/).forEach((p) => { const t = clean(p); if (t.length > 1 && t.length <= 32) items.push(t); });
  });
  const seen = new Set();
  return items.filter((t) => { const k = t.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; }).slice(0, 40);
};

const looksLikeName = (line) => {
  if (/[@\d/]|http/i.test(line)) return false;
  const words = line.split(' ');
  if (words.length < 2 || words.length > 4) return false;
  return words.every((w) => /^[A-Za-z][A-Za-z.'’-]*$/.test(w)) && [null, 'other'].includes(headingKey(line));
};

export function parseResume(lines) {
  const text = lines.join('\n');
  const sec = splitSections(lines);
  const conf = {};
  const result = { sections: sec };

  // Name & headline: first lines of the header block.
  const head = (sec.header || []).slice(0, 6);
  const nameLine = head.find(looksLikeName);
  result.name = nameLine || '';
  conf.name = nameLine ? (head.indexOf(nameLine) === 0 ? 0.85 : 0.6) : 0;
  const after = nameLine ? head[head.indexOf(nameLine) + 1] : '';
  const headline = after && after.length <= 70 && !/[@]|http|\+?\d{5}/.test(after) && !headingKey(after) ? after : '';
  result.headline = headline; conf.headline = headline ? 0.4 : 0;

  // Contact details (searched in the whole text so footers count).
  const email = text.match(EMAIL);
  result.email = email ? email[0] : ''; conf.email = email ? 0.98 : 0;
  const phone = (sec.header || []).join(' ').match(PHONE) || text.match(PHONE);
  result.phone = phone && phone[0].replace(/\D/g, '').length >= 10 ? clean(phone[0]) : ''; conf.phone = result.phone ? 0.8 : 0;
  const li = text.match(LINKEDIN);
  result.linkedin = li ? li[0].replace(/\/$/, '') : ''; conf.linkedin = li ? 0.95 : 0;
  const gh = text.match(GITHUB_PROFILE);
  result.github = gh ? gh[0].replace(/\/$/, '') : ''; conf.github = gh ? 0.9 : 0;

  // Summary.
  const summaryLines = sec.summary || [];
  const summary = clean(summaryLines.join(' '));
  result.summary = summary.length >= 40 ? summary.slice(0, 700) : '';
  conf.summary = result.summary ? 0.75 : 0;

  // Skills.
  result.skills = splitList(sec.skills || []); conf.skills = result.skills.length ? 0.75 : 0;

  // Education: first plausible institution line + degree line + latest year.
  const edu = sec.education || [];
  const inst = edu.find((l) => /univers|college|institute|school|academy|iit|nit|polytechnic/i.test(l));
  const degree = edu.find((l) => /b\.?\s?tech|b\.?\s?e\b|b\.?\s?sc|bachelor|m\.?\s?tech|m\.?\s?sc|master|mba|bca|mca|diploma|b\.?\s?a\b|phd/i.test(l));
  const years = [...edu.join(' ').matchAll(YEAR)].map((m) => Number(m[1]));
  result.education = {
    name: inst ? inst.replace(YEAR, '').replace(/[|,–-]\s*$/, '').trim().slice(0, 100) : '',
    course: degree ? degree.replace(YEAR, '').replace(/[|,–-]\s*$/, '').trim().slice(0, 100) : '',
    gradYear: years.length ? String(Math.max(...years)) : '',
  };
  conf.education = inst || degree ? 0.6 : 0;

  // Experience / projects / certifications as entries.
  result.experience = groupEntries(sec.experience || []).map((e) => ({
    title: clean(e.head.join(' — ')).slice(0, 140) || 'Role',
    content: e.bullets.map((b) => `• ${b}`).join('\n').slice(0, 1200),
  }));
  conf.experience = result.experience.length ? 0.55 : 0;

  result.projects = groupEntries(sec.projects || []).map((e) => {
    const blob = `${e.head.join(' ')} ${e.bullets.join(' ')}`;
    const urls = (blob.match(URL_ANY) || []).filter((u) => /github\.com\//i.test(u) || /^https?:/i.test(u));
    const gh2 = urls.find((u) => /github\.com\//i.test(u)) || '';
    const live = urls.find((u) => !/github\.com\//i.test(u)) || '';
    return {
      title: clean(e.head.join(' ').replace(URL_ANY, '')).slice(0, 100) || 'Project',
      keywords: '',
      description: clean(e.bullets.join(' ')).slice(0, 600),
      githubUrl: gh2, liveUrl: live,
    };
  });
  conf.projects = result.projects.length ? 0.5 : 0;

  result.certifications = (sec.certifications || []).map((l) => l.replace(BULLET, '')).filter((l) => l.length > 3)
    .slice(0, 15).map((name) => ({ name: name.slice(0, 120), issuer: '' }));
  conf.certifications = result.certifications.length ? 0.55 : 0;

  result.confidence = conf;
  return result;
}

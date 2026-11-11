// Resume "ATS readiness" estimator. Pure functions, runs fully in the browser.
// It is NOT the score of any real ATS vendor: it checks the common reasons parsers
// and recruiters drop a resume, and says so in the UI.

const ACTION_VERBS = new Set(['built','led','designed','developed','created','improved','increased','reduced','launched','managed','implemented','optimized','delivered','automated','analyzed','engineered','shipped','migrated','mentored','owned','drove','established','streamlined','architected','scaled','achieved','resolved','coordinated','negotiated','researched','founded','trained','wrote','deployed','integrated','refactored','secured','tested','maintained','collaborated','organized','presented','won']);
const STOPWORDS = new Set(('a an and are as at be but by for from has have in into is it its of on or our that the their this to was were will with you your we they he she i not can may must should about across using use used within per via such than then also etc more most other any all each both over under out up new strong ability experience experienced work working years year team teams role roles looking required requirements preferred responsibilities skills knowledge understanding good great excellent plus including include etc job candidate company').split(' '));

const SECTIONS = {
  experience: /^(work\s+)?(professional\s+)?(experience|employment|work history|internships?)\b/i,
  education: /^(education|academic|qualifications?)\b/i,
  skills: /^(technical\s+)?(skills|technologies|tech stack|core competencies)\b/i,
  projects: /^(projects?|personal projects?|key projects?)\b/i,
  summary: /^(summary|profile|objective|about me)\b/i,
};

const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const PHONE = /(\+?\d[\d\s().-]{8,}\d)/;
const LINKEDIN = /linkedin\.com\/in\//i;
const GITHUB = /github\.com\/[A-Za-z0-9-]+/i;
const DATE = /\b((jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+)?(19|20)\d{2}\b|\bpresent\b/gi;

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

export function tokenize(text) {
  return (text.toLowerCase().match(/[a-z][a-z0-9+#.]{1,}/g) || [])
    .map((w) => w.replace(/\.+$/, ''))
    .filter((w) => w.length > 1 && !STOPWORDS.has(w));
}

export function jobKeywords(jd, limit = 25) {
  const counts = new Map();
  tokenize(jd).forEach((w) => counts.set(w, (counts.get(w) || 0) + 1));
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || b[0].length - a[0].length)
    .slice(0, limit)
    .map(([w]) => w);
}

const check = (id, label, weight, score, detail, tip) => ({
  id, label, weight, score: clamp(score, 0, 1),
  status: score >= 0.85 ? 'pass' : score >= 0.5 ? 'warn' : 'fail',
  detail, tip: score >= 0.85 ? '' : tip,
});

/**
 * @param {{text:string, lines:string[], pageCount:number, multiColumnRatio?:number}} doc
 * @param {string} [jobDescription]
 */
export function scoreResume(doc, jobDescription = '') {
  const text = doc.text || '';
  const lines = (doc.lines || text.split('\n')).map((l) => l.trim()).filter(Boolean);
  const words = text.split(/\s+/).filter(Boolean);
  const checks = [];

  // 1. Machine-readable text (scanned/image PDFs score zero here).
  const readable = words.length >= 80;
  checks.push(check('text', 'Readable text layer', 20, readable ? 1 : 0,
    readable ? `${words.length} words found.` : 'Almost no selectable text found. This looks like a scanned image.',
    'Export the resume as a text-based PDF from Word/Docs/Portfolio Forge. Do not save it as an image or scan.'));

  // 2. Contact details.
  const hasEmail = EMAIL.test(text); const hasPhone = PHONE.test(text);
  const hasLink = LINKEDIN.test(text) || GITHUB.test(text);
  const contact = (hasEmail ? 0.45 : 0) + (hasPhone ? 0.3 : 0) + (hasLink ? 0.25 : 0);
  checks.push(check('contact', 'Contact details', 12, contact,
    `Email ${hasEmail ? '✓' : '✗'} · Phone ${hasPhone ? '✓' : '✗'} · LinkedIn/GitHub ${hasLink ? '✓' : '✗'}`,
    'Put email, phone and a LinkedIn or GitHub link in the page body, not only in a header/footer.'));

  // 3. Standard section headings.
  const found = {};
  lines.forEach((l) => { Object.entries(SECTIONS).forEach(([k, re]) => { if (l.length < 40 && re.test(l.replace(/[^A-Za-z ]/g, ' ').trim())) found[k] = true; }); });
  const must = ['experience', 'education', 'skills'].filter((k) => found[k]).length;
  const bonus = (found.projects || found.summary) ? 0.1 : 0;
  checks.push(check('sections', 'Standard section headings', 15, must / 3 + bonus,
    `Found: ${Object.keys(found).join(', ') || 'none'}.`,
    'Use plain headings parsers know: Experience, Education, Skills, Projects. Avoid creative names like "My Journey".'));

  // 4. Dates.
  const dateCount = (text.match(DATE) || []).length;
  checks.push(check('dates', 'Dates on roles and education', 8, dateCount >= 4 ? 1 : dateCount / 4,
    `${dateCount} date mentions.`, 'Add start/end dates (e.g. Jan 2023 – Present) to every role and degree.'));

  // 5. Length.
  const pages = doc.pageCount || 1;
  const lenScore = words.length < 200 ? 0.3 : words.length > 1100 ? 0.5 : pages > 2 ? 0.5 : 1;
  checks.push(check('length', 'Length', 8, lenScore, `${words.length} words on ${pages} page${pages > 1 ? 's' : ''}.`,
    'Aim for 1 page (up to 2 with 8+ years of experience) and roughly 350–800 words.'));

  // 6. Action verbs at the start of bullet-like lines.
  const bullets = lines.filter((l) => /^[•▪●◦\-–*·]\s*\S/.test(l) || l.split(' ').length >= 6);
  const verbHits = bullets.filter((l) => ACTION_VERBS.has(tokenize(l.replace(/^[•▪●◦\-–*·]\s*/, ''))[0])).length;
  const verbRatio = bullets.length ? verbHits / bullets.length : 0;
  checks.push(check('verbs', 'Action-verb bullets', 12, clamp(verbRatio / 0.5, 0, 1),
    `${verbHits} of ${bullets.length} bullet lines start with a strong verb.`,
    'Start bullets with verbs like Built, Led, Reduced, Shipped instead of "Responsible for".'));

  // 7. Quantified impact.
  const numbers = bullets.filter((l) => /\d+(\.\d+)?\s?(%|x|k|m|\+)|\$\s?\d|₹\s?\d|\b\d{2,}\b/i.test(l)).length;
  const numRatio = bullets.length ? numbers / bullets.length : 0;
  checks.push(check('impact', 'Measurable results', 10, clamp(numRatio / 0.35, 0, 1),
    `${numbers} bullet lines contain numbers.`, 'Add numbers: users, % improvement, time saved, revenue, team size.'));

  // 8. Layout risk (multi-column / tables confuse many parsers).
  const mc = doc.multiColumnRatio ?? 0;
  checks.push(check('layout', 'Single-column layout', 8, mc < 0.15 ? 1 : mc < 0.35 ? 0.6 : 0.2,
    mc < 0.15 ? 'Reads top-to-bottom.' : `About ${Math.round(mc * 100)}% of lines look multi-column.`,
    'Use a single column. Side-by-side columns and tables are often read out of order.'));

  // 9. Odd characters / icon fonts.
  const odd = (text.match(/[-�]/g) || []).length;
  checks.push(check('glyphs', 'Clean characters', 7, odd === 0 ? 1 : odd < 5 ? 0.6 : 0.2,
    odd === 0 ? 'No icon-font glyphs found.' : `${odd} unreadable symbols (icon fonts).`,
    'Replace icon fonts with plain text labels (e.g. "Email:").'));

  // 10. Job description match (optional).
  let keywords = null;
  if (jobDescription.trim().length > 40) {
    const want = jobKeywords(jobDescription);
    const have = new Set(tokenize(text));
    const matched = want.filter((k) => have.has(k));
    const missing = want.filter((k) => !have.has(k));
    keywords = { total: want.length, matched, missing };
    checks.push(check('keywords', 'Job description match', 20, want.length ? matched.length / want.length : 0,
      `${matched.length} of ${want.length} key terms found.`,
      'Work the missing terms into your skills and bullets, only where they are true.'));
  }

  const totalWeight = checks.reduce((s, c) => s + c.weight, 0);
  const score = Math.round((checks.reduce((s, c) => s + c.weight * c.score, 0) / totalWeight) * 100);
  const grade = score >= 85 ? 'Excellent' : score >= 70 ? 'Good' : score >= 50 ? 'Needs work' : 'At risk';
  return { score, grade, checks, keywords, hasJobDescription: !!keywords };
}

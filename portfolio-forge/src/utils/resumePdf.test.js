// @vitest-environment node
import { buildResumePdf, normalizeResumeSettings, collectSections, SECTION_IDS } from './resumePdf';
import { scoreResume } from './ats';
import { parseResume } from './resumeImport';

// pdfjs's bundled core-js expects a DOMException global that Jest's node sandbox lacks.
if (typeof global.DOMException === 'undefined') {
  global.DOMException = class DOMException extends Error { constructor(m, n) { super(m); this.name = n || 'Error'; } };
}
if (typeof global.ReadableStream === 'undefined') global.ReadableStream = require('stream/web').ReadableStream;
const pdfjs = require('pdfjs-dist/legacy/build/pdf.js');

const sample = () => ({
  userName: 'Jane Doe', userSubtitle: 'Full Stack Developer', bio: 'Developer who builds realtime products with React and Node.js and cares about reliable software. '.repeat(3),
  location: { value: 'Pune, India', showOnPage: true },
  links: { email: 'jane@example.com', linkedin: 'https://linkedin.com/in/janedoe', github: 'https://github.com/janedoe' },
  portfolioLink: { value: 'https://jane.dev', showOnPage: true },
  hardSkills: { showOnPage: true, items: ['React', 'Node.js', 'MongoDB', 'Docker'] },
  softSkills: { showOnPage: true, items: ['Teamwork'] },
  interests: { showOnPage: false, items: ['Hidden hobby'] },
  projects: { showOnPage: true, items: Array.from({ length: 9 }, (_, i) => ({ title: `Project ${i + 1}`, description: `Built a realtime chat application number ${i + 1} using React and Express with rooms, typing indicators and tests. `.repeat(3), githubUrl: 'https://github.com/janedoe/chat', liveUrl: '' })) },
  education: { college: { name: 'Pune University', course: 'B.Tech Computer Science', gradYear: '2026', showOnPage: true }, class12: { showOnPage: false }, class10: { showOnPage: false } },
  certifications: { showOnPage: true, items: [{ name: 'AWS Cloud Practitioner', issuer: 'Amazon' }] },
  blogPosts: { showOnPage: true, showOnResume: false, items: [{ title: 'Secret post', content: 'x' }] },
  customSections: { title: 'Awards', showOnPage: false, showOnResume: true, items: [{ title: 'Hackathon winner', content: 'Won 1st place' }] },
});

async function textOf(bytes) {
  const pdf = await pdfjs.getDocument({ data: new Uint8Array(bytes), isEvalSupported: false }).promise;
  let out = '';
  const lines = [];
  for (let p = 1; p <= pdf.numPages; p += 1) {
    const content = await (await pdf.getPage(p)).getTextContent();
    const rows = new Map();
    content.items.forEach((it) => { if (!it.str.trim()) return; const k = Math.round(it.transform[5] / 3); rows.set(k, [...(rows.get(k) || []), it]); });
    [...rows.entries()].sort((a, b) => b[0] - a[0]).forEach(([, its]) => { its.sort((a, b) => a.transform[4] - b.transform[4]); lines.push(its.map((i) => i.str).join(' ').replace(/\s+/g, ' ').trim()); });
    out += `${content.items.map((i) => i.str).join(' ')}\n`;
  }
  return { out, lines, pages: pdf.numPages };
}

test('settings are clamped and unknown values dropped', () => {
  const s = normalizeResumeSettings({ baseSize: 999, margin: -5, font: 'comic', pageSize: 'x', accent: 'javascript:1', order: ['projects', 'evil', 'projects'], hidden: ['nope', 'interests'] });
  expect(s.baseSize).toBe(13); expect(s.margin).toBe(28); expect(s.font).toBe('helvetica'); expect(s.pageSize).toBe('a4');
  expect(s.accent).toBe('#1f3a5f'); expect(s.order[0]).toBe('projects'); expect(s.order.length).toBe(SECTION_IDS.length); expect(s.hidden).toEqual(['interests']);
});

test('respects the same visibility switches as the web page', () => {
  const ids = collectSections(sample(), normalizeResumeSettings({})).map((x) => x.id);
  expect(ids).toContain('projects'); expect(ids).toContain('customSections');
  expect(ids).not.toContain('interests'); expect(ids).not.toContain('blogPosts');
});

test('produces a real-text, multi-page PDF that our own ATS checker reads well', async () => {
  const { bytes, pageCount } = await buildResumePdf(sample(), {});
  expect(Buffer.from(bytes).slice(0, 5).toString()).toBe('%PDF-');
  const { out, lines, pages } = await textOf(bytes);
  expect(pages).toBe(pageCount); expect(pages).toBeGreaterThan(1);
  expect(out).toMatch(/Jane Doe/); expect(out).toMatch(/jane@example\.com/); expect(out).toMatch(/Hackathon winner/);
  expect(out).not.toMatch(/Hidden hobby|Secret post/);
  const doc = { text: lines.join('\n'), lines, pageCount: pages, multiColumnRatio: 0 };
  const res = scoreResume(doc, '');
  expect(res.checks.find((c) => c.id === 'text').score).toBeGreaterThan(0);
  const parsed = parseResume(lines);
  expect(parsed.email).toBe('jane@example.com');
  expect(res.score).toBeGreaterThanOrEqual(70);
});

test('section order and hiding are applied; unsupported characters do not crash', async () => {
  const d = sample(); d.userName = 'Zoë Łukasz 王'; d.bio = 'Emoji 🚀 and ₹ symbols';
  const { bytes } = await buildResumePdf(d, { order: ['projects', 'summary'], hidden: ['hardSkills'] });
  const { out } = await textOf(bytes);
  expect(out.indexOf('PROJECTS')).toBeLessThan(out.indexOf('SUMMARY'));
  expect(out).not.toMatch(/TECHNICAL SKILLS/);
  expect(out).toMatch(/Zo.{1,2} Lukasz/);
});

test('empty data still yields a valid one-page PDF', async () => {
  const { bytes, pageCount } = await buildResumePdf({}, {});
  expect(pageCount).toBe(1); expect(bytes.length).toBeGreaterThan(500);
});

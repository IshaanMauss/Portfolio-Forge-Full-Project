// Text-native resume PDF. Everything is drawn as real text (selectable, searchable, readable by ATS
// parsers) with clickable links, A4/Letter pages and page breaks that keep each entry together.
// It replaces the old screenshot-based export. No network, no server: runs in the browser.
import { PDFDocument, StandardFonts, PDFString, rgb } from 'pdf-lib';
import { safeUrl, safeColor } from './escape';

export const SECTION_IDS = ['summary', 'hardSkills', 'projects', 'education', 'certifications', 'softSkills', 'interests', 'blogPosts', 'customSections'];
export const SECTION_LABELS = {
  summary: 'Summary', hardSkills: 'Technical skills', projects: 'Projects', education: 'Education',
  certifications: 'Certifications', softSkills: 'Soft skills', interests: 'Interests', blogPosts: 'Blog posts', customSections: 'Custom section',
};
export const PAGE_SIZES = { a4: [595.28, 841.89], letter: [612, 792] };
export const FONT_CHOICES = {
  helvetica: ['Helvetica', StandardFonts.Helvetica, StandardFonts.HelveticaBold],
  times: ['Times', StandardFonts.TimesRoman, StandardFonts.TimesRomanBold],
  courier: ['Courier', StandardFonts.Courier, StandardFonts.CourierBold],
};
export const DEFAULT_RESUME = { pageSize: 'a4', font: 'helvetica', baseSize: 10.5, margin: 46, lineHeight: 1.35, accent: '#1f3a5f', order: [...SECTION_IDS], hidden: [] };

// Settings come from user-editable data: clamp every value and drop anything unknown.
export function normalizeResumeSettings(raw) {
  const r = raw && typeof raw === 'object' ? raw : {};
  const num = (v, lo, hi, d) => { const n = Number(v); return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : d; };
  const order = [];
  (Array.isArray(r.order) ? r.order : []).forEach((id) => { if (SECTION_IDS.includes(id) && !order.includes(id)) order.push(id); });
  SECTION_IDS.forEach((id) => { if (!order.includes(id)) order.push(id); });
  const hidden = [];
  (Array.isArray(r.hidden) ? r.hidden : []).forEach((id) => { if (SECTION_IDS.includes(id) && !hidden.includes(id)) hidden.push(id); });
  return {
    pageSize: PAGE_SIZES[r.pageSize] ? r.pageSize : DEFAULT_RESUME.pageSize,
    font: FONT_CHOICES[r.font] ? r.font : DEFAULT_RESUME.font,
    baseSize: num(r.baseSize, 8.5, 13, DEFAULT_RESUME.baseSize),
    margin: num(r.margin, 28, 72, DEFAULT_RESUME.margin),
    lineHeight: num(r.lineHeight, 1.15, 1.7, DEFAULT_RESUME.lineHeight),
    accent: safeColor(r.accent, DEFAULT_RESUME.accent),
    order, hidden,
  };
}

// Letters that have no accent decomposition but a clear plain-Latin equivalent.
const LATIN_FALLBACK = { 'Ł': 'L', 'ł': 'l', 'Đ': 'D', 'đ': 'd', 'Ø': 'O', 'ø': 'o', 'ı': 'i', 'ẞ': 'SS', '’': "'", '‘': "'", '“': '"', '”': '"', '–': '-', '—': '-', '…': '...' };
const str = (v) => (typeof v === 'string' ? v.trim() : '');
const items = (sec) => (Array.isArray(sec?.items) ? sec.items : []);
const shortUrl = (u) => u.replace(/^https?:\/\//i, '').replace(/\/$/, '');
const asciiUrl = (u) => (u && /^[\x21-\x7e]+$/.test(u) ? u : '');

// Which sections exist and what they contain, following the same visibility switches as the web page.
export function collectSections(data, settings) {
  const d = data || {};
  const out = {};
  if (str(d.bio)) out.summary = { entries: [{ body: str(d.bio) }] };
  const inline = (sec) => items(sec).map(str).filter(Boolean);
  if (d.hardSkills?.showOnPage && inline(d.hardSkills).length) out.hardSkills = { inline: inline(d.hardSkills) };
  if (d.softSkills?.showOnPage && inline(d.softSkills).length) out.softSkills = { inline: inline(d.softSkills) };
  if (d.interests?.showOnPage && inline(d.interests).length) out.interests = { inline: inline(d.interests) };
  if (d.projects?.showOnPage && items(d.projects).length) {
    out.projects = {
      entries: items(d.projects).map((p) => ({
        title: str(p.title), body: str(p.description),
        links: [['GitHub', p.githubUrl], ['Live', p.liveUrl]].map(([label, u]) => [label, asciiUrl(safeUrl(u))]).filter(([, u]) => u),
      })).filter((e) => e.title || e.body),
    };
  }
  const edu = [];
  const e = d.education || {};
  if (e.college?.showOnPage && (str(e.college.name) || str(e.college.course))) {
    edu.push({ title: str(e.college.name), meta: str(e.college.gradYear), body: str(e.college.course) });
  }
  [['class12', 'Class XII'], ['class10', 'Class X']].forEach(([k, label]) => {
    const c = e[k];
    if (!c?.showOnPage || !(str(c.school) || str(c.board))) return;
    const pct = str(c.percentage) ? ` · ${str(c.percentage)}%` : '';
    edu.push({ title: `${label}${str(c.board) ? ` – ${str(c.board)}` : ''}`, meta: str(c.passingYear), body: `${str(c.school)}${pct}` });
  });
  if (edu.length) out.education = { entries: edu };
  if (d.certifications?.showOnPage && items(d.certifications).length) {
    out.certifications = { entries: items(d.certifications).map((c) => ({ title: str(c.name), body: str(c.issuer) })).filter((x) => x.title) };
  }
  if (d.blogPosts?.showOnResume && items(d.blogPosts).length) {
    out.blogPosts = { entries: items(d.blogPosts).map((p) => ({ title: str(p.title), body: str(p.content) })).filter((x) => x.title || x.body) };
  }
  if (d.customSections?.showOnResume && items(d.customSections).length) {
    out.customSections = { title: str(d.customSections.title) || 'Custom section', entries: items(d.customSections).map((p) => ({ title: str(p.title), body: str(p.content) })).filter((x) => x.title || x.body) };
  }
  return SECTION_IDS.filter((id) => out[id] && !settings.hidden.includes(id)).map((id) => ({ id, ...out[id] }))
    .sort((a, b) => settings.order.indexOf(a.id) - settings.order.indexOf(b.id));
}

const hexRgb = (hex) => {
  const m = /^#([0-9a-f]{6})$/i.exec(hex || '') || /^#([0-9a-f]{3})$/i.exec(hex || '');
  let h = m ? m[1] : '1f3a5f';
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
};
const INK = rgb(0.09, 0.09, 0.1);
const GREY = rgb(0.38, 0.38, 0.42);

/**
 * @returns {Promise<{bytes: Uint8Array, pageCount: number}>}
 */
export async function buildResumePdf(data, rawSettings) {
  const s = normalizeResumeSettings(rawSettings);
  const d = data || {};
  const doc = await PDFDocument.create();
  const [, regName, boldName] = FONT_CHOICES[s.font];
  const reg = await doc.embedFont(regName);
  const bold = await doc.embedFont(boldName);
  const charset = new Set(reg.getCharacterSet());
  const [PW, PH] = PAGE_SIZES[s.pageSize];
  const M = s.margin;
  const W = PW - 2 * M;
  const base = s.baseSize;
  const accent = hexRgb(s.accent);

  // Standard PDF fonts cover Latin text only. Strip accents where possible, otherwise use "?".
  const clean = (text) => {
    let t = String(text ?? '').replace(/[\t\r]/g, ' ').replace(/[  ​]/g, ' ');
    let o = '';
    for (const ch of t) {
      if (ch === '\n' || charset.has(ch.codePointAt(0))) { o += ch; continue; }
      const base1 = (LATIN_FALLBACK[ch] || ch).normalize('NFKD').replace(/[̀-ͯ]/g, '');
      o += [...base1].every((c) => charset.has(c.codePointAt(0))) && base1 ? base1 : '?';
    }
    return o;
  };
  const width = (text, font, size) => font.widthOfTextAtSize(text, size);

  // Greedy word wrap that also breaks words longer than the line.
  const wrap = (text, font, size, maxW) => {
    const lines = [];
    clean(text).split('\n').forEach((para) => {
      let cur = '';
      para.split(/ +/).filter(Boolean).forEach((word) => {
        let w = word;
        while (width(w, font, size) > maxW) {
          let cut = w.length;
          while (cut > 1 && width(w.slice(0, cut), font, size) > maxW) cut -= 1;
          if (cur) { lines.push(cur); cur = ''; }
          lines.push(w.slice(0, cut)); w = w.slice(cut);
        }
        const trial = cur ? `${cur} ${w}` : w;
        if (width(trial, font, size) <= maxW) cur = trial;
        else { if (cur) lines.push(cur); cur = w; }
      });
      lines.push(cur);
    });
    return lines;
  };

  const lineH = (size) => size * s.lineHeight;
  const paragraph = (text, { font = reg, size = base, color = INK, indent = 0 } = {}) =>
    wrap(text, font, size, W - indent).map((t) => ({ segs: [{ t, font, size, color }], h: lineH(size), x: indent }));

  let page; let y;
  const newPage = () => { page = doc.addPage([PW, PH]); y = PH - M; };
  newPage();

  const addLink = (pg, x, yb, w, h, url) => {
    const ref = doc.context.register(doc.context.obj({
      Type: 'Annot', Subtype: 'Link', Rect: [x, yb, x + w, yb + h], Border: [0, 0, 0],
      A: { Type: 'Action', S: 'URI', URI: PDFString.of(url) },
    }));
    page.node.addAnnot(ref);
  };

  const drawLine = (line) => {
    const size = Math.max(...line.segs.map((g) => g.size));
    const baseline = y - size;
    let x = M + (line.x || 0);
    if (line.center) x = M + (W - line.segs.reduce((a, g) => a + width(g.t, g.font, g.size), 0)) / 2;
    line.segs.forEach((g) => {
      page.drawText(g.t, { x, y: baseline, size: g.size, font: g.font, color: g.color });
      const w = width(g.t, g.font, g.size);
      if (g.url) addLink(page, x, baseline - g.size * 0.2, w, g.size * 1.15, g.url);
      x += w;
    });
    if (line.right) {
      const rw = width(line.right.t, line.right.font, line.right.size);
      page.drawText(line.right.t, { x: M + W - rw, y: baseline, size: line.right.size, font: line.right.font, color: line.right.color });
    }
    if (line.rule) {
      page.drawLine({ start: { x: M, y: y - line.h + 2 }, end: { x: M + W, y: y - line.h + 2 }, thickness: 0.7, color: accent });
    }
    y -= line.h;
  };

  // Place a block of lines. A block that fits on one page is never split across pages.
  const place = (lines, gapAfter = 0) => {
    const total = lines.reduce((a, l) => a + l.h, 0);
    const pageCap = PH - 2 * M;
    if (total <= pageCap && y - total < M && y < PH - M - 0.5) newPage();
    lines.forEach((l) => { if (y - l.h < M - 0.01) newPage(); drawLine(l); });
    y -= gapAfter;
  };

  // ---- header ----
  const name = clean(str(d.userName) || 'Your Name');
  const headerLines = [{ segs: [{ t: name, font: bold, size: base * 2.1, color: INK }], h: base * 2.1 * 1.2 }];
  if (str(d.userSubtitle)) headerLines.push(...paragraph(str(d.userSubtitle), { size: base * 1.15, color: GREY }));
  const parts = [];
  if (str(d.location?.value)) parts.push({ t: clean(str(d.location.value)) });
  if (str(d.links?.email)) parts.push({ t: clean(str(d.links.email)), url: asciiUrl(`mailto:${str(d.links.email)}`) });
  const linkPart = (u) => { const sUrl = asciiUrl(safeUrl(u)); return sUrl ? { t: clean(shortUrl(sUrl)), url: sUrl } : null; };
  [d.links?.linkedin, d.links?.github, d.portfolioLink?.showOnPage !== false ? d.portfolioLink?.value : ''].forEach((u) => { const p = linkPart(u); if (p) parts.push(p); });
  const sep = ' | ';
  let row = []; let rowW = 0;
  const flush = () => { if (row.length) headerLines.push({ segs: row, h: lineH(base) }); row = []; rowW = 0; };
  parts.forEach((p, i) => {
    const pw = width(p.t, reg, base) + (row.length ? width(sep, reg, base) : 0);
    if (rowW + pw > W) flush();
    if (row.length) row.push({ t: sep, font: reg, size: base, color: GREY });
    row.push({ t: p.t, font: reg, size: base, color: p.url ? accent : INK, url: p.url });
    rowW += pw;
    if (i === parts.length - 1) flush();
  });
  place(headerLines, base * 0.9);

  // ---- sections ----
  const sections = collectSections(d, s);
  sections.forEach((sec) => {
    const title = clean(sec.id === 'customSections' ? sec.title : SECTION_LABELS[sec.id]).toUpperCase();
    const heading = { segs: [{ t: title, font: bold, size: base * 1.05, color: accent }], h: lineH(base) + 4, rule: true };
    let blocks;
    if (sec.inline) {
      blocks = [paragraph(sec.inline.join(', '))];
    } else {
      blocks = sec.entries.map((en) => {
        const lines = [];
        if (en.title) {
          const right = en.meta ? { t: clean(en.meta), font: reg, size: base, color: GREY } : null;
          const titleW = right ? W - width(right.t, reg, base) - 8 : W;
          wrap(en.title, bold, base, titleW).forEach((t, i) => lines.push({ segs: [{ t, font: bold, size: base, color: INK }], h: lineH(base), right: i === 0 ? right : null }));
        }
        if (en.body) lines.push(...paragraph(en.body, { color: en.title ? INK : INK }));
        if (en.links?.length) {
          const segs = [];
          en.links.forEach(([label, url], i) => {
            if (i) segs.push({ t: sep, font: reg, size: base, color: GREY });
            segs.push({ t: `${label}: `, font: reg, size: base, color: GREY });
            segs.push({ t: clean(shortUrl(url)), font: reg, size: base, color: accent, url });
          });
          lines.push({ segs, h: lineH(base) });
        }
        return lines;
      }).filter((l) => l.length);
    }
    if (!blocks.length) return;
    // The heading travels with the first entry so a title is never stranded at the bottom of a page.
    place([heading, ...blocks[0]], blocks.length > 1 ? base * 0.55 : base * 0.9);
    blocks.slice(1).forEach((b, i) => place(b, i === blocks.length - 2 ? base * 0.9 : base * 0.55));
  });

  doc.setTitle(`${name} - Resume`);
  doc.setAuthor(name);
  doc.setCreator('Portfolio Forge');
  doc.setProducer('Portfolio Forge (pdf-lib)');
  doc.setSubject('Resume');
  const bytes = await doc.save();
  return { bytes, pageCount: doc.getPageCount() };
}

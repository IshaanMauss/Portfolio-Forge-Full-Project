// GitHub -> portfolio project import (public repositories only, no sign-in, read-only).
//
// Safety rules (see docs/GITHUB_IMPORT.md):
//  * Only the public GitHub REST API is called, from the user's browser, with the user's selection.
//  * We read: repo metadata, README, root file listing, package.json / requirements.txt, languages.
//  * Nothing is executed, no external links are followed, no .env or source files are read.
//  * Repository text is untrusted DATA. It is stripped to plain text and never used as instructions.

const API = 'https://api.github.com';
export const MAX_REPOS = 5;
export const USERNAME_RE = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;

export class GitHubError extends Error {
  constructor(code, message) { super(message); this.code = code; }
}

async function gh(path, { raw = false, optional = false } = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: { Accept: raw ? 'application/vnd.github.raw+json' : 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' },
  });
  if (res.status === 404 && optional) return null;
  if (res.status === 404) throw new GitHubError('notfound', 'GitHub user or repository not found.');
  if (res.status === 403 || res.status === 429) throw new GitHubError('rate', 'GitHub is limiting requests from your network right now. Please try again in a few minutes.');
  if (!res.ok) throw new GitHubError('http', `GitHub returned an error (${res.status}).`);
  return raw ? res.text() : res.json();
}

const slim = (r) => ({
  name: r.name, fullName: r.full_name, owner: r.owner?.login || '', description: r.description || '',
  language: r.language || '', topics: Array.isArray(r.topics) ? r.topics.slice(0, 12) : [],
  stars: r.stargazers_count || 0, forks: r.forks_count || 0, fork: !!r.fork, archived: !!r.archived,
  homepage: r.homepage || '', htmlUrl: r.html_url, updatedAt: r.pushed_at || r.updated_at, hasLicense: !!r.license,
});

export async function listRepos(username) {
  const u = String(username || '').trim().replace(/^@/, '');
  if (!USERNAME_RE.test(u)) throw new GitHubError('invalid', 'That does not look like a GitHub username.');
  const data = await gh(`/users/${encodeURIComponent(u)}/repos?per_page=100&sort=pushed&type=owner`);
  return data.map(slim);
}

export async function analyseRepo(repo) {
  const base = `/repos/${repo.fullName}`;
  const [readmeRaw, contents, languages] = await Promise.all([
    gh(`${base}/readme`, { raw: true, optional: true }),
    gh(`${base}/contents`, { optional: true }),
    gh(`${base}/languages`, { optional: true }),
  ]);
  const files = Array.isArray(contents) ? contents.map((c) => c.name) : [];
  let pkg = null;
  if (files.includes('package.json')) {
    const txt = await gh(`${base}/contents/package.json`, { raw: true, optional: true });
    try { pkg = txt ? JSON.parse(txt) : null; } catch (e) { pkg = null; }
  }
  let requirements = '';
  if (files.includes('requirements.txt')) requirements = (await gh(`${base}/contents/requirements.txt`, { raw: true, optional: true })) || '';
  return buildAnalysis(repo, { readme: (readmeRaw || '').slice(0, 40000), files, pkg, requirements, languages: languages || {} });
}

// ---------- pure analysis (unit-tested) ----------

const NPM_TECH = {
  react: 'React', 'react-dom': 'React', next: 'Next.js', vue: 'Vue', nuxt: 'Nuxt', '@angular/core': 'Angular', svelte: 'Svelte',
  express: 'Express', fastify: 'Fastify', '@nestjs/core': 'NestJS', 'socket.io': 'Socket.IO', ws: 'WebSockets',
  mongoose: 'MongoDB', mongodb: 'MongoDB', prisma: 'Prisma', '@prisma/client': 'Prisma', pg: 'PostgreSQL', mysql2: 'MySQL',
  firebase: 'Firebase', tailwindcss: 'Tailwind CSS', three: 'Three.js', redux: 'Redux', '@reduxjs/toolkit': 'Redux',
  graphql: 'GraphQL', stripe: 'Stripe', jsonwebtoken: 'JWT authentication', typescript: 'TypeScript', jest: 'Jest',
  vitest: 'Vitest', mocha: 'Mocha', playwright: 'Playwright', '@playwright/test': 'Playwright', cypress: 'Cypress',
  vite: 'Vite', electron: 'Electron', 'react-native': 'React Native', 'framer-motion': 'Framer Motion',
};
const TEST_TECH = new Set(['Jest', 'Vitest', 'Mocha', 'Playwright', 'Cypress']);
const PY_TECH = { flask: 'Flask', django: 'Django', fastapi: 'FastAPI', numpy: 'NumPy', pandas: 'Pandas', 'scikit-learn': 'scikit-learn', tensorflow: 'TensorFlow', torch: 'PyTorch', pytest: 'pytest', sqlalchemy: 'SQLAlchemy', requests: 'Requests' };
const FILE_TECH = [
  [/^dockerfile$/i, 'Docker'], [/^docker-compose\.ya?ml$/i, 'Docker Compose'], [/^go\.mod$/, 'Go'], [/^cargo\.toml$/i, 'Rust'],
  [/^pom\.xml$|^build\.gradle(\.kts)?$/i, 'Java'], [/^pyproject\.toml$|^requirements\.txt$/i, 'Python'], [/^tsconfig\.json$/i, 'TypeScript'],
  [/^vercel\.json$/i, 'Vercel'], [/^netlify\.toml$/i, 'Netlify'], [/^firebase\.json$/i, 'Firebase'],
];
const README_TECH = ['React', 'Node.js', 'Python', 'Django', 'Flask', 'FastAPI', 'MongoDB', 'PostgreSQL', 'MySQL', 'SQLite', 'Firebase', 'Docker', 'TensorFlow', 'PyTorch', 'OpenCV', 'Flutter', 'Kotlin', 'Swift', 'Unity', 'REST API', 'GraphQL', 'Tailwind', 'Bootstrap', 'Redis', 'AWS'];

export function stripMarkdown(md) {
  return md
    .replace(/<!--[\s\S]*?-->/g, ' ').replace(/<[^>]+>/g, ' ').replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[`*_>#~|]/g, '').replace(/\s+/g, ' ').trim();
}

// First real prose paragraph of a README (skips headings, badges, images, code, tables).
export function firstParagraph(readme, max = 320) {
  const blocks = readme.replace(/\r/g, '').split(/\n\s*\n/);
  for (const b of blocks) {
    const t = b.trim();
    if (!t || /^#{1,6}\s/.test(t) || /^(\[!\[|!\[|<img|<p align|<div|<br|```|\||---|===)/i.test(t)) continue;
    const text = stripMarkdown(t);
    if (text.split(' ').length >= 6) return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
  }
  return '';
}

const add = (map, name, why) => { if (!map.has(name)) map.set(name, []); if (!map.get(name).includes(why)) map.get(name).push(why); };

export function detectTech({ readme, pkg, files, requirements, languages, topics = [] }) {
  const map = new Map();
  if (pkg) {
    const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
    Object.keys(deps).forEach((d) => { if (NPM_TECH[d]) add(map, NPM_TECH[d], `package.json lists "${d}"`); });
    add(map, 'Node.js', 'package.json present');
  }
  (requirements || '').split('\n').forEach((line) => {
    const name = line.trim().split(/[=<>~[ ;]/)[0].toLowerCase();
    if (PY_TECH[name]) add(map, PY_TECH[name], `requirements.txt lists "${name}"`);
  });
  (files || []).forEach((f) => FILE_TECH.forEach(([re, tech]) => { if (re.test(f)) add(map, tech, `${f} found in repository root`); }));
  Object.keys(languages || {}).slice(0, 4).forEach((l) => add(map, l, 'GitHub language statistics'));
  const plain = stripMarkdown(readme || '');
  README_TECH.forEach((t) => { if (new RegExp(`(^|[^A-Za-z])${t.replace(/[.+]/g, '\\$&')}([^A-Za-z]|$)`, 'i').test(plain)) add(map, t, 'mentioned in README'); });
  topics.slice(0, 8).forEach((t) => add(map, t.replace(/-/g, ' '), 'repository topic'));
  return [...map.entries()].map(([name, evidence]) => ({ name, evidence, test: TEST_TECH.has(name) }));
}

export function buildAnalysis(repo, { readme, files, pkg, requirements, languages }) {
  const tech = detectTech({ readme, pkg, files, requirements, languages, topics: repo.topics });
  const hasTests = tech.some((t) => t.test) || (files || []).some((f) => /^(tests?|__tests__|spec|e2e)$/i.test(f));
  const hasCI = (files || []).includes('.github');
  const plain = stripMarkdown(readme || '');
  const summary = firstParagraph(readme || '') || repo.description || '';
  const readiness = [
    { id: 'readme', label: 'README with real content', ok: plain.length >= 300 },
    { id: 'install', label: 'Install / usage instructions', ok: /(^|\n)#{1,4}\s*(install|getting started|setup|usage|quick ?start|run)/i.test(readme || '') },
    { id: 'demo', label: 'Live demo link', ok: /^https?:\/\//i.test(repo.homepage) },
    { id: 'license', label: 'Licence', ok: repo.hasLicense },
    { id: 'tests', label: 'Automated tests', ok: hasTests },
    { id: 'ci', label: 'CI workflow (.github)', ok: hasCI },
    { id: 'topics', label: 'Topics / description', ok: repo.topics.length > 0 || !!repo.description },
  ];
  return { repo, summary, tech, hasTests, hasCI, readiness, readmeChars: plain.length };
}

export function authorship(repo, role, username) {
  if (repo.fork) return { level: 'low', note: 'This is a fork. Describe only what you changed yourself.' };
  if (role === 'team' || role === 'open-source') return { level: 'medium', note: 'Team or open-source work: your own contribution should be stated clearly.' };
  if (repo.owner && username && repo.owner.toLowerCase() === username.toLowerCase()) return { level: 'high', note: 'Original repository owned by you.' };
  return { level: 'medium', note: 'Ownership could not be confirmed.' };
}

const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);
const sentence = (s) => { const t = s.trim().replace(/\s+/g, ' '); return /[.!?]$/.test(t) ? t : `${t}.`; };
const list = (a) => (a.length <= 1 ? a.join('') : `${a.slice(0, -1).join(', ')} and ${a[a.length - 1]}`);
const prettyName = (n) => n.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

/**
 * Each bullet = { text, source: 'repo' | 'you', evidence: string[] }.
 * Nothing is invented: repo bullets only restate detected facts; user bullets are the user's own words.
 */
export function generateBullets(analysis, answers = {}) {
  const { repo, tech, hasTests, hasCI, summary } = analysis;
  const role = answers.role || 'solo';
  const names = tech.filter((t) => !t.test && t.evidence.some((e) => !/topic|README/.test(e) || t.evidence.length > 1)).map((t) => t.name);
  const stack = [...new Set(names)].slice(0, 5);
  const verb = { solo: 'Built', coursework: 'Developed', team: 'Contributed to', 'open-source': 'Contributed to' }[role] || 'Built';
  const out = [];
  const what = summary ? summary.replace(/^[A-Z]/, (c) => c.toLowerCase()).replace(/\.$/, '').slice(0, 140) : prettyName(repo.name);
  if (stack.length) {
    out.push({ source: 'repo', text: sentence(`${verb} ${summary ? `a project (${what})` : prettyName(repo.name)} using ${list(stack)}`), evidence: tech.filter((t) => stack.includes(t.name)).flatMap((t) => t.evidence.map((e) => `${t.name}: ${e}`)).slice(0, 6) });
  } else if (summary) {
    out.push({ source: 'repo', text: sentence(`${verb} ${prettyName(repo.name)}: ${what}`), evidence: ['Repository description / README'] });
  }
  if (hasTests || hasCI) {
    const testTech = tech.filter((t) => t.test).map((t) => t.name);
    const parts = [hasTests ? `automated tests${testTech.length ? ` (${list(testTech)})` : ''}` : '', hasCI ? 'a GitHub Actions workflow' : ''].filter(Boolean);
    out.push({ source: 'repo', text: sentence(`${role === 'solo' || role === 'coursework' ? 'Added' : 'Project includes'} ${list(parts)}`), evidence: [hasTests ? 'Test tooling or a tests folder found' : '', hasCI ? '.github folder found in repository root' : ''].filter(Boolean) });
  }
  if (answers.contribution?.trim()) out.push({ source: 'you', text: sentence(cap(answers.contribution)), evidence: ['Your answer: what you built'] });
  if (answers.challenge?.trim()) out.push({ source: 'you', text: sentence(`Solved ${answers.challenge.trim().replace(/^solved\s+/i, '')}`), evidence: ['Your answer: hardest problem'] });
  if (answers.outcome?.trim()) out.push({ source: 'you', text: sentence(cap(answers.outcome)), evidence: ['Your answer: measurable outcome'] });
  return out;
}

export function toProjectItem(analysis, bullets, liveUrl) {
  const { repo, tech } = analysis;
  return {
    title: prettyName(repo.name).slice(0, 100),
    keywords: tech.filter((t) => !t.test).map((t) => t.name).slice(0, 8).join(', '),
    description: bullets.map((b) => b.text).join(' ').slice(0, 900),
    githubUrl: repo.htmlUrl,
    liveUrl: /^https?:\/\//i.test(liveUrl || '') ? liveUrl : '',
  };
}

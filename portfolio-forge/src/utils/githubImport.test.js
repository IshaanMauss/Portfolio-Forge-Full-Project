import { firstParagraph, detectTech, buildAnalysis, generateBullets, toProjectItem, authorship, stripMarkdown, USERNAME_RE, FULLNAME_RE, safeHttpUrl } from './githubImport';

const repo = { name: 'realtime-chat-app', fullName: 'jane/realtime-chat-app', owner: 'jane', description: '', language: 'JavaScript', topics: ['chat'], stars: 3, forks: 0, fork: false, archived: false, homepage: 'https://chat.example.com', htmlUrl: 'https://github.com/jane/realtime-chat-app', hasLicense: true };
const readme = `# Realtime Chat\n\n[![build](x.svg)](y)\n\nA real-time messaging application where friends can create rooms and talk instantly with typing indicators.\n\n## Installation\nnpm install\n`;
const pkg = { dependencies: { react: '^19', express: '^4', 'socket.io': '^4', mongoose: '^8' }, devDependencies: { jest: '^29' } };
const analysis = buildAnalysis(repo, { readme, files: ['package.json', 'README.md', '.github', 'LICENSE'], pkg, requirements: '', languages: { JavaScript: 1000 } });

test('first paragraph skips headings and badges', () => {
  expect(firstParagraph(readme)).toMatch(/^A real-time messaging application/);
  expect(firstParagraph('# Title\n\n![img](a.png)\n')).toBe('');
});

test('detects technologies with evidence', () => {
  const t = Object.fromEntries(analysis.tech.map((x) => [x.name, x.evidence]));
  expect(Object.keys(t)).toEqual(expect.arrayContaining(['React', 'Express', 'Socket.IO', 'MongoDB', 'Jest']));
  expect(t.React[0]).toMatch(/package\.json/);
  expect(analysis.hasTests).toBe(true);
  expect(analysis.hasCI).toBe(true);
  expect(analysis.readiness.find((r) => r.id === 'demo').ok).toBe(true);
});

test('bullets only restate evidence or the user\'s own words', () => {
  const b = generateBullets(analysis, { role: 'solo', contribution: 'implemented rooms and typing indicators' });
  expect(b[0].text).toMatch(/^Built .* using .*React/);
  expect(b.some((x) => x.source === 'you' && /rooms and typing/.test(x.text))).toBe(true);
  expect(b.every((x) => x.evidence.length > 0)).toBe(true);
  expect(b.map((x) => x.text).join(' ')).not.toMatch(/users|revenue|%/);
});

test('team role changes the verb; forks are low confidence', () => {
  expect(generateBullets(analysis, { role: 'team' })[0].text).toMatch(/^Contributed to/);
  expect(authorship({ ...repo, fork: true }, 'solo', 'jane').level).toBe('low');
  expect(authorship(repo, 'solo', 'jane').level).toBe('high');
});

test('project item and untrusted text handling', () => {
  const item = toProjectItem(analysis, generateBullets(analysis, {}), repo.homepage);
  expect(item.title).toBe('Realtime Chat App');
  expect(item.githubUrl).toBe(repo.htmlUrl);
  expect(stripMarkdown('<script>alert(1)</script> hi [x](javascript:alert(1))')).not.toMatch(/[<>]/);
  expect(USERNAME_RE.test('jane-doe')).toBe(true);
  expect(USERNAME_RE.test('../etc')).toBe(false);
});

test('detectTech handles empty input', () => {
  expect(detectTech({ readme: '', files: [], languages: {} })).toEqual([]);
});

test('repository names and URLs are validated before use', () => {
  expect(FULLNAME_RE.test('jane/chat-app')).toBe(true);
  expect(FULLNAME_RE.test('jane/../../admin')).toBe(false);
  expect(FULLNAME_RE.test('jane/app?x=1')).toBe(false);
  expect(safeHttpUrl('https://example.com/a')).toBe('https://example.com/a');
  expect(safeHttpUrl('javascript:alert(1)')).toBe('');
  expect(safeHttpUrl('https://x.com/"onmouseover=1')).toBe('');
});

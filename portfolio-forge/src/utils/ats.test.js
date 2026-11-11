import { scoreResume, jobKeywords, jobPhrases } from './ats';

const good = `Jane Doe
jane@doe.com | +91 98765 43210 | linkedin.com/in/janedoe | github.com/janedoe
Summary
Backend engineer building reliable systems with Python and React and PostgreSQL for several years across teams.
Experience
Acme Corp Jan 2022 - Present
• Built a billing service in Python that cut invoice errors by 40%
• Led a team of 5 engineers to ship a React dashboard used by 12000 users
• Reduced API latency by 35% by adding Redis caching
Education
B.Tech Computer Science 2018 - 2022
Skills
Python, React, PostgreSQL, Redis, Docker, AWS, Kubernetes, REST, CI/CD, Testing, Git, Linux, Node, SQL, TypeScript`;
const docOf = (text, extra = {}) => ({ text: text + ' filler'.repeat(60), lines: text.split('\n'), pageCount: 1, multiColumnRatio: 0, ...extra });

test('good resume scores high', () => {
  const r = scoreResume(docOf(good));
  expect(r.score).toBeGreaterThanOrEqual(75);
  expect(r.checks.find((c) => c.id === 'contact').status).toBe('pass');
});

test('image-only pdf is flagged', () => {
  const r = scoreResume({ text: '', lines: [], pageCount: 1 });
  expect(r.checks.find((c) => c.id === 'text').status).toBe('fail');
  expect(r.score).toBeLessThan(40);
});

test('job description match reports missing keywords', () => {
  const jd = 'We need a Kubernetes and Terraform expert with Python, Terraform and Go experience. Terraform Terraform Go Go.';
  const r = scoreResume(docOf(good), jd);
  expect(r.keywords.missing).toContain('terraform');
  expect(r.keywords.matched).toContain('python');
  expect(jobKeywords(jd)[0]).toBe('terraform');
});

test('multi-column layout is penalised', () => {
  const a = scoreResume(docOf(good, { multiColumnRatio: 0.6 }));
  const b = scoreResume(docOf(good));
  expect(a.score).toBeLessThan(b.score);
});

test('multi-word phrases are matched and evidence is separated from skills-only', () => {
  const jd = 'You will build a REST API with machine learning models. Machine learning experience and REST API design needed. Kubernetes helps.';
  expect(jobPhrases(jd)).toEqual(expect.arrayContaining(['machine learning', 'rest api']));
  const r = scoreResume(docOf(good + '\nmachine learning'), jd);
  expect(r.keywords.matched).toContain('machine learning');
  expect(r.keywords.skillsOnly).toContain('machine learning');
});

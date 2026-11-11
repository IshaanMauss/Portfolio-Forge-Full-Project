import { parseResume, splitSections, groupEntries } from './resumeImport';

const LINES = `JANE DOE
Full Stack Developer
jane.doe@example.com | +91 98765 43210 | linkedin.com/in/janedoe | github.com/janedoe
SUMMARY
Backend-leaning engineer who builds reliable web apps with Python and React, and enjoys turning messy requirements into clean systems.
EXPERIENCE
Acme Corp — Software Engineer Jan 2022 - Present
• Built a billing service that cut invoice errors by 40%
• Led a team of 5 engineers
Beta Labs — Intern Jun 2021 - Aug 2021
• Wrote tests for a payments API
EDUCATION
Indian Institute of Technology Kharagpur
B.Tech Computer Science 2018 - 2022
SKILLS
Languages: Python, JavaScript, SQL
Tools: Docker, Git, Redis
PROJECTS
Portfolio Forge github.com/janedoe/forge
• Free portfolio builder with ATS tools and 3D hero
Chat App
• Realtime chat using websockets
CERTIFICATIONS
AWS Cloud Practitioner`.split('\n');

test('parses contact details and name', () => {
  const r = parseResume(LINES);
  expect(r.name).toBe('JANE DOE');
  expect(r.email).toBe('jane.doe@example.com');
  expect(r.linkedin).toContain('linkedin.com/in/janedoe');
  expect(r.github).toContain('github.com/janedoe');
  expect(r.phone.replace(/\D/g, '')).toContain('9876543210');
  expect(r.headline).toBe('Full Stack Developer');
});

test('splits sections and entries', () => {
  const s = splitSections(LINES);
  expect(Object.keys(s)).toEqual(expect.arrayContaining(['summary', 'experience', 'education', 'skills', 'projects', 'certifications']));
  const r = parseResume(LINES);
  expect(r.experience).toHaveLength(2);
  expect(r.experience[0].content).toContain('40%');
  expect(r.projects).toHaveLength(2);
  expect(r.projects[0].githubUrl).toContain('github.com/janedoe/forge');
});

test('extracts skills, education and certifications', () => {
  const r = parseResume(LINES);
  expect(r.skills).toEqual(expect.arrayContaining(['Python', 'Docker', 'Redis']));
  expect(r.education.name).toMatch(/Kharagpur/);
  expect(r.education.gradYear).toBe('2022');
  expect(r.certifications[0].name).toMatch(/AWS/);
});

test('empty input does not crash', () => {
  const r = parseResume([]);
  expect(r.name).toBe('');
  expect(r.skills).toEqual([]);
  expect(groupEntries([])).toEqual([]);
});

import { resumeUpdates, projectUpdates } from './applyImport';

const portfolio = { hardSkills: { items: ['Python'] }, projects: { items: [{ title: 'Chat App' }] }, customSections: { title: 'Custom Section', items: [] }, certifications: { items: [] } };
const parsed = { name: 'Jane', headline: '', summary: 'x'.repeat(50), email: 'j@x.com', linkedin: '', github: '', skills: ['python', 'Docker'], education: { name: 'IIT', course: '', gradYear: '2022' }, experience: [{ title: 'Acme', content: '• did' }], projects: [{ title: 'chat app' }, { title: 'New' }], certifications: [] };

test('only picked groups are applied and lists merge without duplicates', () => {
  const u = Object.fromEntries(resumeUpdates(portfolio, parsed, ['name', 'skills', 'projects', 'experience', 'education']));
  expect(u.userName).toBe('Jane');
  expect(u['hardSkills.items']).toEqual(['Python', 'Docker']);
  expect(u['projects.items'].map((p) => p.title)).toEqual(['New', 'Chat App']);
  expect(u['customSections.title']).toBe('Experience');
  expect(u['education.college.gradYear']).toBe('2022');
  expect(u.bio).toBeUndefined();
});

test('project updates add skills once', () => {
  const u = Object.fromEntries(projectUpdates(portfolio, [{ title: 'Z' }], ['React', 'python']));
  expect(u['hardSkills.items']).toEqual(['Python', 'React']);
});

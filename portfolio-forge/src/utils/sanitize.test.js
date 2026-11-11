import { sanitizeForPublic } from './sanitize';

const sample = () => ({
  userName: 'A',
  address: { value: '12 Secret St', showOnPage: true },
  profilePicDataUrl: 'data:image/png;base64,AAAA',
  location: { value: 'Pune', showOnPage: false },
  hardSkills: { showOnPage: false, items: ['Hidden'] },
  projects: { showOnPage: true, items: [{ title: 'P' }] },
  education: {
    college: { name: 'C', course: 'X', gradYear: '2026', showOnPage: true },
    class12: { school: 'S', percentage: '99', board: 'B', passingYear: '2020', showOnPage: false },
  },
});

test('removes private and hidden data', () => {
  const out = sanitizeForPublic(sample());
  expect(out.address).toBeUndefined();
  expect(out.profilePicDataUrl).toBeUndefined();
  expect(out.location.value).toBe('');
  expect(out.hardSkills.items).toEqual([]);
  expect(out.education.class12.school).toBe('');
  expect(out.education.class12.percentage).toBe('');
});

test('keeps visible data and does not mutate the input', () => {
  const input = sample();
  const out = sanitizeForPublic(input);
  expect(out.projects.items).toHaveLength(1);
  expect(out.education.college.name).toBe('C');
  expect(input.address.value).toBe('12 Secret St');
});

test('keeps a hidden-on-page section that is switched on for the resume', () => {
  const data = { ...sample(), blogPosts: { showOnPage: false, showOnResume: true, items: [{ title: 'T', content: 'c' }] }, customSections: { showOnPage: false, items: [{ title: 'X' }] } };
  const out = sanitizeForPublic(data);
  expect(out.blogPosts.items).toHaveLength(1);
  expect(out.customSections.items).toEqual([]);
});

import { newJob, setStatus, daysUntil, needsFollowUp, counts, toCsv, normalizeJobs, MAX_JOBS } from './tracker';

test('newJob clamps and validates', () => {
  const j = newJob({ company: 'A'.repeat(500), deadline: 'tomorrow', status: 'bogus' });
  expect(j.company.length).toBe(80);
  expect(j.deadline).toBe('');
  expect(j.status).toBe('saved');
});

test('status changes record when you applied; follow-up after a week', () => {
  const j = setStatus(newJob({ company: 'X' }), 'applied');
  expect(j.appliedAt).toBeGreaterThan(0);
  expect(needsFollowUp(j)).toBe(false);
  expect(needsFollowUp({ ...j, appliedAt: Date.now() - 9 * 86400000 })).toBe(true);
  expect(setStatus(j, 'nope')).toBe(j);
});

test('deadline countdown and counts', () => {
  const now = new Date('2026-11-11T10:00:00').getTime();
  expect(daysUntil('2026-11-13', now)).toBe(3);
  expect(daysUntil('', now)).toBeNull();
  expect(counts([newJob({ status: 'offer' }), newJob({})]).offer).toBe(1);
});

test('csv neutralises spreadsheet formulas and quotes', () => {
  const csv = toCsv([newJob({ company: '=HYPERLINK("x")', role: 'Dev, "Sr"' })]);
  expect(csv).toContain(`"'=HYPERLINK(""x"")"`);
  expect(csv).toContain('"Dev, ""Sr"""');
});

test('normalizeJobs caps size and tolerates junk', () => {
  expect(normalizeJobs(null)).toEqual([]);
  expect(normalizeJobs(Array.from({ length: MAX_JOBS + 50 }, () => ({ company: 'c' })))).toHaveLength(MAX_JOBS);
});

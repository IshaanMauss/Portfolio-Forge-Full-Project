export const STATUSES = [
  ['saved', 'Saved'], ['applied', 'Applied'], ['interview', 'Interview'], ['offer', 'Offer'], ['rejected', 'Rejected'],
];
export const MAX_JOBS = 200;
const L = { company: 80, role: 100, url: 400, notes: 1500 };

const cut = (v, n) => String(v ?? '').slice(0, n);

export function newJob(input = {}) {
  const status = STATUSES.some(([k]) => k === input.status) ? input.status : 'saved';
  const now = Date.now();
  return {
    id: input.id || `j${now.toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    company: cut(input.company, L.company).trim(), role: cut(input.role, L.role).trim(),
    url: cut(input.url, L.url).trim(), notes: cut(input.notes, L.notes),
    deadline: /^\d{4}-\d{2}-\d{2}$/.test(input.deadline || '') ? input.deadline : '',
    status, appliedAt: input.appliedAt || (status === 'applied' ? now : 0), updatedAt: now,
  };
}

export function setStatus(job, status) {
  if (!STATUSES.some(([k]) => k === status)) return job;
  return { ...job, status, appliedAt: job.appliedAt || (status !== 'saved' ? Date.now() : 0), updatedAt: Date.now() };
}

export const daysUntil = (deadline, now = Date.now()) => {
  if (!deadline) return null;
  const d = new Date(`${deadline}T23:59:59`).getTime();
  return Math.ceil((d - now) / 86400000);
};

export const needsFollowUp = (job, now = Date.now()) =>
  job.status === 'applied' && job.appliedAt > 0 && now - job.appliedAt > 7 * 86400000;

export const counts = (jobs) => Object.fromEntries(STATUSES.map(([k]) => [k, jobs.filter((j) => j.status === k).length]));

const csvCell = (v) => { const s = String(v ?? ''); const safe = /^[=+\-@]/.test(s) ? `'${s}` : s; return `"${safe.replace(/"/g, '""')}"`; };
export const toCsv = (jobs) =>
  ['Company,Role,Status,Deadline,Link,Notes', ...jobs.map((j) => [j.company, j.role, j.status, j.deadline, j.url, j.notes].map(csvCell).join(','))].join('\n');

// Sanitise whatever comes back from the database.
export const normalizeJobs = (raw) => (Array.isArray(raw) ? raw.slice(0, MAX_JOBS).map((j) => ({ ...newJob(j), updatedAt: j.updatedAt || 0 })) : []);

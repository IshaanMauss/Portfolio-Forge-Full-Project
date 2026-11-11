import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { db } from '../firebase/config';
import { safeUrl } from '../utils/escape';
import { STATUSES, MAX_JOBS, newJob, setStatus, daysUntil, needsFollowUp, counts, toCsv, normalizeJobs } from '../utils/tracker';
import '../components/Tools.css';
import '../components/Tracker.css';

function Tracker({ user }) {
  const [jobs, setJobs] = useState(null);
  const [form, setForm] = useState({ company: '', role: '', url: '', deadline: '' });
  const [filter, setFilter] = useState('all');
  const saveTimer = useRef(null);
  const loaded = useRef(false);

  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, 'tracker', user.uid))
      .then((s) => { setJobs(normalizeJobs(s.exists() ? s.data().jobs : [])); loaded.current = true; })
      .catch(() => { toast.error('Could not load your tracker.'); setJobs([]); });
  }, [user]);

  // Debounced save: one write per burst of edits.
  useEffect(() => {
    if (!user || !loaded.current || jobs === null) return undefined;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      setDoc(doc(db, 'tracker', user.uid), { jobs: JSON.parse(JSON.stringify(jobs)) }).catch(() => toast.error('Could not save changes.'));
    }, 1500);
    return () => clearTimeout(saveTimer.current);
  }, [jobs, user]);

  if (!user) return <main className="tool-page"><h1>Job tracker</h1><p className="muted">Sign in to track applications.</p><Link to="/" className="pe-btn primary">Go to sign in</Link></main>;
  if (jobs === null) return <div className="loading-screen">Loading tracker…</div>;

  const add = (e) => {
    e.preventDefault();
    if (!form.company.trim() && !form.role.trim()) { toast.info('Add a company or role.'); return; }
    if (jobs.length >= MAX_JOBS) { toast.warn(`The tracker holds up to ${MAX_JOBS} jobs.`); return; }
    setJobs([newJob(form), ...jobs]);
    setForm({ company: '', role: '', url: '', deadline: '' });
  };
  const patch = (id, fn) => setJobs(jobs.map((j) => (j.id === id ? { ...fn(j), updatedAt: Date.now() } : j)));
  const remove = (id) => setJobs(jobs.filter((j) => j.id !== id));
  const exportCsv = () => {
    const url = URL.createObjectURL(new Blob([toCsv(jobs)], { type: 'text/csv' }));
    const a = document.createElement('a'); a.href = url; a.download = 'job-applications.csv'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 4000);
  };
  const c = counts(jobs);
  const shown = jobs.filter((j) => filter === 'all' || j.status === filter);

  return (
    <main className="tool-page">
      <title>Job tracker | Portfolio Forge</title>
      <header className="tool-head rise"><h1>Job tracker</h1><p>Keep every application, deadline and follow-up in one place. Private to you.</p></header>

      <form className="tool-card tracker-form rise" onSubmit={add} style={{ '--d': '60ms' }}>
        <input type="text" placeholder="Company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} aria-label="Company" maxLength={80} />
        <input type="text" placeholder="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} aria-label="Role" maxLength={100} />
        <input type="text" placeholder="Job link (optional)" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} aria-label="Job link" maxLength={400} />
        <input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} aria-label="Deadline" />
        <button type="submit" className="pe-btn primary">Add job</button>
      </form>

      <div className="tracker-filters" role="tablist" aria-label="Filter by status">
        <button type="button" className={`pe-btn${filter === 'all' ? ' active' : ''}`} onClick={() => setFilter('all')}>All ({jobs.length})</button>
        {STATUSES.map(([k, label]) => <button key={k} type="button" className={`pe-btn${filter === k ? ' active' : ''}`} onClick={() => setFilter(k)}>{label} ({c[k]})</button>)}
        <button type="button" className="pe-btn" onClick={exportCsv} disabled={!jobs.length}>Export CSV</button>
      </div>

      {shown.length === 0 && <p className="muted">{jobs.length ? 'Nothing in this status.' : 'No jobs yet. Add your first one above, then try the '}{!jobs.length && <Link to="/tools/ats">ATS checker</Link>}{!jobs.length && ' on your resume.'}</p>}
      <ul className="job-list">
        {shown.map((j) => {
          const d = daysUntil(j.deadline);
          const link = safeUrl(j.url);
          return (
            <li key={j.id} className={`job-card st-${j.status} rise`}>
              <div className="job-top">
                <div>
                  <strong>{j.role || 'Role'}</strong> <span className="muted">at {j.company || 'Company'}</span>
                  {link && <> · <a href={link} target="_blank" rel="noopener noreferrer">posting</a></>}
                </div>
                <select value={j.status} onChange={(e) => patch(j.id, (x) => setStatus(x, e.target.value))} aria-label="Status">
                  {STATUSES.map(([k, label]) => <option key={k} value={k}>{label}</option>)}
                </select>
              </div>
              <div className="job-badges">
                {d !== null && j.status !== 'rejected' && j.status !== 'offer' && <span className={`pill ${d < 0 ? 'low' : d <= 3 ? 'medium' : ''}`}>{d < 0 ? `deadline passed` : d === 0 ? 'due today' : `${d} day${d > 1 ? 's' : ''} left`}</span>}
                {needsFollowUp(j) && <span className="pill medium">Follow up? Applied over a week ago</span>}
              </div>
              <textarea rows="2" placeholder="Notes: contacts, interview dates, what to prepare" value={j.notes} maxLength={1500} onChange={(e) => patch(j.id, (x) => ({ ...x, notes: e.target.value }))} aria-label="Notes" />
              <button type="button" className="pe-btn" onClick={() => remove(j.id)}>Delete</button>
            </li>
          );
        })}
      </ul>
    </main>
  );
}

export default Tracker;

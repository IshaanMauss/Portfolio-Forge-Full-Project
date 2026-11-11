import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { extractPdf } from '../utils/pdfText';
import { parseResume } from '../utils/resumeImport';
import { resumeUpdates, projectUpdates } from '../utils/applyImport';
import { listRepos, analyseRepo, generateBullets, toProjectItem, authorship, MAX_REPOS, GitHubError, clearImportMemory } from '../utils/githubImport';

const GROUPS = [
  ['name', 'Name'], ['headline', 'Tagline'], ['summary', 'Summary → Bio'], ['email', 'Email'], ['linkedin', 'LinkedIn'], ['github', 'GitHub'],
  ['skills', 'Skills'], ['education', 'Education'], ['experience', 'Experience'], ['projects', 'Projects'], ['certifications', 'Certifications'],
];
const preview = (parsed, k) => {
  const v = parsed[k];
  if (Array.isArray(v)) return `${v.length} found${v[0] ? `: ${typeof v[0] === 'string' ? v.slice(0, 4).join(', ') : (v[0].title || v[0].name)}` : ''}`;
  if (k === 'education') return [v.name, v.course, v.gradYear].filter(Boolean).join(' · ');
  return String(v).slice(0, 90);
};
const has = (parsed, k) => { const v = parsed[k]; return Array.isArray(v) ? v.length > 0 : k === 'education' ? !!(v.name || v.course) : !!v; };

function PdfTab({ portfolioData, updatePortfolio }) {
  const [busy, setBusy] = useState(false);
  const [parsed, setParsed] = useState(null);
  const [picks, setPicks] = useState([]);

  const onFile = async (e) => {
    const f = e.target.files?.[0]; e.target.value = '';
    if (!f) return;
    setBusy(true); setParsed(null);
    try {
      const doc = await extractPdf(f);
      if (doc.text.trim().length < 80) { toast.error('This PDF has no readable text (it may be a scan).'); return; }
      const p = parseResume(doc.lines);
      setParsed(p);
      setPicks(GROUPS.map(([k]) => k).filter((k) => has(p, k) && (p.confidence[k] ?? 1) >= 0.5));
    } catch (err) { toast.error(err.message?.includes('10 MB') ? err.message : 'Could not read that PDF.'); } finally { setBusy(false); }
  };
  const apply = () => {
    resumeUpdates(portfolioData, parsed, picks).forEach(([path, val]) => updatePortfolio(path, val));
    toast.success('Imported. Review each section, then Save & Publish.');
    setParsed(null);
  };
  return (
    <div>
      <p className="import-note">Your PDF is read in your browser and is not uploaded. You choose what to import.</p>
      <input type="file" accept="application/pdf,.pdf" onChange={onFile} disabled={busy} aria-label="Choose resume PDF" />
      {busy && <p>Reading…</p>}
      {parsed && (
        <div className="import-review">
          {GROUPS.filter(([k]) => has(parsed, k)).map(([k, label]) => (
            <label key={k} className="import-row">
              <input type="checkbox" checked={picks.includes(k)} onChange={() => setPicks((p) => (p.includes(k) ? p.filter((x) => x !== k) : [...p, k]))} />
              <span><strong>{label}</strong> <em>{Math.round((parsed.confidence[k] ?? 0.9) * 100)}% sure</em><br /><small>{preview(parsed, k)}</small></span>
            </label>
          ))}
          <button type="button" className="add-btn" onClick={apply} disabled={!picks.length}>Import {picks.length} selected</button>
        </div>
      )}
    </div>
  );
}

const ROLES = [['solo', 'Solo project'], ['team', 'Team project'], ['coursework', 'Coursework'], ['open-source', 'Open source']];

function RepoCard({ a, username, onAdd }) {
  const [ans, setAns] = useState({ role: 'solo', contribution: '', challenge: '', outcome: '' });
  const [live, setLive] = useState(a.repo.homepage || '');
  const bullets = generateBullets(a, ans);
  const au = authorship(a.repo, ans.role, username);
  const [edited, setEdited] = useState({});
  const final = bullets.map((b, i) => ({ ...b, text: edited[i] ?? b.text }));
  const set = (k) => (e) => setAns((s) => ({ ...s, [k]: e.target.value }));
  return (
    <div className="repo-card">
      <h4>{a.repo.name} <span className={`pill ${au.level}`}>authorship: {au.level}</span></h4>
      <p className="import-note">{au.note}</p>
      <div className="chips-row">{a.tech.filter((t) => !t.test).slice(0, 12).map((t) => <span key={t.name} className="pill" title={t.evidence.join('\n')}>{t.name}</span>)}</div>
      <ul className="ready-list">{a.readiness.map((r) => <li key={r.id} className={r.ok ? 'ok' : 'no'}>{r.ok ? '✓' : '✕'} {r.label}</li>)}</ul>
      <label>Your role</label>
      <select value={ans.role} onChange={set('role')}>{ROLES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
      <label>What did you personally build?</label>
      <textarea rows="2" value={ans.contribution} onChange={set('contribution')} placeholder="e.g. Built the login flow and chat rooms" />
      <label>Hardest problem you solved (optional)</label>
      <textarea rows="2" value={ans.challenge} onChange={set('challenge')} placeholder="e.g. message ordering when two users type at once" />
      <label>Measurable outcome (optional, only if true)</label>
      <input type="text" value={ans.outcome} onChange={set('outcome')} placeholder="e.g. Used by 40 classmates during the semester" />
      <label>Live demo URL</label>
      <input type="text" value={live} onChange={(e) => setLive(e.target.value)} />
      <label>Draft bullets (edit freely)</label>
      {final.map((b, i) => (
        <div key={i} className="bullet-row">
          <textarea rows="2" value={b.text} onChange={(e) => setEdited((s) => ({ ...s, [i]: e.target.value }))} />
          <details><summary>{b.source === 'you' ? 'Your words' : 'Evidence'}</summary><ul>{b.evidence.map((x, j) => <li key={j}>{x}</li>)}</ul></details>
        </div>
      ))}
      <button type="button" className="add-btn" onClick={() => onAdd(toProjectItem(a, final, live), a.tech.filter((t) => !t.test).map((t) => t.name).slice(0, 6))}>Add to my projects</button>
    </div>
  );
}

function GitHubTab({ portfolioData, updatePortfolio }) {
  const [user, setUser] = useState('');
  const [busy, setBusy] = useState(false);
  const [repos, setRepos] = useState(null);
  const [sel, setSel] = useState([]);
  const [analyses, setAnalyses] = useState([]);
  const [showForks, setShowForks] = useState(false);
  const fail = (e) => toast.error(e instanceof GitHubError ? e.message : 'Could not reach GitHub.');

  const find = async () => {
    setBusy(true); setRepos(null); setAnalyses([]); setSel([]);
    try { setRepos(await listRepos(user)); } catch (e) { fail(e); } finally { setBusy(false); }
  };
  const analyse = async () => {
    setBusy(true);
    try { setAnalyses(await Promise.all(repos.filter((r) => sel.includes(r.fullName)).map(analyseRepo))); } catch (e) { fail(e); } finally { setBusy(false); }
  };
  const toggle = (n) => setSel((s) => (s.includes(n) ? s.filter((x) => x !== n) : s.length >= MAX_REPOS ? (toast.info(`Choose up to ${MAX_REPOS} repositories.`), s) : [...s, n]));
  const add = (item, skills) => {
    projectUpdates(portfolioData, [item], skills).forEach(([p, v]) => updatePortfolio(p, v));
    toast.success(`${item.title} added to your projects.`);
  };
  const shown = (repos || []).filter((r) => showForks || !r.fork);

  return (
    <div>
      <p className="import-note">Public repositories only. We read the repository details, README and package list through GitHub&apos;s public API. Nothing is run, no private code is accessed, and no sign-in is needed.</p>
      <div className="gh-row">
        <input type="text" value={user} onChange={(e) => setUser(e.target.value)} placeholder="GitHub username" aria-label="GitHub username" onKeyDown={(e) => e.key === 'Enter' && user && find()} />
        <button type="button" className="add-btn" onClick={find} disabled={busy || !user.trim()}>{busy && !repos ? 'Finding…' : 'Find repos'}</button>
      </div>
      {repos && (
        <>
          <label className="import-row"><input type="checkbox" checked={showForks} onChange={() => setShowForks((v) => !v)} /> <span>Show forks</span></label>
          <div className="repo-list">
            {shown.length === 0 && <p>No public repositories found.</p>}
            {shown.map((r) => (
              <label key={r.fullName} className="import-row">
                <input type="checkbox" checked={sel.includes(r.fullName)} onChange={() => toggle(r.fullName)} />
                <span><strong>{r.name}</strong> {r.language && <em>{r.language}</em>} {r.stars > 0 && <em>★ {r.stars}</em>}<br /><small>{r.description || 'No description'}</small></span>
              </label>
            ))}
          </div>
          <button type="button" className="add-btn" onClick={analyse} disabled={busy || !sel.length}>{busy ? 'Reading…' : `Analyse ${sel.length || ''} selected`}</button>
        </>
      )}
      {analyses.map((a) => <RepoCard key={a.repo.fullName} a={a} username={user.trim().replace(/^@/, '')} onAdd={add} />)}
    </div>
  );
}

function ImportPanel({ portfolioData, updatePortfolio }) {
  const [tab, setTab] = useState('github');
  // Imported repository text is held in memory only; drop it when the panel goes away.
  useEffect(() => clearImportMemory, []);
  return (
    <details className="controls-section">
      <summary><h3>Import (GitHub or resume PDF)</h3></summary>
      <div className="import-tabs" role="tablist">
        <button type="button" role="tab" aria-selected={tab === 'github'} className={tab === 'github' ? 'active' : ''} onClick={() => setTab('github')}>From GitHub</button>
        <button type="button" role="tab" aria-selected={tab === 'pdf'} className={tab === 'pdf' ? 'active' : ''} onClick={() => setTab('pdf')}>From resume PDF</button>
      </div>
      {tab === 'github' ? <GitHubTab portfolioData={portfolioData} updatePortfolio={updatePortfolio} /> : <PdfTab portfolioData={portfolioData} updatePortfolio={updatePortfolio} />}
    </details>
  );
}

export default ImportPanel;

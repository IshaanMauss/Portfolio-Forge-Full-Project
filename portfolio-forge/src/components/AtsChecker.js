import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { scoreResume } from '../utils/ats';
import { useFileDrop } from '../utils/useFileDrop';
import { extractPdf, looksLikePdf, MAX_PDF_BYTES } from '../utils/pdfText';
import { parseResume } from '../utils/resumeImport';
import './Tools.css';

const ICON = { pass: '✓', warn: '!', fail: '✕' };

function ScoreRing({ score, grade }) {
  const [shown, setShown] = useState(0);
  useEffect(() => { const t = requestAnimationFrame(() => setShown(score)); return () => cancelAnimationFrame(t); }, [score]);
  const R = 54; const C = 2 * Math.PI * R;
  return (
    <div className="score-ring" role="img" aria-label={`Estimated ATS score ${score} out of 100, ${grade}`}>
      <svg viewBox="0 0 128 128">
        <circle cx="64" cy="64" r={R} className="ring-bg" />
        <circle cx="64" cy="64" r={R} className="ring-fg" strokeDasharray={C} strokeDashoffset={C - (C * shown) / 100} />
      </svg>
      <div className="score-num"><strong>{score}</strong><span>{grade}</span></div>
    </div>
  );
}

function AtsChecker() {
  const [file, setFile] = useState(null);
  const [jd, setJd] = useState('');
  const [doc, setDoc] = useState(null);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [previous, setPrevious] = useState(null);
  const last = useRef(null);

  const analyse = useCallback(async (f) => {
    setBusy(true); setError(''); setResult(null);
    try {
      const parsed = await extractPdf(f);
      setPrevious(last.current);
      setDoc(parsed);
    } catch (e) {
      setDoc(null);
      setError(e.message?.includes('10 MB') ? e.message : 'We could not read that PDF. Is it password-protected or damaged?');
    } finally { setBusy(false); }
  }, []);

  // Re-score instantly when the job description changes (no re-parsing of the PDF).
  useEffect(() => {
    if (!doc) return;
    const r = scoreResume(doc, jd);
    setResult(r);
    last.current = { file: file?.name || 'previous upload', score: r.score, checks: Object.fromEntries(r.checks.map((c) => [c.id, c.score])) };
  }, [doc, jd]); // eslint-disable-line react-hooks/exhaustive-deps

  const parsed = useMemo(() => (doc ? parseResume(doc.lines) : null), [doc]);
  const delta = previous && result ? result.score - previous.score : null;

  const takeFile = async (f) => {
    if (!f) return;
    if (!(await looksLikePdf(f))) { setError('That does not look like a PDF file.'); return; }
    if (f.size > MAX_PDF_BYTES) { setError('That PDF is larger than 10 MB.'); return; }
    setFile(f); analyse(f);
  };
  const onFile = (e) => { takeFile(e.target.files?.[0]); e.target.value = ''; };
  const { dragging, dropProps } = useFileDrop((fs) => takeFile(fs[0]));

  return (
    <main className="tool-page">
      <title>Free ATS Resume Checker | Portfolio Forge</title>
      <meta name="description" content="Check how well your resume reads to applicant tracking systems. Free, private: your PDF never leaves your device." />
      <header className="tool-head rise">
        <span className="login-badge">Free · No login · Private</span>
        <h1>ATS resume checker</h1>
        <p>Upload your resume PDF and see how parser-friendly it is. Everything runs in your browser; your file is never uploaded.</p>
      </header>

      <section className="tool-card rise" style={{ '--d': '80ms' }}>
        <label className={`dropzone${dragging ? ' is-dragging' : ''}`} {...dropProps}>
          <input type="file" accept="application/pdf,.pdf" onChange={onFile} />
          <span className="dz-icon" aria-hidden="true">⬆</span>
          <strong>{dragging ? 'Drop your PDF here' : file ? file.name : 'Choose or drag & drop your resume PDF'}</strong>
          <small>{busy ? 'Reading…' : 'Max 10 MB · text-based PDFs work best'}</small>
        </label>
        <label className="jd-label" htmlFor="jd">Paste a job description <em>(optional, adds keyword matching)</em></label>
        <textarea id="jd" rows={5} value={jd} onChange={(e) => setJd(e.target.value)} placeholder="Paste the job posting here…" />
        {error && <p className="tool-error" role="alert">{error}</p>}
      </section>

      {result && (
        <section className="tool-result" aria-live="polite">
          <div className="result-top tool-card">
            <ScoreRing score={result.score} grade={result.grade} />
            <div>
              <h2>Estimated ATS readiness</h2>
              {delta !== null && <p className={`delta ${delta >= 0 ? 'up' : 'down'}`}>{delta > 0 ? `▲ +${delta}` : delta < 0 ? `▼ ${delta}` : '= no change'} compared with {previous.file} ({previous.score})</p>}
              <p className="muted">This is an estimate from common parsing checks, not the score of any specific employer system.</p>
              {!result.hasJobDescription && <p className="muted">Add a job description above to include keyword matching.</p>}
            </div>
          </div>

          {parsed && (
            <div className="tool-card">
              <h3>What a parser saw in your resume</h3>
              <p className="muted">If something here is wrong or empty, an ATS probably misreads it too.</p>
              <table className="parse-table">
                <tbody>
                  {[
                    ['Name', parsed.name, parsed.confidence.name],
                    ['Email', parsed.email, parsed.confidence.email],
                    ['Phone', parsed.phone, parsed.confidence.phone],
                    ['LinkedIn', parsed.linkedin, parsed.confidence.linkedin],
                    ['GitHub', parsed.github, parsed.confidence.github],
                    ['Sections', Object.keys(parsed.sections).filter((k) => !['header', 'other'].includes(k)).join(', '), 0.9],
                    ['Skills', parsed.skills.length ? `${parsed.skills.length}: ${parsed.skills.slice(0, 6).join(', ')}${parsed.skills.length > 6 ? '…' : ''}` : '', parsed.confidence.skills],
                    ['Education', [parsed.education.name, parsed.education.gradYear].filter(Boolean).join(' · '), parsed.confidence.education],
                    ['Experience entries', parsed.experience.length ? String(parsed.experience.length) : '', parsed.confidence.experience],
                    ['Projects', parsed.projects.length ? String(parsed.projects.length) : '', parsed.confidence.projects],
                  ].map(([label, val, c]) => (
                    <tr key={label}><th scope="row">{label}</th><td>{val || <span className="not-found">not found</span>}</td><td className="conf">{val ? `${Math.round((c || 0.5) * 100)}%` : '—'}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <ul className="check-list">
            {result.checks.map((c, i) => (
              <li key={c.id} className={`check ${c.status} rise`} style={{ '--d': `${i * 50}ms` }}>
                <span className="check-ico" aria-hidden="true">{ICON[c.status]}</span>
                <div>
                  <h3>{c.label} <small>{Math.round(c.score * 100)}%{previous && previous.checks[c.id] !== undefined && Math.round((c.score - previous.checks[c.id]) * 100) !== 0 ? ` (${c.score > previous.checks[c.id] ? '+' : ''}${Math.round((c.score - previous.checks[c.id]) * 100)})` : ''}</small></h3>
                  <p>{c.detail}</p>
                  {c.tip && <p className="tip">Fix: {c.tip}</p>}
                </div>
              </li>
            ))}
          </ul>

          {result.keywords && (result.keywords.missing.length > 0 || result.keywords.skillsOnly.length > 0) && (
            <div className="tool-card">
              <h3>Missing keywords</h3>
              <div className="chips">{result.keywords.missing.map((k) => <span className="chip miss" key={k}>{k}</span>)}</div>
              <h3>Matched and shown in your experience or projects</h3>
              <div className="chips">{result.keywords.evidenced.map((k) => <span className="chip hit" key={k}>{k}</span>)}</div>
              {result.keywords.skillsOnly.length > 0 && (<>
                <h3>Listed, but not backed by a bullet</h3>
                <p className="muted">Recruiters trust a skill more when a project or job bullet shows it.</p>
                <div className="chips">{result.keywords.skillsOnly.map((k) => <span className="chip warn" key={k}>{k}</span>)}</div>
              </>)}
            </div>
          )}
        </section>
      )}
    </main>
  );
}

export default AtsChecker;

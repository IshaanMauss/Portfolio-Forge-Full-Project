import React, { useState, useEffect, useCallback } from 'react';
import { scoreResume } from '../utils/ats';
import { extractPdf, MAX_PDF_BYTES } from '../utils/pdfText';
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

  const analyse = useCallback(async (f) => {
    setBusy(true); setError(''); setResult(null);
    try {
      const parsed = await extractPdf(f);
      setDoc(parsed);
    } catch (e) {
      setDoc(null);
      setError(e.message?.includes('10 MB') ? e.message : 'We could not read that PDF. Is it password-protected or damaged?');
    } finally { setBusy(false); }
  }, []);

  // Re-score instantly when the job description changes (no re-parsing of the PDF).
  useEffect(() => { if (doc) setResult(scoreResume(doc, jd)); }, [doc, jd]);

  const onFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.type !== 'application/pdf' && !f.name.toLowerCase().endsWith('.pdf')) { setError('Please choose a PDF file.'); return; }
    if (f.size > MAX_PDF_BYTES) { setError('That PDF is larger than 10 MB.'); return; }
    setFile(f); analyse(f);
  };

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
        <label className="dropzone">
          <input type="file" accept="application/pdf,.pdf" onChange={onFile} />
          <span className="dz-icon" aria-hidden="true">⬆</span>
          <strong>{file ? file.name : 'Choose your resume PDF'}</strong>
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
              <p className="muted">This is an estimate from common parsing checks, not the score of any specific employer system.</p>
              {!result.hasJobDescription && <p className="muted">Add a job description above to include keyword matching.</p>}
            </div>
          </div>

          <ul className="check-list">
            {result.checks.map((c, i) => (
              <li key={c.id} className={`check ${c.status} rise`} style={{ '--d': `${i * 50}ms` }}>
                <span className="check-ico" aria-hidden="true">{ICON[c.status]}</span>
                <div>
                  <h3>{c.label} <small>{Math.round(c.score * 100)}%</small></h3>
                  <p>{c.detail}</p>
                  {c.tip && <p className="tip">Fix: {c.tip}</p>}
                </div>
              </li>
            ))}
          </ul>

          {result.keywords && result.keywords.missing.length > 0 && (
            <div className="tool-card">
              <h3>Missing keywords</h3>
              <div className="chips">{result.keywords.missing.map((k) => <span className="chip miss" key={k}>{k}</span>)}</div>
              <h3>Matched</h3>
              <div className="chips">{result.keywords.matched.map((k) => <span className="chip hit" key={k}>{k}</span>)}</div>
            </div>
          )}
        </section>
      )}
    </main>
  );
}

export default AtsChecker;

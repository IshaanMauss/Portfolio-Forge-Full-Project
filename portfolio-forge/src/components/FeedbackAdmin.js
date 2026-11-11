import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { auth, db } from '../firebase/config';
import { getIdTokenResult } from 'firebase/auth';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { escapeHtml } from '../utils/escape';
import FeedbackViewer from './FeedbackViewer';

const MAX_ROWS = 100; // keeps the read cost of this panel bounded

const day = (ts) => {
  if (!ts) return 'N/A';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

// Visible only to accounts that carry the `admin` custom claim. Rules enforce this server-side;
// the check here just avoids showing an empty panel (and avoids any query) to everyone else.
function FeedbackAdmin() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const u = auth.currentUser;
        if (!u) return;
        const t = await getIdTokenResult(u);
        if (alive) setIsAdmin(t.claims.admin === true);
      } catch (e) { if (alive) setIsAdmin(false); }
    })();
    return () => { alive = false; };
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, 'feedback'), orderBy('timestamp', 'desc'), limit(MAX_ROWS)));
      setList(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (e) {
      toast.error('Could not load feedback.');
    } finally {
      setLoading(false);
    }
  };

  const exportHtml = () => {
    if (!list.length) { toast.warn('No feedback to export.'); return; }
    const cards = list.map((fb) => {
      const r = Math.max(0, Math.min(5, Number(fb.rating) || 0));
      return `<div style="border:1px solid #ccc;border-radius:8px;padding:15px;margin-bottom:15px;font-family:sans-serif;background:#fff"><div style="display:flex;justify-content:space-between;border-bottom:1px solid #eee;padding-bottom:10px;margin-bottom:10px"><span style="font-size:1.5em;color:#ffc107">${'★'.repeat(r)}${'☆'.repeat(5 - r)}</span><span style="color:#555">${escapeHtml(day(fb.timestamp))}</span></div><p style="font-style:italic;color:#333;margin:0">&ldquo;${escapeHtml(fb.comment)}&rdquo;</p><p style="font-size:.8em;color:#777;text-align:right">From: ${escapeHtml(fb.submitterEmail || 'Anonymous')}</p></div>`;
    }).join('');
    const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'"><title>App Feedback for Portfolio Forge</title></head><body style="font-family:sans-serif;background:#f4f4f4;padding:20px"><h1>App Feedback for Portfolio Forge</h1>${cards}</body></html>`;
    const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
    const a = document.createElement('a');
    a.href = url; a.download = 'app_feedback_dashboard.html';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isAdmin) return null;
  return (
    <details className="controls-section">
      <summary><h3>App Feedback (admin)</h3></summary>
      <button className="add-btn" onClick={load} disabled={loading}>{loading ? 'Loading…' : `Load latest ${MAX_ROWS}`}</button>
      <FeedbackViewer feedbackList={list} loading={false} />
      {list.length > 0 && <button className="add-btn" onClick={exportHtml}>Export Feedback as HTML</button>}
    </details>
  );
}

export default FeedbackAdmin;

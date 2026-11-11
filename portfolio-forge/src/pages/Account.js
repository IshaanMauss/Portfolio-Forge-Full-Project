import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { auth } from '../firebase/config';
import { exportMyData, deleteMyAccount } from '../utils/deleteAccount';
import '../components/Tools.css';
import '../components/Legal.css';
import Seo from '../seo/Seo';

function Account({ user }) {
  const navigate = useNavigate();
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);

  if (!user) {
    return <main className="tool-page"><h1>Account</h1><p className="muted">Sign in to manage your data.</p><Link to="/" className="pe-btn primary">Go to sign in</Link></main>;
  }

  const onExport = async () => {
    setBusy(true);
    try {
      const data = await exportMyData();
      const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
      const a = document.createElement('a'); a.href = url; a.download = 'portfolio-forge-my-data.json'; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (e) { toast.error('Could not export your data. Please try again.'); } finally { setBusy(false); }
  };

  const onDelete = async () => {
    setBusy(true);
    try {
      await deleteMyAccount();
      toast.success('Your account and data were deleted.');
      navigate('/');
    } catch (e) {
      console.error(e);
      toast.error(e.code === 'auth/popup-closed-by-user' ? 'Deletion cancelled. Nothing was removed.' : 'Deletion failed. Please sign in again and retry.');
    } finally { setBusy(false); }
  };

  return (
    <main className="tool-page">
      <Seo title="Account – Portfolio Forge" path="/account" noindex />
      <header className="tool-head rise"><h1>Your account</h1><p>Signed in as {auth.currentUser?.email}. Your data, your control.</p></header>

      <section className="tool-card rise" style={{ '--d': '60ms' }}>
        <h2>Download your data</h2>
        <p className="muted">Get your portfolio draft and account details as a JSON file.</p>
        <div><button type="button" className="pe-btn" onClick={onExport} disabled={busy}>Download my data</button></div>
      </section>

      <section className="tool-card account-danger rise" style={{ '--d': '120ms' }}>
        <h2>Delete my account</h2>
        <p className="muted">This permanently removes your draft, published portfolio, uploaded pictures and sign-in. It cannot be undone. You will be asked to confirm with Google.</p>
        <label htmlFor="del">Type <strong>DELETE</strong> to continue</label>
        <input id="del" type="text" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="off" />
        <div><button type="button" className="pe-btn danger" disabled={busy || confirm !== 'DELETE'} onClick={onDelete}>{busy ? 'Working…' : 'Delete everything'}</button></div>
      </section>

      <p className="legal-links"><Link to="/privacy">Privacy Policy</Link><Link to="/terms">Terms of Use</Link></p>
    </main>
  );
}

export default Account;

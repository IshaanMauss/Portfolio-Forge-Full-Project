import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FEATURES } from '../utils/features';
import { auth } from '../firebase/config';
import { toast } from 'react-toastify';
import ThemeSwitcher from './ThemeSwitcher';
import ShareModal from './ShareModal';
import './Navbar.css';

// --- MODAL COMPONENTS ---

const NewVersionToast = ({ closeToast, onConfirm }) => {
  const [name, setName] = useState('');
  const [goal, setGoal] = useState('');

  const handleSubmit = () => {
    if (name.trim()) {
      onConfirm(name.trim(), goal.trim());
      closeToast();
    }
  };

  return (
    <div className="toast-modal-content">
      <h4>Create New Portfolio Version</h4>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="E.g., For Game Developer Jobs"
        aria-label="Version name"
        autoFocus
        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
      />
      <input
        type="text"
        value={goal}
        onChange={(e) => setGoal(e.target.value)}
        placeholder="Goal / target role (optional, private)"
        aria-label="Goal"
        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
      />
      <div className="toast-actions">
        <button className="btn-secondary" onClick={closeToast}>Cancel</button>
        <button className="btn-primary" onClick={handleSubmit}>Create</button>
      </div>
    </div>
  );
};

const DeleteConfirmToast = ({ closeToast, onConfirm, portfolioName }) => (
  <div className="toast-modal-content">
    <h4>Confirm Deletion</h4>
    <p>Are you sure you want to permanently delete the "<strong>{portfolioName}</strong>" portfolio? This action cannot be undone.</p>
    <div className="toast-actions">
      <button className="btn-secondary" onClick={closeToast}>Cancel</button>
      <button className="btn-danger" onClick={() => { onConfirm(); closeToast(); }}>Delete</button>
    </div>
  </div>
);

// --- NAVBAR COMPONENT ---

function Navbar({ user, handleSave, unpublished, portfolioData, setPortfolioData, activePortfolio, setActivePortfolio, handleDeleteVersion }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  const handleSignOut = () => { auth.signOut(); navigate('/'); };
  const handleGoBack = () => { window.history.length > 2 && location.key !== 'default' ? navigate(-1) : navigate('/'); };
  const handleVersionChange = (e) => { setActivePortfolio(e.target.value); };

  const triggerCreateNewVersion = () => {
    const handleConfirm = (newVersionName, goal) => {
      const newVersionId = `v_${Date.now()}`;
      const basePortfolio = JSON.parse(JSON.stringify(portfolioData.portfolios[activePortfolio] || {}));

      setPortfolioData((prev) => {
        const newVersions = [...(prev.meta?.versions || []), { id: newVersionId, name: newVersionName, goal: goal || '' }];
        const newPortfolios = { ...prev.portfolios, [newVersionId]: basePortfolio };
        return { ...prev, meta: { ...prev.meta, versions: newVersions }, portfolios: newPortfolios };
      });
      setActivePortfolio(newVersionId);
      toast.success(`Created new version: "${newVersionName}"`);
    };

    toast(<NewVersionToast onConfirm={handleConfirm} />, {
      className: 'modal-toast-container',
      position: 'top-center',
      autoClose: false,
      closeOnClick: false,
      draggable: false,
    });
  };

  const triggerDeleteVersion = (versionId) => {
    const portfolioNameToDelete = portfolioData.meta.versions.find((v) => v.id === versionId)?.name;
    toast(<DeleteConfirmToast onConfirm={() => handleDeleteVersion(versionId)} portfolioName={portfolioNameToDelete} />, {
      className: 'modal-toast-container',
      position: 'top-center',
      autoClose: false,
      closeOnClick: false,
      draggable: false,
    });
  };

  const isDashboard = location.pathname === '/';
  const isPublicRoute = /^\/(p|resume)\//.test(location.pathname);

  // Visitors of a public portfolio/resume see the page only, without the app bar.
  if (isPublicRoute && !user) return null;

  const versions = portfolioData?.meta?.versions || [{ id: 'default', name: 'Main Portfolio' }];
  const shareUrl = user ? `${window.location.origin}/p/${user.uid}/${activePortfolio}` : '';
  const shareTitle = portfolioData?.portfolios?.[activePortfolio]?.userName;

  return (
    <nav className="navbar">
      <div className="nav-container">
        <div className="nav-left">
          {!isDashboard && <button onClick={handleGoBack} className="nav-back-button" aria-label="Go back">&larr;</button>}
          <Link to="/" className="nav-logo">Portfolio Forge</Link>
        </div>

        <ul className={`nav-menu${menuOpen ? ' active' : ''}`}>
            <li className="nav-item"><Link to="/tools/ats" className="nav-link" onClick={() => setMenuOpen(false)}>ATS Check</Link></li>
            <li className="nav-item"><Link to="/tools/pdf" className="nav-link" onClick={() => setMenuOpen(false)}>PDF Editor</Link></li>
            {user && isDashboard && (
              <>
                {FEATURES.multiVersion && (
                <li className="nav-item version-selector">
                  <span className="version-label">Version</span>
                  <select value={activePortfolio} onChange={handleVersionChange} aria-label="Portfolio version">
                    {versions.map((v) => <option key={v.id} value={v.id}>{v.goal ? `${v.name} — ${v.goal}` : v.name}</option>)}
                  </select>
                  <button onClick={triggerCreateNewVersion} className="new-version-btn" title="Create New Version" aria-label="Create new version">+</button>
                  {versions.length > 1 && activePortfolio !== 'default' && (
                    <button onClick={() => triggerDeleteVersion(activePortfolio)} className="delete-version-btn" title="Delete Current Version" aria-label="Delete current version">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="22px" height="22px"><path d="M7 4V2h10v2h5v2h-2v15a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6H2V4h5zM6 6v14h12V6H6zm3 3h2v8H9V9zm4 0h2v8h-2V9z"></path></svg>
                    </button>
                  )}
                </li>
                )}
                <li className="nav-item"><button onClick={() => { setShareOpen(true); setMenuOpen(false); }} className="nav-link-button">Share</button></li>
                <li className="nav-item"><Link to={`/p/${user.uid}/${activePortfolio}`} className="nav-link" onClick={() => setMenuOpen(false)}>Public View</Link></li>
                <li className="nav-item"><Link to={`/resume/${user.uid}/${activePortfolio}`} className="nav-link" onClick={() => setMenuOpen(false)}>Web Resume</Link></li>
              </>
            )}
            {user && <li className="nav-item"><Link to="/account" className="nav-link" onClick={() => setMenuOpen(false)}>Account</Link></li>}
            {user && <li className="nav-item"><button onClick={handleSignOut} className="nav-link-button">Sign Out</button></li>}
        </ul>

        <div className="nav-right">
          <ThemeSwitcher />
          {user && isDashboard && (
            <button
              onClick={handleSave}
              className="nav-cta"
              title={unpublished ? 'You have unpublished changes' : 'Everything is published'}
            >
              Save &amp; Publish{unpublished ? ' •' : ''}
            </button>
          )}
          {(
            <button
              type="button"
              className="menu-icon"
              aria-label="Menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((o) => !o)}
            >
              {menuOpen ? '✕' : '☰'}
            </button>
          )}
        </div>
      </div>
      {shareOpen && user && (
        <ShareModal url={shareUrl} title={shareTitle} unpublished={unpublished} onClose={() => setShareOpen(false)} />
      )}
    </nav>
  );
}

export default Navbar;

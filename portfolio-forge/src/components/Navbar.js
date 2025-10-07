import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { auth } from '../firebase/config';
import { toast } from 'react-toastify';
import './Navbar.css';

// --- MODAL COMPONENTS ---

const NewVersionToast = ({ closeToast, onConfirm }) => {
    const [name, setName] = useState('');
    
    const handleSubmit = () => {
        if (name.trim()) {
            onConfirm(name.trim());
            closeToast();
        }
    };

    return (
        <div className="toast-modal-content">
            <h4>Create New Portfolio Version</h4>
            <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="E.g., For Game Developer Jobs"
                autoFocus
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
            <div className="toast-actions">
                <button className="btn-secondary" onClick={closeToast}>Cancel</button>
                <button className="btn-primary" onClick={handleSubmit}>Create</button>
            </div>
        </div>
    );
};

const DeleteConfirmToast = ({ closeToast, onConfirm, portfolioName }) => {
    return (
        <div className="toast-modal-content">
            <h4>Confirm Deletion</h4>
            <p>Are you sure you want to permanently delete the "<strong>{portfolioName}</strong>" portfolio? This action cannot be undone.</p>
            <div className="toast-actions">
                <button className="btn-secondary" onClick={closeToast}>Cancel</button>
                <button className="btn-danger" onClick={() => { onConfirm(); closeToast(); }}>Delete</button>
            </div>
        </div>
    );
};


// --- NAVBAR COMPONENT ---

function Navbar({ user, handleSave, portfolioData, setPortfolioData, activePortfolio, setActivePortfolio, handleDeleteVersion }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = () => { auth.signOut(); navigate('/'); };
  const handleGoBack = () => { window.history.length > 2 && location.key !== "default" ? navigate(-1) : navigate('/'); };
  const handleVersionChange = (e) => { setActivePortfolio(e.target.value); };

  const triggerCreateNewVersion = () => {
    const handleConfirm = (newVersionName) => {
      const newVersionId = `v_${Date.now()}`;
      const basePortfolio = JSON.parse(JSON.stringify(portfolioData.portfolios[activePortfolio] || {}));

      setPortfolioData(prev => {
        const newVersions = [...(prev.meta?.versions || []), { id: newVersionId, name: newVersionName }];
        const newPortfolios = { ...prev.portfolios, [newVersionId]: basePortfolio };
        return { ...prev, meta: { ...prev.meta, versions: newVersions }, portfolios: newPortfolios };
      });
      setActivePortfolio(newVersionId);
      toast.success(`Created new version: "${newVersionName}"`);
    };

    toast(<NewVersionToast onConfirm={handleConfirm} />, {
        className: 'modal-toast-container',
        position: "top-center",
        autoClose: false,
        closeOnClick: false,
        draggable: false,
    });
  };

  const triggerDeleteVersion = (versionId) => {
    const portfolioNameToDelete = portfolioData.meta.versions.find(v => v.id === versionId)?.name;
    toast(<DeleteConfirmToast onConfirm={() => handleDeleteVersion(versionId)} portfolioName={portfolioNameToDelete} />, {
        className: 'modal-toast-container',
        position: "top-center",
        autoClose: false,
        closeOnClick: false,
        draggable: false,
    });
  };

  const isDashboard = location.pathname === '/';
  const versions = portfolioData?.meta?.versions || [{ id: 'default', name: 'Main Portfolio' }];

  return (
    <nav className="navbar">
      <div className="nav-container">
        {!isDashboard && <button onClick={handleGoBack} className="nav-back-button">&larr;</button>}
        <Link to="/" className="nav-logo"> Portfolio Forge </Link>
        {user && (
          <ul className="nav-menu">
            {isDashboard && (
              <>
                <li className="nav-item version-selector">
                  <span className="version-label">Current Portfolio:</span>
                  <select value={activePortfolio} onChange={handleVersionChange}>
                    {versions.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                  <button onClick={triggerCreateNewVersion} className="new-version-btn" title="Create New Version">+</button>
                  {versions.length > 1 && activePortfolio !== 'default' && (
                    <button onClick={() => triggerDeleteVersion(activePortfolio)} className="delete-version-btn" title="Delete Current Version">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="22px" height="22px"><path d="M7 4V2h10v2h5v2h-2v15a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6H2V4h5zM6 6v14h12V6H6zm3 3h2v8H9V9zm4 0h2v8h-2V9z"></path></svg>
                    </button>
                  )}
                </li>
                <li className="nav-item"><a href={`/p/${user.uid}/${activePortfolio}`} target="_blank" rel="noopener noreferrer" className="nav-link">Public View</a></li>
                <li className="nav-item"><a href={`/resume/${user.uid}/${activePortfolio}`} target="_blank" rel="noopener noreferrer" className="nav-link">Web Resume</a></li>
                <li className="nav-item"><button onClick={handleSave} className="nav-link-button save">Save</button></li>
              </>
            )}
            <li className="nav-item">
              {/* Changed className here for consistent styling */}
              <button onClick={handleSignOut} className="nav-link-button">Sign Out</button>
            </li>
          </ul>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
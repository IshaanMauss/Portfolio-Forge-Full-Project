import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { auth } from '../firebase/config';
import './Navbar.css';

function Navbar({ user, handleSave, portfolioData, setPortfolioData, activePortfolio, setActivePortfolio }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = () => {
    auth.signOut();
    navigate('/');
  };

  const handleGoBack = () => {
    if (window.history.length > 2 && location.key !== "default") {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  const handleVersionChange = (e) => {
    const newActiveVersion = e.target.value;
    setActivePortfolio(newActiveVersion);
    setPortfolioData(prev => ({ ...prev, meta: { ...prev.meta, activeVersion: newActiveVersion } }));
  };

  const createNewVersion = () => {
    const newVersionName = prompt("Enter a name for the new portfolio version (e.g., 'For Game Dev Jobs'):");
    if (newVersionName) {
      const newVersionId = `v_${Date.now()}`;
      setPortfolioData(prev => {
        const newVersions = [...(prev.meta?.versions || []), { id: newVersionId, name: newVersionName }];
        const newPortfolios = { ...prev.portfolios, [newVersionId]: { ...(prev.portfolios[activePortfolio] || {}) } };
        return {
          meta: { ...prev.meta, versions: newVersions, activeVersion: newVersionId },
          portfolios: newPortfolios
        };
      });
      setActivePortfolio(newVersionId);
    }
  };

  const isDashboard = location.pathname === '/';
  const versions = portfolioData?.meta?.versions || [];

  return (
    <nav className="navbar">
      <div className="nav-container">
        {!isDashboard && (
          <button onClick={handleGoBack} className="nav-back-button">
            &larr;
          </button>
        )}
        <Link to="/" className="nav-logo"> Portfolio Forge </Link>
        {user && (
          <ul className="nav-menu">
            {isDashboard && (
              <>
                <li className="nav-item version-selector">
                  <select value={activePortfolio} onChange={handleVersionChange}>
                    {versions.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                  <button onClick={createNewVersion} className="new-version-btn">+</button>
                </li>
                <li className="nav-item">
                  <a href={`/p/${user.uid}`} target="_blank" rel="noopener noreferrer" className="nav-link">Public View</a>
                </li>
                 <li className="nav-item">
                  <a href={`/resume/${user.uid}`} target="_blank" rel="noopener noreferrer" className="nav-link">Web Resume</a>
                </li>
                <li className="nav-item">
                  <button onClick={handleSave} className="nav-link-button save">Save</button>
                </li>
              </>
            )}
            <li className="nav-item">
              <button onClick={handleSignOut} className="nav-button">Sign Out</button>
            </li>
          </ul>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { auth, db } from './firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import { publishAll, hasPublished } from './utils/publish';
import { normalizeData } from './utils/normalize';
import './App.css';

// Public pages are code-split so the editor bundle stays small and the
// heavy PDF libraries are only fetched when actually needed.
const PublicPortfolio = lazy(() => import('./components/PublicPortfolio'));
const Resume = lazy(() => import('./components/Resume'));

const AUTOSAVE_DELAY_MS = 3000;

const updateNestedState = (obj, path, value) => {
  const keys = path.split('.');
  const newObj = { ...obj };
  let current = newObj;
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    current[key] = current[key] ? { ...current[key] } : {};
    current = current[key];
  }
  current[keys[keys.length - 1]] = value;
  return newObj;
};

const deepMerge = (target, source) => {
  const output = { ...target };
  if (target && typeof target === 'object' && source && typeof source === 'object') {
    Object.keys(source).forEach(key => {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key]) && key in target) {
        output[key] = deepMerge(target[key], source[key]);
      } else if (source[key] !== undefined) {
        output[key] = source[key];
      }
    });
  }
  return output;
};

const createDefaultData = (currentUser) => ({
  meta: {
    versions: [{ id: 'default', name: 'Main Portfolio', goal: '' }],
    activeVersion: 'default',
  },
  portfolios: {
    default: {
      userName: currentUser.displayName || 'Your Name',
      userSubtitle: 'Your Professional Subtitle',
      profilePicUrl: currentUser.photoURL || '',
      bio: 'A brief description about yourself.',
      location: { value: '', showOnPage: true },
      address: { value: '', showOnPage: false },
      links: { linkedin: '', github: '', email: currentUser.email || '' },
      hardSkills: { showOnPage: true, items: ['HTML', 'CSS', 'JavaScript'] },
      softSkills: { showOnPage: true, items: ['Communication', 'Teamwork'] },
      interests: { showOnPage: true, items: ['Open Source', 'UI/UX Design'] },
      certifications: { showOnPage: true, items: [] },
      education: {
        college: { name: '', course: '', gradYear: '', showOnPage: true },
        class12: { school: '', percentage: '', board: '', passingYear: '', showOnPage: false },
        class10: { school: '', percentage: '', board: '', passingYear: '', showOnPage: false },
      },
      projects: { showOnPage: true, items: [] },
      blogPosts: { showOnPage: false, items: [] },
      customSections: { title: 'Custom Section', showOnPage: false, items: [] },
      theme: { font: 'Poppins', backgroundColor: '#2b1338', textColor: '#f6ecf5', accentColor: '#e9b6da', layout: 'standard' },
    },
  },
});

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [portfolioData, setPortfolioData] = useState(null);
  const [activePortfolio, setActivePortfolio] = useState('default');
  const [unpublished, setUnpublished] = useState(false);

  // Snapshots used to detect unsaved / unpublished changes.
  const lastDraftSnapshot = useRef(null);
  const lastPublishedSnapshot = useRef(null);
  const draftPending = useRef(false);
  const autosaveTimer = useRef(null);

  const snapshotOf = (data, active) => JSON.stringify({ data, active });

  const buildDocument = (data, active) =>
    JSON.parse(JSON.stringify({ ...data, meta: { ...data.meta, activeVersion: active } }));

  const loadPortfolio = async (currentUser) => {
    setLoadError(false);
    try {
      const docRef = doc(db, 'portfolios', currentUser.uid);
      const docSnap = await getDoc(docRef);
      const defaultData = createDefaultData(currentUser);
      const rawMerged = docSnap.exists() ? deepMerge(defaultData, docSnap.data()) : defaultData;
      const rawActive = rawMerged.meta.activeVersion || 'default';
      const merged = normalizeData(rawMerged);
      const active = merged.meta.activeVersion;

      // One-time migration: make sure a public copy exists for existing users.
      let alreadyPublished = true;
      if (docSnap.exists()) {
        alreadyPublished = await hasPublished(currentUser.uid);
        if (!alreadyPublished) await publishAll(currentUser.uid, merged);
      }

      const snap = snapshotOf(merged, active);
      // Compare against the RAW data so a repaired document is autosaved.
      lastDraftSnapshot.current = snapshotOf(rawMerged, rawActive);
      lastPublishedSnapshot.current = docSnap.exists() ? snap : null;
      setUnpublished(!docSnap.exists());
      setPortfolioData(merged);
      setActivePortfolio(active);
    } catch (error) {
      console.error('Error loading portfolio:', error);
      setLoadError(true);
      toast.error('Could not load your portfolio. Check your connection and retry.');
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await loadPortfolio(currentUser);
      } else {
        setUser(null);
        setPortfolioData(null);
        lastDraftSnapshot.current = null;
        lastPublishedSnapshot.current = null;
        setUnpublished(false);
      }
      setLoading(false);
    });
    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Autosave the private draft a few seconds after the last edit.
  useEffect(() => {
    if (!user || !portfolioData) return undefined;
    const snap = snapshotOf(portfolioData, activePortfolio);
    setUnpublished(snap !== lastPublishedSnapshot.current);
    if (snap === lastDraftSnapshot.current) {
      draftPending.current = false;
      return undefined;
    }
    draftPending.current = true;
    autosaveTimer.current = setTimeout(async () => {
      try {
        await setDoc(doc(db, 'portfolios', user.uid), buildDocument(portfolioData, activePortfolio));
        lastDraftSnapshot.current = snap;
        draftPending.current = false;
      } catch (error) {
        console.error('Autosave failed:', error);
      }
    }, AUTOSAVE_DELAY_MS);
    return () => clearTimeout(autosaveTimer.current);
  }, [portfolioData, activePortfolio, user]);

  // Warn before closing the tab while a draft has not been written yet.
  useEffect(() => {
    const handler = (e) => {
      if (draftPending.current) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

  // Safety net: never point the editor at a version that has no data.
  useEffect(() => {
    if (portfolioData && !portfolioData.portfolios?.[activePortfolio]) setActivePortfolio('default');
  }, [portfolioData, activePortfolio]);

  const handlePortfolioUpdate = (path, value) => {
    setPortfolioData(prev => {
      if (!prev || !prev.portfolios || !prev.portfolios[activePortfolio]) {
        console.error('Cannot update portfolio, data structure is invalid.', { prev, activePortfolio });
        return prev;
      }
      const newPortfolios = { ...prev.portfolios };
      newPortfolios[activePortfolio] = updateNestedState(newPortfolios[activePortfolio], path, value);
      return { ...prev, portfolios: newPortfolios };
    });
  };

  const handleDeleteVersion = (versionIdToDelete) => {
    if (versionIdToDelete === 'default') {
      toast.error('You cannot delete your main portfolio.');
      return;
    }
    const versionName = portfolioData.meta.versions.find(v => v.id === versionIdToDelete)?.name || 'this version';
    setPortfolioData(prev => {
      const newVersions = prev.meta.versions.filter(v => v.id !== versionIdToDelete);
      const newPortfolios = { ...prev.portfolios };
      delete newPortfolios[versionIdToDelete];
      return { ...prev, meta: { ...prev.meta, versions: newVersions }, portfolios: newPortfolios };
    });
    setActivePortfolio('default');
    toast.success(`Deleted "${versionName}". Click Save & Publish to make it permanent.`);
  };

  // Save = write the private draft (full replace, so deleted versions are
  // really removed) AND publish the sanitized public copies.
  const handleSave = async () => {
    if (!user) return toast.error('You must be logged in to save.');
    try {
      clearTimeout(autosaveTimer.current);
      const payload = buildDocument(portfolioData, activePortfolio);
      await setDoc(doc(db, 'portfolios', user.uid), payload);
      await publishAll(user.uid, payload);
      const snap = snapshotOf(portfolioData, activePortfolio);
      lastDraftSnapshot.current = snap;
      lastPublishedSnapshot.current = snap;
      draftPending.current = false;
      setUnpublished(false);
      toast.success('Saved and published!');
    } catch (error) {
      console.error('Error saving data:', error);
      toast.error('There was an error saving your portfolio.');
    }
  };

  if (loading) return <div className="loading-screen">Loading...</div>;

  return (
    <>
      <ToastContainer position="bottom-right" autoClose={4000} theme="dark" />
      <Navbar
        user={user}
        handleSave={handleSave}
        unpublished={unpublished}
        portfolioData={portfolioData}
        setPortfolioData={setPortfolioData}
        activePortfolio={activePortfolio}
        setActivePortfolio={setActivePortfolio}
        handleDeleteVersion={handleDeleteVersion}
      />
      <Suspense fallback={<div className="loading-screen">Loading...</div>}>
        <Routes>
          <Route
            path="/"
            element={
              user ? (
                loadError ? (
                  <div className="loading-screen">
                    <p>We couldn't load your portfolio.</p>
                    <button className="login-button" onClick={() => loadPortfolio(user)}>Retry</button>
                  </div>
                ) : (
                  <Dashboard
                    portfolioData={portfolioData?.portfolios?.[activePortfolio]}
                    updatePortfolio={handlePortfolioUpdate}
                  />
                )
              ) : (
                <Login />
              )
            }
          />
          <Route path="/p/:userId/:versionId?" element={<PublicPortfolio />} />
          <Route path="/resume/:userId/:versionId?" element={<Resume />} />
        </Routes>
      </Suspense>
    </>
  );
}

export default App;

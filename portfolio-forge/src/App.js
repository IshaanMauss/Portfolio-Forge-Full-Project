import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { auth, db } from './firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, getDoc } from "firebase/firestore";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import PublicPortfolio from './components/PublicPortfolio';
import Resume from './components/Resume';
import './App.css';

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

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [portfolioData, setPortfolioData] = useState(null);
  const [activePortfolio, setActivePortfolio] = useState('default');

  const createDefaultData = (currentUser) => ({
    meta: {
      versions: [{ id: 'default', name: 'Main Portfolio' }],
      activeVersion: 'default',
    },
    portfolios: {
      default: {
        userName: currentUser.displayName || 'Your Name', 
        userSubtitle: 'Your Professional Subtitle', 
        profilePicUrl: currentUser.photoURL || '', 
        profilePicDataUrl: '', // <-- THE FIX: Add new field here
        bio: 'A brief description about yourself.', 
        location: { value: '', showOnPage: true }, 
        address: { value: '', showOnPage: false }, 
        links: { linkedin: '', github: '', email: currentUser.email || '' }, 
        hardSkills: { showOnPage: true, items: ['HTML', 'CSS', 'JavaScript'] }, 
        softSkills: { showOnPage: true, items: ['Communication', 'Teamwork'] }, 
        interests: { showOnPage: true, items: ['Open Source', 'UI/UX Design'] }, 
        certifications: { showOnPage: true, items: [] }, 
        education: { college: { name: '', course: '', gradYear: '', showOnPage: true }, class12: { school: '', percentage: '', board: '', passingYear: '', showOnPage: false }, class10: { school: '', percentage: '', board: '', passingYear: '', showOnPage: false }, }, 
        projects: { showOnPage: true, items: [] }, 
        blogPosts: { showOnPage: false, items: [] }, 
        customSections: { title: 'Custom Section', showOnPage: false, items: [] }, 
        theme: { font: 'Poppins', backgroundColor: '#0a192f', textColor: '#ccd6f6', accentColor: '#64ffda', layout: 'standard', },
      }
    }
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const docRef = doc(db, "portfolios", currentUser.uid);
        const docSnap = await getDoc(docRef);
        const defaultData = createDefaultData(currentUser);
        if (docSnap.exists()) {
          const loadedData = docSnap.data();
          const mergedData = deepMerge(defaultData, loadedData);
          setPortfolioData(mergedData);
          setActivePortfolio(mergedData.meta.activeVersion || 'default');
        } else {
          setPortfolioData(defaultData);
          setActivePortfolio('default');
        }
      } else {
        setUser(null);
        setPortfolioData(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handlePortfolioUpdate = (path, value) => {
    setPortfolioData(prev => {
      if (!prev || !prev.portfolios || !prev.portfolios[activePortfolio]) {
        console.error("Cannot update portfolio, data structure is invalid.", {prev, activePortfolio});
        return prev;
      }
      const newPortfolios = { ...prev.portfolios };
      const activePortfolioObject = newPortfolios[activePortfolio];
      const updatedActivePortfolio = updateNestedState(activePortfolioObject, path, value);
      newPortfolios[activePortfolio] = updatedActivePortfolio;
      return { ...prev, portfolios: newPortfolios };
    });
  };

  const handleDeleteVersion = (versionIdToDelete) => {
    if (versionIdToDelete === 'default') {
        toast.error("You cannot delete your main portfolio.");
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
    toast.success(`Deleted "${versionName}"`);
  };

  const handleSave = async () => {
    if (!user) return toast.error("You must be logged in to save.");
    const docRef = doc(db, "portfolios", user.uid);
    try {
      const dataToSave = { ...portfolioData, meta: { ...portfolioData.meta, activeVersion: activePortfolio, } };
      await setDoc(docRef, dataToSave, { merge: true });
      toast.success(`Portfolio saved successfully!`);
    } catch (error) {
      console.error("Error saving data:", error);
      toast.error("There was an error saving your portfolio.");
    }
  };

  if (loading) return <div className="loading-screen">Loading...</div>;

  return (
    <>
      <ToastContainer position="bottom-right" autoClose={4000} theme="dark" />
      <Navbar user={user} handleSave={handleSave} portfolioData={portfolioData} setPortfolioData={setPortfolioData} activePortfolio={activePortfolio} setActivePortfolio={setActivePortfolio} handleDeleteVersion={handleDeleteVersion} />
      <Routes>
        <Route
          path="/"
          element={
            user ?
            <Dashboard
              portfolioData={portfolioData?.portfolios[activePortfolio]}
              updatePortfolio={handlePortfolioUpdate}
            /> :
            <Login />
          }
        />
        <Route path="/p/:userId/:versionId?" element={<PublicPortfolio />} />
        <Route path="/resume/:userId/:versionId?" element={<Resume />} />
      </Routes>
    </>
  );
}

export default App;
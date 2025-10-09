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

// A safe deep merge function that uses the 'target' (default data) as a guide.
const deepMerge = (target, source) => {
    let output = { ...target };
    if (target && typeof target === 'object' && source && typeof source === 'object') {
        Object.keys(target).forEach(key => {
            if (source.hasOwnProperty(key) && source[key] !== undefined) {
                if (
                    typeof target[key] === 'object' && target[key] !== null && !Array.isArray(target[key]) &&
                    typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])
                ) {
                    output[key] = deepMerge(target[key], source[key]);
                } else {
                    output[key] = source[key];
                }
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
        profilePicDataUrl: '',
        bio: 'A brief description about yourself.', 
        location: { value: '', showOnPage: true }, 
        address: { value: '', showOnPage: false }, 
        links: { linkedin: '', github: '', email: currentUser.email || '' }, 
        hardSkills: { showOnPage: true, items: [] }, 
        softSkills: { showOnPage: true, items: [] }, 
        interests: { showOnPage: true, items: [] },
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
      setLoading(true);
      if (currentUser) {
        setUser(currentUser);
        const docRef = doc(db, "portfolios", currentUser.uid);
        const docSnap = await getDoc(docRef);
        const defaultData = createDefaultData(currentUser);
        const defaultStructure = defaultData.portfolios.default;

        if (docSnap.exists()) {
            const loadedData = docSnap.data();
            const finalPortfolios = {};
            
            if (loadedData.portfolios) {
                for (const versionId in loadedData.portfolios) {
                    finalPortfolios[versionId] = deepMerge(defaultStructure, loadedData.portfolios[versionId]);
                }
            }
            if (!finalPortfolios.default) {
                finalPortfolios.default = defaultStructure;
            }

            const finalData = {
                meta: deepMerge(defaultData.meta, loadedData.meta || {}),
                portfolios: finalPortfolios
            };
            
            setPortfolioData(finalData);
            setActivePortfolio(finalData.meta.activeVersion || 'default');
        } else {
          await setDoc(docRef, defaultData);
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

  const handlePortfolioUpdate = (portfolioId, path, value) => {
    setPortfolioData(prev => {
        const newState = JSON.parse(JSON.stringify(prev));
        const defaultStructure = createDefaultData(user).portfolios.default;
        
        let portfolioToUpdate = newState.portfolios[portfolioId];
        
        portfolioToUpdate = deepMerge(defaultStructure, portfolioToUpdate);
        
        const keys = path.split('.');
        let currentLevel = portfolioToUpdate;

        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            if (currentLevel[key] === undefined || currentLevel[key] === null) {
                currentLevel[key] = {};
            }
            currentLevel = currentLevel[key];
        }
        
        const finalKey = keys[keys.length - 1];
        
        if (typeof value === 'function') {
            const previousValue = currentLevel[finalKey];
            currentLevel[finalKey] = value(previousValue);
        } else {
            currentLevel[finalKey] = value;
        }

        newState.portfolios[portfolioId] = portfolioToUpdate;
        
        return newState;
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

  const handleCreateVersion = (newVersionName) => {
    const newVersionId = `v_${Date.now()}`;
    const basePortfolio = JSON.parse(JSON.stringify(portfolioData.portfolios[activePortfolio] || {}));
    const defaultStructure = createDefaultData(user).portfolios.default;
    const newPortfolio = deepMerge(defaultStructure, basePortfolio);
    
    setPortfolioData(prev => {
      const newVersions = [...(prev.meta?.versions || []), { id: newVersionId, name: newVersionName }];
      const newPortfolios = { ...prev.portfolios, [newVersionId]: newPortfolio };
      return { ...prev, meta: { ...prev.meta, versions: newVersions }, portfolios: newPortfolios };
    });

    setActivePortfolio(newVersionId);
    toast.success(`Created new version: "${newVersionName}"`);
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

  if (loading || (user && !portfolioData)) {
    return <div className="loading-screen">Loading Your Portfolio...</div>;
  }
  
  return (
    <>
      <ToastContainer position="bottom-right" autoClose={4000} theme="dark" />
      <Navbar 
        user={user} 
        handleSave={handleSave} 
        portfolioData={portfolioData} 
        activePortfolio={activePortfolio} 
        setActivePortfolio={setActivePortfolio} 
        handleDeleteVersion={handleDeleteVersion}
        handleCreateVersion={handleCreateVersion}
      />
      <Routes>
        <Route
          path="/"
          element={
            user ?
            <Dashboard
              portfolioData={portfolioData?.portfolios[activePortfolio]}
              activePortfolioId={activePortfolio}
              updatePortfolio={handlePortfolioUpdate}
            /> :
            <Login />
          }
        />
        <Route path="/p/:userId/:versionId?" element={<PublicPortfolio />} />
        
        {/* --- FIX IS HERE: Pass the 'user' object to the Resume component --- */}
        <Route path="/resume/:userId/:versionId?" element={<Resume user={user} />} />
        
      </Routes>
    </>
  );
}

export default App;
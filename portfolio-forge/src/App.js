import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { auth, db } from './firebase/config'; 
import { onAuthStateChanged } from 'firebase/auth';
import { 
  doc, setDoc, getDoc, collection, getDocs, deleteDoc, writeBatch 
} from "firebase/firestore"; 
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import PublicPortfolio from './components/PublicPortfolio';
import Resume from './components/Resume';
import './App.css';

// A safe deep merge function (NO CHANGE)
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

  // createDefaultData function (NO CHANGE)
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
        portfolioLink: { value: '', showOnPage: true },
        hardSkills: { showOnPage: true, items: [] }, 
        softSkills: { showOnPage: true, items: [] }, 
        interests: { showOnPage: true, items: [] },
        certifications: { showOnPage: true, items: [] }, 
        education: { college: { name: '', course: '', gradYear: '', showOnPage: true }, class12: { school: '', percentage: '', board: '', passingYear: '', showOnPage: false }, class10: { school: '', percentage: '', board: '', passingYear: '', showOnPage: false }, }, 
        projects: { showOnPage: true, items: [] }, 
        blogPosts: { showOnPage: false, showOnResume: false, items: [] },
        customSections: { title: 'Custom Section', showOnPage: false, showOnResume: false, items: [] }, 
        theme: { font: 'Poppins', backgroundColor: '#0a192f', textColor: '#ccd6f6', accentColor: '#64ffda', layout: 'standard', },
      }
    }
  });

  // useEffect with migration logic (NO CHANGE - This will still run)
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

            // --- ONE-TIME MIGRATION LOGIC ---
            // This migration script *still* deletes profilePicDataUrl from your old data.
            // This means your old portfolios will still show the CORS error.
            // Only *newly uploaded* pictures will have the "smart logic".
            if (loadedData.portfolios && typeof loadedData.portfolios === 'object') {
                toast.info("Upgrading your account. Please wait...", { autoClose: 5000,
                  position: "top-center" });
                setLoading(true);

                const oldPortfolios = loadedData.portfolios;
                const oldMeta = loadedData.meta || {};
                const versionsRef = collection(db, "portfolios", currentUser.uid, "versions");
                const batch = writeBatch(db);

                for (const versionId in oldPortfolios) {
                    if (oldPortfolios.hasOwnProperty(versionId)) {
                        const versionDocRef = doc(versionsRef, versionId);
                        const dataToSave = oldPortfolios[versionId];
                        
                        // --- THIS LINE IS STILL HERE ---
                        // It is removing the old base64 data to fix your 1.4MB document
                        delete dataToSave.profilePicDataUrl; 
                        
                        batch.set(versionDocRef, dataToSave);
                    }
                }

                batch.set(docRef, { meta: oldMeta });

                try {
                  await batch.commit();
                  toast.success("Account upgrade complete!");

                  const finalPortfolios = {};
                  for (const versionId in oldPortfolios) {
                       finalPortfolios[versionId] = deepMerge(defaultStructure, oldPortfolios[versionId]);
                  }
                  
                  const finalData = {
                      meta: deepMerge(defaultData.meta, oldMeta),
                      portfolios: finalPortfolios
                  };
                  setPortfolioData(finalData);
                  setActivePortfolio(finalData.meta.activeVersion || 'default');

                } catch (migrationError) {
                  console.error("Migration failed:", migrationError);
                  toast.error("Account upgrade failed. Please contact support.");
                }
                
                setLoading(false);
                return; 
            }
            // --- END OF MIGRATION LOGIC ---

            const finalPortfolios = {};
            const loadedMeta = loadedData.meta || {}; 
            const finalMeta = deepMerge(defaultData.meta, loadedMeta);
            
            const versionsRef = collection(db, "portfolios", currentUser.uid, "versions");
            const versionsSnap = await getDocs(versionsRef);

            versionsSnap.forEach(doc => {
                finalPortfolios[doc.id] = deepMerge(defaultStructure, doc.data());
            });

            if (!finalPortfolios.default) {
                finalPortfolios.default = defaultStructure;
                await setDoc(doc(versionsRef, 'default'), defaultStructure);
            }

            const finalData = {
                meta: finalMeta,
                portfolios: finalPortfolios
            };
            
            setPortfolioData(finalData);
            setActivePortfolio(finalData.meta.activeVersion || 'default');
        } else {
          await setDoc(docRef, { meta: defaultData.meta }); 
          await setDoc(doc(db, "portfolios", currentUser.uid, "versions", "default"), defaultData.portfolios.default);
          
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

  // handlePortfolioUpdate function (NO CHANGE)
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

  // handleDeleteVersion function (NO CHANGE)
  const handleDeleteVersion = async (versionIdToDelete) => {
    if (versionIdToDelete === 'default') {
        toast.error("You cannot delete your main portfolio.");
        return;
    }
    const versionName = portfolioData.meta.versions.find(v => v.id === versionIdToDelete)?.name || 'this version';
    
    try {
      const versionDocRef = doc(db, "portfolios", user.uid, "versions", versionIdToDelete);
      await deleteDoc(versionDocRef);
      
      setPortfolioData(prev => {
          const newVersions = prev.meta.versions.filter(v => v.id !== versionIdToDelete);
          const newPortfolios = { ...prev.portfolios };
          delete newPortfolios[versionIdToDelete];
          return { ...prev, meta: { ...prev.meta, versions: newVersions }, portfolios: newPortfolios };
      });
      
      setActivePortfolio('default');
      toast.success(`Deleted "${versionName}"`);

    } catch (error) {
        console.error("Error deleting version from database:", error);
        toast.error("Failed to delete version.");
    }
  };

  // handleCreateVersion function (NO CHANGE)
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

  // --- THIS FUNCTION IS MODIFIED ---
  // The "smart logic" is re-enabled here
  const handleSave = async () => {
    if (!user) return toast.error("You must be logged in to save.");
    const saveToastId = toast.loading("Saving your portfolio...");

    try {
      const userDocRef = doc(db, "portfolios", user.uid);
      const metaToSave = { 
        ...portfolioData.meta, 
        activeVersion: activePortfolio 
      };
      await setDoc(userDocRef, { meta: metaToSave }, { merge: true });

      const versionsRef = collection(db, "portfolios", user.uid, "versions");
      const batch = writeBatch(db);
      
      for (const versionId in portfolioData.portfolios) {
        const versionDocRef = doc(versionsRef, versionId);
        
        // We still make a copy to be safe
        const dataToSave = JSON.parse(JSON.stringify(portfolioData.portfolios[versionId]));
        
        // --- FIX IS HERE ---
        // We are NO LONGER deleting profilePicDataUrl
        // This re-enables your "smart logic" but risks the 1MB save error
        // delete dataToSave.profilePicDataUrl; // <-- THIS LINE IS REMOVED

        batch.set(versionDocRef, dataToSave, { merge: true });
      }
      
      await batch.commit();

      toast.update(saveToastId, { render: "Portfolio saved successfully!", type: "success", isLoading: false, autoClose: 3000 });

    } catch (error) {
      console.error("Error saving data:", error);
      if (error.code === 'invalid-argument' && error.message.includes('exceeds the maximum allowed size')) {
          // This error is now possible again
          toast.update(saveToastId, { render: "Error: Your profile picture is too large to save. Please use a smaller file.", type: "error", isLoading: false, autoClose: 5000 });
      } else {
          toast.update(saveToastId, { render: "There was an error saving.", type: "error", isLoading: false, autoClose: 5000 });
      }
    }
  };

  if (loading || (user && !portfolioData)) {
    return <div className="loading-screen">Loading Your Portfolio...</div>;
  }
  
  // Render/return function (NO CHANGE)
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
        
        <Route path="/resume/:userId/:versionId?" element={<Resume user={user} />} />
        
      </Routes>
    </>
  );
}

export default App;
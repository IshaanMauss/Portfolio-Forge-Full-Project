import React from 'react';
import ControlPanel from './ControlPanel';
import PreviewPanel from './PreviewPanel';
import Footer from './Footer';

// The Dashboard will now receive the activePortfolioId
function Dashboard({ portfolioData, activePortfolioId, updatePortfolio }) {

  if (!portfolioData) {
    return <div className="loading-screen">Loading Your Portfolio...</div>;
  }

  // --- THE FIX IS HERE ---
  // Create a new, simpler update function that already knows the active ID.
  // This function will be passed to ControlPanel, so ControlPanel doesn't need to know about IDs.
  const updateActivePortfolio = (path, value) => {
    // It calls the main update function from App.js with the correct ID
    updatePortfolio(activePortfolioId, path, value);
  };

  return (
    <>
      <div className="panels-container">
        <ControlPanel
          portfolioData={portfolioData}
          // Pass the new, smart updater function directly to the ControlPanel
          updatePortfolio={updateActivePortfolio}
        />
        <PreviewPanel portfolioData={portfolioData} />
      </div>
      <Footer />
    </>
  );
}

export default Dashboard;
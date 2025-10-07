import React from 'react';
import ControlPanel from './ControlPanel';
import PreviewPanel from './PreviewPanel';
import Footer from './Footer';

// The Dashboard is now simpler. It just passes the right data and the new updater function.
function Dashboard({ portfolioData, updatePortfolio }) {

  if (!portfolioData) {
    return <div className="loading-screen">Loading Your Portfolio...</div>;
  }

  return (
    <>
      <div className="panels-container">
        <ControlPanel
          portfolioData={portfolioData}
          // Pass the centralized updater function directly to the ControlPanel
          updatePortfolio={updatePortfolio}
        />
        <PreviewPanel portfolioData={portfolioData} />
      </div>
      <Footer />
    </>
  );
}

export default Dashboard;
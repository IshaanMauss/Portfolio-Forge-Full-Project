import React from 'react';
import ControlPanel from './ControlPanel';
import PreviewPanel from './PreviewPanel';
import Footer from './Footer'; // <-- 1. Import the Footer

function Dashboard({ portfolioData, setPortfolioData }) {
  if (!portfolioData) {
    return <div className="loading-screen">Loading Your Portfolio...</div>;
  }

  return (
    <> {/* Use a fragment to wrap multiple components */}
      <div className="panels-container">
        <ControlPanel 
          portfolioData={portfolioData} 
          setPortfolioData={setPortfolioData} 
        />
        <PreviewPanel portfolioData={portfolioData} />
      </div>
      <Footer /> {/* <-- 2. Add the Footer component here */}
    </>
  );
}

export default Dashboard;
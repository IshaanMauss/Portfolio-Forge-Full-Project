import React, { useState } from 'react';
import ControlPanel from './ControlPanel';
import PreviewPanel from './PreviewPanel';
import Footer from './Footer';

function Dashboard({ portfolioData, updatePortfolio }) {
  // On phones only one panel is shown at a time.
  const [tab, setTab] = useState('edit');

  if (!portfolioData) {
    return <div className="loading-screen">Loading Your Portfolio...</div>;
  }

  return (
    <>
      <div className="mobile-tabs" role="tablist" aria-label="Editor view">
        <button type="button" role="tab" aria-selected={tab === 'edit'} className={tab === 'edit' ? 'active' : ''} onClick={() => setTab('edit')}>Edit</button>
        <button type="button" role="tab" aria-selected={tab === 'preview'} className={tab === 'preview' ? 'active' : ''} onClick={() => setTab('preview')}>Preview</button>
      </div>
      <div className={`panels-container show-${tab}`}>
        <ControlPanel portfolioData={portfolioData} updatePortfolio={updatePortfolio} />
        <PreviewPanel portfolioData={portfolioData} />
      </div>
      <Footer />
    </>
  );
}

export default Dashboard;

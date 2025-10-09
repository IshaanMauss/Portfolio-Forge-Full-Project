import React from 'react';
import FeedbackForm from './FeedbackForm';

// --- FIX: Accept 'currentUser' prop and provide a fallback ---
function FeedbackToast({ closeToast, userId, currentUser = {} }) {
  return (
    <div className="toast-modal-content">
      <h4>Enjoying Portfolio Forge?</h4>
      <p>Your feedback helps improve the app. Please take a moment to leave a rating and comment.</p>
      
      {/* --- Pass 'currentUser' down to the form --- */}
      <FeedbackForm portfolioOwnerId={userId} closeToast={closeToast} currentUser={currentUser} />

      <div className="toast-actions" style={{ justifyContent: 'center', marginTop: '1rem' }}>
        <button className="btn-secondary" onClick={closeToast}>
          I'll review later
        </button>
      </div>

    </div>
  );
}

export default FeedbackToast;
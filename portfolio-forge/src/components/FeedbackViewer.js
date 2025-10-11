import React from 'react';
import './FeedbackViewer.css';

function StarDisplay({ rating }) {
  return (
    <div className="star-display">
      {[...Array(5)].map((_, index) => (
        <span key={index} className={index < rating ? '' : 'star-empty'}>
          ★
        </span>
      ))}
    </div>
  );
}

function FeedbackViewer({ feedbackList, loading }) {

  if (loading) {
    return <p>Loading feedback...</p>;
  }

  // --- FIX 2: A function to format the date correctly ---
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp.toDate());
    // Manually get day, month, and year
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
    const year = date.getFullYear();
    // Return in DD/MM/YYYY format
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="feedback-viewer-container">
      {feedbackList.length === 0 ? (
        <p>You have not received any feedback yet.</p>
      ) : (
        <div className="item-list">
          {feedbackList.map((feedback) => (
            <div key={feedback.id} className="list-item feedback-item">
              <div className="feedback-header">
                <StarDisplay rating={feedback.rating} />
                <span className="feedback-date">
                  {/* Use the new formatting function */}
                  {formatDate(feedback.timestamp)}
                </span>
              </div>
              <p className="feedback-comment">"{feedback.comment}"</p>
              
              {/* --- FIX 1: Displaying the submitter's email --- */}
              <p className="feedback-email">
                From: {feedback.submitterEmail || 'Anonymous'}
              </p>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default FeedbackViewer;
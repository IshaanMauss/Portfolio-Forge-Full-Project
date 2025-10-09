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
                  {feedback.timestamp ? new Date(feedback.timestamp.toDate()).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              <p className="feedback-comment">"{feedback.comment}"</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default FeedbackViewer;
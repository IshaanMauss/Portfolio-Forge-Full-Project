import React, { useState } from 'react';
import { db } from '../firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from 'react-toastify';
import './FeedbackForm.css';

// --- FIX: Accept 'currentUser' as a prop ---
function FeedbackForm({ closeToast, portfolioOwnerId, currentUser }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // The form no longer needs to find auth.currentUser itself
    
    if (rating === 0) {
      toast.warn("Please select a star rating.");
      return;
    }
    if (!comment.trim()) {
      toast.warn("Please leave a comment.");
      return;
    }
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'feedback'), {
        portfolioContextId: portfolioOwnerId,
        
        // --- FIX: Use the 'currentUser' from props ---
        submitterId: currentUser ? currentUser.uid : 'anonymous',
        submitterEmail: currentUser ? currentUser.email : 'anonymous',
        
        rating,
        comment,
        timestamp: serverTimestamp()
      });
      
      toast.success("Thank you for your feedback!");
      
      if (closeToast) {
        closeToast();
      }

      setRating(0);
      setComment('');
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast.error("Could not submit feedback. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="feedback-form-container">
      <form onSubmit={handleSubmit}>
        <div className="star-rating">
          {[1, 2, 3, 4, 5].map((star) => (
            <span
              key={star}
              className={hoverRating >= star || rating >= star ? 'star-filled' : 'star-empty'}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
            >
              ★
            </span>
          ))}
        </div>
        <textarea
          rows="4"
          placeholder="Share your thoughts or suggestions..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          required
        />
        <button type="submit" className="add-btn" disabled={isSubmitting}>
          {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
        </button>
      </form>
    </div>
  );
}

export default FeedbackForm;
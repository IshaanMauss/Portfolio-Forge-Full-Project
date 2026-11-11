import React, { useState } from 'react';
import { db } from '../firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from 'react-toastify';
import './FeedbackForm.css';

const MAX_COMMENT = 1000;

// Signed-in users only (enforced by firestore.rules too). One small document per submission.
function FeedbackForm({ closeToast, portfolioOwnerId, currentUser }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) { toast.warn('Please sign in to leave feedback.'); return; }
    if (rating === 0) { toast.warn('Please select a star rating.'); return; }
    const text = comment.trim();
    if (!text) { toast.warn('Please leave a comment.'); return; }
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'feedback'), {
        portfolioContextId: String(portfolioOwnerId || '').slice(0, 128),
        submitterId: currentUser.uid,
        submitterEmail: currentUser.email || '',
        rating,
        comment: text.slice(0, MAX_COMMENT),
        timestamp: serverTimestamp(),
      });
      toast.success('Thank you for your feedback!');
      if (closeToast) closeToast();
      setRating(0);
      setComment('');
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error('Could not submit feedback. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="feedback-form-container">
      <form onSubmit={handleSubmit}>
        <div className="star-rating" role="radiogroup" aria-label="Rating">
          {[1, 2, 3, 4, 5].map((star) => (
            <span
              key={star}
              role="radio"
              aria-checked={rating === star}
              aria-label={`${star} star${star > 1 ? 's' : ''}`}
              className={hoverRating >= star || rating >= star ? 'star-filled' : 'star-empty'}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
            >
              ★
            </span>
          ))}
        </div>
        <textarea rows="4" maxLength={MAX_COMMENT} placeholder="Share your thoughts or suggestions..." value={comment} onChange={(e) => setComment(e.target.value)} required />
        <button type="submit" className="add-btn" disabled={isSubmitting}>{isSubmitting ? 'Submitting...' : 'Submit Feedback'}</button>
      </form>
    </div>
  );
}

export default FeedbackForm;

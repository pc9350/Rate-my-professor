// components/ReviewForm.js
import { useState } from 'react';

export default function ReviewForm({ professorId, onReviewSubmit }) {
  const [review, setReview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const response = await fetch('/api/analyze-review', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ professorId, review }),
    });

    const result = await response.json();
    setIsSubmitting(false);

    if (response.ok) {
      onReviewSubmit(result);
    } else {
      console.error('Error submitting review:', result.error);
    }

    setReview('');
  };

  return (
    <form onSubmit={handleSubmit}>
      <textarea
        value={review}
        onChange={(e) => setReview(e.target.value)}
        placeholder="Write your review..."
        required
      />
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Submitting...' : 'Submit Review'}
      </button>
    </form>
  );
}

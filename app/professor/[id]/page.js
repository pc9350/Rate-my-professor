// app/professor/[id]/page.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import ReviewForm from '../../../components/ReviewForm';
import ReviewList from '../../../components/ReviewList';

export default function ProfessorPage() {
  const router = useRouter();
  const { id: professorId } = router.query; // Get the dynamic professor ID from the URL
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    if (professorId) {
      const fetchReviews = async () => {
        const response = await fetch(`/api/get-reviews?professorId=${professorId}`);
        const result = await response.json();

        if (response.ok) {
          setReviews(result.reviews);
        } else {
          console.error('Error fetching reviews:', result.error);
        }
      };

      fetchReviews();
    }
  }, [professorId]);

  const handleReviewSubmit = (newReview) => {
    setReviews((prevReviews) => [...prevReviews, newReview.sentimentData]);
  };

  return (
    <div>
      <h2>Professor Details</h2>
      {/* Include professor details here if needed */}
      
      <ReviewForm professorId={professorId} onReviewSubmit={handleReviewSubmit} />
      <ReviewList reviews={reviews} />
    </div>
  );
}

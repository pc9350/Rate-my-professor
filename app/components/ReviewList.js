// components/ReviewList.js
export default function ReviewList({ reviews }) {
    return (
      <div>
        <h3>Professor Reviews</h3>
        <ul>
          {reviews.map((review, index) => (
            <li key={index}>
              <p>{review.text}</p>
              <p>Sentiment: {review.sentiment} (Confidence: {review.confidence.toFixed(2)})</p>
            </li>
          ))}
        </ul>
      </div>
    );
  }
  
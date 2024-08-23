// utils/transformerSentimentAnalysis.js
import { pipeline } from '@huggingface/inference';

const sentimentPipeline = pipeline('sentiment-analysis');

export async function analyzeSentiment(review) {
  const results = await sentimentPipeline(review);
  const sentiment = results[0].label;
  const score = results[0].score;
  
  // Convert sentiment to a numeric score (optional)
  const sentimentScore = sentiment === 'POSITIVE' ? score : -score;

  return sentimentScore; // or return both sentiment and score if needed
}

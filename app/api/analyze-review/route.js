// app/api/analyze-review/route.js

import { HfInference } from "@huggingface/inference";
import { Pinecone } from "@pinecone-database/pinecone";

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

async function analyzeSentiment(text) {
  const response = await hf.textClassification({
    model: "distilbert-base-uncased-finetuned-sst-2-english",
    inputs: text,
  });

  // Extract sentiment and confidence score
  const sentiment = response[0].label;
  const confidence = response[0].score;

  // Convert sentiment label to a numeric score
  const sentimentScore = sentiment === "POSITIVE" ? confidence : -confidence;

  return { sentiment, sentimentScore, confidence };
}

async function upsertSentimentReview(professorId, review, sentimentData) {
  const index = pinecone.Index("professors-index");

  await index.upsert([
    {
      id: `${professorId}-${Date.now()}`,
      values: [sentimentData.sentimentScore],
      metadata: {
        text: review,
        sentiment: sentimentData.sentiment,
        confidence: sentimentData.confidence,
        professorId,
      },
    },
  ]);
}

export async function POST(req) {
  const { professorId, review } = await req.json();

  try {
    // Analyze the sentiment of the review
    const sentimentData = await analyzeSentiment(review);

    // Upsert the sentiment analysis result into Pinecone
    await upsertSentimentReview(professorId, review, sentimentData);

    return new Response(
      JSON.stringify({ success: true, sentimentData }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
}

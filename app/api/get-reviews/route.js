// app/api/get-reviews/route.js

import { Pinecone } from "@pinecone-database/pinecone";

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const professorId = searchParams.get('professorId');

  try {
    const index = pinecone.Index("professors-index");
    const queryResponse = await index.query({
      filter: { professorId },
      includeMetadata: true,
    });

    const reviews = queryResponse.matches.map(match => match.metadata);

    return new Response(JSON.stringify({ reviews }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
}

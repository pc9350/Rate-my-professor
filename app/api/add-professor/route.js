import fs from 'fs';
import dotenv from 'dotenv';
import { Pinecone } from '@pinecone-database/pinecone';
import { NextResponse } from 'next/server'; // Assuming you are using Next.js

dotenv.config();

const pineconeApiKey = process.env.PINECONE_API_KEY;
const pinecone = new Pinecone({
  apiKey: pineconeApiKey,
});

const indexName = process.env.PINECONE_INDEX_NAME;
// const pineconeHost = 'https://reviews-p65tg5l.svc.aped-4627-b74a.pinecone.io'; // Adjust as necessary

// Function to pad vectors to 1536 dimensions
const padVector = (vector, targetLength = 1536) => {
  if (vector.length >= targetLength) {
    return vector.slice(0, targetLength);
  }
  const paddedVector = new Array(targetLength).fill(0); // Initialize with zeros
  for (let i = 0; i < vector.length; i++) {
    paddedVector[i] = vector[i]; // Copy existing vector values
  }
  return paddedVector;
};

// Define the handler function for the route
export async function POST(request) {
  try {
    // Parse the incoming request body
    const { professorName, reviewText } = await request.json();

    // Here you would convert the reviewText to a vector using your preferred embedding model
    // For the example, we use a dummy vector and pad it to 1536 dimensions
    const dummyVector = [6187, 13, 14006, 318, 15347, 546, 262, 2858, 290, 1838, 262, 1398, 11932, 351, 2832, 12, 261, 4568, 13];
    const vector = padVector(dummyVector); // Pad the vector to 1536 dimensions

    // Upsert the vector into Pinecone
    const index = pinecone.Index(indexName);
    await index.upsert([
      {
        id: `professor_${Date.now()}`, // Unique ID using timestamp
        values: vector,
        metadata: { professorName, reviewText },
      },
    ]);

    // Return a success response
    return NextResponse.json({ message: 'Professor added successfully' });
  } catch (error) {
    console.error('Error adding professor:', error);
    return NextResponse.json({ error: 'Error adding professor' }, { status: 500 });
  }
}

import fs from "fs"; // File system module for reading files
import { encode } from "gpt-3-encoder"; // Placeholder for text encoding
import dotenv from "dotenv";
import { Pinecone } from "@pinecone-database/pinecone"; // Import Pinecone client

dotenv.config();

// Initialize Pinecone client with only the API key
const pineconeApiKey = process.env.PINECONE_API_KEY;
const pinecone = new Pinecone({
  apiKey: pineconeApiKey,
});

const indexName = process.env.PINECONE_INDEX_NAME;
// const pineconeHost = 'https://reviews-p65tg5l.svc.aped-4627-b74a.pinecone.io'; // Direct host URL

// Function to generate vector embeddings from text
const generateVector = (text) => {
    // Replace this with actual embedding generation logic
    const vector = encode(text);
  
    // Ensure the vector has exactly 1536 dimensions
    if (vector.length >= 1536) {
      return vector.slice(0, 1536);
    } else {
      // Pad the vector with zeros if it's shorter than 1536 dimensions
      return [...vector, ...Array(1536 - vector.length).fill(0)];
    }
  };

// Function to read and process reviews.json
const processReviews = () => {
  try {
    // Read the reviews.json file
    const data = fs.readFileSync("reviews.json", "utf8");
    const jsonData = JSON.parse(data); // Parse JSON data

    // Map through each review and create vectors
    const vectors = jsonData.Review.map((review, index) => {
      const vector = generateVector(review.reviews); // Generate vector from review text
      return {
        id: `professor_${index + 1}`, // Create a unique ID for each review
        values: vector, // Vector embedding for Pinecone
      };
    });

    return vectors;
  } catch (error) {
    console.error("Error reading or processing reviews.json:", error);
    return [];
  }
};

// Function to upsert vectors into Pinecone with retry logic
const upsertVectors = async (vectors, retries = 3) => {
  try {
    // Connect to the index using the specified host
    const index = pinecone.Index(indexName);

    // Upsert the vectors
    await index.upsert(vectors);

    console.log("Upsert successful");
  } catch (error) {
    console.error("Error upserting vectors:", error); // Log any errors

    // Retry logic for network errors
    if (error.code === 'ECONNRESET' && retries > 0) {
      console.log(`Retrying upsert operation (${3 - retries} retries left)...`);
      await new Promise(res => setTimeout(res, 2000)); // Wait for 2 seconds before retrying
      await upsertVectors(vectors, retries - 1); // Retry the upsert operation
    } else {
      console.error("Failed to upsert vectors after retries:", error);
    }
  }
};

// Main function to execute the process
const main = async () => {
  const vectors = processReviews(); // Get vectors from reviews.json
  console.log("Vectors:", vectors); // Log vectors for debugging
  if (vectors.length > 0) {
    await upsertVectors(vectors); // Upsert vectors into Pinecone
  } else {
    console.log("No vectors to upsert."); // Log if no vectors are available
  }
};

// Run the main function
main();

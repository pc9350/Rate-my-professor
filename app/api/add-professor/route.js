// app/api/add-professor/route.js

import { HfInference } from "@huggingface/inference";
import { Pinecone } from "@pinecone-database/pinecone";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { NextResponse } from "next/server";
import OpenAI from "openai";
import { inMemoryVectorStore } from "../shared-memory";

// Add configurable logger
const isDev = process.env.NODE_ENV === 'development';

// Create a configurable logger
const logger = {
  // Always log errors regardless of environment
  error: (...args) => console.error(...args),
  
  // Only log info in development or if forced
  log: (...args) => {
    if (isDev || process.env.FORCE_SERVER_LOGS === 'true') {
      console.log(...args);
    }
  },
  
  // Debug level logs - only in development
  debug: (...args) => {
    if (isDev) {
      console.log('[DEBUG]', ...args);
    }
  },
  
  // Critical logs that should always appear
  critical: (...args) => console.log('[CRITICAL]', ...args)
};

let hf, pinecone, openai;

try {
  hf = new HfInference(process.env.HUGGINGFACE_API_KEY);
  pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY,
  });
  openai = new OpenAI({ apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY });
  logger.log("API clients initialized in add-professor route");
} catch (error) {
  logger.error("Error initializing API clients in add-professor route:", error);
}

// Test Pinecone connection immediately
(async function testPineconeConnection() {
  try {
    if (!pinecone) {
      logger.error("Pinecone client not initialized");
      return;
    }
    
    logger.log("Testing Pinecone connection...");
    
    // Skip version check as it's not available in this version of the SDK
    // Instead just try to list indexes
    try {
      // List indexes to confirm we can access them
      const indexesResponse = await pinecone.listIndexes();
      logger.debug("Pinecone indexes response:", JSON.stringify(indexesResponse));
      
      // Log specific details about the response
      if (typeof indexesResponse === 'object') {
        if (indexesResponse.indexes) {
          logger.log("Available indexes:", indexesResponse.indexes.map(idx => idx.name || idx.id).join(', '));
        } else {
          logger.debug("Response keys:", Object.keys(indexesResponse).join(', '));
        }
      } else if (Array.isArray(indexesResponse)) {
        logger.log("Available indexes (array):", indexesResponse.join(', '));
      } else {
        logger.debug("Unexpected response type:", typeof indexesResponse);
      }
      
      logger.log("Pinecone connection test completed successfully");
    } catch (error) {
      logger.error("Error listing Pinecone indexes:", error);
    }
  } catch (error) {
    logger.error("Pinecone connection test failed:", error);
  }
})();

// Ensure the Pinecone index exists
async function ensureIndexExists() {
  try {
    if (!pinecone) {
      throw new Error("Pinecone client not initialized");
    }
    
    const indexName = "professors-index";
    
    // Get the list of existing indexes
    logger.log("Checking for existing Pinecone indexes...");
    const indexesResponse = await pinecone.listIndexes();
    
    // Handle different response formats
    // In the newer Pinecone SDK, the response might be an object with an 'indexes' array
    let indexExists = false;
    
    if (indexesResponse) {
      if (Array.isArray(indexesResponse)) {
        // Old format: direct array of index names
        indexExists = indexesResponse.includes(indexName);
        logger.log(`Found indexes (array format): ${indexesResponse.join(', ')}`);
      } else if (typeof indexesResponse === 'object' && indexesResponse.indexes) {
        // New format: object with 'indexes' array of objects
        indexExists = indexesResponse.indexes.some(index => 
          index.name === indexName || index.id === indexName
        );
        logger.log(`Found indexes (object format): ${indexesResponse.indexes.map(i => i.name || i.id).join(', ')}`);
      } else {
        // Unknown format, log it for debugging
        logger.debug("Unexpected Pinecone response format:", JSON.stringify(indexesResponse));
        
        // Try a direct index access as a fallback
        try {
          const index = pinecone.Index(indexName);
          await index.describeIndexStats();
          indexExists = true;
          logger.log(`Index ${indexName} exists (verified via direct access)`);
        } catch (directAccessError) {
          logger.log(`Index ${indexName} doesn't exist (verified via direct access error)`, directAccessError.message);
          indexExists = false;
        }
      }
    }
    
    // Create the index if it doesn't exist
    if (!indexExists) {
      logger.log(`Index ${indexName} does not exist. Creating...`);
      
      try {
        await pinecone.createIndex({
          name: indexName,
          dimension: 768, // Dimension for sentence-transformers/nli-bert-large
          metric: "cosine",
        });
        
        logger.log(`Index ${indexName} created successfully`);
        
        // Wait for the index to be ready
        logger.log("Waiting for index to be ready...");
        await new Promise(resolve => setTimeout(resolve, 30000));
      } catch (createError) {
        logger.error("Error creating index:", createError);
        // If creation fails, still try to return the index - it might already exist
        // but just not appear in the list (race condition)
      }
    } else {
      logger.log(`Index ${indexName} already exists`);
    }
    
    // Return the index instance
    return pinecone.Index(indexName);
  } catch (error) {
    logger.error("Error ensuring index exists:", error);
    
    // Fallback: try to use the index even if checking failed
    try {
      logger.log("Attempting to use index directly despite check failure");
      return pinecone.Index("professors-index");
    } catch (fallbackError) {
      logger.error("Fallback also failed:", fallbackError);
      throw new Error(`Failed to ensure index exists: ${error.message}`);
    }
  }
}

async function getEmbedding(text) {
  try {
    // Try HuggingFace first
    logger.log("Attempting to generate embedding with HuggingFace");
    const response = await hf.featureExtraction({
      model: "sentence-transformers/nli-bert-large",
      inputs: text,
    });

    if (
      Array.isArray(response) &&
      response.every((item) => typeof item === "number")
    ) {
      logger.log("HuggingFace embedding generated successfully (direct array)");
      return response;
    } else if (Array.isArray(response) && Array.isArray(response[0])) {
      logger.log("HuggingFace embedding generated successfully (nested array)");
      return response[0];
    } else if (typeof response === "number") {
      logger.log("HuggingFace embedding generated successfully (single number)");
      return [response];
    } else {
      throw new Error("Unexpected HuggingFace embedding format");
    }
  } catch (hfError) {
    // If HuggingFace fails, try OpenAI as a fallback
    logger.error("Error with HuggingFace embedding:", hfError);
    logger.log("Falling back to OpenAI for embeddings");
    
    try {
      if (!openai) {
        throw new Error("OpenAI client not initialized");
      }
      
      const response = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: text,
        dimensions: 768 // Match the dimension with HuggingFace model
      });
      
      logger.log("OpenAI embedding generated successfully");
      return response.data[0].embedding;
    } catch (openaiError) {
      logger.error("Error with OpenAI embedding fallback:", openaiError);
      throw new Error(`All embedding methods failed: ${hfError.message}, then: ${openaiError.message}`);
    }
  }
}

async function splitText(text) {
  try {
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000, // Reduced from 2000 to get more focused chunks
      chunkOverlap: 200, // Increased from 100 to improve context preservation
    });
    return await splitter.splitText(text);
  } catch (error) {
    logger.error("Error splitting text:", error);
    throw new Error(`Failed to split text: ${error.message}`);
  }
}

// Update embedAndStore to handle refreshing
async function embedAndStore(chunks, source, isRefresh = false) {
  try {
    if (!chunks || chunks.length === 0) {
      throw new Error("No text chunks to embed");
    }

    // Try to use Pinecone first
    let index;
    let useFallback = false;
    
    try {
      index = await ensureIndexExists();
      logger.log("Pinecone index confirmed for embedding storage");
      
      // If this is a refresh operation, delete the existing vectors for this source
      if (isRefresh) {
        logger.log(`Refresh operation detected for ${source}, removing existing data`);
        try {
          // Need to delete vectors with IDs that start with the source
          // First get all vectors matching this source
          const existingData = await index.query({
            filter: { source: { $eq: source } },
            topK: 1000,
            includeMetadata: false,
          });
          
          if (existingData && existingData.matches && existingData.matches.length > 0) {
            const idsToDelete = existingData.matches.map(match => match.id);
            
            logger.log(`Found ${idsToDelete.length} existing vectors to delete for source ${source}`);
            
            // Delete in batches to avoid hitting API limits
            const batchSize = 100;
            for (let i = 0; i < idsToDelete.length; i += batchSize) {
              const batch = idsToDelete.slice(i, i + batchSize);
              await index.delete({
                ids: batch
              });
              logger.log(`Deleted batch of ${batch.length} vectors`);
            }
            
            logger.log(`Successfully deleted all existing data for ${source}`);
          } else {
            logger.log(`No existing data found for ${source}`);
          }
        } catch (deleteError) {
          logger.error(`Error deleting existing data for ${source}:`, deleteError);
          // Continue with the upsert even if deletion fails
        }
      }
    } catch (indexError) {
      logger.error("Could not access Pinecone index, using in-memory fallback:", indexError);
      useFallback = true;
    }
    
    // Create a unique ID prefix with timestamp to help with versioning
    const idPrefix = `${source}-${Date.now()}`;
    
    // Store chunks in batches to avoid rate limits
    const batchSize = 5;
    const results = [];
    
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      const batchVectors = [];
      
      for (let j = 0; j < batch.length; j++) {
        const chunk = batch[j];
        const embedding = await getEmbedding(chunk);
        
        batchVectors.push({
          id: `${idPrefix}-${i + j}`,
          values: embedding,
          metadata: { 
            text: chunk, 
            source, 
            chunkIndex: i + j,
            timestamp: Date.now()
          },
        });
      }
      
      // Upsert the batch to either Pinecone or in-memory store
      let upsertResult;
      
      if (!useFallback) {
        try {
          upsertResult = await index.upsert(batchVectors);
        } catch (pineconeError) {
          logger.error("Pinecone upsert failed, using in-memory fallback:", pineconeError);
          useFallback = true;
          upsertResult = inMemoryVectorStore.upsert(batchVectors);
        }
      } else {
        upsertResult = inMemoryVectorStore.upsert(batchVectors);
      }
      
      results.push(upsertResult);
      
      // Small delay to avoid rate limits
      if (i + batchSize < chunks.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    return results;
  } catch (error) {
    logger.error("Error storing vectors:", error);
    throw new Error(`Failed to store vectors: ${error.message}`);
  }
}

export async function POST(req) {
  try {
    logger.log("POST request received to /api/add-professor");
    
    const body = await req.json();
    const { text, source, chunkIndex, totalChunks, isRefresh } = body;
    
    // Validate required fields
    if (!text) {
      return NextResponse.json(
        { error: "Text is required" }, 
        { status: 400 }
      );
    }
    
    if (!source) {
      return NextResponse.json(
        { error: "Source (professor ID) is required" }, 
        { status: 400 }
      );
    }

    logger.log(`Processing chunk ${chunkIndex + 1}/${totalChunks} for professor: ${source}${isRefresh ? ' (REFRESH OPERATION)' : ''}`);
    
    // Split the text into smaller pieces
    const chunks = await splitText(text);
    logger.log(`Split into ${chunks.length} chunks`);
    
    // Store the chunks in Pinecone
    const results = await embedAndStore(chunks, source, isRefresh);
    logger.log(`Successfully stored ${chunks.length} chunks in Pinecone`);

    return NextResponse.json({
      success: true,
      chunks: chunks.length,
      processedChunk: chunkIndex + 1,
      totalChunks: totalChunks,
      refreshed: !!isRefresh
    });
  } catch (error) {
    logger.error("Error processing request:", error);
    return NextResponse.json(
      { error: error.message || "An unknown error occurred" }, 
      { status: 500 }
    );
  }
}

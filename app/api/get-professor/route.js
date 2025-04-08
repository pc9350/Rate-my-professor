import { HfInference } from "@huggingface/inference";
import { NextResponse } from "next/server";
import { Pinecone } from "@pinecone-database/pinecone";
import OpenAI from "openai";
import { inMemoryVectorStore, sessionStore } from "../shared-memory";

// Add near the top of the file, after imports
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

// Initialize with try/catch to catch initialization errors
let hf, pinecone, openai;

try {
  hf = new HfInference(process.env.HUGGINGFACE_API_KEY);
  pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
  openai = new OpenAI({ apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY });
  
  logger.log("API clients initialized successfully");
} catch (error) {
  logger.error("Error initializing API clients:", error);
}

// After initializing the clients

// Test Pinecone connection immediately
(async function testPineconeConnection() {
  try {
    if (!pinecone) {
      logger.error("Pinecone client not initialized in get-professor route");
      return;
    }
    
    logger.log("Testing Pinecone connection in get-professor route...");
    
    // Skip version check which isn't available
    // Try direct access to the index instead
    try {
      const index = pinecone.Index("professors-index");
      const stats = await index.describeIndexStats();
      logger.debug("Index stats:", stats);
      logger.log("Direct access to professors-index successful");
    } catch (indexError) {
      logger.error("Error directly accessing index:", indexError);
    }
    
    logger.log("Pinecone connection test in get-professor completed");
  } catch (error) {
    logger.error("Pinecone connection test in get-professor failed:", error);
  }
})();

async function getEmbedding(text) {
  try {
    // Try HuggingFace first
    logger.log(`Generating HuggingFace embedding for text: "${text.substring(0, 50)}..."`);
    
    const response = await hf.featureExtraction({
      model: "sentence-transformers/nli-bert-large",
      inputs: text,
    });

    if (Array.isArray(response) && response.every((item) => typeof item === "number")) {
      logger.log("HuggingFace embedding generated successfully (direct array)");
      return response;
    } else if (Array.isArray(response) && Array.isArray(response[0])) {
      logger.log("HuggingFace embedding generated successfully (nested array)");
      return response[0];
    } else if (typeof response === "number") {
      logger.log("HuggingFace embedding generated successfully (single number)");
      return [response];
    } else {
      logger.error("Unexpected HuggingFace embedding format:", typeof response);
      throw new Error(`Unexpected HuggingFace embedding format: ${typeof response}`);
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

function parseProfessorInfo(text) {
  const professorInfo = {};

  const nameMatch = text.match(/Name:\s*(.*?),\s*Department/);
  const departmentMatch = text.match(/Department:\s*(.*?),\s*Overall/);
  const overallRatingMatch = text.match(/Overall Rating:\s*([\d.]+)/);
  const numberOfRatingsMatch = text.match(/Number of Ratings:\s*(\d+)/);
  const wouldTakeAgainMatch = text.match(/Would Take Again:\s*([\d%]+)/);
  const difficultyMatch = text.match(/Difficulty:\s*([\d.]+)/);
  const topTagsMatch = text.match(/Top Tags:\s*(.*?)(?:,\s*Feedbacks:|$)/);

  professorInfo.name = nameMatch ? nameMatch[1] : null;
  professorInfo.department = departmentMatch ? departmentMatch[1] : null;
  professorInfo.overallRating = overallRatingMatch
    ? parseFloat(overallRatingMatch[1])
    : null;
  professorInfo.numberOfRatings = numberOfRatingsMatch
    ? parseInt(numberOfRatingsMatch[1], 10)
    : null;
  professorInfo.wouldTakeAgain = wouldTakeAgainMatch
    ? wouldTakeAgainMatch[1]
    : null;
  professorInfo.difficulty = difficultyMatch
    ? parseFloat(difficultyMatch[1])
    : null;
  professorInfo.topTags = topTagsMatch
    ? topTagsMatch[1].split(",").map((tag) => tag.trim())
    : [];

  // Extract courses information from Feedbacks
  const feedbacks = [];
  const feedbacksMatch = text.match(/Feedbacks:\s*(.*?)$/s);
  
  // Add debug logging if professor is Tracy Puccinelli
  const isTracyPuccinelli = professorInfo.name && professorInfo.name.toLowerCase().includes('tracy puccinelli');
  if (isTracyPuccinelli) {
    logger.log("Processing Tracy Puccinelli's feedbacks");
    logger.log("Feedback text:", feedbacksMatch ? feedbacksMatch[1].substring(0, 500) + "..." : "No feedbacks found");
  }
  
  if (feedbacksMatch && feedbacksMatch[1]) {
    const feedbacksText = feedbacksMatch[1];
    const feedbackEntries = feedbacksText.split(';');
    
    feedbackEntries.forEach((entry, index) => {
      if (isTracyPuccinelli) {
        logger.log(`Processing feedback entry ${index + 1}:`, entry.substring(0, 100) + "...");
      }
      
      const courseMatch = entry.match(/Course:\s*(.*?)(?:,|$)/);
      if (courseMatch && courseMatch[1] && courseMatch[1].trim()) {
        // Enhanced course name cleaning
        let courseName = courseMatch[1].trim();
        
        // Log original course name for debugging Tracy's data
        if (isTracyPuccinelli) {
          logger.log(`Original course name: "${courseName}"`);
        }
        
        // Remove duplicate course codes (e.g., "CS101 CS101" → "CS101")
        // First try pattern like "ABCD123 ABCD123"
        const duplicatedCodePattern = /(\b[A-Z]+\d+\b)\s+\1\b/gi;
        if (duplicatedCodePattern.test(courseName)) {
          const originalCourseName = courseName;
          courseName = courseName.replace(duplicatedCodePattern, '$1');
          if (isTracyPuccinelli) {
            logger.log(`Fixed duplicated code: "${originalCourseName}" → "${courseName}"`);
          }
        }
        
        // More general approach for any duplicate strings
        const duplicatedWordPattern = /(\b\w+\b) \1\b/g;
        if (duplicatedWordPattern.test(courseName)) {
          const originalCourseName = courseName;
          courseName = courseName.replace(duplicatedWordPattern, '$1');
          if (isTracyPuccinelli) {
            logger.log(`Fixed duplicated word: "${originalCourseName}" → "${courseName}"`);
          }
        }
        
        // Handle case like "INTEREGR 170 INTEREGR 170" (with space between letters and numbers)
        const duplicatedCoursePattern = /(\b[A-Z]+)\s+(\d+)\s+\1\s+\2\b/gi;
        if (duplicatedCoursePattern.test(courseName)) {
          const originalCourseName = courseName;
          courseName = courseName.replace(duplicatedCoursePattern, '$1 $2');
          if (isTracyPuccinelli) {
            logger.log(`Fixed duplicated course with space: "${originalCourseName}" → "${courseName}"`);
          }
        }
        
        // Extract and clean the date (remove duplicates like "Apr 7th, 2025Apr 7th, 2025")
        let date = entry.match(/Date:\s*(.*?)(?:,|$)/)?.[1]?.trim() || null;
        if (date) {
          const originalDate = date;
          
          // Pattern to detect duplicated date strings
          const dateSegments = date.split(/(?<=\d{4})/); // Split after a year
          if (dateSegments.length > 1 && dateSegments[0] === dateSegments[1]) {
            date = dateSegments[0];
          }
          
          // More general approach for any duplicate date strings
          date = date.replace(/(\b\w+ \d+\w+, \d{4})\1/g, '$1');
          
          if (isTracyPuccinelli && originalDate !== date) {
            logger.log(`Fixed duplicated date: "${originalDate}" → "${date}"`);
          }
        }
        
        // Build the feedback object with cleaned data
        const feedback = {
          course: courseName,
          date: date,
          qualityRating: entry.match(/Quality:\s*(.*?)(?:,|$)/)?.[1]?.trim() || null,
          difficultyRating: entry.match(/Difficulty:\s*(.*?)(?:,|$)/)?.[1]?.trim() || null,
          comments: entry.match(/Comments:\s*(.*?)(?:,\s*Tags:|$)/s)?.[1]?.trim() || null,
          tags: entry.match(/Tags:\s*(.*?)(?:$)/)?.[1]?.split(',').map(tag => tag.trim()) || []
        };
        
        feedbacks.push(feedback);
        
        if (isTracyPuccinelli) {
          logger.log(`Added feedback with course: "${feedback.course}", date: "${feedback.date}"`);
        }
      }
    });
  }
  
  // Extract unique courses and clean them further
  const uniqueCourses = new Set();
  
  feedbacks.forEach(feedback => {
    if (feedback.course && feedback.course.trim() !== '') {
      // Final cleaning of course name
      let cleanedCourse = feedback.course.trim();
      
      // Handle any remaining duplications
      cleanedCourse = cleanedCourse.replace(/(\b\w+\b) \1\b/g, '$1');
      
      // Add to set for deduplication
      uniqueCourses.add(cleanedCourse);
    }
  });
  
  professorInfo.courses = Array.from(uniqueCourses);
  
  if (isTracyPuccinelli) {
    logger.log(`Final courses for Tracy Puccinelli: ${professorInfo.courses.join(', ')}`);
  }
  
  // Add the full feedbacks array to the professor info
  professorInfo.feedbacks = feedbacks;

  return professorInfo;
}

async function getProfessors(page = 1, pageSize = 300, noLimit = false, countOnly = false, filters = {}) {
  try {
    const index = pinecone.Index("professors-index");

    // When getting count, use a high limit to get more accurate numbers
    const queryLimit = countOnly ? 1000 : (noLimit ? Math.min(1000, pageSize * 5) : 1000); // Get more data for client-side filtering
    
    // First, query the total count to understand pagination limits
    const statsResponse = await index.describeIndexStats();
    const totalVectors = statsResponse?.totalVectorCount || 0;
    const estimatedTotalProfessors = Math.min(totalVectors, 1000); // Cap at 1000 for performance
    
    logger.log(`Total vectors in index: ${totalVectors}, estimated professors: ${estimatedTotalProfessors}, query limit: ${queryLimit}`);
    logger.log(`Applied filters: ${JSON.stringify(filters)}`);

    // Fetch professors with the determined limit
    const queryResponse = await index.query({
      vector: await getEmbedding("professor"),
      topK: queryLimit,
      includeMetadata: true,
    });

    logger.log(`Retrieved ${queryResponse.matches?.length || 0} professor vectors from Pinecone`);

    // Process the professors - simplified if countOnly
    let processedProfessors = [];
    if (!countOnly) {
      // Only do full processing if we need the actual data
      processedProfessors = queryResponse.matches
        .map((match) => ({
          id: match.id,
          score: match.score,
          metadata: parseProfessorInfo(match.metadata.text),
        }))
        .filter(
          (prof) =>
            prof.metadata.name &&
            prof.metadata.department &&
            prof.metadata.overallRating !== null &&
            prof.metadata.numberOfRatings !== null
        );
    } else {
      // For countOnly, just check if each entry has valid data
      processedProfessors = queryResponse.matches
        .map((match, index) => {
          try {
            const metadata = parseProfessorInfo(match.metadata.text);
            return metadata.name ? { 
              id: match.id,
              score: match.score,
              // Just capture name for deduplication, we don't need full data
              metadata: { name: metadata.name }
            } : null;
          } catch (err) {
            return null;
          }
        })
        .filter(Boolean); // Remove any null entries
    }

    logger.log(`Processed ${processedProfessors.length} valid professors after filtering`);

    // Deduplicate professors by name
    const uniqueProfessors = Array.from(
      new Map(
        processedProfessors.map((item) => [item.metadata.name, item])
      ).values()
    );

    logger.log(`Deduplicated to ${uniqueProfessors.length} unique professors`);

    // Apply filters before pagination
    let filteredProfessors = [...uniqueProfessors];
    
    // Apply search filter if provided (match name or department)
    if (filters.search && filters.search.trim() !== '') {
      const searchTerm = filters.search.toLowerCase().trim();
      logger.log(`Applying search filter: "${searchTerm}"`);
      filteredProfessors = filteredProfessors.filter(
        (prof) => 
          (prof.metadata.name && prof.metadata.name.toLowerCase().includes(searchTerm)) ||
          (prof.metadata.department && prof.metadata.department.toLowerCase().includes(searchTerm))
      );
      logger.log(`After search filter: ${filteredProfessors.length} professors`);
    }
    
    // Apply department filter if provided
    if (filters.department && filters.department.trim() !== '') {
      const departmentTerm = filters.department.toLowerCase().trim();
      logger.log(`Applying department filter: "${departmentTerm}"`);
      filteredProfessors = filteredProfessors.filter(
        (prof) => 
          prof.metadata.department && 
          prof.metadata.department.toLowerCase().includes(departmentTerm)
      );
      logger.log(`After department filter: ${filteredProfessors.length} professors`);
    }
    
    // Apply minimum rating filter if provided
    if (filters.minRating && !isNaN(parseFloat(filters.minRating))) {
      const minRating = parseFloat(filters.minRating);
      logger.log(`Applying minimum rating filter: ${minRating}`);
      filteredProfessors = filteredProfessors.filter(
        (prof) => 
          prof.metadata.overallRating && 
          prof.metadata.overallRating >= minRating
      );
      logger.log(`After rating filter: ${filteredProfessors.length} professors`);
    }

    // If countOnly, we can stop here - we just need the count
    if (countOnly) {
      return {
        professors: [],
        pagination: {
          total: filteredProfessors.length,  // Return filtered count
          page: 1,
          pageSize: pageSize,
          totalPages: Math.ceil(filteredProfessors.length / pageSize),
          hasMore: filteredProfessors.length > pageSize
        }
      };
    }

    // Sort professors by overall rating
    const sortedProfessors = filteredProfessors.sort(
      (a, b) => b.metadata.overallRating - a.metadata.overallRating
    );

    // Calculate pagination info
    const totalProfessors = sortedProfessors.length;
    const totalPages = Math.ceil(totalProfessors / pageSize);
    const currentPage = page > totalPages ? (totalPages > 0 ? 1 : page) : page;
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalProfessors);
    
    // If noLimit is true, return all professors
    // Otherwise return the paginated subset
    const paginatedProfessors = noLimit 
      ? sortedProfessors 
      : sortedProfessors.slice(startIndex, endIndex);
    
    logger.log(`Returning ${paginatedProfessors.length} professors for page ${currentPage}/${totalPages}`);

    // Return both the professors and pagination metadata
    return {
      professors: paginatedProfessors,
      pagination: {
        total: totalProfessors,
        page: currentPage,
        pageSize: pageSize,
        totalPages: totalPages,
        hasMore: currentPage < totalPages
      }
    };
  } catch (error) {
    logger.error("Error in getProfessors:", error);
    throw error;
  }
}

export async function GET(request) {
  try {
    // Extract pagination parameters from URL query string
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '24', 10);
    
    // Validate pagination parameters
    const validatedPage = page > 0 ? page : 1;
    const validatedPageSize = Math.min(Math.max(pageSize, 10), 100); // Between 10 and 100
    
    // Get all professors flag
    const getAllProfessors = searchParams.get('all') === 'true';
    
    // New parameter: countOnly - efficiently get just the count
    const countOnly = searchParams.get('countOnly') === 'true';
    
    // Extract filter parameters
    const filters = {
      search: searchParams.get('search') || '',
      department: searchParams.get('department') || '',
      minRating: searchParams.get('minRating') || 0
    };
    
    logger.log(`GET request for professors - page: ${validatedPage}, pageSize: ${validatedPageSize}, getAll: ${getAllProfessors}, countOnly: ${countOnly}`);
    logger.log(`Filter parameters: ${JSON.stringify(filters)}`);
    
    // Get professors with appropriate parameters
    const result = await getProfessors(validatedPage, validatedPageSize, getAllProfessors, countOnly, filters);
    
    // For count-only requests, we can just return the pagination info
    if (countOnly) {
      return NextResponse.json({
        pagination: result.pagination
      });
    }
    
    // Otherwise return the full result with professors data
    return NextResponse.json(result);
  } catch (error) {
    logger.error("Error fetching professors:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching professors." },
      { status: 500 }
    );
  }
}

// Add a similar ensureIndexExists function to ensure consistency
async function ensureIndexExists() {
  try {
    if (!pinecone) {
      throw new Error("Pinecone client not initialized");
    }
    
    const indexName = "professors-index";
    logger.log(`Ensuring index exists: ${indexName}`);
    
    try {
      // Directly try to access the index
      const index = pinecone.Index(indexName);
      // Test the connection with a simple operation
      await index.describeIndexStats();
      logger.log(`Index ${indexName} exists and is accessible`);
      return index;
    } catch (accessError) {
      logger.error(`Error accessing index ${indexName}:`, accessError);
      throw new Error(`Cannot access Pinecone index: ${accessError.message}`);
    }
  } catch (error) {
    logger.error("Error ensuring index exists:", error);
    throw new Error(`Failed to ensure index exists: ${error.message}`);
  }
}

// Update the queryPinecone function to use the fallback if needed
async function queryPinecone(userQuery) {
  try {
    logger.log(`Starting Pinecone query for: "${userQuery}"`);
    
    // Look for professor name patterns in the query
    const containsProfessorNamePattern = 
      /professor\s+([a-z]+(\s+[a-z]+)?)/i.test(userQuery) ||
      /prof\.\s+([a-z]+(\s+[a-z]+)?)/i.test(userQuery) ||
      /([a-z]+(\s+[a-z]+)?)\s+is\s+a\s+professor/i.test(userQuery);
    
    // Modify query if needed for better results
    let enhancedQuery = userQuery;
    if (containsProfessorNamePattern) {
      logger.log("Detected professor name pattern in query, enhancing search");
      const nameMatch = 
        userQuery.match(/professor\s+([a-z]+(\s+[a-z]+)?)/i) || 
        userQuery.match(/prof\.\s+([a-z]+(\s+[a-z]+)?)/i) ||
        userQuery.match(/([a-z]+(\s+[a-z]+)?)\s+is\s+a\s+professor/i);
      
      if (nameMatch && nameMatch[1]) {
        const professorName = nameMatch[1];
        enhancedQuery = `Professor ${professorName} information ratings reviews`;
        logger.log(`Enhanced query to: "${enhancedQuery}"`);
      }
    }
    
    const queryEmbedding = await getEmbedding(enhancedQuery);
    logger.log("Query embedding generated, vector length:", queryEmbedding.length);
    
    // Try Pinecone first
    try {
      if (!pinecone) {
        throw new Error("Pinecone client not initialized");
      }
      
      // Get the index using the ensureIndexExists function
      const index = await ensureIndexExists();
      logger.log("Pinecone index accessed");
      
      // Use more results (10 instead of 5) to improve chances of finding relevant info
      const queryResponse = await index.query({
        vector: queryEmbedding,
        topK: 10, // Increased from 5 to get more potential matches
        includeMetadata: true,
      });

      logger.log(`Found ${queryResponse.matches?.length || 0} matches from Pinecone`);
      
      // Log the structure of the first result to help debug
      if (queryResponse.matches && queryResponse.matches.length > 0) {
        const firstMatch = queryResponse.matches[0];
        logger.debug("First match structure:", JSON.stringify({
          id: firstMatch.id,
          score: firstMatch.score,
          hasMetadata: !!firstMatch.metadata,
          metadataKeys: firstMatch.metadata ? Object.keys(firstMatch.metadata) : [],
        }));
      }

      if (!queryResponse.matches || queryResponse.matches.length === 0) {
        logger.log("No matches found in Pinecone");
        throw new Error("No matches found in Pinecone"); // This will trigger the fallback
      }
      
      // Properly verify the structure of each match and safely extract the text
      return queryResponse.matches.map((match) => {
        // Check multiple possible locations for the text content
        let text = null;
        
        // Option 1: Standard metadata.text structure
        if (match.metadata && typeof match.metadata.text === 'string') {
          text = match.metadata.text;
        } 
        // Option 2: Direct text field
        else if (typeof match.text === 'string') {
          text = match.text;
        } 
        // Option 3: Check for content field in metadata
        else if (match.metadata && typeof match.metadata.content === 'string') {
          text = match.metadata.content;
        }
        // Option 4: Look for any string field in metadata that might contain text
        else if (match.metadata) {
          // Find the first string property that's long enough to be content
          const metadataKeys = Object.keys(match.metadata);
          for (const key of metadataKeys) {
            if (typeof match.metadata[key] === 'string' && match.metadata[key].length > 50) {
              text = match.metadata[key];
              logger.log(`Using alternative metadata field "${key}" for text content`);
              break;
            }
          }
        }
        
        // If no text found, provide a placeholder
        if (!text) {
          logger.log(`Match ${match.id} has no usable text content in:`, match.metadata);
          text = `[No text available for match ${match.id}]`;
        }
        
        return {
          text: text,
          score: match.score || 0
        };
      });
    } catch (pineconeError) {
      // If Pinecone fails, try the in-memory store as fallback
      logger.error("Pinecone query failed, trying in-memory fallback:", pineconeError);
      
      if (inMemoryVectorStore.vectors.length === 0) {
        logger.log("In-memory store is empty, no results available");
        return [];
      }
      
      // Try in-memory search with more results
      const matches = inMemoryVectorStore.search(queryEmbedding, 10); // Also increased from 5
      logger.log(`Found ${matches.length} matches from in-memory store`);
      
      // Same safe extraction pattern for in-memory results
      return matches.map(match => {
        // Check multiple possible locations for the text content
        let text = null;
        
        // Option 1: Standard metadata.text structure
        if (match.metadata && typeof match.metadata.text === 'string') {
          text = match.metadata.text;
        } 
        // Option 2: Direct text field
        else if (typeof match.text === 'string') {
          text = match.text;
        } 
        // Option 3: Check for content field in metadata
        else if (match.metadata && typeof match.metadata.content === 'string') {
          text = match.metadata.content;
        }
        // Option 4: Look for any string field in metadata that might contain text
        else if (match.metadata) {
          // Find the first string property that's long enough to be content
          const metadataKeys = Object.keys(match.metadata);
          for (const key of metadataKeys) {
            if (typeof match.metadata[key] === 'string' && match.metadata[key].length > 50) {
              text = match.metadata[key];
              logger.log(`Using alternative metadata field "${key}" for text content`);
              break;
            }
          }
        }
        
        // If no text found, provide a placeholder
        if (!text) {
          logger.log(`Match ${match.id} has no usable text content in:`, match.metadata);
          text = `[No text available for match ${match.id}]`;
        }
        
        return {
          text: text,
          score: match.score || 0
        };
      });
    }
  } catch (error) {
    logger.error("Error in queryPinecone:", error);
    return []; // Return empty array instead of throwing to avoid breaking the API
  }
}

// Add this function before the POST handler
function extractProfessorName(query) {
  // Look for patterns like "Professor X", "Prof. X", etc.
  const patterns = [
    /professor\s+([a-z]+(\s+[a-z]+)?)/i,
    /prof\.\s+([a-z]+(\s+[a-z]+)?)/i,
    /([a-z]+(\s+[a-z]+)?)\s+is\s+a\s+professor/i,
    /about\s+professor\s+([a-z]+(\s+[a-z]+)?)/i,
    /about\s+prof\.\s+([a-z]+(\s+[a-z]+)?)/i
  ];
  
  for (const pattern of patterns) {
    const match = query.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  
  return null; // No professor name found
}

export async function POST(req) {
  try {
    logger.log("POST request received to /api/get-professor");
    
    const body = await req.json();
    logger.log("Request body parsed:", { 
      queryLength: body.userQuery?.length, 
      sessionId: body.sessionId || 'not provided' 
    });
    
    const { userQuery } = body;
    const sessionId = body.sessionId || 'default-session';

    if (!userQuery) {
      logger.log("Missing query parameter");
      return NextResponse.json(
        { error: "Query is required" },
        { status: 400 }
      );
    }

    // After the professorName extraction and before the query type detection
    // Check if we should use a stored professor from previous questions
    const sessionMetadata = sessionStore.getMetadata?.(sessionId) || {};
    const storedProfessor = sessionMetadata.currentProfessor;
    const detectedProfessor = extractProfessorName(userQuery);

    // If we have a detected professor in this query, update the session
    if (detectedProfessor) {
      logger.log(`Detected specific professor name in query: ${detectedProfessor}`);
      sessionMetadata.currentProfessor = detectedProfessor;
      sessionStore.setMetadata?.(sessionId, sessionMetadata);
    } else {
      logger.log("No specific professor name detected in this query");
    }

    // If we have a stored professor but no specific one in this query, enhance the query
    let enhancedUserQuery = userQuery;
    if (!detectedProfessor && storedProfessor && userQuery.toLowerCase().includes("name")) {
      logger.log(`Using professor from session context: ${storedProfessor}`);
      // Modify the query to include the current professor for consistent results
      enhancedUserQuery = `${userQuery} professor ${storedProfessor}`;
      logger.log(`Enhanced query: "${enhancedUserQuery}"`);
    }

    // Continue with normal query type detection using the potentially enhanced query
    // Special handling for different question types
    const isNameQuestion = enhancedUserQuery.toLowerCase().includes("name") && 
                          (enhancedUserQuery.toLowerCase().includes("professor") || 
                           enhancedUserQuery.toLowerCase().includes("teacher"));

    // Check if it's a generic name question without a specific professor mentioned
    const isGenericNameQuestion = isNameQuestion && 
                                 !(/professor\s+([a-z]+(\s+[a-z]+)?)/i.test(enhancedUserQuery)) &&
                                 !(/prof\.\s+([a-z]+(\s+[a-z]+)?)/i.test(enhancedUserQuery)) &&
                                 !(/([a-z]+(\s+[a-z]+)?)\s+is\s+a\s+professor/i.test(enhancedUserQuery));

    const isRatingQuestion = enhancedUserQuery.toLowerCase().includes("rating") || 
                             enhancedUserQuery.toLowerCase().includes("score") ||
                             enhancedUserQuery.toLowerCase().includes("review") ||
                             enhancedUserQuery.toLowerCase().includes("good") ||
                             enhancedUserQuery.toLowerCase().includes("bad");

    const isDifficultyQuestion = enhancedUserQuery.toLowerCase().includes("difficult") ||
                                 enhancedUserQuery.toLowerCase().includes("easy") ||
                                 enhancedUserQuery.toLowerCase().includes("hard") ||
                                 enhancedUserQuery.toLowerCase().includes("challenging");

    // Log what type of question was detected
    if (isNameQuestion) {
      if (isGenericNameQuestion) {
        logger.log("Generic name question detected. Will list available professors instead of single result.");
      } else {
        logger.log("Specific name question detected. Using special handling.");
      }
    } else if (isRatingQuestion) {
      logger.log("Rating question detected. Using special handling.");
    } else if (isDifficultyQuestion) {
      logger.log("Difficulty question detected. Using special handling.");
    }

    // Retrieve or initialize the session history
    const chatHistory = sessionStore.get(sessionId) || [];
    logger.log(`Session ${sessionId} - chat history length: ${chatHistory.length}`);

    // Get the relevant context from Pinecone
    logger.log("Querying Pinecone for relevant context");
    let relevantContextResults = [];
    
    try {
      // For generic name questions, get a list of professors instead of a single result
      if (isGenericNameQuestion) {
        logger.log("Fetching list of available professors for generic name question");
        try {
          // Use the existing getProfessors function to get a consistent list
          const topProfessors = await getProfessors();
          
          if (topProfessors && topProfessors.professors.length > 0) {
            logger.log(`Found ${topProfessors.professors.length} professors to display`);
            
            // Create a formatted response with professor information
            const professorsList = topProfessors.professors
              .slice(0, 10) // Limit to top 10 professors
              .map((prof, index) => {
                return `${index + 1}. Professor ${prof.metadata.name} (${prof.metadata.department}), Overall Rating: ${prof.metadata.overallRating}`;
              })
              .join("\n");
              
            // Create a special context that lists available professors
            const listContext = `Here are some of the professors available in our database:\n\n${professorsList}\n\nTo get more specific information about a professor, please ask about them by name.`;
            
            // Return this as a special case
            const listResponse = {
              content: `I don't have information about which specific professor you're asking about. ${topProfessors.professors.length > 0 ? 'Here are some professors in our database:' : ''}\n\n${professorsList}\n\nTo get detailed information, please specify which professor you're interested in.`,
              role: "assistant"
            };
            
            // Add the response to the chat history
            chatHistory.push({ role: "user", content: enhancedUserQuery });
            chatHistory.push(listResponse);
            
            // Store the updated chat history
            sessionStore.set(sessionId, chatHistory);
            
            return NextResponse.json(listResponse, { status: 200 });
          }
        } catch (listError) {
          logger.error("Error fetching professors list:", listError);
          // Continue with normal flow if listing professors fails
        }
      }
      
      // Normal flow for specific questions
      if (isNameQuestion && !isGenericNameQuestion) {
        // For name questions, query with a more specific prompt
        // Include the specific professor name if available
        if (detectedProfessor || storedProfessor) {
          const nameToUse = detectedProfessor || storedProfessor;
          logger.log(`Including professor name "${nameToUse}" in name query`);
          relevantContextResults = await queryPinecone(`professor ${nameToUse} name department information`);
        } else {
          relevantContextResults = await queryPinecone("professor name department information");
        }
      } else if (isRatingQuestion) {
        // For rating questions, focus on ratings
        // Include the specific professor name if available
        if (detectedProfessor || storedProfessor) {
          const nameToUse = detectedProfessor || storedProfessor;
          logger.log(`Including professor name "${nameToUse}" in rating query`);
          relevantContextResults = await queryPinecone(`professor ${nameToUse} rating reviews overall rating`);
        } else {
          relevantContextResults = await queryPinecone("professor rating reviews overall rating");
        }
      } else if (isDifficultyQuestion) {
        // For difficulty questions, focus on difficulty aspects
        // Include the specific professor name if available
        if (detectedProfessor || storedProfessor) {
          const nameToUse = detectedProfessor || storedProfessor;
          logger.log(`Including professor name "${nameToUse}" in difficulty query`);
          relevantContextResults = await queryPinecone(`professor ${nameToUse} difficulty level challenging easy hard`);
        } else {
          relevantContextResults = await queryPinecone("professor difficulty level challenging easy hard");
        }
      } else {
        relevantContextResults = await queryPinecone(enhancedUserQuery);
      }
      
      // Verify the response structure
      if (!Array.isArray(relevantContextResults)) {
        logger.error("Expected array of results but got:", typeof relevantContextResults);
        relevantContextResults = []; // Initialize as empty array to prevent further errors
      }
      
      logger.log(`Retrieved ${relevantContextResults.length} context results`);
      
      // Log score statistics
      if (relevantContextResults.length > 0) {
        const scores = relevantContextResults.map(item => item.score);
        const minScore = Math.min(...scores);
        const maxScore = Math.max(...scores);
        const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
        
        logger.log(`Score statistics - Min: ${minScore.toFixed(4)}, Max: ${maxScore.toFixed(4)}, Avg: ${avgScore.toFixed(4)}`);
        
        // Preview top 3 results safely
        logger.log("Preview of top results:");
        relevantContextResults.slice(0, 3).forEach((item, idx) => {
          // Safe preview that checks if text exists before accessing it
          const previewText = item.text ? item.text.substring(0, 100) : '[No text available]';
          logger.log(`Result #${idx+1} - Score: ${item.score.toFixed(4)}, Content: ${previewText}...`);
        });
      } else {
        logger.log("No relevant context found in query results");
      }
    } catch (error) {
      logger.error("Error in queryPinecone:", error);
      return NextResponse.json({
        content: `I encountered an error while searching for information: ${error.message}. Please try again with a different question.`,
        role: "assistant"
      }, { status: 200 });
    }
    
    // Apply less aggressive filtering - use dynamic threshold based on available data
    let scoreThreshold = 0.3; // Base threshold
    if (relevantContextResults.length > 0) {
      const scores = relevantContextResults.map(item => item.score);
      const maxScore = Math.max(...scores);
      // If we have high-quality matches, be more selective
      if (maxScore > 0.8) {
        scoreThreshold = 0.5;
      } else if (maxScore > 0.6) {
        scoreThreshold = 0.4;
      }
      logger.log(`Using dynamic score threshold: ${scoreThreshold} (based on max score: ${maxScore.toFixed(4)})`);
    }

    // Filter results based on the dynamic threshold
    let relevantContext = relevantContextResults
      .filter(item => {
        const keep = item.score > scoreThreshold;
        logger.log(`Result score ${item.score.toFixed(4)} - ${keep ? 'KEEPING' : 'FILTERING OUT'}`);
        return keep;
      })
      .map(item => item.text);

    // If no results after filtering, check if we should use fallback
    if (relevantContext.length === 0 && relevantContextResults.length > 0) {
      logger.log("No results passed threshold filtering. Using top result as fallback.");
      relevantContext = [relevantContextResults[0].text];
    }

    // Check if we have any relevant context after processing
    logger.log(`Final relevant context entries: ${relevantContext.length}`);

    // Check if we still have no context after all fallback mechanisms
    if (relevantContext.length === 0) {
      logger.log("No relevant context found after all fallback attempts.");
      const noDataResponse = {
        content: "I'm sorry, but I don't have enough information about this professor to answer your question. Try asking about a different professor or provide more details.",
        role: "assistant"
      };
      
      // Add the response to the chat history
      chatHistory.push({ role: "user", content: enhancedUserQuery });
      chatHistory.push(noDataResponse);
      
      // Store the updated chat history
      sessionStore.set(sessionId, chatHistory);
      
      return NextResponse.json(noDataResponse, { status: 200 });
    }

    // Log a preview of what we're sending to the model
    logger.log("Context being sent to model:");
    relevantContext.forEach((context, idx) => {
      if (idx < 5) { // Limit to first 5 for brevity
        // Check that the context exists before trying to substring it
        const contextPreview = context && typeof context === 'string' 
          ? context.substring(0, 150) 
          : '[Invalid context item]';
        logger.log(`Context #${idx+1}: ${contextPreview}...`);
      }
    });

    // Construct the augmented messages array
    const primer = `You are an AI assistant that helps students learn about professors. 
Answer questions about professors ONLY using the specific professor information provided in the context.

IMPORTANT GUIDELINES:
1. If asked about information not contained in the context, clearly state "I don't have that specific information about this professor".
2. Do not fabricate ratings, reviews, or other details that are not explicitly provided.
3. If the context contains information about MULTIPLE professors, and the user doesn't specify which one:
   - Acknowledge that there are multiple professors in the data
   - Briefly summarize information about each professor
   - Ask the user to specify which professor they want to know more about
4. If the student asks about something unrelated to the professor information, politely redirect them to ask about professors instead.

Keep your responses conversational, concise, and accurate based only on the context provided.`;

    // Prepare the context introduction
    let contextIntro = "Here is information about professors from student ratings and reviews. The information may include professor names, departments, overall ratings, number of reviews, difficulty ratings, and student comments:";

    // If we have context, add it
    if (relevantContext.length > 0) {
      contextIntro += "\n\n" + relevantContext.join("\n\n");
    } else {
      contextIntro = "I don't have enough information about this professor to answer your question accurately.";
    }

    const messages = [
      { role: "system", content: primer },
      { role: "user", content: contextIntro },
      { role: "assistant", content: "I'll help you learn about professors based on the provided ratings and reviews. What would you like to know?" },
      ...chatHistory,
      { role: "user", content: enhancedUserQuery }
    ];

    logger.log("Prepared messages for OpenAI, count:", messages.length);

    // Check if OpenAI client is initialized
    if (!openai) {
      throw new Error("OpenAI client not initialized");
    }

    try {
      logger.log("Calling OpenAI API");
      
      // Make the API call to OpenAI with the structured messages
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo", // Fallback to more reliable model
        messages,
        temperature: 0.3,
        max_tokens: 400,
      });
      
      logger.log("OpenAI API call successful");

      // Capture the response content
      let responseContent = completion.choices[0].message.content;
      
      // Clean up response formatting if needed
      responseContent = responseContent.trim();
      
      // Update session history
      const newMessage = {
        role: "user",
        content: enhancedUserQuery,
      };
      const assistantMessage = {
        role: "assistant",
        content: responseContent,
      };
      chatHistory.push(newMessage, assistantMessage);
      sessionStore.set(sessionId, chatHistory);

      logger.log("Response ready to send");
      
      // Ensure consistent response format
      return NextResponse.json({
        content: responseContent,
        role: "assistant"
      });
      
    } catch (error) {
      logger.error("Error calling OpenAI API:", error);
      
      // Ensure consistent response format even during errors
      return NextResponse.json({
        content: `I encountered an error while processing your request: ${error.message}. Please try again.`,
        role: "assistant"
      }, { status: 200 }); // Return 200 with error message rather than 500 status
    }
  } catch (error) {
    logger.error("Unhandled error in POST handler:", error);
    return NextResponse.json(
      { error: error.message || "An unknown error occurred" },
      { status: 500 }
    );
  }
}

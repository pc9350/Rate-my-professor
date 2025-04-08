import { NextResponse } from "next/server";
import axios from "axios";
import { load } from "cheerio";

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

export async function POST(request) {
  try {
    const { professorId } = await request.json();
    if (!professorId) {
      logger.log("Missing professorId in request");
      return NextResponse.json(
        { error: "Professor ID or URL is required" },
        { status: 400 }
      );
    }

    const professorUrl = professorId.startsWith("https://")
      ? professorId
      : `https://www.ratemyprofessors.com/professor/${professorId}`;

    logger.log(`Fetching data from URL: ${professorUrl}`);
    
    // Configure axios with headers to mimic a real browser
    const response = await axios.get(professorUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      },
      timeout: 15000, // 15 second timeout
    });
    
    const html = response.data;
    let $ = load(html);

    // Extract professor information
    // Note: These selectors might need updating if RateMyProfessors changes their structure
    const professorInfo = {
      name: $(".NameTitle__Name-dowf0z-0").text().trim() || 
            $("[data-testid='ProfessorName']").text().trim() ||
            "Unknown",
      department: $(".NameTitle__Title-dowf0z-1").text().trim() || 
                 $("[data-testid='DepartmentName']").text().trim() ||
                 "Unknown",
      overallRating: $(".RatingValue__Numerator-qw8sqy-2").text().trim() || 
                    $("[data-testid='RatingValue']").text().trim() ||
                    "N/A",
      numRatings: $(".RatingValue__NumRatings-qw8sqy-0").text().match(/\d+/)?.[0] || 
                 $("[data-testid='RatingCount']").text().match(/\d+/)?.[0] ||
                 "0",
      wouldTakeAgain: $(".FeedbackItem__FeedbackNumber-uof32n-1").first().text().trim() || 
                     $("[data-testid='WouldTakeAgainPercentage']").text().trim() ||
                     "N/A",
      difficulty: $(".FeedbackItem__FeedbackNumber-uof32n-1").last().text().trim() || 
                 $("[data-testid='DifficultyRating']").text().trim() ||
                 "N/A",
      topTags: $(".TeacherTags__TagsContainer-sc-16vmh1y-0 .Tag-bs9vf4-0")
        .map((i, el) => $(el).text().trim())
        .get() || 
        $("[data-testid='TeacherTags'] [data-testid='TagsListItem']")
        .map((i, el) => $(el).text().trim())
        .get() || 
        [],
    };

    logger.debug("Extracted professor info:", professorInfo);

    // Extract feedbacks (ratings)
    let feedbacks = [];
    
    // Try multiple selectors to find ratings
    const ratingSelectors = [
      ".Rating__RatingBody-sc-1rhvpxz-0",
      "[data-testid='RatingsList'] > div",
      ".RatingsList__StyledRating"
    ];
    
    // Try different selectors until we find ratings
    let ratingsElements = [];
    for (const selector of ratingSelectors) {
      ratingsElements = $(selector);
      if (ratingsElements.length > 0) {
        logger.log(`Found ${ratingsElements.length} ratings with selector: ${selector}`);
        break;
      }
    }
    
    // Process found ratings
    ratingsElements.each((i, el) => {
      // Try multiple selectors for each component
      const course = 
        $(el).find(".RatingHeader__StyledClass-sc-1dlkqw1-3").text().trim() ||
        $(el).find("[data-testid='RatingClass']").text().trim() || 
        "";
        
      const date = 
        $(el).find(".TimeStamp__StyledTimeStamp-sc-9q2r30-0").text().trim() ||
        $(el).find("[data-testid='RatingDate']").text().trim() || 
        "";
        
      const qualityRating = 
        $(el).find(".CardNumRating__CardNumRatingNumber-sc-17t4b9u-2").first().text().trim() ||
        $(el).find("[data-testid='RatingQuality']").text().trim() || 
        "";
        
      const difficultyRating = 
        $(el).find(".CardNumRating__CardNumRatingNumber-sc-17t4b9u-2").last().text().trim() ||
        $(el).find("[data-testid='RatingDifficulty']").text().trim() || 
        "";
        
      const comments = 
        $(el).find(".Comments__StyledComments-dzzyvm-0").text().trim() ||
        $(el).find("[data-testid='RatingComment']").text().trim() || 
        "";
        
      // Try multiple selectors for tags
      let tags = [];
      const tagElements = 
        $(el).find(".RatingTags__StyledTags-sc-1boeqx2-0 .Tag-bs9vf4-0").length > 0 
          ? $(el).find(".RatingTags__StyledTags-sc-1boeqx2-0 .Tag-bs9vf4-0")
          : $(el).find("[data-testid='RatingTags'] [data-testid='TagItem']");
          
      tags = tagElements.map((i, tag) => $(tag).text().trim()).get();
      
      feedbacks.push({
        course,
        date,
        qualityRating,
        difficultyRating,
        comments,
        tags
      });
    });

    // Clean up duplicate course names in the feedbacks
    feedbacks.forEach(feedback => {
      if (feedback.course) {
        // Clean up duplicated course names (e.g., "INTEREGR170 INTEREGR170" → "INTEREGR170") 
        feedback.course = feedback.course.replace(/(\b\w+\b) \1\b/g, '$1').trim();
      }
      
      if (feedback.date) {
        // Clean up duplicated dates (e.g., "Apr 7th, 2025Apr 7th, 2025" → "Apr 7th, 2025")
        // First try splitting after year
        const dateSegments = feedback.date.split(/(?<=\d{4})/);
        if (dateSegments.length > 1 && dateSegments[0] === dateSegments[1]) {
          feedback.date = dateSegments[0].trim();
        } else {
          // More general approach using regex
          feedback.date = feedback.date.replace(/(\b\w+ \d+\w+, \d{4})\1/g, '$1').trim();
        }
      }
    });

    // Instead of trying to load more pages, let's just add a note if we detect a "load more" button
    const hasMoreRatings = $(".PaginationButton__StyledPaginationButton-txi1dr-1").length > 0 || 
                         $("[data-testid='PaginationButton']").length > 0;
                         
    if (hasMoreRatings) {
      logger.log("More ratings are available but not loaded - consider implementing pagination");
    }

    if (!professorInfo.name || professorInfo.name === "Unknown") {
      logger.log("Professor not found with ID:", professorId);
      return NextResponse.json(
        { error: "Professor not found" },
        { status: 404 }
      );
    }

    logger.log(`Successfully scraped data for professor: ${professorInfo.name}`);
    
    // Add a field indicating if there are more ratings
    return NextResponse.json({ 
      professorInfo, 
      feedbacks,
      hasMoreRatings
    });
    
  } catch (error) {
    logger.error("Error scraping data:", error);
    
    // Provide more specific error messages based on the error
    let errorMessage = "Failed to scrape data";
    let statusCode = 500;
    
    if (error.code === 'ECONNABORTED') {
      errorMessage = "Request timed out. The server might be experiencing high load.";
    } else if (error.code === 'ENOTFOUND') {
      errorMessage = "Could not connect to RateMyProfessors. Please check your internet connection.";
    } else if (error.response) {
      // The request was made and the server responded with a status code
      statusCode = error.response.status;
      if (statusCode === 404) {
        errorMessage = "Professor not found on RateMyProfessors.";
      } else if (statusCode === 403) {
        errorMessage = "Access to RateMyProfessors is forbidden. They might be blocking our requests.";
      } else {
        errorMessage = `RateMyProfessors responded with status code ${statusCode}`;
      }
    }
    
    return NextResponse.json(
      { error: errorMessage, details: error.message },
      { status: statusCode }
    );
  }
}

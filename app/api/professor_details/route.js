import { NextResponse } from "next/server";
import axios from "axios";
import { load } from "cheerio";

export async function POST(request) {
  try {
    const { professorId } = await request.json();
    if (!professorId) {
      return NextResponse.json(
        { error: "Professor ID or URL is required" },
        { status: 400 }
      );
    }

    const professorUrl = professorId.startsWith("https://")
      ? professorId
      : `https://www.ratemyprofessors.com/professor/${professorId}`;

    console.log("Fetching page content...");
    
    // Configure axios with headers to mimic a real browser
    const response = await axios.get(professorUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      },
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
        console.log(`Found ${ratingsElements.length} ratings with selector: ${selector}`);
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

    // Instead of trying to load more pages, let's just add a note if we detect a "load more" button
    const hasMoreRatings = $(".PaginationButton__StyledPaginationButton-txi1dr-1").length > 0 || 
                         $("[data-testid='PaginationButton']").length > 0;
                         
    if (hasMoreRatings) {
      console.log("More ratings are available but not loaded - consider implementing pagination");
    }

    if (!professorInfo.name || professorInfo.name === "Unknown") {
      return NextResponse.json(
        { error: "Professor not found" },
        { status: 404 }
      );
    }

    // Add a field indicating if there are more ratings
    return NextResponse.json({ 
      professorInfo, 
      feedbacks,
      hasMoreRatings
    });
    
  } catch (error) {
    console.error("Error scraping data:", error.message);
    return NextResponse.json(
      { error: "Failed to scrape data", details: error.message },
      { status: 500 }
    );
  }
}

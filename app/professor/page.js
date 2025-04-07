"use client";

import { useState } from "react";
import ChatbotInterface from "../components/ChatBotInterface";
import DynamicNavbar from "../components/DynamicNavbar";
import Spline from "@splinetool/react-spline";

// import Background3D from "../components/Background3D";

// Dynamically import Spline to avoid SSR issues
// const Spline = dynamic(() => import('@splinetool/react-spline'),{
//   ssr: false,
//   loading: () => <p>Loading 3D model...</p>,
// });

// Add this helper function at the beginning of the file, after imports
const isDev = process.env.NODE_ENV === 'development';

// Create a safe console logger that only logs in development
const devLogger = {
  log: (...args) => isDev && console.log(...args),
  error: (...args) => isDev && console.error(...args)
};

export default function Home() {
  const [professorId, setProfessorId] = useState("");
  const [userQuery, setUserQuery] = useState("");
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isQuerying, setIsQuerying] = useState(false);
  // const [isClient, setIsClient] = useState(false);

  // useEffect(() => {
  //   setIsClient(true);
  // }, []);

  const handleSubmit = async () => {
    const extractedId = extractProfessorId(professorId);
    if (!extractedId) {
      setError(
        "Invalid URL format. Please enter a valid RateMyProfessors URL."
      );
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/professor_details", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ professorId: extractedId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      const professorInfo = data.professorInfo;
      const feedbacks = data.feedbacks;

      // Format professorInfo as a comma-separated string
      const professorInfoString = [
        `Name: ${professorInfo.name || "Unknown"}`,
        `Department: ${professorInfo.department || "Unknown"}`,
        `Overall Rating: ${professorInfo.overallRating || "N/A"}`,
        `Number of Ratings: ${professorInfo.numRatings || "0"}`,
        `Would Take Again: ${professorInfo.wouldTakeAgain || "N/A"}`,
        `Difficulty: ${professorInfo.difficulty || "N/A"}`,
        `Top Tags: ${professorInfo.topTags.join(", ") || "None"}`,
      ].join(", ");

      // Format feedbacks as a comma-separated string
      const feedbacksString = feedbacks
        .map((feedback) =>
          [
            `Course: ${feedback.course || ""}`,
            `Date: ${feedback.date || ""}`,
            `Quality: ${feedback.qualityRating || ""}`,
            `Difficulty: ${feedback.difficultyRating || ""}`,
            `Comments: ${feedback.comments || ""}`,
            `Tags: ${feedback.tags.join(", ") || "None"}`,
          ].join(", ")
        )
        .join("; ");

      // Send professor info and feedbacks to the API for embedding and storage
      await sendToEmbeddingAPI(
        professorId,
        professorInfoString,
        feedbacksString
      );

      devLogger.log("Professor Information:", professorInfoString);
      devLogger.log("Feedbacks:", feedbacksString);
    } catch (err) {
      devLogger.error("Error:", err.message);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const extractProfessorId = (url) => {
    const match = url.match(/professor\/(\d+)$/);
    return match ? match[1] : null;
  };

  const sendToEmbeddingAPI = async (source, professorInfo, feedbacks) => {
    try {
      devLogger.log("Preparing data for embedding API...");
      const text = `Professor Information: ${professorInfo}\n\nFeedbacks: ${feedbacks}`;
      const chunkSize = 5000; // Adjust this value based on your needs
      const chunks = [];

      for (let i = 0; i < text.length; i += chunkSize) {
        chunks.push(text.slice(i, i + chunkSize));
      }

      devLogger.log(`Prepared ${chunks.length} chunks for processing`);

      for (let i = 0; i < chunks.length; i++) {
        setError(null);
        devLogger.log(`Sending chunk ${i + 1}/${chunks.length} to the API...`);
        
        try {
          const response = await fetch("/api/add-professor", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              source,
              text: chunks[i],
              chunkIndex: i,
              totalChunks: chunks.length,
            }),
          });

          // Handle non-200 responses
          if (!response.ok) {
            const errorData = await response.json();
            devLogger.error(`API error (${response.status}):`, errorData);
            
            // If this is a Pinecone error, show a more helpful message
            if (errorData.error && (
                errorData.error.includes("Pinecone") || 
                errorData.error.includes("index") || 
                errorData.error.includes("vector"))) {
              throw new Error(`Database storage error: ${errorData.error}`);
            } else {
              throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.error || "Unknown error"}`);
            }
          }

          const result = await response.json();
          devLogger.log(`Chunk ${i + 1}/${chunks.length} processed:`, result);
          
          // If there are multiple chunks, show progress
          if (chunks.length > 1) {
            setError(`Processing data: ${i + 1}/${chunks.length} chunks completed.`);
          }
          
          // Add a small delay between requests to avoid overwhelming the API
          if (i < chunks.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } catch (chunkError) {
          devLogger.error(`Error processing chunk ${i + 1}:`, chunkError);
          throw new Error(`Error processing chunk ${i + 1}: ${chunkError.message}`);
        }
      }

      setError(null);
      devLogger.log("All chunks processed successfully");
    } catch (error) {
      devLogger.error("Error sending data for embedding:", error);
      
      // Provide more specific error messages based on the error
      if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
        setError("Network error when saving professor data. Please check your internet connection and try again.");
      } else if (error.message.includes("Pinecone") || error.message.includes("index") || error.message.includes("Database storage")) {
        setError(`Database error: ${error.message}. The system admin has been notified.`);
      } else {
        setError(`Error: ${error.message}`);
      }
    }
  };

  const handleQuery = async () => {
    if (!userQuery.trim()) {
      setError("Please enter a question.");
      return;
    }

    setIsQuerying(true);
    setError(null);
    try {
      // Generate a session ID based on the professor ID to maintain context per professor
      const sessionId = professorId ? `session-${extractProfessorId(professorId)}` : 'default-session';
      
      devLogger.log(`Sending query: "${userQuery}" with session ID: ${sessionId}`);
      
      const response = await fetch("/api/get-professor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          userQuery,
          sessionId 
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        // For API errors, the response should contain an error message
        const errorMessage = data.error || `API error (${response.status})`;
        devLogger.error("API error:", data);
        throw new Error(errorMessage);
      }

      // Handle string responses or object responses
      if (typeof data === 'string') {
        // Check if the answer indicates no relevant information
        if (data.includes("don't have enough information")) {
          setError("No relevant information found for this professor. Try adding a professor first or ask a different question.");
        } else {
          setAnswer(data);
          setError(null);
        }
      } else if (data && typeof data === 'object') {
        // If data is an object, check if it has an error field
        if (data.error) {
          throw new Error(data.error);
        } else if (data.content) {
          // Some APIs return content in a content field
          setAnswer(data.content);
          setError(null);
        } else {
          // Otherwise convert the object to a string
          setAnswer(JSON.stringify(data));
          setError(null);
        }
      }
    } catch (err) {
      devLogger.error("Error querying professor:", err);
      
      // Show a more user-friendly error
      if (err.message.includes("Failed to fetch") || err.message.includes("NetworkError")) {
        setError("Network error. Please check your internet connection and try again.");
      } else if (err.message.includes("OpenAI")) {
        setError("There was a problem with the AI service. Please try again later.");
      } else if (err.message.includes("Pinecone") || err.message.includes("embedding")) {
        setError("There was a problem retrieving professor information. Please try adding the professor again.");
      } else {
        setError(`Error: ${err.message}`);
      }
    } finally {
      setIsQuerying(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-indigo-900 to-purple-800 overflow-hidden">
      <DynamicNavbar />
      <div className="container mx-auto px-4 py-10 lg:py-20 flex flex-col lg:flex-row justify-between items-center">
        {/* Spline model container */}
        <div className="w-full lg:w-1/2 aspect-square mb-8 lg:mb-0 relative">
          <div className="absolute inset-0 scale-[0.7] sm:scale-75 lg:scale-90 origin-center transform-gpu">
            <Spline scene="https://prod.spline.design/h-MzhlKtinRO8ewm/scene.splinecode" />
          </div>
        </div>

        {/* Chatbot Interface */}
        <div className="w-full lg:w-1/2 lg:pr-8 order-2 lg:order-1">
          <ChatbotInterface
            professorId={professorId}
            setProfessorId={setProfessorId}
            userQuery={userQuery}
            setUserQuery={setUserQuery}
            handleSubmit={handleSubmit}
            handleQuery={handleQuery}
            isLoading={isLoading}
            isQuerying={isQuerying}
            error={error}
            answer={answer}
          />
        </div>
      </div>
    </div>
  );
}

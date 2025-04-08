"use client";

import { useState, useEffect } from "react";
import ChatbotInterface from "../components/ChatBotInterface";
import DynamicNavbar from "../components/DynamicNavbar";
import Spline from "@splinetool/react-spline";
import { ArrowRight, BookOpen, Star, AlertCircle, Loader } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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

// Toast notification component
const Toast = ({ message, type = "success", onDismiss }) => {
  const colors = {
    success: "bg-green-500",
    error: "bg-red-500",
    info: "bg-blue-500",
    warning: "bg-yellow-500"
  };
  
  const icons = {
    success: <CheckIcon className="w-5 h-5" />,
    error: <AlertCircle className="w-5 h-5" />,
    info: <InfoIcon className="w-5 h-5" />,
    warning: <AlertTriangle className="w-5 h-5" />
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -50, x: "-50%" }}
      animate={{ opacity: 1, y: 0, x: "-50%" }}
      exit={{ opacity: 0, y: -20, x: "-50%" }}
      className={`fixed top-6 left-1/2 z-50 py-3 px-5 rounded-xl shadow-lg text-white flex items-center ${colors[type]}`}
    >
      <div className="mr-3">
        {icons[type]}
      </div>
      <p>{message}</p>
      <button onClick={onDismiss} className="ml-4 text-white/70 hover:text-white">
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
};

// Check Icon Component
const CheckIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

// Info Icon Component
const InfoIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

// Alert Triangle Icon Component
const AlertTriangle = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

// X Icon Component
const X = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

export default function Home() {
  const [professorId, setProfessorId] = useState("");
  const [userQuery, setUserQuery] = useState("");
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isQuerying, setIsQuerying] = useState(false);
  const [toast, setToast] = useState(null);
  const [processingStatus, setProcessingStatus] = useState(null);
  const [splineLoaded, setSplineLoaded] = useState(false);

  // Handle Spline load
  const handleSplineLoad = () => {
    setSplineLoaded(true);
  };

  // Show a toast notification
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 5000);
  };

  // Dismiss toast
  const dismissToast = () => {
    setToast(null);
  };

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

      // Get response as text first to handle potential JSON parsing errors
      const responseText = await response.text();
      let data;
      
      try {
        // Try to parse the response as JSON
        data = JSON.parse(responseText);
      } catch (parseError) {
        // If parsing fails, provide a more helpful error
        devLogger.error("Failed to parse JSON response:", responseText.substring(0, 200));
        throw new Error(`Server returned an invalid response. This might be due to a timeout or rate limiting. Please try again later. Error details: ${parseError.message}`);
      }

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      const professorInfo = data.professorInfo;
      const feedbacks = data.feedbacks;

      if (!professorInfo || !feedbacks) {
        throw new Error("Incomplete data received from server. Missing professor information or feedbacks.");
      }

      // Format professorInfo as a comma-separated string
      const professorInfoString = [
        `Name: ${professorInfo.name || "Unknown"}`,
        `Department: ${professorInfo.department || "Unknown"}`,
        `Overall Rating: ${professorInfo.overallRating || "N/A"}`,
        `Number of Ratings: ${professorInfo.numRatings || "0"}`,
        `Would Take Again: ${professorInfo.wouldTakeAgain || "N/A"}`,
        `Difficulty: ${professorInfo.difficulty || "N/A"}`,
        `Top Tags: ${(professorInfo.topTags && Array.isArray(professorInfo.topTags)) ? professorInfo.topTags.join(", ") : "None"}`,
      ].join(", ");

      // Format feedbacks as a comma-separated string with better error handling
      const feedbacksString = feedbacks
        .map((feedback) =>
          [
            `Course: ${feedback.course || ""}`,
            `Date: ${feedback.date || ""}`,
            `Quality: ${feedback.qualityRating || ""}`,
            `Difficulty: ${feedback.difficultyRating || ""}`,
            `Comments: ${feedback.comments || ""}`,
            `Tags: ${(feedback.tags && Array.isArray(feedback.tags)) ? feedback.tags.join(", ") : "None"}`,
          ].join(", ")
        )
        .join("; ");

      // Send professor info and feedbacks to the API for embedding and storage
      await sendToEmbeddingAPI(
        professorId,
        professorInfoString,
        feedbacksString,
        true // Flag as a refresh operation
      );

      devLogger.log("Professor Information:", professorInfoString);
      devLogger.log("Feedbacks:", feedbacksString);
      
      // Show success toast
      showToast(`Professor ${professorInfo.name} data added successfully!`, "success");
    } catch (err) {
      devLogger.error("Error:", err.message);
      
      // More user-friendly error messages based on error type
      if (err.message.includes("timeout") || err.message.includes("504")) {
        setError("The request timed out. The server may be busy or RateMyProfessors might be limiting requests. Please try again later.");
      } else if (err.message.includes("invalid response") || err.message.includes("JSON")) {
        setError("Received an invalid response from the server. This might be due to rate limiting by RateMyProfessors. Please try again in a few minutes.");
      } else {
        setError(err.message);
      }
      
      showToast(`Error: ${err.message}`, "error");
    } finally {
      setIsLoading(false);
      setProcessingStatus(null);
    }
  };

  const extractProfessorId = (url) => {
    const match = url.match(/professor\/(\d+)$/);
    return match ? match[1] : null;
  };

  // Utility function for fetch with retry logic
  const fetchWithRetry = async (url, options, maxRetries = 3) => {
    let retries = 0;
    
    while (retries < maxRetries) {
      try {
        const response = await fetch(url, options);
        
        // For non-2xx responses that indicate temporary issues, retry
        if (!response.ok && (response.status === 429 || response.status === 504 || response.status === 503)) {
          retries++;
          
          // Log the retry attempt
          devLogger.log(`Request failed with status ${response.status}, retry attempt ${retries}/${maxRetries}`);
          
          if (retries >= maxRetries) {
            return response; // Return the last failed response after max retries
          }
          
          // Calculate delay with exponential backoff: 1s, 2s, 4s, etc. up to 10s max
          const delay = Math.min(1000 * Math.pow(2, retries - 1), 10000);
          setProcessingStatus(`Server busy, retrying in ${delay/1000}s... (Attempt ${retries}/${maxRetries})`);
          
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        return response;
      } catch (error) {
        retries++;
        
        devLogger.error(`Network error during fetch, retry attempt ${retries}/${maxRetries}:`, error);
        
        if (retries >= maxRetries) {
          throw error; // Throw the last error after max retries
        }
        
        // Calculate delay with exponential backoff
        const delay = Math.min(1000 * Math.pow(2, retries - 1), 10000);
        setProcessingStatus(`Network error, retrying in ${delay/1000}s... (Attempt ${retries}/${maxRetries})`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  };

  const sendToEmbeddingAPI = async (source, professorInfo, feedbacks, isRefresh = false) => {
    try {
      devLogger.log("Preparing data for embedding API...");
      const text = `Professor Information: ${professorInfo}\n\nFeedbacks: ${feedbacks}`;
      
      // Use smaller chunks for more reliable processing
      const chunkSize = 4000; // Reduced from 5000 for more reliable processing
      const chunks = [];

      for (let i = 0; i < text.length; i += chunkSize) {
        chunks.push(text.slice(i, i + chunkSize));
      }

      devLogger.log(`Prepared ${chunks.length} chunks for processing`);

      for (let i = 0; i < chunks.length; i++) {
        setError(null);
        setProcessingStatus(`Processing chunk ${i + 1} of ${chunks.length}...`);
        devLogger.log(`Sending chunk ${i + 1}/${chunks.length} to the API...`);
        
        try {
          // Use fetchWithRetry instead of regular fetch
          const response = await fetchWithRetry("/api/add-professor", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              source,
              text: chunks[i],
              chunkIndex: i,
              totalChunks: chunks.length,
              isRefresh: isRefresh // Pass the refresh flag
            }),
          }, 3); // Allow up to 3 retries

          // Get response as text first to handle potential JSON parsing errors
          const responseText = await response.text();
          let result;
          
          try {
            // Try to parse the response as JSON
            result = JSON.parse(responseText);
          } catch (parseError) {
            devLogger.error(`Failed to parse JSON response for chunk ${i + 1}:`, responseText.substring(0, 200));
            throw new Error(`Server returned an invalid response for chunk ${i + 1}. This might be due to a timeout or rate limiting.`);
          }

          // Handle non-200 responses
          if (!response.ok) {
            devLogger.error(`API error (${response.status}):`, result);
            
            // If this is a Pinecone error, show a more helpful message
            if (result.error && (
                result.error.includes("Pinecone") || 
                result.error.includes("index") || 
                result.error.includes("vector"))) {
              throw new Error(`Database storage error: ${result.error}`);
            } else {
              throw new Error(`HTTP error! status: ${response.status}, message: ${result.error || "Unknown error"}`);
            }
          }

          devLogger.log(`Chunk ${i + 1}/${chunks.length} processed:`, result);
          
          // If there are multiple chunks, show progress
          if (chunks.length > 1) {
            setProcessingStatus(`Processed ${i + 1} of ${chunks.length} chunks`);
          }
          
          // Add a small delay between requests to avoid overwhelming the API
          if (i < chunks.length - 1) {
            const delay = 2000; // Increased delay to 2 seconds
            setProcessingStatus(`Processed chunk ${i + 1}/${chunks.length}, waiting ${delay/1000}s before next chunk...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        } catch (chunkError) {
          devLogger.error(`Error processing chunk ${i + 1}:`, chunkError);
          
          // Provide a more descriptive error
          if (chunkError.message.includes("timeout") || chunkError.message.includes("504")) {
            throw new Error(`Timeout processing chunk ${i + 1}. The server may be busy. Try again later or try with a different professor.`);
          } else {
            throw new Error(`Error processing chunk ${i + 1}: ${chunkError.message}`);
          }
        }
      }

      setError(null);
      devLogger.log("All chunks processed successfully");
    } catch (error) {
      devLogger.error("Error sending data for embedding:", error);
      
      // Provide more specific error messages based on the error
      if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
        setError("Network error when saving professor data. Please check your internet connection and try again.");
      } else if (error.message.includes("timeout") || error.message.includes("504")) {
        setError("The request timed out. The server may be busy or RateMyProfessors might be limiting requests. Please try again later.");
      } else if (error.message.includes("Pinecone") || error.message.includes("index") || error.message.includes("Database storage")) {
        setError(`Database error: ${error.message}. The system admin has been notified.`);
      } else if (error.message.includes("invalid response") || error.message.includes("JSON")) {
        setError("Received an invalid response from the server. This might be due to rate limiting. Please try again in a few minutes.");
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
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onDismiss={dismissToast}
          />
        )}
      </AnimatePresence>
      
      {/* Main Content */}
      <div className="container mx-auto px-4 py-10 lg:py-20">
        <div className="flex flex-col items-center mb-12 text-center">
          <motion.h1 
            className="text-4xl md:text-5xl font-bold text-white mb-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
              Rate My Professor AI
            </span>
          </motion.h1>
          <motion.p 
            className="text-indigo-200 max-w-2xl"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Get insights about professors based on student reviews. Add a professor URL from RateMyProfessors.com, 
            then ask questions about their teaching style, difficulty, and more.
          </motion.p>
        </div>
      
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
          {/* Chatbot Interface */}
          <motion.div 
            className="w-full lg:w-1/2 order-2 lg:order-1"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
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
            
            {/* Processing Status */}
            {processingStatus && (
              <motion.div 
                className="mt-4 p-4 bg-indigo-900/50 backdrop-blur-sm rounded-xl border border-indigo-500/30 text-indigo-200"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center">
                  <Loader className="animate-spin mr-3 h-5 w-5" />
                  <p>{processingStatus}</p>
                </div>
              </motion.div>
            )}
            
            {/* Tips Panel */}
            <motion.div
              className="mt-8 p-6 bg-white/5 backdrop-blur-sm rounded-xl border border-indigo-500/20"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <h3 className="font-bold text-xl text-white mb-3 flex items-center">
                <BookOpen className="mr-2 h-5 w-5 text-indigo-300" />
                Tips for Better Results
              </h3>
              <ul className="text-indigo-200 space-y-2 text-sm">
                <li className="flex items-start">
                  <ArrowRight className="h-4 w-4 text-indigo-400 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Add a professor by pasting their <strong>full URL</strong> from RateMyProfessors.com</span>
                </li>
                <li className="flex items-start">
                  <ArrowRight className="h-4 w-4 text-indigo-400 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Be specific in your questions (e.g., &quot;What do students say about Professor Smith&apos;s exams?&quot;)</span>
                </li>
                <li className="flex items-start">
                  <ArrowRight className="h-4 w-4 text-indigo-400 mr-2 mt-0.5 flex-shrink-0" />
                  <span>You can ask follow-up questions and the AI will remember the context</span>
                </li>
                <li className="flex items-start">
                  <ArrowRight className="h-4 w-4 text-indigo-400 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Check out the <a href="/search-professors" className="text-indigo-400 hover:underline">Professor Directory</a> to browse all available professors</span>
                </li>
              </ul>
            </motion.div>
          </motion.div>
          
          {/* 3D Model */}
          <motion.div 
            className="w-full lg:w-1/2 aspect-square mb-8 lg:mb-0 relative order-1 lg:order-2 flex items-center justify-center"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            {/* Placeholder while Spline loads */}
            {!splineLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-indigo-800/20 rounded-3xl backdrop-blur-sm">
                <div className="text-center">
                  <Loader className="w-10 h-10 text-indigo-300 animate-spin mx-auto mb-4" />
                  <p className="text-indigo-200">Loading 3D Model...</p>
                </div>
              </div>
            )}
            
            <div className={`absolute inset-0 scale-[0.7] sm:scale-75 lg:scale-90 origin-center transform-gpu ${!splineLoaded ? 'opacity-0' : 'opacity-100'} transition-opacity duration-500`}>
              <Spline 
                scene="https://prod.spline.design/h-MzhlKtinRO8ewm/scene.splinecode" 
                onLoad={handleSplineLoad}
              />
            </div>
          </motion.div>
        </div>
      </div>
      
      {/* Feature Highlights Section */}
      <div className="container mx-auto px-4 pb-20">
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <div className="bg-white/10 backdrop-blur-sm p-6 rounded-xl border border-indigo-500/20">
            <div className="w-12 h-12 bg-indigo-700 rounded-full flex items-center justify-center mb-4">
              <Star className="h-6 w-6 text-yellow-300" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Student Ratings & Reviews</h3>
            <p className="text-indigo-200">
              Access real student feedback about professors, including ratings, difficulty scores, and detailed comments.
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm p-6 rounded-xl border border-indigo-500/20">
            <div className="w-12 h-12 bg-indigo-700 rounded-full flex items-center justify-center mb-4">
              <svg className="h-6 w-6 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">AI-Powered Insights</h3>
            <p className="text-indigo-200">
              Our AI analyzes thousands of reviews to give you comprehensive insights about any professor&apos;s teaching style.
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm p-6 rounded-xl border border-indigo-500/20">
            <div className="w-12 h-12 bg-indigo-700 rounded-full flex items-center justify-center mb-4">
              <svg className="h-6 w-6 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Course Planning</h3>
            <p className="text-indigo-200">
              Make better decisions when selecting courses by understanding professors&apos; teaching approaches and expectations.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

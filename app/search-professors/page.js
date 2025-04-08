"use client";

import { useEffect, useState } from "react";
import DynamicNavbar from "../components/DynamicNavbar";
import { motion, AnimatePresence } from "framer-motion";
import { Star, ThumbsUp, Book, X, Search, Filter, SortAsc, Loader, School, Award, RefreshCw, Plus, PlusCircle, Scale } from "lucide-react";
import ProfessorCompare from "../components/ProfessorCompare";

// Modal component with enhanced design
const Modal = ({ isOpen, onClose, professor }) => {
  if (!isOpen) return null;
  
  // Extract unique courses from feedbacks (if available)
  const rawCourses = Array.isArray(professor.metadata.courses) 
    ? professor.metadata.courses 
    : professor.metadata.feedbacks && Array.isArray(professor.metadata.feedbacks)
      ? [...new Set(professor.metadata.feedbacks
          .map(feedback => feedback.course)
          .filter(course => course && course.trim() !== ''))]
      : [];
      
  // Clean and deduplicate courses
  const courses = [];
  const courseMap = new Map();
  
  // Process each course to extract its code
  rawCourses.forEach(course => {
    if (!course || typeof course !== 'string') return;
    
    // Clean the course string
    const cleanCourse = course.trim().replace(/\s+/g, ' ');
    
    // Try to extract course code (e.g., "CS101")
    const codeMatch = cleanCourse.match(/^([A-Z]{2,}\s*\d{3,4}[A-Z]?)/i);
    const courseCode = codeMatch ? codeMatch[1].toUpperCase().replace(/\s+/g, '') : null;
    
    // If we found a course code, use it as key to avoid duplicates
    const key = courseCode || cleanCourse.toLowerCase();
    
    if (!courseMap.has(key)) {
      courseMap.set(key, cleanCourse);
      courses.push(cleanCourse);
    }
  });
  
  // Extract student comments if available
  const comments = Array.isArray(professor.metadata.feedbacks) 
    ? professor.metadata.feedbacks
        .filter(feedback => feedback.comments && feedback.comments.trim() !== '')
        .map(feedback => ({
          comment: feedback.comments,
          course: feedback.course || 'N/A',
          date: feedback.date || 'N/A',
          quality: feedback.qualityRating || 'N/A'
        })).slice(0, 3) // Limit to 3 comments
    : [];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 20 }}
          className="bg-white dark:bg-gray-800 p-8 rounded-2xl max-w-2xl w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-800 dark:text-white">{professor.metadata.name}</h2>
              <p className="text-lg text-indigo-600 dark:text-indigo-400 font-medium mt-1">{professor.metadata.department}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white bg-gray-100 dark:bg-gray-700 p-2 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          
          {/* Ratings Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-indigo-50 dark:bg-indigo-900/30 p-4 rounded-xl">
              <div className="flex items-center mb-3">
                <Star className="text-yellow-500 mr-2" size={28} />
                <span className="text-3xl font-bold text-gray-800 dark:text-white">
                  {professor.metadata.overallRating.toFixed(1)}
                </span>
                <span className="text-gray-600 dark:text-gray-400 ml-2 text-sm">
                  out of 5.0
                </span>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                Based on {professor.metadata.numberOfRatings} student ratings
              </p>
            </div>
            
            <div className="bg-indigo-50 dark:bg-indigo-900/30 p-4 rounded-xl">
              <div className="flex flex-col">
                <div className="flex items-center mb-2">
                  <ThumbsUp className="text-green-500 mr-2" />
                  <span className="font-medium text-gray-800 dark:text-white">Would Take Again:</span>
                  <span className="ml-auto font-bold text-green-600 dark:text-green-400">{professor.metadata.wouldTakeAgain || 'N/A'}</span>
                </div>
                <div className="flex items-center">
                  <Book className="text-blue-500 mr-2" />
                  <span className="font-medium text-gray-800 dark:text-white">Difficulty:</span>
                  <span className="ml-auto font-bold text-blue-600 dark:text-blue-400">
                    {professor.metadata.difficulty ? professor.metadata.difficulty.toFixed(1) : 'N/A'}/5
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Classes Taught */}
          {courses.length > 0 ? (
            <div className="mb-6 bg-white dark:bg-gray-700/30 rounded-xl p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3 flex items-center">
                <svg className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                Classes Taught
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {courses.map((course, index) => (
                  <div key={index} className="bg-gray-50 dark:bg-gray-700 p-2 rounded flex items-center">
                    <span className="w-6 h-6 bg-indigo-100 dark:bg-indigo-800 text-indigo-600 dark:text-indigo-300 rounded-full flex items-center justify-center text-xs font-medium mr-2">
                      {index + 1}
                    </span>
                    <span className="text-gray-700 dark:text-gray-300 text-sm">{course}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="mb-6 bg-white dark:bg-gray-700/30 rounded-xl p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3 flex items-center">
                <svg className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                Classes Taught
              </h3>
              <div className="p-4 text-center">
                <p className="text-gray-500 dark:text-gray-400 italic">No specific course information available for this professor.</p>
              </div>
            </div>
          )}
          
          {/* Tags */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3 flex items-center">
              <svg className="w-5 h-5 mr-2 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              Student Feedback Tags
            </h3>
            <div className="flex flex-wrap">
              {professor.metadata.topTags.length > 0 ? (
                professor.metadata.topTags.map((tag, index) => (
                  <span
                    key={index}
                    className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-3 py-1.5 rounded-full mr-2 mb-2 text-sm font-medium"
                  >
                    {tag}
                  </span>
                ))
              ) : (
                <span className="text-gray-500 dark:text-gray-400">No tags available</span>
              )}
            </div>
          </div>
          
          {/* Student Comments */}
          {comments.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                Recent Student Comments
              </h3>
              <div className="space-y-4">
                {comments.map((comment, index) => (
                  <div key={index} className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <p className="text-gray-700 dark:text-gray-300 text-sm italic">&quot;{comment.comment}&quot;</p>
                    <div className="mt-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>{comment.course}</span>
                      <div className="flex items-center">
                        <Star className="text-yellow-400 w-3 h-3 mr-1" />
                        <span>{comment.quality}</span>
                      </div>
                      <span>{comment.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Study Tips Based on Reviews */}
          <div className="mb-6 bg-green-50 dark:bg-green-900/20 p-5 rounded-xl">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3 flex items-center">
              <svg className="w-5 h-5 mr-2 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              Success Tips for this Professor
            </h3>
            <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              {professor.metadata.difficulty > 3.5 ? (
                <li className="flex items-start">
                  <svg className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>This professor has a higher difficulty rating. Plan to dedicate extra study time for this course.</span>
                </li>
              ) : (
                <li className="flex items-start">
                  <svg className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>This professor has a moderate difficulty rating. Regular study should be sufficient.</span>
                </li>
              )}
              {professor.metadata.topTags.includes("TOUGH GRADER") ? (
                <li className="flex items-start">
                  <svg className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Students report tough grading - review assignment requirements carefully and ask for clarification.</span>
                </li>
              ) : null}
              {professor.metadata.topTags.includes("LECTURE HEAVY") || professor.metadata.topTags.includes("LECTURE") ? (
                <li className="flex items-start">
                  <svg className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Lectures are important - take detailed notes and consider recording lectures if allowed.</span>
                </li>
              ) : null}
              {professor.metadata.topTags.includes("PARTICIPATION") || professor.metadata.topTags.includes("PARTICIPATION MATTERS") ? (
                <li className="flex items-start">
                  <svg className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Active participation impacts your grade - prepare questions and comments before class.</span>
                </li>
              ) : null}
              {professor.metadata.topTags.includes("EXTRA CREDIT") ? (
                <li className="flex items-start">
                  <svg className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Look for extra credit opportunities - students mention they&apos;re available!</span>
                </li>
              ) : null}
              <li className="flex items-start">
                <svg className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>Visit office hours early in the semester to establish rapport and get additional help.</span>
              </li>
            </ul>
          </div>
          
          {/* Footer */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400 italic">
              Data sourced from RateMyProfessors.com student reviews. Last updated recently.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Professor Card Component
const ProfessorCard = ({ professor, onClick, onCompare, isSelected, index }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Calculate a color based on rating
  const getRatingColor = (rating) => {
    if (rating >= 4.5) return "bg-emerald-500";
    if (rating >= 4.0) return "bg-green-500";
    if (rating >= 3.5) return "bg-lime-500";
    if (rating >= 3.0) return "bg-yellow-500";
    if (rating >= 2.5) return "bg-orange-500";
    return "bg-red-500";
  };
  
  const ratingColorClass = getRatingColor(professor.metadata.overallRating);
  
  // Extract unique courses from feedbacks (if available)
  const rawCourses = Array.isArray(professor.metadata.courses) 
    ? professor.metadata.courses 
    : professor.metadata.feedbacks && Array.isArray(professor.metadata.feedbacks)
      ? [...new Set(professor.metadata.feedbacks
          .map(feedback => feedback.course)
          .filter(course => course && course.trim() !== ''))]
      : [];

  // Clean and deduplicate courses
  const normalizedCourses = [];
  const courseMap = new Map();
  
  // Process each course to extract its code
  rawCourses.forEach(course => {
    if (!course || typeof course !== 'string') return;
    
    // Clean the course string
    const cleanCourse = course.trim().replace(/\s+/g, ' ');
    
    // Try to extract course code (e.g., "CS101")
    const codeMatch = cleanCourse.match(/^([A-Z]{2,}\s*\d{3,4}[A-Z]?)/i);
    const courseCode = codeMatch ? codeMatch[1].toUpperCase().replace(/\s+/g, '') : null;
    
    // If we found a course code, use it as key to avoid duplicates
    const key = courseCode || cleanCourse.toLowerCase();
    
    if (!courseMap.has(key)) {
      courseMap.set(key, cleanCourse);
      normalizedCourses.push(cleanCourse);
    }
  });

  // Limit to 3 courses for display
  const displayCourses = normalizedCourses.slice(0, 3);
  
  // Safely check for topTags
  const hasTags = professor.metadata.topTags && Array.isArray(professor.metadata.topTags) && professor.metadata.topTags.length > 0;
  
  // Function to refresh professor data
  const handleRefreshData = async (e) => {
    e.stopPropagation(); // Prevent opening the modal
    setIsRefreshing(true);
    
    try {
      // Extract professor ID from the professor.id string
      const idMatch = professor.id.match(/professor\/(\d+)-/);
      const professorId = idMatch ? idMatch[1] : null;
      
      if (!professorId) {
        alert("Could not extract professor ID for refresh");
        return;
      }
      
      // Call the API to refresh professor data
      const response = await fetch("/api/professor_details", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          professorId,
          isRefresh: true 
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to refresh professor data");
      }
      
      const data = await response.json();
      
      // Format the data for embedding and storage
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
        
      // Call the API to store the refreshed data
      await fetch("/api/add-professor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          source: `https://www.ratemyprofessors.com/professor/${professorId}`,
          text: `Professor Information: ${professorInfoString}\n\nFeedbacks: ${feedbacksString}`,
          chunkIndex: 0,
          totalChunks: 1,
          isRefresh: true
        }),
      });
      
      // Show success message and refresh the page to load updated data
      alert(`Professor ${professorInfo.name}'s data has been refreshed. The page will reload to show updated data.`);
      window.location.reload();
    } catch (error) {
      console.error("Error refreshing professor data:", error);
      alert("Failed to refresh professor data. Please try again.");
    } finally {
      setIsRefreshing(false);
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 border flex flex-col ${isSelected ? 'border-indigo-500 ring-2 ring-indigo-500/50' : 'border-transparent dark:border-gray-700'}`}
    >
      <div className="absolute top-3 right-3 z-10">
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onCompare(professor);
          }}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
            isSelected 
              ? 'bg-indigo-500 text-white shadow-md' 
              : 'bg-white/90 backdrop-blur-sm text-gray-600 hover:bg-indigo-100 dark:bg-gray-700/90 dark:text-gray-300 dark:hover:bg-indigo-900/50 shadow-sm'
          }`}
          title={isSelected ? "Remove from comparison" : "Add to comparison"}
        >
          {isSelected ? (
            <X size={16} />
          ) : (
            <Scale size={16} />
          )}
        </button>
      </div>
      
      <div 
        className="p-6 cursor-pointer relative flex-grow"
        onClick={onClick}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="pr-4 flex-1 min-w-0">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white truncate">{professor.metadata.name}</h2>
            <p className="text-indigo-600 dark:text-indigo-400 text-sm mt-1 break-words">
              {professor.metadata.department}
            </p>
          </div>
          <div className={`${ratingColorClass} text-white text-lg font-bold h-12 w-12 rounded-full flex items-center justify-center ml-2 flex-shrink-0 shadow-md`}>
            {professor.metadata.overallRating.toFixed(1)}
          </div>
        </div>
        
        <div className="space-y-3 mb-5">
          <div className="flex items-center text-sm">
            <Star className="text-yellow-400 w-4 h-4 mr-2 flex-shrink-0" />
            <span className="text-gray-700 dark:text-gray-300">
              <span className="font-medium">{professor.metadata.numberOfRatings}</span> ratings
            </span>
          </div>
          
          <div className="flex items-center text-sm">
            <ThumbsUp className="text-green-500 w-4 h-4 mr-2 flex-shrink-0" />
            <span className="text-gray-700 dark:text-gray-300">
              Would take again: <span className="font-medium">{professor.metadata.wouldTakeAgain || 'N/A'}</span>
            </span>
          </div>
          
          <div className="flex items-center text-sm">
            <Book className="text-blue-500 w-4 h-4 mr-2 flex-shrink-0" />
            <span className="text-gray-700 dark:text-gray-300">
              Difficulty: <span className="font-medium">{professor.metadata.difficulty ? professor.metadata.difficulty.toFixed(1) : 'N/A'}/5</span>
            </span>
          </div>
        </div>
        
        {/* Classes Taught Section - Always show this section */}
        <div className="mb-5 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-lg p-3">
          <h3 className="text-sm font-semibold text-indigo-800 dark:text-indigo-300 mb-2 flex items-center">
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Classes Taught
          </h3>
          <ul className="space-y-1">
            {displayCourses.length > 0 ? (
              <>
                {displayCourses.map((course, idx) => (
                  <li key={idx} className="text-xs text-gray-700 dark:text-gray-300 pl-2 border-l-2 border-indigo-300 dark:border-indigo-700">
                    {course}
                  </li>
                ))}
                {normalizedCourses.length > 3 && (
                  <li className="text-xs text-indigo-600 dark:text-indigo-400 font-medium italic">
                    + {normalizedCourses.length - 3} more courses
                  </li>
                )}
              </>
            ) : (
              <li className="text-xs text-gray-500 dark:text-gray-400 italic pl-2 border-l-2 border-indigo-300/50 dark:border-indigo-700/50">
                No specific course information available
              </li>
            )}
          </ul>
        </div>
        
        <div>
          <div className="flex flex-wrap gap-2">
            {hasTags ? (
              <>
                {professor.metadata.topTags.slice(0, 3).map((tag, index) => (
                  <span key={index} className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs px-3 py-1.5 rounded-full font-medium">
                    {tag}
                  </span>
                ))}
                {professor.metadata.topTags.length > 3 && (
                  <span className="text-xs text-gray-500 dark:text-gray-400 px-3 py-1.5 font-medium">
                    +{professor.metadata.topTags.length - 3} more
                  </span>
                )}
              </>
            ) : (
              <span className="text-xs text-gray-500 dark:text-gray-400 italic">
                No tags available
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="mt-6 flex justify-between items-center space-x-2">
        <div className="flex space-x-2 w-full">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClick(professor);
            }}
            className="flex-1 py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg shadow-md transition-all duration-200 flex items-center justify-center group"
            aria-label="View professor details"
          >
            <span>View Details</span>
            <svg
              className="w-4 h-4 ml-1.5 group-hover:translate-x-0.5 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 5l7 7-7 7"
              ></path>
            </svg>
          </button>
          
          <div className="flex space-x-2">
            <button
              onClick={handleRefreshData}
              disabled={isRefreshing}
              className={`h-10 w-10 flex items-center justify-center rounded-lg shadow-md transition-all duration-200 ${
                isRefreshing 
                  ? 'bg-gray-500 cursor-not-allowed' 
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
              title="Refresh professor data"
              aria-label="Refresh professor data"
            >
              {isRefreshing ? (
                <Loader size={16} className="animate-spin" />
              ) : (
                <RefreshCw size={16} />
              )}
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCompare(professor);
              }}
              className={`h-10 w-10 flex items-center justify-center rounded-lg shadow-md transition-all duration-200 ${
                isSelected
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-purple-600 hover:bg-purple-700 text-white'
              }`}
              title={isSelected ? "Remove from comparison" : "Add to comparison"}
              aria-label={isSelected ? "Remove from comparison" : "Add to comparison"}
            >
              {isSelected ? (
                <X size={16} />
              ) : (
                <Scale size={16} />
              )}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Loading Skeleton Component
const ProfessorCardSkeleton = ({ index }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, delay: index * 0.05 }}
    className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border-transparent dark:border-gray-700 flex flex-col"
  >
    <div className="p-6 flex-grow">
      <div className="flex items-start justify-between mb-4">
        <div className="w-2/3 pr-4">
          <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded-md mb-2 animate-pulse"></div>
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-md w-5/6 animate-pulse mt-1"></div>
        </div>
        <div className="h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse flex-shrink-0 ml-2"></div>
      </div>
      
      <div className="space-y-3 mb-5">
        <div className="flex items-center">
          <div className="w-4 h-4 rounded-full bg-gray-200 dark:bg-gray-700 mr-2 animate-pulse flex-shrink-0"></div>
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-md w-1/2 animate-pulse"></div>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 rounded-full bg-gray-200 dark:bg-gray-700 mr-2 animate-pulse flex-shrink-0"></div>
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-md w-3/4 animate-pulse"></div>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 rounded-full bg-gray-200 dark:bg-gray-700 mr-2 animate-pulse flex-shrink-0"></div>
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-md w-2/3 animate-pulse"></div>
        </div>
      </div>
      
      {/* Classes Taught Skeleton */}
      <div className="mb-5 bg-gray-100 dark:bg-gray-700/40 rounded-lg p-3">
        <div className="flex items-center mb-2">
          <div className="w-4 h-4 rounded-full bg-gray-200 dark:bg-gray-700 mr-2 animate-pulse"></div>
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-md w-1/3 animate-pulse"></div>
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full animate-pulse"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6 animate-pulse"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6 animate-pulse"></div>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2">
        <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded-full w-16 animate-pulse"></div>
        <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded-full w-20 animate-pulse"></div>
        <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded-full w-14 animate-pulse"></div>
      </div>
    </div>
    
    <div className="h-10 bg-gray-200 dark:bg-gray-700 animate-pulse mt-auto"></div>
  </motion.div>
);

// Empty State Component
const EmptyState = ({ searchTerm, clearSearch }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white/10 backdrop-blur-sm p-8 rounded-xl text-center max-w-lg mx-auto mt-10"
  >
    <div className="flex justify-center mb-4">
      <School className="h-16 w-16 text-indigo-300" />
    </div>
    <h3 className="text-2xl font-bold text-white mb-2">No Professors Found</h3>
    <p className="text-indigo-200 mb-6">
      {searchTerm ? (
        <>
          No professors match your search for &quot;<span className="font-bold">{searchTerm}</span>&quot;.
          Try a different search term or add more professors to the database.
        </>
      ) : (
        <>
          There are no professors in the database yet. 
          Try adding professors using the professor URL from RateMyProfessors.
        </>
      )}
    </p>
    {searchTerm && (
      <button
        onClick={clearSearch}
        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
      >
        Clear Search
      </button>
    )}
  </motion.div>
);

export default function Professors() {
  const [professors, setProfessors] = useState([]);
  const [filteredProfessors, setFilteredProfessors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState("overallRating");
  const [selectedProfessor, setSelectedProfessor] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  // New state for filters
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [ratingFilter, setRatingFilter] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  // Add to the existing state variables
  const [selectedForComparison, setSelectedForComparison] = useState([]);
  const [showComparison, setShowComparison] = useState(false);

  // Add a toast message state and function if not already present
  const [toastMessage, setToastMessage] = useState(null);

  const showToastMessage = (message, type = "info") => {
    setToastMessage({ message, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  useEffect(() => {
    fetchProfessors();
  }, []);

  useEffect(() => {
    // Apply all filters
    let filtered = professors;
    
    // Apply search term filter
    if (searchTerm) {
      filtered = filtered.filter(
        (professor) =>
          professor.metadata.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          professor.metadata.department.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply department filter
    if (departmentFilter) {
      filtered = filtered.filter(
        (professor) =>
          professor.metadata.department.toLowerCase().includes(departmentFilter.toLowerCase())
      );
    }
    
    // Apply rating filter
    if (ratingFilter > 0) {
      filtered = filtered.filter(
        (professor) => professor.metadata.overallRating >= ratingFilter
      );
    }
    
    setFilteredProfessors(filtered);
  }, [searchTerm, departmentFilter, ratingFilter, professors]);

  // Get unique departments for filter dropdown
  const departments = [...new Set(professors.map(p => p.metadata.department))];

  async function fetchProfessors() {
    try {
      const response = await fetch("/api/get-professor", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();

      // Sort the data by overall rating
      const sortedData = data.sort(
        (a, b) => b.metadata.overallRating - a.metadata.overallRating
      );

      setProfessors(sortedData);
      setFilteredProfessors(sortedData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const sortProfessors = (criteria) => {
    setSortBy(criteria);
    let sorted;
    
    if (criteria === "name") {
      sorted = [...filteredProfessors].sort((a, b) => 
        a.metadata.name.localeCompare(b.metadata.name)
      );
    } else if (criteria === "department") {
      sorted = [...filteredProfessors].sort((a, b) => 
        a.metadata.department.localeCompare(b.metadata.department)
      );
    } else {
      sorted = [...filteredProfessors].sort(
        (a, b) => b.metadata[criteria] - a.metadata[criteria]
      );
    }
    
    setFilteredProfessors(sorted);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };
  
  const clearSearch = () => {
    setSearchTerm("");
    setDepartmentFilter("");
    setRatingFilter(0);
  };

  const clearFilters = () => {
    setDepartmentFilter("");
    setRatingFilter(0);
  };

  // Function to toggle a professor in the comparison selection
  const toggleCompare = (professor) => {
    setSelectedForComparison(prev => {
      const isSelected = prev.some(p => p.id === professor.id);
      
      if (isSelected) {
        // Remove from selection
        const updatedSelection = prev.filter(p => p.id !== professor.id);
        
        // If there's only one professor left and we're showing the comparison, close it
        if (updatedSelection.length < 2 && showComparison) {
          setShowComparison(false);
        }
        
        // Show a toast notification
        showToastMessage(`Removed ${professor.metadata.name} from comparison`);
        
        return updatedSelection;
      } else {
        // Add to selection (limit to 4 professors)
        if (prev.length >= 4) {
          // Show a toast notification for max limit
          showToastMessage("You can compare a maximum of 4 professors at once", "warning");
          return prev;
        }
        
        // Show a toast notification for addition
        showToastMessage(`Added ${professor.metadata.name} to comparison`);
        
        return [...prev, professor];
      }
    });
  };
  
  // Function to check if a professor is selected for comparison
  const isSelectedForComparison = (professorId) => {
    return selectedForComparison.some(p => p.id === professorId);
  };
  
  // Function to remove a professor from comparison
  const removeFromComparison = (professorId) => {
    setSelectedForComparison(prev => prev.filter(p => p.id !== professorId));
  };
  
  // Function to close the comparison view
  const closeComparison = () => {
    setShowComparison(false);
  };
  
  // Function to open the comparison view if professors are selected
  const openComparison = () => {
    if (selectedForComparison.length > 0) {
      setShowComparison(true);
    }
  };
  
  // Clear comparison selections
  const clearComparison = () => {
    setSelectedForComparison([]);
    setShowComparison(false);
  };

  // Render loading skeleton
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-800">
        <DynamicNavbar />
        <div className="container mx-auto px-4 py-20">
          <motion.h1
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl font-bold text-white mb-8 text-center"
          >
            Professors Directory
          </motion.h1>
          
          <div className="mb-10 flex justify-center">
            <div className="h-12 w-64 bg-white/20 rounded-full animate-pulse"></div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, index) => (
              <ProfessorCardSkeleton key={index} index={index} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-800 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-red-900/30 backdrop-blur-sm p-8 rounded-xl border border-red-500/50 shadow-lg max-w-md text-center"
        >
          <div className="text-red-300 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-white mb-4">Error Loading Professors</h2>
          <p className="text-red-100 mb-6">{error}</p>
          <button 
            onClick={() => fetchProfessors()}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center justify-center mx-auto"
          >
            <RefreshCw size={16} className="mr-2" />
            Try Again
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-800">
      <DynamicNavbar />
      <div className="container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Professor Directory
          </h1>
          <p className="text-indigo-200 max-w-2xl mx-auto">
            Discover and explore professors based on student ratings and reviews. 
            Find the perfect match for your learning style and academic goals.
          </p>
        </motion.div>
        
        <div className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
            <div className="relative w-full md:w-auto">
              <input
                type="text"
                placeholder="Search professors or departments..."
                value={searchTerm}
                onChange={handleSearch}
                className="pl-10 pr-4 py-3 w-full md:w-80 rounded-xl bg-white/10 backdrop-blur-sm text-white border border-indigo-500/30 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-indigo-300"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-indigo-300" size={20} />
              
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-indigo-300 hover:text-white"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            
            <div className="flex items-center gap-2 w-full md:w-auto">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-2 rounded-xl bg-white/10 backdrop-blur-sm text-white border border-indigo-500/30 hover:bg-indigo-600/50 transition-colors flex items-center"
              >
                <Filter size={18} className="mr-2" />
                {showFilters ? "Hide Filters" : "Show Filters"}
              </button>
              
              <select
                value={sortBy}
                onChange={(e) => sortProfessors(e.target.value)}
                className="px-4 py-2 rounded-xl bg-white/10 backdrop-blur-sm text-white border border-indigo-500/30 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="overallRating" className="bg-gray-800 text-white">Sort by Rating</option>
                <option value="numberOfRatings" className="bg-gray-800 text-white">Sort by Popularity</option>
                <option value="difficulty" className="bg-gray-800 text-white">Sort by Difficulty</option>
                <option value="name" className="bg-gray-800 text-white">Sort by Name</option>
                <option value="department" className="bg-gray-800 text-white">Sort by Department</option>
              </select>
            </div>
          </div>
          
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white/10 backdrop-blur-sm p-4 rounded-xl mb-4 border border-indigo-500/30"
            >
              <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                <div className="w-full md:w-auto">
                  <label className="block text-white text-sm mb-1">Department</label>
                  <select
                    value={departmentFilter}
                    onChange={(e) => setDepartmentFilter(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white/10 text-white border border-indigo-500/30 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="" className="bg-gray-800 text-white">All Departments</option>
                    {departments.map((dept, i) => (
                      <option key={i} value={dept} className="bg-gray-800 text-white">{dept}</option>
                    ))}
                  </select>
                </div>
                
                <div className="w-full md:w-auto">
                  <label className="block text-white text-sm mb-1">Minimum Rating</label>
                  <select
                    value={ratingFilter}
                    onChange={(e) => setRatingFilter(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-white/10 text-white border border-indigo-500/30 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="0" className="bg-gray-800 text-white">Any Rating</option>
                    <option value="4.5" className="bg-gray-800 text-white">4.5+</option>
                    <option value="4" className="bg-gray-800 text-white">4.0+</option>
                    <option value="3.5" className="bg-gray-800 text-white">3.5+</option>
                    <option value="3" className="bg-gray-800 text-white">3.0+</option>
                  </select>
                </div>
                
                <div className="mt-4 md:mt-auto">
                  <button
                    onClick={clearFilters}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </motion.div>
          )}
          
          <div className="text-indigo-200 text-sm mt-2">
            {filteredProfessors.length} {filteredProfessors.length === 1 ? 'professor' : 'professors'} found
          </div>
        </div>
        
        {filteredProfessors.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {filteredProfessors.map((professor, index) => (
              <ProfessorCard 
                key={professor.id}
                professor={professor}
                onClick={() => setSelectedProfessor(professor)}
                onCompare={toggleCompare}
                isSelected={isSelectedForComparison(professor.id)}
                index={index}
              />
            ))}
          </motion.div>
        ) : (
          <EmptyState searchTerm={searchTerm} clearSearch={clearSearch} />
        )}
      </div>
      
      {/* Comparison floating action button */}
      {selectedForComparison.length > 0 && (
        <motion.div
          className="fixed bottom-6 right-6 z-40"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
        >
          <div className="flex flex-col items-end">
            {/* Count badge */}
            <div className="mb-2 flex items-center justify-center bg-white dark:bg-gray-800 shadow-lg rounded-full px-4 py-2 text-sm font-bold">
              <span className="mr-2 text-indigo-600 dark:text-indigo-400">{selectedForComparison.length}</span>
              <span className="text-gray-700 dark:text-gray-300">professors selected</span>
            </div>
            
            {/* Action buttons */}
            <div className="flex space-x-2">
              {/* Clear button */}
              <button
                onClick={clearComparison}
                className="p-3 bg-red-600 hover:bg-red-700 rounded-full text-white shadow-lg transition-all duration-200"
                title="Clear comparison"
              >
                <X size={20} />
              </button>
              
              {/* Compare button */}
              <motion.button
                onClick={openComparison}
                className={`flex items-center px-5 py-3 rounded-full text-white shadow-lg transition-all duration-200 ${
                  selectedForComparison.length < 2 
                    ? 'bg-gray-500 cursor-not-allowed' 
                    : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
                disabled={selectedForComparison.length < 2}
                whileHover={selectedForComparison.length >= 2 ? { scale: 1.05 } : {}}
                whileTap={selectedForComparison.length >= 2 ? { scale: 0.95 } : {}}
              >
                <span className="mr-2 font-medium">Compare</span>
                <Scale size={20} />
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}
      
      {/* Toast notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            className={`fixed bottom-20 right-6 z-50 py-2 px-4 rounded-lg shadow-lg text-white ${
              toastMessage.type === 'warning' ? 'bg-amber-500' : 'bg-indigo-600'
            }`}
            initial={{ opacity: 0, y: 50, x: 0 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: 50, x: 0 }}
          >
            {toastMessage.message}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Comparison modal */}
      <AnimatePresence>
        {showComparison && (
          <ProfessorCompare 
            professors={selectedForComparison}
            onClose={closeComparison}
            onRemoveProfessor={removeFromComparison}
          />
        )}
      </AnimatePresence>
      
      {/* Details modal */}
      <Modal 
        isOpen={!!selectedProfessor} 
        onClose={() => setSelectedProfessor(null)} 
        professor={selectedProfessor} 
      />
    </div>
  );
}

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, ThumbsUp, Book, ChevronDown, ChevronUp, BarChart2, Users, Award } from 'lucide-react';

const ProfessorCompare = ({ professors, onClose, onRemoveProfessor }) => {
  const [compactView, setCompactView] = useState(false);
  
  if (!professors || professors.length === 0) return null;

  return (
    <motion.div
      className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 rounded-t-2xl shadow-2xl border-t border-indigo-200 dark:border-indigo-800 max-h-[85vh] overflow-hidden"
      initial={{ y: 500 }}
      animate={{ y: 0 }}
      exit={{ y: 500 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      {/* Header */}
      <div className="container mx-auto px-4 py-4 sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 z-10">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div className="bg-indigo-100 dark:bg-indigo-800 text-indigo-800 dark:text-indigo-200 w-8 h-8 rounded-full flex items-center justify-center mr-2">
              <span className="font-bold">{professors.length}</span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white">
              Professor Comparison
            </h2>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setCompactView(!compactView)}
              className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              title={compactView ? "Expand view" : "Compact view"}
            >
              {compactView ? 
                <ChevronDown className="w-5 h-5 text-gray-600 dark:text-gray-400" /> : 
                <ChevronUp className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              }
            </button>
            <button 
              onClick={onClose}
              className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              title="Close comparison"
            >
              <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Comparison content */}
      <div className="overflow-y-auto max-h-[calc(85vh-70px)]">
        <div className="container mx-auto px-4 pb-6">
          {/* Mobile view (stacked cards) */}
          <div className="md:hidden">
            {professors.map((professor) => (
              <div 
                key={professor.id}
                className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 relative"
              >
                <button 
                  onClick={() => onRemoveProfessor(professor.id)}
                  className="absolute top-3 right-3 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400"
                >
                  <X className="w-4 h-4" />
                </button>
                
                <div className="mb-3">
                  <h3 className="font-bold text-lg text-indigo-700 dark:text-indigo-400">
                    {professor.metadata.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {professor.metadata.department}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  {/* Rating */}
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center mb-1 text-gray-500 dark:text-gray-400 text-sm">
                      <Star className="text-yellow-500 mr-1 w-4 h-4" />
                      <span>Rating</span>
                    </div>
                    <div className="font-bold text-xl text-center mt-1">
                      <RatingValue rating={professor.metadata.overallRating} />
                    </div>
                  </div>
                  
                  {/* Difficulty */}
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center mb-1 text-gray-500 dark:text-gray-400 text-sm">
                      <Book className="text-blue-500 mr-1 w-4 h-4" />
                      <span>Difficulty</span>
                    </div>
                    <div className="font-bold text-xl text-center mt-1">
                      <DifficultyValue difficulty={parseFloat(professor.metadata.difficulty) || 0} />
                    </div>
                  </div>
                  
                  {/* Would Take Again */}
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center mb-1 text-gray-500 dark:text-gray-400 text-sm">
                      <ThumbsUp className="text-green-500 mr-1 w-4 h-4" />
                      <span>Would Take Again</span>
                    </div>
                    <div className="font-bold text-xl text-center mt-1">
                      <TakeAgainValue value={professor.metadata.wouldTakeAgain} />
                    </div>
                  </div>
                  
                  {/* Number of Ratings */}
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center mb-1 text-gray-500 dark:text-gray-400 text-sm">
                      <Users className="text-purple-500 mr-1 w-4 h-4" />
                      <span>Ratings</span>
                    </div>
                    <div className="font-bold text-xl text-center mt-1">
                      {professor.metadata.numberOfRatings || 0}
                    </div>
                  </div>
                </div>
                
                {/* Tags */}
                <div className="mt-3">
                  <div className="text-gray-500 dark:text-gray-400 text-sm mb-2 flex items-center">
                    <Award className="text-indigo-500 mr-1 w-4 h-4" />
                    <span>Top Tags</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {professor.metadata.topTags.length > 0 ? 
                      professor.metadata.topTags.slice(0, 3).map((tag, index) => (
                        <span 
                          key={index} 
                          className="bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-300 text-xs px-2 py-1 rounded-full"
                        >
                          {tag}
                        </span>
                      )) : (
                        <span className="text-gray-500 dark:text-gray-400 text-sm">No tags available</span>
                      )
                    }
                    {professor.metadata.topTags.length > 3 && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        +{professor.metadata.topTags.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Desktop view (table layout) */}
          <div className="hidden md:block overflow-x-auto pb-4 mt-4">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-left p-4 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-semibold border-b border-gray-200 dark:border-gray-700 min-w-[150px] rounded-tl-lg">
                    Criteria
                  </th>
                  {professors.map((professor, index) => (
                    <th 
                      key={professor.id} 
                      className={`p-4 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-white font-semibold border-b border-gray-200 dark:border-gray-700 min-w-[200px] relative ${
                        index === professors.length - 1 ? 'rounded-tr-lg' : ''
                      }`}
                    >
                      <div className="flex items-start">
                        <div className="flex-1 pr-8">
                          <div className="text-left font-bold text-indigo-700 dark:text-indigo-400">
                            {professor.metadata.name}
                          </div>
                          <div className="text-left text-sm text-gray-500 dark:text-gray-400">
                            {professor.metadata.department}
                          </div>
                        </div>
                        <button 
                          onClick={() => onRemoveProfessor(professor.id)}
                          className="absolute top-3 right-3 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Rating row */}
                <tr>
                  <td className="p-4 border-b border-gray-200 dark:border-gray-700 font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900">
                    <div className="flex items-center">
                      <Star className="text-yellow-500 mr-2 w-5 h-5" />
                      <span>Overall Rating</span>
                    </div>
                  </td>
                  {professors.map((professor) => (
                    <td 
                      key={professor.id} 
                      className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
                    >
                      <div className="flex flex-col items-center">
                        <div className="text-2xl font-bold">
                          <RatingValue rating={professor.metadata.overallRating} />
                        </div>
                        
                        {!compactView && (
                          <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                            <div 
                              className={`h-2.5 rounded-full ${getRatingColorClass(professor.metadata.overallRating)}`}
                              style={{ width: `${(professor.metadata.overallRating / 5) * 100}%` }}
                            ></div>
                          </div>
                        )}
                        
                        {!compactView && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {getRatingLabel(professor.metadata.overallRating)}
                          </div>
                        )}
                      </div>
                    </td>
                  ))}
                </tr>
                
                {/* Difficulty row */}
                <tr>
                  <td className="p-4 border-b border-gray-200 dark:border-gray-700 font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800">
                    <div className="flex items-center">
                      <Book className="text-blue-500 mr-2 w-5 h-5" />
                      <span>Difficulty</span>
                    </div>
                  </td>
                  {professors.map((professor) => {
                    const difficultyValue = parseFloat(professor.metadata.difficulty) || 0;
                    return (
                      <td 
                        key={professor.id} 
                        className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
                      >
                        <div className="flex flex-col items-center">
                          <div className="text-2xl font-bold">
                            <DifficultyValue difficulty={difficultyValue} />
                          </div>
                          
                          {!compactView && (
                            <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                              <div 
                                className={`h-2.5 rounded-full ${getDifficultyColorClass(difficultyValue)}`}
                                style={{ width: `${(difficultyValue / 5) * 100}%` }}
                              ></div>
                            </div>
                          )}
                          
                          {!compactView && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {getDifficultyLabel(difficultyValue)}
                            </div>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
                
                {/* Would Take Again row */}
                <tr>
                  <td className="p-4 border-b border-gray-200 dark:border-gray-700 font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900">
                    <div className="flex items-center">
                      <ThumbsUp className="text-green-500 mr-2 w-5 h-5" />
                      <span>Would Take Again</span>
                    </div>
                  </td>
                  {professors.map((professor) => {
                    const takeAgainValue = professor.metadata.wouldTakeAgain || "N/A";
                    const takeAgainPercent = parseInt(takeAgainValue.replace('%', ''), 10);
                    
                    return (
                      <td 
                        key={professor.id} 
                        className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
                      >
                        <div className="flex flex-col items-center">
                          <div className="text-2xl font-bold">
                            <TakeAgainValue value={takeAgainValue} />
                          </div>
                          
                          {!compactView && !isNaN(takeAgainPercent) && (
                            <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                              <div 
                                className={`h-2.5 rounded-full ${getTakeAgainColorClass(takeAgainPercent)}`}
                                style={{ width: `${takeAgainPercent}%` }}
                              ></div>
                            </div>
                          )}
                          
                          {!compactView && !isNaN(takeAgainPercent) && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {getTakeAgainLabel(takeAgainPercent)}
                            </div>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
                
                {/* Tags row */}
                <tr>
                  <td className="p-4 border-b border-gray-200 dark:border-gray-700 font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800">
                    <div className="flex items-center">
                      <Award className="text-purple-500 mr-2 w-5 h-5" />
                      <span>Top Tags</span>
                    </div>
                  </td>
                  {professors.map((professor) => (
                    <td 
                      key={professor.id} 
                      className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
                    >
                      <div className="flex flex-wrap gap-1 justify-center">
                        {professor.metadata.topTags.length > 0 ? 
                          professor.metadata.topTags.slice(0, compactView ? 2 : 4).map((tag, index) => (
                            <span 
                              key={index} 
                              className="bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-300 text-xs px-2 py-1 rounded-full"
                            >
                              {tag}
                            </span>
                          )) : (
                            <span className="text-gray-500 dark:text-gray-400 text-sm">No tags available</span>
                          )
                        }
                        {professor.metadata.topTags.length > (compactView ? 2 : 4) && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            +{professor.metadata.topTags.length - (compactView ? 2 : 4)} more
                          </span>
                        )}
                      </div>
                    </td>
                  ))}
                </tr>
                
                {/* Number of Ratings row */}
                <tr>
                  <td className="p-4 font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 rounded-bl-lg">
                    <div className="flex items-center">
                      <BarChart2 className="text-gray-500 mr-2 w-5 h-5" />
                      <span>Number of Ratings</span>
                    </div>
                  </td>
                  {professors.map((professor, index) => (
                    <td 
                      key={professor.id} 
                      className={`p-4 bg-white dark:bg-gray-900 ${
                        index === professors.length - 1 ? 'rounded-br-lg' : ''
                      }`}
                    >
                      <div className="flex flex-col items-center">
                        <div className="font-bold text-xl">
                          {professor.metadata.numberOfRatings || 0}
                        </div>
                        {!compactView && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {parseInt(professor.metadata.numberOfRatings, 10) > 20 
                              ? "High Sample Size" 
                              : "Limited Sample Size"}
                          </div>
                        )}
                      </div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
          
          {/* Close button */}
          <div className="mt-6 flex justify-center">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors shadow-md"
            >
              Close Comparison
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Helper components for formatting and visual consistency
const RatingValue = ({ rating }) => {
  let colorClass = "text-red-500";
  
  if (rating >= 4.5) colorClass = "text-green-600 dark:text-green-500";
  else if (rating >= 4.0) colorClass = "text-green-500 dark:text-green-400";
  else if (rating >= 3.5) colorClass = "text-yellow-500";
  else if (rating >= 3.0) colorClass = "text-yellow-600 dark:text-yellow-500";
  else if (rating >= 2.5) colorClass = "text-orange-500";
  
  return (
    <span className={colorClass}>
      {typeof rating === 'number' ? rating.toFixed(1) : 'N/A'}
    </span>
  );
};

const DifficultyValue = ({ difficulty }) => {
  let colorClass = "text-green-600 dark:text-green-500";
  
  if (difficulty >= 4.5) colorClass = "text-red-500";
  else if (difficulty >= 4.0) colorClass = "text-red-400";
  else if (difficulty >= 3.5) colorClass = "text-orange-500";
  else if (difficulty >= 3.0) colorClass = "text-yellow-500";
  else if (difficulty >= 2.5) colorClass = "text-green-500";
  
  return (
    <span className={colorClass}>
      {difficulty ? difficulty.toFixed(1) : 'N/A'}
    </span>
  );
};

const TakeAgainValue = ({ value }) => {
  if (!value || value === "N/A") return <span className="text-gray-500">N/A</span>;
  
  const percentage = parseInt(value.replace('%', ''), 10);
  let colorClass = "text-red-500";
  
  if (isNaN(percentage)) return <span className="text-gray-500">{value}</span>;
  
  if (percentage >= 80) colorClass = "text-green-600 dark:text-green-500";
  else if (percentage >= 60) colorClass = "text-green-500 dark:text-green-400";
  else if (percentage >= 40) colorClass = "text-yellow-500";
  else if (percentage >= 20) colorClass = "text-orange-500";
  
  return <span className={colorClass}>{value}</span>;
};

// Helper functions for visual styling
const getRatingColorClass = (rating) => {
  if (rating >= 4.5) return "bg-green-600";
  if (rating >= 4.0) return "bg-green-500";
  if (rating >= 3.5) return "bg-yellow-500";
  if (rating >= 3.0) return "bg-yellow-600";
  if (rating >= 2.5) return "bg-orange-500";
  return "bg-red-500";
};

const getDifficultyColorClass = (difficulty) => {
  if (difficulty >= 4.5) return "bg-red-500";
  if (difficulty >= 4.0) return "bg-red-400";
  if (difficulty >= 3.5) return "bg-orange-500";
  if (difficulty >= 3.0) return "bg-yellow-500";
  if (difficulty >= 2.5) return "bg-green-500";
  return "bg-green-600";
};

const getTakeAgainColorClass = (percentage) => {
  if (percentage >= 80) return "bg-green-600";
  if (percentage >= 60) return "bg-green-500";
  if (percentage >= 40) return "bg-yellow-500";
  if (percentage >= 20) return "bg-orange-500";
  return "bg-red-500";
};

// Helper functions for descriptive labels
const getRatingLabel = (rating) => {
  if (rating >= 4.5) return "Excellent";
  if (rating >= 4.0) return "Very Good";
  if (rating >= 3.5) return "Good";
  if (rating >= 3.0) return "Average";
  if (rating >= 2.5) return "Below Average";
  return "Poor";
};

const getDifficultyLabel = (difficulty) => {
  if (difficulty >= 4.5) return "Very Difficult";
  if (difficulty >= 4.0) return "Difficult";
  if (difficulty >= 3.0) return "Moderate";
  if (difficulty >= 2.0) return "Easy";
  return "Very Easy";
};

const getTakeAgainLabel = (percentage) => {
  if (percentage >= 80) return "Highly Recommended";
  if (percentage >= 60) return "Recommended";
  if (percentage >= 40) return "Mixed";
  if (percentage >= 20) return "Not Recommended";
  return "Avoid";
};

export default ProfessorCompare; 
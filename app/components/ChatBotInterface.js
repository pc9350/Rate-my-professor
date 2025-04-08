import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Link as LinkIcon, Loader, RefreshCw, X } from 'lucide-react';

// Skeleton loader component for the answer section
const AnswerSkeleton = () => (
  <div className="mt-6 p-6 bg-white bg-opacity-10 backdrop-blur-md rounded-xl border border-indigo-500/30 shadow-lg">
    <div className="h-6 w-1/3 bg-white bg-opacity-20 rounded-md mb-4 animate-pulse"></div>
    <div className="h-4 w-full bg-white bg-opacity-20 rounded-md mb-2 animate-pulse"></div>
    <div className="h-4 w-5/6 bg-white bg-opacity-20 rounded-md mb-2 animate-pulse"></div>
    <div className="h-4 w-full bg-white bg-opacity-20 rounded-md mb-2 animate-pulse"></div>
    <div className="h-4 w-4/6 bg-white bg-opacity-20 rounded-md animate-pulse"></div>
  </div>
);

export default function ChatbotInterface({
  professorId,
  setProfessorId,
  userQuery,
  setUserQuery,
  handleSubmit,
  handleQuery,
  isLoading,
  isQuerying,
  error,
  answer
}) {
  // Function to handle retrying the last action
  const handleRetry = () => {
    if (userQuery.trim()) {
      // If there's a query, retry the query
      handleQuery();
    } else if (professorId.trim()) {
      // If there's a professor ID but no query, retry the professor data fetch
      handleSubmit();
    }
  };

  // Function to clear the error
  const clearError = () => {
    if (typeof window !== 'undefined') {
      // Create a dismissible error toast here if you add a toast library
      // For now, we'll just use the existing error display with a close button
    }
  };

  return (
    <motion.div 
      className="w-full max-w-md bg-white/10 backdrop-blur-md p-8 rounded-2xl shadow-xl border border-white/20"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-3xl font-bold text-white mb-6 flex items-center">
        <span className="bg-gradient-to-r from-purple-400 to-indigo-500 bg-clip-text text-transparent">
          Professor Insights
        </span>
        <MessageSquare className="ml-2 h-6 w-6 text-indigo-300" />
      </h2>
      
      <div className="space-y-6">
        <div className="relative">
          <label htmlFor="professorUrl" className="block text-white mb-2 flex justify-between">
            <span className="font-medium flex items-center">
              <LinkIcon className="w-4 h-4 mr-2 text-indigo-300" />
              Professor URL or ID
            </span>
            <span className="text-indigo-300 text-sm px-2 py-1 bg-indigo-900/40 rounded-full">Required for new professors</span>
          </label>
          <input
            type="text"
            id="professorUrl"
            value={professorId}
            onChange={(e) => setProfessorId(e.target.value)}
            className="w-full px-4 py-3 bg-white/10 text-white rounded-lg border border-indigo-500/30 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
            placeholder="E.g., https://www.ratemyprofessors.com/professor/2364027"
          />
          <p className="text-xs text-indigo-300 mt-2 italic">
            Paste a link from RateMyProfessors.com or just the ID number
          </p>
        </div>
        
        <motion.button
          onClick={handleSubmit}
          className={`w-full py-3.5 text-white text-lg rounded-lg shadow-lg transition duration-300 flex items-center justify-center ${
            isLoading 
              ? 'bg-indigo-700 cursor-wait' 
              : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700'
          }`}
          whileHover={{ scale: isLoading ? 1 : 1.03 }}
          whileTap={{ scale: isLoading ? 1 : 0.97 }}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader className="animate-spin mr-3 h-5 w-5 text-white" />
              Adding Professor...
            </>
          ) : (
            <>
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
              </svg>
              Add Professor
            </>
          )}
        </motion.button>
        
        <div className="border-t border-indigo-700/50 my-6 pt-6">
          <label htmlFor="userQuery" className="block text-white mb-2 flex justify-between">
            <span className="font-medium flex items-center">
              <MessageSquare className="w-4 h-4 mr-2 text-indigo-300" />
              Your Question
            </span>
            <span className="text-indigo-300 text-sm px-2 py-1 bg-indigo-900/40 rounded-full">
              {answer ? 'Ask follow-up' : 'Ask about professor'}
            </span>
          </label>
          <textarea
            id="userQuery"
            value={userQuery}
            onChange={(e) => setUserQuery(e.target.value)}
            className="w-full px-4 py-3 bg-white/10 text-white rounded-lg border border-indigo-500/30 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
            placeholder="E.g., What's this professor's teaching style? What do students say about their exams?"
            rows="3"
          ></textarea>
          <p className="text-xs text-indigo-300 mt-2 italic">
            {answer 
              ? 'Your previous question was answered. You can ask another one.' 
              : 'Ask anything about the professor based on student ratings'}
          </p>
        </div>
        
        <motion.button
          onClick={handleQuery}
          className={`w-full py-3.5 text-white text-lg rounded-lg shadow-lg transition duration-300 flex items-center justify-center ${
            isQuerying 
              ? 'bg-indigo-700 cursor-wait' 
              : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700'
          }`}
          whileHover={{ scale: isQuerying ? 1 : 1.03 }}
          whileTap={{ scale: isQuerying ? 1 : 0.97 }}
          disabled={isQuerying}
        >
          {isQuerying ? (
            <>
              <Loader className="animate-spin mr-3 h-5 w-5 text-white" />
              Analyzing Professor Data...
            </>
          ) : 'Ask Question'}
        </motion.button>
      </div>
      
      <AnimatePresence>
        {error && (
          <motion.div 
            className="mt-6 p-4 bg-red-900/30 backdrop-blur-sm rounded-xl border border-red-500/50 shadow-lg relative"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <button 
              className="absolute right-3 top-3 text-red-300 hover:text-red-100 transition-colors"
              onClick={clearError}
            >
              <X size={18} />
            </button>
            
            <p className="text-red-100 pr-6">{error}</p>
            
            {error.includes("No relevant information") && (
              <p className="text-red-300 text-sm mt-2 italic">
                Try scraping a professor's data first using the URL from RateMyProfessors
              </p>
            )}
            
            <div className="mt-4 flex justify-end">
              <motion.button
                onClick={handleRetry}
                className="px-4 py-2 bg-red-700 hover:bg-red-600 text-white text-sm rounded-lg shadow-md transition duration-200 flex items-center"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <RefreshCw size={14} className="mr-2" />
                Try Again
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {isQuerying && !answer && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.5 }}
          >
            <AnswerSkeleton />
          </motion.div>
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {answer && (
          <motion.div 
            className="mt-6 p-6 bg-white/10 backdrop-blur-md rounded-xl border border-indigo-500/30 shadow-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.5 }}
          >
            <h3 className="text-xl font-bold text-white mb-4 pb-2 border-b border-indigo-500/30">Professor Insights</h3>
            <div className="text-indigo-100 leading-relaxed whitespace-pre-line">
              {answer.split('\n').map((paragraph, index) => (
                <p key={index} className={index !== 0 ? 'mt-3' : ''}>
                  {paragraph}
                </p>
              ))}
            </div>
            
            <div className="mt-6 pt-4 border-t border-indigo-500/30 text-sm text-indigo-300 italic">
              Data based on student reviews from RateMyProfessors
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
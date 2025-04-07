import React from 'react';
import { motion } from 'framer-motion';

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

  return (
    <motion.div 
      className="w-full max-w-md bg-white bg-opacity-10 backdrop-blur-md p-6 rounded-lg shadow-lg"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-2xl font-bold text-white mb-4">Professor Insights</h2>
      
      <div className="space-y-4">
        <div>
          <label htmlFor="professorUrl" className="block text-white mb-2 flex justify-between">
            <span>Professor URL or ID</span>
            <span className="text-indigo-300 text-sm">Required for new professors</span>
          </label>
          <input
            type="text"
            id="professorUrl"
            value={professorId}
            onChange={(e) => setProfessorId(e.target.value)}
            className="w-full px-3 py-2 bg-white bg-opacity-20 text-white rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="E.g., https://www.ratemyprofessors.com/professor/2364027"
          />
          <p className="text-xs text-indigo-200 mt-1">
            Paste a link from RateMyProfessors.com or just the ID number
          </p>
        </div>
        
        <motion.button
          onClick={handleSubmit}
          className={`w-full py-3 text-white text-lg rounded-lg shadow-lg transition duration-300 flex items-center justify-center ${
            isLoading ? 'bg-indigo-800 cursor-wait' : 'bg-indigo-600 hover:bg-indigo-700'
          }`}
          whileHover={{ scale: isLoading ? 1 : 1.05 }}
          whileTap={{ scale: isLoading ? 1 : 0.95 }}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Scraping Data...
            </>
          ) : 'Scrape Professor Data'}
        </motion.button>
        
        <div className="border-t border-indigo-700 my-4 pt-4">
          <label htmlFor="userQuery" className="block text-white mb-2 flex justify-between">
            <span>Your Question</span>
            <span className="text-indigo-300 text-sm">{answer ? 'Ask another question' : 'Ask about a professor'}</span>
          </label>
          <textarea
            id="userQuery"
            value={userQuery}
            onChange={(e) => setUserQuery(e.target.value)}
            className="w-full px-3 py-2 bg-white bg-opacity-20 text-white rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="E.g., What's this professor's teaching style? What do students say about their exams?"
            rows="3"
          ></textarea>
          <p className="text-xs text-indigo-200 mt-1">
            {answer ? 'Your previous question was answered. You can ask another one.' : 'Ask anything about the professor based on student ratings'}
          </p>
        </div>
        
        <motion.button
          onClick={handleQuery}
          className={`w-full py-3 text-white text-lg rounded-lg shadow-lg transition duration-300 flex items-center justify-center ${
            isQuerying ? 'bg-indigo-800 cursor-wait' : 'bg-indigo-600 hover:bg-indigo-700'
          }`}
          whileHover={{ scale: isQuerying ? 1 : 1.05 }}
          whileTap={{ scale: isQuerying ? 1 : 0.95 }}
          disabled={isQuerying}
        >
          {isQuerying ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating Answer...
            </>
          ) : 'Ask Question'}
        </motion.button>
      </div>
      
      {error && (
        <motion.div 
          className="mt-4 p-3 bg-red-500 bg-opacity-25 rounded-md border border-red-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <p className="text-red-100">{error}</p>
          {error.includes("No relevant information") && (
            <p className="text-red-200 text-sm mt-1">Try scraping a professor's data first using the URL from RateMyProfessors</p>
          )}
          
          {/* Add retry button */}
          <div className="mt-3 flex justify-end">
            <motion.button
              onClick={handleRetry}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-md shadow-md transition duration-200"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Try Again
            </motion.button>
          </div>
        </motion.div>
      )}
      
      {answer && (
        <motion.div 
          className="mt-6 p-4 bg-white bg-opacity-20 rounded-lg border border-indigo-500 shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h3 className="text-xl font-bold text-white mb-2">Answer:</h3>
          <p className="text-indigo-100 leading-relaxed whitespace-pre-line">{answer}</p>
        </motion.div>
      )}
    </motion.div>
  );
}
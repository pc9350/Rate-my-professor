// app/api/shared-memory.js
// This module provides a simple in-memory storage that can be shared across API routes

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
  }
};

/**
 * Simple in-memory vector store for fallback when Pinecone is unavailable
 */
const inMemoryVectorStore = {
  vectors: [],
  
  /**
   * Add a single vector to the store
   */
  addVector: function(id, vector, metadata) {
    this.vectors.push({ id, vector, metadata });
    logger.log(`Added vector ${id} to in-memory store, now ${this.vectors.length} vectors`);
    return { id };
  },
  
  /**
   * Add multiple vectors at once (mimics Pinecone upsert)
   */
  upsert: function(vectors) {
    for (const item of vectors) {
      this.addVector(item.id, item.values, item.metadata);
    }
    return { upsertedCount: vectors.length };
  },
  
  /**
   * Search for similar vectors using cosine similarity
   */
  search: function(vector, topK) {
    // Simple cosine similarity function
    function cosineSimilarity(a, b) {
      let dotProduct = 0;
      let normA = 0;
      let normB = 0;
      for (let i = 0; i < a.length; i++) {
        dotProduct += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
      }
      normA = Math.sqrt(normA);
      normB = Math.sqrt(normB);
      return dotProduct / (normA * normB);
    }
    
    // Calculate similarities and sort
    const results = this.vectors.map(item => ({
      id: item.id,
      score: cosineSimilarity(vector, item.vector),
      metadata: item.metadata
    }));
    
    // Sort by score (descending) and take top K
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, topK || 5);
  },
  
  /**
   * Get stats about the in-memory store
   */
  describeIndexStats: function() {
    return {
      namespaces: {
        "": {
          vectorCount: this.vectors.length
        }
      },
      dimension: this.vectors.length > 0 ? this.vectors[0].vector.length : null,
      totalVectorCount: this.vectors.length
    };
  }
};

/**
 * Enhanced in-memory session store for conversation history with metadata
 */
const sessionStore = {
  // Main storage for session data
  sessions: new Map(),
  // Additional metadata storage
  metadata: new Map(),
  
  // Get conversation history for a session
  get: function(sessionId) {
    return this.sessions.get(sessionId) || [];
  },
  
  // Set conversation history for a session
  set: function(sessionId, data) {
    this.sessions.set(sessionId, data);
    return true;
  },
  
  // Delete a session
  delete: function(sessionId) {
    const deleted = this.sessions.delete(sessionId);
    this.metadata.delete(sessionId);
    return deleted;
  },
  
  // Clear all sessions
  clear: function() {
    this.sessions.clear();
    this.metadata.clear();
  },
  
  // Get metadata for a session
  getMetadata: function(sessionId) {
    return this.metadata.get(sessionId) || {};
  },
  
  // Set metadata for a session
  setMetadata: function(sessionId, data) {
    this.metadata.set(sessionId, data);
    return true;
  },
  
  // Get all session IDs
  keys: function() {
    return Array.from(this.sessions.keys());
  },
  
  // Get session count
  size: function() {
    return this.sessions.size;
  }
};

module.exports = {
  inMemoryVectorStore,
  sessionStore
}; 
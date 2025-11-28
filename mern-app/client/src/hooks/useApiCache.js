import { useState, useCallback, useRef } from 'react';

/**
 * Custom hook for API response caching with TTL (Time To Live)
 * Implements in-memory LRU cache for better performance
 */

class LRUCache {
  constructor(maxSize = 50) {
    this.maxSize = maxSize;
    this.cache = new Map();
  }

  get(key) {
    if (!this.cache.has(key)) return null;
    
    const item = this.cache.get(key);
    
    // Check if expired
    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, item);
    
    return item.data;
  }

  set(key, data, ttl = 300000) { // Default 5 minutes TTL
    // Remove oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, {
      data,
      expiresAt: ttl ? Date.now() + ttl : null,
    });
  }

  invalidate(keyPattern) {
    if (typeof keyPattern === 'string') {
      this.cache.delete(keyPattern);
    } else if (keyPattern instanceof RegExp) {
      // Remove all keys matching pattern
      for (const key of this.cache.keys()) {
        if (keyPattern.test(key)) {
          this.cache.delete(key);
        }
      }
    }
  }

  clear() {
    this.cache.clear();
  }
}

// Global cache instance
const globalCache = new LRUCache(100);

/**
 * Hook for cached API calls
 * @param {Function} fetchFn - Async function to fetch data
 * @param {Object} options - Cache options
 * @returns {Object} - { data, loading, error, refetch, invalidateCache }
 */
export const useApiCache = (cacheKey, fetchFn, options = {}) => {
  const {
    ttl = 300000, // 5 minutes default
    enabled = true,
    onSuccess,
    onError,
  } = options;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const fetchRef = useRef(null);

  const fetchData = useCallback(async (forceRefresh = false) => {
    if (!enabled) return;

    // Check cache first
    if (!forceRefresh) {
      const cachedData = globalCache.get(cacheKey);
      if (cachedData) {
        setData(cachedData);
        setLoading(false);
        return cachedData;
      }
    }

    // Prevent duplicate requests
    if (fetchRef.current) {
      return fetchRef.current;
    }

    setLoading(true);
    setError(null);

    const fetchPromise = (async () => {
      try {
        const result = await fetchFn();
        globalCache.set(cacheKey, result, ttl);
        setData(result);
        setError(null);
        
        if (onSuccess) {
          onSuccess(result);
        }
        
        return result;
      } catch (err) {
        const errorMessage = err.response?.data?.message || err.message || 'An error occurred';
        setError(errorMessage);
        
        if (onError) {
          onError(errorMessage);
        }
        
        throw err;
      } finally {
        setLoading(false);
        fetchRef.current = null;
      }
    })();

    fetchRef.current = fetchPromise;
    return fetchPromise;
  }, [cacheKey, fetchFn, ttl, enabled, onSuccess, onError]);

  const invalidateCache = useCallback((pattern) => {
    if (pattern) {
      globalCache.invalidate(pattern);
    } else {
      globalCache.invalidate(cacheKey);
    }
  }, [cacheKey]);

  const refetch = useCallback(() => {
    return fetchData(true);
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch,
    invalidateCache,
    fetch: fetchData,
  };
};

/**
 * Hook for automatic data fetching on mount
 */
export const useApiQuery = (cacheKey, fetchFn, options = {}) => {
  const result = useApiCache(cacheKey, fetchFn, options);
  
  // Auto-fetch on mount
  useState(() => {
    result.fetch();
  });

  return result;
};

/**
 * Clear all cache
 */
export const clearAllCache = () => {
  globalCache.clear();
};

export default useApiCache;

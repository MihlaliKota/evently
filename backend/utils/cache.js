const NodeCache = require('node-cache');

// Create cache with default TTL of 5 minutes and check period of 10 minutes
const cache = new NodeCache({ stdTTL: 300, checkperiod: 600 });

module.exports = {
  // Get cached value
  get(key) {
    return cache.get(key);
  },
  
  // Set cache with optional TTL in seconds
  set(key, value, ttl = 300) {
    return cache.set(key, value, ttl);
  },
  
  // Delete cache entry
  del(key) {
    return cache.del(key);
  },
  
  // Delete multiple cache entries using a pattern
  delPattern(pattern) {
    const keys = cache.keys();
    const regex = new RegExp(pattern);
    const matchedKeys = keys.filter(key => regex.test(key));
    return cache.del(matchedKeys);
  },
  
  // Flush entire cache
  flush() {
    return cache.flushAll();
  }
};
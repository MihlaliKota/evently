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
  invalidateByPrefix(prefix) {
    const keysToDelete = [];
    for (const key of cache.keys()) {
      if (key.startsWith(prefix)) keysToDelete.push(key);
    }
    return cache.del(keysToDelete);
  },

  // Flush entire cache
  flush() {
    return cache.flushAll();
  }
};
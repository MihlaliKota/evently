const pool = require('../config/database');
const cache = require('../utils/cache');

const dashboardModel = {
  // Get dashboard stats
  async getStats() {
    const cacheKey = 'dashboard:stats';
    const cachedStats = cache.get(cacheKey);
    
    if (cachedStats) {
      return cachedStats;
    }
    
    const [stats] = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM events) AS totalEvents,
        (SELECT COUNT(*) FROM events WHERE event_date >= CURDATE()) AS upcomingEvents,
        (SELECT COUNT(*) FROM events WHERE event_date < CURDATE()) AS completedEvents
    `);
    
    // Cache for 5 minutes
    cache.set(cacheKey, stats[0], 5 * 60);
    
    return stats[0];
  }
};

module.exports = dashboardModel;
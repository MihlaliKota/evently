const pool = require('../config/database');
const cache = require('../utils/cache');

const categoryModel = {
  // Get all categories
  async getAll() {
    const cacheKey = 'categories:all';
    const cachedCategories = cache.get(cacheKey);
    
    if (cachedCategories) {
      return cachedCategories;
    }
    
    const [categories] = await pool.query('SELECT * FROM eventcategories');
    
    // Cache for 1 hour (categories rarely change)
    cache.set(cacheKey, categories, 60 * 60);
    
    return categories;
  }
};

module.exports = categoryModel;
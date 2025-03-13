const pool = require('../config/database');
const cache = require('../utils/cache');

const reviewModel = {
  // Get reviews for an event
  async getEventReviews(eventId) {
    const cacheKey = `event:${eventId}:reviews`;
    const cachedReviews = cache.get(cacheKey);
    
    if (cachedReviews) {
      return cachedReviews;
    }
    
    const [reviews] = await pool.query(`
      SELECT r.*, u.username 
      FROM reviews r
      JOIN users u ON r.user_id = u.user_id
      WHERE r.event_id = ?
      ORDER BY r.created_at DESC
    `, [eventId]);
    
    // Cache for 2 minutes
    cache.set(cacheKey, reviews, 2 * 60);
    return reviews;
  },
  
  // Create a review
  async create(reviewData) {
    const { event_id, user_id, review_text, rating } = reviewData;
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Check if event exists
      const [eventCheck] = await connection.query(
        'SELECT * FROM events WHERE event_id = ?',
        [event_id]
      );
      
      if (eventCheck.length === 0) {
        await connection.rollback();
        return { error: 'Event not found', status: 404 };
      }
      
      // Check if user already reviewed this event
      const [existingReview] = await connection.query(
        'SELECT * FROM reviews WHERE event_id = ? AND user_id = ?',
        [event_id, user_id]
      );
      
      if (existingReview.length > 0) {
        await connection.rollback();
        return { error: 'You have already reviewed this event', status: 409 };
      }
      
      // Create the review
      const [result] = await connection.query(
        'INSERT INTO reviews (event_id, user_id, review_text, rating, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())',
        [event_id, user_id, review_text, rating]
      );
      
      // Get the created review with username
      const [newReview] = await connection.query(
        'SELECT r.*, u.username FROM reviews r JOIN users u ON r.user_id = u.user_id WHERE r.review_id = ?',
        [result.insertId]
      );
      
      await connection.commit();
      
      // Invalidate caches
      cache.del(`event:${event_id}:reviews`);
      cache.delPattern(`reviews:*`);
      
      return newReview[0];
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },
  
  // Update a review
  async update(reviewId, reviewData) {
    const { rating, review_text } = reviewData;
    
    const updateFields = [];
    const updateValues = [];
    
    if (review_text !== undefined) {
      updateFields.push('review_text = ?');
      updateValues.push(review_text);
    }
    
    if (rating !== undefined) {
      updateFields.push('rating = ?');
      updateValues.push(rating);
    }
    
    updateFields.push('updated_at = NOW()');
    
    if (updateFields.length === 1) {
      return { error: 'No fields to update', status: 400 };
    }
    
    updateValues.push(reviewId);
    
    const [result] = await pool.query(
      `UPDATE reviews SET ${updateFields.join(', ')} WHERE review_id = ?`,
      updateValues
    );
    
    if (result.affectedRows === 0) {
      return null;
    }
    
    // Get the updated review
    const [reviews] = await pool.query(
      'SELECT r.*, u.username FROM reviews r JOIN users u ON r.user_id = u.user_id WHERE r.review_id = ?',
      [reviewId]
    );
    
    if (reviews.length === 0) {
      return null;
    }
    
    // Invalidate caches
    const review = reviews[0];
    cache.del(`event:${review.event_id}:reviews`);
    cache.delPattern(`reviews:*`);
    
    return review;
  },
  
  // Delete a review
  async delete(reviewId) {
    // Get the review to find the event_id for cache invalidation
    const [reviews] = await pool.query(
      'SELECT * FROM reviews WHERE review_id = ?',
      [reviewId]
    );
    
    if (reviews.length === 0) {
      return false;
    }
    
    const eventId = reviews[0].event_id;
    
    const [result] = await pool.query(
      'DELETE FROM reviews WHERE review_id = ?',
      [reviewId]
    );
    
    if (result.affectedRows > 0) {
      // Invalidate caches
      cache.del(`event:${eventId}:reviews`);
      cache.delPattern(`reviews:*`);
      return true;
    }
    
    return false;
  },
  
  // Get all reviews with filtering
  async getAll(options = {}) {
    const { event_id, user_id, min_rating, max_rating, sort_by, sort_order, page = 1, limit = 10 } = options;
    
    const conditions = [];
    const params = [];
    
    if (event_id) {
      conditions.push('r.event_id = ?');
      params.push(event_id);
    }
    
    if (user_id) {
      conditions.push('r.user_id = ?');
      params.push(user_id);
    }
    
    if (min_rating) {
      conditions.push('r.rating >= ?');
      params.push(min_rating);
    }
    
    if (max_rating) {
      conditions.push('r.rating <= ?');
      params.push(max_rating);
    }
    
    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    
    // Add sorting
    const validSortFields = ['created_at', 'rating', 'event_id', 'user_id'];
    const validSortOrders = ['asc', 'desc'];
    
    let orderBy = ' ORDER BY r.created_at DESC';
    
    if (sort_by && validSortFields.includes(sort_by)) {
      const direction = sort_order && validSortOrders.includes(sort_order.toLowerCase())
        ? sort_order.toUpperCase()
        : 'DESC';
      orderBy = ` ORDER BY r.${sort_by} ${direction}`;
    }
    
    const offset = (page - 1) * limit;
    
    // Get total count
    const [countResult] = await pool.query(`
      SELECT COUNT(*) AS total 
      FROM reviews r
      JOIN users u ON r.user_id = u.user_id
      JOIN events e ON r.event_id = e.event_id
      ${whereClause}
    `, params);
    
    const total = countResult[0].total;
    
    // Get reviews with pagination
    const [reviews] = await pool.query(`
      SELECT r.*, u.username, e.name as event_name
      FROM reviews r
      JOIN users u ON r.user_id = u.user_id
      JOIN events e ON r.event_id = e.event_id
      ${whereClause}
      ${orderBy}
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), offset]);
    
    return {
      reviews,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    };
  },
  
  // Get review analytics
  async getAnalytics(eventId) {
    const cacheKey = eventId ? `reviews:analytics:${eventId}` : 'reviews:analytics';
    const cachedAnalytics = cache.get(cacheKey);
    
    if (cachedAnalytics) {
      return cachedAnalytics;
    }
    
    let query = `
      SELECT 
        COUNT(*) as total_reviews,
        AVG(rating) as average_rating,
        COUNT(CASE WHEN rating = 5 THEN 1 END) as five_star,
        COUNT(CASE WHEN rating = 4 THEN 1 END) as four_star,
        COUNT(CASE WHEN rating = 3 THEN 1 END) as three_star,
        COUNT(CASE WHEN rating = 2 THEN 1 END) as two_star,
        COUNT(CASE WHEN rating = 1 THEN 1 END) as one_star,
        COUNT(CASE WHEN rating >= 4 THEN 1 END) as positive_reviews,
        COUNT(CASE WHEN rating <= 2 THEN 1 END) as negative_reviews
      FROM reviews
    `;
    
    const params = [];
    
    if (eventId) {
      query += ' WHERE event_id = ?';
      params.push(eventId);
    }
    
    const [analytics] = await pool.query(query, params);
    
    let recentQuery = `
      SELECT r.*, u.username
      FROM reviews r
      JOIN users u ON r.user_id = u.user_id
    `;
    
    if (eventId) {
      recentQuery += ' WHERE r.event_id = ?';
    }
    
    recentQuery += ' ORDER BY r.created_at DESC LIMIT 5';
    
    const [recentReviews] = await pool.query(recentQuery, eventId ? [eventId] : []);
    
    const result = {
      analytics: analytics[0],
      recentReviews
    };
    
    // Cache for 5 minutes
    cache.set(cacheKey, result, 5 * 60);
    
    return result;
  }
};

module.exports = reviewModel;
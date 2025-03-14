const reviewModel = require('../models/reviewModel');
const { AppError } = require('../middleware/error');
const asyncHandler = require('../utils/asyncHandler');
const pool = require('../config/database');

const reviewController = {
  // Get all reviews
  getAllReviews: asyncHandler(async (req, res) => {
    const { event_id, user_id, min_rating, max_rating, sort_by, sort_order, page, limit } = req.query;
    
    const result = await reviewModel.getAll({
      event_id,
      user_id,
      min_rating,
      max_rating,
      sort_by,
      sort_order,
      page,
      limit
    });
    
    // Set pagination headers
    if (result.pagination) {
      res.set('X-Total-Count', result.pagination.total);
      res.set('X-Total-Pages', result.pagination.pages);
      res.set('X-Current-Page', result.pagination.page);
      res.set('X-Per-Page', result.pagination.limit);
    }
    
    res.status(200).json(result.reviews);
  }),
  
  // Update review
  updateReview: asyncHandler(async (req, res) => {
    const reviewId = req.params.reviewId;
    const userId = req.user.userId;
    const { review_text, rating } = req.body;
    
    if (rating !== undefined && (rating < 1 || rating > 5)) {
      throw new AppError('Rating must be between 1 and 5', 400);
    }
    
    // Get review to check ownership
    const [reviews] = await (await import('../config/database')).default.query(
      'SELECT * FROM reviews WHERE review_id = ?',
      [reviewId]
    );
    
    if (reviews.length === 0) {
      throw new AppError('Review not found', 404);
    }
    
    // Check if user owns the review or is admin
    if (reviews[0].user_id !== userId && req.user.role !== 'admin') {
      throw new AppError('You can only edit your own reviews', 403);
    }
    
    const result = await reviewModel.update(reviewId, { review_text, rating });
    
    if (!result) {
      throw new AppError('Review not found', 404);
    }
    
    if (result.error) {
      throw new AppError(result.error, result.status);
    }
    
    res.status(200).json(result);
  }),
  
  // Delete review
  deleteReview: asyncHandler(async (req, res) => {
    const reviewId = req.params.reviewId;
    const userId = req.user.userId;
    
    // Get review to check ownership
    const [reviews] = await pool.query(
      'SELECT * FROM reviews WHERE review_id = ?',
      [reviewId]
    );
    
    if (reviews.length === 0) {
      throw new AppError('Review not found', 404);
    }
    
    // Check if user owns the review or is admin
    if (reviews[0].user_id !== userId && req.user.role !== 'admin') {
      throw new AppError('You can only delete your own reviews', 403);
    }
    
    const deleted = await reviewModel.delete(reviewId);
    
    if (!deleted) {
      throw new AppError('Review not found', 404);
    }
    
    res.status(204).send();
  }),
  
  // Get review analytics
  getReviewAnalytics: asyncHandler(async (req, res) => {
    const { event_id } = req.query;
    const analytics = await reviewModel.getAnalytics(event_id);
    res.status(200).json(analytics);
  })
};

module.exports = reviewController;
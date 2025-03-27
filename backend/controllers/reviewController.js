const reviewModel = require('../models/reviewModel');
const { AppError } = require('../middleware/error');
const asyncHandler = require('../utils/asyncHandler');
const pool = require('../config/database');
const notificationModel = require('../models/notificationModel');

const reviewController = {
  // Get all reviews
  getAllReviews: asyncHandler(async (req, res) => {
    try {
      const { event_id, user_id, min_rating, max_rating, sort_by, sort_order, page = 1, limit = 3 } = req.query;

      // Convert query parameters to appropriate types
      const queryParams = {
        event_id: event_id ? parseInt(event_id) : undefined,
        user_id: user_id ? parseInt(user_id) : undefined,
        min_rating: min_rating ? parseFloat(min_rating) : undefined,
        max_rating: max_rating ? parseFloat(max_rating) : undefined,
        sort_by,
        sort_order,
        page: parseInt(page),
        limit: parseInt(limit)
      };

      const result = await reviewModel.getAll(queryParams);

      // Set pagination headers
      if (result.pagination) {
        res.set('X-Total-Count', result.pagination.total);
        res.set('X-Total-Pages', result.pagination.pages);
        res.set('X-Current-Page', result.pagination.page);
        res.set('X-Per-Page', result.pagination.limit);
      }

      res.status(200).json(result.reviews);
    } catch (error) {
      console.error("Error in getAllReviews:", error);
      throw new AppError(error.message || 'Failed to get reviews', 500);
    }
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
    const isAdmin = req.user.role === 'admin';

    // Get review to check ownership and get user ID for notification
    const [reviews] = await pool.query(
      'SELECT r.*, e.name as event_name FROM reviews r JOIN events e ON r.event_id = e.event_id WHERE r.review_id = ?',
      [reviewId]
    );

    if (reviews.length === 0) {
      throw new AppError('Review not found', 404);
    }

    // Check if user owns the review or is admin
    if (reviews[0].user_id !== userId && !isAdmin) {
      throw new AppError('You can only delete your own reviews', 403);
    }

    const deleted = await reviewModel.delete(reviewId);

    if (!deleted) {
      throw new AppError('Review not found', 404);
    }

    // If an admin deleted someone else's review, send a notification
    if (isAdmin && reviews[0].user_id !== userId) {
      try {
        await notificationModel.create({
          user_id: reviews[0].user_id,
          type: 'review_deleted',
          message: 'Your review was removed as it violated our guidelines.',
          related_id: reviews[0].event_id,
          additional_data: {
            event_name: reviews[0].event_name,
            review_id: reviewId,
            deleted_by: userId
          }
        });
        console.log(`Notification sent to user ${reviews[0].user_id} about deleted review`);
      } catch (error) {
        console.error('Error sending notification:', error);
        // Don't fail the request if notification fails
      }
    }

    res.status(204).send();
  }),

  // Approve review
  approveReview: asyncHandler(async (req, res) => {
    const reviewId = req.params.reviewId;

    // Only admins can approve reviews
    if (req.user.role !== 'admin') {
      throw new AppError('Only administrators can approve reviews', 403);
    }

    const updated = await reviewModel.updateStatus(reviewId, 'approved');

    if (!updated) {
      throw new AppError('Review not found', 404);
    }

    // Don't send notification for approval

    res.status(200).json({ message: 'Review approved successfully', status: 'approved' });
  }),

  // Reject review
  rejectReview: asyncHandler(async (req, res) => {
    const reviewId = req.params.reviewId;

    // Only admins can reject reviews
    if (req.user.role !== 'admin') {
      throw new AppError('Only administrators can reject reviews', 403);
    }

    // Get review details for notification
    const [reviews] = await pool.query(
      'SELECT r.*, e.name as event_name FROM reviews r JOIN events e ON r.event_id = e.event_id WHERE r.review_id = ?',
      [reviewId]
    );

    if (reviews.length === 0) {
      throw new AppError('Review not found', 404);
    }

    const updated = await reviewModel.updateStatus(reviewId, 'rejected');

    if (!updated) {
      throw new AppError('Review not found', 404);
    }

    // Send notification to the user
    try {
      await notificationModel.create({
        user_id: reviews[0].user_id,
        type: 'review_rejected',
        message: 'Your review was removed as it violated our guidelines.',
        related_id: reviews[0].event_id,
        additional_data: {
          event_name: reviews[0].event_name,
          review_id: reviewId,
          rejected_by: req.user.userId
        }
      });
      console.log(`Notification sent to user ${reviews[0].user_id} about rejected review`);
    } catch (error) {
      console.error('Error sending notification:', error);
      // Don't fail the request if notification fails
    }

    res.status(200).json({ message: 'Review rejected successfully', status: 'rejected' });
  }),

  // Get review analytics
  getReviewAnalytics: asyncHandler(async (req, res) => {
    const { event_id } = req.query;
    const analytics = await reviewModel.getAnalytics(event_id);
    res.status(200).json(analytics);
  })
};

module.exports = reviewController;
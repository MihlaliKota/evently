const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { authenticateJWT, authorizeRole } = require('../middleware/auth');

router.get('/', authenticateJWT, reviewController.getAllReviews);
router.put('/:reviewId', authenticateJWT, reviewController.updateReview);
router.delete('/:reviewId', authenticateJWT, reviewController.deleteReview);
router.get('/analytics', authenticateJWT, reviewController.getReviewAnalytics);

// Moderation routes (admin only)
router.put('/:reviewId/approve', authenticateJWT, authorizeRole(['admin']), reviewController.approveReview);
router.put('/:reviewId/reject', authenticateJWT, authorizeRole(['admin']), reviewController.rejectReview);

module.exports = router;
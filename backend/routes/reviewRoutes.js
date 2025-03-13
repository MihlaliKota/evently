const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { authenticateJWT } = require('../middleware/auth');

router.get('/', authenticateJWT, reviewController.getAllReviews);
router.put('/:reviewId', authenticateJWT, reviewController.updateReview);
router.delete('/:reviewId', authenticateJWT, reviewController.deleteReview);
router.get('/analytics', authenticateJWT, reviewController.getReviewAnalytics);

module.exports = router;
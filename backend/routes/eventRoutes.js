const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { authenticateJWT, authorizeRole } = require('../middleware/auth');
const uploadMiddleware = require('../middleware/upload');

// Specialized routes
router.get('/upcoming', eventController.getUpcomingEvents);
router.get('/past', eventController.getPastEvents);

// Public routes
router.get('/', eventController.getAllEvents);
router.get('/:eventId', eventController.getEvent);

// Protected routes with file upload support
router.post('/', authenticateJWT, authorizeRole(['admin']), uploadMiddleware.uploadEvent.single('image'), eventController.createEvent);
router.put('/:eventId', authenticateJWT, authorizeRole(['admin']), uploadMiddleware.uploadEvent.single('image'), eventController.updateEvent);
router.delete('/:eventId', authenticateJWT, authorizeRole(['admin']), eventController.deleteEvent);

// Event reviews
router.get('/:eventId/reviews', eventController.getEventReviews);
router.post('/:eventId/reviews', authenticateJWT, uploadMiddleware.uploadReview.single('image'), eventController.createReview);

module.exports = router;
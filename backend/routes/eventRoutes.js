const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { authenticateJWT, authorizeRole } = require('../middleware/auth');

// Public routes
router.get('/', eventController.getAllEvents);
router.get('/:eventId', eventController.getEvent);

// Protected routes
router.post('/', authenticateJWT, authorizeRole(['admin']), eventController.createEvent);
router.put('/:eventId', authenticateJWT, authorizeRole(['admin']), eventController.updateEvent);
router.delete('/:eventId', authenticateJWT, authorizeRole(['admin']), eventController.deleteEvent);

// Specialized routes
router.get('/upcoming', authenticateJWT, eventController.getUpcomingEvents);
router.get('/past', authenticateJWT, eventController.getPastEvents);

// Event reviews
router.get('/:eventId/reviews', authenticateJWT, eventController.getEventReviews);
router.post('/:eventId/reviews', authenticateJWT, eventController.createReview);

module.exports = router;
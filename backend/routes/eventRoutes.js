const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { authenticateJWT, authorizeRole } = require('../middleware/auth');
const { upload, reviewUpload } = require('../middleware/upload');

// Specialized routes
router.get('/upcoming', eventController.getUpcomingEvents);
router.get('/past', eventController.getPastEvents);

// Public routes
router.get('/', eventController.getAllEvents);
router.get('/:eventId', eventController.getEvent);

// Protected routes with file upload support
router.post('/', authenticateJWT, authorizeRole(['admin']), upload.single('image'), eventController.createEvent);
router.put('/:eventId', authenticateJWT, authorizeRole(['admin']), upload.single('image'), eventController.updateEvent);
router.delete('/:eventId', authenticateJWT, authorizeRole(['admin']), eventController.deleteEvent);

// Event reviews
router.get('/:eventId/reviews', eventController.getEventReviews);
router.post('/:eventId/reviews', authenticateJWT, reviewUpload.single('image'), eventController.createReview);

// Debug route
router.post('/test-upload', reviewUpload.single('image'), (req, res) => {
  try {
    console.log('Test upload received:', {
      file: req.file ? {
        path: req.file.path,
        size: req.file.size
      } : 'No file uploaded'
    });
    
    res.json({
      success: true,
      file: req.file ? req.file.path : null
    });
  } catch (error) {
    console.error('Test upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
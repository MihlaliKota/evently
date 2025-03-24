// backend/routes/eventRoutes.js
const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { authenticateJWT, authorizeRole } = require('../middleware/auth');
const upload = require('../middleware/upload');

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
router.post('/:eventId/reviews', authenticateJWT, upload.single('image'), eventController.createReview);

router.post('/test-upload', uploadReview.single('image'), (req, res) => {
    console.log('Test upload file:', req.file);
    res.json({
        success: true,
        file: req.file ? {
            path: req.file.path,
            mimetype: req.file.mimetype,
            size: req.file.size
        } : null,
        body: req.body
    });
});

module.exports = router;
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

router.post('/test-upload', uploadMiddleware.uploadReview.single('image'), (req, res) => {
    try {
        console.log('Test upload received:', {
            file: req.file ? {
                fieldname: req.file.fieldname,
                originalname: req.file.originalname,
                path: req.file.path,
                size: req.file.size
            } : 'No file uploaded',
            body: req.body
        });

        res.json({
            success: true,
            file: req.file ? {
                path: req.file.path,
                size: req.file.size
            } : null,
            body: req.body
        });
    } catch (error) {
        console.error('Test upload error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
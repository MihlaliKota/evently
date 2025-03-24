const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateJWT, authorizeRole } = require('../middleware/auth');
const { profileUpload } = require('../middleware/upload');

router.get('/profile', authenticateJWT, userController.getProfile);
router.put('/profile', authenticateJWT, profileUpload.single('profile_picture'), userController.updateProfile);
router.put('/password', authenticateJWT, userController.changePassword);
router.get('/activities', authenticateJWT, userController.getUserActivities);

// Admin routes
router.get('/', authenticateJWT, authorizeRole(['admin']), userController.getAllUsers);

module.exports = router;
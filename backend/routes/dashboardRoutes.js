const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticateJWT } = require('../middleware/auth');

router.get('/stats', authenticateJWT, dashboardController.getStats);

module.exports = router;
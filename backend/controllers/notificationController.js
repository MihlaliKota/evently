const notificationModel = require('../models/notificationModel');
const { AppError } = require('../middleware/error');
const asyncHandler = require('../utils/asyncHandler');

const notificationController = {
  // Get user notifications
  getUserNotifications: asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { limit, offset, includeRead } = req.query;
    
    const options = {
      limit: limit ? parseInt(limit) : 10,
      offset: offset ? parseInt(offset) : 0,
      includeRead: includeRead === 'true'
    };
    
    const result = await notificationModel.getUserNotifications(userId, options);
    res.status(200).json(result);
  }),
  
  // Mark notification as read
  markAsRead: asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const notificationId = req.params.notificationId;
    
    const success = await notificationModel.markAsRead(notificationId, userId);
    
    if (!success) {
      throw new AppError('Notification not found', 404);
    }
    
    res.status(200).json({ message: 'Notification marked as read' });
  }),
  
  // Mark all notifications as read
  markAllAsRead: asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const result = await notificationModel.markAllAsRead(userId);
    
    res.status(200).json({
      message: 'All notifications marked as read',
      updated: result.updatedCount
    });
  }),
  
  // Delete notification
  deleteNotification: asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const notificationId = req.params.notificationId;
    
    const success = await notificationModel.delete(notificationId, userId);
    
    if (!success) {
      throw new AppError('Notification not found', 404);
    }
    
    res.status(204).send();
  })
};

module.exports = notificationController;

// 2. Add these routes to userRoutes.js:

// Notification routes
router.get('/notifications', authenticateJWT, notificationController.getUserNotifications);
router.put('/notifications/:notificationId/read', authenticateJWT, notificationController.markAsRead);
router.put('/notifications/read-all', authenticateJWT, notificationController.markAllAsRead);
router.delete('/notifications/:notificationId', authenticateJWT, notificationController.deleteNotification);

// 3. Add this import to userRoutes.js:
const notificationController = require('../controllers/notificationController');
const userModel = require('../models/userModel');
const { AppError } = require('../middleware/error');
const asyncHandler = require('../utils/asyncHandler');

const userController = {
  // Get user profile
  getProfile: asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const profile = await userModel.getProfile(userId);
    
    if (!profile) {
      throw new AppError('User not found', 404);
    }
    
    res.status(200).json(profile);
  }),
  
  // Update user profile
  updateProfile: asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { email, bio, profile_picture } = req.body;
    
    if (email && !email.includes('@')) {
      throw new AppError('Invalid email format', 400);
    }
    
    const result = await userModel.updateProfile(userId, { email, bio, profile_picture });
    
    if (!result) {
      throw new AppError('User not found', 404);
    }
    
    if (result.error) {
      throw new AppError(result.error, result.status);
    }
    
    res.status(200).json(result);
  }),
  
  // Change user password
  changePassword: asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      throw new AppError('Current password and new password are required', 400);
    }
    
    if (newPassword.length < 6) {
      throw new AppError('New password must be at least 6 characters long', 400);
    }
    
    const result = await userModel.changePassword(userId, currentPassword, newPassword);
    
    if (result.error) {
      throw new AppError(result.error, result.status);
    }
    
    res.status(200).json({ message: 'Password updated successfully' });
  }),
  
  // Get user activities
  getUserActivities: asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const activities = await userModel.getUserActivities(userId);
    res.status(200).json(activities);
  }),
  
  // Get all users (admin only)
  getAllUsers: asyncHandler(async (req, res) => {
    const { page = 1, limit = 3, search = '', role = 'all' } = req.query;
    
    try {
        const result = await userModel.getAllUsers({
            page: parseInt(page),
            limit: parseInt(limit),
            search,
            role
        });
        
        // Set pagination headers
        res.set('X-Total-Count', result.pagination.total);
        res.set('X-Total-Pages', result.pagination.pages);
        res.set('X-Current-Page', result.pagination.page);
        res.set('X-Per-Page', result.pagination.limit);
        
        // Sanitize user data to remove sensitive information
        const sanitizedUsers = result.users.map(user => ({
            user_id: user.user_id,
            username: user.username,
            email: user.email,
            role: user.role,
            created_at: user.created_at,
            bio: user.bio || null,
            profile_picture: user.profile_picture || null
        }));

        res.status(200).json(sanitizedUsers);
    } catch (error) {
        console.error('Error fetching users:', error);
        throw new AppError('Failed to retrieve users', 500);
    }
}),
};

module.exports = userController;
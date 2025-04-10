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
    try {
      const userId = req.user.userId;
      const { email, bio } = req.body;

      console.log("Profile update request received:", {
        userId,
        hasFile: !!req.file,
        email,
        bioLength: bio?.length
      });

      // Get profile picture from uploaded file
      const profile_picture = req.file ? req.file.path : undefined;

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

      console.log("Profile updated successfully:", {
        userId,
        hasImage: !!profile_picture
      });

      res.status(200).json(result);
    } catch (error) {
      console.error("Error updating profile:", error);
      throw new AppError(error.message || 'Failed to update profile', error.statusCode || 500);
    }
  }),

  // Update user role (admin only)
  updateUserRole: asyncHandler(async (req, res) => {
    // Ensure the user is an admin
    if (req.user.role !== 'admin') {
      throw new AppError('Only administrators can update user roles', 403);
    }

    const userId = req.params.userId;
    const { role } = req.body;

    if (!role) {
      throw new AppError('Role is required', 400);
    }

    // Prevent self-demotion for safety
    if (parseInt(userId) === req.user.userId && role !== 'admin') {
      throw new AppError('Administrators cannot demote themselves', 403);
    }

    const result = await userModel.updateUserRole(userId, role);

    if (result.error) {
      throw new AppError(result.error, result.status);
    }

    res.status(200).json(result);
  }),// Update user role (admin only)
  updateUserRole: asyncHandler(async (req, res) => {
    // Ensure the user is an admin
    if (req.user.role !== 'admin') {
      throw new AppError('Only administrators can update user roles', 403);
    }

    const userId = req.params.userId;
    const { role } = req.body;

    if (!role) {
      throw new AppError('Role is required', 400);
    }

    // Prevent self-demotion for safety
    if (parseInt(userId) === req.user.userId && role !== 'admin') {
      throw new AppError('Administrators cannot demote themselves', 403);
    }

    const result = await userModel.updateUserRole(userId, role);

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
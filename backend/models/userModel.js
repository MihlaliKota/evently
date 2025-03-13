const pool = require('../config/database');
const bcrypt = require('bcrypt');
const cache = require('../utils/cache');

const userModel = {
  // Find user by username
  async findByUsername(username) {
    const [users] = await pool.query(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );
    
    return users.length > 0 ? users[0] : null;
  },
  
  // Find user by email
  async findByEmail(email) {
    const [users] = await pool.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    
    return users.length > 0 ? users[0] : null;
  },
  
  // Create new user
  async create(userData) {
    const { username, email, password } = userData;
    
    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    const [result] = await pool.query(
      'INSERT INTO users (username, password_hash, email, role, created_at) VALUES (?, ?, ?, ?, NOW())',
      [username, passwordHash, email, 'user']
    );
    
    return {
      userId: result.insertId,
      username,
      email,
      role: 'user'
    };
  },
  
  // Get user profile
  async getProfile(userId) {
    const cacheKey = `user:${userId}:profile`;
    const cachedProfile = cache.get(cacheKey);
    
    if (cachedProfile) {
      return cachedProfile;
    }
    
    const [users] = await pool.query(
      'SELECT user_id, username, email, bio, profile_picture, created_at, role FROM users WHERE user_id = ?',
      [userId]
    );
    
    if (users.length === 0) {
      return null;
    }
    
    // Cache for 10 minutes
    cache.set(cacheKey, users[0], 10 * 60);
    
    return users[0];
  },
  
  // Update user profile
  async updateProfile(userId, profileData) {
    const { email, bio, profile_picture } = profileData;
    
    const updateFields = [];
    const updateValues = [];
    
    if (email !== undefined) {
      updateFields.push('email = ?');
      updateValues.push(email);
    }
    
    if (bio !== undefined) {
      updateFields.push('bio = ?');
      updateValues.push(bio);
    }
    
    if (profile_picture !== undefined) {
      updateFields.push('profile_picture = ?');
      updateValues.push(profile_picture);
    }
    
    if (updateFields.length === 0) {
      return { error: 'No fields to update provided', status: 400 };
    }
    
    updateValues.push(userId);
    
    const [result] = await pool.query(
      `UPDATE users SET ${updateFields.join(', ')} WHERE user_id = ?`,
      updateValues
    );
    
    if (result.affectedRows === 0) {
      return null;
    }
    
    // Invalidate cache
    cache.del(`user:${userId}:profile`);
    
    const [users] = await pool.query(
      'SELECT user_id, username, email, created_at, bio, profile_picture, role FROM users WHERE user_id = ?',
      [userId]
    );
    
    return users[0];
  },
  
  // Change password
  async changePassword(userId, currentPassword, newPassword) {
    const [users] = await pool.query(
      'SELECT password_hash FROM users WHERE user_id = ?',
      [userId]
    );
    
    if (users.length === 0) {
      return { error: 'User not found', status: 404 };
    }
    
    const passwordMatch = await bcrypt.compare(currentPassword, users[0].password_hash);
    if (!passwordMatch) {
      return { error: 'Current password is incorrect', status: 401 };
    }
    
    const saltRounds = 10;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);
    
    await pool.query(
      'UPDATE users SET password_hash = ? WHERE user_id = ?',
      [newPasswordHash, userId]
    );
    
    return { success: true };
  },
  
  // Get user activities
  async getUserActivities(userId) {
    const cacheKey = `user:${userId}:activities`;
    const cachedActivities = cache.get(cacheKey);
    
    if (cachedActivities) {
      return cachedActivities;
    }
    
    // Get created events
    const [createdEvents] = await pool.query(
      `SELECT 'event_created' AS activity_type, event_id, name, event_date, created_at 
      FROM events 
      WHERE user_id = ? 
      ORDER BY created_at DESC LIMIT 5`,
      [userId]
    );
    
    // Get submitted reviews
    const [submittedReviews] = await pool.query(
      `SELECT 'review_submitted' AS activity_type, r.review_id, r.event_id, e.name, r.rating, r.created_at 
      FROM reviews r
      JOIN events e ON r.event_id = e.event_id
      WHERE r.user_id = ? 
      ORDER BY r.created_at DESC LIMIT 5`,
      [userId]
    );
    
    // Combine and sort activities
    const activities = [...createdEvents, ...submittedReviews]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 10);
    
    // Cache for 5 minutes
    cache.set(cacheKey, activities, 5 * 60);
    
    return activities;
  },
  
  // Get all users (admin only)
  async getAllUsers() {
    const cacheKey = 'users:all';
    const cachedUsers = cache.get(cacheKey);
    
    if (cachedUsers) {
      return cachedUsers;
    }
    
    const [users] = await pool.query(
      'SELECT user_id, username, email, bio, profile_picture, created_at, role FROM users'
    );
    
    // Cache for 5 minutes
    cache.set(cacheKey, users, 5 * 60);
    
    return users;
  }
};

module.exports = userModel;
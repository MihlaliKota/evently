const pool = require('../config/database');
const cache = require('../utils/cache');

const notificationModel = {
  // Create a new notification
  async create(notificationData) {
    const { user_id, type, message, related_id, additional_data } = notificationData;
    
    try {
      const [result] = await pool.query(
        `INSERT INTO notifications 
        (user_id, type, message, related_id, additional_data, is_read, created_at) 
        VALUES (?, ?, ?, ?, ?, false, NOW())`,
        [user_id, type, message, related_id || null, additional_data ? JSON.stringify(additional_data) : null]
      );
      
      // Invalidate user notifications cache
      cache.del(`user:${user_id}:notifications`);
      
      return { 
        notification_id: result.insertId,
        ...notificationData,
        is_read: false,
        created_at: new Date()
      };
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  },
  
  // Get user notifications
  async getUserNotifications(userId, options = {}) {
    const { limit = 10, offset = 0, includeRead = false } = options;
    
    const cacheKey = `user:${userId}:notifications:${limit}:${offset}:${includeRead}`;
    const cachedNotifications = cache.get(cacheKey);
    
    if (cachedNotifications) {
      return cachedNotifications;
    }
    
    // Build query conditions
    const conditions = ['user_id = ?'];
    const params = [userId];
    
    if (!includeRead) {
      conditions.push('is_read = false');
    }
    
    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    
    // Get total count first
    const [countResult] = await pool.query(
      `SELECT COUNT(*) AS total FROM notifications ${whereClause}`,
      params
    );
    
    const total = countResult[0].total;
    
    // Then get paginated results
    const [notifications] = await pool.query(
      `SELECT * FROM notifications ${whereClause} 
       ORDER BY created_at DESC, notification_id DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    
    // Process additional_data
    const processedNotifications = notifications.map(notification => {
      try {
        if (notification.additional_data) {
          notification.additional_data = JSON.parse(notification.additional_data);
        }
      } catch (e) {
        console.error('Error parsing notification additional_data:', e);
        notification.additional_data = {};
      }
      return notification;
    });
    
    const result = {
      notifications: processedNotifications,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    };
    
    // Cache for 5 minutes
    cache.set(cacheKey, result, 5 * 60);
    
    return result;
  },
  
  // Mark notification as read
  async markAsRead(notificationId, userId) {
    const [result] = await pool.query(
      'UPDATE notifications SET is_read = true WHERE notification_id = ? AND user_id = ?',
      [notificationId, userId]
    );
    
    if (result.affectedRows > 0) {
      // Invalidate cache
      cache.invalidateByPrefix(`user:${userId}:notifications`);
      return true;
    }
    
    return false;
  },
  
  // Mark all user notifications as read
  async markAllAsRead(userId) {
    const [result] = await pool.query(
      'UPDATE notifications SET is_read = true WHERE user_id = ? AND is_read = false',
      [userId]
    );
    
    // Invalidate cache
    cache.invalidateByPrefix(`user:${userId}:notifications`);
    
    return {
      updatedCount: result.affectedRows
    };
  },
  
  // Delete notification
  async delete(notificationId, userId) {
    const [result] = await pool.query(
      'DELETE FROM notifications WHERE notification_id = ? AND user_id = ?',
      [notificationId, userId]
    );
    
    if (result.affectedRows > 0) {
      // Invalidate cache
      cache.invalidateByPrefix(`user:${userId}:notifications`);
      return true;
    }
    
    return false;
  }
};

module.exports = notificationModel;
const pool = require('../config/database');
const cache = require('../utils/cache');

// Cache key generator
const getCacheKey = (id) => `event:${id}`;

const eventModel = {
  // Get all events with optimized query
  async getAll(options = {}) {
    const { page = 1, limit = 10, sortBy, sortOrder, category_id } = options;
    const offset = (page - 1) * limit;
    
    // Build query parts
    const conditions = [];
    const params = [];
    
    if (category_id) {
      conditions.push('category_id = ?');
      params.push(category_id);
    }
    
    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    
    // Add sorting
    let orderByClause = '';
    if (sortBy && ['name', 'event_date', 'category_id'].includes(sortBy)) {
      const sqlSortOrder = sortOrder?.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
      orderByClause = `ORDER BY ${sortBy} ${sqlSortOrder}`;
    } else {
      orderByClause = 'ORDER BY created_at DESC';
    }
    
    // Get total count for pagination
    const [countResult] = await pool.query(
      `SELECT COUNT(*) AS total_count FROM events ${whereClause}`,
      params
    );
    const totalCount = countResult[0].total_count;
    
    // Get data with pagination
    const [rows] = await pool.query(
      `SELECT * FROM events ${whereClause} ${orderByClause} LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );
    
    return {
      events: rows,
      pagination: {
        total: totalCount,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(totalCount / limit)
      }
    };
  },
  
  // Get single event with caching
  async getById(eventId) {
    const cacheKey = getCacheKey(eventId);
    const cachedEvent = cache.get(cacheKey);
    
    if (cachedEvent) {
      return cachedEvent;
    }
    
    const [rows] = await pool.query(
      'SELECT * FROM events WHERE event_id = ?',
      [eventId]
    );
    
    if (rows.length === 0) {
      return null;
    }
    
    // Cache event data for 5 minutes
    cache.set(cacheKey, rows[0], 5 * 60);
    return rows[0];
  },
  
  // Create event
  async create(eventData) {
    const { user_id, category_id, name, description, event_date, location, event_type } = eventData;
    
    const [result] = await pool.query(
      `INSERT INTO events 
       (user_id, category_id, name, description, event_date, location, event_type, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [user_id, category_id, name, description, event_date, location, event_type]
    );
    
    const [newEvent] = await pool.query(
      'SELECT * FROM events WHERE event_id = ?',
      [result.insertId]
    );
    
    // Invalidate relevant caches
    cache.delPattern('events:list');
    cache.delPattern('events:upcoming');
    
    return newEvent[0];
  },
  
  // Update event
  async update(eventId, eventData) {
    const { name, description, event_date, location, event_type, category_id } = eventData;
    
    const updateFields = [];
    const updateValues = [];
    
    if (name) {
      updateFields.push('name = ?');
      updateValues.push(name);
    }
    
    if (description !== undefined) {
      updateFields.push('description = ?');
      updateValues.push(description);
    }
    
    if (event_date) {
      updateFields.push('event_date = ?');
      updateValues.push(event_date);
    }
    
    if (location !== undefined) {
      updateFields.push('location = ?');
      updateValues.push(location);
    }
    
    if (event_type !== undefined) {
      updateFields.push('event_type = ?');
      updateValues.push(event_type);
    }
    
    if (category_id) {
      updateFields.push('category_id = ?');
      updateValues.push(category_id);
    }
    
    updateFields.push('updated_at = NOW()');
    
    if (updateFields.length === 1) {
      return { success: false, message: 'No fields to update' };
    }
    
    updateValues.push(eventId);
    
    const [result] = await pool.query(
      `UPDATE events SET ${updateFields.join(', ')} WHERE event_id = ?`,
      updateValues
    );
    
    if (result.affectedRows === 0) {
      return null;
    }
    
    // Invalidate caches
    cache.del(getCacheKey(eventId));
    cache.delPattern('events:list');
    cache.delPattern('events:upcoming');
    cache.delPattern('events:past');
    
    const [updatedEvent] = await pool.query(
      'SELECT * FROM events WHERE event_id = ?',
      [eventId]
    );
    
    return updatedEvent[0];
  },
  
  // Delete event
  async delete(eventId) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Delete related reviews
      await connection.query('DELETE FROM reviews WHERE event_id = ?', [eventId]);
      
      // Delete the event
      const [result] = await connection.query(
        'DELETE FROM events WHERE event_id = ?',
        [eventId]
      );
      
      await connection.commit();
      
      // Invalidate caches
      cache.del(getCacheKey(eventId));
      cache.delPattern('events:list');
      cache.delPattern('events:upcoming');
      cache.delPattern('events:past');
      
      return result.affectedRows > 0;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },
  
  // Get upcoming events
  async getUpcoming() {
    const cacheKey = 'events:upcoming';
    const cachedEvents = cache.get(cacheKey);
    
    if (cachedEvents) {
      return cachedEvents;
    }
    
    const [events] = await pool.query(`
      SELECT * FROM events 
      WHERE event_date >= CURDATE()
      ORDER BY event_date ASC
      LIMIT 5
    `);
    
    // Cache for 2 minutes
    cache.set(cacheKey, events, 2 * 60);
    return events;
  },
  
  // Get past events with reviews
  async getPast() {
    const cacheKey = 'events:past';
    const cachedEvents = cache.get(cacheKey);
    
    if (cachedEvents) {
      return cachedEvents;
    }
    
    const [events] = await pool.query(`
      SELECT e.*, 
        (SELECT COUNT(*) FROM reviews r WHERE r.event_id = e.event_id) AS review_count,
        (SELECT AVG(rating) FROM reviews r WHERE r.event_id = e.event_id) AS avg_rating
      FROM events e
      WHERE e.event_date < CURDATE()
      ORDER BY e.event_date DESC
      LIMIT 10
    `);
    
    // Cache for 1 minute
    cache.set(cacheKey, events, 60);
    return events;
  }
};

module.exports = eventModel;
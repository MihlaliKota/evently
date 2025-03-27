const pool = require('../config/database');
const cache = require('../utils/cache');

// Cache key generator
const getCacheKey = (id) => `event:${id}`;

const eventModel = {
  // Get all events with optimized query
  async getAll(options = {}) {
    const { page = 1, limit = 3, sortBy, sortOrder, category_id } = options;
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
    const { user_id, category_id, name, description, event_date, location, event_type, image_path } = eventData;

    // Format the ISO date to MySQL format (YYYY-MM-DD HH:MM:SS)
    const formattedDate = new Date(event_date).toISOString().slice(0, 19).replace('T', ' ');

    const [result] = await pool.query(
      `INSERT INTO events 
       (user_id, category_id, name, description, event_date, location, event_type, image_path, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [user_id, category_id, name, description, formattedDate, location, event_type, image_path]
    );

    const [newEvent] = await pool.query(
      'SELECT * FROM events WHERE event_id = ?',
      [result.insertId]
    );

    // Invalidate relevant caches
    cache.invalidateByPrefix('events:list');
    cache.invalidateByPrefix('events:upcoming');

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

    if (updateFields.length === 0) {
      return { success: false, message: 'No fields to update' };
    }

    const updateQuery = `
      UPDATE events
      SET ${updateFields.join(', ')}, updated_at = NOW()
      WHERE event_id = ?
    `;

    const values = [...updateValues, eventId];
    const [result] = await pool.query(updateQuery, values);

    if (result.affectedRows === 0) {
      return null; // Event not found
    }

    // Invalidate cache
    cache.del(getCacheKey(eventId));
    cache.invalidateByPrefix('events:list');
    cache.invalidateByPrefix('events:upcoming');

    return { success: true };
  },

  // Delete event
  async delete(eventId) {
    const [result] = await pool.query(
      'DELETE FROM events WHERE event_id = ?',
      [eventId]
    );

    if (result.affectedRows === 0) {
      return false; // Event not found
    }

    // Invalidate cache
    cache.del(getCacheKey(eventId));
    cache.invalidateByPrefix('events:list');
    cache.invalidateByPrefix('events:upcoming');

    return true;
  },

  // Get upcoming events with pagination
  async getUpcomingPaginated(options = {}) {
    const { page = 1, limit = 3, sortBy = 'event_date', sortOrder = 'asc' } = options;
    const offset = (page - 1) * limit;
  
    // Build base query - FIXED: Using CURDATE() may cause timezone issues, use NOW() instead
    const baseQuery = `
      FROM events 
      WHERE event_date >= NOW()
    `;
  
    // Get total count
    const [countResult] = await pool.query(
      `SELECT COUNT(*) AS total_count ${baseQuery}`
    );
    const totalCount = countResult[0].total_count;
  
    // Validate sort parameters for security
    let orderByClause = 'ORDER BY event_date ASC';
    if (sortBy && ['name', 'event_date', 'created_at'].includes(sortBy)) {
      const sqlSortOrder = sortOrder?.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
      orderByClause = `ORDER BY ${sortBy} ${sqlSortOrder}`;
    }
  
    // Get paginated data
    const [rows] = await pool.query(`
      SELECT * ${baseQuery}
      ${orderByClause}
      LIMIT ? OFFSET ?
    `, [parseInt(limit), offset]);
  
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

  // Get past events with pagination
  async getPastPaginated(options = {}) {
    const { page = 1, limit = 3, sortBy = 'event_date', sortOrder = 'desc' } = options;
    const offset = (page - 1) * limit;
  
    // Build base query - FIXED: Using CURDATE() may cause timezone issues, use NOW() instead
    const baseQuery = `
      FROM events 
      WHERE event_date < NOW()
    `;
  
    // Get total count
    const [countResult] = await pool.query(
      `SELECT COUNT(*) AS total_count ${baseQuery}`
    );
    const totalCount = countResult[0].total_count;
  
    // Validate sort parameters
    let orderByClause = 'ORDER BY event_date DESC';
    if (sortBy && ['name', 'event_date', 'created_at'].includes(sortBy)) {
      const sqlSortOrder = sortOrder?.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
      orderByClause = `ORDER BY ${sortBy} ${sqlSortOrder}`;
    }
  
    // Get paginated data
    const [rows] = await pool.query(`
      SELECT * ${baseQuery}
      ${orderByClause}
      LIMIT ? OFFSET ?
    `, [parseInt(limit), offset]);
  
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

  // Get upcoming events (no pagination)
  async getUpcoming() {
    const [rows] = await pool.query(
      'SELECT * FROM events WHERE event_date >= NOW() ORDER BY event_date ASC'
    );
    return rows;
  },

  // Get past events (no pagination)
  async getPast() {
    const [rows] = await pool.query(
      'SELECT * FROM events WHERE event_date < NOW() ORDER BY event_date DESC'
    );
    return rows;
  }
};

module.exports = eventModel;
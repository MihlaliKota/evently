require('dotenv').config();

const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());

// Optimized CORS configuration - only allow specific origins
const corsOptions = {
    origin: [
        'http://localhost:5173',
        'https://evently-five-pi.vercel.app',
        'https://evently-production-cd21.up.railway.app'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'X-Requested-With', 'Accept'],
    credentials: true,
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

const port = process.env.PORT ? parseInt(process.env.PORT) : 5000;

// Database connection pool with improved configuration
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: process.env.DB_PORT || 3306,
    connectionLimit: 10,
    waitForConnections: true,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 30000
});

// Centralized error handling middleware
const handleError = (res, error, message = 'An error occurred') => {
    console.error(`Error: ${message}`, error);
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
        error: message,
        details: process.env.NODE_ENV === 'production' ? null : error.message
    });
};

// Authentication middleware
const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            console.error('JWT Verification Error:', err);
            return res.status(403).json({ error: 'Invalid or expired token' });
        }

        req.user = user;
        next();
    });
};

// Role-based authorization middleware
const authorizeRole = (roles = []) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (roles.length > 0 && !roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Forbidden - Insufficient permissions' });
        }

        next();
    };
};

// ======= AUTH ENDPOINTS =======

app.post('/api/register', async (req, res) => {
    try {
        const { username, password, email } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        if (!email || !email.includes('@')) {
            return res.status(400).json({ error: 'A valid email address is required' });
        }

        const connection = await pool.getConnection();
        try {
            const [existingUsers] = await connection.query(
                'SELECT * FROM users WHERE username = ? OR email = ?',
                [username, email]
            );

            if (existingUsers.length > 0) {
                if (existingUsers[0].username === username) {
                    return res.status(409).json({ error: 'Username already taken.' });
                } else {
                    return res.status(409).json({ error: 'Email already registered.' });
                }
            }

            const saltRounds = 10;
            const passwordHash = await bcrypt.hash(password, saltRounds);

            const [result] = await connection.query(
                'INSERT INTO users (username, password_hash, email, role) VALUES (?, ?, ?, ?)',
                [username, passwordHash, email, 'user']
            );

            res.status(201).json({
                message: 'User registered successfully',
                userId: result.insertId,
                role: 'user'
            });

        } finally {
            connection.release();
        }
    } catch (error) {
        handleError(res, error, 'Registration failed');
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required.' });
        }

        const connection = await pool.getConnection();
        try {
            const [users] = await connection.query(
                'SELECT * FROM users WHERE username = ?',
                [username]
            );

            if (users.length === 0) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            const user = users[0];
            const passwordMatch = await bcrypt.compare(password, user.password_hash);

            if (!passwordMatch) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            if (!process.env.JWT_SECRET) {
                return res.status(500).json({ error: 'Server configuration error - missing JWT secret' });
            }

            const payload = {
                userId: user.user_id,
                username: user.username,
                role: user.role || 'user'
            };

            const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });

            res.status(200).json({
                message: 'Login successful',
                token,
                username: user.username,
                role: user.role || 'user'
            });
        } finally {
            connection.release();
        }
    } catch (error) {
        handleError(res, error, 'Login failed');
    }
});

// ======= EVENT ENDPOINTS =======

// Get all events
app.get('/api/events', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const sortBy = req.query.sort_by;
        const sortOrder = req.query.sort_order;

        let orderByClause = '';
        const validSortFields = ['name', 'event_date', 'category_id'];
        const validSortOrders = ['asc', 'desc'];

        if (sortBy && validSortFields.includes(sortBy)) {
            let sqlSortOrder = 'ASC';
            if (sortOrder && validSortOrders.includes(sortOrder.toLowerCase())) {
                sqlSortOrder = sortOrder.toUpperCase();
            }
            orderByClause = `ORDER BY ${sortBy} ${sqlSortOrder}`;
        }

        const connection = await pool.getConnection();
        try {
            const countQuery = 'SELECT COUNT(*) AS total_count FROM events';
            const [countResult] = await connection.query(countQuery);
            const totalCount = countResult[0].total_count;

            let eventsQuery = 'SELECT * FROM events';
            if (orderByClause) {
                eventsQuery += ` ${orderByClause}`;
            }
            eventsQuery += ' LIMIT ? OFFSET ?';
            const [rows] = await connection.query(eventsQuery, [limit, offset]);

            const totalPages = Math.ceil(totalCount / limit);

            res.setHeader('X-Total-Count', totalCount);
            res.setHeader('X-Total-Pages', totalPages);
            res.setHeader('X-Current-Page', page);
            res.setHeader('X-Per-Page', limit);

            res.status(200).json(rows);
        } finally {
            connection.release();
        }
    } catch (error) {
        handleError(res, error, 'Failed to fetch events');
    }
});

// Get single event
app.get('/api/events/:eventId', async (req, res) => {
    try {
        const eventId = req.params.eventId;
        const connection = await pool.getConnection();

        try {
            const [rows] = await connection.query(
                'SELECT * FROM events WHERE event_id = ?',
                [eventId]
            );

            if (rows.length === 0) {
                return res.status(404).json({ error: 'Event not found' });
            }

            res.status(200).json(rows[0]);
        } finally {
            connection.release();
        }
    } catch (error) {
        handleError(res, error, 'Failed to fetch event details');
    }
});

// Create event
app.post('/api/events', authenticateJWT, authorizeRole(['admin']), async (req, res) => {
    try {
        const userId = req.user.userId;
        const {
            name,
            description,
            event_date,
            location,
            event_type = null,
            category_id
        } = req.body;

        if (!name || !category_id || !event_date) {
            return res.status(400).json({
                error: 'Name, category_id, and event_date are required.'
            });
        }

        const connection = await pool.getConnection();
        try {
            const [categoryCheck] = await connection.query(
                'SELECT * FROM eventcategories WHERE category_id = ?',
                [category_id]
            );

            if (categoryCheck.length === 0) {
                return res.status(404).json({ error: 'Selected category does not exist.' });
            }

            const formattedEventDate = new Date(event_date).toISOString().slice(0, 19).replace('T', ' ');

            const [result] = await connection.query(
                `INSERT INTO events 
                (user_id, category_id, name, description, event_date, location, event_type, created_at, updated_at) 
                VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
                [
                    userId,
                    category_id,
                    name.trim(),
                    description ? description.trim() : null,
                    formattedEventDate,
                    location ? location.trim() : null,
                    event_type
                ]
            );

            const [newEvent] = await connection.query(
                'SELECT * FROM events WHERE event_id = ?',
                [result.insertId]
            );

            res.status(201).json(newEvent[0]);
        } finally {
            connection.release();
        }
    } catch (error) {
        handleError(res, error, 'Failed to create event');
    }
});

// Delete event
app.delete('/api/events/:eventId', authenticateJWT, authorizeRole(['admin']), async (req, res) => {
    try {
        const eventId = req.params.eventId;
        const connection = await pool.getConnection();

        try {
            // Begin transaction to handle related records
            await connection.beginTransaction();

            // First delete related reviews to avoid foreign key constraints
            await connection.query(
                'DELETE FROM reviews WHERE event_id = ?',
                [eventId]
            );

            // Then delete the event
            const [result] = await connection.query(
                'DELETE FROM events WHERE event_id = ?',
                [eventId]
            );

            if (result.affectedRows === 0) {
                await connection.rollback();
                return res.status(404).json({ error: 'Event not found' });
            }

            await connection.commit();
            res.status(204).send();
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        handleError(res, error, 'Failed to delete event');
    }
});

// Get upcoming events
app.get('/api/events/upcoming', authenticateJWT, async (req, res) => {
    try {
        const connection = await pool.getConnection();
        try {
            const [events] = await connection.query(`
                SELECT * FROM events 
                WHERE event_date >= CURDATE()
                ORDER BY event_date ASC
                LIMIT 5
            `);

            res.status(200).json(events);
        } finally {
            connection.release();
        }
    } catch (error) {
        handleError(res, error, 'Failed to fetch upcoming events');
    }
});

// Get past events
app.get('/api/events/past', authenticateJWT, async (req, res) => {
    try {
        const connection = await pool.getConnection();
        try {
            const [events] = await connection.query(`
                SELECT e.*, 
                    (SELECT COUNT(*) FROM reviews r WHERE r.event_id = e.event_id) AS review_count,
                    (SELECT AVG(rating) FROM reviews r WHERE r.event_id = e.event_id) AS avg_rating
                FROM events e
                WHERE e.event_date < CURDATE()
                ORDER BY e.event_date DESC
                LIMIT 10
            `);

            res.status(200).json(events);
        } finally {
            connection.release();
        }
    } catch (error) {
        handleError(res, error, 'Failed to fetch past events');
    }
});

// ======= REVIEW ENDPOINTS =======

// Get reviews for an event
app.get('/api/events/:eventId/reviews', authenticateJWT, async (req, res) => {
    try {
        const eventId = req.params.eventId;
        const connection = await pool.getConnection();

        try {
            const [reviews] = await connection.query(`
                SELECT r.*, u.username 
                FROM reviews r
                JOIN users u ON r.user_id = u.user_id
                WHERE r.event_id = ?
                ORDER BY r.created_at DESC
            `, [eventId]);

            res.status(200).json(reviews);
        } finally {
            connection.release();
        }
    } catch (error) {
        handleError(res, error, 'Failed to fetch event reviews');
    }
});

// Create review for an event
app.post('/api/events/:eventId/reviews', authenticateJWT, async (req, res) => {
    try {
        const eventId = req.params.eventId;
        const userId = req.user.userId;
        const { review_text, rating } = req.body;

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ error: 'Rating must be between 1 and 5.' });
        }

        const connection = await pool.getConnection();
        try {
            // Begin transaction
            await connection.beginTransaction();

            const [eventCheck] = await connection.query(
                'SELECT * FROM events WHERE event_id = ?',
                [eventId]
            );

            if (eventCheck.length === 0) {
                await connection.rollback();
                return res.status(404).json({ error: 'Event not found.' });
            }

            const [existingReview] = await connection.query(
                'SELECT * FROM reviews WHERE event_id = ? AND user_id = ?',
                [eventId, userId]
            );

            if (existingReview.length > 0) {
                await connection.rollback();
                return res.status(409).json({ error: 'You have already reviewed this event.' });
            }

            const [result] = await connection.query(
                'INSERT INTO reviews (event_id, user_id, review_text, rating, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())',
                [eventId, userId, review_text, rating]
            );

            const [newReview] = await connection.query(
                'SELECT r.*, u.username FROM reviews r JOIN users u ON r.user_id = u.user_id WHERE r.review_id = ?',
                [result.insertId]
            );

            await connection.commit();
            res.status(201).json(newReview[0]);
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        handleError(res, error, 'Failed to create review');
    }
});

// Update review
app.put('/api/reviews/:reviewId', authenticateJWT, async (req, res) => {
    try {
        const reviewId = req.params.reviewId;
        const userId = req.user.userId;
        const { review_text, rating } = req.body;

        if (rating !== undefined && (rating < 1 || rating > 5)) {
            return res.status(400).json({ error: 'Rating must be between 1 and 5.' });
        }

        const connection = await pool.getConnection();
        try {
            const [reviewCheck] = await connection.query(
                'SELECT * FROM reviews WHERE review_id = ?',
                [reviewId]
            );

            if (reviewCheck.length === 0) {
                return res.status(404).json({ error: 'Review not found.' });
            }

            if (reviewCheck[0].user_id !== userId && req.user.role !== 'admin') {
                return res.status(403).json({ error: 'You can only edit your own reviews.' });
            }

            const updateFields = [];
            const updateValues = [];

            if (review_text !== undefined) {
                updateFields.push('review_text = ?');
                updateValues.push(review_text);
            }

            if (rating !== undefined) {
                updateFields.push('rating = ?');
                updateValues.push(rating);
            }

            // Always add updated_at
            updateFields.push('updated_at = NOW()');

            if (updateFields.length === 1 && updateFields[0] === 'updated_at = NOW()') {
                return res.status(400).json({ error: 'No fields to update.' });
            }

            updateValues.push(reviewId);

            await connection.query(
                `UPDATE reviews SET ${updateFields.join(', ')} WHERE review_id = ?`,
                updateValues
            );

            const [updatedReview] = await connection.query(
                'SELECT r.*, u.username FROM reviews r JOIN users u ON r.user_id = u.user_id WHERE r.review_id = ?',
                [reviewId]
            );

            res.status(200).json(updatedReview[0]);
        } finally {
            connection.release();
        }
    } catch (error) {
        handleError(res, error, 'Failed to update review');
    }
});

// Delete review
app.delete('/api/reviews/:reviewId', authenticateJWT, async (req, res) => {
    try {
        const reviewId = req.params.reviewId;
        const userId = req.user.userId;

        const connection = await pool.getConnection();
        try {
            const [reviewCheck] = await connection.query(
                'SELECT * FROM reviews WHERE review_id = ?',
                [reviewId]
            );

            if (reviewCheck.length === 0) {
                return res.status(404).json({ error: 'Review not found.' });
            }

            if (reviewCheck[0].user_id !== userId && req.user.role !== 'admin') {
                return res.status(403).json({ error: 'You can only delete your own reviews.' });
            }

            await connection.query(
                'DELETE FROM reviews WHERE review_id = ?',
                [reviewId]
            );

            res.status(204).send();
        } finally {
            connection.release();
        }
    } catch (error) {
        handleError(res, error, 'Failed to delete review');
    }
});

// Get all reviews with filtering
app.get('/api/reviews', authenticateJWT, async (req, res) => {
    try {
        const { event_id, user_id, min_rating, max_rating, sort_by, sort_order } = req.query;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        let query = `
            SELECT r.*, u.username, e.name as event_name
            FROM reviews r
            JOIN users u ON r.user_id = u.user_id
            JOIN events e ON r.event_id = e.event_id
            WHERE 1=1
        `;

        const queryParams = [];

        if (event_id) {
            query += ' AND r.event_id = ?';
            queryParams.push(event_id);
        }

        if (user_id) {
            query += ' AND r.user_id = ?';
            queryParams.push(user_id);
        }

        if (min_rating) {
            query += ' AND r.rating >= ?';
            queryParams.push(min_rating);
        }

        if (max_rating) {
            query += ' AND r.rating <= ?';
            queryParams.push(max_rating);
        }

        const validSortFields = ['created_at', 'rating', 'event_id', 'user_id'];
        const validSortOrders = ['asc', 'desc'];

        let orderBy = ' ORDER BY r.created_at DESC';

        if (sort_by && validSortFields.includes(sort_by)) {
            const direction = sort_order && validSortOrders.includes(sort_order.toLowerCase())
                ? sort_order.toUpperCase()
                : 'DESC';
            orderBy = ` ORDER BY r.${sort_by} ${direction}`;
        }

        query += orderBy;
        query += ' LIMIT ? OFFSET ?';
        queryParams.push(limit, offset);

        const connection = await pool.getConnection();
        try {
            // Modified to use a more efficient count query
            const countQuery = `
                SELECT COUNT(*) AS total 
                FROM reviews r
                JOIN users u ON r.user_id = u.user_id
                JOIN events e ON r.event_id = e.event_id
                WHERE 1=1
                ${event_id ? ' AND r.event_id = ?' : ''}
                ${user_id ? ' AND r.user_id = ?' : ''}
                ${min_rating ? ' AND r.rating >= ?' : ''}
                ${max_rating ? ' AND r.rating <= ?' : ''}
            `;

            const countParams = [];
            if (event_id) countParams.push(event_id);
            if (user_id) countParams.push(user_id);
            if (min_rating) countParams.push(min_rating);
            if (max_rating) countParams.push(max_rating);

            const [countResult] = await connection.query(countQuery, countParams);
            const total = countResult[0].total;

            const [reviews] = await connection.query(query, queryParams);

            res.setHeader('X-Total-Count', total);
            res.setHeader('X-Total-Pages', Math.ceil(total / limit));
            res.setHeader('X-Current-Page', page);
            res.setHeader('X-Per-Page', limit);

            res.status(200).json(reviews);
        } finally {
            connection.release();
        }
    } catch (error) {
        handleError(res, error, 'Failed to fetch reviews');
    }
});

// Get review analytics
app.get('/api/reviews/analytics', authenticateJWT, async (req, res) => {
    try {
        const { event_id } = req.query;

        const connection = await pool.getConnection();
        try {
            let query = `
                SELECT 
                    COUNT(*) as total_reviews,
                    AVG(rating) as average_rating,
                    COUNT(CASE WHEN rating = 5 THEN 1 END) as five_star,
                    COUNT(CASE WHEN rating = 4 THEN 1 END) as four_star,
                    COUNT(CASE WHEN rating = 3 THEN 1 END) as three_star,
                    COUNT(CASE WHEN rating = 2 THEN 1 END) as two_star,
                    COUNT(CASE WHEN rating = 1 THEN 1 END) as one_star,
                    COUNT(CASE WHEN rating >= 4 THEN 1 END) as positive_reviews,
                    COUNT(CASE WHEN rating <= 2 THEN 1 END) as negative_reviews
                FROM reviews
            `;

            const queryParams = [];

            if (event_id) {
                query += ' WHERE event_id = ?';
                queryParams.push(event_id);
            }

            const [analytics] = await connection.query(query, queryParams);

            let recentQuery = `
                SELECT r.*, u.username
                FROM reviews r
                JOIN users u ON r.user_id = u.user_id
            `;

            if (event_id) {
                recentQuery += ' WHERE r.event_id = ?';
            }

            recentQuery += ' ORDER BY r.created_at DESC LIMIT 5';

            const [recentReviews] = await connection.query(recentQuery, event_id ? [event_id] : []);

            res.status(200).json({
                analytics: analytics[0],
                recentReviews
            });
        } finally {
            connection.release();
        }
    } catch (error) {
        handleError(res, error, 'Failed to fetch review analytics');
    }
});

// ======= USER ENDPOINTS =======

// Get user profile
app.get('/api/users/profile', authenticateJWT, async (req, res) => {
    try {
        const userId = req.user.userId;

        const connection = await pool.getConnection();
        try {
            const [users] = await connection.query(
                'SELECT user_id, username, email, bio, profile_picture, created_at, role FROM users WHERE user_id = ?',
                [userId]
            );

            if (users.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }

            res.status(200).json(users[0]);
        } finally {
            connection.release();
        }
    } catch (error) {
        handleError(res, error, 'Failed to fetch user profile');
    }
});

// Update user profile
app.put('/api/users/profile', authenticateJWT, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { email, bio, profile_picture } = req.body;

        if (email && !email.includes('@')) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        const connection = await pool.getConnection();
        try {
            let updateQuery = 'UPDATE users SET ';
            const updateValues = [];
            const updates = [];

            if (email !== undefined) { updates.push('email = ?'); updateValues.push(email); }
            if (bio !== undefined) { updates.push('bio = ?'); updateValues.push(bio); }
            if (profile_picture !== undefined) { updates.push('profile_picture = ?'); updateValues.push(profile_picture); }

            if (updates.length === 0) {
                return res.status(400).json({ error: 'No fields to update provided' });
            }

            updateQuery += updates.join(', ');
            updateQuery += ' WHERE user_id = ?';
            updateValues.push(userId);

            const [result] = await connection.query(updateQuery, updateValues);

            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'User not found' });
            }

            const [users] = await connection.query(
                'SELECT user_id, username, email, created_at, bio, profile_picture, role FROM users WHERE user_id = ?',
                [userId]
            );

            res.status(200).json(users[0]);
        } finally {
            connection.release();
        }
    } catch (error) {
        handleError(res, error, 'Failed to update user profile');
    }
});

// Change user password
app.put('/api/users/password', authenticateJWT, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Current password and new password are required' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'New password must be at least 6 characters long' });
        }

        const connection = await pool.getConnection();
        try {
            const [users] = await connection.query(
                'SELECT password_hash FROM users WHERE user_id = ?',
                [userId]
            );

            if (users.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }

            const passwordMatch = await bcrypt.compare(currentPassword, users[0].password_hash);
            if (!passwordMatch) {
                return res.status(401).json({ error: 'Current password is incorrect' });
            }

            const saltRounds = 10;
            const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

            await connection.query(
                'UPDATE users SET password_hash = ? WHERE user_id = ?',
                [newPasswordHash, userId]
            );

            res.status(200).json({ message: 'Password updated successfully' });
        } finally {
            connection.release();
        }
    } catch (error) {
        handleError(res, error, 'Failed to update password');
    }
});

// Get user activities
app.get('/api/users/activities', authenticateJWT, async (req, res) => {
    try {
        const userId = req.user.userId;

        const connection = await pool.getConnection();
        try {
            const [createdEvents] = await connection.query(
                `SELECT 'event_created' AS activity_type, event_id, name, event_date, created_at 
                FROM events 
                WHERE user_id = ? 
                ORDER BY created_at DESC LIMIT 5`,
                [userId]
            );

            const [submittedReviews] = await connection.query(
                `SELECT 'review_submitted' AS activity_type, r.review_id, r.event_id, e.name, r.rating, r.created_at 
                FROM reviews r
                JOIN events e ON r.event_id = e.event_id
                WHERE r.user_id = ? 
                ORDER BY r.created_at DESC LIMIT 5`,
                [userId]
            );

            const activities = [...createdEvents, ...submittedReviews]
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                .slice(0, 10);

            res.status(200).json(activities);
        } finally {
            connection.release();
        }
    } catch (error) {
        handleError(res, error, 'Failed to fetch user activities');
    }
});

// ======= CATEGORY ENDPOINTS =======

// Get all categories
app.get('/api/categories', async (req, res) => {
    try {
        const connection = await pool.getConnection();
        try {
            const [rows] = await connection.query('SELECT * FROM eventcategories');
            res.status(200).json(rows);
        } finally {
            connection.release();
        }
    } catch (error) {
        handleError(res, error, 'Failed to fetch categories');
    }
});

// ======= DASHBOARD ENDPOINTS =======

// Get dashboard stats
app.get('/api/dashboard/stats', authenticateJWT, async (req, res) => {
    try {
        const connection = await pool.getConnection();
        try {
            // Optimized to use a single query
            const [stats] = await connection.query(`
                SELECT 
                    (SELECT COUNT(*) FROM events) AS totalEvents,
                    (SELECT COUNT(*) FROM events WHERE event_date >= CURDATE()) AS upcomingEvents,
                    (SELECT COUNT(*) FROM events WHERE event_date < CURDATE()) AS completedEvents
            `);

            res.status(200).json(stats[0]);
        } finally {
            connection.release();
        }
    } catch (error) {
        handleError(res, error, 'Failed to fetch dashboard statistics');
    }
});

// ======= HEALTH CHECK ENDPOINT =======

// Health check endpoint
app.get('/', (req, res) => {
    res.status(200).send('Evently API - Running');
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port http://localhost:${port}`);

    // Test database connection on startup
    (async () => {
        let connection;
        try {
            connection = await pool.getConnection();
            const [rows] = await connection.query('SELECT 1 + 1 AS solution');
            console.log('Database connection successful! Test query result:', rows[0].solution);
        } catch (error) {
            console.error('Database connection failed:', error);
            console.error('Error details:', error.message, error.code);
        } finally {
            if (connection) {
                connection.release();
            }
        }
    })();
});
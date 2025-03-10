require('dotenv').config();

const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());

const corsOptions = {
    origin: [
        'http://localhost:5173',
        'https://evently-five-pi.vercel.app',
        'https://evently-production-cd21.up.railway.app',
        true
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'Origin',
        'X-Requested-With',
        'Accept'
    ],
    credentials: true,
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

const port = process.env.PORT ? parseInt(process.env.PORT) : 5000;

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: process.env.DB_PORT || 3306,
    connectionLimit: 10
});

async function testDatabaseConnection() {
    let connection;
    try {
        console.log('Attempting database connection with:');
        console.log(`Host: ${process.env.DB_HOST}`);
        console.log(`User: ${process.env.DB_USER}`);
        console.log(`Database: ${process.env.DB_DATABASE}`);
        console.log(`Port: ${process.env.DB_PORT}`);

        connection = await pool.getConnection();
        const [rows, fields] = await connection.query('SELECT 1 + 1 AS solution');
        console.log('Database connection successful!');
        console.log('Test query result:', rows[0].solution);
    } catch (error) {
        console.error('Database connection failed:', error);
        console.error('Error details:', error.message, error.code);
    } finally {
        if (connection) {
            connection.release();
        }
    }
}

const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (authHeader) {
        const token = authHeader.split(' ')[1];

        jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
            if (err) {
                console.error('JWT Verification Error:', err);
                return res.sendStatus(403);
            }

            req.user = user;
            next();
        });
    } else {
        res.sendStatus(401);
    }
};

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

app.post('/api/register', async (req, res) => {
    console.group('🔐 Registration Attempt');
    console.log('Request Origin:', req.get('origin'));
    console.log('Request Headers:', req.headers);
    console.log('Request Body:', req.body);

    try {
        const { username, password, email } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({
                error: 'All fields are required',
                details: {
                    username: !!username,
                    email: !!email,
                    password: !!password
                }
            });
        }

        if (!email || !email.includes('@')) {
            return res.status(400).json({
                error: 'A valid email address is required'
            });
        }

        const connection = await pool.getConnection();
        try {
            const [existingUsers] = await connection.query(
                'SELECT * FROM users WHERE username = ?',
                [username]
            );

            if (existingUsers.length > 0) {
                return res.status(409).json({ error: 'Username already taken.' });
            }

            let role = 'user';

            const saltRounds = 10;
            const passwordHash = await bcrypt.hash(password, saltRounds);

            const [result] = await connection.query(
                'INSERT INTO users (username, password_hash, email, role) VALUES (?, ?, ?, ?)',
                [username, passwordHash, email, role]
            );

            res.status(201).json({
                message: 'User registered successfully',
                userId: result.insertId,
                role: role
            });

        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('Registration Error:', error);
        res.status(500).json({
            error: 'Registration failed',
            details: error.message,
            debugInfo: {
                origin: req.get('origin'),
                headers: req.headers
            }
        });
    }
});

app.post('/api/login', async (req, res) => {
    console.log('Login attempt initiated for username:', req.body.username);
    console.log('Request headers:', req.headers);
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            console.log('Login failed: Missing username or password');
            return res.status(400).json({ error: 'Username and password are required.' });
        }

        console.log('Attempting to retrieve user from database for username:', username);

        const connection = await pool.getConnection();
        try {
            const [users] = await connection.query(
                'SELECT * FROM users WHERE username = ?',
                [username]
            );

            console.log('Database query completed. Found users:', users.length);

            if (users.length === 0) {
                console.log('Login failed: User not found in database');
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            const user = users[0];
            console.log('User found in database, ID:', user.user_id, 'Role:', user.role);

            console.log('Comparing provided password with stored hash...');
            const passwordMatch = await bcrypt.compare(password, user.password_hash);
            console.log('Password comparison result:', passwordMatch);

            if (!passwordMatch) {
                console.log('Login failed: Password does not match');
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            console.log('Generating JWT token for user...');
            const payload = {
                userId: user.user_id,
                username: user.username,
                role: user.role || 'user'  // Add role to JWT payload
            };
            
            const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

            console.log('JWT_SECRET environment variable available:', !!process.env.JWT_SECRET);

            if (!process.env.JWT_SECRET) {
                console.error('ERROR: JWT_SECRET environment variable is not defined!');
                return res.status(500).json({ error: 'Server configuration error - missing JWT secret' });
            }

            console.log('JWT token generated successfully');

            console.log('Login successful for user:', username);
            res.status(200).json({
                message: 'Login successful',
                token: token,
                username: user.username,
                role: user.role || 'user'
            });

        } catch (dbError) {
            console.error('Database error during login process:', dbError);
            res.status(500).json({ error: 'Database error during authentication', details: dbError.message });
        } finally {
            connection.release();
            console.log('Database connection released');
        }

    } catch (error) {
        console.error('Unexpected login error:', error);
        console.error('Error stack trace:', error.stack);
        res.status(500).json({ error: 'Server configuration error', details: error.message });
    }
});

app.get('/api/protected', authenticateJWT, (req, res) => {
    res.json({
        message: 'Protected endpoint accessed successfully!',
        user: req.user,
        timestamp: new Date().toISOString()
    });
});

app.post('/api/events', authenticateJWT, async (req, res) => {
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
                error: 'Name, category_id, and event_date are required.',
                missingFields: {
                    name: !name,
                    category_id: !category_id,
                    event_date: !event_date
                }
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
        console.error('Event Creation Error:', error);
        res.status(500).json({
            error: 'Failed to create event',
            details: error.message
        });
    }
});

app.get('/api/events', async (req, res) => {
    console.log(`GET /api/events - Start processing request, query parameters:`, req.query);

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const sortBy = req.query.sort_by;
    const sortOrder = req.query.sort_order;

    console.log(`GET /api/events - Pagination parameters: page=${page}, limit=${limit}, offset=${offset}`);
    console.log(`GET /api/events - Sorting parameters: sortBy=${sortBy}, sortOrder=${sortOrder}`);

    let orderByClause = '';
    const validSortFields = ['name', 'event_date', 'category_id'];
    const validSortOrders = ['asc', 'desc'];
    let sqlSortBy = null;

    if (sortBy && validSortFields.includes(sortBy)) {
        sqlSortBy = sortBy;
        let sqlSortOrder = 'ASC';
        if (sortOrder && validSortOrders.includes(sortOrder.toLowerCase())) {
            sqlSortOrder = sortOrder.toUpperCase();
        }
        orderByClause = `ORDER BY ${sqlSortBy} ${sqlSortOrder}`;
        console.log(`GET /api/events - ORDER BY clause: ${orderByClause}`);
    } else if (sortBy) {
        console.log(`GET /api/events - Invalid sort_by field: ${sortBy}. Sorting will be disabled.`);
    }

    try {
        const connection = await pool.getConnection();
        console.log(`GET /api/events - Database connection acquired`);

        try {
            const countQuery = 'SELECT COUNT(*) AS total_count FROM events';
            console.log(`GET /api/events - SQL query for total count: ${countQuery}`);
            const [countResult] = await connection.query(countQuery);
            const totalCount = countResult[0].total_count;
            console.log(`GET /api/events - Total events count: ${totalCount}`);

            let eventsQuery = 'SELECT * FROM events';
            if (orderByClause) {
                eventsQuery += ` ${orderByClause}`;
            }
            eventsQuery += ' LIMIT ? OFFSET ?';
            const sqlParams = [limit, offset];
            console.log(`GET /api/events - SQL query for events: ${eventsQuery} Parameters:`, sqlParams);
            const [rows] = await connection.query(eventsQuery, sqlParams);

            const totalPages = Math.ceil(totalCount / limit);
            const currentPage = page;
            const perPage = limit;

            res.setHeader('X-Total-Count', totalCount);
            res.setHeader('X-Total-Pages', totalPages);
            res.setHeader('X-Current-Page', currentPage);
            res.setHeader('X-Per-Page', perPage);

            res.status(200).json(rows);
            console.log(`GET /api/events - Retrieved ${rows.length} events, 200 response sent (with pagination metadata and sorting)`);

        } finally {
            connection.release();
            console.log(`GET /api/events - Database connection released`);
        }

    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ error: 'Failed to fetch events.', details: error.message });
    }
});

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

            const event = rows[0];
            res.status(200).json(event);

        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('Error fetching event details:', error);
        res.status(500).json({ error: 'Failed to fetch event details.', details: error.message });
    }
});

app.put('/api/events/:eventId', async (req, res) => {
    try {
        const eventId = req.params.eventId;

        const { name, description, location, event_date, category_id } = req.body;

        if (!name && !description && !location && !event_date && !category_id) {
            return res.status(400).json({ error: 'No fields to update provided.' });
        }

        const connection = await pool.getConnection();

        try {
            let updateQuery = 'UPDATE events SET ';
            const updateValues = [];
            const updates = [];

            if (category_id !== undefined) { updates.push('category_id = ?'); updateValues.push(category_id); }
            if (name !== undefined) { updates.push('name = ?'); updateValues.push(name); }
            if (description !== undefined) { updates.push('description = ?'); updateValues.push(description); }
            if (location !== undefined) { updates.push('location = ?'); updateValues.push(location); }
            if (event_date !== undefined) { updates.push('event_date = ?'); updateValues.push(event_date); }

            updateQuery += updates.join(', ');
            updateQuery += ' WHERE event_id = ?';
            updateValues.push(eventId);

            const [result] = await connection.query(updateQuery, updateValues);

            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Event not found' });
            }

            const [updatedEventRows] = await connection.query(
                'SELECT * FROM events WHERE event_id = ?',
                [eventId]
            );
            const updatedEvent = updatedEventRows[0];

            res.status(200).json(updatedEvent);

        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('Error updating event:', error);
        res.status(500).json({ error: 'Failed to update event.', details: error.message });
    }
});

app.delete('/api/events/:eventId', async (req, res) => {
    try {
        const eventId = req.params.eventId;

        const connection = await pool.getConnection();

        try {
            const [result] = await connection.query(
                'DELETE FROM events WHERE event_id = ?',
                [eventId]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Event not found' });
            }

            res.status(204).send();

        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('Error deleting event:', error);
        res.status(500).json({ error: 'Failed to delete event.', details: error.message });
    }
});

app.post('/api/categories', async (req, res) => {
    try {
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Category name is required.' });
        }

        const connection = await pool.getConnection();

        try {
            const [result] = await connection.query(
                'INSERT INTO eventcategories (category_name) VALUES (?)',
                [name]
            );

            const categoryId = result.insertId;

            const [newCategoryRows] = await connection.query(
                'SELECT * FROM eventcategories WHERE category_id = ?',
                [categoryId]
            );
            const newCategory = newCategoryRows[0];

            res.status(201).json(newCategory);

        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('Error creating category:', error);
        res.status(500).json({ error: 'Failed to create category.', details: error.message });
    }
});

app.get('/api/categories', async (req, res) => {
    console.log(`GET /api/categories - Start processing request, query parameters:`, req.query);

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    console.log(`GET /api/categories - Pagination parameters: page=${page}, limit=${limit}, offset=${offset}`);

    try {
        const connection = await pool.getConnection();
        console.log(`GET /api/categories - Database connection acquired`);

        try {
            const countQuery = 'SELECT COUNT(*) AS total_count FROM eventcategories';
            console.log(`GET /api/categories - SQL query for total count: ${countQuery}`);
            const [countResult] = await connection.query(countQuery);
            const totalCount = countResult[0].total_count;
            console.log(`GET /api/categories - Total categories count: ${totalCount}`);

            const categoriesQuery = 'SELECT * FROM eventcategories LIMIT ? OFFSET ?';
            const sqlParams = [limit, offset];
            console.log(`GET /api/categories - SQL query for categories: ${categoriesQuery} Parameters:`, sqlParams);
            const [rows] = await connection.query(categoriesQuery, sqlParams);

            const totalPages = Math.ceil(totalCount / limit);
            const currentPage = page;
            const perPage = limit;

            res.setHeader('X-Total-Count', totalCount);
            res.setHeader('X-Total-Pages', totalPages);
            res.setHeader('X-Current-Page', currentPage);
            res.setHeader('X-Per-Page', perPage);

            res.status(200).json(rows);
            console.log(`GET /api/categories - Retrieved ${rows.length} categories, 200 response sent (with pagination metadata in headers)`);

        } finally {
            connection.release();
            console.log(`GET /api/categories - Database connection released`);
        }

    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ error: 'Failed to fetch categories.', details: error.message });
    }
});

app.get('/api/categories/:categoryId', async (req, res) => {
    try {
        const categoryId = req.params.categoryId;

        const connection = await pool.getConnection();

        try {
            const [rows] = await connection.query(
                'SELECT * FROM eventcategories WHERE category_id = ?',
                [categoryId]
            );

            if (rows.length === 0) {
                return res.status(404).json({ error: 'Category not found' });
            }

            const category = rows[0];
            res.status(200).json(category);

        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('Error fetching category details:', error);
        res.status(500).json({ error: 'Failed to fetch category details.', details: error.message });
    }
});

app.put('/api/categories/:categoryId', async (req, res) => {
    try {
        const categoryId = req.params.categoryId;
        console.log(`PUT /api/categories/${categoryId}s - Start processing request`);

        const { name, description } = req.body;

        if (!name && !description) {
            return res.status(400).json({ error: 'No fields to update provided.' });
        }

        const connection = await pool.getConnection();
        console.log(`PUT /api/categories/${categoryId} - Database connection acquired`);

        try {
            let updateQuery = 'UPDATE eventcategories SET ';
            const updateValues = [];
            const updates = [];

            if (name !== undefined) { updates.push('category_name = ?'); updateValues.push(name); }
            if (description !== undefined) { updates.push('description = ?'); updateValues.push(description); }

            updateQuery += updates.join(', ');
            updateQuery += ' WHERE category_id = ?';
            updateValues.push(categoryId);

            const [result] = await connection.query(updateQuery, updateValues);
            console.log(`PUT /api/categories/${categoryId} - UPDATE query executed. affectedRows: ${result.affectedRows}`);

            if (result.affectedRows === 0) {
                console.log(`PUT /api/categories/${categoryId} - affectedRows is 0, category not found`);
                return res.status(404).json({ error: 'Category not found' });
            }

            const [updatedCategoryRows] = await connection.query(
                'SELECT * FROM eventcategories WHERE category_id = ?',
                [categoryId]
            );
            const updatedCategory = updatedCategoryRows[0];

            res.status(200).json(updatedCategory);
            console.log(`PUT /api/categories/${categoryId} - Successful update, 200 response sent`);

        } finally {
            connection.release();
            console.log(`PUT /api/categories/${categoryId} - Database connection released`);
        }

    } catch (error) {
        console.error('Error updating category:', error);
        res.status(500).json({ error: 'Failed to update category.', details: error.message });
    }
});

app.delete('/api/categories/:categoryId', async (req, res) => {
    console.log(`DELETE /api/categories/${req.params.categoryId} - Start processing request`);
    try {
        const categoryId = req.params.categoryId;

        const connection = await pool.getConnection();
        console.log(`DELETE /api/categories/${categoryId} - Database connection acquired`);

        try {
            const [result] = await connection.query(
                'DELETE FROM eventcategories WHERE category_id = ?',
                [categoryId]
            );
            console.log(`DELETE /api/categories/${categoryId} - DELETE query executed. affectedRows: ${result.affectedRows}`);

            if (result.affectedRows === 0) {
                console.log(`DELETE /api/categories/${categoryId} - affectedRows is 0, category not found`);
                return res.status(404).json({ error: 'Category not found' });
            }

            res.status(204).send();
            console.log(`DELETE /api/categories/${categoryId} - Successful deletion, 204 response sent`);

        } finally {
            connection.release();
            console.log(`DELETE /api/categories/${categoryId} - Database connection released`);
        }

    } catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({ error: 'Failed to delete category.', details: error.message });
    }
});

app.get('/api/dashboard/stats', authenticateJWT, async (req, res) => {
    try {
        const connection = await pool.getConnection();
        try {
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
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard statistics.', details: error.message });
    }
});

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
        console.error('Error fetching upcoming events:', error);
        res.status(500).json({ error: 'Failed to fetch upcoming events.', details: error.message });
    }
});

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
        console.error('Error fetching past events:', error);
        res.status(500).json({ error: 'Failed to fetch past events.', details: error.message });
    }
});

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
        console.error('Error fetching event reviews:', error);
        res.status(500).json({ error: 'Failed to fetch event reviews.', details: error.message });
    }
});

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
            const [eventCheck] = await connection.query(
                'SELECT * FROM events WHERE event_id = ?',
                [eventId]
            );

            if (eventCheck.length === 0) {
                return res.status(404).json({ error: 'Event not found.' });
            }

            const [existingReview] = await connection.query(
                'SELECT * FROM reviews WHERE event_id = ? AND user_id = ?',
                [eventId, userId]
            );

            if (existingReview.length > 0) {
                return res.status(409).json({ error: 'You have already reviewed this event.' });
            }

            const [result] = await connection.query(
                'INSERT INTO reviews (event_id, user_id, review_text, rating) VALUES (?, ?, ?, ?)',
                [eventId, userId, review_text, rating]
            );

            const [newReview] = await connection.query(
                'SELECT r.*, u.username FROM reviews r JOIN users u ON r.user_id = u.user_id WHERE r.review_id = ?',
                [result.insertId]
            );

            res.status(201).json(newReview[0]);
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error creating review:', error);
        res.status(500).json({ error: 'Failed to create review.', details: error.message });
    }
});

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

            if (reviewCheck[0].user_id !== userId) {
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

            if (updateFields.length === 0) {
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
        console.error('Error updating review:', error);
        res.status(500).json({ error: 'Failed to update review.', details: error.message });
    }
});

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
        console.error('Error deleting review:', error);
        res.status(500).json({ error: 'Failed to delete review.', details: error.message });
    }
});

app.get('/api/reviews', authenticateJWT, async (req, res) => {
    try {
        const { event_id, user_id, min_rating, max_rating, sort_by, sort_order, status } = req.query;
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

        if (status && status !== 'all') {
            query += ' AND r.moderation_status = ?';
            queryParams.push(status);
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
            let countQuery = `
                SELECT COUNT(*) AS total
                FROM reviews r
                JOIN users u ON r.user_id = u.user_id
                JOIN events e ON r.event_id = e.event_id
                WHERE 1=1
            `;

            const countParams = [];

            if (event_id) {
                countQuery += ' AND r.event_id = ?';
                countParams.push(event_id);
            }

            if (user_id) {
                countQuery += ' AND r.user_id = ?';
                countParams.push(user_id);
            }

            if (min_rating) {
                countQuery += ' AND r.rating >= ?';
                countParams.push(min_rating);
            }

            if (max_rating) {
                countQuery += ' AND r.rating <= ?';
                countParams.push(max_rating);
            }

            if (status && status !== 'all') {
                countQuery += ' AND r.moderation_status = ?';
                countParams.push(status);
            }

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
        console.error('Error fetching reviews:', error);
        res.status(500).json({ error: 'Failed to fetch reviews.', details: error.message });
    }
});

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
        console.error('Error fetching review analytics:', error);
        res.status(500).json({ error: 'Failed to fetch review analytics.', details: error.message });
    }
});

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
        console.error('Error fetching user profile:', error);
        res.status(500).json({ error: 'Failed to fetch user profile', details: error.message });
    }
});

app.put('/api/users/profile', authenticateJWT, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { email, bio, location, avatar_url } = req.body;

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
            if (location !== undefined) { updates.push('location = ?'); updateValues.push(location); }
            if (avatar_url !== undefined) { updates.push('avatar_url = ?'); updateValues.push(avatar_url); }

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
                'SELECT user_id, username, email, created_at, bio, location, avatar_url, role FROM users WHERE user_id = ?',
                [userId]
            );

            res.status(200).json(users[0]);
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error updating user profile:', error);
        res.status(500).json({ error: 'Failed to update user profile', details: error.message });
    }
});

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

            const [result] = await connection.query(
                'UPDATE users SET password_hash = ? WHERE user_id = ?',
                [newPasswordHash, userId]
            );

            res.status(200).json({ message: 'Password updated successfully' });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error updating password:', error);
        res.status(500).json({ error: 'Failed to update password', details: error.message });
    }
});

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
        console.error('Error fetching user activities:', error);
        res.status(500).json({ error: 'Failed to fetch user activities', details: error.message });
    }
});

app.get('/api/calendar/events', authenticateJWT, async (req, res) => {
    try {
        const { start_date, end_date, category_id } = req.query;

        if (!start_date || !end_date) {
            return res.status(400).json({ error: 'Start date and end date are required' });
        }

        const connection = await pool.getConnection();
        try {
            let query = `
                SELECT e.*, c.category_name 
                FROM events e
                LEFT JOIN eventcategories c ON e.category_id = c.category_id
                WHERE e.event_date BETWEEN ? AND ?
            `;

            const queryParams = [start_date, end_date];

            if (category_id && category_id !== 'all') {
                query += ' AND e.category_id = ?';
                queryParams.push(category_id);
            }

            query += ' ORDER BY e.event_date ASC';

            const [events] = await connection.query(query, queryParams);

            res.status(200).json(events);
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error fetching calendar events:', error);
        res.status(500).json({ error: 'Failed to fetch calendar events', details: error.message });
    }
});

app.get('/api/calendar/events/:date', authenticateJWT, async (req, res) => {
    try {
        const date = req.params.date;

        if (!date) {
            return res.status(400).json({ error: 'Date parameter is required' });
        }

        const connection = await pool.getConnection();
        try {
            const [events] = await connection.query(`
                SELECT e.*, c.category_name 
                FROM events e
                LEFT JOIN eventcategories c ON e.category_id = c.category_id
                WHERE DATE(e.event_date) = DATE(?)
                ORDER BY e.event_date ASC
            `, [date]);

            res.status(200).json(events);
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error fetching events for date:', error);
        res.status(500).json({ error: 'Failed to fetch events for date', details: error.message });
    }
});

app.get('/api/calendar/dates-with-events', authenticateJWT, async (req, res) => {
    try {
        const { year, month } = req.query;

        if (!year || !month) {
            return res.status(400).json({ error: 'Year and month parameters are required' });
        }

        const connection = await pool.getConnection();
        try {
            const [results] = await connection.query(`
                SELECT DISTINCT DATE(event_date) as date
                FROM events
                WHERE YEAR(event_date) = ? 
                AND MONTH(event_date) = ?
                ORDER BY date ASC
            `, [year, month]);

            const dates = results.map(row => row.date);

            res.status(200).json(dates);
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error fetching dates with events:', error);
        res.status(500).json({ error: 'Failed to fetch dates with events', details: error.message });
    }
});

app.get('/api/admin/stats', authenticateJWT, authorizeRole(['admin']), async (req, res) => {
    try {
        const connection = await pool.getConnection();
        try {
            const [userStats] = await connection.query('SELECT COUNT(*) as totalUsers FROM users');
            const [eventStats] = await connection.query('SELECT COUNT(*) as totalEvents FROM events');
            const [reviewStats] = await connection.query('SELECT COUNT(*) as totalReviews FROM reviews');
            
            res.status(200).json({
                totalUsers: userStats[0].totalUsers,
                totalEvents: eventStats[0].totalEvents,
                totalReviews: reviewStats[0].totalReviews
            });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error fetching admin stats:', error);
        res.status(500).json({ error: 'Failed to fetch admin statistics', details: error.message });
    }
});

// Get all users (admin only)
app.get('/api/admin/users', authenticateJWT, authorizeRole(['admin']), async (req, res) => {
    try {
        const connection = await pool.getConnection();
        try {
            const [users] = await connection.query(
                'SELECT user_id, username, email, role, created_at FROM users ORDER BY created_at DESC'
            );
            res.status(200).json(users);
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users', details: error.message });
    }
});

// Update user role (admin only)
app.put('/api/admin/users/:userId/role', authenticateJWT, authorizeRole(['admin']), async (req, res) => {
    try {
        const userId = req.params.userId;
        const { role } = req.body;
        
        if (!role || !['user', 'admin'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role' });
        }
        
        const connection = await pool.getConnection();
        try {
            const [result] = await connection.query(
                'UPDATE users SET role = ? WHERE user_id = ?',
                [role, userId]
            );
            
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'User not found' });
            }
            
            res.status(200).json({ message: 'User role updated successfully' });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error updating user role:', error);
        res.status(500).json({ error: 'Failed to update user role', details: error.message });
    }
});

// Get pending reviews for moderation (admin only)
app.get('/api/admin/reviews/pending', authenticateJWT, authorizeRole(['admin']), async (req, res) => {
    try {
        const connection = await pool.getConnection();
        try {
            // Assuming you have a moderation_status field in your reviews table
            // If not, you'll need to add this column
            const [reviews] = await connection.query(`
                SELECT r.*, u.username, e.name as event_name 
                FROM reviews r
                JOIN users u ON r.user_id = u.user_id
                JOIN events e ON r.event_id = e.event_id
                WHERE r.moderation_status = 'pending' OR r.moderation_status IS NULL
                ORDER BY r.created_at DESC
            `);
            
            res.status(200).json(reviews);
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error fetching pending reviews:', error);
        res.status(500).json({ error: 'Failed to fetch pending reviews', details: error.message });
    }
});

// Moderate a review (admin only)
app.put('/api/admin/reviews/:reviewId/moderate', authenticateJWT, authorizeRole(['admin']), async (req, res) => {
    try {
        const reviewId = req.params.reviewId;
        const { status } = req.body;
        
        if (!status || !['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }
        
        const connection = await pool.getConnection();
        try {
            const [result] = await connection.query(
                'UPDATE reviews SET moderation_status = ? WHERE review_id = ?',
                [status, reviewId]
            );
            
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Review not found' });
            }
            
            res.status(200).json({ message: 'Review moderation status updated successfully' });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error moderating review:', error);
        res.status(500).json({ error: 'Failed to moderate review', details: error.message });
    }
});

app.get('/', (req, res) => {
    res.status(200).send('Railway Deployment Healthy');
});

app.listen(port, () => {
    console.log(`Server is running on port http://localhost:${port}`);
    testDatabaseConnection();
});
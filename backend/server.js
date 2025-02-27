require('dotenv').config(); // Load environment variables from .env file

const express = require('express');
const mysql = require('mysql2/promise'); // Import mysql2/promise for promise-based API
const cors = require('cors');
const bcrypt = require('bcrypt'); // For password hashing
const jwt = require('jsonwebtoken'); // For JWT token generation

const app = express();

// Add middleware to parse JSON request bodies
app.use(cors());
app.use(express.json());

const port = process.env.PORT || 5000;

// Database connection pool configuration
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: process.env.DB_PORT || 3306,
    connectionLimit: 10
});

// Test database connection
async function testDatabaseConnection() {
    let connection;
    try {
        connection = await pool.getConnection();
        const [rows, fields] = await connection.query('SELECT 1 + 1 AS solution');
        console.log('Database connection successful!');
        console.log('Test query result:', rows[0].solution);
    } catch (error) {
        console.error('Database connection failed:', error);
        console.error('Error details:', error); // Print full error details for debugging
    } finally {
        if (connection) {
            connection.release(); // Release connection back to the pool
        }
    }
}

testDatabaseConnection(); // Run the database connection test when server starts

// ------------------- JWT Middleware for Protected Routes -------------------

const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (authHeader) {
        const token = authHeader.split(' ')[1]; // Extract token from "Bearer <token>"

        jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
            if (err) {
                console.error('JWT Verification Error:', err); // Log detailed error for debugging
                return res.sendStatus(403); // 403 Forbidden - Token invalid or expired
            }

            req.user = user; // Attach user info from token to the request object
            next(); // Proceed to the next middleware or route handler

        });
    } else {
        res.sendStatus(401); // 401 Unauthorized - No token provided
    }
};

// ------------------- Authentication API Endpoints -------------------

// POST /api/register - User Registration
app.post('/api/register', async (req, res) => {
    try {
        const { username, password } = req.body;

        // 1. Basic input validation
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required.' });
        }

        // 2. Check if username already exists
        const connection = await pool.getConnection();
        try {
            const [existingUsers] = await connection.query(
                'SELECT * FROM Users WHERE username = ?',
                [username]
            );
            if (existingUsers.length > 0) {
                return res.status(409).json({ error: 'Username already taken.' }); // 409 Conflict for resource conflict
            }

            // 3. Hash the password
            const saltRounds = 10; // Recommended salt rounds for bcrypt
            const passwordHash = await bcrypt.hash(password, saltRounds);

            // 4. Insert new user into database - **Include email with a placeholder value**
            const placeholderEmail = `${username}@example.com`; // Using username as placeholder email
            const [result] = await connection.query(
                'INSERT INTO Users (username, password_hash, email) VALUES (?, ?, ?)', // **Include 'email' in INSERT columns**
                [username, passwordHash, placeholderEmail] // **Include placeholderEmail in values**
            );

            // 5. Send success response
            res.status(201).json({ message: 'User registered successfully', userId: result.insertId }); // 201 Created

        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ error: 'Registration failed', details: error.message }); // 500 Internal Server Error
    }
});



// POST /api/login - User Login and JWT Generation
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // 1. Input validation
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required.' });
        }

        // 2. Retrieve user from database
        const connection = await pool.getConnection();
        try {
            const [users] = await connection.query(
                'SELECT * FROM Users WHERE username = ?',
                [username]
            );
            if (users.length === 0) {
                return res.status(401).json({ error: 'Invalid credentials' }); // 401 Unauthorized - incorrect username
            }
            const user = users[0]; // Get the first user from the results

            // 3. Compare password hashes
            const passwordMatch = await bcrypt.compare(password, user.password_hash);
            if (!passwordMatch) {
                return res.status(401).json({ error: 'Invalid credentials' }); // 401 Unauthorized - incorrect password
            }

            // 4. Generate JWT token
            const payload = { userId: user.user_id, username: user.username }; // Payload data
            const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' }); // Token expires in 1 hour

            // 5. Send successful login response with JWT token
            res.status(200).json({ message: 'Login successful', token: token }); // 200 OK

        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server configuration error' }); // 500 Internal Server Error - generic error for login failures
    }
});

// ------------------- Protected API Endpoint -------------------

// GET /api/protected - Requires JWT authentication
app.get('/api/protected', authenticateJWT, (req, res) => {
    // If authenticateJWT middleware succeeds (calls next()), we reach here, meaning user is authenticated

    res.json({
        message: 'Protected endpoint accessed successfully!',
        user: req.user, // You can access user information from req.user (set by authenticateJWT)
        timestamp: new Date().toISOString()
    });
});

// ------------------- Existing Event and Category API Endpoints (No Changes Here) -------------------

// POST /api/events - Create a new event
app.post('/api/events', async (req, res) => { // ... (rest of your existing /api/events POST route code - no changes) ...
    try {
        // 1. Extract event data from request body
        // Modified line to include user_id from req.body
        const { user_id, name, description, location, event_date, category_id } = req.body;

        // 2. Basic input validation (ensure name and category_id are provided)
        if (!name || !category_id) {
            return res.status(400).json({ error: 'Name and Category ID are required.' });
        }

        // 3. Get database connection from the pool
        const connection = await pool.getConnection();

        try {
            // 4. Construct and execute SQL INSERT query (using parameterized query)
            // Modified INSERT query to include user_id in the columns and values
            const [result] = await connection.query(
                'INSERT INTO Events (user_id, category_id, name, description, location, event_date) VALUES (?, ?, ?, ?, ?, ?)',
                // Modified parameter array to include user_id at the beginning
                [user_id, category_id, name, description, location, event_date]
            );

            // 5. Get the newly inserted event ID
            const eventId = result.insertId;

            // 6. Fetch the newly created event from the database to return in response
            const [newEventRows] = await connection.query(
                'SELECT * FROM Events WHERE event_id = ?',
                [eventId]
            );
            const newEvent = newEventRows[0]; // Assuming only one event is returned

            // 7. Send successful response (201 Created) with the new event data
            res.status(201).json(newEvent);

        } finally {
            connection.release(); // Release the connection back to the pool in finally block
        }

    } catch (error) {
        // 8. Handle errors (e.g., database errors, validation errors)
        console.error('Error creating event:', error);
        res.status(500).json({ error: 'Failed to create event.', details: error.message }); // Send 500 error with a generic message and error details for debugging
    }
});

// GET /api/events - Get all events - WITH PAGINATION AND SORTING
app.get('/api/events', async (req, res) => { // ... (rest of your existing /api/events GET route code - no changes) ...
    console.log(`GET /api/events - Start processing request, query parameters:`, req.query);

    // 1. Pagination parameters (from query parameters, with defaults)
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // 2. Sorting parameters (new!)
    const sortBy = req.query.sort_by;
    const sortOrder = req.query.sort_order;

    console.log(`GET /api/events - Pagination parameters: page=${page}, limit=${limit}, offset=${offset}`);
    console.log(`GET /api/events - Sorting parameters: sortBy=${sortBy}, sortOrder=${sortOrder}`); // Log sorting parameters

    // 3. Validate and sanitize sort_by and sort_order
    let orderByClause = '';
    const validSortFields = ['name', 'event_date', 'category_id']; // Valid fields to sort by
    const validSortOrders = ['asc', 'desc'];
    let sqlSortBy = null; // Variable to hold validated sort field for SQL query

    if (sortBy && validSortFields.includes(sortBy)) {
        sqlSortBy = sortBy; // Use the provided sortBy if it's valid
        let sqlSortOrder = 'ASC'; // Default sort order is ASC
        if (sortOrder && validSortOrders.includes(sortOrder.toLowerCase())) {
            sqlSortOrder = sortOrder.toUpperCase(); // Use provided sortOrder if valid, convert to uppercase for SQL
        }
        orderByClause = `ORDER BY ${sqlSortBy} ${sqlSortOrder}`; // Construct ORDER BY clause
        console.log(`GET /api/events - ORDER BY clause: ${orderByClause}`); // Log ORDER BY clause
    } else if (sortBy) {
        console.log(`GET /api/events - Invalid sort_by field: ${sortBy}. Sorting will be disabled.`); // Log invalid sort field
    }


    // 4. Database connection
    try {
        const connection = await pool.getConnection();
        console.log(`GET /api/events - Database connection acquired`);

        try {
            // --- 4.3.1: Get total count of events (for metadata) ---
            const countQuery = 'SELECT COUNT(*) AS total_count FROM Events';
            console.log(`GET /api/events - SQL query for total count: ${countQuery}`);
            const [countResult] = await connection.query(countQuery);
            const totalCount = countResult[0].total_count;
            console.log(`GET /api/events - Total events count: ${totalCount}`);

            // --- 4.3.2 & 6.1: Modified SQL query with LIMIT, OFFSET, and ORDER BY (if applicable) ---
            let eventsQuery = 'SELECT * FROM Events'; // Base query
            if (orderByClause) {
                eventsQuery += ` ${orderByClause}`; // Append ORDER BY if sorting is enabled
            }
            eventsQuery += ' LIMIT ? OFFSET ?'; // Append pagination LIMIT and OFFSET
            const sqlParams = [limit, offset];
            console.log(`GET /api/events - SQL query for events: ${eventsQuery} Parameters:`, sqlParams);
            const [rows] = await connection.query(eventsQuery, sqlParams);

            // --- 4.3.3: Calculate pagination metadata ---
            const totalPages = Math.ceil(totalCount / limit);
            const currentPage = page;
            const perPage = limit;

            // --- 4.3.4: Add pagination metadata to response headers ---
            res.setHeader('X-Total-Count', totalCount);
            res.setHeader('X-Total-Pages', totalPages);
            res.setHeader('X-Current-Page', currentPage);
            res.setHeader('X-Per-Page', perPage);

            // 5. Send response with events (and metadata in headers!)
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

// GET /api/events/:eventId - Get details of a specific event by ID
app.get('/api/events/:eventId', async (req, res) => { // ... (rest of your existing /api/events/:eventId GET route code - no changes) ...
    try {
        // 1. Extract eventId from request parameters
        const eventId = req.params.eventId; // Access path parameter using req.params

        // 2. Get database connection from the pool
        const connection = await pool.getConnection();

        try {
            // 3. Construct and execute SQL SELECT query to get event by ID (parameterized query)
            const [rows] = await connection.query(
                'SELECT * FROM Events WHERE event_id = ?',
                [eventId]
            );

            // 4. Check if an event was found
            if (rows.length === 0) {
                // If no event found with that ID, return 404 Not Found
                return res.status(404).json({ error: 'Event not found' });
            }

            // 5. If event found, send successful response (200 OK) with the event data
            const event = rows[0]; // Assuming only one event is returned (since event_id is unique)
            res.status(200).json(event);

        } finally {
            connection.release(); // Release connection back to the pool
        }

    } catch (error) {
        // 6. Handle errors (e.g., database errors, invalid eventId format if needed)
        console.error('Error fetching event details:', error);
        res.status(500).json({ error: 'Failed to fetch event details.', details: error.message }); // Send 500 error
    }
});


// PUT /api/events/:eventId - Update an existing event by ID
app.put('/api/events/:eventId', async (req, res) => { // ... (rest of your existing /api/events/:eventId PUT route code - no changes) ...
    try {
        // 1. Extract eventId from request parameters
        const eventId = req.params.eventId;

        // 2. Extract updated event data from request body
        const { name, description, location, event_date, category_id } = req.body;

        // 3. Basic validation (optional, but recommended - you can enhance this)
        if (!name && !description && !location && !event_date && !category_id) {
            return res.status(400).json({ error: 'No fields to update provided.' }); // If no fields are sent to update
        }

        // 4. Get database connection from the pool
        const connection = await pool.getConnection();

        try {
            // 5. Construct the UPDATE SQL query dynamically
            let updateQuery = 'UPDATE Events SET ';
            const updateValues = [];
            const updates = []; // Array to build SET clauses

            if (category_id !== undefined) { updates.push('category_id = ?'); updateValues.push(category_id); }
            if (name !== undefined) { updates.push('name = ?'); updateValues.push(name); }
            if (description !== undefined) { updates.push('description = ?'); updateValues.push(description); }
            if (location !== undefined) { updates.push('location = ?'); updateValues.push(location); }
            if (event_date !== undefined) { updates.push('event_date = ?'); updateValues.push(event_date); }

            updateQuery += updates.join(', '); // Join the SET clauses with commas
            updateQuery += ' WHERE event_id = ?'; // Add WHERE clause to update specific event
            updateValues.push(eventId); // Add eventId to the values array for the WHERE clause

            // 6. Execute the UPDATE query
            const [result] = await connection.query(updateQuery, updateValues);

            // 7. Check if any rows were affected (if event with given ID existed)
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Event not found' }); // Event not found
            }

            // 8. Fetch the updated event from the database to return in response
            const [updatedEventRows] = await connection.query(
                'SELECT * FROM Events WHERE event_id = ?',
                [eventId]
            );
            const updatedEvent = updatedEventRows[0];

            // 9. Send successful response (200 OK) with the updated event data
            res.status(200).json(updatedEvent);

        } finally {
            connection.release(); // Release connection back to the pool
        }

    } catch (error) {
        // 10. Handle errors (e.g., database errors, validation errors)
        console.error('Error updating event:', error);
        res.status(500).json({ error: 'Failed to update event.', details: error.message }); // Send 500 error
    }
});

// DELETE /api/events/:eventId - Delete an event by ID
app.delete('/api/events/:eventId', async (req, res) => { // ... (rest of your existing /api/events/:eventId DELETE route code - no changes) ...
    try {
        // 1. Extract eventId from request parameters
        const eventId = req.params.eventId;

        // 2. Get database connection from the pool
        const connection = await pool.getConnection();

        try {
            // 3. Construct and execute SQL DELETE query (parameterized query)
            const [result] = await connection.query(
                'DELETE FROM Events WHERE event_id = ?',
                [eventId]
            );

            // 4. Check if any rows were affected (if event with given ID existed and was deleted)
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Event not found' }); // Event not found
            }

            // 5. If event was successfully deleted, send 204 No Content response
            res.status(204).send(); // 204 No Content - successful deletion, no response body needed

        } finally {
            connection.release(); // Release connection back to the pool
        }

    } catch (error) {
        // 6. Handle errors (e.g., database errors)
        console.error('Error deleting event:', error);
        res.status(500).json({ error: 'Failed to delete event.', details: error.message }); // Send 500 error
    }
});

// POST /api/categories - Create a new event category
app.post('/api/categories', async (req, res) => { // ... (rest of your existing /api/categories POST route code - no changes) ...
    try {
        // 1. Extract category name from request body
        const { name } = req.body;

        // 2. Basic input validation (ensure name is provided)
        if (!name) {
            return res.status(400).json({ error: 'Category name is required.' });
        }

        // 3. Get database connection from the pool
        const connection = await pool.getConnection();

        try {
            // 4. Construct and execute SQL INSERT query (using parameterized query)
            const [result] = await connection.query(
                'INSERT INTO EventCategories (category_name) VALUES (?)',
                [name]
            );

            // 5. Get the newly inserted category ID
            const categoryId = result.insertId;

            // 6. Fetch the newly created category from the database to return in response
            const [newCategoryRows] = await connection.query(
                'SELECT * FROM EventCategories WHERE category_id = ?',
                [categoryId]
            );
            const newCategory = newCategoryRows[0]; // Assuming only one category is returned

            // 7. Send successful response (201 Created) with the new category data
            res.status(201).json(newCategory);

        } finally {
            connection.release(); // Release the connection back to the pool
        }

    } catch (error) {
        // 8. Handle errors (e.g., database errors, validation errors)
        console.error('Error creating category:', error);
        res.status(500).json({ error: 'Failed to create category.', details: error.message }); // Send 500 error with a generic message and error details for debugging
    }
});

// GET /api/categories - Get all event categories - WITH PAGINATION
app.get('/api/categories', async (req, res) => { // ... (rest of your existing /api/categories GET route code - no changes) ...
    console.log(`GET /api/categories - Start processing request, query parameters:`, req.query);

    // 1. Pagination parameters (from query parameters, with defaults)
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    console.log(`GET /api/categories - Pagination parameters: page=${page}, limit=${limit}, offset=${offset}`);

    // 2. Database connection
    try {
        const connection = await pool.getConnection();
        console.log(`GET /api/categories - Database connection acquired`);

        try {
            // --- 4.3.1 (Adapted): Get total count of categories ---
            const countQuery = 'SELECT COUNT(*) AS total_count FROM EventCategories'; // Count for categories
            console.log(`GET /api/categories - SQL query for total count: ${countQuery}`);
            const [countResult] = await connection.query(countQuery);
            const totalCount = countResult[0].total_count;
            console.log(`GET /api/categories - Total categories count: ${totalCount}`);

            // --- 4.3.2 (Adapted): Modified SQL query with LIMIT and OFFSET (for categories) ---
            const categoriesQuery = 'SELECT * FROM EventCategories LIMIT ? OFFSET ?'; // Query for categories
            const sqlParams = [limit, offset];
            console.log(`GET /api/categories - SQL query for categories: ${categoriesQuery} Parameters:`, sqlParams);
            const [rows] = await connection.query(categoriesQuery, sqlParams);

            // --- 4.3.3: Calculate pagination metadata ---
            const totalPages = Math.ceil(totalCount / limit);
            const currentPage = page;
            const perPage = limit;

            // --- 4.3.4: Add pagination metadata to response headers ---
            res.setHeader('X-Total-Count', totalCount);
            res.setHeader('X-Total-Pages', totalPages);
            res.setHeader('X-Current-Page', currentPage);
            res.setHeader('X-Per-Page', perPage);

            // 5. Send response with categories and pagination metadata
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

// GET /api/categories/:categoryId - Get details of a specific category by ID
app.get('/api/categories/:categoryId', async (req, res) => { // ... (rest of your existing /api/categories/:categoryId GET route code - no changes) ...
    try {
        // 1. Extract categoryId from request parameters
        const categoryId = req.params.categoryId; // Access path parameter using req.params

        // 2. Get database connection from the pool
        const connection = await pool.getConnection();

        try {
            // 3. Construct and execute SQL SELECT query to get category by ID (parameterized query)
            const [rows] = await connection.query(
                'SELECT * FROM EventCategories WHERE category_id = ?',
                [categoryId]
            );

            // 4. Check if a category was found
            if (rows.length === 0) {
                // If no category found with that ID, return 404 Not Found
                return res.status(404).json({ error: 'Category not found' });
            }

            // 5. If category found, send successful response (200 OK) with the category data
            const category = rows[0]; // Assuming only one category is returned (since category_id is unique)
            res.status(200).json(category);

        } finally {
            connection.release(); // Release connection back to the pool
        }

    } catch (error) {
        // 6. Handle errors (e.g., database errors, invalid categoryId format if needed)
        console.error('Error fetching category details:', error);
        res.status(500).json({ error: 'Failed to fetch category details.', details: error.message }); // Send 500 error
    }
});

// PUT /api/categories/:categoryId - Update an existing category by ID
app.put('/api/categories/:categoryId', async (req, res) => { // ... (rest of your existing /api/categories/:categoryId PUT route code - no changes) ...
    try {
        // 1. Extract categoryId from request parameters
        const categoryId = req.params.categoryId;
        console.log(`PUT /api/categories/${categoryId}s - Start processing request`); // Added log

        // 2. Extract updated category data from request body
        const { name, description } = req.body; // Allow updating name and description

        // 3. Basic validation (optional, but recommended - you can enhance this)
        if (!name && !description) {
            return res.status(400).json({ error: 'No fields to update provided.' }); // If no fields are sent to update
        }

        // 4. Get database connection from the pool
        const connection = await pool.getConnection();
        console.log(`PUT /api/categories/${categoryId} - Database connection acquired`); // Added log

        try {
            // 5. Construct the UPDATE SQL query dynamically
            let updateQuery = 'UPDATE EventCategories SET ';
            const updateValues = [];
            const updates = []; // Array to build SET clauses

            if (name !== undefined) { updates.push('category_name = ?'); updateValues.push(name); } // Use category_name here
            if (description !== undefined) { updates.push('description = ?'); updateValues.push(description); }

            updateQuery += updates.join(', '); // Join the SET clauses with commas
            updateQuery += ' WHERE category_id = ?'; // Add WHERE clause to update specific category
            updateValues.push(categoryId); // Add categoryId to the values array for the WHERE clause

            // 6. Execute the UPDATE query
            const [result] = await connection.query(updateQuery, updateValues);
            console.log(`PUT /api/categories/${categoryId} - UPDATE query executed. affectedRows: ${result.affectedRows}`); // Added log

            // 7. Check if any rows were affected (if category with given ID existed)
            if (result.affectedRows === 0) {
                console.log(`PUT /api/categories/${categoryId} - affectedRows is 0, category not found`); // Added log
                return res.status(404).json({ error: 'Category not found' }); // Category not found
            }

            // 8. Fetch the updated category from the database to return in response
            const [updatedCategoryRows] = await connection.query(
                'SELECT * FROM EventCategories WHERE category_id = ?',
                [categoryId]
            );
            const updatedCategory = updatedCategoryRows[0];

            // 9. Send successful response (200 OK) with the updated category data
            res.status(200).json(updatedCategory);
            console.log(`PUT /api/categories/${categoryId} - Successful update, 200 response sent`); // Added log


        } finally {
            connection.release(); // Release connection back to the pool
            console.log(`PUT /api/categories/${categoryId} - Database connection released`); // Added log
        }

    } catch (error) {
        // 10. Handle errors (e.g., database errors, validation errors)
        console.error('Error updating category:', error);
        res.status(500).json({ error: 'Failed to update category.', details: error.message }); // Send 500 error
    }
});

// DELETE /api/categories/:categoryId - Delete a category by ID
app.delete('/api/categories/:categoryId', async (req, res) => { // ... (rest of your existing /api/categories/:categoryId DELETE route code - no changes) ...
    console.log(`DELETE /api/categories/${req.params.categoryId} - Start processing request`); // Added log
    try {
        // 1. Extract categoryId from request parameters
        const categoryId = req.params.categoryId;

        // 2. Get database connection from the pool
        const connection = await pool.getConnection();
        console.log(`DELETE /api/categories/${categoryId} - Database connection acquired`); // Added log

        try {
            // 3. Construct and execute SQL DELETE query (parameterized query)
            const [result] = await connection.query(
                'DELETE FROM EventCategories WHERE category_id = ?',
                [categoryId]
            );
            console.log(`DELETE /api/categories/${categoryId} - DELETE query executed. affectedRows: ${result.affectedRows}`); // Added log

            // 4. Check if any rows were affected (if category with given ID existed and was deleted)
            if (result.affectedRows === 0) {
                console.log(`DELETE /api/categories/${categoryId} - affectedRows is 0, category not found`); // Added log
                return res.status(404).json({ error: 'Category not found' }); // Category not found
            }

            // 5. If category was successfully deleted, send 204 No Content response
            res.status(204).send(); // 204 No Content - successful deletion, no response body needed
            console.log(`DELETE /api/categories/${categoryId} - Successful deletion, 204 response sent`); // Added log

        } finally {
            connection.release(); // Release connection back to the pool
            console.log(`DELETE /api/categories/${categoryId} - Database connection released`); // Added log
        }

    } catch (error) {
        // 6. Handle errors (e.g., database errors)
        console.error('Error deleting category:', error);
        res.status(500).json({ error: 'Failed to delete category.', details: error.message }); // Send 500 error
    }
});

// ------------------- Dashboard API Endpoints -------------------

// GET /api/dashboard/stats - Get dashboard statistics
app.get('/api/dashboard/stats', authenticateJWT, async (req, res) => {
    try {
        const connection = await pool.getConnection();
        try {
            // Get stats for the dashboard
            const [stats] = await connection.query(`
                SELECT 
                    (SELECT COUNT(*) FROM Events) AS totalEvents,
                    (SELECT COUNT(*) FROM Events WHERE event_date >= CURDATE()) AS upcomingEvents,
                    (SELECT COUNT(*) FROM Events WHERE event_date < CURDATE()) AS completedEvents,
                    (SELECT SUM(attendees) FROM Events) AS totalAttendees
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

// GET /api/events/upcoming - Get upcoming events
app.get('/api/events/upcoming', authenticateJWT, async (req, res) => {
    try {
        const connection = await pool.getConnection();
        try {
            // Get upcoming events (limited to next 5)
            const [events] = await connection.query(`
                SELECT * FROM Events 
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

// GET /api/events/past - Get past events with review info
app.get('/api/events/past', authenticateJWT, async (req, res) => {
    try {
        const connection = await pool.getConnection();
        try {
            // Get past events with review count and average rating
            const [events] = await connection.query(`
                SELECT e.*, 
                    (SELECT COUNT(*) FROM reviews r WHERE r.event_id = e.event_id) AS review_count,
                    (SELECT AVG(rating) FROM reviews r WHERE r.event_id = e.event_id) AS avg_rating
                FROM Events e
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

// GET /api/events/:eventId/reviews - Get reviews for a specific event
app.get('/api/events/:eventId/reviews', authenticateJWT, async (req, res) => {
    try {
        const eventId = req.params.eventId;
        const connection = await pool.getConnection();
        
        try {
            // Get all reviews for this event with username
            const [reviews] = await connection.query(`
                SELECT r.*, u.username 
                FROM reviews r
                JOIN Users u ON r.user_id = u.user_id
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

// POST /api/events/:eventId/reviews - Add a review to an event
app.post('/api/events/:eventId/reviews', authenticateJWT, async (req, res) => {
    try {
        const eventId = req.params.eventId;
        const userId = req.user.userId; // Get from JWT token
        const { review_text, rating } = req.body;
        
        // Validate rating is between 1-5
        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ error: 'Rating must be between 1 and 5.' });
        }
        
        const connection = await pool.getConnection();
        try {
            // Check if event exists
            const [eventCheck] = await connection.query(
                'SELECT * FROM Events WHERE event_id = ?',
                [eventId]
            );
            
            if (eventCheck.length === 0) {
                return res.status(404).json({ error: 'Event not found.' });
            }
            
            // Check if user already reviewed this event
            const [existingReview] = await connection.query(
                'SELECT * FROM reviews WHERE event_id = ? AND user_id = ?',
                [eventId, userId]
            );
            
            if (existingReview.length > 0) {
                return res.status(409).json({ error: 'You have already reviewed this event.' });
            }
            
            // Create new review
            const [result] = await connection.query(
                'INSERT INTO reviews (event_id, user_id, review_text, rating) VALUES (?, ?, ?, ?)',
                [eventId, userId, review_text, rating]
            );
            
            // Get the newly created review
            const [newReview] = await connection.query(
                'SELECT r.*, u.username FROM reviews r JOIN Users u ON r.user_id = u.user_id WHERE r.review_id = ?',
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

app.get('/', (req, res) => {
    res.send('Hello from Evently Backend! (Database connection status in console)');
});

app.listen(port, () => {
    console.log(`Server is running on port http://localhost:${port}`);
});
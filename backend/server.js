// backend/server.js
require('dotenv').config(); // Load environment variables from .env file

const express = require('express');
const mysql = require('mysql2/promise'); // Import mysql2/promise for promise-based API

const app = express();

// Add middleware to parse JSON request bodies
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

// POST /api/events - Create a new event
app.post('/api/events', async (req, res) => {
    try {
        // 1. Extract event data from request body
        const { name, description, location, event_date, category_id } = req.body;

        // 2. Basic input validation (ensure name and category_id are provided)
        if (!name || !category_id) {
            return res.status(400).json({ error: 'Name and Category ID are required.' });
        }

        // 3. Get database connection from the pool
        const connection = await pool.getConnection();

        try {
            // 4. Construct and execute SQL INSERT query (using parameterized query)
            const [result] = await connection.query(
                'INSERT INTO Events (category_id, name, description, location, event_date) VALUES (?, ?, ?, ?, ?)',
                [category_id, name, description, location, event_date]
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

// GET /api/events - Get all events
app.get('/api/events', async (req, res) => {
    try {
        // 1. Get database connection from the pool
        const connection = await pool.getConnection();

        try {
            // 2. Construct and execute SQL SELECT query to get all events
            const [rows] = await connection.query('SELECT * FROM Events');

            // 3. Send successful response (200 OK) with the array of events
            res.status(200).json(rows); // 'rows' is already an array of event objects

        } finally {
            connection.release(); // Release connection back to the pool
        }

    } catch (error) {
        // 4. Handle errors (e.g., database errors)
        console.error('Error fetching events:', error);
        res.status(500).json({ error: 'Failed to fetch events.', details: error.message }); // Send 500 error
    }
});

// GET /api/events/:eventId - Get details of a specific event by ID
app.get('/api/events/:eventId', async (req, res) => {
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
app.put('/api/events/:eventId', async (req, res) => {
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

app.get('/', (req, res) => {
    res.send('Hello from Evently Backend! (Database connection status in console)');
});

app.listen(port, () => {
    console.log(`Server is running on port http://localhost:${port}`);
});
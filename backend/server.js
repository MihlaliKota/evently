// backend/server.js
require('dotenv').config(); // Load environment variables from .env file

const express = require('express');
const mysql = require('mysql2/promise'); // Import mysql2/promise for promise-based API

const app = express();
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

app.get('/', (req, res) => {
    res.send('Hello from Evently Backend! (Database connection status in console)');
});

app.listen(port, () => {
    console.log(`Server is running on port http://localhost:${port}`);
});
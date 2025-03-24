require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const corsOptions = require('./config/cors');
const { errorHandler } = require('./middleware/error');
const uploadMiddleware = require('./middleware/upload');

// Import routes
const authRoutes = require('./routes/authRoutes');
const eventRoutes = require('./routes/eventRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const userRoutes = require('./routes/userRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

// Initialize app
const app = express();

// Apply middleware
app.use(express.json());
app.use(cors(corsOptions));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Register routes
app.use('/api/auth', authRoutes);  // For login/register
app.use('/api/events', eventRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health check route
app.get('/', (req, res) => {
  res.status(200).send('Evently API - Running');
});

// Error handling middleware (must be after all routes)
app.use(errorHandler);

// Start server
const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  
  // Test database connection on startup
  (async () => {
    const pool = require('./config/database');
    let connection;
    try {
      connection = await pool.getConnection();
      const [rows] = await connection.query('SELECT 1 + 1 AS solution');
      console.log('Database connection successful! Test result:', rows[0].solution);
    } catch (error) {
      console.error('Database connection failed:', error.message);
    } finally {
      if (connection) connection.release();
    }
  })();
});

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION:', err);
  if (process.env.NODE_ENV === 'development') {
    process.exit(1);
  }
});
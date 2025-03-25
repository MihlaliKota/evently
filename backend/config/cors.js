// backend/config/cors.js
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'https://evently-five-pi.vercel.app',
    'https://evently-production-cd21.up.railway.app',
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['X-Total-Count', 'X-Total-Pages', 'X-Current-Page', 'X-Per-Page'], // For pagination headers
  credentials: true,
  optionsSuccessStatus: 200,
  maxAge: 86400 // 24 hours
};

module.exports = corsOptions;
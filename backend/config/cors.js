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

module.exports = corsOptions;
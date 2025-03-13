class AppError extends Error {
    constructor(message, statusCode) {
      super(message);
      this.statusCode = statusCode;
      this.isOperational = true;
      Error.captureStackTrace(this, this.constructor);
    }
  }
  
  const errorHandler = (err, req, res, next) => {
    console.error(`Error: ${err.message}`, err);
    
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
      error: err.message || 'Server error occurred',
      details: process.env.NODE_ENV === 'production' ? null : err.stack
    });
  };
  
  module.exports = { AppError, errorHandler };
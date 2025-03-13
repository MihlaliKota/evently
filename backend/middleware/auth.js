const jwt = require('jsonwebtoken');
const { AppError } = require('./error');

const authenticateJWT = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      throw new AppError('Authentication required', 401);
    }
    
    const token = authHeader.split(' ')[1];
    
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        throw new AppError('Invalid or expired token', 403);
      }
      
      req.user = user;
      next();
    });
  } catch (error) {
    next(error);
  }
};

const authorizeRole = (roles = []) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized', 401);
      }
      
      if (roles.length > 0 && !roles.includes(req.user.role)) {
        throw new AppError('Forbidden - Insufficient permissions', 403);
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = { authenticateJWT, authorizeRole };
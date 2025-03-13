const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');
const { AppError } = require('../middleware/error');
const asyncHandler = require('../utils/asyncHandler');

const authController = {
  // Register a new user
  register: asyncHandler(async (req, res) => {
    const { username, email, password } = req.body;
    
    if (!username || !email || !password) {
      throw new AppError('All fields are required', 400);
    }
    
    if (!email.includes('@')) {
      throw new AppError('A valid email address is required', 400);
    }
    
    // Check if username or email already exists
    const existingUsername = await userModel.findByUsername(username);
    if (existingUsername) {
      throw new AppError('Username already taken', 409);
    }
    
    const existingEmail = await userModel.findByEmail(email);
    if (existingEmail) {
      throw new AppError('Email already registered', 409);
    }
    
    const user = await userModel.create({ username, email, password });
    
    res.status(201).json({
      message: 'User registered successfully',
      userId: user.userId,
      role: user.role
    });
  }),
  
  // Login user
  login: asyncHandler(async (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
      throw new AppError('Username and password are required', 400);
    }
    
    const user = await userModel.findByUsername(username);
    
    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }
    
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    
    if (!passwordMatch) {
      throw new AppError('Invalid credentials', 401);
    }
    
    if (!process.env.JWT_SECRET) {
      throw new AppError('Server configuration error - missing JWT secret', 500);
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
  })
};

module.exports = authController;
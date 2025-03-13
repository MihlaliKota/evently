const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: process.env.DB_PORT || 3306,
  connectionLimit: 20, 
  queueLimit: 30,
  waitForConnections: true,
  enableKeepAlive: true,
  keepAliveInitialDelay: 30000
});

module.exports = pool;
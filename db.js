require('dotenv').config();
require('dotenv').config();

const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

// Example connection check
connection.connect(error => {
  if (error) {
    console.error('Database connection failed:', error.stack);
    return;
  }
  console.log('Connected to Vultr MySQL database.');
});


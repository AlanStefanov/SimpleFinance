import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'finance_user',
  password: process.env.DB_PASSWORD || 'finance_pass',
  database: process.env.DB_NAME || 'simple_finance',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export default pool;

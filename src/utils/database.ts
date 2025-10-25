import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

let sslConfig: any = undefined;

if (process.env.DB_SSL_CA) {
  if (process.env.DB_SSL_CA.includes('BEGIN CERTIFICATE')) {
    // Inline certificate (for Pxxl or env variable)
    sslConfig = { ca: process.env.DB_SSL_CA };
  } else if (fs.existsSync(process.env.DB_SSL_CA)) {
    // File path (for local)
    sslConfig = { ca: fs.readFileSync(process.env.DB_SSL_CA) };
  }

  // Optional: SSL handshake issues
  sslConfig.rejectUnauthorized = false;
}

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
  ssl: sslConfig,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export default pool;

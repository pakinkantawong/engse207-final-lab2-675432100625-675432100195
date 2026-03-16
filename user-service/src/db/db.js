const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;
const useSsl = process.env.NODE_ENV === 'production' && Boolean(connectionString);

const pool = new Pool(
  connectionString
    ? {
        connectionString,
        ssl: useSsl ? { rejectUnauthorized: false } : false
      }
    : {
        host: process.env.DB_HOST || 'user-db',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        database: process.env.DB_NAME || 'userdb',
        user: process.env.DB_USER || 'admin',
        password: process.env.DB_PASSWORD || 'secret'
      }
);

async function initDB() {
  const sql = fs.readFileSync(path.join(__dirname, '../../init.sql'), 'utf8');
  await pool.query(sql);
  console.log('[user-db] Tables initialized');
}

module.exports = { pool, initDB };

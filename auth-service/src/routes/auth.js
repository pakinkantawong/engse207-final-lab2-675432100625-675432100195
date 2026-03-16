const express  = require('express');
const bcrypt   = require('bcryptjs');
const { pool } = require('../db/db');
const { generateToken, verifyToken } = require('../middleware/jwtUtils');

const router = express.Router();

// bcrypt hash ที่ valid จริง ใช้สำหรับ timing-safe compare
// ใช้กรณี "ไม่พบ user" เพื่อไม่ให้ behavior ต่างกันมากเกินไป
const DUMMY_BCRYPT_HASH =
  '$2b$10$CwTycUXWue0Thq9StjUM0uJ8y0R6VQwWi4KFOeFHrgb3R04QLbL7a';

async function insertLog({ level, event, userId = null, message, meta = null }) {
  try {
    await pool.query(
      `INSERT INTO logs (level, event, user_id, message, meta)
       VALUES ($1, $2, $3, $4, $5::jsonb)`,
      [level, event, userId, message, meta ? JSON.stringify(meta) : null]
    );
  } catch (err) {
    console.error('[AUTH] Failed to write log:', err.message);
  }
}

router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'username, email, and password are required' });
  }

  const normalizedUsername = String(username).trim();
  const normalizedEmail = String(email).trim().toLowerCase();

  if (normalizedUsername.length < 3) {
    return res.status(400).json({ error: 'username must be at least 3 characters' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'password must be at least 6 characters' });
  }

  try {
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE username = $1 OR email = $2',
      [normalizedUsername, normalizedEmail]
    );

    if (existingUser.rowCount > 0) {
      return res.status(409).json({ error: 'username or email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, username, email, role, created_at`,
      [normalizedUsername, normalizedEmail, passwordHash, 'member']
    );

    const user = result.rows[0];
    await insertLog({
      level: 'INFO',
      event: 'REGISTER_SUCCESS',
      userId: user.id,
      message: `User ${user.username} registered`,
      meta: { email: user.email, role: user.role }
    });

    res.status(201).json({
      message: 'Register successful',
      user
    });
  } catch (err) {
    console.error('[AUTH] Register error:', err.message);
    await insertLog({
      level: 'ERROR',
      event: 'REGISTER_ERROR',
      message: err.message,
      meta: { username: normalizedUsername, email: normalizedEmail }
    });
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();

  try {
    const result = await pool.query(
      'SELECT id, username, email, password_hash, role FROM users WHERE email = $1',
      [normalizedEmail]
    );

    const user = result.rows[0] || null;

    // Timing attack prevention
    const passwordHash = user ? user.password_hash : DUMMY_BCRYPT_HASH;
    const isValid = await bcrypt.compare(password, passwordHash);

    if (!user || !isValid) {
      await insertLog({
        level: 'WARN',
        event: 'LOGIN_FAILED',
        userId: user ? user.id : null,
        message: `Login failed for ${normalizedEmail}`,
        meta: { email: normalizedEmail }
      });

      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // อัปเดต last_login
    await pool.query(
      'UPDATE users SET last_login = NOW() WHERE id = $1',
      [user.id]
    );

    const token = generateToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      username: user.username
    });

    await insertLog({
      level: 'INFO',
      event: 'LOGIN_SUCCESS',
      userId: user.id,
      message: `User ${user.username} logged in`,
      meta: { username: user.username, role: user.role }
    });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });

  } catch (err) {
    console.error('[AUTH] Login error:', err.message);

    await insertLog({
      level: 'ERROR',
      event: 'LOGIN_ERROR',
      message: err.message,
      meta: { email: normalizedEmail }
    });

    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/verify', (req, res) => {
  const token = (req.headers['authorization'] || '').split(' ')[1];
  if (!token) return res.status(401).json({ valid: false, error: 'No token' });

  try {
    const decoded = verifyToken(token);
    res.json({ valid: true, user: decoded });
  } catch (err) {
    res.status(401).json({ valid: false, error: err.message });
  }
});

router.get('/me', async (req, res) => {
  const token = (req.headers['authorization'] || '').split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const decoded = verifyToken(token);
    const result = await pool.query(
      'SELECT id, username, email, role, created_at, last_login FROM users WHERE id = $1',
      [decoded.sub]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: result.rows[0] });
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

router.get('/health', (_, res) => {
  res.json({
    status: 'ok',
    service: 'auth-service',
    time: new Date()
  });
});

module.exports = router;

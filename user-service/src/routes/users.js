const express = require('express');
const { pool } = require('../db/db');
const requireAuth = require('../middleware/authMiddleware');

const router = express.Router();

async function insertLog({ level, event, userId = null, message, meta = null }) {
  try {
    await pool.query(
      `INSERT INTO logs (level, event, user_id, message, meta)
       VALUES ($1, $2, $3, $4, $5::jsonb)`,
      [level, event, userId, message, meta ? JSON.stringify(meta) : null]
    );
  } catch (err) {
    console.error('[USER] Failed to write log:', err.message);
  }
}

async function ensureProfile(user) {
  const existing = await pool.query(
    'SELECT * FROM user_profiles WHERE user_id = $1',
    [user.sub]
  );

  if (existing.rowCount > 0) {
    return existing.rows[0];
  }

  const created = await pool.query(
    `INSERT INTO user_profiles (user_id, username, email, role, display_name, bio, avatar_url, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
     RETURNING *`,
    [
      user.sub,
      user.username,
      user.email,
      user.role,
      user.username,
      '',
      ''
    ]
  );

  await insertLog({
    level: 'INFO',
    event: 'PROFILE_AUTO_CREATED',
    userId: user.sub,
    message: `Profile created for user ${user.username}`,
    meta: { user_id: user.sub }
  });

  return created.rows[0];
}

router.get('/health', (_, res) => {
  res.json({ status: 'ok', service: 'user-service' });
});

router.use(requireAuth);

router.get('/me', async (req, res) => {
  try {
    const profile = await ensureProfile(req.user);
    res.json({ profile });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/me', async (req, res) => {
  const { display_name, bio, avatar_url } = req.body;

  try {
    await ensureProfile(req.user);
    const result = await pool.query(
      `UPDATE user_profiles
       SET display_name = COALESCE($1, display_name),
           bio = COALESCE($2, bio),
           avatar_url = COALESCE($3, avatar_url),
           updated_at = NOW()
       WHERE user_id = $4
       RETURNING *`,
      [display_name, bio, avatar_url, req.user.sub]
    );

    await insertLog({
      level: 'INFO',
      event: 'PROFILE_UPDATED',
      userId: req.user.sub,
      message: `Profile updated for user ${req.user.username}`,
      meta: { user_id: req.user.sub }
    });

    res.json({ profile: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/', async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    const result = await pool.query(
      `SELECT * FROM user_profiles
       ORDER BY user_id ASC`
    );
    res.json({ users: result.rows, count: result.rowCount });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

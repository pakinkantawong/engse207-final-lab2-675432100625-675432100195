require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const morgan  = require('morgan');
const { initDB } = require('./db/db');
const authRoutes = require('./routes/auth');

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ──
app.use(cors());
app.use(express.json());

// Morgan: log ทุก request ในรูปแบบที่ Loki อ่านได้
morgan.token('body-size', (req) => {
  return req.body ? JSON.stringify(req.body).length + 'b' : '0b';
});
app.use(morgan(':method :url :status :response-time ms - body::body-size', {
  stream: {
    write: (msg) => console.log(msg.trim())  // stdout → Docker log driver
  }
}));

// ── Routes ──
app.use('/api/auth', authRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found', path: req.path });
});

// Error handler
app.use((err, req, res, _next) => {
  console.error('[ERROR]', err.message);
  res.status(500).json({ error: 'Internal Server Error' });
});

// ── Start ──
async function start() {
  let retries = 10;
  let initialized = false;

  while (retries > 0) {
    try {
      await initDB();
      initialized = true;
      break;
    } catch (err) {
      console.log(`[auth-service] Waiting for DB... (${retries} retries left)`);
      retries--;
      await new Promise(r => setTimeout(r, 3000));
    }
  }

  if (!initialized) {
    console.error('[auth-service] Failed to initialize database');
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`[auth-service] Running on port ${PORT}`);
    console.log(`[auth-service] JWT_EXPIRES: ${process.env.JWT_EXPIRES || process.env.JWT_EXPIRES_IN || '1h'}`);
  });
}

start().catch((err) => {
  console.error('[auth-service] Startup failed:', err.message);
  process.exit(1);
});

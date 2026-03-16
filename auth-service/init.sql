CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  username      VARCHAR(50) UNIQUE NOT NULL,
  email         VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          VARCHAR(20) DEFAULT 'member',
  created_at    TIMESTAMP DEFAULT NOW(),
  last_login    TIMESTAMP
);

CREATE TABLE IF NOT EXISTS logs (
  id         SERIAL PRIMARY KEY,
  level      VARCHAR(10) NOT NULL,
  event      VARCHAR(100) NOT NULL,
  user_id    INTEGER,
  message    TEXT,
  meta       JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO users (username, email, password_hash, role) VALUES
  ('alice', 'alice@lab.local', '$2b$10$htV1k5/msIS2cUq9YFIMMO0PTv8TCuA5H9GBwkMtzWQUiX3fMr0xW', 'member'),
  ('bob',   'bob@lab.local',   '$2b$10$03LT1vKCYWqmo8f4y67mpOW0v9K1Unn8/jwzwohhQ9AKgBKIPPm7K', 'member'),
  ('admin', 'admin@lab.local', '$2b$10$qPG.2m3Elwdi6ej/fcsqEuYlxO8.MXx4gPyZspum8rgmLmRdZe0cu', 'admin')
ON CONFLICT (username) DO UPDATE SET
  email = EXCLUDED.email,
  password_hash = EXCLUDED.password_hash,
  role = EXCLUDED.role;

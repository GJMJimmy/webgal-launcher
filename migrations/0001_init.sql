CREATE TABLE IF NOT EXISTS games (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  original_title TEXT,
  url TEXT NOT NULL,
  cover TEXT,
  banner TEXT,
  description TEXT,
  developer TEXT,
  release_date TEXT,
  tags TEXT NOT NULL DEFAULT '[]',
  screenshots TEXT NOT NULL DEFAULT '[]',
  source TEXT NOT NULL DEFAULT 'manual',
  source_id TEXT,
  rating REAL,
  featured INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_games_order
  ON games (featured DESC, sort_order ASC, created_at DESC);

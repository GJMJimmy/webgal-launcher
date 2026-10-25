CREATE TABLE IF NOT EXISTS site_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  show_featured_hero INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL
);

INSERT OR IGNORE INTO site_settings (id, show_featured_hero, updated_at)
VALUES (1, 1, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'));

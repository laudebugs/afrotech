-- Accounts, sessions and starred events for optional Google sign-in (plan 0002).

CREATE TABLE users (
  id          TEXT PRIMARY KEY,               -- random id, ours
  google_sub  TEXT NOT NULL UNIQUE,           -- Google's stable account id
  email       TEXT,
  name        TEXT,
  picture_url TEXT,
  created_at  TEXT NOT NULL                   -- ISO 8601
);

CREATE TABLE sessions (
  token_hash  TEXT PRIMARY KEY,               -- SHA-256 of the cookie's token; the token itself is never stored
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  TEXT NOT NULL,
  expires_at  TEXT NOT NULL
);
CREATE INDEX sessions_user ON sessions(user_id);

CREATE TABLE plan_items (
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id    TEXT NOT NULL,
  starred     INTEGER NOT NULL CHECK (starred IN (0, 1)),  -- 0 keeps an unstar so it syncs
  updated_at  INTEGER NOT NULL,                             -- milliseconds since 1970, from the device
  PRIMARY KEY (user_id, event_id)
);

-- Private notes, synced per account (plan 0005, todo 025).

CREATE TABLE notes (
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  id          TEXT NOT NULL,                  -- random id from the device
  event_id    TEXT NOT NULL,                  -- '' when the note isn't about a session
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  deleted     INTEGER NOT NULL DEFAULT 0 CHECK (deleted IN (0, 1)),  -- 1 keeps a deletion so it syncs; text is emptied
  created_at  INTEGER NOT NULL,               -- milliseconds since 1970, from the device
  updated_at  INTEGER NOT NULL,               -- from the device; the newer version wins
  synced_at   INTEGER NOT NULL,               -- server time of the last write; devices ask for changes since it
  PRIMARY KEY (user_id, id)
);
CREATE INDEX notes_user_synced ON notes(user_id, synced_at);

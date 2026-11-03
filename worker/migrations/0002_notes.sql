-- Private notes, synced per account (plan 0005, todo 025).

-- Counts note writes per account. Each written note takes the next number as
-- its seq, inside the same transaction, so a device can ask for "notes after
-- seq N" and never miss one.
ALTER TABLE users ADD COLUMN notes_seq INTEGER NOT NULL DEFAULT 0;

CREATE TABLE notes (
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  id          TEXT NOT NULL,                  -- random id from the device
  event_id    TEXT NOT NULL,                  -- '' when the note isn't about a session
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  deleted     INTEGER NOT NULL DEFAULT 0 CHECK (deleted IN (0, 1)),  -- 1 keeps a deletion so it syncs; text is emptied
  created_at  INTEGER NOT NULL,               -- milliseconds since 1970, from the device
  updated_at  INTEGER NOT NULL,               -- from the device; the newer version wins
  seq         INTEGER NOT NULL,               -- this account's notes_seq when the row was last written
  PRIMARY KEY (user_id, id)
);
CREATE INDEX notes_user_seq ON notes(user_id, seq);

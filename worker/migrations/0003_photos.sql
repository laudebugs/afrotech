-- Photos in notes (plan 0006, todo 029). The image itself is in R2 under
-- "<user_id>/<id>"; this row records who owns it, which note it belongs to,
-- and its size for the per-account limit.
CREATE TABLE photos (
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  id          TEXT NOT NULL,                  -- random id from the device, as in ![alt](photo:<id>)
  note_id     TEXT NOT NULL,                  -- the note whose text links to it
  size        INTEGER NOT NULL,               -- bytes
  type        TEXT NOT NULL,                  -- image/webp or image/jpeg
  created_at  INTEGER NOT NULL,               -- milliseconds since 1970, from the server
  PRIMARY KEY (user_id, id)
);
CREATE INDEX photos_user_note ON photos(user_id, note_id);

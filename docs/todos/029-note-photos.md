# 029 — Photos in notes

**Status:** done · **Plan:** [Plan 0006](../plans/0006-notes-editor.md) · **Depends on:** 027; uploading also needs 026

## Goal

Add a photo of a slide to a note without storing a 5 MB camera file, and see it on every device.

## Done when

- [x] Insert → Photo takes a picture or picks one; the browser resizes it to at most 1600 px and saves it as WebP
- [x] Alt text is asked for when the photo is added
- [x] The note's Markdown holds `![alt](photo:<id>)`; the photo itself lives in IndexedDB
- [x] The editor and the note view show photos from IndexedDB, then from the Worker
- [x] Private R2 bucket `afrotech-note-photos`; `PUT`/`GET /api/photos/<id>` for the owner's session only (deletion follows the notes, below)
- [x] Photos upload once, after the note syncs; deleting a note deletes its photos; Delete my data removes them all
- [x] 200 MB per account, with a clear message when it's full
- [x] The privacy page lists photos

## Notes

Built on November 3. You created the bucket with
`npx wrangler r2 bucket create afrotech-note-photos`.

- **Adding a photo:** Insert → Photo opens the camera or photo library.
  - **Shrinking:** `src/lib/shrink-photo.ts` draws the photo at most 1600 px on
    the long side, keeping the camera's rotation, and saves it as WebP. Where
    the browser can't write WebP, it saves JPEG. It lowers the quality if
    needed to stay under 2 MB.
  - **Alt text:** a panel shows a preview and asks for a description. "Add
    photo" does nothing until there is one. Square brackets become spaces, so
    the Markdown stays valid.
- **On the device:** `src/lib/photos.ts` keeps each photo in IndexedDB
  (`afrotech-photos`), with an in-memory fallback when storage is blocked.
  Visitors who never add a photo never open IndexedDB; an
  `afrotech:has-photos` flag gates it.
- **Showing photos:** `![alt](photo:<id>)` has no URL a browser can load.
  - **Editor:** an image node view asks the editor page for the photo.
  - **Note page:** markdown-it renders `<img data-photo="<id>">`, and
    `show-note-photos.ts` fills in the image.
  - **Where a photo comes from:** this device first, then (signed in) the
    account, which also saves a copy on the device. A photo found nowhere
    shows its alt text in a dashed box.
- **Uploading:** after each successful notes sync, `photos-sync.ts` uploads
  every photo the account doesn't have yet, once its note has no change
  waiting.
- **Worker (`worker/photos.ts`, migration `0003_photos.sql`):**
  - **Upload:** `PUT /api/photos/<id>?note=<id>` needs our Origin and the
    session. It takes WebP or JPEG only, checked by the file's first bytes,
    up to 2 MB, within 200 MB per account. It refuses (409) until the stored
    note links to the photo, so every stored photo belongs to a note.
  - **Download:** `GET /api/photos/<id>` serves a photo to its owner only,
    with `no-store`. The device keeps its own copy, and a browser cache could
    outlive a deletion.
- **Deleting:** there's no delete route.
  - **Notes:** after every notes sync, the Worker deletes photos that their
    stored note no longer links to, because the note was deleted or the photo
    taken out of it.
  - **Delete my data:** removes every object under the account in R2, then the
    rows.
  - **Signing out:** clears the device's photos.
  - **Device sweep:** each page load drops photos no note on the device links
    to. A photo never uploaded keeps a day's grace, in case its note is still
    being written; one the account has goes after an hour.
- **Full storage:** at 200 MB uploads stop, and the editor says the account's
  photo space is full and new photos stay on the device.
- **Tests:**
  - **Unit:** `npm test` covers photo Markdown surviving the editor, and the
    note page rendering `photo:` images without a `src`.
  - **End to end:** a local Worker with a test session ran the whole flow:
    add, shrink, alt text, upload after sync, the note page, a second device
    fetching from the account, signed-out GET (401), and deleting the note
    (the photo's row and R2 object removed).
  - **Bad uploads:** no Origin (403), a photo the note doesn't link to (409),
    HTML posing as an image (415), a bad id (404).
- **Not tested:** Google sign-in on a real phone, and HEIC photos on iPhone.
  Safari should convert HEIC to JPEG when picking a photo, so it still needs a
  check on a real iPhone.

# 029 — Photos in notes

**Status:** doing · **Plan:** [Plan 0006](../plans/0006-notes-editor.md) · **Depends on:** 027; uploading also needs 026

## Goal

Add a photo of a slide to a note without storing a 5 MB camera file, and see it on every device.

## Done when

- [ ] Insert → Photo takes a picture or picks one; the browser resizes it to at most 1600 px and saves it as WebP
- [ ] Alt text is asked for when the photo is added
- [ ] The note's Markdown holds `![alt](photo:<id>)`; the photo itself lives in IndexedDB
- [ ] The editor and the note view show photos from IndexedDB, then from the Worker
- [ ] Private R2 bucket `afrotech-note-photos`; `PUT`/`GET`/`DELETE /api/photos/<id>` for the owner's session only
- [ ] Photos upload once, after the note syncs; deleting a note deletes its photos; Delete my data removes them all
- [ ] 200 MB per account, with a clear message when it's full
- [ ] The privacy page lists photos

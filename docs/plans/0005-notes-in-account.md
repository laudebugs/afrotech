# Plan 0005: Notes save to your account, not to GitHub

**Status:** built 2026-11-03 (todos 024–026), with the recommended answers (private only, no redirects, keep the template; on November 4 you asked for new notes to start blank instead) · **Created:** 2026-11-03

Today a note becomes public only after you commit it on GitHub. That works for
one author with a GitHub account, but nobody else can keep notes, and every
note is a public commit. This plan moves notes to the device and to the
signed-in account, the same way My plan works. Anyone can write notes, they
stay private, and signing in keeps them on every device. GitHub drops out of
note-taking entirely.

## Notes work like My plan

The site already keeps My plan on the device and syncs it through your
account. Notes follow that model, so they behave the same way in four places:

1. **Signed out:** notes save on the device as you type and work offline. The
   site sends no requests, as today.
2. **Signed in:** notes also sync to your account and show up on your other
   devices.
3. **First sign-in:** notes already on the device upload to your account, so
   nothing is lost.
4. **Delete my data:** this also deletes your notes from the server.

**Notes are private.** Only you can see your notes. To pass a note on, "Share" opens your phone's share sheet with the
note's text, and "Copy Markdown" stays. Question 1 below asks whether you also
want public notes.

## The pages change from published notes to your notes

| Page | Today | After |
|------|-------|-------|
| `/notes/` | Your published notes, built into the site | **My notes**: your notes from this device and your account, newest first |
| `/notes/new/?event=…` | Editor that opens GitHub to publish | Editor that saves as you type; "Done" goes back to My notes |
| `/notes/view/?id=…` | One built page per published note, at `/notes/<file>/` | One note, rendered, with Edit, Share and Delete |
| Event page | Links to published notes about the session | "Your notes" on the session, read from the device |

Because notes are no longer in the build, these pages read them in the browser.
The note view turns Markdown into HTML with `markdown-it`, set to drop raw
HTML so that a pasted script can't run. That library is the only new
dependency; it's a Markdown parser, not a UI framework.

GitHub's pieces go away: the "Publish on GitHub" button, `NOTES_REPO`, the
`notes/` content collection and `notes/_template.md`. No notes have been
published yet, so nothing needs to move.

## One D1 table holds notes, and each note syncs whole

A new migration, `worker/migrations/0002_notes.sql`, adds one table:

| Column | Holds |
|--------|-------|
| `id` | A random id the device creates, so offline notes need no server round trip |
| `user_id` | The owner; deleting the account deletes the notes |
| `event_id` | The session the note is about |
| `title`, `body` | The note; at most 200 characters and 100 KB |
| `deleted` | 1 once deleted, so a deletion reaches your other devices |
| `created_at`, `updated_at` | Times from the device, in milliseconds |

Two routes join the Worker, and both need a signed-in session:

| Route | Does |
|-------|------|
| `GET /api/notes` | Your notes, without deleted ones' text |
| `POST /api/notes` | Applies your changed notes and returns the merged list |

Sync reuses My plan's rule: a change log on the device, and the newer
`updated_at` wins for each note. A sync runs when a page loads, a few seconds
after you stop typing, and when you come back online. Writes need the same
same-origin and JSON checks as My plan, and each account can hold up to 1,000
notes.

## Privacy and the rules change with it

- The `/privacy` page adds notes to what the account stores, and says that
  Delete my data removes them.
- `CLAUDE.md` and plan 0001 stop saying that notes are public and published
  through GitHub.
- Notes never leave the device for a signed-out visitor.

## Three proposed todos

| # | Task |
|---|------|
| 024 | Notes on the device: store, My notes, the editor and note view, notes on event pages; remove GitHub publishing |
| 025 | `notes` table, `/api/notes`, and notes in Delete my data |
| 026 | Sync notes across devices, the privacy page and the rule changes |

Todo 024 is useful on its own: it ships private notes on one device even before
sync lands.

## Risks

| Risk | Response |
|------|----------|
| You edit the same note on two devices before they sync | The later save wins, and the earlier edit is lost. A sync runs seconds after typing stops, so this needs two devices editing within moments of each other. |
| A note is lost when the browser clears storage while signed out | Notes share My plan's risk here. The editor says "Saved on this device" and suggests signing in to keep notes safe. |
| Rendering someone's Markdown runs code | `markdown-it` with raw HTML off escapes it, and links only allow `http`, `https` and `mailto`. |

## Three decisions for you

1. **Private only, or public too?** I recommend private only. Public notes from
   any Google account would put other people's writing on your domain, which
   needs moderation. If you want your own notes public, a later plan can add a
   "Publish" switch just for your account.
2. **Old URLs:** no notes exist yet, so I'll drop the `/notes/<file>/` pages
   without redirects. Is that fine?
3. **Note template:** keep the current headings (Key takeaways, Notable quotes,
   and so on) for a new note?

Once you answer, todo 024 starts, and each later todo ships on its own.

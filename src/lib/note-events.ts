// Reads the session lookup that NoteEventLookup.astro puts in the page.
export type NoteEvent = {
  title: string;
  when: string;
  place: string;
  /** Only on pages that ask for them (the editor). */
  speakers?: { name: string; slug: string | null; role: string }[];
};

let cached: Record<string, NoteEvent> | null = null;

function lookup(): Record<string, NoteEvent> {
  cached ??= JSON.parse(document.getElementById("note-events")?.textContent ?? "{}") as Record<string, NoteEvent>;
  return cached;
}

export function noteEvent(id: string): NoteEvent | undefined {
  return id ? lookup()[id] : undefined;
}

/** Every session, for searching by title. */
export function allNoteEvents(): [string, NoteEvent][] {
  return Object.entries(lookup());
}

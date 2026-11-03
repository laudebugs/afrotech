// Reads the session lookup that NoteEventLookup.astro puts in the page.
export type NoteEvent = {
  title: string;
  when: string;
  place: string;
  /** Only on pages that ask for them (the editor). */
  speakers?: { name: string; slug: string | null; role: string }[];
};

let cached: Record<string, NoteEvent> | null = null;

export function noteEvent(id: string): NoteEvent | undefined {
  cached ??= JSON.parse(document.getElementById("note-events")?.textContent ?? "{}") as Record<string, NoteEvent>;
  return id ? cached[id] : undefined;
}

/** Every session, for searching by title. */
export function allNoteEvents(): [string, NoteEvent][] {
  noteEvent("");
  return Object.entries(cached!);
}

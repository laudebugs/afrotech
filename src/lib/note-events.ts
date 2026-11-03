// Reads the session lookup that NoteEventLookup.astro puts in the page.
export type NoteEvent = { title: string; when: string; place: string };

let cached: Record<string, NoteEvent> | null = null;

export function noteEvent(id: string): NoteEvent | undefined {
  cached ??= JSON.parse(document.getElementById("note-events")?.textContent ?? "{}") as Record<string, NoteEvent>;
  return id ? cached[id] : undefined;
}

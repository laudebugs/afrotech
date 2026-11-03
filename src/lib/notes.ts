// Published notes, newest first. Loaded once per build and shared by every page.
import { getCollection, type CollectionEntry } from "astro:content";

export type Note = CollectionEntry<"notes">;

let cached: Promise<Note[]> | null = null;

export function getNotes(): Promise<Note[]> {
  cached ??= getCollection("notes").then((notes) =>
    notes.sort((a, b) => b.data.published.getTime() - a.data.published.getTime()),
  );
  return cached;
}

export async function notesForEvent(eventId: string): Promise<Note[]> {
  return (await getNotes()).filter((n) => n.data.eventId === eventId);
}

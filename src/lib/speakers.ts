// Speaker profiles from data/speakers.json, checked at build time like events.
import speakersJson from "../../data/speakers.json";
import { officialEvents } from "./events";
import type { ScheduleEvent, SpeakerProfile } from "./types";

const SPEAKER_KEYS = {
  id: true, slug: true, name: true, title: true, company: true, brief: true,
  bio: true, photoUrl: true, links: true, sessionIds: true,
} satisfies Record<keyof SpeakerProfile, true>;

function checkSpeakers(list: unknown[]): SpeakerProfile[] {
  const keys = Object.keys(SPEAKER_KEYS);
  for (const item of list) {
    const record = item as Record<string, unknown>;
    const missing = keys.filter((k) => !(k in record));
    const extra = Object.keys(record).filter((k) => !keys.includes(k));
    if (missing.length || extra.length) {
      throw new Error(
        `data/speakers.json: ${String(record.name)} doesn't match SpeakerProfile ` +
          `(missing: ${missing.join(", ") || "none"}; extra: ${extra.join(", ") || "none"}). ` +
          "Update src/lib/types.ts and scripts/build_events.py together.",
      );
    }
  }
  return list as SpeakerProfile[];
}

/** Every speaker, A–Z by name. */
export const speakers = checkSpeakers(speakersJson);

const bySlug = new Map(speakers.map((s) => [s.slug, s]));
export const speakerBySlug = (slug: string | null) => (slug ? bySlug.get(slug) : undefined);

const eventById = new Map(officialEvents.map((e) => [e.id, e]));
/** A speaker's sessions in time order. */
export const sessionsOf = (speaker: SpeakerProfile): ScheduleEvent[] =>
  speaker.sessionIds
    .map((id) => eventById.get(id))
    .filter((e): e is ScheduleEvent => Boolean(e))
    .sort((a, b) => (a.start ?? "9999").localeCompare(b.start ?? "9999"));

/** "AJ" for Alexis Johnson; shown when a photo is missing or fails to load. */
export function initials(name: string): string {
  const words = name.replace(/\(.*?\)/g, "").split(/\s+/).filter((w) => /^[A-Za-zÀ-ÿ]/.test(w));
  const picked = words.length > 1 ? [words[0], words.at(-1)] : words;
  return picked.map((w) => w![0]!.toUpperCase()).join("");
}

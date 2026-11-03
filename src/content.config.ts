// Session notes: Markdown files in notes/ (files starting with _ are templates).
import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const notes = defineCollection({
  loader: glob({ pattern: "**/[^_]*.md", base: "./notes" }),
  schema: z.object({
    /** The event the note is about (see data/events/). */
    eventId: z.string(),
    title: z.string(),
    /** ISO 8601, e.g. 2026-11-04T15:30:00-06:00 */
    published: z.coerce.date(),
  }),
});

export const collections = { notes };

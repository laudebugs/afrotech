// /event/<id>.ics: one event as a calendar file.
import type { APIRoute } from "astro";
import { allEvents } from "../../lib/events";
import { toIcs } from "../../lib/ics";
import type { ScheduleEvent } from "../../lib/types";

export function getStaticPaths() {
  return allEvents.filter((e) => e.start).map((event) => ({ params: { id: event.id }, props: { event } }));
}

export const GET: APIRoute = ({ props }) => {
  const event = (props as { event: ScheduleEvent }).event;
  return new Response(toIcs([event], event.title), {
    headers: { "Content-Type": "text/calendar; charset=utf-8" },
  });
};

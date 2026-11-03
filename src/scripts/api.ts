// The one way client scripts call the Worker: same-origin cookies, and a JSON
// body (which the Worker requires on writes) whenever there is one.
export function api(method: "GET" | "POST" | "DELETE", path: string, body?: unknown): Promise<Response> {
  return fetch(path, {
    method,
    credentials: "same-origin",
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

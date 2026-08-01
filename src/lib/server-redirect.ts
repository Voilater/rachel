/**
 * Redirect with mutable headers so TanStack can merge Set-Cookie from setCookie().
 * Response.redirect() uses immutable headers and crashes mergeEventResponseHeaders.
 */
export function serverRedirect(location: string, status = 303): Response {
  const headers = new Headers();
  headers.set("Location", location);
  return new Response(null, { status, headers });
}

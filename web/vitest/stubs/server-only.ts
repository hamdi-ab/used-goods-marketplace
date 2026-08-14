// Empty stub for Next's `server-only` marker.
//
// Importing the real `server-only` module throws at runtime ("This module cannot
// be imported from a Client Component module…"). It is a build-time directive,
// not runtime code, so under Vitest's Node environment we alias it to nothing.
// This lets the pure seam modules (lib/listings, lib/media, lib/browse) load
// without executing the Next server graph — no per-test mocking needed.

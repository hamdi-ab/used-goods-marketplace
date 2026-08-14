// Global Vitest setup.
//
// The module-graph stubs (server-only / @/lib/supabase/server) are applied via
// resolve.alias in vitest.config.ts, so importing the pure seam modules
// (lib/listings, lib/media, lib/browse) works under Node without pulling in the
// Next server runtime or triggering the `server-only` import-time throw.
//
// No per-test mocking is required for the pure function surfaces. Reopen this
// file to register shared hooks (e.g. @testing-library/jest-dom) once component
// tests are added.

// Stub for @/lib/supabase/server. Importing the real module pulls in
// `next/headers` and `@supabase/ssr`, which resolve fine under Vitest but are
// irrelevant to the pure seam functions — and `createClient` is never called at
// module-load time. Any test that genuinely needs a live client should mock the
// call site; the pure surfaces (formatting, paging, upload skeleton) don't.
export const createClient = (): never => {
  throw new Error("createClient is not available in unit tests")
}

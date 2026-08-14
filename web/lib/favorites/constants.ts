/**
 * Pure favorites domain value objects.
 *
 * Framework-agnostic helpers shared by Server and Client modules. This module
 * intentionally has NO `server-only` import and imports no Supabase client, so
 * Client Components can consume it directly without pulling the server seam
 * into the client graph. `@/lib/favorites` re-exports everything here.
 */

export type FavoriteState = boolean

/**
 * The toggle reducer. One definition serves both sides of the optimistic
 * round-trip: the Client Component calls it in `useOptimistic` to flip the
 * heart on the current frame, and the Server Action's persistence step (and
 * the DB write it wraps) must compute the same next state, so the re-rendered
 * server state and the optimistic frame can never disagree.
 */
export function toggleFavoriteState(state: FavoriteState): FavoriteState {
  return !state
}

/**
 * The login redirect target for the heart button. Login honors a `?next=`
 * query param (see app/login/page.tsx), so a signed-out visitor who taps a
 * heart lands back on the exact listing after signing in. Kept here so the
 * Client Component needs no URL-building logic.
 */
export function buildLoginUrl(pathname: string): string {
  return `/login?next=${encodeURIComponent(pathname)}`
}

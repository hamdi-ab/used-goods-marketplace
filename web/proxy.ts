import { type NextRequest, NextResponse } from "next/server"

import { updateSession } from "@/lib/supabase/middleware"

const PROTECTED_PREFIXES = [
  "/profile",
  "/dashboard",
  "/favorites",
  "/sell",
  "/onboarding",
  "/admin",
]
const AUTH_PREFIXES = ["/login", "/register", "/forgot-password", "/reset-password"]

function matches(pathname: string, prefixes: string[]) {
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
}

export async function proxy(request: NextRequest) {
  const { response, user } = await updateSession(request)
  const { pathname } = request.nextUrl

  if (matches(pathname, AUTH_PREFIXES) && user) {
    return NextResponse.redirect(new URL("/", request.nextUrl))
  }

  // PROTOTYPE — the ?variant= redesign routes are view-only during review and
  // bypass the auth guard so reviewers can see the frame without signing in.
  // Removed with the prototype machinery.
  if (matches(pathname, PROTECTED_PREFIXES) && !user && !request.nextUrl.searchParams.has("variant")) {
    const url = new URL("/login", request.nextUrl)
    url.searchParams.set("next", pathname)
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Run on everything except static assets and images.
     */
    "/((?!_next/static|_next/image|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|avif)$).*)",
  ],
}
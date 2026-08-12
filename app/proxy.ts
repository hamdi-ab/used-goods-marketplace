import { type NextRequest, NextResponse } from "next/server"

import { updateSession } from "@/lib/supabase/middleware"

const PROTECTED_PREFIXES = ["/profile", "/dashboard", "/favorites", "/sell", "/onboarding"]
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

  if (matches(pathname, PROTECTED_PREFIXES) && !user) {
    const url = new URL("/login", request.nextUrl)
    url.searchParams.set("next", pathname)
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Run on everything except static assets, images, favicon and API routes.
     */
    "/((?!_next/static|_next/image|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|avif)$).*)",
  ],
}
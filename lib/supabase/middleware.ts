import { NextResponse, type NextRequest } from "next/server";

import { createServerClient, type CookieOptions } from "@supabase/ssr";

import { isSupabaseConfigured, publicEnv } from "@/lib/env";

/**
 * Routes that REQUIRE an authenticated user. Anything matching one of
 * these prefixes will redirect anonymous visitors to /auth/login.
 *
 * Landing page (`/`) and Explore Lab marketing (`/explore-lab`) are
 * intentionally PUBLIC. Explore Lab *tools* like `/explore-lab/chat`
 * are auth-aware but only require auth when persisting history.
 */
const PROTECTED_PREFIXES = [
  "/tugasku",
  "/account",
  "/settings",
  "/explore-lab/chat",
  "/explore-lab/image",
  "/explore-lab/tools",
];

const AUTH_ROUTES = ["/auth/login", "/auth/register"];

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some((route) => pathname === route);
}

/**
 * Middleware-bound Supabase session refresher. Without this, the
 * server-side session can drift out of sync with the browser cookie
 * jar and protected routes will bounce users to login on every nav.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  // If Supabase isn't configured yet (e.g. fresh clone with no .env),
  // skip auth entirely and let the page render. The relevant pages
  // surface a clear "Supabase not configured" notice to the developer.
  if (!isSupabaseConfigured()) {
    return response;
  }

  const supabase = createServerClient(
    publicEnv.supabaseUrl,
    publicEnv.supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: "", ...options });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value: "", ...options });
        },
      },
    },
  );

  // IMPORTANT: refresh the session before reading the user. Otherwise
  // an expired access token may be reported as "no user" mid-flight.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname, search } = request.nextUrl;

  if (!user && isProtected(pathname)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/auth/login";
    loginUrl.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(loginUrl);
  }

  if (user && isAuthRoute(pathname)) {
    const dashUrl = request.nextUrl.clone();
    dashUrl.pathname = "/tugasku/dashboard";
    dashUrl.search = "";
    return NextResponse.redirect(dashUrl);
  }

  return response;
}

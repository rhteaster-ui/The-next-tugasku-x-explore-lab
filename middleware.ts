import type { NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static, _next/image, favicon, icons (static assets)
     * - api/integrations/google-calendar/callback (must accept Google's
     *   redirect with its own auth handling)
     */
    "/((?!_next/static|_next/image|favicon.ico|icons|images|.*\\.(?:png|jpg|jpeg|svg|webp|ico)$).*)",
  ],
};

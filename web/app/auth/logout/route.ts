import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

async function performLogout(request: NextRequest) {
  const supabase = createClient();
  await supabase.auth.signOut();
  const url = new URL("/", request.url);
  return NextResponse.redirect(url, { status: 303 });
}

export async function POST(request: NextRequest) {
  return performLogout(request);
}

export async function GET(request: NextRequest) {
  return performLogout(request);
}

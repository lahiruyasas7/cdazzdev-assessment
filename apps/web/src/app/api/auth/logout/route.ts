// src/app/api/auth/logout/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  getClearCookieOptions,
} from "@/lib/auth/cookie";

export async function POST() {
  // No corresponding API endpoint to call — the brief's refresh-token
  // design is stateless (no server-side revocation list), so "logout"
  // is purely a client-side concern: clear the cookies, the tokens
  // remain technically valid server-side until they naturally expire.
  // This is the same tradeoff flagged back when the refresh token
  // design was first built — named again here since it's the reason
  // logout looks "too simple."
  const cookieStore = await cookies();
  cookieStore.set(ACCESS_TOKEN_COOKIE, "", getClearCookieOptions());
  cookieStore.set(REFRESH_TOKEN_COOKIE, "", getClearCookieOptions());

  return NextResponse.json({ ok: true });
}

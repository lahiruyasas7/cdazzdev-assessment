import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { callApi, isApiError } from "@/lib/auth/api-proxy";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  getAccessTokenCookieOptions,
  getRefreshTokenCookieOptions,
} from "@/lib/auth/cookie";
import type { AuthResponse, AuthSessionResponse } from "@/lib/types/auth.type";

export async function POST(request: NextRequest) {
  const { name, email, password } = await request.json();

  const apiResponse = await callApi("/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });

  const body = await apiResponse.json().catch(() => null);

  if (!apiResponse.ok || !body) {
    // 409 "An account with this email already exists" is the most
    // common real case here — relayed as-is from the API, not reworded.
    const message = isApiError(body) ? body.message : "Registration failed";
    return NextResponse.json(
      { message },
      { status: apiResponse.status || 500 },
    );
  }

  const { accessToken, refreshToken, user } = body as AuthResponse;

  // AuthService.register() already signs the user in immediately (same
  // as login) — no "remember me" concept exists at registration time in
  // the brief, so default to persistent cookies rather than session-only.
  const cookieStore = await cookies();
  cookieStore.set(
    ACCESS_TOKEN_COOKIE,
    accessToken,
    getAccessTokenCookieOptions(true),
  );
  cookieStore.set(
    REFRESH_TOKEN_COOKIE,
    refreshToken,
    getRefreshTokenCookieOptions(true),
  );

  const sessionResponse: AuthSessionResponse = { user };
  return NextResponse.json(sessionResponse, { status: 201 });
}

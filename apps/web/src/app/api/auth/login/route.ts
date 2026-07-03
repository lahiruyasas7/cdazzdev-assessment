import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { callApi, isApiError } from "@/lib/auth/api-proxy";
import type { AuthResponse, AuthSessionResponse } from "@/lib/types/auth.type";
import {
  ACCESS_TOKEN_COOKIE,
  getAccessTokenCookieOptions,
  getRefreshTokenCookieOptions,
  REFRESH_TOKEN_COOKIE,
} from "@/lib/auth/cookie";

export async function POST(request: NextRequest) {
  const { email, password, rememberMe } = await request.json();

  const apiResponse = await callApi("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  const body = await apiResponse.json().catch(() => null);

  if (!apiResponse.ok || !body) {
    // Relay the API's real error message/status (e.g. 401 "Invalid
    // email or password") rather than inventing a different one here —
    // the Route Handler is a proxy, not a place to reinterpret errors.
    const message = isApiError(body) ? body.message : "Login failed";
    return NextResponse.json(
      { message },
      { status: apiResponse.status || 500 },
    );
  }

  const { accessToken, refreshToken, user } = body as AuthResponse;

  const cookieStore = await cookies();
  cookieStore.set(
    ACCESS_TOKEN_COOKIE,
    accessToken,
    getAccessTokenCookieOptions(rememberMe),
  );
  cookieStore.set(
    REFRESH_TOKEN_COOKIE,
    refreshToken,
    getRefreshTokenCookieOptions(rememberMe),
  );

  const sessionResponse: AuthSessionResponse = { user };
  return NextResponse.json(sessionResponse, { status: 200 });
}

// src/lib/auth/cookies.ts

export const ACCESS_TOKEN_COOKIE = "teamsync_access_token";
export const REFRESH_TOKEN_COOKIE = "teamsync_refresh_token";

// Must match (or be <=) the API's real token lifetimes
// (JWT_ACCESS_EXPIRES_IN / JWT_REFRESH_EXPIRES_IN in apps/api/.env).
// Keeping the cookie's own Max-Age at or below the JWT's real expiry
// means an expired-but-still-present cookie is never trusted past the
// point the token itself would fail validation anyway.
const ACCESS_TOKEN_MAX_AGE_SECONDS = 15 * 60; // 15 minutes
const REFRESH_TOKEN_MAX_AGE_SECONDS = 7 * 24 * 60 * 60; // 7 days

// Defined locally rather than imported from Next's internal
// @edge-runtime/cookies path — that path isn't part of Next's public
// API surface and can change without notice between versions. This
// shape matches what `cookies().set(name, value, options)` accepts.
interface CookieOptions {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: "lax" | "strict" | "none";
  path?: string;
  maxAge?: number;
}

/**
 * "Remember me" controls cookie PERSISTENCE, not anything about the
 * tokens themselves — both tokens are identical either way. Checked:
 * cookies get a real Max-Age, so they survive closing the browser, up
 * to their natural expiry. Unchecked: session cookies (no Max-Age at
 * all), so the browser drops them the moment it closes, even though
 * the underlying JWT would still be valid server-side until it expires.
 */
export function getAccessTokenCookieOptions(
  rememberMe: boolean,
): CookieOptions {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    ...(rememberMe ? { maxAge: ACCESS_TOKEN_MAX_AGE_SECONDS } : {}),
  };
}

export function getRefreshTokenCookieOptions(
  rememberMe: boolean,
): CookieOptions {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    ...(rememberMe ? { maxAge: REFRESH_TOKEN_MAX_AGE_SECONDS } : {}),
  };
}

// Used when clearing cookies on logout or on a failed refresh — Max-Age
// 0 deletes the cookie immediately regardless of how it was originally set.
export function getClearCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  };
}

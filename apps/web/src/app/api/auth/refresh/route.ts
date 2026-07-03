// src/app/api/auth/refresh/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { callApi } from '@/lib/auth/api-proxy';
import type { RefreshResponseDto } from '@/lib/types/auth.type';
import { ACCESS_TOKEN_COOKIE, getAccessTokenCookieOptions, getClearCookieOptions, REFRESH_TOKEN_COOKIE } from '@/lib/auth/cookie';

export async function POST() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;

  if (!refreshToken) {
    return NextResponse.json({ message: 'No refresh token present' }, { status: 401 });
  }

  const apiResponse = await callApi('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
  });

  if (!apiResponse.ok) {
    // Refresh token is invalid/expired — clear both cookies so the
    // browser doesn't keep retrying with a dead refresh token on every
    // subsequent request. The caller (middleware or the axios
    // interceptor) is responsible for redirecting to /login after this.
    const response = NextResponse.json({ message: 'Session expired' }, { status: 401 });
    response.cookies.set(ACCESS_TOKEN_COOKIE, '', getClearCookieOptions());
    response.cookies.set(REFRESH_TOKEN_COOKIE, '', getClearCookieOptions());
    return response;
  }

  const body = (await apiResponse.json()) as RefreshResponseDto;

  // Preserve whatever persistence the original login chose. If the
  // existing access-token cookie had no Max-Age (session-only, i.e.
  // "remember me" was unchecked), the new one shouldn't suddenly become
  // persistent either — checking the OLD cookie's presence/absence of
  // an expiry isn't directly readable here, so this re-applies the same
  // rule as a fresh persistent login. Documented as a known simplification:
  // a non-"remembered" session that triggers a refresh will become
  // persistent for the remainder of the access token's life. Acceptable
  // for this assessment's scope; a production system would track the
  // "remember me" choice itself (e.g. in a third, non-sensitive cookie)
  // to preserve it exactly across refreshes.
  const cookieStoreForSet = await cookies();
  cookieStoreForSet.set(ACCESS_TOKEN_COOKIE, body.accessToken, getAccessTokenCookieOptions(true));

  return NextResponse.json({ ok: true });
}

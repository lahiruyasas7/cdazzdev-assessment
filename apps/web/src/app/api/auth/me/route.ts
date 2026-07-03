// src/app/api/auth/me/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { callApi } from "@/lib/auth/api-proxy";
import type { AuthSessionResponse } from "@/lib/types/auth.type";
import { ACCESS_TOKEN_COOKIE } from "@/lib/auth/cookie";

export async function GET() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;

  if (!accessToken) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  const apiResponse = await callApi("/auth/me", { accessToken });

  // Deliberately NOT attempting a refresh-and-retry here if this 401s.
  // The axios interceptor (axios-client.ts) already owns that logic for
  // every request made through apiClient — duplicating it here would
  // create two independent places that could race or disagree about
  // whether a refresh is in flight. This route just reports the true
  // current state; the interceptor decides what to do about a 401.
  if (!apiResponse.ok) {
    return NextResponse.json(
      { message: "Session expired" },
      { status: apiResponse.status },
    );
  }

  const user = await apiResponse.json();
  const sessionResponse: AuthSessionResponse = { user };
  return NextResponse.json(sessionResponse);
}

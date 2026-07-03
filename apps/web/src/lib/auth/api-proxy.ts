import { NextResponse } from "next/server";
import { ApiErrorResponse } from "../types/auth.type";

const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:3003";
console.log("api base url", API_BASE_URL);

/**
 * Calls the real NestJS API server-to-server (Next.js server -> Nest
 * server, never browser -> Nest directly) and returns the raw Response.
 * This is the ONLY function that should ever construct a fetch() call
 * to API_BASE_URL — every Route Handler goes through this, so there's
 * one place that knows the base URL and one place to add things like
 * timeouts or retry logic later if needed.
 */
export async function callApi(
  path: string,
  init: RequestInit & { accessToken?: string } = {},
): Promise<Response> {
  const { accessToken, headers, ...rest } = init;

  console.log("callApi called");
  console.log("API_BASE_URL:", API_BASE_URL);
  return fetch(`${API_BASE_URL}/api/v1${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...headers,
    },
    // Route Handlers run server-side per-request already; explicitly
    // opting out of Next's fetch cache here since auth/task data must
    // never be served stale from an unintended cache hit.
    cache: "no-store",
  });
}

/**
 * Relays the API's JSON body and status code straight through to the
 * browser, UNCHANGED. Used for endpoints that don't need to touch
 * cookies (most data endpoints) — the Route Handler calling this is a
 * thin, honest pass-through, not a place where errors get reshaped or
 * swallowed.
 */
export async function relay(apiResponse: Response): Promise<NextResponse> {
  const body = await apiResponse.json().catch(() => null);
  return NextResponse.json(body, { status: apiResponse.status });
}

export function isApiError(body: unknown): body is ApiErrorResponse {
  return (
    typeof body === "object" &&
    body !== null &&
    "statusCode" in body &&
    "message" in body
  );
}

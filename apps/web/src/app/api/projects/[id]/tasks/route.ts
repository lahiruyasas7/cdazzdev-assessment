// src/app/api/projects/[id]/tasks/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { callApi } from "@/lib/auth/api-proxy";
import { ACCESS_TOKEN_COOKIE } from "@/lib/auth/cookie";

async function getAccessToken() {
  const cookieStore = await cookies();
  return cookieStore.get(ACCESS_TOKEN_COOKIE)?.value ?? null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;
  const search = request.nextUrl.searchParams.toString();
  const path = `/projects/${id}/tasks${search ? `?${search}` : ""}`;

  const apiResponse = await callApi(path, { accessToken });
  const body = await apiResponse.json().catch(() => null);
  return NextResponse.json(body, { status: apiResponse.status });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);

  if (!body) {
    return NextResponse.json(
      { message: "Invalid request body" },
      { status: 400 },
    );
  }

  const apiResponse = await callApi(`/projects/${id}/tasks`, {
    method: "POST",
    body: JSON.stringify(body),
    accessToken,
  });

  const responseBody = await apiResponse.json().catch(() => null);
  return NextResponse.json(responseBody, { status: apiResponse.status });
}

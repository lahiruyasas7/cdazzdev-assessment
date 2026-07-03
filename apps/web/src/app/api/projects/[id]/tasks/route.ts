// src/app/api/projects/[id]/tasks/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { callApi } from "@/lib/auth/api-proxy";
import { ACCESS_TOKEN_COOKIE } from "@/lib/auth/cookie";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;

  if (!accessToken) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;

  // Forward all query params (status, priority, assigneeId, page, limit,
  // sortBy, sortOrder) as-is to the NestJS API — no need to parse them
  // here, NestJS's ValidationPipe handles validation on the other side.
  const search = request.nextUrl.searchParams.toString();
  const path = `/projects/${id}/tasks${search ? `?${search}` : ""}`;

  const apiResponse = await callApi(path, { accessToken });
  const body = await apiResponse.json().catch(() => null);
  return NextResponse.json(body, { status: apiResponse.status });
}

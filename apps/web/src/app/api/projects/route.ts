import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { callApi } from "@/lib/auth/api-proxy";
import { ACCESS_TOKEN_COOKIE } from "@/lib/auth/cookie";

export async function GET() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;

  if (!accessToken) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  const apiResponse = await callApi("/projects", { accessToken });
  const body = await apiResponse.json().catch(() => null);
  return NextResponse.json(body, { status: apiResponse.status });
}

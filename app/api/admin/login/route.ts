import {
  ADMIN_COOKIE_NAME,
  createAdminSessionCookie,
  getAdminAuthStatus,
  getAdminCookieOptions,
  verifyAdminCredentials,
} from "@/lib/admin-auth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function isLoginPayload(value: unknown): value is {
  readonly password: string;
  readonly username: string;
} {
  return (
    Boolean(value) &&
    typeof value === "object" &&
    typeof (value as { username?: unknown }).username === "string" &&
    typeof (value as { password?: unknown }).password === "string"
  );
}

export async function POST(request: Request) {
  const authStatus = getAdminAuthStatus();

  if (!authStatus.configured) {
    return NextResponse.json(
      { error: "admin_auth_not_configured" },
      { status: 503 },
    );
  }

  const payload: unknown = await request.json().catch(() => null);

  if (!isLoginPayload(payload)) {
    return NextResponse.json({ error: "invalid_login_payload" }, { status: 400 });
  }

  if (!verifyAdminCredentials(payload.username, payload.password)) {
    return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });

  response.cookies.set(
    ADMIN_COOKIE_NAME,
    createAdminSessionCookie(payload.username),
    getAdminCookieOptions(),
  );

  return response;
}

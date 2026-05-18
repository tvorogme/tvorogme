import {
  ADMIN_COOKIE_NAME,
  getExpiredAdminCookieOptions,
} from "@/lib/admin-auth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST() {
  const response = NextResponse.json({ ok: true });

  response.cookies.set(ADMIN_COOKIE_NAME, "", getExpiredAdminCookieOptions());

  return response;
}

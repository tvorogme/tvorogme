import type { AdminAuthStatus } from "@/lib/admin-config-shared";
import crypto from "node:crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE_NAME = "tvorogme_admin";

const SESSION_TTL_SECONDS = 60 * 60 * 12;
const SESSION_TTL_MS = SESSION_TTL_SECONDS * 1000;
const DEV_ADMIN_PASSWORD = "admin";

type AdminSessionPayload = {
  readonly exp: number;
  readonly u: string;
  readonly v: 1;
};

function getAdminUsername() {
  return (
    process.env.TVOROGME_ADMIN_USERNAME ??
    process.env.ADMIN_USERNAME ??
    "admin"
  );
}

function getAdminPassword() {
  return (
    process.env.TVOROGME_ADMIN_PASSWORD ??
    process.env.ADMIN_PASSWORD ??
    (process.env.NODE_ENV === "production" ? "" : DEV_ADMIN_PASSWORD)
  );
}

function getAdminPasswordSha256() {
  return (
    process.env.TVOROGME_ADMIN_PASSWORD_SHA256 ??
    process.env.ADMIN_PASSWORD_SHA256 ??
    ""
  ).toLowerCase();
}

function getDevAdminSessionSecret() {
  return crypto
    .createHash("sha256")
    .update(`tvorogme-dev-admin-session:${process.cwd()}`)
    .digest("hex");
}

function getSessionSecret() {
  return (
    process.env.TVOROGME_ADMIN_SESSION_SECRET ??
    process.env.ADMIN_SESSION_SECRET ??
    process.env.CODEX_LORELOG_SECRET ??
    (process.env.NODE_ENV === "production" ? "" : getDevAdminSessionSecret())
  );
}

function sha256(value: string) {
  return crypto.createHash("sha256").update(value).digest();
}

function sha256Hex(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function safeEqualText(left: string, right: string) {
  return crypto.timingSafeEqual(sha256(left), sha256(right));
}

function safeEqualHex(left: string, right: string) {
  return crypto.timingSafeEqual(sha256(left), sha256(right));
}

function encodeBase64Url(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function decodeBase64Url(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signPayload(payload: string) {
  const secret = getSessionSecret();

  if (!secret) return "";

  return crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("base64url");
}

function getCookieValue(cookieHeader: string | null, name: string) {
  if (!cookieHeader) return null;

  for (const cookie of cookieHeader.split(";")) {
    const [rawName, ...rawValue] = cookie.trim().split("=");

    if (rawName === name) {
      return rawValue.join("=");
    }
  }

  return null;
}

function parseSession(value: string | undefined | null) {
  if (!value) return null;

  const [payload, signature] = value.split(".");
  const expectedSignature = signPayload(payload ?? "");

  if (!payload || !signature || !expectedSignature) return null;
  if (!safeEqualText(signature, expectedSignature)) return null;

  try {
    const parsed: unknown = JSON.parse(decodeBase64Url(payload));

    if (!parsed || typeof parsed !== "object") return null;

    const session = parsed as Partial<AdminSessionPayload>;

    if (
      session.v !== 1 ||
      typeof session.u !== "string" ||
      typeof session.exp !== "number" ||
      session.exp < Date.now()
    ) {
      return null;
    }

    if (!safeEqualText(session.u, getAdminUsername())) return null;

    return session as AdminSessionPayload;
  } catch {
    return null;
  }
}

export function getAdminAuthStatus(): AdminAuthStatus {
  const configuredPassword = getAdminPassword();
  const configuredPasswordHash = getAdminPasswordSha256();
  const configured =
    Boolean(configuredPassword || configuredPasswordHash) &&
    Boolean(getSessionSecret());

  return {
    configured,
    sessionSecretConfigured: Boolean(getSessionSecret()),
    username: getAdminUsername(),
    usesDevDefault:
      process.env.NODE_ENV !== "production" &&
      !process.env.TVOROGME_ADMIN_PASSWORD &&
      !process.env.ADMIN_PASSWORD &&
      !process.env.TVOROGME_ADMIN_PASSWORD_SHA256 &&
      !process.env.ADMIN_PASSWORD_SHA256,
  };
}

export function verifyAdminCredentials(username: string, password: string) {
  const status = getAdminAuthStatus();

  if (!status.configured) return false;
  if (!safeEqualText(username, getAdminUsername())) return false;

  const passwordHash = getAdminPasswordSha256();

  if (passwordHash) {
    return safeEqualHex(sha256Hex(password), passwordHash);
  }

  return safeEqualText(password, getAdminPassword());
}

export function createAdminSessionCookie(username: string) {
  const payload = encodeBase64Url(
    JSON.stringify({
      exp: Date.now() + SESSION_TTL_MS,
      u: username,
      v: 1,
    } satisfies AdminSessionPayload),
  );
  const signature = signPayload(payload);

  return `${payload}.${signature}`;
}

export function getAdminCookieOptions() {
  return {
    httpOnly: true,
    maxAge: SESSION_TTL_SECONDS,
    path: "/",
    sameSite: "strict" as const,
    secure: process.env.NODE_ENV === "production",
  };
}

export function getExpiredAdminCookieOptions() {
  return {
    ...getAdminCookieOptions(),
    maxAge: 0,
  };
}

export async function hasAdminSession() {
  const cookieStore = await cookies();

  return Boolean(parseSession(cookieStore.get(ADMIN_COOKIE_NAME)?.value));
}

export function hasAdminRequestSession(request: Request) {
  const cookieValue = getCookieValue(
    request.headers.get("cookie"),
    ADMIN_COOKIE_NAME,
  );

  return Boolean(parseSession(cookieValue));
}

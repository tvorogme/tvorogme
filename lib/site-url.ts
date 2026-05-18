const LOCAL_ORIGIN = "http://localhost:3000";

function normalizeOrigin(value: string | undefined) {
  if (!value) return null;

  const withProtocol = /^https?:\/\//.test(value) ? value : `https://${value}`;

  try {
    return new URL(withProtocol).origin;
  } catch {
    return null;
  }
}

export function getConfiguredOrigin() {
  return (
    normalizeOrigin(process.env.NEXT_PUBLIC_SITE_URL) ??
    normalizeOrigin(process.env.SITE_URL) ??
    normalizeOrigin(process.env.VERCEL_PROJECT_PRODUCTION_URL) ??
    normalizeOrigin(process.env.VERCEL_URL) ??
    LOCAL_ORIGIN
  );
}

export function getMetadataBase() {
  return new URL(getConfiguredOrigin());
}

export function getRequestOrigin(request: Request) {
  const forwardedProtocol = request.headers.get("x-forwarded-proto");
  const forwardedHost = request.headers.get("x-forwarded-host");

  if (forwardedProtocol && forwardedHost) {
    return `${forwardedProtocol}://${forwardedHost}`;
  }

  return new URL(request.url).origin;
}

export function toAbsoluteUrl(origin: string, href: string) {
  return new URL(href, origin).toString();
}

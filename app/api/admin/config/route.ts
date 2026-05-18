import { getSiteContent } from "@/data/localized-site";
import {
  getAdminProjectRows,
  normalizeAdminConfig,
  readAdminConfig,
  writeAdminConfig,
} from "@/lib/admin-config";
import { hasAdminRequestSession } from "@/lib/admin-auth";
import { readCodexLoreIndex } from "@/lib/codex-lore-storage";
import { DEFAULT_SITE_LANGUAGE } from "@/lib/i18n";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function getAdminConfigPayload() {
  const [config, loreIndex] = await Promise.all([
    readAdminConfig(),
    readCodexLoreIndex(),
  ]);
  const content = getSiteContent(DEFAULT_SITE_LANGUAGE);

  return {
    config,
    index: {
      generatedAt: loreIndex.generatedAt,
      totals: loreIndex.totals,
    },
    projects: getAdminProjectRows(content, loreIndex, config),
  };
}

function unauthorized() {
  return Response.json({ error: "unauthorized" }, { status: 401 });
}

export async function GET(request: Request) {
  if (!hasAdminRequestSession(request)) return unauthorized();

  return Response.json(await getAdminConfigPayload(), {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

export async function PUT(request: Request) {
  if (!hasAdminRequestSession(request)) return unauthorized();

  const payload: unknown = await request.json().catch(() => null);
  const nextConfig = normalizeAdminConfig(
    payload && typeof payload === "object" && "config" in payload
      ? (payload as { config?: unknown }).config
      : payload,
  );

  await writeAdminConfig(nextConfig);

  return Response.json(await getAdminConfigPayload(), {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

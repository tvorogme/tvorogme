import {
  CODEX_LORE_INITIAL_ENTRY_LIMIT,
  createCodexLorePublicIndex,
  isCodexLoreIndex,
} from "@/lib/codex-lore";
import {
  readCodexLoreIndex,
  writeCodexLoreIndex,
} from "@/lib/codex-lore-storage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function hasValidIngestSecret(request: Request) {
  const secret = process.env.CODEX_LORELOG_SECRET;

  if (!secret) return process.env.NODE_ENV !== "production";

  return request.headers.get("authorization") === `Bearer ${secret}`;
}

function getEntryLimit(request: Request) {
  const url = new URL(request.url);
  const rawLimit = url.searchParams.get("entryLimit");

  if (rawLimit === null) return CODEX_LORE_INITIAL_ENTRY_LIMIT;

  const limit = Number(rawLimit);

  return Number.isFinite(limit) ? limit : CODEX_LORE_INITIAL_ENTRY_LIMIT;
}

export async function GET(request: Request) {
  const index = await readCodexLoreIndex();

  return Response.json(createCodexLorePublicIndex(index, {
    entryLimit: getEntryLimit(request),
  }), {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

export async function POST(request: Request) {
  if (!hasValidIngestSecret(request)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const payload: unknown = await request.json();

  if (!isCodexLoreIndex(payload)) {
    return Response.json({ error: "invalid_lorelog_payload" }, { status: 400 });
  }

  await writeCodexLoreIndex(payload);

  return Response.json({
    generatedAt: payload.generatedAt,
    ok: true,
  });
}

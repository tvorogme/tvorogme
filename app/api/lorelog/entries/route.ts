import {
  CODEX_LORE_ENTRY_PAGE_LIMIT,
  createCodexLoreEntryPage,
} from "@/lib/codex-lore";
import { readCodexLoreIndex } from "@/lib/codex-lore-storage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function getNumericSearchParam(
  request: Request,
  key: string,
  fallback: number,
) {
  const url = new URL(request.url);
  const rawValue = url.searchParams.get(key);

  if (rawValue === null) return fallback;

  const value = Number(rawValue);

  return Number.isFinite(value) ? value : fallback;
}

export async function GET(request: Request) {
  const index = await readCodexLoreIndex();

  return Response.json(
    createCodexLoreEntryPage(index, {
      limit: getNumericSearchParam(
        request,
        "limit",
        CODEX_LORE_ENTRY_PAGE_LIMIT,
      ),
      offset: getNumericSearchParam(request, "offset", 0),
    }),
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}

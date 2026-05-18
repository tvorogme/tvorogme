import {
  EMPTY_CODEX_LORE_INDEX,
  isCodexLoreIndex,
  type CodexLoreIndex,
} from "@/lib/codex-lore";
import fs from "node:fs/promises";
import path from "node:path";

export const CODEX_LORE_INDEX_PATH =
  process.env.CODEX_LORELOG_INDEX_PATH ??
  path.join(
    /* turbopackIgnore: true */ process.cwd(),
    ".tvorogme-lorelog",
    "codex-lore-index.json",
  );

export async function readCodexLoreIndex(): Promise<CodexLoreIndex> {
  try {
    const file = await fs.readFile(
      /* turbopackIgnore: true */ CODEX_LORE_INDEX_PATH,
      "utf8",
    );
    const payload: unknown = JSON.parse(file);

    return isCodexLoreIndex(payload) ? payload : EMPTY_CODEX_LORE_INDEX;
  } catch {
    return EMPTY_CODEX_LORE_INDEX;
  }
}

export async function writeCodexLoreIndex(index: CodexLoreIndex) {
  await fs.mkdir(
    path.dirname(/* turbopackIgnore: true */ CODEX_LORE_INDEX_PATH),
    { recursive: true },
  );
  await fs.writeFile(
    /* turbopackIgnore: true */ CODEX_LORE_INDEX_PATH,
    JSON.stringify(index, null, 2),
  );
}

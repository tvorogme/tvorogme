export type CodexLoreRank = "SS" | "S" | "A" | "B" | "C" | "F";

export type CodexLoreWindowKey = "24h" | "7d" | "1m";

export type CodexLoreProjectWindow = {
  readonly promptCount: number;
  readonly sessionCount: number;
  readonly filesTouched: number;
  readonly linesAdded: number;
  readonly linesRemoved: number;
};

export type CodexLoreTotals = {
  readonly promptCount: number;
  readonly sessionCount: number;
  readonly filesTouched: number;
  readonly linesAdded: number;
  readonly linesRemoved: number;
  readonly workspaceFiles: number;
  readonly workspaceLines: number;
  readonly activeProjectCount: number;
};

export type CodexLoreProject = {
  readonly id: string;
  readonly name: string;
  readonly rank: CodexLoreRank;
  readonly promptCount: number;
  readonly sessionCount: number;
  readonly filesTouched: number;
  readonly linesAdded: number;
  readonly linesRemoved: number;
  readonly workspaceFiles: number;
  readonly workspaceLines: number;
  readonly lastActivityAt: string | null;
  readonly activityScore: number;
  readonly activityWindows?: Partial<
    Record<CodexLoreWindowKey, CodexLoreProjectWindow>
  >;
};

export type CodexLorePromptRune = {
  readonly label: string;
  readonly text: string;
};

export type CodexLoreEntry = {
  readonly id: string;
  readonly date: string;
  readonly projectId: string;
  readonly projectName: string;
  readonly rank: CodexLoreRank;
  readonly title: string;
  readonly text: string;
  readonly kind: "session" | "milestone" | "sync";
  readonly promptCount: number;
  readonly filesTouched: number;
  readonly linesAdded: number;
  readonly linesRemoved: number;
  readonly publicTitle?: string;
  readonly changeSummary?: string;
  readonly promptRunes?: readonly CodexLorePromptRune[];
  readonly excerpt?: string;
};

export type CodexLoreIndex = {
  readonly generatedAt: string;
  readonly siteId: "tvorog.me";
  readonly source: {
    readonly mode: "local-publisher";
    readonly codexHome: string;
    readonly workspaceRoot: string;
    readonly includePromptExcerpts: boolean;
  };
  readonly totals: CodexLoreTotals;
  readonly projects: readonly CodexLoreProject[];
  readonly entries: readonly CodexLoreEntry[];
};

export type CodexLorePublicIndex = {
  readonly generatedAt: string;
  readonly siteId: "tvorog.me";
  readonly totals: CodexLoreTotals;
  readonly projects: readonly CodexLoreProject[];
  readonly entries: readonly CodexLoreEntry[];
  readonly entryCount: number;
};

export type CodexLoreEntryPage = {
  readonly generatedAt: string;
  readonly siteId: "tvorog.me";
  readonly entries: readonly CodexLoreEntry[];
  readonly entryCount: number;
  readonly limit: number;
  readonly offset: number;
};

export const CODEX_LORE_INITIAL_ENTRY_LIMIT = 24;
export const CODEX_LORE_ENTRY_PAGE_LIMIT = 24;
export const CODEX_LORE_ENTRY_PAGE_MAX_LIMIT = 96;

export const EMPTY_CODEX_LORE_INDEX: CodexLoreIndex = {
  entries: [],
  generatedAt: "1970-01-01T00:00:00.000Z",
  projects: [],
  siteId: "tvorog.me",
  source: {
    codexHome: "",
    includePromptExcerpts: false,
    mode: "local-publisher",
    workspaceRoot: "",
  },
  totals: {
    activeProjectCount: 0,
    filesTouched: 0,
    linesAdded: 0,
    linesRemoved: 0,
    promptCount: 0,
    sessionCount: 0,
    workspaceFiles: 0,
    workspaceLines: 0,
  },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isStringOrNull(value: unknown): value is string | null {
  return typeof value === "string" || value === null;
}

function isRank(value: unknown): value is CodexLoreRank {
  return (
    value === "SS" ||
    value === "S" ||
    value === "A" ||
    value === "B" ||
    value === "C" ||
    value === "F"
  );
}

function isCodexLoreProject(value: unknown): value is CodexLoreProject {
  if (!isRecord(value)) return false;

  return (
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    isRank(value.rank) &&
    isNumber(value.promptCount) &&
    isNumber(value.sessionCount) &&
    isNumber(value.filesTouched) &&
    isNumber(value.linesAdded) &&
    isNumber(value.linesRemoved) &&
    isNumber(value.workspaceFiles) &&
    isNumber(value.workspaceLines) &&
    isStringOrNull(value.lastActivityAt) &&
    isNumber(value.activityScore) &&
    (value.activityWindows === undefined ||
      isCodexLoreActivityWindows(value.activityWindows))
  );
}

function isCodexLoreProjectWindow(
  value: unknown,
): value is CodexLoreProjectWindow {
  if (!isRecord(value)) return false;

  return (
    isNumber(value.promptCount) &&
    isNumber(value.sessionCount) &&
    isNumber(value.filesTouched) &&
    isNumber(value.linesAdded) &&
    isNumber(value.linesRemoved)
  );
}

function isCodexLoreActivityWindows(value: unknown) {
  if (!isRecord(value)) return false;

  return (
    (value["24h"] === undefined ||
      isCodexLoreProjectWindow(value["24h"])) &&
    (value["7d"] === undefined || isCodexLoreProjectWindow(value["7d"])) &&
    (value["1m"] === undefined || isCodexLoreProjectWindow(value["1m"]))
  );
}

function isCodexLoreTotals(value: unknown): value is CodexLoreTotals {
  if (!isRecord(value)) return false;

  return (
    isNumber(value.promptCount) &&
    isNumber(value.sessionCount) &&
    isNumber(value.filesTouched) &&
    isNumber(value.linesAdded) &&
    isNumber(value.linesRemoved) &&
    isNumber(value.workspaceFiles) &&
    isNumber(value.workspaceLines) &&
    isNumber(value.activeProjectCount)
  );
}

function isCodexLorePromptRune(value: unknown): value is CodexLorePromptRune {
  if (!isRecord(value)) return false;

  return typeof value.label === "string" && typeof value.text === "string";
}

function isCodexLoreEntry(value: unknown): value is CodexLoreEntry {
  if (!isRecord(value)) return false;

  return (
    typeof value.id === "string" &&
    typeof value.date === "string" &&
    typeof value.projectId === "string" &&
    typeof value.projectName === "string" &&
    isRank(value.rank) &&
    typeof value.title === "string" &&
    typeof value.text === "string" &&
    (value.kind === "session" ||
      value.kind === "milestone" ||
      value.kind === "sync") &&
    isNumber(value.promptCount) &&
    isNumber(value.filesTouched) &&
    isNumber(value.linesAdded) &&
    isNumber(value.linesRemoved) &&
    (value.publicTitle === undefined || typeof value.publicTitle === "string") &&
    (value.changeSummary === undefined ||
      typeof value.changeSummary === "string") &&
    (value.promptRunes === undefined ||
      (Array.isArray(value.promptRunes) &&
        value.promptRunes.every(isCodexLorePromptRune))) &&
    (value.excerpt === undefined || typeof value.excerpt === "string")
  );
}

export function isCodexLoreIndex(value: unknown): value is CodexLoreIndex {
  if (!isRecord(value)) return false;
  if (value.siteId !== "tvorog.me") return false;
  if (typeof value.generatedAt !== "string") return false;
  if (!isRecord(value.source) || !isRecord(value.totals)) return false;
  if (!Array.isArray(value.projects) || !Array.isArray(value.entries)) {
    return false;
  }

  return (
    value.source.mode === "local-publisher" &&
    typeof value.source.codexHome === "string" &&
    typeof value.source.workspaceRoot === "string" &&
    typeof value.source.includePromptExcerpts === "boolean" &&
    isCodexLoreTotals(value.totals) &&
    value.projects.every(isCodexLoreProject) &&
    value.entries.every(isCodexLoreEntry)
  );
}

function normalizeEntryLimit(value: number | undefined, fallback: number) {
  if (!isNumber(value)) return fallback;

  return Math.min(
    CODEX_LORE_ENTRY_PAGE_MAX_LIMIT,
    Math.max(0, Math.floor(value)),
  );
}

function normalizeEntryOffset(value: number | undefined) {
  if (!isNumber(value)) return 0;

  return Math.max(0, Math.floor(value));
}

export function createCodexLorePublicIndex(
  index: CodexLoreIndex,
  options: { readonly entryLimit?: number } = {},
): CodexLorePublicIndex {
  const entryLimit = normalizeEntryLimit(
    options.entryLimit,
    CODEX_LORE_INITIAL_ENTRY_LIMIT,
  );

  return {
    entries: index.entries.slice(0, entryLimit),
    entryCount: index.entries.length,
    generatedAt: index.generatedAt,
    projects: index.projects,
    siteId: index.siteId,
    totals: index.totals,
  };
}

export function createCodexLoreEntryPage(
  index: CodexLoreIndex,
  options: { readonly limit?: number; readonly offset?: number } = {},
): CodexLoreEntryPage {
  const offset = normalizeEntryOffset(options.offset);
  const limit = normalizeEntryLimit(options.limit, CODEX_LORE_ENTRY_PAGE_LIMIT);

  return {
    entries: index.entries.slice(offset, offset + limit),
    entryCount: index.entries.length,
    generatedAt: index.generatedAt,
    limit,
    offset,
    siteId: index.siteId,
  };
}

export function isCodexLorePublicIndex(
  value: unknown,
): value is CodexLorePublicIndex {
  if (!isRecord(value)) return false;

  return (
    value.siteId === "tvorog.me" &&
    typeof value.generatedAt === "string" &&
    isCodexLoreTotals(value.totals) &&
    Array.isArray(value.projects) &&
    value.projects.every(isCodexLoreProject) &&
    Array.isArray(value.entries) &&
    value.entries.every(isCodexLoreEntry) &&
    isNumber(value.entryCount)
  );
}

export function isCodexLoreEntryPage(
  value: unknown,
): value is CodexLoreEntryPage {
  if (!isRecord(value)) return false;

  return (
    value.siteId === "tvorog.me" &&
    typeof value.generatedAt === "string" &&
    Array.isArray(value.entries) &&
    value.entries.every(isCodexLoreEntry) &&
    isNumber(value.entryCount) &&
    isNumber(value.limit) &&
    isNumber(value.offset)
  );
}

export function formatCodexLoreNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

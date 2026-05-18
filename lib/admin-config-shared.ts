export const ADMIN_PROJECT_BUCKETS = ["active", "sleep", "paused"] as const;

export type AdminProjectBucket = (typeof ADMIN_PROJECT_BUCKETS)[number];

export const ADMIN_PROMPT_MODES = ["runes", "excerpts", "hidden"] as const;

export type AdminPromptMode = (typeof ADMIN_PROMPT_MODES)[number];

export type CodexStreamSettings = {
  readonly activeOnly: boolean;
  readonly activeWindowMinutes: number;
  readonly days: number;
  readonly enabled: boolean;
  readonly includeArchived: boolean;
  readonly intervalMinutes: number;
  readonly serverUrl: string;
};

export type CodexPromptSettings = {
  readonly excerptLength: number;
  readonly mode: AdminPromptMode;
  readonly runeLimit: number;
};

export type AdminConfig = {
  readonly codexStream: CodexStreamSettings;
  readonly projectBuckets: Record<string, AdminProjectBucket>;
  readonly prompts: CodexPromptSettings;
  readonly updatedAt: string;
  readonly version: 1;
};

export type AdminProjectRow = {
  readonly activityScore: number;
  readonly bucket: AdminProjectBucket;
  readonly filesTouched: number;
  readonly id: string;
  readonly lastActivityAt: string | null;
  readonly name: string;
  readonly progress: number;
  readonly promptCount: number;
  readonly sessionCount: number;
  readonly status: string;
  readonly summary: string;
};

export type AdminAuthStatus = {
  readonly configured: boolean;
  readonly sessionSecretConfigured: boolean;
  readonly username: string;
  readonly usesDevDefault: boolean;
};

export const DEFAULT_CODEX_STREAM_SETTINGS: CodexStreamSettings = {
  activeOnly: true,
  activeWindowMinutes: 15,
  days: 180,
  enabled: true,
  includeArchived: false,
  intervalMinutes: 10,
  serverUrl: "",
};

export const DEFAULT_CODEX_PROMPT_SETTINGS: CodexPromptSettings = {
  excerptLength: 160,
  mode: "runes",
  runeLimit: 3,
};

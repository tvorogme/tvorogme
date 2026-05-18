import type { SiteContent } from "@/data/localized-site";
import {
  activeQuests,
  incubatingQuests,
  pausedQuests,
  type ProjectStatus,
  type Quest,
} from "@/data/site";
import {
  ADMIN_PROJECT_BUCKETS,
  DEFAULT_CODEX_PROMPT_SETTINGS,
  DEFAULT_CODEX_STREAM_SETTINGS,
  type AdminConfig,
  type AdminProjectBucket,
  type AdminProjectRow,
  type CodexPromptSettings,
  type CodexStreamSettings,
} from "@/lib/admin-config-shared";
import type { CodexLoreIndex } from "@/lib/codex-lore";
import fs from "node:fs/promises";
import path from "node:path";

const DEFAULT_ADMIN_CONFIG_PATH = path.join(
  process.cwd(),
  ".tvorogme-lorelog",
  "admin-config.json",
);

export const ADMIN_CONFIG_PATH =
  process.env.TVOROGME_ADMIN_CONFIG_PATH ?? DEFAULT_ADMIN_CONFIG_PATH;

const bucketSet = new Set<string>(ADMIN_PROJECT_BUCKETS);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function clampNumber(value: unknown, fallback: number, min: number, max: number) {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : Number.NaN;

  if (!Number.isFinite(parsed)) return fallback;

  return Math.min(max, Math.max(min, Math.round(parsed)));
}

function normalizeBucket(
  value: unknown,
  fallback: AdminProjectBucket,
): AdminProjectBucket {
  return typeof value === "string" && bucketSet.has(value)
    ? (value as AdminProjectBucket)
    : fallback;
}

function getUniqueQuests(questGroups: readonly (readonly Quest[])[]) {
  const seen = new Set<string>();
  const quests: Quest[] = [];

  for (const group of questGroups) {
    for (const quest of group) {
      if (seen.has(quest.id)) continue;

      seen.add(quest.id);
      quests.push(quest);
    }
  }

  return quests;
}

function getDefaultProjectBuckets() {
  const buckets: Record<string, AdminProjectBucket> = {};

  for (const quest of activeQuests) {
    buckets[quest.id] = "active";
  }

  for (const quest of incubatingQuests) {
    buckets[quest.id] = "sleep";
  }

  for (const quest of pausedQuests) {
    buckets[quest.id] = "paused";
  }

  return buckets;
}

function normalizeProjectBuckets(value: unknown) {
  const defaults = getDefaultProjectBuckets();
  const buckets = { ...defaults };

  if (!isRecord(value)) return buckets;

  for (const [projectId, bucket] of Object.entries(value)) {
    if (!projectId.trim()) continue;

    buckets[projectId] = normalizeBucket(bucket, defaults[projectId] ?? "sleep");
  }

  return buckets;
}

function normalizeStreamSettings(value: unknown): CodexStreamSettings {
  const source = isRecord(value) ? value : {};

  return {
    activeOnly:
      typeof source.activeOnly === "boolean"
        ? source.activeOnly
        : DEFAULT_CODEX_STREAM_SETTINGS.activeOnly,
    activeWindowMinutes: clampNumber(
      source.activeWindowMinutes,
      DEFAULT_CODEX_STREAM_SETTINGS.activeWindowMinutes,
      1,
      1440,
    ),
    days: clampNumber(
      source.days,
      DEFAULT_CODEX_STREAM_SETTINGS.days,
      1,
      3650,
    ),
    enabled:
      typeof source.enabled === "boolean"
        ? source.enabled
        : DEFAULT_CODEX_STREAM_SETTINGS.enabled,
    includeArchived:
      typeof source.includeArchived === "boolean"
        ? source.includeArchived
        : DEFAULT_CODEX_STREAM_SETTINGS.includeArchived,
    intervalMinutes: clampNumber(
      source.intervalMinutes,
      DEFAULT_CODEX_STREAM_SETTINGS.intervalMinutes,
      1,
      1440,
    ),
    serverUrl:
      typeof source.serverUrl === "string"
        ? source.serverUrl.trim()
        : DEFAULT_CODEX_STREAM_SETTINGS.serverUrl,
  };
}

function normalizePromptSettings(value: unknown): CodexPromptSettings {
  const source = isRecord(value) ? value : {};
  const mode =
    typeof source.mode === "string" &&
    (source.mode === "runes" ||
      source.mode === "excerpts" ||
      source.mode === "hidden")
      ? source.mode
      : DEFAULT_CODEX_PROMPT_SETTINGS.mode;

  return {
    excerptLength: clampNumber(
      source.excerptLength,
      DEFAULT_CODEX_PROMPT_SETTINGS.excerptLength,
      40,
      500,
    ),
    mode,
    runeLimit: clampNumber(
      source.runeLimit,
      DEFAULT_CODEX_PROMPT_SETTINGS.runeLimit,
      0,
      8,
    ),
  };
}

export function normalizeAdminConfig(value: unknown): AdminConfig {
  const source = isRecord(value) ? value : {};

  return {
    codexStream: normalizeStreamSettings(source.codexStream),
    projectBuckets: normalizeProjectBuckets(source.projectBuckets),
    prompts: normalizePromptSettings(source.prompts),
    updatedAt:
      typeof source.updatedAt === "string"
        ? source.updatedAt
        : new Date(0).toISOString(),
    version: 1,
  };
}

export async function readAdminConfig(): Promise<AdminConfig> {
  try {
    const file = await fs.readFile(
      /* turbopackIgnore: true */ ADMIN_CONFIG_PATH,
      "utf8",
    );

    return normalizeAdminConfig(JSON.parse(file));
  } catch {
    return normalizeAdminConfig(null);
  }
}

export async function writeAdminConfig(config: AdminConfig) {
  const normalized = normalizeAdminConfig({
    ...config,
    updatedAt: new Date().toISOString(),
  });

  await fs.mkdir(path.dirname(/* turbopackIgnore: true */ ADMIN_CONFIG_PATH), {
    recursive: true,
  });
  await fs.writeFile(
    /* turbopackIgnore: true */ ADMIN_CONFIG_PATH,
    JSON.stringify(normalized, null, 2),
    "utf8",
  );

  return normalized;
}

function getBucketedQuest(
  quest: Quest,
  bucket: AdminProjectBucket,
  originalBucket: AdminProjectBucket,
): Quest {
  if (bucket === originalBucket) return quest;

  const statusByBucket: Record<AdminProjectBucket, ProjectStatus> = {
    active: "NEWLY-BORN",
    paused: "PAUSED",
    sleep: "PLANNED",
  };
  const labelByBucket: Record<AdminProjectBucket, string> = {
    active: "Active",
    paused: "Paused",
    sleep: "Sleep",
  };

  return {
    ...quest,
    displayStatus: labelByBucket[bucket],
    status: statusByBucket[bucket],
  };
}

export function applyAdminProjectBuckets(
  content: SiteContent,
  config: AdminConfig,
): SiteContent {
  const originalBuckets = new Map<string, AdminProjectBucket>();

  for (const quest of content.activeQuests) originalBuckets.set(quest.id, "active");
  for (const quest of content.incubatingQuests) originalBuckets.set(quest.id, "sleep");
  for (const quest of content.pausedQuests) originalBuckets.set(quest.id, "paused");

  const allQuests = getUniqueQuests([
    content.activeQuests,
    content.incubatingQuests,
    content.pausedQuests,
  ]);
  const grouped: Record<AdminProjectBucket, Quest[]> = {
    active: [],
    paused: [],
    sleep: [],
  };

  for (const quest of allQuests) {
    const originalBucket = originalBuckets.get(quest.id) ?? "sleep";
    const bucket = config.projectBuckets[quest.id] ?? originalBucket;

    grouped[bucket].push(getBucketedQuest(quest, bucket, originalBucket));
  }

  return {
    ...content,
    activeQuests: grouped.active,
    incubatingQuests: grouped.sleep,
    pausedQuests: grouped.paused,
  };
}

export function getBaseAdminQuests() {
  return getUniqueQuests([activeQuests, incubatingQuests, pausedQuests]);
}

export function getAdminProjectRows(
  content: SiteContent,
  index: CodexLoreIndex,
  config: AdminConfig,
): readonly AdminProjectRow[] {
  const loreProjects = new Map(index.projects.map((project) => [project.id, project]));
  const allQuests = getUniqueQuests([
    content.activeQuests,
    content.incubatingQuests,
    content.pausedQuests,
  ]);

  return allQuests.map((quest) => {
    const loreProject = loreProjects.get(quest.id);
    const fallbackBucket =
      activeQuests.some((item) => item.id === quest.id)
        ? "active"
        : pausedQuests.some((item) => item.id === quest.id)
          ? "paused"
          : "sleep";

    return {
      activityScore: loreProject?.activityScore ?? 0,
      bucket: config.projectBuckets[quest.id] ?? fallbackBucket,
      filesTouched: loreProject?.filesTouched ?? 0,
      id: quest.id,
      lastActivityAt: loreProject?.lastActivityAt ?? null,
      name: quest.name,
      progress: quest.progress,
      promptCount: loreProject?.promptCount ?? 0,
      sessionCount: loreProject?.sessionCount ?? 0,
      status: quest.displayStatus ?? quest.status,
      summary: quest.summary,
    };
  });
}

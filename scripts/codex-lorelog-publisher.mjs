#!/usr/bin/env node
import fs from "node:fs";
import fsp from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const WORKSPACE_ROOT = path.resolve(
  process.env.CODEX_LORELOG_WORKSPACE ?? process.cwd(),
);
const CODEX_HOME = path.resolve(
  process.env.CODEX_HOME ?? path.join(os.homedir(), ".codex"),
);
const DEFAULT_INDEX_PATH = path.join(
  WORKSPACE_ROOT,
  ".tvorogme-lorelog",
  "codex-lore-index.json",
);
const DEFAULT_ADMIN_CONFIG_PATH = path.join(
  WORKSPACE_ROOT,
  ".tvorogme-lorelog",
  "admin-config.json",
);
const ADMIN_CONFIG_PATH = path.resolve(
  process.env.TVOROGME_ADMIN_CONFIG_PATH ?? DEFAULT_ADMIN_CONFIG_PATH,
);
const DEFAULT_SERVER_URL =
  process.env.CODEX_LORELOG_SERVER ??
  `http://127.0.0.1:${process.env.PORT ?? "3000"}/api/codex-subscription/lorelog`;
const DEFAULT_INTERVAL_MS = 10 * 60 * 1000;
const DEFAULT_ACTIVE_WINDOW_MS = 15 * 60 * 1000;
const DEFAULT_DAYS = 180;
const DEFAULT_PROMPT_RUNE_LIMIT = 3;
const DEFAULT_PROMPT_EXCERPT_LENGTH = 160;
const ACTIVITY_WINDOWS = {
  "24h": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
  "1m": 30 * 24 * 60 * 60 * 1000,
};

const PROJECTS = [
  {
    aliases: [
      "tvorog.me",
      "tvorogme",
      "personal site",
      "personal website",
      "lorelog",
      "blogging",
      "codex-subscription",
      "article",
      "translation",
    ],
    id: "tvorogme",
    name: "tvorog.me",
    roots: [WORKSPACE_ROOT, path.join(path.dirname(WORKSPACE_ROOT), "tvorogme")],
  },
  {
    aliases: ["xenage", "agent orchestrator", "startup agent"],
    id: "xenage",
    name: "Xenage",
    roots: [
      path.join(path.dirname(WORKSPACE_ROOT), "xenage"),
      path.join(path.dirname(WORKSPACE_ROOT), "xenage_github"),
    ],
  },
  {
    aliases: ["sanges", "sandbox", "isolated space"],
    id: "sanges",
    name: "Sanges",
    roots: [path.join(path.dirname(WORKSPACE_ROOT), "sanges-second")],
  },
  {
    aliases: ["mxfd", "finance", "financial home-office"],
    id: "mxfd",
    name: "Mxfd",
    roots: [
      path.join(path.dirname(WORKSPACE_ROOT), "mxfd"),
      path.join(path.dirname(WORKSPACE_ROOT), "mxfd_agentic"),
    ],
  },
  {
    aliases: ["maxagents", "telegram agents", "messenger agents"],
    id: "maxagents",
    name: "MaxAgents",
    roots: [path.join(path.dirname(WORKSPACE_ROOT), "maxagents")],
  },
  {
    aliases: ["education game", "math game"],
    id: "education-game",
    name: "Education Game",
    roots: [path.join(path.dirname(WORKSPACE_ROOT), "gameMvp")],
  },
  {
    aliases: ["multiplayer game"],
    id: "multiplayer-game",
    name: "Multiplayer Game",
    roots: [],
  },
  {
    aliases: ["dton", "d ton", "ton index", "liteserver", "defi api"],
    id: "dton",
    name: "dTON",
    roots: [
      path.join(path.dirname(WORKSPACE_ROOT), "dton"),
      path.join(path.dirname(WORKSPACE_ROOT), "dTON"),
    ],
  },
  {
    aliases: ["disintar", "ton nft", "nft marketplace"],
    id: "disintar",
    name: "Disintar",
    roots: [path.join(path.dirname(WORKSPACE_ROOT), "disintar")],
  },
];

const SOURCE_EXTENSIONS = new Set([
  ".c",
  ".cc",
  ".css",
  ".go",
  ".html",
  ".js",
  ".jsx",
  ".json",
  ".md",
  ".mjs",
  ".py",
  ".rs",
  ".sh",
  ".svg",
  ".ts",
  ".tsx",
  ".toml",
  ".yaml",
  ".yml",
]);

const IGNORED_DIRECTORIES = new Set([
  ".git",
  ".mypy_cache",
  ".next",
  ".pytest_cache",
  ".ruff_cache",
  ".tvorogme-lorelog",
  ".tox",
  ".venv",
  "__pycache__",
  "build",
  "coverage",
  "dist",
  "node_modules",
  "target",
  "venv",
  "vendor",
  "vendor_imports",
]);

const IGNORED_FILES = [
  /^app-session-.*\.js$/,
  /^main-.*\.js$/,
  /^worker\.js$/,
  /^package-lock\.json$/,
  /^tsconfig\.tsbuildinfo$/,
  /^yarn\.lock$/,
];

const PUBLIC_LORE_ENTRY_LIMIT = 240;

function readAdminConfig() {
  try {
    return JSON.parse(fs.readFileSync(ADMIN_CONFIG_PATH, "utf8"));
  } catch {
    return {};
  }
}

function readNumber(value, fallback, min, max) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) return fallback;

  return Math.min(max, Math.max(min, Math.round(parsed)));
}

function readPromptMode(value) {
  if (value === "runes" || value === "excerpts" || value === "hidden") {
    return value;
  }

  return "runes";
}

function parseArgs(argv) {
  const adminConfig = readAdminConfig();
  const streamConfig = adminConfig?.codexStream ?? {};
  const promptConfig = adminConfig?.prompts ?? {};
  const flags = new Set(argv.filter((arg) => arg.startsWith("--")));
  const readValue = (name, fallback) => {
    const index = argv.indexOf(name);
    return index >= 0 && argv[index + 1] ? argv[index + 1] : fallback;
  };
  const promptMode = flags.has("--hide-prompts")
    ? "hidden"
    : flags.has("--include-prompt-excerpts")
      ? "excerpts"
      : readPromptMode(promptConfig.mode);

  return {
    activeOnly:
      flags.has("--active-only") ||
      (typeof streamConfig.activeOnly === "boolean"
        ? streamConfig.activeOnly
        : false),
    activeWindowMs: Number(
      readValue(
        "--active-window-ms",
        readNumber(
          streamConfig.activeWindowMinutes,
          DEFAULT_ACTIVE_WINDOW_MS / 60000,
          1,
          1440,
        ) * 60000,
      ),
    ),
    days: Number(
      readValue(
        "--days",
        readNumber(streamConfig.days, DEFAULT_DAYS, 1, 3650),
      ),
    ),
    dryRun: flags.has("--dry-run"),
    includeArchived:
      flags.has("--include-archived") ||
      (typeof streamConfig.includeArchived === "boolean"
        ? streamConfig.includeArchived
        : false),
    includePromptExcerpts: promptMode === "excerpts",
    intervalMs: Number(
      readValue(
        "--interval-ms",
        readNumber(
          streamConfig.intervalMinutes,
          DEFAULT_INTERVAL_MS / 60000,
          1,
          1440,
        ) * 60000,
      ),
    ),
    once: flags.has("--once") || !flags.has("--watch"),
    outputPath: path.resolve(
      readValue(
        "--out",
        process.env.CODEX_LORELOG_INDEX_PATH ?? DEFAULT_INDEX_PATH,
      ),
    ),
    promptExcerptLength: readNumber(
      readValue("--prompt-excerpt-length", promptConfig.excerptLength),
      DEFAULT_PROMPT_EXCERPT_LENGTH,
      40,
      500,
    ),
    promptMode,
    promptRuneLimit: readNumber(
      readValue("--prompt-rune-limit", promptConfig.runeLimit),
      DEFAULT_PROMPT_RUNE_LIMIT,
      0,
      8,
    ),
    serverUrl: readValue(
      "--server",
      typeof streamConfig.serverUrl === "string" && streamConfig.serverUrl
        ? streamConfig.serverUrl
        : DEFAULT_SERVER_URL,
    ),
    streamEnabled:
      !flags.has("--no-publish") &&
      (typeof streamConfig.enabled === "boolean" ? streamConfig.enabled : true),
    watch: flags.has("--watch"),
  };
}

function listJsonlFiles(root, sinceMs) {
  const files = [];

  function visit(directory) {
    let entries;

    try {
      entries = fs.readdirSync(directory, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const filePath = path.join(directory, entry.name);

      if (entry.isDirectory()) {
        visit(filePath);
        continue;
      }

      if (!entry.isFile() || !entry.name.endsWith(".jsonl")) continue;

      const stats = fs.statSync(filePath);

      if (stats.mtimeMs >= sinceMs) {
        files.push({ filePath, mtimeMs: stats.mtimeMs });
      }
    }
  }

  visit(root);

  return files;
}

function readSessionIndex() {
  const indexPath = path.join(CODEX_HOME, "session_index.jsonl");
  const byId = new Map();

  try {
    const lines = fs.readFileSync(indexPath, "utf8").split(/\r?\n/);

    for (const line of lines) {
      if (!line.trim()) continue;
      const row = JSON.parse(line);

      if (typeof row.id === "string") {
        byId.set(row.id, {
          threadName: typeof row.thread_name === "string" ? row.thread_name : "",
          updatedAt: typeof row.updated_at === "string" ? row.updated_at : null,
        });
      }
    }
  } catch {
    return byId;
  }

  return byId;
}

function readJsonl(filePath) {
  try {
    return fs
      .readFileSync(filePath, "utf8")
      .split(/\r?\n/)
      .filter(Boolean)
      .flatMap((line) => {
        try {
          return [JSON.parse(line)];
        } catch {
          return [];
        }
      });
  } catch {
    return [];
  }
}

function extractMessageText(payload) {
  const content = payload?.content;

  if (!Array.isArray(content)) return "";

  return content
    .map((item) => {
      if (typeof item?.text === "string") return item.text;
      if (typeof item?.message === "string") return item.message;
      return "";
    })
    .filter(Boolean)
    .join("\n");
}

function extractTaskMessageText(payload) {
  return typeof payload?.message === "string" ? payload.message : "";
}

function hasPromptAttachment(payload) {
  return (
    (Array.isArray(payload?.images) && payload.images.length > 0) ||
    (Array.isArray(payload?.local_images) && payload.local_images.length > 0) ||
    (Array.isArray(payload?.text_elements) && payload.text_elements.length > 0)
  );
}

function isOperationalContextPrompt(text) {
  const trimmed = text.trim();

  if (!trimmed) return true;
  if (trimmed.startsWith("# AGENTS.md instructions")) return true;
  if (trimmed.startsWith("<environment_context>")) return true;
  if (trimmed.includes("<environment_context>") && trimmed.includes("<INSTRUCTIONS>")) {
    return true;
  }
  if (trimmed.startsWith("<turn_aborted>")) return true;

  return false;
}

function summarizePrompt(text, limit = DEFAULT_PROMPT_EXCERPT_LENGTH) {
  return text.replace(/\s+/g, " ").trim().slice(0, limit);
}

function buildPublicTitle(project, session) {
  const areas = classifyChangeAreas(session.filesTouched);
  const primaryArea = areas[0] ?? "workshop files";
  const seal =
    primaryArea === "server runes"
      ? "server seal"
      : primaryArea === "interactive panels"
        ? "panel sigil"
        : primaryArea === "terminal layout"
          ? "layout charm"
          : primaryArea === "local courier scripts"
            ? "courier mark"
            : primaryArea === "Codex plugin scrolls"
              ? "plugin seal"
              : primaryArea === "public story scrolls"
                ? "scroll mark"
                : primaryArea === "quest data"
                  ? "quest seal"
                  : primaryArea === "guild controls"
                    ? "control rune"
                    : "sealed dispatch";

  return `${project.name} / ${seal}`;
}

function promptRuneFor(text) {
  const raw = text.toLowerCase();

  if (!text.trim()) {
    return null;
  }

  if (/lore|guild|prompt|chronicle|history|archive|delete|remove/.test(raw)) {
    return {
      label: "Black Ink",
      text: "private brief, public mark",
    };
  }

  if (/codex-subscription|sse|server|api|script|index|watch|cron|courier/.test(raw)) {
    return {
      label: "Courier Seal",
      text: "local trail refreshed",
    };
  }

  if (/fix|bug|debug|error|repair|broken|regress/.test(raw)) {
    return {
      label: "Mend Mark",
      text: "rough edge softened",
    };
  }

  if (/ui|css|layout|mobile|responsive|design|hover|popover|visual|interface|window|card|style|grid|motion|panel/.test(raw)) {
    return {
      label: "Artificer Mark",
      text: "surface charm adjusted",
    };
  }

  if (/article|translate|translation|rss|mdx|markdown|text/.test(raw)) {
    return {
      label: "Scroll Seal",
      text: "reader path cleaned",
    };
  }

  if (/test|lint|build|typecheck|verify|check/.test(raw)) {
    return {
      label: "Proof Mark",
      text: "trial lamps lit",
    };
  }

  return {
    label: "Sealed Note",
    text: "intent masked",
  };
}

function buildPromptRunes(promptTexts, limit) {
  const seen = new Set();
  const runes = [];

  if (limit <= 0) return runes;

  for (const promptText of promptTexts) {
    const rune = promptRuneFor(promptText);

    if (!rune) continue;

    const key = `${rune.label}:${rune.text}`;

    if (seen.has(key)) continue;

    seen.add(key);
    runes.push(rune);

    if (runes.length >= limit) break;
  }

  return runes;
}

function buildPromptExcerpt(promptTexts, limit) {
  const firstPrompt = promptTexts.find((text) => text.trim());

  return firstPrompt ? summarizePrompt(firstPrompt, limit) : undefined;
}

function formatPublicList(items) {
  if (items.length === 0) return "the hidden workshop";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;

  return `${items.slice(0, -1).join(", ")}, and ${items.at(-1)}`;
}

function classifyChangeAreas(files) {
  const areas = new Set();

  for (const file of files) {
    if (file.startsWith("app/api/") || file.startsWith("lib/")) {
      areas.add("server runes");
    } else if (file.startsWith("components/")) {
      areas.add("interactive panels");
    } else if (file.startsWith("app/") && file.endsWith(".css")) {
      areas.add("terminal layout");
    } else if (file.startsWith("scripts/")) {
      areas.add("local courier scripts");
    } else if (file.startsWith("plugins/") || file.startsWith(".agents/")) {
      areas.add("Codex plugin scrolls");
    } else if (
      file.startsWith("content/") ||
      file === "projects.md" ||
      file === "PROMPT.md"
    ) {
      areas.add("public story scrolls");
    } else if (file.startsWith("data/")) {
      areas.add("quest data");
    } else if (
      file === "package.json" ||
      file === "next.config.ts" ||
      file === "tsconfig.json"
    ) {
      areas.add("guild controls");
    } else {
      areas.add("workshop files");
    }
  }

  return [...areas];
}

function buildChangeSummary(session) {
  const areas = classifyChangeAreas(session.filesTouched);
  const publicAreas = formatPublicList(areas.slice(0, 2));
  const action =
    session.linesAdded > session.linesRemoved * 2
      ? "brightened"
      : session.linesRemoved > session.linesAdded
        ? "thinned"
        : "balanced";

  if (session.filesTouched.size === 0) {
    return "Council held. Ink stayed sealed.";
  }

  return `${publicAreas} ${action}; details remain sealed.`;
}

function analyzePatch(input) {
  const files = new Set();
  let linesAdded = 0;
  let linesRemoved = 0;

  for (const line of input.split(/\r?\n/)) {
    const fileMatch = /^\*\*\* (?:Add|Delete|Update) File: (.+)$/.exec(line);

    if (fileMatch) {
      files.add(fileMatch[1].trim());
      continue;
    }

    if (line.startsWith("+") && !line.startsWith("+++")) {
      linesAdded += 1;
    } else if (line.startsWith("-") && !line.startsWith("---")) {
      linesRemoved += 1;
    }
  }

  return {
    files,
    linesAdded,
    linesRemoved,
  };
}

function extractSessionMetrics(filePath, mtimeMs, sessionIndex) {
  const rows = readJsonl(filePath);
  const meta = rows.find((row) => row.type === "session_meta")?.payload ?? {};
  const id = typeof meta.id === "string" ? meta.id : path.basename(filePath);
  const indexed = sessionIndex.get(id);
  const taskPromptTexts = [];
  const fallbackPromptTexts = [];
  const filesTouched = new Set();
  let linesAdded = 0;
  let linesRemoved = 0;
  let applyPatchCount = 0;
  let toolCallCount = 0;

  for (const row of rows) {
    const payload = row.payload ?? {};

    if (row.type === "event_msg" && payload.type === "user_message") {
      const text = extractTaskMessageText(payload);

      if (!isOperationalContextPrompt(text) || hasPromptAttachment(payload)) {
        taskPromptTexts.push(text);
      }

      continue;
    }

    if (row.type !== "response_item") continue;

    if (payload.type === "message" && payload.role === "user") {
      const text = extractMessageText(payload);

      if (!isOperationalContextPrompt(text)) {
        fallbackPromptTexts.push(text);
      }

      continue;
    }

    if (payload.type === "function_call" || payload.type === "custom_tool_call") {
      toolCallCount += 1;
    }

    if (
      payload.name === "apply_patch" &&
      (payload.type === "function_call" || payload.type === "custom_tool_call")
    ) {
      const patchInput =
        typeof payload.input === "string"
          ? payload.input
          : typeof payload.arguments === "string"
            ? payload.arguments
            : "";
      const patchStats = analyzePatch(patchInput);

      applyPatchCount += 1;
      linesAdded += patchStats.linesAdded;
      linesRemoved += patchStats.linesRemoved;
      patchStats.files.forEach((file) => filesTouched.add(file));
    }
  }

  const promptTexts = taskPromptTexts.length > 0 ? taskPromptTexts : fallbackPromptTexts;
  const previewPrompt = promptTexts.find((text) => text.trim()) ?? "";

  return {
    applyPatchCount,
    cwd: typeof meta.cwd === "string" ? meta.cwd : "",
    filePath,
    filesTouched,
    id,
    linesAdded,
    linesRemoved,
    promptCount: promptTexts.length,
    promptTexts,
    promptPreview: previewPrompt ? summarizePrompt(previewPrompt) : "",
    startedAt:
      typeof meta.timestamp === "string"
        ? meta.timestamp
        : new Date(mtimeMs).toISOString(),
    title: indexed?.threadName || inferTitleFromFilename(filePath),
    toolCallCount,
    updatedAt: indexed?.updatedAt ?? new Date(mtimeMs).toISOString(),
  };
}

function inferTitleFromFilename(filePath) {
  return path
    .basename(filePath, ".jsonl")
    .replace(/^rollout-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-/, "")
    .replace(/-/g, " ")
    .trim();
}

function scoreProject(session, project) {
  const cwd = path.resolve(session.cwd || "/");
  const haystack = [
    session.cwd,
    session.title,
    session.promptPreview,
    [...session.filesTouched].join(" "),
  ]
    .join("\n")
    .toLowerCase();
  let score = 0;

  for (const root of project.roots) {
    const resolvedRoot = path.resolve(root);

    if (cwd === resolvedRoot || cwd.startsWith(`${resolvedRoot}${path.sep}`)) {
      score += 120;
    }

    const basename = path.basename(resolvedRoot).toLowerCase();

    if (basename && haystack.includes(basename)) {
      score += 25;
    }
  }

  for (const alias of project.aliases) {
    if (haystack.includes(alias.toLowerCase())) {
      score += 18;
    }
  }

  if (project.id === "tvorogme" && cwd === WORKSPACE_ROOT) {
    score += 160;
  }

  return score;
}

function matchProject(session) {
  let bestProject = null;
  let bestScore = 0;

  for (const project of PROJECTS) {
    const score = scoreProject(session, project);

    if (score > bestScore) {
      bestProject = project;
      bestScore = score;
    }
  }

  return bestScore >= 20 ? bestProject : null;
}

function scanWorkspaceCode(root) {
  const stats = {
    files: 0,
    lines: 0,
  };

  function visit(directory) {
    let entries;

    try {
      entries = fs.readdirSync(directory, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const filePath = path.join(directory, entry.name);

      if (entry.isDirectory()) {
        if (!IGNORED_DIRECTORIES.has(entry.name)) visit(filePath);
        continue;
      }

      if (!entry.isFile()) continue;
      if (IGNORED_FILES.some((pattern) => pattern.test(entry.name))) continue;
      if (!SOURCE_EXTENSIONS.has(path.extname(entry.name))) continue;

      try {
        const content = fs.readFileSync(filePath, "utf8");

        if (content.includes("\u0000")) continue;

        stats.files += 1;
        stats.lines += content.split(/\r?\n/).length;
      } catch {
        // Ignore files that cannot be read as source text.
      }
    }
  }

  visit(root);

  return stats;
}

function getProjectWorkspaceStats(project) {
  const existingRoots = project.roots.filter((root) => fs.existsSync(root));
  const totals = {
    files: 0,
    lines: 0,
  };

  for (const root of existingRoots) {
    const stats = scanWorkspaceCode(root);

    totals.files += stats.files;
    totals.lines += stats.lines;
  }

  return totals;
}

function rankFor(score) {
  if (score >= 650) return "SS";
  if (score >= 360) return "S";
  if (score >= 180) return "A";
  if (score >= 80) return "B";
  if (score >= 20) return "C";
  return "F";
}

function buildLoreText(project, session) {
  const title = buildPublicTitle(project, session);
  const summary = buildChangeSummary(session);

  return `${title}. ${summary}`;
}

function createEmptyProjectBucket(project) {
  return {
    activityScore: 0,
    filesTouched: new Set(),
    lastActivityAt: null,
    linesAdded: 0,
    linesRemoved: 0,
    name: project.name,
    promptCount: 0,
    sessions: [],
  };
}

function buildActivityWindowStats(sessions, windowMs, nowMs) {
  const filesTouched = new Set();
  const stats = {
    filesTouched: 0,
    linesAdded: 0,
    linesRemoved: 0,
    promptCount: 0,
    sessionCount: 0,
  };

  for (const session of sessions) {
    const updatedAtMs = Date.parse(session.updatedAt);

    if (!Number.isFinite(updatedAtMs) || nowMs - updatedAtMs > windowMs) {
      continue;
    }

    stats.linesAdded += session.linesAdded;
    stats.linesRemoved += session.linesRemoved;
    stats.promptCount += session.promptCount;
    stats.sessionCount += 1;
    session.filesTouched.forEach((file) => filesTouched.add(file));
  }

  return {
    ...stats,
    filesTouched: filesTouched.size,
  };
}

function buildActivityWindows(bucket, nowMs) {
  return Object.fromEntries(
    Object.entries(ACTIVITY_WINDOWS).map(([key, windowMs]) => [
      key,
      buildActivityWindowStats(bucket.sessions, windowMs, nowMs),
    ]),
  );
}

function buildIndex(options) {
  const nowMs = Date.now();
  const sinceMs = nowMs - options.days * 24 * 60 * 60 * 1000;
  const sessionIndex = readSessionIndex();
  const sessionRoots = [path.join(CODEX_HOME, "sessions")];

  if (options.includeArchived) {
    sessionRoots.push(path.join(CODEX_HOME, "archived_sessions"));
  }

  const sessionFiles = sessionRoots.flatMap((root) => listJsonlFiles(root, sinceMs));
  const buckets = new Map(PROJECTS.map((project) => [project.id, createEmptyProjectBucket(project)]));
  const matchedSessions = [];

  for (const sessionFile of sessionFiles) {
    const session = extractSessionMetrics(
      sessionFile.filePath,
      sessionFile.mtimeMs,
      sessionIndex,
    );
    const project = matchProject(session);

    if (!project || session.promptCount === 0) continue;

    const bucket = buckets.get(project.id);

    bucket.promptCount += session.promptCount;
    bucket.linesAdded += session.linesAdded;
    bucket.linesRemoved += session.linesRemoved;
    bucket.activityScore +=
      session.promptCount * 5 +
      session.filesTouched.size * 8 +
      Math.ceil(session.linesAdded / 30) +
      session.applyPatchCount * 12;
    bucket.sessions.push(session);
    session.filesTouched.forEach((file) => bucket.filesTouched.add(file));

    if (!bucket.lastActivityAt || session.updatedAt > bucket.lastActivityAt) {
      bucket.lastActivityAt = session.updatedAt;
    }

    matchedSessions.push({ project, session });
  }

  const projects = PROJECTS.map((project) => {
    const bucket = buckets.get(project.id);
    const workspace = getProjectWorkspaceStats(project);

    return {
      activityScore: bucket.activityScore,
      activityWindows: buildActivityWindows(bucket, nowMs),
      filesTouched: bucket.filesTouched.size,
      id: project.id,
      lastActivityAt: bucket.lastActivityAt,
      linesAdded: bucket.linesAdded,
      linesRemoved: bucket.linesRemoved,
      name: project.name,
      promptCount: bucket.promptCount,
      rank: rankFor(bucket.activityScore),
      sessionCount: bucket.sessions.length,
      workspaceFiles: workspace.files,
      workspaceLines: workspace.lines,
    };
  });

  const entries = matchedSessions
    .sort((left, right) => right.session.updatedAt.localeCompare(left.session.updatedAt))
    .slice(0, PUBLIC_LORE_ENTRY_LIMIT)
    .map(({ project, session }) => {
      const publicTitle = buildPublicTitle(project, session);
      const promptRunes =
        options.promptMode === "hidden"
          ? []
          : buildPromptRunes(session.promptTexts, options.promptRuneLimit);

      return {
        changeSummary: buildChangeSummary(session),
        date: session.updatedAt,
        excerpt:
          options.promptMode === "excerpts"
            ? buildPromptExcerpt(session.promptTexts, options.promptExcerptLength)
            : undefined,
        filesTouched: session.filesTouched.size,
        id: `${session.id}:${project.id}`,
        kind: "session",
        linesAdded: session.linesAdded,
        linesRemoved: session.linesRemoved,
        projectId: project.id,
        projectName: project.name,
        promptCount: session.promptCount,
        promptRunes,
        publicTitle,
        rank: rankFor(
          session.promptCount * 5 +
            session.filesTouched.size * 8 +
            Math.ceil(session.linesAdded / 30) +
            session.applyPatchCount * 12,
        ),
        text: buildLoreText(project, session),
        title: publicTitle,
      };
    });

  const totals = projects.reduce(
    (accumulator, project) => ({
      activeProjectCount:
        accumulator.activeProjectCount +
        (project.promptCount > 0 || project.workspaceFiles > 0 ? 1 : 0),
      filesTouched: accumulator.filesTouched + project.filesTouched,
      linesAdded: accumulator.linesAdded + project.linesAdded,
      linesRemoved: accumulator.linesRemoved + project.linesRemoved,
      promptCount: accumulator.promptCount + project.promptCount,
      sessionCount: accumulator.sessionCount + project.sessionCount,
      workspaceFiles: accumulator.workspaceFiles + project.workspaceFiles,
      workspaceLines: accumulator.workspaceLines + project.workspaceLines,
    }),
    {
      activeProjectCount: 0,
      filesTouched: 0,
      linesAdded: 0,
      linesRemoved: 0,
      promptCount: 0,
      sessionCount: 0,
      workspaceFiles: 0,
      workspaceLines: 0,
    },
  );

  return {
    entries,
    generatedAt: new Date().toISOString(),
    projects,
    siteId: "tvorog.me",
    source: {
      codexHome: CODEX_HOME,
      includePromptExcerpts: options.promptMode === "excerpts",
      mode: "local-publisher",
      workspaceRoot: WORKSPACE_ROOT,
    },
    totals,
  };
}

async function writeIndex(outputPath, index) {
  await fsp.mkdir(path.dirname(outputPath), { recursive: true });
  await fsp.writeFile(outputPath, JSON.stringify(index, null, 2), "utf8");
}

async function publishIndex(serverUrl, index) {
  const headers = {
    "content-type": "application/json",
  };

  if (process.env.CODEX_LORELOG_SECRET) {
    headers.authorization = `Bearer ${process.env.CODEX_LORELOG_SECRET}`;
  }

  const response = await fetch(serverUrl, {
    body: JSON.stringify(index),
    headers,
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(`LoreLog server rejected index: ${response.status}`);
  }
}

function getNewestSessionMtime() {
  const sessionRoots = [
    path.join(CODEX_HOME, "sessions"),
    path.join(CODEX_HOME, "archived_sessions"),
  ];
  let newest = 0;

  for (const root of sessionRoots) {
    for (const file of listJsonlFiles(root, 0)) {
      newest = Math.max(newest, file.mtimeMs);
    }
  }

  return newest;
}

function isCodexRecentlyActive(activeWindowMs) {
  const newest = getNewestSessionMtime();

  return newest > 0 && Date.now() - newest <= activeWindowMs;
}

function printSummary(index, destination) {
  const totals = index.totals;

  console.log(
    [
      `LoreLog index -> ${destination}`,
      `prompts=${totals.promptCount}`,
      `sessions=${totals.sessionCount}`,
      `files=${totals.filesTouched}`,
      `spellcode=+${totals.linesAdded}/-${totals.linesRemoved}`,
      `projects=${totals.activeProjectCount}`,
    ].join(" "),
  );
}

async function publishOnce(options) {
  const index = buildIndex(options);

  if (options.dryRun) {
    printSummary(index, "dry-run");
    return;
  }

  await writeIndex(options.outputPath, index);

  if (!options.streamEnabled) {
    printSummary(index, `${options.outputPath} (stream disabled)`);
    return;
  }

  try {
    await publishIndex(options.serverUrl, index);
    printSummary(index, options.serverUrl);
  } catch (error) {
    printSummary(index, options.outputPath);
    console.warn(error instanceof Error ? error.message : String(error));
  }
}

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.watch) {
    for (;;) {
      if (!options.activeOnly || isCodexRecentlyActive(options.activeWindowMs)) {
        await publishOnce(options);
      } else {
        console.log("Codex is quiet; LoreLog courier is waiting.");
      }

      await wait(options.intervalMs);
    }
  }

  if (options.activeOnly && !isCodexRecentlyActive(options.activeWindowMs)) {
    console.log("Codex is quiet; no LoreLog update published.");
    return;
  }

  await publishOnce(options);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : String(error));
  process.exitCode = 1;
});

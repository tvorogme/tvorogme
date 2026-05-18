"use client";

import {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type KeyboardEvent,
} from "react";
import type { CodexCopy, ProjectPopoverCopy } from "@/data/localized-site";
import type { LoreEntry, Quest } from "@/data/site";
import {
  CODEX_LORE_ENTRY_PAGE_LIMIT,
  formatCodexLoreNumber,
  isCodexLoreEntryPage,
  type CodexLoreEntry,
  type CodexLorePublicIndex,
  type CodexLoreProject,
  type CodexLoreProjectWindow,
  type CodexLoreWindowKey,
} from "@/lib/codex-lore";
import { getCodexLoreProject, useCodexLore } from "./codex-lore-store";
import { CodexDossierStat } from "./codex-dossier-stat";
import {
  loadProjectWindowConfig,
  preloadProjectWindowContent,
} from "./project-window-loader";
import { useWorkspaceWindows } from "./window-manager";

type CodexQuestCountersProps = {
  readonly labels?: CodexCopy;
  readonly projectId: string;
};

type CodexQuestMetricCellsProps = {
  readonly labels?: CodexCopy;
  readonly projectId: string;
};

type CodexQuestMetricFilterProps = {
  readonly labels?: CodexCopy;
};

type CodexLoreLogProps = {
  readonly fallbackEntries: readonly LoreEntry[];
  readonly labels?: CodexCopy;
  readonly projectLabels: ProjectPopoverCopy;
  readonly quests: readonly Quest[];
};

type CodexLoreGraphMetricKey = "promptCount" | "linesAdded" | "filesTouched";

type CodexLoreGraphMetric = {
  readonly color: string;
  readonly key: CodexLoreGraphMetricKey;
  readonly label: string;
  readonly prefix?: string;
  readonly tone: string;
};

type CodexLoreGraphRangeKey = CodexLoreWindowKey | "all";
type CodexLoreChartMode = "bar" | "line";

type CodexProjectResourceRow = {
  readonly project: CodexLoreProject;
  readonly value: number;
};

type OpenProjectHandler = (quest: Quest) => void;

const INITIAL_LORE_ENTRIES = 8;
const LORE_ENTRY_BATCH_SIZE = 8;
const LORELOG_ENTRIES_ENDPOINT = "/api/codex-subscription/lorelog/entries";
const metricWindowListeners = new Set<() => void>();
const metricWindowOptions = [
  { key: "24h", label: "24h" },
  { key: "7d", label: "7d" },
  { key: "1m", label: "1m" },
] as const satisfies readonly {
  readonly key: CodexLoreWindowKey;
  readonly label: string;
}[];
const loreGraphRangeOptions = [
  { key: "24h", label: "24h" },
  { key: "7d", label: "7d" },
  { key: "1m", label: "1m" },
  { key: "all", label: "All" },
] as const satisfies readonly {
  readonly key: CodexLoreGraphRangeKey;
  readonly label: string;
}[];
let selectedMetricWindow: CodexLoreWindowKey = "7d";
const fallbackLabels: CodexCopy = {
  countersTitle: "Codex prompts / touched files / observed patch lines",
  files: "files",
  graph: {
    all: "All",
    aria: "Codex resource graphs",
    bar: "Bar",
    line: "Line",
    noData: "No graph signal yet",
    peak: "Peak",
    title: "Resource Graphs",
    total: "Total",
  },
  guildTraceTitle: "Codex Guild Trace",
  live: "live",
  loreTabs: {
    graph: "Graphs",
    log: "Log",
  },
  promptRunesAria: "Public prompt runes",
  prompts: "Prompts",
  rank: "Rank",
  sessions: "Sessions",
  sourceLinesObserved: "source lines observed",
  spellcode: "Spellcode",
  lines: "Lines",
  status: {
    error: "error",
    loading: "loading",
    ready: "live",
    stale: "stale",
  },
  syncPending: "sync pending",
  touched: "Touched",
  workspaceAnd: "and",
  workspaceHas: "Workspace has",
};
const compactNumberFormat = new Intl.NumberFormat("en-US", {
  compactDisplay: "short",
  notation: "compact",
});
const standardNumberFormat = new Intl.NumberFormat("en-US");
const displayDateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  month: "2-digit",
});

export function CodexQuestCounters({
  labels = fallbackLabels,
  projectId,
}: CodexQuestCountersProps) {
  const { index } = useCodexLore();
  const project = getCodexLoreProject(index, projectId);

  if (!project) {
    return <small className="codexQuestCounters">{labels.syncPending}</small>;
  }

  return (
    <small className="codexQuestCounters" title={labels.countersTitle}>
      {project.promptCount}p / {project.filesTouched}f / +
      {formatCompactNumber(project.linesAdded)}
    </small>
  );
}

function emitMetricWindow(nextWindow: CodexLoreWindowKey) {
  selectedMetricWindow = nextWindow;
  metricWindowListeners.forEach((listener) => listener());
}

function subscribeMetricWindow(listener: () => void) {
  metricWindowListeners.add(listener);

  return () => {
    metricWindowListeners.delete(listener);
  };
}

function getMetricWindowSnapshot() {
  return selectedMetricWindow;
}

export function CodexQuestMetricFilter({
  labels = fallbackLabels,
}: CodexQuestMetricFilterProps) {
  const activeWindow = useSyncExternalStore(
    subscribeMetricWindow,
    getMetricWindowSnapshot,
    getMetricWindowSnapshot,
  );

  return (
    <div className="questMetricFilter" aria-label={labels.countersTitle}>
      {metricWindowOptions.map((option) => (
        <button
          aria-pressed={activeWindow === option.key}
          className="questMetricFilterButton"
          key={option.key}
          onClick={() => emitMetricWindow(option.key)}
          type="button"
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function CodexQuestMetricCells({
  labels = fallbackLabels,
  projectId,
}: CodexQuestMetricCellsProps) {
  const { index } = useCodexLore();
  const activeWindow = useSyncExternalStore(
    subscribeMetricWindow,
    getMetricWindowSnapshot,
    getMetricWindowSnapshot,
  );
  const project = getCodexLoreProject(index, projectId);

  if (!project) {
    return (
      <>
        <span
          aria-label={labels.syncPending}
          className="questMetricCell questMetricCellPending"
          title={labels.syncPending}
        >
          ...
        </span>
        <span
          aria-label={labels.syncPending}
          className="questMetricCell questMetricCellPending"
          title={labels.syncPending}
        >
          ...
        </span>
        <span
          aria-label={labels.syncPending}
          className="questMetricCell questMetricCellPending"
          title={labels.syncPending}
        >
          ...
        </span>
      </>
    );
  }

  const metrics = getProjectMetricsForWindow(project, activeWindow);

  return (
    <>
      <span
        aria-label={`${labels.prompts}: ${metrics.promptCount}`}
        className="questMetricCell"
        title={`${labels.prompts}: ${metrics.promptCount}`}
      >
        {formatCompactNumber(metrics.promptCount)}
      </span>
      <span
        aria-label={`${labels.files}: ${metrics.filesTouched}`}
        className="questMetricCell"
        title={`${labels.files}: ${metrics.filesTouched}`}
      >
        {formatCompactNumber(metrics.filesTouched)}
      </span>
      <span
        aria-label={`${labels.lines}: ${metrics.linesAdded}`}
        className="questMetricCell questMetricCellLines"
        title={`${labels.lines}: ${metrics.linesAdded}`}
      >
        +{formatCompactNumber(metrics.linesAdded)}
      </span>
    </>
  );
}

export function CodexLoreLog({
  fallbackEntries,
  labels = fallbackLabels,
  projectLabels,
  quests,
}: CodexLoreLogProps) {
  const { index, status } = useCodexLore();
  const { openWindow } = useWorkspaceWindows();
  const entries = getDisplayEntries(index, fallbackEntries);
  const entryCount = index?.entryCount ?? fallbackEntries.length;
  const indexVersion = index?.generatedAt ?? "fallback";
  const questsById = useMemo(
    () => new Map(quests.map((quest) => [quest.id, quest])),
    [quests],
  );
  const openProject = useCallback(
    (quest: Quest) => {
      void loadProjectWindowConfig({
        codexLabels: labels,
        labels: projectLabels,
        quest,
      }).then((windowConfig) => {
        startTransition(() => openWindow(windowConfig));
      });
    },
    [labels, openWindow, projectLabels],
  );

  return (
    <div className="codexLoreLog">
      <CodexLoreSummary index={index} labels={labels} />
      <div className="codexLoreTabs">
        <input
          className="codexLoreTabInput"
          id="codex-lore-tab-log"
          name="codex-lore-tabs"
          suppressHydrationWarning
          type="radio"
        />
        <input
          className="codexLoreTabInput"
          defaultChecked
          id="codex-lore-tab-graph"
          name="codex-lore-tabs"
          suppressHydrationWarning
          type="radio"
        />
        <div
          aria-label={labels.countersTitle}
          className="codexLoreTabList"
          role="tablist"
        >
          <label
            htmlFor="codex-lore-tab-log"
            id="codex-lore-tab-log-label"
            role="tab"
          >
            {labels.loreTabs.log}
          </label>
          <label
            htmlFor="codex-lore-tab-graph"
            id="codex-lore-tab-graph-label"
            role="tab"
          >
            {labels.loreTabs.graph}
          </label>
        </div>
        <div
          aria-labelledby="codex-lore-tab-log-label"
          className="codexLoreTabPanel codexLoreTabPanelLog"
          role="tabpanel"
        >
          <CodexLoreFeed
            entries={entries}
            entryCount={entryCount}
            indexVersion={indexVersion}
            key={indexVersion}
            labels={labels}
            onOpenProject={openProject}
            projectLabels={projectLabels}
            questsById={questsById}
          />
        </div>
        <div
          aria-labelledby="codex-lore-tab-graph-label"
          className="codexLoreTabPanel codexLoreTabPanelGraph"
          role="tabpanel"
        >
          <CodexLoreGraphs
            index={index}
            labels={labels}
            onOpenProject={openProject}
            projectLabels={projectLabels}
            questsById={questsById}
            status={status}
          />
        </div>
      </div>
    </div>
  );
}

function CodexLoreGraphs({
  index,
  labels,
  onOpenProject,
  projectLabels,
  questsById,
  status,
}: {
  readonly index: CodexLorePublicIndex | null;
  readonly labels: CodexCopy;
  readonly onOpenProject: OpenProjectHandler;
  readonly projectLabels: ProjectPopoverCopy;
  readonly questsById: ReadonlyMap<string, Quest>;
  readonly status: "loading" | "ready" | "stale" | "error";
}) {
  const [range, setRange] = useState<CodexLoreGraphRangeKey>("all");
  const [chartMode, setChartMode] = useState<CodexLoreChartMode>("bar");
  const projects = index?.projects ?? [];
  const metrics = useMemo(
    () =>
      [
        {
          color: "var(--accent)",
          key: "promptCount",
          label: labels.prompts,
          tone: "prompts",
        },
        {
          color: "color-mix(in srgb, var(--neon-cyan) 54%, var(--border))",
          key: "linesAdded",
          label: labels.lines,
          prefix: "+",
          tone: "lines",
        },
        {
          color: "color-mix(in srgb, var(--neon-pink) 48%, var(--border))",
          key: "filesTouched",
          label: labels.files,
          tone: "files",
        },
      ] as const satisfies readonly CodexLoreGraphMetric[],
    [labels.files, labels.lines, labels.prompts],
  );
  const hasSignal = projects.some((project) =>
    metrics.some(
      (metric) => getProjectMetricsForWindow(project, range)[metric.key] > 0,
    ),
  );

  return (
    <section className="codexLoreGraphs" aria-label={labels.graph.aria}>
      <header className="codexLoreGraphHeader">
        <div>
          <strong>{labels.graph.title}</strong>
          <span>{hasSignal ? labels.status[status] : labels.graph.noData}</span>
        </div>
        <div className="codexLoreGraphControls">
          <div className="codexLoreGraphRanges">
            {loreGraphRangeOptions.map((option) => (
              <button
                aria-pressed={range === option.key}
                key={option.key}
                onClick={() => setRange(option.key)}
                type="button"
              >
                {option.key === "all" ? labels.graph.all : option.label}
              </button>
            ))}
          </div>
          <div className="codexLoreChartModes" data-mode={chartMode}>
            <button
              aria-pressed={chartMode === "bar"}
              onClick={() => setChartMode("bar")}
              type="button"
            >
              {labels.graph.bar}
            </button>
            <button
              aria-pressed={chartMode === "line"}
              onClick={() => setChartMode("line")}
              type="button"
            >
              {labels.graph.line}
            </button>
          </div>
        </div>
      </header>
      <div className="codexLoreGraphGrid">
        {metrics.map((metric) => (
          <CodexProjectResourceChart
            chartMode={chartMode}
            graphLabels={labels.graph}
            key={metric.key}
            metric={metric}
            onOpenProject={onOpenProject}
            projectLabels={projectLabels}
            projects={projects}
            questsById={questsById}
            range={range}
          />
        ))}
      </div>
    </section>
  );
}

function CodexProjectResourceChart({
  chartMode,
  graphLabels,
  metric,
  onOpenProject,
  projectLabels,
  projects,
  questsById,
  range,
}: {
  readonly chartMode: CodexLoreChartMode;
  readonly graphLabels: CodexCopy["graph"];
  readonly metric: CodexLoreGraphMetric;
  readonly onOpenProject: OpenProjectHandler;
  readonly projectLabels: ProjectPopoverCopy;
  readonly projects: readonly CodexLoreProject[];
  readonly questsById: ReadonlyMap<string, Quest>;
  readonly range: CodexLoreGraphRangeKey;
}) {
  const rows = projects
    .map((project) => ({
      project,
      value: getProjectMetricsForWindow(project, range)[metric.key],
    }))
    .filter((row) => row.value > 0)
    .toSorted(
      (a, b) => b.value - a.value || a.project.name.localeCompare(b.project.name),
    );
  const total = rows.reduce((sum, row) => sum + row.value, 0);
  const peakValue = Math.max(0, ...rows.map((row) => row.value));
  const scaleMaxValue = Math.max(1, peakValue);

  return (
    <article
      className={`codexResourceChart codexResourceChart-${metric.tone}`}
      style={{ "--resource-color": metric.color } as CSSProperties}
    >
      <div className="codexResourceChartTitle">
        <span>{metric.label}</span>
        <strong>
          {metric.prefix}
          {formatCompactNumber(total)}
        </strong>
      </div>
      {chartMode === "line" ? (
        <CodexProjectResourceLineChart
          graphLabels={graphLabels}
          metric={metric}
          onOpenProject={onOpenProject}
          projectLabels={projectLabels}
          rows={rows}
          scaleMaxValue={scaleMaxValue}
          questsById={questsById}
        />
      ) : (
        <CodexProjectResourceBars
          metric={metric}
          graphLabels={graphLabels}
          onOpenProject={onOpenProject}
          projectLabels={projectLabels}
          rows={rows}
          scaleMaxValue={scaleMaxValue}
          questsById={questsById}
        />
      )}
    </article>
  );
}

function CodexProjectResourceBars({
  graphLabels,
  metric,
  onOpenProject,
  projectLabels,
  rows,
  scaleMaxValue,
  questsById,
}: {
  readonly graphLabels: CodexCopy["graph"];
  readonly metric: CodexLoreGraphMetric;
  readonly onOpenProject: OpenProjectHandler;
  readonly projectLabels: ProjectPopoverCopy;
  readonly rows: readonly CodexProjectResourceRow[];
  readonly scaleMaxValue: number;
  readonly questsById: ReadonlyMap<string, Quest>;
}) {
  if (rows.length === 0) {
    return <p className="codexProjectResourceEmpty">{graphLabels.noData}</p>;
  }

  return (
    <ol className="codexProjectResourceRows">
      {rows.map(({ project, value }) => (
        <li
          key={project.id}
          style={
            {
              "--project-resource-share": `${Math.min(
                100,
                Math.max(0, (value / scaleMaxValue) * 100),
              )}%`,
            } as CSSProperties
          }
        >
          <CodexProjectResourceRowButton
            metric={metric}
            onOpenProject={onOpenProject}
            project={project}
            projectLabels={projectLabels}
            quest={questsById.get(project.id) ?? null}
            value={value}
          />
        </li>
      ))}
    </ol>
  );
}

function CodexProjectResourceRowButton({
  metric,
  onOpenProject,
  project,
  projectLabels,
  quest,
  value,
}: {
  readonly metric: CodexLoreGraphMetric;
  readonly onOpenProject: OpenProjectHandler;
  readonly project: CodexLoreProject;
  readonly projectLabels: ProjectPopoverCopy;
  readonly quest: Quest | null;
  readonly value: number;
}) {
  const handleOpenProject = useCallback(() => {
    if (!quest) return;

    onOpenProject(quest);
  }, [onOpenProject, quest]);
  const preloadProjectWindow = useCallback(() => {
    if (quest) void preloadProjectWindowContent();
  }, [quest]);
  const content = (
    <>
      <span className="codexProjectResourceName">
        <b>{project.rank}</b>
        {project.name}
      </span>
      <span className="codexProjectResourceTrack" aria-hidden="true">
        <span />
      </span>
      <strong>
        {metric.prefix}
        {formatCompactNumber(value)}
      </strong>
    </>
  );

  if (!quest) {
    return <div className="codexProjectResourceRow">{content}</div>;
  }

  return (
    <button
      aria-label={`${projectLabels.openWindow}: ${quest.name}`}
      className="codexProjectResourceRow codexProjectResourceRowButton"
      onFocus={preloadProjectWindow}
      onClick={handleOpenProject}
      onPointerEnter={preloadProjectWindow}
      type="button"
    >
      {content}
    </button>
  );
}

function CodexProjectResourceLineChart({
  graphLabels,
  metric,
  onOpenProject,
  projectLabels,
  rows,
  scaleMaxValue,
  questsById,
}: {
  readonly graphLabels: CodexCopy["graph"];
  readonly metric: CodexLoreGraphMetric;
  readonly onOpenProject: OpenProjectHandler;
  readonly projectLabels: ProjectPopoverCopy;
  readonly rows: readonly CodexProjectResourceRow[];
  readonly scaleMaxValue: number;
  readonly questsById: ReadonlyMap<string, Quest>;
}) {
  const width = 320;
  const height = 96;
  const left = 6;
  const right = 6;
  const top = 8;
  const bottom = 8;
  const chartWidth = width - left - right;
  const chartHeight = height - top - bottom;
  const points = rows.map((row, index) => {
    const x =
      left + (rows.length > 1 ? (index / (rows.length - 1)) * chartWidth : 0);
    const y = top + chartHeight - (row.value / scaleMaxValue) * chartHeight;

    return { ...row, x, y };
  });
  const linePath = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");
  const areaPath = linePath
    ? `${linePath} L ${points.at(-1)?.x ?? left} ${top + chartHeight} L ${left} ${
        top + chartHeight
      } Z`
    : "";

  if (rows.length === 0) {
    return <p className="codexProjectResourceEmpty">{graphLabels.noData}</p>;
  }

  return (
    <svg
      aria-label={metric.label}
      className="codexProjectResourceLineChart"
      preserveAspectRatio="none"
      role="img"
      viewBox={`0 0 ${width} ${height}`}
    >
      {areaPath ? <path className="codexProjectResourceArea" d={areaPath} /> : null}
      {linePath ? <path className="codexProjectResourceLine" d={linePath} /> : null}
      <g className="codexProjectResourcePoints">
        {points.map((point) => (
          <CodexProjectResourcePoint
            key={point.project.id}
            metric={metric}
            onOpenProject={onOpenProject}
            point={point}
            projectLabels={projectLabels}
            quest={questsById.get(point.project.id) ?? null}
          />
        ))}
      </g>
    </svg>
  );
}

function CodexProjectResourcePoint({
  metric,
  onOpenProject,
  point,
  projectLabels,
  quest,
}: {
  readonly metric: CodexLoreGraphMetric;
  readonly onOpenProject: OpenProjectHandler;
  readonly point: CodexProjectResourceRow & { readonly x: number; readonly y: number };
  readonly projectLabels: ProjectPopoverCopy;
  readonly quest: Quest | null;
}) {
  const handleOpenProject = useCallback(() => {
    if (!quest) return;

    onOpenProject(quest);
  }, [onOpenProject, quest]);
  const preloadProjectWindow = useCallback(() => {
    if (quest) void preloadProjectWindowContent();
  }, [quest]);
  const handleKeyDown = useCallback(
    (event: KeyboardEvent<SVGCircleElement>) => {
      if (!isProjectOpenKey(event.key)) return;

      event.preventDefault();
      handleOpenProject();
    },
    [handleOpenProject],
  );

  return (
    <circle
      aria-label={quest ? `${projectLabels.openWindow}: ${quest.name}` : undefined}
      cx={point.x}
      cy={point.y}
      onClick={quest ? handleOpenProject : undefined}
      onFocus={quest ? preloadProjectWindow : undefined}
      onKeyDown={quest ? handleKeyDown : undefined}
      onPointerEnter={quest ? preloadProjectWindow : undefined}
      r="2.4"
      role={quest ? "button" : undefined}
      tabIndex={quest ? 0 : undefined}
    >
      <title>
        {point.project.name}: {metric.prefix}
        {formatCodexLoreNumber(point.value)}
      </title>
    </circle>
  );
}

function CodexLoreFeed({
  entries,
  entryCount,
  indexVersion,
  labels,
  onOpenProject,
  projectLabels,
  questsById,
}: {
  readonly entries: readonly (CodexLoreEntry | LoreEntry)[];
  readonly entryCount: number;
  readonly indexVersion: string;
  readonly labels: CodexCopy;
  readonly onOpenProject: (quest: Quest) => void;
  readonly projectLabels: ProjectPopoverCopy;
  readonly questsById: ReadonlyMap<string, Quest>;
}) {
  const feedRef = useRef<HTMLOListElement | null>(null);
  const sentinelRef = useRef<HTMLLIElement | null>(null);
  const [feedEntries, setFeedEntries] =
    useState<readonly (CodexLoreEntry | LoreEntry)[]>(entries);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [visibleCount, setVisibleCount] = useState(INITIAL_LORE_ENTRIES);
  const visibleEntries = feedEntries.slice(0, visibleCount);
  const canRevealMore = visibleCount < feedEntries.length;
  const canFetchMore =
    indexVersion !== "fallback" && feedEntries.length < entryCount;
  const canLoadMore = canRevealMore || canFetchMore || isLoadingMore;

  const loadMoreEntries = useCallback(async () => {
    if (!canFetchMore || isLoadingMore) return;

    setIsLoadingMore(true);

    try {
      const params = new URLSearchParams({
        limit: String(CODEX_LORE_ENTRY_PAGE_LIMIT),
        offset: String(feedEntries.length),
      });
      const response = await fetch(`${LORELOG_ENTRIES_ENDPOINT}?${params}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`LoreLog entries fetch failed: ${response.status}`);
      }

      const payload: unknown = await response.json();

      if (
        !isCodexLoreEntryPage(payload) ||
        payload.generatedAt !== indexVersion
      ) {
        return;
      }

      setFeedEntries((currentEntries) => {
        const seen = new Set(currentEntries.map(getLoreEntryKey));
        const nextEntries = payload.entries.filter(
          (entry) => !seen.has(entry.id),
        );

        return nextEntries.length > 0
          ? [...currentEntries, ...nextEntries]
          : currentEntries;
      });
      setVisibleCount((currentCount) =>
        Math.min(
          currentCount + LORE_ENTRY_BATCH_SIZE,
          feedEntries.length + payload.entries.length,
        ),
      );
    } catch {
      // Keep the visible log stable; the sentinel can retry on the next pass.
    } finally {
      setIsLoadingMore(false);
    }
  }, [canFetchMore, feedEntries.length, indexVersion, isLoadingMore]);

  useEffect(() => {
    const root = feedRef.current;
    const target = sentinelRef.current;

    if (!canLoadMore || !root || !target) return;

    const observer = new IntersectionObserver(
      (records) => {
        if (!records.some((record) => record.isIntersecting)) return;

        if (canRevealMore) {
          setVisibleCount((current) =>
            Math.min(current + LORE_ENTRY_BATCH_SIZE, feedEntries.length),
          );
          return;
        }

        void loadMoreEntries();
      },
      {
        root,
        rootMargin: "96px 0px",
        threshold: 0.01,
      },
    );

    observer.observe(target);

    return () => observer.disconnect();
  }, [canLoadMore, canRevealMore, feedEntries.length, loadMoreEntries]);

  return (
    <ol className="loreFeed codexLoreFeed" ref={feedRef}>
      {visibleEntries.map((entry) =>
        isCodexLoreEntry(entry) ? (
          <CodexLoreListItem
            entry={entry}
            key={entry.id}
            labels={labels}
            onOpenProject={onOpenProject}
            projectLabels={projectLabels}
            quest={questsById.get(entry.projectId) ?? null}
          />
        ) : (
          <li key={`${entry.date}-${entry.text}`}>
            <span>&gt;</span>
            <time>{entry.date}</time>
            <p>{entry.text}</p>
          </li>
        ),
      )}
      {canLoadMore ? (
        <li aria-hidden="true" className="codexLoreSentinel" ref={sentinelRef}>
          <span>&gt;</span>
          <small>...</small>
        </li>
      ) : null}
    </ol>
  );
}

function CodexLoreSummary({
  index,
  labels,
}: {
  readonly index: CodexLorePublicIndex | null;
  readonly labels: CodexCopy;
}) {
  const totals = index?.totals;

  return (
    <div className="codexLoreSummary">
      <CodexDossierStat label={labels.prompts} value={totals?.promptCount ?? 0} />
      <CodexDossierStat label={labels.touched} value={totals?.filesTouched ?? 0} />
      <CodexDossierStat
        label={labels.spellcode}
        prefix="+"
        value={totals?.linesAdded ?? 0}
      />
    </div>
  );
}

function CodexLoreListItem({
  entry,
  labels,
  onOpenProject,
  projectLabels,
  quest,
}: {
  readonly entry: CodexLoreEntry;
  readonly labels: CodexCopy;
  readonly onOpenProject: (quest: Quest) => void;
  readonly projectLabels: ProjectPopoverCopy;
  readonly quest: Quest | null;
}) {
  const promptRunes = entry.promptRunes ?? [];
  const handleProjectClick = useCallback(() => {
    if (!quest) return;

    onOpenProject(quest);
  }, [onOpenProject, quest]);
  const preloadProjectWindow = useCallback(() => {
    if (quest) void preloadProjectWindowContent();
  }, [quest]);

  return (
    <li className="codexLoreEntry" data-kind={entry.kind}>
      <span>&gt;</span>
      <time>{formatDisplayDate(entry.date)}</time>
      <div className="codexLoreEntryBody">
        <div className="codexLoreEntryMeta">
          <strong className="codexLoreEntryProject">
            {quest ? (
              <button
                aria-label={`${projectLabels.openWindow}: ${quest.name}`}
                className="codexLoreProjectButton"
                onClick={handleProjectClick}
                onFocus={preloadProjectWindow}
                onPointerEnter={preloadProjectWindow}
                type="button"
              >
                {entry.projectName}
              </button>
            ) : (
              <span className="codexLoreProjectName">{entry.projectName}</span>
            )}
            <span className="codexLoreProjectRank"> / {entry.rank}</span>
          </strong>
          <span
            aria-label={labels.countersTitle}
            className="codexLoreEntryStats"
          >
            <span>{formatCompactNumber(entry.promptCount)}p</span>
            <span>{formatCompactNumber(entry.filesTouched)}f</span>
            <span>+{formatCompactNumber(entry.linesAdded)}</span>
          </span>
        </div>
        <h3>{entry.publicTitle ?? entry.title}</h3>
        <p>{entry.changeSummary ?? entry.text}</p>
        {promptRunes.length > 0 ? (
          <ul className="codexPromptRunes" aria-label={labels.promptRunesAria}>
            {promptRunes.map((rune) => (
              <li key={`${entry.id}-${rune.label}-${rune.text}`}>
                <b>{rune.label}</b>
                <span>{rune.text}</span>
              </li>
            ))}
          </ul>
        ) : null}
        {entry.excerpt ? <em>{entry.excerpt}</em> : null}
      </div>
    </li>
  );
}

function getDisplayEntries(
  index: CodexLorePublicIndex | null,
  fallbackEntries: readonly LoreEntry[],
): readonly (CodexLoreEntry | LoreEntry)[] {
  if (!index?.entries.length) return fallbackEntries;

  return index.entries;
}

function getProjectMetricsForWindow(
  project: CodexLoreProject,
  range: CodexLoreGraphRangeKey,
): CodexLoreProjectWindow {
  const allTimeMetrics: CodexLoreProjectWindow = {
    filesTouched: project.filesTouched,
    linesAdded: project.linesAdded,
    linesRemoved: project.linesRemoved,
    promptCount: project.promptCount,
    sessionCount: project.sessionCount,
  };

  return range === "all"
    ? allTimeMetrics
    : (project.activityWindows?.[range] ?? allTimeMetrics);
}

function isProjectOpenKey(key: string) {
  return key === "Enter" || key === " ";
}

function isCodexLoreEntry(
  entry: CodexLoreEntry | LoreEntry,
): entry is CodexLoreEntry {
  return "projectId" in entry;
}

function getLoreEntryKey(entry: CodexLoreEntry | LoreEntry) {
  return isCodexLoreEntry(entry) ? entry.id : `${entry.date}-${entry.text}`;
}

function formatCompactNumber(value: number) {
  return Math.abs(value) >= 10000
    ? compactNumberFormat.format(value)
    : standardNumberFormat.format(value);
}

function formatDisplayDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return displayDateFormat.format(date);
}

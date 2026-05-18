"use client";

import type {
  CodexLorePublicIndex,
  CodexLoreProject,
} from "@/lib/codex-lore";
import { isCodexLorePublicIndex } from "@/lib/codex-lore";
import {
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";

type CodexLoreSnapshot = {
  readonly index: CodexLorePublicIndex | null;
  readonly status: "loading" | "ready" | "stale" | "error";
};

const LORELOG_ENDPOINT = "/api/codex-subscription/lorelog";
const LORELOG_EVENTS_ENDPOINT = "/api/codex-subscription/lorelog/events";
const listeners = new Set<() => void>();
const projectLookupCache = new WeakMap<
  CodexLorePublicIndex,
  ReadonlyMap<string, CodexLoreProject>
>();

const INITIAL_LORE_SNAPSHOT: CodexLoreSnapshot = {
  index: null,
  status: "loading",
};

let snapshot: CodexLoreSnapshot = INITIAL_LORE_SNAPSHOT;
let hasStarted = false;
let eventSource: EventSource | null = null;
let scheduledStreamStart:
  | { readonly id: number; readonly kind: "idle" | "timeout" }
  | null = null;

type IdleWindow = Window & {
  readonly requestIdleCallback?: (
    callback: () => void,
    options?: { readonly timeout: number },
  ) => number;
  readonly cancelIdleCallback?: (id: number) => void;
};

function emitSnapshot(nextSnapshot: CodexLoreSnapshot) {
  if (
    snapshot.status === nextSnapshot.status &&
    snapshot.index?.generatedAt === nextSnapshot.index?.generatedAt
  ) {
    return;
  }

  snapshot = nextSnapshot;
  listeners.forEach((listener) => listener());
}

function getReadySnapshot(index: CodexLorePublicIndex): CodexLoreSnapshot {
  return { index, status: "ready" };
}

function primeCodexLoreSnapshot(index: CodexLorePublicIndex) {
  if (snapshot.index?.generatedAt === index.generatedAt) return;

  snapshot = getReadySnapshot(index);
}

async function refreshCodexLore() {
  try {
    const response = await fetch(LORELOG_ENDPOINT, { cache: "no-store" });

    if (!response.ok) {
      throw new Error(`LoreLog fetch failed: ${response.status}`);
    }

    const payload: unknown = await response.json();

    if (!isCodexLorePublicIndex(payload)) {
      throw new Error("LoreLog payload is invalid");
    }

    emitSnapshot({ index: payload, status: "ready" });
  } catch {
    emitSnapshot({
      index: snapshot.index,
      status: snapshot.index ? "stale" : "error",
    });
  }
}

function startCodexLoreStream() {
  if (hasStarted || typeof window === "undefined") return;

  hasStarted = true;

  eventSource = new EventSource(LORELOG_EVENTS_ENDPOINT);
  eventSource.addEventListener("lorelog", (event) => {
    try {
      const payload: unknown = JSON.parse(event.data);

      if (!isCodexLorePublicIndex(payload)) return;

      emitSnapshot({ index: payload, status: "ready" });
    } catch {
      emitSnapshot({
        index: snapshot.index,
        status: snapshot.index ? "stale" : "error",
      });
    }
  });
  eventSource.onerror = () => {
    emitSnapshot({
      index: snapshot.index,
      status: snapshot.index ? "stale" : "error",
    });

    if (!snapshot.index) {
      void refreshCodexLore();
    }
  };
}

function scheduleCodexLoreStream() {
  if (hasStarted || scheduledStreamStart || typeof window === "undefined") {
    return;
  }

  const start = () => {
    scheduledStreamStart = null;

    if (listeners.size > 0) {
      startCodexLoreStream();
    }
  };
  const idleWindow = window as IdleWindow;

  if (idleWindow.requestIdleCallback) {
    scheduledStreamStart = {
      id: idleWindow.requestIdleCallback(start, { timeout: 2000 }),
      kind: "idle",
    };
    return;
  }

  scheduledStreamStart = {
    id: window.setTimeout(start, 750),
    kind: "timeout",
  };
}

function cancelScheduledCodexLoreStream() {
  if (!scheduledStreamStart || typeof window === "undefined") return;

  const { id, kind } = scheduledStreamStart;
  const idleWindow = window as IdleWindow;

  if (kind === "idle") {
    idleWindow.cancelIdleCallback?.(id);
  } else {
    window.clearTimeout(id);
  }

  scheduledStreamStart = null;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  scheduleCodexLoreStream();

  return () => {
    listeners.delete(listener);

    if (listeners.size === 0) {
      cancelScheduledCodexLoreStream();

      if (eventSource) {
        eventSource.close();
        eventSource = null;
        hasStarted = false;
      }
    }
  };
}

function getSnapshot() {
  return snapshot;
}

function getServerSnapshot(): CodexLoreSnapshot {
  return snapshot;
}

export function CodexLoreProvider({
  children,
  initialIndex,
}: {
  readonly children: ReactNode;
  readonly initialIndex: CodexLorePublicIndex;
}) {
  const initialSnapshot = useMemo(
    () => getReadySnapshot(initialIndex),
    [initialIndex],
  );

  primeCodexLoreSnapshot(initialIndex);

  useEffect(() => {
    emitSnapshot(initialSnapshot);
  }, [initialSnapshot]);

  return children;
}

export function useCodexLore() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function getCodexLoreProject(
  index: CodexLorePublicIndex | null,
  projectId: string,
): CodexLoreProject | null {
  if (!index) return null;

  let projectLookup = projectLookupCache.get(index);

  if (!projectLookup) {
    projectLookup = new Map(
      index.projects.map((project) => [project.id, project]),
    );
    projectLookupCache.set(index, projectLookup);
  }

  return projectLookup.get(projectId) ?? null;
}

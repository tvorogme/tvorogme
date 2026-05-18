"use client";

import type { CodexCopy, ProjectPopoverCopy } from "@/data/localized-site";
import type { Quest } from "@/data/site";
import type { ManagedWindowConfig } from "./window-manager";

type ProjectWindowModule = typeof import("./project-window-content");

type ProjectWindowConfigInput = {
  readonly codexLabels: CodexCopy;
  readonly labels: ProjectPopoverCopy;
  readonly quest: Quest;
};

let projectWindowModulePromise: Promise<ProjectWindowModule> | null = null;

export function preloadProjectWindowContent() {
  projectWindowModulePromise ??= import("./project-window-content");

  return projectWindowModulePromise;
}

export async function loadProjectWindowConfig(
  input: ProjectWindowConfigInput,
): Promise<ManagedWindowConfig> {
  const { getProjectWindowConfig } = await preloadProjectWindowContent();

  return getProjectWindowConfig(input);
}

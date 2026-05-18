"use client";

import type { CodexCopy, ProjectPopoverCopy } from "@/data/localized-site";
import type { Quest } from "@/data/site";
import type { ManagedWindowConfig } from "./window-manager";
import { CodexProjectDossier } from "./codex-project-dossier";
import type { CSSProperties } from "react";

export const PROJECT_WINDOW_TILE = {
  col: 8,
  colSpan: 10,
  row: 2,
  rowSpan: 9,
} as const;

type ProjectWindowContentProps = {
  readonly codexLabels: CodexCopy;
  readonly labels: ProjectPopoverCopy;
  readonly quest: Quest;
};

export function getProjectWindowTitle(quest: Pick<Quest, "name">) {
  return `PROJECT ${quest.name}`;
}

export function getProjectWindowConfig({
  codexLabels,
  labels,
  quest,
}: ProjectWindowContentProps): ManagedWindowConfig {
  const title = getProjectWindowTitle(quest);

  return {
    children: (
      <ProjectWindowContent
        codexLabels={codexLabels}
        labels={labels}
        quest={quest}
      />
    ),
    closeLabel: labels.closeWindow,
    handleLabel: title,
    id: `project-window-${quest.id}`,
    initialTile: PROJECT_WINDOW_TILE,
    minColumns: 6,
    minRows: 5,
    title,
  };
}

export function ProjectWindowContent({
  codexLabels,
  labels,
  quest,
}: ProjectWindowContentProps) {
  const detailCards = [
    { label: labels.details.goal, value: quest.goal },
    { label: labels.details.why, value: quest.whyStarted },
    { label: labels.details.outcome, value: quest.outcome },
    { label: labels.details.paused, value: quest.pausedReason },
    { label: labels.details.role, value: quest.role },
  ].filter((item): item is { label: string; value: string } =>
    Boolean(item.value),
  );

  return (
    <section className="projectWindowContent">
      <div className="projectPopoverChrome" aria-hidden="true">
        <span>PROJECT {quest.name.toLocaleUpperCase()}</span>
        <span>
          {quest.rip
            ? `${labels.ripPrefix} ${quest.rip}`
            : labels.liveDossier}
        </span>
      </div>

      <header className="projectHoverHeader">
        <div>
          <span>{quest.name}</span>
          <h2>{quest.tagline ?? quest.summary}</h2>
        </div>
        <strong>{quest.displayStatus ?? quest.status}</strong>
      </header>

      <div className="projectProgressBox">
        <span>{labels.progress}</span>
        <div
          aria-label={`${quest.name} ${labels.progressAriaSuffix}`}
          aria-valuemax={100}
          aria-valuemin={0}
          aria-valuenow={quest.progress}
          className="projectProgressTrack"
          role="progressbar"
        >
          <span
            style={{ "--project-progress": `${quest.progress}%` } as CSSProperties}
          />
        </div>
        <strong>{quest.progress}%</strong>
      </div>

      <p className="projectDescription">{quest.description}</p>

      {detailCards.length > 0 ? (
        <dl className="projectFactGrid">
          {detailCards.map((item) => (
            <div className="projectFactCard" key={item.label}>
              <dt>{item.label}</dt>
              <dd>{item.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      {quest.subprojects?.length ? (
        <section className="projectBoxSection">
          <h3>{labels.subProjects}</h3>
          <ul className="projectChipList">
            {quest.subprojects.map((project) => (
              <li key={project}>{project}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="projectBoxSection">
        <h3>{labels.signals}</h3>
        <ul>
          {quest.topThings.map((thing) => (
            <li key={thing}>{thing}</li>
          ))}
        </ul>
      </section>

      <CodexProjectDossier labels={codexLabels} projectId={quest.id} />

      {quest.readMore ? (
        <details className="projectReadMore">
          <summary>{labels.contextSummary}</summary>
          <p>{quest.readMore}</p>
        </details>
      ) : null}
    </section>
  );
}

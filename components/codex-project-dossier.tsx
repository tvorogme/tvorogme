"use client";

import type { CodexCopy } from "@/data/localized-site";
import { formatCodexLoreNumber } from "@/lib/codex-lore";
import { CodexDossierStat } from "./codex-dossier-stat";
import { getCodexLoreProject, useCodexLore } from "./codex-lore-store";

type CodexProjectDossierProps = {
  readonly labels: CodexCopy;
  readonly projectId: string;
};

export function CodexProjectDossier({
  labels,
  projectId,
}: CodexProjectDossierProps) {
  const { index } = useCodexLore();
  const project = getCodexLoreProject(index, projectId);

  if (!project) return null;

  return (
    <section className="projectBoxSection codexDossier">
      <h3>{labels.guildTraceTitle}</h3>
      <div className="codexDossierGrid">
        <CodexDossierStat label={labels.prompts} value={project.promptCount} />
        <CodexDossierStat label={labels.sessions} value={project.sessionCount} />
        <CodexDossierStat label={labels.files} value={project.filesTouched} />
        <CodexDossierStat
          label={labels.spellcode}
          prefix="+"
          value={project.linesAdded}
        />
      </div>
      <p>
        {labels.rank} {project.rank}. {labels.workspaceHas}{" "}
        {formatCodexLoreNumber(project.workspaceFiles)} {labels.files}{" "}
        {labels.workspaceAnd} {formatCodexLoreNumber(project.workspaceLines)}{" "}
        {labels.sourceLinesObserved}.
      </p>
    </section>
  );
}

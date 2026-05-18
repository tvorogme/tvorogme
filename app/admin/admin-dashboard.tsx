"use client";

import {
  ADMIN_PROJECT_BUCKETS,
  type AdminConfig,
  type AdminProjectBucket,
  type AdminProjectRow,
} from "@/lib/admin-config-shared";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type ChangeEvent, type FormEvent } from "react";

type AdminDashboardProps = {
  readonly initialConfig: AdminConfig;
  readonly initialIndex: {
    readonly generatedAt: string;
    readonly totals: {
      readonly activeProjectCount: number;
      readonly filesTouched: number;
      readonly linesAdded: number;
      readonly linesRemoved: number;
      readonly promptCount: number;
      readonly sessionCount: number;
      readonly workspaceFiles: number;
      readonly workspaceLines: number;
    };
  };
  readonly initialProjects: readonly AdminProjectRow[];
};

const bucketLabels: Record<AdminProjectBucket, string> = {
  active: "Active",
  paused: "Paused",
  sleep: "Sleeping",
};

function formatDate(value: string | null) {
  if (!value) return "never";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
  }).format(date);
}

function getProjectCounts(projects: readonly AdminProjectRow[]) {
  return projects.reduce(
    (counts, project) => ({
      ...counts,
      [project.bucket]: counts[project.bucket] + 1,
    }),
    {
      active: 0,
      paused: 0,
      sleep: 0,
    } satisfies Record<AdminProjectBucket, number>,
  );
}

export function AdminDashboard({
  initialConfig,
  initialIndex,
  initialProjects,
}: AdminDashboardProps) {
  const router = useRouter();
  const [config, setConfig] = useState(initialConfig);
  const [projects, setProjects] = useState(initialProjects);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );
  const [message, setMessage] = useState("");
  const projectCounts = useMemo(() => getProjectCounts(projects), [projects]);

  function setProjectBucket(projectId: string, bucket: AdminProjectBucket) {
    setConfig((current) => ({
      ...current,
      projectBuckets: {
        ...current.projectBuckets,
        [projectId]: bucket,
      },
    }));
    setProjects((current) =>
      current.map((project) =>
        project.id === projectId ? { ...project, bucket } : project,
      ),
    );
  }

  function updateStream(
    key: keyof AdminConfig["codexStream"],
    value: boolean | number | string,
  ) {
    setConfig((current) => ({
      ...current,
      codexStream: {
        ...current.codexStream,
        [key]: value,
      },
    }));
  }

  function updatePrompts(
    key: keyof AdminConfig["prompts"],
    value: number | string,
  ) {
    setConfig((current) => ({
      ...current,
      prompts: {
        ...current.prompts,
        [key]: value,
      },
    }));
  }

  async function saveConfig(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaveState("saving");
    setMessage("");

    const response = await fetch("/api/admin/config", {
      body: JSON.stringify({ config }),
      headers: {
        "content-type": "application/json",
      },
      method: "PUT",
    });

    if (!response.ok) {
      setSaveState("error");
      setMessage("Failed to save settings.");
      return;
    }

    const payload: unknown = await response.json();

    if (
      payload &&
      typeof payload === "object" &&
      "config" in payload &&
      "projects" in payload &&
      Array.isArray((payload as { projects?: unknown }).projects)
    ) {
      const nextPayload = payload as {
        config: AdminConfig;
        projects: readonly AdminProjectRow[];
      };

      setConfig(nextPayload.config);
      setProjects(nextPayload.projects);
    }

    setSaveState("saved");
    setMessage("Saved. The public page will apply the config on the next render.");
    router.refresh();
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.reload();
  }

  function handleNumberChange(
    event: ChangeEvent<HTMLInputElement>,
    onValue: (value: number) => void,
  ) {
    onValue(Number(event.currentTarget.value));
  }

  return (
    <form className="adminConsole" onSubmit={saveConfig}>
      <header className="adminTopbar">
        <div>
          <span>admin://tvorog.me</span>
          <h1>Quest Management</h1>
        </div>
        <nav>
          <Link href="/">site</Link>
          <button type="button" onClick={logout}>
            sign out
          </button>
        </nav>
      </header>

      <section className="adminStatGrid" aria-label="LoreLog stats">
        <AdminStat label="Prompts" value={initialIndex.totals.promptCount} />
        <AdminStat label="Sessions" value={initialIndex.totals.sessionCount} />
        <AdminStat label="Projects" value={initialIndex.totals.activeProjectCount} />
        <AdminStat label="Updated" value={formatDate(initialIndex.generatedAt)} />
      </section>

      <div className="adminLayout">
        <section className="adminPanel adminProjectsPanel">
          <div className="adminPanelTitle">
            <div>
              <span>projects</span>
              <h2>Quest Project Assignment</h2>
            </div>
            <p>
              {projectCounts.active} active / {projectCounts.sleep} sleeping /{" "}
              {projectCounts.paused} paused
            </p>
          </div>

          <div className="adminProjectList">
            {projects.map((project) => (
              <article className="adminProjectRow" key={project.id}>
                <div className="adminProjectMain">
                  <strong>{project.name}</strong>
                  <span>{project.summary}</span>
                </div>
                <div className="adminProjectMeta">
                  <span>{project.progress}%</span>
                  <span>{project.promptCount}p</span>
                  <span>{formatDate(project.lastActivityAt)}</span>
                </div>
                <select
                  aria-label={`Group for ${project.name}`}
                  value={project.bucket}
                  onChange={(event) =>
                    setProjectBucket(
                      project.id,
                      event.currentTarget.value as AdminProjectBucket,
                    )
                  }
                >
                  {ADMIN_PROJECT_BUCKETS.map((bucket) => (
                    <option key={bucket} value={bucket}>
                      {bucketLabels[bucket]}
                    </option>
                  ))}
                </select>
              </article>
            ))}
          </div>
        </section>

        <aside className="adminSideStack">
          <section className="adminPanel">
            <div className="adminPanelTitle">
              <div>
                <span>Codex stream</span>
                <h2>LoreLog Courier</h2>
              </div>
            </div>

            <div className="adminFieldGrid">
              <label className="adminToggle">
                <input
                  checked={config.codexStream.enabled}
                  type="checkbox"
                  onChange={(event) =>
                    updateStream("enabled", event.currentTarget.checked)
                  }
                />
                <span>Publish stream</span>
              </label>
              <label className="adminToggle">
                <input
                  checked={config.codexStream.activeOnly}
                  type="checkbox"
                  onChange={(event) =>
                    updateStream("activeOnly", event.currentTarget.checked)
                  }
                />
                <span>Only active window</span>
              </label>
              <label className="adminToggle">
                <input
                  checked={config.codexStream.includeArchived}
                  type="checkbox"
                  onChange={(event) =>
                    updateStream("includeArchived", event.currentTarget.checked)
                  }
                />
                <span>Read archived sessions</span>
              </label>
              <label>
                <span>Interval, minutes</span>
                <input
                  min={1}
                  type="number"
                  value={config.codexStream.intervalMinutes}
                  onChange={(event) =>
                    handleNumberChange(event, (value) =>
                      updateStream("intervalMinutes", value),
                    )
                  }
                />
              </label>
              <label>
                <span>Active window, minutes</span>
                <input
                  min={1}
                  type="number"
                  value={config.codexStream.activeWindowMinutes}
                  onChange={(event) =>
                    handleNumberChange(event, (value) =>
                      updateStream("activeWindowMinutes", value),
                    )
                  }
                />
              </label>
              <label>
                <span>History, days</span>
                <input
                  min={1}
                  type="number"
                  value={config.codexStream.days}
                  onChange={(event) =>
                    handleNumberChange(event, (value) =>
                      updateStream("days", value),
                    )
                  }
                />
              </label>
              <label className="adminFullField">
                <span>Server URL override</span>
                <input
                  placeholder="default: /api/codex-subscription/lorelog"
                  type="text"
                  value={config.codexStream.serverUrl}
                  onChange={(event) =>
                    updateStream("serverUrl", event.currentTarget.value)
                  }
                />
              </label>
            </div>
          </section>

          <section className="adminPanel">
            <div className="adminPanelTitle">
              <div>
                <span>prompts</span>
                <h2>Public Prompt Layer</h2>
              </div>
            </div>

            <div className="adminFieldGrid">
              <label className="adminFullField">
                <span>Prompt mode</span>
                <select
                  value={config.prompts.mode}
                  onChange={(event) => updatePrompts("mode", event.currentTarget.value)}
                >
                  <option value="runes">Runes only</option>
                  <option value="excerpts">Runes + short excerpts</option>
                  <option value="hidden">Hidden</option>
                </select>
              </label>
              <label>
                <span>Rune limit</span>
                <input
                  min={0}
                  type="number"
                  value={config.prompts.runeLimit}
                  onChange={(event) =>
                    handleNumberChange(event, (value) =>
                      updatePrompts("runeLimit", value),
                    )
                  }
                />
              </label>
              <label>
                <span>Excerpt characters</span>
                <input
                  min={40}
                  type="number"
                  value={config.prompts.excerptLength}
                  onChange={(event) =>
                    handleNumberChange(event, (value) =>
                      updatePrompts("excerptLength", value),
                    )
                  }
                />
              </label>
            </div>

            <div className="adminCommandBox">
              <span>watch command</span>
              <code>npm run lorelog:watch</code>
            </div>
          </section>
        </aside>
      </div>

      <footer className="adminSaveBar">
        <p aria-live="polite">{message || "Changes are saved to admin-config.json."}</p>
        <button disabled={saveState === "saving"} type="submit">
          {saveState === "saving" ? "saving..." : "save config"}
        </button>
      </footer>
    </form>
  );
}

function AdminStat({
  label,
  value,
}: {
  readonly label: string;
  readonly value: number | string;
}) {
  return (
    <div className="adminStat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

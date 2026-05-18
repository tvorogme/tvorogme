import type { SiteContent } from "@/data/localized-site";
import type { Quest, SkillIcon, Stat } from "@/data/site";
import { getAllArticles } from "@/lib/articles";
import {
  Blocks,
  Bot,
  Box,
  BrainCircuit,
  CircuitBoard,
  Code2,
  Compass,
  Database,
  Hammer,
  Handshake,
  ServerCog,
  type LucideIcon,
} from "lucide-react";
import { Fragment, type CSSProperties, type ReactNode } from "react";
import {
  Avatar,
  EraAfterScene,
  EraBeforeScene,
  ProgressBar,
} from "./ascii-scenes";
import { ArticlesPanelClient } from "./articles-panel-client";
import {
  CodexLoreLog,
  CodexQuestMetricCells,
  CodexQuestMetricFilter,
} from "./codex-lore-widgets";
import { ProjectPopover } from "./project-popover";
import { ResizableStack } from "./resizable-stack";
import { SpaceScene } from "./space-scene";

const SIDEBAR_SECTION_FRACTIONS = [2.8, 1.25, 1.25, 1.45] as const;
const SIDEBAR_SECTION_MIN_PIXELS = [150, 72, 84, 118] as const;
const RELIC_SECTION_FRACTIONS = [0.45, 1.8, 0.8] as const;
const RELIC_SECTION_MIN_PIXELS = [28, 58, 40] as const;

type TerminalPanelProps = {
  readonly id?: string;
  readonly title: string;
  readonly action?: string;
  readonly children: ReactNode;
  readonly className?: string;
};

function formatPanelTitle(title: string) {
  return `:: ${title.replace(/\s*\/\s*/gu, " ").trim().toLocaleUpperCase()}`;
}

export function TerminalPanel({
  id,
  title,
  action,
  children,
  className = "",
}: TerminalPanelProps) {
  return (
    <section id={id} className={`terminalPanel ${className}`.trim()}>
      <header className="panelHeader">
        <span>{formatPanelTitle(title)}</span>
        {action ? <a href={`#${id ?? "top"}`}>{action}</a> : null}
      </header>
      <div className="panelBody">{children}</div>
    </section>
  );
}

export function Sidebar({ content }: { readonly content: SiteContent }) {
  const { profile, profileLines, socialLinks, ui } = content;
  const formatNumber = new Intl.NumberFormat(content.locale);

  return (
    <aside className="sidebar" id="profile" aria-label={ui.panels.profileAria}>
      <ResizableStack
        className="sidebarStack"
        initialFractions={SIDEBAR_SECTION_FRACTIONS}
        label={ui.panels.profileStackLabel}
        minPixels={SIDEBAR_SECTION_MIN_PIXELS}
      >
        <Avatar />
        <div className="profileMeta">
          {profileLines.map((item) => (
            <p key={item.label}>
              <span>{item.label}</span>
              <b>:</b> {item.value}
            </p>
          ))}
        </div>

        <div className="xpBlock">
          <p>
            <span>{ui.panels.xpProgress}</span>
            <span>
              {ui.panels.levelLabel} {profile.xp.level}
            </span>
          </p>
          <p>
            {formatNumber.format(profile.xp.current)} /{" "}
            {formatNumber.format(profile.xp.total)} XP
          </p>
          <div className="xpLine">
            <ProgressValue value={profile.xp.percent} size={20} />
          </div>
          <p>
            {ui.panels.nextRankLabel}: {profile.xp.nextRank} (
            {formatNumber.format(profile.xp.needed)} {ui.panels.xpNeeded})
          </p>
        </div>

        <div className="sidebarSocials" aria-label={ui.panels.socialLinksAria}>
          <div className="socialsHeader" aria-hidden="true">
            <strong>{ui.panels.socials}</strong>
          </div>
          <div className="socialLinkGrid">
            {socialLinks.map((item) => {
              const isExternal = item.href.startsWith("http");

              return (
                <a
                  aria-label={`${item.label}: ${item.displayHref}`}
                  className="socialLink"
                  href={item.href}
                  key={item.label}
                  rel={isExternal ? "noreferrer" : undefined}
                  target={isExternal ? "_blank" : undefined}
                  title={`${item.label}: ${item.displayHref}`}
                >
                  <span className="socialIcon" aria-hidden="true">
                    {item.icon}
                  </span>
                  <span className="socialText">
                    <strong>{item.label}</strong>
                    {item.hideDisplayHref ? null : (
                      <small>{item.displayHref}</small>
                    )}
                  </span>
                </a>
              );
            })}
          </div>
        </div>
      </ResizableStack>
    </aside>
  );
}

export function CampaignPanel({ content }: { readonly content: SiteContent }) {
  const { campaign, ui } = content;

  return (
    <TerminalPanel title={ui.panels.campaignTitle} className="campaignPanel">
      <div className="campaignCopy">
        <h1>{campaign.headline}</h1>
        <p className="campaignQuote">
          {campaign.quoteLines.map((line, index) => (
            <Fragment key={line}>
              {index > 0 ? <br /> : null}
              {line}
            </Fragment>
          ))}
        </p>
      </div>
      <SpaceScene />
    </TerminalPanel>
  );
}

export function ActiveQuestlinesPanel({
  content,
}: {
  readonly content: SiteContent;
}) {
  const { activeQuests, ui } = content;

  return (
    <TerminalPanel
      id="questlines"
      title={ui.panels.activeQuestlinesTitle}
      className="questlinesPanel"
    >
      <div className="questTable" aria-label={ui.panels.activeQuestlinesAria}>
        <CodexQuestMetricFilter labels={ui.codex} />
        <div className="questTableStack">
          <div className="questHead" aria-hidden="true">
            <span>{ui.panels.questHeaders.questline}</span>
            <span>{ui.panels.questHeaders.progress}</span>
            <span>{ui.panels.questHeaders.status}</span>
            <span>{ui.codex.prompts}</span>
            <span>{ui.codex.files}</span>
            <span>{ui.codex.lines}</span>
          </div>
          <div className="questRows">
            {activeQuests.map((quest) => (
              <ActiveQuestRow content={content} key={quest.id} quest={quest} />
            ))}
          </div>
        </div>
      </div>
    </TerminalPanel>
  );
}

function ActiveQuestRow({
  content,
  quest,
}: {
  readonly content: SiteContent;
  readonly quest: Quest;
}) {
  return (
    <ProjectPopover
      className="activeProjectCard"
      codexLabels={content.ui.codex}
      labels={content.ui.project}
      quest={quest}
    >
      <div className="questRow projectTrigger">
        <div className="questNameCell">
          <span>{quest.name}</span>
          <small>{quest.detail ?? quest.summary}</small>
        </div>
        <span className="questProgressCell">
          <QuestProgress value={quest.progress} />
        </span>
        <span
          className="projectStatus"
          title={quest.displayStatus ?? quest.status}
        >
          {quest.displayStatus ?? quest.status}
        </span>
        <CodexQuestMetricCells
          labels={content.ui.codex}
          projectId={quest.id}
        />
      </div>
    </ProjectPopover>
  );
}

export function IncubatingPanel({ content }: { readonly content: SiteContent }) {
  const { incubatingQuests, pausedQuests, ui } = content;

  return (
    <TerminalPanel
      id="chronicles"
      title={ui.panels.incubatingTitle}
      className="incubatingPanel"
    >
      <div className="questArcTabs">
        <input
          className="questArcTabInput"
          defaultChecked
          id="quest-arc-future"
          name="quest-arc-tabs"
          suppressHydrationWarning
          type="radio"
        />
        <input
          className="questArcTabInput"
          id="quest-arc-paused"
          name="quest-arc-tabs"
          suppressHydrationWarning
          type="radio"
        />

        <div
          className="questArcTabList"
          role="tablist"
          aria-label={ui.panels.questArcsAria}
        >
          <label htmlFor="quest-arc-future" id="quest-arc-future-label" role="tab">
            {ui.panels.questFutureTab}
          </label>
          <label htmlFor="quest-arc-paused" id="quest-arc-paused-label" role="tab">
            {ui.panels.questPausedTab}
          </label>
        </div>

        <div
          aria-labelledby="quest-arc-future-label"
          className="questArcTabPanel questArcTabPanelFuture"
          role="tabpanel"
        >
          <div className="questBoard">
            {incubatingQuests.map((quest) => (
              <IncubatingQuestCard
                content={content}
                key={quest.id}
                quest={quest}
              />
            ))}
          </div>
        </div>

        <div
          aria-labelledby="quest-arc-paused-label"
          className="questArcTabPanel questArcTabPanelPaused"
          role="tabpanel"
        >
          <div className="legacyQuestBoard">
            {pausedQuests.map((quest) => (
              <LegacyQuestCard content={content} key={quest.id} quest={quest} />
            ))}
          </div>
        </div>
      </div>
    </TerminalPanel>
  );
}

function IncubatingQuestCard({
  content,
  quest,
}: {
  readonly content: SiteContent;
  readonly quest: Quest;
}) {
  return (
    <ProjectPopover
      className="incubatingProjectCard"
      codexLabels={content.ui.codex}
      labels={content.ui.project}
      quest={quest}
    >
      <div className="questNotice projectTrigger">
        <span>{quest.name}</span>
        <small>{quest.detail ?? quest.summary}</small>
        <strong className="projectStatus">
          {quest.displayStatus ?? quest.status}
        </strong>
        <em className="questProgressCell">
          <QuestProgress value={quest.progress} />
        </em>
      </div>
    </ProjectPopover>
  );
}

function LegacyQuestCard({
  content,
  quest,
}: {
  readonly content: SiteContent;
  readonly quest: Quest;
}) {
  return (
    <ProjectPopover
      className="legacyProjectCard"
      codexLabels={content.ui.codex}
      labels={content.ui.project}
      quest={quest}
    >
      <div className="legacyQuestCard projectTrigger">
        <header>
          <span>{quest.name}</span>
          <strong className="projectStatus">
            {quest.displayStatus ?? quest.status}
          </strong>
        </header>
        <p>{quest.detail ?? quest.summary}</p>
      </div>
    </ProjectPopover>
  );
}

export function ArticlesPanel({ content }: { readonly content: SiteContent }) {
  const articles = getAllArticles();

  return (
    <TerminalPanel
      id="articles"
      title={content.ui.panels.articlesTitle}
      className="articlesPanel"
    >
      <ArticlesPanelClient
        articles={articles}
        labels={content.ui.articlesPanel}
      />
    </TerminalPanel>
  );
}

export function LoreLogPanel({ content }: { readonly content: SiteContent }) {
  const quests = [
    ...content.activeQuests,
    ...content.incubatingQuests,
    ...content.pausedQuests,
  ];

  return (
    <TerminalPanel
      id="lorelog"
      title={content.ui.panels.loreLogTitle}
      className="lorePanel"
    >
      <CodexLoreLog
        fallbackEntries={content.loreEntries}
        labels={content.ui.codex}
        projectLabels={content.ui.project}
        quests={quests}
      />
    </TerminalPanel>
  );
}

export function SkillTreePanel({ content }: { readonly content: SiteContent }) {
  const { coreStats, eraCards, stats, ui } = content;

  return (
    <TerminalPanel
      id="skilltree"
      title={ui.panels.skillTreeTitle}
      className="skillPanel"
    >
      <div className="skillTabs">
        <input
          className="skillTabInput"
          id="skill-tab-era"
          name="skill-tabs"
          suppressHydrationWarning
          type="radio"
        />
        <input
          className="skillTabInput"
          id="skill-tab-tech"
          name="skill-tabs"
          suppressHydrationWarning
          type="radio"
        />
        <input
          className="skillTabInput"
          defaultChecked
          id="skill-tab-relics"
          name="skill-tabs"
          suppressHydrationWarning
          type="radio"
        />

        <div
          className="skillTabList"
          role="tablist"
          aria-label={ui.panels.skillTreeTitle}
        >
          <label htmlFor="skill-tab-era" id="skill-tab-era-label" role="tab">
            {ui.panels.skillTabs.era}
          </label>
          <label htmlFor="skill-tab-tech" id="skill-tab-tech-label" role="tab">
            {ui.panels.skillTabs.tech}
          </label>
          <label
            htmlFor="skill-tab-relics"
            id="skill-tab-relics-label"
            role="tab"
          >
            {ui.panels.skillTabs.relics}
          </label>
        </div>

        <div
          aria-labelledby="skill-tab-era-label"
          className="skillTabPanel skillTabPanelEra"
          role="tabpanel"
        >
          <div className="eraMeme" aria-label={ui.panels.eraAria}>
            <div className="eraSceneCell">
              <EraBeforeScene />
            </div>
            <div className="eraSceneCell eraSceneCellAfter">
              <EraAfterScene />
            </div>
            {eraCards.map((era) => (
              <div className="eraMemeCard" key={era.label}>
                <span>{era.label}</span>
                <strong>{era.title}</strong>
                <p>{era.detail}</p>
              </div>
            ))}
          </div>
        </div>

        <div
          aria-labelledby="skill-tab-tech-label"
          className="skillTabPanel skillTabPanelTech"
          role="tabpanel"
        >
          <div className="statList">
            {stats.map((stat) => {
              const Icon = skillIcons[stat.icon];

              return (
                <SkillRow
                  Icon={Icon}
                  key={stat.label}
                  levelAbbreviation={ui.panels.levelAbbreviation}
                  stat={stat}
                />
              );
            })}
          </div>
        </div>

        <div
          aria-labelledby="skill-tab-relics-label"
          className="skillTabPanel skillTabPanelRelics"
          role="tabpanel"
        >
          <div className="coreStats">
            <ResizableStack
              className="coreStatsStack"
              initialFractions={RELIC_SECTION_FRACTIONS}
              label={ui.panels.relicLoadoutLabel}
              minPixels={RELIC_SECTION_MIN_PIXELS}
            >
              <h3>{ui.panels.relicLoadoutTitle}</h3>
              <div className="coreStatsList">
                {coreStats.map((stat) => (
                  <p key={stat.label}>
                    <span>{stat.label}</span>
                    <strong>{stat.value}</strong>
                  </p>
                ))}
              </div>
            </ResizableStack>
          </div>
        </div>
      </div>
    </TerminalPanel>
  );
}

const skillIcons = {
  agents: Bot,
  code: Code2,
  craft: Hammer,
  data: Database,
  devops: ServerCog,
  entrepreneurship: Handshake,
  ml: BrainCircuit,
  modeling: Box,
  pcb: CircuitBoard,
  product: Compass,
  web3: Blocks,
} satisfies Record<SkillIcon, LucideIcon>;

function ProgressValue({
  value,
  size,
}: {
  readonly value: number;
  readonly size?: number;
}) {
  return (
    <>
      <ProgressBar value={value} size={size} />
      <strong>{value}%</strong>
    </>
  );
}

function QuestProgress({ value }: { readonly value: number }) {
  const progress = Math.max(0, Math.min(value, 100));

  return (
    <span
      aria-label={`${progress}%`}
      className="questProgress"
      style={{ "--quest-progress": `${progress}%` } as CSSProperties}
      title={`${progress}%`}
    >
      <span className="questProgressTrack" aria-hidden="true">
        <span />
      </span>
      <strong>{progress}%</strong>
    </span>
  );
}

function SkillRow({
  stat,
  Icon,
  levelAbbreviation,
}: {
  readonly stat: Stat;
  readonly Icon: LucideIcon;
  readonly levelAbbreviation: string;
}) {
  return (
    <button className="statRow" title={stat.label} type="button">
      <span className="statIcon" aria-hidden="true">
        <Icon strokeWidth={1.8} />
      </span>
      <span>{stat.label}</span>
      <StatMeter value={stat.value} />
      <strong>
        {levelAbbreviation} {stat.level ?? stat.value}
      </strong>
    </button>
  );
}

function StatMeter({ value }: { readonly value: number }) {
  const clampedValue = Math.max(0, Math.min(value, 100));

  return (
    <span
      aria-label={`${clampedValue}%`}
      className="statMeter"
      style={{ "--stat-value": `${clampedValue}%` } as CSSProperties}
    >
      <span />
    </span>
  );
}

"use client";

import type { SiteContent } from "@/data/localized-site";
import type { Quest, Stat } from "@/data/site";
import type { ArticleSummary } from "@/lib/articles";
import type {
  CodexLoreProject,
  CodexLoreProjectWindow,
  CodexLoreWindowKey,
} from "@/lib/codex-lore";
import {
  AtSign,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Camera,
  Cpu,
  ExternalLink,
  FolderGit2,
  Mail,
  Network,
  Radio,
  Rss,
  Send,
  Swords,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import {
  type CSSProperties,
  type ReactNode,
  type UIEvent,
  useCallback,
  useMemo,
  useState,
} from "react";
import {
  ArticlesScene,
  Avatar,
  EraAfterScene,
  EraBeforeScene,
  ProgressBar,
} from "./ascii-scenes";
import { useCodexLore } from "./codex-lore-store";
import { SpaceScene } from "./space-scene";

type RoomId =
  | "campaign"
  | "profile"
  | "questlines"
  | "articles"
  | "lore"
  | "skills";

type MobileCopy = {
  readonly back: string;
  readonly guildOnline: string;
  readonly inboxTitle: string;
  readonly moreAria: string;
  readonly openRoom: string;
  readonly openThread: string;
  readonly projectDossier: string;
  readonly roomMeta: Record<RoomId, string>;
  readonly roomSnippets: Record<RoomId, string>;
  readonly roomTitles: Record<RoomId, string>;
  readonly sectionsAria: string;
};

type RoomConfig = {
  readonly id: RoomId;
  readonly meta: string;
  readonly snippet: string;
  readonly title: string;
};

function formatMobileHeading(title: string) {
  return `:: ${title.replace(/\s*\/\s*/gu, " ").trim().toLocaleUpperCase()}`;
}

type QuestArcId = "active" | "future" | "paused";
type LoreTabId = "graph" | "log";
type MobileLoreGraphRange = CodexLoreWindowKey | "all";
type MobileLoreMetricKey = "filesTouched" | "linesAdded" | "promptCount";

type MobileLoreMetric = {
  readonly key: MobileLoreMetricKey;
  readonly label: string;
  readonly prefix?: string;
  readonly tone: string;
};

const roomOrder: readonly {
  readonly id: RoomId;
}[] = [
  { id: "campaign" },
  { id: "profile" },
  { id: "questlines" },
  { id: "articles" },
  { id: "lore" },
  { id: "skills" },
];
const mobileLoreRangeOptions = [
  { key: "all", label: "All" },
  { key: "24h", label: "24h" },
  { key: "7d", label: "7d" },
  { key: "1m", label: "1m" },
] as const satisfies readonly {
  readonly key: MobileLoreGraphRange;
  readonly label: string;
}[];
const compactNumberFormat = new Intl.NumberFormat("en-US", {
  compactDisplay: "short",
  notation: "compact",
});
const standardNumberFormat = new Intl.NumberFormat("en-US");
const emptyCodexLoreProjects: readonly CodexLoreProject[] = [];

function getMobileCopy(language: SiteContent["language"]): MobileCopy {
  if (language === "ru") {
    return {
      back: "Назад",
      guildOnline: "гильдия онлайн",
      inboxTitle: "Guild Messenger",
      moreAria: "Открыть меню",
      openRoom: "Открыть чат",
      openThread: "Открыть тред",
      projectDossier: "Досье квеста",
      roomMeta: {
        articles: "свитки",
        campaign: "вещание",
        lore: "лог",
        profile: "лист",
        questlines: "3 секции",
        skills: "статы",
      },
      roomSnippets: {
        articles: "Полевые отчеты и длинные заметки.",
        campaign: "Текущий главный замысел и тон всей кампании.",
        lore: "Свежие записи хроники и следы сборки.",
        profile: "Кто строит, какой ранг и где найти.",
        questlines: "Активные, будущие и легендарные арки.",
        skills: "Характеристики, реликвии и эпоха агентов.",
      },
      roomTitles: {
        articles: "СТАТЬИ",
        campaign: "ТЕКУЩАЯ КАМПАНИЯ",
        lore: "LORE LOG",
        profile: "ПРОФИЛЬ",
        questlines: "КВЕСТОВЫЙ ЗАЛ",
        skills: "ДЕРЕВО НАВЫКОВ",
      },
      sectionsAria: "Разделы",
    };
  }

  if (language === "zh") {
    return {
      back: "返回",
      guildOnline: "公会在线",
      inboxTitle: "Guild Messenger",
      moreAria: "打开菜单",
      openRoom: "打开聊天",
      openThread: "打开线程",
      projectDossier: "任务档案",
      roomMeta: {
        articles: "卷轴",
        campaign: "广播",
        lore: "日志",
        profile: "角色卡",
        questlines: "3 区",
        skills: "属性",
      },
      roomSnippets: {
        articles: "长文、现场记录和构建札记。",
        campaign: "当前主线和整场战役的语气。",
        lore: "最新编年史和构建痕迹。",
        profile: "建造者、等级和联络入口。",
        questlines: "活跃、未来与暂停的任务弧线。",
        skills: "属性、遗物和智能体时代。",
      },
      roomTitles: {
        articles: "文章",
        campaign: "当前战役",
        lore: "LORE LOG",
        profile: "档案",
        questlines: "任务大厅",
        skills: "技能树",
      },
      sectionsAria: "章节",
    };
  }

  return {
    back: "Back",
    guildOnline: "guild online",
    inboxTitle: "Guild Messenger",
    moreAria: "Open menu",
    openRoom: "Open chat",
    openThread: "Open thread",
    projectDossier: "Quest dossier",
    roomMeta: {
      articles: "scrolls",
      campaign: "broadcast",
      lore: "log",
      profile: "sheet",
      questlines: "3 sections",
      skills: "stats",
    },
    roomSnippets: {
      articles: "Field reports and long-form notes.",
      campaign: "The current main intent and campaign tone.",
      lore: "Fresh chronicle entries and build traces.",
      profile: "Who is building, current rank, and links.",
      questlines: "Active, future, and legendary arcs.",
      skills: "Stats, relics, and the agent era.",
    },
    roomTitles: {
      articles: "ARTICLES",
      campaign: "CURRENT CAMPAIGN",
      lore: "LORE LOG",
      profile: "PROFILE",
      questlines: "QUEST HALL",
      skills: "SKILL TREE",
    },
    sectionsAria: "Sections",
  };
}

export function MobileGuildMessenger({
  articles,
  content,
}: {
  readonly articles: readonly ArticleSummary[];
  readonly content: SiteContent;
}) {
  const copy = getMobileCopy(content.language);
  const [activeRoom, setActiveRoom] = useState<RoomId | null>(null);
  const [activeQuest, setActiveQuest] = useState<Quest | null>(null);
  const activeRoomConfig = useMemo(() => {
    const rooms = roomOrder.map<RoomConfig>(({ id }) => ({
      id,
      meta: copy.roomMeta[id],
      snippet: copy.roomSnippets[id],
      title: copy.roomTitles[id],
    }));

    return {
      current: activeRoom
        ? rooms.find((room) => room.id === activeRoom) ?? null
        : null,
      rooms,
    };
  }, [activeRoom, copy]);
  const headerTitle = activeQuest
    ? activeQuest.name
    : activeRoomConfig.current?.title ?? copy.inboxTitle;
  const displayHeaderTitle = activeQuest
    ? formatMobileHeading(`PROJECT ${activeQuest.name}`)
    : activeRoomConfig.current
      ? formatMobileHeading(headerTitle)
      : headerTitle;
  const headerSubtitle = activeQuest
    ? `${activeQuest.displayStatus ?? activeQuest.status} / ${activeQuest.progress}%`
    : activeRoomConfig.current?.snippet ?? `${content.profile.status}`;
  const getArticleTitle = useCallback(
    (article: ArticleSummary) =>
      content.ui.articlesPanel.articleTitles[article.slug] ?? article.title,
    [content.ui.articlesPanel.articleTitles],
  );

  const handleBack = useCallback(() => {
    if (activeQuest) {
      setActiveQuest(null);
      return;
    }

    setActiveRoom(null);
  }, [activeQuest]);
  const openRoom = useCallback((room: RoomId) => {
    setActiveQuest(null);
    setActiveRoom(room);
  }, []);

  return (
    <main
      className="mobileGuildMessenger"
      id="mobile-guild"
      aria-label={copy.inboxTitle}
    >
      <div className="mobileGuildFrame">
        <header className="mobileGuildTopBar">
          {activeRoom || activeQuest ? (
            <button
              aria-label={copy.back}
              className="mobileIconButton"
              onClick={handleBack}
              type="button"
            >
              <ChevronLeft aria-hidden="true" size={18} strokeWidth={1.8} />
            </button>
          ) : (
            <span className="mobileGuildSigil" aria-hidden="true">
              &lt;/&gt;
            </span>
          )}

          <div className="mobileGuildTitleBlock">
            <strong>{displayHeaderTitle}</strong>
            <span>{headerSubtitle}</span>
          </div>

          <div className="mobileGuildActions">
            <span className="mobileHeaderSpacer" aria-hidden="true" />
          </div>
        </header>

        {activeQuest ? (
          <ProjectThread
            copy={copy}
            onNavigateRoom={openRoom}
            parentRoom={activeRoom ?? "questlines"}
            quest={activeQuest}
            rooms={activeRoomConfig.rooms}
            projectLabels={content.ui.project}
          />
        ) : activeRoom ? (
          <RoomThread
            activeRoom={activeRoom}
            articles={articles}
            content={content}
            copy={copy}
            getArticleTitle={getArticleTitle}
            onNavigateRoom={openRoom}
            openQuest={setActiveQuest}
            rooms={activeRoomConfig.rooms}
          />
        ) : (
          <Inbox
            content={content}
            copy={copy}
            openRoom={openRoom}
            rooms={activeRoomConfig.rooms}
          />
        )}
      </div>
    </main>
  );
}

function Inbox({
  content,
  copy,
  openRoom,
  rooms,
}: {
  readonly content: SiteContent;
  readonly copy: MobileCopy;
  readonly openRoom: (room: RoomId) => void;
  readonly rooms: readonly RoomConfig[];
}) {
  return (
    <div className="mobileInbox">
      <section className="mobileGuildHero" aria-label={content.profile.brand}>
        <div className="mobileGuildHeroArt" aria-hidden="true">
          <Avatar />
        </div>
        <div className="mobileGuildHeroCopy">
          <span>{copy.guildOnline}</span>
          <h1>{content.profile.brand}</h1>
          <p>{content.campaign.description}</p>
        </div>
      </section>

      <nav className="mobileHomeSocials" aria-label={content.ui.panels.socials}>
        {content.socialLinks.map((item) => (
          <a
            aria-label={item.label}
            className="mobileHomeSocial"
            href={item.href}
            key={item.label}
            rel={item.href.startsWith("http") ? "noreferrer" : undefined}
            target={item.href.startsWith("http") ? "_blank" : undefined}
            title={item.label}
          >
            <SocialIcon href={item.href} label={item.label} />
          </a>
        ))}
      </nav>

      <div className="mobileChatList">
        {rooms.map(({ id, snippet, title }) => (
          <button
            aria-label={`${copy.openRoom}: ${title}`}
            className="mobileChatRow"
            key={id}
            onClick={() => openRoom(id)}
            type="button"
          >
            <GuildRoomIcon room={id} />
            <span className="mobileChatText">
              <span>
                <strong>{title}</strong>
                <small>{copy.roomMeta[id]}</small>
              </span>
              <small>{snippet}</small>
            </span>
            <ChevronRight
              aria-hidden="true"
              className="mobileChatChevron"
              size={16}
              strokeWidth={1.8}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

function GuildRoomIcon({
  room,
}: {
  readonly room: RoomId;
}) {
  const iconProps = {
    "aria-hidden": true,
    size: 34,
    strokeWidth: 1.75,
  } as const;

  return (
    <span className="mobileChatAvatar" data-room={room} aria-hidden="true">
      {room === "campaign" ? <Radio {...iconProps} /> : null}
      {room === "profile" ? <UserRound {...iconProps} /> : null}
      {room === "questlines" ? <Swords {...iconProps} /> : null}
      {room === "articles" ? <BookOpen {...iconProps} /> : null}
      {room === "lore" ? <Network {...iconProps} /> : null}
      {room === "skills" ? <Cpu {...iconProps} /> : null}
    </span>
  );
}

function SocialIcon({
  href,
  label,
}: {
  readonly href: string;
  readonly label: string;
}) {
  const iconProps = {
    "aria-hidden": true,
    size: 20,
    strokeWidth: 1.85,
  } as const;
  const normalizedLabel = label.toLocaleLowerCase();

  if (normalizedLabel.includes("telegram")) {
    return <Send {...iconProps} />;
  }

  if (normalizedLabel.includes("instagram")) {
    return <Camera {...iconProps} />;
  }

  if (normalizedLabel.includes("github")) {
    return <FolderGit2 {...iconProps} />;
  }

  if (normalizedLabel.includes("rss") || href.endsWith(".xml")) {
    return <Rss {...iconProps} />;
  }

  if (normalizedLabel.includes("email") || href.startsWith("mailto:")) {
    return <Mail {...iconProps} />;
  }

  if (normalizedLabel.includes("x.com")) {
    return <AtSign {...iconProps} />;
  }

  return <ExternalLink {...iconProps} />;
}

function RoomThread({
  activeRoom,
  articles,
  content,
  copy,
  getArticleTitle,
  onNavigateRoom,
  openQuest,
  rooms,
}: {
  readonly activeRoom: RoomId;
  readonly articles: readonly ArticleSummary[];
  readonly content: SiteContent;
  readonly copy: MobileCopy;
  readonly getArticleTitle: (article: ArticleSummary) => string;
  readonly onNavigateRoom: (room: RoomId) => void;
  readonly openQuest: (quest: Quest) => void;
  readonly rooms: readonly RoomConfig[];
}) {
  return (
    <div className="mobileThread">
      {activeRoom === "campaign" ? (
        <CampaignMessages content={content} />
      ) : null}
      {activeRoom === "profile" ? <ProfileMessages content={content} /> : null}
      {activeRoom === "questlines" ? (
        <QuestBoardMessages
          activeTitle={content.ui.panels.activeQuestlinesTitle}
          copy={copy}
          futureTitle={content.ui.panels.questFutureTab}
          openQuest={openQuest}
          pausedTitle={content.ui.panels.questPausedTab}
          activeQuests={content.activeQuests}
          futureQuests={content.incubatingQuests}
          pausedQuests={content.pausedQuests}
        />
      ) : null}
      {activeRoom === "articles" ? (
        <ArticleMessages
          articles={articles}
          getArticleTitle={getArticleTitle}
          labels={content.ui.articlesPanel}
        />
      ) : null}
      {activeRoom === "lore" ? <LoreMessages content={content} /> : null}
      {activeRoom === "skills" ? <SkillMessages content={content} /> : null}
      <RoomPager
        activeRoom={activeRoom}
        labels={copy}
        onNavigateRoom={onNavigateRoom}
        rooms={rooms}
      />
    </div>
  );
}

function CampaignMessages({ content }: { readonly content: SiteContent }) {
  return (
    <>
      <MessageBubble>
        <span className="mobileBubbleLabel">
          {formatMobileHeading(content.ui.panels.campaignTitle)}
        </span>
        <div className="mobileCampaignScene" aria-hidden="true">
          <SpaceScene />
        </div>
        <h2>{content.campaign.headline}</h2>
        <p>{content.campaign.description}</p>
      </MessageBubble>
      <MessageBubble variant="accent">
        <p>{content.campaign.focus}</p>
        <blockquote>
          {content.campaign.quoteLines.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </blockquote>
      </MessageBubble>
    </>
  );
}

function ProfileMessages({ content }: { readonly content: SiteContent }) {
  return (
    <>
      <MessageBubble>
        <span className="mobileBubbleLabel">
          {formatMobileHeading(content.ui.panels.profileAria)}
        </span>
        <h2>{content.profile.name}</h2>
        <p>{content.profile.role}</p>
        <div className="mobileProfileLines">
          {content.profileLines.map((line) => (
            <p key={line.label}>
              <span>{line.label}</span>
              <strong>{line.value}</strong>
            </p>
          ))}
        </div>
      </MessageBubble>
      <MessageBubble variant="inline">
        <div className="mobileXpLine">
          <span>
            {content.ui.panels.levelLabel} {content.profile.xp.level}
          </span>
          <ProgressBar value={content.profile.xp.percent} size={16} />
          <strong>{content.profile.xp.percent}%</strong>
        </div>
      </MessageBubble>
      <div className="mobileLinkGrid" aria-label={content.ui.panels.socials}>
        {content.socialLinks.map((item) => (
          <a
            className="mobileLinkTile"
            href={item.href}
            key={item.label}
            rel={item.href.startsWith("http") ? "noreferrer" : undefined}
            target={item.href.startsWith("http") ? "_blank" : undefined}
          >
            <span aria-hidden="true">
              <SocialIcon href={item.href} label={item.label} />
            </span>
            <strong>{item.label}</strong>
            <small>{item.displayHref}</small>
          </a>
        ))}
      </div>
    </>
  );
}

function QuestBoardMessages({
  activeQuests,
  activeTitle,
  copy,
  futureQuests,
  futureTitle,
  openQuest,
  pausedQuests,
  pausedTitle,
}: {
  readonly activeQuests: readonly Quest[];
  readonly activeTitle: string;
  readonly copy: MobileCopy;
  readonly futureQuests: readonly Quest[];
  readonly futureTitle: string;
  readonly openQuest: (quest: Quest) => void;
  readonly pausedQuests: readonly Quest[];
  readonly pausedTitle: string;
}) {
  const [activeArc, setActiveArc] = useState<QuestArcId>("active");
  const questArcSections: readonly {
    readonly id: QuestArcId;
    readonly quests: readonly Quest[];
    readonly title: string;
  }[] = [
    { id: "active", quests: activeQuests, title: activeTitle },
    { id: "future", quests: futureQuests, title: futureTitle },
    { id: "paused", quests: pausedQuests, title: pausedTitle },
  ];
  const selectedSection =
    questArcSections.find((section) => section.id === activeArc) ??
    questArcSections[0];

  return (
    <MessageBubble>
      <div className="mobileQuestSections">
        <div className="mobileQuestTabs" role="tablist" aria-label={copy.roomTitles.questlines}>
          {questArcSections.map((section) => (
            <button
              aria-selected={activeArc === section.id}
              className="mobileQuestTab"
              key={section.id}
              onClick={() => setActiveArc(section.id)}
              role="tab"
              type="button"
            >
              {section.title}
            </button>
          ))}
        </div>
        <QuestSection
          copy={copy}
          openQuest={openQuest}
          quests={selectedSection.quests}
          title={selectedSection.title}
        />
      </div>
    </MessageBubble>
  );
}

function QuestSection({
  copy,
  openQuest,
  quests,
  title,
}: {
  readonly copy: MobileCopy;
  readonly openQuest: (quest: Quest) => void;
  readonly quests: readonly Quest[];
  readonly title: string;
}) {
  return (
    <section className="mobileQuestSection">
      <span className="mobileBubbleLabel">{formatMobileHeading(title)}</span>
      <div className="mobileQuestList">
        {quests.map((quest) => (
          <button
            aria-label={`${copy.openThread}: ${quest.name}`}
            className="mobileQuestCard"
            key={quest.id}
            onClick={() => openQuest(quest)}
            type="button"
          >
            <span className="mobileQuestCardMain">
              <strong>{quest.name}</strong>
              <small>{quest.detail ?? quest.summary}</small>
            </span>
            <span className="mobileQuestCardSide">
              <em>{quest.displayStatus ?? quest.status}</em>
              <ProgressBar value={quest.progress} size={10} />
            </span>
            <ChevronRight aria-hidden="true" size={16} strokeWidth={1.8} />
          </button>
        ))}
      </div>
    </section>
  );
}

function ArticleMessages({
  articles,
  getArticleTitle,
  labels,
}: {
  readonly articles: readonly ArticleSummary[];
  readonly getArticleTitle: (article: ArticleSummary) => string;
  readonly labels: SiteContent["ui"]["articlesPanel"];
}) {
  if (articles.length === 0) {
    return (
      <MessageBubble>
        <p>{labels.noArticles}</p>
      </MessageBubble>
    );
  }

  return (
    <MessageBubble>
      <span className="mobileBubbleLabel">{formatMobileHeading(labels.listAria)}</span>
      <div className="mobileArticlesScene" aria-hidden="true">
        <ArticlesScene />
      </div>
      <div className="mobileArticleList">
        {articles.map((article) => (
          <Link
            className="mobileArticleCard"
            href={article.href}
            key={article.slug}
            prefetch={false}
          >
            <span className="mobileArticleIcon" aria-hidden="true">
              <BookOpen size={18} strokeWidth={1.75} />
            </span>
            <span className="mobileArticleCopy">
              <strong>{getArticleTitle(article)}</strong>
              <span>{article.description}</span>
              <small>{article.readingTime}</small>
            </span>
            <ExternalLink
              aria-hidden="true"
              className="mobileArticleOpenIcon"
              size={15}
              strokeWidth={1.8}
            />
          </Link>
        ))}
      </div>
    </MessageBubble>
  );
}

function LoreMessages({ content }: { readonly content: SiteContent }) {
  const [activeLoreTab, setActiveLoreTab] = useState<LoreTabId>("graph");
  const [logBatches, setLogBatches] = useState(4);
  const loreLogEntries = useMemo(
    () =>
      Array.from({ length: logBatches }, (_, batchIndex) =>
        content.loreEntries.map((entry, entryIndex) => ({
          ...entry,
          key: `${batchIndex}-${entryIndex}-${entry.date}-${entry.text}`,
        })),
      ).flat(),
    [content.loreEntries, logBatches],
  );
  const handleLogScroll = useCallback((event: UIEvent<HTMLDivElement>) => {
    const node = event.currentTarget;

    if (node.scrollTop + node.clientHeight >= node.scrollHeight - 56) {
      setLogBatches((current) => Math.min(current + 2, 48));
    }
  }, []);

  return (
    <MessageBubble>
      <span className="mobileBubbleLabel">
        {formatMobileHeading(content.ui.panels.loreLogTitle)}
      </span>
      <div
        className="mobileLoreTabs"
        role="tablist"
        aria-label={content.ui.panels.loreLogTitle}
      >
        <button
          aria-selected={activeLoreTab === "graph"}
          className="mobileLoreTab"
          onClick={() => setActiveLoreTab("graph")}
          role="tab"
          type="button"
        >
          {content.ui.codex.loreTabs.graph}
        </button>
        <button
          aria-selected={activeLoreTab === "log"}
          className="mobileLoreTab"
          onClick={() => setActiveLoreTab("log")}
          role="tab"
          type="button"
        >
          {content.ui.codex.loreTabs.log}
        </button>
      </div>

      {activeLoreTab === "graph" ? (
        <MobileLoreGraphs content={content} />
      ) : (
        <div
          className="mobileLoreLogScroll"
          onScroll={handleLogScroll}
          role="tabpanel"
        >
          <div className="mobileLoreList">
            {loreLogEntries.map((entry) => (
              <article className="mobileLoreEntry" key={entry.key}>
                <time>{entry.date}</time>
                <p>{entry.text}</p>
              </article>
            ))}
          </div>
        </div>
      )}
    </MessageBubble>
  );
}

function MobileLoreGraphs({ content }: { readonly content: SiteContent }) {
  const { index, status } = useCodexLore();
  const [range, setRange] = useState<MobileLoreGraphRange>("all");
  const projects = index?.projects ?? emptyCodexLoreProjects;
  const metrics = useMemo<readonly MobileLoreMetric[]>(
    () =>
      [
        {
          key: "promptCount",
          label: content.ui.codex.prompts,
          tone: "prompts",
        },
        {
          key: "linesAdded",
          label: content.ui.codex.lines,
          prefix: "+",
          tone: "lines",
        },
        {
          key: "filesTouched",
          label: content.ui.codex.files,
          tone: "files",
        },
      ] as const satisfies readonly MobileLoreMetric[],
    [content.ui.codex.files, content.ui.codex.lines, content.ui.codex.prompts],
  );
  const totals = useMemo(
    () =>
      metrics.map((metric) => ({
        ...metric,
        value: projects.reduce(
          (sum, project) =>
            sum + getMobileProjectMetricsForRange(project, range)[metric.key],
          0,
        ),
      })),
    [metrics, projects, range],
  );
  const hasSignal = totals.some((metric) => metric.value > 0);

  return (
    <div className="mobileLoreGraph" role="tabpanel">
      <header className="mobileLoreGraphHeader">
        <div>
          <strong>{content.ui.codex.graph.title}</strong>
          <span>
            {hasSignal
              ? content.ui.codex.status[status]
              : content.ui.codex.graph.noData}
          </span>
        </div>
        <div
          className="mobileLoreGraphRanges"
          aria-label={content.ui.codex.graph.aria}
        >
          {mobileLoreRangeOptions.map((option) => (
            <button
              aria-pressed={range === option.key}
              key={option.key}
              onClick={() => setRange(option.key)}
              type="button"
            >
              {option.key === "all" ? content.ui.codex.graph.all : option.label}
            </button>
          ))}
        </div>
      </header>

      <div className="mobileLoreGraphStats">
        {totals.map((metric) => (
          <p key={metric.key}>
            <span>{metric.label}</span>
            <strong>
              {metric.prefix}
              {formatMobileLoreNumber(metric.value)}
            </strong>
          </p>
        ))}
      </div>

      <div className="mobileLoreGraphCharts">
        {metrics.map((metric) => (
          <MobileLoreMetricChart
            key={metric.key}
            metric={metric}
            projects={projects}
            range={range}
            noDataLabel={content.ui.codex.graph.noData}
          />
        ))}
      </div>
    </div>
  );
}

function MobileLoreMetricChart({
  metric,
  noDataLabel,
  projects,
  range,
}: {
  readonly metric: MobileLoreMetric;
  readonly noDataLabel: string;
  readonly projects: readonly CodexLoreProject[];
  readonly range: MobileLoreGraphRange;
}) {
  const rows = projects
    .map((project) => ({
      project,
      value: getMobileProjectMetricsForRange(project, range)[metric.key],
    }))
    .filter((row) => row.value > 0)
    .sort(
      (a, b) => b.value - a.value || a.project.name.localeCompare(b.project.name),
    );
  const total = rows.reduce((sum, row) => sum + row.value, 0);
  const scaleMaxValue = Math.max(1, ...rows.map((row) => row.value));

  return (
    <article className={`mobileLoreMetric mobileLoreMetric--${metric.tone}`}>
      <div className="mobileLoreMetricTitle">
        <span>{metric.label}</span>
        <strong>
          {metric.prefix}
          {formatMobileLoreNumber(total)}
        </strong>
      </div>
      {rows.length > 0 ? (
        <div className="mobileLoreMetricRows">
          {rows.map(({ project, value }) => (
            <div
              className="mobileLoreMetricRow"
              key={project.id}
              style={
                {
                  "--mobile-lore-share": `${Math.min(
                    100,
                    Math.max(0, (value / scaleMaxValue) * 100),
                  )}%`,
                } as CSSProperties
              }
            >
              <span>
                <b>{project.rank}</b>
                {project.name}
              </span>
              <em>
                {metric.prefix}
                {formatMobileLoreNumber(value)}
              </em>
              <strong aria-hidden="true">
                <span />
              </strong>
            </div>
          ))}
        </div>
      ) : (
        <p className="mobileLoreMetricEmpty">{noDataLabel}</p>
      )}
    </article>
  );
}

function SkillMessages({ content }: { readonly content: SiteContent }) {
  return (
    <>
      <MessageBubble>
        <span className="mobileBubbleLabel">
          {formatMobileHeading(content.ui.panels.skillTreeTitle)}
        </span>
        <div className="mobileEraStrip" aria-hidden="true">
          <EraBeforeScene />
          <EraAfterScene />
        </div>
        <div className="mobileSkillList">
          {content.stats.map((stat) => (
            <SkillSignal
              key={stat.label}
              levelAbbreviation={content.ui.panels.levelAbbreviation}
              stat={stat}
            />
          ))}
        </div>
      </MessageBubble>
      <MessageBubble variant="accent">
        <span className="mobileBubbleLabel">
          {formatMobileHeading(content.ui.panels.relicLoadoutTitle)}
        </span>
        <div className="mobileRelicList">
          {content.coreStats.map((stat) => (
            <p key={stat.label}>
              <span>{stat.label}</span>
              <strong>{stat.value}</strong>
            </p>
          ))}
        </div>
      </MessageBubble>
    </>
  );
}

function ProjectThread({
  copy,
  onNavigateRoom,
  parentRoom,
  projectLabels,
  quest,
  rooms,
}: {
  readonly copy: MobileCopy;
  readonly onNavigateRoom: (room: RoomId) => void;
  readonly parentRoom: RoomId;
  readonly projectLabels: SiteContent["ui"]["project"];
  readonly quest: Quest;
  readonly rooms: readonly RoomConfig[];
}) {
  const details = [
    [projectLabels.details.goal, quest.goal],
    [projectLabels.details.why, quest.whyStarted],
    [projectLabels.details.role, quest.role],
    [projectLabels.details.outcome, quest.outcome],
    [projectLabels.details.paused, quest.pausedReason],
  ].filter((item): item is [string, string] => Boolean(item[1]));

  return (
    <div className="mobileThread">
      <MessageBubble>
        <span className="mobileBubbleLabel">
          {formatMobileHeading(copy.projectDossier)}
        </span>
        <h2>{quest.name}</h2>
        <p>{quest.description}</p>
        <div className="mobileProjectProgress">
          <span>{projectLabels.progress}</span>
          <ProgressBar value={quest.progress} size={18} />
          <strong>{quest.progress}%</strong>
        </div>
      </MessageBubble>

      {quest.topThings.length > 0 ? (
        <MessageBubble variant="inline">
          <div className="mobileRuneList">
            {quest.topThings.map((thing) => (
              <span key={thing}>{thing}</span>
            ))}
          </div>
        </MessageBubble>
      ) : null}

      {details.length > 0 ? (
        <MessageBubble>
          <div className="mobileDossierRows">
            {details.map(([label, value]) => (
              <p key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
              </p>
            ))}
          </div>
        </MessageBubble>
      ) : null}

      {quest.subprojects?.length ? (
        <MessageBubble variant="accent">
          <span className="mobileBubbleLabel">
            {formatMobileHeading(projectLabels.subProjects)}
          </span>
          <div className="mobileRuneList">
            {quest.subprojects.map((subproject) => (
              <span key={subproject}>{subproject}</span>
            ))}
          </div>
        </MessageBubble>
      ) : null}
      <RoomPager
        activeRoom={parentRoom}
        labels={copy}
        onNavigateRoom={onNavigateRoom}
        rooms={rooms}
      />
    </div>
  );
}

function RoomPager({
  activeRoom,
  labels,
  onNavigateRoom,
  rooms,
}: {
  readonly activeRoom: RoomId;
  readonly labels: MobileCopy;
  readonly onNavigateRoom: (room: RoomId) => void;
  readonly rooms: readonly RoomConfig[];
}) {
  const currentIndex = Math.max(
    0,
    rooms.findIndex((room) => room.id === activeRoom),
  );
  const previousRoom = rooms[(currentIndex - 1 + rooms.length) % rooms.length];
  const nextRoom = rooms[(currentIndex + 1) % rooms.length];

  return (
    <nav className="mobileRoomPager" aria-label={labels.sectionsAria}>
      <button
        className="mobileRoomPagerButton"
        onClick={() => onNavigateRoom(previousRoom.id)}
        type="button"
      >
        <ChevronLeft aria-hidden="true" size={16} strokeWidth={1.8} />
        <span>{previousRoom.title}</span>
      </button>
      <button
        className="mobileRoomPagerButton"
        onClick={() => onNavigateRoom(nextRoom.id)}
        type="button"
      >
        <span>{nextRoom.title}</span>
        <ChevronRight aria-hidden="true" size={16} strokeWidth={1.8} />
      </button>
    </nav>
  );
}

function SkillSignal({
  levelAbbreviation,
  stat,
}: {
  readonly levelAbbreviation: string;
  readonly stat: Stat;
}) {
  return (
    <p className="mobileSkillSignal">
      <span>{stat.label}</span>
      <em>
        {levelAbbreviation} {stat.level ?? stat.value}
      </em>
      <strong style={{ "--mobile-skill": `${stat.value}%` } as CSSProperties}>
        <span />
      </strong>
    </p>
  );
}

function getMobileProjectMetricsForRange(
  project: CodexLoreProject,
  range: MobileLoreGraphRange,
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

function formatMobileLoreNumber(value: number) {
  return Math.abs(value) >= 10000
    ? compactNumberFormat.format(value)
    : standardNumberFormat.format(value);
}

function MessageBubble({
  children,
  variant = "default",
}: {
  readonly children: ReactNode;
  readonly variant?: "accent" | "default" | "inline";
}) {
  return <section className={`mobileBubble mobileBubble--${variant}`}>{children}</section>;
}

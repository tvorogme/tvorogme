import {
  ActiveQuestlinesPanel,
  ArticlesPanel,
  CampaignPanel,
  IncubatingPanel,
  LoreLogPanel,
  Sidebar,
  SkillTreePanel,
} from "@/components/panels";
import { CodexLoreProvider } from "@/components/codex-lore-store";
import { MobileGuildMessenger } from "@/components/mobile-guild-messenger";
import { OnboardingTour } from "@/components/onboarding-tour";
import { WindowItem, WindowManager } from "@/components/window-manager";
import { getSiteContent, type SiteContent } from "@/data/localized-site";
import type { WindowTile } from "@/components/window-manager-model";
import {
  DEFAULT_SITE_LANGUAGE,
  SITE_LANGUAGE_COOKIE,
  normalizeSiteLanguage,
} from "@/lib/i18n";
import { applyAdminProjectBuckets, readAdminConfig } from "@/lib/admin-config";
import { createCodexLorePublicIndex } from "@/lib/codex-lore";
import { readCodexLoreIndex } from "@/lib/codex-lore-storage";
import { getAllArticles } from "@/lib/articles";
import { cookies } from "next/headers";
import type { ReactNode } from "react";

type HomeWindowConfig = {
  readonly children: ReactNode;
  readonly id: string;
  readonly title: string;
  readonly initialTile: WindowTile;
  readonly handleLabel?: string;
  readonly minColumns?: number;
  readonly minRows?: number;
};

async function getRequestLanguage() {
  const cookieStore = await cookies();
  const cookieLanguage = normalizeSiteLanguage(
    cookieStore.get(SITE_LANGUAGE_COOKIE)?.value,
  );

  return cookieLanguage ?? DEFAULT_SITE_LANGUAGE;
}

function getHomeWindows(content: SiteContent): readonly HomeWindowConfig[] {
  const { ui } = content;

  return [
    {
      children: <Sidebar content={content} />,
      handleLabel: ui.home.profileHandle,
      id: "profile-window",
      initialTile: { col: 1, row: 1, colSpan: 5, rowSpan: 12 },
      minColumns: 5,
      minRows: 5,
      title: ui.panels.profileAria,
    },
    {
      children: <CampaignPanel content={content} />,
      id: "campaign-window",
      initialTile: { col: 6, row: 1, colSpan: 9, rowSpan: 4 },
      minColumns: 7,
      minRows: 3,
      title: ui.panels.campaignTitle,
    },
    {
      children: <ActiveQuestlinesPanel content={content} />,
      id: "questlines-window",
      initialTile: { col: 15, row: 1, colSpan: 10, rowSpan: 4 },
      minColumns: 8,
      minRows: 3,
      title: ui.panels.activeQuestlinesTitle,
    },
    {
      children: <IncubatingPanel content={content} />,
      id: "incubating-window",
      initialTile: { col: 6, row: 5, colSpan: 6, rowSpan: 4 },
      minColumns: 5,
      minRows: 2,
      title: ui.panels.incubatingTitle,
    },
    {
      children: <ArticlesPanel content={content} />,
      id: "articles-window",
      initialTile: { col: 6, row: 9, colSpan: 12, rowSpan: 4 },
      minColumns: 8,
      minRows: 2,
      title: ui.panels.articlesTitle,
    },
    {
      children: <LoreLogPanel content={content} />,
      id: "lore-window",
      initialTile: { col: 18, row: 5, colSpan: 7, rowSpan: 8 },
      minColumns: 5,
      minRows: 8,
      title: ui.panels.loreLogTitle,
    },
    {
      children: <SkillTreePanel content={content} />,
      id: "skills-window",
      initialTile: { col: 12, row: 5, colSpan: 6, rowSpan: 4 },
      minColumns: 5,
      minRows: 2,
      title: ui.panels.skillTreeTitle,
    },
  ];
}

export default async function Home() {
  const [language, adminConfig, loreIndex] = await Promise.all([
    getRequestLanguage(),
    readAdminConfig(),
    readCodexLoreIndex(),
  ]);
  const content = applyAdminProjectBuckets(getSiteContent(language), adminConfig);
  const homeWindows = getHomeWindows(content);
  const loreSnapshot = createCodexLorePublicIndex(loreIndex);
  const articleSummaries = getAllArticles().map((article) => ({
    author: article.author,
    description: article.description,
    href: article.href,
    publishedAt: article.publishedAt,
    readingTime: article.readingTime,
    slug: article.slug,
    sourceUrl: article.sourceUrl,
    title: article.title,
  }));

  return (
    <div className="siteShell siteShell--guildMobile" id="top">
      <a className="skipLink" href="#main">
        {content.ui.home.skipLink}
      </a>
      <header className="topBar">
        <p>
          {content.ui.home.statusPrefix} {content.profile.status}
        </p>
        <p>
          <a href={`mailto:${content.profile.contactEmail}`}>
            {content.profile.contactEmail}
          </a>
          {" <"}
        </p>
      </header>

      <CodexLoreProvider initialIndex={loreSnapshot}>
        <WindowManager
          footerCenter={content.ui.home.footerCenter}
          footerLeft={content.ui.home.footerLeft}
          footerRight={content.ui.home.footerRight}
          labels={content.ui.windowManager}
          language={language}
        >
          {homeWindows.map(
            ({
              children,
              handleLabel,
              id,
              initialTile,
              minColumns,
              minRows,
              title,
            }) => (
              <WindowItem
                handleLabel={handleLabel}
                id={id}
                initialTile={initialTile}
                key={id}
                minColumns={minColumns}
                minRows={minRows}
                title={title}
              >
                {children}
              </WindowItem>
            ),
          )}
        </WindowManager>
        <MobileGuildMessenger articles={articleSummaries} content={content} />
        <OnboardingTour labels={content.ui.onboarding} />
      </CodexLoreProvider>
    </div>
  );
}

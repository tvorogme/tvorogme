import type { SiteLanguage } from "@/lib/i18n";
import {
  activeQuests as baseActiveQuests,
  campaign as baseCampaign,
  coreStats as baseCoreStats,
  eraCards as baseEraCards,
  incubatingQuests as baseIncubatingQuests,
  loreEntries as baseLoreEntries,
  navItems as baseNavItems,
  pausedQuests as basePausedQuests,
  profile as baseProfile,
  profileLines as baseProfileLines,
  socialLinks as baseSocialLinks,
  stats as baseStats,
  type EraCard,
  type LoreEntry,
  type NavItem,
  type ProfileLine,
  type Quest,
  type SocialLink,
  type Stat,
} from "./site";

type ThemePreference = "light" | "dark";

type ProfileContent = {
  readonly brand: string;
  readonly name: string;
  readonly className: string;
  readonly role: string;
  readonly rank: string;
  readonly status: string;
  readonly contactEmail: string;
  readonly xp: typeof baseProfile.xp;
};

type CampaignContent = {
  readonly headline: string;
  readonly description: string;
  readonly focus: string;
  readonly quoteLines: readonly string[];
};

type CoreStat = {
  readonly label: string;
  readonly value: string;
};

export type WindowManagerCopy = {
  readonly closeSettingsAria: string;
  readonly gapAria: string;
  readonly gapLabel: string;
  readonly heading: string;
  readonly languageLegend: string;
  readonly languageOptions: Record<SiteLanguage, string>;
  readonly openSettingsAria: string;
  readonly panelAria: string;
  readonly resetLayout: string;
  readonly restartOnboarding: string;
  readonly themeLegend: string;
  readonly themeOptions: Record<ThemePreference, string>;
};

export type ArticlesPanelCopy = {
  readonly articleTitles: Record<string, string>;
  readonly listAria: string;
  readonly noArticles: string;
  readonly searchAria: string;
  readonly searchPlaceholder: string;
};

export type ProjectPopoverCopy = {
  readonly closeWindow: string;
  readonly contextSummary: string;
  readonly details: {
    readonly goal: string;
    readonly outcome: string;
    readonly paused: string;
    readonly role: string;
    readonly why: string;
  };
  readonly hoverHint: string;
  readonly liveDossier: string;
  readonly openWindow: string;
  readonly progress: string;
  readonly progressAriaSuffix: string;
  readonly signals: string;
  readonly subProjects: string;
};

export type CodexCopy = {
  readonly countersTitle: string;
  readonly files: string;
  readonly graph: {
    readonly all: string;
    readonly aria: string;
    readonly bar: string;
    readonly line: string;
    readonly noData: string;
    readonly peak: string;
    readonly title: string;
    readonly total: string;
  };
  readonly guildTraceTitle: string;
  readonly live: string;
  readonly lines: string;
  readonly loreTabs: {
    readonly graph: string;
    readonly log: string;
  };
  readonly promptRunesAria: string;
  readonly prompts: string;
  readonly rank: string;
  readonly sessions: string;
  readonly sourceLinesObserved: string;
  readonly spellcode: string;
  readonly status: {
    readonly error: string;
    readonly loading: string;
    readonly ready: string;
    readonly stale: string;
  };
  readonly syncPending: string;
  readonly touched: string;
  readonly workspaceAnd: string;
  readonly workspaceHas: string;
};

export type OnboardingCopy = {
  readonly close: string;
  readonly counterLabel: string;
  readonly decline: string;
  readonly finish: string;
  readonly next: string;
  readonly previous: string;
  readonly promptBody: string;
  readonly promptTitle: string;
  readonly start: string;
  readonly title: string;
  readonly steps: readonly {
    readonly body: string;
    readonly href: string;
    readonly title: string;
  }[];
};

export type SiteUiCopy = {
  readonly articlesPanel: ArticlesPanelCopy;
  readonly codex: CodexCopy;
  readonly home: {
    readonly footerCenter: string;
    readonly footerLeft: string;
    readonly footerRight: string;
    readonly profileHandle: string;
    readonly skipLink: string;
    readonly statusPrefix: string;
    readonly windows: {
      readonly articles: string;
      readonly campaign: string;
      readonly incubating: string;
      readonly lore: string;
      readonly profile: string;
      readonly questlines: string;
      readonly skills: string;
    };
  };
  readonly onboarding: OnboardingCopy;
  readonly panels: {
    readonly activeQuestlinesAria: string;
    readonly activeQuestlinesTitle: string;
    readonly articlesTitle: string;
    readonly campaignTitle: string;
    readonly eraAria: string;
    readonly incubatingStackLabel: string;
    readonly incubatingTitle: string;
    readonly levelLabel: string;
    readonly levelAbbreviation: string;
    readonly loreLogTitle: string;
    readonly nextRankLabel: string;
    readonly profileAria: string;
    readonly profileStackLabel: string;
    readonly questArcsAria: string;
    readonly questFutureTab: string;
    readonly questHeaders: {
      readonly progress: string;
      readonly questline: string;
      readonly status: string;
    };
    readonly questPausedTab: string;
    readonly relicLoadoutLabel: string;
    readonly relicLoadoutTitle: string;
    readonly skillTabs: {
      readonly era: string;
      readonly relics: string;
      readonly tech: string;
    };
    readonly skillTreeTitle: string;
    readonly socialLinksAria: string;
    readonly socials: string;
    readonly xpNeeded: string;
    readonly xpProgress: string;
  };
  readonly project: ProjectPopoverCopy;
  readonly windowManager: WindowManagerCopy;
};

export type SiteContent = {
  readonly activeQuests: readonly Quest[];
  readonly campaign: CampaignContent;
  readonly coreStats: readonly CoreStat[];
  readonly eraCards: readonly EraCard[];
  readonly incubatingQuests: readonly Quest[];
  readonly language: SiteLanguage;
  readonly locale: string;
  readonly loreEntries: readonly LoreEntry[];
  readonly navItems: readonly NavItem[];
  readonly pausedQuests: readonly Quest[];
  readonly profile: ProfileContent;
  readonly profileLines: readonly ProfileLine[];
  readonly socialLinks: readonly SocialLink[];
  readonly stats: readonly Stat[];
  readonly ui: SiteUiCopy;
};

type QuestCopy = Partial<
  Pick<
    Quest,
    | "description"
    | "detail"
    | "displayStatus"
    | "goal"
    | "outcome"
    | "pausedReason"
    | "readMore"
    | "role"
    | "subprojects"
    | "summary"
    | "tagline"
    | "topThings"
    | "whyStarted"
  >
>;

type SiteCopy = {
  readonly campaign: CampaignContent;
  readonly coreStats: readonly CoreStat[];
  readonly eraCards: readonly EraCard[];
  readonly locale: string;
  readonly loreEntries: readonly LoreEntry[];
  readonly navLabels: readonly string[];
  readonly profile: Pick<ProfileContent, "className" | "name" | "role" | "status">;
  readonly profileLineLabels: {
    readonly className: string;
    readonly name: string;
    readonly rank: string;
    readonly role: string;
    readonly status: string;
  };
  readonly questCopies: Record<string, QuestCopy>;
  readonly socialLabels: Record<string, string>;
  readonly stats: readonly Stat[];
  readonly subscribeSubject: string;
  readonly ui: SiteUiCopy;
};

const baseWindowCopy = {
  articles: "ARTICLES",
  campaign: "CURRENT CAMPAIGN",
  incubating: "QUEST ARCS",
  lore: "LORE LOG",
  profile: "PROFILE",
  questlines: "ACTIVE QUESTLINES",
  skills: "SKILL TREE",
} as const;

const englishUi = {
  articlesPanel: {
    articleTitles: {},
    listAria: "Articles",
    noArticles: "No articles yet.",
    searchAria: "Search articles",
    searchPlaceholder: "Search",
  },
  codex: {
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
    lines: "Lines",
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
  },
  home: {
    footerCenter: "© Andrey Tvorozhkov | tvorog.me",
    footerLeft: "Build in public. Ship small. Compound forever.",
    footerRight: "> Keep grinding.",
    profileHandle: "PROFILE",
    skipLink: "Skip to campaign",
    statusPrefix: "> status:",
    windows: baseWindowCopy,
  },
  onboarding: {
    close: "Close onboarding",
    counterLabel: "Step",
    decline: "Not now",
    finish: "Finish",
    next: "Next",
    previous: "Back",
    promptBody:
      "A two-minute map of the skill tree, profile, articles, project arcs, and agent metrics.",
    promptTitle: "Take the quick onboarding?",
    start: "Start",
    title: "Site onboarding",
    steps: [
      {
        body: "Skill Tree is the first map: current stats, technical stack, relic loadout, and how the build style is leveling up.",
        href: "#skilltree",
        title: "Skill Tree",
      },
      {
        body: "The profile window is the short character sheet: who I am, what I am building now, status, XP, and contact links.",
        href: "#profile",
        title: "About me",
      },
      {
        body: "Active questlines are the projects moving right now. Progress, status, and live agent counters sit directly on each row.",
        href: "#questlines",
        title: "Active projects",
      },
      {
        body: "Quest arcs collect future ideas, paused legends, and completed arcs. Paused means the context changed; completed means the story already left a trace.",
        href: "#chronicles",
        title: "Paused and completed",
      },
      {
        body: "Articles are longer notes and field reports: ideas, builds, and agent experiments written down instead of disappearing into chat history.",
        href: "#articles",
        title: "Articles",
      },
      {
        body: "Prompts, files, and lines show work signals from agent sessions: Codex, Claude, OpenClaw-style agents, and other builders touching the workspace.",
        href: "#lorelog",
        title: "Agent signals",
      },
    ],
  },
  panels: {
    activeQuestlinesAria: "Active questlines",
    activeQuestlinesTitle: "ACTIVE QUESTLINES",
    articlesTitle: "ARTICLES",
    campaignTitle: "CURRENT CAMPAIGN",
    eraAria: "AI Agents era before and after",
    incubatingStackLabel: "Incubating quests",
    incubatingTitle: "QUEST ARCS",
    levelLabel: "Level",
    levelAbbreviation: "Lv.",
    loreLogTitle: "lore log",
    nextRankLabel: "Next Rank",
    profileAria: "Profile",
    profileStackLabel: "Profile",
    questArcsAria: "Quest arcs",
    questFutureTab: "Future Arcs",
    questHeaders: {
      progress: "PROGRESS",
      questline: "QUESTLINE",
      status: "STATUS",
    },
    questPausedTab: "Paused",
    relicLoadoutLabel: "Relic loadout",
    relicLoadoutTitle: "Relic Loadout",
    skillTabs: {
      era: "Era",
      relics: "Relics",
      tech: "Tech",
    },
    skillTreeTitle: "SKILL TREE",
    socialLinksAria: "Social links",
    socials: "Socials",
    xpNeeded: "XP needed",
    xpProgress: "XP Progress",
  },
  project: {
    closeWindow: "Close project window",
    contextSummary: "additional context",
    details: {
      goal: "Goal",
      outcome: "Outcome",
      paused: "Paused",
      role: "Role",
      why: "Why",
    },
    hoverHint: "Click for the full dossier",
    liveDossier: "live dossier",
    openWindow: "Open project window",
    progress: "Progress",
    progressAriaSuffix: "progress",
    signals: "Signals",
    subProjects: "Sub-projects",
  },
  windowManager: {
    closeSettingsAria: "Close display settings",
    gapAria: "Window gap",
    gapLabel: "gap",
    heading: "DISPLAY",
    languageLegend: "language",
    languageOptions: {
      en: "English",
      ru: "Russian",
      zh: "Chinese",
    },
    openSettingsAria: "Open display settings",
    panelAria: "Workspace display settings",
    resetLayout: "[reset layout]",
    restartOnboarding: "[restart onboarding]",
    themeLegend: "theme",
    themeOptions: {
      dark: "dark",
      light: "light",
    },
  },
} as const satisfies SiteUiCopy;

const siteCopies = {
  en: {
    campaign: baseCampaign,
    coreStats: baseCoreStats,
    eraCards: baseEraCards,
    locale: "en-US",
    loreEntries: baseLoreEntries,
    navLabels: baseNavItems.map((item) => item.label),
    profile: {
      className: baseProfile.className,
      name: baseProfile.name,
      role: baseProfile.role,
      status: baseProfile.status,
    },
    profileLineLabels: {
      className: baseProfileLines[1].label,
      name: baseProfileLines[0].label,
      rank: baseProfileLines[3].label,
      role: baseProfileLines[2].label,
      status: baseProfileLines[4].label,
    },
    questCopies: {},
    socialLabels: {},
    stats: baseStats,
    subscribeSubject: "Subscribe",
    ui: englishUi,
  },
  ru: {
    campaign: {
      headline: "Строю первую межгалактическую компанию",
      description:
        "Исследую границу AI-агентов, информационной архитектуры и децентрализованной координации, чтобы собирать странные, полезные продукты с накопительным эффектом.",
      focus: "Фокус: долгоживущие системы, реальные пользователи, прочный эффект",
      quoteLines: [
        '"Вселенная - это изменение.',
        'Наша жизнь - то, чем делают ее наши мысли. - Марк Аврелий"',
      ],
    },
    coreStats: [
      { label: "Клинок кода", value: "8 лет Python/C++" },
      { label: "Предприниматель", value: "2017+ CEO / co-founder" },
      { label: "Облачная крепость", value: "5 bare-metal k8s-кластеров" },
      { label: "Кузнец TON-рун", value: "$30m через смарт-контракты" },
      { label: "Печать Data Kaiju", value: "13 TB реплицированная БД / 1k RPS" },
      { label: "Нейроискра", value: "свои ML-модели" },
      { label: "Ремесленные руки", value: "3D / PCB / дерево / стекло" },
    ],
    eraCards: [
      {
        label: "До эры агентов",
        title: "Старый стек становится базой",
        detail: "Страшно: AI ускоряет код, k8s, TON и работу с данными.",
      },
      {
        label: "В эру агентов",
        title: "Межгалактический режим",
        detail: "Агенты множат проекты, гильдию и лор.",
      },
    ],
    locale: "ru-RU",
    loreEntries: [
      {
        date: "2025-05-19 22:17",
        text: "Выпустил дорожную карту Xenage v0.4. Ясность > шум.",
      },
      {
        date: "2025-05-18 09:43",
        text: "Сессия глубокой работы. Системное мышление побеждает.",
      },
      {
        date: "2025-05-16 17:05",
        text: "Написал про гильдии. Задело нерв у создателей.",
      },
      {
        date: "2025-05-14 11:32",
        text: "Доточил интерфейс квестов публичного создателя.",
      },
      {
        date: "2025-05-12 08:51",
        text: "Убрал небольшое отвлечение. Фокус вернулся к главному квесту.",
      },
    ],
    navLabels: [
      "Панель (домой)",
      "Квесты",
      "Статьи",
      "lore log",
      "Дерево навыков",
      "Настройки",
    ],
    profile: {
      className: "Системный артефактор",
      name: "Андрей Творожков",
      role: "Архитектор агентных систем",
      status: "Строю в эпоху AI-агентов",
    },
    profileLineLabels: {
      className: "Класс",
      name: "Имя",
      rank: "Ранг",
      role: "Роль",
      status: "Статус",
    },
    questCopies: {
      disintar: {
        description:
          "Первый NFT-маркетплейс на TON, построенный до зрелого NFT-рынка в экосистеме и подтвержденный реальным оборотом.",
        detail: "$5m оборота и $500k+ выручки за полгода.",
        displayStatus: "Пауза",
        goal: "Создать первую серьезную площадку NFT-торговли для экосистемы TON.",
        outcome:
          "$5m оборота и $500k+ выручки за полгода как первый NFT-маркетплейс на TON.",
        pausedReason:
          "Изначальная ставка была на NFT-сообщества, а поздний спрос ушел в Telegram-нативные активы вроде подарков и анонимных номеров.",
        readMore:
          "Disintar доказал ранний спрос на TON NFT и запустился до того, как категория стала очевидной. Изначальная гипотеза NFT-сообществ выдохлась, но проект оставил реальный след в экосистеме.",
        role: "CEO, co-founder",
        summary: "Первый NFT-маркетплейс на TON",
        tagline: "Арка первого TON NFT-маркетплейса",
        topThings: [
          "Первый NFT-маркетплейс на TON",
          "$5m оборота маркетплейса",
          "$500k+ выручки за полгода",
        ],
        whyStarted:
          "TON NFT нужен был нативный маркетплейс, а коллекции сообществ стали первой видимой волной спроса.",
      },
      dton: {
        description:
          "Серьезная инфраструктурная компания для TON: индексатор, аналитика, GraphQL API, лайтсерверы, DeFi API и инструменты портфеля с уникальным расчетом PnL.",
        detail:
          "Привлечено $500k, подписан контракт с ведущим кошельком, занята позиция ведущего провайдера лайтсерверов.",
        displayStatus: "Пауза",
        goal: "Сделать TON-данные надежными для кошельков, DeFi-продуктов и создателей.",
        outcome:
          "Привлечено $500k, подписан контракт с ведущим кошельком в Telegram, занята позиция ведущего провайдера лайтсерверов и создан уникальный TON DeFi API.",
        pausedReason:
          "TON-рынок изменился, и ежедневный рост пользователей перестал выглядеть достаточно сильным для ставки на компанию масштаба единорога.",
        readMore:
          "dTON не был игрушечным проектом: там были реальная инфраструктура, реальные клиенты и сложные задачи в продакшене. Арка встала на паузу, когда направление TON-рынка перестало совпадать с масштабом исходной ставки.",
        role: "CEO, co-founder",
        subprojects: [
          "GraphQL API",
          "Провайдер лайтсерверов",
          "DeFi API",
          "Приложение для портфеля",
        ],
        summary:
          "Индексатор, аналитика, API, лайтсерверы и DeFi-стек для TON",
        tagline: "Арка инфраструктуры данных TON",
        topThings: [
          "Привлечено $500k на инфраструктуру данных TON",
          "Контракт с ведущим кошельком в Telegram",
          "Ведущий провайдер лайтсерверов и уникальный DeFi API",
        ],
        whyStarted:
          "TON нуждался в лучшей инфраструктуре данных, стабильном API-доступе, аналитике и надежной доступности лайтсерверов в продакшене.",
      },
      "education-game": {
        description:
          "Провокационный MVP игры, где дети учат математику в формате, который ощущается живее классических обучающих приложений.",
        detail: "Провокационный концепт образовательной игры.",
        displayStatus: "Запланировано",
        goal: "MVP для обучения математике с энергией дерзкой мульт-игры.",
        readMore:
          "Гипотеза: дети учатся лучше, когда образовательный цикл берет энергию у игр, в которые им правда хочется играть.",
        summary: "Провокационный концепт образовательной игры",
        tagline: "Провокационная игра для изучения математики",
        topThings: [
          "Визуальное направление в духе Happy Tree Friends",
          "MVP для изучения математики",
          "Планируется название и игровой цикл",
        ],
        whyStarted:
          "Дети часто глубже вовлекаются, когда обучение ощущается как игра, в которую хочется играть.",
      },
      maxagents: {
        description:
          "Простой доступ к AI-агентам в Telegram и MAX с полноценным рабочим пространством: браузер, файловая система и практичные инструменты.",
        detail: "Агенты в мессенджерах по одной кнопке.",
        displayStatus: "Новорожденный",
        goal: "AI-агенты по одной кнопке для пользователей Telegram и MAX.",
        readMore:
          "Агенты вроде OpenClaw мощные, но сложные в настройке. MaxAgents сводит эту сложность к простому входу через мессенджер.",
        summary: "AI-агенты для пользователей Telegram и MAX",
        tagline: "AI-агенты для нетехнических пользователей",
        topThings: [
          "Доступ из мессенджера по одной кнопке",
          "Полная рабочая среда агента за чатом",
          "Спроектировано для нетехнических пользователей",
        ],
        whyStarted:
          "Мощные агентские инструменты слишком сложно настраивать нетехническим пользователям; мессенджеры могут спрятать сложность.",
      },
      "multiplayer-game": {
        description:
          "Запланированная идея многопользовательской игры, где цель пока намеренно свободная: сделать что-то достаточно веселое, чтобы оно существовало ради себя.",
        detail: "Для души. Пока формируется.",
        displayStatus: "Запланировано",
        goal: "Многопользовательский эксперимент ради чистого удовольствия.",
        summary: "Раннее направление игры",
        tagline: "Раннее направление многопользовательской игры",
        topThings: [
          "Запланированный многопользовательский эксперимент",
          "Смысл: удовольствие / для души",
          "Объем еще формируется",
        ],
        whyStarted:
          "Намеренно свободное игровое направление: что-то для души.",
      },
      mxfd: {
        description:
          "Личный финансовый штаб из AI-агентов, которые обучают, анализируют отчеты и помогают пользователям осознаннее действовать на фондовом рынке.",
        detail: "Финансовый штаб из AI-агентов.",
        displayStatus: "Новорожденный",
        goal: "Персональный финансовый штаб из AI-агентов.",
        readMore:
          "Ставка: заменить банковских аналитиков и брокерских менеджеров небольшой командой агентов, которая помогает понимать стратегию и целиться выше пассивной депозитной доходности.",
        summary: "Финансовый штаб из AI-агентов",
        tagline: "AI-агенты для личных финансов",
        topThings: [
          "Агенты действуют на стороне пользователя",
          "Обучение + отчеты + анализ стратегии",
          "Для рынков, где опыт инвестирования отстает",
        ],
        whyStarted:
          "Рынки со слабым опытом инвестирования выиграют от агентов, которые учат, разбирают отчеты и критикуют стратегию.",
      },
      sanges: {
        description:
          "Постоянная и безопасная Linux-среда для запуска кода пользовательских агентов в Xenage, Mxfd и MaxAgents.",
        displayStatus: "Полусобран",
        goal: "Быстрые, безопасные изолированные пространства, где агенты запускают код и Linux-команды.",
        readMore:
          "Проектам, которые выпускают агентов к пользователям, нужна настоящая безопасная рабочая среда: браузер, файловая система, Linux-команды и границы, достаточно крепкие для произвольного кода.",
        subprojects: [
          "Запуск Linux-команд",
          "Постоянное рабочее пространство",
          "Слой безопасности для произвольных команд",
        ],
        summary: "Быстрые, безопасные изолированные среды для запуска агентского кода.",
        tagline: "Безопасные песочницы для агентов",
        topThings: [
          "Быстрая изолированная среда для кода агентов",
          "Постоянная пользовательская среда",
          "Слой безопасности для произвольных команд",
        ],
        whyStarted:
          "Пользовательским агентам нужны постоянные рабочие среды с браузером, файлами, shell-доступом и крепкими границами.",
      },
      tvorogme: {
        description:
          "Персональная операционная система, где проекты становятся квестами, статьи - свитками, а Codex-сессии - записями LoreLog.",
        displayStatus: "Новорожденный",
        goal: "Сделать tvorog.me живым слоем приключенческой гильдии для эпохи AI-агентов.",
        readMore:
          "Это домашняя база: сайт превращает реальные Codex-промпты, затронутые файлы, строки кода, статьи и проектные арки в читаемый интерфейс гильдии вместо плоского блога.",
        role: "Все в одном",
        summary: "Живой интерфейс гильдии для проектов, статей и Codex-лора.",
        tagline: "Персональный сайт и зал гильдии для Codex",
        topThings: [
          "Живое сопоставление Codex-сессий с проектами",
          "LoreLog как публичная хроника создателя",
          "Статьи, квесты и метрики в одном зале гильдии",
        ],
        whyStarted:
          "Статичное портфолио не показывает реальный ритм работы над проектами; Codex-работа, статьи и движение проектов должны читаться как единая живая лента.",
      },
      xenage: {
        description:
          "Надежная инфраструктура для создания и проверки стартапов AI-агентами вместо очередной оболочки персонального ассистента.",
        displayStatus: "Новорожденный",
        goal: "Командный центр для AI-агентов в стиле Kubernetes + Lens.",
        readMore:
          "Запущен потому, что нынешние оркестраторы оптимизированы под персональную помощь. Xenage целится в надежную инфраструктуру для агентов, которые строят, тестируют и запускают проекты.",
        role: "Все в одном",
        summary: "Оркестратор агентов для стартапов: Kubernetes плюс Lens для AI-агентов.",
        tagline: "Оркестратор стартап-агентов",
        topThings: [
          "Оркестратор агентов: k8s + Lens для агентов",
          "Собран вокруг создания и тестирования стартапов",
          "Текущий главный квест в одном месте",
        ],
        whyStarted:
          "Текущие оркестраторы тяготеют к персональным ассистентам; этот проект - инфраструктура для создания стартапов.",
      },
    },
    socialLabels: {
      Email: "Почта",
    },
    stats: [
      {
        label: "Предпринимательство / fundraising",
        value: 93,
        level: 93,
        icon: "entrepreneurship",
      },
      {
        label: "Product vision / направление команды",
        value: 91,
        level: 91,
        icon: "product",
      },
      { label: "Python / C++ в проде", value: 92, level: 92, icon: "code" },
      { label: "AI agents / automation", value: 91, level: 91, icon: "agents" },
      {
        label: "Kubernetes / HA / DevOps",
        value: 90,
        level: 90,
        icon: "devops",
      },
      {
        label: "Data engineering / BigData",
        value: 90,
        level: 90,
        icon: "data",
      },
      { label: "Math / ML / neural nets", value: 84, level: 84, icon: "ml" },
      {
        label: "Web3 / TON infrastructure",
        value: 88,
        level: 88,
        icon: "web3",
      },
      { label: "PCB design / пайка", value: 46, level: 46, icon: "pcb" },
      {
        label: "3D modeling / prototyping",
        value: 44,
        level: 44,
        icon: "modeling",
      },
      { label: "Дерево / стекло / ручная работа", value: 36, level: 36, icon: "craft" },
    ],
    subscribeSubject: "Подписка",
    ui: {
      ...englishUi,
      articlesPanel: {
        articleTitles: {
          "dton-kubernetes-high-availability-transition-part-1":
            "Переход dTON Kubernetes в режим высокой доступности, часть 1",
          "dton-liteservers-high-availability-transition-part-2":
            "Переход dTON LiteServers в режим высокой доступности, часть 2",
        },
        listAria: "Статьи",
        noArticles: "Статей пока нет.",
        searchAria: "Поиск статей",
        searchPlaceholder: "Поиск",
      },
      codex: {
        countersTitle:
          "Codex-промпты / затронутые файлы / учтенные строки патча",
        files: "файлов",
        graph: {
          all: "Все",
          aria: "Графики ресурсов Codex",
          bar: "Столбцы",
          line: "Линия",
          noData: "Сигнала для графика пока нет",
          peak: "Пик",
          title: "Графики ресурсов",
          total: "Всего",
        },
        guildTraceTitle: "След Codex-гильдии",
        live: "онлайн",
        lines: "Строки",
        loreTabs: {
          graph: "Графики",
          log: "Лог",
        },
        promptRunesAria: "Публичные фрагменты промптов",
        prompts: "Промпты",
        rank: "Ранг",
        sessions: "Сессии",
        sourceLinesObserved: "строк кода учтено",
        spellcode: "Spellcode",
        status: {
          error: "ошибка",
          loading: "загрузка",
          ready: "актуально",
          stale: "устарело",
        },
        syncPending: "ждем синхронизацию",
        touched: "Затронуто",
        workspaceAnd: "и",
        workspaceHas: "В рабочем пространстве",
      },
      home: {
        footerCenter: "© Андрей Творожков | tvorog.me",
        footerLeft: "Строй публично. Выпускай малое. Наращивай эффект.",
        footerRight: "> Продолжай строить.",
        profileHandle: "ПРОФИЛЬ",
        skipLink: "К кампании",
        statusPrefix: "> статус:",
        windows: {
          articles: "СТАТЬИ",
          campaign: "ТЕКУЩАЯ КАМПАНИЯ",
          incubating: "АРКИ КВЕСТОВ",
          lore: "LORE LOG",
          profile: "ПРОФИЛЬ",
          questlines: "АКТИВНЫЕ КВЕСТЫ",
          skills: "ДЕРЕВО НАВЫКОВ",
        },
      },
      onboarding: {
        close: "Закрыть онбординг",
        counterLabel: "Шаг",
        decline: "Не сейчас",
        finish: "Готово",
        next: "Дальше",
        previous: "Назад",
        promptBody:
          "Двухминутная карта: дерево навыков, кто я, статьи, живые проекты, паузы и агентные метрики.",
        promptTitle: "Пройти быстрый онбординг?",
        start: "Пройти",
        title: "Онбординг сайта",
        steps: [
          {
            body: "Skill Tree - первая карта сайта: текущие навыки, технический стек, реликвии и то, как прокачивается стиль сборки.",
            href: "#skilltree",
            title: "Skill Tree",
          },
          {
            body: "Раздел обо мне - это короткий лист персонажа: кто я, что строю сейчас, статус, XP и ссылки для связи.",
            href: "#profile",
            title: "Обо мне",
          },
          {
            body: "Активные проекты - это квесты, которые двигаются прямо сейчас. В строках видны прогресс, статус и живые счетчики агентной работы.",
            href: "#questlines",
            title: "Активные проекты",
          },
          {
            body: "Арки квестов собирают будущие идеи, проекты на паузе и завершенные истории. Пауза значит, что изменился контекст; завершенная арка уже оставила результат.",
            href: "#chronicles",
            title: "На паузе и завершенные",
          },
          {
            body: "Articles - это длинные заметки и полевые отчеты: идеи, сборки и агентные эксперименты, которые не теряются в истории чатов.",
            href: "#articles",
            title: "Articles",
          },
          {
            body: "Промпты, файлы и строки кода - это сигналы работы агентов: Codex, Claude, OpenClaw-подобных инструментов и других помощников, которые трогали рабочее пространство.",
            href: "#lorelog",
            title: "Промпты, файлы, строки",
          },
        ],
      },
      panels: {
        activeQuestlinesAria: "Активные квесты",
        activeQuestlinesTitle: "АКТИВНЫЕ КВЕСТЫ",
        articlesTitle: "СТАТЬИ",
        campaignTitle: "ТЕКУЩАЯ КАМПАНИЯ",
        eraAria: "Эра AI-агентов до и после",
        incubatingStackLabel: "Созревающие квесты",
        incubatingTitle: "АРКИ КВЕСТОВ",
        levelLabel: "Уровень",
        levelAbbreviation: "Ур.",
        loreLogTitle: "lore log",
        nextRankLabel: "Следующий ранг",
        profileAria: "Профиль",
        profileStackLabel: "Профиль",
        questArcsAria: "Арки квестов",
        questFutureTab: "Будущие арки",
        questHeaders: {
          progress: "ПРОГРЕСС",
          questline: "КВЕСТ",
          status: "СТАТУС",
        },
        questPausedTab: "Пауза",
        relicLoadoutLabel: "Набор реликвий",
        relicLoadoutTitle: "Набор реликвий",
        skillTabs: {
          era: "Эра",
          relics: "Реликвии",
          tech: "Тех",
        },
        skillTreeTitle: "ДЕРЕВО НАВЫКОВ",
        socialLinksAria: "Социальные ссылки",
        socials: "Соцсети",
        xpNeeded: "XP нужно",
        xpProgress: "XP-прогресс",
      },
      project: {
        closeWindow: "Закрыть окно проекта",
    contextSummary: "дополнительный контекст",
        details: {
          goal: "Цель",
          outcome: "Итог",
          paused: "Пауза",
          role: "Роль",
          why: "Почему",
        },
        hoverHint: "Нажмите, чтобы открыть досье",
        liveDossier: "живое досье",
        openWindow: "Открыть окно проекта",
        progress: "Прогресс",
        progressAriaSuffix: "прогресс",
        signals: "Сигналы",
        subProjects: "Подпроекты",
      },
      windowManager: {
        closeSettingsAria: "Закрыть настройки вида",
        gapAria: "Интервал между окнами",
        gapLabel: "интервал",
        heading: "ВИД",
        languageLegend: "язык",
        languageOptions: {
          en: "English",
          ru: "Русский",
          zh: "中文",
        },
        openSettingsAria: "Открыть настройки вида",
        panelAria: "Настройки рабочей области",
        resetLayout: "[сброс раскладки]",
        restartOnboarding: "[перезапустить онбординг]",
        themeLegend: "тема",
        themeOptions: {
          dark: "темная",
          light: "светлая",
        },
      },
    },
  },
  zh: {
    campaign: {
      headline: "构建第一家星际公司",
      description:
        "探索 AI 智能体、信息架构和去中心化协作的边界，构建奇特、有用、会随时间复利的产品。",
      focus: "焦点：长期系统、真实用户、持久影响",
      quoteLines: [
        '"宇宙即变化。',
        '我们的生活由思想塑成。- 马可·奥勒留"',
      ],
    },
    coreStats: [
      { label: "代码之刃", value: "8 年 Python/C++" },
      { label: "创业者", value: "2017+ CEO / co-founder" },
      { label: "云端堡垒", value: "5 台 bare-metal k8s" },
      { label: "TON 符文锻造者", value: "$30m 智能合约流" },
      { label: "数据巨兽封印", value: "13TB replicated db / 1k RPS" },
      { label: "神经火花", value: "自有 ML 模型" },
      { label: "工匠之手", value: "3D / PCB / 木 / 玻璃" },
    ],
    eraCards: [
      {
        label: "智能体时代之前",
        title: "旧技术栈成为基线",
        detail: "可怕：AI 加速代码/k8s/TON/data。",
      },
      {
        label: "智能体时代之中",
        title: "星际模式",
        detail: "智能体放大项目、公会与故事线。",
      },
    ],
    locale: "zh-CN",
    loreEntries: [
      {
        date: "2025-05-19 22:17",
        text: "发布 Xenage roadmap v0.4。清晰度 > 热度。",
      },
      {
        date: "2025-05-18 09:43",
        text: "深度工作会话。系统思维获胜。",
      },
      {
        date: "2025-05-16 17:05",
        text: "写了关于公会的文章。引起 builder 共鸣。",
      },
      {
        date: "2025-05-14 11:32",
        text: "打磨 public-builder 任务界面。",
      },
      {
        date: "2025-05-12 08:51",
        text: "砍掉一个小干扰。焦点回到主线任务。",
      },
    ],
    navLabels: ["仪表盘（首页）", "任务线", "文章", "lore log", "技能树", "设置"],
    profile: {
      className: "系统造物师",
      name: "Andrey Tvorozhkov",
      role: "智能体系统架构师",
      status: "在 AI 智能体时代打磨中",
    },
    profileLineLabels: {
      className: "职业",
      name: "姓名",
      rank: "等级",
      role: "角色",
      status: "状态",
    },
    questCopies: {
      disintar: {
        description:
          "TON 上第一个 NFT marketplace，在生态拥有成熟 NFT 市场之前构建，并通过真实交易量证明。",
        detail: "半年内 $5m turnover 和 $500k+ revenue。",
        displayStatus: "暂停",
        goal: "为 TON 生态创建第一个严肃的 NFT 交易场所。",
        outcome:
          "作为 TON 上第一个 NFT marketplace，半年内实现 $5m turnover 和 $500k+ revenue。",
        pausedReason:
          "最初赌的是 community NFTs，而后来的需求转向 Telegram-native assets，比如 gifts 和 anonymous numbers。",
        readMore:
          "Disintar 证明了早期 TON NFT 需求，并在品类变得明显之前就已发布。最初的 community-NFT thesis 退潮了，但项目在生态中留下了真实痕迹。",
        role: "CEO, co-founder",
        summary: "TON 上第一个 NFT marketplace",
        tagline: "第一个 TON NFT marketplace 弧线",
        topThings: [
          "TON 上第一个 NFT marketplace",
          "$5m marketplace turnover",
          "半年内 $500k+ revenue",
        ],
        whyStarted:
          "TON NFTs 需要原生 marketplace，而 community collections 是第一波可见需求。",
      },
      dton: {
        description:
          "一家严肃的 TON 基础设施公司：indexer、analytics、GraphQL API、liteservers、DeFi API，以及带独特 PnL 计算的 portfolio tooling。",
        detail:
          "融资 $500k，拿下顶级 wallet 合约，成为顶级 liteserver provider。",
        displayStatus: "暂停",
        goal: "让 TON 数据对 wallets、DeFi 产品和 builders 可靠可用。",
        outcome:
          "融资 $500k，与 Telegram 中的顶级 wallet 签约，成为顶级 liteserver provider，并拥有独特 TON DeFi API。",
        pausedReason:
          "TON 市场发生变化，每日用户增长不再足以支撑 unicorn-scale company bet。",
        readMore:
          "dTON 不是玩具项目：它承载真实基础设施、真实客户和困难的生产问题。当 TON 市场方向不再匹配最初公司的规模押注时，这条弧线暂停了。",
        role: "CEO, co-founder",
        subprojects: ["GraphQL API", "Liteserver provider", "DeFi API", "Portfolio app"],
        summary: "TON index、analytics、API、liteservers 和 DeFi data stack",
        tagline: "TON data infrastructure 弧线",
        topThings: [
          "为 TON data infrastructure 融资 $500k",
          "与 Telegram 中的顶级 wallet 签约",
          "顶级 liteserver provider 与独特 DeFi API",
        ],
        whyStarted:
          "TON 需要更好的 data infrastructure、稳定 API 访问、analytics 和 production-grade liteserver 可用性。",
      },
      "education-game": {
        description:
          "一个带有挑衅感的游戏 MVP，让孩子以比传统教育软件更兴奋的形式学习数学。",
        detail: "带有挑衅感的教育游戏概念。",
        displayStatus: "计划中",
        goal: "带有大胆卡通游戏能量的数学学习 MVP。",
        readMore:
          "假设是：当教育循环借用孩子真正想玩的游戏能量时，孩子会学得更好。",
        summary: "带有挑衅感的教育游戏概念",
        tagline: "大胆的数学学习游戏",
        topThings: [
          "Happy Tree Friends 风格方向",
          "数学学习 MVP",
          "计划中的命名与循环",
        ],
        whyStarted:
          "当教育循环感觉像他们真正想玩的游戏时，孩子通常会更深入地投入。",
      },
      maxagents: {
        description:
          "在 Telegram 和 MAX 中简单访问 AI 智能体，背后带有完整工作空间：浏览器、文件系统和实用工具。",
        detail: "消息应用里一键使用智能体。",
        displayStatus: "新生",
        goal: "为 Telegram 和 MAX 用户提供一键 AI 智能体。",
        readMore:
          "OpenClaw 风格的智能体很强，但设置困难。MaxAgents 把复杂性压缩成一个简单的消息入口。",
        summary: "面向 Telegram 和 MAX 用户的 AI 智能体",
        tagline: "面向非技术用户的 AI 智能体",
        topThings: [
          "消息入口一键访问",
          "聊天背后的完整智能体工作区",
          "为非技术用户设计",
        ],
        whyStarted:
          "强大的智能体工具对非技术用户太难设置；消息应用可以隐藏这种复杂性。",
      },
      "multiplayer-game": {
        description:
          "一个计划中的多人游戏想法，目标仍然刻意保持松动：做出足够有趣、值得为自身存在的东西。",
        detail: "为了灵魂。仍在成形。",
        displayStatus: "计划中",
        goal: "纯粹为了乐趣的多人实验。",
        summary: "早期游戏方向",
        tagline: "早期多人游戏方向",
        topThings: ["计划中的多人实验", "目的：乐趣 / 为了灵魂", "范围仍在成形"],
        whyStarted: "一个刻意松动的游戏方向：为灵魂而做的东西。",
      },
      mxfd: {
        description:
          "一个由 AI 智能体组成的个人财务办公室，负责教学、分析报告，并帮助用户在股市中更有意识地行动。",
        detail: "AI 智能体的财务 home-office。",
        displayStatus: "新生",
        goal: "个人财务 AI 智能体 home-office。",
        readMore:
          "赌注是：用一小队智能体替代银行分析师和券商经理，帮助用户理解策略，并瞄准高于被动存款收益的目标。",
        summary: "AI 智能体的财务 home-office",
        tagline: "个人财务 AI 智能体",
        topThings: [
          "智能体站在用户一边",
          "教育 + 报告 + 策略分析",
          "为投资 UX 落后的市场而建",
        ],
        whyStarted:
          "投资 UX 较弱的市场，可以从会教学、分析报告并 critique 策略的智能体中受益。",
      },
      sanges: {
        description:
          "为 Xenage、Mxfd 和 MaxAgents 中面向用户的智能体提供持久、安全的 Linux/代码执行空间。",
        displayStatus: "半完成",
        goal: "快速、安全的隔离空间，让智能体运行代码和 Linux 命令。",
        readMore:
          "把智能体暴露给用户的项目需要真实、安全的工作区：浏览器、文件系统、Linux 命令，以及足以承载任意代码的强边界。",
        subprojects: ["Linux command runner", "持久工作区", "任意命令的安全层"],
        summary: "让智能体运行代码的快速、安全隔离空间。",
        tagline: "安全的智能体沙盒",
        topThings: [
          "用于智能体代码的快速隔离空间",
          "持久用户环境",
          "任意命令的安全层",
        ],
        whyStarted:
          "面向用户的智能体需要带浏览器、文件、shell 访问和强边界的持久工作区。",
      },
      tvorogme: {
        description:
          "一个个人操作系统：项目成为任务，文章成为卷轴，Codex 会话成为 LoreLog 条目。",
        displayStatus: "新生",
        goal: "让 tvorog.me 成为 AI 智能体时代的实时冒险公会层。",
        readMore:
          "这是主基地：网站把真实的 Codex prompt、触达文件、源码行、文章和项目弧线，转化成可读的公会界面，而不是扁平博客。",
        role: "全能一体",
        summary: "用于项目、文章和 Codex lore 的实时公会界面。",
        tagline: "个人网站与 Codex 公会大厅",
        topThings: [
          "实时 Codex 到项目匹配",
          "LoreLog 作为公开 builder 编年史",
          "文章、任务和指标在一个公会大厅中",
        ],
        whyStarted:
          "静态作品集无法展示真实的 builder loop；Codex 工作、文章和项目动量应该作为一条活的时间线被阅读。",
      },
      xenage: {
        description:
          "可靠的基础设施，用 AI 智能体创建和测试创业项目，而不是再做一个个人助手外壳。",
        displayStatus: "新生",
        goal: "面向 AI 智能体的 Kubernetes + Lens 风格指挥中心。",
        readMore:
          "启动原因是当前编排器更偏个人助手。Xenage 瞄准的是让智能体构建、测试和运营项目的可靠基础设施。",
        role: "全能一体",
        summary: "创业智能体编排器：面向 AI 智能体的 Kubernetes + Lens。",
        tagline: "创业智能体编排器",
        topThings: [
          "智能体编排器：面向智能体的 k8s + Lens",
          "围绕创业项目创建和测试而建",
          "当前主线全能任务",
        ],
        whyStarted:
          "当前编排器倾向于个人助手；这个项目是创业构建基础设施。",
      },
    },
    socialLabels: {
      Email: "邮箱",
    },
    stats: [
      { label: "创业 / 融资", value: 93, level: 93, icon: "entrepreneurship" },
      { label: "产品愿景 / 团队方向", value: 91, level: 91, icon: "product" },
      { label: "Python / C++ 生产", value: 92, level: 92, icon: "code" },
      { label: "AI 智能体 / 自动化", value: 91, level: 91, icon: "agents" },
      {
        label: "Kubernetes / HA / DevOps",
        value: 90,
        level: 90,
        icon: "devops",
      },
      {
        label: "Data engineering / BigData",
        value: 90,
        level: 90,
        icon: "data",
      },
      { label: "数学 / ML / 神经网络", value: 84, level: 84, icon: "ml" },
      { label: "Web3 / TON 基础设施", value: 88, level: 88, icon: "web3" },
      { label: "PCB 设计 / 焊接", value: 46, level: 46, icon: "pcb" },
      { label: "3D 建模 / 原型", value: 44, level: 44, icon: "modeling" },
      { label: "木 / 玻璃 / 手工", value: 36, level: 36, icon: "craft" },
    ],
    subscribeSubject: "订阅",
    ui: {
      ...englishUi,
      articlesPanel: {
        articleTitles: {
          "dton-kubernetes-high-availability-transition-part-1":
            "dTON Kubernetes 高可用迁移，第 1 部分",
          "dton-liteservers-high-availability-transition-part-2":
            "dTON LiteServers 高可用迁移，第 2 部分",
        },
        listAria: "文章",
        noArticles: "还没有文章。",
        searchAria: "搜索文章",
        searchPlaceholder: "搜索",
      },
      codex: {
        countersTitle: "Codex prompts / 触达文件 / 已观察补丁行",
        files: "个文件",
        graph: {
          all: "全部",
          aria: "Codex 资源图表",
          bar: "条形",
          line: "折线",
          noData: "暂无图表信号",
          peak: "峰值",
          title: "资源图表",
          total: "总计",
        },
        guildTraceTitle: "Codex 公会痕迹",
        live: "live",
        lines: "行数",
        loreTabs: {
          graph: "图表",
          log: "日志",
        },
        promptRunesAria: "公开 prompt 符文",
        prompts: "Prompts",
        rank: "等级",
        sessions: "Sessions",
        sourceLinesObserved: "行源码已观察",
        spellcode: "Spellcode",
        status: {
          error: "错误",
          loading: "加载中",
          ready: "live",
          stale: "过期",
        },
        syncPending: "等待同步",
        touched: "触达",
        workspaceAnd: "和",
        workspaceHas: "工作区已观察到",
      },
      home: {
        footerCenter: "© Andrey Tvorozhkov | tvorog.me",
        footerLeft: "公开构建。小步发布。持续复利。",
        footerRight: "> 继续打磨。",
        profileHandle: "PROFILE",
        skipLink: "跳到当前战役",
        statusPrefix: "> 状态:",
        windows: {
          articles: "文章",
          campaign: "当前战役",
          incubating: "任务弧线",
          lore: "LORE LOG",
          profile: "资料",
          questlines: "活跃任务线",
          skills: "技能树",
        },
      },
      onboarding: {
        close: "关闭引导",
        counterLabel: "步骤",
        decline: "稍后",
        finish: "完成",
        next: "下一步",
        previous: "返回",
        promptBody:
          "用两分钟看懂技能树、个人资料、文章、项目弧线和智能体工作指标。",
        promptTitle: "要快速浏览这个站点吗？",
        start: "开始",
        title: "站点引导",
        steps: [
          {
            body: "Skill Tree 是第一张地图：当前能力、技术栈、遗物配置，以及构建风格如何升级。",
            href: "#skilltree",
            title: "Skill Tree",
          },
          {
            body: "个人资料窗口是简短角色卡：我是谁、正在构建什么、状态、XP 和联系方式。",
            href: "#profile",
            title: "关于我",
          },
          {
            body: "活跃项目是正在推进的任务线。每一行都有进度、状态和实时智能体计数。",
            href: "#questlines",
            title: "活跃项目",
          },
          {
            body: "任务弧线汇集未来想法、暂停项目和已完成故事。暂停表示上下文变化；完成表示已经留下结果。",
            href: "#chronicles",
            title: "暂停与完成",
          },
          {
            body: "Articles 是更长的笔记和现场报告：想法、构建过程和智能体实验会被写下来，而不是消失在聊天记录里。",
            href: "#articles",
            title: "Articles",
          },
          {
            body: "Prompts、files 和 lines 是智能体会话的工作信号：Codex、Claude、OpenClaw 风格工具以及其他助手触碰过工作区。",
            href: "#lorelog",
            title: "智能体信号",
          },
        ],
      },
      panels: {
        activeQuestlinesAria: "活跃任务线",
        activeQuestlinesTitle: "活跃任务线",
        articlesTitle: "文章",
        campaignTitle: "当前战役",
        eraAria: "AI 智能体时代前后",
        incubatingStackLabel: "孵化任务",
        incubatingTitle: "任务弧线",
        levelLabel: "等级",
        levelAbbreviation: "Lv.",
        loreLogTitle: "lore log",
        nextRankLabel: "下一等级",
        profileAria: "资料",
        profileStackLabel: "资料",
        questArcsAria: "任务弧线",
        questFutureTab: "未来弧线",
        questHeaders: {
          progress: "进度",
          questline: "任务线",
          status: "状态",
        },
        questPausedTab: "暂停",
        relicLoadoutLabel: "遗物配置",
        relicLoadoutTitle: "遗物配置",
        skillTabs: {
          era: "时代",
          relics: "遗物",
          tech: "技术",
        },
        skillTreeTitle: "技能树",
        socialLinksAria: "社交链接",
        socials: "社交",
        xpNeeded: "XP",
        xpProgress: "XP 进度",
      },
      project: {
        closeWindow: "关闭项目窗口",
    contextSummary: "更多上下文",
        details: {
          goal: "目标",
          outcome: "结果",
          paused: "暂停",
          role: "角色",
          why: "原因",
        },
        hoverHint: "点击查看完整档案",
        liveDossier: "实时档案",
        openWindow: "打开项目窗口",
        progress: "进度",
        progressAriaSuffix: "进度",
        signals: "信号",
        subProjects: "子项目",
      },
      windowManager: {
        closeSettingsAria: "关闭显示设置",
        gapAria: "窗口间距",
        gapLabel: "间距",
        heading: "显示",
        languageLegend: "语言",
        languageOptions: {
          en: "English",
          ru: "俄语",
          zh: "中文",
        },
        openSettingsAria: "打开显示设置",
        panelAria: "工作区显示设置",
        resetLayout: "[重置布局]",
        restartOnboarding: "[重新开始引导]",
        themeLegend: "主题",
        themeOptions: {
          dark: "暗色",
          light: "亮色",
        },
      },
    },
  },
} as const satisfies Record<SiteLanguage, SiteCopy>;

function localizeQuests(
  quests: readonly Quest[],
  questCopies: Record<string, QuestCopy>,
) {
  return quests.map((quest) => ({
    ...quest,
    ...questCopies[quest.id],
  }));
}

function getLocalizedProfile(copy: SiteCopy): ProfileContent {
  return {
    ...baseProfile,
    className: copy.profile.className,
    name: copy.profile.name,
    role: copy.profile.role,
    status: copy.profile.status,
  };
}

function getLocalizedProfileLines(profile: ProfileContent, copy: SiteCopy) {
  return [
    { label: copy.profileLineLabels.name, value: profile.name },
    { label: copy.profileLineLabels.className, value: profile.className },
    { label: copy.profileLineLabels.role, value: profile.role },
    { label: copy.profileLineLabels.rank, value: profile.rank },
    { label: copy.profileLineLabels.status, value: profile.status },
  ] as const satisfies readonly ProfileLine[];
}

function getLocalizedNavItems(copy: SiteCopy) {
  return baseNavItems.map((item, index) => ({
    ...item,
    label: copy.navLabels[index] ?? item.label,
  })) satisfies readonly NavItem[];
}

function getLocalizedSocialLinks(copy: SiteCopy, profile: ProfileContent) {
  return baseSocialLinks.map((item) => ({
    ...item,
    href:
      item.label === "Email"
        ? `mailto:${profile.contactEmail}?subject=${encodeURIComponent(
            copy.subscribeSubject,
          )}`
        : item.href,
    label: copy.socialLabels[item.label] ?? item.label,
  })) satisfies readonly SocialLink[];
}

export function getSiteContent(language: SiteLanguage): SiteContent {
  const copy = siteCopies[language];
  const profile = getLocalizedProfile(copy);

  return {
    activeQuests: localizeQuests(baseActiveQuests, copy.questCopies),
    campaign: copy.campaign,
    coreStats: copy.coreStats,
    eraCards: copy.eraCards,
    incubatingQuests: localizeQuests(baseIncubatingQuests, copy.questCopies),
    language,
    locale: copy.locale,
    loreEntries: copy.loreEntries,
    navItems: getLocalizedNavItems(copy),
    pausedQuests: localizeQuests(basePausedQuests, copy.questCopies),
    profile,
    profileLines: getLocalizedProfileLines(profile, copy),
    socialLinks: getLocalizedSocialLinks(copy, profile),
    stats: copy.stats,
    ui: copy.ui,
  };
}

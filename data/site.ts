export type ProjectStatus =
  | "NEWLY-BORN"
  | "SEMI-DONE"
  | "PLANNED"
  | "PAUSED"
  | "ARCHIVED";

export type NavItem = {
  readonly label: string;
  readonly href: string;
  readonly marker: ">" | "/";
};

export type ProfileLine = {
  readonly label: string;
  readonly value: string;
};

export type SocialLink = {
  readonly label: string;
  readonly href: string;
  readonly icon: string;
  readonly displayHref: string;
  readonly hideDisplayHref?: boolean;
};

export type Quest = {
  readonly id: string;
  readonly name: string;
  readonly status: ProjectStatus;
  readonly displayStatus?: string;
  readonly progress: number;
  readonly summary: string;
  readonly tagline?: string;
  readonly detail?: string;
  readonly description: string;
  readonly topThings: readonly string[];
  readonly goal?: string;
  readonly whyStarted?: string;
  readonly role?: string;
  readonly outcome?: string;
  readonly pausedReason?: string;
  readonly subprojects?: readonly string[];
  readonly readMore?: string;
};

export type Stat = {
  readonly label: string;
  readonly value: number;
  readonly level?: number;
  readonly icon: SkillIcon;
};

export type SkillIcon =
  | "agents"
  | "code"
  | "craft"
  | "data"
  | "devops"
  | "entrepreneurship"
  | "ml"
  | "modeling"
  | "pcb"
  | "product"
  | "web3";

export type EraCard = {
  readonly label: string;
  readonly title: string;
  readonly detail: string;
};

export type LoreEntry = {
  readonly date: string;
  readonly text: string;
};

export const profile = {
  brand: "tvorog.me",
  name: "Andrey Tvorozhkov",
  className: "System Artifacteer",
  role: "Agent Systems Alchemic",
  rank: "F",
  status: "Grinding in the AI Agents era",
  contactEmail: "tvorog@tvorog.me",
  xp: {
    current: 0,
    total: 500000,
    percent: 0,
    nextRank: "E",
    needed: 500000,
    level: "F",
  },
} as const;

export const navItems = [
  { label: "Dashboard (Home)", href: "#top", marker: ">" },
  { label: "Questlines", href: "#questlines", marker: ">" },
  { label: "Articles", href: "#articles", marker: ">" },
  { label: "lore log", href: "#lorelog", marker: ">" },
  { label: "Skill Tree", href: "#skilltree", marker: ">" },
  { label: "Settings", href: "#settings", marker: ">" },
] as const satisfies readonly NavItem[];

export const profileLines = [
  { label: "Name", value: profile.name },
  { label: "Class", value: profile.className },
  { label: "Role", value: profile.role },
  { label: "Rank", value: profile.rank },
  { label: "Status", value: profile.status },
] as const satisfies readonly ProfileLine[];

export const socialLinks = [
  {
    label: "X.com",
    href: "https://x.com/tvorogme",
    icon: "><",
    displayHref: "@tvorogme",
  },
  {
    label: "Telegram",
    href: "https://t.me/tvorogme_chan",
    icon: "/>",
    displayHref: "@tvorogme_chan",
  },
  {
    label: "Instagram",
    href: "https://instagram.com/tvorogme",
    icon: "[o]",
    displayHref: "@tvorogme",
  },
  {
    label: "GitHub",
    href: "https://github.com/tvorogme",
    icon: "{ }",
    displayHref: "@tvorogme",
  },
  {
    label: "RSS",
    href: "/rss.xml",
    icon: ")))",
    displayHref: "/rss.xml",
    hideDisplayHref: true,
  },
  {
    label: "Email",
    href: `mailto:${profile.contactEmail}?subject=Subscribe`,
    icon: "@>",
    displayHref: profile.contactEmail,
    hideDisplayHref: true,
  },
] as const satisfies readonly SocialLink[];

export const activeQuests = [
  {
    id: "xenage",
    name: "Xenage",
    status: "NEWLY-BORN",
    displayStatus: "Newly-born",
    progress: 78,
    tagline: "Startup agent orchestrator",
    summary:
      "Startup agent orchestrator: Kubernetes plus Lens for AI agents.",
    description:
      "Reliable infrastructure for creating and testing startups with AI agents instead of another personal-assistant shell.",
    goal: "Kubernetes + Lens-style command center for AI agents.",
    whyStarted:
      "Current orchestrators skew toward personal assistants; this one is startup-building infrastructure.",
    role: "All-in-one",
    topThings: [
      "Agent orchestrator: k8s + Lens for agents",
      "Built around startup creation and testing",
      "All-in-one current main quest",
    ],
    readMore:
      "Started because current orchestrators are optimized for personal assistance. Xenage aims at dependable infra for agents that build, test, and operate projects.",
  },
  {
    id: "sanges",
    name: "Sanges",
    status: "SEMI-DONE",
    displayStatus: "Semi-completed",
    progress: 64,
    tagline: "Secure agent sandboxes",
    summary: "Fast, secure isolated spaces for agents to run code.",
    description:
      "A persistent and safe Linux/code execution space for user-facing agents across Xenage, Mxfd, and MaxAgents.",
    goal: "Fast, secure isolated spaces for agents to run code and Linux commands.",
    whyStarted:
      "User-facing agents need persistent workspaces with browser, files, shell access, and strong boundaries.",
    subprojects: ["Linux command runner", "Persistent workspace", "Sandbox security"],
    topThings: [
      "Fast isolated space for agent code",
      "Persistent user environment",
      "Security layer for arbitrary commands",
    ],
    readMore:
      "Projects that expose agents to users need a real, safe workspace: browser, filesystem, Linux commands, and boundaries strong enough for arbitrary code.",
  },
  {
    id: "tvorogme",
    name: "tvorog.me",
    status: "NEWLY-BORN",
    displayStatus: "Newly-born",
    progress: 61,
    tagline: "Personal site and Codex guild hall",
    summary: "Live guild interface for projects, articles, and Codex lore.",
    description:
      "A personal operating system where projects become quests, articles become scrolls, and Codex sessions become LoreLog entries.",
    goal: "Make tvorog.me a live adventure-guild layer for the AI Agents era.",
    whyStarted:
      "A static portfolio cannot show the real builder loop; Codex work, articles, and project momentum should be readable as one living timeline.",
    role: "All-in-one",
    topThings: [
      "Live Codex-to-project matching",
      "LoreLog as public builder chronicle",
      "Articles, quests, and metrics in one guild hall",
    ],
    readMore:
      "This is the home base: the site turns real Codex prompts, touched files, source lines, articles, and project arcs into a readable guild interface instead of a flat blog.",
  },
] as const satisfies readonly Quest[];

export const incubatingQuests = [
  {
    id: "mxfd",
    name: "Mxfd",
    status: "NEWLY-BORN",
    displayStatus: "Newly-born",
    progress: 20,
    summary: "Financial home-office of AI agents",
    tagline: "AI Agents for personal finances",
    detail: "Financial home-office of AI agents.",
    description:
      "A home office of AI agents that teach, analyze reports, and help users act more consciously on the stock market.",
    goal: "Personal finance home-office of AI agents.",
    whyStarted:
      "Markets with weaker investing UX can benefit from agents that teach, analyze reports, and critique strategy.",
    topThings: [
      "Agents play on the user's side",
      "Education + reports + strategy analysis",
      "Built for markets where investing UX lags behind",
    ],
    readMore:
      "The bet: replace bank analysts and broker managers with a small agent team that helps users understand strategy and aim beyond passive deposit yield.",
  },
  {
    id: "maxagents",
    name: "MaxAgents",
    status: "NEWLY-BORN",
    displayStatus: "Newly-born",
    progress: 27,
    summary: "AI agents for users in Telegram and MAX",
    tagline: "AI Agents for non-technical users",
    detail: "One-button agents in messengers.",
    description:
      "Simple access to AI agents in Telegram and MAX with full working space: browser, filesystem, and practical tools.",
    goal: "One-button AI agents for Telegram and MAX users.",
    whyStarted:
      "Powerful agent tools are too hard to set up for non-technical users; messengers can hide the complexity.",
    topThings: [
      "One-button messenger access",
      "Full agent workspace behind the chat",
      "Designed for non-technical users",
    ],
    readMore:
      "OpenClaw-style agents are powerful but hard to set up. MaxAgents compresses that complexity into a simple messenger entrypoint.",
  },
  {
    id: "education-game",
    name: "Education Game (Naming TBD)",
    status: "PLANNED",
    displayStatus: "Planned",
    progress: 13,
    summary: "Provocative educational game concept",
    tagline: "Provocative math learning game",
    detail: "Provocative educational game concept.",
    description:
      "A provocative game MVP where children learn math through a format that feels more exciting than classic educational software.",
    goal: "Math-learning MVP with a provocative cartoon-game energy.",
    whyStarted:
      "Kids often engage more deeply when the educational loop feels like a game they actually want to play.",
    topThings: [
      "Happy Three Friends style direction",
      "Math-learning MVP",
      "Planned naming and loop",
    ],
    readMore:
      "The hypothesis is that kids learn better when the educational loop borrows energy from games they actually want to play.",
  },
  {
    id: "multiplayer-game",
    name: "Multiplayer Game (Naming TBD)",
    status: "PLANNED",
    displayStatus: "Planned",
    progress: 12,
    summary: "Early game direction",
    tagline: "Early multiplayer game direction",
    detail: "For the soul. Still forming.",
    description:
      "A planned multiplayer game idea with the goal still intentionally loose: make something fun enough to exist for its own sake.",
    goal: "Multiplayer experiment for pure fun.",
    whyStarted: "A deliberately loose game direction: something for the soul.",
    topThings: [
      "Planned multiplayer experiment",
      "Purpose: fun / for the soul",
      "Scope is still forming",
    ],
  },
] as const satisfies readonly Quest[];

export const pausedQuests = [
  {
    id: "dton",
    name: "dTON",
    status: "PAUSED",
    displayStatus: "Paused",
    progress: 100,
    summary: "TON index, analytics, API, liteservers, and DeFi data stack",
    tagline: "TON data infrastructure arc",
    detail: "$500k raised, top wallet contract, top liteserver provider.",
    description:
      "A serious TON infrastructure company: indexer, analytics, GraphQL API, liteservers, DeFi API, and portfolio tooling with unique PnL calculation.",
    goal: "Make TON data dependable for wallets, DeFi products, and builders.",
    whyStarted:
      "TON needed better data infrastructure, stable API access, analytics, and production-grade liteserver availability.",
    outcome:
      "$500k raised, contract with a top wallet in Telegram, top liteserver provider position, and a unique TON DeFi API.",
    pausedReason:
      "The TON market changed, and daily user growth no longer looked strong enough to support the unicorn-scale company bet.",
    role: "CEO, co-founder",
    subprojects: [
      "GraphQL API",
      "Liteserver provider",
      "DeFi API",
      "Portfolio app",
    ],
    topThings: [
      "$500k raised for TON data infrastructure",
      "Contract with a top wallet in Telegram",
      "Top liteserver provider and unique DeFi API",
    ],
    readMore:
      "dTON was not a toy project: it carried real infra, real customers, and hard production problems. The arc paused when the TON market direction stopped matching the scale of the original company bet.",
  },
  {
    id: "disintar",
    name: "Disintar",
    status: "PAUSED",
    displayStatus: "Paused",
    progress: 100,
    summary: "First NFT marketplace on TON",
    tagline: "First TON NFT marketplace arc",
    detail: "$5m turnover and $500k+ revenue in half a year.",
    description:
      "The first NFT marketplace on TON, built before the ecosystem had a mature NFT market and proven through real volume.",
    goal: "Create the first serious NFT trading venue for the TON ecosystem.",
    whyStarted:
      "TON NFTs needed a native marketplace, and community collections were the first visible wave of demand.",
    outcome:
      "$5m turnover and $500k+ revenue in half a year as the first NFT marketplace on TON.",
    pausedReason:
      "The original bet was on community NFTs, while later demand moved toward Telegram-native assets like gifts and anonymous numbers.",
    role: "CEO, co-founder",
    topThings: [
      "First NFT marketplace on TON",
      "$5m marketplace turnover",
      "$500k+ revenue in half a year",
    ],
    readMore:
      "Disintar proved early TON NFT demand and shipped before the category was obvious. The original community-NFT thesis faded, but the project left a real mark on the ecosystem.",
  },
] as const satisfies readonly Quest[];

export const loreEntries = [
  {
    date: "2025-05-19 22:17",
    text: "Shipped Xenage roadmap v0.4. Clarity > hype.",
  },
  {
    date: "2025-05-18 09:43",
    text: "Deep work session. Systems thinking wins.",
  },
  {
    date: "2025-05-16 17:05",
    text: "Wrote about guilds. Resonated with builders.",
  },
  {
    date: "2025-05-14 11:32",
    text: "Refined the public-builder quest interface.",
  },
  {
    date: "2025-05-12 08:51",
    text: "Cut a tiny distraction. Focus returned to the main quest.",
  },
] as const satisfies readonly LoreEntry[];

export const eraCards = [
  {
    label: "Before Agent Era",
    title: "Old stack becomes baseline",
    detail: "Scary: AI speedruns code/k8s/TON/data.",
  },
  {
    label: "In Agent Era",
    title: "Intergalactic mode",
    detail: "Agents multiply projects, guild, lore.",
  },
] as const satisfies readonly EraCard[];

export const stats = [
  {
    label: "Entrepreneurship / fundraising",
    value: 93,
    level: 93,
    icon: "entrepreneurship",
  },
  {
    label: "Product vision / team direction",
    value: 91,
    level: 91,
    icon: "product",
  },
  { label: "Python / C++ production", value: 92, level: 92, icon: "code" },
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
  { label: "PCB design / soldering", value: 46, level: 46, icon: "pcb" },
  { label: "3D modeling / prototyping", value: 44, level: 44, icon: "modeling" },
  { label: "Wood / glass handwork", value: 36, level: 36, icon: "craft" },
] as const satisfies readonly Stat[];

export const coreStats = [
  { label: "Code Blade", value: "8y Python/C++" },
  { label: "Entrepreneur", value: "2017+ CEO / co-founder" },
  { label: "Cloud Fortress", value: "5 bare-metal k8s" },
  { label: "TON Rune Smith", value: "$30m smart contract flow" },
  { label: "Data Kaiju Seal", value: "13TB replicated db / 1k RPS" },
  { label: "Neural Spark", value: "own ML models" },
  { label: "Craft Hands", value: "3D / PCB / wood / glass" },
] as const;

export const campaign = {
  headline: "Building the first intergalactic company",
  description:
    "Exploring the edge of AI Agents, information architecture, and decentralized coordination to build weird, useful products that compound over time.",
  focus: "Focus: long-term systems, real users, durable impact",
  quoteLines: [
    '"The universe is change.',
    'Our life is what our thoughts make it. - Marcus Aurelius"',
  ],
} as const;

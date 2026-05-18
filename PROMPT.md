# tvorog.me Personal Site Prompt

Build a premium personal website for **Andrey Tvorozhkov** under the identity **tvorog.me**.

The site is a light-mode ASCII terminal, solo-builder RPG profile, and personal operating system for the AI Agents era. Projects become questlines, archived projects become lessons, skills become stats, and progress becomes lore.

Use `projects.md` as the canonical source of truth. Do not invent project statuses that contradict it.

## 1. Core Direction

The site should feel premium, sparse, editorial, technical, playful, builder-centric, and slightly mythic. It should be RPG-inspired without looking like fantasy art, and ambitious without startup hype.

This is not a crypto dashboard, SaaS landing page, dark hacker terminal, or fantasy illustration. It is a refined personal terminal for someone trying to build "the first intergalactic company" in the AI Agents era.

Visual style:
- warm off-white background;
- dark charcoal text;
- thin ASCII-style borders;
- dotted separators;
- monospace UI typography;
- large elegant serif headlines;
- rare muted beige, brass, or amber accents;
- generous spacing;
- modular terminal panels;
- crisp responsive grids.

Avoid neon green, dark cyberpunk, purple/blue gradients, heavy dashboards, trading UI, stock imagery, decorative blobs, nested cards, and generic SaaS hero composition.

## 2. Identity

Brand: `tvorog.me`

Profile:

```text
Name:   Andrey Tvorozhkov
Class:  Systems Alchemist
Role:   Guild Architect
Rank:   B/S
Status: Grinding in the AI Agents era
```

Quote:

```text
The universe is change.
Our life is what our thoughts make it.

- Marcus Aurelius
```

Primary campaign:

```text
Building the first intergalactic company
```

Campaign description:

```text
Exploring the edge of AI Agents, information architecture, and decentralized coordination to build weird, useful products that compound over time.
```

Focus line:

```text
Focus: long-term systems, real users, durable impact
```

## 3. Canonical Content From projects.md

About:
- Andrey Tvorozhkov has programming and entrepreneurship experience since 2017.
- He is trying to build something significant in the AI Agents era.
- He shares progress through OpenGuild, Telegram, X, RSS, and Email.

Full-time focus:
- Trying to build "the first intergalactic company".
- Telling the story of his path through the AI Agents era.

Strengths:
- generating many projects;
- spiritual setup for a team of very smart people;
- ideological product vision and direction;
- top math school background;
- Python and C++;
- DevOps and bare-metal Kubernetes;
- TON smart contracts and tooling;
- big data and high availability systems;
- machine learning experiments;
- hardware, 3D modeling, boards, wood, and glass;
- AI agents, automation, Codex, Claude, and OpenClaw.

Project groups:
- **Active Questlines**: Xenage, Sanges, tvorog.me, OpenGuild.
- **Incubating Quests**: Mxfd, MaxAgents.
- **Planned Quests**: Education Game, Multiplayer Game.
- **Archived Projects**: dTON, Disintar.

Important: Education Game and Multiplayer Game are planned in `projects.md`, so do not put them in the graveyard.

## 4. Layout

The first screen should be the actual interface, not a marketing landing page.

The site must be adaptive across all common device classes: small phones, modern phones, large phones, tablets, small laptops, laptops, desktops, wide desktops, high-DPI screens, touch devices, pointer devices, portrait orientation, and landscape orientation.

Desktop:
- thin top terminal bar;
- persistent left profile sidebar;
- main content grid with terminal panels;
- hero campaign spans the main content area;
- Active Questlines and Graveyard can sit side by side;
- lower panels split or stack based on available width.

Tablet and laptop:
- preserve the two-column layout while it remains readable;
- collapse the sidebar only when the content needs the space;
- reduce panel padding and gaps before removing structure;
- keep nav, ASCII scenes, and tables readable without overlap.

Mobile:
- single-column structure;
- compact top nav;
- sidebar becomes a profile strip or collapsible section;
- ASCII art switches to compact variants;
- no pinch zoom, no text overlap, no accidental horizontal scrolling.

Small mobile:
- use the shortest ASCII variants;
- keep touch targets comfortable;
- avoid tiny text;
- preserve the identity of every section even when details are reduced.

Top bar:

```text
12.  tvorog.me
PROFILE  QUESTLINES  SKILLTREE  LORE.LOG  CHRONICLES  TAVERN  [...]
```

Sidebar:
- ASCII hooded traveler / alchemist avatar;
- profile metadata;
- XP progress: `XP: 6,420 / 10,000 64% [█████████████-------------]`;
- navigation;
- quote block.

Navigation:

```text
> PROFILE        [ ]
> QUESTLINES     [ ]
> SKILL TREE     [ ]
> LORE LOG       [ ]
> CHRONICLES     [ ]
```

## 5. Main Modules

Use terminal panels with ASCII borders, section numbers, and concise labels.

Recommended order:
1. Current Campaign
2. Active Questlines
3. Quest Arcs
4. Graveyard
5. LORE LOG
6. SKILL TREE

### 01. Current Campaign

Panel: `+ 01. :: CURRENT CAMPAIGN ---------------------------------------------------+`

Include the "Building the first / intergalactic company" headline, campaign description, focus line, and an ASCII space landscape with planet, stars, tiny rocket or lone figure, and lunar hills. Add subtle animated star twinkles and rocket exhaust.

### 02. Active Questlines

Panel: `+ 02. :: ACTIVE QUESTLINES ----------------------------------- VIEW ALL --> +`

Rows:

```text
01  Xenage            [ NEWLY-BORN ]  [██████████----------]  52%
02  Sanges            [ SEMI-DONE  ]  [████████████--------]  63%
03  tvorog.me         [ NEWLY-BORN ]  [███████-------------]  61%
04  OpenGuild         [ SEMI-DONE  ]  [██████████----------]  55%
```

Meanings:
- **Xenage**: startup agent orchestrator, like Kubernetes plus Lens for AI agents; infrastructure for building and testing startups instead of a personal assistant.
- **Sanges**: fast and secure isolated spaces for agents to run code and Linux commands.
- **tvorog.me**: personal site, article archive, Codex guild hall, and live LoreLog for the builder journey.
- **OpenGuild**: adventure guild for public builders; a beautiful way to share projects, skills, and progress.

### 03. Quest Arcs

Panel: `+ 03. :: QUEST ARCS ---------------------------------------- QUEUE OPEN --> +`

Rows:

```text
01  Mxfd              [ NEWLY-BORN ]  Financial home-office of AI agents
02  MaxAgents         [ NEWLY-BORN ]  AI agents for users in Telegram and MAX
03  Education Game    [ PLANNED    ]  Provocative educational game concept
04  Multiplayer Game  [ PLANNED    ]  Early game direction
```

Make this feel like a quest board, not a backlog table.

### 04. Graveyard

Panel: `+ 04. :: GRAVEYARD ------------------------------------- VIEW GRAVEYARD --> +`

Show an ASCII cemetery with fence, grass, birds or clouds, tombstones, project labels, and lesson-oriented captions.

Tombstones:

```text
dTON      RIP  05.2024
Disintar  RIP  11.2023
```

Caption:

```text
Resting place for ideas that taught me something.
Not failed. Completed.
```

Meanings:
- **dTON**: TON index, analytics, API, liteservers, DeFi API, portfolio tooling; $500k raised; contract with a top wallet in Telegram.
- **Disintar**: first NFT marketplace on TON; $5m turnover and $500k+ revenue in half a year.

The graveyard should be witty, respectful, and beautiful, not Halloween-themed.

### 05. LORE LOG

Panel: `+ 05. :: LORE LOG -------------------------------------------- VIEW FULL --> +`

Example feed:

```text
05.18.25  [+]  Accepted a new quest: Xenage
05.16.25  [+]  Shipped a prototype to early users
05.14.25  [+]  Changed design direction after signals
05.12.25  [+]  Wrote a chronicle: Why Systems > Features
```

### 06. Skill Tree

Panel: `+ 06. :: SKILL TREE ----------------------------------------------------------+`

Stats:

```text
Systems             [████████████--------]  82
Agents              [██████████----------]  71
Infrastructure      [█████████████-------]  86
Product Vision      [███████████---------]  76
Crypto / TON        [████████████--------]  80
Media / Story       [██████--------------]  38
Hardware / Craft    [████████------------]  58
```

Stats must reflect `projects.md`, not generic founder skills.

## 6. ASCII Interactivity And Motion

ASCII is the main visual asset. It must be interactive and animated, not pasted decoration.

Every ASCII element must be treated as an interactive UI surface or a responsive animated visual element. Nothing ASCII should feel like inert placeholder text.

Every ASCII object needs meaningful hover, focus-visible, active, selected, expanded, pressed, loading, idle, or reduced-motion states where relevant.

Interactive ASCII elements: avatar, navigation markers, progress bars, rocket, stars, planet, tombstones, and quest rows.

Use subtle CSS-first animations: cursor blink, terminal scan ticks, star twinkle, rocket exhaust, progress shimmer, and tombstone focus glow.

Rules:
- keep motion slow, refined, and premium;
- every ASCII panel should have at least one visible interactive or animated response;
- do not animate dimensions in ways that cause layout shift;
- respect `prefers-reduced-motion`;
- reduced-motion mode should keep state changes visible through color, contrast, borders, glyph changes, or opacity;
- keyboard users must get the same meaningful states as pointer users;
- touch users must get clear tap feedback;
- use client JavaScript only when real state or event handling is required.

## 7. 2026 Technical Stack

Use a modern, minimal, production-grade stack:
- **Next.js 16.2+** with App Router.
- **React 19.2+**.
- **TypeScript 6.x** or the latest TypeScript version supported by the selected Next.js release.
- **Tailwind CSS 4.x** only if a utility-first workflow is chosen; otherwise use CSS Modules and CSS custom properties.
- **ESLint flat config** with current React hooks rules.
- **Playwright** for responsive and interaction verification.

Do not use Pages Router, client-only SPA architecture, large component libraries, heavy state managers, runtime markdown parsers on the homepage, analytics bundles in the first implementation pass, `zod` unless parsing untrusted external data, shadcn/ui unless a complex control truly requires it, or animation libraries like `framer-motion`, `motion`, and GSAP for basic ASCII motion.

Implementation rules:
- use Server Components by default;
- use Client Components only for true interactivity;
- prefer static rendering and cached server rendering;
- use streaming/Suspense only where it improves perceived speed;
- keep browser JavaScript as close to zero as possible;
- store content as typed constants or build-time content modules;
- use `next/font` with self-hosted or local fonts; avoid runtime font requests;
- use `generateMetadata` for SEO metadata;
- use semantic HTML and accessible controls;
- use CSS container queries for component-level responsiveness;
- use CSS keyframes and transitions for ASCII animation;
- use `content-visibility` where long lower sections benefit from deferred rendering;
- use direct imports and avoid barrel files that hurt tree-shaking;
- do not pass large serialized props from Server Components to Client Components.

TypeScript rules:
- enable strict mode;
- no `any`;
- no unsafe `as unknown as` escapes;
- no `try` / `catch` as normal control flow;
- model expected failures with typed results, discriminated unions, validation, or explicit fallback values;
- use `as const` and `satisfies` for content arrays;
- define explicit domain types for profile metadata, navigation items, project statuses, quest rows, stats, lore entries, and ASCII scene variants;
- keep every implementation source file under 400 lines;
- `PROMPT.md` itself is an exception and may be longer when more product/design/technical detail is useful.

## 8. Responsive ASCII And Quality Bar

Each large ASCII scene should have variants: full detail for wide desktop, medium detail for laptop/tablet, compact detail for mobile, and extra-compact detail for small mobile. Never shrink ASCII text until it becomes unreadable; swap to a shorter variant instead.

Test at least these widths: 360, 390, 768, 1024, 1280, 1440, 1728.

Also test portrait and landscape orientation on mobile and tablet sizes.

Quality targets:
- homepage renders meaningful content immediately from the server;
- no loading spinner for static personal content;
- Lighthouse 95+ for Performance, Accessibility, Best Practices, and SEO;
- no unexpected layout shift;
- no text overlap at any viewport;
- fully keyboard accessible;
- serious enough for investors and collaborators;
- weird enough to be memorable.

Palette:

```text
Background:  #f8f5ef or #faf8f3
Text:        #1f1f1d
Muted text:  #5f5a52
Border:      #2b2925
Soft border: #b9b0a3
Accent:      #a56b2b or #9a6a37
Panel fill:  transparent or very subtle warm tint
```

Typography:
- monospace for UI, metadata, logs, progress bars, nav, and ASCII;
- elegant serif only for major headlines;
- no negative letter spacing;
- no viewport-width font scaling;
- text must fit its parent at all supported viewport sizes.

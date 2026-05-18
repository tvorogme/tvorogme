---
name: lorelog-publisher
description: Use when Codex should index local Codex sessions, match them to tvorog.me quest projects, and publish the LoreLog snapshot to the local Next server.
---

# LoreLog Publisher

Use the local courier script from the repository root:

```bash
npm run lorelog:index
npm run lorelog:watch
```

`npm run lorelog:index` builds one snapshot from `~/.codex/sessions`, writes `.tvorogme-lorelog/codex-lore-index.json`, and posts it to `/api/codex-subscription/lorelog`.

`npm run lorelog:watch` runs the same indexer every 10 minutes, but only publishes when Codex has touched a session file in the recent active window.

The site admin at `/admin` writes `.tvorogme-lorelog/admin-config.json`. The courier reads it for stream enablement, interval, active window, history depth, archived sessions, and prompt visibility.

Useful options:

```bash
npm run lorelog:index -- --dry-run
npm run lorelog:index -- --include-archived
npm run lorelog:index -- --include-prompt-excerpts
npm run lorelog:index -- --hide-prompts
CODEX_LORELOG_SERVER=http://127.0.0.1:3000/api/codex-subscription/lorelog npm run lorelog:index
```

Prompt excerpts are disabled by default. The public index normally emits veiled prompt runes such as `Black Ink`, `Courier Seal`, and `Artificer Mark`; `/admin` can switch that to short excerpts or hide prompt hints.

# tvorog.me

Personal website and LoreLog for `tvorog.me`, built with Next.js.

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Scripts

- `npm run dev` starts the local Next.js server.
- `npm run build` builds the production app.
- `npm run lint` runs ESLint.
- `npm run typecheck` runs TypeScript without emitting files.
- `npm run lorelog:index` builds a local LoreLog snapshot.
- `npm run lorelog:watch` publishes LoreLog updates from local Codex sessions.

## Environment

Copy `.env.example` to `.env.local` and fill only local or deployment-specific values. Do not commit `.env.local`, `.env.production`, `.tvorogme-lorelog/`, Codex session bundles, or generated build output.

Important production values:

- `OPENAI_API_KEY` enables article translation.
- `CODEX_LORELOG_SECRET` protects LoreLog ingestion.
- `TVOROGME_ADMIN_PASSWORD` or `TVOROGME_ADMIN_PASSWORD_SHA256` enables admin login.
- `TVOROGME_ADMIN_SESSION_SECRET` signs admin sessions.

## Publication Notes

The repository is configured to ignore local secrets, editor state, Next.js output, TypeScript build cache, and generated LoreLog/Codex artifacts. Run `git status --ignored --short` before publishing if you want to double-check what stays local.

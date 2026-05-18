# Security

Do not commit secrets or local state. Keep these files private:

- `.env*` except `.env.example`
- `.tvorogme-lorelog/`
- `.next/`
- `app-session-*.js`, `main-*.js`, `worker.js`
- private keys and certificates

Production deployments should set `CODEX_LORELOG_SECRET`, `TVOROGME_ADMIN_SESSION_SECRET`, and either `TVOROGME_ADMIN_PASSWORD` or `TVOROGME_ADMIN_PASSWORD_SHA256`.

If a secret is ever committed or pushed, rotate it immediately and remove it from git history before making the repository public.

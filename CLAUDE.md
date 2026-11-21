@AGENTS.md

# Project notes

- Family Secret Santa app. See README.md for features and deployment (Docker on a Proxmox box).
- `cacheComponents` is deliberately **off**: every page is per-user and dynamic. Pages that must not be
  prerendered and don't read cookies need `await connection()` (see login/setup).
- Data access is plain `better-sqlite3` in `src/lib/*`; migrations are an append-only array in `src/lib/db.ts`.
  Open the DB via `getDb()` (lazy, so `next build` never touches it).
- **Secrecy invariant:** never send a user's Santa (giver) id to the client, and never show pairings to
  admins, until `isRevealed(exchange)`. Re-check auth in every server action (`requireUser`/`requireAdmin`).
- Custom Tailwind classes (`card`, `btn-*`, `input`, `label`) are `@utility` blocks in `globals.css`.
- Checks: `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`.

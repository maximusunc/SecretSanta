# 🎅 Secret Santa

A festive, mobile-first Secret Santa dashboard for the family:

- **Private logins.** The admin creates accounts and everyone picks their own password and ornament avatar on first sign-in.
- **The draw.** The admin presses one button. Spouses never draw each other, nobody gets the same person as last year, and the result is picked uniformly at random from every valid pairing. **The admin can't see the results.**
- **Present reveal.** Tap a wiggling present to unwrap a gift tag with the name of the person you're Santa for (with confetti).
- **Wish boards** (Pinterest-style). Paste a link and the app fetches the product title and picture, or upload a photo from your phone. Add notes like size or colour.
- **Anonymous messages.** Ask your giftee a sneaky question; they only ever see "Your Secret Santa".
- **Christmas extras.** A "sleeps until Christmas" countdown, falling snow (toggle with the snowflake in the header), and budget and exchange-date tiles.
- **The big reveal.** On the reveal date everyone finds out who their Santa was, and the year moves into **History**.

## Design

"Night Before Christmas": midnight navy around the edges, ivory paper cards for content, candlelight gold accents,
Fraunces headings and DM Sans body text. Colour tokens live in `src/app/globals.css`.

## Tech

Next.js 16 (App Router, server actions), React 19, Tailwind CSS 4, SQLite (`better-sqlite3`), `sharp` for images.
Everything the app stores lives in one folder (`DATA_DIR`, `/data` in Docker):

```
data/santa.db      # database (users, boards, pairings, messages)
data/uploads/      # board images, resized to WebP
```

## Running it on the Proxmox mini PC

The easiest route is a small Debian/Ubuntu VM or LXC container running Docker. For an LXC, enable *nesting* in its options so Docker works.

```bash
git clone <this repo> secretsanta && cd secretsanta
# edit docker-compose.yml: set TZ to your time zone
docker compose up -d --build
```

Then open `http://<server-ip>:3000`. The first visit shows a one-time **setup** page for creating the admin account.

Updating later: `git pull && docker compose up -d --build`.

### Making it reachable with Tailscale

- **Family on your tailnet:** install Tailscale on the server and run `tailscale serve --bg 3000`. Everyone on the tailnet can then use `https://<machine>.<tailnet>.ts.net`.
- **Public link (no Tailscale needed for the family):** run `tailscale funnel --bg 3000`.

When serving over HTTPS, set `COOKIE_SECURE: "true"` in `docker-compose.yml` and restart the container.
If you see "invalid Server Actions request" errors behind some other proxy, add the public hostname to `ALLOWED_ORIGINS`.

### Backups

Copy the `./data` folder. For a consistent copy of a running database, use:
`sqlite3 data/santa.db ".backup data/backup.db"`

## First-time setup (and this year)

1. Create your admin account on the setup page.
2. **Admin → Family members:** add everyone. Each person gets a temporary password (e.g. `jolly-sleigh-4821`) to send them. Open each person to set their **spouse/partner**.
3. **This year (2026) was already drawn on paper.** Create the 2026 exchange with *"Already drawn on paper"*. Everyone then picks who they have on their home page. That unlocks anonymous messaging now, and it records the pairing so **next year's draw won't repeat it**. Only that person can see their entry.
4. **Next year:** create the 2027 exchange (*"The app draws names"*), set the budget and dates, and press **🎩 Draw names!** Everyone unwraps their assignment when they sign in.

### How secret is secret?

The app never shows pairings to anyone, including admins, until the reveal date. The admin page only shows *who* has unwrapped or recorded their person.
Anyone with shell access to the server could still read the database file, so just don't peek. 😉

## Development

```bash
npm install
npm run dev        # http://localhost:3000, data goes to ./data
npm test           # draw algorithm, link-preview parsing, URL safety checks
npm run lint
npm run typecheck
```

Layout:

```
src/lib/          db (schema + migrations), auth, draw algorithm, exchanges, boards, messages,
                  link previews, safe URL fetching, images
src/app/actions/  server actions (auth, admin, board, messages, exchange)
src/app/(app)/    signed-in pages: dashboard, boards, messages, history, account, admin
src/app/login|setup|welcome   sign-in flow
src/components/   Snow, Countdown, Reveal, forms, board UI
```

Schema changes: append a new entry to `MIGRATIONS` in `src/lib/db.ts` (never edit a shipped one).

Link previews are fetched by the server. To protect your home network, URLs that resolve to private, LAN, or Tailscale addresses are refused.

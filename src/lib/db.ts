import "server-only";
import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

/**
 * All persistent state lives in DATA_DIR:
 *   DATA_DIR/santa.db   – SQLite database
 *   DATA_DIR/uploads/   – uploaded / downloaded board images
 */
// The turbopackIgnore hint stops the build from tracing the whole project for this path.
export const DATA_DIR = path.resolve(/* turbopackIgnore: true */ process.env.DATA_DIR ?? "./data");
export const UPLOAD_DIR = path.join(DATA_DIR, "uploads");

// Each entry runs once, in order. Never edit a shipped migration — append a new one.
const MIGRATIONS: string[] = [
  /* 1: initial schema */ `
  CREATE TABLE users (
    id                   INTEGER PRIMARY KEY,
    email                TEXT NOT NULL UNIQUE COLLATE NOCASE,
    name                 TEXT NOT NULL,
    password_hash        TEXT NOT NULL,
    is_admin             INTEGER NOT NULL DEFAULT 0,
    must_change_password INTEGER NOT NULL DEFAULT 1,
    spouse_id            INTEGER REFERENCES users(id) ON DELETE SET NULL,
    emoji                TEXT NOT NULL DEFAULT '🎄',
    created_at           INTEGER NOT NULL DEFAULT (unixepoch())
  );

  CREATE TABLE sessions (
    id         TEXT PRIMARY KEY,           -- sha256 of the cookie token
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  );
  CREATE INDEX sessions_user ON sessions(user_id);

  CREATE TABLE exchanges (
    id            INTEGER PRIMARY KEY,
    year          INTEGER NOT NULL UNIQUE,
    budget        TEXT NOT NULL DEFAULT '',
    exchange_date TEXT,                    -- YYYY-MM-DD, when gifts are opened
    reveal_date   TEXT,                    -- YYYY-MM-DD, when Santas are revealed
    mode          TEXT NOT NULL DEFAULT 'draw' CHECK (mode IN ('draw', 'manual')),
    drawn_at      INTEGER,
    created_at    INTEGER NOT NULL DEFAULT (unixepoch())
  );

  CREATE TABLE assignments (
    exchange_id INTEGER NOT NULL REFERENCES exchanges(id) ON DELETE CASCADE,
    giver_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    seen_at     INTEGER,
    PRIMARY KEY (exchange_id, giver_id),
    UNIQUE (exchange_id, receiver_id)
  );

  CREATE TABLE board_items (
    id         INTEGER PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title      TEXT NOT NULL DEFAULT '',
    url        TEXT,
    site_name  TEXT,
    image_file TEXT,                       -- file name inside UPLOAD_DIR
    image_url  TEXT,                       -- remote fallback if we couldn't download it
    notes      TEXT NOT NULL DEFAULT '',
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  );
  CREATE INDEX board_items_user ON board_items(user_id, created_at);

  CREATE TABLE messages (
    id              INTEGER PRIMARY KEY,
    exchange_id     INTEGER NOT NULL REFERENCES exchanges(id) ON DELETE CASCADE,
    giver_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sender_is_santa INTEGER NOT NULL,
    body            TEXT NOT NULL,
    created_at      INTEGER NOT NULL DEFAULT (unixepoch()),
    read_at         INTEGER
  );
  CREATE INDEX messages_thread ON messages(exchange_id, giver_id, created_at);
  `,
  /* 2: emoji avatars → ornament colours */ `
  ALTER TABLE users ADD COLUMN ornament TEXT NOT NULL DEFAULT 'spruce';
  UPDATE users SET ornament = CASE id % 8
    WHEN 0 THEN 'silver' WHEN 1 THEN 'cranberry' WHEN 2 THEN 'spruce' WHEN 3 THEN 'candlelight'
    WHEN 4 THEN 'winter' WHEN 5 THEN 'plum' WHEN 6 THEN 'copper' ELSE 'frost' END;
  ALTER TABLE users DROP COLUMN emoji;
  `,
];

function migrate(db: Database.Database) {
  const current = db.pragma("user_version", { simple: true }) as number;
  for (let v = current; v < MIGRATIONS.length; v++) {
    db.transaction(() => {
      db.exec(MIGRATIONS[v]);
      db.pragma(`user_version = ${v + 1}`);
    })();
  }
}

function open(): Database.Database {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  const db = new Database(path.join(DATA_DIR, "santa.db"));
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.pragma("busy_timeout = 5000");
  migrate(db);
  return db;
}

// Opened lazily (so `next build` never touches the database) and kept on
// globalThis so dev hot-reloads reuse one connection.
const globalForDb = globalThis as unknown as { __santaDb?: Database.Database };
export function getDb(): Database.Database {
  return (globalForDb.__santaDb ??= open());
}

export const now = () => Math.floor(Date.now() / 1000);

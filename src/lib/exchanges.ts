import "server-only";
import { getDb, now } from "./db";
import { today } from "./dates";
import { drawNames } from "./draw";
import { listUsers } from "./users";

export type Exchange = {
  id: number;
  year: number;
  budget: string;
  exchangeDate: string | null;
  revealDate: string | null;
  mode: "draw" | "manual";
  drawnAt: number | null;
};

type ExchangeRow = {
  id: number;
  year: number;
  budget: string;
  exchange_date: string | null;
  reveal_date: string | null;
  mode: "draw" | "manual";
  drawn_at: number | null;
};

const toExchange = (r: ExchangeRow): Exchange => ({
  id: r.id,
  year: r.year,
  budget: r.budget,
  exchangeDate: r.exchange_date,
  revealDate: r.reveal_date,
  mode: r.mode,
  drawnAt: r.drawn_at,
});

/** Santas are revealed to everyone once the reveal date has arrived. */
export const isRevealed = (ex: Exchange) => !!ex.revealDate && today() >= ex.revealDate;

/** Assignments exist (drawn by the app, or entered by hand). */
export const isActive = (ex: Exchange) => ex.mode === "manual" || ex.drawnAt !== null;

export function listExchanges(): Exchange[] {
  return (getDb().prepare("SELECT * FROM exchanges ORDER BY year DESC").all() as ExchangeRow[]).map(
    toExchange,
  );
}

/** The exchange the dashboard is about: the most recent year. */
export function getCurrentExchange(): Exchange | null {
  const row = getDb().prepare("SELECT * FROM exchanges ORDER BY year DESC LIMIT 1").get();
  return row ? toExchange(row as ExchangeRow) : null;
}

export function getExchange(id: number): Exchange | null {
  const row = getDb().prepare("SELECT * FROM exchanges WHERE id = ?").get(id);
  return row ? toExchange(row as ExchangeRow) : null;
}

export type Assignment = { receiverId: number; seenAt: number | null };

/** Who `giverId` is buying for. Only ever call this with the signed-in user's id. */
export function getMyAssignment(exchangeId: number, giverId: number): Assignment | null {
  const row = getDb()
    .prepare("SELECT receiver_id, seen_at FROM assignments WHERE exchange_id = ? AND giver_id = ?")
    .get(exchangeId, giverId) as { receiver_id: number; seen_at: number | null } | undefined;
  return row ? { receiverId: row.receiver_id, seenAt: row.seen_at } : null;
}

/** Who is buying for `receiverId`. Callers must check isRevealed() first. */
export function getMySanta(exchangeId: number, receiverId: number): number | null {
  const row = getDb()
    .prepare("SELECT giver_id FROM assignments WHERE exchange_id = ? AND receiver_id = ?")
    .get(exchangeId, receiverId) as { giver_id: number } | undefined;
  return row?.giver_id ?? null;
}

export function hasSanta(exchangeId: number, receiverId: number): boolean {
  return getMySanta(exchangeId, receiverId) !== null;
}

export function markSeen(exchangeId: number, giverId: number) {
  getDb()
    .prepare(
      "UPDATE assignments SET seen_at = ? WHERE exchange_id = ? AND giver_id = ? AND seen_at IS NULL",
    )
    .run(now(), exchangeId, giverId);
}

/** All pairs. Callers must check isRevealed() first — this is the secret! */
export function revealedPairs(exchangeId: number): { giverId: number; receiverId: number }[] {
  return getDb()
    .prepare(
      "SELECT giver_id giverId, receiver_id receiverId FROM assignments WHERE exchange_id = ?",
    )
    .all(exchangeId) as { giverId: number; receiverId: number }[];
}

/** Non-secret progress info for the admin: who has drawn / unwrapped, never who they got. */
export function progress(exchangeId: number): Map<number, { seen: boolean }> {
  const rows = getDb()
    .prepare("SELECT giver_id, seen_at FROM assignments WHERE exchange_id = ?")
    .all(exchangeId) as { giver_id: number; seen_at: number | null }[];
  return new Map(rows.map((r) => [r.giver_id, { seen: r.seen_at !== null }]));
}

export function previousYearPairs(year: number): Map<number, number> {
  const rows = getDb()
    .prepare(
      `SELECT a.giver_id, a.receiver_id FROM assignments a
       JOIN exchanges e ON e.id = a.exchange_id WHERE e.year = ?`,
    )
    .all(year - 1) as { giver_id: number; receiver_id: number }[];
  return new Map(rows.map((r) => [r.giver_id, r.receiver_id]));
}

/** Run the draw for an exchange, replacing any earlier draw (and its messages). */
export function runDraw(
  exchangeId: number,
  opts: { ignorePreviousYear: boolean },
): { ok: true; possibilities: number } | { ok: false; reason: string } {
  const db = getDb();
  const ex = getExchange(exchangeId);
  if (!ex) return { ok: false, reason: "Exchange not found." };
  if (ex.mode !== "draw") return { ok: false, reason: "This year's names are entered by hand." };

  const users = listUsers();
  const spouses: [number, number][] = users
    .filter((u) => u.spouseId && u.id < u.spouseId)
    .map((u) => [u.id, u.spouseId!]);
  const result = drawNames({
    participants: users.map((u) => u.id),
    spouses,
    previous: opts.ignorePreviousYear ? new Map() : previousYearPairs(ex.year),
    nameOf: (id) => users.find((u) => u.id === id)?.name ?? `#${id}`,
  });
  if (!result.ok) return result;

  db.transaction(() => {
    db.prepare("DELETE FROM messages WHERE exchange_id = ?").run(exchangeId);
    db.prepare("DELETE FROM assignments WHERE exchange_id = ?").run(exchangeId);
    const insert = db.prepare(
      "INSERT INTO assignments (exchange_id, giver_id, receiver_id) VALUES (?, ?, ?)",
    );
    for (const [giver, receiver] of result.pairs) insert.run(exchangeId, giver, receiver);
    db.prepare("UPDATE exchanges SET drawn_at = ? WHERE id = ?").run(now(), exchangeId);
  })();
  return { ok: true, possibilities: result.possibilities };
}

/**
 * For years drawn outside the app (e.g. 2026, drawn on paper): each person
 * privately records who they had. The admin never sees it.
 */
export function setManualAssignment(
  exchangeId: number,
  giverId: number,
  receiverId: number | null,
): { ok: true } | { ok: false; reason: string } {
  const db = getDb();
  const ex = getExchange(exchangeId);
  if (!ex || ex.mode !== "manual") return { ok: false, reason: "This year was drawn in the app." };
  if (receiverId === giverId) return { ok: false, reason: "Nice try — you can't be your own Santa!" };

  if (receiverId === null) {
    db.prepare("DELETE FROM assignments WHERE exchange_id = ? AND giver_id = ?").run(
      exchangeId,
      giverId,
    );
    return { ok: true };
  }
  const clash = db
    .prepare("SELECT 1 FROM assignments WHERE exchange_id = ? AND receiver_id = ? AND giver_id != ?")
    .get(exchangeId, receiverId, giverId);
  if (clash) {
    return {
      ok: false,
      reason: "Someone else already said they have that person. Double-check your slip of paper!",
    };
  }
  db.prepare(
    `INSERT INTO assignments (exchange_id, giver_id, receiver_id, seen_at) VALUES (?, ?, ?, ?)
     ON CONFLICT (exchange_id, giver_id) DO UPDATE SET receiver_id = excluded.receiver_id`,
  ).run(exchangeId, giverId, receiverId, now());
  return { ok: true };
}

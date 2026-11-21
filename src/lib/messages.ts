import "server-only";
import { getDb, now } from "./db";

/**
 * Anonymous messaging. Each (exchange, giver, receiver) triple is one thread.
 * The receiver only ever sees "Your Secret Santa" — the giver's id never leaves the server
 * for them (until the reveal date).
 */

export type Message = { id: number; fromSanta: boolean; body: string; createdAt: number };

export function getThread(exchangeId: number, giverId: number, receiverId: number): Message[] {
  return (
    getDb()
      .prepare(
        `SELECT id, sender_is_santa fromSanta, body, created_at createdAt FROM messages
         WHERE exchange_id = ? AND giver_id = ? AND receiver_id = ? ORDER BY created_at, id`,
      )
      .all(exchangeId, giverId, receiverId) as (Omit<Message, "fromSanta"> & { fromSanta: number })[]
  ).map((m) => ({ ...m, fromSanta: !!m.fromSanta }));
}

export function sendMessage(
  exchangeId: number,
  giverId: number,
  receiverId: number,
  fromSanta: boolean,
  body: string,
) {
  getDb()
    .prepare(
      `INSERT INTO messages (exchange_id, giver_id, receiver_id, sender_is_santa, body)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .run(exchangeId, giverId, receiverId, fromSanta ? 1 : 0, body);
}

/** Mark messages in a thread as read by one side. */
export function markRead(exchangeId: number, giverId: number, receiverId: number, readerIsSanta: boolean) {
  getDb()
    .prepare(
      `UPDATE messages SET read_at = ? WHERE exchange_id = ? AND giver_id = ? AND receiver_id = ?
       AND sender_is_santa = ? AND read_at IS NULL`,
    )
    .run(now(), exchangeId, giverId, receiverId, readerIsSanta ? 0 : 1);
}

/** Unread count for a user in an exchange, across both of their threads. */
export function unreadCount(exchangeId: number, userId: number): number {
  const row = getDb()
    .prepare(
      `SELECT COUNT(*) n FROM messages m
       JOIN assignments a ON a.exchange_id = m.exchange_id AND a.giver_id = m.giver_id
                          AND a.receiver_id = m.receiver_id
       WHERE m.exchange_id = ? AND m.read_at IS NULL AND (
         (m.giver_id = ? AND m.sender_is_santa = 0) OR
         (m.receiver_id = ? AND m.sender_is_santa = 1))`,
    )
    .get(exchangeId, userId, userId) as { n: number };
  return row.n;
}

/** Does one side of a thread have unread messages waiting? */
export function hasUnread(exchangeId: number, giverId: number, receiverId: number, readerIsSanta: boolean): boolean {
  return !!getDb()
    .prepare(
      `SELECT 1 FROM messages WHERE exchange_id = ? AND giver_id = ? AND receiver_id = ?
       AND sender_is_santa = ? AND read_at IS NULL LIMIT 1`,
    )
    .get(exchangeId, giverId, receiverId, readerIsSanta ? 0 : 1);
}

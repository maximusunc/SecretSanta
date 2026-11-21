import "server-only";
import { getDb } from "./db";
import { toUser, type User } from "./auth";

export function listUsers(): User[] {
  return (getDb().prepare("SELECT * FROM users ORDER BY name COLLATE NOCASE").all() as never[]).map(
    toUser,
  );
}

export function getUser(id: number): User | null {
  const row = getDb().prepare("SELECT * FROM users WHERE id = ?").get(id);
  return row ? toUser(row as never) : null;
}

export function userCount(): number {
  return (getDb().prepare("SELECT COUNT(*) n FROM users").get() as { n: number }).n;
}

/** Set a symmetric spouse link (or clear it with null). */
export function setSpouse(userId: number, spouseId: number | null) {
  const db = getDb();
  db.transaction(() => {
    // Clear any existing links involving either person.
    db.prepare("UPDATE users SET spouse_id = NULL WHERE spouse_id IN (?, ?) OR id IN (?, ?)").run(
      userId,
      spouseId ?? -1,
      userId,
      spouseId ?? -1,
    );
    if (spouseId && spouseId !== userId) {
      db.prepare("UPDATE users SET spouse_id = ? WHERE id = ?").run(spouseId, userId);
      db.prepare("UPDATE users SET spouse_id = ? WHERE id = ?").run(userId, spouseId);
    }
  })();
}

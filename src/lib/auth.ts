import "server-only";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { getDb, now } from "./db";

const COOKIE = "santa_session";
const SESSION_DAYS = 60;

export type User = {
  id: number;
  email: string;
  name: string;
  emoji: string;
  isAdmin: boolean;
  mustChangePassword: boolean;
  spouseId: number | null;
};

type UserRow = {
  id: number;
  email: string;
  name: string;
  emoji: string;
  is_admin: number;
  must_change_password: number;
  spouse_id: number | null;
};

export const toUser = (r: UserRow): User => ({
  id: r.id,
  email: r.email,
  name: r.name,
  emoji: r.emoji,
  isAdmin: !!r.is_admin,
  mustChangePassword: !!r.must_change_password,
  spouseId: r.spouse_id,
});

export const hashPassword = (pw: string) => bcrypt.hash(pw, 12);
export const MIN_PASSWORD = 8;

const sha256 = (s: string) => crypto.createHash("sha256").update(s).digest("hex");

/** A friendly temporary password, e.g. "jolly-sleigh-4821". */
export function tempPassword(): string {
  const words = [
    "jolly", "merry", "snowy", "cozy", "frosty", "twinkle", "sleigh", "reindeer",
    "cocoa", "candy", "tinsel", "mitten", "pine", "holly", "ginger", "sparkle",
  ];
  const pick = () => words[crypto.randomInt(words.length)];
  return `${pick()}-${pick()}-${crypto.randomInt(1000, 10000)}`;
}

export async function verifyLogin(email: string, password: string): Promise<User | null> {
  const row = getDb()
    .prepare("SELECT * FROM users WHERE email = ?")
    .get(email.trim()) as (UserRow & { password_hash: string }) | undefined;
  // Compare against a dummy hash when the user doesn't exist to keep timing similar.
  const hash = row?.password_hash ?? "$2b$12$IqAiG/tstMA8B1erG2YLn.C9q75QyedAdMMMZkwIGaR7aOTzv/FAC";
  const ok = await bcrypt.compare(password, hash);
  return row && ok ? toUser(row) : null;
}

export async function createSession(userId: number) {
  const token = crypto.randomBytes(32).toString("base64url");
  const expires = now() + SESSION_DAYS * 86400;
  const db = getDb();
  db.prepare("DELETE FROM sessions WHERE expires_at < ?").run(now());
  db.prepare("INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)").run(
    sha256(token),
    userId,
    expires,
  );
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.COOKIE_SECURE === "true",
    path: "/",
    expires: new Date(expires * 1000),
  });
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (token) getDb().prepare("DELETE FROM sessions WHERE id = ?").run(sha256(token));
  store.delete(COOKIE);
}

/** Current user or null. Memoised per request. */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const row = getDb()
    .prepare(
      `SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.id = ? AND s.expires_at > ?`,
    )
    .get(sha256(token), now()) as UserRow | undefined;
  return row ? toUser(row) : null;
});

/** For pages and actions: a signed-in user who has set their own password. */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.mustChangePassword) redirect("/welcome");
  return user;
}

export async function requireAdmin(): Promise<User> {
  const user = await requireUser();
  if (!user.isAdmin) redirect("/");
  return user;
}

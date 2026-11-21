"use server";

import { redirect } from "next/navigation";
import {
  createSession,
  destroySession,
  getCurrentUser,
  hashPassword,
  MIN_PASSWORD,
  requireUser,
  verifyLogin,
} from "@/lib/auth";
import { getDb } from "@/lib/db";
import { userCount } from "@/lib/users";
import { EMOJIS } from "@/lib/emojis";
import type { ActionResult } from "@/components/Forms";

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

export async function login(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const user = await verifyLogin(str(fd, "email"), String(fd.get("password") ?? ""));
  if (!user) return { error: "Hmm, that email and password don't match. Try again?" };
  await createSession(user.id);
  redirect(user.mustChangePassword ? "/welcome" : "/");
}

export async function logout() {
  await destroySession();
  redirect("/login");
}

/** First-run only: create the admin account when the database is empty. */
export async function setupAdmin(_: ActionResult, fd: FormData): Promise<ActionResult> {
  if (userCount() > 0) redirect("/login");
  const name = str(fd, "name");
  const email = str(fd, "email");
  const password = String(fd.get("password") ?? "");
  if (!name || !email.includes("@")) return { error: "Please enter your name and email." };
  if (password.length < MIN_PASSWORD) return { error: `Password must be at least ${MIN_PASSWORD} characters.` };

  const res = getDb()
    .prepare(
      "INSERT INTO users (email, name, password_hash, is_admin, must_change_password, emoji) VALUES (?, ?, ?, 1, 0, '🎅')",
    )
    .run(email, name, await hashPassword(password));
  await createSession(Number(res.lastInsertRowid));
  redirect("/admin");
}

/** First login: replace the temporary password and pick an avatar. */
export async function completeWelcome(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const password = String(fd.get("password") ?? "");
  const confirm = String(fd.get("confirm") ?? "");
  const emoji = str(fd, "emoji");
  if (password.length < MIN_PASSWORD) return { error: `Password must be at least ${MIN_PASSWORD} characters.` };
  if (password !== confirm) return { error: "Those passwords don't match." };

  getDb()
    .prepare("UPDATE users SET password_hash = ?, must_change_password = 0, emoji = ? WHERE id = ?")
    .run(await hashPassword(password), EMOJIS.includes(emoji) ? emoji : user.emoji, user.id);
  redirect("/");
}

export async function changePassword(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const current = String(fd.get("current") ?? "");
  const password = String(fd.get("password") ?? "");
  if (!(await verifyLogin(user.email, current))) return { error: "Your current password is incorrect." };
  if (password.length < MIN_PASSWORD) return { error: `Password must be at least ${MIN_PASSWORD} characters.` };
  getDb().prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(await hashPassword(password), user.id);
  return { ok: "Password updated." };
}

export async function updateEmoji(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const emoji = str(fd, "emoji");
  if (!EMOJIS.includes(emoji)) return { error: "Pick one of the options." };
  getDb().prepare("UPDATE users SET emoji = ? WHERE id = ?").run(emoji, user.id);
  return { ok: "Looking festive!" };
}

"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { hashPassword, requireAdmin, tempPassword } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { getExchange, runDraw } from "@/lib/exchanges";
import { getUser, listUsers, setSpouse, userCount } from "@/lib/users";
import { notifyUser } from "@/lib/push";
import { ORNAMENT_IDS } from "@/lib/ornaments";
import type { ActionResult } from "@/components/Forms";

const str = (fd: FormData, k: string, max = 200) => String(fd.get(k) ?? "").trim().slice(0, max);
const date = (fd: FormData, k: string) => {
  const v = str(fd, k);
  return /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null;
};
const done = (msg: string): ActionResult => {
  revalidatePath("/", "layout");
  return { ok: msg };
};

// ---- Family members -------------------------------------------------------

export async function createUser(_: ActionResult, fd: FormData): Promise<ActionResult> {
  await requireAdmin();
  const name = str(fd, "name", 60);
  const email = str(fd, "email");
  if (!name || !email.includes("@")) return { error: "Enter a name and a valid email." };
  const pw = tempPassword();
  try {
    getDb()
      .prepare("INSERT INTO users (email, name, password_hash, ornament) VALUES (?, ?, ?, ?)")
      .run(email, name, await hashPassword(pw), ORNAMENT_IDS[userCount() % ORNAMENT_IDS.length]);
  } catch {
    return { error: "Someone already has that email." };
  }
  return done(`Added ${name}! Their temporary password is  ${pw}  — send it to them; they'll pick their own when they sign in.`);
}

export async function editUser(_: ActionResult, fd: FormData): Promise<ActionResult> {
  await requireAdmin();
  const user = getUser(Number(fd.get("id")));
  if (!user) return { error: "No such person." };
  const name = str(fd, "name", 60);
  const email = str(fd, "email");
  if (!name || !email.includes("@")) return { error: "Enter a name and a valid email." };
  try {
    getDb().prepare("UPDATE users SET name = ?, email = ? WHERE id = ?").run(name, email, user.id);
  } catch {
    return { error: "Someone already has that email." };
  }
  const spouseRaw = str(fd, "spouseId");
  setSpouse(user.id, spouseRaw ? Number(spouseRaw) : null);
  return done(`Saved ${name}.`);
}

export async function resetPassword(_: ActionResult, fd: FormData): Promise<ActionResult> {
  await requireAdmin();
  const user = getUser(Number(fd.get("id")));
  if (!user) return { error: "No such person." };
  const pw = tempPassword();
  const db = getDb();
  db.prepare("UPDATE users SET password_hash = ?, must_change_password = 1 WHERE id = ?").run(
    await hashPassword(pw),
    user.id,
  );
  db.prepare("DELETE FROM sessions WHERE user_id = ?").run(user.id);
  return done(`New temporary password for ${user.name}:  ${pw}`);
}

export async function toggleAdmin(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const me = await requireAdmin();
  const user = getUser(Number(fd.get("id")));
  if (!user) return { error: "No such person." };
  if (user.id === me.id) return { error: "You can't remove your own admin access." };
  getDb().prepare("UPDATE users SET is_admin = ? WHERE id = ?").run(user.isAdmin ? 0 : 1, user.id);
  return done(user.isAdmin ? `${user.name} is no longer an admin.` : `${user.name} is now an admin.`);
}

export async function deleteUser(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const me = await requireAdmin();
  const user = getUser(Number(fd.get("id")));
  if (!user) return { error: "No such person." };
  if (user.id === me.id) return { error: "You can't delete yourself." };
  getDb().prepare("DELETE FROM users WHERE id = ?").run(user.id);
  return done(`Removed ${user.name}.`);
}

// ---- Exchanges ------------------------------------------------------------

export async function createExchange(_: ActionResult, fd: FormData): Promise<ActionResult> {
  await requireAdmin();
  const year = Number(fd.get("year"));
  if (!Number.isInteger(year) || year < 2000 || year > 2100) return { error: "Enter a valid year." };
  const mode = fd.get("mode") === "manual" ? "manual" : "draw";
  try {
    getDb()
      .prepare(
        "INSERT INTO exchanges (year, budget, exchange_date, reveal_date, mode) VALUES (?, ?, ?, ?, ?)",
      )
      .run(year, str(fd, "budget", 60), date(fd, "exchangeDate"), date(fd, "revealDate"), mode);
  } catch {
    return { error: `There's already an exchange for ${year}.` };
  }
  return done(`Created the ${year} exchange!`);
}

export async function updateExchange(_: ActionResult, fd: FormData): Promise<ActionResult> {
  await requireAdmin();
  const ex = getExchange(Number(fd.get("id")));
  if (!ex) return { error: "No such exchange." };
  getDb()
    .prepare("UPDATE exchanges SET budget = ?, exchange_date = ?, reveal_date = ? WHERE id = ?")
    .run(str(fd, "budget", 60), date(fd, "exchangeDate"), date(fd, "revealDate"), ex.id);
  return done("Saved.");
}

export async function drawNamesAction(_: ActionResult, fd: FormData): Promise<ActionResult> {
  await requireAdmin();
  const res = runDraw(Number(fd.get("id")), {
    ignorePreviousYear: fd.get("ignorePreviousYear") === "on",
  });
  if (!res.ok) return { error: res.reason };
  after(() =>
    Promise.all(
      listUsers().map((u) =>
        notifyUser(u.id, {
          title: "Names have been drawn!",
          body: "Your present is waiting. Tap to unwrap who you're Secret Santa for.",
          url: "/",
          tag: "draw",
        }),
      ),
    ),
  );
  return done(
    `Names drawn! (${res.possibilities} possible pairings were valid — one was picked at random.) Nobody, including you, can see the results here.`,
  );
}

export async function deleteExchange(_: ActionResult, fd: FormData): Promise<ActionResult> {
  await requireAdmin();
  const ex = getExchange(Number(fd.get("id")));
  if (!ex) return { error: "No such exchange." };
  getDb().prepare("DELETE FROM exchanges WHERE id = ?").run(ex.id);
  return done(`Deleted the ${ex.year} exchange.`);
}

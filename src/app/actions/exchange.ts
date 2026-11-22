"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { getCurrentExchange, getExchange, markSeen, setManualAssignment } from "@/lib/exchanges";
import { getUser } from "@/lib/users";
import type { ActionResult } from "@/components/Forms";

/** The current user has unwrapped their present. */
export async function markAssignmentSeen() {
  const user = await requireUser();
  const ex = getCurrentExchange();
  if (ex) markSeen(ex.id, user.id);
}

/** For hand-drawn years: privately record who *you* have. */
export async function recordMyRecipient(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const ex = getExchange(Number(fd.get("exchangeId")));
  if (!ex) return { error: "That year doesn't exist." };
  const raw = String(fd.get("receiverId") ?? "");
  const receiverId = raw ? Number(raw) : null;
  if (receiverId !== null && !getUser(receiverId)) return { error: "Pick someone from the list." };

  const res = setManualAssignment(ex.id, user.id, receiverId);
  if (!res.ok) return { error: res.reason };
  revalidatePath("/", "layout");
  return { ok: receiverId ? "Got it. Your secret is safe with us." : "Cleared." };
}

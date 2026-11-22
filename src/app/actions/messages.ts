"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { requireUser } from "@/lib/auth";
import { getCurrentExchange, getMyAssignment, getMySanta } from "@/lib/exchanges";
import { sendMessage } from "@/lib/messages";
import { firstName } from "@/lib/ornaments";
import { notifyUser, preview } from "@/lib/push";
import type { ActionResult } from "@/components/Forms";

/**
 * `to` is "giftee" (you, as Santa, writing to the person you're buying for)
 * or "santa" (you writing back to whoever is buying for you). The other
 * party is always resolved on the server — the client never learns who your Santa is.
 */
export async function postMessage(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const ex = getCurrentExchange();
  if (!ex) return { error: "There's no exchange yet." };

  const body = String(fd.get("body") ?? "").trim().slice(0, 2000);
  if (!body) return { error: "Write something first!" };

  if (fd.get("to") === "giftee") {
    const mine = getMyAssignment(ex.id, user.id);
    if (!mine) return { error: "You don't have a giftee yet." };
    sendMessage(ex.id, user.id, mine.receiverId, true, body);
    // Never name the sender: the giftee only ever knows them as "your Secret Santa".
    after(() =>
      notifyUser(mine.receiverId, {
        title: "Your Secret Santa sent you a message",
        body: preview(body),
        url: "/messages?with=santa",
        tag: "from-santa",
      }),
    );
  } else {
    const santaId = getMySanta(ex.id, user.id);
    if (!santaId) return { error: "Your Secret Santa hasn't been assigned yet." };
    sendMessage(ex.id, santaId, user.id, false, body);
    // The Santa already knows who their giftee is.
    after(() =>
      notifyUser(santaId, {
        title: `${firstName(user.name)} replied`,
        body: preview(body),
        url: "/messages?with=giftee",
        tag: "from-giftee",
      }),
    );
  }
  revalidatePath("/messages");
  return { ok: "Sent!" };
}

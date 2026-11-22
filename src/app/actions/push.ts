"use server";

import { requireUser } from "@/lib/auth";
import { deleteSubscription, hasSubscription, notifyUser, saveSubscription, type SubscriptionInput } from "@/lib/push";

export async function subscribePush(sub: SubscriptionInput): Promise<{ ok: boolean }> {
  const user = await requireUser();
  return { ok: saveSubscription(user.id, sub) };
}

export async function unsubscribePush(endpoint: string): Promise<void> {
  const user = await requireUser();
  deleteSubscription(user.id, endpoint);
}

/** Is this device's subscription saved for the signed-in user? (Re-syncs after a reinstall.) */
export async function isPushRegistered(endpoint: string): Promise<boolean> {
  const user = await requireUser();
  return hasSubscription(user.id, endpoint);
}

export async function sendTestPush(): Promise<{ delivered: number }> {
  const user = await requireUser();
  const delivered = await notifyUser(user.id, {
    title: "Ho ho ho!",
    body: "Notifications are working. We'll let you know when you get a secret message.",
    url: "/",
    tag: "test",
  });
  return { delivered };
}

import "server-only";
import webpush from "web-push";
import { getDb } from "./db";
import { isAllowedPushEndpoint } from "./pushEndpoint";

/**
 * Web push notifications (iPhone: only for the app added to the Home Screen).
 * The VAPID key pair that identifies this server to Apple/Google is generated
 * on first use and kept in the database, so there is nothing to configure.
 */

export type PushPayload = { title: string; body: string; url: string; tag?: string };

type Keys = { publicKey: string; privateKey: string };

function setting(key: string): string | null {
  const row = getDb().prepare("SELECT value FROM settings WHERE key = ?").get(key) as { value: string } | undefined;
  return row?.value ?? null;
}

let cachedKeys: Keys | null = null;
export function getVapidKeys(): Keys {
  if (cachedKeys) return cachedKeys;
  const stored = setting("vapid");
  if (stored) return (cachedKeys = JSON.parse(stored) as Keys);
  const keys = webpush.generateVAPIDKeys();
  // INSERT OR IGNORE + re-read: if two requests race, both end up with the same keys.
  getDb().prepare("INSERT OR IGNORE INTO settings (key, value) VALUES ('vapid', ?)").run(JSON.stringify(keys));
  return (cachedKeys = JSON.parse(setting("vapid")!) as Keys);
}

// Apple rejects a VAPID subject on localhost; this can be any mailto: or https: URL you like.
const SUBJECT = process.env.VAPID_SUBJECT || "mailto:secret-santa@example.com";

export type SubscriptionInput = { endpoint: string; keys: { p256dh: string; auth: string } };

export function saveSubscription(userId: number, sub: SubscriptionInput): boolean {
  if (!isAllowedPushEndpoint(sub.endpoint) || !sub.keys?.p256dh || !sub.keys?.auth) return false;
  // A device belongs to whoever subscribed it last (e.g. a shared iPad).
  getDb()
    .prepare(
      `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth) VALUES (?, ?, ?, ?)
       ON CONFLICT (endpoint) DO UPDATE SET user_id = excluded.user_id, p256dh = excluded.p256dh, auth = excluded.auth`,
    )
    .run(userId, sub.endpoint, sub.keys.p256dh, sub.keys.auth);
  return true;
}

export function deleteSubscription(userId: number, endpoint: string) {
  getDb().prepare("DELETE FROM push_subscriptions WHERE user_id = ? AND endpoint = ?").run(userId, endpoint);
}

export function hasSubscription(userId: number, endpoint: string): boolean {
  return !!getDb()
    .prepare("SELECT 1 FROM push_subscriptions WHERE user_id = ? AND endpoint = ?")
    .get(userId, endpoint);
}

/** Send to every device a person has turned notifications on for. Never throws. */
export async function notifyUser(userId: number, payload: PushPayload): Promise<number> {
  const subs = getDb()
    .prepare("SELECT id, endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = ?")
    .all(userId) as { id: number; endpoint: string; p256dh: string; auth: string }[];
  if (subs.length === 0) return 0;

  const { publicKey, privateKey } = getVapidKeys();
  const body = JSON.stringify(payload);
  let delivered = 0;
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, body, {
          vapidDetails: { subject: SUBJECT, publicKey, privateKey },
          TTL: 60 * 60 * 24, // keep trying for a day if the phone is offline
          timeout: 10_000,
        });
        delivered++;
      } catch (e) {
        const status = (e as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          // The device unsubscribed or the app was removed: forget it.
          getDb().prepare("DELETE FROM push_subscriptions WHERE id = ?").run(s.id);
        } else {
          console.error(`Push to user ${userId} failed (${status ?? "network"}):`, (e as Error).message);
        }
      }
    }),
  );
  return delivered;
}

/** Short preview of a message for the lock screen. */
export const preview = (text: string, max = 120) =>
  text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;

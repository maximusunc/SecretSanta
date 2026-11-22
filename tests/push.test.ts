import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { isAllowedPushEndpoint } from "../src/lib/pushEndpoint";

vi.mock("server-only", () => ({}));
const sendNotification = vi.fn();
vi.mock("web-push", () => ({
  default: {
    sendNotification: (...args: unknown[]) => sendNotification(...args),
    generateVAPIDKeys: () => ({ publicKey: "pub", privateKey: "priv" }),
  },
}));

describe("isAllowedPushEndpoint", () => {
  it.each([
    "https://web.push.apple.com/QGuQyavXutnMH1kz...",
    "https://fcm.googleapis.com/fcm/send/abc:def",
    "https://updates.push.services.mozilla.com/wpush/v2/xyz",
    "https://wns2-par02p.notify.windows.com/w/?token=1",
  ])("accepts %s", (u) => expect(isAllowedPushEndpoint(u)).toBe(true));

  it.each([
    "http://web.push.apple.com/x", // not https
    "https://192.168.1.10/push",
    "https://web.push.apple.com.evil.example/x",
    "https://fcm.googleapis.com:8443/x",
    "https://localhost/x",
    "not a url",
  ])("rejects %s", (u) => expect(isAllowedPushEndpoint(u)).toBe(false));
});

describe("notifyUser", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "santa-push-"));
  let push: typeof import("../src/lib/push");
  let db: import("better-sqlite3").Database;

  beforeAll(async () => {
    process.env.DATA_DIR = dir;
    push = await import("../src/lib/push");
    db = (await import("../src/lib/db")).getDb();
    db.prepare("INSERT INTO users (id, email, name, password_hash) VALUES (1, 'a@x', 'Alex', 'x')").run();
  });
  afterAll(() => {
    db.close();
    fs.rmSync(dir, { recursive: true, force: true });
  });

  const sub = (n: number) => ({
    endpoint: `https://web.push.apple.com/device-${n}`,
    keys: { p256dh: "p", auth: "a" },
  });

  it("refuses endpoints that aren't real push services", () => {
    expect(push.saveSubscription(1, { endpoint: "https://10.0.0.1/x", keys: { p256dh: "p", auth: "a" } })).toBe(false);
  });

  it("delivers to every device, forgets gone ones, survives other errors", async () => {
    push.saveSubscription(1, sub(1));
    push.saveSubscription(1, sub(2));
    push.saveSubscription(1, sub(3));
    sendNotification.mockImplementation(async (s: { endpoint: string }) => {
      if (s.endpoint.endsWith("device-2")) throw Object.assign(new Error("Gone"), { statusCode: 410 });
      if (s.endpoint.endsWith("device-3")) throw Object.assign(new Error("Boom"), { statusCode: 500 });
    });
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});

    const delivered = await push.notifyUser(1, { title: "Hi", body: "There", url: "/" });

    expect(delivered).toBe(1);
    const left = db.prepare("SELECT endpoint FROM push_subscriptions ORDER BY endpoint").all() as { endpoint: string }[];
    expect(left.map((r) => r.endpoint.split("/").pop())).toEqual(["device-1", "device-3"]);
    expect(errors).toHaveBeenCalledTimes(1);
    const [, payload, opts] = sendNotification.mock.calls[0];
    expect(JSON.parse(payload as string)).toEqual({ title: "Hi", body: "There", url: "/" });
    expect((opts as { vapidDetails: { publicKey: string } }).vapidDetails.publicKey).toBe("pub");
  });

  it("returns 0 and sends nothing for someone without devices", async () => {
    sendNotification.mockClear();
    expect(await push.notifyUser(999, { title: "x", body: "y", url: "/" })).toBe(0);
    expect(sendNotification).not.toHaveBeenCalled();
  });

  it("rate-limits a notification key to once per window", () => {
    const t = 1_000_000;
    expect(push.claimNotificationSlot("board:1:2", 600, t)).toBe(true);
    expect(push.claimNotificationSlot("board:1:2", 600, t + 60)).toBe(false); // a minute later: held back
    expect(push.claimNotificationSlot("board:1:3", 600, t + 60)).toBe(true); // a different board is separate
    expect(push.claimNotificationSlot("board:1:2", 600, t + 600)).toBe(true); // window passed
    expect(push.claimNotificationSlot("board:1:2", 600, t + 700)).toBe(false);
  });

  it("shortens long previews for the lock screen", () => {
    expect(push.preview("a".repeat(200)).length).toBe(120);
    expect(push.preview("short")).toBe("short");
  });
});

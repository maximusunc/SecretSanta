"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { isPushRegistered, sendTestPush, subscribePush, unsubscribePush } from "@/app/actions/push";
import { BellIcon } from "./Icons";

type Status =
  | "loading"
  | "unsupported" // not an iPhone, and this browser has no web push
  | "needs-install" // iPhone in a normal Safari/Chrome tab: push only works from the Home Screen app
  | "reinstall" // iPhone Home Screen app without push (added before the app had a manifest, or iOS < 16.4)
  | "error" // something failed while setting up; `detail` says what
  | "denied"
  | "off"
  | "on";

function urlBase64ToUint8Array(base64: string) {
  const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
}

const isIOS = () =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

function usePush(vapidPublicKey: string) {
  const [status, setStatus] = useState<Status>("loading");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [detail, setDetail] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const ios = isIOS();
      // On iPhone, push only ever works from the Home Screen app, whatever a normal tab claims to support.
      if (ios && !isStandalone()) return setStatus("needs-install");
      const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
      if (!supported) return setStatus(ios ? "reinstall" : "unsupported");
      try {
        const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" });
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          // Make sure the server still has it (e.g. after the app was reinstalled).
          if (!(await isPushRegistered(sub.endpoint))) await subscribePush(sub.toJSON() as never);
          return setStatus("on");
        }
        setStatus(Notification.permission === "denied" ? "denied" : "off");
      } catch (e) {
        setDetail(e instanceof Error ? `${e.name}: ${e.message}` : String(e));
        setStatus("error");
      }
    })();
  }, []);

  const turnOn = useCallback(async () => {
    setBusy(true);
    setNote(null);
    try {
      // Must be called straight from the tap, or iOS won't show the prompt.
      const permission = await Notification.requestPermission();
      if (permission !== "granted") return setStatus(permission === "denied" ? "denied" : "off");
      const reg = await navigator.serviceWorker.ready;
      const sub =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        }));
      const res = await subscribePush(sub.toJSON() as never);
      if (!res.ok) {
        await sub.unsubscribe();
        setNote("This browser's notification service isn't supported, sorry.");
        return setStatus("off");
      }
      setStatus("on");
    } catch (e) {
      setNote(`Couldn't turn on notifications (${e instanceof Error ? e.message : String(e)}). Try again in a moment.`);
    } finally {
      setBusy(false);
    }
  }, [vapidPublicKey]);

  const turnOff = useCallback(async () => {
    setBusy(true);
    setNote(null);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await unsubscribePush(sub.endpoint);
        await sub.unsubscribe();
      }
      setStatus("off");
    } finally {
      setBusy(false);
    }
  }, []);

  const test = useCallback(async () => {
    setBusy(true);
    try {
      const { delivered } = await sendTestPush();
      setNote(delivered > 0 ? "Sent! It should pop up in a few seconds." : "Couldn't deliver it. Try turning notifications off and on.");
    } finally {
      setBusy(false);
    }
  }, []);

  return { status, busy, note, detail, turnOn, turnOff, test };
}

/** Full settings card for the Account page (renders on ivory). */
export function NotificationSettings({ vapidPublicKey }: { vapidPublicKey: string }) {
  const { status, busy, note, detail, turnOn, turnOff, test } = usePush(vapidPublicKey);

  return (
    <section id="notifications" className="card scroll-mt-24 p-5">
      <h2 className="mb-1 flex items-center gap-2 font-display text-xl font-semibold">
        <BellIcon size={20} className="text-cranberry" /> Notifications
      </h2>
      {status === "loading" && <p className="text-sm text-muted">Checking this device…</p>}

      {status === "on" && (
        <>
          <p className="mb-3 text-sm text-muted">On for this device. You&apos;ll hear about new secret messages.</p>
          <div className="flex flex-wrap gap-2">
            <button onClick={test} disabled={busy} className="btn-spruce text-sm">Send a test</button>
            <button onClick={turnOff} disabled={busy} className="btn-ghost text-sm">Turn off</button>
          </div>
        </>
      )}

      {status === "off" && (
        <>
          <p className="mb-3 text-sm text-muted">Get a notification when your Santa or your giftee sends you a message.</p>
          <button onClick={turnOn} disabled={busy} className="btn-cranberry w-full">
            {busy ? "Turning on…" : "Turn on notifications"}
          </button>
        </>
      )}

      {status === "needs-install" && (
        <>
          <p className="mb-2 text-sm text-muted">On iPhone, notifications only work from the Home Screen app:</p>
          <ol className="list-decimal space-y-1 pl-5 text-sm">
            <li>Tap the <strong>Share</strong> button in Safari.</li>
            <li>Choose <strong>Add to Home Screen</strong>, then <strong>Add</strong>.</li>
            <li>Open Secret Santa from your Home Screen and come back to this page.</li>
          </ol>
        </>
      )}

      {status === "denied" && (
        <p className="text-sm text-muted">
          Notifications are blocked. On iPhone go to <strong>Settings → Notifications → Secret Santa</strong> and
          turn on <strong>Allow Notifications</strong>, then reopen the app.
        </p>
      )}

      {status === "reinstall" && (
        <>
          <p className="mb-2 text-sm text-muted">
            This Home Screen icon was added before notifications existed, so iOS hasn&apos;t switched them on. Re-add it:
          </p>
          <ol className="list-decimal space-y-1 pl-5 text-sm">
            <li>Press and hold the Secret Santa icon, tap <strong>Remove App</strong>, then <strong>Delete from Home Screen</strong>.</li>
            <li>Open the site in Safari, tap <strong>Share</strong>, then <strong>Add to Home Screen</strong>.</li>
            <li>Open it from the new icon and come back to this page.</li>
          </ol>
          <p className="mt-2 text-xs text-muted">Notifications need iOS 16.4 or newer (Settings → General → About).</p>
        </>
      )}

      {status === "error" && (
        <>
          <p className="mb-2 text-sm text-muted">Something went wrong setting up notifications on this device.</p>
          {detail && <p className="mb-3 rounded-xl bg-paper px-3 py-2 font-mono text-xs break-words">{detail}</p>}
          <button onClick={() => location.reload()} className="btn-ghost text-sm">Try again</button>
        </>
      )}

      {status === "unsupported" && (
        <p className="text-sm text-muted">This browser can&apos;t show notifications.</p>
      )}

      {note && <p className="mt-3 rounded-2xl bg-paper px-4 py-2.5 text-sm font-semibold">{note}</p>}
    </section>
  );
}

const DISMISS_KEY = "santa:notify-dismissed";

/** Small prompt on the Messages page (renders on navy). Hidden once on, or if dismissed. */
export function NotificationNudge({ vapidPublicKey }: { vapidPublicKey: string }) {
  const { status, busy, note, turnOn } = usePush(vapidPublicKey);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- read a browser-only preference after mount
      setDismissed(localStorage.getItem(DISMISS_KEY) === "1");
    } catch {
      setDismissed(false);
    }
  }, []);

  if (dismissed || (status !== "off" && status !== "needs-install" && status !== "reinstall")) return null;

  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {}
  };

  return (
    <div className="flex items-center gap-3 rounded-[18px] border-[1.5px] border-dashed border-gold/55 px-4 py-3">
      <BellIcon size={22} className="shrink-0 text-gold" />
      <p className="flex-1 text-sm text-haze">{note ?? "Get notified when a secret message arrives."}</p>
      {status === "off" ? (
        <button onClick={turnOn} disabled={busy} className="btn-gold min-h-10 px-4 text-sm">Turn on</button>
      ) : (
        <Link href="/account#notifications" className="btn-gold min-h-10 px-4 text-sm">How?</Link>
      )}
      <button onClick={dismiss} aria-label="Dismiss" className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-mist hover:text-snow">
        ×
      </button>
    </div>
  );
}

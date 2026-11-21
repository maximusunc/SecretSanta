"use client";

import { useEffect, useState } from "react";

function nextChristmas(now: Date) {
  const xmas = new Date(now.getFullYear(), 11, 25);
  // Stay on "Merry Christmas" for the whole day.
  if (now >= new Date(now.getFullYear(), 11, 26)) xmas.setFullYear(now.getFullYear() + 1);
  return xmas;
}

const pad = (n: number) => String(n).padStart(2, "0");

/** "24 sleeps until Christmas", ticking every second. */
export default function Countdown() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- clock only exists on the client
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const shell = "panel flex min-h-[112px] items-end gap-3.5 px-5 py-5";

  if (!now) return <section aria-hidden className={shell} />;

  const target = nextChristmas(now);
  const diff = target.getTime() - now.getTime();

  if (diff <= 0) {
    return (
      <section className={`${shell} items-center justify-center`}>
        <p className="font-display text-4xl font-bold text-gold">Merry Christmas!</p>
      </section>
    );
  }

  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor(diff / 3_600_000) % 24;
  const mins = Math.floor(diff / 60_000) % 60;
  const secs = Math.floor(diff / 1000) % 60;

  return (
    <section aria-label="Countdown to Christmas" className={shell}>
      <span className="font-display text-[72px] font-bold leading-[0.85] text-gold tabular-nums">{days}</span>
      <div className="flex flex-col gap-1.5 pb-1">
        <span className="font-display text-[19px] font-semibold leading-tight whitespace-nowrap">
          {days === 1 ? "sleep" : "sleeps"} until Christmas
        </span>
        <span className="text-sm text-mist tabular-nums">
          {pad(hours)} hrs · {pad(mins)} min · {pad(secs)} sec
        </span>
      </div>
    </section>
  );
}

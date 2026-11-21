"use client";

import { useEffect, useState } from "react";

function nextChristmas(now: Date) {
  const xmas = new Date(now.getFullYear(), 11, 25);
  // Stay on "It's Christmas!" for the whole day.
  if (now >= new Date(now.getFullYear(), 11, 26)) xmas.setFullYear(now.getFullYear() + 1);
  return xmas;
}

export default function Countdown() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- clock only exists on the client
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  if (!now) return <div className="h-[92px]" aria-hidden />;

  const target = nextChristmas(now);
  const diff = target.getTime() - now.getTime();

  if (diff <= 0) {
    return (
      <div className="py-4 text-center font-display text-4xl font-bold text-berry animate-pop-in">
        🎄 Merry Christmas! 🎄
      </div>
    );
  }

  const units = [
    { label: "days", value: Math.floor(diff / 86_400_000) },
    { label: "hours", value: Math.floor(diff / 3_600_000) % 24 },
    { label: "mins", value: Math.floor(diff / 60_000) % 60 },
    { label: "secs", value: Math.floor(diff / 1000) % 60 },
  ];

  return (
    <div>
      <p className="mb-2 text-center text-sm font-semibold uppercase tracking-widest text-white/80">
        Countdown to Christmas
      </p>
      <div className="grid grid-cols-4 gap-2">
        {units.map((u) => (
          <div key={u.label} className="rounded-xl bg-white/15 px-1 py-2 text-center backdrop-blur-sm">
            <div className="text-3xl font-extrabold tabular-nums text-white sm:text-4xl">
              {String(u.value).padStart(2, "0")}
            </div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-white/75">
              {u.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { SnowflakeIcon } from "./Icons";

const STORAGE_KEY = "santa:snow";
const EVENT = "santa:snow-change";

function readPref(): boolean {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return saved === "on";
  } catch {
    /* storage unavailable */
  }
  return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Subscribe to the snow on/off preference (shared between <Snow> and <SnowToggle>). */
function useSnowPref(): [boolean, (on: boolean) => void] {
  const [on, setOn] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read browser-only prefs after mount
    setOn(readPref());
    const sync = () => setOn(readPref());
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  const set = (next: boolean) => {
    try {
      localStorage.setItem(STORAGE_KEY, next ? "on" : "off");
    } catch {}
    setOn(next);
    window.dispatchEvent(new Event(EVENT));
  };
  return [on, set];
}

/** Gentle falling snow on a fixed canvas behind everything. */
export default function Snow() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [on] = useSnowPref();

  useEffect(() => {
    if (!on) return;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let w = 0;
    let h = 0;
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const count = Math.min(90, Math.round((w * h) / 14000));
    const flakes = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: 1 + Math.random() * 2.6,
      speed: 0.3 + Math.random() * 0.9,
      drift: Math.random() * Math.PI * 2,
    }));

    let frame = 0;
    const tick = () => {
      ctx.clearRect(0, 0, w, h);
      for (const f of flakes) {
        f.y += f.speed;
        f.drift += 0.01;
        f.x += Math.sin(f.drift) * 0.4;
        if (f.y > h + 5) {
          f.y = -5;
          f.x = Math.random() * w;
        }
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${0.25 + f.r / 7})`;
        ctx.fill();
      }
      frame = requestAnimationFrame(tick);
    };
    tick();
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
    };
  }, [on]);

  if (!on) return null;
  return <canvas ref={canvasRef} aria-hidden className="pointer-events-none fixed inset-0 z-0 h-full w-full" />;
}

/** The snowflake button in the header. */
export function SnowToggle() {
  const [on, setOn] = useSnowPref();
  return (
    <button
      onClick={() => setOn(!on)}
      aria-label={on ? "Turn snow off" : "Turn snow on"}
      aria-pressed={on}
      title={on ? "Turn snow off" : "Let it snow"}
      className={`grid h-11 w-11 place-items-center rounded-full transition hover:bg-white/10 ${on ? "text-gold" : "text-mist/70"}`}
    >
      <SnowflakeIcon size={20} />
    </button>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";

const STORAGE_KEY = "santa:snow";

/** Gentle falling snow on a fixed canvas. Toggle with the ❄️ button; respects reduced motion. */
export default function Snow() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [on, setOn] = useState(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- read browser-only prefs after mount
      setOn(saved ? saved === "on" : !reduced);
    } catch {
      /* storage unavailable: keep default */
    }
  }, []);

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
      r: 1 + Math.random() * 2.8,
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
        ctx.fillStyle = `rgba(160, 190, 210, ${0.35 + f.r / 8})`;
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

  const toggle = () => {
    const next = !on;
    setOn(next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? "on" : "off");
    } catch {}
  };

  return (
    <>
      {on && (
        <canvas
          ref={canvasRef}
          aria-hidden
          className="pointer-events-none fixed inset-0 z-0 h-full w-full"
        />
      )}
      <button
        onClick={toggle}
        title={on ? "Turn snow off" : "Let it snow"}
        aria-label={on ? "Turn snow off" : "Turn snow on"}
        className="fixed bottom-20 right-3 z-50 grid h-9 w-9 sm:bottom-4 place-items-center rounded-full bg-white/80 text-lg shadow ring-1 ring-ink/10 backdrop-blur transition hover:scale-105"
        style={{ opacity: on ? 1 : 0.55 }}
      >
        ❄️
      </button>
    </>
  );
}

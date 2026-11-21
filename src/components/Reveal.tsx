"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import Avatar from "./Avatar";

type Person = { id: number; name: string; emoji: string };

const CONFETTI_COLORS = ["#b3202e", "#1f5a3d", "#d9a441", "#ffffff", "#e45c6b", "#5aa27c"];

// Deterministic "random" numbers so server and client render identical confetti.
const rand = (i: number, salt: number) => {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

const CONFETTI = Array.from({ length: 60 }, (_, i) => ({
  i,
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  dx: `${(rand(i, 1) - 0.5) * 520}px`,
  dy: `${120 + rand(i, 2) * 260}px`,
  rot: `${rand(i, 3) * 720 - 360}deg`,
  delay: `${rand(i, 4) * 0.25}s`,
  w: 6 + rand(i, 5) * 6,
  round: rand(i, 6) > 0.6,
}));

/**
 * The big moment: a wrapped present the user taps to unwrap, revealing who
 * they're Secret Santa for. `onOpened` records that they've seen it.
 */
export default function Reveal({
  person,
  alreadySeen,
  onOpened,
  title = "You're Secret Santa for…",
}: {
  person: Person;
  alreadySeen: boolean;
  onOpened?: () => Promise<void>;
  title?: string;
}) {
  const [stage, setStage] = useState<"wrapped" | "opening" | "open">(alreadySeen ? "open" : "wrapped");
  const [, startTransition] = useTransition();

  const open = () => {
    if (stage !== "wrapped") return;
    setStage("opening");
    if (onOpened) startTransition(() => onOpened());
    setTimeout(() => setStage("open"), 1000);
  };

  if (stage !== "open") {
    return (
      <button
        onClick={open}
        className="group relative mx-auto flex flex-col items-center py-6 outline-none"
        aria-label="Unwrap your present"
      >
        <div className={`relative ${stage === "wrapped" ? "animate-wiggle" : ""}`}>
          {/* Lid */}
          <div className={`relative z-10 ${stage === "opening" ? "animate-lid-off" : ""}`}>
            <div className="absolute -top-9 left-1/2 flex -translate-x-1/2 gap-0">
              <div className="h-10 w-12 -rotate-[25deg] rounded-[50%_50%_10%_50%] border-[6px] border-gold" />
              <div className="h-10 w-12 rotate-[25deg] rounded-[50%_50%_50%_10%] border-[6px] border-gold" />
            </div>
            <div className="relative h-10 w-52 rounded-md bg-berry-dark shadow-lg">
              <div className="absolute inset-y-0 left-1/2 w-6 -translate-x-1/2 bg-gold" />
            </div>
          </div>
          {/* Box */}
          <div className={`relative -mt-1 h-40 w-48 mx-auto rounded-b-md bg-berry shadow-xl ${stage === "opening" ? "animate-box-away" : ""}`}>
            <div className="absolute inset-y-0 left-1/2 w-6 -translate-x-1/2 bg-gold" />
            <div className="absolute inset-0 rounded-b-md bg-[radial-gradient(circle,rgba(255,255,255,0.25)_2px,transparent_2.5px)] bg-[length:18px_18px]" />
          </div>
        </div>
        <span className="mt-6 rounded-full bg-white/90 px-5 py-2 font-bold text-berry shadow transition group-hover:scale-105">
          {stage === "wrapped" ? "Tap to unwrap 🎁" : "Ooh…"}
        </span>
      </button>
    );
  }

  return (
    <div className="relative flex flex-col items-center py-4 text-center">
      {!alreadySeen && (
        <div className="pointer-events-none absolute left-1/2 top-10" aria-hidden>
          {CONFETTI.map((c) => (
            <span
              key={c.i}
              className="absolute block"
              style={
                {
                  width: c.w,
                  height: c.round ? c.w : c.w * 0.45,
                  borderRadius: c.round ? "50%" : 2,
                  background: c.color,
                  "--dx": c.dx,
                  "--dy": c.dy,
                  "--rot": c.rot,
                  animation: `confetti-fall 1.8s ${c.delay} cubic-bezier(.2,.6,.4,1) forwards`,
                } as React.CSSProperties
              }
            />
          ))}
        </div>
      )}
      <p className="text-sm font-bold uppercase tracking-widest text-white/80">{title}</p>
      <div className={alreadySeen ? "" : "animate-pop-in"}>
        <Avatar emoji={person.emoji} size="xl" className="mt-4 animate-float" />
        <h2 className="mt-3 font-display text-5xl font-bold text-white drop-shadow sm:text-6xl">
          {person.name}
        </h2>
      </div>
      <Link href={`/boards/${person.id}`} className="btn mt-5 bg-white text-berry shadow-lg hover:bg-cream">
        See {person.name}&apos;s board →
      </Link>
    </div>
  );
}

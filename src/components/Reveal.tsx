"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import Avatar from "./Avatar";

type Person = { id: number; name: string; ornament: string };

const CONFETTI_COLORS = ["#f2b544", "#d2394a", "#5fb08f", "#f4efe6", "#6e95d1", "#ffd27a"];

// Deterministic "random" numbers so server and client render identical confetti.
const rand = (i: number, salt: number) => {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

const CONFETTI = Array.from({ length: 60 }, (_, i) => ({
  i,
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  dx: `${(rand(i, 1) - 0.5) * 520}px`,
  dy: `${120 + rand(i, 2) * 300}px`,
  rot: `${rand(i, 3) * 720 - 360}deg`,
  delay: `${rand(i, 4) * 0.25}s`,
  w: 6 + rand(i, 5) * 6,
  round: rand(i, 6) > 0.6,
}));

// A few static flecks around the tag once it has been opened before.
const FLECKS = [
  "left-[34px] top-[70px] h-2 w-2 rotate-[30deg] rounded-[2px] bg-gold",
  "left-[70px] top-[190px] h-1.5 w-1.5 rounded-full bg-cranberry",
  "right-[40px] top-[96px] h-1 w-2.5 -rotate-[40deg] rounded-[2px] bg-[#5fb08f]",
  "right-[62px] top-[220px] h-[7px] w-[7px] rounded-full bg-snow",
  "right-[28px] top-[160px] h-2 w-2 rotate-12 rounded-[2px] bg-gold",
  "left-[24px] top-[250px] h-1 w-2.5 rotate-[50deg] rounded-[2px] bg-cranberry",
];

/**
 * The big moment: a wrapped present the user taps to unwrap, revealing a
 * gift tag with the person's name. `onOpened` records that they've seen it.
 * variant "santa" is the Christmas-day reveal of who *your* Santa was.
 */
export default function Reveal({
  person,
  alreadySeen,
  onOpened,
  variant = "giftee",
}: {
  person: Person;
  alreadySeen: boolean;
  onOpened?: () => Promise<void>;
  variant?: "giftee" | "santa";
}) {
  const [stage, setStage] = useState<"wrapped" | "opening" | "open">(alreadySeen ? "open" : "wrapped");
  const [justOpened, setJustOpened] = useState(false);
  const [, startTransition] = useTransition();

  const open = () => {
    if (stage !== "wrapped") return;
    setStage("opening");
    if (onOpened) startTransition(() => onOpened());
    setTimeout(() => {
      setStage("open");
      setJustOpened(true);
    }, 1000);
  };

  const isSanta = variant === "santa";

  return (
    <section
      aria-label={isSanta ? "Your Secret Santa" : "Your assignment"}
      className="relative overflow-hidden rounded-[28px] bg-deep shadow-[inset_0_0_0_1px_rgb(242_181_68/0.25)]"
      style={{ backgroundImage: "radial-gradient(circle at 50% 40%, rgb(242 181 68 / 0.3), transparent 62%)" }}
    >
      {stage !== "open" ? (
        <button
          onClick={open}
          className="group flex w-full flex-col items-center gap-6 px-5 pb-7 pt-8 outline-none"
          aria-label={isSanta ? "Unwrap to see who your Secret Santa was" : "Unwrap your present"}
        >
          <span className="eyebrow text-gold">
            {isSanta ? "The secret is out" : "Names have been drawn"}
          </span>
          <Present opening={stage === "opening"} />
          <span className="btn-gold pointer-events-none px-8 text-[17px] group-focus-visible:ring-4 group-focus-visible:ring-gold/40">
            {stage === "wrapped" ? "Tap to unwrap" : "Ooh…"}
          </span>
          <span className="text-sm text-mist">
            {isSanta ? "Find out who was buying for you." : "Make sure nobody's reading over your shoulder."}
          </span>
        </button>
      ) : (
        <div className="relative flex flex-col items-center gap-5 px-5 pb-6">
          {justOpened ? (
            <div className="pointer-events-none absolute left-1/2 top-24" aria-hidden>
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
          ) : (
            FLECKS.map((f) => <span key={f} aria-hidden className={`absolute ${f}`} />)
          )}

          <div className={`flex flex-col items-center ${justOpened ? "animate-tag-drop" : "animate-sway"}`}>
            <div aria-hidden className="h-12 w-0.5 bg-tan" />
            <GiftTag person={person} isSanta={isSanta} />
          </div>

          <div className="flex w-full flex-col gap-2.5">
            <Link href={`/boards/${person.id}`} className="btn-gold">
              See {person.name}&apos;s wish board
            </Link>
            {!isSanta && (
              <Link href="/messages?with=giftee" className="btn-outline">
                Message {person.name} anonymously
              </Link>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function GiftTag({ person, isSanta }: { person: Person; isSanta: boolean }) {
  return (
    <div className="gift-tag relative -mt-3 flex w-60 flex-col items-center gap-1.5 rounded-2xl bg-ivory px-6 pb-6 pt-10 text-center text-ink shadow-[0_22px_40px_-16px_rgb(0_0_0/0.6)]">
      <span aria-hidden className="absolute left-1/2 top-3.5 h-3.5 w-3.5 -translate-x-1/2 rounded-full bg-deep shadow-[0_0_0_3px_var(--color-tan)]" />
      <span className="eyebrow text-bronze">{isSanta ? "Your Secret Santa was" : "You're Santa for"}</span>
      <Avatar name={person.name} ornament={person.ornament} size="lg" className="mt-2" />
      <span className="font-display text-5xl font-bold leading-none break-words">{person.name}</span>
      <span aria-hidden className="mb-1 mt-2 h-px w-28 bg-line" />
      <span className="text-[13px] text-muted">
        {isSanta ? (
          "Merry Christmas!"
        ) : (
          <>
            From: <span className="italic">you know who</span>
          </>
        )}
      </span>
    </div>
  );
}

function Present({ opening }: { opening: boolean }) {
  return (
    <div aria-hidden className={`relative flex h-[200px] w-[190px] flex-col items-center justify-end ${opening ? "" : "animate-wiggle"}`}>
      <div className={`relative z-10 flex flex-col items-center ${opening ? "animate-lid-off" : ""}`}>
        <div className="absolute -top-[38px] left-[48px] h-[34px] w-[46px] -rotate-[24deg] rounded-[50%_50%_10%_50%] border-[7px] border-gold" />
        <div className="absolute -top-[38px] left-[92px] h-[34px] w-[46px] rotate-[24deg] rounded-[50%_50%_50%_10%] border-[7px] border-gold" />
        <div className="relative h-[42px] w-[190px] rounded-lg bg-cranberry-dark shadow-[0_6px_0_rgb(0_0_0/0.18)]">
          <div className="absolute left-1/2 top-0 h-full w-[26px] -translate-x-1/2 bg-gold" />
        </div>
      </div>
      <div className={`relative h-[132px] w-[170px] rounded-b-[10px] bg-cranberry ${opening ? "animate-box-away" : ""}`}>
        <div className="absolute left-1/2 top-0 h-full w-[26px] -translate-x-1/2 bg-gold" />
        <div className="absolute inset-0 rounded-b-[10px] bg-[radial-gradient(circle,rgb(255_255_255/0.22)_2px,transparent_2.6px)] bg-[length:20px_20px]" />
      </div>
    </div>
  );
}

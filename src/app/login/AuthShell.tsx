import type { ReactNode } from "react";
import { StarIcon } from "@/components/Icons";

const BULBS = [
  [32, 30, "#f2b544"], [78, 33, "#d2394a"], [128, 22, "#5fb08f"], [176, 28, "#f2b544"],
  [222, 26, "#d2394a"], [272, 20, "#6e95d1"], [320, 24, "#f2b544"], [366, 19, "#5fb08f"],
] as const;

/** Sign-in pages: fairy lights across the top, a snowy hill with pines at the bottom. */
export default function AuthShell({
  title,
  subtitle,
  children,
  star = true,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  star?: boolean;
}) {
  return (
    <main className="relative z-10 flex min-h-dvh flex-col items-center overflow-hidden">
      <svg aria-hidden viewBox="0 0 390 70" preserveAspectRatio="none" className="block h-[70px] w-full max-w-3xl shrink-0">
        <path d="M-10 10 Q 50 48 110 18 T 230 22 T 400 14" fill="none" stroke="#2b3d57" strokeWidth="2" />
        {BULBS.map(([x, y, c], i) => (
          <ellipse
            key={x}
            cx={x}
            cy={y}
            rx="6"
            ry="9"
            fill={c}
            className="animate-twinkle"
            style={{ animationDelay: `${(i % 3) * 0.6}s` }}
          />
        ))}
      </svg>

      <div className="flex flex-col items-center gap-2.5 px-8 pb-8 pt-8 text-center">
        {star && <StarIcon size={56} className="text-gold" />}
        <h1 className="mt-1.5 font-display text-[46px] font-bold leading-none">{title}</h1>
        <p className="text-base text-haze">{subtitle}</p>
      </div>

      <div className="w-full max-w-sm px-4">
        <div className="card p-6">{children}</div>
      </div>

      <svg aria-hidden viewBox="0 0 390 190" preserveAspectRatio="xMidYMax slice" className="mt-auto block h-[190px] w-full">
        <path d="M0 120 Q 100 90 200 118 T 390 104 V190 H0 Z" fill="#1b2c45" />
        <path d="M60 140 l22 -44 l22 44 z M66 118 l16 -30 l16 30 z" fill="#2f6b57" />
        <path d="M300 132 l26 -56 l26 56 z M307 104 l19 -38 l19 38 z" fill="#2f6b57" />
        <path d="M250 150 l14 -28 l14 28 z" fill="#2f6b57" />
        <path d="M0 160 Q 120 132 230 156 T 390 148 V190 H0 Z" fill="#f4efe6" />
      </svg>
    </main>
  );
}

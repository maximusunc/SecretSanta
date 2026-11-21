"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = { href: string; label: string; icon: string; badge?: number };

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

/** Bottom tab bar on phones, top pill nav on larger screens. */
export default function NavLinks({ items }: { items: Item[] }) {
  const pathname = usePathname();
  return (
    <>
      <nav className="hidden items-center gap-1 sm:flex">
        {items.map((it) => (
          <Link
            key={it.href}
            href={it.href}
            className={`relative rounded-full px-4 py-2 text-sm font-semibold transition ${
              isActive(pathname, it.href) ? "bg-white text-berry shadow" : "text-white/90 hover:bg-white/15"
            }`}
          >
            {it.label}
            {!!it.badge && <Badge n={it.badge} />}
          </Link>
        ))}
      </nav>

      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-ink/10 bg-paper/95 backdrop-blur sm:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="mx-auto flex max-w-md">
          {items.map((it) => {
            const active = isActive(pathname, it.href);
            return (
              <Link
                key={it.href}
                href={it.href}
                className={`relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-bold ${
                  active ? "text-berry" : "text-muted"
                }`}
              >
                <span className={`text-xl transition ${active ? "scale-110" : "grayscale-[60%]"}`}>
                  {it.icon}
                </span>
                {it.label}
                {!!it.badge && <Badge n={it.badge} />}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

function Badge({ n }: { n: number }) {
  return (
    <span className="absolute right-1/4 top-1 grid h-5 min-w-5 place-items-center rounded-full bg-gold px-1 text-[11px] font-bold text-ink sm:-right-1 sm:-top-1">
      {n}
    </span>
  );
}

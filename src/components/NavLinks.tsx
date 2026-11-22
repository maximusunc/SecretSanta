"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BoardsIcon, ChatIcon, ClockIcon, GearIcon, HomeIcon } from "./Icons";

const ICONS = { home: HomeIcon, boards: BoardsIcon, messages: ChatIcon, history: ClockIcon, admin: GearIcon };
type Item = { href: string; label: string; icon: keyof typeof ICONS; badge?: number };

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

/** Bottom tab bar on phones, pill nav in the header on larger screens. */
export default function NavLinks({ items }: { items: Item[] }) {
  const pathname = usePathname();
  return (
    <>
      <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
        {items.map((it) => {
          const active = isActive(pathname, it.href);
          return (
            <Link
              key={it.href}
              href={it.href}
              aria-current={active ? "page" : undefined}
              className={`relative rounded-full px-4 py-2 text-sm font-bold transition ${
                active ? "bg-gold text-ink" : "text-haze hover:bg-white/10 hover:text-snow"
              }`}
            >
              {it.label}
              {!!it.badge && (
                <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-cranberry shadow-[0_0_0_2px_var(--color-midnight)]" />
              )}
            </Link>
          );
        })}
      </nav>

      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-abyss/95 backdrop-blur md:hidden"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom), 12px)" }}
      >
        <div className="mx-auto flex max-w-md px-2 pt-2">
          {items.map((it) => {
            const active = isActive(pathname, it.href);
            const Icon = ICONS[it.icon];
            return (
              <Link
                key={it.href}
                href={it.href}
                aria-current={active ? "page" : undefined}
                className={`relative flex flex-1 flex-col items-center gap-1 py-1.5 text-xs ${
                  active ? "font-bold text-gold" : "font-medium text-mist"
                }`}
              >
                <Icon />
                {it.label}
                {!!it.badge && (
                  <span className="absolute left-[54%] top-1 h-2.5 w-2.5 rounded-full bg-cranberry shadow-[0_0_0_2px_var(--color-abyss)]">
                    <span className="sr-only">{it.badge} unread</span>
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

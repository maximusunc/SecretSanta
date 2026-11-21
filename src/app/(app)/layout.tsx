import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getCurrentExchange } from "@/lib/exchanges";
import { unreadCount } from "@/lib/messages";
import Avatar from "@/components/Avatar";
import NavLinks from "@/components/NavLinks";
import { SnowToggle } from "@/components/Snow";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await requireUser();
  const ex = getCurrentExchange();
  const unread = ex ? unreadCount(ex.id, user.id) : 0;

  const items = [
    { href: "/", label: "Home", icon: "home" as const },
    { href: "/boards", label: "Boards", icon: "boards" as const },
    { href: "/messages", label: "Messages", icon: "messages" as const, badge: unread },
    { href: "/history", label: "History", icon: "history" as const },
    ...(user.isAdmin ? [{ href: "/admin", label: "Admin", icon: "admin" as const }] : []),
  ];

  return (
    <div className="relative z-10 flex min-h-dvh flex-col">
      <header className="mx-auto flex w-full max-w-5xl items-center gap-4 px-5 pb-2 pt-4">
        <Link href="/" className="font-display text-2xl font-bold">
          Secret Santa{ex && <span className="text-gold"> {ex.year}</span>}
        </Link>
        <div className="ml-auto flex items-center gap-2 md:gap-4">
          <NavLinks items={items} />
          <SnowToggle />
          <Link href="/account" aria-label="Your account" className="rounded-full transition hover:scale-105">
            <Avatar name={user.name} ornament={user.ornament} ring />
          </Link>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-5 pb-32 pt-3 md:pb-14">{children}</main>
    </div>
  );
}

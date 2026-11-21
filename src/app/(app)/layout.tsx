import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getCurrentExchange } from "@/lib/exchanges";
import { unreadCount } from "@/lib/messages";
import Avatar from "@/components/Avatar";
import NavLinks from "@/components/NavLinks";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await requireUser();
  const ex = getCurrentExchange();
  const unread = ex ? unreadCount(ex.id, user.id) : 0;

  const items = [
    { href: "/", label: "Home", icon: "🏠" },
    { href: "/boards", label: "Boards", icon: "📌" },
    { href: "/messages", label: "Messages", icon: "💌", badge: unread },
    { href: "/history", label: "History", icon: "📜" },
    ...(user.isAdmin ? [{ href: "/admin", label: "Admin", icon: "⚙️" }] : []),
  ];

  return (
    <div className="relative z-10 flex min-h-dvh flex-col">
      <header className="bg-gradient-to-br from-berry to-berry-dark text-white shadow-lg">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
          <Link href="/" className="font-display text-3xl font-bold leading-none tracking-wide">
            Secret Santa
            {ex && <span className="ml-2 text-xl text-gold">{ex.year}</span>}
          </Link>
          <div className="ml-auto flex items-center gap-3">
            <NavLinks items={items} />
            <Link href="/account" title="Your account" className="transition hover:scale-105">
              <Avatar emoji={user.emoji} size="sm" />
            </Link>
          </div>
        </div>
        <div className="candy-stripe h-1.5 opacity-90" />
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-28 pt-5 sm:pb-12">{children}</main>
    </div>
  );
}

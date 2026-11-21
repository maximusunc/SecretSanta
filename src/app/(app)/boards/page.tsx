import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { boardSummaries } from "@/lib/board";
import { getCurrentExchange, getMyAssignment } from "@/lib/exchanges";
import { imageSrc } from "@/lib/imageSrc";
import { listUsers } from "@/lib/users";
import Avatar from "@/components/Avatar";

export default async function BoardsPage() {
  const user = await requireUser();
  const users = listUsers();
  const summaries = boardSummaries();
  const ex = getCurrentExchange();
  const giftee = ex ? getMyAssignment(ex.id, user.id)?.receiverId : undefined;

  // Your giftee first, then you, then everyone else.
  const ordered = [...users].sort(
    (a, b) =>
      Number(b.id === giftee) - Number(a.id === giftee) ||
      Number(b.id === user.id) - Number(a.id === user.id),
  );

  return (
    <div>
      <h1 className="font-display text-4xl font-bold">Wish boards</h1>
      <p className="mb-5 text-muted">Everyone&apos;s ideas, links and inspiration.</p>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {ordered.map((u) => {
          const s = summaries.get(u.id);
          return (
            <Link
              key={u.id}
              href={`/boards/${u.id}`}
              className={`card group overflow-hidden transition hover:-translate-y-1 ${u.id === giftee ? "ring-4 ring-gold" : ""}`}
            >
              <div className="grid aspect-[4/3] grid-cols-2 grid-rows-2 gap-0.5 bg-frost">
                {Array.from({ length: 4 }, (_, i) => {
                  const item = s?.covers[i];
                  const src = item ? imageSrc(item) : null;
                  return src ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={i} src={src} alt="" className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <div key={i} className="grid place-items-center text-2xl opacity-30">
                      {["🎁", "❄️", "🎄", "⭐"][i]}
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center gap-2 p-3">
                <Avatar emoji={u.emoji} size="sm" />
                <div className="min-w-0">
                  <div className="truncate font-bold">{u.id === user.id ? "Your board" : u.name}</div>
                  <div className="text-xs text-muted">
                    {u.id === giftee ? "🎯 Your giftee · " : ""}
                    {s?.count ?? 0} ideas
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

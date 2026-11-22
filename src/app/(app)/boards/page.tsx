import Link from "next/link";
import { requireUser, type User } from "@/lib/auth";
import { boardSummaries, type BoardItem } from "@/lib/board";
import { getCurrentExchange, getMyAssignment } from "@/lib/exchanges";
import { imageSrc } from "@/lib/imageSrc";
import { listUsers } from "@/lib/users";
import { timeAgo } from "@/lib/dates";
import Avatar from "@/components/Avatar";

const EMPTY_TILES = ["#2a3e5c", "#33496b", "#24374f", "#3a4f70"];
const LIGHT_TILES = ["#e7dcc6", "#dce6f2", "#d7e6de", "#f3d7cf", "#efe3c3"];

function Tile({ item, fallback }: { item?: BoardItem; fallback: string }) {
  const src = item ? imageSrc(item) : null;
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" />
  ) : (
    <div className="h-full w-full" style={{ background: fallback }} />
  );
}

const countLabel = (n: number) => (n === 0 ? "Nothing yet" : `${n} idea${n === 1 ? "" : "s"}`);

export default async function BoardsPage() {
  const user = await requireUser();
  const users = listUsers();
  const summaries = boardSummaries();
  const ex = getCurrentExchange();
  const gifteeId = ex ? getMyAssignment(ex.id, user.id)?.receiverId : undefined;
  const giftee = users.find((u) => u.id === gifteeId);

  // You first, then everyone else (your giftee is featured above).
  const rest = users
    .filter((u) => u.id !== gifteeId)
    .sort((a, b) => Number(b.id === user.id) - Number(a.id === user.id));

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <h1 className="font-display text-4xl font-semibold leading-tight">Wish boards</h1>
        <p className="text-[15px] text-haze">Everyone&apos;s ideas, links and inspiration.</p>
      </div>

      {giftee && <FeaturedBoard giftee={giftee} summary={summaries.get(giftee.id)} />}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {rest.map((u, i) => {
          const s = summaries.get(u.id);
          return (
            <Link
              key={u.id}
              href={`/boards/${u.id}`}
              className="panel flex flex-col overflow-hidden transition hover:-translate-y-1"
            >
              <div className="grid h-28 grid-cols-2 grid-rows-2 gap-0.5">
                {[0, 1, 2, 3].map((t) => (
                  <Tile key={t} item={s?.covers[t]} fallback={EMPTY_TILES[(i + t) % 4]} />
                ))}
              </div>
              <div className="flex items-center gap-2.5 p-3">
                <Avatar name={u.name} ornament={u.ornament} size="sm" />
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-[15px] font-bold">{u.id === user.id ? "Your board" : u.name}</span>
                  <span className="text-xs text-mist">{countLabel(s?.count ?? 0)}</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function FeaturedBoard({ giftee, summary }: { giftee: User; summary?: { count: number; covers: BoardItem[] } }) {
  const latest = summary?.covers[0]?.createdAt;
  return (
    <Link
      href={`/boards/${giftee.id}`}
      className="card flex flex-col overflow-hidden shadow-[0_0_0_3px_var(--color-gold)] transition hover:-translate-y-1"
    >
      <div className="grid h-40 grid-cols-3 grid-rows-2 gap-[3px]">
        <div className="row-span-2">
          <Tile item={summary?.covers[0]} fallback={LIGHT_TILES[0]} />
        </div>
        {[1, 2, 3].map((t) => (
          <Tile key={t} item={summary?.covers[t]} fallback={LIGHT_TILES[t]} />
        ))}
        <div className="h-full w-full" style={{ background: LIGHT_TILES[4] }} />
      </div>
      <div className="flex items-center gap-3 px-4 py-3.5">
        <Avatar name={giftee.name} ornament={giftee.ornament} />
        <div className="flex flex-1 flex-col gap-0.5">
          <span className="font-display text-[22px] font-bold leading-tight">{giftee.name}</span>
          <span className="text-[13px] text-muted">
            {countLabel(summary?.count ?? 0)}
            {latest ? ` · updated ${timeAgo(latest)}` : ""}
          </span>
        </div>
        <span className="eyebrow rounded-full bg-ink px-3 py-1.5 text-[11px] tracking-[0.08em] text-gold">Your giftee</span>
      </div>
    </Link>
  );
}

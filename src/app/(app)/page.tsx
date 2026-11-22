import Link from "next/link";
import { requireUser, type User } from "@/lib/auth";
import { listItems } from "@/lib/board";
import { boardSummaries } from "@/lib/board";
import { imageSrc } from "@/lib/imageSrc";
import {
  getCurrentExchange,
  getMyAssignment,
  getMySanta,
  isRevealed,
  type Exchange,
} from "@/lib/exchanges";
import { unreadCount } from "@/lib/messages";
import { listUsers } from "@/lib/users";
import NameTag from "@/components/NameTag";
import Countdown from "@/components/Countdown";
import { BoardsIcon, MailIcon } from "@/components/Icons";
import Reveal from "@/components/Reveal";
import RecipientPicker from "@/components/RecipientPicker";
import { markAssignmentSeen } from "../actions/exchange";
import { firstName } from "@/lib/ornaments";

function greeting() {
  const h = new Date().getHours();
  return h < 5 ? "Up late" : h < 12 ? "Morning" : h < 17 ? "Afternoon" : "Evening";
}

export default async function Dashboard() {
  const user = await requireUser();
  const ex = getCurrentExchange();
  const users = listUsers();
  const summaries = boardSummaries();
  const mine = ex ? getMyAssignment(ex.id, user.id) : null;
  const giftee = mine ? users.find((u) => u.id === mine.receiverId) : undefined;
  // Once you've unwrapped, your gift tag leads the page.
  const tagFirst = !!mine?.seenAt;

  const assignment = (
    <Assignment key="assignment" ex={ex} user={user} users={users} />
  );
  const countdown = (
    <div key="countdown" className="flex flex-col gap-3">
      <Countdown />
      {ex && <Coupons ex={ex} />}
    </div>
  );

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <div className="flex flex-col gap-1">
        <span className="eyebrow text-mist">
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </span>
        <h1 className="font-display text-4xl font-semibold leading-tight">
          {greeting()}, {firstName(user.name)}.
        </h1>
      </div>

      {tagFirst ? [assignment, countdown] : [countdown, assignment]}

      {ex && isRevealed(ex) && <SantaReveal ex={ex} user={user} users={users} />}

      {tagFirst && giftee && <GifteePeek giftee={giftee} />}

      <div className="grid grid-cols-2 gap-3">
        <MessagesCard ex={ex} user={user} />
        <Link href={`/boards/${user.id}`} className="card flex flex-col gap-2.5 p-4 transition hover:-translate-y-0.5">
          <BoardsIcon size={26} className="text-spruce" />
          <span className="font-bold">Your wish board</span>
          <span className="text-[13px] text-muted">
            {(summaries.get(user.id)?.count ?? 0) === 0
              ? "Empty. Add a few ideas!"
              : `${summaries.get(user.id)!.count} ideas pinned`}
          </span>
        </Link>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-2xl font-semibold">The family</h2>
        <div className="flex flex-wrap gap-3">
          {users.map((u) => (
            <Link
              key={u.id}
              href={`/boards/${u.id}`}
              aria-label={u.id === user.id ? "Your board" : `${firstName(u.name)}'s board`}
              className="rounded-full p-0.5 transition hover:-translate-y-0.5"
            >
              <NameTag name={u.name} ornament={u.ornament} size="lg" ring={u.id === user.id} />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function Coupons({ ex }: { ex: Exchange }) {
  if (!ex.budget && !ex.exchangeDate) return null;
  const date = ex.exchangeDate
    ? new Date(`${ex.exchangeDate}T00:00`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
    : null;
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {ex.budget && (
        <div className="flex flex-col gap-0.5 rounded-[18px] border-[1.5px] border-dashed border-gold/55 px-4 py-3.5">
          <span className="eyebrow text-[11px] text-mist">Budget</span>
          <span className="font-display text-2xl font-bold text-gold">{ex.budget}</span>
        </div>
      )}
      {date && (
        <div className="flex flex-col gap-0.5 rounded-[18px] border-[1.5px] border-dashed border-gold/55 px-4 py-3.5">
          <span className="eyebrow text-[11px] text-mist">Exchange</span>
          <span className="font-display text-2xl font-bold">{date}</span>
        </div>
      )}
    </div>
  );
}

function Assignment({ ex, user, users }: { ex: Exchange | null; user: User; users: User[] }) {
  if (!ex) {
    return (
      <Waiting title="The reindeer are still resting">
        No exchange has been set up yet.
        {user.isAdmin && (
          <>
            {" "}
            <Link href="/admin" className="font-bold underline">Set one up in Admin</Link>.
          </>
        )}
      </Waiting>
    );
  }

  const mine = getMyAssignment(ex.id, user.id);
  const others = users.filter((u) => u.id !== user.id);

  if (!mine) {
    if (ex.mode === "manual") {
      return (
        <section className="flex flex-col gap-4 rounded-[28px] bg-deep p-5 shadow-[inset_0_0_0_1px_rgb(242_181_68/0.25)]">
          <span className="eyebrow text-gold">Drawn on paper this year</span>
          <h2 className="font-display text-3xl font-semibold">Who did you draw?</h2>
          <p className="text-haze">
            Tell us who you have so you can message them anonymously. Only you will ever see this.
          </p>
          <div className="card p-4">
            <RecipientPicker exchangeId={ex.id} users={others} />
          </div>
        </section>
      );
    }
    return (
      <Waiting title="Names haven't been drawn yet">
        The elves are still shaking the hat. Check back soon!
      </Waiting>
    );
  }

  const receiver = users.find((u) => u.id === mine.receiverId)!;
  return (
    <div className="flex flex-col gap-2">
      <Reveal
        person={{ id: receiver.id, name: firstName(receiver.name), ornament: receiver.ornament }}
        alreadySeen={mine.seenAt !== null}
        onOpened={markAssignmentSeen}
      />
      {ex.mode === "manual" && (
        <details className="text-center text-sm text-mist">
          <summary className="inline-flex min-h-11 cursor-pointer items-center">Wrong person?</summary>
          <div className="card mx-auto mt-2 max-w-sm p-4 text-left">
            <RecipientPicker exchangeId={ex.id} users={others} current={receiver.id} />
          </div>
        </details>
      )}
    </div>
  );
}

function SantaReveal({ ex, user, users }: { ex: Exchange; user: User; users: User[] }) {
  const santa = users.find((u) => u.id === getMySanta(ex.id, user.id));
  if (!santa) return null;
  return (
    <Reveal
      person={{ id: santa.id, name: firstName(santa.name), ornament: santa.ornament }}
      alreadySeen={false}
      variant="santa"
    />
  );
}

function GifteePeek({ giftee }: { giftee: User }) {
  const items = listItems(giftee.id);
  if (items.length === 0) return null;
  return (
    <section className="card flex flex-col gap-3 p-[18px]">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-[22px] font-semibold">New on {firstName(giftee.name)}&apos;s board</h2>
        <Link href={`/boards/${giftee.id}`} className="text-sm font-bold text-spruce hover:underline">
          All {items.length}
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {items.slice(0, 2).map((it) => {
          const src = imageSrc(it);
          return (
            <Link key={it.id} href={`/boards/${giftee.id}`} className="flex flex-col gap-1.5">
              {src ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={src} alt="" className="h-28 w-full rounded-2xl bg-paper object-cover" loading="lazy" />
              ) : (
                <div className="flex h-28 items-center rounded-2xl border-[1.5px] border-dashed border-[#c9bfad] p-3 font-display text-sm leading-snug">
                  {it.notes.slice(0, 80) || it.title}
                </div>
              )}
              <span className="line-clamp-2 text-sm font-bold">{it.title || it.siteName}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function MessagesCard({ ex, user }: { ex: Exchange | null; user: User }) {
  const unread = ex ? unreadCount(ex.id, user.id) : 0;
  return (
    <Link href="/messages" className="card flex flex-col gap-2.5 p-4 transition hover:-translate-y-0.5">
      <span className="flex items-center justify-between">
        <MailIcon size={26} className="text-cranberry" />
        {unread > 0 && (
          <span className="grid h-[22px] min-w-[22px] place-items-center rounded-full bg-cranberry px-1.5 text-xs font-bold text-white">
            {unread}
          </span>
        )}
      </span>
      <span className="font-bold">Secret messages</span>
      <span className="text-[13px] text-muted">
        {unread > 0 ? `${unread} new message${unread === 1 ? "" : "s"}` : "Ask a sneaky question"}
      </span>
    </Link>
  );
}

function Waiting({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section
      className="flex flex-col items-center gap-3 rounded-[28px] bg-deep px-6 py-10 text-center shadow-[inset_0_0_0_1px_rgb(242_181_68/0.25)]"
      style={{ backgroundImage: "radial-gradient(circle at 50% 30%, rgb(242 181 68 / 0.18), transparent 60%)" }}
    >
      <svg aria-hidden width="48" height="48" viewBox="0 0 24 24" fill="currentColor" className="animate-twinkle text-gold">
        <path d="M12 1.5l2.6 6.9 7.4.3-5.8 4.6 2 7.2L12 16.4l-6.2 4.1 2-7.2L2 8.7l7.4-.3z" />
      </svg>
      <h2 className="font-display text-3xl font-semibold">{title}</h2>
      <p className="text-haze">{children}</p>
    </section>
  );
}

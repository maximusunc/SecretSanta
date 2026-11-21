import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { formatDate } from "@/lib/dates";
import {
  getCurrentExchange,
  getMyAssignment,
  getMySanta,
  isRevealed,
  type Exchange,
} from "@/lib/exchanges";
import { unreadCount } from "@/lib/messages";
import { boardSummaries } from "@/lib/board";
import { listUsers } from "@/lib/users";
import type { User } from "@/lib/auth";
import Avatar from "@/components/Avatar";
import Countdown from "@/components/Countdown";
import Reveal from "@/components/Reveal";
import RecipientPicker from "@/components/RecipientPicker";
import { markAssignmentSeen } from "../actions/exchange";

export default async function Dashboard() {
  const user = await requireUser();
  const ex = getCurrentExchange();
  const users = listUsers();
  const summaries = boardSummaries();
  const myItems = summaries.get(user.id)?.count ?? 0;

  return (
    <div className="space-y-5">
      <h1 className="font-display text-4xl font-bold text-ink">
        Ho ho ho, {user.name}! <span aria-hidden>{user.emoji}</span>
      </h1>

      <section className="card overflow-hidden bg-gradient-to-br from-pine to-pine-dark p-5">
        <Countdown />
      </section>

      {ex && <BudgetBanner ex={ex} />}

      <section className="card relative overflow-hidden bg-gradient-to-br from-berry via-berry to-berry-dark p-5 text-white">
        <Assignment ex={ex} user={user} users={users} />
      </section>

      {ex && isRevealed(ex) && <SantaReveal ex={ex} user={user} users={users} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <MessagesCard ex={ex} user={user} />
        <Link href={`/boards/${user.id}`} className="card flex items-center gap-4 p-5 transition hover:-translate-y-0.5">
          <span className="text-4xl" aria-hidden>📌</span>
          <div>
            <h2 className="text-lg font-bold">Your wish board</h2>
            <p className="text-sm text-muted">
              {myItems === 0
                ? "It's empty! Add a few ideas so your Santa has something to go on."
                : `${myItems} idea${myItems === 1 ? "" : "s"} pinned. Add more anytime.`}
            </p>
          </div>
        </Link>
      </div>

      <section>
        <h2 className="mb-3 font-display text-3xl font-bold">The family</h2>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {users.map((u) => (
            <Link key={u.id} href={`/boards/${u.id}`} className="flex w-20 shrink-0 flex-col items-center gap-1 text-center">
              <Avatar emoji={u.emoji} size="lg" />
              <span className="w-full truncate text-sm font-semibold">{u.id === user.id ? "You" : u.name}</span>
              <span className="text-xs text-muted">{summaries.get(u.id)?.count ?? 0} ideas</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function BudgetBanner({ ex }: { ex: Exchange }) {
  if (!ex.budget && !ex.exchangeDate) return null;
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1 rounded-2xl border-2 border-dashed border-gold bg-gold/10 px-4 py-3 text-center font-semibold">
      {ex.budget && (
        <span>
          💰 Budget: <span className="text-berry">{ex.budget}</span>
        </span>
      )}
      {ex.exchangeDate && (
        <span>
          🎁 Gift exchange: <span className="text-pine">{formatDate(ex.exchangeDate)}</span>
        </span>
      )}
    </div>
  );
}

function Assignment({ ex, user, users }: { ex: Exchange | null; user: User; users: User[] }) {
  if (!ex) {
    return (
      <Empty icon="🦌" title="The reindeer are still resting">
        No exchange has been set up yet.
        {user.isAdmin && (
          <>
            {" "}
            <Link href="/admin" className="underline">Set one up in Admin</Link>.
          </>
        )}
      </Empty>
    );
  }

  const mine = getMyAssignment(ex.id, user.id);

  if (!mine) {
    if (ex.mode === "manual") {
      return (
        <div>
          <h2 className="font-display text-3xl font-bold">Who did you draw?</h2>
          <p className="mt-1 text-white/85">
            This year&apos;s names were drawn outside the app. Tell us who you have so you can
            message them anonymously. Only you will ever see this.
          </p>
          <div className="mt-4 rounded-xl bg-white p-4 text-ink">
            <RecipientPicker exchangeId={ex.id} users={users.filter((u) => u.id !== user.id)} />
          </div>
        </div>
      );
    }
    return (
      <Empty icon="🎩" title="Names haven't been drawn yet">
        Santa&apos;s elves are shaking the hat. Check back soon!
      </Empty>
    );
  }

  const receiver = users.find((u) => u.id === mine.receiverId)!;
  return (
    <div>
      <Reveal
        person={{ id: receiver.id, name: receiver.name, emoji: receiver.emoji }}
        alreadySeen={mine.seenAt !== null}
        onOpened={markAssignmentSeen}
      />
      {ex.mode === "manual" && (
        <details className="mt-2 text-center text-sm text-white/80">
          <summary className="cursor-pointer">Wrong person?</summary>
          <div className="mx-auto mt-3 max-w-sm rounded-xl bg-white p-4 text-left text-ink">
            <RecipientPicker
              exchangeId={ex.id}
              users={users.filter((u) => u.id !== user.id)}
              current={receiver.id}
            />
          </div>
        </details>
      )}
    </div>
  );
}

function SantaReveal({ ex, user, users }: { ex: Exchange; user: User; users: User[] }) {
  const santaId = getMySanta(ex.id, user.id);
  const santa = users.find((u) => u.id === santaId);
  if (!santa) return null;
  return (
    <section className="card overflow-hidden bg-gradient-to-br from-gold to-[#b9832a] p-5 text-white">
      <Reveal
        person={{ id: santa.id, name: santa.name, emoji: santa.emoji }}
        alreadySeen={false}
        title="The secret is out! Your Secret Santa was…"
      />
    </section>
  );
}

function MessagesCard({ ex, user }: { ex: Exchange | null; user: User }) {
  const unread = ex ? unreadCount(ex.id, user.id) : 0;
  return (
    <Link href="/messages" className="card flex items-center gap-4 p-5 transition hover:-translate-y-0.5">
      <span className="relative text-4xl" aria-hidden>
        💌
        {unread > 0 && (
          <span className="absolute -right-2 -top-1 grid h-6 min-w-6 place-items-center rounded-full bg-berry px-1 text-xs font-bold text-white">
            {unread}
          </span>
        )}
      </span>
      <div>
        <h2 className="text-lg font-bold">Secret messages</h2>
        <p className="text-sm text-muted">
          {unread > 0
            ? `You have ${unread} unread message${unread === 1 ? "" : "s"}!`
            : "Ask your giftee a sneaky question, or answer your Santa."}
        </p>
      </div>
    </Link>
  );
}

function Empty({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <div className="py-6 text-center">
      <div className="text-6xl animate-float" aria-hidden>{icon}</div>
      <h2 className="mt-3 font-display text-3xl font-bold">{title}</h2>
      <p className="mt-1 text-white/85">{children}</p>
    </div>
  );
}

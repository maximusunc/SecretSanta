import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { timeAgo } from "@/lib/dates";
import { getCurrentExchange, getMyAssignment, getMySanta, isRevealed } from "@/lib/exchanges";
import { getThread, markRead, type Message } from "@/lib/messages";
import { getUser } from "@/lib/users";
import Avatar from "@/components/Avatar";
import AutoRefresh from "@/components/AutoRefresh";
import MessageComposer from "@/components/MessageComposer";

export default async function MessagesPage({ searchParams }: PageProps<"/messages">) {
  const user = await requireUser();
  const ex = getCurrentExchange();
  const tab = (await searchParams).with === "santa" ? "santa" : "giftee";

  if (!ex) {
    return <p className="card p-8 text-center text-muted">No exchange yet — check back after the draw!</p>;
  }

  const mine = getMyAssignment(ex.id, user.id);
  const giftee = mine ? getUser(mine.receiverId) : null;
  const santaId = getMySanta(ex.id, user.id); // never sent to the browser unless revealed
  const revealed = isRevealed(ex);
  const santa = revealed && santaId ? getUser(santaId) : null;

  let messages: Message[] = [];
  if (tab === "giftee" && giftee) {
    markRead(ex.id, user.id, giftee.id, true);
    messages = getThread(ex.id, user.id, giftee.id);
  } else if (tab === "santa" && santaId) {
    markRead(ex.id, santaId, user.id, false);
    messages = getThread(ex.id, santaId, user.id);
  }

  // In the giftee thread "me" is Santa; in the santa thread "me" is the receiver.
  const isMine = (m: Message) => (tab === "giftee" ? m.fromSanta : !m.fromSanta);
  const otherLabel = tab === "giftee" ? giftee?.name : santa ? `${santa.name} (your Santa)` : "Your Secret Santa";
  const otherEmoji = tab === "giftee" ? (giftee?.emoji ?? "🎁") : (santa?.emoji ?? "🎅");

  return (
    <div className="mx-auto max-w-2xl">
      <AutoRefresh seconds={20} />
      <h1 className="font-display text-4xl font-bold">Secret messages</h1>
      <p className="mb-4 text-muted">
        Your giftee never sees your name — you&apos;re just &ldquo;Your Secret Santa&rdquo;.
      </p>

      <div className="mb-4 grid grid-cols-2 gap-1 rounded-full bg-ink/5 p-1">
        <Tab href="/messages?with=giftee" active={tab === "giftee"}>
          🎯 To {giftee?.name ?? "your giftee"}
        </Tab>
        <Tab href="/messages?with=santa" active={tab === "santa"}>
          🎅 From your Santa
        </Tab>
      </div>

      <section className="card flex min-h-[50dvh] flex-col overflow-hidden">
        <header className="flex items-center gap-3 border-b border-ink/10 px-4 py-3">
          <Avatar emoji={otherEmoji} size="sm" />
          <div>
            <div className="font-bold">{otherLabel}</div>
            <div className="text-xs text-muted">
              {tab === "giftee" ? "They'll see you as “Your Secret Santa”" : "They know who you are — you don't know who they are!"}
            </div>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-2 p-4">
          {(tab === "giftee" && !giftee) || (tab === "santa" && !santaId) ? (
            <Empty>
              {tab === "giftee"
                ? "Once names are drawn you can message your giftee here."
                : "Once names are drawn, your Santa can message you here."}
            </Empty>
          ) : messages.length === 0 ? (
            <Empty>
              {tab === "giftee"
                ? "Ask a sneaky question — “What's your shoe size?” 👀"
                : "No messages from your Santa yet. You can leave them a hint!"}
            </Empty>
          ) : (
            messages.map((m) => (
              <div key={m.id} className={`flex flex-col ${isMine(m) ? "items-end" : "items-start"}`}>
                <div
                  className={`max-w-[85%] whitespace-pre-line rounded-2xl px-4 py-2 ${
                    isMine(m) ? "rounded-br-sm bg-berry text-white" : "rounded-bl-sm bg-frost text-ink"
                  }`}
                >
                  {m.body}
                </div>
                <span className="mt-0.5 px-1 text-[11px] text-muted">{timeAgo(m.createdAt)}</span>
              </div>
            ))
          )}
        </div>

        {((tab === "giftee" && giftee) || (tab === "santa" && santaId)) && (
          <div className="border-t border-ink/10 p-3">
            <MessageComposer to={tab} />
          </div>
        )}
      </section>
    </div>
  );
}

function Tab({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      replace
      className={`truncate rounded-full px-3 py-2 text-center text-sm font-bold transition ${
        active ? "bg-white text-berry shadow" : "text-muted"
      }`}
    >
      {children}
    </Link>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="m-auto max-w-xs py-10 text-center text-muted">{children}</p>;
}

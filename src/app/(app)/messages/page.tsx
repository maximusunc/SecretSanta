import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { timeAgo } from "@/lib/dates";
import { getCurrentExchange, getMyAssignment, getMySanta, isRevealed } from "@/lib/exchanges";
import { getThread, hasUnread, markRead, type Message } from "@/lib/messages";
import { getUser } from "@/lib/users";
import Avatar from "@/components/Avatar";
import AutoRefresh from "@/components/AutoRefresh";
import { SantaIcon } from "@/components/Icons";
import MessageComposer from "@/components/MessageComposer";

export default async function MessagesPage({ searchParams }: PageProps<"/messages">) {
  const user = await requireUser();
  const ex = getCurrentExchange();
  const mine = ex ? getMyAssignment(ex.id, user.id) : null;
  const giftee = mine ? getUser(mine.receiverId) : null;
  const santaId = ex ? getMySanta(ex.id, user.id) : null; // never sent to the browser unless revealed

  // Open whichever conversation has news; otherwise the one with your giftee.
  const requested = (await searchParams).with;
  const tab: "giftee" | "santa" =
    requested === "giftee" || requested === "santa"
      ? requested
      : ex && santaId && hasUnread(ex.id, santaId, user.id, false)
        ? "santa"
        : "giftee";
  const santa = ex && isRevealed(ex) && santaId ? getUser(santaId) : null;

  let messages: Message[] = [];
  if (ex && tab === "giftee" && giftee) {
    markRead(ex.id, user.id, giftee.id, true);
    messages = getThread(ex.id, user.id, giftee.id);
  } else if (ex && tab === "santa" && santaId) {
    markRead(ex.id, santaId, user.id, false);
    messages = getThread(ex.id, santaId, user.id);
  }

  // In the giftee thread "me" is Santa; in the santa thread "me" is the receiver.
  const isMine = (m: Message) => (tab === "giftee" ? m.fromSanta : !m.fromSanta);
  const theirSignature = tab === "giftee" ? (giftee?.name ?? "") : santa ? `${santa.name}, your Santa` : "Your Secret Santa";
  const hasThread = tab === "giftee" ? !!giftee : !!santaId;

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4">
      <AutoRefresh seconds={20} />
      <h1 className="font-display text-[30px] font-bold">Secret messages</h1>

      <div role="tablist" aria-label="Conversations" className="grid grid-cols-2 gap-1 rounded-full bg-night p-1">
        <Tab href="/messages?with=giftee" active={tab === "giftee"}>
          To {giftee?.name ?? "your giftee"}
        </Tab>
        <Tab href="/messages?with=santa" active={tab === "santa"}>
          From your Santa
        </Tab>
      </div>

      <div className="flex items-center gap-3 rounded-[18px] bg-deep px-3.5 py-3">
        {tab === "giftee" && giftee ? (
          <Avatar name={giftee.name} ornament={giftee.ornament} />
        ) : santa ? (
          <Avatar name={santa.name} ornament={santa.ornament} />
        ) : (
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-midnight text-gold shadow-[inset_0_0_0_1.5px_var(--color-gold)]">
            <SantaIcon size={22} />
          </span>
        )}
        <div className="flex flex-col gap-0.5">
          <span className="font-bold">
            {tab === "giftee" ? (giftee?.name ?? "Your giftee") : santa ? `${santa.name} (your Santa)` : "Your Secret Santa"}
          </span>
          <span className="text-[13px] text-mist">
            {tab === "giftee"
              ? `${giftee?.name ?? "They"} sees you as “Your Secret Santa”.`
              : santa
                ? "The secret is out!"
                : "They know who you are. You don't know who they are."}
          </span>
        </div>
      </div>

      <div className="flex min-h-[40dvh] flex-col gap-3.5 py-2">
        {!ex || !hasThread ? (
          <Empty>
            {tab === "giftee"
              ? "Once names are drawn, you can message your giftee here."
              : "Once names are drawn, your Santa can message you here."}
          </Empty>
        ) : messages.length === 0 ? (
          <Empty>
            {tab === "giftee"
              ? "Ask a sneaky question, like “What's your shoe size?”"
              : "No messages from your Santa yet. You can leave them a hint!"}
          </Empty>
        ) : (
          messages.map((m) =>
            isMine(m) ? (
              <div key={m.id} className="flex flex-col items-end gap-1">
                <div className="max-w-[78%] whitespace-pre-line rounded-[20px_20px_6px_20px] bg-gold px-4 py-3 text-[15px] leading-relaxed text-ink">
                  {m.body}
                </div>
                <span className="text-xs text-mist">{timeAgo(m.createdAt)}</span>
              </div>
            ) : (
              <div key={m.id} className="flex flex-col items-start gap-1">
                <div className="flex max-w-[82%] flex-col gap-2 rounded-[20px_20px_20px_6px] bg-ivory px-4 py-3.5 text-ink">
                  <span className="whitespace-pre-line text-[15px] leading-relaxed">{m.body}</span>
                  <span className="font-display text-sm italic text-bronze">— {theirSignature}</span>
                </div>
                <span className="text-xs text-mist">{timeAgo(m.createdAt)}</span>
              </div>
            ),
          )
        )}
      </div>

      {ex && hasThread && (
        <div className="sticky bottom-[84px] -mx-5 border-t border-white/10 bg-abyss/95 px-4 pb-3 pt-3 backdrop-blur md:static md:mx-0 md:rounded-3xl md:border-0">
          <MessageComposer
            to={tab}
            placeholder={tab === "giftee" ? `Message ${giftee?.name} anonymously…` : "Write back to your Santa…"}
          />
        </div>
      )}
    </div>
  );
}

function Tab({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      replace
      role="tab"
      aria-selected={active}
      className={`flex min-h-11 items-center justify-center truncate rounded-full px-3 text-center text-sm transition ${
        active ? "bg-gold font-bold text-ink" : "font-medium text-haze hover:text-snow"
      }`}
    >
      {children}
    </Link>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="m-auto max-w-xs py-10 text-center text-mist">{children}</p>;
}

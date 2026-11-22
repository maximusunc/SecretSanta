import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { listItems } from "@/lib/board";
import { getCurrentExchange, getMyAssignment } from "@/lib/exchanges";
import { getUser } from "@/lib/users";
import { BackIcon, ChatIcon } from "@/components/Icons";
import AddItem from "@/components/board/AddItem";
import ItemCard from "@/components/board/ItemCard";
import { firstName } from "@/lib/ornaments";

export default async function BoardPage({ params }: PageProps<"/boards/[userId]">) {
  const me = await requireUser();
  const owner = getUser(Number((await params).userId));
  if (!owner) notFound();

  const items = listItems(owner.id);
  const isMine = owner.id === me.id;
  // Admins can manage anyone's board (e.g. copying ideas over from Pinterest).
  const canEdit = isMine || me.isAdmin;
  const ex = getCurrentExchange();
  const isGiftee = !!ex && getMyAssignment(ex.id, me.id)?.receiverId === owner.id;
  const count = `${items.length} idea${items.length === 1 ? "" : "s"}`;

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-5">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <Link href="/boards" className="-ml-1 flex min-h-11 items-center gap-1.5 text-[15px] font-medium text-haze hover:text-snow">
            <BackIcon size={20} /> All boards
          </Link>
          {isGiftee && (
            <span className="eyebrow rounded-full bg-gold/15 px-3 py-1.5 text-[11px] tracking-[0.08em] text-gold">Your giftee</span>
          )}
        </div>
        <div className="flex items-center gap-3.5">
          <div className="flex flex-col gap-0.5">
            <h1 className="font-display text-[34px] font-bold leading-[1.05]">
              {isMine ? "Your wish board" : `${firstName(owner.name)}'s board`}
            </h1>
            <span className="text-sm text-mist">
              {count}
              {ex?.budget && !isMine ? ` · budget ${ex.budget}` : ""}
            </span>
          </div>
        </div>
        {isGiftee && (
          <Link href="/messages?with=giftee" className="btn-gold sm:self-start">
            <ChatIcon size={18} /> Ask {firstName(owner.name)} a sneaky question
          </Link>
        )}
      </div>

      {/* The board itself sits on a light paper sheet. */}
      <div className="-mx-5 -mb-32 min-h-[50dvh] rounded-t-[28px] bg-paper px-4 pb-40 pt-5 text-ink sm:mx-0 sm:rounded-[28px] sm:px-5 md:mb-0 md:pb-8">
        {canEdit && !isMine && (
          <p className="mb-3 rounded-2xl bg-gold/20 px-4 py-2.5 text-sm font-semibold text-ink">
            Admin: you&apos;re editing {firstName(owner.name)}&apos;s board.
          </p>
        )}
        {canEdit && (
          <div className="mb-4">
            <AddItem boardUserId={owner.id} />
          </div>
        )}

        {items.length === 0 ? (
          <p className="py-12 text-center text-muted">
            {canEdit ? "Pin the first idea above." : `${firstName(owner.name)} hasn't pinned anything yet.`}
          </p>
        ) : (
          <div className="columns-2 gap-3 md:columns-3 lg:columns-4">
            {items.map((item) => (
              <ItemCard key={item.id} item={item} editable={canEdit} ownerName={owner.name} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

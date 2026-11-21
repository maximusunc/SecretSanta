import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { listItems } from "@/lib/board";
import { getCurrentExchange, getMyAssignment } from "@/lib/exchanges";
import { getUser } from "@/lib/users";
import Avatar from "@/components/Avatar";
import AddItem from "@/components/board/AddItem";
import ItemCard from "@/components/board/ItemCard";

export default async function BoardPage({ params }: PageProps<"/boards/[userId]">) {
  const me = await requireUser();
  const owner = getUser(Number((await params).userId));
  if (!owner) notFound();

  const items = listItems(owner.id);
  const isMine = owner.id === me.id;
  const ex = getCurrentExchange();
  const isGiftee = !!ex && getMyAssignment(ex.id, me.id)?.receiverId === owner.id;

  return (
    <div>
      <Link href="/boards" className="text-sm font-semibold text-muted hover:text-ink">← All boards</Link>
      <div className="mb-5 mt-2 flex items-center gap-4">
        <Avatar emoji={owner.emoji} size="lg" />
        <div>
          <h1 className="font-display text-4xl font-bold leading-tight">
            {isMine ? "Your wish board" : `${owner.name}'s board`}
          </h1>
          {isGiftee && (
            <p className="font-semibold text-berry">
              🎯 This is your giftee!{" "}
              <Link href="/messages" className="underline">Ask them something anonymously</Link>
            </p>
          )}
        </div>
      </div>

      {isMine && <AddItem />}

      {items.length === 0 ? (
        <div className="card mt-4 p-10 text-center">
          <div className="text-5xl" aria-hidden>🧦</div>
          <p className="mt-2 text-muted">
            {isMine ? "Pin your first idea above!" : `${owner.name} hasn't pinned anything yet.`}
          </p>
        </div>
      ) : (
        <div className="mt-4 columns-2 gap-3 sm:gap-4 md:columns-3 lg:columns-4">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} editable={isMine} />
          ))}
        </div>
      )}
    </div>
  );
}

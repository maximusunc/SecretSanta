"use client";

import { useState } from "react";
import type { BoardItem } from "@/lib/board";
import { imageSrc } from "@/lib/imageSrc";
import { editBoardItem, removeBoardItem } from "@/app/actions/board";
import { ActionForm, SubmitButton } from "../Forms";

export default function ItemCard({ item, editable }: { item: BoardItem; editable: boolean }) {
  const [editing, setEditing] = useState(false);
  const src = imageSrc(item);

  return (
    <article className="card mb-3 break-inside-avoid overflow-hidden sm:mb-4">
      {src &&
        (item.url ? (
          <a href={item.url} target="_blank" rel="noopener noreferrer">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={item.title} className="w-full bg-frost object-cover" loading="lazy" />
          </a>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={item.title} className="w-full bg-frost object-cover" loading="lazy" />
        ))}

      <div className="space-y-1.5 p-3">
        {editing ? (
          <ActionForm action={editBoardItem} className="space-y-2">
            <input type="hidden" name="id" value={item.id} />
            <input name="title" defaultValue={item.title} className="input py-2 text-sm" placeholder="Title" />
            <input name="url" defaultValue={item.url ?? ""} className="input py-2 text-sm" placeholder="Link" />
            <textarea name="notes" defaultValue={item.notes} rows={3} className="input py-2 text-sm" placeholder="Notes" />
            <div className="flex gap-2">
              <SubmitButton className="btn-green flex-1 px-3 py-1.5 text-sm">Save</SubmitButton>
              <button type="button" onClick={() => setEditing(false)} className="btn-ghost px-3 py-1.5 text-sm">
                Done
              </button>
            </div>
          </ActionForm>
        ) : (
          <>
            {item.title && <h3 className="font-bold leading-snug">{item.title}</h3>}
            {item.notes && <p className="whitespace-pre-line text-sm text-ink/80">{item.notes}</p>}
            {item.url && (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex max-w-full items-center gap-1 truncate text-xs font-bold text-pine hover:underline"
              >
                {item.siteName || "Open link"} ↗
              </a>
            )}
            {editable && (
              <div className="flex gap-3 pt-1 text-xs font-semibold text-muted">
                <button onClick={() => setEditing(true)} className="hover:text-ink">Edit</button>
                <form
                  action={removeBoardItem}
                  onSubmit={(e) => {
                    if (!confirm("Remove this from your board?")) e.preventDefault();
                  }}
                >
                  <input type="hidden" name="id" value={item.id} />
                  <button className="hover:text-berry">Remove</button>
                </form>
              </div>
            )}
          </>
        )}
      </div>
    </article>
  );
}

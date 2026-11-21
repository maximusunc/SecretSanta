"use client";

import { useState } from "react";
import type { BoardItem } from "@/lib/board";
import { imageSrc } from "@/lib/imageSrc";
import { editBoardItem, removeBoardItem } from "@/app/actions/board";
import { ActionForm, SubmitButton } from "../Forms";
import { LinkIcon } from "../Icons";

/** One pinned idea. Items with no picture and no link render as a handwritten-style note. */
export default function ItemCard({
  item,
  editable,
  ownerName,
}: {
  item: BoardItem;
  editable: boolean;
  ownerName: string;
}) {
  const [editing, setEditing] = useState(false);
  const src = imageSrc(item);
  const isNote = !src && !item.url;

  const controls = editable && !editing && (
    <div className="flex gap-1 pt-1 text-xs font-bold text-muted">
      <button onClick={() => setEditing(true)} className="min-h-9 pr-2 hover:text-ink">Edit</button>
      <form
        action={removeBoardItem}
        onSubmit={(e) => {
          if (!confirm("Remove this from your board?")) e.preventDefault();
        }}
      >
        <input type="hidden" name="id" value={item.id} />
        <button className="min-h-9 px-2 hover:text-cranberry-dark">Remove</button>
      </form>
    </div>
  );

  if (editing) {
    return (
      <article className="mb-3 break-inside-avoid rounded-[18px] bg-white p-3 shadow-[0_10px_24px_-16px_rgb(15_27_45/0.45)]">
        <ActionForm action={editBoardItem} className="space-y-2">
          <input type="hidden" name="id" value={item.id} />
          <label className="sr-only" htmlFor={`title-${item.id}`}>Title</label>
          <input id={`title-${item.id}`} name="title" defaultValue={item.title} className="input text-sm" placeholder="Title" />
          <label className="sr-only" htmlFor={`url-${item.id}`}>Link</label>
          <input id={`url-${item.id}`} name="url" defaultValue={item.url ?? ""} className="input text-sm" placeholder="Link" />
          <label className="sr-only" htmlFor={`notes-${item.id}`}>Notes</label>
          <textarea id={`notes-${item.id}`} name="notes" defaultValue={item.notes} rows={3} className="input text-sm" placeholder="Notes" />
          <div className="flex gap-2">
            <SubmitButton className="btn-spruce flex-1 px-3 text-sm">Save</SubmitButton>
            <button type="button" onClick={() => setEditing(false)} className="btn-ghost px-4 text-sm">Done</button>
          </div>
        </ActionForm>
      </article>
    );
  }

  if (isNote) {
    return (
      <article className="mb-3 flex break-inside-avoid flex-col gap-2 rounded-[18px] border-[1.5px] border-dashed border-[#c9bfad] p-4">
        <span className="eyebrow text-bronze">Note from {ownerName}</span>
        {item.title && <h3 className="font-display text-[17px] font-semibold leading-snug">{item.title}</h3>}
        {item.notes && <p className="whitespace-pre-line font-display text-[17px] leading-snug">{item.notes}</p>}
        {controls}
      </article>
    );
  }

  return (
    <article className="relative mb-3 flex break-inside-avoid flex-col overflow-hidden rounded-[18px] bg-white shadow-[0_10px_24px_-16px_rgb(15_27_45/0.45)]">
      {src &&
        (item.url ? (
          <a href={item.url} target="_blank" rel="noopener noreferrer" tabIndex={-1}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" className="w-full bg-paper object-cover" loading="lazy" />
          </a>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={item.title} className="w-full bg-paper object-cover" loading="lazy" />
        ))}
      <span aria-hidden className="absolute left-2.5 top-2.5 h-3 w-3 rounded-full bg-paper shadow-[0_0_0_2px_var(--color-tan)]" />
      <div className={`flex flex-col gap-1.5 p-3 ${src ? "" : "pl-8"}`}>
        {item.title && <h3 className="text-[15px] font-bold leading-snug">{item.title}</h3>}
        {item.notes && <p className="whitespace-pre-line text-[13px] leading-relaxed text-[#4a5466]">{item.notes}</p>}
        {item.url && (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex max-w-full items-center gap-1 truncate text-xs font-bold text-spruce hover:underline"
          >
            {item.siteName || "Open link"} <LinkIcon size={13} />
          </a>
        )}
        {controls}
      </div>
    </article>
  );
}

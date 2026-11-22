"use client";

import { useActionState, useEffect, useState } from "react";
import type { BoardItem } from "@/lib/board";
import { imageSrc } from "@/lib/imageSrc";
import { editBoardItem, removeBoardItem } from "@/app/actions/board";
import { FormMessage, SubmitButton } from "../Forms";
import { LinkIcon } from "../Icons";
import { firstName } from "@/lib/ornaments";

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
    return <EditForm item={item} onDone={() => setEditing(false)} />;
  }

  if (isNote) {
    return (
      <article className="mb-3 flex break-inside-avoid flex-col gap-2 rounded-[18px] border-[1.5px] border-dashed border-[#c9bfad] p-4">
        <span className="eyebrow text-bronze">Note from {firstName(ownerName)}</span>
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

/** Edit everything about a pin, including adding, replacing or removing its picture. */
function EditForm({ item, onDone }: { item: BoardItem; onDone: () => void }) {
  const [state, action] = useActionState(editBoardItem, null);
  const [newPhoto, setNewPhoto] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);
  const current = imageSrc(item);
  const shown = newPhoto ?? (removing ? null : current);

  useEffect(() => {
    if (state?.ok) onDone();
  }, [state, onDone]);

  const id = (name: string) => `${name}-${item.id}`;

  return (
    <article className="mb-3 break-inside-avoid rounded-[18px] bg-white p-3 shadow-[0_10px_24px_-16px_rgb(15_27_45/0.45)]">
      <form action={action} className="flex flex-col gap-2.5">
        <input type="hidden" name="id" value={item.id} />

        <div className="flex flex-col gap-2">
          {shown ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={shown} alt="" className="max-h-48 w-full rounded-xl bg-paper object-contain" />
          ) : (
            <div className="grid h-20 place-items-center rounded-xl border-[1.5px] border-dashed border-line text-xs text-muted">
              No picture
            </div>
          )}
          <label
            htmlFor={id("photo")}
            className="btn-ghost min-h-10 cursor-pointer px-3 text-sm"
          >
            {current || newPhoto ? "Replace photo" : "Add a photo"}
          </label>
          <input
            id={id("photo")}
            name="photo"
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              setNewPhoto(f ? URL.createObjectURL(f) : null);
              if (f) setRemoving(false);
            }}
          />
          {current && !newPhoto && (
            <label className="flex min-h-9 items-center gap-2 text-xs font-bold text-muted">
              <input
                type="checkbox"
                name="removeImage"
                checked={removing}
                onChange={(e) => setRemoving(e.target.checked)}
                className="h-4 w-4 accent-cranberry"
              />
              Remove picture
            </label>
          )}
        </div>

        <label className="sr-only" htmlFor={id("title")}>Title</label>
        <input id={id("title")} name="title" defaultValue={item.title} className="input text-sm" placeholder="Title" maxLength={200} />
        <label className="sr-only" htmlFor={id("url")}>Link</label>
        <input
          id={id("url")}
          name="url"
          type="text"
          inputMode="url"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          defaultValue={item.url ?? ""}
          className="input text-sm"
          placeholder="Link"
        />
        <label className="sr-only" htmlFor={id("notes")}>Notes</label>
        <textarea id={id("notes")} name="notes" defaultValue={item.notes} rows={3} className="input text-sm" placeholder="Notes" maxLength={2000} />
        <div className="flex gap-2">
          <SubmitButton className="btn-spruce flex-1 px-3 text-sm" pending="Saving…">Save</SubmitButton>
          <button type="button" onClick={onDone} className="btn-ghost px-4 text-sm">Cancel</button>
        </div>
        <FormMessage state={state?.error ? state : null} />
      </form>
    </article>
  );
}

"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { addBoardItem, fetchPreview } from "@/app/actions/board";
import type { LinkPreview } from "@/lib/linkPreview";
import { FormMessage, SubmitButton } from "../Forms";

/** Pin a link (with automatic title + picture) and/or a photo, plus notes. */
export default function AddItem() {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(addBoardItem, null);
  const formRef = useRef<HTMLFormElement>(null);

  const [url, setUrl] = useState("");
  const [preview, setPreview] = useState<LinkPreview | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [loadingPreview, startPreview] = useTransition();
  const [title, setTitle] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const lastFetched = useRef("");

  const reset = () => {
    formRef.current?.reset();
    setUrl("");
    setPreview(null);
    setPreviewError(null);
    setTitle("");
    setPhotoUrl(null);
    lastFetched.current = "";
  };

  useEffect(() => {
    if (state?.ok) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clear the form after a successful pin
      reset();
      setOpen(false);
    }
  }, [state]);

  const loadPreview = (value: string) => {
    const v = value.trim();
    if (!v || v === lastFetched.current) return;
    lastFetched.current = v;
    setPreviewError(null);
    startPreview(async () => {
      const res = await fetchPreview(v);
      if (res.ok) {
        setPreview(res.preview);
        setTitle((t) => t || res.preview.title);
      } else {
        setPreview(null);
        setPreviewError(res.error);
      }
    });
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-berry/40 bg-white/60 py-5 text-lg font-bold text-berry transition hover:bg-white"
      >
        <span className="text-2xl">＋</span> Pin an idea
      </button>
    );
  }

  const shownImage = photoUrl ?? preview?.image ?? null;

  return (
    <form ref={formRef} action={action} className="card space-y-4 p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Pin an idea</h2>
        <button type="button" onClick={() => { reset(); setOpen(false); }} className="text-sm font-semibold text-muted">
          Cancel
        </button>
      </div>

      <div>
        <label className="label" htmlFor="url">Link (optional)</label>
        <input
          id="url"
          name="url"
          type="url"
          inputMode="url"
          placeholder="Paste a link to a product, recipe, anything…"
          className="input"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onPaste={(e) => loadPreview(e.clipboardData.getData("text"))}
          onBlur={() => loadPreview(url)}
        />
        {loadingPreview && <p className="mt-2 text-sm text-muted">🔎 Fetching preview…</p>}
        {previewError && <p className="mt-2 text-sm text-berry">{previewError}</p>}
      </div>

      {shownImage && (
        <div className="overflow-hidden rounded-xl bg-frost">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={shownImage} alt="" className="mx-auto max-h-64 object-contain" />
        </div>
      )}

      <input type="hidden" name="imageUrl" value={preview?.image ?? ""} />
      <input type="hidden" name="siteName" value={preview?.siteName ?? ""} />

      <div>
        <label className="label" htmlFor="photo">
          {preview?.image ? "Or use your own photo" : "Photo (optional)"}
        </label>
        <input
          id="photo"
          name="photo"
          type="file"
          accept="image/*"
          className="block w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-pine file:px-4 file:py-2 file:font-semibold file:text-white"
          onChange={(e) => {
            const f = e.target.files?.[0];
            setPhotoUrl(f ? URL.createObjectURL(f) : null);
          }}
        />
      </div>

      <div>
        <label className="label" htmlFor="title">Title</label>
        <input id="title" name="title" className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What is it?" maxLength={200} />
      </div>

      <div>
        <label className="label" htmlFor="notes">Notes</label>
        <textarea id="notes" name="notes" rows={3} className="input" placeholder="Size, color, “any flavor but mint”…" maxLength={2000} />
      </div>

      <SubmitButton className="btn-primary w-full py-3" pending="Pinning…">Pin it 📌</SubmitButton>
      <FormMessage state={state?.error ? state : null} />
    </form>
  );
}

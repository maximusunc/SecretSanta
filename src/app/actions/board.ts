"use server";

import { revalidatePath } from "next/cache";
import { requireUser, type User } from "@/lib/auth";
import { getUser } from "@/lib/users";
import { addItem, deleteItem, getItem, updateItem } from "@/lib/board";
import { deleteImage, downloadImage, saveUploadedFile } from "@/lib/images";
import { parsePreview, type LinkPreview } from "@/lib/linkPreview";
import { safeFetch } from "@/lib/safeFetch";
import type { ActionResult } from "@/components/Forms";

const str = (fd: FormData, k: string, max = 2000) => String(fd.get(k) ?? "").trim().slice(0, max);

function normaliseUrl(raw: string): string | null {
  if (!raw) return null;
  try {
    const u = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    return u.protocol === "http:" || u.protocol === "https:" ? u.toString() : null;
  } catch {
    return null;
  }
}

async function preview(url: string): Promise<LinkPreview> {
  const res = await safeFetch(url, { maxBytes: 1_500_000, accept: "text/html,application/xhtml+xml" });
  if (!res.contentType.includes("html")) {
    // A direct link to an image is fine too.
    if (res.contentType.startsWith("image/")) {
      return { url, title: "", siteName: res.url.hostname.replace(/^www\./, ""), image: res.url.toString() };
    }
    throw new Error("That link isn't a web page.");
  }
  return parsePreview(res.body.toString("utf8"), res.url);
}

export type PreviewResult = { ok: true; preview: LinkPreview } | { ok: false; error: string };

/** Called from the Add form as you paste a link, to show title + picture. */
export async function fetchPreview(rawUrl: string): Promise<PreviewResult> {
  await requireUser();
  const url = normaliseUrl(rawUrl.trim());
  if (!url) return { ok: false, error: "That doesn't look like a link." };
  try {
    return { ok: true, preview: await preview(url) };
  } catch (e) {
    return { ok: false, error: `Couldn't load a preview (${(e as Error).message}). You can still add it.` };
  }
}

/** You can change your own board; admins can change anyone's (e.g. to copy ideas over from Pinterest). */
const canEditBoard = (user: User, ownerId: number) => user.id === ownerId || user.isAdmin;

function revalidateBoard(ownerId: number) {
  revalidatePath(`/boards/${ownerId}`);
  revalidatePath("/boards");
  revalidatePath("/");
}

export async function addBoardItem(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const ownerId = Number(fd.get("boardUserId") ?? user.id) || user.id;
  if (!canEditBoard(user, ownerId) || !getUser(ownerId)) return { error: "You can only add to your own board." };
  const rawUrl = str(fd, "url");
  const url = normaliseUrl(rawUrl);
  if (rawUrl && !url) return { error: "That link doesn't look right." };

  let title = str(fd, "title", 200);
  let siteName = str(fd, "siteName", 100) || null;
  let imageUrl = str(fd, "imageUrl") || null;
  const notes = str(fd, "notes", 2000);
  const photo = fd.get("photo");
  const hasPhoto = photo instanceof File && photo.size > 0;

  if (!url && !hasPhoto && !title && !notes) {
    return { error: "Add a link, a photo, or a few words." };
  }

  // If they pasted a link but didn't wait for the preview, fetch it now.
  if (url && !title && !imageUrl) {
    try {
      const p = await preview(url);
      title = p.title;
      siteName = p.siteName;
      imageUrl = p.image;
    } catch {
      siteName = new URL(url).hostname.replace(/^www\./, "");
    }
  }

  let imageFile: string | null = null;
  try {
    if (hasPhoto) {
      imageFile = await saveUploadedFile(photo);
      imageUrl = null;
    } else if (imageUrl) {
      // Keep our own copy so the board survives link rot and hotlink blocking.
      imageFile = await downloadImage(imageUrl).catch(() => null);
      if (imageFile) imageUrl = null;
    }
  } catch (e) {
    return { error: (e as Error).message || "Couldn't read that image." };
  }

  addItem({
    userId: ownerId,
    title: title || (siteName ?? ""),
    url,
    siteName,
    imageFile,
    imageUrl: imageUrl && /^https?:\/\//.test(imageUrl) ? imageUrl : null,
    notes,
  });
  revalidateBoard(ownerId);
  return { ok: "Pinned!" };
}

export async function editBoardItem(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const item = getItem(Number(fd.get("id")));
  if (!item || !canEditBoard(user, item.userId)) return { error: "You can only edit your own board." };
  const rawUrl = str(fd, "url");
  const url = normaliseUrl(rawUrl);
  if (rawUrl && !url) return { error: "That link doesn't look right." };
  updateItem(item.id, { title: str(fd, "title", 200), notes: str(fd, "notes", 2000), url });
  revalidateBoard(item.userId);
  return { ok: "Saved." };
}

export async function removeBoardItem(fd: FormData) {
  const user = await requireUser();
  const item = getItem(Number(fd.get("id")));
  if (!item || !canEditBoard(user, item.userId)) return;
  deleteItem(item.id);
  await deleteImage(item.imageFile);
  revalidateBoard(item.userId);
}

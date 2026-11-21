import "server-only";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { UPLOAD_DIR } from "./db";
import { safeFetch } from "./safeFetch";

export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;

/** Normalise any image (phone photo, product shot) into a reasonably sized WebP. */
export async function saveImage(input: Buffer): Promise<string> {
  const out = await sharp(input, { failOn: "error" })
    .rotate() // honour EXIF orientation from phone cameras
    .resize({ width: 1200, height: 1600, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();
  const name = `${crypto.randomUUID()}.webp`;
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  await fs.writeFile(path.join(UPLOAD_DIR, name), out);
  return name;
}

export async function saveUploadedFile(file: File): Promise<string> {
  if (file.size > MAX_UPLOAD_BYTES) throw new Error("That image is too big (15 MB max).");
  return saveImage(Buffer.from(await file.arrayBuffer()));
}

/** Download a remote image (e.g. a product photo) so the board doesn't break if the link rots. */
export async function downloadImage(url: string): Promise<string> {
  const res = await safeFetch(url, { maxBytes: MAX_UPLOAD_BYTES, accept: "image/*" });
  if (res.body.length >= MAX_UPLOAD_BYTES) throw new Error("Image too large.");
  return saveImage(res.body);
}

export async function deleteImage(name: string | null) {
  if (!name || !/^[\w-]+\.webp$/.test(name)) return;
  await fs.rm(path.join(UPLOAD_DIR, name), { force: true });
}

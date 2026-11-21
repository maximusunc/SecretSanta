import fs from "node:fs/promises";
import path from "node:path";
import { getCurrentUser } from "@/lib/auth";
import { UPLOAD_DIR } from "@/lib/db";

/** Board images are only visible to signed-in family members. */
export async function GET(_req: Request, ctx: RouteContext<"/api/uploads/[name]">) {
  if (!(await getCurrentUser())) return new Response("Unauthorized", { status: 401 });
  const { name } = await ctx.params;
  if (!/^[\w-]+\.webp$/.test(name)) return new Response("Not found", { status: 404 });
  try {
    const data = await fs.readFile(path.join(UPLOAD_DIR, name));
    return new Response(new Uint8Array(data), {
      headers: {
        "content-type": "image/webp",
        // File names are random UUIDs, so they never change.
        "cache-control": "private, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}

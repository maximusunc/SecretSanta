import { parse } from "node-html-parser";

export type LinkPreview = {
  url: string;
  title: string;
  siteName: string;
  image: string | null;
};

/** Pull title / image / site name out of a page's HTML (Open Graph, Twitter cards, JSON-LD). */
export function parsePreview(html: string, pageUrl: URL): LinkPreview {
  const root = parse(html);
  const meta = (...keys: string[]) => {
    for (const k of keys) {
      const el =
        root.querySelector(`meta[property="${k}"]`) ?? root.querySelector(`meta[name="${k}"]`);
      const v = el?.getAttribute("content")?.trim();
      if (v) return decode(v);
    }
    return "";
  };

  let image =
    meta("og:image:secure_url", "og:image", "og:image:url", "twitter:image", "twitter:image:src") ||
    root.querySelector('link[rel="image_src"]')?.getAttribute("href") ||
    jsonLdImage(root) ||
    // Amazon keeps the product photo here rather than in og tags.
    root.querySelector("#landingImage")?.getAttribute("data-old-hires") ||
    root.querySelector("#landingImage")?.getAttribute("src") ||
    "";

  if (image) {
    try {
      image = new URL(image, pageUrl).toString();
    } catch {
      image = "";
    }
  }

  const title =
    meta("og:title", "twitter:title") ||
    decode(root.querySelector("title")?.text.trim() ?? "") ||
    pageUrl.hostname;

  return {
    url: pageUrl.toString(),
    title: title.slice(0, 200),
    siteName: meta("og:site_name") || pageUrl.hostname.replace(/^www\./, ""),
    image: image || null,
  };
}

function jsonLdImage(root: ReturnType<typeof parse>): string {
  for (const s of root.querySelectorAll('script[type="application/ld+json"]')) {
    try {
      const found = findImage(JSON.parse(s.text));
      if (found) return found;
    } catch {
      /* ignore malformed JSON-LD */
    }
  }
  return "";
}

function findImage(node: unknown): string {
  if (!node || typeof node !== "object") return "";
  if (Array.isArray(node)) {
    for (const n of node) {
      const f = findImage(n);
      if (f) return f;
    }
    return "";
  }
  const obj = node as Record<string, unknown>;
  const img = obj.image;
  if (typeof img === "string") return img;
  if (Array.isArray(img) && typeof img[0] === "string") return img[0];
  if (img && typeof img === "object" && typeof (img as { url?: unknown }).url === "string") {
    return (img as { url: string }).url;
  }
  return findImage(obj["@graph"]);
}

function decode(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)));
}

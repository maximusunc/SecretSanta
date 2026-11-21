import { describe, expect, it } from "vitest";
import { parsePreview } from "../src/lib/linkPreview";

describe("parsePreview", () => {
  it("reads Open Graph tags and resolves relative images", () => {
    const html = `<html><head>
      <meta property="og:title" content="Cozy Socks &amp; Mittens">
      <meta property="og:image" content="/img/socks.jpg">
      <meta property="og:site_name" content="Sock Shop">
      <title>ignored</title></head></html>`;
    const p = parsePreview(html, new URL("https://shop.example.com/p/1"));
    expect(p.title).toBe("Cozy Socks & Mittens");
    expect(p.image).toBe("https://shop.example.com/img/socks.jpg");
    expect(p.siteName).toBe("Sock Shop");
  });

  it("falls back to <title>, JSON-LD image and hostname", () => {
    const html = `<html><head><title>Board Game</title>
      <script type="application/ld+json">{"@type":"Product","image":["https://cdn.example.com/g.png"]}</script>
      </head></html>`;
    const p = parsePreview(html, new URL("https://www.games.example/x"));
    expect(p.title).toBe("Board Game");
    expect(p.image).toBe("https://cdn.example.com/g.png");
    expect(p.siteName).toBe("games.example");
  });
});

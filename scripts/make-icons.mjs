// Regenerates favicon.ico, apple-icon.png and the app icons (public/icon-192.png,
// public/icon-512.png) from src/app/icon.svg.
// Run after editing the SVG:  node scripts/make-icons.mjs
import fs from "node:fs";
import sharp from "sharp";

const svg = fs.readFileSync("src/app/icon.svg");
const png = (size) => sharp(svg, { density: 600 }).resize(size, size).png().toBuffer();

// favicon.ico: an ICO container holding PNG images (supported by every current browser).
const sizes = [16, 32, 48];
const images = await Promise.all(sizes.map(png));
const header = Buffer.alloc(6 + 16 * sizes.length);
header.writeUInt16LE(0, 0); // reserved
header.writeUInt16LE(1, 2); // type: icon
header.writeUInt16LE(sizes.length, 4);
let offset = header.length;
sizes.forEach((size, i) => {
  const e = 6 + 16 * i;
  header.writeUInt8(size, e); // width
  header.writeUInt8(size, e + 1); // height
  header.writeUInt8(0, e + 2); // palette
  header.writeUInt8(0, e + 3); // reserved
  header.writeUInt16LE(1, e + 4); // colour planes
  header.writeUInt16LE(32, e + 6); // bits per pixel
  header.writeUInt32LE(images[i].length, e + 8);
  header.writeUInt32LE(offset, e + 12);
  offset += images[i].length;
});
fs.writeFileSync("src/app/favicon.ico", Buffer.concat([header, ...images]));

// Home-screen / app icons: Santa on midnight navy, with enough padding that
// iOS's rounded corners and Android's "maskable" crop never clip him.
async function appIcon(size, out) {
  const faceSize = Math.round(size * 0.68);
  const face = await sharp(svg, { density: 2400 }).resize(faceSize, faceSize).png().toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: "#0f1b2d" } })
    .composite([{ input: face, left: Math.round((size - faceSize) / 2), top: Math.round((size - faceSize) / 2.2) }])
    .png()
    .toFile(out);
}
await appIcon(180, "src/app/apple-icon.png");
await appIcon(192, "public/icon-192.png");
await appIcon(512, "public/icon-512.png");

console.log("Wrote favicon.ico, apple-icon.png, public/icon-192.png, public/icon-512.png");

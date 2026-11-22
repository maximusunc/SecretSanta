// Regenerates favicon.ico and apple-icon.png from src/app/icon.svg.
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

// apple-icon.png: home-screen icon, Santa on midnight navy (iOS rounds the corners).
const face = await sharp(svg, { density: 1200 }).resize(136, 136).png().toBuffer();
await sharp({ create: { width: 180, height: 180, channels: 4, background: "#0f1b2d" } })
  .composite([{ input: face, left: 22, top: 20 }])
  .png()
  .toFile("src/app/apple-icon.png");

console.log("Wrote src/app/favicon.ico and src/app/apple-icon.png");

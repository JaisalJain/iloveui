// Writes the app icons from lib/brand.ts: app/icon.svg, app/apple-icon.png (180px) and app/favicon.ico (16/32/48).
// Run with `pnpm exec tsx scripts/build-icons.ts` after changing the brand mark; the outputs are committed.
import { writeFileSync } from "node:fs";
import { chromium } from "@playwright/test";
import {
  HEART_COLOR,
  HEART_LOBE_LEFT,
  HEART_LOBE_LEFT_TRANSFORM,
  HEART_LOBE_RIGHT,
  HEART_LOBE_RIGHT_TRANSFORM,
  HEART_VIEWBOX,
} from "../lib/brand";

const TILE = "#0B0B0C";
const [hx = 0, hy = 0, hw = 1, hh = 1] = HEART_VIEWBOX.split(" ").map(Number);

/** A dark tile with the vermilion heart centered. `rounded` is off for the Apple icon, which iOS masks itself. */
function tileSvg(rounded: boolean) {
  const size = 512;
  const scale = (size * 0.5) / hw;
  const tx = size / 2 - (hx + hw / 2) * scale;
  const ty = size / 2 - (hy + hh / 2) * scale;
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">`,
    `<rect width="${size}" height="${size}" ${rounded ? 'rx="112"' : ""} fill="${TILE}"/>`,
    `<g transform="translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${scale.toFixed(4)})" fill="${HEART_COLOR}">`,
    `<path d="${HEART_LOBE_LEFT}" transform="${HEART_LOBE_LEFT_TRANSFORM}"/>`,
    `<path d="${HEART_LOBE_RIGHT}" transform="${HEART_LOBE_RIGHT_TRANSFORM}"/>`,
    `</g></svg>`,
  ].join("");
}

/** ICO container holding PNG images (supported by every current browser). */
function ico(images: { size: number; png: Buffer }[]) {
  const header = Buffer.alloc(6 + images.length * 16);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = header.length;
  images.forEach(({ size, png }, index) => {
    const entry = 6 + index * 16;
    header.writeUInt8(size >= 256 ? 0 : size, entry);
    header.writeUInt8(size >= 256 ? 0 : size, entry + 1);
    header.writeUInt8(0, entry + 2);
    header.writeUInt8(0, entry + 3);
    header.writeUInt16LE(1, entry + 4);
    header.writeUInt16LE(32, entry + 6);
    header.writeUInt32LE(png.length, entry + 8);
    header.writeUInt32LE(offset, entry + 12);
    offset += png.length;
  });
  return Buffer.concat([header, ...images.map((image) => image.png)]);
}

async function main() {
  const rounded = tileSvg(true);
  writeFileSync("app/icon.svg", `${rounded}\n`);

  const browser = await chromium.launch();
  const page = await browser.newPage();
  async function rasterize(svg: string, size: number) {
    await page.setViewportSize({ width: size, height: size });
    await page.setContent(
      `<html><body style="margin:0;background:transparent">${svg.replace("<svg ", `<svg width="${size}" height="${size}" `)}</body></html>`,
    );
    return page.screenshot({ omitBackground: true, clip: { x: 0, y: 0, width: size, height: size } });
  }
  writeFileSync("app/apple-icon.png", await rasterize(tileSvg(false), 180));
  const favicons = await Promise.all([16, 32, 48].map(async (size) => ({ size, png: await rasterize(rounded, size) })));
  writeFileSync("app/favicon.ico", ico(favicons));
  await browser.close();
  console.log("✓ wrote app/icon.svg, app/apple-icon.png, app/favicon.ico");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});

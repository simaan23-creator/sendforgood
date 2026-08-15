#!/usr/bin/env node
/**
 * Generates the Etsy shop icon (500x500) and big banner (3360x840).
 * Usage: node etsy/generate-shop-assets.mjs  →  etsy/images/shop-*.jpg
 */
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import sharp from "sharp";

const OUT = resolve(process.cwd(), "etsy", "images");
mkdirSync(OUT, { recursive: true });

const CREAM = "#FDF8F0";
const NAVY = "#1B2A4A";
const GOLD = "#C8A962";
const GOLD_DARK = "#A68B42";
const SERIF = "Georgia, 'Times New Roman', serif";
const SANS = "Arial, Helvetica, sans-serif";

function sealMark(cx, cy, r, ring = GOLD, letter = CREAM, fill = NAVY) {
  return `
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" stroke="${ring}" stroke-width="${r * 0.06}"/>
    <circle cx="${cx}" cy="${cy}" r="${r * 0.82}" fill="none" stroke="${ring}" stroke-width="${r * 0.025}"/>
    <text x="${cx}" y="${cy + r * 0.28}" font-family="${SERIF}" font-size="${r * 0.9}" fill="${letter}" text-anchor="middle" font-weight="bold">S</text>
  `;
}

// Shop icon 500x500 — seal mark on cream with a thin gold frame.
const icon = `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="0 0 500 500">
  <rect width="500" height="500" fill="${CREAM}"/>
  <rect x="14" y="14" width="472" height="472" fill="none" stroke="${GOLD}" stroke-width="4"/>
  ${sealMark(250, 218, 130)}
  <text x="250" y="420" font-family="${SERIF}" font-size="44" fill="${NAVY}" text-anchor="middle" font-weight="bold" letter-spacing="3">SEALTHEDAY</text>
</svg>`;

// Big banner 3360x840 — navy, seal left, promise right.
const banner = `<svg xmlns="http://www.w3.org/2000/svg" width="3360" height="840" viewBox="0 0 3360 840">
  <rect width="3360" height="840" fill="${NAVY}"/>
  <rect x="30" y="30" width="3300" height="780" fill="none" stroke="${GOLD}" stroke-width="6"/>
  ${sealMark(560, 420, 250)}
  <text x="1000" y="360" font-family="${SERIF}" font-size="150" fill="${CREAM}" font-weight="bold">The wedding gift that</text>
  <text x="1000" y="540" font-family="${SERIF}" font-size="150" fill="${GOLD}" font-weight="bold">opens 1 year later.</text>
  <text x="1004" y="670" font-family="${SANS}" font-size="62" fill="${CREAM}">Video messages from everyone they love — sealed until their first anniversary.</text>
</svg>`;

console.log("Generating shop assets...");
await sharp(Buffer.from(icon), { density: 96 })
  .resize(500, 500)
  .flatten({ background: CREAM })
  .jpeg({ quality: 92 })
  .toFile(resolve(OUT, "shop-icon.jpg"));
console.log("  ✓ shop-icon.jpg (500x500)");

await sharp(Buffer.from(banner), { density: 96 })
  .resize(3360, 840)
  .flatten({ background: NAVY })
  .jpeg({ quality: 90 })
  .toFile(resolve(OUT, "shop-banner.jpg"));
console.log("  ✓ shop-banner.jpg (3360x840)");

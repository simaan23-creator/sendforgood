#!/usr/bin/env node
/**
 * Generates the Etsy listing image set for the Anniversary Capsule.
 * Brand-styled 2000x2000 text cards per etsy/anniversary-capsule-listing.md,
 * plus the instant-download "How to claim" card (1600x2000).
 *
 * Usage: node etsy/generate-etsy-images.mjs
 * Output: etsy/images/*.jpg + etsy/download/how-to-claim.png
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import sharp from "sharp";

const OUT = resolve(process.cwd(), "etsy", "images");
const DL = resolve(process.cwd(), "etsy", "download");
mkdirSync(OUT, { recursive: true });
mkdirSync(DL, { recursive: true });

const CREAM = "#FDF8F0";
const CREAM_DARK = "#F5EDE0";
const NAVY = "#1B2A4A";
const NAVY_LIGHT = "#2D4A7A";
const GOLD = "#C8A962";
const GOLD_DARK = "#A68B42";

const SERIF = "Georgia, 'Times New Roman', serif";
const SANS = "Arial, Helvetica, sans-serif";

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Shared decorative frame: double gold border + corner flourishes
function frame(w, h) {
  return `
    <rect x="40" y="40" width="${w - 80}" height="${h - 80}" fill="none" stroke="${GOLD}" stroke-width="6"/>
    <rect x="60" y="60" width="${w - 120}" height="${h - 120}" fill="none" stroke="${GOLD}" stroke-width="2"/>
  `;
}

function sealMark(cx, cy, r, ring = GOLD, letter = CREAM, fill = NAVY) {
  return `
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" stroke="${ring}" stroke-width="${r * 0.06}"/>
    <circle cx="${cx}" cy="${cy}" r="${r * 0.82}" fill="none" stroke="${ring}" stroke-width="${r * 0.025}"/>
    <text x="${cx}" y="${cy + r * 0.28}" font-family="${SERIF}" font-size="${r * 0.9}" fill="${letter}" text-anchor="middle" font-weight="bold">S</text>
  `;
}

async function render(name, svg, w = 2000, h = 2000, dest = OUT) {
  await sharp(Buffer.from(svg), { density: 96 })
    .resize(w, h)
    .flatten({ background: CREAM })
    .jpeg({ quality: 92 })
    .toFile(resolve(dest, name));
  console.log("  ✓", name);
}

const W = 2000, H = 2000;

// ---------- Slot 1: HERO ----------
const hero = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${CREAM}"/>
  ${frame(W, H)}
  ${sealMark(1000, 430, 190)}
  <text x="1000" y="810" font-family="${SERIF}" font-size="128" fill="${NAVY}" text-anchor="middle" font-weight="bold">The wedding gift</text>
  <text x="1000" y="970" font-family="${SERIF}" font-size="128" fill="${NAVY}" text-anchor="middle" font-weight="bold">that opens</text>
  <text x="1000" y="1130" font-family="${SERIF}" font-size="128" fill="${GOLD_DARK}" text-anchor="middle" font-weight="bold">1 year later.</text>
  <text x="1000" y="1330" font-family="${SANS}" font-size="62" fill="${NAVY_LIGHT}" text-anchor="middle">Video messages from everyone they love,</text>
  <text x="1000" y="1415" font-family="${SANS}" font-size="62" fill="${NAVY_LIGHT}" text-anchor="middle">sealed until their first anniversary.</text>
  <rect x="490" y="1560" width="1020" height="120" rx="60" fill="${NAVY}"/>
  <text x="1000" y="1638" font-family="${SANS}" font-size="52" fill="${CREAM}" text-anchor="middle">Sealed for 12 months  ·  Digital delivery</text>
  <text x="1000" y="1850" font-family="${SERIF}" font-size="54" fill="${GOLD_DARK}" text-anchor="middle" letter-spacing="6">SEALTHEDAY</text>
</svg>`;

// ---------- Slot 4: HOW IT WORKS ----------
const steps = [
  ["1", "Order", "Get your redemption link within hours"],
  ["2", "Forward", "Send it to the couple (or keep it)"],
  ["3", "They invite", "Guests record from their phones — no app"],
  ["4", "It seals", "Locked until the date they choose"],
  ["5", "Opened together", "Every message, on their anniversary"],
];
const stepRows = steps.map((s, i) => {
  const y = 560 + i * 260;
  return `
    <circle cx="330" cy="${y}" r="72" fill="${NAVY}"/>
    <text x="330" y="${y + 26}" font-family="${SERIF}" font-size="76" fill="${GOLD}" text-anchor="middle" font-weight="bold">${s[0]}</text>
    <text x="470" y="${y - 8}" font-family="${SERIF}" font-size="78" fill="${NAVY}" font-weight="bold">${esc(s[1])}</text>
    <text x="470" y="${y + 78}" font-family="${SANS}" font-size="52" fill="${NAVY_LIGHT}">${esc(s[2])}</text>
    ${i < steps.length - 1 ? `<line x1="330" y1="${y + 82}" x2="330" y2="${y + 178}" stroke="${GOLD}" stroke-width="5" stroke-dasharray="2 14"/>` : ""}
  `;
}).join("");
const howItWorks = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${CREAM}"/>
  ${frame(W, H)}
  <text x="1000" y="300" font-family="${SERIF}" font-size="130" fill="${NAVY}" text-anchor="middle" font-weight="bold">How it works.</text>
  ${stepRows}
  <text x="1000" y="1870" font-family="${SERIF}" font-size="50" fill="${GOLD_DARK}" text-anchor="middle" letter-spacing="6">SEALTHEDAY</text>
</svg>`;

// ---------- Slot 5: INCLUSIONS ----------
const inc = [
  "1 private Memory Vault",
  "6 HD video messages (up to 2 min each)",
  "15 photo upload slots",
  "Sealed for up to 12 months",
  "Lifetime download access — yours forever",
];
const incRows = inc.map((t, i) => {
  const y = 700 + i * 210;
  return `
    <circle cx="330" cy="${y - 20}" r="46" fill="${GOLD}"/>
    <text x="330" y="${y + 2}" font-family="${SANS}" font-size="60" fill="${CREAM}" text-anchor="middle" font-weight="bold">✓</text>
    <text x="440" y="${y}" font-family="${SANS}" font-size="64" fill="${NAVY}">${esc(t)}</text>
  `;
}).join("");
const inclusions = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${CREAM}"/>
  ${frame(W, H)}
  <text x="1000" y="330" font-family="${SERIF}" font-size="130" fill="${NAVY}" text-anchor="middle" font-weight="bold">What's inside</text>
  <line x1="700" y1="420" x2="1300" y2="420" stroke="${GOLD}" stroke-width="5"/>
  ${incRows}
  <rect x="330" y="1700" width="1340" height="4" fill="${CREAM_DARK}"/>
  <text x="1000" y="1830" font-family="${SANS}" font-size="54" fill="${NAVY_LIGHT}" text-anchor="middle">Delivered digitally · No shipping · Nothing to lose in a drawer</text>
</svg>`;

// ---------- Slot 6: THE STORY (real quote from Lauren, the founder's wife) ----------
const testimonial = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${NAVY}"/>
  <rect x="40" y="40" width="${W - 80}" height="${H - 80}" fill="none" stroke="${GOLD}" stroke-width="6"/>
  <text x="1000" y="440" font-family="${SANS}" font-size="54" fill="${GOLD}" text-anchor="middle" letter-spacing="10">FROM THE BRIDE WHO STARTED IT ALL</text>
  <text x="1000" y="700" font-family="${SERIF}" font-size="92" fill="${CREAM}" text-anchor="middle" font-style="italic">"I depended on my husband to</text>
  <text x="1000" y="825" font-family="${SERIF}" font-size="92" fill="${CREAM}" text-anchor="middle" font-style="italic">hire a proper videographer —</text>
  <text x="1000" y="950" font-family="${SERIF}" font-size="92" fill="${CREAM}" text-anchor="middle" font-style="italic">and we both know how that</text>
  <text x="1000" y="1075" font-family="${SERIF}" font-size="92" fill="${CREAM}" text-anchor="middle" font-style="italic">turned out. Future brides:</text>
  <text x="1000" y="1200" font-family="${SERIF}" font-size="92" fill="${CREAM}" text-anchor="middle" font-style="italic">have a backup plan."</text>
  <line x1="850" y1="1340" x2="1150" y2="1340" stroke="${GOLD}" stroke-width="4"/>
  <text x="1000" y="1470" font-family="${SANS}" font-size="58" fill="${GOLD}" text-anchor="middle">— Lauren, the founder's wife</text>
  <text x="1000" y="1620" font-family="${SANS}" font-size="50" fill="${CREAM}" text-anchor="middle">SealTheDay exists so every couple has one.</text>
  <text x="1000" y="1830" font-family="${SERIF}" font-size="50" fill="${GOLD}" text-anchor="middle" letter-spacing="6">SEALTHEDAY</text>
</svg>`;

// ---------- Slot 8: MAID OF HONOR ----------
const moh = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${CREAM}"/>
  ${frame(W, H)}
  <text x="1000" y="420" font-family="${SANS}" font-size="56" fill="${GOLD_DARK}" text-anchor="middle" letter-spacing="10">THE PERFECT GIFT</text>
  <text x="1000" y="640" font-family="${SERIF}" font-size="140" fill="${NAVY}" text-anchor="middle" font-weight="bold">From the</text>
  <text x="1000" y="810" font-family="${SERIF}" font-size="140" fill="${GOLD_DARK}" text-anchor="middle" font-weight="bold">maid of honor.</text>
  <text x="1000" y="1080" font-family="${SANS}" font-size="66" fill="${NAVY_LIGHT}" text-anchor="middle">A gift only you could give —</text>
  <text x="1000" y="1180" font-family="${SANS}" font-size="66" fill="${NAVY_LIGHT}" text-anchor="middle">the people, the words, the moment.</text>
  ${sealMark(1000, 1520, 150)}
  <text x="1000" y="1850" font-family="${SERIF}" font-size="50" fill="${GOLD_DARK}" text-anchor="middle" letter-spacing="6">SEALTHEDAY</text>
</svg>`;

// ---------- Slot 9: PARENTS ----------
const parents = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${CREAM}"/>
  ${frame(W, H)}
  <text x="1000" y="420" font-family="${SANS}" font-size="56" fill="${GOLD_DARK}" text-anchor="middle" letter-spacing="10">THE PERFECT GIFT</text>
  <text x="1000" y="640" font-family="${SERIF}" font-size="135" fill="${NAVY}" text-anchor="middle" font-weight="bold">From the bride's</text>
  <text x="1000" y="810" font-family="${SERIF}" font-size="135" fill="${GOLD_DARK}" text-anchor="middle" font-weight="bold">(or groom's) parents.</text>
  <text x="1000" y="1080" font-family="${SANS}" font-size="64" fill="${NAVY_LIGHT}" text-anchor="middle">Everything you'd say in a toast, captured forever.</text>
  <text x="1000" y="1180" font-family="${SANS}" font-size="64" fill="${NAVY_LIGHT}" text-anchor="middle">Plus your closest friends and family, added in.</text>
  ${sealMark(1000, 1520, 150)}
  <text x="1000" y="1850" font-family="${SERIF}" font-size="50" fill="${GOLD_DARK}" text-anchor="middle" letter-spacing="6">SEALTHEDAY</text>
</svg>`;

// ---------- Slot 10: CTA ----------
const cta = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${NAVY}"/>
  <rect x="40" y="40" width="${W - 80}" height="${H - 80}" fill="none" stroke="${GOLD}" stroke-width="6"/>
  <text x="1000" y="560" font-family="${SERIF}" font-size="150" fill="${CREAM}" text-anchor="middle" font-weight="bold">Order today.</text>
  <text x="1000" y="820" font-family="${SERIF}" font-size="150" fill="${GOLD}" text-anchor="middle" font-weight="bold">Delivered in 24 hours.</text>
  <text x="1000" y="1080" font-family="${SERIF}" font-size="150" fill="${CREAM}" text-anchor="middle" font-weight="bold">Opened in 1 year.</text>
  <line x1="700" y1="1260" x2="1300" y2="1260" stroke="${GOLD}" stroke-width="4"/>
  <text x="1000" y="1420" font-family="${SANS}" font-size="62" fill="${CREAM}" text-anchor="middle">Perfect for weddings, showers &amp; engagements</text>
  <text x="1000" y="1740" font-family="${SERIF}" font-size="58" fill="${GOLD}" text-anchor="middle" letter-spacing="6">SEALTHEDAY.COM</text>
  <text x="1000" y="1840" font-family="${SANS}" font-size="44" fill="${CREAM}" text-anchor="middle">made in the US</text>
</svg>`;

// ---------- Slot 7: FOUNDER / TRUST ----------
const founder = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${CREAM}"/>
  ${frame(W, H)}
  ${sealMark(1000, 450, 170)}
  <text x="1000" y="810" font-family="${SERIF}" font-size="120" fill="${NAVY}" text-anchor="middle" font-weight="bold">Built by a small US team.</text>
  <text x="1000" y="1030" font-family="${SERIF}" font-size="66" fill="${NAVY_LIGHT}" text-anchor="middle" font-style="italic">"My photographer never showed up. I built this</text>
  <text x="1000" y="1130" font-family="${SERIF}" font-size="66" fill="${NAVY_LIGHT}" text-anchor="middle" font-style="italic">so no couple has to scramble like we did."</text>
  <text x="1000" y="1290" font-family="${SANS}" font-size="56" fill="${GOLD_DARK}" text-anchor="middle">— Simaan, founder</text>
  <rect x="490" y="1500" width="1020" height="120" rx="60" fill="none" stroke="${NAVY}" stroke-width="4"/>
  <text x="1000" y="1578" font-family="${SANS}" font-size="48" fill="${NAVY}" text-anchor="middle">Real human support · Replies within hours</text>
  <text x="1000" y="1850" font-family="${SERIF}" font-size="50" fill="${GOLD_DARK}" text-anchor="middle" letter-spacing="6">SEALTHEDAY</text>
</svg>`;

// ---------- Instant-download claim card (1600x2000 portrait) ----------
const claimW = 1600, claimH = 2000;
const claim = `<svg xmlns="http://www.w3.org/2000/svg" width="${claimW}" height="${claimH}" viewBox="0 0 ${claimW} ${claimH}">
  <rect width="${claimW}" height="${claimH}" fill="${CREAM}"/>
  <rect x="40" y="40" width="${claimW - 80}" height="${claimH - 80}" fill="none" stroke="${GOLD}" stroke-width="6"/>
  <rect x="60" y="60" width="${claimW - 120}" height="${claimH - 120}" fill="none" stroke="${GOLD}" stroke-width="2"/>
  ${sealMark(800, 330, 140)}
  <text x="800" y="620" font-family="${SERIF}" font-size="88" fill="${NAVY}" text-anchor="middle" font-weight="bold">Your Anniversary Capsule</text>
  <text x="800" y="730" font-family="${SERIF}" font-size="60" fill="${GOLD_DARK}" text-anchor="middle">Thank you for your order!</text>
  <text x="140" y="900" font-family="${SANS}" font-size="52" fill="${NAVY}" font-weight="bold">Here's what happens next:</text>
  <text x="140" y="1010" font-family="${SANS}" font-size="46" fill="${NAVY_LIGHT}">1.  Your unique claim link is on its way — check your</text>
  <text x="200" y="1070" font-family="${SANS}" font-size="46" fill="${NAVY_LIGHT}">Etsy Messages. It arrives within 24 hours of your</text>
  <text x="200" y="1130" font-family="${SANS}" font-size="46" fill="${NAVY_LIGHT}">order (usually within the hour).</text>
  <text x="140" y="1240" font-family="${SANS}" font-size="46" fill="${NAVY_LIGHT}">2.  If it's a gift: forward the link to the couple. If it's</text>
  <text x="200" y="1300" font-family="${SANS}" font-size="46" fill="${NAVY_LIGHT}">for you: open it and sign in — the capsule lands</text>
  <text x="200" y="1360" font-family="${SANS}" font-size="46" fill="${NAVY_LIGHT}">on your free account.</text>
  <text x="140" y="1470" font-family="${SANS}" font-size="46" fill="${NAVY_LIGHT}">3.  Build the vault: set a seal date (up to 12 months out)</text>
  <text x="200" y="1530" font-family="${SANS}" font-size="46" fill="${NAVY_LIGHT}">and invite your people. Guests need no account —</text>
  <text x="200" y="1590" font-family="${SANS}" font-size="46" fill="${NAVY_LIGHT}">they click a link and record from any phone.</text>
  <rect x="140" y="1680" width="1320" height="130" rx="20" fill="${CREAM_DARK}"/>
  <text x="800" y="1735" font-family="${SANS}" font-size="42" fill="${NAVY}" text-anchor="middle">Questions? Message us on Etsy — we reply within hours.</text>
  <text x="800" y="1785" font-family="${SANS}" font-size="42" fill="${NAVY}" text-anchor="middle">Full walkthrough: sealtheday.com/wedding</text>
  <text x="800" y="1905" font-family="${SERIF}" font-size="46" fill="${GOLD_DARK}" text-anchor="middle" letter-spacing="6">SEALTHEDAY</text>
</svg>`;

console.log("Generating Etsy listing images (2000x2000)...");
await render("01-hero.jpg", hero);
await render("04-how-it-works.jpg", howItWorks);
await render("05-inclusions.jpg", inclusions);
await render("06-testimonial.jpg", testimonial);
await render("07-founder.jpg", founder);
await render("08-maid-of-honor.jpg", moh);
await render("09-parents.jpg", parents);
await render("10-cta.jpg", cta);

console.log("Generating instant-download claim card...");
await sharp(Buffer.from(claim), { density: 96 })
  .resize(claimW, claimH)
  .flatten({ background: CREAM })
  .png()
  .toFile(resolve(DL, "how-to-claim.png"));
console.log("  ✓ how-to-claim.png");

console.log("\nDone. Images in etsy/images/, download file in etsy/download/");

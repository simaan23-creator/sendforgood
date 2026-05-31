#!/usr/bin/env node
/**
 * Send a single rendered template to a chosen address for visual review.
 * USAGE: node scripts/leads/preview-email.mjs [recipient@example.com]
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Resend } from "resend";
import { TEMPLATES, SENDER } from "./templates.mjs";

const env = Object.fromEntries(
  readFileSync(resolve(process.cwd(), ".env.local"), "utf8")
    .split(/\r?\n/).filter(l => l && !l.startsWith("#") && l.includes("="))
    .map(l => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; })
);
process.env.NEXT_PUBLIC_SITE_URL = env.NEXT_PUBLIC_SITE_URL || "https://sealtheday.com";

const TO = process.argv[2] || SENDER.replyTo;
const fakeLead = {
  business_name: "Acme Wedding Photography",
  email: TO,
  city: "Austin",
  state: "TX",
};

const resend = new Resend(env.RESEND_API_KEY);
for (const key of ["photographer_initial_v1", "photographer_followup_v1"]) {
  const r = TEMPLATES[key].render(fakeLead);
  const res = await resend.emails.send({
    from: `${SENDER.name} <${SENDER.email}>`,
    to: TO,
    replyTo: SENDER.replyTo,
    subject: `[PREVIEW ${key}] ` + r.subject,
    html: r.html,
    text: r.text,
  });
  console.log(key, "→", TO, res.data?.id || res.error);
}

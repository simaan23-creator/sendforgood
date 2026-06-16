#!/usr/bin/env node
/**
 * Send a single rendered template to a chosen address for visual review.
 * USAGE: node scripts/leads/preview-email.mjs [recipient@example.com]
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Resend } from "resend";
import { TEMPLATES, SENDER, unsubHeaders } from "./templates.mjs";

const env = Object.fromEntries(
  readFileSync(resolve(process.cwd(), ".env.local"), "utf8")
    .split(/\r?\n/).filter(l => l && !l.startsWith("#") && l.includes("="))
    .map(l => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; })
);
process.env.NEXT_PUBLIC_SITE_URL = env.NEXT_PUBLIC_SITE_URL || "https://sealtheday.com";

const TO = process.argv[2] || SENDER.replyTo;
// Pass a 3rd CLI arg with a comma-separated list of template keys to
// preview a subset. Default sends all four current variants (photographer
// v2 and officiant v1).
const keysArg = process.argv[3];
const keys = keysArg
  ? keysArg.split(",").map((s) => s.trim()).filter(Boolean)
  : [
      "photographer_initial_v2",
      "photographer_followup_v2",
      "officiant_initial_v1",
      "officiant_followup_v1",
    ];

function fakeLeadFor(key) {
  if (key.startsWith("officiant")) {
    return {
      business_name: "Rev. Jane Doe Wedding Ceremonies",
      email: TO,
      city: "Austin",
      state: "TX",
    };
  }
  return {
    business_name: "Acme Wedding Photography",
    email: TO,
    city: "Austin",
    state: "TX",
  };
}

const resend = new Resend(env.RESEND_API_KEY);
for (const key of keys) {
  if (!TEMPLATES[key]) {
    console.log(key, "→ SKIP (unknown template)");
    continue;
  }
  const r = TEMPLATES[key].render(fakeLeadFor(key));
  const res = await resend.emails.send({
    from: `${SENDER.name} <${SENDER.email}>`,
    to: TO,
    replyTo: SENDER.replyTo,
    subject: `[PREVIEW ${key}] ` + r.subject,
    html: r.html,
    text: r.text,
    headers: unsubHeaders(TO),
  });
  console.log(key, "→", TO, res.data?.id || res.error);
}

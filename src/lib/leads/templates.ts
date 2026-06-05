/**
 * TypeScript port of scripts/leads/templates.mjs.
 *
 * Why two copies?
 *   - The .mjs lives next to the local CLI sender (scripts/leads/*.mjs) and
 *     gets imported by Node directly with no build step.
 *   - This .ts is imported by the Vercel cron route, where the Next.js build
 *     pipeline expects typed ESM-from-source.
 *
 * IF YOU EDIT TEMPLATE COPY, edit BOTH files. They are intentionally kept
 * in sync by hand — the templates are short and copy-pasteable, and that's
 * cheaper than building a shared bundle just for two callers.
 *
 * See the .mjs file for full design notes on the cold-email playbook.
 */

export type Lead = {
  id?: string;
  business_name: string;
  email: string;
  city?: string | null;
  state?: string | null;
};

export type Rendered = {
  subject: string;
  html: string;
  text: string;
};

export const SENDER = {
  name: "Simaan at SealTheDay",
  // Cold outreach sends from a dedicated subdomain so its reputation is
  // isolated from the transactional sealtheday.com domain (order receipts,
  // gift notifications, etc). If cold mail ever tanks reputation, it
  // doesn't take order confirmations with it.
  email: "simaan@outreach.sealtheday.com",
  // Reply-To points back at the root-domain M365 alias so replies land in
  // the monitored inbox (forwards to Simaan23@gmail.com). Gmail treats
  // subdomain-of-sender Reply-Tos as benign — it's only fully unrelated
  // domains that trip the phishing heuristic.
  replyTo: "simaan@sealtheday.com",
};

const PHYSICAL_ADDRESS = "SendForGood, LLC \u00b7 Austin, TX";

// Founder direct line, included in the signature. Display format is what
// recipients see; E.164 (+1...) is what HTML mail clients need for the
// tap-to-call tel: link on mobile. Keep both in sync.
const CONTACT_PHONE_DISPLAY = "631-241-5247";
const CONTACT_PHONE_E164 = "+16312415247";

function unsubLink(email: string): string {
  // Deliverability rule: unsubscribe link domain MUST match sender domain or
  // Resend/spam filters flag the message. Derive from SENDER.email.
  const senderDomain = SENDER.email.split("@")[1];
  const base = `https://${senderDomain}`;
  return `${base}/api/leads/unsubscribe?email=${encodeURIComponent(email)}`;
}

function firstName(businessName: string): string | null {
  const cleaned = businessName
    .replace(/photography|photo|studios?|films?|productions?|llc|inc\.?/gi, "")
    .trim();
  const first = cleaned.split(/\s+/)[0];
  if (first && /^[A-Z][a-z]+$/.test(first)) return first;
  return null;
}

function plainFooter(email: string): string {
  return [
    "",
    "\u2014",
    "Simaan",
    "Founder, SealTheDay",
    `sealtheday.com \u00b7 ${CONTACT_PHONE_DISPLAY}`,
    "",
    PHYSICAL_ADDRESS,
    `Don't want to hear from me? ${unsubLink(email)}`,
  ].join("\n");
}

function htmlFooter(email: string): string {
  return `
    <p style="margin-top:24px;color:#555;">&mdash;<br/>
      Simaan<br/>
      Founder, SealTheDay<br/>
      <a href="https://sealtheday.com" style="color:#555;">sealtheday.com</a> &middot; <a href="tel:${CONTACT_PHONE_E164}" style="color:#555;">${CONTACT_PHONE_DISPLAY}</a>
    </p>
    <p style="margin-top:24px;font-size:12px;color:#888;line-height:1.5;">
      ${PHYSICAL_ADDRESS}<br/>
      <a href="${unsubLink(email)}" style="color:#888;">Don't want to hear from me? One-click unsubscribe.</a>
    </p>
  `;
}

function wrapHtml(bodyParagraphs: string[], email: string): string {
  const paragraphs = bodyParagraphs
    .map((p) => `<p style="margin:0 0 14px;line-height:1.55;color:#222;">${p}</p>`)
    .join("\n");
  return `<div style="font-family:-apple-system,Segoe UI,Arial,sans-serif;font-size:15px;max-width:560px;">
${paragraphs}
${htmlFooter(email)}
</div>`;
}

function photographerInitialV1(lead: Lead): Rendered {
  const greeting = firstName(lead.business_name)
    ? `Hey ${firstName(lead.business_name)},`
    : `Hey ${lead.business_name},`;
  const cityLine = lead.city
    ? `Caught your work while looking at ${lead.city} wedding photographers \u2014 beautiful stuff.`
    : `Caught your work the other day \u2014 beautiful stuff.`;

  // New angle (per founder, Nov 2025): lead with the photographer's value
  // proposition (differentiation, looking pro), not with our affiliate %.
  // Money mention is demoted to a parenthetical so the email reads like a
  // peer tip rather than a sales pitch.
  const paragraphs = [
    greeting,
    cityLine,
    `Quick thought you might find useful: a few photographers we work with have started offering a small memory vault as an add-on to their booking. Couples set it up themselves and every guest contributes the moments you can't physically be in \u2014 getting ready, the back hallway, the 2am dance floor.`,
    `It sweetens the package for couples, sets you apart from photographers who just hand over a gallery, and quietly makes you the pro who thought of every detail. (There's an affiliate kickback per sale, but most of our partners say the differentiation is the bigger win.)`,
    `If your clients sound like the type: https://sealtheday.com/affiliate/apply`,
  ];

  const subject = lead.city
    ? `small idea for your ${lead.city} couples`
    : `small idea for your couples`;

  const text = paragraphs.join("\n\n") + plainFooter(lead.email);
  const html = wrapHtml(paragraphs, lead.email);

  return { subject, html, text };
}

function photographerFollowupV1(lead: Lead): Rendered {
  const greeting = firstName(lead.business_name)
    ? `Hey ${firstName(lead.business_name)},`
    : `Hey ${lead.business_name},`;

  const paragraphs = [
    greeting,
    `Bumping in case it slipped past \u2014 wedding season inboxes are wild.`,
    `Quick recap: it's a small memory vault couples can add to their package after booking. Their guests contribute the moments you can't physically capture, and you end up looking like the photographer who thought of every detail.`,
    `If it's not your thing, no worries \u2014 I won't email again. If it is: https://sealtheday.com/affiliate/apply`,
  ];

  const subject = "re: small idea for your couples";
  const text = paragraphs.join("\n\n") + plainFooter(lead.email);
  const html = wrapHtml(paragraphs, lead.email);

  return { subject, html, text };
}

// ──────────────────────────────────────────────────────────────────────
// Template: photographer_initial_v2
//
// Lead-with-gift variant ("drug dealer" framing per founder, Jun 2026).
// v1 was peer-tip framing with the affiliate kickback demoted; it hit
// 0 conversions in 115 sends, so v2 leads with the free Anniversary
// Capsule hook and names the concrete $29.95 product + 10–15% tier.
// ──────────────────────────────────────────────────────────────────────
function photographerInitialV2(lead: Lead): Rendered {
  const greeting = firstName(lead.business_name)
    ? `Hey ${firstName(lead.business_name)},`
    : `Hey ${lead.business_name},`;
  const cityLine = lead.city
    ? `Caught your work while looking at ${lead.city} wedding photographers \u2014 beautiful stuff.`
    : `Caught your work the other day \u2014 beautiful stuff.`;

  const paragraphs = [
    greeting,
    cityLine,
    `Short version: I'd rather you try our product than take my word for it. Two Anniversary Capsules are on me \u2014 one for your own family, one to gift to a couple you've shot. It's a small sealed vault of guest messages and photos that opens on the couple's first anniversary ($29.95 retail each).`,
    `If your clients dig it, there's an affiliate program behind it \u2014 10\u201315% commission, custom URL, and a "Recommended by [your studio]" banner on the page anyone you send lands on. Five minutes:`,
    `https://sealtheday.com/affiliate/apply`,
  ];

  const subject = lead.city
    ? `small gift for ${lead.city} wedding photographers`
    : `small gift for wedding photographers`;

  const text = paragraphs.join("\n\n") + plainFooter(lead.email);
  const html = wrapHtml(paragraphs, lead.email);

  return { subject, html, text };
}

function photographerFollowupV2(lead: Lead): Rendered {
  const greeting = firstName(lead.business_name)
    ? `Hey ${firstName(lead.business_name)},`
    : `Hey ${lead.business_name},`;

  const paragraphs = [
    greeting,
    `Bumping in case it slipped past \u2014 wedding season inboxes are wild.`,
    `Quick recap: small sealed vault couples open on their first anniversary ($29.95). You pitch it, earn 10\u201315% commission, and get a "Recommended by [your studio]" landing page for your audience. Two Capsules are on me \u2014 one for you, one to gift \u2014 so you can try it before pitching.`,
    `If it's not your thing, no worries \u2014 won't email again. If it is: https://sealtheday.com/affiliate/apply`,
  ];

  const subject = lead.city
    ? `re: small gift for ${lead.city} wedding photographers`
    : `re: small gift for wedding photographers`;
  const text = paragraphs.join("\n\n") + plainFooter(lead.email);
  const html = wrapHtml(paragraphs, lead.email);

  return { subject, html, text };
}

/**
 * RFC 8058 List-Unsubscribe headers.
 *
 * Gmail's Feb 2024 bulk-sender rules require these for any sender hitting
 * 5k+/day, and the major filters (Gmail, Outlook, Yahoo) all use their
 * presence as a positive signal even below that threshold. Without these,
 * mail-tester drops ~1 point and inbox providers may demote you regardless
 * of how good your auth and content are.
 *
 * The two-value List-Unsubscribe gives the recipient both:
 *   - an HTTPS URL (clicked by Gmail's native "Unsubscribe" link)
 *   - a mailto: (used by Outlook and some older clients)
 *
 * List-Unsubscribe-Post = One-Click tells Gmail it can POST to the URL
 * without showing a confirmation page — required for the native unsub link
 * to appear at all.
 */
export function unsubHeaders(email: string): Record<string, string> {
  const senderDomain = SENDER.email.split("@")[1];
  const link = `https://${senderDomain}/api/leads/unsubscribe?email=${encodeURIComponent(email)}`;
  return {
    "List-Unsubscribe": `<${link}>, <mailto:${SENDER.replyTo}?subject=unsubscribe>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };
}

export type TemplateKey =
  | "photographer_initial_v1"
  | "photographer_followup_v1"
  | "photographer_initial_v2"
  | "photographer_followup_v2";

export const TEMPLATES: Record<
  TemplateKey,
  { sequenceStep: number; render: (lead: Lead) => Rendered }
> = {
  photographer_initial_v1: {
    sequenceStep: 1,
    render: photographerInitialV1,
  },
  photographer_followup_v1: {
    sequenceStep: 2,
    render: photographerFollowupV1,
  },
  photographer_initial_v2: {
    sequenceStep: 1,
    render: photographerInitialV2,
  },
  photographer_followup_v2: {
    sequenceStep: 2,
    render: photographerFollowupV2,
  },
};

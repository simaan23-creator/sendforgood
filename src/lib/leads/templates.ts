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
    "https://sealtheday.com",
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
      <a href="https://sealtheday.com" style="color:#555;">sealtheday.com</a>
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

export type TemplateKey =
  | "photographer_initial_v1"
  | "photographer_followup_v1";

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
};

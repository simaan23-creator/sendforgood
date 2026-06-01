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
  email: "simaan@sealtheday.com",
  // Replies go straight to a real monitored Gmail inbox via Reply-To header,
  // so we don't need a forwarding alias on sealtheday.com.
  replyTo: "Simaan23@gmail.com",
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
    ? `I came across ${lead.business_name} while looking at ${lead.city} wedding photographers and your work looks great.`
    : `I came across ${lead.business_name} and your work looks great.`;

  const paragraphs = [
    greeting,
    cityLine,
    `Quick pitch: I run SealTheDay \u2014 a $99 guest-recording vault. Couples drop a QR code on each table and their 150 guests capture all the moments you can't (the back hallway, the bridal suite, the 2am dance floor). Then they re-open the vault on whatever date they pick.`,
    `We pay photographers 15% on their first sale and 10% on every repeat \u2014 for the life of the account. No minimums, no exclusivity, paid monthly via PayPal/Venmo.`,
    `Most photographers add one line to their booking confirmation email and earn beer money on every wedding. Worth a 30-second look?`,
    `Affiliate page: https://sealtheday.com/affiliate/apply`,
  ];

  const subject = lead.city
    ? `${lead.city} weddings + your couples`
    : `Your couples + a quick idea`;

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
    `Bumping this in case it slipped past \u2014 I know inboxes are loud in wedding season.`,
    `Short version: SealTheDay pays you 15% (first) / 10% (recurring) for any couple you refer to our $99 guest-recording vault. Drop your link in your booking email, get paid monthly.`,
    `If it's not for you, totally fine \u2014 no further emails from me either way. If it is: https://sealtheday.com/affiliate/apply`,
  ];

  const subject = "re: a quick idea for your couples";
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

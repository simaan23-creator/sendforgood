/**
 * Cold outreach templates for photographer leads.
 *
 * Design principles (cold-email playbook):
 *   - Plain-ish text, no images, no logo, no tracking pixel
 *   - First line is specific to them (city + business name)
 *   - One value prop, one ask, under ~100 words
 *   - Subject line short and human, no "URGENT" / "OPPORTUNITY" / emoji
 *   - Real reply-to address that goes to a monitored inbox
 *   - Plain footer with physical address + one-click unsubscribe (CAN-SPAM)
 *
 * Each template is a pure function (lead) => { subject, html, text }.
 * Adding a new template = add a new entry to TEMPLATES.
 *
 * Reusing the same template_key on a re-send is allowed but discouraged —
 * Resend will let it through but it looks spammy. Use sequence_step to pick
 * the right follow-up template based on history.
 */

// Hard-coded — change here, not in env. The send script reads this to
// stamp every outreach row so we can audit what's been sent.
export const SENDER = {
  name: "Simaan at SealTheDay",
  // From address — sealtheday.com is verified in Resend so this sends fine,
  // but no mailbox exists at it. Replies are routed via replyTo below.
  email: "simaan@sealtheday.com",
  // Reply-To override — when a recipient hits "Reply" their client uses
  // this header, so replies land directly in the real Gmail inbox without
  // needing a forwarding alias on sealtheday.com.
  replyTo: "Simaan23@gmail.com",
};

// Physical address line — required for CAN-SPAM. Update with your real one.
const PHYSICAL_ADDRESS = "SendForGood, LLC · Austin, TX";

function unsubLink(email) {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL || "https://sealtheday.com";
  return `${base}/api/leads/unsubscribe?email=${encodeURIComponent(email)}`;
}

function firstName(businessName) {
  // Best-effort: photographers often name studios after themselves.
  // "Jane Smith Photography" → "Jane"
  const cleaned = businessName
    .replace(/photography|photo|studios?|films?|productions?|llc|inc\.?/gi, "")
    .trim();
  const first = cleaned.split(/\s+/)[0];
  if (first && /^[A-Z][a-z]+$/.test(first)) return first;
  return null;
}

function plainFooter(email) {
  return [
    "",
    "—",
    "Simaan",
    "Founder, SealTheDay",
    "https://sealtheday.com",
    "",
    PHYSICAL_ADDRESS,
    `Don't want to hear from me? ${unsubLink(email)}`,
  ].join("\n");
}

function htmlFooter(email) {
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

// Wrap a plain body in a minimal HTML doc. No CSS frameworks, no fancy
// styling — that's what gets cold mail flagged. Just paragraphs.
function wrapHtml(bodyParagraphs, email) {
  const paragraphs = bodyParagraphs
    .map((p) => `<p style="margin:0 0 14px;line-height:1.55;color:#222;">${p}</p>`)
    .join("\n");
  return `<div style="font-family:-apple-system,Segoe UI,Arial,sans-serif;font-size:15px;max-width:560px;">
${paragraphs}
${htmlFooter(email)}
</div>`;
}

// ──────────────────────────────────────────────────────────────────────
// Template: photographer_initial_v1
// ──────────────────────────────────────────────────────────────────────
function photographerInitialV1(lead) {
  const greeting = firstName(lead.business_name)
    ? `Hey ${firstName(lead.business_name)},`
    : `Hey ${lead.business_name},`;
  const cityLine = lead.city
    ? `I came across ${lead.business_name} while looking at ${lead.city} wedding photographers and your work looks great.`
    : `I came across ${lead.business_name} and your work looks great.`;

  const paragraphs = [
    greeting,
    cityLine,
    `Quick pitch: I run SealTheDay — a $99 guest-recording vault. Couples drop a QR code on each table and their 150 guests capture all the moments you can't (the back hallway, the bridal suite, the 2am dance floor). Then they re-open the vault on whatever date they pick.`,
    `We pay photographers 15% on their first sale and 10% on every repeat — for the life of the account. No minimums, no exclusivity, paid monthly via PayPal/Venmo.`,
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

// ──────────────────────────────────────────────────────────────────────
// Template: photographer_followup_v1
// ──────────────────────────────────────────────────────────────────────
function photographerFollowupV1(lead) {
  const greeting = firstName(lead.business_name)
    ? `Hey ${firstName(lead.business_name)},`
    : `Hey ${lead.business_name},`;

  const paragraphs = [
    greeting,
    `Bumping this in case it slipped past — I know inboxes are loud in wedding season.`,
    `Short version: SealTheDay pays you 15% (first) / 10% (recurring) for any couple you refer to our $99 guest-recording vault. Drop your link in your booking email, get paid monthly.`,
    `If it's not for you, totally fine — no further emails from me either way. If it is: https://sealtheday.com/affiliate/apply`,
  ];

  const subject = "re: a quick idea for your couples";
  const text = paragraphs.join("\n\n") + plainFooter(lead.email);
  const html = wrapHtml(paragraphs, lead.email);

  return { subject, html, text };
}

export const TEMPLATES = {
  photographer_initial_v1: {
    sequenceStep: 1,
    render: photographerInitialV1,
  },
  photographer_followup_v1: {
    sequenceStep: 2,
    render: photographerFollowupV1,
  },
};

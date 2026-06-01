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
  // From + Reply-To both at the same address. simaan@sealtheday.com is a
  // real Microsoft 365 alias that forwards to Simaan23@gmail.com, so
  // replies still reach the monitored inbox — but the SMTP From and
  // Reply-To headers now match, which removes a major Gmail spam signal
  // (cross-domain Reply-To looks like phishing).
  email: "simaan@sealtheday.com",
  replyTo: "simaan@sealtheday.com",
};

// Physical address line — required for CAN-SPAM. Update with your real one.
const PHYSICAL_ADDRESS = "SendForGood, LLC · Austin, TX";

function unsubLink(email) {
  // CRITICAL for deliverability: the unsubscribe link domain MUST match the
  // sender's domain. If it doesn't (e.g. sender=@sealtheday.com but link
  // points to sendforgood.com), Resend and most spam filters flag the
  // email as a phishing signal — even if the mismatch is just a redirect.
  // We derive the base from SENDER.email so this stays in sync if the
  // sending address ever changes.
  const senderDomain = SENDER.email.split("@")[1];
  const base = `https://${senderDomain}`;
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
    ? `Caught your work while looking at ${lead.city} wedding photographers — beautiful stuff.`
    : `Caught your work the other day — beautiful stuff.`;

  // New angle (per founder, Nov 2025): lead with the photographer's value
  // proposition (differentiation, looking pro), not with our affiliate %.
  // Money mention is demoted to a parenthetical so the email reads like a
  // peer tip rather than a sales pitch — which both feels better and
  // tests less spammy in Gmail's filter.
  const paragraphs = [
    greeting,
    cityLine,
    `Quick thought you might find useful: a few photographers we work with have started offering a small memory vault as an add-on to their booking. Couples set it up themselves and every guest contributes the moments you can't physically be in — getting ready, the back hallway, the 2am dance floor.`,
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

// ──────────────────────────────────────────────────────────────────────
// Template: photographer_followup_v1
// ──────────────────────────────────────────────────────────────────────
function photographerFollowupV1(lead) {
  const greeting = firstName(lead.business_name)
    ? `Hey ${firstName(lead.business_name)},`
    : `Hey ${lead.business_name},`;

  const paragraphs = [
    greeting,
    `Bumping in case it slipped past — wedding season inboxes are wild.`,
    `Quick recap: it's a small memory vault couples can add to their package after booking. Their guests contribute the moments you can't physically capture, and you end up looking like the photographer who thought of every detail.`,
    `If it's not your thing, no worries — I won't email again. If it is: https://sealtheday.com/affiliate/apply`,
  ];

  const subject = "re: small idea for your couples";
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

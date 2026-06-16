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

// Physical address line — required for CAN-SPAM. Update with your real one.
const PHYSICAL_ADDRESS = "SendForGood, LLC · Austin, TX";

// Founder direct line, included in the signature. Display format is what
// recipients see; E.164 (+1...) is what HTML mail clients need for the
// tap-to-call tel: link on mobile. Keep both in sync.
const CONTACT_PHONE_DISPLAY = "631-241-5247";
const CONTACT_PHONE_E164 = "+16312415247";

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
  // Best-effort: photographers/officiants often name businesses after themselves.
  // "Jane Smith Photography" → "Jane"
  // "Rev. John Doe Wedding Ceremonies" → "John" (after stripping titles)
  const cleaned = businessName
    .replace(/\b(rev\.?|reverend|minister|officiant|ceremonies?|weddings?|celebrant|pastor|father)\b/gi, "")
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
    `sealtheday.com · ${CONTACT_PHONE_DISPLAY}`,
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
      <a href="https://sealtheday.com" style="color:#555;">sealtheday.com</a> &middot; <a href="tel:${CONTACT_PHONE_E164}" style="color:#555;">${CONTACT_PHONE_DISPLAY}</a>
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

// ──────────────────────────────────────────────────────────────────────
// Template: photographer_initial_v2
//
// Lead-with-gift variant ("drug dealer" framing per founder, Jun 2026).
// v1 was peer-tip framing with the affiliate kickback demoted; it hit
// 0 conversions in 115 sends, so v2 leads with the free Anniversary
// Capsule hook and names the concrete $29.95 product + 10–15% tier.
// ──────────────────────────────────────────────────────────────────────
function photographerInitialV2(lead) {
  const greeting = firstName(lead.business_name)
    ? `Hey ${firstName(lead.business_name)},`
    : `Hey ${lead.business_name},`;
  const cityLine = lead.city
    ? `Caught your work while looking at ${lead.city} wedding photographers — beautiful stuff.`
    : `Caught your work the other day — beautiful stuff.`;

  const paragraphs = [
    greeting,
    cityLine,
    `Short version: I'd rather you try our product than take my word for it. Two Anniversary Capsules are on me — one for your own family, one to gift to a couple you've shot. It's a small sealed vault of guest messages and photos that opens on the couple's first anniversary ($29.95 retail each).`,
    `If your clients dig it, there's an affiliate program behind it — 10–15% commission, custom URL, and a "Recommended by [your studio]" banner on the page anyone you send lands on. Five minutes:`,
    `https://sealtheday.com/affiliate/apply`,
  ];

  const subject = lead.city
    ? `small gift for ${lead.city} wedding photographers`
    : `small gift for wedding photographers`;

  const text = paragraphs.join("\n\n") + plainFooter(lead.email);
  const html = wrapHtml(paragraphs, lead.email);

  return { subject, html, text };
}

// ──────────────────────────────────────────────────────────────────────
// Template: photographer_followup_v2
// ──────────────────────────────────────────────────────────────────────
function photographerFollowupV2(lead) {
  const greeting = firstName(lead.business_name)
    ? `Hey ${firstName(lead.business_name)},`
    : `Hey ${lead.business_name},`;

  const paragraphs = [
    greeting,
    `Bumping in case it slipped past — wedding season inboxes are wild.`,
    `Quick recap: small sealed vault couples open on their first anniversary ($29.95). You pitch it, earn 10–15% commission, and get a "Recommended by [your studio]" landing page for your audience. Two Capsules are on me — one for you, one to gift — so you can try it before pitching.`,
    `If it's not your thing, no worries — won't email again. If it is: https://sealtheday.com/affiliate/apply`,
  ];

  const subject = lead.city
    ? `re: small gift for ${lead.city} wedding photographers`
    : `re: small gift for wedding photographers`;
  const text = paragraphs.join("\n\n") + plainFooter(lead.email);
  const html = wrapHtml(paragraphs, lead.email);

  return { subject, html, text };
}

// RFC 8058 List-Unsubscribe headers. Gmail/Outlook/Yahoo all treat their
// presence as a positive deliverability signal and render a native
// "Unsubscribe" link at the top of the message. See templates.ts for the
// full reasoning. Keep in sync with the .ts version.
export function unsubHeaders(email) {
  const senderDomain = SENDER.email.split("@")[1];
  const link = `https://${senderDomain}/api/leads/unsubscribe?email=${encodeURIComponent(email)}`;
  return {
    "List-Unsubscribe": `<${link}>, <mailto:${SENDER.replyTo}?subject=unsubscribe>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };
}

// ──────────────────────────────────────────────────────────────────────
// Template: officiant_initial_v1
//
// Officiants meet couples at the most emotionally loaded moment of the
// wedding. They're rarely pitched, and their recommendation carries
// trust photographers can't match (photographers are also vendors;
// officiants are advisors). Value prop pivots from "differentiate your
// gallery" to "give your couples a ceremony keepsake."
// ──────────────────────────────────────────────────────────────────────
function officiantInitialV1(lead) {
  const greeting = firstName(lead.business_name)
    ? `Hey ${firstName(lead.business_name)},`
    : `Hi there,`;
  const cityLine = lead.city
    ? `Came across your work while researching ${lead.city} wedding officiants — appreciate what you do for couples on what's easily the most loaded morning of their lives.`
    : `Came across your work the other day — appreciate what you do for couples on what's easily the most loaded morning of their lives.`;

  const paragraphs = [
    greeting,
    cityLine,
    `Quick idea: I run a small product called SealTheDay — a sealed memory vault couples set up before the wedding so their guests can record private video messages that open on a chosen future date (their 1st anniversary, their 10th, the morning after). It pairs really naturally with what officiants already do — you're the one person who talks with both sides about what this day means to them.`,
    `Two Anniversary Capsules are on me — one for your own family, one to gift to a couple you've married. If your clients dig it, there's an affiliate program (10–15% commission, a custom URL, and a "Recommended by [your name]" banner on the page). Five minutes:`,
    `https://sealtheday.com/affiliate/apply`,
  ];

  const subject = lead.city
    ? `small idea for your ${lead.city} couples`
    : `small idea for your couples`;

  const text = paragraphs.join("\n\n") + plainFooter(lead.email);
  const html = wrapHtml(paragraphs, lead.email);

  return { subject, html, text };
}

// ──────────────────────────────────────────────────────────────────────
// Template: officiant_followup_v1
// ──────────────────────────────────────────────────────────────────────
function officiantFollowupV1(lead) {
  const greeting = firstName(lead.business_name)
    ? `Hey ${firstName(lead.business_name)},`
    : `Hi there,`;

  const paragraphs = [
    greeting,
    `Bumping in case it slipped past — wedding-season inboxes are wild.`,
    `Quick recap: small sealed vault couples open on their 1st anniversary ($29.95). You mention it during planning, earn 10–15% commission, and get a "Recommended by [your name]" landing page for your couples. Two Capsules are on me — one for you, one to gift — so you can try it before pitching.`,
    `If it's not your thing, no worries — won't email again. If it is: https://sealtheday.com/affiliate/apply`,
  ];

  const subject = lead.city
    ? `re: small idea for your ${lead.city} couples`
    : `re: small idea for your couples`;
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
  photographer_initial_v2: {
    sequenceStep: 1,
    render: photographerInitialV2,
  },
  photographer_followup_v2: {
    sequenceStep: 2,
    render: photographerFollowupV2,
  },
  officiant_initial_v1: {
    sequenceStep: 1,
    render: officiantInitialV1,
  },
  officiant_followup_v1: {
    sequenceStep: 2,
    render: officiantFollowupV1,
  },
};

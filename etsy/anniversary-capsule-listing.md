# Etsy listing: Anniversary Capsule (Wedding Gift)

Internal reference doc for the Etsy listing. Not deployed.

## Listing setup

| Field | Value |
|---|---|
| Category | Weddings → Gifts & Mementos → Other Gifts & Mementos |
| Type | Digital download (no physical shipping) |
| Renews | Auto-renew |
| Quantity | 999 (Etsy caps at 999; we mint codes manually so it's effectively unlimited) |
| **Listed price** | **$34.95** USD |
| Processing time | Same-day to 1 business day |
| Item attribute: Occasion | Wedding |
| Item attribute: Recipient | Couple |
| Item attribute: Holiday | (leave blank — don't restrict seasonality) |
| Personalization | OFF (we don't take personalization at order time; couple personalizes in-app) |
| Section | Create new section: "Anniversary Capsules" |

Why $34.95: Etsy takes a listing fee ($0.20) + transaction fee (~6.5%) + payment processing (~3% + $0.25). On $34.95 that nets us roughly $30.80. Our internal Anniversary Capsule is $29.95, so this leaves ~$0.85 cushion for variability + a slim margin to absorb fluctuations. Adjust upward to $39.95 if Etsy fees creep or if conversion is strong after 2 weeks (test $39.95 once you have 10+ sales for baseline).

### Item attributes are not optional

Etsy weights attribute fields nearly as much as title for search ranking. **Always fill in Occasion = Wedding and Recipient = Couple** — these unlock filtered-search visibility ("wedding gifts for couples" filter on Etsy mobile).

## Title (140 char max)

```
Wedding Gift for Couple, Anniversary Time Capsule, Video Messages from Loved Ones, Sentimental Newlywed Gift, Paper Anniversary
```

(128 chars.)

### Why this title

Etsy's search ranks the first 3-4 words most heavily, so we lead with **"Wedding Gift for Couple"** — the exact phrase wedding-gift shoppers actually type. Then we pack 4 more distinct phrase-match groups so a single listing can rank on:

1. `wedding gift for couple` (very high volume, our primary intent)
2. `anniversary time capsule` (defining/niche — we own this term)
3. `video messages` (modifier, helps in "video message gift" searches)
4. `sentimental newlywed gift` (high-intent + emotional buyer)
5. `paper anniversary` (1st-anniversary tradition = paper; surprisingly high search vol and we naturally fit)

Comma separators outperform pipes for Etsy's tokenizer in 2025+ — it treats each comma-separated chunk as an independent phrase candidate.

### Alternate titles to A/B after 2 weeks if conversion is weak

- `Wedding Gift, 1st Anniversary Time Capsule for Couple, Sealed Video Messages, Unique Sentimental Newlywed Gift, Digital`
- `Anniversary Time Capsule, Wedding Gift for Couple, Video Messages from Family and Friends, Sealed Until 1st Anniversary`

## Description

> Etsy shows the first ~160 chars in Google results and previews. Lead with the strongest one-line pitch.

```
A wedding gift the couple opens together on their first anniversary — sealed video messages from the people who love them most. Digital, delivered fast.

★ THE IDEA

Most wedding gifts get unwrapped once. This one waits.

You order it before (or right after) the wedding. The couple invites the people closest to them — best man, grandmother, the cousin who couldn't fly out — to record short video messages. They add a few photos that didn't make the album. Then the whole vault seals shut for up to 12 months.

On their first anniversary, they sit on the couch, open the link together, and watch the people who love them tell them why this marriage matters. As their first married tradition.

It's the modern paper anniversary gift — except the paper is video.

★ WHAT'S INCLUDED

• 1 private Memory Vault (their own URL + dashboard)
• 6 video message slots (up to 2 minutes each, HD)
• 15 photo upload slots (full resolution)
• Seal date up to 12 months in the future
• Lifetime download access — they keep every video and photo, forever

★ HOW IT WORKS

1. Order this listing — you'll get a redemption link within hours (24 hours max)
2. Forward the link to the couple (or claim it yourself if it's for you)
3. The couple sets a seal date (up to 1 year out) and invites their people
   to record messages — no app, no signup, no account needed for guests
4. The vault locks until the chosen date
5. On the date, the couple opens it together and watches every message

★ WHO IT'S FOR

• Wedding gift from a friend, parent, sibling, or maid of honor
• Bridal shower gift with more staying power than a kitchen mixer
• Engagement gift with a "save it for your first anniversary" twist
• Last-minute wedding gift — delivered digitally, no shipping delays
• 1st anniversary gift (the modern paper anniversary)
• Group gift — split the cost between the bridal party

★ FAQ

Q: Does the couple need an account?
A: Yes — one free SealTheDay account to manage the vault. Their guests
   recording messages do NOT need an account. They just click a link
   and record from their phone.

Q: What if they don't want to use it right away?
A: The capsule credits don't expire. They can build the vault whenever
   they want. 48-hour refund window after redemption.

Q: Can I see what it looks like first?
A: Yes — sealtheday.com/wedding has the full walkthrough.

Q: How is this different from a wedding video?
A: A videographer captures the wedding day. This captures the people who
   couldn't be there — or the things they didn't get to say out loud. And
   it's saved for a future moment, not the day itself.

Q: When does my buyer get the redemption link?
A: Within 24 hours of order. Usually within an hour during US business hours.

Q: Can I gift it without telling the couple in advance?
A: Yes. Forward the redemption link with a note. They sign in, set the
   seal date, and invite their people on their own time.

Made by a small two-person team in the US. Questions? Message me
directly — I respond within a few hours during US business hours.
```

## Tags (Etsy max 13, 20 chars each)

```
wedding gift
wedding gift couple
anniversary gift
time capsule
paper anniversary
newlywed gift
bridal shower gift
engagement gift
sentimental gift
unique wedding gift
digital wedding gift
wedding keepsake
last minute gift
```

### Why each tag

| Tag | Why it earns its slot |
|---|---|
| `wedding gift` | The base search every wedding-gift shopper types. Non-negotiable. |
| `wedding gift couple` | High-intent exact match — buyer has narrowed to "for the couple." |
| `anniversary gift` | Captures the 1st-anniversary intent angle. |
| `time capsule` | Niche but defining — we own this term in the wedding space. |
| `paper anniversary` | Traditional 1st = paper. Modern reframe = video. Strong matching. |
| `newlywed gift` | Higher volume than "wedding present," same intent, less competition. |
| `bridal shower gift` | Major gifting occasion, lower competition than wedding gift alone. |
| `engagement gift` | Captures pre-wedding shoppers. |
| `sentimental gift` | High emotional intent — replaces weaker "sentimental wedding". |
| `unique wedding gift` | Captures shoppers explicitly avoiding generic gifts. |
| `digital wedding gift` | Same-day delivery niche. |
| `wedding keepsake` | Longevity intent (matches our "lifetime download" angle). |
| `last minute gift` | Captures the panic-buy segment — digital delivery is our edge. |

### Tags we removed

- `video messages` — already in title, redundant in tags (Etsy weights cross-field)
- `wedding present` — lower search vol than `newlywed gift`
- `sentimental wedding` — broken bigram (people search "sentimental gift," not "sentimental wedding")

## Image direction (10 slots)

> **The thumbnail is 80% of the conversion.** Etsy shoppers scroll fast — they decide to click on the hero image and decide to buy on images 2–3. The remaining slots reduce buying anxiety. Every image needs *on-image text* that survives shrinking to thumbnail size (no thin fonts, no <24pt body text).

### Slot 1 — HERO (most important; this is the thumbnail in search)

- **Visual**: Hands holding a phone, screen shows the vault interface mid-message playback. Couple slightly out-of-focus in the background, watching together. Gold + cream palette. Natural window light.
- **On-image text (large, top third)**:
  > **The wedding gift**
  > **that opens 1 year later.**
- **Bottom corner badge**: "Sealed for 12 months · Digital delivery"
- **Why**: leads with the entire pitch in 8 words. Buyer can decide from the thumbnail alone whether they want to know more.

### Slot 2 — PRODUCT SHOT

- **Visual**: Phone mockup of the vault dashboard screenshot (capture from `/vault/view/[id]` post-seal state). Clean white background, soft shadow under phone.
- **On-image text (top)**: "Their private vault. Sealed until the date they choose."
- **Bottom**: Three small chips: `6 video messages` · `15 photos` · `Lifetime download`

### Slot 3 — LIFESTYLE (the emotional moment)

- **Visual**: Couple on a couch from behind, phone or laptop on lap showing playing video, glasses of wine on table. Soft anniversary-night lighting.
- **On-image text (overlay, lower third)**: "Opened together. On their first anniversary."
- **Why**: this is the buyer's mental image of the *outcome*. Sell the moment, not the product.

### Slot 4 — DIAGRAM / HOW IT WORKS

- **Visual**: 5-panel horizontal flow with icons + short labels:
  > **1. Order** → **2. Forward** → **3. Couple builds** → **4. Sealed** → **5. Opened together**
- **Title at top**: "How it works."
- **Why**: removes the #1 buyer hesitation ("how does this even work?")

### Slot 5 — INCLUSIONS CARD

- **Visual**: Cream background, gold accents, stacked feature list:
  > **What's inside**
  > ✓ 1 private Memory Vault
  > ✓ 6 HD video messages (up to 2 min each)
  > ✓ 15 photo upload slots
  > ✓ Sealed for up to 12 months
  > ✓ Lifetime download access — yours forever

### Slot 6 — REAL TESTIMONIAL (collect after first 3–5 orders, update)

- **Visual**: Screenshot-style card with a 5-star row + real buyer quote.
- **Placeholder text until first review**:
  > *"This is the most thoughtful gift I've ever given. The bride cried."*
  > — Maid of honor, June 2026
- **Note**: replace with real Etsy review screenshot as soon as one lands. Until then this slot uses Lauren's testimonial from sealtheday.com/wedding adapted for the wedding-gift angle.

### Slot 7 — TRUST / FOUNDER

- **Visual**: Photo of Simaan (or a brand mark + headshot), brief story card.
- **On-image text**:
  > **Built by a small US team.**
  > "My photographer never showed up. I built this so no couple has to scramble like we did." — Simaan, founder
- **Why**: Etsy buyers reward small-shop authenticity; differentiate from the AI-generated wedding gift flood.

### Slot 8 — USE CASE: MAID OF HONOR

- **Visual**: Stylized "from the maid of honor" card. Tasteful, gold-on-cream. Could be flat-lay style with a champagne flute or wedding ribbon.
- **On-image text**:
  > **From the maid of honor.**
  > A gift only you could give — the people, the words, the moment.
- **Why**: highest-LTV buyer segment. Maids of honor over-spend and over-research wedding gifts.

### Slot 9 — USE CASE: PARENTS / FAMILY

- **Visual**: Same template as slot 8, different framing.
- **On-image text**:
  > **From the bride's (or groom's) parents.**
  > Everything you'd say in a toast, captured forever. Plus your closest friends and family added in.

### Slot 10 — CTA / URGENCY

- **Visual**: Bold typographic card, gold-and-cream.
- **On-image text**:
  > **Order today.**
  > **Delivered within 24 hours.**
  > **Opened in 1 year.**
- **Bottom**: small mark — "sealtheday.com · made in the US"

### Image production notes for Simaan

- Use **Canva** or **Figma** with the same gold/cream/navy palette as sealtheday.com.
- Export at **2000×2000 px square** (Etsy displays best at 2000px+).
- **Test thumbnails at 280×280** before publishing — if you can't read the headline at that size, the text is too small.
- Slots 1, 3, and 5 are the conversion-critical ones. Spend 80% of design time there.
- For the lifestyle shot (slot 3), Unsplash + Pexels have free stock that fits — search "couple anniversary couch wine."

## Fulfillment SOP

For each Etsy order:

1. Etsy emails: "You have a new order #1234567890"
2. Open https://sealtheday.com/admin/etsy
3. Paste the Etsy order ID (just the number) → click **Mint code**
4. Copy the claim URL
5. Reply to the Etsy buyer message with the template below
6. Mark the order as completed in Etsy

Total time per order: ~90 seconds.

## Buyer reply template

```
Hi {buyer_first_name}!

Thanks so much for your order — your Anniversary Capsule is ready to claim.

Redeem here: {claim_url}

Whoever opens this link first claims it, so:
  • If it's for you: just sign in (or create a free account) and the
    capsule credits land on your account.
  • If it's a gift: forward the link to the couple — they sign in with
    their own account and the credits go to them.

From there: build the vault, set the seal date (up to 12 months out),
and invite the people closest to the couple to record their video
messages. Guests do NOT need an account — they just click a link and
record from their phone.

Full walkthrough at sealtheday.com/wedding.

Any questions, just reply to this Etsy message and I'll help directly.

— Simaan
SealTheDay
```

## Open questions to revisit after first 10 orders

- Are buyers redeeming themselves or forwarding to the couple? (look at claim email vs etsy buyer email)
- Average time from order → redeem? If > 7 days, send a nudge.
- Should we add an "I want this delivered on a specific date" option? (manual hold + send-on-date)
- Should Etsy listing price go up to $39.95 if conversion is strong?

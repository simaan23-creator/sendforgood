# Etsy listing: Anniversary Capsule (Wedding Gift)

Internal reference doc for the Etsy listing. Not deployed.

## Listing setup

| Field | Value |
|---|---|
| Category | Weddings → Gifts & Mementos → Other Gifts & Mementos |
| Type | Digital download (no physical shipping) |
| Renews | Auto-renew |
| Quantity | Unlimited (we mint codes on demand) |
| **Listed price** | **$34.95** USD |
| Processing time | "Within 24 hours" (set to 1 business day) |

Why $34.95: Etsy takes a listing fee ($0.20) + transaction fee (~6.5%) + payment processing (~3% + $0.25). On $34.95 that nets us roughly $30.80. Our internal Anniversary Capsule is $29.95, so this leaves ~$0.85 cushion for variability + a slim margin to absorb fluctuations. Adjust upward to $39.95 if Etsy fees creep.

## Title (140 char max)

```
Wedding Gift for Couples | Anniversary Time Capsule | Video Messages from Family & Friends | Sealed Until Their 1st Anniversary
```

(127 chars — leaves room for Etsy to append modifiers.)

## Description

```
A wedding gift the couple opens together on their first anniversary.

Most wedding gifts get unwrapped once. This one waits. You buy it before
(or right after) the wedding. The couple invites the people closest to them
to record short video messages — their best man, their grandmother, the
friend who couldn't fly out — plus upload a few photos that didn't make it
to the wedding album. Then the whole thing seals shut for up to one full year.

On their first anniversary, the couple sits down on the couch with a glass of
wine, opens the link, and watches the people who love them most tell them
why this marriage matters. Together. As their first married tradition.

WHAT'S INCLUDED
• 1 private Memory Vault (their own URL + dashboard)
• 6 video message slots (up to 2 minutes each, HD)
• 15 photo upload slots (full resolution)
• Seal date up to 12 months in the future
• Lifetime download access — they keep every video and photo, forever

HOW IT WORKS
1. Buy this listing — you'll get a redemption link within a few hours
2. Forward the link to the couple (or claim it yourself if it's for you)
3. The couple sets a seal date (up to 1 year out) and invites their people
   to record messages — no app required, no account required for guests
4. The vault locks until the seal date
5. On the date, they open it together and watch the messages

WHO IT'S FOR
• Wedding gift from a friend, parent, sibling, or maid of honor
• Engagement gift with a "save it for your wedding day" twist
• Bridal shower gift with longer staying power than a kitchen mixer
• Last-minute wedding gift (delivered digitally, no shipping)

FAQ
Q: Does the couple need an account?
A: They need one free SealTheDay account to manage the vault. Their guests
   recording messages do not — they just click a link and record.

Q: What if they don't want to use it?
A: The capsule credits don't expire. They can build the vault whenever
   they want. 48-hour refund window after redemption.

Q: Can I see what it looks like?
A: Yes — visit sealtheday.com/wedding for a full walkthrough.

Q: How is this different from a regular wedding video?
A: A videographer captures the wedding day. This captures the people who
   couldn't, or the things they didn't get to say out loud. And it's saved
   for a future moment — not the day itself.

Q: When does my buyer get the link?
A: Within 24 hours of order. Usually within an hour during business hours.

Made by a small two-person team (Simaan & family) in the US. Questions?
Message me directly.
```

## Tags (Etsy max 13)

```
wedding gift
anniversary gift
time capsule
video messages
wedding present
paper anniversary
bridal shower gift
engagement gift
sentimental wedding
unique wedding gift
digital wedding gift
wedding keepsake
last minute gift
```

## Image direction (10 slots)

1. **Hero**: Close-up of two hands holding a phone showing the unsealed vault — gold-and-cream brand palette, soft natural light. Text overlay: "The wedding gift that opens 1 year later"
2. **Product shot**: Phone mockup of the vault dashboard (screenshot from `/vault/view/[id]` after seal). Caption: "Inside their private Anniversary Capsule"
3. **Lifestyle**: Couple on a couch watching a video together, hands intertwined. Text: "Opened together on their 1st anniversary"
4. **Diagram**: Simple 4-panel "how it works" graphic — Buy → Forward → Couple builds vault → Sealed → Opened
5. **Inclusions**: Text card listing what's in the package (1 vault, 6 videos, 15 photos, sealed up to 12 months)
6. **Testimonial**: A real review screenshot (collect 2-3 first, then update)
7. **Trust**: Screenshot of brand on sealtheday.com showing founder photo + "Made by a small US team"
8. **Use case 1**: "From the maid of honor" framing
9. **Use case 2**: "From the bride's parents" framing
10. **CTA**: "Order today → delivered within 24 hours → couple opens in 1 year"

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

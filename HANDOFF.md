# SealTheDay Rebrand — Handoff

Last updated before PC restart. Resume from here.

## Status at a glance

- **Brand swap (SendForGood → SealTheDay):** complete in code. Zero `sendforgood` / `SendForGood` / `send for good` strings remain in `src/` or `public/`.
- **Type-check:** clean (`npx tsc --noEmit`).
- **Branch:** `main`, pushed to `https://github.com/simaan23-creator/sendforgood.git`.
- **Working tree:** clean (this handoff file is the only new untracked item).

## Recent commits (this rebrand effort, newest first)

```
78b3843  chore: relabel dashboard header from "Your Gifts" to "Your Dashboard"
ac09f1b  chore: redirect dead /send/success to /dashboard
8d02095  feat: purge legacy gifting copy and dead routes
bd51984  (prior session — initial brand swap across 30 files)
```

## What's been done

### Code
- All public marketing pages re-positioned for the wedding memory vault product
- Legacy gifting routes either rewritten or stubbed to `redirect("/wedding")`:
  - `/business`, `/letters`, `/gifts/buy` (internal links), `/send/success`
- Auth-gated dashboard relabeled "Your Dashboard" (was "Your Gifts")
- Affiliate marketing copy panels rewritten for wedding vendor pitch
- Blog teasers rewritten for wedding vault
- Dead `src/emails/order-confirmation.tsx` deleted
- Stripe checkout for vault uses dynamic `price_data` (no fixed products)
- `lib/constants.ts → TIERS` retained — still referenced by 9 auth-gated paths for legacy gift-credit customers

### Infrastructure
- Supabase auth `site_url` updated to `https://sealtheday.com`
- Supabase SMTP `smtp_admin_email` patched: `noreply@sendforgood.com` → `noreply@sealtheday.com` (critical fix — would have silently broken all auth emails)
- Supabase SMTP `smtp_sender_name`: `SendForGood` → `SealTheDay`
- Stripe webhook endpoint URL updated
- Vercel production alias confirmed
- 5 legacy gifting Stripe products archived (`active=false`):
  - prod_UDHlQe8Iz5n57D (Legacy)
  - prod_UDHlTKX3VRXB7E (Deluxe)
  - prod_UDHl8f6yYZsADp (Premium)
  - prod_UDHlmJsX1DnaFg (Classic)
  - prod_UDHlW3cc9EtQUl (Starter)

### Analytics (already wired)
- GA4 + Google Ads tags load via `src/components/CookieConsent.tsx` only after explicit consent (Consent Mode v2)
- `src/lib/analytics.ts` exports: `trackSignup`, `trackPurchase`, `trackVaultCreated`, `trackEvent`, `trackAdsConversion`
- Conversion calls live in: `auth/callback`, `vault/success`, `cart/success`, `letters/success`, `request/create`
- IDs: GA4 = `G-622HOQNK45`, Ads = `AW-17462992858`

## Still pending — user/external action

### Blockers
- **#8 Resend DNS verification** — 3 DNS records pending at GoDaddy for `sealtheday.com`. Until verified, no transactional/auth emails will send from `@sealtheday.com`.
  - Where to check: Resend dashboard → Domains → sealtheday.com
- **#10 support@sealtheday.com** — inbox or forwarding rule not set up

### Brand assets (need design files)
- **#13** Replace `public/logo.jpg` (still old SendForGood asset)
- **#14** Replace `public/favicon` / `public/logo-icon.jpg`
- **#15** Create `public/og-image.jpg` (1200×630)

### Marketing setup
- **#24** Once you create Ads conversions, set these env vars in Vercel:
  - `NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL_PURCHASE`
  - `NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL_SIGNUP`
  - `NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL_VAULT_CREATED`
- **#25** Link ad accounts (Google Ads / Meta Ads) to `sealtheday.com`

### Smoke tests (need real card/device)
- **#22** Signup → checkout → vault creation E2E
- **#23** Guest contribution flow E2E (QR scan → record → submit)

### Optional
- **#27** Rename local folder `C:\Users\Simaan\sendforgood` and GitHub repo to match brand

## Architecture notes for the next session

### Key files
- `src/app/wedding/page.tsx` — primary ad landing page (clean, 463 lines)
- `src/app/vault/buy/page.tsx` — main checkout funnel (clean, 440 lines)
- `src/app/vault/view/[id]/page.tsx` — guest viewing + sealed-vault display
- `src/app/api/vault/checkout/route.ts` — Stripe dynamic price_data: $10 vault + $1/video + $0.25/audio + $0.25/photo
- `src/lib/analytics.ts` — GA4/Ads helpers, sessionStorage dedup, consent-gated
- `src/components/CookieConsent.tsx` — Consent Mode v2, loads tags after accept
- `src/lib/constants.ts` — `TIERS` (legacy gift tiers, still needed) + `OCCASION_TYPES`

### Discontinued surfaces (now redirect to `/wedding`)
- `/business` (auth-gated `/business/{dashboard,signup,success}` remain for legacy accounts)
- `/letters` (digital `/messages/buy` still active; physical letters gone)
- `/send/success` → `/dashboard`

### Pattern for any further discontinued pages
```tsx
import { redirect } from "next/navigation";
export default function Page() {
  redirect("/wedding");
}
```

## How to resume

1. `git pull` to make sure nothing changed remotely
2. Check `git status` — should be clean except for this HANDOFF.md
3. Verify type-check: `cd C:\Users\Simaan\sendforgood && npx tsc --noEmit`
4. Pick up from the "Still pending — user/external action" list above

## Quick re-audit commands

```bash
# Verify no stale brand strings
grep -ri "sendforgood" src/ public/
grep -ri "send for good" src/ public/

# Find any remaining old internal links
grep -rn "/gifts/buy" src/

# Type-check
npx tsc --noEmit
```

## External console quick-links

- Supabase project: `wsjpurqemkpmssrqmndy`
- Vercel: production alias `sealtheday.com`
- Stripe: live mode, vault uses dynamic price_data
- Resend: domain `sealtheday.com` (pending DNS verification)
- GoDaddy: DNS records pending for Resend

## Long transcript

Full per-turn detail of the rebrand work lives at:
`C:\Users\Simaan\.claude\projects\C--WINDOWS-system32\65f9a779-b2a2-42b6-8942-e3038f2e0408.jsonl`

# SendForGood

**Legacy gift giving, made simple.**

A "set it and forget it" gift service. Prepay for gifts to be delivered to someone every year (or on specific occasions) — forever if you want. Even if the gift-giver passes away, the recipient still gets their gift.

## Tech Stack

- **Framework**: Next.js 15 (App Router) + TypeScript
- **Styling**: Tailwind CSS v4
- **Database & Auth**: Supabase (PostgreSQL + Auth with Google OAuth & Magic Links)
- **Payments**: Stripe (one-time prepaid payments)
- **Email**: Resend + React Email
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- A Supabase project
- A Stripe account
- A Resend account

### Installation

1. Clone the repository:
   ```bash
   git clone <repo-url>
   cd sendforgood
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables — copy `.env.local.example` or create `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   STRIPE_SECRET_KEY=your_stripe_secret_key
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
   RESEND_API_KEY=your_resend_api_key
   NEXT_PUBLIC_APP_URL=https://sendforgood.com
   ```

4. Run the database migration against your Supabase project:
   ```bash
   # Via Supabase CLI
   supabase db push

   # Or manually run the SQL in supabase/migrations/001_initial_schema.sql
   # in the Supabase SQL Editor
   ```

5. Configure Supabase Auth:
   - Enable Google OAuth in Supabase Dashboard > Authentication > Providers
   - Enable Email Magic Links (enabled by default)
   - Set the Site URL to your domain
   - Add redirect URLs: `https://sendforgood.com/auth/callback`

6. Configure Stripe Webhook:
   - Create a webhook endpoint in Stripe Dashboard pointing to `https://sendforgood.com/api/webhooks/stripe`
   - Listen for `checkout.session.completed` events
   - Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`

7. Start the development server:
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Homepage
│   ├── layout.tsx            # Root layout with header/footer
│   ├── globals.css           # Tailwind v4 theme + global styles
│   ├── about/page.tsx        # About page
│   ├── auth/
│   │   ├── page.tsx          # Sign in / Sign up
│   │   └── callback/route.ts # OAuth/magic link callback
│   ├── dashboard/page.tsx    # Auth-protected dashboard
│   ├── gifts/page.tsx        # Gift catalog with filters
│   ├── send/page.tsx         # Multi-step gift setup flow
│   └── api/
│       ├── checkout/route.ts         # Stripe checkout session creation
│       ├── orders/route.ts           # Fetch user orders
│       └── webhooks/stripe/route.ts  # Stripe webhook handler
├── components/
│   ├── header.tsx            # Site header with auth state
│   ├── footer.tsx            # Site footer
│   ├── button.tsx            # Reusable button component
│   └── tier-card.tsx         # Pricing tier card
├── emails/
│   └── order-confirmation.tsx # React Email template
├── lib/
│   ├── constants.ts          # Tiers, occasion types, shared constants
│   ├── resend.ts             # Resend email client
│   ├── stripe.ts             # Stripe client + tier pricing
│   └── supabase/
│       ├── admin.ts          # Supabase admin client (service role)
│       ├── client.ts         # Supabase browser client
│       ├── middleware.ts     # Auth session management
│       └── server.ts         # Supabase server client
└── middleware.ts             # Next.js middleware (auth protection)

supabase/
└── migrations/
    └── 001_initial_schema.sql  # Full database schema + seed data
```

## Pricing Tiers

| Tier | Price/Year | Includes |
|------|-----------|----------|
| Starter | $29 | Greeting card + collectible card |
| Classic | $49 | Small wrapped gift + card |
| Premium | $79 | Curated gift box + card |
| Deluxe | $129 | Premium gift matched to interests + preview photo |
| Legacy | $199 | Luxury gift + premium box + handwritten letter + unboxing experience |

Payment is one-time upfront: years × tier price.

## Deployment

Deploy to Vercel:

```bash
npm run build
vercel --prod
```

Set all environment variables in the Vercel project settings.

## License

Private — All rights reserved.

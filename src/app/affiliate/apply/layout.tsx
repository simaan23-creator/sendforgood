import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SealTheDay Affiliate Program — Earn from every couple you work with",
  description:
    "Photographers, planners, and wedding pros: 15% commission on first vault purchase, 10% on every repeat for life. Instant approval, 30-day cookie, PayPal/Venmo payouts.",
  openGraph: {
    title: "SealTheDay Affiliate Program",
    description:
      "Earn 15% on first vault purchase and 10% on every repeat — for life. Instant approval.",
    type: "website",
  },
};

export default function AffiliateApplyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

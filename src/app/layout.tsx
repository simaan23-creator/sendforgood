import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { headers } from "next/headers";
import Script from "next/script";
import "./globals.css";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import ScrollToTop from "@/components/ScrollToTop";
import CookieConsent from "@/components/CookieConsent";
import { AffiliateBanner } from "@/components/AffiliateBanner";
import { Analytics } from "@vercel/analytics/next";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://sealtheday.com"),
  title: {
    default: "SealTheDay — Your Wedding Memory Vault",
    template: "%s | SealTheDay",
  },
  description:
    "Capture every moment of your wedding from every guest's perspective. Photos, videos, and voice messages — all in one private vault you'll have forever.",
  icons: {
    icon: "/logo-icon.jpg",
    apple: "/logo-icon.jpg",
  },
  openGraph: {
    title: "SealTheDay — Your Wedding Memory Vault",
    description:
      "Capture every moment of your wedding from every guest's perspective. Photos, videos, and voice messages — all in one private vault you'll have forever.",
    url: "https://sealtheday.com",
    siteName: "SealTheDay",
    type: "website",
    images: [{ url: "/og-image.jpg" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "SealTheDay — Your Wedding Memory Vault",
    description:
      "Capture every moment of your wedding from every guest's perspective. Photos, videos, and voice messages — all in one private vault you'll have forever.",
    images: ["/og-image.jpg"],
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "SealTheDay",
  url: "https://sealtheday.com",
  logo: "https://sealtheday.com/logo-icon.jpg",
  description:
    "The wedding memory vault. Guests record photos, videos, and voice messages from every angle of your day — automatically organized into one private vault.",
  contactPoint: {
    "@type": "ContactPoint",
    email: "support@sealtheday.com",
    telephone: "+1-631-707-4968",
    contactType: "customer support",
    areaServed: "US",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";
  const isAdmin = pathname.startsWith("/admin");

  return (
    <html lang="en" className={inter.className}>
      <head>
        <Script id="scroll-restoration" strategy="beforeInteractive">{`
          if ('scrollRestoration' in history) { history.scrollRestoration = 'manual'; }
          window.scrollTo(0, 0);
        `}</Script>
      </head>
      <body className={isAdmin ? "" : "min-h-screen flex flex-col"}>
        <Script
          id="organization-jsonld"
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <ScrollToTop />
        {!isAdmin && <CookieConsent />}
        {!isAdmin && <AffiliateBanner />}
        {!isAdmin && <Header />}
        {isAdmin ? children : <main className="flex-1">{children}</main>}
        {!isAdmin && <Footer />}
        <Analytics />
      </body>
    </html>
  );
}

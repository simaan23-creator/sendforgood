import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { headers } from "next/headers";
import Script from "next/script";
import "./globals.css";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import ScrollToTop from "@/components/ScrollToTop";
import CookieConsent from "@/components/CookieConsent";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://sendforgood.com"),
  title: {
    default: "SendForGood — Legacy Gift Giving, Made Simple",
    template: "%s | SendForGood",
  },
  description:
    "Buy gift credits, write legacy letters, record voice and video messages. Assign recipients when you are ready — we deliver forever.",
  icons: {
    icon: "/logo-icon.jpg",
    apple: "/logo-icon.jpg",
  },
  openGraph: {
    title: "SendForGood — Legacy Gift Giving, Made Simple",
    description:
      "Buy gift credits, write legacy letters, record voice and video messages. Assign recipients when you are ready — we deliver forever.",
    url: "https://sendforgood.com",
    siteName: "SendForGood",
    type: "website",
    images: [{ url: "/og-image.jpg" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "SendForGood — Legacy Gift Giving, Made Simple",
    description:
      "Buy gift credits, write legacy letters, record voice and video messages. Assign recipients when you are ready — we deliver forever.",
    images: ["/og-image.jpg"],
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "SendForGood",
  url: "https://sendforgood.com",
  logo: "https://sendforgood.com/logo-icon.jpg",
  description:
    "Legacy gift giving made simple. Buy gift credits, write legacy letters, record voice and video messages.",
  contactPoint: {
    "@type": "ContactPoint",
    email: "support@sendforgood.com",
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
        {!isAdmin && <Header />}
        {isAdmin ? children : <main className="flex-1">{children}</main>}
        {!isAdmin && <Footer />}
      </body>
    </html>
  );
}

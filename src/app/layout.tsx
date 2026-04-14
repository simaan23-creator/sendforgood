import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { headers } from "next/headers";
import Script from "next/script";
import "./globals.css";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "SendForGood — Legacy Gift Giving, Made Simple",
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
        <Script src="https://www.googletagmanager.com/gtag/js?id=AW-17462992858" strategy="afterInteractive" />
        <Script id="google-analytics" strategy="afterInteractive">{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-622H0QNK45');
          gtag('config', 'AW-17462992858');
        `}</Script>
      </head>
      <body className={isAdmin ? "" : "min-h-screen flex flex-col"}>
        {!isAdmin && <Header />}
        {isAdmin ? children : <main className="flex-1">{children}</main>}
        {!isAdmin && <Footer />}
      </body>
    </html>
  );
}

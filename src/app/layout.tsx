import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { headers } from "next/headers";
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
    "Prepay for gifts to be delivered to your loved ones every year — even after you're gone. Legacy giving made simple.",
  openGraph: {
    title: "SendForGood — Legacy Gift Giving, Made Simple",
    description:
      "Prepay for gifts to be delivered to your loved ones every year — even after you're gone.",
    url: "https://sendforgood.com",
    siteName: "SendForGood",
    type: "website",
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
      <body className={isAdmin ? "" : "min-h-screen flex flex-col"}>
        {!isAdmin && <Header />}
        {isAdmin ? children : <main className="flex-1">{children}</main>}
        {!isAdmin && <Footer />}
      </body>
    </html>
  );
}

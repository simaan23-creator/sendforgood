import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "For Business — SendForGood",
  description:
    "Gifts selected and shipped to your clients — automated, effortless, memorable. Set it up once — we handle the rest.",
  openGraph: {
    title: "For Business — SendForGood",
    description:
      "Gifts selected and shipped to your clients — automated, effortless, memorable. Set it up once — we handle the rest.",
    url: "https://sendforgood.com/business",
    siteName: "SendForGood",
    type: "website",
  },
};

export default function BusinessLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

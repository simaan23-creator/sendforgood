import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "For Business — SealTheDay",
  description:
    "Gifts selected and shipped to your clients — automated, effortless, memorable. Buy credits, assign when ready — we handle the rest.",
  openGraph: {
    title: "For Business — SealTheDay",
    description:
      "Gifts selected and shipped to your clients — automated, effortless, memorable. Buy credits, assign when ready — we handle the rest.",
    url: "https://sealtheday.com/business",
    siteName: "SealTheDay",
    type: "website",
  },
};

export default function BusinessLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

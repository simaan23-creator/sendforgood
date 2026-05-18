import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us — SealTheDay",
  description:
    "Get in touch with the SealTheDay team. We'd love to hear from you — questions, feedback, or just a friendly hello.",
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

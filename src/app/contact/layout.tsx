import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us — SendForGood",
  description:
    "Get in touch with the SendForGood team. We'd love to hear from you — questions, feedback, or just a friendly hello.",
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

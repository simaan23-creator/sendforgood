import type { Metadata } from "next";
import Link from "next/link";
import { TIERS } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Order Confirmed — SendForGood",
  description:
    "Your gift order has been confirmed. SendForGood will take care of everything from here.",
  openGraph: {
    title: "Order Confirmed — SendForGood",
    description:
      "Your gift order has been confirmed. SendForGood will take care of everything from here.",
    url: "https://sendforgood.com/send/success",
    siteName: "SendForGood",
    type: "website",
  },
};

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, " ");
}

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const recipient = typeof params.recipient === "string" ? params.recipient : null;
  const occasion = typeof params.occasion === "string" ? params.occasion : null;
  const tier = typeof params.tier === "string" ? params.tier : null;
  const years = typeof params.years === "string" ? params.years : null;

  const tierInfo = tier ? TIERS.find((t) => t.id === tier) : null;

  const hasSummary = recipient || occasion || tier || years;

  return (
    <section className="bg-gradient-to-b from-cream to-cream-dark min-h-[80vh] py-16 sm:py-24">
      <div className="mx-auto max-w-2xl px-4 text-center">
        {/* Success icon */}
        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-forest/10 ring-4 ring-forest/20">
          <svg
            className="h-12 w-12 text-forest"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.5 12.75l6 6 9-13.5"
            />
          </svg>
        </div>

        {/* Heading */}
        <h1 className="text-3xl sm:text-4xl font-bold text-navy tracking-tight">
          Your gifts are on their way! 🎉
        </h1>

        <p className="mt-4 text-lg text-warm-gray max-w-lg mx-auto leading-relaxed">
          Thank you for choosing SendForGood. We have received your order and
          will take care of everything from here.
        </p>

        {/* Order summary */}
        {hasSummary && (
          <div className="mt-10 rounded-xl border border-cream-dark bg-white p-6 sm:p-8 text-left shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gold mb-5">
              Order Summary
            </h2>

            <dl className="space-y-4">
              {recipient && (
                <div className="flex justify-between border-b border-cream-dark pb-3">
                  <dt className="text-warm-gray text-sm">Recipient</dt>
                  <dd className="font-medium text-navy">{recipient}</dd>
                </div>
              )}
              {occasion && (
                <div className="flex justify-between border-b border-cream-dark pb-3">
                  <dt className="text-warm-gray text-sm">Occasion</dt>
                  <dd className="font-medium text-navy">
                    {capitalize(occasion)}
                  </dd>
                </div>
              )}
              {tierInfo && (
                <div className="flex justify-between border-b border-cream-dark pb-3">
                  <dt className="text-warm-gray text-sm">Gift Tier</dt>
                  <dd className="font-medium text-navy">
                    {tierInfo.name}{" "}
                    <span className="text-warm-gray-light text-sm">
                      (${tierInfo.price}/yr)
                    </span>
                  </dd>
                </div>
              )}
              {years && (
                <div className="flex justify-between pb-1">
                  <dt className="text-warm-gray text-sm">Duration</dt>
                  <dd className="font-medium text-navy">
                    {years} year{Number(years) !== 1 ? "s" : ""}
                  </dd>
                </div>
              )}
              {tierInfo && years && (
                <div className="flex justify-between border-t border-cream-dark pt-4">
                  <dt className="font-semibold text-navy">Total Paid</dt>
                  <dd className="font-bold text-navy text-lg">
                    ${tierInfo.price * Number(years)}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        )}

        {/* CTAs */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-lg bg-navy px-6 py-3 text-sm font-semibold text-cream transition hover:bg-navy-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy w-full sm:w-auto"
          >
            View Your Dashboard
          </Link>
          <Link
            href="/send"
            className="inline-flex items-center justify-center rounded-lg border-2 border-navy px-6 py-3 text-sm font-semibold text-navy transition hover:bg-navy hover:text-cream focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy w-full sm:w-auto"
          >
            Send Another Gift
          </Link>
        </div>

        {/* Reassurance */}
        <p className="mt-10 text-sm text-warm-gray-light">
          A confirmation email has been sent to your inbox. If you have any
          questions, reach out to us at{" "}
          <a
            href="mailto:support@sendforgood.com"
            className="text-gold hover:text-gold-dark underline underline-offset-2"
          >
            support@sendforgood.com
          </a>
        </p>
      </div>
    </section>
  );
}

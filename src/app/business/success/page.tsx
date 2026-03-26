import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Business Order Confirmed — SendForGood",
  description:
    "Your business gift plan has been confirmed. SendForGood will take care of everything from here.",
  openGraph: {
    title: "Business Order Confirmed — SendForGood",
    description:
      "Your business gift plan has been confirmed. SendForGood will take care of everything from here.",
    url: "https://sendforgood.com/business/success",
    siteName: "SendForGood",
    type: "website",
  },
};

export default async function BusinessSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const company = typeof params.company === "string" ? params.company : null;
  const count = typeof params.count === "string" ? params.count : null;

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
          Your business gift plan is set!
        </h1>

        <p className="mt-4 text-lg text-warm-gray max-w-lg mx-auto leading-relaxed">
          Thank you for choosing SendForGood for{" "}
          {company && (
            <span className="font-semibold text-navy">{company}</span>
          )}
          . We&rsquo;ve received your order and will handle everything from here.
        </p>

        {/* Summary */}
        {(company || count) && (
          <div className="mt-10 rounded-xl border border-cream-dark bg-white p-6 sm:p-8 text-left shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gold mb-5">
              Order Summary
            </h2>
            <dl className="space-y-4">
              {company && (
                <div className="flex justify-between border-b border-cream-dark pb-3">
                  <dt className="text-warm-gray text-sm">Company</dt>
                  <dd className="font-medium text-navy">{company}</dd>
                </div>
              )}
              {count && (
                <div className="flex justify-between pb-1">
                  <dt className="text-warm-gray text-sm">Recipients Set Up</dt>
                  <dd className="font-medium text-navy">
                    {count} recipient{Number(count) !== 1 ? "s" : ""}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        )}

        {/* CTAs */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/business/dashboard"
            className="inline-flex items-center justify-center rounded-lg bg-navy px-6 py-3 text-sm font-semibold text-cream transition hover:bg-navy-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy w-full sm:w-auto"
          >
            View Business Dashboard
          </Link>
          <Link
            href="/business/signup"
            className="inline-flex items-center justify-center rounded-lg border-2 border-navy px-6 py-3 text-sm font-semibold text-navy transition hover:bg-navy hover:text-cream focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy w-full sm:w-auto"
          >
            Add More Recipients
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

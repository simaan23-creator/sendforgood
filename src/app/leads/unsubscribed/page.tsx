import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Unsubscribed — SealTheDay",
  description: "You've been removed from our outreach list.",
  robots: { index: false, follow: false },
};

export default async function UnsubscribedPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string; email?: string }>;
}) {
  const params = await searchParams;
  const isError = params.error === "1";
  const email = typeof params.email === "string" ? params.email : "";

  return (
    <main className="bg-cream min-h-screen px-6 py-24">
      <div className="mx-auto max-w-xl text-center">
        {isError ? (
          <>
            <h1 className="text-3xl font-bold text-navy sm:text-4xl">
              Something went wrong
            </h1>
            <p className="mt-4 text-warm-gray">
              We couldn&apos;t process that unsubscribe link. Email{" "}
              <a
                href="mailto:simaan@sealtheday.com"
                className="text-navy underline"
              >
                simaan@sealtheday.com
              </a>{" "}
              and we&apos;ll take you off the list manually within 24 hours.
            </p>
          </>
        ) : (
          <>
            <p className="text-sm font-semibold uppercase tracking-widest text-gold">
              Done
            </p>
            <h1 className="mt-4 text-3xl font-bold text-navy sm:text-4xl">
              You&apos;re unsubscribed.
            </h1>
            <p className="mt-4 text-warm-gray">
              {email ? (
                <>
                  <span className="font-mono text-navy">{email}</span> has been
                  removed from our outreach list.
                </>
              ) : (
                <>That email has been removed from our outreach list.</>
              )}{" "}
              You won&apos;t hear from us again.
            </p>
            <p className="mt-6 text-sm text-warm-gray">
              If you change your mind or want to learn more about the affiliate
              program, you can always sign up at{" "}
              <Link
                href="/affiliate/apply"
                className="text-navy underline"
              >
                sealtheday.com/affiliate/apply
              </Link>
              .
            </p>
          </>
        )}
      </div>
    </main>
  );
}

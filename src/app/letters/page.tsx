import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Legacy Letters — SendForGood",
  description:
    "Write letters today that arrive in the future. Birthday letters, wedding day letters, graduation letters — delivered on the exact day, every time.",
};

export default function LettersPage() {
  return (
    <div className="bg-cream">
      {/* Hero */}
      <section className="px-6 py-20 sm:py-32">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-navy sm:text-5xl md:text-6xl">
            Write it now.{" "}
            <span className="text-gold">Deliver it when it matters.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-warm-gray sm:text-xl">
            A Legacy Letter arrives on a birthday, a wedding day, a graduation
            &mdash; or any moment you choose. Even years from now. Even after
            you are gone.
          </p>
          <Link
            href="/messages/buy"
            className="mt-10 inline-flex items-center justify-center rounded-lg bg-navy px-8 py-4 text-lg font-semibold text-cream shadow-lg transition hover:bg-navy-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
          >
            Write a Letter &mdash; From $1 &rarr;
          </Link>
        </div>
      </section>

      {/* Delivery Options */}
      <section className="px-6 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-bold text-navy sm:text-4xl">
            Choose how it arrives
          </h2>

          <div className="mt-14 grid gap-8 sm:grid-cols-3">
            {/* Digital */}
            <div className="flex flex-col rounded-2xl border border-cream-dark bg-white p-8 shadow-md transition hover:-translate-y-1 hover:shadow-xl">
              <span className="text-3xl">📧</span>
              <h3 className="mt-3 text-xl font-bold text-navy">Digital</h3>
              <p className="mt-3">
                <span className="text-4xl font-extrabold tracking-tight text-navy">
                  $1
                </span>
                <span className="text-sm text-warm-gray"> per letter</span>
              </p>
              <p className="mt-4 flex-1 text-sm leading-relaxed text-warm-gray">
                Delivered by email on the scheduled date.
              </p>
              <Link
                href="/messages/buy"
                className="mt-8 inline-flex items-center justify-center rounded-lg bg-navy px-6 py-3 text-sm font-semibold text-cream shadow-sm transition hover:bg-navy-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
              >
                Get Started
              </Link>
            </div>

            {/* Physical */}
            <div className="flex flex-col rounded-2xl border border-cream-dark bg-white p-8 shadow-md transition hover:-translate-y-1 hover:shadow-xl">
              <span className="text-3xl">✉️</span>
              <h3 className="mt-3 text-xl font-bold text-navy">
                Physical Letter
              </h3>
              <p className="mt-3">
                <span className="text-4xl font-extrabold tracking-tight text-navy">
                  $10
                </span>
                <span className="text-sm text-warm-gray"> per letter</span>
              </p>
              <p className="mt-4 flex-1 text-sm leading-relaxed text-warm-gray">
                Printed on quality paper and mailed to their door.
              </p>
              <Link
                href="/messages/buy"
                className="mt-8 inline-flex items-center justify-center rounded-lg bg-navy px-6 py-3 text-sm font-semibold text-cream shadow-sm transition hover:bg-navy-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
              >
                Get Started
              </Link>
            </div>

            {/* Letter + Photo */}
            <div className="relative flex flex-col rounded-2xl border-gold bg-white p-8 shadow-lg ring-2 ring-gold/30 transition hover:-translate-y-1 hover:shadow-xl">
              <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gold px-4 py-1 text-xs font-bold uppercase tracking-wide text-white">
                Most Popular
              </span>
              <span className="text-3xl">📸</span>
              <h3 className="mt-3 text-xl font-bold text-navy">
                Letter + Photo
              </h3>
              <p className="mt-3">
                <span className="text-4xl font-extrabold tracking-tight text-navy">
                  $15
                </span>
                <span className="text-sm text-warm-gray"> per letter</span>
              </p>
              <p className="mt-4 flex-1 text-sm leading-relaxed text-warm-gray">
                Your letter plus a wallet-sized photo, mailed together.
              </p>
              <Link
                href="/messages/buy"
                className="mt-8 inline-flex items-center justify-center rounded-lg bg-gold px-6 py-3 text-sm font-semibold text-navy shadow-sm transition hover:bg-gold-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Who Is This For */}
      <section className="bg-cream-dark px-6 py-16 sm:py-24">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-3xl font-bold text-navy sm:text-4xl">
            Some letters need time to find their moment.
          </h2>

          <div className="mt-14 grid gap-6 sm:grid-cols-2">
            {[
              {
                icon: "🎂",
                title: "Birthdays",
                text: "Write your child a letter for their 18th birthday. Write it today.",
              },
              {
                icon: "💍",
                title: "Wedding Day",
                text: "A letter from a parent, waiting at the altar.",
              },
              {
                icon: "🎓",
                title: "Graduation",
                text: "Words of wisdom for a day they have worked toward for years.",
              },
              {
                icon: "🕯️",
                title: "A final letter",
                text: "Some things are too important to leave unsaid.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-cream-dark bg-white p-7 transition hover:-translate-y-1 hover:shadow-lg"
              >
                <span className="text-3xl">{item.icon}</span>
                <h3 className="mt-4 text-lg font-bold text-navy">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-warm-gray">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-6 py-16 sm:py-24">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-3xl font-bold text-navy sm:text-4xl">
            Three steps. Then you are done.
          </h2>

          <div className="mt-14 grid gap-8 sm:grid-cols-3">
            {[
              {
                step: 1,
                text: "Write your letter from your dashboard.",
              },
              {
                step: 2,
                text: "Choose a delivery date or milestone.",
              },
              {
                step: 3,
                text: "We deliver it — on the exact day, every time.",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gold text-xl font-bold text-white">
                  {item.step}
                </div>
                <p className="mt-5 text-base leading-relaxed text-warm-gray">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Executor / Legacy Section */}
      <section className="bg-navy px-6 py-16 sm:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-cream sm:text-4xl">
            Your letters keep arriving. No matter what.
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-cream/70">
            When you write a Legacy Letter, you can name a trusted executor
            &mdash; a spouse, adult child, or attorney. If something happens to
            you, they ensure every letter reaches its recipient on the right
            day. Your words outlast everything.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 py-16 sm:py-24">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-2xl font-bold text-navy sm:text-3xl">
            Frequently Asked Questions
          </h2>
          <dl className="mt-10 space-y-8">
            {[
              {
                q: "What if I am not around when the letter is delivered?",
                a: "Your letters are stored securely. You can name an executor who ensures delivery continues.",
              },
              {
                q: "Can I edit a letter after I write it?",
                a: "Yes, any time before it enters our print queue (about 2 weeks before delivery).",
              },
              {
                q: "How is it delivered?",
                a: "Digital letters are emailed. Physical letters are printed and mailed via USPS.",
              },
              {
                q: "What if the recipient moves?",
                a: "Update the address anytime from your dashboard. We also check in before each delivery.",
              },
              {
                q: "Can I write letters for multiple people?",
                a: "Yes. Each letter is purchased separately and assigned to a specific person from your dashboard.",
              },
            ].map((item) => (
              <div key={item.q}>
                <dt className="text-lg font-semibold text-navy">{item.q}</dt>
                <dd className="mt-2 leading-relaxed text-warm-gray">
                  {item.a}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-cream-dark px-6 py-16 sm:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-navy sm:text-4xl">
            The best time to write it is today.
          </h2>
          <Link
            href="/messages/buy"
            className="mt-8 inline-flex items-center justify-center rounded-lg bg-forest px-10 py-4 text-lg font-semibold text-cream shadow-lg transition hover:bg-forest-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
          >
            Write Your First Letter &rarr;
          </Link>
        </div>
      </section>
    </div>
  );
}

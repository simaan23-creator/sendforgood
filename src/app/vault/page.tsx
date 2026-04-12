import Link from "next/link";

const USE_CASES = [
  {
    emoji: "\uD83D\uDC8D",
    title: "Wedding Vault",
    description:
      "Send links to every guest at your wedding. Seal all their messages for your 10th anniversary. Watch them together on the night you have been waiting for.",
  },
  {
    emoji: "\uD83C\uDF82",
    title: "Birthday Vault",
    description:
      "Let your family and friends record birthday messages. Receive them all at once on your birthday morning.",
  },
  {
    emoji: "\uD83C\uDF93",
    title: "Graduation Vault",
    description:
      "Collect words of wisdom from the people who shaped you. Open them when you need them most.",
  },
  {
    emoji: "\uD83D\uDC74",
    title: "Family Legacy Vault",
    description:
      "Ask your parents and grandparents to record their stories. Seal them for your children to discover someday.",
  },
];

export default function VaultPage() {
  return (
    <main className="min-h-screen bg-cream">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-cream via-cream to-cream-dark px-6 py-24 sm:py-32">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <svg
            className="absolute -top-10 right-0 h-72 w-72 text-gold/10 sm:h-96 sm:w-96"
            viewBox="0 0 200 200"
            fill="none"
          >
            <path
              d="M120 20c30 15 60 50 60 90s-20 60-50 70-70-10-80-50 10-80 40-100 30-10 30-10z"
              fill="currentColor"
            />
          </svg>
        </div>

        <div className="relative mx-auto max-w-4xl text-center">
          <span className="text-6xl sm:text-7xl">&#x1F512;</span>
          <h1 className="mt-4 text-4xl font-bold leading-[1.1] tracking-tight text-navy sm:text-5xl md:text-6xl">
            Your Memory Vault
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-warm-gray sm:text-xl">
            Collect messages from the people you love. Seal them. Open them on
            the day that matters most.
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-3xl font-bold text-navy sm:text-4xl">
            How it works
          </h2>

          <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                step: "1",
                emoji: "\uD83D\uDD17",
                title: "Send a link",
                description:
                  "Send a request link to anyone \u2014 family, friends, wedding guests.",
              },
              {
                step: "2",
                emoji: "\uD83C\uDFA4",
                title: "They record",
                description:
                  "They record a voice or video message from their phone, no account needed.",
              },
              {
                step: "3",
                emoji: "\uD83D\uDD12",
                title: "Messages are sealed",
                description:
                  "Messages are sealed in your vault until the date you choose.",
              },
              {
                step: "4",
                emoji: "\uD83D\uDD13",
                title: "Vault opens",
                description:
                  "On that day, your vault opens and all the messages are waiting.",
              },
            ].map((item) => (
              <article
                key={item.step}
                className="group relative rounded-2xl bg-cream p-8 text-center shadow-md transition hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-navy text-lg font-bold text-cream">
                  {item.step}
                </div>
                <span className="mt-4 block text-4xl">{item.emoji}</span>
                <h3 className="mt-3 text-lg font-semibold text-navy">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-warm-gray">
                  {item.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section className="bg-gradient-to-b from-white to-cream px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-3xl font-bold text-navy sm:text-4xl">
            A vault for every moment
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-warm-gray">
            Choose when the memories are revealed.
          </p>

          <div className="mt-14 grid gap-8 sm:grid-cols-2">
            {USE_CASES.map((uc) => (
              <article
                key={uc.title}
                className="rounded-2xl bg-white p-8 shadow-md transition hover:-translate-y-1 hover:shadow-xl"
              >
                <span className="text-5xl">{uc.emoji}</span>
                <h3 className="mt-4 text-xl font-semibold text-navy">
                  {uc.title}
                </h3>
                <p className="mt-3 leading-relaxed text-warm-gray">
                  {uc.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* How credits work */}
      <section className="bg-white px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-3xl font-bold text-navy sm:text-4xl">
            How credits work
          </h2>

          <div className="mt-14 grid gap-8 sm:grid-cols-2">
            <div className="rounded-2xl border border-cream-dark bg-cream p-8 text-center">
              <span className="text-5xl">\uD83C\uDFA4</span>
              <h3 className="mt-4 text-xl font-semibold text-navy">
                Audio Credits &mdash; $5 each
              </h3>
              <p className="mt-3 text-warm-gray">
                Each credit allows one person to record a voice message for you.
              </p>
            </div>
            <div className="rounded-2xl border border-cream-dark bg-cream p-8 text-center">
              <span className="text-5xl">\uD83C\uDFA5</span>
              <h3 className="mt-4 text-xl font-semibold text-navy">
                Video Credits &mdash; $10 each
              </h3>
              <p className="mt-3 text-warm-gray">
                Each credit allows one person to record a video message for you.
              </p>
            </div>
          </div>

          <div className="mt-10 rounded-2xl border border-cream-dark bg-cream p-8">
            <ul className="space-y-3 text-warm-gray">
              <li className="flex items-start gap-3">
                <span className="mt-0.5 text-forest font-bold">&#10003;</span>
                Buy as many as you want &mdash; no minimum, no maximum
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 text-forest font-bold">&#10003;</span>
                A credit is only used when someone records a message
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 text-forest font-bold">&#10003;</span>
                Unused credits never expire
              </li>
            </ul>
            <div className="mt-6 rounded-lg bg-white/80 p-4">
              <p className="text-sm text-navy/80 italic">
                Example: Buy 20 video credits ($200) for your wedding. If only
                15 guests record, you keep 5 credits for next time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-navy px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-cream sm:text-4xl">
            Ready to start collecting memories?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-cream/70">
            Buy credits, create a vault, and share the link with everyone you
            love.
          </p>
          <div className="mt-10">
            <Link
              href="/vault/buy"
              className="inline-flex items-center justify-center rounded-lg bg-gold px-12 py-5 text-lg font-bold text-navy shadow-lg transition hover:bg-gold-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
            >
              Buy Credits &amp; Create Your Vault
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

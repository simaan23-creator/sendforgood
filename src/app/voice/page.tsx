import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Voice & Video Messages — SendForGood",
  description:
    "Record a voice or video message today that arrives by email on a future date. Birthday messages every year, milestone messages for graduations, weddings, and more. Your voice and face keep arriving — even after you're gone.",
};

const USE_CASES = [
  {
    icon: "\uD83C\uDF82",
    title: "Birthday Messages",
    description:
      "Record a happy birthday message for every year from age 5 to 25. Even if you\u2019re not there, your voice will be.",
  },
  {
    icon: "\uD83C\uDF93",
    title: "Graduation Day",
    description:
      "Record a message for your grandchild\u2019s high school graduation \u2014 even if it\u2019s 15 years away.",
  },
  {
    icon: "\uD83D\uDC8D",
    title: "Wedding Day",
    description:
      "A voice message from a parent, waiting for the big day. Recorded years before, delivered at exactly the right moment.",
  },
  {
    icon: "\uD83D\uDC76",
    title: "First Child",
    description:
      "Welcome your future grandchild into the world with your voice, recorded before they were even born.",
  },
  {
    icon: "\uD83C\uDFE0",
    title: "First Home",
    description:
      "Congratulate them on a milestone you knew they\u2019d reach \u2014 with a message you recorded years ago.",
  },
  {
    icon: "\uD83C\uDF96\uFE0F",
    title: "Retirement",
    description:
      "A lifetime of work deserves words of pride. Record it now, deliver it when the day comes.",
  },
  {
    icon: "\u2764\uFE0F",
    title: "Just Because",
    description:
      "Starting at $5/year for audio or $10/year for video \u2014 record a message for anyone you love. Start today.",
  },
];

const HOW_IT_WORKS = [
  {
    step: 1,
    title: "Record Your Message",
    description:
      "Record directly in your browser. Say what you want them to hear \u2014 on a birthday, a milestone, or just because.",
  },
  {
    step: 2,
    title: "Choose When It Arrives",
    description:
      "Pick a date \u2014 a birthday each year, or a specific milestone moment. We\u2019ll hold it safe until then.",
  },
  {
    step: 3,
    title: "We Deliver It",
    description:
      "On the scheduled date, we email a private, secure link to your voice message directly to your recipient.",
  },
  {
    step: 4,
    title: "It Keeps Arriving",
    description:
      "Even if something happens to you, your messages arrive as scheduled. Your executor is notified, and your voice lives on.",
  },
];

const FAQ = [
  {
    question: "What happens to my voice messages if something happens to me?",
    answer:
      "This is the entire purpose of Voice Messages. All prepaid recordings are stored securely and delivered on their scheduled dates regardless of your account status. When you purchase voice messages, you can designate an executor \u2014 a trusted person who will be notified and can manage your deliveries. Your voice keeps arriving.",
  },
  {
    question: "How are voice and video messages delivered?",
    answer:
      "Both audio and video messages are delivered by email on the scheduled date. The recipient receives a beautifully designed email with a secure, private link to listen to or watch your recording. The link is protected and only accessible to the recipient.",
  },
  {
    question: "Can I re-record my message after saving it?",
    answer:
      "Yes \u2014 you can re-record any voice message that hasn\u2019t been delivered yet. We\u2019ll send you a reminder before each message is finalized so you have a chance to update it.",
  },
  {
    question: "What\u2019s the difference between annual and milestone messages?",
    answer:
      "Annual messages are delivered once per year on a recurring date (like a birthday). You record one message per year for as many years as you choose. Milestone messages are one-time deliveries timed to specific life events \u2014 graduation, wedding, first child, retirement, etc.",
  },
  {
    question: "How long can my recording be?",
    answer:
      "Both audio and video messages can be up to 5 minutes long. We find that the most meaningful messages are often just 1\u20132 minutes of heartfelt words.",
  },
  {
    question: "What\u2019s the difference between audio and video messages?",
    answer:
      "Audio messages ($5/year) capture your voice. Video messages ($10/year) capture both your face and your voice \u2014 the most powerful and personal option. Both are delivered the same way by email. You choose the format when you record.",
  },
  {
    question: "What if the recipient\u2019s email changes?",
    answer:
      "We reach out before every delivery to confirm the email is still current. You can update it anytime from your dashboard. If we are unable to reach you or your executor, the message will be held securely until the intended recipient comes forward and claims it.",
  },
  {
    question: "Can I listen to a preview before it sends?",
    answer:
      "Yes. You can listen to your recording anytime from your dashboard. About 2 weeks before each message is scheduled to send, we\u2019ll send you a reminder and a chance to re-record.",
  },
];

export default function VoiceMessagesPage() {
  return (
    <div className="bg-cream">
      {/* Hero Section */}
      <section className="relative overflow-hidden px-6 py-20 sm:py-32">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-gold">
            Voice & Video Messages
          </p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-navy sm:text-5xl md:text-6xl lg:text-7xl">
            Your voice. Your face.{" "}
            <span className="text-gold">Delivered forever.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-warm-gray sm:text-xl">
            Record audio or video messages for the people you love.
            Delivered by email on the date you choose &mdash; even years from
            now. Video is the most powerful message you can leave behind.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/voice/record"
              className="inline-flex items-center justify-center rounded-lg bg-navy px-8 py-4 text-lg font-semibold text-cream shadow-lg transition hover:bg-navy-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
            >
              Buy Voice &amp; Video Messages
            </Link>
            <Link
              href="#how-it-works"
              className="inline-flex items-center justify-center rounded-lg border-2 border-navy px-8 py-4 text-lg font-semibold text-navy transition hover:bg-navy hover:text-cream"
            >
              How It Works
            </Link>
          </div>
          <p className="mt-6 text-sm text-warm-gray-light">
            Audio $5/year &middot; Video $10/year &middot; No subscriptions &middot; Delivered
            forever
          </p>
        </div>
      </section>

      {/* Emotional hook */}
      <section className="bg-navy px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-2xl font-bold leading-relaxed text-cream sm:text-3xl md:text-4xl">
            &ldquo;Hearing my grandmother&apos;s voice on my wedding day was the
            greatest gift I&apos;ve ever received. She recorded it five years
            before she passed.&rdquo;
          </p>
          <p className="mt-6 text-sm text-cream/60">
            This is the kind of moment Voice &amp; Video Messages creates. The most powerful message you can leave behind is your face saying I love you.
          </p>
        </div>
      </section>

      {/* Pricing Card */}
      <section className="px-6 py-16 sm:py-24">
        <div className="mx-auto max-w-2xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-navy sm:text-4xl">
              Simple, Affordable Pricing
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-warm-gray">
              One price. Delivered by email on the date you choose.
            </p>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2">
            {/* Audio tier */}
            <div className="relative flex flex-col rounded-2xl border border-cream-dark bg-white p-8 shadow-md transition hover:-translate-y-1 hover:shadow-xl">
              <div className="text-center">
                <span className="text-4xl">&#127908;</span>
                <h3 className="mt-3 text-xl font-bold text-navy">
                  Audio Message
                </h3>
                <p className="mt-3">
                  <span className="text-5xl font-extrabold tracking-tight text-navy">
                    $5
                  </span>
                  <span className="text-sm text-warm-gray">
                    /yr per message
                  </span>
                </p>
              </div>
              <ul className="mt-8 space-y-3">
                {[
                  "Record up to 5 minutes per message",
                  "Delivered by email on the scheduled date",
                  "Secure, private listening link",
                  "Annual or milestone message types",
                  "Continues even if something happens to you",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="mt-0.5 h-4 w-4 shrink-0 text-forest" aria-hidden="true">
                      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                    </svg>
                    <span className="text-warm-gray">{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/voice/record"
                className="mt-8 inline-flex items-center justify-center rounded-lg bg-navy px-6 py-3 text-sm font-semibold text-cream shadow-sm transition hover:bg-navy-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
              >
                Record Audio &mdash; $5/year
              </Link>
            </div>

            {/* Video tier */}
            <div className="relative flex flex-col rounded-2xl border-gold bg-white p-8 shadow-lg ring-2 ring-gold/30 transition hover:-translate-y-1 hover:shadow-xl">
              <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gold px-4 py-1 text-xs font-bold uppercase tracking-wide text-white">
                NEW
              </span>
              <div className="text-center">
                <span className="text-4xl">&#127916;</span>
                <h3 className="mt-3 text-xl font-bold text-navy">
                  Video Message
                </h3>
                <p className="mt-3">
                  <span className="text-5xl font-extrabold tracking-tight text-navy">
                    $10
                  </span>
                  <span className="text-sm text-warm-gray">
                    /yr per message
                  </span>
                </p>
              </div>
              <ul className="mt-8 space-y-3">
                {[
                  "Record up to 5 minutes of video",
                  "Your face and voice, delivered together",
                  "Secure, private viewing link",
                  "Annual or milestone message types",
                  "The most powerful legacy you can leave",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="mt-0.5 h-4 w-4 shrink-0 text-forest" aria-hidden="true">
                      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                    </svg>
                    <span className="text-warm-gray">{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/voice/record"
                className="mt-8 inline-flex items-center justify-center rounded-lg bg-gold px-6 py-3 text-sm font-semibold text-navy shadow-sm transition hover:bg-gold-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
              >
                Record Video &mdash; $10/year
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Cross-Sell Comparison */}
      <section className="bg-gradient-to-b from-cream to-cream-dark px-6 py-16 sm:py-24">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-navy sm:text-4xl">
              Three Ways to Leave Your Legacy
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-warm-gray">
              Letters, voice, and gifts &mdash; all delivered on the dates you
              choose, for as long as you need.
            </p>
          </div>

          <div className="mt-14 grid gap-8 sm:grid-cols-3">
            <article className="rounded-2xl border border-cream-dark bg-white p-8 text-center shadow-md transition hover:-translate-y-1 hover:shadow-xl">
              <span className="text-5xl" role="img" aria-label="Letters">
                ✉️
              </span>
              <h3 className="mt-5 text-xl font-bold text-navy">Letters</h3>
              <p className="mt-2 text-sm text-warm-gray">From $1/yr</p>
              <p className="mt-3 leading-relaxed text-warm-gray">
                Write letters delivered by email or printed and mailed. Your
                words, on the days that matter most.
              </p>
              <Link
                href="/letters"
                className="mt-6 inline-flex items-center justify-center rounded-lg border-2 border-navy px-6 py-3 text-sm font-semibold text-navy transition hover:bg-navy hover:text-cream"
              >
                Learn More
              </Link>
            </article>

            <article className="relative rounded-2xl border-gold bg-white p-8 text-center shadow-lg ring-2 ring-gold/30 transition hover:-translate-y-1 hover:shadow-xl">
              <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gold px-4 py-1 text-xs font-bold uppercase tracking-wide text-white">
                You Are Here
              </span>
              <span className="text-5xl" role="img" aria-label="Voice & Video Messages">
                🎙️
              </span>
              <h3 className="mt-5 text-xl font-bold text-navy">
                Voice & Video Messages
              </h3>
              <p className="mt-2 text-sm text-warm-gray">Audio $5/yr &middot; Video $10/yr</p>
              <p className="mt-3 leading-relaxed text-warm-gray">
                Record your voice or face and we deliver it by email. The most personal
                legacy you can leave behind.
              </p>
              <Link
                href="/voice/record"
                className="mt-6 inline-flex items-center justify-center rounded-lg bg-gold px-6 py-3 text-sm font-semibold text-navy shadow-sm transition hover:bg-gold-light"
              >
                Record a Message
              </Link>
            </article>

            <article className="rounded-2xl border border-cream-dark bg-white p-8 text-center shadow-md transition hover:-translate-y-1 hover:shadow-xl">
              <span className="text-5xl" role="img" aria-label="Gifts">
                🎁
              </span>
              <h3 className="mt-5 text-xl font-bold text-navy">Gifts</h3>
              <p className="mt-2 text-sm text-warm-gray">From $20/yr</p>
              <p className="mt-3 leading-relaxed text-warm-gray">
                AI-curated gifts shipped directly to them every year. Different
                every time, always thoughtful.
              </p>
              <Link
                href="/gifts/buy"
                className="mt-6 inline-flex items-center justify-center rounded-lg border-2 border-navy px-6 py-3 text-sm font-semibold text-navy transition hover:bg-navy hover:text-cream"
              >
                Buy Gift Credits
              </Link>
            </article>
          </div>
        </div>
      </section>

      {/* Use Cases Grid */}
      <section className="px-6 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-navy sm:text-4xl">
              Who Records Voice Messages?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-warm-gray">
              Record now. Deliver later. Some words are too important to leave
              unspoken.
            </p>
          </div>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {USE_CASES.map((uc) => (
              <div
                key={uc.title}
                className="rounded-2xl border border-cream-dark bg-white p-7 transition hover:-translate-y-1 hover:shadow-lg"
              >
                <span className="text-3xl">{uc.icon}</span>
                <h3 className="mt-4 text-lg font-bold text-navy">
                  {uc.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-warm-gray">
                  {uc.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section
        id="how-it-works"
        className="bg-cream-dark px-6 py-16 sm:py-24"
      >
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-navy sm:text-4xl">
              How Voice Messages Work
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-warm-gray">
              Four simple steps to make your voice immortal.
            </p>
          </div>
          <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {HOW_IT_WORKS.map((step) => (
              <div key={step.step} className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gold text-xl font-bold text-white">
                  {step.step}
                </div>
                <h3 className="mt-5 text-lg font-bold text-navy">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-warm-gray">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust / Executor Section */}
      <section className="bg-navy px-6 py-16 sm:py-24">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold text-cream sm:text-4xl">
            Your Voice Is Safe. Forever.
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-cream/70">
            When you record a Voice Message, you can designate an executor
            &mdash; a trusted person (spouse, child, attorney) who is notified
            if your account becomes inactive. They can verify delivery emails
            and ensure your messages arrive as planned.
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {[
              {
                title: "Encrypted & Secure",
                desc: "Your recordings are stored with bank-level encryption until their delivery date.",
              },
              {
                title: "Executor Notified",
                desc: "Your designated executor is contacted to confirm email addresses and manage deliveries.",
              },
              {
                title: "Delivered On Time",
                desc: "Every message arrives on its scheduled date, no matter what. That\u2019s our promise.",
              },
            ].map((item) => (
              <div key={item.title} className="rounded-xl bg-white/5 p-6">
                <h3 className="text-lg font-bold text-cream">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-cream/60">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 py-16 sm:py-24">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-2xl font-bold sm:text-3xl">
            Frequently Asked Questions
          </h2>
          <dl className="mt-10 space-y-8">
            {FAQ.map((item) => (
              <div key={item.question}>
                <dt className="text-lg font-semibold text-navy">
                  {item.question}
                </dt>
                <dd className="mt-2 leading-relaxed text-warm-gray">
                  {item.answer}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-cream-dark px-6 py-16 sm:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-navy sm:text-4xl">
            Don&apos;t Leave Words Unspoken
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-warm-gray">
            The best time to record a message is today. The best time for it to
            arrive might be years from now.
          </p>
          <Link
            href="/voice/record"
            className="mt-8 inline-flex items-center justify-center rounded-lg bg-forest px-10 py-4 text-lg font-semibold text-cream shadow-lg transition hover:bg-forest-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
          >
            Record Your First Message &mdash; From $5/yr
          </Link>
          <p className="mt-10 text-sm text-warm-gray">
            Are you an executor? If the account holder has passed or is unable
            to manage their account, you can{" "}
            <Link
              href="/executor-access"
              className="font-semibold text-navy underline underline-offset-2 hover:text-gold"
            >
              request access here
            </Link>
            .
          </p>
        </div>
      </section>
    </div>
  );
}

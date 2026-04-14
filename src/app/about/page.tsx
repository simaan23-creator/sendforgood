import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About — SendForGood & Legacy Letters",
};

/* ───────────────── Use-case data ───────────────── */

const useCases = [
  {
    emoji: "\u{1F382}",
    title: "Never miss a birthday again",
    description:
      "Buy gift credits for every grandchild, niece, nephew, or friend. Assign their birthdays from your dashboard whenever you are ready. We deliver every year.",
  },
  {
    emoji: "\u{1F48D}",
    title: "Your wedding, remembered forever",
    description:
      "Send a Memory Vault link to every guest at your reception. Seal their video messages for your 10th anniversary.",
  },
  {
    emoji: "\u{1F3E0}",
    title: "The realtor who never forgets",
    description:
      "Send your clients a gift on their home anniversary every year. The referrals will follow.",
  },
  {
    emoji: "\u{1F476}",
    title: "The day your child was born",
    description:
      "Record a video message the day they arrive. Let them watch it on their 18th birthday.",
  },
  {
    emoji: "\u{1F43E}",
    title: "Because pets deserve birthdays too",
    description:
      "Buy gift credits for your dog, cat, or any pet you love. Assign their birthday and we deliver treats every year.",
  },
  {
    emoji: "\u2709\uFE0F",
    title: "Write the letters you never send",
    description:
      "Record a voice message or write a letter for someone you love. Store it safely. We deliver it when the moment comes \u2014 even if you are not there.",
  },
  {
    emoji: "\u{1F393}",
    title: "Words for their graduation day",
    description:
      "Record your advice before the big day. Let them hear it when they walk across that stage.",
  },
  {
    emoji: "\u{1F4BC}",
    title: "Client retention, automated",
    description:
      "Businesses use SendForGood to buy gift credits for clients on birthdays, work anniversaries, and milestones. Buy credits once, assign clients as you go.",
  },
  {
    emoji: "\u{1F56F}\uFE0F",
    title: "A gift from someone who is gone",
    description:
      "The most meaningful use of all. Set up gifts and letters for your loved ones, sealed until the right moment. Your love keeps arriving even after you are gone.",
  },
];

const products = [
  {
    emoji: "\u{1F381}",
    name: "Gift Credits",
    description: "Buy credits. Assign recipients. We deliver.",
    price: "From $20/credit",
    href: "/gifts/buy",
  },
  {
    emoji: "\u2709\uFE0F",
    name: "Letters",
    description: "Written letters delivered by mail or email.",
    price: "From $1/year",
    href: "/letters",
  },
  {
    emoji: "\u{1F399}\uFE0F",
    name: "Voice Messages",
    description: "Your voice, delivered on schedule.",
    price: "$5/year",
    href: "/letters",
  },
  {
    emoji: "\u{1F3AC}",
    name: "Video Messages",
    description: "Your face, your voice, forever.",
    price: "$10/year",
    href: "/letters",
  },
  {
    emoji: "\u{1F510}",
    name: "Memory Vault",
    description:
      "Collect messages from others. Sealed until the right moment.",
    price: "From $5/credit",
    href: "/vault",
  },
];

export default function AboutPage() {
  return (
    <>
      {/* ───────────────────────── Founder Story: SendForGood ───────────────────────── */}
      <section className="bg-white px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-3xl font-bold text-navy sm:text-4xl">
            Why I Built SendForGood
          </h2>

          <div className="mx-auto mt-12 max-w-2xl">
            <hr className="mb-10 border-t border-warm-gray/30" />

            <div className="space-y-6 pl-4 sm:pl-8 text-[17px] leading-[1.85] text-warm-gray font-[350]" style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}>
              <p>
                I run a deli. I work every single day. The business consumes
                me&nbsp;&mdash; early mornings, late nights, no off switch. But
                loving the people in my life was never the problem. Remembering
                to show it was.
              </p>

              <p>
                I have more nieces and nephews than I can count, and I can never
                keep their birthdays straight. It always goes the same way: my
                sister calls me day-of and says,{" "}
                <em className="text-navy/80">
                  &ldquo;Hey, you coming to Braden&rsquo;s birthday
                  tonight?&rdquo;
                </em>{" "}
                And I say yes. Of course I say yes. But I feel like a schmuck
                because I had no idea, and I am showing up empty-handed.
              </p>

              <p>
                All my close friends started having kids. Same problem. My
                wife&rsquo;s anniversary? Same problem.
              </p>

              <p>
                A friend of mine&nbsp;&mdash; very successful real estate
                broker&nbsp;&mdash; once told me the secret to his business was
                simple: he never let a client forget him. A small gift every
                year, right on time. That is client retention. That is how
                referrals happen.
              </p>

              <p>
                My wife is a special education teacher. When I told her about
                this idea, she lit up. She still goes to her past
                students&rsquo; high school graduations&nbsp;&mdash; years after
                they leave her classroom, the parents still call her with
                updates. She wanted a way to send those kids something as they
                grew, to let them know she was still in their corner. She also
                told me something that stuck with me: she has always been afraid
                of forgetting to get someone a gift after they got her
                one. This solves that forever.
              </p>

              <p>
                My father passed away last year. Toward the end, he kept telling
                me he wanted to leave something behind for his
                grandkids&nbsp;&mdash; not money, but something they would
                actually remember him by. He looked and looked. He never found
                the right thing.
              </p>

              <p>
                If my dad were alive today, he would not think twice. He would
                buy this for every single grandchild, at the highest tier, for
                as many years as we offered. I know that in my bones.
              </p>

              <p className="font-semibold text-navy">
                That is why I built SendForGood.
              </p>

              <p className="mt-4 text-right italic text-navy text-lg">
                &mdash; Simaan
              </p>
            </div>

            <hr className="mt-10 border-t border-warm-gray/30" />
          </div>
        </div>
      </section>

      {/* ──────────────────── Founder Story: Legacy Letters ──────────────── */}
      <section className="bg-cream px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-3xl font-bold text-navy sm:text-4xl">
            Why Legacy Letters
          </h2>

          <div className="mx-auto mt-12 max-w-2xl">
            <hr className="mb-10 border-t border-warm-gray/30" />

            <div className="space-y-6 pl-4 sm:pl-8 text-[17px] leading-[1.85] text-warm-gray font-[350]" style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}>
              <p>
                My father was a first-generation immigrant. He came to this
                country without a word of English. No connections. No safety
                net. He built a business from nothing, raised a family, and
                became the sharpest man I have ever known.
              </p>

              <p>
                Before he died, he told me over and over that he wanted to
                leave his grandchildren something real. Not money. His
                experience. His knowledge. The hard lessons he earned so they
                would not have to learn them the same way.
              </p>

              <p>
                He never found a way to do it.
              </p>

              <p>
                My first child has not been born yet. My father will never meet
                them. But if I could open a letter he wrote for that
                moment&nbsp;&mdash; something he sealed years ago and set aside,
                waiting for exactly that day&nbsp;&mdash; I cannot put into
                words what that would mean to me. I have tried. I cannot.
              </p>

              <p>
                His words would be worth more than anything money could buy.
              </p>

              <p>
                That is what Legacy Letters is about. The person writing pays a
                few dollars. But the person receiving
                it&nbsp;&mdash; especially after the writer is
                gone&nbsp;&mdash; that letter is priceless.
              </p>

              <p className="font-semibold text-navy">
                Write it down. Seal it. We will make sure it arrives. No one
                should have to wonder what the people they loved would have
                said.
              </p>

              <p className="mt-4 text-right italic text-navy text-lg">
                &mdash; Simaan
              </p>
            </div>

            <hr className="mt-10 border-t border-warm-gray/30" />
          </div>
        </div>
      </section>

      {/* ──────────────── What can you do with SendForGood? ──────────────── */}
      <section className="bg-white px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-bold text-navy sm:text-4xl">
            What can you do with SendForGood?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-warm-gray">
            Here are just a few of the ways people are using the platform.
          </p>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {useCases.map((uc) => (
              <article
                key={uc.title}
                className="rounded-2xl border border-cream-dark bg-cream p-7 transition hover:shadow-lg"
              >
                <span className="text-3xl" aria-hidden="true">
                  {uc.emoji}
                </span>
                <h3 className="mt-3 text-lg font-semibold text-navy">
                  {uc.title}
                </h3>
                <p className="mt-2 text-[15px] leading-relaxed text-warm-gray">
                  {uc.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ────────────── One platform. Five ways to show love. ────────────── */}
      <section className="bg-cream px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-3xl font-bold text-navy sm:text-4xl">
            One platform. Five ways to show love.
          </h2>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {products.map((p) => (
              <Link
                key={p.name}
                href={p.href}
                className="group rounded-2xl bg-white p-6 text-center shadow-md transition hover:shadow-xl"
              >
                <span className="text-4xl" aria-hidden="true">
                  {p.emoji}
                </span>
                <h3 className="mt-4 text-lg font-semibold text-navy group-hover:text-gold-dark transition-colors">
                  {p.name}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-warm-gray">
                  {p.description}
                </p>
                <p className="mt-3 text-sm font-semibold text-gold-dark">
                  {p.price}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ────────────────────────── CTA Section ─────────────────────────────── */}
      <section className="bg-navy px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-cream sm:text-4xl md:text-5xl">
            Ready to Start Your Legacy?
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-cream/80">
            It only takes a few minutes to buy gift credits and start assigning
            recipients. Your loved ones deserve to feel your love&nbsp;&mdash; always.
          </p>
          <div className="mt-10">
            <Link
              href="/gifts/buy"
              className="inline-flex items-center justify-center rounded-lg bg-gold px-12 py-5 text-lg font-bold text-navy shadow-lg transition hover:bg-gold-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
            >
              Get Started
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

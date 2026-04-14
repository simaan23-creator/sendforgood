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
      "Set up annual birthday gifts for every grandchild, niece, nephew, or friend. Pay once, we deliver every year automatically.",
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
      "Set up annual birthday treats for your dog, cat, or any pet you love. They deserve to feel special.",
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
      "Businesses use SendForGood to send gifts and letters to clients on birthdays, work anniversaries, and milestones. Set it up once, never think about it again.",
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
    name: "Gifts",
    description: "Annual gifts delivered automatically.",
    price: "From $20/year",
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
                I work every day. I am an extremely busy businessman. My business
                takes over my life. But that does not mean I do not love my nieces
                and nephews.
              </p>

              <p>
                I have so many of them that I can never keep track of their
                birthdays. It keeps happening&nbsp;&mdash; my sister calls me the
                same day and says,{" "}
                <em className="text-navy/80">
                  &ldquo;Hey, are you coming over for Braden&rsquo;s birthday
                  tonight?&rdquo;
                </em>{" "}
                And I say yes, of course, but I feel like a schmuck because I did
                not know it was his birthday and I did not buy him a present.
              </p>

              <p>
                I have so many close friends having kids, and I kept having the
                same problem. And I kept forgetting my wife&rsquo;s anniversary
                gift, too.
              </p>

              <p>
                Then I remembered a conversation with a friend of mine who is a
                very successful real estate broker. He told me it is all about
                client retention&nbsp;&mdash; that is why he always sends his
                clients a small gift every holiday, just to remind them he is
                thinking of them.
              </p>

              <p>
                My wife is an elementary school special education teacher. She said
                she loves this idea because she can automate small gifts to all her
                past students as they grow through life. She has maintained such a
                close bond with her students that even years after they move on,
                parents still call her with updates. She almost always ends up
                going to their high school graduations. She also told me she has
                always been afraid of forgetting to get someone a gift when they
                got her one&nbsp;&mdash; and this takes care of that forever.
              </p>

              <p>
                My father passed away last year. He was sick, and he used to tell
                me his time was running out. He always talked about buying
                something for his grandkids that they could remember him by. He
                never found the right thing.
              </p>

              <p>
                But I know&nbsp;&mdash; if he was around today, he would not even
                hesitate. He would buy this for every one of his grandchildren, at
                the highest tier, for as many years as we offered.
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
                My father passed away last year. He was a first-generation
                immigrant&nbsp;&mdash; one of the first people in my family to come
                to the United States. He did not speak a word of English when he
                arrived. He built a successful business, raised a great family, and
                became one of the most intelligent businessmen I have ever known.
              </p>

              <p>
                Before he passed, he used to tell me that he wanted to leave his
                grandchildren with more than just money. He wanted to pass on his
                experience. His knowledge. The things he had learned the hard way,
                so they would not have to.
              </p>

              <p>
                He never found a way to do that.
              </p>

              <p>
                My father will not be around to see my first child. But if I could
                receive a letter that he wrote to me for that moment&nbsp;&mdash; a
                letter that he sealed and set aside years ago, just waiting for the
                right day&nbsp;&mdash; I cannot even put into words what that would
                mean to me.
              </p>

              <p>
                Any words of wisdom from my father would be worth far more than any
                price we could put on them.
              </p>

              <p>
                That is what Legacy Letters is really about. To the person writing
                the letter, eight dollars might feel like a lot. But to the person
                receiving it&nbsp;&mdash; especially if the writer is no longer
                here&nbsp;&mdash; that letter could be priceless.
              </p>

              <p className="font-semibold text-navy">
                We built this so that no one has to wonder what their father, their
                grandmother, their mentor would have said. Write it down. We will
                make sure they read it.
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
            It only takes a few minutes to set up a gift plan that lasts for
            years. Your loved ones deserve to feel your love&nbsp;&mdash; always.
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

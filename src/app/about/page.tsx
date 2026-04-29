import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About — SendForGood, Legacy Letters & the Memory Vault",
};

/* ───────────────── Use-case data ───────────────── */

const useCases = [
  {
    emoji: "\u{1F382}",
    title: "Never miss a birthday again",
    description:
      "Buy gifts for every grandchild, niece, nephew, or friend. Assign their birthdays from your dashboard whenever you are ready. We deliver every year.",
  },
  {
    emoji: "\u{1F48D}",
    title: "Turn 150 wedding guests into 150 second-shooters",
    description:
      "Your photographer can only be in one place. Your guests are everywhere \u2014 the back hallways, the bridal suite, the 2 a.m. afterparty. A QR code on each table turns every phone into a camera that drops straight into your vault.",
  },
  {
    emoji: "\u23F3",
    title: "Open it tomorrow, or in ten years \u2014 your call",
    description:
      "Set the vault to unlock the morning after your wedding so you can scroll through everything with coffee in bed. Or seal it for your 10th anniversary as a real time capsule. Or never lock it. It is your timeline.",
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
      "Buy gifts for your dog, cat, or any pet you love. Assign their birthday and we deliver treats every year.",
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
      "Businesses use SendForGood to send gifts to clients on birthdays, work anniversaries, and milestones. Send gifts once, assign clients as you go.",
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
    description: "Buy gifts once. Assign recipients whenever you are ready. We deliver every year, on time, without you lifting a finger.",
    price: "From $20 per gift",
    href: "/gifts/buy",
  },
  {
    emoji: "\u2709\uFE0F",
    name: "Messages",
    description: "Written letters, voice notes, or video \u2014 mailed or emailed exactly when you choose. Even years from now. Even after you are gone.",
    price: "From $1 per letter",
    href: "/messages/buy",
  },
  {
    emoji: "\u{1F510}",
    name: "Memory Vault",
    description: "Collect video, voice, and photos from everyone at your wedding (or any event). Server-locked until the date you pick \u2014 even from you.",
    price: "$10 vault + $0.25\u2013$1 per slot",
    href: "/wedding",
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
                I have more nieces and nephews than I can count (I can count
                them all), but I can never keep their birthdays straight. It
                always goes the same way: my sister calls me day-of and
                says,{" "}
                <em className="text-navy/80">
                  &ldquo;Hey, you coming to Leo&rsquo;s birthday
                  tonight?&rdquo;
                </em>{" "}
                And I say yes. Of course I say yes. Next month it
                is Brody&rsquo;s party&nbsp;&mdash; same thing. But every
                time, I feel like a&nbsp;&mdash; well, you can fill in the
                blank&nbsp;&mdash; because I had no idea, and I am showing up
                without a real gift. I always end up bringing cash in an
                envelope, but that does not exactly make it memorable for a kid.
              </p>

              <p>
                I do not want to be known as the cash-envelope
                uncle&nbsp;&mdash; or worse, the &ldquo;cash cow
                uncle.&rdquo; Although, honestly, that is not a bad name. But
                you see where I am coming from. I needed this service for
                myself. That was my entire motivation for creating SendForGood.
                Now I get to offer it to everyone else.
              </p>

              <p>
                And it turns out, I am not the only one with this problem. All
                my close friends started having kids. Same story. My
                wife&rsquo;s anniversary? Same story.
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

      {/* ──────────────────── Founder Story: Memory Vault ──────────────── */}
      <section className="bg-white px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-3xl font-bold text-navy sm:text-4xl">
            Why the Memory Vault
          </h2>

          <div className="mx-auto mt-12 max-w-2xl">
            <hr className="mb-10 border-t border-warm-gray/30" />

            <div className="space-y-6 pl-4 sm:pl-8 text-[17px] leading-[1.85] text-warm-gray font-[350]" style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}>
              <p>
                I have been to a lot of weddings. I have stood in the back, I
                have stood in the front, I have helped break a chair down at
                the end of the night. And every single time, I leave thinking
                the same thing: the most beautiful part of that day was not
                the part the photographer was hired to shoot.
              </p>

              <p>
                It was the bridesmaid crying in the bathroom because she
                finally understood what her best friend was leaving behind. It
                was the groom&rsquo;s grandfather telling a story to a
                stranger at the bar that none of us had ever heard. It was the
                kitchen staff dancing while they plated dinner. It was the
                groom&rsquo;s dad practicing his speech in the parking lot
                because he did not trust himself to do it sober.
              </p>

              <p>
                One photographer cannot capture all of that. They are one
                person, holding one camera, in one room. But your guests
                are everywhere. They are already filming on their
                phones&nbsp;&mdash; little vertical clips that get posted to
                a story, watched once, and lost forever.
              </p>

              <p>
                The Memory Vault is just the simplest possible
                way&nbsp;&mdash; a QR code on the table, a link, a big record
                button&nbsp;&mdash; to redirect all of those phones into one
                place. Yours. Sealed until you decide to open it.
              </p>

              <p>
                And here is the thing: it is the same mechanism that holds
                the letter my father never got to write to my unborn son. The
                same vault. The same lock. One product, three reasons to use
                it&nbsp;&mdash; for the wedding you are about to have, for
                the words you owe someone you love, for the message you want
                to leave behind when you are gone.
              </p>

              <p className="font-semibold text-navy">
                Activate the swarm. Lock it for the day that matters. Open it
                together.
              </p>

              <p className="mt-4 text-right italic text-navy text-lg">
                &mdash; Simaan
              </p>
            </div>

            <hr className="mt-10 border-t border-warm-gray/30" />
          </div>
        </div>
      </section>

      {/* ──────────────── Featured Callout: Wedding Swarm ──────────────── */}
      <section className="bg-navy px-6 py-20 sm:py-24">
        <div className="mx-auto max-w-4xl">
          <p className="text-center text-sm font-semibold uppercase tracking-widest text-gold">
            Featured use case
          </p>
          <h2 className="mt-3 text-center text-3xl font-bold leading-tight text-cream sm:text-4xl md:text-5xl">
            Your photographer can only be in one place.
            <br />
            <span className="text-gold">Your guests are everywhere.</span>
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-center text-lg leading-relaxed text-cream/80">
            Turn 150 phones into 150 second-shooters. Capture the back
            hallways, the bridal suite, the cigar smoke, the 2 a.m. afterparty.
            All the moments your photographer was never going to reach.
            Server-locked until the date you choose &mdash; the morning after,
            your tenth anniversary, or never.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/wedding"
              className="inline-flex w-full items-center justify-center rounded-lg bg-gold px-10 py-4 text-base font-bold text-navy shadow-lg transition hover:bg-gold-light sm:w-auto"
            >
              See the wedding pitch
            </Link>
            <Link
              href="/vault/buy"
              className="inline-flex w-full items-center justify-center rounded-lg border-2 border-cream px-8 py-4 text-base font-semibold text-cream transition hover:bg-cream hover:text-navy sm:w-auto"
            >
              Create a Memory Vault
            </Link>
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

      {/* ────────────── One platform. Three ways to show love. ────────────── */}
      <section className="bg-cream px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-3xl font-bold text-navy sm:text-4xl">
            One platform. Three ways to show love.
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-warm-gray">
            Same vault. Same lock. Same promise: love delivered exactly when
            the moment arrives, even if you are not there to hand it over.
          </p>

          <div className="mt-14 grid gap-6 sm:grid-cols-3 max-w-3xl mx-auto">
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
            Ready to start?
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-cream/80">
            Buy gifts that show up every year. Or activate the swarm at your
            wedding. Or write the letter you owe someone you love. Pick
            whichever one is heaviest on your chest right now &mdash; the
            other two will be here when you are ready.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/gifts/buy"
              className="inline-flex w-full items-center justify-center rounded-lg bg-gold px-10 py-4 text-base font-bold text-navy shadow-lg transition hover:bg-gold-light sm:w-auto"
            >
              Buy Gifts
            </Link>
            <Link
              href="/wedding"
              className="inline-flex w-full items-center justify-center rounded-lg bg-cream px-10 py-4 text-base font-bold text-navy shadow-lg transition hover:bg-cream-dark sm:w-auto"
            >
              Wedding Vault
            </Link>
            <Link
              href="/messages/buy"
              className="inline-flex w-full items-center justify-center rounded-lg border-2 border-cream px-8 py-4 text-base font-semibold text-cream transition hover:bg-cream hover:text-navy sm:w-auto"
            >
              Write a Message
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

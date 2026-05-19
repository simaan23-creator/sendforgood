import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About \u2014 SealTheDay Wedding Vault",
};

const useCases = [
  {
    emoji: "\uD83D\uDC8D",
    title: "Turn 150 guests into 150 second-shooters",
    description:
      "Your photographer can only be in one place. Your guests are everywhere \u2014 the back hallways, the bridal suite, the 2 a.m. afterparty. A QR code on each table turns every phone into a camera that drops straight into your vault.",
  },
  {
    emoji: "\u23F3",
    title: "Open it tomorrow, or in ten years \u2014 your call",
    description:
      "Set the vault to unlock the morning after your wedding so you can scroll through everything with coffee in bed. Or seal it for your 10th anniversary as a real time capsule. Your timeline.",
  },
  {
    emoji: "\uD83C\uDFA4",
    title: "Catch the toasts that never happened on the mic",
    description:
      "The best speeches happen at the bar after dinner. Aunts. Cousins. The college roommate who couldn\u2019t get the courage to grab a mic. Give them a record button on their phone and they will say it.",
  },
  {
    emoji: "\uD83D\uDCF8",
    title: "Full-resolution photos, not 480p story screenshots",
    description:
      "Guests upload photos at full resolution straight from their camera roll. No more screenshotting Instagram stories at 9 a.m. the next day.",
  },
  {
    emoji: "\uD83D\uDD6F\uFE0F",
    title: "Capture the relatives who travel furthest",
    description:
      "Grandparents who flew in from another country. Friends who haven\u2019t seen each other in a decade. The version of them on that night, in that room, only exists once.",
  },
  {
    emoji: "\uD83D\uDD12",
    title: "Locked even to you",
    description:
      "Once sealed, nobody can preview the contents \u2014 not your guests, not you, not us. Real anticipation. Real surprise.",
  },
];

export default function AboutPage() {
  return (
    <>
      <section className="bg-white px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-3xl font-bold text-navy sm:text-4xl">
            Why I Built the Wedding Vault
          </h2>

          <div className="mx-auto mt-12 max-w-2xl">
            <hr className="mb-10 border-t border-warm-gray/30" />

            <div
              className="space-y-6 pl-4 sm:pl-8 text-[17px] leading-[1.85] text-warm-gray font-[350]"
              style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
            >
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
                The Wedding Vault is the simplest possible
                way&nbsp;&mdash; a QR code on the table, a link, a big record
                button&nbsp;&mdash; to redirect all of those phones into one
                place. Yours. Sealed until you decide to open it.
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

      <section className="bg-navy px-6 py-20 sm:py-24">
        <div className="mx-auto max-w-4xl">
          <p className="text-center text-sm font-semibold uppercase tracking-widest text-gold">
            How it works
          </p>
          <h2 className="mt-3 text-center text-3xl font-bold leading-tight text-cream sm:text-4xl md:text-5xl">
            Your photographer can only be in one place.
            <br />
            <span className="text-gold">Your guests are everywhere.</span>
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-center text-lg leading-relaxed text-cream/80">
            Buy a vault for $10. Add recording slots ($1 video, $0.25 audio,
            $0.25 photo). Share the link or QR code with your guests. They
            record straight from their phones. You pick the day it unlocks
            &mdash; could be tomorrow morning, could be your 10th anniversary.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/vault/buy"
              className="inline-flex w-full items-center justify-center rounded-lg bg-gold px-10 py-4 text-base font-bold text-navy shadow-lg transition hover:bg-gold-light sm:w-auto"
            >
              Create Your Wedding Vault
            </Link>
            <Link
              href="/pricing"
              className="inline-flex w-full items-center justify-center rounded-lg border-2 border-cream px-8 py-4 text-base font-semibold text-cream transition hover:bg-cream hover:text-navy sm:w-auto"
            >
              See Pricing
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-white px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-bold text-navy sm:text-4xl">
            What you get back
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-warm-gray">
            Every moment your photographer was never going to reach.
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

      <section className="bg-navy px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-cream sm:text-4xl">
            Ready to seal it?
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-cream/80">
            $10 to open the vault. Add as many slots as you need. Slots never
            expire.
          </p>
          <Link
            href="/vault/buy"
            className="mt-10 inline-flex items-center justify-center rounded-lg bg-gold px-10 py-4 text-base font-bold text-navy shadow-lg transition hover:bg-gold-light"
          >
            Create Your Wedding Vault
          </Link>
        </div>
      </section>
    </>
  );
}

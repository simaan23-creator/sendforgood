import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Wedding Memory Vault — SendForGood",
  description:
    "Turn 150 wedding guests into 150 second-shooters. Capture every moment your photographer will never reach. You decide when to relive it — the next morning, your 10th anniversary, or any day in between.",
};

const STEPS = [
  {
    emoji: "\u{1F6D2}",
    title: "Buy recording slots",
    description:
      "$1 per video, $0.25 per audio, $0.25 per photo + a $10 vault fee. Buy as many as you have guests. Unused slots never expire.",
  },
  {
    emoji: "\u{1F517}",
    title: "Create your vault",
    description:
      "Pick when it opens \u2014 the next morning, your first anniversary, your tenth, or no lock at all. It is your timeline.",
  },
  {
    emoji: "\u{1F4F1}",
    title: "Share the link",
    description:
      "QR codes on the tables. A 30-second prompt from your MC. Guests record from any phone in seconds \u2014 no app, no account.",
  },
  {
    emoji: "\u{1F510}",
    title: "Open it together",
    description:
      "On the date you chose, your vault opens. Every video, voice note, and photo your guests captured \u2014 waiting for you.",
  },
];

const SWARM_MOMENTS = [
  "The groomsmen smoking cigars and roasting each other behind the venue",
  "Your maid of honor\u2019s pep talk through the bathroom door",
  "Your grandmother telling the woman next to her about the day she got married",
  "The flower girl asleep under a table with her shoes off",
  "The kitchen staff dancing while they plate dinner",
  "Your dad practicing his speech in the parking lot",
  "The 2 a.m. afterparty no photographer was hired to stay for",
];

const USE_CASES = [
  {
    emoji: "\u{1F48D}",
    title: "Weddings",
    description:
      "150 guests, 150 angles. The day in stereo \u2014 sealed for whenever you want to relive it.",
  },
  {
    emoji: "\u{1F382}",
    title: "Milestone birthdays",
    description:
      "Turning 50? Let everyone record a message. Open it on your 60th.",
  },
  {
    emoji: "\u{1F393}",
    title: "Graduations",
    description:
      "Collect words of wisdom from the people who shaped you.",
  },
  {
    emoji: "\u{1F454}",
    title: "Retirement parties",
    description:
      "Let your team record their favorite memories of working with you.",
  },
  {
    emoji: "\u{1F476}",
    title: "Baby showers",
    description:
      "Collect video messages for the baby to watch when they turn 18.",
  },
];

const FAQS = [
  {
    q: "Do guests need an account?",
    a: "No. They tap the link, see a big record button, and capture. That is it. No app, no signup, nothing to remember.",
  },
  {
    q: "What if not all guests record?",
    a: "Unused slots stay in your account forever. Use them for your next milestone.",
  },
  {
    q: "When does the vault open? Do we have to wait years?",
    a: "Only if you want to. You set the date. Pick the morning after your wedding so you can scroll through everything with coffee in bed. Pick your 10th anniversary for a true time capsule. Pick no lock at all and stream it as it comes in. It is your call.",
  },
  {
    q: "Can we unseal the vault early?",
    a: "No. Once you set a seal date, the vault is locked server-side until that date passes \u2014 even from you. That is what makes it a real time capsule, and what makes guests record like they mean it.",
  },
  {
    q: "How long can each message be?",
    a: "Up to 2 minutes per recording \u2014 captured in full HD (1080p) for video.",
  },
  {
    q: "Can guests upload photos too?",
    a: "Yes. If you buy photo slots, guests can upload photos straight from their camera roll alongside voice and video messages.",
  },
  {
    q: "What if a guest does not have the link?",
    a: "You can share the link anytime before the vault seals \u2014 before, during, or after the event.",
  },
];

export default function WeddingPage() {
  return (
    <main className="bg-cream">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-cream via-cream to-cream-dark px-6 py-24 sm:py-32 md:py-40">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-gold">
            Memory Vault for Weddings
          </p>
          <h1 className="mt-4 text-4xl font-bold leading-[1.1] tracking-tight text-navy sm:text-5xl md:text-6xl">
            Your photographer can only be in one place.
            <br />
            <span className="text-gold">Your guests are everywhere.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-warm-gray sm:text-xl">
            Turn every guest into a second-shooter. Capture the moments your
            photographer will never reach &mdash; the back hallways, the
            bridal-suite breakdown, the cigar smoke, the 2 a.m. dance floor.
            Then open it together on the day you choose.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/vault/buy"
              className="inline-flex w-full items-center justify-center rounded-lg bg-gold px-12 py-5 text-lg font-bold text-navy shadow-lg transition hover:bg-gold-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold sm:w-auto"
            >
              Create Your Wedding Vault
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex w-full items-center justify-center rounded-lg border-2 border-navy px-8 py-4 text-lg font-semibold text-navy transition hover:bg-navy hover:text-cream sm:w-auto"
            >
              See How It Works
            </a>
          </div>
          <p className="mt-5 text-sm text-warm-gray">
            After purchase, get your printable Wedding Kit &mdash; table cards, MC script, and guest invitations all ready to go.
          </p>
        </div>
      </section>

      {/* ── The Pitch: Swarm of Photographers ── */}
      <section className="bg-white px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-3xl font-bold text-navy sm:text-4xl">
            One photographer can&rsquo;t be a swarm.
          </h2>
          <div className="mx-auto mt-8 max-w-2xl space-y-5 text-lg leading-relaxed text-warm-gray">
            <p>
              Your wedding photographer is brilliant at the moments they can
              see &mdash; the first look, the kiss, the first dance. But they
              are one person, holding one camera, in one room.
            </p>
            <p>
              Meanwhile, behind the venue, your groomsmen are passing a flask
              and laughing about a story from college. Upstairs, your mom is
              fixing your sister&rsquo;s mascara because she just lost it
              watching you put on your veil. The bridal party is on the floor
              of the bridal suite stitching a hem back together five minutes
              before walk-out. Your dad is alone in the hallway, taking a
              breath before he sees you.
            </p>
            <p className="font-semibold text-navy">
              No professional photographer in the world is going to capture all
              of that. They can&rsquo;t. They are not a swarm.
            </p>
            <p>
              But your guests are.
            </p>
          </div>
        </div>
      </section>

      {/* ── 150 Phones ── */}
      <section className="bg-navy px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-gold">
            What you actually get
          </p>
          <h2 className="mt-4 text-3xl font-bold text-cream sm:text-4xl">
            Turn 150 phones into 150 second-shooters.
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-cream/80">
            SendForGood replaces &ldquo;the photographer&rdquo; with a
            decentralized swarm of recorders &mdash; every guest, in every
            room, capturing the moments your hired vendors will never reach.
          </p>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-cream/80">
            A QR code on the table. A 30-second prompt from your MC. That is
            all it takes to flip a guest from spectator into archivist. They
            open their camera, record what they are already seeing, and drop
            it into your vault. No app. No account. No login.
          </p>
          <p className="mx-auto mt-4 max-w-2xl text-lg font-semibold leading-relaxed text-gold">
            What you get is something no single photographer could ever
            produce: the full, unedited, in-stereo truth of your wedding day.
          </p>
        </div>
      </section>

      {/* ── Moments only your guests can give you ── */}
      <section className="bg-cream-dark px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-3xl font-bold text-navy sm:text-4xl">
            The moments only your guests can give you
          </h2>
          <ul className="mx-auto mt-12 grid max-w-2xl gap-4 sm:gap-5">
            {SWARM_MOMENTS.map((moment, i) => (
              <li
                key={i}
                className="flex items-start gap-4 rounded-xl bg-white p-5 shadow-sm"
              >
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gold/20 text-sm font-bold text-gold">
                  {i + 1}
                </span>
                <span className="text-base leading-relaxed text-navy sm:text-lg">
                  {moment}
                </span>
              </li>
            ))}
          </ul>
          <p className="mx-auto mt-10 max-w-xl text-center text-lg italic leading-relaxed text-warm-gray">
            These are not the photos you frame. These are the moments you would
            give anything to step back into.
          </p>
        </div>
      </section>

      {/* ── You Decide When ── */}
      <section className="bg-white px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-navy sm:text-4xl">
            You decide when to live it again.
          </h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            <div className="rounded-2xl border border-cream-dark bg-cream p-6 shadow-sm">
              <p className="text-3xl">{"\u2615"}</p>
              <h3 className="mt-3 text-lg font-bold text-navy">The morning after</h3>
              <p className="mt-2 text-sm leading-relaxed text-warm-gray">
                Coffee in bed, scrolling through every angle of the night you
                cannot quite remember. Set the date for the next day.
              </p>
            </div>
            <div className="rounded-2xl border border-gold bg-cream-dark p-6 shadow-md">
              <p className="text-3xl">{"\u23F3"}</p>
              <h3 className="mt-3 text-lg font-bold text-navy">A real time capsule</h3>
              <p className="mt-2 text-sm leading-relaxed text-warm-gray">
                Sealed for your 1st anniversary. Or your 10th. Untouched, even
                by you, until the date arrives. That is what makes it special.
              </p>
            </div>
            <div className="rounded-2xl border border-cream-dark bg-cream p-6 shadow-sm">
              <p className="text-3xl">{"\u{1F4FA}"}</p>
              <h3 className="mt-3 text-lg font-bold text-navy">Always on</h3>
              <p className="mt-2 text-sm leading-relaxed text-warm-gray">
                A living archive your kids will scroll through on a rainy day
                in 2040. Leave it unlocked from the start.
              </p>
            </div>
          </div>
          <p className="mt-10 text-base font-semibold text-navy">
            Your vault. Your timeline. Your discretion.
          </p>
        </div>
      </section>

      {/* ── Why this matters ── */}
      <section className="bg-cream px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-3xl font-bold text-navy sm:text-4xl">
            Why this matters
          </h2>
          <div className="mx-auto mt-8 max-w-2xl space-y-5 text-lg leading-relaxed text-warm-gray">
            <p>
              Hiring a photographer captures{" "}
              <em>what your wedding looked like.</em>
            </p>
            <p>
              Activating a swarm captures{" "}
              <em>what your wedding actually felt like</em> &mdash; every
              room, every group, every private aside, all of it raw, all of it
              real, none of it edited down to a 90-second highlight reel.
            </p>
            <p>
              Twenty years from now, the photos on your wall will still be
              beautiful. But the thing you will watch over and over is the
              unguarded clip your cousin recorded of your dad wiping his eyes
              when no one was looking.
            </p>
            <p className="text-xl font-semibold text-navy">
              That is the gift only your guests can give you. SendForGood is
              how you ask them for it.
            </p>
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section
        id="how-it-works"
        className="bg-cream-dark px-6 py-20 sm:py-28"
      >
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-3xl font-bold text-navy sm:text-4xl">
            How it works
          </h2>
          <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, i) => (
              <div
                key={i}
                className="rounded-2xl bg-white p-8 text-center shadow-md transition hover:-translate-y-1 hover:shadow-xl"
              >
                <span className="text-4xl">{step.emoji}</span>
                <h3 className="mt-4 text-xl font-semibold text-navy">
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

      {/* ── Use Cases ── */}
      <section className="bg-white px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-3xl font-bold text-navy sm:text-4xl">
            Not just for weddings
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-warm-gray">
            A Memory Vault works for any milestone worth remembering.
          </p>
          <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {USE_CASES.map((uc, i) => (
              <div
                key={i}
                className="rounded-2xl bg-cream p-8 text-center shadow-md transition hover:-translate-y-1 hover:shadow-xl"
              >
                <span className="text-4xl">{uc.emoji}</span>
                <h3 className="mt-4 text-xl font-semibold text-navy">
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

      {/* ── Pricing ── */}
      <section className="bg-cream-dark px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-navy sm:text-4xl">
            Simple pricing
          </h2>
          <div className="mx-auto mt-10 max-w-md rounded-2xl bg-white p-8 shadow-lg">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-cream-dark/60 pb-3">
                <span className="font-semibold text-navy">Vault fee</span>
                <span className="text-2xl font-extrabold tracking-tight text-navy">
                  $10<span className="text-sm font-normal text-warm-gray"> one-time</span>
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-cream-dark/60 pb-3">
                <span className="font-semibold text-navy">Video recording slot</span>
                <span className="text-2xl font-extrabold tracking-tight text-navy">
                  $1<span className="text-sm font-normal text-warm-gray"> each</span>
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-cream-dark/60 pb-3">
                <span className="font-semibold text-navy">Audio recording slot</span>
                <span className="text-2xl font-extrabold tracking-tight text-navy">
                  $0.25<span className="text-sm font-normal text-warm-gray"> each</span>
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-cream-dark/60 pb-3">
                <span className="font-semibold text-navy">Photo upload slot</span>
                <span className="text-2xl font-extrabold tracking-tight text-navy">
                  $0.25<span className="text-sm font-normal text-warm-gray"> each</span>
                </span>
              </div>
              <p className="text-xs text-warm-gray italic">
                Slots never expire. Use them for any vault, any seal date.
              </p>
              <ul className="mt-4 space-y-2 text-sm text-warm-gray">
                <li className="flex items-center gap-2">
                  <svg className="h-4 w-4 shrink-0 text-forest" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                  </svg>
                  Buy any quantity &mdash; no minimum
                </li>
                <li className="flex items-center gap-2">
                  <svg className="h-4 w-4 shrink-0 text-forest" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                  </svg>
                  Unused slots never expire
                </li>
              </ul>
            </div>
            <Link
              href="/vault/buy"
              className="mt-8 inline-flex w-full items-center justify-center rounded-lg bg-gold px-12 py-5 text-lg font-bold text-navy shadow-lg transition hover:bg-gold-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
            >
              Create Your Wedding Vault
            </Link>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="bg-white px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-3xl font-bold text-navy sm:text-4xl">
            Questions &amp; answers
          </h2>
          <dl className="mt-12 space-y-8">
            {FAQS.map((faq, i) => (
              <div key={i}>
                <dt className="text-lg font-semibold text-navy">{faq.q}</dt>
                <dd className="mt-2 leading-relaxed text-warm-gray">
                  {faq.a}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="bg-navy px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-cream sm:text-4xl">
            Activate the swarm.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-cream/70">
            Start your Wedding Memory Vault today. It takes two minutes.
          </p>
          <div className="mt-10">
            <Link
              href="/vault/buy"
              className="inline-flex items-center justify-center rounded-lg bg-gold px-12 py-5 text-lg font-bold text-navy shadow-lg transition hover:bg-gold-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
            >
              Create Your Wedding Vault
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

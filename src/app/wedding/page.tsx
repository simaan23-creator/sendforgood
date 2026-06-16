import Link from "next/link";
import type { Metadata } from "next";
import StickyCTA from "@/components/wedding/sticky-cta";

export const metadata: Metadata = {
  title: "Wedding Memory Vault — SealTheDay",
  description:
    "Turn 150 wedding guests into 150 second-shooters. Capture every moment your photographer will never reach. You decide when to relive it — the next morning, your 10th anniversary, or any day in between.",
};

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
  {
    q: "What if I change my mind after I buy?",
    a: "Full refund within 48 hours of purchase, no questions asked. After that, your slots simply never expire \u2014 use them for any future milestone.",
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
            bridal-suite laughter, the cigar smoke, the 2 a.m. dance floor.
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
              href="#starter"
              className="inline-flex w-full items-center justify-center rounded-lg border-2 border-navy px-8 py-4 text-lg font-semibold text-navy transition hover:bg-navy hover:text-cream sm:w-auto"
            >
              See Starter Package &mdash; $99.95
            </a>
          </div>
          <p className="mt-4 text-sm text-warm-gray">
            Looking for a wedding gift?{" "}
            <a
              href="#anniversary-capsule"
              className="font-semibold text-navy underline decoration-gold underline-offset-4 hover:text-gold"
            >
              Send an Anniversary Capsule &rarr;
            </a>
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-warm-gray">
            <span className="inline-flex items-center gap-1.5">
              <svg className="h-4 w-4 text-forest" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" /></svg>
              Starts at $10
            </span>
            <span className="inline-flex items-center gap-1.5">
              <svg className="h-4 w-4 text-forest" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" /></svg>
              Set up in 5 minutes
            </span>
            <span className="inline-flex items-center gap-1.5">
              <svg className="h-4 w-4 text-forest" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" /></svg>
              No guest app required
            </span>
            <span className="inline-flex items-center gap-1.5">
              <svg className="h-4 w-4 text-forest" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" /></svg>
              48-hour refund
            </span>
          </div>
          <p className="mt-4 text-sm text-warm-gray">
            After purchase, get your printable Wedding Kit &mdash; table cards, MC script, and guest invitations all ready to go.
          </p>
        </div>
      </section>

      {/* ── Founder Story ── */}
      <section className="bg-white px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-3xl">
          <p className="text-center text-sm font-semibold uppercase tracking-widest text-gold">
            Why this exists
          </p>
          <h2 className="mt-3 text-center text-3xl font-bold text-navy sm:text-4xl">
            My photographer never showed up.
          </h2>
          <div className="mx-auto mt-8 max-w-2xl space-y-5 text-lg leading-relaxed text-warm-gray">
            <p>
              On my wedding day, the photographer we hired didn&rsquo;t show up.
              Not late. Not stuck in traffic. <em>Gone.</em>
            </p>
            <p>
              I spent the morning of what was supposed to be the best day of my
              life on the phone, watching the clock, hoping. By the time I
              accepted she wasn&rsquo;t coming, the ceremony had already
              started.
            </p>
            <p>
              Here&rsquo;s the part nobody tells you: the only reason I have
              <em> any</em> record of my own wedding is because 150 of our
              guests had phones in their pockets and instinctively started
              filming. My cousin caught my dad&rsquo;s face the second he saw
              me. My college roommate got the first kiss. A groomsman somehow
              filmed the entire toast from the back of the room.
            </p>
            <p className="font-semibold text-navy">
              When I stitched it all together weeks later, I realized something
              uncomfortable: even if the photographer <em>had</em> shown up,
              what my guests captured was better.
            </p>
            <p>
              It was rawer. It was wider. It was the day from the inside, not
              the day from a tripod in the corner. That&rsquo;s when I built
              SealTheDay &mdash; not as a backup for when your vendor flakes,
              but as the thing every wedding should have had from the start.
            </p>
            <p className="border-l-4 border-gold pl-5 text-base italic text-navy">
              I never want another couple to have to choose between
              &ldquo;hope my photographer shows up&rdquo; and &ldquo;lose the
              day forever.&rdquo; That&rsquo;s the promise of this product.
              <span className="mt-2 block text-sm not-italic text-warm-gray">
                &mdash; Simaan, founder
              </span>
            </p>
          </div>
        </div>
      </section>

      {/* ── The Pitch: Swarm of Photographers ── */}
      <section className="bg-cream px-6 py-20 sm:py-28">
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
              helping your sister button the back of her dress, both of them
              laughing about something only sisters know. The bridal party is
              on the floor of the bridal suite stitching a hem back together
              five minutes before walk-out. Your dad is alone in the hallway,
              taking a breath before he sees you.
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
            SealTheDay replaces &ldquo;the photographer&rdquo; with a
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
              unguarded clip your cousin recorded of your uncles laughing in
              the corner about a story from twenty years ago.
            </p>
            <p className="text-xl font-semibold text-navy">
              That is the gift only your guests can give you. SealTheDay is
              how you ask them for it.
            </p>
          </div>
        </div>
      </section>

      {/* ── How It Works (mock phone screens) ── */}
      <section
        id="how-it-works"
        className="bg-cream-dark px-6 py-20 sm:py-28"
      >
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-bold text-navy sm:text-4xl">
            How it works
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-warm-gray">
            From purchase to the morning-after rewatch in four steps.
          </p>

          <div className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {/* Step 1 — Buy slots */}
            <div className="flex flex-col items-center text-center">
              <PhoneFrame>
                <div className="flex h-full flex-col justify-between p-3">
                  <div className="text-[10px] font-semibold uppercase tracking-widest text-gold">
                    SealTheDay
                  </div>
                  <div className="space-y-2">
                    <div className="rounded-lg border border-cream-dark bg-cream/60 p-2 text-left">
                      <div className="text-[9px] text-warm-gray">Video slots</div>
                      <div className="text-base font-bold text-navy">50 &times; $1</div>
                    </div>
                    <div className="rounded-lg border border-cream-dark bg-cream/60 p-2 text-left">
                      <div className="text-[9px] text-warm-gray">Photo slots</div>
                      <div className="text-base font-bold text-navy">200 &times; $0.25</div>
                    </div>
                    <div className="rounded-lg border border-cream-dark bg-cream/60 p-2 text-left">
                      <div className="text-[9px] text-warm-gray">Vault</div>
                      <div className="text-base font-bold text-navy">1 &times; $10</div>
                    </div>
                  </div>
                  <div className="rounded-md bg-gold py-1.5 text-center text-[10px] font-bold text-navy">
                    Checkout &mdash; $99.95
                  </div>
                </div>
              </PhoneFrame>
              <span className="mt-5 inline-flex h-7 w-7 items-center justify-center rounded-full bg-gold text-sm font-bold text-navy">1</span>
              <h3 className="mt-3 text-lg font-semibold text-navy">Buy recording slots</h3>
              <p className="mt-2 text-sm leading-relaxed text-warm-gray">
                Pick a Starter Package or build your own. Unused slots never expire.
              </p>
            </div>

            {/* Step 2 — Create vault */}
            <div className="flex flex-col items-center text-center">
              <PhoneFrame>
                <div className="flex h-full flex-col gap-2 p-3">
                  <div className="text-[10px] font-semibold uppercase tracking-widest text-gold">
                    Create Vault
                  </div>
                  <div className="rounded-md bg-cream/60 p-2 text-left">
                    <div className="text-[9px] text-warm-gray">Vault title</div>
                    <div className="truncate text-xs font-bold text-navy">Alex &amp; Jamie&rsquo;s Wedding</div>
                  </div>
                  <div className="rounded-md bg-cream/60 p-2 text-left">
                    <div className="text-[9px] text-warm-gray">Seal date</div>
                    <div className="text-xs font-bold text-navy">June 15, 2027</div>
                  </div>
                  <div className="grid grid-cols-3 gap-1 pt-1">
                    <div className="rounded bg-gold/20 py-1 text-center text-[8px] font-bold text-navy">Next AM</div>
                    <div className="rounded bg-gold py-1 text-center text-[8px] font-bold text-navy">1 yr</div>
                    <div className="rounded bg-gold/20 py-1 text-center text-[8px] font-bold text-navy">10 yr</div>
                  </div>
                  <div className="mt-auto rounded-md bg-navy py-1.5 text-center text-[10px] font-bold text-cream">
                    Lock &amp; Activate
                  </div>
                </div>
              </PhoneFrame>
              <span className="mt-5 inline-flex h-7 w-7 items-center justify-center rounded-full bg-gold text-sm font-bold text-navy">2</span>
              <h3 className="mt-3 text-lg font-semibold text-navy">Create your vault</h3>
              <p className="mt-2 text-sm leading-relaxed text-warm-gray">
                Name it. Set the seal date. Server-locked until the date arrives.
              </p>
            </div>

            {/* Step 3 — Share the link */}
            <div className="flex flex-col items-center text-center">
              <PhoneFrame>
                <div className="flex h-full flex-col items-center justify-between p-3 text-center">
                  <div className="text-[10px] font-semibold uppercase tracking-widest text-gold">
                    Scan to record
                  </div>
                  <div className="my-1 grid h-20 w-20 grid-cols-7 grid-rows-7 gap-px rounded border border-navy/30 bg-white p-1">
                    {/* fake QR pattern */}
                    {Array.from({ length: 49 }).map((_, i) => {
                      const filled = [0,2,3,5,6,8,12,14,16,18,20,21,23,25,27,29,30,32,34,36,38,40,41,43,46,48].includes(i);
                      return (
                        <span
                          key={i}
                          className={filled ? "bg-navy" : "bg-transparent"}
                        />
                      );
                    })}
                  </div>
                  <div className="text-[10px] font-semibold text-navy">
                    Alex &amp; Jamie&rsquo;s Wedding
                  </div>
                  <div className="text-[8px] text-warm-gray">
                    Open your camera. Point. Record.
                  </div>
                  <div className="mt-1 rounded-md bg-gold py-1.5 text-center text-[10px] font-bold text-navy w-full">
                    Share Link
                  </div>
                </div>
              </PhoneFrame>
              <span className="mt-5 inline-flex h-7 w-7 items-center justify-center rounded-full bg-gold text-sm font-bold text-navy">3</span>
              <h3 className="mt-3 text-lg font-semibold text-navy">Share the link</h3>
              <p className="mt-2 text-sm leading-relaxed text-warm-gray">
                QR cards on every table. Guests record from any phone &mdash; no app, no login.
              </p>
            </div>

            {/* Step 4 — Open it */}
            <div className="flex flex-col items-center text-center">
              <PhoneFrame>
                <div className="flex h-full flex-col gap-2 p-3">
                  <div className="text-[10px] font-semibold uppercase tracking-widest text-gold">
                    Vault unlocked
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    {Array.from({ length: 9 }).map((_, i) => (
                      <div
                        key={i}
                        className="aspect-square rounded bg-gradient-to-br from-navy/70 via-navy/50 to-gold/40"
                      >
                        <div className="flex h-full items-center justify-center">
                          <span className="text-[10px] text-cream">{i % 3 === 0 ? "\u25B6" : ""}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-1 text-[9px] text-warm-gray">
                    47 videos &middot; 184 photos
                  </div>
                  <div className="mt-auto rounded-md bg-navy py-1.5 text-center text-[10px] font-bold text-cream">
                    Watch the day
                  </div>
                </div>
              </PhoneFrame>
              <span className="mt-5 inline-flex h-7 w-7 items-center justify-center rounded-full bg-gold text-sm font-bold text-navy">4</span>
              <h3 className="mt-3 text-lg font-semibold text-navy">Open it together</h3>
              <p className="mt-2 text-sm leading-relaxed text-warm-gray">
                On the date you chose, your vault unlocks. Every angle, all at once
                &mdash; and every video and photo is yours to download and keep forever.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Starter Package ── */}
      <section id="starter" className="bg-cream px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-gold">
              Most popular
            </p>
            <h2 className="mt-3 text-3xl font-bold text-navy sm:text-4xl">
              The Starter Package
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-warm-gray">
              Everything a typical 100&ndash;150 person wedding needs &mdash; in one bundle, under $100.
            </p>
          </div>

          <div className="mx-auto mt-12 grid max-w-4xl gap-8 lg:grid-cols-[1.1fr_1fr]">
            {/* Bundle card */}
            <div className="rounded-3xl border-2 border-gold bg-white p-8 shadow-xl">
              <div className="flex items-baseline justify-between">
                <span className="rounded-full bg-gold/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-gold-dark">
                  Bundle
                </span>
                <div className="text-right">
                  <div className="text-sm text-warm-gray line-through">$110 a la carte</div>
                  <div className="text-4xl font-extrabold tracking-tight text-navy">
                    $99<span className="text-2xl">.95</span>
                  </div>
                  <div className="text-xs font-semibold text-forest">Vault on us</div>
                </div>
              </div>

              <ul className="mt-6 space-y-3 text-sm text-navy">
                <li className="flex items-start gap-3">
                  <svg className="mt-0.5 h-5 w-5 shrink-0 text-forest" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" /></svg>
                  <span>
                    <strong>1 Memory Vault</strong>
                    <span className="text-warm-gray"> &mdash; created the moment you check out ($10 value)</span>
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="mt-0.5 h-5 w-5 shrink-0 text-forest" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" /></svg>
                  <span>
                    <strong>50 video recording slots</strong>
                    <span className="text-warm-gray"> &mdash; 2-minute HD clips ($50 value)</span>
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="mt-0.5 h-5 w-5 shrink-0 text-forest" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" /></svg>
                  <span>
                    <strong>200 photo upload slots</strong>
                    <span className="text-warm-gray"> &mdash; straight from any guest&rsquo;s camera roll ($50 value)</span>
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="mt-0.5 h-5 w-5 shrink-0 text-forest" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" /></svg>
                  <span>
                    <strong>Printable Wedding Kit</strong>
                    <span className="text-warm-gray"> &mdash; QR table cards, MC script, guest invitations</span>
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="mt-0.5 h-5 w-5 shrink-0 text-forest" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" /></svg>
                  <span>
                    <strong>Unused slots never expire</strong>
                    <span className="text-warm-gray"> &mdash; save them for an anniversary or baby shower</span>
                  </span>
                </li>
              </ul>

              <Link
                href="/vault/buy?bundle=starter"
                className="mt-8 inline-flex w-full items-center justify-center rounded-lg bg-gold px-12 py-5 text-lg font-bold text-navy shadow-lg transition hover:bg-gold-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
              >
                Get the Starter Package &mdash; $99.95
              </Link>
              <p className="mt-3 text-center text-xs text-warm-gray">
                Secure payment via Stripe &middot; 48-hour refund &middot; No subscription
              </p>
            </div>

            {/* Math sidebar */}
            <div className="flex flex-col justify-center space-y-6">
              <div>
                <h3 className="text-lg font-bold text-navy">Why the Starter is the right size</h3>
                <p className="mt-2 text-sm leading-relaxed text-warm-gray">
                  Most couples don&rsquo;t need a slot for every guest &mdash;
                  they need enough slots for the guests who <em>will</em>
                  actually record. The math we&rsquo;ve seen: roughly 1 in 3
                  guests records a video, and 2 in 3 upload at least one photo.
                </p>
              </div>
              <div className="rounded-2xl bg-cream-dark/70 p-5 text-sm">
                <div className="font-semibold text-navy">For a 150-guest wedding:</div>
                <ul className="mt-2 space-y-1 text-warm-gray">
                  <li>&bull; 50 video slots covers ~33% of guests recording</li>
                  <li>&bull; 200 photo slots covers ~1.3 photos per guest</li>
                  <li>&bull; Plenty left over for the morning-after brunch</li>
                </ul>
              </div>
              <div className="rounded-2xl border border-gold/40 bg-gold/5 p-5 text-sm">
                <div className="font-semibold text-navy">Need more or less?</div>
                <p className="mt-1 text-warm-gray">
                  Buy any combination a la carte &mdash; vault for $10, video for $1, photos $0.25 each.
                </p>
                <Link
                  href="/vault/buy"
                  className="mt-2 inline-block text-sm font-semibold text-navy underline hover:text-gold"
                >
                  Build my own &rarr;
                </Link>
              </div>
            </div>
          </div>

          {/* Anniversary Capsule — smaller sampler bundle */}
          <div
            id="anniversary-capsule"
            className="mx-auto mt-12 max-w-3xl scroll-mt-24 rounded-2xl border-2 border-gold bg-white p-6 shadow-md sm:p-8"
          >
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-gold">
                  Also available &mdash; sampler
                </p>
                <h3 className="mt-1 text-xl font-bold text-navy">
                  The Anniversary Capsule
                </h3>
                <p className="mt-1 text-sm text-warm-gray">
                  The gift you open together on your first anniversary.
                  1 vault, 6 videos, 15 photos &mdash; sealed for up to 1 year.
                </p>
                <p className="mt-2 text-sm font-medium text-navy">
                  Buy it for yourselves, or send it as a wedding gift &mdash;
                  the couple opens it together on their first anniversary.
                </p>
              </div>
              <div className="text-right shrink-0">
                <div className="text-2xl font-extrabold text-navy">$29.95</div>
                <div className="mt-2 flex flex-col gap-2 sm:items-end">
                  <Link
                    href="/vault/buy?bundle=anniversary"
                    className="inline-flex items-center justify-center rounded-lg bg-navy px-5 py-2 text-sm font-bold text-cream shadow-md transition hover:bg-navy/90"
                  >
                    Get the Capsule
                  </Link>
                  <Link
                    href="/vault/buy?bundle=anniversary&gift=1"
                    className="inline-flex items-center justify-center rounded-lg bg-gold px-5 py-2 text-sm font-bold text-navy shadow-md transition hover:bg-gold-light"
                  >
                    Send as a gift &rarr;
                  </Link>
                </div>
              </div>
            </div>
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
            Simple a la carte pricing
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-warm-gray">
            Prefer to build it yourself? Pay only for what you&rsquo;ll use.
          </p>
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
                <li className="flex items-center gap-2">
                  <svg className="h-4 w-4 shrink-0 text-forest" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                  </svg>
                  Full refund within 48 hours of purchase
                </li>
              </ul>
            </div>
            <Link
              href="/vault/buy"
              className="mt-8 inline-flex w-full items-center justify-center rounded-lg bg-gold px-12 py-5 text-lg font-bold text-navy shadow-lg transition hover:bg-gold-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
            >
              Build Your Own Vault
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
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/vault/buy?bundle=starter"
              className="inline-flex w-full items-center justify-center rounded-lg bg-gold px-10 py-5 text-lg font-bold text-navy shadow-lg transition hover:bg-gold-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold sm:w-auto"
            >
              Starter Package &mdash; $99.95
            </Link>
            <Link
              href="/vault/buy"
              className="inline-flex w-full items-center justify-center rounded-lg border-2 border-cream/30 px-8 py-4 text-lg font-semibold text-cream transition hover:bg-cream hover:text-navy sm:w-auto"
            >
              Build Your Own
            </Link>
          </div>
        </div>
      </section>

      <StickyCTA />
    </main>
  );
}

/* ───────────────────────── helpers ───────────────────────── */

function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative mx-auto h-[260px] w-[140px] rounded-[2rem] border-[6px] border-navy bg-cream shadow-lg">
      <div className="absolute left-1/2 top-1 h-1 w-12 -translate-x-1/2 rounded-full bg-navy/60" />
      <div className="h-full overflow-hidden rounded-[1.4rem] bg-cream">
        {children}
      </div>
    </div>
  );
}

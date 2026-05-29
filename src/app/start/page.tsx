import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Start \u2014 SealTheDay",
  description: "Create your wedding memory vault in two minutes.",
};

export default function StartPage() {
  return (
    <main className="min-h-screen bg-cream">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-navy">
            Two minutes to your wedding vault.
          </h1>
          <p className="mt-3 text-lg text-navy/60">
            $10 to open it. Add as many recording slots as you need. Slots
            never expire.
          </p>
        </div>

        <div className="mx-auto max-w-md">
          <div className="relative flex flex-col rounded-2xl border-2 border-gold bg-white p-8 shadow-md">
            <span className="text-4xl">{"\uD83D\uDD12"}</span>
            <h2 className="mt-3 text-2xl font-bold text-navy">
              Create Your Wedding Vault
            </h2>
            <p className="mt-1 text-sm font-semibold text-navy/50">
              $10 vault + slots from $0.25
            </p>
            <p className="mt-4 text-sm text-navy/70 leading-relaxed">
              Buy a vault, choose your seal date, share the link or QR code
              with your guests. They record video, audio, and upload photos
              straight from their phones.
            </p>
            <ul className="mt-5 space-y-2 text-sm text-navy/80">
              <li>{"\u2713"} $1 per video slot &middot; $0.25 per photo</li>
              <li>{"\u2713"} Sealed until the date you pick</li>
              <li>{"\u2713"} Unused slots never expire</li>
            </ul>
            <Link
              href="/vault/buy"
              className="mt-6 block w-full rounded-lg bg-gold px-4 py-3 text-center text-base font-bold text-navy shadow-sm transition hover:bg-gold-light"
            >
              Start Building Your Vault
            </Link>
          </div>
          <p className="mt-6 text-center text-sm text-warm-gray">
            Already have a vault?{" "}
            <Link
              href="/vault/my"
              className="font-semibold text-navy underline decoration-gold underline-offset-4"
            >
              Open your dashboard
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

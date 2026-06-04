import { Metadata } from "next";
import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: "Photographer Partners — SealTheDay",
  description:
    "The photographers who recommend SealTheDay to their couples. Featured each month.",
};

export const revalidate = 600; // 10-minute ISR

interface Winner {
  id: string;
  affiliate_id: string;
  month: string; // YYYY-MM-DD
  business_name: string;
  photo_url: string | null;
  quote: string | null;
  website: string | null;
}

function formatMonth(yyyymmdd: string): string {
  const [y, m] = yyyymmdd.split("-").map(Number);
  if (!y || !m) return yyyymmdd;
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

async function getWinners(): Promise<{ current: Winner | null; past: Winner[] }> {
  // Show the most recently published winner as "current" and everything
  // older as "past". One row per month enforced by the unique index.
  const { data } = await supabaseAdmin
    .from("photographer_of_month")
    .select("id, affiliate_id, month, business_name, photo_url, quote, website")
    .order("month", { ascending: false })
    .limit(24);

  const rows = (data || []) as Winner[];
  if (rows.length === 0) return { current: null, past: [] };
  return { current: rows[0]!, past: rows.slice(1) };
}

async function getAffiliateCode(affiliateId: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from("affiliates")
    .select("code, active")
    .eq("id", affiliateId)
    .maybeSingle();
  if (!data || !data.active) return null;
  return data.code;
}

export default async function PartnersPage() {
  const { current, past } = await getWinners();
  const currentCode = current ? await getAffiliateCode(current.affiliate_id) : null;

  return (
    <section className="px-6 py-16 sm:py-24">
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-gold">
            SealTheDay partners
          </p>
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl md:text-5xl">
            Photographer of the Month
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-warm-gray">
            Each month we feature one photographer whose couples are
            making the most of their wedding vault. If you&apos;d like to be
            considered, <Link href="/affiliate/apply" className="font-semibold text-navy underline">join the program</Link>.
          </p>
        </div>

        {current ? (
          <article className="mx-auto mt-12 max-w-3xl rounded-2xl border-2 border-gold bg-white p-8 shadow-md">
            <div className="grid gap-6 sm:grid-cols-[200px_1fr] sm:items-start">
              {current.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={current.photo_url}
                  alt={current.business_name}
                  className="aspect-square w-full rounded-xl object-cover"
                />
              ) : (
                <div className="aspect-square w-full rounded-xl bg-cream" />
              )}
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-gold">
                  {formatMonth(current.month)}
                </p>
                <h2 className="mt-1 text-2xl font-bold text-navy">
                  {current.business_name}
                </h2>
                {current.quote && (
                  <blockquote className="mt-4 border-l-4 border-gold pl-4 text-warm-gray italic">
                    &ldquo;{current.quote}&rdquo;
                  </blockquote>
                )}
                <div className="mt-5 flex flex-wrap gap-3">
                  {current.website && (
                    <a
                      href={current.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg bg-navy px-5 py-2 text-sm font-semibold text-cream transition hover:bg-navy/90"
                    >
                      Visit website
                    </a>
                  )}
                  {currentCode && (
                    <Link
                      href={`/vault?ref=${currentCode}`}
                      className="rounded-lg border border-navy px-5 py-2 text-sm font-semibold text-navy transition hover:bg-navy hover:text-cream"
                    >
                      Get a vault via {current.business_name}
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </article>
        ) : (
          <p className="mx-auto mt-12 max-w-md rounded-xl border border-cream-dark bg-white p-6 text-center text-warm-gray">
            No feature published yet. Check back soon.
          </p>
        )}

        {past.length > 0 && (
          <div className="mt-20">
            <h2 className="text-center text-2xl font-bold text-navy">
              Past features
            </h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {past.map((w) => (
                <article
                  key={w.id}
                  className="rounded-xl border border-cream-dark bg-white p-5"
                >
                  {w.photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={w.photo_url}
                      alt={w.business_name}
                      className="aspect-video w-full rounded-lg object-cover"
                    />
                  ) : (
                    <div className="aspect-video w-full rounded-lg bg-cream" />
                  )}
                  <p className="mt-3 text-xs font-semibold uppercase tracking-widest text-gold">
                    {formatMonth(w.month)}
                  </p>
                  <p className="mt-1 text-lg font-semibold text-navy">
                    {w.business_name}
                  </p>
                  {w.website && (
                    <a
                      href={w.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-block text-sm font-medium text-navy underline"
                    >
                      Visit website
                    </a>
                  )}
                </article>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

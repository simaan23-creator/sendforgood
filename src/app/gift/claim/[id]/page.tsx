"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface GiftSummary {
  business_name: string;
  personal_message: string | null;
  expires_at: string | null;
  expired: boolean;
  claimed: boolean;
  contents: {
    vault_fees: number;
    audio_credits: number;
    video_credits: number;
    photo_credits: number;
  };
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function GiftClaimPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const supabase = createClient();

  const [summary, setSummary] = useState<GiftSummary | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [recipientEmail, setRecipientEmail] = useState<string | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/gift/claim/${id}`);
        if (res.status === 404) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        const data = await res.json();
        setSummary(data);
      } catch {
        setNotFound(true);
      }

      const { data: { user } } = await supabase.auth.getUser();
      setUserEmail(user?.email ?? null);
      setLoading(false);
    }
    load();
  }, [id, supabase]);

  // The public summary endpoint doesn't return recipient_email (privacy),
  // so we ask Supabase auth what the user's email is and rely on the
  // server to reject mismatches with a clear message.
  useEffect(() => {
    if (userEmail) setRecipientEmail(userEmail);
  }, [userEmail]);

  async function handleClaim() {
    if (claiming) return;
    setClaimError(null);
    setClaiming(true);
    try {
      const res = await fetch(`/api/gift/claim/${id}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setClaimError(data.error || "Could not claim gift.");
        setClaiming(false);
        return;
      }
      router.push("/vault/my?gifted=1");
    } catch {
      setClaimError("Network error. Please try again.");
      setClaiming(false);
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    setUserEmail(null);
    setRecipientEmail(null);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-navy border-t-transparent" />
      </div>
    );
  }

  if (notFound || !summary) {
    return (
      <main className="min-h-screen bg-cream">
        <div className="mx-auto max-w-md px-6 py-20 text-center">
          <h1 className="text-2xl font-bold text-navy">Gift not found</h1>
          <p className="mt-3 text-sm text-warm-gray">
            This claim link is invalid or no longer active.
          </p>
          <Link
            href="/"
            className="mt-6 inline-block rounded-lg bg-navy px-5 py-2.5 text-sm font-semibold text-cream transition hover:bg-navy-light"
          >
            Back home
          </Link>
        </div>
      </main>
    );
  }

  if (summary.expired) {
    return (
      <main className="min-h-screen bg-cream">
        <div className="mx-auto max-w-md px-6 py-20 text-center">
          <h1 className="text-2xl font-bold text-navy">This gift has expired</h1>
          <p className="mt-3 text-sm text-warm-gray">
            This gift expired on {summary.expires_at ? formatDate(summary.expires_at) : "an earlier date"}. Contact{" "}
            <span className="font-semibold text-navy">{summary.business_name}</span> for a fresh one.
          </p>
        </div>
      </main>
    );
  }

  if (summary.claimed) {
    return (
      <main className="min-h-screen bg-cream">
        <div className="mx-auto max-w-md px-6 py-20 text-center">
          <h1 className="text-2xl font-bold text-navy">Already claimed</h1>
          <p className="mt-3 text-sm text-warm-gray">
            This gift has already been claimed.
          </p>
          <Link
            href="/vault/my"
            className="mt-6 inline-block rounded-lg bg-navy px-5 py-2.5 text-sm font-semibold text-cream transition hover:bg-navy-light"
          >
            Go to my vaults
          </Link>
        </div>
      </main>
    );
  }

  const loggedIn = !!userEmail;
  const authRedirect = `/auth?redirect=${encodeURIComponent(`/gift/claim/${id}`)}${recipientEmail ? `&email_hint=${encodeURIComponent(recipientEmail)}` : ""}`;

  return (
    <main className="min-h-screen bg-cream">
      <div className="mx-auto max-w-xl px-6 py-16">
        <div className="rounded-2xl border border-cream-dark bg-white p-8 shadow-md">
          <p className="text-xs font-semibold uppercase tracking-widest text-gold">
            A gift just for you
          </p>
          <h1 className="mt-2 text-2xl font-bold text-navy" style={{ fontFamily: "Georgia, serif" }}>
            {summary.business_name} sent you a SealTheDay Anniversary Capsule
          </h1>

          {summary.personal_message && (
            <blockquote className="mt-5 rounded-lg border-l-4 border-gold bg-gold/10 px-4 py-3 text-sm italic text-navy">
              {summary.personal_message}
            </blockquote>
          )}

          <div className="mt-6 rounded-lg border border-cream-dark bg-cream/50 p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-gold">
              What&apos;s included
            </p>
            <ul className="mt-3 space-y-1.5 text-sm text-navy">
              <li>{summary.contents.vault_fees} private memory vault</li>
              <li>{summary.contents.video_credits} video message slots</li>
              <li>{summary.contents.photo_credits} photo upload slots</li>
              <li>Sealed for up to 12 months</li>
            </ul>
          </div>

          {claimError && (
            <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {claimError}
            </p>
          )}

          <div className="mt-6">
            {loggedIn ? (
              <>
                <button
                  onClick={handleClaim}
                  disabled={claiming}
                  className="w-full rounded-lg bg-gold px-5 py-3 text-sm font-semibold text-navy shadow-sm transition hover:bg-gold-light disabled:opacity-60"
                >
                  {claiming ? "Claiming..." : "Claim my gift"}
                </button>
                <p className="mt-3 text-center text-xs text-warm-gray">
                  Signed in as <span className="font-semibold text-navy">{userEmail}</span>.{" "}
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="underline hover:text-navy"
                  >
                    Sign out
                  </button>
                </p>
              </>
            ) : (
              <Link
                href={authRedirect}
                className="inline-flex w-full items-center justify-center rounded-lg bg-gold px-5 py-3 text-sm font-semibold text-navy shadow-sm transition hover:bg-gold-light"
              >
                Sign in to claim
              </Link>
            )}
          </div>

          {summary.expires_at && (
            <p className="mt-6 text-center text-xs text-warm-gray">
              Expires {formatDate(summary.expires_at)}.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}

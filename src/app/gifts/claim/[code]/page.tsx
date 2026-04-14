"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { TIERS } from "@/lib/constants";

interface GiftedCredit {
  id: string;
  sender_id: string;
  recipient_name: string;
  tier: string;
  message: string | null;
  status: string;
  sender_first_name: string;
}

export default function ClaimGiftPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const code = params.code as string;

  const [gift, setGift] = useState<GiftedCredit | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      // Check auth status
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);

      // Fetch the gifted credit by claim code (public, no auth needed to view)
      const res = await fetch(`/api/gifts/claim/${code}`, { method: "GET" });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Gift not found");
      } else {
        setGift(data.gift);
        if (data.gift.status === "claimed") {
          setClaimed(true);
        }
      }
      setLoading(false);
    }
    load();
  }, [code, supabase]);

  async function handleClaim() {
    if (!userId) {
      // Not logged in — redirect to auth with return URL
      router.push(`/auth?redirect=/gifts/claim/${code}`);
      return;
    }

    setClaiming(true);
    setError("");

    const res = await fetch(`/api/gifts/claim/${code}`, {
      method: "POST",
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Failed to claim gift");
      setClaiming(false);
      return;
    }

    setClaimed(true);
    setClaiming(false);

    // Redirect to assign page after a moment
    setTimeout(() => {
      router.push("/gifts/assign");
    }, 2000);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-navy border-t-transparent" />
      </div>
    );
  }

  if (error && !gift) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-cream to-cream-dark px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-lg text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
            <svg className="h-10 w-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-navy">Gift Not Found</h1>
          <p className="mt-3 text-warm-gray">{error}</p>
          <Link
            href="/"
            className="mt-8 inline-flex items-center rounded-lg bg-navy px-6 py-3 text-sm font-semibold text-cream transition hover:bg-navy/90"
          >
            Go Home
          </Link>
        </div>
      </main>
    );
  }

  if (!gift) return null;

  const tierInfo = TIERS.find((t) => t.id === gift.tier);
  const tierName = tierInfo?.name || gift.tier;

  if (claimed) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-cream to-cream-dark px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-lg text-center">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-forest/10">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-12 w-12 text-forest">
              <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">Gift Claimed!</h1>
          <p className="mt-3 text-warm-gray">
            Your <span className="font-semibold text-navy">{tierName}</span> gift credit has been added to your account.
            Redirecting you to set up your preferences...
          </p>
          <Link
            href="/gifts/assign"
            className="mt-6 inline-flex items-center rounded-lg bg-forest px-6 py-3 text-sm font-semibold text-cream transition hover:bg-forest-light"
          >
            Set Up Preferences
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-cream to-cream-dark px-4 py-16 sm:py-24">
      <div className="mx-auto max-w-lg">
        <div className="rounded-2xl border border-cream-dark bg-white p-8 shadow-lg text-center">
          {/* Gift icon */}
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gold/10">
            <svg className="h-10 w-10 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 1 0 9.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1 1 14.625 7.5H12m0 0V21m-8.25-9.75h16.5" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-navy sm:text-3xl">
            You&apos;ve received a gift!
          </h1>

          <p className="mt-3 text-warm-gray">
            <span className="font-semibold text-navy">{gift.sender_first_name}</span> sent you a gift credit on SendForGood.
          </p>

          {/* Tier info */}
          <div className="mt-6 rounded-xl border border-cream-dark bg-cream/30 p-4">
            <p className="text-sm font-medium text-warm-gray">Gift Tier</p>
            <p className="mt-1 text-xl font-bold text-navy">{tierName}</p>
            {tierInfo && (
              <p className="mt-1 text-sm text-warm-gray">{tierInfo.description}</p>
            )}
          </div>

          {/* Sender message */}
          {gift.message && (
            <div className="mt-6 rounded-xl border-l-4 border-gold bg-cream/30 p-4 text-left">
              <p className="text-sm italic text-navy">&ldquo;{gift.message}&rdquo;</p>
              <p className="mt-2 text-xs text-warm-gray">&mdash; {gift.sender_first_name}</p>
            </div>
          )}

          {/* Claim button */}
          <button
            type="button"
            onClick={handleClaim}
            disabled={claiming}
            className="mt-8 w-full rounded-lg bg-forest px-8 py-3.5 text-sm font-bold text-cream shadow-lg transition hover:bg-forest-light disabled:cursor-not-allowed disabled:opacity-60"
          >
            {claiming ? "Claiming..." : !userId ? "Sign In to Claim Your Gift" : "Claim Your Gift"}
          </button>

          {error && (
            <p className="mt-3 text-sm text-red-600">{error}</p>
          )}

          <p className="mt-4 text-xs text-warm-gray leading-relaxed">
            After claiming, you&apos;ll set up your preferences (interests, address, occasion date) and we&apos;ll deliver a curated gift every year.
          </p>
        </div>
      </div>
    </main>
  );
}

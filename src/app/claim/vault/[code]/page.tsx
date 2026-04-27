"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface VaultGift {
  id: string;
  recipient_name: string;
  audio_credits: number;
  video_credits: number;
  photo_credits: number;
  message: string | null;
  status: string;
}

export default function ClaimVaultGiftPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const code = params.code as string;

  const [gift, setGift] = useState<VaultGift | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUserId(user?.id || null);

      const res = await fetch(`/api/claim/vault/${code}`, { method: "GET" });
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
      router.push(`/auth?redirect=/claim/vault/${code}`);
      return;
    }

    setClaiming(true);
    setError("");

    const res = await fetch(`/api/claim/vault/${code}`, {
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
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-navy border-t-transparent" />
      </div>
    );
  }

  if (error && !gift) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-cream px-4">
        <div className="rounded-2xl border border-cream-dark bg-white p-8 text-center shadow-md max-w-md">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
            <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="mt-5 text-xl font-bold text-navy">Gift Not Found</h1>
          <p className="mt-2 text-warm-gray">{error}</p>
          <Link
            href="/"
            className="mt-6 inline-block rounded-lg bg-navy px-6 py-2.5 text-sm font-semibold text-cream transition hover:bg-navy-light"
          >
            Go Home
          </Link>
        </div>
      </main>
    );
  }

  if (!gift) return null;

  const creditParts = [];
  if (gift.audio_credits > 0) creditParts.push(`${gift.audio_credits} audio`);
  if (gift.video_credits > 0) creditParts.push(`${gift.video_credits} video`);
  if (gift.photo_credits > 0) creditParts.push(`${gift.photo_credits} photo`);

  return (
    <main className="flex min-h-screen items-center justify-center bg-cream px-4">
      <div className="rounded-2xl border border-cream-dark bg-white p-8 text-center shadow-md max-w-md w-full">
        {claimed ? (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-forest/10">
              <svg className="h-8 w-8 text-forest" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="mt-5 text-2xl font-bold text-navy">Gift Claimed!</h1>
            <p className="mt-3 text-warm-gray">
              Your vault credits and free vault creation have been added to your account.
            </p>
            <div className="mt-4 rounded-lg border border-cream-dark bg-cream p-4">
              <p className="text-sm font-medium text-navy">Credits added:</p>
              <p className="mt-1 text-sm text-warm-gray">{creditParts.join(", ")} recording slots</p>
              <p className="mt-1 text-sm text-warm-gray">+ Free vault creation</p>
            </div>
            <Link
              href="/request/create"
              className="mt-6 inline-block rounded-lg bg-navy px-6 py-2.5 text-sm font-semibold text-cream transition hover:bg-navy-light"
            >
              Create Your Vault
            </Link>
          </>
        ) : (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gold/10">
              <span className="text-3xl">&#x1F381;</span>
            </div>
            <h1 className="mt-5 text-2xl font-bold text-navy">
              You&apos;ve been gifted a Memory Vault!
            </h1>
            <p className="mt-3 text-warm-gray">
              Hi <strong className="text-navy">{gift.recipient_name}</strong>, someone special has gifted you a Memory Vault &mdash; a place to collect messages from your loved ones.
            </p>

            {gift.message && (
              <div className="mt-4 rounded-lg border-l-4 border-gold bg-gold/5 p-4 text-left">
                <p className="text-navy italic">&ldquo;{gift.message}&rdquo;</p>
              </div>
            )}

            <div className="mt-4 rounded-lg border border-cream-dark bg-cream p-4">
              <p className="text-sm font-medium text-navy">Your package includes:</p>
              <p className="mt-1 text-sm text-warm-gray">{creditParts.join(", ")} recording slots</p>
              <p className="mt-1 text-sm text-warm-gray">+ Free vault creation</p>
            </div>

            {error && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              onClick={handleClaim}
              disabled={claiming}
              className="mt-6 w-full rounded-lg bg-navy px-6 py-3 text-base font-semibold text-cream shadow-md transition hover:bg-navy-light disabled:opacity-60"
            >
              {claiming
                ? "Claiming..."
                : userId
                  ? "Claim Your Gift"
                  : "Sign Up / Log In to Claim"}
            </button>
          </>
        )}
      </div>
    </main>
  );
}

"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

function SuccessContent() {
  const searchParams = useSearchParams();
  const audio = searchParams.get("audio") || "0";
  const video = searchParams.get("video") || "0";

  return (
    <main className="min-h-screen bg-cream">
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <div className="rounded-2xl border border-cream-dark bg-white p-10 shadow-md">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-forest/10">
            <svg
              className="h-8 w-8 text-forest"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          <h1 className="mt-5 text-2xl font-bold text-navy">
            Your credits are ready!
          </h1>
          <p className="mt-3 text-warm-gray">
            Your Memory Vault credits have been added to your account.
          </p>

          <div className="mt-6 rounded-lg bg-cream p-4">
            <div className="flex justify-center gap-6">
              {parseInt(audio) > 0 && (
                <div className="text-center">
                  <p className="text-3xl font-bold text-navy">{audio}</p>
                  <p className="text-sm text-warm-gray">Audio credits</p>
                </div>
              )}
              {parseInt(video) > 0 && (
                <div className="text-center">
                  <p className="text-3xl font-bold text-navy">{video}</p>
                  <p className="text-sm text-warm-gray">Video credits</p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/request/create"
              className="rounded-lg bg-navy px-6 py-3 text-sm font-semibold text-cream shadow-md transition hover:bg-navy-light"
            >
              Create your first vault
            </Link>
            <Link
              href="/vault/my"
              className="rounded-lg border border-cream-dark px-6 py-3 text-sm font-medium text-warm-gray transition hover:bg-cream-dark"
            >
              View your vault
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function VaultSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-cream">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-navy border-t-transparent" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}

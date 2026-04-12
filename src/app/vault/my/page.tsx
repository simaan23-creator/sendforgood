"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface MemoryRequest {
  id: string;
  title: string;
  occasion: string;
  delivery_date: string;
  unique_code: string;
  status: string;
  recording_count: number;
  created_at: string;
  sealed_until: string | null;
  is_sealed: boolean;
  max_audio_recordings: number;
  max_video_recordings: number;
}

interface CreditBalance {
  audioCredits: number;
  videoCredits: number;
  audioUsed: number;
  videoUsed: number;
}

export default function MyVaultsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [vaults, setVaults] = useState<MemoryRequest[]>([]);
  const [credits, setCredits] = useState<CreditBalance | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth?redirect=/vault/my");
        return;
      }

      const [vaultsRes, creditsRes] = await Promise.all([
        fetch("/api/memory-requests"),
        fetch("/api/vault/credits"),
      ]);

      if (vaultsRes.ok) {
        const data = await vaultsRes.json();
        setVaults(data);
      }

      if (creditsRes.ok) {
        const data = await creditsRes.json();
        setCredits(data);
      }

      setLoading(false);
    }
    load();
  }, [supabase, router]);

  function copyLink(uniqueCode: string, vaultId: string) {
    const url = `${window.location.origin}/record/${uniqueCode}`;
    navigator.clipboard.writeText(url);
    setCopiedId(vaultId);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function getDaysUntil(dateStr: string): number {
    const target = new Date(dateStr + "T00:00:00");
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }

  const availableAudio = credits
    ? credits.audioCredits - credits.audioUsed
    : 0;
  const availableVideo = credits
    ? credits.videoCredits - credits.videoUsed
    : 0;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-navy border-t-transparent" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-cream">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-navy">My Vaults</h1>
            <p className="mt-1 text-sm text-warm-gray">
              Manage your memory vaults and recordings.
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/vault/buy"
              className="rounded-lg border border-cream-dark px-4 py-2 text-sm font-medium text-warm-gray transition hover:bg-cream-dark"
            >
              Buy More Credits
            </Link>
            <Link
              href="/request/create"
              className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-cream transition hover:bg-navy-light"
            >
              + New Vault
            </Link>
          </div>
        </div>

        {/* Credit balance */}
        {credits && (
          <div className="mb-8 rounded-xl border border-cream-dark bg-white p-5">
            <p className="text-sm font-medium text-navy">Credit Balance</p>
            <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <p className="text-2xl font-bold text-navy">{availableAudio}</p>
                <p className="text-xs text-warm-gray">Audio available</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-navy">{availableVideo}</p>
                <p className="text-xs text-warm-gray">Video available</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-warm-gray">
                  {credits.audioUsed}
                </p>
                <p className="text-xs text-warm-gray">Audio used</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-warm-gray">
                  {credits.videoUsed}
                </p>
                <p className="text-xs text-warm-gray">Video used</p>
              </div>
            </div>
          </div>
        )}

        {/* Vaults list */}
        {vaults.length === 0 ? (
          <div className="rounded-2xl border border-cream-dark bg-white py-20 text-center">
            <span className="text-5xl">{"\uD83D\uDD12"}</span>
            <h2 className="mt-4 text-xl font-semibold text-navy">
              No vaults yet
            </h2>
            <p className="mt-2 text-warm-gray">
              Create your first memory vault and start collecting messages.
            </p>
            <Link
              href="/request/create"
              className="mt-6 inline-flex items-center rounded-lg bg-navy px-6 py-3 text-sm font-semibold text-cream transition hover:bg-navy-light"
            >
              Create Your First Vault
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {vaults.map((vault) => {
              const isSealed =
                vault.is_sealed &&
                vault.sealed_until &&
                getDaysUntil(vault.sealed_until) > 0;
              const sealedDays = vault.sealed_until
                ? getDaysUntil(vault.sealed_until)
                : 0;

              return (
                <div
                  key={vault.id}
                  className="rounded-xl border border-cream-dark bg-white p-6 transition-shadow hover:shadow-md"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg font-semibold text-navy">
                        {isSealed ? "\uD83D\uDD12 " : ""}
                        {vault.title}
                      </h3>
                      <p className="mt-1 text-sm text-warm-gray">
                        {vault.occasion} &middot; Created{" "}
                        {formatDate(vault.created_at.split("T")[0])}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center rounded-full bg-navy/10 px-3 py-1 text-xs font-medium text-navy">
                        {vault.recording_count} recording
                        {vault.recording_count !== 1 ? "s" : ""}
                      </span>
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium capitalize ${
                          vault.status === "active"
                            ? "bg-forest/10 text-forest"
                            : vault.status === "completed"
                              ? "bg-navy/10 text-navy"
                              : "bg-red-100 text-red-700"
                        }`}
                      >
                        {vault.status}
                      </span>
                    </div>
                  </div>

                  {/* Sealed info */}
                  {isSealed && vault.sealed_until && (
                    <div className="mt-4 rounded-lg border border-gold/30 bg-gold/5 p-3">
                      <p className="text-sm text-navy">
                        &#x1F512; Sealed until {formatDate(vault.sealed_until)}{" "}
                        &middot;{" "}
                        <span className="font-semibold">
                          Opens in {sealedDays} day{sealedDays !== 1 ? "s" : ""}
                        </span>
                      </p>
                    </div>
                  )}

                  {/* Delivery date */}
                  <div className="mt-3 text-sm text-warm-gray">
                    Delivers {formatDate(vault.delivery_date)}
                    {vault.max_audio_recordings > 0 && (
                      <span className="ml-3">
                        {"\uD83C\uDFA4"} {vault.max_audio_recordings} audio
                        slots
                      </span>
                    )}
                    {vault.max_video_recordings > 0 && (
                      <span className="ml-3">
                        {"\uD83C\uDFA5"} {vault.max_video_recordings} video
                        slots
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  {vault.status === "active" && (
                    <div className="mt-4 flex items-center gap-3 border-t border-cream-dark pt-4">
                      <button
                        onClick={() => copyLink(vault.unique_code, vault.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-cream-dark px-4 py-2 text-sm font-medium text-navy transition hover:bg-cream-dark"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className="h-4 w-4"
                        >
                          <path d="M13 4.5a2.5 2.5 0 1 1 .702 1.737L6.97 9.604a2.518 2.518 0 0 1 0 .799l6.733 3.365a2.5 2.5 0 1 1-.671 1.341l-6.733-3.366a2.5 2.5 0 1 1 0-3.48l6.733-3.366A2.52 2.52 0 0 1 13 4.5Z" />
                        </svg>
                        {copiedId === vault.id ? "Copied!" : "Share Link"}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

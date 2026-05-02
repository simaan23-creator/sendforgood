"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { fixWebmDuration } from "@/lib/fix-webm-duration";

interface Recording {
  id: string;
  recorder_name: string | null;
  audio_url: string;
  message_format: string | null;
  duration_seconds: number | null;
  status: string;
  created_at: string;
}

interface VaultMeta {
  id: string;
  title: string;
  occasion: string | null;
  delivery_date: string;
  sealed_until: string | null;
  is_sealed: boolean;
  status: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function VaultViewPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [vault, setVault] = useState<VaultMeta | null>(null);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [locked, setLocked] = useState(false);
  const [unlocksAt, setUnlocksAt] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/vault/${id}/recordings`);
        if (res.status === 401) {
          router.push(`/auth?redirect=/vault/view/${id}`);
          return;
        }
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Could not load vault");
        }
        const data = await res.json();
        setVault(data.vault);
        setRecordings(data.recordings || []);
        setLocked(!!data.locked);
        setUnlocksAt(data.unlocks_at ?? null);
        setPendingCount(data.pending_count ?? 0);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, router]);

  function daysUntil(iso: string): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(iso);
    target.setHours(0, 0, 0, 0);
    return Math.max(0, Math.ceil((target.getTime() - today.getTime()) / 86400000));
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-navy border-t-transparent" />
      </div>
    );
  }

  if (error || !vault) {
    return (
      <main className="min-h-screen bg-cream">
        <div className="mx-auto max-w-lg px-4 py-20 text-center">
          <div className="rounded-2xl border border-cream-dark bg-white p-10 shadow-md">
            <h1 className="text-2xl font-bold text-navy">Vault not available</h1>
            <p className="mt-3 text-warm-gray">
              {error || "We couldn\u2019t find this vault."}
            </p>
            <Link
              href="/vault/my"
              className="mt-6 inline-block rounded-lg border border-navy px-4 py-2 text-sm font-medium text-navy hover:bg-cream-dark"
            >
              Back to my vaults
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-cream">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/vault/my"
            className="text-sm font-medium text-navy underline hover:text-gold"
          >
            &larr; Back to my vaults
          </Link>
          <h1 className="mt-4 text-3xl font-bold text-navy sm:text-4xl">
            {vault.title}
          </h1>
          <p className="mt-2 text-warm-gray">
            {vault.occasion ? `${vault.occasion} \u00B7 ` : ""}
            Delivered {formatDate(vault.delivery_date)}
          </p>
          <p className="mt-1 text-sm text-warm-gray">
            {recordings.length} {recordings.length === 1 ? "recording" : "recordings"}
          </p>
        </div>

        {locked ? (
          <div className="rounded-2xl border border-gold/40 bg-gradient-to-b from-white to-cream p-10 text-center shadow-md">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-navy text-3xl text-gold">
              {"\u{1F510}"}
            </div>
            <h2 className="text-2xl font-bold text-navy">
              This vault is sealed.
            </h2>
            {unlocksAt ? (
              <>
                <p className="mt-3 text-warm-gray">
                  It opens on{" "}
                  <span className="font-semibold text-navy">
                    {formatDate(unlocksAt)}
                  </span>
                  .
                </p>
                <p className="mt-1 text-sm text-warm-gray">
                  {daysUntil(unlocksAt) === 0
                    ? "Today is the day. Refresh after midnight."
                    : `${daysUntil(unlocksAt)} ${daysUntil(unlocksAt) === 1 ? "day" : "days"} to go.`}
                </p>
              </>
            ) : (
              <p className="mt-3 text-warm-gray">
                It will open on the date you set.
              </p>
            )}
            <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-cream-dark px-4 py-2 text-sm text-navy">
              <span className="font-semibold">{pendingCount}</span>
              <span className="text-warm-gray">
                {pendingCount === 1 ? "memory waiting" : "memories waiting"} inside
              </span>
            </div>
            <p className="mx-auto mt-6 max-w-md text-sm leading-relaxed text-warm-gray">
              Recordings are encrypted in your vault and cannot be viewed &mdash;
              even by you &mdash; until the date you chose. That is what makes
              this gift special. We will email you a link the moment it opens.
            </p>
          </div>
        ) : recordings.length === 0 ? (
          <div className="rounded-2xl border border-cream-dark bg-white p-10 text-center shadow-sm">
            <p className="text-warm-gray">
              No one recorded a memory for this vault.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {recordings.map((rec) => {
              const isVideo = rec.message_format === "video";
              const isPhoto = rec.message_format === "photo";
              const recorder = rec.recorder_name || "Someone special";
              return (
                <div
                  key={rec.id}
                  className="rounded-2xl border border-cream-dark bg-white p-6 shadow-sm sm:p-8"
                >
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-navy">{recorder}</p>
                      <p className="text-xs text-warm-gray-light">
                        {formatDate(rec.created_at)}
                      </p>
                    </div>
                    <span className="whitespace-nowrap rounded-full bg-cream px-3 py-1 text-xs font-medium uppercase tracking-wide text-warm-gray">
                      {isPhoto ? "Photo" : isVideo ? "Video" : "Audio"}
                    </span>
                  </div>

                  <div className="rounded-xl bg-cream p-4">
                    {isPhoto ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={rec.audio_url}
                        alt={`Photo from ${recorder}`}
                        className="mx-auto max-h-[600px] w-full rounded-lg object-contain"
                      />
                    ) : isVideo ? (
                      <video
                        controls
                        playsInline
                        preload="metadata"
                        onLoadedMetadata={fixWebmDuration}
                        src={rec.audio_url}
                        className="w-full rounded-lg bg-black"
                      />
                    ) : (
                      <audio
                        controls
                        preload="metadata"
                        onLoadedMetadata={fixWebmDuration}
                        src={rec.audio_url}
                        className="w-full"
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

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
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, router]);

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

        {recordings.length === 0 ? (
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
                        src={rec.audio_url}
                        className="w-full rounded-lg bg-black"
                      />
                    ) : (
                      <audio controls src={rec.audio_url} className="w-full" />
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

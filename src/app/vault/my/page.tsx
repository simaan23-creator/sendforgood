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
  note_to_recorder: string | null;
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

  const [loading, setLoading] = useState(false);
  const [vaults, setVaults] = useState<MemoryRequest[]>([]);
  const [credits, setCredits] = useState<CreditBalance | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    title: "",
    note_to_recorder: "",
    sealed_until: "",
  });
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth?redirect=/vault/my");
        return;
      }

      setLoading(false); // Show page immediately

      // Load independently with timeout
      const timeout = (ms: number) => new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), ms));
      
      try {
        const vaultsRes = await Promise.race([fetch("/api/memory-requests"), timeout(8000)]) as Response;
        if (vaultsRes.ok) { const data = await vaultsRes.json(); setVaults(data); }
      } catch { /* timeout */ }

      try {
        const creditsRes = await Promise.race([fetch("/api/vault/credits"), timeout(8000)]) as Response;
        if (creditsRes.ok) { const data = await creditsRes.json(); setCredits(data); }
      } catch { /* timeout */ }
    }
    load();
  }, [supabase, router]);

  function copyLink(uniqueCode: string, vaultId: string) {
    const url = `https://sendforgood.com/record/${uniqueCode}`;
    navigator.clipboard.writeText(url);
    setCopiedId(vaultId);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function getDaysUntil(dateStr: string): number {
    const target = new Date(dateStr + "T00:00:00");
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return Math.ceil(
      (target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
  }

  function formatDaysUntil(days: number): string {
    if (days <= 0) return "Opens today";
    if (days === 1) return "Opens tomorrow";
    return `Opens in ${days} days`;
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }

  function startEditing(vault: MemoryRequest) {
    setEditingId(vault.id);
    setEditForm({
      title: vault.title,
      note_to_recorder: vault.note_to_recorder || "",
      sealed_until: vault.sealed_until || "",
    });
    setEditError(null);
  }

  function cancelEditing() {
    setEditingId(null);
    setEditError(null);
  }

  async function saveEdit(vault: MemoryRequest) {
    setEditSaving(true);
    setEditError(null);

    const body: Record<string, string | null> = {};

    if (editForm.title !== vault.title) {
      body.title = editForm.title;
    }
    if (editForm.note_to_recorder !== (vault.note_to_recorder || "")) {
      body.note_to_recorder = editForm.note_to_recorder || null;
    }
    if (editForm.sealed_until !== (vault.sealed_until || "")) {
      body.sealed_until = editForm.sealed_until || null;
    }

    if (Object.keys(body).length === 0) {
      setEditingId(null);
      setEditSaving(false);
      return;
    }

    try {
      const res = await fetch(`/api/memory-requests/${vault.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        setEditError(data.error || "Failed to save");
        setEditSaving(false);
        return;
      }

      const updated = await res.json();
      setVaults((prev) =>
        prev.map((v) =>
          v.id === vault.id
            ? { ...v, ...updated, recording_count: v.recording_count }
            : v
        )
      );
      setEditingId(null);
    } catch {
      setEditError("Failed to save");
    } finally {
      setEditSaving(false);
    }
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
            <p className="mt-3 text-xs text-warm-gray">
              Unused credits never expire and stay in your balance until used.
            </p>
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
              const sealedDays = vault.sealed_until
                ? getDaysUntil(vault.sealed_until)
                : 0;
              const isSealed =
                vault.is_sealed && vault.sealed_until && sealedDays > 0;
              const isEditing = editingId === vault.id;

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
                            : vault.status === "pending"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {vault.status === "active"
                          ? "Active"
                          : vault.status === "pending"
                            ? "Pending"
                            : "Completed"}
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
                          {formatDaysUntil(sealedDays)}
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

                  {/* Inline edit form */}
                  {isEditing && (
                    <div className="mt-4 rounded-lg border border-cream-dark bg-cream/50 p-4">
                      <div className="space-y-3">
                        <div>
                          <label className="mb-1 block text-xs font-medium text-navy">
                            Title
                          </label>
                          <input
                            type="text"
                            value={editForm.title}
                            onChange={(e) =>
                              setEditForm((f) => ({
                                ...f,
                                title: e.target.value,
                              }))
                            }
                            className="w-full rounded-lg border border-cream-dark bg-white px-3 py-2 text-sm text-navy outline-none focus:border-navy"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium text-navy">
                            Note to recorder
                          </label>
                          <textarea
                            value={editForm.note_to_recorder}
                            onChange={(e) =>
                              setEditForm((f) => ({
                                ...f,
                                note_to_recorder: e.target.value,
                              }))
                            }
                            rows={2}
                            className="w-full rounded-lg border border-cream-dark bg-white px-3 py-2 text-sm text-navy outline-none focus:border-navy"
                            placeholder="Optional message shown to people recording"
                          />
                        </div>
                        {vault.recording_count === 0 && (
                          <div>
                            <label className="mb-1 block text-xs font-medium text-navy">
                              Sealed until
                            </label>
                            <input
                              type="date"
                              value={editForm.sealed_until}
                              onChange={(e) =>
                                setEditForm((f) => ({
                                  ...f,
                                  sealed_until: e.target.value,
                                }))
                              }
                              min={
                                new Date(Date.now() + 86400000)
                                  .toISOString()
                                  .split("T")[0]
                              }
                              className="w-full rounded-lg border border-cream-dark bg-white px-3 py-2 text-sm text-navy outline-none focus:border-navy"
                            />
                            <p className="mt-1 text-xs text-warm-gray">
                              Leave empty to unseal. Can only be changed before
                              any recordings are made.
                            </p>
                          </div>
                        )}
                        {editError && (
                          <p className="text-sm text-red-600">{editError}</p>
                        )}
                        <div className="flex gap-2">
                          <button
                            onClick={() => saveEdit(vault)}
                            disabled={editSaving}
                            className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-cream transition hover:bg-navy-light disabled:opacity-50"
                          >
                            {editSaving ? "Saving..." : "Save"}
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="rounded-lg border border-cream-dark px-4 py-2 text-sm font-medium text-warm-gray transition hover:bg-cream-dark"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="mt-4 flex items-center gap-3 border-t border-cream-dark pt-4">
                    <button
                      onClick={() => copyLink(vault.unique_code, vault.id)}
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium transition ${
                        copiedId === vault.id
                          ? "border-forest bg-forest/10 text-forest"
                          : "border-cream-dark text-navy hover:bg-cream-dark"
                      }`}
                    >
                      {copiedId === vault.id ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className="h-4 w-4"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
                            clipRule="evenodd"
                          />
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className="h-4 w-4"
                        >
                          <path d="M13 4.5a2.5 2.5 0 1 1 .702 1.737L6.97 9.604a2.518 2.518 0 0 1 0 .799l6.733 3.365a2.5 2.5 0 1 1-.671 1.341l-6.733-3.366a2.5 2.5 0 1 1 0-3.48l6.733-3.366A2.52 2.52 0 0 1 13 4.5Z" />
                        </svg>
                      )}
                      {copiedId === vault.id ? "Copied!" : "Copy Link"}
                    </button>
                    {!isEditing && (
                      <button
                        onClick={() => startEditing(vault)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-cream-dark px-4 py-2 text-sm font-medium text-navy transition hover:bg-cream-dark"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className="h-4 w-4"
                        >
                          <path d="m5.433 13.917 1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z" />
                          <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0 0 10 3H4.75A2.75 2.75 0 0 0 2 5.75v9.5A2.75 2.75 0 0 0 4.75 18h9.5A2.75 2.75 0 0 0 17 15.25V10a.75.75 0 0 0-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5Z" />
                        </svg>
                        Edit
                      </button>
                    )}
                    <Link
                      href={`/vault/wedding-kit?code=${vault.unique_code}`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-gold/50 bg-gold/10 px-4 py-2 text-sm font-medium text-navy transition hover:bg-gold/20"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                        <path fillRule="evenodd" d="M4.5 2A1.5 1.5 0 0 0 3 3.5v13A1.5 1.5 0 0 0 4.5 18h11a1.5 1.5 0 0 0 1.5-1.5V7.621a1.5 1.5 0 0 0-.44-1.06l-4.12-4.122A1.5 1.5 0 0 0 11.378 2H4.5Zm4.75 6.75a.75.75 0 0 0-1.5 0v2.546l-.943-1.048a.75.75 0 1 0-1.114 1.004l2.25 2.5a.75.75 0 0 0 1.114 0l2.25-2.5a.75.75 0 1 0-1.114-1.004l-.943 1.048V8.75Z" clipRule="evenodd" />
                      </svg>
                      Get Wedding Kit
                    </Link>
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

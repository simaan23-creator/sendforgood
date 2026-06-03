"use client";

// Admin caller list — manual phone backup for vault unlock notifications.
// See src/app/api/admin/call-list/route.ts for the bucket semantics.
//
// Auth: piggybacks on /admin's session-stored password (sfg_admin_pwd).
// If no password is stored, prompt for it; matches the gate pattern used by
// the main admin dashboard.

import { useCallback, useEffect, useState } from "react";

interface Row {
  vault_id: string;
  title: string;
  owner_email: string | null;
  owner_phone: string | null;
  sealed_until: string | null;
  delivery_date: string | null;
  last_viewed_at: string | null;
  recording_count: number;
  bucket: "opening_today" | "no_view_7d" | "no_view_30d";
}

interface Payload {
  opening_today: Row[];
  no_view_7d: Row[];
  no_view_30d: Row[];
  generated_at: string;
}

const SESSION_PWD_KEY = "sfg_admin_pwd";

function getAdminPassword(): string {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem(SESSION_PWD_KEY) || "";
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso.length === 10 ? iso + "T00:00:00" : iso).toLocaleDateString(
    "en-US",
    { month: "short", day: "numeric", year: "numeric" }
  );
}

function bucketLabel(bucket: Row["bucket"]): string {
  if (bucket === "opening_today") return "Opening today";
  if (bucket === "no_view_7d") return "7-day no-view";
  return "30-day no-view";
}

export default function AdminCallListPage() {
  const [pwd, setPwd] = useState<string>("");
  const [authed, setAuthed] = useState(false);
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notesByVault, setNotesByVault] = useState<Record<string, string>>({});
  const [pendingMark, setPendingMark] = useState<string | null>(null);

  useEffect(() => {
    const stored = getAdminPassword();
    if (stored) {
      setPwd(stored);
      setAuthed(true);
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/call-list", {
        headers: { "x-admin-password": getAdminPassword() },
      });
      if (res.status === 403) {
        sessionStorage.removeItem(SESSION_PWD_KEY);
        setAuthed(false);
        setError("Wrong admin password");
        return;
      }
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `HTTP ${res.status}`);
      }
      setData(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authed) void load();
  }, [authed, load]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    sessionStorage.setItem(SESSION_PWD_KEY, pwd);
    setAuthed(true);
  }

  async function markCalled(row: Row) {
    const key = `${row.vault_id}:${row.bucket}`;
    setPendingMark(key);
    try {
      const res = await fetch("/api/admin/call-list/log", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": getAdminPassword(),
        },
        body: JSON.stringify({
          vault_id: row.vault_id,
          bucket: row.bucket,
          notes: notesByVault[key] || null,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `HTTP ${res.status}`);
      }
      // Drop the row from view without a full refetch.
      setData((prev) => {
        if (!prev) return prev;
        const filter = (list: Row[]) =>
          list.filter(
            (r) => !(r.vault_id === row.vault_id && r.bucket === row.bucket)
          );
        return {
          ...prev,
          opening_today: filter(prev.opening_today),
          no_view_7d: filter(prev.no_view_7d),
          no_view_30d: filter(prev.no_view_30d),
        };
      });
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to log call");
    } finally {
      setPendingMark(null);
    }
  }

  if (!authed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-sm rounded-2xl border border-cream-dark bg-white p-8 shadow-md"
        >
          <h1 className="mb-2 text-xl font-bold text-navy">Admin caller list</h1>
          <p className="mb-4 text-sm text-warm-gray">
            Enter admin password to continue.
          </p>
          <input
            type="password"
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
            className="mb-3 w-full rounded-lg border border-cream-dark bg-cream px-3 py-2"
            autoFocus
          />
          <button
            type="submit"
            className="w-full rounded-lg bg-navy px-4 py-2 font-semibold text-white"
          >
            Sign in
          </button>
          {error && (
            <p className="mt-3 text-sm text-red-600">{error}</p>
          )}
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      <header className="border-b border-cream-dark bg-white px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <h1 className="text-xl font-bold text-navy">Vault caller list</h1>
          <button
            onClick={load}
            className="rounded-lg border border-cream-dark px-3 py-1.5 text-sm hover:bg-cream"
            disabled={loading}
          >
            {loading ? "Loading…" : "Refresh"}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 p-6">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {data && (
          <>
            <Section
              title="Opening today"
              hint="Vault email was sent today. Call/text right after the cron runs (~9am ET)."
              rows={data.opening_today}
              notesByVault={notesByVault}
              setNotesByVault={setNotesByVault}
              pendingMark={pendingMark}
              onMark={markCalled}
            />
            <Section
              title="7-day no-view nudge"
              hint="Vault unlocked ~1 week ago and owner has not logged in to see it."
              rows={data.no_view_7d}
              notesByVault={notesByVault}
              setNotesByVault={setNotesByVault}
              pendingMark={pendingMark}
              onMark={markCalled}
            />
            <Section
              title="30-day last-chance nudge"
              hint="Owner has not viewed yet after a month. Final manual nudge."
              rows={data.no_view_30d}
              notesByVault={notesByVault}
              setNotesByVault={setNotesByVault}
              pendingMark={pendingMark}
              onMark={markCalled}
            />
          </>
        )}

        {data && (
          <p className="text-xs text-warm-gray-light">
            Generated {new Date(data.generated_at).toLocaleString()}
          </p>
        )}
      </main>
    </div>
  );
}

function Section({
  title,
  hint,
  rows,
  notesByVault,
  setNotesByVault,
  pendingMark,
  onMark,
}: {
  title: string;
  hint: string;
  rows: Row[];
  notesByVault: Record<string, string>;
  setNotesByVault: (fn: (prev: Record<string, string>) => Record<string, string>) => void;
  pendingMark: string | null;
  onMark: (row: Row) => void;
}) {
  return (
    <section className="rounded-2xl border border-cream-dark bg-white p-6 shadow-sm">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-navy">
          {title}{" "}
          <span className="text-sm font-normal text-warm-gray">
            ({rows.length})
          </span>
        </h2>
        <p className="mt-1 text-sm text-warm-gray">{hint}</p>
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-warm-gray-light">Nothing to call right now.</p>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => {
            const key = `${row.vault_id}:${row.bucket}`;
            const isPending = pendingMark === key;
            return (
              <div
                key={key}
                className="rounded-xl border border-cream-dark bg-cream/40 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-navy">{row.title}</p>
                    <p className="mt-0.5 text-xs text-warm-gray">
                      Sealed until {formatDate(row.sealed_until)} ·{" "}
                      Delivery {formatDate(row.delivery_date)} ·{" "}
                      {row.recording_count} recording
                      {row.recording_count === 1 ? "" : "s"}
                      {row.last_viewed_at && (
                        <>
                          {" · "}Last viewed {formatDate(row.last_viewed_at)}
                        </>
                      )}
                    </p>
                  </div>
                  <div className="text-right text-sm">
                    <div className="text-navy">
                      {row.owner_email || (
                        <span className="text-warm-gray-light">no email</span>
                      )}
                    </div>
                    <div className="text-navy">
                      {row.owner_phone ? (
                        <a
                          href={`tel:${row.owner_phone}`}
                          className="underline hover:no-underline"
                        >
                          {row.owner_phone}
                        </a>
                      ) : (
                        <span className="text-warm-gray-light">no phone</span>
                      )}
                    </div>
                    {row.owner_phone && (
                      <a
                        href={`sms:${row.owner_phone}`}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        text instead
                      </a>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    placeholder="Optional notes (left voicemail, no answer, etc.)"
                    value={notesByVault[key] || ""}
                    onChange={(e) =>
                      setNotesByVault((prev) => ({
                        ...prev,
                        [key]: e.target.value,
                      }))
                    }
                    className="min-w-[200px] flex-1 rounded-lg border border-cream-dark bg-white px-3 py-1.5 text-sm"
                  />
                  <button
                    onClick={() => onMark(row)}
                    disabled={isPending}
                    className="rounded-lg bg-navy px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    {isPending ? "Logging…" : `Mark called (${bucketLabel(row.bucket)})`}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

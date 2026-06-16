"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * /admin/etsy — manual Etsy order fulfillment.
 *
 * Flow per Etsy order:
 *   1. Etsy emails: "you have a new order #1234567890"
 *   2. Admin opens this page, pastes "1234567890", clicks Mint code
 *   3. Page returns a claim URL — copy it
 *   4. Paste the URL into an Etsy message to the buyer
 *
 * Password handling mirrors /admin/page.tsx: sessionStorage stores the
 * password and the API password gate is on every request.
 */

const SESSION_PWD_KEY = "sfg_admin_pwd";

type MintResult = {
  claimUrl: string;
  code: string;
  duplicate: boolean;
};

type RecentCode = {
  external_order_id: string | null;
  claim_code: string;
  status: string;
  claimed_at: string | null;
  created_at: string;
};

export default function EtsyAdminPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [pwError, setPwError] = useState(false);
  const [pwSubmitting, setPwSubmitting] = useState(false);

  const [etsyOrderId, setEtsyOrderId] = useState("");
  const [minting, setMinting] = useState(false);
  const [mintError, setMintError] = useState<string | null>(null);
  const [result, setResult] = useState<MintResult | null>(null);
  const [copied, setCopied] = useState(false);

  const [recent, setRecent] = useState<RecentCode[]>([]);
  const [recentLoading, setRecentLoading] = useState(false);

  const loadRecent = useCallback(async () => {
    const pwd = sessionStorage.getItem(SESSION_PWD_KEY) || "";
    if (!pwd) return;
    setRecentLoading(true);
    try {
      const res = await fetch("/api/admin/etsy/recent", {
        headers: { "x-admin-password": pwd },
      });
      if (res.ok) {
        const data = await res.json();
        setRecent(data.codes || []);
      }
    } finally {
      setRecentLoading(false);
    }
  }, []);

  useEffect(() => {
    const pwd = sessionStorage.getItem(SESSION_PWD_KEY);
    if (pwd) {
      setAuthed(true);
      loadRecent();
    }
  }, [loadRecent]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setPwSubmitting(true);
    setPwError(false);
    try {
      const res = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        sessionStorage.setItem(SESSION_PWD_KEY, password);
        sessionStorage.setItem("sfg_admin_auth", "true");
        setAuthed(true);
        loadRecent();
      } else {
        setPwError(true);
      }
    } catch {
      setPwError(true);
    } finally {
      setPwSubmitting(false);
    }
  }

  async function handleMint(e: React.FormEvent) {
    e.preventDefault();
    if (minting) return;
    setMinting(true);
    setMintError(null);
    setResult(null);
    setCopied(false);
    try {
      const pwd = sessionStorage.getItem(SESSION_PWD_KEY) || "";
      const res = await fetch("/api/admin/etsy/mint-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password: pwd,
          etsyOrderId: etsyOrderId.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMintError(data.error || "Mint failed");
      } else {
        setResult(data as MintResult);
        loadRecent();
      }
    } catch {
      setMintError("Network error");
    } finally {
      setMinting(false);
    }
  }

  function handleReset() {
    setResult(null);
    setEtsyOrderId("");
    setMintError(null);
    setCopied(false);
  }

  async function handleCopy() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.claimUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API can fail in some contexts; user can still copy manually
    }
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <form
          onSubmit={handleLogin}
          className="bg-white rounded-lg shadow-lg p-8 w-full max-w-sm"
        >
          <h1 className="text-xl font-bold text-gray-900 mb-1">Etsy admin</h1>
          <p className="text-sm text-gray-500 mb-6">Enter admin password</p>
          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setPwError(false);
            }}
            placeholder="Password"
            autoFocus
            className={`w-full rounded-md border px-3 py-2 text-sm outline-none ${
              pwError ? "border-red-400" : "border-gray-300"
            }`}
          />
          {pwError && (
            <p className="mt-2 text-xs text-red-600">Incorrect password</p>
          )}
          <button
            type="submit"
            disabled={pwSubmitting || !password}
            className="mt-4 w-full rounded-md bg-gray-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {pwSubmitting ? "Verifying..." : "Continue"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold text-gray-900">Etsy fulfillment</h1>
        <p className="mt-1 text-sm text-gray-600">
          Mint a one-time Anniversary Capsule claim code for an Etsy order, then
          paste the link into the buyer&apos;s Etsy message.
        </p>

        <div className="mt-6 rounded-lg border bg-white p-6 shadow-sm">
          {!result && (
            <form onSubmit={handleMint} className="space-y-4">
              <label className="block">
                <span className="block text-sm font-medium text-gray-700">
                  Etsy order ID
                </span>
                <input
                  type="text"
                  value={etsyOrderId}
                  onChange={(e) => setEtsyOrderId(e.target.value)}
                  placeholder="e.g. 1234567890"
                  autoFocus
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900"
                />
                <span className="mt-1 block text-xs text-gray-500">
                  Letters, digits, _ or -. Max 64 chars. Pasting the same ID
                  twice returns the original code (no duplicate mint).
                </span>
              </label>
              {mintError && (
                <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {mintError}
                </p>
              )}
              <button
                type="submit"
                disabled={minting || !etsyOrderId.trim()}
                className="w-full rounded-md bg-gray-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {minting ? "Minting..." : "Mint code"}
              </button>
            </form>
          )}

          {result && (
            <div className="space-y-4">
              {result.duplicate && (
                <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  This Etsy order was already minted. Returning the existing code.
                </p>
              )}
              <label className="block">
                <span className="block text-sm font-medium text-gray-700">
                  Claim URL (paste into Etsy message)
                </span>
                <input
                  readOnly
                  value={result.claimUrl}
                  className="mt-1 w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 font-mono text-sm"
                  onFocus={(e) => e.currentTarget.select()}
                />
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex-1 rounded-md bg-gray-900 px-3 py-2 text-sm font-semibold text-white"
                >
                  {copied ? "Copied!" : "Copy URL"}
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700"
                >
                  Mint another
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8">
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Recent mints</h2>
            <button
              onClick={loadRecent}
              className="text-xs text-gray-600 hover:underline"
              disabled={recentLoading}
            >
              {recentLoading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
          {recent.length === 0 ? (
            <p className="mt-3 text-sm text-gray-500">No codes minted yet.</p>
          ) : (
            <div className="mt-3 overflow-x-auto rounded-lg border bg-white">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
                  <tr>
                    <th className="px-3 py-2">Etsy order</th>
                    <th className="px-3 py-2">Code</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Minted</th>
                    <th className="px-3 py-2">Claimed</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((r) => (
                    <tr key={r.claim_code} className="border-t">
                      <td className="px-3 py-2 font-mono text-xs">
                        {r.external_order_id || "—"}
                      </td>
                      <td className="px-3 py-2 font-mono text-xs">
                        {r.claim_code}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={`inline-block rounded px-2 py-0.5 text-xs ${
                            r.status === "claimed"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-600">
                        {new Date(r.created_at).toLocaleString()}
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-600">
                        {r.claimed_at
                          ? new Date(r.claimed_at).toLocaleString()
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

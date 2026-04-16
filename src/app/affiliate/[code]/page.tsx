"use client";

import { useState, useEffect, useCallback, use } from "react";

interface AffiliateInfo {
  name: string;
  code: string;
  first_commission_rate: number;
  repeat_commission_rate: number;
}

interface Stats {
  total_referrals: number;
  total_earned: number;
  total_paid: number;
  pending_payout: number;
}

interface Referral {
  id: string;
  customer_email: string;
  amount_paid: number;
  commission_amount: number;
  referral_type: "first" | "repeat";
  paid: boolean;
  paid_at: string | null;
  created_at: string;
}

function formatCurrency(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function AffiliatePortalPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const [affiliate, setAffiliate] = useState<AffiliateInfo | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [lastUpdated, setLastUpdated] = useState("");

  const fetchPortalData = useCallback(async (pw: string) => {
    setLoading(true);
    setError("");
    const res = await fetch(`/api/affiliate/${code}`, {
      headers: { "x-portal-password": pw },
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      if (res.status === 401) {
        setError("Incorrect password");
        sessionStorage.removeItem(`sfg_affiliate_${code}`);
        setAuthenticated(false);
      } else {
        setError(data.error || "Something went wrong");
      }
      return false;
    }

    setAffiliate(data.affiliate);
    setStats(data.stats);
    setReferrals(data.referrals);
    setLastUpdated(data.last_updated);
    setAuthenticated(true);
    sessionStorage.setItem(`sfg_affiliate_${code}`, pw);
    return true;
  }, [code]);

  // Check sessionStorage on mount
  useEffect(() => {
    const saved = sessionStorage.getItem(`sfg_affiliate_${code}`);
    if (saved) {
      fetchPortalData(saved);
    }
  }, [code, fetchPortalData]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!password.trim()) return;
    await fetchPortalData(password.trim());
  }

  function copyReferralLink() {
    navigator.clipboard.writeText(`https://sendforgood.com?ref=${code}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // Login screen
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[#FDF8F0] flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-[#1B2A4A] mb-1">Affiliate Portal</h1>
              <p className="text-sm text-gray-500">Enter your affiliate password</p>
            </div>
            <form onSubmit={handleLogin} className="space-y-4">
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                placeholder="Password"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#C8A962]/40 focus:border-[#C8A962]"
                autoFocus
              />
              {error && <p className="text-red-500 text-sm text-center">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-[#1B2A4A] text-white py-3 text-sm font-semibold hover:bg-[#1B2A4A]/90 transition disabled:opacity-50"
              >
                {loading ? "Verifying..." : "Access My Portal"}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  if (!affiliate || !stats) {
    return (
      <div className="min-h-screen bg-[#FDF8F0] flex items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  // Portal
  return (
    <div className="min-h-screen bg-[#FDF8F0]">
      <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1B2A4A] mb-2">
            Welcome, {affiliate.name}!
          </h1>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Your referral link:</span>
              <code className="bg-white border border-gray-200 rounded-md px-3 py-1 text-sm font-mono text-[#1B2A4A]">
                sendforgood.com?ref={code}
              </code>
              <button
                onClick={copyReferralLink}
                className="rounded-md bg-[#C8A962] text-white px-3 py-1 text-xs font-semibold hover:bg-[#b89a55] transition"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <span className="text-xs text-gray-400">
              Last updated: {formatDate(lastUpdated)}
            </span>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Total Referrals</p>
            <p className="text-2xl font-bold text-[#1B2A4A]">{stats.total_referrals}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Total Earned</p>
            <p className="text-2xl font-bold text-[#2D5016]">{formatCurrency(stats.total_earned)}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Total Paid</p>
            <p className="text-2xl font-bold text-[#1B2A4A]">{formatCurrency(stats.total_paid)}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Pending Payout</p>
            <p className={`text-2xl font-bold ${stats.pending_payout > 0 ? "text-[#C8A962]" : "text-gray-400"}`}>
              {formatCurrency(stats.pending_payout)}
            </p>
          </div>
        </div>

        {/* Referrals Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-[#1B2A4A]">Recent Referrals</h2>
          </div>
          {referrals.length === 0 ? (
            <div className="text-center py-12 text-gray-400">No referrals yet. Share your link to get started!</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3">Customer</th>
                    <th className="px-5 py-3">Order Amount</th>
                    <th className="px-5 py-3">Commission</th>
                    <th className="px-5 py-3">Type</th>
                    <th className="px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {referrals.map((r) => (
                    <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="px-5 py-3 whitespace-nowrap text-gray-600">
                        {formatDate(r.created_at)}
                      </td>
                      <td className="px-5 py-3 text-gray-500 font-mono text-xs">
                        {r.customer_email}
                      </td>
                      <td className="px-5 py-3 text-gray-900">
                        {formatCurrency(r.amount_paid)}
                      </td>
                      <td className="px-5 py-3 font-medium text-[#2D5016]">
                        {formatCurrency(r.commission_amount)}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          r.referral_type === "first"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-purple-100 text-purple-700"
                        }`}>
                          {r.referral_type === "first" ? "First" : "Repeat"}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        {r.paid ? (
                          <span className="inline-block rounded-full bg-green-100 text-green-700 px-2.5 py-0.5 text-xs font-medium">
                            Paid
                          </span>
                        ) : (
                          <span className="inline-block rounded-full bg-yellow-100 text-yellow-700 px-2.5 py-0.5 text-xs font-medium">
                            Pending
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Payout Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-8">
          <h3 className="text-sm font-semibold text-[#1B2A4A] mb-2">Payouts</h3>
          <p className="text-sm text-gray-600 mb-1">
            To request a payout, contact: <a href="mailto:support@sendforgood.com" className="text-[#C8A962] font-medium hover:underline">support@sendforgood.com</a>
          </p>
          <p className="text-sm text-gray-500">Payouts are processed monthly.</p>
        </div>

        {/* Footer Note */}
        <div className="text-center text-xs text-gray-400 space-y-1">
          <p>
            Commission rates: {affiliate.first_commission_rate}% on first purchases, {affiliate.repeat_commission_rate}% on repeat purchases.
          </p>
          <p>Credits never expire — commissions accumulate until paid.</p>
        </div>
      </div>
    </div>
  );
}

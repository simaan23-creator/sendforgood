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
  const [copiedCampaign, setCopiedCampaign] = useState<string | null>(null);
  const [copiedPanel, setCopiedPanel] = useState<string | null>(null);
  const [selectedQRCampaign, setSelectedQRCampaign] = useState("general");
  const [expandedPanels, setExpandedPanels] = useState<Set<string>>(new Set());

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

  const campaignLinks = [
    { key: "general", label: "General", path: "" },
    { key: "weddings", label: "Weddings", path: "/wedding" },
    { key: "gifts", label: "Gifts", path: "/gifts/buy" },
    { key: "messages", label: "Messages", path: "/messages/buy" },
    { key: "business", label: "Business", path: "/business" },
  ];

  function getCampaignUrl(path: string) {
    return `https://sendforgood.com${path}?ref=${code}`;
  }

  function copyReferralLink() {
    navigator.clipboard.writeText(`https://sendforgood.com?ref=${code}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function copyCampaignLink(key: string, url: string) {
    navigator.clipboard.writeText(url);
    setCopiedCampaign(key);
    setTimeout(() => setCopiedCampaign(null), 2000);
  }

  function copyPanelContent(key: string, content: string) {
    navigator.clipboard.writeText(content);
    setCopiedPanel(key);
    setTimeout(() => setCopiedPanel(null), 2000);
  }

  function togglePanel(key: string) {
    setExpandedPanels((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
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

        {/* Campaign Links */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-8">
          <h3 className="text-lg font-semibold text-[#1B2A4A] mb-1">Campaign Links</h3>
          <p className="text-sm text-gray-500 mb-4">Use these links to track which marketing channel is working best for you.</p>
          <div className="space-y-3">
            {campaignLinks.map((c) => {
              const url = getCampaignUrl(c.path);
              const display = `sendforgood.com${c.path}?ref=${code}`;
              return (
                <div key={c.key} className="flex items-center gap-3">
                  <span className="text-sm font-medium text-[#1B2A4A] w-24 shrink-0">{c.label}</span>
                  <input
                    type="text"
                    readOnly
                    value={display}
                    className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-mono text-gray-600 outline-none"
                  />
                  <button
                    onClick={() => copyCampaignLink(c.key, url)}
                    className={`rounded-lg px-4 py-2 text-xs font-semibold transition shrink-0 ${
                      copiedCampaign === c.key
                        ? "bg-green-500 text-white"
                        : "bg-[#C8A962] text-white hover:bg-[#b89a55]"
                    }`}
                  >
                    {copiedCampaign === c.key ? "Copied!" : "Copy"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* QR Code Generator */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-8">
          <h3 className="text-lg font-semibold text-[#1B2A4A] mb-1">QR Code Generator</h3>
          <p className="text-sm text-gray-500 mb-4">Download a QR code for your business cards, convention tables, or print materials.</p>
          <div className="flex flex-col sm:flex-row items-start gap-6">
            <div className="w-full sm:w-auto">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Campaign</label>
              <select
                value={selectedQRCampaign}
                onChange={(e) => setSelectedQRCampaign(e.target.value)}
                className="w-full sm:w-56 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#C8A962]/40 focus:border-[#C8A962]"
              >
                {campaignLinks.map((c) => (
                  <option key={c.key} value={c.key}>{c.label}</option>
                ))}
              </select>
              <a
                href={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(getCampaignUrl(campaignLinks.find((c) => c.key === selectedQRCampaign)?.path || ""))}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-block rounded-lg bg-[#1B2A4A] text-white px-5 py-2.5 text-sm font-semibold hover:bg-[#1B2A4A]/90 transition"
              >
                Download QR Code
              </a>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(getCampaignUrl(campaignLinks.find((c) => c.key === selectedQRCampaign)?.path || ""))}`}
                alt="QR Code"
                width={200}
                height={200}
                className="rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Marketing Materials */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-8">
          <h3 className="text-lg font-semibold text-[#1B2A4A] mb-1">Ready-to-Use Marketing Copy</h3>
          <p className="text-sm text-gray-500 mb-4">Copy and paste these into your emails, social posts, or conversations.</p>
          <div className="space-y-3">
            {[
              {
                key: "realestate",
                title: "Email to Past Clients",
                content: `Subject: A gift I thought you might love

Hi [Client Name],

I wanted to share something I recently discovered that I think is perfect for homeowners and families — SendForGood.

It is a service that lets you send gifts and meaningful messages to the people you love, automatically, every year. Birthdays, anniversaries, holidays — they handle everything.

What I love most: you set it up once and they take care of the rest. No more forgetting. No more last-minute scrambles.

I have been recommending it to my clients because it is the kind of thoughtful gesture that people remember.

Use my link to get started: ${getCampaignUrl("")}

Let me know if you have any questions!

[Your name]`,
              },
              {
                key: "social",
                title: "Social Media Post",
                content: `I just discovered something amazing — @SendForGood lets you set up gifts and personal messages for the people you love, delivered automatically every year. 🎁

Birthdays. Anniversaries. Your kids growing up. Even voice and video messages they will receive years from now.

It is the most meaningful thing I have seen in a long time. I am already using it for my clients.

Check it out: ${getCampaignUrl("")}

#SendForGood #MeaningfulGifts #LegacyGiving`,
              },
              {
                key: "wedding",
                title: "Wedding Pitch",
                content: `Did you know you can collect video messages from all your wedding guests and seal them until your 10th anniversary?

SendForGood lets you share a link at your reception. Every guest records a video. You seal it for a decade. On your anniversary, you open it together.

It is one of the most unique wedding gifts I have ever seen.

Start at: ${getCampaignUrl("/wedding")}`,
              },
              {
                key: "conversation",
                title: "Talking Points",
                content: `PROBLEM: Most people forget birthdays, anniversaries, or just do not have time to shop for meaningful gifts.

SOLUTION: SendForGood lets you set up gifts once and they deliver every year automatically.

KEY POINTS:
• Gifts from $20/year, messages from $1/year
• Set up once — they handle everything
• Assign to multiple people at once
• Never miss a birthday again
• Letters and voice messages for people you love
• Memory Vault for weddings and special events

CLOSE: Would you like me to send you the link? Takes 5 minutes to set up.

Link: ${getCampaignUrl("")}`,
              },
            ].map((panel) => (
              <div key={panel.key} className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => togglePanel(panel.key)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition"
                >
                  <span className="text-sm font-semibold text-[#1B2A4A]">{panel.title}</span>
                  <svg
                    className={`w-4 h-4 text-gray-400 transition-transform ${expandedPanels.has(panel.key) ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {expandedPanels.has(panel.key) && (
                  <div className="px-4 pb-4 border-t border-gray-100">
                    <pre className="mt-3 whitespace-pre-wrap text-sm text-gray-700 font-sans leading-relaxed bg-gray-50 rounded-lg p-4">
                      {panel.content}
                    </pre>
                    <button
                      onClick={() => copyPanelContent(panel.key, panel.content)}
                      className={`mt-3 rounded-lg px-4 py-2 text-xs font-semibold transition ${
                        copiedPanel === panel.key
                          ? "bg-green-500 text-white"
                          : "bg-[#C8A962] text-white hover:bg-[#b89a55]"
                      }`}
                    >
                      {copiedPanel === panel.key ? "Copied!" : "Copy to Clipboard"}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Resources */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-8">
          <h3 className="text-lg font-semibold text-[#1B2A4A] mb-4">Resources</h3>
          <div className="space-y-3">
            <a
              href="/about"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-[#C8A962] hover:bg-[#C8A962]/5 transition group"
            >
              <div>
                <p className="text-sm font-semibold text-[#1B2A4A] group-hover:text-[#C8A962] transition">View the About Page</p>
                <p className="text-xs text-gray-500">Share our story with potential customers</p>
              </div>
              <svg className="w-4 h-4 text-gray-400 group-hover:text-[#C8A962] transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
            <a
              href="/pricing"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-[#C8A962] hover:bg-[#C8A962]/5 transition group"
            >
              <div>
                <p className="text-sm font-semibold text-[#1B2A4A] group-hover:text-[#C8A962] transition">View Pricing</p>
                <p className="text-xs text-gray-500">Know what your referrals will see</p>
              </div>
              <svg className="w-4 h-4 text-gray-400 group-hover:text-[#C8A962] transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
            <a
              href="/wedding"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-[#C8A962] hover:bg-[#C8A962]/5 transition group"
            >
              <div>
                <p className="text-sm font-semibold text-[#1B2A4A] group-hover:text-[#C8A962] transition">Wedding Page</p>
                <p className="text-xs text-gray-500">Perfect for wedding vendors and planners</p>
              </div>
              <svg className="w-4 h-4 text-gray-400 group-hover:text-[#C8A962] transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
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

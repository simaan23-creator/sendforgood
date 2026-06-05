"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback, use } from "react";
import { BrandedQR } from "@/components/BrandedQR";

interface AffiliateInfo {
  name: string;
  code: string;
  business_name?: string | null;
  aliases?: string[];
  first_commission_rate: number;
  repeat_commission_rate: number;
  gift_credits?: number;
}

interface GiftRow {
  id: string;
  recipient_email: string;
  sent_at: string;
  expires_at: string | null;
  claimed_at: string | null;
  status: "sent" | "claimed" | "activated" | "converted" | "expired";
}

interface GiftCounts {
  sent: number;
  claimed: number;
  activated: number;
  converted: number;
  expired: number;
}

interface TierInfo {
  tier: "repeat_t1" | "repeat_t2" | "repeat_t3";
  rate: number;
  label: string;
  nextRate: number | null;
  nextLabel: string | null;
  paidNeededForNext: number | null;
}

interface Stats {
  total_referrals: number;
  total_earned: number;
  total_paid: number;
  pending_payout: number;
  paid_referrals?: number;
  tier?: TierInfo;
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
  const router = useRouter();
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
  // D3: custom URL panel state.
  const [newCodeInput, setNewCodeInput] = useState("");
  const [renaming, setRenaming] = useState(false);
  const [renameError, setRenameError] = useState("");
  const [renameSuccess, setRenameSuccess] = useState("");

  const [affiliate, setAffiliate] = useState<AffiliateInfo | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [lastUpdated, setLastUpdated] = useState("");
  // Gift kit (D10) state.
  const [gifts, setGifts] = useState<GiftRow[]>([]);
  const [giftCounts, setGiftCounts] = useState<GiftCounts>({
    sent: 0,
    claimed: 0,
    activated: 0,
    converted: 0,
    expired: 0,
  });
  const [giftEmail, setGiftEmail] = useState("");
  const [giftMessage, setGiftMessage] = useState("");
  const [giftSending, setGiftSending] = useState(false);
  const [giftError, setGiftError] = useState("");
  const [giftSuccess, setGiftSuccess] = useState("");

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
    setGifts(Array.isArray(data.gifts) ? data.gifts : []);
    if (data.gift_counts) setGiftCounts(data.gift_counts);
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
    { key: "vault", label: "Wedding Vault", path: "/vault/buy" },
    { key: "anniversary", label: "Anniversary Capsule", path: "/vault/buy?bundle=anniversary" },
    { key: "messages", label: "Messages", path: "/messages/buy" },
  ];

  // Combined ref + bundle URL for the Anniversary Capsule pitch. The ref
  // cookie is set by middleware on ?ref=CODE; the bundle query string is
  // read by /vault/buy. Both have to be on the same URL since each fires
  // its own side effect.
  const anniversaryShareUrl = `https://sealtheday.com/vault/buy?ref=${code}&bundle=anniversary`;
  const anniversaryPitch = `Want to keep one perfect surprise from your wedding sealed for your first anniversary? I send couples this little capsule — a private vault for 6 video messages and 15 photos from the people closest to you, sealed until your anniversary. It's $29.95 and it's been my favorite recent recommendation. Here's the link: ${anniversaryShareUrl}`;

  function getCampaignUrl(path: string) {
    return `https://sealtheday.com${path}?ref=${code}`;
  }

  function copyReferralLink() {
    navigator.clipboard.writeText(`https://sealtheday.com?ref=${code}`);
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

  // D3: rename the affiliate's referral code. Pushes the previous code
  // into aliases server-side so old printed materials keep working.
  async function handleRename() {
    if (renaming) return;
    const requested = newCodeInput.trim();
    if (!requested) {
      setRenameError("Pick a new code first.");
      return;
    }
    setRenaming(true);
    setRenameError("");
    setRenameSuccess("");
    const pw = sessionStorage.getItem(`sfg_affiliate_${code}`) || "";
    try {
      const res = await fetch(`/api/affiliate/${code}/rename`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-portal-password": pw },
        body: JSON.stringify({ new_code: requested }),
      });
      const data = await res.json();
      if (!res.ok) {
        setRenameError(data.error || "Rename failed");
        setRenaming(false);
        return;
      }
      // Migrate sessionStorage password to the new code key so the next
      // page load still authenticates without re-prompting.
      if (pw && data.code !== code) {
        sessionStorage.setItem(`sfg_affiliate_${data.code}`, pw);
        sessionStorage.removeItem(`sfg_affiliate_${code}`);
      }
      setRenameSuccess(
        data.unchanged
          ? "That's already your code."
          : `Your code is now "${data.code}". Old link "${data.previous_code}" still works.`
      );
      setNewCodeInput("");
      // If the code changed, hop to the new URL so the param matches state.
      if (!data.unchanged && data.code !== code) {
        router.replace(`/affiliate/${data.code}`);
      }
    } catch {
      setRenameError("Network error. Try again.");
    }
    setRenaming(false);
  }

  // D10: send a free Anniversary Capsule gift to a real client. The
  // portal password (already in sessionStorage from login) authenticates
  // the request server-side, so we don't re-prompt here.
  async function handleSendGift(e: React.FormEvent) {
    e.preventDefault();
    if (giftSending) return;
    setGiftError("");
    setGiftSuccess("");
    const email = giftEmail.trim();
    if (!email) {
      setGiftError("Recipient email is required.");
      return;
    }
    setGiftSending(true);
    const pw = sessionStorage.getItem(`sfg_affiliate_${code}`) || "";
    try {
      const res = await fetch(`/api/affiliate/${code}/send-gift`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          portal_password: pw,
          recipient_email: email,
          personal_message: giftMessage.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setGiftError(data.error || "Could not send gift.");
        setGiftSending(false);
        return;
      }
      setGiftSuccess(`Gift sent to ${email}. They have 90 days to claim it.`);
      setGiftEmail("");
      setGiftMessage("");
      await fetchPortalData(pw);
    } catch {
      setGiftError("Network error. Try again.");
    }
    setGiftSending(false);
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
                sealtheday.com?ref={code}
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

        {/* D7: Tier progress */}
        {stats.tier && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-8">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-[#1B2A4A]">Repeat Commission Tier</h3>
                <p className="mt-1 text-2xl font-bold text-[#2D5016]">{stats.tier.label}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Paid referrals</p>
                <p className="text-2xl font-bold text-[#1B2A4A]">{stats.paid_referrals || 0}</p>
              </div>
            </div>
            {stats.tier.paidNeededForNext != null && stats.tier.nextLabel ? (
              <p className="text-sm text-gray-600">
                <strong>{stats.tier.paidNeededForNext}</strong> more paid referral{stats.tier.paidNeededForNext === 1 ? "" : "s"} to reach <strong>{stats.tier.nextLabel}</strong>.
              </p>
            ) : (
              <p className="text-sm text-[#2D5016] font-medium">
                You&apos;re at the top tier. Every repeat purchase earns 15%.
              </p>
            )}
            <p className="mt-3 text-xs text-gray-500">
              First-purchase commissions stay at {affiliate.first_commission_rate}% across all tiers.
            </p>
          </div>
        )}

        {/* Payout Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-8">
          <h3 className="text-sm font-semibold text-[#1B2A4A] mb-2">Payouts</h3>
          <p className="text-sm text-gray-600 mb-1">
            To request a payout, contact: <a href="mailto:support@sealtheday.com" className="text-[#C8A962] font-medium hover:underline">support@sealtheday.com</a>
          </p>
          <p className="text-sm text-gray-500">Payouts are processed monthly.</p>
        </div>

        {/* Pitch the Anniversary Capsule */}
        <div className="bg-white rounded-xl shadow-sm border-2 border-[#C8A962] p-5 mb-8">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#C8A962]">
                New &middot; Concrete product to pitch
              </p>
              <h3 className="text-lg font-semibold text-[#1B2A4A] mt-1">
                Pitch the Anniversary Capsule
              </h3>
            </div>
            <span className="text-2xl font-bold text-[#1B2A4A] shrink-0">$29.95</span>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            A small, sweet sampler designed for the 1st anniversary
            reveal: 1 vault + 6 video slots + 15 photo slots, sealed for up
            to 1 year. Easy to recommend to every couple you photograph.
          </p>

          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Your share link
          </label>
          <div className="flex items-center gap-2 mb-4">
            <input
              type="text"
              readOnly
              value={anniversaryShareUrl}
              className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-mono text-gray-600 outline-none"
            />
            <button
              onClick={() => copyPanelContent("anniv-url", anniversaryShareUrl)}
              className={`rounded-lg px-4 py-2 text-xs font-semibold transition shrink-0 ${
                copiedPanel === "anniv-url"
                  ? "bg-green-500 text-white"
                  : "bg-[#C8A962] text-white hover:bg-[#b89a55]"
              }`}
            >
              {copiedPanel === "anniv-url" ? "Copied!" : "Copy link"}
            </button>
          </div>

          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Ready-to-send pitch (text or email)
          </label>
          <textarea
            readOnly
            value={anniversaryPitch}
            rows={4}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 outline-none"
          />
          <button
            onClick={() => copyPanelContent("anniv-pitch", anniversaryPitch)}
            className={`mt-2 rounded-lg px-4 py-2 text-xs font-semibold transition ${
              copiedPanel === "anniv-pitch"
                ? "bg-green-500 text-white"
                : "bg-[#1B2A4A] text-white hover:bg-[#1B2A4A]/90"
            }`}
          >
            {copiedPanel === "anniv-pitch" ? "Copied!" : "Copy pitch"}
          </button>
        </div>

        {/* D10: Send a free Anniversary Capsule */}
        {(affiliate.gift_credits ?? 0) > 0 && (
          <div className="bg-white rounded-xl shadow-sm border-2 border-[#C8A962] p-5 mb-8">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-[#C8A962]">
                  Gift kit &middot; One free Anniversary Capsule
                </p>
                <h3 className="text-lg font-semibold text-[#1B2A4A] mt-1">
                  Send a free vault to a client
                </h3>
              </div>
              <span className="text-2xl font-bold text-[#1B2A4A] shrink-0">$29.95 value</span>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              One-time gift &mdash; a full Anniversary Capsule (1 vault + 6 video + 15 photo slots) at no cost to your client. They get the complete experience, and any future credit purchase they make pays you commission for life.
            </p>

            <form onSubmit={handleSendGift} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Recipient email
                </label>
                <input
                  type="email"
                  required
                  value={giftEmail}
                  onChange={(e) => { setGiftEmail(e.target.value); setGiftError(""); setGiftSuccess(""); }}
                  placeholder="couple@example.com"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#C8A962]/40 focus:border-[#C8A962]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Personal message (optional)
                </label>
                <textarea
                  rows={3}
                  maxLength={500}
                  value={giftMessage}
                  onChange={(e) => { setGiftMessage(e.target.value); setGiftError(""); setGiftSuccess(""); }}
                  placeholder="Couldn't be more excited to shoot your wedding! Here's a little something extra..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#C8A962]/40 focus:border-[#C8A962]"
                />
                <p className="mt-1 text-xs text-gray-400 text-right">
                  {giftMessage.length}/500
                </p>
              </div>
              {giftError && <p className="text-sm text-red-600">{giftError}</p>}
              {giftSuccess && <p className="text-sm text-[#2D5016]">{giftSuccess}</p>}
              <button
                type="submit"
                disabled={giftSending}
                className="rounded-lg bg-[#1B2A4A] text-white px-5 py-2 text-sm font-semibold hover:bg-[#1B2A4A]/90 transition disabled:opacity-60"
              >
                {giftSending ? "Sending..." : "Send gift"}
              </button>
            </form>
            <p className="mt-3 text-xs text-gray-500">
              {affiliate.gift_credits} gift credit{affiliate.gift_credits === 1 ? "" : "s"} remaining.
            </p>
          </div>
        )}

        {/* D10: Your gifts (funnel view) */}
        {gifts.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-8">
            <h3 className="text-lg font-semibold text-[#1B2A4A] mb-1">Your gifts</h3>
            <p className="text-sm text-gray-500 mb-4">
              Track each gift from send to conversion.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4">
              <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Sent</p>
                <p className="text-xl font-bold text-[#1B2A4A]">{giftCounts.sent}</p>
              </div>
              <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Claimed</p>
                <p className="text-xl font-bold text-[#1B2A4A]">{giftCounts.claimed}</p>
              </div>
              <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Activated</p>
                <p className="text-xl font-bold text-[#1B2A4A]">{giftCounts.activated}</p>
              </div>
              <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Converted</p>
                <p className="text-xl font-bold text-[#2D5016]">{giftCounts.converted}</p>
              </div>
              <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Expired</p>
                <p className="text-xl font-bold text-gray-400">{giftCounts.expired}</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                    <th className="px-3 py-2">Sent</th>
                    <th className="px-3 py-2">Recipient</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Expires</th>
                  </tr>
                </thead>
                <tbody>
                  {gifts.map((g) => (
                    <tr key={g.id} className="border-b border-gray-50">
                      <td className="px-3 py-2 whitespace-nowrap text-gray-600">{formatDate(g.sent_at)}</td>
                      <td className="px-3 py-2 text-gray-500 font-mono text-xs">{g.recipient_email}</td>
                      <td className="px-3 py-2">
                        <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                          g.status === "converted"
                            ? "bg-green-100 text-green-700"
                            : g.status === "activated"
                              ? "bg-blue-100 text-blue-700"
                              : g.status === "claimed"
                                ? "bg-purple-100 text-purple-700"
                                : g.status === "expired"
                                  ? "bg-gray-100 text-gray-500"
                                  : "bg-yellow-100 text-yellow-700"
                        }`}>
                          {g.status}
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-gray-500">
                        {g.claimed_at ? "—" : g.expires_at ? formatDate(g.expires_at) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* D3: Custom referral URL */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-8">
          <h3 className="text-lg font-semibold text-[#1B2A4A] mb-1">Custom Referral URL</h3>
          <p className="text-sm text-gray-500 mb-4">
            Pick a vanity slug for your share link. Your old code{affiliate.aliases && affiliate.aliases.length > 0 ? "s" : ""} will keep working forever &mdash; nothing you&apos;ve printed will break.
          </p>
          <div className="flex flex-col sm:flex-row sm:items-end gap-3 mb-3">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                New code
              </label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 font-mono">sealtheday.com/?ref=</span>
                <input
                  type="text"
                  value={newCodeInput}
                  onChange={(e) => { setNewCodeInput(e.target.value); setRenameError(""); setRenameSuccess(""); }}
                  placeholder="yourstudio"
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-[#C8A962]/40 focus:border-[#C8A962]"
                />
              </div>
            </div>
            <button
              onClick={handleRename}
              disabled={renaming}
              className="rounded-lg bg-[#1B2A4A] text-white px-5 py-2 text-sm font-semibold hover:bg-[#1B2A4A]/90 transition disabled:opacity-60 shrink-0"
            >
              {renaming ? "Saving..." : "Save new code"}
            </button>
          </div>
          {renameError && (
            <p className="text-sm text-red-600">{renameError}</p>
          )}
          {renameSuccess && (
            <p className="text-sm text-[#2D5016]">{renameSuccess}</p>
          )}
          {affiliate.aliases && affiliate.aliases.length > 0 && (
            <p className="mt-3 text-xs text-gray-500">
              Old aliases still working: {affiliate.aliases.map((a) => `?ref=${a}`).join(", ")}
            </p>
          )}
        </div>

        {/* Campaign Links */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-8">
          <h3 className="text-lg font-semibold text-[#1B2A4A] mb-1">Campaign Links</h3>
          <p className="text-sm text-gray-500 mb-4">Use these links to track which marketing channel is working best for you.</p>
          <div className="space-y-3">
            {campaignLinks.map((c) => {
              const url = getCampaignUrl(c.path);
              const display = `sealtheday.com${c.path}?ref=${code}`;
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
            </div>
            <BrandedQR
              url={getCampaignUrl(campaignLinks.find((c) => c.key === selectedQRCampaign)?.path || "")}
              businessName={affiliate.business_name || affiliate.name || "Photographer"}
            />
          </div>
        </div>

        {/* Marketing Materials */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-8">
          <h3 className="text-lg font-semibold text-[#1B2A4A] mb-1">Ready-to-Use Marketing Copy</h3>
          <p className="text-sm text-gray-500 mb-4">Copy and paste these into your emails, social posts, or conversations.</p>
          <div className="space-y-3">
            {[
              {
                key: "couples",
                title: "Email to Engaged Couples",
                content: `Subject: A wedding gift idea I had to share

Hi [Name],

Congrats on the engagement! I wanted to send you something I recently came across — SealTheDay.

It is a wedding vault. You share a single link with your guests at the reception, and they each record a video message, leave a written note, or upload a photo. Everything gets sealed until a date you choose — your first anniversary, your tenth, your twenty-fifth.

On that date, you open it together. Years later, you get to hear from everyone who was in the room with you on your wedding day.

It is the kind of thing you cannot put a price on, and it costs less than a centerpiece.

Use my link to start: ${getCampaignUrl("/wedding")}

Congrats again!

[Your name]`,
              },
              {
                key: "social",
                title: "Social Media Post",
                content: `Just found the most beautiful wedding idea — @SealTheDay 💌

You share one link with your guests. They each record a video, leave a note, or upload a photo. Everything gets sealed until your anniversary — 1 year, 5 years, 10 years, whatever you choose.

On that date, you open it together. You get to hear from everyone who was at your wedding, in their own words, exactly how they felt that day.

Wish I had this at mine.

${getCampaignUrl("/wedding")}

#SealTheDay #WeddingIdeas #WeddingVault`,
              },
              {
                key: "vendor",
                title: "Wedding Vendor Pitch",
                content: `For wedding planners, photographers, and videographers:

SealTheDay is a wedding vault your couples will thank you for recommending. They share one link at the reception. Every guest records a video, writes a note, or uploads a photo. Everything seals until the couple's anniversary.

It pairs perfectly with what you already deliver — your photos and video are the polished record of the day. The vault is the unfiltered one, in your couple's guests' own voices.

I have a partner link so you can add it to your welcome packets:
${getCampaignUrl("/wedding")}`,
              },
              {
                key: "conversation",
                title: "Talking Points",
                content: `PROBLEM: Wedding photos and videos capture what the day looked like. They do not capture what the guests actually felt or wanted to say.

SOLUTION: SealTheDay is a wedding vault. Guests record video messages, leave notes, and upload photos at the reception. Everything seals until the couple's anniversary.

KEY POINTS:
• One vault, $10. Add unlimited slots à la carte.
• $1 per video slot, $0.25 per audio or photo slot.
• Guest contributions stay sealed until the date the couple sets.
• Works with a QR code at the reception. No app required.
• Sealed forever after the open date — guests cannot edit, no platform tampering.
• Built for one day. Opens on the date that matters.

CLOSE: Want me to send you the link? Setup takes under 10 minutes.

Link: ${getCampaignUrl("/wedding")}`,
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

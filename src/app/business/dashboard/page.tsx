"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { TIERS, OCCASION_TYPES } from "@/lib/constants";
import type { TierId } from "@/lib/constants";

/* ─────────────────────────────── US States ─────────────────────────────── */

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA",
  "HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
  "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY",
] as const;

const RELATIONSHIP_OPTIONS = ["Client", "Employee", "Partner", "Vendor", "Other"];

const INDUSTRY_LABELS: Record<string, string> = {
  realtor: "Real Estate",
  financial: "Financial Services",
  healthcare: "Healthcare",
  hr: "HR / Corporate",
  retail: "Retail",
  other: "Other",
};

/* ──────────────────────────── Types ───────────────────────────── */

interface BusinessRecipient {
  id: string;
  recipient_name: string;
  relationship: string | null;
  occasion_type: string;
  occasion_date: string;
  occasion_label: string | null;
  tier: string;
  years_purchased: number;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  card_message: string | null;
  gift_notes: string | null;
  amount_paid: number | null;
  status: string;
  created_at: string;
  business_order_id: string;
}

interface BusinessOrder {
  id: string;
  company_name: string;
  sender_name: string | null;
  status: string;
  created_at: string;
}

interface CompanyProfile {
  company_name: string | null;
  industry: string | null;
  full_name: string | null;
  email: string;
  company_website: string | null;
}

/* ════════════════════════════ CSV Parsing ═════════════════════════════ */

const TIER_MAP: Record<string, TierId> = {
  starter: "starter",
  classic: "classic",
  premium: "premium",
  deluxe: "deluxe",
  legacy: "legacy",
};

const OCCASION_MAP: Record<string, string> = {
  birthday: "birthday",
  graduation: "graduation",
  holiday: "holiday",
  anniversary: "anniversary",
  just_because: "just_because",
  "just because": "just_because",
  custom: "custom",
};

interface CsvRecipient {
  recipientName: string;
  relationship: string;
  occasionType: string;
  occasionDate: string;
  years: number;
  tier: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  cardMessage: string;
  giftNotes: string;
}

function parseCSV(text: string): CsvRecipient[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const rows = lines.slice(1);
  return rows.map((row) => {
    const cols: string[] = [];
    let current = "";
    let inQuotes = false;
    for (const char of row) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        cols.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    cols.push(current.trim());
    const [
      name = "", relationship = "", occasionType = "", occasionDate = "",
      years = "3", tier = "", address1 = "", address2 = "",
      city = "", state = "", zip = "", cardMessage = "", giftNotes = "",
    ] = cols;
    return {
      recipientName: name,
      relationship,
      occasionType: OCCASION_MAP[occasionType.toLowerCase()] || occasionType,
      occasionDate,
      years: Math.max(1, Math.min(25, parseInt(years) || 3)),
      tier: TIER_MAP[tier.toLowerCase()] || "",
      addressLine1: address1,
      addressLine2: address2,
      city,
      state: state.toUpperCase(),
      postalCode: zip,
      cardMessage,
      giftNotes,
    };
  });
}

/* ═══════════════════════════════════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════════════════════════════════ */

export default function BusinessDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [recipients, setRecipients] = useState<BusinessRecipient[]>([]);
  const [orders, setOrders] = useState<BusinessOrder[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterOccasion, setFilterOccasion] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"recipients" | "orders">("recipients");

  // CSV upload state
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [csvPreview, setCsvPreview] = useState<CsvRecipient[] | null>(null);
  const [csvError, setCsvError] = useState("");

  const loadData = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push("/auth");
      return;
    }

    // Save profile data from user metadata if profile doesn't have it yet
    const { data: profileData } = await supabase
      .from("profiles")
      .select("company_name, industry, full_name, email, company_website")
      .eq("id", user.id)
      .single();

    if (profileData) {
      // If company info was passed via magic link metadata but not yet saved
      const meta = user.user_metadata;
      if (meta?.company_name && !profileData.company_name) {
        await supabase
          .from("profiles")
          .update({
            company_name: meta.company_name,
            industry: meta.industry || null,
            company_website: meta.company_website || null,
            full_name: meta.full_name || profileData.full_name,
            account_type: "business",
          })
          .eq("id", user.id);
        setProfile({
          ...profileData,
          company_name: meta.company_name,
          industry: meta.industry || null,
          full_name: meta.full_name || profileData.full_name,
          company_website: meta.company_website || null,
        });
      } else {
        setProfile(profileData);
      }
    }

    // Load business orders
    const { data: ordersData } = await supabase
      .from("business_orders")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (ordersData) setOrders(ordersData);

    // Load business recipients
    const { data: recipientsData } = await supabase
      .from("business_recipients")
      .select("*")
      .eq("user_id", user.id)
      .order("occasion_date", { ascending: true });

    if (recipientsData) setRecipients(recipientsData);
    setLoading(false);
  }, [router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* ────────────── Stats ────────────── */

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const activePlans = recipients.filter((r) => r.status === "active").length;
  const totalSpent = recipients.reduce((sum, r) => sum + (r.amount_paid || 0), 0);

  /* ────────────── Filtering ────────────── */

  const filtered = recipients.filter((r) => {
    if (filterStatus !== "all" && r.status !== filterStatus) return false;
    if (filterOccasion !== "all" && r.occasion_type !== filterOccasion) return false;
    return true;
  });

  /* ────────────── CSV Export ────────────── */

  function exportCSV() {
    const headers = ["Name", "Relationship", "Occasion", "Date", "Tier", "Years", "Status", "City", "State"];
    const rows = recipients.map((r) => [
      r.recipient_name, r.relationship || "", r.occasion_type,
      r.occasion_date, r.tier, r.years_purchased.toString(),
      r.status, r.city || "", r.state || "",
    ]);
    const csv = [headers, ...rows].map((row) => row.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${profile?.company_name || "business"}-recipients.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /* ────────────── CSV Upload ────────────── */

  function handleCsvFile(file: File) {
    setCsvError("");
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const parsed = parseCSV(text);
      if (parsed.length === 0) {
        setCsvError("No valid recipients found. Check the format and try again.");
        return;
      }
      setCsvPreview(parsed);
    };
    reader.readAsText(file);
  }

  async function confirmCsvImport() {
    if (!csvPreview) return;
    // Navigate to send flow with CSV data in sessionStorage
    sessionStorage.setItem("business_csv_recipients", JSON.stringify(csvPreview));
    sessionStorage.setItem("business_context", "true");
    router.push("/start");
  }

  /* ────────────── Next delivery date ────────────── */

  function getNextDelivery(r: BusinessRecipient): string {
    const d = new Date(r.occasion_date + "T00:00:00");
    const thisYear = new Date(d);
    thisYear.setFullYear(currentYear);
    if (thisYear >= now) {
      return thisYear.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    }
    thisYear.setFullYear(currentYear + 1);
    return thisYear.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  /* ════════════════════════════ Render ═════════════════════════════ */

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-cream to-cream-dark flex items-center justify-center">
        <div className="text-center">
          <svg className="mx-auto h-8 w-8 animate-spin text-navy" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="mt-3 text-sm text-warm-gray">Loading dashboard...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-cream to-cream-dark">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-navy">
              {profile?.company_name || "Business"} Dashboard
            </h1>
            <p className="mt-1 text-warm-gray">
              Manage your recipients, upload lists, and track deliveries.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/start"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-navy px-5 py-2.5 text-sm font-semibold text-cream shadow-sm hover:bg-navy-light transition"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Add Recipients
            </Link>
            <button
              type="button"
              onClick={() => setShowCsvModal(true)}
              className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-navy/20 px-5 py-2.5 text-sm font-semibold text-navy hover:border-navy hover:bg-navy hover:text-cream transition"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              Upload CSV
            </button>
          </div>
        </div>

        {/* Company Info */}
        {profile && (
          <div className="rounded-2xl border border-cream-dark bg-white p-5 shadow-sm mb-6">
            <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
              {profile.full_name && (
                <div>
                  <span className="text-warm-gray">Contact:</span>{" "}
                  <span className="font-medium text-navy">{profile.full_name}</span>
                </div>
              )}
              <div>
                <span className="text-warm-gray">Email:</span>{" "}
                <span className="font-medium text-navy">{profile.email}</span>
              </div>
              {profile.industry && (
                <div>
                  <span className="text-warm-gray">Industry:</span>{" "}
                  <span className="font-medium text-navy">{INDUSTRY_LABELS[profile.industry] || profile.industry}</span>
                </div>
              )}
              {profile.company_website && (
                <div>
                  <span className="text-warm-gray">Website:</span>{" "}
                  <a href={profile.company_website} target="_blank" rel="noopener noreferrer" className="font-medium text-gold hover:text-gold-dark underline underline-offset-2">
                    {profile.company_website.replace(/^https?:\/\//, "")}
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="rounded-2xl border border-cream-dark bg-white p-5 shadow-sm">
            <p className="text-sm text-warm-gray">Total Recipients</p>
            <p className="mt-1 text-3xl font-bold text-navy">{recipients.length}</p>
          </div>
          <div className="rounded-2xl border border-cream-dark bg-white p-5 shadow-sm">
            <p className="text-sm text-warm-gray">Active Plans</p>
            <p className="mt-1 text-3xl font-bold text-navy">{activePlans}</p>
          </div>
          <div className="rounded-2xl border border-cream-dark bg-white p-5 shadow-sm">
            <p className="text-sm text-warm-gray">Total Spent</p>
            <p className="mt-1 text-3xl font-bold text-navy">${(totalSpent / 100).toLocaleString()}</p>
          </div>
        </div>

        {/* Tab Toggle */}
        <div className="flex rounded-lg border border-cream-dark overflow-hidden mb-6">
          <button
            type="button"
            onClick={() => setActiveTab("recipients")}
            className={`flex-1 px-4 py-2.5 text-sm font-semibold transition ${
              activeTab === "recipients" ? "bg-navy text-cream" : "bg-white text-navy hover:bg-cream-dark/50"
            }`}
          >
            Recipients
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("orders")}
            className={`flex-1 px-4 py-2.5 text-sm font-semibold transition ${
              activeTab === "orders" ? "bg-navy text-cream" : "bg-white text-navy hover:bg-cream-dark/50"
            }`}
          >
            Orders
          </button>
        </div>

        {/* ────────── Recipients Tab ────────── */}
        {activeTab === "recipients" && (
          <>
            {/* Filters + Export */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="rounded-lg border border-cream-dark bg-white px-3 py-2 text-sm text-navy appearance-none pr-8 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
                  >
                    <option value="all">All statuses</option>
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="completed">Completed</option>
                  </select>
                  <ChevronDownIcon />
                </div>
                <div className="relative">
                  <select
                    value={filterOccasion}
                    onChange={(e) => setFilterOccasion(e.target.value)}
                    className="rounded-lg border border-cream-dark bg-white px-3 py-2 text-sm text-navy appearance-none pr-8 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
                  >
                    <option value="all">All occasions</option>
                    {OCCASION_TYPES.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  <ChevronDownIcon />
                </div>
              </div>
              <div className="sm:ml-auto">
                <button
                  type="button"
                  onClick={exportCSV}
                  className="inline-flex items-center gap-2 rounded-lg border-2 border-navy/20 px-4 py-2 text-sm font-semibold text-navy hover:border-navy hover:bg-navy hover:text-cream transition"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                  Export CSV
                </button>
              </div>
            </div>

            {/* Recipients Table */}
            {filtered.length === 0 ? (
              <div className="rounded-2xl border border-cream-dark bg-white p-10 text-center shadow-sm">
                <svg className="mx-auto h-12 w-12 text-cream-dark" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                </svg>
                <p className="mt-4 text-warm-gray font-medium">
                  {recipients.length === 0
                    ? "No recipients yet. Add your first batch to get started."
                    : "No recipients match the current filters."}
                </p>
                {recipients.length === 0 && (
                  <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <Link
                      href="/start"
                      className="inline-flex items-center gap-2 rounded-lg bg-navy px-5 py-2.5 text-sm font-semibold text-cream shadow-sm hover:bg-navy-light transition"
                    >
                      Add Recipients
                    </Link>
                    <button
                      type="button"
                      onClick={() => setShowCsvModal(true)}
                      className="inline-flex items-center gap-2 rounded-lg border-2 border-navy/20 px-5 py-2.5 text-sm font-semibold text-navy hover:border-navy transition"
                    >
                      Upload CSV
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-cream-dark bg-white shadow-sm">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-cream-dark bg-cream-dark/20">
                      <th className="px-4 py-3 text-left font-semibold text-navy">Name</th>
                      <th className="px-4 py-3 text-left font-semibold text-navy hidden sm:table-cell">Occasion</th>
                      <th className="px-4 py-3 text-left font-semibold text-navy hidden md:table-cell">Tier</th>
                      <th className="px-4 py-3 text-left font-semibold text-navy hidden lg:table-cell">Years</th>
                      <th className="px-4 py-3 text-left font-semibold text-navy">Next Delivery</th>
                      <th className="px-4 py-3 text-left font-semibold text-navy">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((r) => {
                      const tier = TIERS.find((t) => t.id === r.tier);
                      const occasionLabel = OCCASION_TYPES.find((o) => o.value === r.occasion_type)?.label ?? r.occasion_type;
                      return (
                        <tr key={r.id} className="border-b border-cream-dark last:border-0 hover:bg-cream/50 transition">
                          <td className="px-4 py-3">
                            <span className="font-medium text-navy">{r.recipient_name}</span>
                            {r.relationship && (
                              <span className="text-warm-gray-light ml-1 text-xs">({r.relationship})</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-warm-gray hidden sm:table-cell">{occasionLabel}</td>
                          <td className="px-4 py-3 text-warm-gray hidden md:table-cell capitalize">{tier?.name ?? r.tier}</td>
                          <td className="px-4 py-3 text-warm-gray hidden lg:table-cell">{r.years_purchased}</td>
                          <td className="px-4 py-3 text-warm-gray">{getNextDelivery(r)}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              r.status === "active" ? "bg-forest/10 text-forest"
                                : r.status === "paused" ? "bg-gold/10 text-gold-dark"
                                : r.status === "cancelled" ? "bg-red-50 text-red-600"
                                : "bg-cream-dark text-warm-gray"
                            }`}>
                              {r.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* ────────── Orders Tab ────────── */}
        {activeTab === "orders" && (
          <>
            {orders.length === 0 ? (
              <div className="rounded-2xl border border-cream-dark bg-white p-10 text-center shadow-sm">
                <p className="text-warm-gray">No orders yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-cream-dark bg-white shadow-sm">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-cream-dark bg-cream-dark/20">
                      <th className="px-4 py-3 text-left font-semibold text-navy">Order ID</th>
                      <th className="px-4 py-3 text-left font-semibold text-navy">Company</th>
                      <th className="px-4 py-3 text-left font-semibold text-navy hidden sm:table-cell">Date</th>
                      <th className="px-4 py-3 text-left font-semibold text-navy">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => (
                      <tr key={o.id} className="border-b border-cream-dark last:border-0 hover:bg-cream/50 transition">
                        <td className="px-4 py-3 font-mono text-xs text-warm-gray">{o.id.slice(0, 8)}...</td>
                        <td className="px-4 py-3 font-medium text-navy">{o.company_name}</td>
                        <td className="px-4 py-3 text-warm-gray hidden sm:table-cell">
                          {new Date(o.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            o.status === "paid" ? "bg-forest/10 text-forest"
                              : o.status === "pending" ? "bg-gold/10 text-gold-dark"
                              : "bg-cream-dark text-warm-gray"
                          }`}>
                            {o.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {/* ════════════════════ CSV Upload Modal ════════════════════ */}
      {showCsvModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl sm:p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-navy">Upload CSV</h2>
              <button
                type="button"
                onClick={() => { setShowCsvModal(false); setCsvPreview(null); setCsvError(""); }}
                className="text-warm-gray hover:text-navy transition"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {!csvPreview ? (
              <>
                <div
                  className="rounded-xl border-2 border-dashed border-cream-dark bg-cream/30 p-8 text-center hover:border-gold/50 transition cursor-pointer"
                  onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const file = e.dataTransfer.files[0];
                    if (file && file.name.endsWith(".csv")) handleCsvFile(file);
                    else setCsvError("Please upload a .csv file");
                  }}
                  onClick={() => {
                    const input = document.createElement("input");
                    input.type = "file";
                    input.accept = ".csv";
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) handleCsvFile(file);
                    };
                    input.click();
                  }}
                >
                  <svg className="mx-auto h-12 w-12 text-warm-gray-light" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                  <p className="mt-3 text-sm font-medium text-navy">
                    Drag and drop your CSV file here, or click to browse
                  </p>
                  <p className="mt-1 text-xs text-warm-gray-light">.csv files only</p>
                </div>

                <a
                  href="/business-recipients-template.csv"
                  download
                  className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-gold hover:text-gold-dark underline underline-offset-2"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                  Download CSV template
                </a>

                <div className="mt-4 rounded-lg bg-cream/50 p-4">
                  <p className="text-xs font-semibold text-navy mb-2">Expected CSV columns:</p>
                  <p className="text-xs text-warm-gray font-mono">
                    Name, Relationship, OccasionType, OccasionDate, Years, Tier, Address1, Address2, City, State, ZIP, CardMessage, GiftNotes
                  </p>
                </div>

                {csvError && <p className="mt-3 text-sm text-red-600">{csvError}</p>}
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold text-navy mb-3">
                  Preview ({csvPreview.length} recipients found)
                </h3>
                <div className="overflow-x-auto rounded-lg border border-cream-dark">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-cream-dark/30">
                        <th className="px-3 py-2 text-left font-medium text-navy">Name</th>
                        <th className="px-3 py-2 text-left font-medium text-navy">Occasion</th>
                        <th className="px-3 py-2 text-left font-medium text-navy">Date</th>
                        <th className="px-3 py-2 text-left font-medium text-navy">Tier</th>
                        <th className="px-3 py-2 text-left font-medium text-navy">City, State</th>
                      </tr>
                    </thead>
                    <tbody>
                      {csvPreview.map((r, i) => (
                        <tr key={i} className="border-t border-cream-dark">
                          <td className="px-3 py-2 text-navy">{r.recipientName}</td>
                          <td className="px-3 py-2 text-warm-gray">{r.occasionType}</td>
                          <td className="px-3 py-2 text-warm-gray">{r.occasionDate}</td>
                          <td className="px-3 py-2 text-warm-gray capitalize">{r.tier}</td>
                          <td className="px-3 py-2 text-warm-gray">{r.city}, {r.state}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={confirmCsvImport}
                    className="rounded-lg bg-forest px-6 py-2.5 text-sm font-semibold text-cream shadow-sm hover:bg-forest-light transition"
                  >
                    Confirm & Continue
                  </button>
                  <button
                    type="button"
                    onClick={() => setCsvPreview(null)}
                    className="rounded-lg border-2 border-navy/20 px-6 py-2.5 text-sm font-semibold text-navy hover:border-navy transition"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Small Reusable Pieces
   ═══════════════════════════════════════════════════════════════════════════ */

function ChevronDownIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-warm-gray-light"
    >
      <path
        fillRule="evenodd"
        d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

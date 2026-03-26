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

/* ═══════════════════════════════════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════════════════════════════════ */

export default function BusinessDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [companyName, setCompanyName] = useState("");
  const [recipients, setRecipients] = useState<BusinessRecipient[]>([]);
  const [orders, setOrders] = useState<BusinessOrder[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterOccasion, setFilterOccasion] = useState<string>("all");
  const [showAddModal, setShowAddModal] = useState(false);

  const loadData = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push("/auth");
      return;
    }

    // Load profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("company_name")
      .eq("id", user.id)
      .single();

    if (profile?.company_name) setCompanyName(profile.company_name);

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

  const upcomingThisMonth = recipients.filter((r) => {
    const d = new Date(r.occasion_date + "T00:00:00");
    return d.getMonth() === currentMonth;
  }).length;

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
      r.recipient_name,
      r.relationship || "",
      r.occasion_type,
      r.occasion_date,
      r.tier,
      r.years_purchased.toString(),
      r.status,
      r.city || "",
      r.state || "",
    ]);
    const csv = [headers, ...rows].map((row) => row.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${companyName || "business"}-recipients.csv`;
    a.click();
    URL.revokeObjectURL(url);
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-navy">
              {companyName || "Business"} Dashboard
            </h1>
            <p className="mt-1 text-warm-gray">
              Manage your recipients and track upcoming deliveries.
            </p>
          </div>
          <Link
            href="/business/signup"
            className="inline-flex items-center justify-center rounded-lg bg-navy px-5 py-2.5 text-sm font-semibold text-cream shadow-sm hover:bg-navy-light transition w-full sm:w-auto"
          >
            + Add More Recipients
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <div className="rounded-2xl border border-cream-dark bg-white p-5 shadow-sm">
            <p className="text-sm text-warm-gray">Total Recipients</p>
            <p className="mt-1 text-3xl font-bold text-navy">{recipients.length}</p>
          </div>
          <div className="rounded-2xl border border-cream-dark bg-white p-5 shadow-sm">
            <p className="text-sm text-warm-gray">Upcoming This Month</p>
            <p className="mt-1 text-3xl font-bold text-navy">{upcomingThisMonth}</p>
          </div>
          <div className="rounded-2xl border border-cream-dark bg-white p-5 shadow-sm">
            <p className="text-sm text-warm-gray">Total Spent</p>
            <p className="mt-1 text-3xl font-bold text-navy">${(totalSpent / 100).toLocaleString()}</p>
          </div>
        </div>

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
            <p className="text-warm-gray">
              {recipients.length === 0
                ? "No recipients yet. Add your first batch to get started."
                : "No recipients match the current filters."}
            </p>
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
                      <td className="px-4 py-3 text-warm-gray hidden sm:table-cell">
                        {occasionLabel}
                      </td>
                      <td className="px-4 py-3 text-warm-gray hidden md:table-cell capitalize">
                        {tier?.name ?? r.tier}
                      </td>
                      <td className="px-4 py-3 text-warm-gray hidden lg:table-cell">
                        {r.years_purchased}
                      </td>
                      <td className="px-4 py-3 text-warm-gray">
                        {getNextDelivery(r)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            r.status === "active"
                              ? "bg-forest/10 text-forest"
                              : r.status === "paused"
                                ? "bg-gold/10 text-gold-dark"
                                : r.status === "cancelled"
                                  ? "bg-red-50 text-red-600"
                                  : "bg-cream-dark text-warm-gray"
                          }`}
                        >
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
      </div>
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

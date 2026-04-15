"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Profile {
  id: string;
  email: string;
  phone?: string;
  full_name: string | null;
}

interface Recipient {
  id: string;
  name: string;
  relationship: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  age: string | null;
  gender: string | null;
  interests: string | null;
  card_message: string | null;
  gift_notes: string | null;
}

interface Occasion {
  id: string;
  type: string;
  occasion_date: string;
  label: string | null;
}

interface Order {
  id: string;
  tier: string;
  years_purchased: number;
  years_remaining: number;
  amount_paid: number;
  status: string;
  created_at: string;
  user_id: string;
  profiles: Profile | null;
  recipients: Recipient | null;
  occasions: Occasion | null;
}

interface Shipment {
  id: string;
  order_id: string;
  scheduled_date: string;
  status: string;
  tracking_number: string | null;
  gift_description: string | null;
  photo_url: string | null;
  created_at: string;
  orders: {
    id: string;
    tier: string;
    years_purchased: number;
    years_remaining: number;
    amount_paid: number;
    status: string;
    user_id: string;
    recipient_id: string;
    occasion_id: string;
    executor_name: string | null;
    executor_email: string | null;
    executor_phone: string | null;
    executor_address: string | null;
    recipients: Recipient | null;
    occasions: Occasion | null;
    profiles: Profile | null;
  };
}

interface AccessRequest {
  id: string;
  requester_name: string;
  requester_email: string;
  requester_relationship: string;
  account_holder_name: string;
  account_holder_email: string;
  reason: string;
  status: "pending" | "approved" | "denied";
  created_at: string;
  reviewed_at: string | null;
}

interface Affiliate {
  id: string;
  name: string;
  email: string;
  code: string;
  first_commission_rate: number;
  repeat_commission_rate: number;
  active: boolean;
  notes: string | null;
  total_earned: number;
  total_paid: number;
  created_at: string;
  referral_count: number;
  total_unpaid: number;
}

interface AffiliateReferral {
  id: string;
  affiliate_id: string;
  customer_email: string;
  order_id: string;
  amount_paid: number;
  commission_rate: number;
  commission_amount: number;
  referral_type: "first" | "repeat";
  paid: boolean;
  paid_at: string | null;
  created_at: string;
  affiliates: { name: string; email: string; code: string } | null;
}

interface AdminLetter {
  id: string;
  user_id: string;
  recipient_id: string;
  letter_type: "annual" | "milestone";
  title: string;
  content: string;
  scheduled_date: string | null;
  milestone_label: string | null;
  status: string;
  amount_paid: number;
  delivery_type: "digital" | "physical" | "physical_photo";
  recipient_email: string | null;
  photo_url: string | null;
  executor_email: string | null;
  executor_name: string | null;
  executor_phone: string | null;
  executor_address: string | null;
  executor_can_view: boolean;
  executor_can_edit: boolean;
  created_at: string;
  updated_at: string;
  profiles: Profile | null;
  recipients: Recipient | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const ADMIN_PASSWORD = "SendAdmin2026!";
const SESSION_KEY = "sfg_admin_auth";

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatCurrency(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, " ");
}

function daysUntil(dateStr: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + "T00:00:00");
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function DetailRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex gap-2">
      <span className="text-gray-400 min-w-[90px]">{label}:</span>
      <span className="text-gray-700">{value || "—"}</span>
    </div>
  );
}

// ─── Password Gate ───────────────────────────────────────────────────────────

function PasswordGate({ onAuth }: { onAuth: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [shaking, setShaking] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, "true");
      onAuth();
    } else {
      setError(true);
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className={`bg-white rounded-lg shadow-lg p-8 w-full max-w-sm ${
          shaking ? "animate-shake" : ""
        }`}
      >
        <h1 className="text-xl font-bold text-gray-900 mb-1">Admin Dashboard</h1>
        <p className="text-sm text-gray-500 mb-6">Enter password to continue</p>
        <input
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError(false);
          }}
          placeholder="Password"
          autoFocus
          className={`w-full rounded-md border px-3 py-2 text-sm outline-none transition ${
            error
              ? "border-red-400 focus:ring-red-200"
              : "border-gray-300 focus:ring-blue-200"
          } focus:ring-2`}
        />
        {error && (
          <p className="text-red-500 text-xs mt-1.5">Incorrect password</p>
        )}
        <button
          type="submit"
          className="mt-4 w-full rounded-md bg-gray-900 text-white text-sm font-medium py-2 hover:bg-gray-800 transition"
        >
          Sign In
        </button>
      </form>
      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
}

// ─── Ship Modal ──────────────────────────────────────────────────────────────

function ShipModal({
  shipment,
  onClose,
  onConfirm,
}: {
  shipment: Shipment;
  onClose: () => void;
  onConfirm: (trackingNumber: string) => void;
}) {
  const [tracking, setTracking] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await onConfirm(tracking);
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md"
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-1">
          Mark as Shipped
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          {shipment.orders.recipients?.name} &mdash;{" "}
          {formatDate(shipment.scheduled_date)}
        </p>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tracking Number{" "}
          <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <input
          type="text"
          value={tracking}
          onChange={(e) => setTracking(e.target.value)}
          placeholder="e.g. 1Z999AA10123456784"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200"
          autoFocus
        />
        <p className="text-xs text-gray-400 mt-1.5">
          This will also decrement years remaining on the order.
        </p>
        <div className="flex justify-end gap-2 mt-5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-blue-600 text-white px-4 py-2 text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? "Updating..." : "Confirm Shipped"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Stats Bar ───────────────────────────────────────────────────────────────

function StatsBar({
  orders,
  shipments,
  letters,
}: {
  orders: Order[];
  shipments: Shipment[];
  letters: AdminLetter[];
}) {
  const activeOrdersCount = orders.filter((o) => o.status === "active").length;
  const activeLetterStatuses = ["pending_release", "scheduled", "released", "printed"];
  const activeLettersAsOrders = letters.filter((l) =>
    activeLetterStatuses.includes(l.status)
  ).length;
  const activeOrders = activeOrdersCount + activeLettersAsOrders;

  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();
  const nextMonth = thisMonth === 11 ? 0 : thisMonth + 1;
  const nextMonthYear = thisMonth === 11 ? thisYear + 1 : thisYear;

  const pendingShipments = shipments.filter((s) => s.status === "pending");

  const dueThisMonthShipments = pendingShipments.filter((s) => {
    const d = new Date(s.scheduled_date + "T00:00:00");
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  }).length;

  const dueNextMonthShipments = pendingShipments.filter((s) => {
    const d = new Date(s.scheduled_date + "T00:00:00");
    return d.getMonth() === nextMonth && d.getFullYear() === nextMonthYear;
  }).length;

  const scheduledAnnualLetters = letters.filter(
    (l) => l.letter_type === "annual" && l.status === "scheduled" && l.scheduled_date
  );

  const dueThisMonthLetters = scheduledAnnualLetters.filter((l) => {
    const d = new Date(l.scheduled_date! + "T00:00:00");
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  }).length;

  const dueNextMonthLetters = scheduledAnnualLetters.filter((l) => {
    const d = new Date(l.scheduled_date! + "T00:00:00");
    return d.getMonth() === nextMonth && d.getFullYear() === nextMonthYear;
  }).length;

  const dueThisMonth = dueThisMonthShipments + dueThisMonthLetters;
  const dueNextMonth = dueNextMonthShipments + dueNextMonthLetters;

  const ordersRevenue = orders.reduce((sum, o) => sum + o.amount_paid, 0);
  const lettersRevenue = letters
    .filter((l) => l.amount_paid > 0)
    .reduce((sum, l) => sum + l.amount_paid, 0);
  const totalRevenue = ordersRevenue + lettersRevenue;

  const activeLettersCount = letters.filter((l) =>
    ["scheduled", "pending_release"].includes(l.status)
  ).length;

  const stats = [
    { label: "Active Orders", value: activeOrders },
    { label: "Active Letters", value: activeLettersCount },
    { label: "Due This Month", value: dueThisMonth },
    { label: "Due Next Month", value: dueNextMonth },
    { label: "Total Revenue", value: formatCurrency(totalRevenue) },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
      {stats.map((s) => (
        <div
          key={s.label}
          className="bg-white rounded-lg border border-gray-200 p-4"
        >
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            {s.label}
          </p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{s.value}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Shipment Photo Upload ───────────────────────────────────────────────────

function ShipmentPhotoUpload({
  shipment,
  onUploaded,
}: {
  shipment: Shipment;
  onUploaded: () => void;
}) {
  const [photoUrl, setPhotoUrl] = useState(shipment.photo_url ?? "");
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="mt-4 border-t border-gray-200 pt-4">
      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
        Upload Gift Photo
      </h4>
      <p className="text-xs text-gray-400 mb-3">
        Photo of the gift before shipping (visible to customer)
      </p>

      {(preview || photoUrl) && (
        <div className="mb-3">
          <Image
            src={preview || photoUrl}
            alt="Gift photo"
            width={160}
            height={160}
            className="h-32 w-32 rounded-lg border border-gray-200 object-cover"
            unoptimized={!!preview}
          />
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;

          const reader = new FileReader();
          reader.onload = (ev) => setPreview(ev.target?.result as string);
          reader.readAsDataURL(file);

          setUploading(true);
          const formData = new FormData();
          formData.append("file", file);
          formData.append("shipment_id", shipment.id);

          const res = await fetch("/api/upload/shipment-photo", {
            method: "POST",
            body: formData,
          });

          if (res.ok) {
            const data = await res.json();
            setPhotoUrl(data.url);
            setPreview(null);
            onUploaded();
          }
          setUploading(false);
        }}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
      >
        {uploading
          ? "Uploading..."
          : photoUrl
            ? "Change Photo"
            : "Choose Photo"}
      </button>
    </div>
  );
}

// ─── Shipments Tab ───────────────────────────────────────────────────────────

function ShipmentsTab({
  shipments,
  onRefresh,
}: {
  shipments: Shipment[];
  onRefresh: () => void;
}) {
  const [modalShipment, setModalShipment] = useState<Shipment | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const pending = shipments.filter((s) => s.status === "pending");

  async function handleMarkShipped(
    shipmentId: string,
    trackingNumber: string
  ) {
    const res = await fetch("/api/admin/shipments", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shipment_id: shipmentId,
        status: "shipped",
        tracking_number: trackingNumber || null,
      }),
    });
    if (res.ok) {
      setModalShipment(null);
      onRefresh();
    }
  }

  async function handleMarkDelivered(shipmentId: string) {
    const res = await fetch("/api/admin/shipments", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shipment_id: shipmentId, status: "delivered" }),
    });
    if (res.ok) onRefresh();
  }

  function rowColor(scheduledDate: string) {
    const days = daysUntil(scheduledDate);
    if (days < 0) return "bg-red-50";
    if (days <= 7) return "bg-yellow-50";
    return "";
  }

  return (
    <div>
      {modalShipment && (
        <ShipModal
          shipment={modalShipment}
          onClose={() => setModalShipment(null)}
          onConfirm={(tn) => handleMarkShipped(modalShipment.id, tn)}
        />
      )}

      {pending.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          No pending shipments
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                <th className="pb-3 pr-4">Scheduled</th>
                <th className="pb-3 pr-4">Recipient</th>
                <th className="pb-3 pr-4">Occasion</th>
                <th className="pb-3 pr-4">Tier</th>
                <th className="pb-3 pr-4">Address</th>
                <th className="pb-3 pr-4">Customer</th>
                <th className="pb-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pending.map((s) => {
                const days = daysUntil(s.scheduled_date);
                const isExpanded = expandedId === s.id;
                const r = s.orders.recipients;
                return (
                  <React.Fragment key={s.id}>
                    <tr
                      className={`border-b border-gray-100 ${rowColor(
                        s.scheduled_date
                      )}`}
                    >
                      <td className="py-3 pr-4 whitespace-nowrap">
                        <span className="font-medium">
                          {formatDate(s.scheduled_date)}
                        </span>
                        {days < 0 && (
                          <span className="ml-1.5 text-xs text-red-600 font-medium">
                            Overdue
                          </span>
                        )}
                        {days >= 0 && days <= 7 && (
                          <span className="ml-1.5 text-xs text-yellow-700 font-medium">
                            {days === 0 ? "Today" : `${days}d`}
                          </span>
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        {r?.name || "—"}
                      </td>
                      <td className="py-3 pr-4">
                        {capitalize(s.orders.occasions?.type || "—")}
                        {s.orders.occasions?.label && (
                          <span className="text-gray-400 ml-1">
                            ({s.orders.occasions.label})
                          </span>
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        <span className="inline-block rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700 capitalize">
                          {s.orders.tier}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-gray-500">
                        {r
                          ? `${r.city}, ${r.state}`
                          : "—"}
                      </td>
                      <td className="py-3 pr-4 text-gray-500 text-xs">
                        {s.orders.profiles?.email || "—"}
                      </td>
                      <td className="py-3 whitespace-nowrap">
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : s.id)}
                          className="rounded bg-gray-50 border border-gray-200 text-gray-600 px-2.5 py-1 text-xs font-medium hover:bg-gray-100 transition mr-1.5"
                        >
                          {isExpanded ? "Hide" : "Details"}
                        </button>
                        <button
                          onClick={() => setModalShipment(s)}
                          className="rounded bg-blue-600 text-white px-2.5 py-1 text-xs font-medium hover:bg-blue-700 transition mr-1.5"
                        >
                          Mark Shipped
                        </button>
                        <button
                          onClick={() => handleMarkDelivered(s.id)}
                          className="rounded bg-gray-100 text-gray-700 px-2.5 py-1 text-xs font-medium hover:bg-gray-200 transition"
                        >
                          Mark Delivered
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={7} className="p-0">
                          <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                              {/* Delivery Address */}
                              <div>
                                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                                  Delivery Address
                                </h4>
                                {r ? (
                                  <div className="text-gray-700 space-y-0.5">
                                    <p>{r.address_line1}</p>
                                    {r.address_line2 && <p>{r.address_line2}</p>}
                                    <p>{r.city}, {r.state} {r.postal_code}</p>
                                    <p>{r.country}</p>
                                  </div>
                                ) : (
                                  <p className="text-gray-400">No address</p>
                                )}
                              </div>

                              {/* Recipient Profile */}
                              <div>
                                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                                  Recipient Profile
                                </h4>
                                <div className="space-y-1">
                                  <DetailRow label="Age" value={r?.age} />
                                  <DetailRow label="Gender" value={r?.gender} />
                                  <DetailRow label="Interests" value={r?.interests} />

                                  <DetailRow label="Gift Notes" value={r?.gift_notes} />
                                </div>
                              </div>

                              {/* Customer Info */}
                              <div>
                                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                                  Customer
                                </h4>
                                <div className="space-y-1">
                                  <DetailRow label="Email" value={s.orders.profiles?.email} />
                                  <DetailRow label="Phone" value={s.orders.profiles?.phone} />
                                  <DetailRow label="Name" value={s.orders.profiles?.full_name} />
                                </div>

                                {/* Executor Info */}
                                {s.orders.executor_name && (
                                  <div className="mt-4">
                                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                                      Executor
                                    </h4>
                                    <div className="space-y-1">
                                      <DetailRow label="Name" value={s.orders.executor_name} />
                                      <DetailRow label="Email" value={s.orders.executor_email} />
                                      <DetailRow label="Phone" value={s.orders.executor_phone} />
                                      <DetailRow label="Address" value={s.orders.executor_address} />
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Gift Photo Upload */}
                            <ShipmentPhotoUpload
                              shipment={s}
                              onUploaded={onRefresh}
                            />
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Orders Tab ──────────────────────────────────────────────────────────────

function OrdersTab() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (search) params.set("search", search);
    const res = await fetch(`/api/admin/orders?${params}`);
    const data = await res.json();
    setOrders(data.orders || []);
    setLoading(false);
  }, [statusFilter, search]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-200"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="cancelled">Cancelled</option>
          <option value="completed">Completed</option>
        </select>
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search by recipient or email..."
          className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200 sm:w-72"
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading orders...</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12 text-gray-400">No orders found</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                <th className="pb-3 pr-4">Customer</th>
                <th className="pb-3 pr-4">Recipient</th>
                <th className="pb-3 pr-4">Tier</th>
                <th className="pb-3 pr-4">Years</th>
                <th className="pb-3 pr-4">Remaining</th>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3 pr-4">Paid</th>
                <th className="pb-3">Created</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr
                  key={o.id}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="py-3 pr-4">
                    <div className="font-medium text-gray-900">
                      {o.profiles?.full_name || "—"}
                    </div>
                    <div className="text-xs text-gray-400">
                      {o.profiles?.email || "—"}
                    </div>
                  </td>
                  <td className="py-3 pr-4">{o.recipients?.name || "—"}</td>
                  <td className="py-3 pr-4">
                    <span className="inline-block rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700 capitalize">
                      {o.tier}
                    </span>
                  </td>
                  <td className="py-3 pr-4">{o.years_purchased}</td>
                  <td className="py-3 pr-4">{o.years_remaining}</td>
                  <td className="py-3 pr-4">
                    <StatusBadge status={o.status} />
                  </td>
                  <td className="py-3 pr-4 font-medium">
                    {formatCurrency(o.amount_paid)}
                  </td>
                  <td className="py-3 text-gray-500 whitespace-nowrap">
                    {formatDate(o.created_at.split("T")[0])}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: "bg-green-100 text-green-700",
    paused: "bg-yellow-100 text-yellow-700",
    cancelled: "bg-red-100 text-red-700",
    completed: "bg-blue-100 text-blue-700",
  };

  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
        colors[status] || "bg-gray-100 text-gray-700"
      }`}
    >
      {status}
    </span>
  );
}

// ─── Letters Tab ────────────────────────────────────────────────────────────

function LettersTab({
  letters,
  onRefresh,
}: {
  letters: AdminLetter[];
  onRefresh: () => void;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredLetters = statusFilter === "all"
    ? letters
    : letters.filter((l) => l.status === statusFilter);

  async function handleUpdateStatus(letterId: string, newStatus: string) {
    const res = await fetch("/api/admin/letters", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ letter_id: letterId, status: newStatus }),
    });
    if (res.ok) onRefresh();
  }

  const letterStatusColors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-700",
    scheduled: "bg-blue-100 text-blue-700",
    pending_release: "bg-yellow-100 text-yellow-700",
    released: "bg-purple-100 text-purple-700",
    printed: "bg-indigo-100 text-indigo-700",
    delivered: "bg-green-100 text-green-700",
  };

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-200"
        >
          <option value="all">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="scheduled">Scheduled</option>
          <option value="pending_release">Pending Release</option>
          <option value="released">Released</option>
          <option value="printed">Printed</option>
          <option value="delivered">Delivered</option>
        </select>
        <div className="text-sm text-gray-500 flex items-center">
          {filteredLetters.length} letter{filteredLetters.length !== 1 ? "s" : ""}
        </div>
      </div>

      {filteredLetters.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          No letters found
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                <th className="pb-3 pr-4">Scheduled</th>
                <th className="pb-3 pr-4">Recipient</th>
                <th className="pb-3 pr-4">Type</th>
                <th className="pb-3 pr-4">Delivery</th>
                <th className="pb-3 pr-4">Title</th>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3 pr-4">Customer</th>
                <th className="pb-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLetters.map((letter) => {
                const isExpanded = expandedId === letter.id;
                return (
                  <React.Fragment key={letter.id}>
                    <tr className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 pr-4 whitespace-nowrap">
                        {letter.scheduled_date ? (
                          <span className="font-medium">
                            {formatDate(letter.scheduled_date)}
                          </span>
                        ) : (
                          <span className="text-gray-400">Not set</span>
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        {letter.recipients?.name || "\u2014"}
                      </td>
                      <td className="py-3 pr-4">
                        <span className="inline-block rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700 capitalize">
                          {letter.letter_type}
                        </span>
                        {letter.milestone_label && (
                          <span className="ml-1 text-xs text-gray-400">
                            ({letter.milestone_label})
                          </span>
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          letter.delivery_type === "digital"
                            ? "bg-cyan-100 text-cyan-700"
                            : letter.delivery_type === "physical_photo"
                              ? "bg-violet-100 text-violet-700"
                              : "bg-orange-100 text-orange-700"
                        }`}>
                          {letter.delivery_type === "digital" ? "Digital" : letter.delivery_type === "physical_photo" ? "Physical+Photo" : "Physical"}
                        </span>
                      </td>
                      <td className="py-3 pr-4 max-w-[200px] truncate">
                        {letter.title}
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                            letterStatusColors[letter.status] || "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {letter.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-gray-500 text-xs">
                        {letter.profiles?.email || "\u2014"}
                      </td>
                      <td className="py-3 whitespace-nowrap">
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : letter.id)}
                          className="rounded bg-gray-50 border border-gray-200 text-gray-600 px-2.5 py-1 text-xs font-medium hover:bg-gray-100 transition mr-1.5"
                        >
                          {isExpanded ? "Hide" : "Details"}
                        </button>
                        {letter.status === "scheduled" && (
                          <button
                            onClick={() => handleUpdateStatus(letter.id, "printed")}
                            className="rounded bg-indigo-600 text-white px-2.5 py-1 text-xs font-medium hover:bg-indigo-700 transition mr-1.5"
                          >
                            Mark Printed
                          </button>
                        )}
                        {letter.status === "printed" && (
                          <button
                            onClick={() => handleUpdateStatus(letter.id, "delivered")}
                            className="rounded bg-green-600 text-white px-2.5 py-1 text-xs font-medium hover:bg-green-700 transition"
                          >
                            Mark Delivered
                          </button>
                        )}
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={8} className="p-0">
                          <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                              {/* Letter Content Preview */}
                              <div className="md:col-span-2">
                                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                                  Letter Content
                                </h4>
                                <div className="bg-white rounded-lg border border-gray-200 p-4 max-h-48 overflow-y-auto font-serif text-sm leading-relaxed text-gray-700 whitespace-pre-wrap">
                                  {letter.content || "(empty draft)"}
                                </div>

                                {/* Photo preview for physical+photo */}
                                {letter.delivery_type === "physical_photo" && letter.photo_url && (
                                  <div className="mt-4">
                                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                                      Attached Photo
                                    </h4>
                                    <img
                                      src={letter.photo_url}
                                      alt="Letter photo"
                                      className="h-32 w-32 rounded-lg border border-gray-200 object-cover"
                                    />
                                  </div>
                                )}
                              </div>

                              {/* Details */}
                              <div>
                                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                                  Details
                                </h4>
                                <div className="space-y-1">
                                  <DetailRow label="Customer" value={letter.profiles?.full_name} />
                                  <DetailRow label="Email" value={letter.profiles?.email} />
                                  <DetailRow label="Phone" value={letter.profiles?.phone} />
                                  <DetailRow label="Delivery" value={
                                    letter.delivery_type === "digital" ? "Digital (Email)"
                                      : letter.delivery_type === "physical_photo" ? "Physical + Photo"
                                        : "Physical (Mailed)"
                                  } />
                                  {letter.delivery_type === "digital" && (
                                    <DetailRow label="Recipient Email" value={letter.recipient_email} />
                                  )}
                                  <DetailRow label="Executor Name" value={letter.executor_name} />
                                  <DetailRow label="Executor Email" value={letter.executor_email} />
                                  <DetailRow label="Executor Phone" value={letter.executor_phone} />
                                  <DetailRow label="Executor Address" value={letter.executor_address} />
                                  {letter.executor_email && (
                                    <DetailRow
                                      label="Executor Permissions"
                                      value={[
                                        letter.executor_can_view ? "Can view" : null,
                                        letter.executor_can_edit ? "Can edit" : null,
                                        !letter.executor_can_view && !letter.executor_can_edit ? "Release only (cannot view or edit)" : null,
                                      ].filter(Boolean).join(", ")}
                                    />
                                  )}
                                  <DetailRow label="Paid" value={
                                    letter.amount_paid > 0
                                      ? formatCurrency(letter.amount_paid)
                                      : "Included with gift plan"
                                  } />
                                  <DetailRow label="Address" value={
                                    letter.recipients
                                      ? `${letter.recipients.address_line1 || ""}, ${letter.recipients.city || ""}, ${letter.recipients.state || ""} ${letter.recipients.postal_code || ""}`
                                      : null
                                  } />
                                </div>

                                {/* Status update buttons */}
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                                    Update Status
                                  </h4>
                                  <div className="flex flex-wrap gap-1.5">
                                    {["scheduled", "pending_release", "released", "printed", "delivered"].map((s) => (
                                      <button
                                        key={s}
                                        onClick={() => handleUpdateStatus(letter.id, s)}
                                        disabled={letter.status === s}
                                        className={`rounded px-2 py-1 text-xs font-medium transition ${
                                          letter.status === s
                                            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                        }`}
                                      >
                                        {s.replace(/_/g, " ")}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Access Requests Tab ────────────────────────────────────────────────────

function AccessRequestsTab() {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/executor-access");
    const data = await res.json();
    setRequests(data.requests || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  async function handleDecision(id: string, status: "approved" | "denied") {
    setUpdatingId(id);
    const res = await fetch("/api/admin/executor-access", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    if (res.ok) {
      await fetchRequests();
    }
    setUpdatingId(null);
  }

  const filtered =
    statusFilter === "all"
      ? requests
      : requests.filter((r) => r.status === statusFilter);

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    approved: "bg-green-100 text-green-700",
    denied: "bg-red-100 text-red-700",
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-200"
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="denied">Denied</option>
        </select>
        <div className="text-sm text-gray-500 flex items-center">
          {filtered.length} request{filtered.length !== 1 ? "s" : ""}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">
          Loading requests...
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          No access requests found
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => {
            const isExpanded = expandedId === r.id;
            return (
              <div
                key={r.id}
                className="rounded-lg border border-gray-200 bg-white p-4"
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-[240px]">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900">
                        {r.requester_name}
                      </span>
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                          statusColors[r.status] || "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {r.status}
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      {r.requester_email} &middot; {r.requester_relationship}
                    </div>
                    <div className="mt-2 text-sm text-gray-700">
                      Requesting access to{" "}
                      <span className="font-medium text-gray-900">
                        {r.account_holder_name}
                      </span>{" "}
                      <span className="text-gray-500">
                        ({r.account_holder_email})
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-gray-400">
                      Submitted {formatDate(r.created_at.split("T")[0])}
                      {r.reviewed_at && (
                        <>
                          {" "}
                          &middot; Reviewed{" "}
                          {formatDate(r.reviewed_at.split("T")[0])}
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : r.id)}
                      className="rounded bg-gray-50 border border-gray-200 text-gray-600 px-2.5 py-1 text-xs font-medium hover:bg-gray-100 transition"
                    >
                      {isExpanded ? "Hide Reason" : "View Reason"}
                    </button>
                    {r.status === "pending" && (
                      <>
                        <button
                          onClick={() => handleDecision(r.id, "approved")}
                          disabled={updatingId === r.id}
                          className="rounded bg-green-600 text-white px-2.5 py-1 text-xs font-medium hover:bg-green-700 transition disabled:opacity-50"
                        >
                          {updatingId === r.id ? "..." : "Approve"}
                        </button>
                        <button
                          onClick={() => handleDecision(r.id, "denied")}
                          disabled={updatingId === r.id}
                          className="rounded bg-red-600 text-white px-2.5 py-1 text-xs font-medium hover:bg-red-700 transition disabled:opacity-50"
                        >
                          {updatingId === r.id ? "..." : "Deny"}
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      Reason
                    </h4>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {r.reason}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Affiliates Tab ─────────────────────────────────────────────────────────

function AffiliatesTab() {
  const [subTab, setSubTab] = useState<"list" | "referrals">("list");
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [referrals, setReferrals] = useState<AffiliateReferral[]>([]);
  const [totalUnpaid, setTotalUnpaid] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAffiliate, setEditingAffiliate] = useState<Affiliate | null>(null);

  // Referral filters
  const [filterAffiliateId, setFilterAffiliateId] = useState("all");
  const [filterPaid, setFilterPaid] = useState("all");

  const fetchAffiliates = useCallback(async () => {
    const res = await fetch("/api/admin/affiliates");
    const data = await res.json();
    setAffiliates(data.affiliates || []);
  }, []);

  const fetchReferrals = useCallback(async () => {
    const params = new URLSearchParams();
    if (filterAffiliateId !== "all") params.set("affiliate_id", filterAffiliateId);
    if (filterPaid !== "all") params.set("paid", filterPaid);
    const res = await fetch(`/api/admin/affiliates/referrals?${params}`);
    const data = await res.json();
    setReferrals(data.referrals || []);
    setTotalUnpaid(data.totalUnpaid || 0);
  }, [filterAffiliateId, filterPaid]);

  useEffect(() => {
    Promise.all([fetchAffiliates(), fetchReferrals()]).then(() => setLoading(false));
  }, [fetchAffiliates, fetchReferrals]);

  async function handleToggleActive(affiliate: Affiliate) {
    await fetch("/api/admin/affiliates", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: affiliate.id, active: !affiliate.active }),
    });
    fetchAffiliates();
  }

  async function handleMarkPaid(affiliateId: string) {
    await fetch(`/api/admin/affiliates/${affiliateId}/pay`, { method: "POST" });
    fetchAffiliates();
    fetchReferrals();
  }

  function copyLink(code: string) {
    navigator.clipboard.writeText(`https://sendforgood.com?ref=${code}`);
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-400">No affiliates yet.</div>;
  }

  return (
    <div>
      {/* Sub-tabs */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setSubTab("list")}
          className={`text-sm font-medium pb-1 border-b-2 transition ${
            subTab === "list"
              ? "border-gray-900 text-gray-900"
              : "border-transparent text-gray-400 hover:text-gray-600"
          }`}
        >
          Affiliates List
        </button>
        <button
          onClick={() => setSubTab("referrals")}
          className={`text-sm font-medium pb-1 border-b-2 transition ${
            subTab === "referrals"
              ? "border-gray-900 text-gray-900"
              : "border-transparent text-gray-400 hover:text-gray-600"
          }`}
        >
          Referrals Log
        </button>
      </div>

      {subTab === "list" ? (
        <>
          {/* Add Affiliate button */}
          <div className="flex justify-end mb-4">
            <button
              onClick={() => { setEditingAffiliate(null); setShowAddModal(true); }}
              className="rounded-md bg-gray-900 text-white px-4 py-2 text-sm font-medium hover:bg-gray-800 transition"
            >
              + Add Affiliate
            </button>
          </div>

          {/* Affiliates Table */}
          {affiliates.length === 0 ? (
            <div className="text-center py-12 text-gray-400">No affiliates yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                    <th className="pb-3 pr-4">Name</th>
                    <th className="pb-3 pr-4">Email</th>
                    <th className="pb-3 pr-4">Code</th>
                    <th className="pb-3 pr-4">Rates</th>
                    <th className="pb-3 pr-4">Status</th>
                    <th className="pb-3 pr-4">Referrals</th>
                    <th className="pb-3 pr-4">Earned</th>
                    <th className="pb-3 pr-4">Unpaid</th>
                    <th className="pb-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {affiliates.map((a) => (
                    <tr key={a.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 pr-4 font-medium text-gray-900">{a.name}</td>
                      <td className="py-3 pr-4 text-gray-500 text-xs">{a.email}</td>
                      <td className="py-3 pr-4">
                        <code className="bg-gray-100 px-2 py-0.5 rounded text-xs font-mono">{a.code}</code>
                      </td>
                      <td className="py-3 pr-4 text-xs text-gray-600">
                        {a.first_commission_rate}% / {a.repeat_commission_rate}%
                      </td>
                      <td className="py-3 pr-4">
                        <button
                          onClick={() => handleToggleActive(a)}
                          className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium cursor-pointer transition ${
                            a.active
                              ? "bg-green-100 text-green-700 hover:bg-green-200"
                              : "bg-red-100 text-red-700 hover:bg-red-200"
                          }`}
                        >
                          {a.active ? "Active" : "Inactive"}
                        </button>
                      </td>
                      <td className="py-3 pr-4 text-center">{a.referral_count}</td>
                      <td className="py-3 pr-4 font-medium">{formatCurrency(a.total_earned)}</td>
                      <td className="py-3 pr-4">
                        {a.total_unpaid > 0 ? (
                          <span className="text-orange-600 font-medium">{formatCurrency(a.total_unpaid)}</span>
                        ) : (
                          <span className="text-gray-400">$0.00</span>
                        )}
                      </td>
                      <td className="py-3 whitespace-nowrap">
                        <button
                          onClick={() => { setEditingAffiliate(a); setShowAddModal(true); }}
                          className="rounded bg-gray-50 border border-gray-200 text-gray-600 px-2.5 py-1 text-xs font-medium hover:bg-gray-100 transition mr-1"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => copyLink(a.code)}
                          className="rounded bg-blue-50 border border-blue-200 text-blue-600 px-2.5 py-1 text-xs font-medium hover:bg-blue-100 transition mr-1"
                        >
                          Copy Link
                        </button>
                        {a.total_unpaid > 0 && (
                          <button
                            onClick={() => handleMarkPaid(a.id)}
                            className="rounded bg-green-600 text-white px-2.5 py-1 text-xs font-medium hover:bg-green-700 transition"
                          >
                            Mark Paid
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Referrals Log */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4 items-start sm:items-center">
            <select
              value={filterAffiliateId}
              onChange={(e) => setFilterAffiliateId(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="all">All Affiliates</option>
              {affiliates.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
            <select
              value={filterPaid}
              onChange={(e) => setFilterPaid(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="all">All</option>
              <option value="false">Unpaid</option>
              <option value="true">Paid</option>
            </select>
            <div className="ml-auto bg-orange-50 border border-orange-200 rounded-lg px-4 py-2">
              <span className="text-xs text-orange-600 font-medium">Total Unpaid:</span>
              <span className="ml-2 text-sm font-bold text-orange-700">{formatCurrency(totalUnpaid)}</span>
            </div>
          </div>

          {referrals.length === 0 ? (
            <div className="text-center py-12 text-gray-400">No referrals found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                    <th className="pb-3 pr-4">Date</th>
                    <th className="pb-3 pr-4">Affiliate</th>
                    <th className="pb-3 pr-4">Customer</th>
                    <th className="pb-3 pr-4">Order Amount</th>
                    <th className="pb-3 pr-4">Commission</th>
                    <th className="pb-3 pr-4">Type</th>
                    <th className="pb-3">Paid</th>
                  </tr>
                </thead>
                <tbody>
                  {referrals.map((r) => (
                    <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 pr-4 whitespace-nowrap text-gray-500">
                        {formatDate(r.created_at.split("T")[0])}
                      </td>
                      <td className="py-3 pr-4">
                        <span className="font-medium text-gray-900">{r.affiliates?.name || "—"}</span>
                        <span className="ml-1.5 text-xs text-gray-400">({r.affiliates?.code})</span>
                      </td>
                      <td className="py-3 pr-4 text-xs text-gray-600">{r.customer_email}</td>
                      <td className="py-3 pr-4">{formatCurrency(r.amount_paid)}</td>
                      <td className="py-3 pr-4 font-medium">{formatCurrency(r.commission_amount)}</td>
                      <td className="py-3 pr-4">
                        <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          r.referral_type === "first"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-purple-100 text-purple-700"
                        }`}>
                          {r.referral_type === "first" ? "First" : "Repeat"}
                        </span>
                      </td>
                      <td className="py-3">
                        {r.paid ? (
                          <span className="inline-block rounded-full bg-green-100 text-green-700 px-2.5 py-0.5 text-xs font-medium">
                            Paid{r.paid_at ? ` ${formatDate(r.paid_at.split("T")[0])}` : ""}
                          </span>
                        ) : (
                          <span className="inline-block rounded-full bg-yellow-100 text-yellow-700 px-2.5 py-0.5 text-xs font-medium">
                            Unpaid
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Add/Edit Affiliate Modal */}
      {showAddModal && (
        <AffiliateFormModal
          affiliate={editingAffiliate}
          onClose={() => { setShowAddModal(false); setEditingAffiliate(null); }}
          onSaved={() => { setShowAddModal(false); setEditingAffiliate(null); fetchAffiliates(); }}
        />
      )}
    </div>
  );
}

function AffiliateFormModal({
  affiliate,
  onClose,
  onSaved,
}: {
  affiliate: Affiliate | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!affiliate;
  const [name, setName] = useState(affiliate?.name || "");
  const [email, setEmail] = useState(affiliate?.email || "");
  const [code, setCode] = useState(affiliate?.code || "");
  const [codeManuallyEdited, setCodeManuallyEdited] = useState(false);
  const [firstRate, setFirstRate] = useState(affiliate?.first_commission_rate ?? 15);
  const [repeatRate, setRepeatRate] = useState(affiliate?.repeat_commission_rate ?? 10);
  const [notes, setNotes] = useState(affiliate?.notes || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Auto-suggest code from name (only for new affiliates, until user manually edits)
  useEffect(() => {
    if (!isEdit && name && !codeManuallyEdited) {
      setCode(name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
    }
  }, [name, isEdit, codeManuallyEdited]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const res = await fetch("/api/admin/affiliates", {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        isEdit
          ? { id: affiliate.id, name, email, first_commission_rate: firstRate, repeat_commission_rate: repeatRate, notes }
          : { name, email, code, first_commission_rate: firstRate, repeat_commission_rate: repeatRate, notes }
      ),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to save");
      setSaving(false);
      return;
    }

    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {isEdit ? "Edit Affiliate" : "Add Affiliate"}
        </h2>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>
          {!isEdit && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Referral Code * <span className="text-gray-400 font-normal">(lowercase, unique)</span>
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => { setCodeManuallyEdited(true); setCode(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "")); }}
                required
                pattern="[a-z0-9_-]+"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-blue-200"
              />
              <p className="text-xs text-gray-400 mt-1">Link: sendforgood.com?ref={code || "..."}</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Purchase %</label>
              <input
                type="number"
                value={firstRate}
                onChange={(e) => setFirstRate(Number(e.target.value))}
                min={0}
                max={100}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Repeat Purchase %</label>
              <input
                type="number"
                value={repeatRate}
                onChange={(e) => setRepeatRate(Number(e.target.value))}
                min={0}
                max={100}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>
        </div>

        {error && <p className="text-red-500 text-sm mt-3">{error}</p>}

        <div className="flex justify-end gap-2 mt-5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-gray-900 text-white px-4 py-2 text-sm font-medium hover:bg-gray-800 transition disabled:opacity-50"
          >
            {saving ? "Saving..." : isEdit ? "Save Changes" : "Create Affiliate"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Gift Assignments Tab ────────────────────────────────────────────────────

interface GiftAssignment {
  id: string;
  credit_id: string;
  user_id: string;
  recipient_name: string;
  relationship: string;
  is_pet: boolean;
  pet_type: string | null;
  occasion_type: string;
  occasion_date: string;
  scheduled_year: number;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_professional: boolean;
  age: string | null;
  gender: string | null;
  interests: string | null;
  gift_notes: string | null;
  recipient_industry: string | null;
  status: string;
  tracking_number: string | null;
  admin_notes: string | null;
  created_at: string;
  gift_credits: { tier: string; quantity: number; user_id: string } | null;
  profiles: { email: string; full_name: string | null } | null;
}

const TIER_BADGE_COLORS: Record<string, string> = {
  starter: "bg-gray-100 text-gray-700 border-gray-300",
  classic: "bg-green-50 text-green-800 border-green-300",
  premium: "bg-yellow-50 text-yellow-800 border-yellow-400",
  deluxe: "bg-[#1B2A4A] text-white border-[#1B2A4A]",
  legacy: "bg-[#8B6914] text-white border-[#8B6914]",
};

function buildAmazonSearchUrl(tier: string, interests: string | null, occasion: string): string {
  const parts: string[] = [];
  if (tier) parts.push(tier === "starter" ? "" : tier);
  if (interests) parts.push(interests);
  if (occasion) parts.push(occasion.replace(/_/g, " "));
  parts.push("gift");
  const query = parts.filter(Boolean).join(" ").trim();
  return `https://www.amazon.com/s?k=${encodeURIComponent(query)}`;
}

function GiftAssignmentsTab() {
  const [assignments, setAssignments] = useState<GiftAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [trackingInputs, setTrackingInputs] = useState<Record<string, string>>({});
  const [notesInputs, setNotesInputs] = useState<Record<string, string>>({});
  const [showNotesFor, setShowNotesFor] = useState<string | null>(null);
  const [clickedOrderNow, setClickedOrderNow] = useState<Set<string>>(new Set());

  const fetchAssignments = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/gift-assignments");
    const data = await res.json();
    setAssignments(data.assignments || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  async function handleUpdate(id: string, payload: Record<string, string>) {
    setUpdatingId(id);
    const res = await fetch("/api/admin/gift-assignments", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...payload }),
    });
    if (res.ok) {
      await fetchAssignments();
    }
    setUpdatingId(null);
  }

  // Group assignments by urgency
  const needsAction: GiftAssignment[] = [];
  const upcoming: GiftAssignment[] = [];
  const scheduled: GiftAssignment[] = [];
  const fulfilled: GiftAssignment[] = [];

  for (const a of assignments) {
    if (a.status === "fulfilled" || a.status === "completed") {
      fulfilled.push(a);
      continue;
    }
    const days = daysUntil(a.occasion_date);
    if (days <= 30 && (a.status === "pending" || a.status === "ordered")) {
      needsAction.push(a);
    } else if (days > 30 && days <= 90) {
      upcoming.push(a);
    } else if (days > 90) {
      scheduled.push(a);
    } else {
      // Overdue items also go to needs action
      needsAction.push(a);
    }
  }

  const assignmentStatusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    ordered: "bg-blue-100 text-blue-700",
    fulfilled: "bg-green-100 text-green-700",
    active: "bg-blue-100 text-blue-700",
    completed: "bg-green-100 text-green-700",
  };

  function renderCard(a: GiftAssignment, urgency: "urgent" | "upcoming" | "scheduled" | "fulfilled") {
    const days = daysUntil(a.occasion_date);
    const tier = a.gift_credits?.tier || "starter";
    const borderClass =
      urgency === "urgent"
        ? days < 0 ? "border-l-4 border-l-red-500" : "border-l-4 border-l-amber-500"
        : urgency === "upcoming"
          ? "border-l-4 border-l-yellow-400"
          : urgency === "fulfilled"
            ? "border-l-4 border-l-green-400"
            : "border-l-4 border-l-gray-300";

    return (
      <div key={a.id} className={`bg-white rounded-lg border border-gray-200 ${borderClass} p-5 mb-4 shadow-sm`}>
        {/* Header row */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${TIER_BADGE_COLORS[tier] || TIER_BADGE_COLORS.starter}`}>
            {tier}
          </span>
          <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${assignmentStatusColors[a.status] || "bg-gray-100 text-gray-700"}`}>
            {a.status}
          </span>
          <span className={`ml-auto text-sm font-bold ${days < 0 ? "text-red-600" : days <= 14 ? "text-amber-600" : days <= 30 ? "text-yellow-600" : "text-gray-500"}`}>
            {days < 0 ? `${Math.abs(days)}d OVERDUE` : `${days}d until delivery`}
          </span>
        </div>

        {/* Main info grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          {/* Recipient */}
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Recipient</h4>
            <p className="font-medium text-gray-900">
              {a.recipient_name}
              {a.is_pet && <span className="ml-1 text-xs text-gray-400">(Pet: {a.pet_type || "pet"})</span>}
            </p>
            <p className="text-gray-500">{a.relationship || "N/A"}</p>
            <p className="text-gray-500 mt-1">
              {capitalize(a.occasion_type)} &middot; {a.occasion_date ? formatDate(a.occasion_date) : "—"}
            </p>
          </div>

          {/* Address */}
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Delivery Address</h4>
            {a.address_line1 ? (
              <div className="text-gray-700 space-y-0.5">
                <p>{a.address_line1}</p>
                {a.address_line2 && <p>{a.address_line2}</p>}
                <p>{a.city}, {a.state} {a.postal_code}</p>
                <p>{a.country || "US"}</p>
              </div>
            ) : (
              <p className="text-gray-400">No address</p>
            )}
          </div>

          {/* Interests / Notes */}
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Gift Details</h4>
            <div className="space-y-1">
              {a.interests && <p className="text-gray-700"><span className="text-gray-400">Interests:</span> {a.interests}</p>}
              {a.gift_notes && <p className="text-gray-700"><span className="text-gray-400">Notes:</span> {a.gift_notes}</p>}
              {a.age && <p className="text-gray-700"><span className="text-gray-400">Age:</span> {a.age}</p>}
              {a.gender && <p className="text-gray-700"><span className="text-gray-400">Gender:</span> {a.gender}</p>}
              {a.is_professional && a.recipient_industry && (
                <p className="text-gray-700"><span className="text-gray-400">Industry:</span> {a.recipient_industry}</p>
              )}
            </div>
          </div>
        </div>

        {/* Customer info */}
        <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap gap-x-6 gap-y-1 text-xs text-gray-500">
          <span>Customer: <strong className="text-gray-700">{a.profiles?.full_name || "—"}</strong></span>
          <span>Email: <a href={`mailto:${a.profiles?.email}`} className="text-blue-600 underline">{a.profiles?.email || "—"}</a></span>
          <span>Year {a.scheduled_year} &middot; Created {formatDate(a.created_at.split("T")[0])}</span>
          {a.tracking_number && <span>Tracking: <strong className="text-gray-700">{a.tracking_number}</strong></span>}
          {a.admin_notes && <span>Notes: <em className="text-gray-600">{a.admin_notes}</em></span>}
        </div>

        {/* Action buttons */}
        {urgency === "urgent" && (
          <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap items-center gap-3">
            {a.status === "pending" && (
              <>
                <button
                  onClick={() => {
                    window.open(buildAmazonSearchUrl(tier, a.interests, a.occasion_type), "_blank");
                    setClickedOrderNow((prev) => new Set(prev).add(a.id));
                  }}
                  className="rounded-lg bg-[#FF9900] text-white px-4 py-2 text-sm font-bold hover:bg-[#e68a00] transition shadow-sm"
                >
                  Order Now (Amazon)
                </button>
                {clickedOrderNow.has(a.id) && (
                  <button
                    onClick={() => handleUpdate(a.id, { status: "ordered" })}
                    disabled={updatingId === a.id}
                    className="rounded-lg bg-blue-600 text-white px-4 py-2 text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    {updatingId === a.id ? "..." : "Mark as Ordered"}
                  </button>
                )}
              </>
            )}

            {(a.status === "pending" || a.status === "ordered") && (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Tracking # (optional)"
                  value={trackingInputs[a.id] || ""}
                  onChange={(e) => setTrackingInputs((prev) => ({ ...prev, [a.id]: e.target.value }))}
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-sm w-48 outline-none focus:ring-2 focus:ring-green-200"
                />
                <button
                  onClick={() => handleUpdate(a.id, {
                    status: "fulfilled",
                    ...(trackingInputs[a.id] ? { tracking_number: trackingInputs[a.id] } : {}),
                  })}
                  disabled={updatingId === a.id}
                  className="rounded-lg bg-green-600 text-white px-4 py-2 text-sm font-medium hover:bg-green-700 transition disabled:opacity-50"
                >
                  {updatingId === a.id ? "..." : "Mark Fulfilled"}
                </button>
              </div>
            )}
          </div>
        )}

        {urgency === "upcoming" && (
          <div className="mt-4 pt-3 border-t border-gray-100">
            {showNotesFor === a.id ? (
              <div className="flex items-start gap-2">
                <textarea
                  placeholder="Planning notes..."
                  value={notesInputs[a.id] || a.admin_notes || ""}
                  onChange={(e) => setNotesInputs((prev) => ({ ...prev, [a.id]: e.target.value }))}
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm flex-1 outline-none focus:ring-2 focus:ring-yellow-200 min-h-[60px]"
                />
                <button
                  onClick={async () => {
                    await handleUpdate(a.id, { admin_notes: notesInputs[a.id] || "" });
                    setShowNotesFor(null);
                  }}
                  disabled={updatingId === a.id}
                  className="rounded-lg bg-yellow-500 text-white px-4 py-2 text-sm font-medium hover:bg-yellow-600 transition disabled:opacity-50"
                >
                  {updatingId === a.id ? "..." : "Save Notes"}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setShowNotesFor(a.id);
                    setNotesInputs((prev) => ({ ...prev, [a.id]: a.admin_notes || "" }));
                  }}
                  className="rounded-lg bg-yellow-100 text-yellow-800 border border-yellow-300 px-4 py-2 text-sm font-medium hover:bg-yellow-200 transition"
                >
                  Start Planning
                </button>
                <button
                  onClick={() => {
                    window.open(buildAmazonSearchUrl(tier, a.interests, a.occasion_type), "_blank");
                  }}
                  className="rounded-lg bg-gray-100 text-gray-600 border border-gray-200 px-4 py-2 text-sm font-medium hover:bg-gray-200 transition"
                >
                  Preview Amazon Search
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-400">Loading assignments...</div>;
  }

  if (assignments.length === 0) {
    return <div className="text-center py-12 text-gray-400">No gift assignments found</div>;
  }

  return (
    <div className="space-y-8">
      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-red-700">{needsAction.length}</div>
          <div className="text-xs text-red-600 font-medium">Needs Action</div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-yellow-700">{upcoming.length}</div>
          <div className="text-xs text-yellow-600 font-medium">Upcoming</div>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-700">{scheduled.length}</div>
          <div className="text-xs text-gray-500 font-medium">Scheduled</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-green-700">{fulfilled.length}</div>
          <div className="text-xs text-green-600 font-medium">Fulfilled</div>
        </div>
      </div>

      {/* Needs Action */}
      {needsAction.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-red-700 mb-3 flex items-center gap-2">
            Needs Action <span className="text-sm font-normal text-red-500">(due within 30 days)</span>
          </h3>
          {needsAction.map((a) => renderCard(a, "urgent"))}
        </div>
      )}

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-yellow-700 mb-3 flex items-center gap-2">
            Upcoming <span className="text-sm font-normal text-yellow-500">(31–90 days)</span>
          </h3>
          {upcoming.map((a) => renderCard(a, "upcoming"))}
        </div>
      )}

      {/* Scheduled */}
      {scheduled.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-gray-700 mb-3 flex items-center gap-2">
            Scheduled <span className="text-sm font-normal text-gray-400">(90+ days)</span>
          </h3>
          {scheduled.map((a) => renderCard(a, "scheduled"))}
        </div>
      )}

      {/* Fulfilled */}
      {fulfilled.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-green-700 mb-3 flex items-center gap-2">
            Fulfilled <span className="text-sm font-normal text-green-500">({fulfilled.length} completed)</span>
          </h3>
          {fulfilled.map((a) => renderCard(a, "fulfilled"))}
        </div>
      )}
    </div>
  );
}

// ─── Main Dashboard ──────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [authed, setAuthed] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [tab, setTab] = useState<
    "shipments" | "orders" | "letters" | "access" | "affiliates" | "gift-assignments"
  >("shipments");
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [letters, setLetters] = useState<AdminLetter[]>([]);
  const [loading, setLoading] = useState(true);

  // Check existing session
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (sessionStorage.getItem(SESSION_KEY) === "true") {
        setAuthed(true);
      }
      setCheckingAuth(false);
    }
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    // Fetch each independently with timeout so one slow API doesn't block others
    const timeout = (ms: number) => new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), ms));
    
    const safeJson = async (url: string) => {
      try {
        const res = await Promise.race([fetch(url), timeout(8000)]) as Response;
        return await res.json();
      } catch { return null; }
    };

    setLoading(false); // Show dashboard immediately
    
    // Load data in parallel, each independently
    safeJson("/api/admin/shipments").then(d => { if (d?.shipments) setShipments(d.shipments); });
    safeJson("/api/admin/orders").then(d => { if (d?.orders) setOrders(d.orders); });
    safeJson("/api/admin/letters").then(d => { if (d?.letters) setLetters(d.letters); });
  }, []);

  useEffect(() => {
    if (authed) fetchData();
  }, [authed, fetchData]);

  if (checkingAuth) return null;
  if (!authed) return <PasswordGate onAuth={() => setAuthed(true)} />;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">
              SendForGood Admin
            </h1>
            <p className="text-xs text-gray-400">
              Fulfillment Dashboard
            </p>
          </div>
          <button
            onClick={() => {
              sessionStorage.removeItem(SESSION_KEY);
              setAuthed(false);
            }}
            className="text-xs text-gray-400 hover:text-gray-600 transition"
          >
            Sign Out
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-20 text-gray-400">
            Loading dashboard...
          </div>
        ) : (
          <>
            {/* Stats */}
            <StatsBar orders={orders} shipments={shipments} letters={letters} />

            {/* Tabs */}
            <div className="flex gap-1 mb-6 border-b border-gray-200">
              <button
                onClick={() => setTab("shipments")}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition -mb-px ${
                  tab === "shipments"
                    ? "border-gray-900 text-gray-900"
                    : "border-transparent text-gray-400 hover:text-gray-600"
                }`}
              >
                Upcoming Shipments
              </button>
              <button
                onClick={() => setTab("orders")}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition -mb-px ${
                  tab === "orders"
                    ? "border-gray-900 text-gray-900"
                    : "border-transparent text-gray-400 hover:text-gray-600"
                }`}
              >
                All Orders
              </button>
              <button
                onClick={() => setTab("letters")}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition -mb-px ${
                  tab === "letters"
                    ? "border-gray-900 text-gray-900"
                    : "border-transparent text-gray-400 hover:text-gray-600"
                }`}
              >
                Messages
                {letters.length > 0 && (
                  <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-100 px-1.5 text-xs font-bold text-indigo-700">
                    {letters.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setTab("access")}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition -mb-px ${
                  tab === "access"
                    ? "border-gray-900 text-gray-900"
                    : "border-transparent text-gray-400 hover:text-gray-600"
                }`}
              >
                Access Requests
              </button>
              <button
                onClick={() => setTab("affiliates")}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition -mb-px ${
                  tab === "affiliates"
                    ? "border-gray-900 text-gray-900"
                    : "border-transparent text-gray-400 hover:text-gray-600"
                }`}
              >
                Affiliates
              </button>
              <button
                onClick={() => setTab("gift-assignments")}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition -mb-px ${
                  tab === "gift-assignments"
                    ? "border-gray-900 text-gray-900"
                    : "border-transparent text-gray-400 hover:text-gray-600"
                }`}
              >
                Gift Assignments
              </button>
            </div>

            {/* Content */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
              {tab === "shipments" ? (
                <ShipmentsTab
                  shipments={shipments}
                  onRefresh={fetchData}
                />
              ) : tab === "letters" ? (
                <LettersTab
                  letters={letters}
                  onRefresh={fetchData}
                />
              ) : tab === "access" ? (
                <AccessRequestsTab />
              ) : tab === "affiliates" ? (
                <AffiliatesTab />
              ) : tab === "gift-assignments" ? (
                <GiftAssignmentsTab />
              ) : (
                <OrdersTab />
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

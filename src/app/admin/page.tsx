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
}: {
  orders: Order[];
  shipments: Shipment[];
}) {
  const activeOrders = orders.filter((o) => o.status === "active").length;

  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();
  const nextMonth = thisMonth === 11 ? 0 : thisMonth + 1;
  const nextMonthYear = thisMonth === 11 ? thisYear + 1 : thisYear;

  const pendingShipments = shipments.filter((s) => s.status === "pending");

  const dueThisMonth = pendingShipments.filter((s) => {
    const d = new Date(s.scheduled_date + "T00:00:00");
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  }).length;

  const dueNextMonth = pendingShipments.filter((s) => {
    const d = new Date(s.scheduled_date + "T00:00:00");
    return d.getMonth() === nextMonth && d.getFullYear() === nextMonthYear;
  }).length;

  const totalRevenue = orders.reduce((sum, o) => sum + o.amount_paid, 0);

  const stats = [
    { label: "Active Orders", value: activeOrders },
    { label: "Due This Month", value: dueThisMonth },
    { label: "Due Next Month", value: dueNextMonth },
    { label: "Total Revenue", value: formatCurrency(totalRevenue) },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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
                        <td colSpan={7} className="p-0">
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
                                  <DetailRow label="Paid" value={formatCurrency(letter.amount_paid)} />
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

// ─── Main Dashboard ──────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [authed, setAuthed] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [tab, setTab] = useState<"shipments" | "orders" | "letters">("shipments");
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
    const [shipmentsRes, ordersRes, lettersRes] = await Promise.all([
      fetch("/api/admin/shipments"),
      fetch("/api/admin/orders"),
      fetch("/api/admin/letters"),
    ]);
    const shipmentsData = await shipmentsRes.json();
    const ordersData = await ordersRes.json();
    const lettersData = await lettersRes.json();
    setShipments(shipmentsData.shipments || []);
    setOrders(ordersData.orders || []);
    setLetters(lettersData.letters || []);
    setLoading(false);
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
            <StatsBar orders={orders} shipments={shipments} />

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
                Legacy Letters
                {letters.length > 0 && (
                  <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-100 px-1.5 text-xs font-bold text-indigo-700">
                    {letters.length}
                  </span>
                )}
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

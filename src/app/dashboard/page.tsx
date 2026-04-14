"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { TIERS } from "@/lib/constants";
import ManagePlanModal from "@/components/manage-plan-modal";

interface Shipment {
  id: string;
  scheduled_date: string;
  status: string;
  tracking_number: string | null;
  photo_url?: string | null;
}

interface Order {
  id: string;
  tier: string;
  years_purchased: number;
  years_remaining: number;
  amount_paid: number;
  status: string;
  created_at: string;
  stripe_payment_intent_id: string;
  recipient_id: string;
  executor_name?: string | null;
  executor_email?: string | null;
  executor_phone?: string | null;
  executor_address?: string | null;
  recipients: {
    name: string;
    relationship: string;
    age?: string;
    gender?: string;
    interests?: string;
    card_message?: string;
    gift_notes?: string;
    pet_type?: string;
    photo_url?: string;
    address_line1?: string;
    address_line2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
  occasions: {
    type: string;
    label: string;
    occasion_date: string;
  };
  shipments: Shipment[];
}

interface RefundRequest {
  id: string;
  order_id: string;
  status: string;
}

interface Letter {
  id: string;
  letter_type: "annual" | "milestone";
  title: string;
  content: string;
  scheduled_date: string | null;
  milestone_label: string | null;
  status: string;
  amount_paid: number;
  executor_email: string | null;
  created_at: string;
  updated_at: string;
  recipients: {
    name: string;
    relationship: string;
  };
}

interface MemoryRequest {
  id: string;
  title: string;
  occasion: string;
  delivery_date: string;
  unique_code: string;
  status: string;
  recording_count?: number;
  memory_recordings?: { id: string }[];
  created_at: string;
}

function formatShipmentDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function getNextPendingShipment(shipments: Shipment[]): Shipment | null {
  return (
    shipments
      .filter((s) => s.status === "pending")
      .sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date))[0] ??
    null
  );
}

function getNextPausedShipment(shipments: Shipment[]): Shipment | null {
  return (
    shipments
      .filter((s) => s.status === "paused")
      .sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date))[0] ??
    null
  );
}

function getTierBadgeClasses(tierId: string): string {
  switch (tierId) {
    case "starter":
      return "bg-warm-gray-light/20 text-warm-gray";
    case "classic":
      return "bg-forest/10 text-forest";
    case "premium":
      return "bg-gold/20 text-gold-dark";
    case "deluxe":
      return "bg-navy/10 text-navy";
    case "legacy":
      return "bg-gold-dark/20 text-gold-dark";
    default:
      return "bg-warm-gray-light/20 text-warm-gray";
  }
}

function getStatusBadgeClasses(status: string): string {
  switch (status) {
    case "active":
      return "bg-forest/10 text-forest";
    case "paused":
      return "bg-gold/20 text-gold-dark";
    case "cancelled":
      return "bg-red-100 text-red-700";
    case "completed":
      return "bg-navy/10 text-navy";
    default:
      return "bg-warm-gray-light/20 text-warm-gray";
  }
}

function getTierName(tierId: string): string {
  const tier = TIERS.find((t) => t.id === tierId);
  return tier ? tier.name : tierId;
}

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();

  const [orders, setOrders] = useState<Order[]>([]);
  const [letters, setLetters] = useState<Letter[]>([]);
  const [refundRequests, setRefundRequests] = useState<RefundRequest[]>([]);
  const [userEmail, setUserEmail] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [managingOrder, setManagingOrder] = useState<Order | null>(null);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  const [memoryRequests, setMemoryRequests] = useState<MemoryRequest[]>([]);
  const [vaultCredits, setVaultCredits] = useState<{audioCredits: number; videoCredits: number; audioUsed: number; videoUsed: number} | null>(null);
  const [phone, setPhone] = useState("");
  const [phoneSaving, setPhoneSaving] = useState(false);
  const [phoneSaved, setPhoneSaved] = useState(false);

  const activeOrders = orders.filter((o) => o.status === "active");
  const uniqueRecipients = new Set(orders.map((o) => o.recipients?.name)).size;
  const deliveredCount = orders.reduce(
    (count, o) => count + (o.shipments?.filter((s) => s.status === "delivered").length ?? 0),
    0
  );

  const loadDashboard = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/auth");
      return;
    }

    setUserEmail(user.email ?? "");

    // Load phone from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("phone")
      .eq("id", user.id)
      .single();
    if (profile?.phone) setPhone(profile.phone);

    const [ordersResult, refundsResult, lettersResult] = await Promise.all([
      supabase
        .from("orders")
        .select("*, recipients(*), occasions(*), shipments(id, scheduled_date, status, tracking_number, photo_url)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("refund_requests")
        .select("id, order_id, status")
        .eq("user_id", user.id)
        .eq("status", "pending"),
      supabase
        .from("letters")
        .select("*, recipients(name, relationship)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
    ]);

    if (!ordersResult.error && ordersResult.data) {
      setOrders(ordersResult.data as Order[]);
    }

    if (!refundsResult.error && refundsResult.data) {
      setRefundRequests(refundsResult.data as RefundRequest[]);
    }

    if (!lettersResult.error && lettersResult.data) {
      setLetters(lettersResult.data as Letter[]);
    }

    // Show dashboard immediately, load memory requests in background
    setLoading(false);

    try {
      const { data: memData } = await supabase
        .from("memory_requests")
        .select("*, memory_recordings(id)")
        .eq("requester_id", user.id)
        .order("created_at", { ascending: false });
      if (memData) setMemoryRequests(memData);
    } catch {
      // silently fail
    }

    // Fetch vault credits directly from Supabase
    try {
      const { data: creditsData } = await supabase.from('memory_credits').select('audio_credits, video_credits').eq('user_id', user.id);
      const totalAudio = (creditsData || []).reduce((sum: number, c: { audio_credits: number | null }) => sum + (c.audio_credits || 0), 0);
      const totalVideo = (creditsData || []).reduce((sum: number, c: { video_credits: number | null }) => sum + (c.video_credits || 0), 0);
      setVaultCredits({ audioCredits: totalAudio, videoCredits: totalVideo, audioUsed: 0, videoUsed: 0 });
    } catch { /* silently fail */ }
  }, [supabase, router]);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
  }

  async function handleSavePhone() {
    setPhoneSaving(true);
    setPhoneSaved(false);
    try {
      const res = await fetch("/api/account/phone", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      if (res.ok) setPhoneSaved(true);
    } catch {
      // silently fail
    }
    setPhoneSaving(false);
  }

  async function handleCancelOrder(orderId: string) {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this gift plan? This cannot be undone."
    );
    if (!confirmed) return;

    setCancellingId(orderId);

    const { error } = await supabase
      .from("orders")
      .update({ status: "cancelled" })
      .eq("id", orderId);

    if (!error) {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: "cancelled" } : o))
      );
    }

    setCancellingId(null);
  }

  function handleOrderUpdated() {
    loadDashboard();
    // Also refresh the managing order if it's open
    if (managingOrder) {
      const refreshed = orders.find((o) => o.id === managingOrder.id);
      if (refreshed) setManagingOrder(refreshed);
    }
  }

  function hasRefundRequest(orderId: string): boolean {
    return refundRequests.some((r) => r.order_id === orderId);
  }

  // ---------------------------------------------------------------------------
  // Loading skeleton
  // ---------------------------------------------------------------------------
  if (loading) {
    return (
      <div className="min-h-screen bg-cream">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
          {/* Header skeleton */}
          <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="h-8 w-48 animate-pulse rounded bg-cream-dark" />
              <div className="mt-2 h-4 w-32 animate-pulse rounded bg-cream-dark" />
            </div>
            <div className="flex gap-3">
              <div className="h-10 w-24 animate-pulse rounded-lg bg-cream-dark" />
              <div className="h-10 w-36 animate-pulse rounded-lg bg-cream-dark" />
            </div>
          </div>

          {/* Stats skeleton */}
          <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-xl border border-cream-dark bg-white p-6"
              >
                <div className="h-4 w-24 animate-pulse rounded bg-cream-dark" />
                <div className="mt-3 h-8 w-12 animate-pulse rounded bg-cream-dark" />
              </div>
            ))}
          </div>

          {/* Order cards skeleton */}
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-xl border border-cream-dark bg-white p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-3">
                    <div className="h-5 w-40 animate-pulse rounded bg-cream-dark" />
                    <div className="h-4 w-56 animate-pulse rounded bg-cream-dark" />
                    <div className="h-4 w-32 animate-pulse rounded bg-cream-dark" />
                  </div>
                  <div className="h-6 w-16 animate-pulse rounded-full bg-cream-dark" />
                </div>
                <div className="mt-5 h-2 w-full animate-pulse rounded-full bg-cream-dark" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Empty state
  // ---------------------------------------------------------------------------
  if (orders.length === 0) {
    return (
      <div className="min-h-screen bg-cream">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-navy">Your Gift Plans</h1>
              {userEmail && (
                <p className="mt-1 text-sm text-warm-gray">{userEmail}</p>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleSignOut}
                className="rounded-lg border border-cream-dark px-4 py-2 text-sm font-medium text-warm-gray transition-colors hover:bg-cream-dark"
              >
                Sign Out
              </button>
              <Link
                href="/send"
                className="rounded-lg bg-forest px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-forest-light"
              >
                Send a New Gift
              </Link>
            </div>
          </div>

          {/* Empty state card */}
          <div className="flex flex-col items-center justify-center rounded-2xl border border-cream-dark bg-white py-20 text-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gold/10">
              <svg
                className="h-10 w-10 text-gold"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 11.25v8.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 1 0 9.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1 1 14.625 7.5H12m0 0V21m-8.25-9.75h16.5"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-navy">
              No gift plans yet
            </h2>
            <p className="mt-2 max-w-sm text-warm-gray">
              Start your first gift plan and make someone&apos;s year, every
              year.
            </p>
            <Link
              href="/send"
              className="mt-8 inline-flex items-center rounded-lg bg-forest px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-forest-light"
            >
              Start Sending
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Main dashboard
  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-cream">
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Page header */}
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-navy">Your Gift Plans</h1>
            {userEmail && (
              <p className="mt-1 text-sm text-warm-gray">{userEmail}</p>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleSignOut}
              className="rounded-lg border border-cream-dark px-4 py-2 text-sm font-medium text-warm-gray transition-colors hover:bg-cream-dark"
            >
              Sign Out
            </button>
            <Link
              href="/send"
              className="rounded-lg bg-forest px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-forest-light"
            >
              Send a New Gift
            </Link>
          </div>
        </div>

        {/* Stats bar */}
        <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-cream-dark bg-white p-6">
            <p className="text-sm font-medium text-warm-gray">Active Plans</p>
            <p className="mt-1 text-3xl font-bold text-navy">
              {activeOrders.length}
            </p>
          </div>
          <div className="rounded-xl border border-cream-dark bg-white p-6">
            <p className="text-sm font-medium text-warm-gray">
              Total Recipients
            </p>
            <p className="mt-1 text-3xl font-bold text-navy">
              {uniqueRecipients}
            </p>
          </div>
          <div className="rounded-xl border border-cream-dark bg-white p-6">
            <p className="text-sm font-medium text-warm-gray">
              Gifts Delivered
            </p>
            <p className="mt-1 text-3xl font-bold text-navy">
              {deliveredCount}
            </p>
          </div>
        </div>

        {/* Orders list */}
        <div className="space-y-4">
          {orders.map((order) => {
            const yearsUsed = order.years_purchased - order.years_remaining;
            const progressPercent =
              order.years_purchased > 0
                ? (yearsUsed / order.years_purchased) * 100
                : 0;
            const tierName = getTierName(order.tier);
            const sortedShipments = [...(order.shipments ?? [])].sort((a, b) =>
              a.scheduled_date.localeCompare(b.scheduled_date)
            );
            const nextPending = getNextPendingShipment(order.shipments ?? []);
            const nextPaused = getNextPausedShipment(order.shipments ?? []);
            const orderHasRefund = hasRefundRequest(order.id);

            return (
              <div
                key={order.id}
                className="rounded-xl border border-cream-dark bg-white p-6 transition-shadow hover:shadow-md"
              >
                {/* Top row: recipient + badges */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-semibold text-navy">
                      {order.recipients?.name ?? "Unknown Recipient"}
                    </h3>
                    <p className="mt-1 text-sm text-warm-gray">
                      {order.occasions?.label ?? order.occasions?.type ?? "\u2014"}
                      {order.recipients?.relationship && (
                        <span className="ml-2 text-warm-gray-light">
                          &middot; {order.recipients.relationship}
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Tier badge */}
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${getTierBadgeClasses(order.tier)}`}
                    >
                      {tierName}
                    </span>

                    {/* Status badge */}
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium capitalize ${getStatusBadgeClasses(order.status)}`}
                    >
                      {order.status}
                    </span>

                    {/* Paused shipment badge */}
                    {nextPaused && (
                      <span className="inline-flex items-center rounded-full bg-gold/20 px-3 py-1 text-xs font-medium text-gold-dark">
                        Next delivery paused
                      </span>
                    )}

                    {/* Pending refund badge */}
                    {orderHasRefund && (
                      <span className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">
                        Refund pending
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress section */}
                <div className="mt-5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-warm-gray">
                      {order.years_remaining} of {order.years_purchased} year
                      {order.years_purchased !== 1 ? "s" : ""} remaining
                    </span>
                    {nextPending && order.status === "active" && (
                      <span className="text-warm-gray">
                        Next delivery:{" "}
                        <span className="font-medium text-navy">
                          {formatShipmentDate(nextPending.scheduled_date)}
                        </span>
                      </span>
                    )}
                  </div>

                  {/* Progress bar */}
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-cream-dark">
                    <div
                      className="h-full rounded-full bg-forest transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Shipment timeline */}
                {sortedShipments.length > 0 && (
                  <div className="mt-4 border-t border-cream-dark pt-4">
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-warm-gray">
                      Shipments
                    </p>
                    <ul className="space-y-2">
                      {sortedShipments.map((shipment, idx) => (
                        <li key={shipment.id}>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-warm-gray">
                              Year {idx + 1}: {formatShipmentDate(shipment.scheduled_date)}
                            </span>
                            <span
                              className={
                                shipment.status === "delivered"
                                  ? "font-medium text-forest"
                                  : shipment.status === "shipped"
                                    ? "font-medium text-navy"
                                    : shipment.status === "paused"
                                      ? "font-medium text-gold-dark"
                                      : "text-warm-gray"
                              }
                            >
                              {shipment.status === "delivered"
                                ? "Delivered \u2713"
                                : shipment.status === "shipped"
                                  ? "Shipped \u2713"
                                  : shipment.status === "paused"
                                    ? "Paused"
                                    : "Pending"}
                            </span>
                          </div>
                          {shipment.photo_url && (
                            <button
                              onClick={() => setPreviewPhoto(shipment.photo_url!)}
                              className="mt-1.5 flex items-center gap-2 rounded-lg border border-cream-dark bg-cream/40 px-3 py-2 transition hover:border-gold/50 hover:bg-cream"
                            >
                              <Image
                                src={shipment.photo_url}
                                alt="Gift preview"
                                width={40}
                                height={40}
                                className="h-10 w-10 rounded-md object-cover"
                                unoptimized
                              />
                              <span className="text-xs font-medium text-navy">
                                Gift Preview 📸
                              </span>
                            </button>
                          )}
                          {shipment.status === "pending" && (
                            <p className="mt-1 text-xs text-warm-gray-light">
                              📬 We will contact you 2 weeks before this ships to confirm delivery details.
                            </p>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Actions */}
                {order.status === "active" && (
                  <div className="mt-5 flex items-center justify-end gap-3 border-t border-cream-dark pt-4">
                    <button
                      onClick={() => setManagingOrder(order)}
                      className="rounded-lg border-2 border-navy px-4 py-2 text-sm font-semibold text-navy transition-colors hover:bg-navy hover:text-cream"
                    >
                      Manage Plan
                    </button>
                    <button
                      onClick={() => handleCancelOrder(order.id)}
                      disabled={cancellingId === order.id}
                      className="rounded-lg px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {cancellingId === order.id
                        ? "Cancelling..."
                        : "Cancel Plan"}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* My Letters Section */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-navy">My Letters</h2>
            <Link
              href="/letters"
              className="rounded-lg bg-gold px-4 py-2 text-sm font-medium text-navy transition-colors hover:bg-gold-light"
            >
              + Add Letter
            </Link>
          </div>

          {letters.length === 0 ? (
            <div className="rounded-xl border border-cream-dark bg-white p-8 text-center">
              <p className="text-warm-gray">
                No letters yet. Add a letter add-on to any gift plan, or purchase letters standalone.{" "}
                <Link href="/letters" className="font-medium text-navy underline hover:text-gold">
                  Browse letters
                </Link>
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {letters.map((letter) => {
                const statusMap: Record<string, { label: string; classes: string }> = {
                  draft: { label: "Not written yet", classes: "bg-yellow-100 text-yellow-800" },
                  scheduled: { label: "Scheduled", classes: "bg-green-100 text-green-800" },
                  pending_release: { label: "In Vault", classes: "bg-blue-100 text-blue-800" },
                  released: { label: "Released", classes: "bg-purple-100 text-purple-800" },
                  printed: { label: "Being prepared", classes: "bg-orange-100 text-orange-800" },
                  delivered: { label: "Delivered", classes: "bg-green-100 text-green-800" },
                };
                const statusInfo = statusMap[letter.status] ?? { label: letter.status, classes: "bg-gray-100 text-gray-700" };
                const hasContent = !!letter.content;

                return (
                  <div
                    key={letter.id}
                    className="rounded-xl border border-cream-dark bg-white p-6 transition-shadow hover:shadow-md"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-lg font-semibold text-navy">
                          {letter.title || "Untitled Letter"}
                        </h3>
                        <p className="mt-1 text-sm text-warm-gray">
                          To: {letter.recipients?.name || "Unknown"}{" "}
                          {letter.recipients?.relationship && (
                            <span className="text-warm-gray-light">
                              &middot; {letter.recipients.relationship}
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                          letter.letter_type === "annual"
                            ? "bg-navy/10 text-navy"
                            : "bg-gold/20 text-gold-dark"
                        }`}>
                          {letter.letter_type === "annual" ? "Annual" : "Milestone"}
                        </span>
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${statusInfo.classes}`}>
                          {statusInfo.label}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-4 flex items-center justify-end gap-3 border-t border-cream-dark pt-4">
                      {/* Release button for milestone letters that are written */}
                      {letter.letter_type === "milestone" && letter.status === "pending_release" && (
                        <button
                          type="button"
                          onClick={async () => {
                            if (!confirm("Are you sure you want to release this letter? It will be sent to the recipient.")) return;
                            await fetch(`/api/letters/release`, {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ letterId: letter.id }),
                            });
                            window.location.reload();
                          }}
                          className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-navy transition-colors hover:bg-gold-light"
                        >
                          Release Now
                        </button>
                      )}
                      {hasContent ? (
                        <Link
                          href={`/letters/edit/${letter.id}`}
                          className="rounded-lg border-2 border-navy px-4 py-2 text-sm font-semibold text-navy transition-colors hover:bg-navy hover:text-cream"
                        >
                          Edit
                        </Link>
                      ) : (
                        <Link
                          href={`/letters/edit/${letter.id}`}
                          className="rounded-lg bg-forest px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-forest-light"
                        >
                          Write Letter
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* My Memory Vaults */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-navy">My Memory Vaults</h2>
            <div className="flex gap-2">
              <Link
                href="/vault/buy"
                className="rounded-lg border border-cream-dark px-4 py-2 text-sm font-medium text-warm-gray transition-colors hover:bg-cream-dark"
              >
                Buy Credits
              </Link>
              <Link
                href="/vault/my"
                className="rounded-lg bg-gold px-4 py-2 text-sm font-medium text-navy transition-colors hover:bg-gold-light"
              >
                View All Vaults
              </Link>
            </div>
          </div>

          <div className="rounded-xl border border-cream-dark bg-white p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-warm-gray">
                {memoryRequests.length} vault{memoryRequests.length !== 1 ? "s" : ""} &middot;{" "}
                {memoryRequests.reduce((sum, r) => sum + (Array.isArray(r.memory_recordings) ? r.memory_recordings.length : 0), 0)} total recordings
                {vaultCredits && (vaultCredits.audioCredits > 0 || vaultCredits.videoCredits > 0) && (
                  <span className="ml-2 text-forest">
                    &middot; {vaultCredits.audioCredits - vaultCredits.audioUsed} audio + {vaultCredits.videoCredits - vaultCredits.videoUsed} video credits available
                  </span>
                )}
              </p>
              <Link
                href="/vault/my"
                className="text-sm font-medium text-navy underline hover:text-gold"
              >
                Manage vaults &rarr;
              </Link>
            </div>
          </div>
        </div>

        {/* Account Settings */}
        <div className="mt-12 rounded-xl border border-cream-dark bg-white p-6">
          <h2 className="text-xl font-bold text-navy">Account Settings</h2>

          <div className="mt-5 space-y-4">
            {/* Email (read-only) */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy">
                Email
              </label>
              <p className="rounded-lg border border-cream-dark bg-cream/50 px-4 py-2.5 text-sm text-warm-gray">
                {userEmail}
              </p>
            </div>

            {/* Phone number */}
            <div>
              <label
                htmlFor="phone"
                className="mb-1.5 block text-sm font-medium text-navy"
              >
                Phone Number
              </label>
              <input
                id="phone"
                type="tel"
                placeholder="e.g. (631) 555-1234"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setPhoneSaved(false);
                }}
                className="w-full rounded-lg border border-cream-dark bg-cream/50 px-4 py-2.5 text-navy placeholder:text-warm-gray-light transition focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
              />
              <p className="mt-1.5 text-xs text-warm-gray-light">
                We will send you a text 2 weeks before each gift ships to
                confirm your delivery details.
              </p>
            </div>

            {/* Save button + success message */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleSavePhone}
                disabled={phoneSaving}
                className="rounded-lg bg-forest px-5 py-2.5 text-sm font-semibold text-cream shadow-sm transition hover:bg-forest-light disabled:cursor-not-allowed disabled:opacity-60"
              >
                {phoneSaving ? "Saving..." : "Save"}
              </button>
              {phoneSaved && (
                <p className="text-sm font-medium text-forest">
                  Phone number saved! We will text you before each delivery.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Manage Plan Modal */}
      {managingOrder && (
        <ManagePlanModal
          order={managingOrder}
          onClose={() => setManagingOrder(null)}
          onOrderUpdated={handleOrderUpdated}
          hasRefundRequest={hasRefundRequest(managingOrder.id)}
        />
      )}

      {/* Gift Photo Preview Modal */}
      {previewPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setPreviewPhoto(null)}
        >
          <div className="fixed inset-0 bg-navy/40 backdrop-blur-sm" />
          <div
            className="relative z-10 max-h-[85vh] max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-cream-dark px-5 py-4">
              <h3 className="text-lg font-semibold text-navy">Your Gift Preview</h3>
              <button
                onClick={() => setPreviewPhoto(null)}
                className="rounded-lg p-2 text-warm-gray transition-colors hover:bg-cream-dark hover:text-navy"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4">
              <Image
                src={previewPhoto}
                alt="Gift preview"
                width={500}
                height={500}
                className="w-full rounded-xl object-contain"
                unoptimized
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

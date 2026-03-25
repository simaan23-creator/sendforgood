"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { TIERS } from "@/lib/constants";

interface Order {
  id: string;
  tier: string;
  years_purchased: number;
  years_remaining: number;
  amount_paid: number;
  status: string;
  created_at: string;
  stripe_payment_intent_id: string;
  recipients: {
    name: string;
    relationship: string;
  };
  occasions: {
    type: string;
    label: string;
    occasion_date: string;
  };
}

function getNextDeliveryDate(occasionDate: string): string {
  const today = new Date();
  const [year, month, day] = occasionDate.split("-").map(Number);
  const thisYear = today.getFullYear();

  const thisYearDate = new Date(thisYear, month - 1, day);
  if (thisYearDate > today) {
    return thisYearDate.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }

  const nextYearDate = new Date(thisYear + 1, month - 1, day);
  return nextYearDate.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
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
  const [userEmail, setUserEmail] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const activeOrders = orders.filter((o) => o.status === "active");
  const uniqueRecipients = new Set(orders.map((o) => o.recipients?.name)).size;
  const deliveredCount = 0; // Shipments table not queried here; placeholder for future

  useEffect(() => {
    async function loadDashboard() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth");
        return;
      }

      setUserEmail(user.email ?? "");

      const { data, error } = await supabase
        .from("orders")
        .select("*, recipients(*), occasions(*)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setOrders(data as Order[]);
      }

      setLoading(false);
    }

    loadDashboard();
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
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
            const nextDelivery = order.occasions?.occasion_date
              ? getNextDeliveryDate(order.occasions.occasion_date)
              : null;

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
                      {order.occasions?.label ?? order.occasions?.type ?? "—"}
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
                  </div>
                </div>

                {/* Progress section */}
                <div className="mt-5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-warm-gray">
                      {order.years_remaining} of {order.years_purchased} year
                      {order.years_purchased !== 1 ? "s" : ""} remaining
                    </span>
                    {nextDelivery && order.status === "active" && (
                      <span className="text-warm-gray">
                        Next delivery:{" "}
                        <span className="font-medium text-navy">
                          {nextDelivery}
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

                {/* Actions */}
                {order.status === "active" && (
                  <div className="mt-5 flex justify-end border-t border-cream-dark pt-4">
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
      </div>
    </div>
  );
}

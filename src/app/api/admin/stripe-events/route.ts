import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-auth";

/**
 * Admin: list recent Stripe events.
 *
 * Pulls live from the Stripe API (30-day retention), then cross-references
 * our local `stripe_webhook_events` table to flag which events we actually
 * received and processed locally vs. which Stripe sent but we may have
 * missed (helps surface webhook delivery gaps).
 *
 * Query params:
 *   type            — optional Stripe event type filter (e.g. "checkout.session.completed")
 *   limit           — page size (default 50, capped at 100 by Stripe API)
 *   starting_after  — Stripe event id for cursor-based pagination
 */
export async function GET(request: NextRequest) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || undefined;
  const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);
  const startingAfter = searchParams.get("starting_after") || undefined;

  try {
    // 1. Pull recent events from Stripe.
    const stripeEvents = await stripe.events.list({
      limit,
      ...(type ? { type } : {}),
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    });

    // 2. Check which ones we received locally.
    const ids = stripeEvents.data.map((e) => e.id);
    const { data: localRows } = await supabaseAdmin
      .from("stripe_webhook_events")
      .select("id, received_at")
      .in("id", ids);

    const localMap = new Map<string, string>(
      (localRows || []).map((r) => [r.id, r.received_at])
    );

    // 3. Merge and shape for the UI.
    const events = stripeEvents.data.map((e) => {
      const obj = e.data.object as unknown as Record<string, unknown>;
      // Heuristic field extraction — different event types have different shapes,
      // but these are the most useful for at-a-glance scanning.
      const amount =
        (obj.amount_total as number | undefined) ??
        (obj.amount as number | undefined) ??
        (obj.amount_paid as number | undefined) ??
        null;
      const currency = (obj.currency as string | undefined) ?? null;
      const customerEmail =
        (obj.customer_email as string | undefined) ??
        ((obj.customer_details as { email?: string } | undefined)?.email) ??
        ((obj.billing_details as { email?: string } | undefined)?.email) ??
        null;
      const description = (obj.description as string | undefined) ?? null;

      return {
        id: e.id,
        type: e.type,
        created: e.created, // unix seconds
        livemode: e.livemode,
        amount,
        currency,
        customer_email: customerEmail,
        description,
        received_at: localMap.get(e.id) ?? null,
      };
    });

    return NextResponse.json({
      events,
      has_more: stripeEvents.has_more,
      last_id: events.length > 0 ? events[events.length - 1].id : null,
    });
  } catch (err) {
    console.error("stripe-events.list failed", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch events" },
      { status: 500 }
    );
  }
}

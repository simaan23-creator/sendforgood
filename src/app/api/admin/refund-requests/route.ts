import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-auth";
import { log } from "@/lib/log";

/**
 * GET  /api/admin/refund-requests
 *   Lists refund requests, newest first. Status filter via ?status=pending.
 *
 * POST /api/admin/refund-requests
 *   Body: { id: string, action: "approve" | "deny", notes?: string }
 *   On approve, issues a Stripe refund against the order's payment intent
 *   and records the resulting refund id.
 */

export async function GET(request: Request) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  const url = new URL(request.url);
  const status = url.searchParams.get("status");

  let query = supabaseAdmin
    .from("refund_requests")
    .select(
      `
      id, order_id, user_id, reason, details, status, refund_amount,
      processed_at, stripe_refund_id, admin_notes, created_at,
      orders:order_id (
        id, tier, years_remaining, stripe_payment_intent_id,
        recipients:recipient_id ( name )
      ),
      profiles:user_id ( email, full_name )
    `
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    log.error("admin.refund_requests.list_failed", {}, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ requests: data || [] });
}

export async function POST(request: Request) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  let body: { id?: string; action?: string; notes?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { id, action, notes } = body;
  if (!id || (action !== "approve" && action !== "deny")) {
    return NextResponse.json(
      { error: "id and action (approve|deny) are required" },
      { status: 400 }
    );
  }

  // Load the request + order in one shot.
  const { data: req, error: fetchErr } = await supabaseAdmin
    .from("refund_requests")
    .select(
      `id, status, refund_amount, order_id,
       orders:order_id ( stripe_payment_intent_id )`
    )
    .eq("id", id)
    .single();

  if (fetchErr || !req) {
    return NextResponse.json({ error: "Refund request not found" }, { status: 404 });
  }

  if (req.status !== "pending") {
    return NextResponse.json(
      { error: `Already ${req.status}` },
      { status: 409 }
    );
  }

  if (action === "deny") {
    const { error: updateErr } = await supabaseAdmin
      .from("refund_requests")
      .update({
        status: "denied",
        processed_at: new Date().toISOString(),
        admin_notes: notes || null,
      })
      .eq("id", id);

    if (updateErr) {
      log.error("admin.refund_requests.deny_failed", { request_id: id }, updateErr);
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, status: "denied" });
  }

  // approve → issue Stripe refund
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const order = (Array.isArray(req.orders) ? req.orders[0] : req.orders) as any;
  const paymentIntentId: string | null = order?.stripe_payment_intent_id ?? null;

  if (!paymentIntentId) {
    return NextResponse.json(
      { error: "Order has no Stripe payment intent — cannot refund automatically" },
      { status: 422 }
    );
  }

  if (!req.refund_amount || req.refund_amount <= 0) {
    return NextResponse.json(
      { error: "Refund amount missing or invalid" },
      { status: 422 }
    );
  }

  let refundId: string;
  try {
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: req.refund_amount,
      reason: "requested_by_customer",
      metadata: { refund_request_id: id, order_id: req.order_id },
    });
    refundId = refund.id;
  } catch (err) {
    log.error(
      "admin.refund_requests.stripe_refund_failed",
      { request_id: id, payment_intent: paymentIntentId },
      err
    );
    const msg = err instanceof Error ? err.message : "Stripe refund failed";
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  const { error: updateErr } = await supabaseAdmin
    .from("refund_requests")
    .update({
      status: "approved",
      processed_at: new Date().toISOString(),
      stripe_refund_id: refundId,
      admin_notes: notes || null,
    })
    .eq("id", id);

  if (updateErr) {
    // Refund was issued but DB write failed. Surface clearly so admin can
    // reconcile manually rather than retry (which would double-refund).
    log.error(
      "admin.refund_requests.db_update_after_refund_failed",
      { request_id: id, stripe_refund_id: refundId },
      updateErr
    );
    return NextResponse.json(
      {
        error: `Refund ${refundId} was issued but DB update failed: ${updateErr.message}. Reconcile manually.`,
        stripe_refund_id: refundId,
      },
      { status: 500 }
    );
  }

  log.info("admin.refund_requests.approved", {
    request_id: id,
    stripe_refund_id: refundId,
    amount: req.refund_amount,
  });

  return NextResponse.json({ ok: true, status: "approved", stripe_refund_id: refundId });
}

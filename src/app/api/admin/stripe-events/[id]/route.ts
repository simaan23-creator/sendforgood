import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { requireAdmin } from "@/lib/admin-auth";

/**
 * Admin: fetch the full payload of a single Stripe event.
 * Used by the admin UI to drill into a row from the events table.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  const { id } = await params;
  if (!id.startsWith("evt_")) {
    return NextResponse.json({ error: "Invalid event id" }, { status: 400 });
  }

  try {
    const event = await stripe.events.retrieve(id);
    return NextResponse.json({ event });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch event" },
      { status: 500 }
    );
  }
}

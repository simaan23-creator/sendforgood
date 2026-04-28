import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { validateRequiredEnv } from "@/lib/env";

/**
 * Public health check for uptime monitors (UptimeRobot, BetterStack, etc.).
 *
 * Returns 200 with `{ status: "ok" }` when env is valid and DB is reachable.
 * Returns 503 otherwise.
 *
 * Intentionally lightweight — runs a HEAD-style count against a tiny table
 * with no joins or filters that would warm caches.
 */
export async function GET() {
  const startedAt = Date.now();

  const envCheck = validateRequiredEnv();
  if (!envCheck.ok) {
    return NextResponse.json(
      { status: "misconfigured", missing_env: envCheck.missing },
      { status: 503 }
    );
  }

  try {
    const { error } = await supabaseAdmin
      .from("stripe_webhook_events")
      .select("id", { count: "exact", head: true })
      .limit(1);

    if (error) {
      return NextResponse.json(
        { status: "degraded", db: "error", message: error.message },
        { status: 503 }
      );
    }

    return NextResponse.json({
      status: "ok",
      db: "ok",
      latency_ms: Date.now() - startedAt,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { status: "down", message: msg },
      { status: 503 }
    );
  }
}

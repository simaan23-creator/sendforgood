import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-auth";
import { resend } from "@/lib/resend";

// D5: Photographer of the Month admin endpoint.
//   GET  -> { shortlist: top 5 affiliates by prior-month paid referrals,
//             current_winner: row for the current month if any,
//             past_winners: published list }
//   POST -> publish a winner. Body: { affiliate_id, month: 'YYYY-MM-01',
//             business_name, photo_url?, quote?, website? }
//
// "Prior month" = the month before today. Sales windows are calendar
// months in UTC, matching how the digest cron computes them.

function priorMonthRange(): { start: string; end: string; monthStart: string } {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  return {
    start: start.toISOString(),
    end: end.toISOString(),
    monthStart: start.toISOString().split("T")[0]!, // YYYY-MM-DD
  };
}

export async function GET(request: Request) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  const { start, end, monthStart } = priorMonthRange();

  // Pull every paid referral in the window and bucket per affiliate.
  // 5 winners worth of data is small enough that the in-memory rollup
  // is faster than a server-side group-by RPC.
  const { data: refs } = await supabaseAdmin
    .from("affiliate_referrals")
    .select("affiliate_id, paid, commission_amount")
    .gte("created_at", start)
    .lt("created_at", end)
    .eq("paid", true);

  const counts = new Map<string, { paid: number; commission: number }>();
  for (const r of refs || []) {
    const cur = counts.get(r.affiliate_id) || { paid: 0, commission: 0 };
    cur.paid += 1;
    cur.commission += Number(r.commission_amount) || 0;
    counts.set(r.affiliate_id, cur);
  }

  const ranked = Array.from(counts.entries())
    .map(([affiliate_id, v]) => ({ affiliate_id, ...v }))
    .sort((a, b) => b.paid - a.paid)
    .slice(0, 5);

  // Hydrate display names.
  const ids = ranked.map((r) => r.affiliate_id);
  const affRows = ids.length
    ? (
        await supabaseAdmin
          .from("affiliates")
          .select("id, name, business_name, email, code")
          .in("id", ids)
      ).data || []
    : [];
  const affById = new Map(affRows.map((a) => [a.id, a]));
  const shortlist = ranked.map((r) => {
    const a = affById.get(r.affiliate_id);
    return {
      affiliate_id: r.affiliate_id,
      paid_referrals: r.paid,
      commission_cents: r.commission,
      name: a?.name || "",
      business_name: a?.business_name || a?.name || "",
      email: a?.email || "",
      code: a?.code || "",
    };
  });

  const { data: current } = await supabaseAdmin
    .from("photographer_of_month")
    .select("*")
    .eq("month", monthStart)
    .maybeSingle();

  const { data: pastWinners } = await supabaseAdmin
    .from("photographer_of_month")
    .select("*")
    .order("month", { ascending: false })
    .limit(24);

  return NextResponse.json({
    month: monthStart,
    shortlist,
    current_winner: current || null,
    past_winners: pastWinners || [],
  });
}

export async function POST(request: Request) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const affiliateId = typeof body.affiliate_id === "string" ? body.affiliate_id : "";
  const month = typeof body.month === "string" ? body.month : "";
  const businessName = typeof body.business_name === "string" ? body.business_name.trim() : "";
  const photoUrl = typeof body.photo_url === "string" ? body.photo_url.trim() : "";
  const quote = typeof body.quote === "string" ? body.quote.trim() : "";
  const website = typeof body.website === "string" ? body.website.trim() : "";

  if (!affiliateId || !month || !businessName) {
    return NextResponse.json(
      { error: "affiliate_id, month, and business_name are required" },
      { status: 400 }
    );
  }
  if (!/^\d{4}-\d{2}-01$/.test(month)) {
    return NextResponse.json(
      { error: "month must be YYYY-MM-01 (first day of the month)" },
      { status: 400 }
    );
  }

  // Confirm the affiliate exists.
  const { data: affiliate } = await supabaseAdmin
    .from("affiliates")
    .select("id, name, email, code")
    .eq("id", affiliateId)
    .maybeSingle();
  if (!affiliate) {
    return NextResponse.json({ error: "Affiliate not found" }, { status: 404 });
  }

  // Upsert by month (unique). Re-publishing overwrites the prior winner
  // for the same calendar month — useful for fixing a typo or swapping
  // the photo URL.
  const { error: upsertError } = await supabaseAdmin
    .from("photographer_of_month")
    .upsert(
      {
        affiliate_id: affiliateId,
        month,
        business_name: businessName,
        photo_url: photoUrl || null,
        quote: quote || null,
        website: website || null,
        published_at: new Date().toISOString(),
      },
      { onConflict: "month" }
    );

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  // Best-effort winner-notification email.
  try {
    await resend.emails.send({
      from: "SealTheDay <noreply@sealtheday.com>",
      to: affiliate.email,
      subject: "You're our Photographer of the Month",
      html: `
        <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #1a2744; background: #fdf8f0;">
          <h1 style="color: #1a2744; margin-top: 0;">Congratulations &mdash; you're featured.</h1>
          <p style="font-size: 16px; line-height: 1.6;">You're our SealTheDay <strong>Photographer of the Month</strong>. Your feature is live on our partners page.</p>
          <p style="margin: 24px 0;"><a href="https://sealtheday.com/partners" style="display: inline-block; background: #1a2744; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">View your feature</a></p>
          <p style="font-size: 14px; line-height: 1.6;">Share the page with your audience &mdash; we featured you and linked your business website so the traffic flows back to you.</p>
          <p style="margin-top: 32px;">&mdash; Simaan, founder of SealTheDay</p>
        </div>
      `,
    });
  } catch (emailError) {
    console.error("PotM winner email failed:", emailError);
  }

  return NextResponse.json({ ok: true });
}

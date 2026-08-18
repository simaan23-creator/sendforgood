import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { resend } from "@/lib/resend";
import { generateClaimCode } from "@/lib/leads/gift-code";
import { getUnshippedPaidReceipts, markReceiptShipped } from "@/lib/etsy/client";

/**
 * Cron: auto-fulfill Etsy orders for the Anniversary Capsule.
 *
 * Every run: pull paid+unshipped receipts from the Etsy shop, mint a claim
 * code per unit purchased (mirrors /api/admin/etsy/mint-code), email the
 * buyer their claim link(s) from noreply@sealtheday.com, then mark the
 * receipt shipped on Etsy (which also completes the order buyer-side).
 *
 * Idempotency: the partial unique index on (source, external_order_id)
 * dedupes minting; fulfillment_emailed_at on the base row dedupes the email;
 * was_shipped=false in the receipts query dedupes the whole receipt.
 * Any per-receipt failure alerts ALERT_EMAIL and the receipt is retried on
 * the next run (it stays unshipped until every step succeeded).
 *
 * Schedule via vercel.json: every 15 minutes.
 * Authorization: Bearer ${CRON_SECRET}
 */

const ALERT_EMAIL = process.env.ETSY_ALERT_EMAIL || "simaan23@gmail.com";

// Infrastructure blips (Supabase outage, network timeouts) self-heal on a
// later run and affect the whole site — emailing every 15 minutes about them
// is noise. Only genuine fulfillment problems should page a human.
function isInfraOutage(err: unknown): boolean {
  return /DB_UNAVAILABLE|fetch failed|522|ETIMEDOUT|ECONNRESET|ECONNREFUSED|Connection timed out|network/i.test(
    String(err)
  );
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const shopId = process.env.ETSY_SHOP_ID;
  if (!shopId || !process.env.ETSY_API_KEY) {
    // Not an error state during rollout: the cron is registered before the
    // Etsy app credentials exist. No-op quietly so the cron dash stays green.
    return NextResponse.json({ skipped: "ETSY_API_KEY / ETSY_SHOP_ID not configured" });
  }

  let receipts;
  try {
    receipts = await getUnshippedPaidReceipts(shopId);
  } catch (err) {
    if (isInfraOutage(err)) {
      console.warn("etsy-fulfill: infra outage, retrying next run:", String(err).slice(0, 200));
      return NextResponse.json({ skipped: "infra outage, will retry", error: String(err) }, { status: 503 });
    }
    await alert(`Etsy receipts fetch failed: ${(err as Error).message}`);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }

  const summary: Array<Record<string, unknown>> = [];

  for (const receipt of receipts) {
    const receiptId = String(receipt.receipt_id);
    try {
      const qty = Math.max(
        1,
        (receipt.transactions ?? []).reduce((sum, t) => sum + (t.quantity || 1), 0)
      );

      if (!receipt.buyer_email) {
        // Can't deliver by email — leave unshipped and flag for manual handling.
        await alert(
          `Etsy order ${receiptId} has no buyer_email — fulfill manually at https://sealtheday.com/admin/etsy (order stays unshipped).`
        );
        summary.push({ receiptId, status: "no_buyer_email" });
        continue;
      }

      // Mint one claim code per unit. external_order_id: receiptId for the
      // first unit, receiptId-2, receiptId-3... for extras.
      const claimUrls: string[] = [];
      for (let unit = 1; unit <= qty; unit++) {
        const externalId = unit === 1 ? receiptId : `${receiptId}-${unit}`;
        const code = await mintEtsyGift(externalId, receipt.buyer_email);
        claimUrls.push(buildClaimUrl(code));
      }

      // Email the buyer (skip if a previous partial run already sent it).
      const { data: baseRow } = await supabaseAdmin
        .from("vault_gift_purchases")
        .select("id, fulfillment_emailed_at")
        .eq("source", "etsy_order")
        .eq("external_order_id", receiptId)
        .maybeSingle();

      let emailed = false;
      if (!baseRow?.fulfillment_emailed_at) {
        await sendClaimEmail(receipt.buyer_email, receipt.name, claimUrls);
        emailed = true;
        await supabaseAdmin
          .from("vault_gift_purchases")
          .update({
            fulfillment_email: receipt.buyer_email,
            fulfillment_emailed_at: new Date().toISOString(),
          })
          .eq("source", "etsy_order")
          .like("external_order_id", `${receiptId}%`);
      }

      // Mark shipped on Etsy last — receipt drops out of future polls only
      // once mint + email both succeeded.
      await markReceiptShipped(shopId, receipt.receipt_id);

      summary.push({ receiptId, qty, emailed, status: "fulfilled" });
    } catch (err) {
      console.error(`etsy-fulfill failed for receipt ${receiptId}:`, err);
      if (!isInfraOutage(err)) {
        await alert(
          `Etsy auto-fulfillment FAILED for order ${receiptId}: ${(err as Error).message}\n\nIt will retry on the next run (every 15 min). If it keeps failing, fulfill manually at https://sealtheday.com/admin/etsy and mark the order shipped on Etsy.`
        );
      }
      summary.push({ receiptId, status: "error", error: String(err) });
    }
  }

  return NextResponse.json({ processed: receipts.length, summary });
}

/** Insert a vault_gift_purchases row for one Etsy unit; returns claim code. */
async function mintEtsyGift(externalOrderId: string, buyerEmail: string): Promise<string> {
  const giftRow = {
    purchaser_user_id: null,
    purchaser_email: "etsy@sealtheday.com",
    recipient_email: null,
    bundle: "anniversary",
    audio_credits: 0,
    video_credits: 6,
    photo_credits: 15,
    vault_fees: 1,
    stripe_payment_intent_id: `etsy_${externalOrderId}`,
    source: "etsy_order",
    external_order_id: externalOrderId,
    redeemable_by_anyone: true,
    status: "pending",
    fulfillment_email: buyerEmail,
  };

  let claimCode = generateClaimCode();
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data, error } = await supabaseAdmin
      .from("vault_gift_purchases")
      .insert({ ...giftRow, claim_code: claimCode })
      .select("claim_code")
      .single();

    if (!error && data) return data.claim_code;

    if (error?.code === "23505") {
      if (error.message?.includes("external_order_id")) {
        const { data: existing } = await supabaseAdmin
          .from("vault_gift_purchases")
          .select("claim_code")
          .eq("source", "etsy_order")
          .eq("external_order_id", externalOrderId)
          .maybeSingle();
        if (existing?.claim_code) return existing.claim_code;
      }
      claimCode = generateClaimCode();
      continue;
    }

    throw new Error(`mint insert failed: ${error?.message}`);
  }
  throw new Error("could not generate unique claim code after 5 attempts");
}

function buildClaimUrl(code: string): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://sealtheday.com";
  return `${base}/gift/vault/claim/${code}`;
}

async function sendClaimEmail(to: string, buyerName: string | null, claimUrls: string[]) {
  const firstName = (buyerName || "").trim().split(/\s+/)[0] || null;
  const many = claimUrls.length > 1;
  const linksHtml = claimUrls
    .map(
      (url, i) => `
        <p style="margin-top: ${i === 0 ? "28" : "12"}px; text-align: center;">
          <a href="${url}" style="background: #C9A961; color: #1a2744; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 700; display: inline-block;">
            Claim ${many ? `Capsule ${i + 1}` : "my Anniversary Capsule"} &rarr;
          </a>
        </p>`
    )
    .join("");

  const { error } = await resend.emails.send({
    from: "SealTheDay <noreply@sealtheday.com>",
    to,
    replyTo: "support@sealtheday.com",
    subject: "Your Anniversary Capsule is ready 🎁 (Etsy order)",
    html: `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #1a2744; background: #fdf8f0;">
        <h1 style="color: #1a2744; margin-top: 0;">Thank you for your Etsy order${firstName ? `, ${firstName}` : ""}!</h1>
        <p style="font-size: 16px; line-height: 1.6;">
          Your <strong>SealTheDay Anniversary Capsule</strong> is ready to claim — a private vault where friends and family record video messages, sealed until a date you choose (up to 1 year out).
        </p>
        <div style="background: #ffffff; border: 1px solid #f1e8db; border-radius: 12px; padding: 20px; margin: 24px 0;">
          <div style="font-size: 12px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #C9A961; margin-bottom: 8px;">${many ? `Each capsule` : `Your capsule`} includes</div>
          <ul style="margin: 8px 0 0; padding-left: 20px; line-height: 1.8; color: #1a2744;">
            <li><strong>1</strong> private memory vault</li>
            <li><strong>6</strong> video message slots (up to 2 min each, HD)</li>
            <li><strong>15</strong> photo upload slots</li>
            <li>Seal for up to 12 months — perfect for opening on a first anniversary</li>
          </ul>
        </div>
        ${linksHtml}
        <p style="margin-top: 20px; font-size: 14px; line-height: 1.6; color: #3d3528;">
          <strong>Buying this as a gift?</strong> Just forward this email (or the claim link) to the couple — whoever opens the link first and signs in gets the capsule on their free account.
        </p>
        <p style="margin-top: 8px; font-size: 14px; line-height: 1.6; color: #3d3528;">
          Guests recording messages never need an account — they click a link and record straight from their phone.
        </p>
        <p style="margin-top: 16px; font-size: 13px; color: #6c6357;">
          Questions? Reply to this email or message us on Etsy — we answer within a few hours during US business hours. Full walkthrough at <a href="https://sealtheday.com/wedding" style="color: #722F37;">sealtheday.com/wedding</a>.
        </p>
        <hr style="border: none; border-top: 1px solid #f1e8db; margin: 40px 0 20px;" />
        <p style="font-size: 12px; color: #8a8275; text-align: center; line-height: 1.5;">
          SealTheDay is a product of SendForGood, LLC.
        </p>
      </div>
    `,
  });
  if (error) throw new Error(`claim email send failed: ${error.message}`);
}

async function alert(message: string) {
  try {
    await resend.emails.send({
      from: "SealTheDay <noreply@sealtheday.com>",
      to: ALERT_EMAIL,
      subject: "⚠️ Etsy auto-fulfillment needs attention",
      text: message,
    });
  } catch (err) {
    console.error("etsy-fulfill alert email failed:", err);
  }
}

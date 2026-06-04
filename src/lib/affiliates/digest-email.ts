import { getRepeatTier } from "./tiers";

export interface DigestData {
  name: string;
  business_name: string;
  code: string;
  prior_month_label: string;
  prior_month_referrals: number;
  prior_month_commission_cents: number;
  lifetime_referrals: number;
  lifetime_earned_cents: number;
  rank: number;
  rank_total: number;
  top_referrals: number;
  base_repeat_rate: number;
  paid_referrals_to_date: number;
  portal_url: string;
}

export function renderDigestEmail(d: DigestData): { subject: string; html: string } {
  const tier = getRepeatTier(d.paid_referrals_to_date, d.base_repeat_rate);
  const dollars = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  const tierNextLine = tier.paidNeededForNext
    ? `${tier.paidNeededForNext} more paid referral${tier.paidNeededForNext === 1 ? "" : "s"} to reach the ${tier.nextLabel}.`
    : `You're at the top tier — ${tier.label}.`;

  const subject = d.prior_month_referrals > 0
    ? `Your ${d.prior_month_label} SealTheDay summary: ${d.prior_month_referrals} referral${d.prior_month_referrals === 1 ? "" : "s"}, ${dollars(d.prior_month_commission_cents)}`
    : `Your ${d.prior_month_label} SealTheDay summary`;

  const html = `
    <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #1a2744; background: #fdf8f0;">
      <h1 style="margin-top: 0;">Hi ${d.name.split(" ")[0]},</h1>
      <p style="font-size: 16px; line-height: 1.6;">Here's your ${d.prior_month_label} SealTheDay recap.</p>

      <div style="background: #fff; border: 1px solid #f1e8db; border-radius: 12px; padding: 20px; margin: 24px 0;">
        <div style="font-size: 12px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #C9A961; margin-bottom: 8px;">Last month</div>
        <p style="margin: 4px 0; font-size: 18px;"><strong>${d.prior_month_referrals}</strong> paid referral${d.prior_month_referrals === 1 ? "" : "s"}</p>
        <p style="margin: 4px 0; font-size: 18px;"><strong>${dollars(d.prior_month_commission_cents)}</strong> commission earned</p>
        <p style="margin: 12px 0 0; font-size: 13px; color: #6c6357;">Rank: <strong>#${d.rank}</strong> of ${d.rank_total} active partners${d.top_referrals > 0 ? ` &middot; top partner: ${d.top_referrals} referrals` : ""}.</p>
      </div>

      <div style="background: #fff; border: 1px solid #f1e8db; border-radius: 12px; padding: 20px; margin: 24px 0;">
        <div style="font-size: 12px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #C9A961; margin-bottom: 8px;">Your tier</div>
        <p style="margin: 4px 0;">Current: <strong>${tier.label}</strong> on repeat purchases (first-purchase commission is always 15%).</p>
        <p style="margin: 12px 0 0; font-size: 13px; color: #6c6357;">${tierNextLine}</p>
      </div>

      <div style="background: #fff; border: 1px solid #f1e8db; border-radius: 12px; padding: 20px; margin: 24px 0;">
        <div style="font-size: 12px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #C9A961; margin-bottom: 8px;">Lifetime</div>
        <p style="margin: 4px 0;">${d.lifetime_referrals} paid referrals &middot; ${dollars(d.lifetime_earned_cents)} earned.</p>
      </div>

      <p style="margin: 24px 0;"><a href="${d.portal_url}" style="display: inline-block; background: #1a2744; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">Open your dashboard</a></p>

      <p style="margin-top: 32px;">Questions? Reply to this email.<br/>— Simaan, founder of SealTheDay</p>
    </div>
  `;
  return { subject, html };
}

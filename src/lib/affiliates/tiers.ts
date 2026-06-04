// D7: tiered commission ladder for repeat purchases.
//
// First-purchase commission stays at the affiliate's first_commission_rate
// (15% by default). Repeat-purchase commission scales with the affiliate's
// lifetime count of paid referrals:
//
//   0..4  paid -> 10% (base repeat_commission_rate)
//   5..9       -> 12%
//   10+        -> 15%
//
// Centralized here so the webhook (commission computation), the portal
// (progress display), and the monthly digest email all stay in sync.

export type RepeatTier = "repeat_t1" | "repeat_t2" | "repeat_t3";

export interface TierInfo {
  tier: RepeatTier;
  rate: number;
  label: string;
  nextRate: number | null;
  nextLabel: string | null;
  paidNeededForNext: number | null;
}

export function getRepeatTier(paidReferrals: number, baseRate = 10): TierInfo {
  if (paidReferrals >= 10) {
    return {
      tier: "repeat_t3",
      rate: 15,
      label: "Tier 3 (15%)",
      nextRate: null,
      nextLabel: null,
      paidNeededForNext: null,
    };
  }
  if (paidReferrals >= 5) {
    return {
      tier: "repeat_t2",
      rate: 12,
      label: "Tier 2 (12%)",
      nextRate: 15,
      nextLabel: "Tier 3 (15%)",
      paidNeededForNext: 10 - paidReferrals,
    };
  }
  return {
    tier: "repeat_t1",
    rate: baseRate,
    label: `Tier 1 (${baseRate}%)`,
    nextRate: 12,
    nextLabel: "Tier 2 (12%)",
    paidNeededForNext: 5 - paidReferrals,
  };
}

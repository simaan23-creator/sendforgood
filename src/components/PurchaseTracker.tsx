"use client";

// Drop-in pixel-only client component for success pages. Fires a `purchase`
// conversion via the analytics helpers on mount and renders nothing. Use
// this on success pages that are server components or where you don't want
// to refactor the whole page just to add tracking.
//
// transactionId should be unique-per-order (Stripe session id is ideal).
// valueUsd may be 0 for flows where we don't have a clean value to report;
// the conversion will still fire (count-based optimization) but value-based
// smart bidding won't have data to work with.

import { useEffect } from "react";
import { trackPurchase } from "@/lib/analytics";

interface Props {
  transactionId: string;
  valueUsd: number;
  itemCategory?: string;
}

export default function PurchaseTracker({
  transactionId,
  valueUsd,
  itemCategory,
}: Props) {
  useEffect(() => {
    if (!transactionId) return;
    trackPurchase({ transactionId, valueUsd, itemCategory });
  }, [transactionId, valueUsd, itemCategory]);
  return null;
}

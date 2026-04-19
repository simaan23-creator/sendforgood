"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { TIERS } from "@/lib/constants";

interface GiftedItem {
  id: string;
  source?: string;
  recipient_name: string | null;
  item_type: "letter" | "voice_message" | "gift_credit";
  tier: string | null;
  message_format: string | null;
  delivery_type: string | null;
  message: string | null;
  status: string;
  sender_first_name: string;
  use_type?: string;
  format?: string;
}

function getItemDescription(item: GiftedItem): {
  label: string;
  icon: string;
  detail: string;
} {
  // Unified system items
  if (item.format) {
    const formatLabels: Record<string, { label: string; icon: string; detail: string }> = {
      letter_digital: { label: "Digital Letter Credit", icon: "\u270F\uFE0F", detail: "A digital letter delivered by email" },
      letter_physical: { label: "Physical Letter Credit", icon: "\u2709\uFE0F", detail: "A printed letter mailed to the recipient" },
      letter_photo: { label: "Letter + Photo Credit", icon: "\uD83D\uDCF8", detail: "A printed letter with wallet photo, mailed together" },
      audio: { label: "Audio Message Credit", icon: "\uD83C\uDFA4", detail: "An audio recording delivered by email" },
      video: { label: "Video Message Credit", icon: "\uD83C\uDFAC", detail: "A video recording delivered by email" },
    };
    const info = formatLabels[item.format];
    if (info) return info;
  }

  // Legacy items
  if (item.item_type === "letter") {
    const deliveryLabel =
      item.delivery_type === "digital"
        ? "Digital"
        : item.delivery_type === "physical_photo"
          ? "Physical + Photo"
          : "Physical";
    return {
      label: "Letter Slot",
      icon: "\u2709\uFE0F",
      detail: `${deliveryLabel} delivery`,
    };
  }

  if (item.item_type === "voice_message") {
    const formatLabel =
      item.message_format === "video" ? "Video" : "Audio";
    return {
      label: `${formatLabel} Message Slot`,
      icon: item.message_format === "video" ? "\uD83C\uDFAC" : "\uD83C\uDFA4",
      detail: `${formatLabel} recording slot`,
    };
  }

  if (item.item_type === "gift_credit") {
    const tierInfo = TIERS.find((t) => t.id === item.tier);
    const tierName = tierInfo?.name || item.tier || "Gift";
    return {
      label: `${tierName} Gift Credit`,
      icon: "\uD83C\uDF81",
      detail: tierInfo?.description || "A curated gift credit",
    };
  }

  return { label: "Gift", icon: "\uD83C\uDF81", detail: "" };
}

export default function ClaimPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const code = params.code as string;

  const [gift, setGift] = useState<GiftedItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      // Check auth
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUserId(user?.id || null);

      // Fetch the gifted item
      const res = await fetch(`/api/claim/${code}`, { method: "GET" });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Gift not found");
      } else {
        setGift(data.gift);
        if (data.gift.status === "claimed") {
          setClaimed(true);
        }
      }
      setLoading(false);
    }
    load();
  }, [code, supabase]);

  async function handleClaim() {
    if (!userId) {
      router.push(`/auth?redirect=/claim/${code}`);
      return;
    }

    setClaiming(true);
    setError("");

    const res = await fetch(`/api/claim/${code}`, { method: "POST" });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Failed to claim gift");
      setClaiming(false);
      return;
    }

    setClaimed(true);
    setClaiming(false);

    setTimeout(() => {
      router.push("/dashboard");
    }, 2500);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-navy border-t-transparent" />
      </div>
    );
  }

  if (error && !gift) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-cream to-cream-dark px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-lg text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
            <svg
              className="h-10 w-10 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-navy">Gift Not Found</h1>
          <p className="mt-3 text-warm-gray">{error}</p>
          <Link
            href="/"
            className="mt-8 inline-flex items-center rounded-lg bg-navy px-6 py-3 text-sm font-semibold text-cream transition hover:bg-navy/90"
          >
            Go Home
          </Link>
        </div>
      </main>
    );
  }

  if (!gift) return null;

  const itemInfo = getItemDescription(gift);
  const isRequest = gift.use_type === "request";

  if (claimed) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-cream to-cream-dark px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-lg text-center">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-forest/10">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-12 w-12 text-forest"
            >
              <path
                fillRule="evenodd"
                d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">
            {isRequest ? "Request Accepted!" : "Gift Claimed!"}
          </h1>
          <p className="mt-3 text-warm-gray">
            {isRequest ? (
              <>You can now record your message. Redirecting to your dashboard...</>
            ) : (
              <>
                Your{" "}
                <span className="font-semibold text-navy">{itemInfo.label}</span>{" "}
                has been added to your account. Redirecting to your dashboard...
              </>
            )}
          </p>
          <Link
            href="/dashboard"
            className="mt-6 inline-flex items-center rounded-lg bg-forest px-6 py-3 text-sm font-semibold text-cream transition hover:bg-forest-light"
          >
            Go to Dashboard
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-cream to-cream-dark px-4 py-16 sm:py-24">
      <div className="mx-auto max-w-lg">
        <div className="rounded-2xl border border-cream-dark bg-white p-8 shadow-lg text-center">
          {/* Gift icon */}
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gold/10">
            <span className="text-4xl">{itemInfo.icon}</span>
          </div>

          <h1 className="text-2xl font-bold text-navy sm:text-3xl">
            {isRequest
              ? "You\u2019ve been asked to record a message!"
              : "You\u2019ve received a gift!"}
          </h1>

          <p className="mt-3 text-warm-gray">
            <span className="font-semibold text-navy">
              {gift.sender_first_name}
            </span>{" "}
            {isRequest
              ? "would love for you to record a message on SendForGood."
              : "sent you a gift on SendForGood."}
          </p>

          {/* Item info */}
          <div className="mt-6 rounded-xl border border-cream-dark bg-cream/30 p-4">
            <p className="text-sm font-medium text-warm-gray">
              {isRequest ? "What They\u2019re Asking For" : "What You Got"}
            </p>
            <p className="mt-1 text-xl font-bold text-navy">
              {itemInfo.label}
            </p>
            {itemInfo.detail && (
              <p className="mt-1 text-sm text-warm-gray">{itemInfo.detail}</p>
            )}
          </div>

          {/* Sender message */}
          {gift.message && (
            <div className="mt-6 rounded-xl border-l-4 border-gold bg-cream/30 p-4 text-left">
              <p className="text-sm italic text-navy">
                &ldquo;{gift.message}&rdquo;
              </p>
              <p className="mt-2 text-xs text-warm-gray">
                &mdash; {gift.sender_first_name}
              </p>
            </div>
          )}

          {/* Claim button */}
          <button
            type="button"
            onClick={handleClaim}
            disabled={claiming}
            className="mt-8 w-full rounded-lg bg-forest px-8 py-3.5 text-sm font-bold text-cream shadow-lg transition hover:bg-forest-light disabled:cursor-not-allowed disabled:opacity-60"
          >
            {claiming
              ? isRequest ? "Accepting..." : "Claiming..."
              : !userId
                ? isRequest ? "Sign In to Accept" : "Sign In to Claim Your Gift"
                : isRequest ? "Accept & Record" : "Claim Your Gift"}
          </button>

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

          <p className="mt-4 text-xs text-warm-gray leading-relaxed">
            {isRequest
              ? "After accepting, you\u2019ll be able to record your message from your dashboard."
              : "After claiming, this item will be added to your dashboard and you can use it right away."}
          </p>
        </div>
      </div>
    </main>
  );
}

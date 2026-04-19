"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { TIERS } from "@/lib/constants";

interface GiftedItem {
  id: string;
  recipient_name: string | null;
  item_type: "letter" | "voice_message" | "gift_credit";
  tier: string | null;
  message_format: string | null;
  delivery_type: string | null;
  message: string | null;
  status: string;
  sender_first_name: string;
}

function getItemDescription(item: GiftedItem): {
  label: string;
  icon: string;
  detail: string;
} {
  if (item.item_type === "letter") {
    const deliveryLabel =
      item.delivery_type === "digital"
        ? "Digital"
        : item.delivery_type === "physical_photo"
          ? "Physical + Photo"
          : "Physical";
    return {
      label: "Legacy Letter",
      icon: "✉️",
      detail: `${deliveryLabel} delivery`,
    };
  }

  if (item.item_type === "voice_message") {
    const formatLabel =
      item.message_format === "video" ? "Video" : "Audio";
    return {
      label: `${formatLabel} Message Slot`,
      icon: item.message_format === "video" ? "🎬" : "🎙️",
      detail: `${formatLabel} recording slot`,
    };
  }

  if (item.item_type === "gift_credit") {
    const tierInfo = TIERS.find((t) => t.id === item.tier);
    const tierName = tierInfo?.name || item.tier || "Gift";
    return {
      label: `${tierName} Gift Credit`,
      icon: "🎁",
      detail: tierInfo?.description || "A curated gift credit",
    };
  }

  return { label: "Gift", icon: "🎁", detail: "" };
}

function NumberedStep({
  number,
  children,
}: {
  number: number;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-4 items-start">
      <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-gold/20 text-gold font-bold text-sm border border-gold/30">
        {number}
      </span>
      <p className="text-navy/80 text-sm leading-relaxed pt-1">{children}</p>
    </div>
  );
}

function GiftInstructions({ gift }: { gift: GiftedItem }) {
  const senderName = gift.sender_first_name;

  if (gift.item_type === "letter") {
    const isDigital = gift.delivery_type === "digital";
    const deliveryLabel = isDigital
      ? "Digital (delivered by email)"
      : "Physical (delivered by mail)";

    return (
      <div className="mt-6 rounded-xl border border-cream-dark bg-cream/40 p-6 text-left">
        <h2 className="text-lg font-bold text-navy">
          You received a Legacy Letter
        </h2>
        <p className="mt-3 text-sm text-navy/70 leading-relaxed">
          {senderName} has gifted you a letter slot — a blank canvas for you to
          use however you want. Write a letter to anyone you love, choose a
          delivery date, and we handle everything from there.
        </p>

        <h3 className="mt-5 text-sm font-semibold text-navy/90">
          Here is what happens next
        </h3>
        <div className="mt-3 flex flex-col gap-3">
          <NumberedStep number={1}>
            After claiming, your letter will appear in your SendForGood
            dashboard under <span className="font-semibold">My Messages</span>.
          </NumberedStep>
          <NumberedStep number={2}>
            Click <span className="font-semibold">Write Letter</span> to write
            your message and choose who receives it.
          </NumberedStep>
          <NumberedStep number={3}>
            Set when and where it is delivered. We handle the rest
            automatically.
          </NumberedStep>
        </div>

        <div className="mt-4 inline-flex items-center gap-2 rounded-lg bg-navy/5 px-3 py-1.5 text-xs font-medium text-navy/70 border border-navy/10">
          {isDigital ? (
            <>
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
                />
              </svg>
              {deliveryLabel}
            </>
          ) : (
            <>
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 13.5h3.86a2.25 2.25 0 0 1 2.012 1.244l.256.512a2.25 2.25 0 0 0 2.013 1.244h3.218a2.25 2.25 0 0 0 2.013-1.244l.256-.512a2.25 2.25 0 0 1 2.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18v-4.162"
                />
              </svg>
              {deliveryLabel}
            </>
          )}
        </div>
      </div>
    );
  }

  if (gift.item_type === "voice_message") {
    const isVideo = gift.message_format === "video";
    const formatLabel = isVideo ? "video" : "audio";
    const heading = isVideo
      ? "You received a Video Message slot"
      : "You received a Voice Message slot";

    return (
      <div className="mt-6 rounded-xl border border-cream-dark bg-cream/40 p-6 text-left">
        <h2 className="text-lg font-bold text-navy">{heading}</h2>
        <p className="mt-3 text-sm text-navy/70 leading-relaxed">
          {senderName} has given you a slot to record a personal {formatLabel}{" "}
          message that will be delivered to someone on a date you choose.
        </p>

        <h3 className="mt-5 text-sm font-semibold text-navy/90">
          Here is what happens next
        </h3>
        <div className="mt-3 flex flex-col gap-3">
          <NumberedStep number={1}>
            After claiming, go to your dashboard and find the message under{" "}
            <span className="font-semibold">My Messages</span>.
          </NumberedStep>
          <NumberedStep number={2}>
            Click <span className="font-semibold">Record Message</span> to
            record your {formatLabel} (up to 5 minutes).
          </NumberedStep>
          <NumberedStep number={3}>
            Set who it is for and when it should be delivered — a birthday,
            anniversary, or any date.
          </NumberedStep>
          <NumberedStep number={4}>
            We deliver it automatically on the scheduled date.
          </NumberedStep>
        </div>
      </div>
    );
  }

  if (gift.item_type === "gift_credit") {
    const tierInfo = TIERS.find((t) => t.id === gift.tier);
    const tierName = tierInfo?.name || gift.tier || "Gift";

    return (
      <div className="mt-6 rounded-xl border border-cream-dark bg-cream/40 p-6 text-left">
        <h2 className="text-lg font-bold text-navy">
          You received a {tierName} Gift Credit
        </h2>
        <p className="mt-3 text-sm text-navy/70 leading-relaxed">
          {senderName} has given you a gift credit. This means we will select and
          ship a real physical gift to someone you choose — every year,
          automatically.
        </p>

        {tierInfo && (
          <div className="mt-4 rounded-lg bg-gold/5 border border-gold/15 px-4 py-3">
            <p className="text-xs font-semibold text-gold uppercase tracking-wide">
              What is the {tierName} tier?
            </p>
            <p className="mt-1 text-sm text-navy/70">{tierInfo.description}</p>
            {tierInfo.features && (
              <ul className="mt-2 flex flex-col gap-1">
                {tierInfo.features.map((f) => (
                  <li
                    key={f}
                    className="text-xs text-navy/60 flex items-start gap-2"
                  >
                    <span className="text-gold mt-0.5">&#10003;</span>
                    {f}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <h3 className="mt-5 text-sm font-semibold text-navy/90">
          Here is what happens next
        </h3>
        <div className="mt-3 flex flex-col gap-3">
          <NumberedStep number={1}>
            After claiming, go to your dashboard and find the gift under{" "}
            <span className="font-semibold">My Gifts</span>.
          </NumberedStep>
          <NumberedStep number={2}>
            Click <span className="font-semibold">Assign</span> to choose who
            receives the gift, their address, and the occasion (birthday,
            holiday, etc.).
          </NumberedStep>
          <NumberedStep number={3}>
            We source, purchase, and ship a gift every year on that date —
            automatically.
          </NumberedStep>
          <NumberedStep number={4}>
            You never have to think about it again.
          </NumberedStep>
        </div>
      </div>
    );
  }

  return null;
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
            Gift Claimed!
          </h1>
          <p className="mt-3 text-warm-gray">
            Your{" "}
            <span className="font-semibold text-navy">{itemInfo.label}</span>{" "}
            has been added to your account. Redirecting to your dashboard...
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
            You&apos;ve received a gift!
          </h1>

          <p className="mt-3 text-warm-gray">
            <span className="font-semibold text-navy">
              {gift.sender_first_name}
            </span>{" "}
            sent you a gift on SendForGood.
          </p>

          {/* Item info */}
          <div className="mt-6 rounded-xl border border-cream-dark bg-cream/30 p-4">
            <p className="text-sm font-medium text-warm-gray">What You Got</p>
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
        </div>

        {/* Instructions section — below the gift card, above the claim button */}
        <GiftInstructions gift={gift} />

        {/* Claim action */}
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={handleClaim}
            disabled={claiming}
            className="w-full rounded-lg bg-forest px-8 py-3.5 text-sm font-bold text-cream shadow-lg transition hover:bg-forest-light disabled:cursor-not-allowed disabled:opacity-60"
          >
            {claiming
              ? "Claiming..."
              : !userId
                ? "Sign In to Claim Your Gift"
                : "Claim Your Gift"}
          </button>

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

          <p className="mt-4 text-xs text-warm-gray leading-relaxed">
            After claiming, this will be added to your dashboard and you can
            get started right away.
          </p>
        </div>
      </div>
    </main>
  );
}

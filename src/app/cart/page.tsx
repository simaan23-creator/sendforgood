"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { TIERS, OCCASION_TYPES } from "@/lib/constants";
import {
  getCart,
  removeFromCart,
  getCartTotal,
  getCartCount,
  getLetterCart,
  removeLetterFromCart,
  getLetterCartTotal,
  getLetterCartCount,
  getVoiceMessageCart,
  removeVoiceMessageFromCart,
  getVoiceMessageCartTotal,
  getVoiceMessageCartCount,
  getCombinedCartCount,
  getCombinedCartTotal,
} from "@/lib/cart";
import type { CartItem, LetterCartItem, VoiceMessageCartItem } from "@/lib/cart";

export default function CartPage() {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [letterItems, setLetterItems] = useState<LetterCartItem[]>([]);
  const [voiceItems, setVoiceItems] = useState<VoiceMessageCartItem[]>([]);
  const [total, setTotal] = useState(0);
  const [count, setCount] = useState(0);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");

  // Auth state for checkout
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  function refreshCart() {
    setItems(getCart());
    setLetterItems(getLetterCart());
    setVoiceItems(getVoiceMessageCart());
    setTotal(getCombinedCartTotal());
    setCount(getCombinedCartCount());
  }

  useEffect(() => {
    refreshCart();
    window.addEventListener("cart-updated", refreshCart);
    return () => window.removeEventListener("cart-updated", refreshCart);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setIsLoggedIn(true);
        setUserEmail(data.user.email ?? null);
        setEmail(data.user.email ?? "");
        setFullName(data.user.user_metadata?.full_name ?? "");
      }
    });
  }, []);

  function handleRemove(id: string) {
    removeFromCart(id);
    refreshCart();
  }

  function handleRemoveLetter(id: string) {
    removeLetterFromCart(id);
    refreshCart();
  }

  function handleRemoveVoice(id: string) {
    removeVoiceMessageFromCart(id);
    refreshCart();
  }

  async function handleCheckout() {
    if (!isLoggedIn && (!email.trim() || !fullName.trim())) {
      setCheckoutError("Please enter your name and email to proceed.");
      return;
    }

    setIsCheckingOut(true);
    setCheckoutError("");

    try {
      const res = await fetch("/api/cart/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          letterItems,
          voiceItems,
          email: email || userEmail,
          fullName,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Something went wrong. Please try again.");
      }

      const { url } = await res.json();
      window.location.href = url;
    } catch (err: unknown) {
      setCheckoutError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setIsCheckingOut(false);
    }
  }

  function getOccasionLabel(item: CartItem): string {
    if (item.occasionType === "custom") return item.occasionLabel;
    return OCCASION_TYPES.find((o) => o.value === item.occasionType)?.label ?? item.occasionType;
  }

  function getTierName(tierId: string): string {
    return TIERS.find((t) => t.id === tierId)?.name ?? tierId;
  }

  /* ════════════════════════════ Empty Cart ═════════════════════════════ */

  if (count === 0) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-cream to-cream-dark px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-lg text-center">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-cream-dark">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-12 w-12 text-warm-gray-light">
              <path d="M2.25 2.25a.75.75 0 0 0 0 1.5h1.386c.17 0 .318.114.362.278l2.558 9.592a3.752 3.752 0 0 0-2.806 3.63c0 .414.336.75.75.75h15.75a.75.75 0 0 0 0-1.5H5.378A2.25 2.25 0 0 1 7.5 14.25h11.218a.75.75 0 0 0 .674-.421 60.358 60.358 0 0 0 2.96-7.228.75.75 0 0 0-.525-.965A60.864 60.864 0 0 0 5.68 4.509l-.232-.867A1.875 1.875 0 0 0 3.636 2.25H2.25ZM3.75 20.25a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0ZM16.5 20.25a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">Your cart is empty</h1>
          <p className="mt-3 text-warm-gray">
            Start adding gifts or letters to surprise your loved ones year after year.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/send"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-navy px-6 py-3 text-sm font-semibold text-cream shadow-md transition hover:bg-navy-light"
            >
              Start Adding Gifts
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path fillRule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z" clipRule="evenodd" />
              </svg>
            </Link>
            <Link
              href="/letters/write"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-navy px-6 py-3 text-sm font-semibold text-navy transition hover:bg-navy hover:text-cream"
            >
              Add a Legacy Letter
            </Link>
            <Link
              href="/voice/record"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-navy px-6 py-3 text-sm font-semibold text-navy transition hover:bg-navy hover:text-cream"
            >
              Record a Voice Message
            </Link>
          </div>
        </div>
      </main>
    );
  }

  /* ════════════════════════════ Cart with items ════════════════════════ */

  return (
    <main className="min-h-screen bg-gradient-to-b from-cream to-cream-dark px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">Your Cart</h1>
          <div className="flex items-center gap-4">
            <Link
              href="/send"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-navy/70 transition hover:text-navy"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
              </svg>
              Add Gift
            </Link>
            <Link
              href="/letters/write"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-navy/70 transition hover:text-navy"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
              </svg>
              Add Letter
            </Link>
            <Link
              href="/voice/record"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-navy/70 transition hover:text-navy"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
              </svg>
              Add Voice
            </Link>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* ──────────── Cart Items ──────────── */}
          <div className="space-y-4 lg:col-span-2">
            {/* Gift items */}
            {items.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-cream-dark bg-white p-5 shadow-sm transition hover:shadow-md sm:p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-navy truncate">
                      {item.recipientName}
                    </h3>
                    <p className="mt-1 text-sm text-warm-gray">
                      {getOccasionLabel(item)} &middot; {item.relationship}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemove(item.id)}
                    className="shrink-0 rounded-lg p-1.5 text-warm-gray-light transition hover:bg-red-50 hover:text-red-500"
                    aria-label={`Remove ${item.recipientName}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                      <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-4">
                  <div>
                    <span className="text-warm-gray-light">Tier</span>
                    <p className="font-medium text-navy">{getTierName(item.tier)}</p>
                  </div>
                  <div>
                    <span className="text-warm-gray-light">Duration</span>
                    <p className="font-medium text-navy">
                      {item.years} {item.years === 1 ? "year" : "years"}
                    </p>
                  </div>
                  <div>
                    <span className="text-warm-gray-light">Per Year</span>
                    <p className="font-medium text-navy">${item.unitPrice}</p>
                  </div>
                  <div>
                    <span className="text-warm-gray-light">Total</span>
                    <p className="font-bold text-forest">${item.totalPrice.toLocaleString()}</p>
                  </div>
                </div>

                <div className="mt-3 text-xs text-warm-gray-light">
                  {item.city}, {item.state} {item.postalCode}
                </div>
              </div>
            ))}

            {/* Letter items */}
            {letterItems.map((letter) => (
              <div
                key={letter.id}
                className="rounded-xl border border-gold/30 bg-white p-5 shadow-sm transition hover:shadow-md sm:p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-navy truncate">
                        {letter.recipientName}
                      </h3>
                      <span className="shrink-0 rounded-full bg-gold/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gold">
                        Letter
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-warm-gray capitalize">
                      {letter.letterType} &middot;{" "}
                      {letter.deliveryType === "digital"
                        ? "Digital (Email)"
                        : letter.deliveryType === "physical_photo"
                          ? "Physical + Photo"
                          : "Physical (Mailed)"}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveLetter(letter.id)}
                    className="shrink-0 rounded-lg p-1.5 text-warm-gray-light transition hover:bg-red-50 hover:text-red-500"
                    aria-label={`Remove letter for ${letter.recipientName}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                      <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-4">
                  <div>
                    <span className="text-warm-gray-light">Type</span>
                    <p className="font-medium text-navy capitalize">{letter.letterType}</p>
                  </div>
                  <div>
                    <span className="text-warm-gray-light">Quantity</span>
                    <p className="font-medium text-navy">
                      {letter.quantity} {letter.letterType === "annual" ? (letter.quantity === 1 ? "year" : "years") : (letter.quantity === 1 ? "letter" : "letters")}
                    </p>
                  </div>
                  <div>
                    <span className="text-warm-gray-light">Per Unit</span>
                    <p className="font-medium text-navy">${(letter.unitPrice / 100).toFixed(0)}</p>
                  </div>
                  <div>
                    <span className="text-warm-gray-light">Total</span>
                    <p className="font-bold text-forest">${(letter.totalPrice / 100).toFixed(0)}</p>
                  </div>
                </div>

                <div className="mt-3 text-xs text-warm-gray-light">
                  {letter.deliveryType === "digital"
                    ? letter.recipientEmail
                    : `${letter.city}, ${letter.state} ${letter.postalCode}`}
                </div>
              </div>
            ))}
            {/* Voice message items */}
            {voiceItems.map((voice) => (
              <div
                key={voice.id}
                className="rounded-xl border border-gold/30 bg-white p-5 shadow-sm transition hover:shadow-md sm:p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-navy truncate">
                        {voice.recipientName}
                      </h3>
                      <span className="shrink-0 rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-red-600">
                        {voice.messageFormat === "video" ? "Video" : "Audio"}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-warm-gray capitalize">
                      {voice.messageType} &middot; {voice.messageFormat === "video" ? "Video" : "Audio"} (Email)
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveVoice(voice.id)}
                    className="shrink-0 rounded-lg p-1.5 text-warm-gray-light transition hover:bg-red-50 hover:text-red-500"
                    aria-label={`Remove voice message for ${voice.recipientName}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                      <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-4">
                  <div>
                    <span className="text-warm-gray-light">Type</span>
                    <p className="font-medium text-navy capitalize">{voice.messageType}</p>
                  </div>
                  <div>
                    <span className="text-warm-gray-light">Quantity</span>
                    <p className="font-medium text-navy">
                      {voice.quantity} {voice.messageType === "annual" ? (voice.quantity === 1 ? "year" : "years") : (voice.quantity === 1 ? "message" : "messages")}
                    </p>
                  </div>
                  <div>
                    <span className="text-warm-gray-light">Per Unit</span>
                    <p className="font-medium text-navy">${(voice.unitPrice / 100).toFixed(0)}</p>
                  </div>
                  <div>
                    <span className="text-warm-gray-light">Total</span>
                    <p className="font-bold text-forest">${(voice.totalPrice / 100).toFixed(0)}</p>
                  </div>
                </div>

                <div className="mt-3 text-xs text-warm-gray-light">
                  {voice.recipientEmail}
                </div>
              </div>
            ))}
          </div>

          {/* ──────────── Order Summary Sidebar ──────────── */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 rounded-xl border border-cream-dark bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-lg font-bold text-navy">Order Summary</h2>

              <div className="mt-4 space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-sm">
                    <span className="text-warm-gray truncate max-w-[60%]">
                      {getTierName(item.tier)} &mdash; {item.recipientName}
                    </span>
                    <span className="font-medium text-navy">${item.totalPrice.toLocaleString()}</span>
                  </div>
                ))}
                {letterItems.map((letter) => (
                  <div key={letter.id} className="flex items-center justify-between text-sm">
                    <span className="text-warm-gray truncate max-w-[60%]">
                      Letter &mdash; {letter.recipientName}
                    </span>
                    <span className="font-medium text-navy">${(letter.totalPrice / 100).toFixed(0)}</span>
                  </div>
                ))}
                {voiceItems.map((voice) => (
                  <div key={voice.id} className="flex items-center justify-between text-sm">
                    <span className="text-warm-gray truncate max-w-[60%]">
                      {voice.messageFormat === "video" ? "Video" : "Audio"} &mdash; {voice.recipientName}
                    </span>
                    <span className="font-medium text-navy">${(voice.totalPrice / 100).toFixed(0)}</span>
                  </div>
                ))}
              </div>

              <div className="mt-4 border-t border-cream-dark pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-warm-gray">
                    {count} {count === 1 ? "item" : "items"}
                  </span>
                  <span className="text-xl font-extrabold text-forest">
                    ${total.toLocaleString()}
                  </span>
                </div>
                <p className="mt-2 text-xs text-warm-gray-light">
                  {letterItems.some((l) => l.deliveryType === "digital")
                    ? "Digital letters via email; physical items ship to continental US"
                    : "Ships to continental US only"}
                </p>
              </div>

              {/* Contact info for non-logged-in users */}
              {!isLoggedIn && (
                <div className="mt-5 space-y-3 border-t border-cream-dark pt-4">
                  <p className="text-xs text-warm-gray">
                    Enter your info to proceed to checkout.
                  </p>
                  <div>
                    <label htmlFor="cart-fullName" className="mb-1 block text-xs font-medium text-navy">
                      Full name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="cart-fullName"
                      type="text"
                      placeholder="John Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full rounded-lg border border-cream-dark bg-cream/50 px-3 py-2 text-sm text-navy placeholder:text-warm-gray-light transition focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
                    />
                  </div>
                  <div>
                    <label htmlFor="cart-email" className="mb-1 block text-xs font-medium text-navy">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="cart-email"
                      type="email"
                      placeholder="john@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-lg border border-cream-dark bg-cream/50 px-3 py-2 text-sm text-navy placeholder:text-warm-gray-light transition focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
                    />
                  </div>
                </div>
              )}

              {isLoggedIn && userEmail && (
                <p className="mt-4 text-xs text-warm-gray">
                  Checking out as <span className="font-medium text-navy">{userEmail}</span>
                </p>
              )}

              {checkoutError && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                  {checkoutError}
                </div>
              )}

              <button
                type="button"
                onClick={handleCheckout}
                disabled={isCheckingOut}
                className="mt-5 w-full rounded-lg bg-forest py-3.5 text-center text-sm font-bold text-cream shadow-lg transition hover:bg-forest-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isCheckingOut ? (
                  <span className="inline-flex items-center gap-2">
                    <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Processing...
                  </span>
                ) : (
                  `Proceed to Checkout — $${total.toLocaleString()}`
                )}
              </button>

              {/* Trust badges */}
              <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[10px] text-warm-gray-light">
                <span className="inline-flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3">
                    <path fillRule="evenodd" d="M10 1a4.5 4.5 0 0 0-4.5 4.5V9H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-.5V5.5A4.5 4.5 0 0 0 10 1Zm3 8V5.5a3 3 0 1 0-6 0V9h6Z" clipRule="evenodd" />
                  </svg>
                  Secure payment
                </span>
                <span className="inline-flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3">
                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                  </svg>
                  Cancel anytime
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

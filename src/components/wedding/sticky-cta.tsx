"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

/**
 * Mobile-only sticky CTA bar.
 * Appears after the user has scrolled past the hero (≈600px) and stays
 * pinned to the bottom of the viewport. Always-visible primary CTA on
 * mobile dramatically lifts conversion on long landing pages.
 */
export default function StickyCTA() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      const y = window.scrollY;
      // Show after hero, hide near the very bottom (so it doesn't double up
      // with the final CTA section).
      const nearBottom =
        window.innerHeight + y >= document.documentElement.scrollHeight - 600;
      setVisible(y > 600 && !nearBottom);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      aria-hidden={!visible}
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-cream-dark bg-cream/95 px-4 py-3 shadow-2xl backdrop-blur transition-transform duration-300 sm:hidden ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-semibold uppercase tracking-wide text-gold">
            Starter Package
          </div>
          <div className="text-sm font-bold leading-tight text-navy">
            $99.95 &middot; vault + 50 video + 200 photo
          </div>
        </div>
        <Link
          href="/vault/buy?bundle=starter"
          className="shrink-0 rounded-lg bg-gold px-4 py-2.5 text-sm font-bold text-navy shadow transition hover:bg-gold-light"
        >
          Get it
        </Link>
      </div>
    </div>
  );
}

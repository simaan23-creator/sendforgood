"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

const NAV_LINKS = [
  { href: "/#how-it-works", label: "How It Works" },
  { href: "/gifts", label: "Gifts" },
  { href: "/pricing", label: "Pricing" },
  { href: "/business", label: "For Business" },
  { href: "/about", label: "About" },
] as const;

export function Header() {
  const [user, setUser] = useState<User | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-cream border-b border-cream-dark/60 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-1.5 group">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-gold transition-transform duration-200 group-hover:scale-110"
              aria-hidden="true"
            >
              <path
                d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                fill="currentColor"
              />
            </svg>
            <span className="text-xl font-bold text-navy tracking-tight">
              SendForGood
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8" aria-label="Main navigation">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-navy/70 hover:text-navy transition-colors duration-150"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Auth + CTA */}
          <div className="hidden md:flex items-center gap-3">
            {!loading && (
              <>
                {user ? (
                  <Link
                    href="/dashboard"
                    className="text-sm font-medium text-navy/70 hover:text-navy transition-colors duration-150"
                  >
                    Dashboard
                  </Link>
                ) : (
                  <Link
                    href="/auth"
                    className="text-sm font-medium text-navy/70 hover:text-navy transition-colors duration-150"
                  >
                    Sign In
                  </Link>
                )}
              </>
            )}
            <Link
              href="/send"
              className="inline-flex items-center justify-center rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-cream shadow-sm hover:bg-navy-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy transition-colors duration-150"
            >
              Start Sending
            </Link>
          </div>

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            className="md:hidden inline-flex items-center justify-center rounded-md p-2 text-navy hover:bg-cream-dark transition-colors duration-150"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {mobileMenuOpen ? (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div id="mobile-menu" className="md:hidden border-t border-cream-dark/60">
          <nav className="mx-auto max-w-7xl px-4 py-4 space-y-1" aria-label="Mobile navigation">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block rounded-lg px-3 py-2.5 text-base font-medium text-navy/70 hover:bg-cream-dark hover:text-navy transition-colors duration-150"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}

            <div className="pt-3 mt-3 border-t border-cream-dark/60 space-y-2">
              {!loading && (
                <>
                  {user ? (
                    <Link
                      href="/dashboard"
                      className="block rounded-lg px-3 py-2.5 text-base font-medium text-navy/70 hover:bg-cream-dark hover:text-navy transition-colors duration-150"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                  ) : (
                    <Link
                      href="/auth"
                      className="block rounded-lg px-3 py-2.5 text-base font-medium text-navy/70 hover:bg-cream-dark hover:text-navy transition-colors duration-150"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Sign In
                    </Link>
                  )}
                </>
              )}
              <Link
                href="/send"
                className="block w-full rounded-lg bg-navy px-3 py-2.5 text-center text-base font-semibold text-cream shadow-sm hover:bg-navy-light transition-colors duration-150"
                onClick={() => setMobileMenuOpen(false)}
              >
                Start Sending
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

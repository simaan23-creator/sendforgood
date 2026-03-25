"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type AuthTab = "sign-in" | "sign-up";

function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/dashboard";

  const [tab, setTab] = useState<AuthTab>("sign-in");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        router.replace(redirectTo);
      } else {
        setCheckingAuth(false);
      }
    });
  }, [router, redirectTo, supabase.auth]);

  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam === "auth_failed") {
      setError("Authentication failed. Please try again.");
    }
  }, [searchParams]);

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectTo)}`,
      },
    });

    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      setMagicLinkSent(true);
    }
  }

  async function handleGoogleOAuth() {
    setError(null);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectTo)}`,
      },
    });

    if (error) {
      setError(error.message);
    }
  }

  if (checkingAuth) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gold border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12 sm:px-6">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-cream-dark bg-white p-8 shadow-lg sm:p-10">
          {/* Logo */}
          <Link href="/" className="mb-8 flex items-center justify-center gap-2">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-gold"
              aria-hidden="true"
            >
              <path
                d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                fill="currentColor"
              />
            </svg>
            <span className="text-2xl font-bold tracking-tight text-navy">
              SendForGood
            </span>
          </Link>

          {/* Tab Toggle */}
          <div className="mb-6 flex rounded-lg bg-cream p-1">
            <button
              type="button"
              onClick={() => {
                setTab("sign-in");
                setError(null);
                setMagicLinkSent(false);
              }}
              className={`flex-1 rounded-md px-4 py-2.5 text-sm font-semibold transition-colors duration-150 ${
                tab === "sign-in"
                  ? "bg-navy text-cream shadow-sm"
                  : "text-warm-gray hover:text-navy"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setTab("sign-up");
                setError(null);
                setMagicLinkSent(false);
              }}
              className={`flex-1 rounded-md px-4 py-2.5 text-sm font-semibold transition-colors duration-150 ${
                tab === "sign-up"
                  ? "bg-navy text-cream shadow-sm"
                  : "text-warm-gray hover:text-navy"
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Heading */}
          <h1 className="text-center text-xl font-bold text-navy">
            {tab === "sign-in" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mt-2 text-center text-sm text-warm-gray">
            {tab === "sign-in"
              ? "Sign in to manage your gifts and recipients."
              : "Start sending gifts that last a lifetime."}
          </p>

          {/* Error State */}
          {error && (
            <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <div className="flex items-start gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="mt-0.5 h-4 w-4 shrink-0"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Success State (Magic Link Sent) */}
          {magicLinkSent ? (
            <div className="mt-6">
              <div className="rounded-lg border border-forest/20 bg-forest/5 px-4 py-5 text-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mx-auto h-10 w-10 text-forest"
                  aria-hidden="true"
                >
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="M22 4L12 13 2 4" />
                </svg>
                <h2 className="mt-3 font-semibold text-navy">
                  Check your email
                </h2>
                <p className="mt-2 text-sm text-warm-gray">
                  We sent a magic link to{" "}
                  <span className="font-medium text-navy">{email}</span>. Click
                  the link in the email to{" "}
                  {tab === "sign-in" ? "sign in" : "create your account"}.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setMagicLinkSent(false);
                  setEmail("");
                }}
                className="mt-4 w-full text-center text-sm font-medium text-navy/70 hover:text-navy transition-colors duration-150"
              >
                Use a different email
              </button>
            </div>
          ) : (
            <>
              {/* Magic Link Form */}
              <form onSubmit={handleMagicLink} className="mt-6 space-y-4">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-navy"
                  >
                    Email address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="mt-1.5 block w-full rounded-lg border border-cream-dark bg-cream px-4 py-2.5 text-navy placeholder:text-warm-gray-light focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30 transition-colors duration-150"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !email}
                  className="inline-flex w-full items-center justify-center rounded-lg bg-gold px-4 py-3 text-sm font-semibold text-navy shadow-sm transition-colors duration-150 hover:bg-gold-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:opacity-50 disabled:pointer-events-none"
                >
                  {loading ? (
                    <>
                      <svg
                        className="mr-2 h-4 w-4 animate-spin"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Sending...
                    </>
                  ) : (
                    <>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="mr-2 h-4 w-4"
                        aria-hidden="true"
                      >
                        <path d="M3 4a2 2 0 0 0-2 2v1.161l8.441 4.221a1.25 1.25 0 0 0 1.118 0L19 7.162V6a2 2 0 0 0-2-2H3Z" />
                        <path d="m19 8.839-7.77 3.885a2.75 2.75 0 0 1-2.46 0L1 8.839V14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.839Z" />
                      </svg>
                      Send Magic Link
                    </>
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-cream-dark" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white px-3 text-warm-gray-light">
                    or continue with
                  </span>
                </div>
              </div>

              {/* Google OAuth Button */}
              <button
                type="button"
                onClick={handleGoogleOAuth}
                className="inline-flex w-full items-center justify-center gap-3 rounded-lg border-2 border-cream-dark bg-white px-4 py-3 text-sm font-semibold text-navy transition-colors duration-150 hover:bg-cream hover:border-navy/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"
                    fill="#4285F4"
                  />
                  <path
                    d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"
                    fill="#34A853"
                  />
                  <path
                    d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z"
                    fill="#EA4335"
                  />
                </svg>
                Continue with Google
              </button>
            </>
          )}

          {/* Footer text */}
          <p className="mt-8 text-center text-xs text-warm-gray-light">
            By continuing, you agree to our{" "}
            <Link
              href="/terms"
              className="font-medium text-navy/70 underline decoration-cream-dark hover:text-navy hover:decoration-navy transition-colors duration-150"
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              href="/privacy"
              className="font-medium text-navy/70 underline decoration-cream-dark hover:text-navy hover:decoration-navy transition-colors duration-150"
            >
              Privacy Policy
            </Link>
            .
          </p>
        </div>

        {/* Back to home */}
        <p className="mt-6 text-center">
          <Link
            href="/"
            className="text-sm font-medium text-warm-gray hover:text-navy transition-colors duration-150"
          >
            &larr; Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[80vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gold border-t-transparent" />
        </div>
      }
    >
      <AuthForm />
    </Suspense>
  );
}

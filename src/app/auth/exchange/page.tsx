"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Suspense } from "react";

function ExchangeInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState("Processing...");

  useEffect(() => {
    const code = searchParams.get("code");
    const token_hash = searchParams.get("token_hash");
    const type = searchParams.get("type");
    const redirect = searchParams.get("redirect") || "/dashboard";

    async function exchange() {
      const supabase = createClient();

      try {
        if (token_hash && type) {
          setStatus("Verifying magic link...");
          const { error } = await supabase.auth.verifyOtp({
            token_hash,
            type: type as "email" | "magiclink" | "recovery" | "invite",
          });
          if (error) {
            setStatus("Failed: " + error.message);
            setTimeout(() => router.push("/auth?error=auth_failed"), 2000);
            return;
          }
        } else if (code) {
          setStatus("Completing sign in...");
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            setStatus("Failed: " + error.message);
            setTimeout(() => router.push("/auth?error=auth_failed"), 2000);
            return;
          }
        }

        setStatus("Success! Redirecting...");
        // Hard redirect to ensure session cookies are properly set
        window.location.href = redirect;
      } catch (err) {
        setStatus("Error occurred. Redirecting...");
        setTimeout(() => router.push("/auth?error=auth_failed"), 2000);
      }
    }

    exchange();
  }, []);

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-navy border-t-transparent" />
        <p className="text-navy font-medium">{status}</p>
      </div>
    </div>
  );
}

export default function ExchangePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-navy border-t-transparent" />
      </div>
    }>
      <ExchangeInner />
    </Suspense>
  );
}

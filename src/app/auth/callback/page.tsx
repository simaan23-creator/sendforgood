"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AuthCallbackPage() {
  useEffect(() => {
    const supabase = createClient();

    // Handle hash-based session (access_token in URL hash)
    const hash = window.location.hash;
    if (hash) {
      const params = new URLSearchParams(hash.substring(1));
      const access_token = params.get("access_token");
      const refresh_token = params.get("refresh_token");

      if (access_token && refresh_token) {
        supabase.auth.setSession({ access_token, refresh_token }).then(({ error }) => {
          if (!error) {
            window.location.href = "/dashboard";
          } else {
            window.location.href = "/auth?error=auth_failed";
          }
        });
        return;
      }
    }

    // Handle query param based (token_hash)
    const params = new URLSearchParams(window.location.search);
    const token_hash = params.get("token_hash");
    const type = params.get("type");

    if (token_hash && type) {
      supabase.auth.verifyOtp({ token_hash, type: type as "email" | "magiclink" }).then(({ error }) => {
        if (!error) {
          window.location.href = "/dashboard";
        } else {
          window.location.href = "/auth?error=auth_failed";
        }
      });
      return;
    }

    // No auth params found
    window.location.href = "/auth?error=auth_failed";
  }, []);

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-navy border-t-transparent" />
        <p className="text-navy font-medium">Signing you in...</p>
      </div>
    </div>
  );
}

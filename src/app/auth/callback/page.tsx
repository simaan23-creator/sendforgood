"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AuthCallbackPage() {
  const [status, setStatus] = useState("Processing...");

  useEffect(() => {
    const supabase = createClient();
    const hash = window.location.hash;
    const search = window.location.search;

    async function handleAuth() {
      // Handle hash-based tokens (Google OAuth implicit flow)
      if (hash && hash.length > 1) {
        const params = new URLSearchParams(hash.substring(1));
        const access_token = params.get("access_token");
        const refresh_token = params.get("refresh_token");
        const error = params.get("error");
        const error_description = params.get("error_description");

        if (error) {
          setStatus(`Error: ${error_description || error}`);
          setTimeout(() => { window.location.href = "/auth?error=auth_failed"; }, 3000);
          return;
        }

        if (access_token && refresh_token) {
          setStatus("Setting session...");
          const { error: sessionError } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });
          if (sessionError) {
            setStatus(`Session error: ${sessionError.message}`);
            setTimeout(() => { window.location.href = "/auth?error=auth_failed"; }, 3000);
            return;
          }
          setStatus("Success!");
          window.location.href = "/dashboard";
          return;
        }
      }

      // Handle query param tokens (magic link / PKCE)
      if (search) {
        const params = new URLSearchParams(search);
        const code = params.get("code");
        const token_hash = params.get("token_hash");
        const type = params.get("type");

        if (code) {
          setStatus("Exchanging code...");
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (!error) {
            setStatus("Success!");
            window.location.href = "/dashboard";
            return;
          }
        }

        if (token_hash && type) {
          setStatus("Verifying...");
          const { error } = await supabase.auth.verifyOtp({
            token_hash,
            type: type as "email" | "magiclink",
          });
          if (!error) {
            setStatus("Success!");
            window.location.href = "/dashboard";
            return;
          }
        }
      }

      setStatus("No auth params found");
      setTimeout(() => { window.location.href = "/auth"; }, 2000);
    }

    handleAuth();
  }, []);

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center">
      <div className="text-center px-4">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-navy border-t-transparent" />
        <p className="text-navy font-medium">{status}</p>
      </div>
    </div>
  );
}

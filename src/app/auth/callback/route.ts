import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const redirect = searchParams.get("redirect") || "/dashboard";

  const supabase = await createClient();

  // Handle magic link (token_hash flow)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash, type: type as "email" | "magiclink" | "recovery" | "invite" });
    if (!error) {
      return NextResponse.redirect(`${origin}${redirect}`);
    }
  }

  // Handle OAuth code flow (Google etc)
  if (code) {
    try {
      const exchangePromise = supabase.auth.exchangeCodeForSession(code);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), 10000)
      );
      const result = await Promise.race([exchangePromise, timeoutPromise]) as { error: unknown };
      if (!result.error) {
        return NextResponse.redirect(`${origin}${redirect}`);
      }
    } catch {
      // timeout or error — redirect to auth with error
    }
  }

  return NextResponse.redirect(`${origin}/auth?error=auth_failed`);
}

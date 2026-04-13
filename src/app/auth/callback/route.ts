import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as string;
  const redirect = searchParams.get("redirect") || "/dashboard";
  const next = searchParams.get("next") || redirect;

  if (code || (token_hash && type)) {
    const supabase = await createClient();

    try {
      if (token_hash && type) {
        const { error } = await supabase.auth.verifyOtp({
          token_hash,
          type: type as "email" | "magiclink" | "recovery" | "invite",
        });
        if (!error) {
          return NextResponse.redirect(`${origin}${next}`);
        }
      }

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
          return NextResponse.redirect(`${origin}${next}`);
        }
      }
    } catch {
      // fall through to error
    }
  }

  return NextResponse.redirect(`${origin}/auth?error=auth_failed`);
}

import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const redirect = searchParams.get("redirect") || "/dashboard";

  // For OAuth code flow — redirect to client-side handler
  if (code) {
    return NextResponse.redirect(
      `${origin}/auth/exchange?code=${encodeURIComponent(code)}&redirect=${encodeURIComponent(redirect)}`
    );
  }

  // For magic link token_hash flow — redirect to client-side handler
  if (token_hash && type) {
    return NextResponse.redirect(
      `${origin}/auth/exchange?token_hash=${encodeURIComponent(token_hash)}&type=${encodeURIComponent(type)}&redirect=${encodeURIComponent(redirect)}`
    );
  }

  return NextResponse.redirect(`${origin}/auth?error=auth_failed`);
}

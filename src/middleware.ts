import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const response = await updateSession(request);

  // Affiliate tracking: if ?ref= query param exists, set a 30-day cookie
  const refCode = request.nextUrl.searchParams.get("ref");
  if (refCode && /^[a-z0-9_-]+$/.test(refCode)) {
    const res = response ?? NextResponse.next({ request });
    res.cookies.set("sfg_affiliate", refCode, {
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/",
      httpOnly: false,
      sameSite: "lax",
    });
    return res;
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

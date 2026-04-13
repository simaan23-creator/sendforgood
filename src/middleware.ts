import { type NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Affiliate tracking: if ?ref= query param exists, set a 30-day cookie
  const refCode = request.nextUrl.searchParams.get("ref");
  if (refCode && /^[a-z0-9_-]+$/.test(refCode)) {
    const response = NextResponse.next({ request });
    response.cookies.set("sfg_affiliate", refCode, {
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
      httpOnly: false,
      sameSite: "lax",
    });
    return response;
  }

  return NextResponse.next({ request });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

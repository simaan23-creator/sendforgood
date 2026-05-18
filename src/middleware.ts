import { type NextRequest, NextResponse } from "next/server";

// Conservative security headers. Applied to all HTML page responses
// (the matcher below excludes /api, static assets, and image files).
//
// CSP allows inline scripts/styles (Next.js + Tailwind generate them and
// would otherwise require per-request nonces), but explicitly enumerates
// every external host. This blocks the most common XSS payload shapes
// (loading attacker-controlled scripts) without breaking the app.
const CSP_DIRECTIVES = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://www.googleadservices.com https://www.google.com https://www.gstatic.com https://js.stripe.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https://wsjpurqemkpmssrqmndy.supabase.co https://api.qrserver.com https://www.google-analytics.com https://www.googletagmanager.com https://www.google.com https://googleads.g.doubleclick.net",
  "font-src 'self' data: https://fonts.gstatic.com",
  "connect-src 'self' https://wsjpurqemkpmssrqmndy.supabase.co wss://wsjpurqemkpmssrqmndy.supabase.co https://www.google-analytics.com https://www.googletagmanager.com https://api.stripe.com https://*.ingest.sentry.io",
  "media-src 'self' blob: https://wsjpurqemkpmssrqmndy.supabase.co",
  "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://checkout.stripe.com https://www.google.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' https://checkout.stripe.com",
  "frame-ancestors 'self'",
  "upgrade-insecure-requests",
].join("; ");

function applySecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains"
  );
  response.headers.set(
    "Permissions-Policy",
    "camera=(self), microphone=(self), geolocation=(), payment=(self)"
  );
  response.headers.set("Content-Security-Policy", CSP_DIRECTIVES);
  return response;
}

// Requests for the root path are internally rewritten to /wedding so the
// wedding vault is the homepage. Applies to every hostname the app is
// served from. All other paths pass through unchanged.
function rewriteRootToWedding(request: NextRequest): NextResponse | null {
  if (request.nextUrl.pathname !== "/") return null;
  const url = request.nextUrl.clone();
  url.pathname = "/wedding";
  return NextResponse.rewrite(url);
}

export async function middleware(request: NextRequest) {
  // Wedding-vault homepage routing: rewrite root to /wedding
  const rewritten = rewriteRootToWedding(request);
  if (rewritten) {
    return applySecurityHeaders(rewritten);
  }

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
    return applySecurityHeaders(response);
  }

  return applySecurityHeaders(NextResponse.next({ request }));
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

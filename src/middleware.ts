import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

const protectedRoutes = ["/dashboard"];
const authRoutes = [
  "/login",
  "/register",
  "/forgot-password",
  "/verify",
  "/reset-password",
];
const guestProtectedRoutes = ["/guest/profile", "/guest/documents"];
const guestAuthRoutes = ["/guest/login"];

export async function middleware(req: NextRequest) {
  const { nextUrl } = req;
  const sessionCookie = getSessionCookie(req);
  const guestSessionCookie = req.cookies.get("guest_session")?.value;
  const res = NextResponse.next();

  const isLoggedIn = !!sessionCookie;
  const isGuestLoggedIn = !!guestSessionCookie;

  const isOnProtectedRoute = protectedRoutes.some((route) =>
    nextUrl.pathname.startsWith(route)
  );
  const isOnAuthRoute = authRoutes.some((route) =>
    nextUrl.pathname.startsWith(route)
  );
  const isOnGuestProtectedRoute = guestProtectedRoutes.some((route) =>
    nextUrl.pathname.startsWith(route)
  );
  const isOnGuestAuthRoute = guestAuthRoutes.some((route) =>
    nextUrl.pathname.startsWith(route)
  );

  // Regular auth routes
  if (isOnProtectedRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  if (isOnAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Guest auth routes
  if (isOnGuestProtectedRoute && !isGuestLoggedIn) {
    return NextResponse.redirect(new URL("/guest/login", req.url));
  }
  if (isOnGuestAuthRoute && isGuestLoggedIn) {
    return NextResponse.redirect(new URL("/guest/profile", req.url));
  }

  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};

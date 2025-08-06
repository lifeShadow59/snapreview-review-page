/**
 * NextAuth.js Middleware for Route Protection
 *
 * This middleware handles authentication-based route protection using NextAuth.js JWT tokens.
 * It's compatible with Edge Runtime for optimal performance.
 *
 * Protected Routes: /dashboard, /profile
 * - Redirects unauthenticated users to /auth/login
 *
 * Auth Routes: /auth/login, /auth/register
 * - Redirects authenticated users to /dashboard to prevent accessing auth pages when logged in
 *
 * Note: Using getToken() instead of auth() for Edge Runtime compatibility
 */

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

// Define protected routes that require authentication
const protectedRoutes = ["/dashboard", "/profile"];
// Define auth routes that should redirect authenticated users away
const authRoutes = ["/auth/login", "/auth/register"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get token using NextAuth JWT (compatible with Edge Runtime)
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Check if user is on a protected route
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Check if user is on an auth route
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // Redirect to login if trying to access protected route without token
  if (isProtectedRoute && !token) {
    const signInUrl = new URL("/auth/login", request.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Redirect to dashboard if trying to access auth routes with active token
  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};

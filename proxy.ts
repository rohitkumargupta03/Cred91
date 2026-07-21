/**
 * Route protection proxy for Cred91 LMS
 * 
 * In this version of Next.js, middleware is called "proxy".
 * This handles:
 * - Protecting /dashboard/* routes (authenticated users only)
 * - Protecting /admin/* routes (ADMIN role only)
 * - Redirecting authenticated users away from auth pages
 * - Role-based redirects after login
 */
import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const secretKey = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || "";
const encodedKey = new TextEncoder().encode(secretKey);

// Routes that require authentication
const protectedRoutes = ["/dashboard", "/admin"];
// Routes only for unauthenticated users
const authRoutes = ["/auth/login", "/auth/signup"];

async function getSessionFromCookie(req: NextRequest) {
  const sessionCookie = req.cookies.get("session")?.value;
  if (!sessionCookie) return null;

  try {
    const { payload } = await jwtVerify(sessionCookie, encodedKey, {
      algorithms: ["HS256"],
    });
    return payload as unknown as {
      userId: string;
      role: "BORROWER" | "ADMIN";
      name: string;
      email: string;
    };
  } catch {
    return null;
  }
}

export default async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const session = await getSessionFromCookie(req);

  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some((route) =>
    path.startsWith(route)
  );
  const isAuthRoute = authRoutes.some((route) => path.startsWith(route));
  const isAdminRoute = path.startsWith("/admin");

  // Unauthenticated user trying to access protected route → redirect to login
  if (isProtectedRoute && !session) {
    const loginUrl = new URL("/auth/login", req.nextUrl);
    loginUrl.searchParams.set("callbackUrl", path);
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated user trying to access auth pages → redirect to dashboard
  if (isAuthRoute && session) {
    const redirectUrl =
      session.role === "ADMIN" ? "/admin" : "/dashboard";
    return NextResponse.redirect(new URL(redirectUrl, req.nextUrl));
  }

  // Non-admin user trying to access admin routes → redirect to dashboard
  if (isAdminRoute && session && session.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }

  // Borrower trying to access admin → redirect
  if (path === "/" && session) {
    const redirectUrl =
      session.role === "ADMIN" ? "/admin" : "/dashboard";
    return NextResponse.redirect(new URL(redirectUrl, req.nextUrl));
  }

  return NextResponse.next();
}

// Only run proxy on relevant routes, skip static files and API routes
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|uploads|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp)$).*)",
  ],
};

import { NextResponse } from "next/server";
import NextAuth from "next-auth";
import { authConfigEdge } from "@/lib/auth-config-edge";

const { auth } = NextAuth(authConfigEdge);

const adminPathPrefixes = ["/dashboard", "/admin-products", "/admin-orders"];
const authRequiredPathPrefixes = ["/orders", "/profile", "/checkout"];

const SECURITY_HEADERS: Record<string, string> = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
};

export const proxy = auth(function middleware(request) {
  const { pathname } = request.nextUrl;
  const session = request.auth;

  const isAdminPath = adminPathPrefixes.some((prefix) => pathname.startsWith(prefix));
  const isAuthRequiredPath = authRequiredPathPrefixes.some((prefix) =>
    pathname.startsWith(prefix)
  );

  if (!isAdminPath && !isAuthRequiredPath) {
    const response = NextResponse.next();
    for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
      response.headers.set(key, value);
    }
    return response;
  }

  if (!session) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const userRole = (session.user as { role?: string })?.role;
  if (isAdminPath && userRole !== "admin") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const response = NextResponse.next();
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin-products/:path*",
    "/admin-orders/:path*",
    "/orders/:path*",
    "/profile/:path*",
    "/checkout/:path*",
  ],
};

import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const adminPathPrefixes = ["/dashboard", "/admin-products", "/admin-orders"];
const authRequiredPathPrefixes = ["/orders", "/profile", "/checkout"];

const SECURITY_HEADERS: Record<string, string> = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
};

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

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

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAdminPath && token.role !== "admin") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const response = NextResponse.next();
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
}

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

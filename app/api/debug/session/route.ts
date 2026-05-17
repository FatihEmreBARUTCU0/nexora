import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getToken } from "next-auth/jwt";

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === "production" && process.env.NEXORA_DEMO_MODE !== "true") {
    return NextResponse.json({ error: "Debug endpoint disabled" }, { status: 403 });
  }

  const session = await auth();
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  return NextResponse.json({
    hasSession: !!session,
    sessionUser: session?.user?.email,
    hasToken: !!token,
    tokenEmail: token?.email,
    cookies: request.cookies.getAll().map((c) => ({ name: c.name, hasValue: !!c.value })),
  });
}

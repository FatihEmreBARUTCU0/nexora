import { NextRequest, NextResponse } from "next/server";
import type { Session } from "next-auth";
import { auth } from "@/lib/auth";

type AuthSuccess = { session: Session };
type AuthFailure = { response: NextResponse };

export type AuthResult = AuthSuccess | AuthFailure;

export function hasAuthError(result: AuthResult): result is AuthFailure {
  return "response" in result;
}

export async function requireAuth(_request: NextRequest): Promise<AuthResult> {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      response: NextResponse.json({ error: "Unauthorized." }, { status: 401 }),
    };
  }

  return { session };
}

export async function requireAdmin(request: NextRequest): Promise<AuthResult> {
  const authResult = await requireAuth(request);
  if (hasAuthError(authResult)) {
    return authResult;
  }

  if (authResult.session.user.role !== "admin") {
    return {
      response: NextResponse.json({ error: "Forbidden." }, { status: 403 }),
    };
  }

  return authResult;
}

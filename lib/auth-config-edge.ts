import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe auth config — no DB or Node.js-only imports.
 * Used exclusively by proxy.ts (middleware) which runs on the Edge runtime.
 * The full config with Credentials provider lives in lib/auth-config.ts.
 */
export const authConfigEdge: NextAuthConfig = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  pages: { signIn: "/auth/login" },
  trustHost: true,
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as { id?: string; role?: string };
        if (u.id) token.id = u.id;
        if (u.role) token.role = u.role;
      }
      return token;
    },
    async session({ session, token }) {
      const u = session.user as { id?: string; role?: string };
      if (u) {
        u.id = token.id as string;
        u.role = token.role as string;
      }
      return session;
    },
  },
};

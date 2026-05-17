import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { isLoginRateLimited } from "@/lib/loginRateLimit";
import User from "@/models/User";

export const authConfig = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  pages: { signIn: "/auth/login" },
  trustHost: true,
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email ? String(credentials.email).toLowerCase().trim() : "";
        const password = credentials?.password ? String(credentials.password) : "";

        if (!email || !password) {
          return null;
        }

        if (isLoginRateLimited(email)) {
          return null;
        }

        await connectDB();

        const user = await User.findOne({ email })
          .select("_id name email password role")
          .lean<{
            _id: { toString(): string };
            name: string;
            email: string;
            password: string;
            role: "user" | "admin";
          } | null>();

        if (!user?.password) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "user" | "admin";
      }
      return session;
    },
  },
} satisfies NextAuthConfig;

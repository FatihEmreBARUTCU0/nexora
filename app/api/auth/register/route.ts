import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { checkRateLimit } from "@/lib/rateLimit";
import { registerSchema } from "@/lib/validate";
import User from "@/models/User";

export async function POST(request: NextRequest) {
  try {
    const limited = await checkRateLimit(request, {
      key: "auth-register",
      limit: 5,
      windowMs: 60_000,
    });
    if (limited) return limited;

    await connectDB();

    const body = await request.json();
    const validation = registerSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message ?? "Invalid registration payload." },
        { status: 400 }
      );
    }

    const { name, email, password } = validation.data;
    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail }).lean();

    if (existingUser) {
      return NextResponse.json(
        { error: "Unable to create account with the provided information." },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: "user",
      addresses: [],
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "Failed to register user." }, { status: 500 });
  }
}

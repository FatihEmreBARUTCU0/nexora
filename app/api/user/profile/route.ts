import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { hasAuthError, requireAuth } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import { profileUpdateSchema } from "@/lib/validate";
import User from "@/models/User";

export async function PUT(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (hasAuthError(authResult)) {
      return authResult.response;
    }
    const { session } = authResult;

    await connectDB();

    const body = await request.json();
    const validation = profileUpdateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message ?? "Invalid profile payload." },
        { status: 400 }
      );
    }

    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const { name, currentPassword, newPassword } = validation.data;

    if (name?.trim()) {
      user.name = name.trim();
    }

    if (newPassword) {
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword!, user.password);
      if (!isCurrentPasswordValid) {
        return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
      }

      user.password = await bcrypt.hash(newPassword, 12);
    }

    await user.save();

    return NextResponse.json({ message: "Profile updated successfully." });
  } catch (error) {
    console.error("Profile PUT error:", error);
    return NextResponse.json({ error: "Failed to update profile." }, { status: 500 });
  }
}

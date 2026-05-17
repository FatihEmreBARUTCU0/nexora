import { NextRequest, NextResponse } from "next/server";
import { hasAuthError, requireAdmin } from "@/lib/apiAuth";
import { uploadImage } from "@/lib/cloudinary";
import { detectImageMime } from "@/lib/fileValidation";
import { checkRateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request);
    if (hasAuthError(authResult)) {
      return authResult.response;
    }

    const limited = await checkRateLimit(request, {
      key: "upload",
      limit: 20,
      windowMs: 60 * 60 * 1000,
    });
    if (limited) return limited;

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File is required." }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPEG, PNG, WebP and GIF are allowed." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File is too large. Maximum allowed size is 5 MB." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const detectedMime = detectImageMime(buffer);
    if (!detectedMime || !ALLOWED_MIME_TYPES.includes(detectedMime)) {
      return NextResponse.json(
        { error: "File content does not match an allowed image format." },
        { status: 400 }
      );
    }

    const uploaded = await uploadImage(buffer, "nexora/products");

    return NextResponse.json(uploaded);
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Failed to upload image." }, { status: 500 });
  }
}

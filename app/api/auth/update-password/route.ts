import { NextRequest, NextResponse } from "next/server";
import { updatePassword, requireAuth } from "@/lib/auth/supabase";

/**
 * POST /api/auth/update-password
 * Update user password (requires authentication)
 */
export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    await requireAuth();

    const body = await request.json();
    const { newPassword } = body;

    if (!newPassword) {
      return NextResponse.json(
        { error: "New password is required" },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    await updatePassword(newPassword);

    return NextResponse.json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error: any) {
    console.error("Update password error:", error);

    if (error.message?.includes("Unauthorized")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    return NextResponse.json(
      { error: error.message || "Failed to update password" },
      { status: 500 }
    );
  }
}

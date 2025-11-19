import { NextRequest, NextResponse } from "next/server";
import { resetPassword } from "@/lib/auth/supabase";

/**
 * POST /api/auth/reset-password
 * Request password reset email
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    await resetPassword(email);

    return NextResponse.json({
      success: true,
      message: "Password reset email sent. Please check your inbox.",
    });
  } catch (error: any) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send reset email" },
      { status: 500 }
    );
  }
}

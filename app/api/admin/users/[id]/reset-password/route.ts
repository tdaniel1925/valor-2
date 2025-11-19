import { NextRequest, NextResponse } from "next/server";
import { resetUserPassword } from "@/lib/admin/user-management";

/**
 * POST /api/admin/users/:id/reset-password
 * Reset user password
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const body = await request.json();
    const { newPassword, sendResetEmail } = body;

    const result = await resetUserPassword(userId, newPassword, sendResetEmail);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to reset password" },
      { status: 500 }
    );
  }
}

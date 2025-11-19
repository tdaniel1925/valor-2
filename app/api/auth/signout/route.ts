import { NextRequest, NextResponse } from "next/server";
import { signOut } from "@/lib/auth/supabase";

/**
 * POST /api/auth/signout
 * Sign out the current user
 */
export async function POST(request: NextRequest) {
  try {
    await signOut();

    return NextResponse.json({
      success: true,
      message: "Signed out successfully",
    });
  } catch (error: any) {
    console.error("Signout error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to sign out" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { signIn, syncAuthUser } from "@/lib/auth/supabase";
import { prisma } from "@/lib/db/prisma";

/**
 * POST /api/auth/signin
 * Sign in an existing user
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Sign in with Supabase Auth
    const { user: supabaseUser, session } = await signIn(email, password);

    if (!supabaseUser || !session) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Sync user in our database
    const user = await syncAuthUser(supabaseUser, prisma);

    return NextResponse.json({
      success: true,
      data: {
        user,
        session,
        message: "Signed in successfully",
      },
    });
  } catch (error: any) {
    console.error("Signin error:", error);

    // Handle specific auth errors
    if (error.message?.includes("Invalid login credentials")) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    if (error.message?.includes("Email not confirmed")) {
      return NextResponse.json(
        { error: "Please verify your email before signing in" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to sign in" },
      { status: 500 }
    );
  }
}

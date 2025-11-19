import { NextRequest, NextResponse } from "next/server";
import { signUp, syncAuthUser } from "@/lib/auth/supabase";
import { prisma } from "@/lib/db/prisma";

/**
 * POST /api/auth/signup
 * Register a new user
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, firstName, lastName, phone } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Sign up with Supabase Auth
    const { user: supabaseUser } = await signUp(email, password, {
      full_name: `${firstName} ${lastName}`,
      first_name: firstName,
      last_name: lastName,
      phone,
    });

    if (!supabaseUser) {
      return NextResponse.json(
        { error: "Failed to create user" },
        { status: 500 }
      );
    }

    // Create user in our database
    const user = await syncAuthUser(supabaseUser, prisma);

    return NextResponse.json({
      success: true,
      data: {
        user,
        message: "Account created successfully. Please check your email to verify your account.",
      },
    });
  } catch (error: any) {
    console.error("Signup error:", error);

    // Handle specific Supabase errors
    if (error.message?.includes("already registered")) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to create account" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/auth/supabase-server";
import { syncAuthUser } from "@/lib/auth/supabase";
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

    // Use the SSR client so Supabase sets the session cookies via next/headers
    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error || !data.user || !data.session) {
      return NextResponse.json(
        { error: error?.message || "Invalid email or password" },
        { status: 401 }
      );
    }

    // Sync user record in our database
    const user = await syncAuthUser(data.user, prisma);

    return NextResponse.json({
      success: true,
      data: {
        user,
        message: "Signed in successfully",
      },
    });
  } catch (error: any) {
    console.error("Signin error:", error);

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

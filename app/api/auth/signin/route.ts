import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/auth/supabase-server";
import { syncAuthUser } from "@/lib/auth/supabase";
import { prisma } from "@/lib/db/prisma";
import { applyRateLimit, RATE_LIMITS } from "@/lib/auth/rate-limit";
import { signInSchema } from "@/lib/validation/auth-schemas";
import { ZodError } from "zod";
import { createLogger } from "@/lib/logging/logger";
import { getRequestId } from "@/lib/logging/request-id";

/**
 * POST /api/auth/signin
 * Sign in an existing user
 */
export async function POST(request: NextRequest) {
  const requestId = getRequestId(request);
  const logger = createLogger({
    requestId,
    method: request.method,
    path: '/api/auth/signin',
  });

  // Apply rate limiting to prevent brute force attacks
  const rateLimitResponse = applyRateLimit(request, RATE_LIMITS.AUTH_SIGNIN);
  if (rateLimitResponse) {
    logger.warn('Rate limit exceeded for signin attempt');
    return rateLimitResponse;
  }

  try {
    const body = await request.json();

    // Validate input with Zod
    const validatedData = signInSchema.parse(body);
    const { email, password } = validatedData;

    logger.info('Signin attempt', { email });

    // Use the SSR client so Supabase sets the session cookies via next/headers
    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error || !data.user || !data.session) {
      logger.warn('Signin failed - invalid credentials', { email, error: error?.message });
      return NextResponse.json(
        { error: error?.message || "Invalid email or password" },
        { status: 401 }
      );
    }

    // Sync user record in our database
    const user = await syncAuthUser(data.user, prisma);

    logger.info('Signin successful', { userId: user.id, email: user.email });

    return NextResponse.json({
      success: true,
      data: {
        user,
        message: "Signed in successfully",
      },
    });
  } catch (error: any) {
    logger.error('Signin error', { error: error.message, stack: error.stack });

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

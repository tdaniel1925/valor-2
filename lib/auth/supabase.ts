import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

/**
 * Supabase Authentication Utilities
 * Server-side auth helpers for Next.js
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Create Supabase client for server-side use
 */
export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
    },
    global: {
      headers: {
        cookie: cookieStore.toString(),
      },
    },
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
    },
  });
}

/**
 * Create Supabase client for client-side use
 */
export function createBrowserSupabaseClient() {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

/**
 * Get current user from request
 */
export async function getCurrentUser() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return null;
  }

  return session.user;
}

/**
 * Get user ID from request (throws if not authenticated)
 */
export async function getUserId(): Promise<string> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized - Please sign in");
  }
  return user.id;
}

/**
 * Verify user is authenticated
 */
export async function requireAuth() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Unauthorized - Please sign in");
  }

  return user;
}

/**
 * Sign up new user
 */
export async function signUp(email: string, password: string, metadata?: any) {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
    },
  });

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Sign in user
 */
export async function signIn(email: string, password: string) {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Sign out user
 */
export async function signOut() {
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }
}

/**
 * Reset password
 */
export async function resetPassword(email: string) {
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/update-password`,
  });

  if (error) {
    throw error;
  }
}

/**
 * Update password
 */
export async function updatePassword(newPassword: string) {
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    throw error;
  }
}

/**
 * Get or create user in our database from Supabase auth user
 */
export async function syncAuthUser(supabaseUser: any, prisma: any) {
  const email = supabaseUser.email;

  // Check if user exists by Supabase UUID first
  let user = await prisma.user.findUnique({ where: { id: supabaseUser.id } });

  // Fall back to email lookup (user may exist from seed or prior auth flow)
  if (!user) {
    user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      // Sync the Supabase UUID onto the existing record
      user = await prisma.user.update({
        where: { email },
        data: { id: supabaseUser.id },
      });
    }
  }

  // Create user if still not found
  if (!user) {
    const [firstName, lastName] = (
      supabaseUser.user_metadata?.full_name || email.split("@")[0]
    ).split(" ");

    const tenantId = process.env.DEFAULT_TENANT_ID || "valor-default-tenant";

    user = await prisma.user.create({
      data: {
        id: supabaseUser.id,
        email,
        firstName: firstName || "User",
        lastName: lastName || "",
        role: "AGENT",
        status: "ACTIVE",
        emailVerified: supabaseUser.email_confirmed_at ? true : false,
        tenant: { connect: { id: tenantId } },
      },
    });
  }

  return user;
}

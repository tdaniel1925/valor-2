import { createClient } from '@/lib/auth/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /auth/signout
 * Handle signout form submission
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  // Sign out from Supabase (scope: 'global' ensures all sessions are cleared)
  await supabase.auth.signOut({ scope: 'global' });

  // Create response with redirect
  const response = NextResponse.redirect(new URL('/login', request.url));

  // Explicitly remove auth cookies
  response.cookies.delete('sb-access-token');
  response.cookies.delete('sb-refresh-token');

  return response;
}

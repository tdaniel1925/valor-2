import { createClient } from "@/lib/auth/supabase-server";
import { NextResponse } from "next/server";

export async function POST() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/auth/login", process.env.NEXT_PUBLIC_SUPABASE_URL!));
}

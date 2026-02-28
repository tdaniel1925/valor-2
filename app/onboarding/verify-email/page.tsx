"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/auth/supabase-client";
import { Card, CardContent, Button } from "@/components/ui";

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        // Supabase automatically handles the token from URL
        const { data, error: authError } = await supabase.auth.getSession();

        if (authError || !data.session) {
          setStatus("error");
          setError("Invalid or expired verification link");
          return;
        }

        // Update user's emailVerified status
        const { error: updateError } = await supabase
          .from("users")
          .update({ emailVerified: true })
          .eq("id", data.session.user.id);

        if (updateError) {
          console.error("Failed to update email verification:", updateError);
        }

        setStatus("success");

        // Get tenant slug and redirect
        const { data: userData } = await supabase
          .from("users")
          .select("tenantId")
          .eq("id", data.session.user.id)
          .single();

        if (userData?.tenantId) {
          const { data: tenantData } = await supabase
            .from("tenants")
            .select("slug")
            .eq("id", userData.tenantId)
            .single();

          if (tenantData?.slug) {
            setTimeout(() => {
              window.location.href = `https://${tenantData.slug}.valorfs.app/dashboard`;
            }, 2000);
          }
        }
      } catch (err: any) {
        console.error("Verification error:", err);
        setStatus("error");
        setError("Verification failed");
      }
    };

    verifyEmail();
  }, [router, searchParams, supabase]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          {status === "verifying" && (
            <>
              <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
              <h1 className="text-xl font-semibold mb-2">Verifying Your Email...</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Please wait while we confirm your email address.
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold mb-2">Email Verified!</h1>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Redirecting you to your dashboard...
              </p>
            </>
          )}

          {status === "error" && (
            <>
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold mb-2">Verification Failed</h1>
              <p className="text-red-600 dark:text-red-400 mb-4">
                {error || "Something went wrong"}
              </p>
              <Button onClick={() => router.push("/login")}>
                Go to Login
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

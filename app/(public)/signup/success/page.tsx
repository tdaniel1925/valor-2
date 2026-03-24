"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Check, Loader2, Mail } from "lucide-react";
import { Card, CardContent } from "@/components/ui";

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [tenantSlug, setTenantSlug] = useState<string>("");

  useEffect(() => {
    const sessionId = searchParams.get("session_id");

    if (!sessionId) {
      setStatus("error");
      return;
    }

    // Poll for account activation
    const checkActivation = async () => {
      try {
        const response = await fetch(`/api/signup/verify?session_id=${sessionId}`);
        const data = await response.json();

        if (data.success) {
          setTenantSlug(data.tenantSlug);
          setStatus("success");

          // Redirect to login after 3 seconds
          setTimeout(() => {
            window.location.href = `https://${data.tenantSlug}.${process.env.NEXT_PUBLIC_ROOT_DOMAIN || "valorfs.app"}/login`;
          }, 3000);
        } else {
          // Keep polling
          setTimeout(checkActivation, 2000);
        }
      } catch (error) {
        console.error("Error checking activation:", error);
        setTimeout(checkActivation, 2000);
      }
    };

    checkActivation();
  }, [searchParams]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <Loader2 className="w-16 h-16 mx-auto mb-4 text-blue-600 animate-spin" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Setting Up Your Account...
            </h1>
            <p className="text-gray-600">
              Please wait while we activate your subscription and create your workspace.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-3xl">❌</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Something Went Wrong
            </h1>
            <p className="text-gray-600 mb-6">
              We couldn't verify your signup. Please contact support if this issue persists.
            </p>
            <button
              onClick={() => router.push("/signup/tenant")}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Try Again
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <Card className="max-w-md w-full">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome to Valor! 🎉
          </h1>
          <p className="text-gray-600 mb-6">
            Your account has been successfully created. You'll be redirected to your dashboard in a few seconds...
          </p>

          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-700 mb-2">
              <strong>Your Workspace:</strong>
            </p>
            <p className="text-blue-600 font-mono text-sm break-all">
              {tenantSlug}.valorfs.app
            </p>
          </div>

          <div className="flex items-start gap-3 text-left text-sm text-gray-600 bg-gray-50 rounded-lg p-4">
            <Mail className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <p>
              Check your email for login instructions and a link to set your password.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SignupSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
        <Loader2 className="w-16 h-16 text-blue-600 animate-spin" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}

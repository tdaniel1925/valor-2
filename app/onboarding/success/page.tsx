"use client";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui";

export default function OnboardingSuccessPage() {
  const searchParams = useSearchParams();
  const slug = searchParams.get("slug");

  if (!slug) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500">Invalid access</p>
      </div>
    );
  }

  const customEmail = `${slug}@reports.valorfs.app`;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
      <Card className="w-full max-w-2xl">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold mb-2">Welcome to Valor FS!</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Your account has been created successfully.
            </p>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold mb-3">Your Custom Email Address</h2>
            <div className="bg-white dark:bg-gray-800 rounded p-3 font-mono text-sm mb-3">
              {customEmail}
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Forward your SmartOffice reports to this email address for automatic syncing.
            </p>
          </div>

          <div className="space-y-4 mb-6">
            <h2 className="text-lg font-semibold">Next Steps:</h2>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <li>Verify your email address (check your inbox)</li>
              <li>Forward SmartOffice reports to <span className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">{customEmail}</span></li>
              <li>Wait for automatic data sync (usually takes 1-2 minutes)</li>
              <li>Access your dashboard at <span className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">{slug}.valorfs.app</span></li>
            </ol>
          </div>

          <div className="flex gap-4">
            <div className="flex-1 inline-flex items-center justify-center rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 h-11 px-4 py-2 text-base min-h-[44px] bg-blue-600 text-white opacity-50 cursor-not-allowed">
              Continue to Dashboard (after verification)
            </div>
          </div>

          <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-4">
            Didn't receive the verification email?{" "}
            <Link href="/api/auth/resend-verification" className="text-blue-600 hover:underline">
              Resend
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

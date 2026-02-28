"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { Button, Card, CardContent } from "@/components/ui";
import { isValidSlug } from "@/lib/tenants/slug-validator";

const signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[0-9]/, "Password must contain a number")
    .regex(/[!@#$%^&*]/, "Password must contain a special character"),
  confirmPassword: z.string(),
  agencyName: z.string().min(2, "Agency name must be at least 2 characters"),
  subdomain: z.string()
    .min(3, "Subdomain must be at least 3 characters")
    .max(50, "Subdomain must be less than 50 characters")
    .regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens allowed")
    .refine((val) => !val.startsWith('-') && !val.endsWith('-'), "Cannot start or end with hyphen")
    .refine((val) => !val.includes('--'), "Cannot contain consecutive hyphens"),
  terms: z.boolean().refine((val) => val === true, "You must accept the terms"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignupFormData = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkingSlug, setCheckingSlug] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [slugError, setSlugError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    mode: "onChange",
  });

  // Real-time subdomain validation
  const handleSubdomainBlur = async (value: string) => {
    if (!value || !isValidSlug(value)) {
      setSlugAvailable(null);
      return;
    }

    setCheckingSlug(true);
    setSlugError(null);

    try {
      const res = await fetch(`/api/auth/check-slug?slug=${encodeURIComponent(value)}`);
      const data = await res.json();

      if (data.available) {
        setSlugAvailable(true);
        setSlugError(null);
      } else {
        setSlugAvailable(false);
        setSlugError(data.reason || "This subdomain is already taken");
      }
    } catch (error) {
      setSlugError("Failed to check availability");
    } finally {
      setCheckingSlug(false);
    }
  };

  const onSubmit = async (data: SignupFormData) => {
    setIsSubmitting(true);
    setServerError(null);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          agencyName: data.agencyName,
          subdomain: data.subdomain,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        setServerError(result.error || "Signup failed");
        return;
      }

      // Redirect to success page
      router.push(`/onboarding/success?slug=${data.subdomain}`);
    } catch (error) {
      setServerError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-6">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold">Create Your Account</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Get your own subdomain and start managing your insurance business
            </p>
          </div>

          {serverError && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded text-red-800 dark:text-red-200 text-sm">
              {serverError}
            </div>
          )}

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                {...form.register("email")}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              {form.formState.errors.email && (
                <p className="text-red-500 text-xs mt-1">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <input
                type="password"
                {...form.register("password")}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              {form.formState.errors.password && (
                <p className="text-red-500 text-xs mt-1">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium mb-1">Confirm Password</label>
              <input
                type="password"
                {...form.register("confirmPassword")}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              {form.formState.errors.confirmPassword && (
                <p className="text-red-500 text-xs mt-1">
                  {form.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* Agency Name */}
            <div>
              <label className="block text-sm font-medium mb-1">Agency Name</label>
              <input
                type="text"
                {...form.register("agencyName")}
                placeholder="Acme Insurance Agency"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              {form.formState.errors.agencyName && (
                <p className="text-red-500 text-xs mt-1">
                  {form.formState.errors.agencyName.message}
                </p>
              )}
            </div>

            {/* Subdomain */}
            <div>
              <label className="block text-sm font-medium mb-1">Subdomain</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  {...form.register("subdomain")}
                  onBlur={(e) => handleSubdomainBlur(e.target.value)}
                  placeholder="acme-insurance"
                  className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600">.valorfs.app</span>
              </div>
              {checkingSlug && (
                <p className="text-blue-500 text-xs mt-1">Checking availability...</p>
              )}
              {slugAvailable === true && (
                <p className="text-green-500 text-xs mt-1">✓ Available!</p>
              )}
              {slugAvailable === false && slugError && (
                <p className="text-red-500 text-xs mt-1">{slugError}</p>
              )}
              {form.formState.errors.subdomain && (
                <p className="text-red-500 text-xs mt-1">
                  {form.formState.errors.subdomain.message}
                </p>
              )}
            </div>

            {/* Terms Checkbox */}
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                {...form.register("terms")}
                className="mt-1"
              />
              <label className="text-sm">
                I agree to the{" "}
                <Link href="/terms" className="text-blue-600 hover:underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-blue-600 hover:underline">
                  Privacy Policy
                </Link>
              </label>
            </div>
            {form.formState.errors.terms && (
              <p className="text-red-500 text-xs">
                {form.formState.errors.terms.message}
              </p>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting || slugAvailable === false}
              className="w-full"
            >
              {isSubmitting ? "Creating Account..." : "Create Account"}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm">
            Already have an account?{" "}
            <Link href="/login" className="text-blue-600 hover:underline">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

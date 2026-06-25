"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { Button, Card, CardContent } from "@/components/ui";

/**
 * Agent self-signup into the existing Valor agency (no subdomain, no new tenant).
 * New agencies use /signup instead.
 */
const joinSchema = z
  .object({
    firstName: z.string().min(1, "First name is required").max(100),
    lastName: z.string().min(1, "Last name is required").max(100),
    email: z.string().email("Invalid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[0-9]/, "Password must contain a number")
      .regex(/[!@#$%^&*]/, "Password must contain a special character"),
    confirmPassword: z.string(),
    terms: z.boolean().refine((val) => val === true, "You must accept the terms"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type JoinFormData = z.infer<typeof joinSchema>;

export default function JoinPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<JoinFormData>({ resolver: zodResolver(joinSchema), mode: "onChange" });

  const onSubmit = async (data: JoinFormData) => {
    setIsSubmitting(true);
    setServerError(null);
    try {
      const res = await fetch("/api/auth/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          firstName: data.firstName,
          lastName: data.lastName,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setServerError(json.error || "Failed to create account");
        return;
      }
      router.push("/onboarding/verify-email");
    } catch {
      setServerError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    "w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-6 sm:p-8">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Sign Up</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Create your agent account to access your book of business.
            </p>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">First name</label>
                <input {...form.register("firstName")} placeholder="John" className={inputClass} />
                {form.formState.errors.firstName && (
                  <p className="text-xs text-red-600 mt-1">{form.formState.errors.firstName.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Last name</label>
                <input {...form.register("lastName")} placeholder="Smith" className={inputClass} />
                {form.formState.errors.lastName && (
                  <p className="text-xs text-red-600 mt-1">{form.formState.errors.lastName.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                {...form.register("email")}
                type="email"
                placeholder="you@example.com"
                className={inputClass}
              />
              <p className="text-xs text-gray-400 mt-1">
                Use the email on file for you in SmartOffice so your policies link up.
              </p>
              {form.formState.errors.email && (
                <p className="text-xs text-red-600 mt-1">{form.formState.errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <input {...form.register("password")} type="password" className={inputClass} />
              {form.formState.errors.password && (
                <p className="text-xs text-red-600 mt-1">{form.formState.errors.password.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Confirm password</label>
              <input {...form.register("confirmPassword")} type="password" className={inputClass} />
              {form.formState.errors.confirmPassword && (
                <p className="text-xs text-red-600 mt-1">{form.formState.errors.confirmPassword.message}</p>
              )}
            </div>

            <label className="flex items-start gap-2 text-sm">
              <input type="checkbox" {...form.register("terms")} className="mt-0.5" />
              <span className="text-gray-600 dark:text-gray-400">
                I agree to the terms of service and privacy policy.
              </span>
            </label>
            {form.formState.errors.terms && (
              <p className="text-xs text-red-600">{form.formState.errors.terms.message}</p>
            )}

            {serverError && <p className="text-sm text-red-600">{serverError}</p>}

            <Button type="submit" disabled={isSubmitting} className="w-full justify-center">
              {isSubmitting ? "Creating account…" : "Sign Up"}
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
            Already have an account?{" "}
            <Link href="/login" className="text-blue-600 hover:underline">
              Sign in
            </Link>
          </p>
          <p className="text-center text-xs text-gray-400 mt-2">
            Setting up a new agency?{" "}
            <Link href="/signup" className="text-blue-600 hover:underline">
              Register your agency
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

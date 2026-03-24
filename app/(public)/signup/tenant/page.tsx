"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Button, Card, CardContent } from "@/components/ui";
import { Building2, Check, Loader2 } from "lucide-react";

const signupSchema = z.object({
  agencyName: z.string().min(2, "Agency name must be at least 2 characters"),
  ownerEmail: z.string().email("Invalid email address"),
  ownerFirstName: z.string().min(1, "First name is required"),
  ownerLastName: z.string().min(1, "Last name is required"),
  ownerPassword: z.string().min(8, "Password must be at least 8 characters"),
  subdomain: z
    .string()
    .min(3, "Subdomain must be at least 3 characters")
    .max(63, "Subdomain must be less than 63 characters")
    .regex(
      /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/,
      "Subdomain can only contain lowercase letters, numbers, and hyphens"
    ),
  plan: z.enum(["starter", "professional", "enterprise"]),
});

type SignupFormData = z.infer<typeof signupSchema>;

const plans = [
  {
    id: "starter",
    name: "Starter",
    price: "$99",
    description: "Perfect for small agencies getting started",
    features: [
      "5 users",
      "10GB storage",
      "Basic reporting",
      "Email support",
    ],
  },
  {
    id: "professional",
    name: "Professional",
    price: "$299",
    description: "Advanced features for growing agencies",
    features: [
      "25 users",
      "50GB storage",
      "Advanced reporting",
      "SmartOffice Intelligence",
      "Priority email support",
      "Phone support",
    ],
    recommended: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "$999",
    description: "Complete solution for large organizations",
    features: [
      "Unlimited users",
      "500GB storage",
      "Enterprise reporting",
      "White label branding",
      "SmartOffice Intelligence",
      "24/7 priority support",
      "Dedicated account manager",
      "Custom integrations",
    ],
  },
];

export default function TenantSignupPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<"starter" | "professional" | "enterprise">("professional");

  const form = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      plan: "professional",
    },
  });

  const onSubmit = async (data: SignupFormData) => {
    setIsSubmitting(true);
    setServerError(null);

    try {
      // Check subdomain availability
      const checkResponse = await fetch(`/api/tenants/check-subdomain?subdomain=${data.subdomain}`);
      const checkResult = await checkResponse.json();

      if (!checkResult.available) {
        setServerError("This subdomain is already taken. Please choose another.");
        setIsSubmitting(false);
        return;
      }

      // Create checkout session
      const response = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        setServerError(result.error || "Failed to create checkout session");
        return;
      }

      // Redirect to Stripe Checkout
      window.location.href = result.url;
    } catch (error) {
      setServerError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Auto-generate subdomain from agency name
  const handleAgencyNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    form.setValue("agencyName", value);

    // Auto-generate subdomain (lowercase, remove spaces, special chars)
    const subdomain = value
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .substring(0, 63);

    form.setValue("subdomain", subdomain);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Building2 className="w-12 h-12 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Start Your Free 14-Day Trial
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Get your own branded insurance back-office platform
          </p>
        </div>

        {/* Plan Selection */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`relative cursor-pointer transition-all ${
                selectedPlan === plan.id
                  ? "ring-2 ring-blue-600 shadow-lg"
                  : "hover:shadow-md"
              }`}
              onClick={() => {
                setSelectedPlan(plan.id as any);
                form.setValue("plan", plan.id as any);
              }}
            >
              {plan.recommended && (
                <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg">
                  Recommended
                </div>
              )}
              <CardContent className="p-6">
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{plan.name}</h3>
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {plan.price}
                    <span className="text-sm text-gray-600">/month</span>
                  </div>
                  <p className="text-sm text-gray-600">{plan.description}</p>
                </div>
                <ul className="space-y-2">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Signup Form */}
        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Create Your Account</h2>

            {serverError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                {serverError}
              </div>
            )}

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Agency Name */}
              <div>
                <label className="block text-sm font-medium mb-2">Agency Name *</label>
                <input
                  type="text"
                  {...form.register("agencyName")}
                  onChange={handleAgencyNameChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Acme Insurance Agency"
                />
                {form.formState.errors.agencyName && (
                  <p className="text-red-500 text-xs mt-1">
                    {form.formState.errors.agencyName.message}
                  </p>
                )}
              </div>

              {/* Subdomain */}
              <div>
                <label className="block text-sm font-medium mb-2">Your Subdomain *</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    {...form.register("subdomain")}
                    className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="acme-insurance"
                  />
                  <span className="text-gray-600">.valorfs.app</span>
                </div>
                {form.formState.errors.subdomain && (
                  <p className="text-red-500 text-xs mt-1">
                    {form.formState.errors.subdomain.message}
                  </p>
                )}
                <p className="text-xs text-gray-600 mt-1">
                  This will be your unique URL (e.g., acme-insurance.valorfs.app)
                </p>
              </div>

              {/* Owner Details */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">First Name *</label>
                  <input
                    type="text"
                    {...form.register("ownerFirstName")}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="John"
                  />
                  {form.formState.errors.ownerFirstName && (
                    <p className="text-red-500 text-xs mt-1">
                      {form.formState.errors.ownerFirstName.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Last Name *</label>
                  <input
                    type="text"
                    {...form.register("ownerLastName")}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Doe"
                  />
                  {form.formState.errors.ownerLastName && (
                    <p className="text-red-500 text-xs mt-1">
                      {form.formState.errors.ownerLastName.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium mb-2">Email *</label>
                <input
                  type="email"
                  {...form.register("ownerEmail")}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="john@acmeinsurance.com"
                />
                {form.formState.errors.ownerEmail && (
                  <p className="text-red-500 text-xs mt-1">
                    {form.formState.errors.ownerEmail.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium mb-2">Password *</label>
                <input
                  type="password"
                  {...form.register("ownerPassword")}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="••••••••"
                />
                {form.formState.errors.ownerPassword && (
                  <p className="text-red-500 text-xs mt-1">
                    {form.formState.errors.ownerPassword.message}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 text-lg"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Start Free 14-Day Trial"
                )}
              </Button>

              <p className="text-xs text-center text-gray-600">
                By signing up, you agree to our Terms of Service and Privacy Policy.
                <br />
                No credit card required for trial. Cancel anytime.
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Users, Database, Calendar, AlertCircle, Check, Loader2 } from "lucide-react";
import { Card, CardContent, Button } from "@/components/ui";

interface BillingContentProps {
  tenant: {
    id: string;
    name: string;
    plan: string | null;
    status: string;
    stripeCustomerId: string | null;
    subscriptionStatus: string | null;
    currentPeriodEnd: Date | null;
    cancelAtPeriodEnd: boolean;
    maxUsers: number;
    maxStorageGB: number;
    _count: {
      users: number;
    };
  };
  plan: {
    name: string;
    price: number;
    maxUsers: number;
    maxStorageGB: number;
    features: string[];
  };
}

export default function BillingContent({ tenant, plan }: BillingContentProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleManageSubscription = async () => {
    setLoading(true);

    try {
      const response = await fetch("/api/stripe/create-portal-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          returnUrl: window.location.href,
        }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Failed to open billing portal");
        setLoading(false);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Something went wrong");
      setLoading(false);
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "trialing":
        return "bg-blue-100 text-blue-800";
      case "past_due":
        return "bg-yellow-100 text-yellow-800";
      case "canceled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Billing & Subscription</h1>
          <p className="text-gray-600">Manage your subscription and billing information</p>
        </div>

        {/* Current Plan Card */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">{plan.name} Plan</h2>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl font-bold text-blue-600">
                    {formatPrice(plan.price)}
                    <span className="text-sm text-gray-600">/month</span>
                  </span>
                  {tenant.subscriptionStatus && (
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                        tenant.subscriptionStatus
                      )}`}
                    >
                      {tenant.subscriptionStatus.toUpperCase()}
                    </span>
                  )}
                </div>

                {tenant.cancelAtPeriodEnd && (
                  <div className="flex items-center gap-2 text-yellow-700 bg-yellow-50 px-4 py-2 rounded-lg text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>
                      Your subscription will cancel on {formatDate(tenant.currentPeriodEnd)}
                    </span>
                  </div>
                )}

                {tenant.subscriptionStatus === "trialing" && tenant.currentPeriodEnd && (
                  <div className="flex items-center gap-2 text-blue-700 bg-blue-50 px-4 py-2 rounded-lg text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>
                      Your trial ends on {formatDate(tenant.currentPeriodEnd)}
                    </span>
                  </div>
                )}
              </div>

              <Button
                onClick={handleManageSubscription}
                disabled={loading || !tenant.stripeCustomerId}
                className="flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Opening...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    Manage Subscription
                  </>
                )}
              </Button>
            </div>

            {/* Billing Details */}
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">Next Billing Date</span>
                </div>
                <p className="text-lg font-semibold text-gray-900">
                  {formatDate(tenant.currentPeriodEnd)}
                </p>
              </div>

              <div>
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <CreditCard className="w-4 h-4" />
                  <span className="text-sm">Billing Status</span>
                </div>
                <p className="text-lg font-semibold text-gray-900">
                  {tenant.subscriptionStatus === "active"
                    ? "Current"
                    : tenant.subscriptionStatus || "N/A"}
                </p>
              </div>
            </div>

            {/* Plan Features */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Plan Features</h3>
              <div className="grid md:grid-cols-2 gap-3">
                {plan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Usage Stats */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Current Usage</h2>

            <div className="space-y-6">
              {/* Users */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-gray-900">Users</span>
                  </div>
                  <span className="text-sm text-gray-600">
                    {tenant._count.users} / {tenant.maxUsers}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{
                      width: `${Math.min((tenant._count.users / tenant.maxUsers) * 100, 100)}%`,
                    }}
                  ></div>
                </div>
              </div>

              {/* Storage */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Database className="w-5 h-5 text-purple-600" />
                    <span className="font-medium text-gray-900">Storage</span>
                  </div>
                  <span className="text-sm text-gray-600">
                    {/* Placeholder - implement actual storage tracking */}
                    0 GB / {tenant.maxStorageGB} GB
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-purple-600 h-2 rounded-full" style={{ width: "0%" }}></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Need Help */}
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold text-gray-900 mb-2">Need Help?</h3>
            <p className="text-sm text-gray-600 mb-4">
              Contact our support team if you have questions about your subscription or need assistance.
            </p>
            <Button variant="outline" onClick={() => router.push("/help")}>
              Contact Support
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

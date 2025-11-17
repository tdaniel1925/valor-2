"use client";

import { useQuery } from "@tanstack/react-query";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui";
import AppLayout from "@/components/layout/AppLayout";

interface Quote {
  id: string;
  clientName: string;
  clientEmail: string | null;
  clientPhone: string | null;
  clientAge: number;
  clientState: string;
  type: string;
  carrier: string;
  productName: string;
  coverageAmount: number | null;
  premium: number;
  term: number | null;
  status: string;
  externalId: string | null;
  pdfUrl: string | null;
  createdAt: string;
  expiresAt: string | null;
}

interface QuotesData {
  quotes: Quote[];
}

export default function QuotesPage() {
  const { data, isLoading, error } = useQuery<QuotesData>({
    queryKey: ["quotes"],
    queryFn: async () => {
      const res = await fetch("/api/quotes");
      if (!res.ok) throw new Error("Failed to fetch quotes");
      return res.json();
    },
  });

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "SENT":
        return "info";
      case "APPLIED":
        return "success";
      case "EXPIRED":
        return "danger";
      case "GENERATED":
        return "warning";
      default:
        return "default";
    }
  };

  const getProductTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      TERM_LIFE: "bg-blue-100 text-blue-700",
      WHOLE_LIFE: "bg-purple-100 text-purple-700",
      UNIVERSAL_LIFE: "bg-indigo-100 text-indigo-700",
      INDEXED_UNIVERSAL_LIFE: "bg-violet-100 text-violet-700",
      FIXED_ANNUITY: "bg-green-100 text-green-700",
      INDEXED_ANNUITY: "bg-teal-100 text-teal-700",
      VARIABLE_ANNUITY: "bg-cyan-100 text-cyan-700",
    };
    return colors[type] || "bg-gray-100 text-gray-700";
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading quotes...</p>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error || !data) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center py-12">
              <p className="text-red-600">Failed to load quotes</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Quotes</h1>
          <p className="mt-1 text-sm text-gray-600">
            Create and manage insurance quotes for your clients
          </p>
          <div className="mt-4">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              + New Quote
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm font-medium text-gray-600">Total Quotes</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {data.quotes.length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm font-medium text-gray-600">Sent</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">
              {data.quotes.filter((q) => q.status === "SENT").length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm font-medium text-gray-600">Applied</p>
            <p className="text-3xl font-bold text-green-600 mt-2">
              {data.quotes.filter((q) => q.status === "APPLIED").length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm font-medium text-gray-600">Total Premium</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {formatCurrency(
                data.quotes.reduce((sum, q) => sum + q.premium, 0)
              )}
            </p>
          </div>
        </div>

        {/* Quotes Grid */}
        {data.quotes.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {data.quotes.map((quote) => (
              <div
                key={quote.id}
                className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900">
                      {quote.clientName}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Age {quote.clientAge} • {quote.clientState}
                    </p>
                    {quote.clientEmail && (
                      <p className="text-sm text-gray-500 mt-1">
                        {quote.clientEmail}
                      </p>
                    )}
                  </div>
                  <Badge variant={getStatusVariant(quote.status)}>
                    {quote.status}
                  </Badge>
                </div>

                <div className="mb-4">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getProductTypeColor(
                      quote.type
                    )}`}
                  >
                    {quote.type.replace(/_/g, " ")}
                  </span>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Carrier:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {quote.carrier}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Product:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {quote.productName}
                    </span>
                  </div>
                  {quote.coverageAmount && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Coverage:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {formatCurrency(quote.coverageAmount)}
                      </span>
                    </div>
                  )}
                  {quote.term && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Term:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {quote.term} years
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                    <span className="text-sm font-semibold text-gray-700">
                      Premium:
                    </span>
                    <span className="text-lg font-bold text-blue-600">
                      {formatCurrency(quote.premium)}
                      {quote.term && (
                        <span className="text-sm text-gray-500">/year</span>
                      )}
                    </span>
                  </div>
                </div>

                {quote.expiresAt && (
                  <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <p className="text-xs font-medium text-orange-700">
                      Expires: {formatDate(quote.expiresAt)}
                    </p>
                  </div>
                )}

                <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                  <span className="text-xs text-gray-500">
                    Created {formatDate(quote.createdAt)}
                  </span>
                </div>

                <div className="mt-4 flex gap-2">
                  <button className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm">
                    View Details
                  </button>
                  {quote.pdfUrl && (
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                      Download PDF
                    </button>
                  )}
                  {quote.status === "SENT" && (
                    <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm">
                      Convert to Case
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-12">
            <div className="text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No quotes
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating your first quote for a client.
              </p>
              <div className="mt-6">
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  + New Quote
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Quotes by Product Type */}
        {data.quotes.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Quotes by Product Type
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {Object.entries(
                data.quotes.reduce((acc, q) => {
                  if (!acc[q.type]) {
                    acc[q.type] = { count: 0, totalPremium: 0 };
                  }
                  acc[q.type].count++;
                  acc[q.type].totalPremium += q.premium;
                  return acc;
                }, {} as Record<string, { count: number; totalPremium: number }>)
              ).map(([type, stats]) => (
                <div key={type} className="border border-gray-200 rounded-lg p-4">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mb-2 ${getProductTypeColor(
                      type
                    )}`}
                  >
                    {type.replace(/_/g, " ")}
                  </span>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {stats.count}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatCurrency(stats.totalPremium)} total premium
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

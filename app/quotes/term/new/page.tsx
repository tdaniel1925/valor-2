"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import AppLayout from "@/components/layout/AppLayout";
import { Button, Input } from "@/components/ui";
import type {
  IPipelineQuoteRequest,
  IPipelineQuoteResponse,
  ProductType,
  Gender,
  HealthClass,
  TobaccoUse,
} from "@/lib/integrations/ipipeline/types";

interface QuoteFormData {
  // Applicant Info
  age: string;
  gender: Gender;
  state: string;
  tobacco: TobaccoUse;
  healthClass: HealthClass;

  // Product Info
  productType: ProductType;
  term: string;
  faceAmount: string;
}

const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
];

export default function NewTermQuotePage() {
  const [formData, setFormData] = useState<QuoteFormData>({
    age: "",
    gender: "Male",
    state: "",
    tobacco: "Never",
    healthClass: "Standard",
    productType: "Term",
    term: "20",
    faceAmount: "",
  });

  const [quotes, setQuotes] = useState<IPipelineQuoteResponse | null>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailFormData, setEmailFormData] = useState({
    clientName: "",
    clientEmail: "",
  });

  const quoteMutation = useMutation({
    mutationFn: async (data: IPipelineQuoteRequest) => {
      const res = await fetch("/api/quotes/term", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to get quotes");
      }

      return res.json() as Promise<IPipelineQuoteResponse>;
    },
    onSuccess: (data) => {
      setQuotes(data);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const request: IPipelineQuoteRequest = {
      applicant: {
        age: parseInt(formData.age),
        gender: formData.gender,
        state: formData.state,
        tobacco: formData.tobacco,
        healthClass: formData.healthClass,
      },
      product: {
        type: formData.productType,
        term: parseInt(formData.term),
        faceAmount: parseInt(formData.faceAmount.replace(/,/g, "")),
      },
      options: {
        includeROP: formData.productType === "ROP",
        includeConvertible: formData.productType === "Convertible Term",
      },
    };

    quoteMutation.mutate(request);
  };

  const handleInputChange = (field: keyof QuoteFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const handleNewQuote = () => {
    setQuotes(null);
    quoteMutation.reset();
  };

  const emailMutation = useMutation({
    mutationFn: async (data: typeof emailFormData) => {
      if (!quotes) throw new Error("No quotes available");

      const res = await fetch("/api/quotes/term/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: data.clientName,
          clientEmail: data.clientEmail,
          quotes: quotes.quotes,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to send email");
      }

      return res.json();
    },
    onSuccess: () => {
      setShowEmailModal(false);
      setEmailFormData({ clientName: "", clientEmail: "" });
    },
  });

  const handleSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    emailMutation.mutate(emailFormData);
  };

  const handleDownloadPDF = async () => {
    if (!quotes) return;

    try {
      const res = await fetch("/api/quotes/term/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: emailFormData.clientName || "Client",
          quotes: quotes.quotes,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to generate PDF");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `term-life-quotes-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading PDF:", error);
      alert("Failed to download PDF. Please try again.");
    }
  };

  // If quotes are loaded, show results
  if (quotes && quotes.success) {
    return (
      <AppLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={handleNewQuote}
              className="text-blue-600 hover:text-blue-700 mb-4 flex items-center"
            >
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              New Quote
            </button>
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Term Life Quote Results</h1>
                <p className="mt-1 text-sm text-gray-600">
                  Found {quotes.quotes.length} quotes from top-rated carriers
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleDownloadPDF}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                  </svg>
                  Download PDF
                </button>
                <button
                  onClick={() => setShowEmailModal(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Email to Client
                </button>
              </div>
            </div>
          </div>

          {/* Applicant Summary */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quote Parameters</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Age:</span>
                <span className="ml-2 font-medium">{formData.age}</span>
              </div>
              <div>
                <span className="text-gray-600">Gender:</span>
                <span className="ml-2 font-medium">{formData.gender}</span>
              </div>
              <div>
                <span className="text-gray-600">State:</span>
                <span className="ml-2 font-medium">{formData.state}</span>
              </div>
              <div>
                <span className="text-gray-600">Tobacco:</span>
                <span className="ml-2 font-medium">{formData.tobacco}</span>
              </div>
              <div>
                <span className="text-gray-600">Health Class:</span>
                <span className="ml-2 font-medium">{formData.healthClass}</span>
              </div>
              <div>
                <span className="text-gray-600">Product Type:</span>
                <span className="ml-2 font-medium">{formData.productType}</span>
              </div>
              <div>
                <span className="text-gray-600">Term:</span>
                <span className="ml-2 font-medium">{formData.term} Years</span>
              </div>
              <div>
                <span className="text-gray-600">Coverage:</span>
                <span className="ml-2 font-medium">{formatCurrency(parseInt(formData.faceAmount.replace(/,/g, "")))}</span>
              </div>
            </div>
          </div>

          {/* Quote Results */}
          <div className="space-y-4">
            {quotes.quotes.map((quote, index) => (
              <div
                key={quote.quoteId}
                className={`bg-white rounded-lg shadow p-6 ${
                  index === 0 ? "ring-2 ring-green-500" : ""
                }`}
              >
                {index === 0 && (
                  <div className="inline-block bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full mb-4">
                    BEST VALUE
                  </div>
                )}

                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{quote.carrierName}</h3>
                    <p className="text-sm text-gray-600">{quote.productName}</p>
                    <div className="flex items-center mt-1">
                      <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                        {quote.carrierRating} - {quote.ratingAgency}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">Monthly Premium</div>
                    <div className="text-3xl font-bold text-blue-600">
                      {formatCurrency(quote.monthlyPremium)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-t border-b border-gray-200">
                  <div>
                    <div className="text-xs text-gray-600">Annual Premium</div>
                    <div className="text-sm font-semibold">{formatCurrency(quote.annualPremium)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600">Total Premium</div>
                    <div className="text-sm font-semibold">{formatCurrency(quote.totalPremium)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600">Coverage Amount</div>
                    <div className="text-sm font-semibold">{formatCurrency(quote.faceAmount)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600">Term Length</div>
                    <div className="text-sm font-semibold">{quote.term} Years</div>
                  </div>
                </div>

                {/* Features */}
                {quote.features && (
                  <div className="mt-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Policy Features</h4>
                    <div className="flex flex-wrap gap-2">
                      {quote.features.returnOfPremium && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          Return of Premium
                        </span>
                      )}
                      {quote.features.convertible && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          Convertible
                        </span>
                      )}
                      {quote.features.renewableToAge && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          Renewable to Age {quote.features.renewableToAge}
                        </span>
                      )}
                      {quote.features.acceleratedDeathBenefit && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          Accelerated Death Benefit
                        </span>
                      )}
                      {quote.features.waiverOfPremium && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          Waiver of Premium
                        </span>
                      )}
                      {quote.features.terminalIllnessRider && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          Terminal Illness Rider
                        </span>
                      )}
                      {quote.features.childRider && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          Child Rider Available
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div className="mt-4 flex gap-3">
                  {quote.eAppAvailable && (
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                      Start Application
                    </button>
                  )}
                  <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                    Details
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Metadata */}
          {quotes.metadata && (
            <div className="mt-6 bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Total Carriers:</span>
                  <span className="ml-2 font-medium">{quotes.metadata.totalCarriers}</span>
                </div>
                <div>
                  <span className="text-gray-600">Average Premium:</span>
                  <span className="ml-2 font-medium">{formatCurrency(quotes.metadata.averagePremium)}</span>
                </div>
                <div>
                  <span className="text-gray-600">Lowest Premium:</span>
                  <span className="ml-2 font-medium text-green-600">{formatCurrency(quotes.metadata.lowestPremium)}</span>
                </div>
                <div>
                  <span className="text-gray-600">Highest Premium:</span>
                  <span className="ml-2 font-medium text-red-600">{formatCurrency(quotes.metadata.highestPremium)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Email Modal */}
          {showEmailModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Email Quotes to Client</h3>
                  <form onSubmit={handleSendEmail}>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Client Name <span className="text-red-500">*</span>
                        </label>
                        <Input
                          type="text"
                          value={emailFormData.clientName}
                          onChange={(e) => setEmailFormData({ ...emailFormData, clientName: e.target.value })}
                          placeholder="John Doe"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Client Email <span className="text-red-500">*</span>
                        </label>
                        <Input
                          type="email"
                          value={emailFormData.clientEmail}
                          onChange={(e) => setEmailFormData({ ...emailFormData, clientEmail: e.target.value })}
                          placeholder="john@example.com"
                          required
                        />
                      </div>

                      {emailMutation.isSuccess && (
                        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                          Email sent successfully!
                        </div>
                      )}

                      {emailMutation.isError && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                          {emailMutation.error instanceof Error
                            ? emailMutation.error.message
                            : "Failed to send email"}
                        </div>
                      )}

                      <div className="flex gap-3 mt-6">
                        <button
                          type="button"
                          onClick={() => {
                            setShowEmailModal(false);
                            emailMutation.reset();
                          }}
                          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <Button
                          type="submit"
                          disabled={emailMutation.isPending}
                          className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700"
                        >
                          {emailMutation.isPending ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                              Sending...
                            </>
                          ) : (
                            "Send Email"
                          )}
                        </Button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </AppLayout>
    );
  }

  // Show form
  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">New Term Life Quote</h1>
          <p className="mt-1 text-sm text-gray-600">
            Get competitive term life insurance quotes from multiple carriers
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
          {/* Applicant Information */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Applicant Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Age <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  value={formData.age}
                  onChange={(e) => handleInputChange("age", e.target.value)}
                  placeholder="35"
                  required
                  min="18"
                  max="85"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gender <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => handleInputChange("gender", e.target.value as Gender)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  State <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.state}
                  onChange={(e) => handleInputChange("state", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select State</option>
                  {US_STATES.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tobacco Use <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.tobacco}
                  onChange={(e) => handleInputChange("tobacco", e.target.value as TobaccoUse)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="Never">Never Used</option>
                  <option value="Former">Former User (1+ years ago)</option>
                  <option value="Current">Current User</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Health Class <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.healthClass}
                  onChange={(e) => handleInputChange("healthClass", e.target.value as HealthClass)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="Preferred Plus">Preferred Plus (Excellent Health)</option>
                  <option value="Preferred">Preferred (Very Good Health)</option>
                  <option value="Standard Plus">Standard Plus (Good Health)</option>
                  <option value="Standard">Standard (Average Health)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Product Information */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Product Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.productType}
                  onChange={(e) => handleInputChange("productType", e.target.value as ProductType)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="Term">Term Life</option>
                  <option value="ROP">Return of Premium Term</option>
                  <option value="Convertible Term">Convertible Term</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Term Length <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.term}
                  onChange={(e) => handleInputChange("term", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="10">10 Years</option>
                  <option value="15">15 Years</option>
                  <option value="20">20 Years</option>
                  <option value="25">25 Years</option>
                  <option value="30">30 Years</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Coverage Amount <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  value={formData.faceAmount}
                  onChange={(e) => {
                    const value = e.target.value.replace(/,/g, "");
                    if (!isNaN(Number(value))) {
                      handleInputChange("faceAmount", Number(value).toLocaleString());
                    }
                  }}
                  placeholder="500,000"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  Minimum $50,000 - Maximum $10,000,000
                </p>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-4 pt-4">
            <Button
              type="submit"
              disabled={quoteMutation.isPending}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {quoteMutation.isPending ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Getting Quotes...
                </>
              ) : (
                "Get Quotes"
              )}
            </Button>
          </div>

          {quoteMutation.isError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">
                {quoteMutation.error instanceof Error
                  ? quoteMutation.error.message
                  : "Failed to get quotes. Please try again."}
              </p>
            </div>
          )}
        </form>
      </div>
    </AppLayout>
  );
}

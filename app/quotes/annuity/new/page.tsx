"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type {
  RateWatchQuoteResponse,
  RateWatchQuote,
  AnnuityType,
  AnnuityTerm,
} from "@/lib/integrations/ratewatch/types";

interface AnnuityQuoteRequest {
  annuityType: AnnuityType;
  premium: number;
  term?: AnnuityTerm;
  state: string;
  age?: number;
  qualified?: boolean;
}

export default function NewAnnuityQuotePage() {
  const [formData, setFormData] = useState<AnnuityQuoteRequest>({
    annuityType: "myga" as AnnuityType,
    premium: 100000,
    term: 5 as AnnuityTerm,
    state: "",
    age: undefined,
    qualified: false,
  });

  const [quotes, setQuotes] = useState<RateWatchQuoteResponse | null>(null);

  const quoteMutation = useMutation({
    mutationFn: async (data: AnnuityQuoteRequest) => {
      const res = await fetch("/api/quotes/annuity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to fetch quotes");
      }

      return res.json();
    },
    onSuccess: (data) => {
      setQuotes(data);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    quoteMutation.mutate(formData);
  };

  const handleNewQuote = () => {
    setQuotes(null);
    quoteMutation.reset();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatRate = (rate: number) => {
    return `${rate.toFixed(2)}%`;
  };

  // If we have quotes, show results
  if (quotes && quotes.success) {
    return (
      <AppLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Annuity Rate Quotes</h1>
              <p className="text-gray-600 mt-1">
                Showing {quotes.quotes.length} competitive annuity rates
              </p>
            </div>
            <Button onClick={handleNewQuote} variant="outline">
              New Quote
            </Button>
          </div>

          {/* Summary Stats */}
          {quotes.metadata && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">Quote Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <span className="text-gray-600">Total Results:</span>
                  <span className="ml-2 font-medium text-blue-900">{quotes.metadata.totalResults}</span>
                </div>
                <div>
                  <span className="text-gray-600">Best Rate:</span>
                  <span className="ml-2 font-medium text-green-600">{formatRate(quotes.metadata.bestRate)}</span>
                </div>
                <div>
                  <span className="text-gray-600">Average Rate:</span>
                  <span className="ml-2 font-medium text-blue-900">{formatRate(quotes.metadata.averageRate)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Quotes List */}
          <div className="space-y-4">
            {quotes.quotes.map((quote: RateWatchQuote, index: number) => (
              <div
                key={quote.productId}
                className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Carrier & Product */}
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-xl font-bold text-gray-900">{quote.carrierName}</h3>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded">
                        {quote.carrierRating}
                      </span>
                      {index === 0 && (
                        <span className="px-2 py-1 bg-green-500 text-white text-xs font-bold rounded">
                          BEST RATE
                        </span>
                      )}
                    </div>
                    <p className="text-gray-700 font-medium mb-4">{quote.productName}</p>

                    {/* Rate Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      <div className="bg-green-50 p-3 rounded">
                        <div className="text-sm text-gray-600">Guaranteed Rate</div>
                        <div className="text-2xl font-bold text-green-600">
                          {formatRate(quote.guaranteedRate)}
                        </div>
                      </div>
                      {quote.currentRate && (
                        <div className="bg-blue-50 p-3 rounded">
                          <div className="text-sm text-gray-600">Current Rate</div>
                          <div className="text-2xl font-bold text-blue-600">
                            {formatRate(quote.currentRate)}
                          </div>
                        </div>
                      )}
                      <div className="bg-gray-50 p-3 rounded">
                        <div className="text-sm text-gray-600">Term</div>
                        <div className="text-2xl font-bold text-gray-900">{quote.term} Years</div>
                      </div>
                      {quote.accumulatedValue && (
                        <div className="bg-purple-50 p-3 rounded">
                          <div className="text-sm text-gray-600">Accumulated Value</div>
                          <div className="text-lg font-bold text-purple-600">
                            {formatCurrency(quote.accumulatedValue)}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Features */}
                    {quote.features && (
                      <div className="mb-4">
                        <h4 className="font-semibold text-gray-900 mb-2">Features:</h4>
                        <div className="flex flex-wrap gap-2">
                          {quote.features.deathBenefit && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                              Death Benefit
                            </span>
                          )}
                          {quote.features.nursingHomeBenefit && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                              Nursing Home Benefit
                            </span>
                          )}
                          {quote.features.terminalIllnessBenefit && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                              Terminal Illness Benefit
                            </span>
                          )}
                          {quote.features.freeWithdrawal && (
                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                              {quote.features.freeWithdrawalPercentage}% Free Withdrawal
                            </span>
                          )}
                          {quote.features.bailoutProvision && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                              Bailout Provision
                            </span>
                          )}
                          {quote.features.marketValueAdjustment && (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded">
                              MVA
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Surrender Schedule */}
                    {quote.surrenderSchedule && quote.surrenderSchedule.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-semibold text-gray-900 mb-2">Surrender Charges:</h4>
                        <div className="flex flex-wrap gap-2">
                          {quote.surrenderSchedule.slice(0, 5).map((schedule) => (
                            <span
                              key={schedule.year}
                              className="px-2 py-1 bg-red-50 text-red-700 text-xs rounded"
                            >
                              Year {schedule.year}: {schedule.chargePercentage}%
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Details */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Min Premium:</span>{" "}
                        {formatCurrency(quote.minimumPremium)}
                      </div>
                      <div>
                        <span className="font-medium">Max Premium:</span>{" "}
                        {formatCurrency(quote.maximumPremium)}
                      </div>
                      <div>
                        <span className="font-medium">Age Range:</span> {quote.minimumAge}-
                        {quote.maximumAge}
                      </div>
                      <div>
                        <span className="font-medium">Surrender Period:</span>{" "}
                        {quote.surrenderPeriod} years
                      </div>
                    </div>

                    {/* Interest Earned */}
                    {quote.totalInterest && (
                      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
                        <span className="text-sm text-gray-700">Total Interest Earned: </span>
                        <span className="font-bold text-green-700 text-lg">
                          {formatCurrency(quote.totalInterest)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Disclaimers */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-gray-700">
            <p className="font-semibold mb-2">Important Information:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Rates shown are current as of today and subject to change</li>
              <li>Surrender charges apply for early withdrawals</li>
              <li>Guarantees backed by the financial strength of the issuing carrier</li>
              <li>Consult with a licensed agent before making investment decisions</li>
            </ul>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Show form
  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Request Annuity Quotes</h1>
          <p className="text-gray-600 mt-2">
            Compare annuity rates from top-rated carriers
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-lg border border-gray-200 shadow-sm">
          {/* Annuity Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Annuity Type <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.annuityType}
              onChange={(e) =>
                setFormData({ ...formData, annuityType: e.target.value as AnnuityType })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="myga">MYGA (Multi-Year Guaranteed Annuity)</option>
              <option value="fixed">Fixed Annuity</option>
              <option value="fixed_indexed">Fixed Indexed Annuity</option>
              <option value="immediate">Immediate Annuity</option>
              <option value="deferred">Deferred Annuity</option>
            </select>
          </div>

          {/* Premium Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Premium Amount <span className="text-red-500">*</span>
            </label>
            <Input
              type="number"
              value={formData.premium}
              onChange={(e) =>
                setFormData({ ...formData, premium: parseInt(e.target.value) || 0 })
              }
              min={10000}
              max={10000000}
              step={1000}
              required
              placeholder="100000"
            />
            <p className="text-sm text-gray-500 mt-1">
              Minimum: $10,000 | Maximum: $10,000,000
            </p>
          </div>

          {/* Term */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Term Length
            </label>
            <select
              value={formData.term}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  term: e.target.value ? (parseInt(e.target.value) as AnnuityTerm) : undefined,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Terms</option>
              <option value="3">3 Years</option>
              <option value="5">5 Years</option>
              <option value="7">7 Years</option>
              <option value="10">10 Years</option>
            </select>
          </div>

          {/* State */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              State <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              value={formData.state}
              onChange={(e) =>
                setFormData({ ...formData, state: e.target.value.toUpperCase() })
              }
              maxLength={2}
              placeholder="CA"
              required
            />
            <p className="text-sm text-gray-500 mt-1">2-letter state code</p>
          </div>

          {/* Age (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Client Age (Optional)
            </label>
            <Input
              type="number"
              value={formData.age || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  age: e.target.value ? parseInt(e.target.value) : undefined,
                })
              }
              min={0}
              max={100}
              placeholder="65"
            />
          </div>

          {/* Qualified */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="qualified"
              checked={formData.qualified}
              onChange={(e) =>
                setFormData({ ...formData, qualified: e.target.checked })
              }
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="qualified" className="ml-2 text-sm text-gray-700">
              Qualified (IRA/401k)
            </label>
          </div>

          {/* Error Display */}
          {quoteMutation.isError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {quoteMutation.error instanceof Error
                ? quoteMutation.error.message
                : "Failed to fetch quotes"}
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={quoteMutation.isPending}
            className="w-full py-3 text-lg"
          >
            {quoteMutation.isPending ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Getting Quotes...
              </>
            ) : (
              "Get Annuity Quotes"
            )}
          </Button>
        </form>
      </div>
    </AppLayout>
  );
}

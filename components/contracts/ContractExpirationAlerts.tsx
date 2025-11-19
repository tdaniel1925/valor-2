"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui";

interface Contract {
  id: string;
  carrierName: string;
  productType: string;
  expirationDate: string;
  status: string;
}

interface ExpiringContractsData {
  contracts: Contract[];
}

export function ContractExpirationAlerts() {
  const { data, isLoading } = useQuery<ExpiringContractsData>({
    queryKey: ["expiring-contracts"],
    queryFn: async () => {
      const res = await fetch("/api/contracts/expiring");
      if (!res.ok) throw new Error("Failed to fetch expiring contracts");
      return res.json();
    },
    refetchInterval: 1000 * 60 * 30, // Refetch every 30 minutes
  });

  if (isLoading || !data || data.contracts.length === 0) {
    return null;
  }

  const getDaysUntilExpiration = (expirationDate: string) => {
    const today = new Date();
    const expDate = new Date(expirationDate);
    const diffTime = expDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getUrgencyVariant = (daysUntilExpiration: number) => {
    if (daysUntilExpiration <= 30) return "danger";
    if (daysUntilExpiration <= 60) return "warning";
    return "info";
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <svg
            className="h-5 w-5 text-orange-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900">
            Expiring Contracts
          </h3>
        </div>
        <Badge variant="warning">{data.contracts.length}</Badge>
      </div>

      <div className="space-y-3">
        {data.contracts.map((contract) => {
          const daysUntilExpiration = getDaysUntilExpiration(
            contract.expirationDate
          );

          return (
            <Link
              key={contract.id}
              href={`/contracts/${contract.id}`}
              className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-gray-900">
                      {contract.carrierName}
                    </p>
                    <Badge variant={getUrgencyVariant(daysUntilExpiration)}>
                      {daysUntilExpiration <= 0
                        ? "EXPIRED"
                        : `${daysUntilExpiration} days`}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">{contract.productType}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Expires: {formatDate(contract.expirationDate)}
                  </p>
                </div>
                <svg
                  className="h-5 w-5 text-gray-400 flex-shrink-0 mt-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <Link
          href="/contracts?statusFilter=ACTIVE"
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          View all contracts →
        </Link>
      </div>
    </div>
  );
}

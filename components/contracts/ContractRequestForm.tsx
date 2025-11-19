"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Modal } from "@/components/ui";

interface ContractRequestFormProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Organization {
  id: string;
  name: string;
  type: string;
}

const PRODUCT_TYPES = [
  "Term Life",
  "Whole Life",
  "Universal Life",
  "Variable Universal Life",
  "Indexed Universal Life",
  "Final Expense",
  "Fixed Annuity",
  "Variable Annuity",
  "Indexed Annuity",
  "Medicare Supplement",
  "Medicare Advantage",
  "Long Term Care",
  "Disability",
  "Critical Illness",
  "Accident",
];

const POPULAR_CARRIERS = [
  "Mutual of Omaha",
  "Transamerica",
  "Pacific Life",
  "Nationwide",
  "Lincoln Financial",
  "Foresters Financial",
  "American National",
  "Americo",
  "Fidelity & Guaranty Life",
  "Athene",
  "American Equity",
  "Global Atlantic",
  "North American",
  "AIG",
  "Prudential",
];

export function ContractRequestForm({ isOpen, onClose }: ContractRequestFormProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    carrierName: "",
    productType: "",
    organizationId: "",
    notes: "",
  });

  // Fetch user's organizations
  const { data: orgsData } = useQuery<{ organizations: { organization: Organization }[] }>({
    queryKey: ["user-organizations"],
    queryFn: async () => {
      // TODO: Replace with actual user ID from auth
      const res = await fetch("/api/users/demo-user-id/organizations");
      if (!res.ok) throw new Error("Failed to fetch organizations");
      return res.json();
    },
    enabled: isOpen,
  });

  const createContractMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch("/api/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create contract request");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      handleClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createContractMutation.mutate(formData);
  };

  const handleClose = () => {
    setFormData({
      carrierName: "",
      productType: "",
      organizationId: "",
      notes: "",
    });
    createContractMutation.reset();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Request New Contract" size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Carrier Name */}
        <div>
          <label htmlFor="carrierName" className="block text-sm font-medium text-gray-700 mb-2">
            Carrier Name <span className="text-red-500">*</span>
          </label>
          <select
            id="carrierName"
            required
            value={formData.carrierName}
            onChange={(e) => setFormData({ ...formData, carrierName: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select a carrier...</option>
            {POPULAR_CARRIERS.map((carrier) => (
              <option key={carrier} value={carrier}>
                {carrier}
              </option>
            ))}
            <option value="other">Other (specify in notes)</option>
          </select>
          <p className="mt-1 text-xs text-gray-500">
            Select the insurance carrier for this contract
          </p>
        </div>

        {/* Product Type */}
        <div>
          <label htmlFor="productType" className="block text-sm font-medium text-gray-700 mb-2">
            Product Type <span className="text-red-500">*</span>
          </label>
          <select
            id="productType"
            required
            value={formData.productType}
            onChange={(e) => setFormData({ ...formData, productType: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select a product type...</option>
            {PRODUCT_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500">
            Select the type of insurance product
          </p>
        </div>

        {/* Organization */}
        <div>
          <label htmlFor="organizationId" className="block text-sm font-medium text-gray-700 mb-2">
            Organization
          </label>
          <select
            id="organizationId"
            value={formData.organizationId}
            onChange={(e) => setFormData({ ...formData, organizationId: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Personal (no organization)</option>
            {orgsData?.organizations.map((item) => (
              <option key={item.organization.id} value={item.organization.id}>
                {item.organization.name} ({item.organization.type})
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500">
            Optional: Associate this contract with an organization
          </p>
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
            Additional Notes
          </label>
          <textarea
            id="notes"
            rows={4}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Add any additional information or special requests..."
          />
          <p className="mt-1 text-xs text-gray-500">
            Optional: Add any relevant details about this contract request
          </p>
        </div>

        {/* Error Message */}
        {createContractMutation.isError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">
              Failed to submit contract request. Please try again.
            </p>
          </div>
        )}

        {/* Info Box */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-blue-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                Your contract request will be reviewed by your organization administrator or
                upline. You&apos;ll be notified once it&apos;s approved.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={handleClose}
            disabled={createContractMutation.isPending}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createContractMutation.isPending}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {createContractMutation.isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Submitting...
              </>
            ) : (
              "Submit Request"
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}

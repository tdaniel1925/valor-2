"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { formatDate, formatPercent } from "@/lib/utils";
import { Badge, Button, Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import AppLayout from "@/components/layout/AppLayout";

interface Contract {
  id: string;
  carrierName: string;
  productType: string;
  contractNumber: string | null;
  commissionLevel: number | null;
  status: string;
  effectiveDate: string | null;
  expirationDate: string | null;
  requestedAt: string;
  approvedAt: string | null;
  notes: string | null;
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  };
  organization: {
    id: string;
    name: string;
    type: string;
  } | null;
}

interface ContractsData {
  contracts: Contract[];
}

interface ApprovalData {
  contractNumber: string;
  commissionLevel: number;
  effectiveDate: string;
  expirationDate?: string;
}

export default function AdminContractsPage() {
  const queryClient = useQueryClient();
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("PENDING");
  const [approvalData, setApprovalData] = useState<ApprovalData>({
    contractNumber: "",
    commissionLevel: 0,
    effectiveDate: "",
    expirationDate: "",
  });

  const { data, isLoading, error } = useQuery<ContractsData>({
    queryKey: ["admin-contracts"],
    queryFn: async () => {
      const res = await fetch("/api/admin/contracts");
      if (!res.ok) throw new Error("Failed to fetch contracts");
      return res.json();
    },
  });

  const approveMutation = useMutation({
    mutationFn: async ({ contractId, data }: { contractId: string; data: ApprovalData }) => {
      const res = await fetch(`/api/admin/contracts/${contractId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to approve contract");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-contracts"] });
      setShowApprovalModal(false);
      setSelectedContract(null);
      setApprovalData({
        contractNumber: "",
        commissionLevel: 0,
        effectiveDate: "",
        expirationDate: "",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (contractId: string) => {
      const res = await fetch(`/api/admin/contracts/${contractId}/reject`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to reject contract");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-contracts"] });
    },
  });

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "success";
      case "APPROVED":
        return "info";
      case "PENDING":
        return "warning";
      case "REJECTED":
      case "INACTIVE":
        return "danger";
      default:
        return "default";
    }
  };

  const handleApproveClick = (contract: Contract) => {
    setSelectedContract(contract);
    setShowApprovalModal(true);
  };

  const handleApproveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedContract) {
      approveMutation.mutate({
        contractId: selectedContract.id,
        data: approvalData,
      });
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading contracts...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error || !data) {
    return (
      <AppLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="max-w-md mx-auto">
            <CardContent className="p-6 text-center">
              <p className="text-red-600 dark:text-red-400">Failed to load contracts</p>
              <Button onClick={() => window.location.reload()} className="mt-4">
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  const filteredContracts = data.contracts.filter((contract) =>
    statusFilter === "ALL" ? true : contract.status === statusFilter
  );

  const pendingCount = data.contracts.filter((c) => c.status === "PENDING").length;
  const approvedCount = data.contracts.filter((c) => c.status === "APPROVED").length;
  const activeCount = data.contracts.filter((c) => c.status === "ACTIVE").length;
  const rejectedCount = data.contracts.filter((c) => c.status === "REJECTED").length;

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Contract Approvals</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Review and approve contract requests from agents
          </p>
        </div>

        {/* Main Content */}
        <div>
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="p-6">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Approval</p>
              <p className="text-3xl font-bold text-orange-600 mt-2">{pendingCount}</p>
            </Card>
            <Card className="p-6">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Approved</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">{approvedCount}</p>
            </Card>
            <Card className="p-6">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{activeCount}</p>
            </Card>
            <Card className="p-6">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Rejected</p>
              <p className="text-3xl font-bold text-red-600 mt-2">{rejectedCount}</p>
            </Card>
          </div>

          {/* Status Filter */}
          <Card className="p-6 mb-8">
            <div className="flex gap-2">
              {["ALL", "PENDING", "APPROVED", "ACTIVE", "REJECTED"].map((status) => (
                <Button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  variant={statusFilter === status ? "primary" : "outline"}
                  size="sm"
                >
                  {status}
                </Button>
              ))}
            </div>
          </Card>

          {/* Contracts Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Agent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Carrier
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Product Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Organization
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Requested
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredContracts.map((contract) => (
                  <tr key={contract.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {contract.user.firstName && contract.user.lastName
                          ? `${contract.user.firstName} ${contract.user.lastName}`
                          : "N/A"}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{contract.user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {contract.carrierName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-gray-100">{contract.productType}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-gray-100">
                        {contract.organization ? contract.organization.name : "Personal"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-gray-100">
                        {formatDate(contract.requestedAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={getStatusVariant(contract.status)}>
                        {contract.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        {contract.status === "PENDING" && (
                          <>
                            <Button
                              onClick={() => handleApproveClick(contract)}
                              disabled={approveMutation.isPending}
                              variant="primary"
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                            >
                              Approve
                            </Button>
                            <Button
                              onClick={() => rejectMutation.mutate(contract.id)}
                              disabled={rejectMutation.isPending}
                              variant="secondary"
                              size="sm"
                            >
                              Reject
                            </Button>
                          </>
                        )}
                        <Link href={`/contracts/${contract.id}`}>
                          <Button variant="outline" size="sm">
                            View
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
                  </tbody>
                </table>

                {filteredContracts.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-gray-500 dark:text-gray-400">No contracts found for this status</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Approval Modal */}
        {showApprovalModal && selectedContract && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="max-w-2xl w-full mx-4">
              <CardHeader>
                <CardTitle>Approve Contract</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleApproveSubmit}>
                  <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Contract Request Details</h4>
                    <dl className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <dt className="text-gray-600 dark:text-gray-400">Agent:</dt>
                        <dd className="font-medium text-gray-900 dark:text-gray-100">
                          {selectedContract.user.firstName} {selectedContract.user.lastName}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-gray-600 dark:text-gray-400">Carrier:</dt>
                        <dd className="font-medium text-gray-900 dark:text-gray-100">{selectedContract.carrierName}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-600 dark:text-gray-400">Product Type:</dt>
                        <dd className="font-medium text-gray-900 dark:text-gray-100">{selectedContract.productType}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-600 dark:text-gray-400">Organization:</dt>
                        <dd className="font-medium text-gray-900 dark:text-gray-100">
                          {selectedContract.organization?.name || "Personal"}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Contract Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={approvalData.contractNumber}
                        onChange={(e) =>
                          setApprovalData({ ...approvalData, contractNumber: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter carrier contract number"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Commission Level (%) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        max="100"
                        step="0.01"
                        value={approvalData.commissionLevel}
                        onChange={(e) =>
                          setApprovalData({
                            ...approvalData,
                            commissionLevel: parseFloat(e.target.value),
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter commission percentage"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Effective Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={approvalData.effectiveDate}
                        onChange={(e) =>
                          setApprovalData({ ...approvalData, effectiveDate: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Expiration Date (Optional)
                      </label>
                      <input
                        type="date"
                        value={approvalData.expirationDate}
                        onChange={(e) =>
                          setApprovalData({ ...approvalData, expirationDate: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {approveMutation.isError && (
                    <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <p className="text-sm text-red-600">
                        Failed to approve contract. Please try again.
                      </p>
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setShowApprovalModal(false)}
                      disabled={approveMutation.isPending}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={approveMutation.isPending}
                      isLoading={approveMutation.isPending}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Approve Contract
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

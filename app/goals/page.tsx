"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, Input, Card, CardHeader, CardTitle, CardContent, Badge } from "@/components/ui";
import AppLayout from "@/components/layout/AppLayout";

interface Goal {
  id: string;
  userId: string;
  title: string;
  description?: string;
  type: "COMMISSION" | "CASES" | "PRODUCTION";
  target: number;
  current?: number;
  progress?: number;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
}

export default function GoalsPage() {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  // Fetch goals
  const { data, isLoading } = useQuery<{ goals: Goal[] }>({
    queryKey: ["goals"],
    queryFn: async () => {
      const res = await fetch("/api/goals");
      if (!res.ok) throw new Error("Failed to fetch goals");
      return res.json();
    },
  });

  // Create goal mutation
  const createMutation = useMutation({
    mutationFn: async (goalData: any) => {
      const res = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(goalData),
      });
      if (!res.ok) throw new Error("Failed to create goal");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      setShowCreateModal(false);
    },
  });

  // Update goal mutation
  const updateMutation = useMutation({
    mutationFn: async (goalData: any) => {
      const res = await fetch("/api/goals", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(goalData),
      });
      if (!res.ok) throw new Error("Failed to update goal");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      setEditingGoal(null);
    },
  });

  // Delete goal mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/goals?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete goal");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
    },
  });

  const goals = data?.goals || [];

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>, isEdit: boolean) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const goalData = {
      title: formData.get("title"),
      description: formData.get("description"),
      type: formData.get("type"),
      target: formData.get("target"),
      startDate: formData.get("startDate"),
      endDate: formData.get("endDate"),
    };

    if (isEdit && editingGoal) {
      updateMutation.mutate({ ...goalData, id: editingGoal.id });
    } else {
      createMutation.mutate(goalData);
    }
  };

  const getGoalTypeLabel = (type: string) => {
    switch (type) {
      case "COMMISSION":
        return "Commission";
      case "CASES":
        return "Cases";
      case "PRODUCTION":
        return "Production";
      default:
        return type;
    }
  };

  const formatGoalValue = (goal: Goal, value: number) => {
    switch (goal.type) {
      case "COMMISSION":
        return `$${value.toLocaleString()}`;
      case "CASES":
        return `${value} cases`;
      case "PRODUCTION":
        return `$${value.toLocaleString()}`;
      default:
        return value.toString();
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return "bg-green-500 dark:bg-green-600";
    if (progress >= 75) return "bg-blue-500 dark:bg-blue-600";
    if (progress >= 50) return "bg-yellow-500 dark:bg-yellow-600";
    return "bg-gray-400 dark:bg-gray-600";
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading goals...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Goals</h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Track your performance goals and progress
            </p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            Create Goal
          </Button>
        </div>

        {/* Goals Grid */}
        {goals.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="mx-auto w-16 h-16 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">No goals yet. Create your first goal to start tracking!</p>
              <Button onClick={() => setShowCreateModal(true)}>
                Create Your First Goal
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {goals.map((goal) => (
              <Card key={goal.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{goal.title}</CardTitle>
                      <Badge variant="info" className="mt-2">
                        {getGoalTypeLabel(goal.type)}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Progress</span>
                      <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                        {goal.progress?.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-3 rounded-full transition-all duration-500 ${getProgressColor(goal.progress || 0)}`}
                        style={{ width: `${Math.min(goal.progress || 0, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Current vs Target */}
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Current:</span>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        {formatGoalValue(goal, goal.current || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Target:</span>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        {formatGoalValue(goal, goal.target)}
                      </span>
                    </div>
                  </div>

                  {/* Date Range */}
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                    {new Date(goal.startDate).toLocaleDateString()} - {new Date(goal.endDate).toLocaleDateString()}
                  </div>

                  {/* Description */}
                  {goal.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{goal.description}</p>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setEditingGoal(goal)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="secondary"
                      className="flex-1"
                      onClick={() => {
                        if (confirm(`Delete goal "${goal.title}"?`)) {
                          deleteMutation.mutate(goal.id);
                        }
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create Goal Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50">
            <Card className="max-w-lg w-full mx-4">
              <CardHeader>
                <CardTitle>Create New Goal</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-4">
                  <Input
                    label="Goal Title"
                    name="title"
                    required
                    placeholder="e.g., Q1 Commission Target"
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Goal Type
                    </label>
                    <select
                      name="type"
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                    >
                      <option value="">Select type...</option>
                      <option value="COMMISSION">Commission ($)</option>
                      <option value="CASES">Cases (count)</option>
                      <option value="PRODUCTION">Production ($)</option>
                    </select>
                  </div>

                  <Input
                    label="Target Value"
                    name="target"
                    type="number"
                    step="0.01"
                    required
                    placeholder="e.g., 50000 or 25"
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Start Date"
                      name="startDate"
                      type="date"
                      required
                    />
                    <Input
                      label="End Date"
                      name="endDate"
                      type="date"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Description (Optional)
                    </label>
                    <textarea
                      name="description"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                      placeholder="Add details about this goal..."
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setShowCreateModal(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" isLoading={createMutation.isPending}>
                      Create Goal
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Edit Goal Modal */}
        {editingGoal && (
          <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50">
            <Card className="max-w-lg w-full mx-4">
              <CardHeader>
                <CardTitle>Edit Goal: {editingGoal.title}</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={(e) => handleSubmit(e, true)} className="space-y-4">
                  <Input
                    label="Goal Title"
                    name="title"
                    defaultValue={editingGoal.title}
                    required
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Goal Type
                    </label>
                    <select
                      name="type"
                      defaultValue={editingGoal.type}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                    >
                      <option value="COMMISSION">Commission ($)</option>
                      <option value="CASES">Cases (count)</option>
                      <option value="PRODUCTION">Production ($)</option>
                    </select>
                  </div>

                  <Input
                    label="Target Value"
                    name="target"
                    type="number"
                    step="0.01"
                    defaultValue={editingGoal.target}
                    required
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Start Date"
                      name="startDate"
                      type="date"
                      defaultValue={editingGoal.startDate.split('T')[0]}
                      required
                    />
                    <Input
                      label="End Date"
                      name="endDate"
                      type="date"
                      defaultValue={editingGoal.endDate.split('T')[0]}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Description (Optional)
                    </label>
                    <textarea
                      name="description"
                      rows={3}
                      defaultValue={editingGoal.description || ""}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setEditingGoal(null)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" isLoading={updateMutation.isPending}>
                      Save Changes
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

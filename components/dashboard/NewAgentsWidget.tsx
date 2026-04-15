"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { UserPlus, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui";
import { formatDate } from "@/lib/utils";

interface SmartOfficeAgent {
  id: string;
  lastName: string;
  firstName: string;
  fullName: string;
  email: string | null;
  phones: string | null;
  supervisor: string | null;
  subSource: string | null;
  npn: string | null;
  contractList: string | null;
}

interface AgentsResponse {
  success: boolean;
  data: SmartOfficeAgent[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function NewAgentsWidget() {
  // Fetch recent agents (limit to 5 for dashboard)
  const { data, isLoading } = useQuery<AgentsResponse>({
    queryKey: ["new-agents-widget"],
    queryFn: async () => {
      const res = await fetch("/api/smartoffice/agents?page=1&limit=5&sortBy=newest");
      if (!res.ok) throw new Error("Failed to fetch agents");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-green-600 dark:text-green-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                New Agents
              </h3>
            </div>
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse flex items-center gap-3 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <div className="h-10 w-10 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const agents = data?.data || [];
  const totalAgents = data?.pagination?.total || 0;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <UserPlus className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                New Agents
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {totalAgents} total agents in organization
              </p>
            </div>
          </div>
          <Link
            href="/smartoffice/agents"
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1"
          >
            View All
            <ExternalLink className="h-4 w-4" />
          </Link>
        </div>

        {agents.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <UserPlus className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No new agents to display</p>
          </div>
        ) : (
          <div className="space-y-3">
            {agents.map((agent) => (
              <div
                key={agent.id}
                className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-semibold">
                    {agent.firstName?.[0]}{agent.lastName?.[0]}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {agent.fullName}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                    {agent.supervisor && (
                      <span className="truncate">Supervisor: {agent.supervisor}</span>
                    )}
                    {agent.npn && (
                      <span className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">
                        NPN: {agent.npn}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Link
            href="/smartoffice/agents"
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center justify-center gap-1"
          >
            View All Agents
            <ExternalLink className="h-4 w-4" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

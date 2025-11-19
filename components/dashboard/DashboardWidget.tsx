"use client";

import { ReactNode } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui";

interface DashboardWidgetProps {
  title: string;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
  icon?: ReactNode;
}

export default function DashboardWidget({
  title,
  description,
  children,
  actions,
  className = "",
  icon,
}: DashboardWidgetProps) {
  return (
    <Card className={`hover:shadow-lg transition-shadow ${className}`}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="flex items-start gap-3">
          {icon && (
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
              {icon}
            </div>
          )}
          <div>
            <CardTitle className="text-base font-semibold">{title}</CardTitle>
            {description && (
              <p className="text-xs text-gray-500 mt-1">{description}</p>
            )}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

// Stat Widget Component
interface StatWidgetProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    period: string;
  };
  icon: ReactNode;
  trend?: "up" | "down" | "neutral";
}

export function StatWidget({ title, value, change, icon, trend = "neutral" }: StatWidgetProps) {
  const trendColor = {
    up: "text-green-600",
    down: "text-red-600",
    neutral: "text-gray-600",
  }[trend];

  const trendBg = {
    up: "bg-green-50",
    down: "bg-red-50",
    neutral: "bg-gray-50",
  }[trend];

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
            {change && (
              <div className={`flex items-center gap-1 mt-2 ${trendColor}`}>
                <svg
                  className={`w-4 h-4 ${trend === "down" ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 10l7-7m0 0l7 7m-7-7v18"
                  />
                </svg>
                <span className="text-sm font-medium">
                  {Math.abs(change.value)}% {change.period}
                </span>
              </div>
            )}
          </div>
          <div className={`w-12 h-12 rounded-lg ${trendBg} flex items-center justify-center flex-shrink-0`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// List Widget Component
interface ListWidgetProps {
  title: string;
  items: Array<{
    id: string;
    title: string;
    subtitle?: string;
    badge?: {
      text: string;
      variant?: "success" | "warning" | "error" | "info" | "default";
    };
    href?: string;
  }>;
  emptyMessage?: string;
}

export function ListWidget({ title, items, emptyMessage = "No items found" }: ListWidgetProps) {
  return (
    <DashboardWidget title={title}>
      <div className="space-y-3">
        {items.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">{emptyMessage}</p>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="flex items-start justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                {item.subtitle && (
                  <p className="text-xs text-gray-500 mt-1">{item.subtitle}</p>
                )}
              </div>
              {item.badge && (
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  item.badge.variant === "success"
                    ? "bg-green-100 text-green-800"
                    : item.badge.variant === "warning"
                    ? "bg-yellow-100 text-yellow-800"
                    : item.badge.variant === "error"
                    ? "bg-red-100 text-red-800"
                    : item.badge.variant === "info"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-gray-100 text-gray-800"
                }`}>
                  {item.badge.text}
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </DashboardWidget>
  );
}

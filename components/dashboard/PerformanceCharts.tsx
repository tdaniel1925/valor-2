"use client";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface PerformanceChartsProps {
  commissionsData?: Array<{ month: string; amount: number; count: number }>;
  casesData?: Array<{ month: string; count: number; status: string }>;
}

export default function PerformanceCharts({
  commissionsData = [],
  casesData = [],
}: PerformanceChartsProps) {
  // Default data if none provided
  const defaultCommissionsData = [
    { month: "Jan", amount: 12500, count: 8 },
    { month: "Feb", amount: 15200, count: 10 },
    { month: "Mar", amount: 18900, count: 12 },
    { month: "Apr", amount: 16700, count: 11 },
    { month: "May", amount: 21300, count: 14 },
    { month: "Jun", amount: 24500, count: 16 },
  ];

  const defaultCasesData = [
    { month: "Jan", submitted: 5, approved: 3, pending: 2 },
    { month: "Feb", submitted: 7, approved: 5, pending: 2 },
    { month: "Mar", submitted: 9, approved: 7, pending: 2 },
    { month: "Apr", submitted: 8, approved: 6, pending: 2 },
    { month: "May", submitted: 11, approved: 8, pending: 3 },
    { month: "Jun", submitted: 13, approved: 10, pending: 3 },
  ];

  const commissions = commissionsData.length > 0 ? commissionsData : defaultCommissionsData;
  const cases = casesData.length > 0 ? casesData : defaultCasesData;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Commission Trends */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Commission Trends
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Monthly commission earnings over the last 6 months
        </p>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={commissions}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12 }}
              stroke="#9ca3af"
            />
            <YAxis
              tick={{ fontSize: 12 }}
              stroke="#9ca3af"
              tickFormatter={(value) => `$${value / 1000}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
              }}
              formatter={(value: number) => [`$${value.toLocaleString()}`, "Amount"]}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="amount"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: "#3b82f6", r: 4 }}
              activeDot={{ r: 6 }}
              name="Commission Amount"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Cases Performance */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Cases Performance
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Case submissions and approvals by month
        </p>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={cases}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12 }}
              stroke="#9ca3af"
            />
            <YAxis
              tick={{ fontSize: 12 }}
              stroke="#9ca3af"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
              }}
            />
            <Legend />
            <Bar
              dataKey="submitted"
              fill="#3b82f6"
              radius={[4, 4, 0, 0]}
              name="Submitted"
            />
            <Bar
              dataKey="approved"
              fill="#10b981"
              radius={[4, 4, 0, 0]}
              name="Approved"
            />
            <Bar
              dataKey="pending"
              fill="#f59e0b"
              radius={[4, 4, 0, 0]}
              name="Pending"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Production Volume Trend */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Production Volume
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Number of cases submitted monthly
        </p>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={commissions}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12 }}
              stroke="#9ca3af"
            />
            <YAxis
              tick={{ fontSize: 12 }}
              stroke="#9ca3af"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
              }}
              formatter={(value: number) => [value, "Cases"]}
            />
            <Bar
              dataKey="count"
              fill="#8b5cf6"
              radius={[4, 4, 0, 0]}
              name="Cases"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Average Premium Trend */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Average Case Value
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Average commission per case over time
        </p>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            data={commissions.map((item) => ({
              ...item,
              avgValue: Math.round(item.amount / item.count),
            }))}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12 }}
              stroke="#9ca3af"
            />
            <YAxis
              tick={{ fontSize: 12 }}
              stroke="#9ca3af"
              tickFormatter={(value) => `$${value / 1000}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
              }}
              formatter={(value: number) => [`$${value.toLocaleString()}`, "Avg Value"]}
            />
            <Line
              type="monotone"
              dataKey="avgValue"
              stroke="#ec4899"
              strokeWidth={2}
              dot={{ fill: "#ec4899", r: 4 }}
              activeDot={{ r: 6 }}
              name="Average Value"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

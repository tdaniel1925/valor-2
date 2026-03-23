'use client';

import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Building2, Loader2 } from 'lucide-react';

interface ChartData {
  name: string;
  value: number;
}

const COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#8b5cf6', // purple
  '#ef4444', // red
  '#06b6d4', // cyan
  '#f97316', // orange
  '#ec4899', // pink
  '#6b7280', // gray
  '#14b8a6', // teal
];

export default function CarrierBreakdownChart() {
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/smartoffice/charts/carrier-breakdown', { credentials: 'include' });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch carrier data');
      }

      if (result.success) {
        setData(result.data);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Shorten long carrier names
  const shortenName = (name: string) => {
    const maxLength = 30;
    if (name.length <= maxLength) return name;
    return name.substring(0, maxLength - 3) + '...';
  };

  // Group data: top 7 carriers + "Others" for the rest
  const getChartData = () => {
    if (data.length <= 7) {
      return data.map(item => ({
        ...item,
        name: shortenName(item.name)
      }));
    }

    // Sort by value descending and take top 7
    const sorted = [...data].sort((a, b) => b.value - a.value);
    const top7 = sorted.slice(0, 7);
    const others = sorted.slice(7);

    const chartData = top7.map(item => ({
      ...item,
      name: shortenName(item.name)
    }));

    // Add "Others" if there are remaining carriers
    if (others.length > 0) {
      const othersTotal = others.reduce((sum, item) => sum + item.value, 0);
      chartData.push({
        name: `Others (${others.length})`,
        value: othersTotal
      });
    }

    return chartData;
  };

  const chartData = getChartData();

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center h-80">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-blue-600" />
          Carrier Breakdown
        </h3>
        <p className="text-sm text-gray-500 text-center py-12">
          No carrier data available
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Building2 className="w-5 h-5 text-blue-600" />
        Carrier Breakdown
      </h3>

      <ResponsiveContainer width="100%" height={400}>
        <PieChart>
          <Pie
            data={chartData}
            cx="35%"
            cy="50%"
            labelLine={false}
            label={false}
            outerRadius={110}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value: number) => formatCurrency(value)} />
          <Legend
            layout="vertical"
            verticalAlign="middle"
            align="right"
            wrapperStyle={{ paddingLeft: '10px', fontSize: '11px', maxWidth: '180px' }}
            iconType="circle"
            iconSize={8}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

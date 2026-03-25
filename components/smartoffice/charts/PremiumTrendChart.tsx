'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Loader2 } from 'lucide-react';

interface ChartData {
  month: string;
  monthLabel: string;
  total: number;
  [key: string]: string | number; // Dynamic status fields
}

export default function PremiumTrendChart() {
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/smartoffice/charts/premium-trend', { credentials: 'include' });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch trend data');
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

  // Extract all status keys dynamically from data
  const getStatusKeys = (): string[] => {
    if (data.length === 0) return [];

    const keys = new Set<string>();
    data.forEach((item) => {
      Object.keys(item).forEach((key) => {
        if (key !== 'month' && key !== 'monthLabel' && key !== 'total') {
          keys.add(key);
        }
      });
    });

    return Array.from(keys);
  };

  // Color mapping for statuses
  const getStatusColor = (status: string): string => {
    const colorMap: Record<string, string> = {
      'inforce': '#10b981',
      'pending': '#f59e0b',
      'submitted': '#3b82f6',
      'declined': '#ef4444',
      'withdrawn': '#6b7280',
      'other': '#8b5cf6',
    };

    return colorMap[status.toLowerCase()] || '#6b7280';
  };

  // Capitalize first letter for display
  const formatStatusName = (status: string): string => {
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  };

  const statusKeys = getStatusKeys();

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
          <TrendingUp className="w-5 h-5 text-purple-600" />
          Premium Trend
        </h3>
        <p className="text-sm text-gray-500 text-center py-12">
          No data available for the last 6 months
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-purple-600" />
        Premium Trend
      </h3>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="monthLabel" />
          <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
          <Tooltip
            formatter={(value: number) => formatCurrency(value)}
            labelFormatter={(label) => `Month: ${label}`}
          />
          <Legend />
          {statusKeys.map((status) => (
            <Line
              key={status}
              type="monotone"
              dataKey={status}
              stroke={getStatusColor(status)}
              name={formatStatusName(status)}
              strokeWidth={2}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

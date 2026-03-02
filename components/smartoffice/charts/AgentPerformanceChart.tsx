'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, Loader2 } from 'lucide-react';

interface ChartData {
  name: string;
  value: number;
}

export default function AgentPerformanceChart() {
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/smartoffice/charts/agent-performance', { credentials: 'include' });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch agent data');
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
          <Users className="w-5 h-5 text-green-600" />
          Top Agents by Premium
        </h3>
        <p className="text-sm text-gray-500 text-center py-12">
          No agent data available
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Users className="w-5 h-5 text-green-600" />
        Top Agents by Premium
      </h3>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} layout="horizontal">
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="category" dataKey="name" angle={-45} textAnchor="end" height={100} />
          <YAxis type="number" tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
          <Tooltip formatter={(value: number) => formatCurrency(value)} />
          <Bar dataKey="value" fill="#10b981" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

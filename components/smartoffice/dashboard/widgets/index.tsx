'use client';

import { useEffect, useState } from 'react';
import { DollarSign, FileText, Activity, Clock, Users, Building2, Filter, TrendingUp } from 'lucide-react';
import Widget from '../Widget';

interface WidgetComponentProps {
  id: string;
  config?: any;
  onRemove?: (id: string) => void;
  onConfigure?: (id: string) => void;
}

// Helper hook to fetch widget data
function useWidgetData(type: string, config: any) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const configParam = encodeURIComponent(JSON.stringify(config || {}));
        const response = await fetch(`/api/smartoffice/widgets/data?type=${type}&config=${configParam}`, {
          credentials: 'include',
        });
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to fetch data');
        }

        setData(result.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [type, JSON.stringify(config)]);

  return { data, loading, error };
}

// 1. Stats Widget
export function StatsWidget({ id, config, onRemove, onConfigure }: WidgetComponentProps) {
  const { data, loading, error } = useWidgetData('stats', config);

  const formatValue = (value: number, format?: string) => {
    if (format === 'currency') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
      }).format(value);
    }
    return value.toLocaleString();
  };

  return (
    <Widget id={id} title={data?.label || 'Statistics'} onRemove={onRemove} onConfigure={onConfigure} loading={loading} error={error}>
      {data && (
        <div className="flex flex-col items-center justify-center h-full">
          <DollarSign className="w-12 h-12 text-blue-600 mb-2" />
          <div className="text-4xl font-bold text-gray-900">{formatValue(data.value, data.format)}</div>
        </div>
      )}
    </Widget>
  );
}

// 2. Mini Chart Widget
export function MiniChartWidget({ id, config, onRemove, onConfigure }: WidgetComponentProps) {
  const { data, loading, error } = useWidgetData('mini-chart', config);

  return (
    <Widget id={id} title="Premium Trend" onRemove={onRemove} onConfigure={onConfigure} loading={loading} error={error}>
      {data && data.length > 0 && (
        <div className="flex items-end justify-between h-full gap-1">
          {data.map((point: any, i: number) => {
            const maxValue = Math.max(...data.map((p: any) => p.value));
            const height = maxValue > 0 ? (point.value / maxValue) * 100 : 0;
            return (
              <div key={i} className="flex-1 flex flex-col items-center">
                <div
                  className="w-full bg-blue-500 rounded-t"
                  style={{ height: `${height}%` }}
                  title={`${point.month}: $${point.value.toLocaleString()}`}
                />
              </div>
            );
          })}
        </div>
      )}
    </Widget>
  );
}

// 3. Recent Activity Widget
export function RecentActivityWidget({ id, config, onRemove, onConfigure }: WidgetComponentProps) {
  const { data, loading, error } = useWidgetData('recent-activity', config);

  return (
    <Widget id={id} title="Recent Syncs" onRemove={onRemove} onConfigure={onConfigure} loading={loading} error={error}>
      {data && (
        <div className="space-y-2">
          {data.map((activity: any) => (
            <div key={activity.id} className="flex items-center justify-between text-sm border-b border-gray-100 pb-2">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-gray-400" />
                <span className="text-gray-700">{activity.type}</span>
              </div>
              <div className="text-gray-500">
                {activity.recordsAffected} records
                {activity.duration && ` · ${activity.duration}s`}
              </div>
            </div>
          ))}
        </div>
      )}
    </Widget>
  );
}

// 4. Pending List Widget
export function PendingListWidget({ id, config, onRemove, onConfigure }: WidgetComponentProps) {
  const { data, loading, error } = useWidgetData('pending-list', config);

  return (
    <Widget id={id} title="Policies Pending >7 Days" onRemove={onRemove} onConfigure={onConfigure} loading={loading} error={error}>
      {data && (
        <div className="space-y-2">
          {data.map((policy: any) => (
            <div key={policy.id} className="border-b border-gray-100 pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-sm text-gray-900">{policy.policyNumber}</div>
                  <div className="text-xs text-gray-600">{policy.insured}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-red-600">{policy.daysPending}d</div>
                  <div className="text-xs text-gray-500">{policy.carrier}</div>
                </div>
              </div>
            </div>
          ))}
          {data.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">No pending policies {'>'}7 days</p>
          )}
        </div>
      )}
    </Widget>
  );
}

// 5. Commission Tracker Widget
export function CommissionWidget({ id, config, onRemove, onConfigure }: WidgetComponentProps) {
  const { data, loading, error } = useWidgetData('commission', config);

  return (
    <Widget id={id} title="Commission Progress" onRemove={onRemove} onConfigure={onConfigure} loading={loading} error={error}>
      {data && (
        <div className="flex flex-col justify-center h-full">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl font-bold text-gray-900">
                ${data.current.toLocaleString()}
              </span>
              <span className="text-sm text-gray-600">of ${data.goal.toLocaleString()}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className="bg-green-600 h-4 rounded-full transition-all"
                style={{ width: `${data.progress}%` }}
              />
            </div>
          </div>
          <p className="text-sm text-gray-600 text-center">
            ${data.remaining.toLocaleString()} remaining
          </p>
        </div>
      )}
    </Widget>
  );
}

// 6. Top Agents Widget
export function TopAgentsWidget({ id, config, onRemove, onConfigure }: WidgetComponentProps) {
  const { data, loading, error } = useWidgetData('top-agents', config);

  return (
    <Widget id={id} title="Top Agents" onRemove={onRemove} onConfigure={onConfigure} loading={loading} error={error}>
      {data && (
        <div className="space-y-3">
          {data.map((agent: any, index: number) => (
            <div key={agent.id} className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold text-sm">
                {index + 1}
              </div>
              <div className="flex-1">
                <div className="font-medium text-sm text-gray-900">{agent.name}</div>
                <div className="text-xs text-gray-600">
                  {agent.policyCount} policies · ${agent.totalPremium.toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Widget>
  );
}

// 7. Carrier Status Widget
export function CarrierStatusWidget({ id, config, onRemove, onConfigure }: WidgetComponentProps) {
  const { data, loading, error } = useWidgetData('carrier-status', config);

  return (
    <Widget id={id} title="Carrier Status" onRemove={onRemove} onConfigure={onConfigure} loading={loading} error={error}>
      {data && (
        <div className="grid grid-cols-2 gap-3">
          {data.slice(0, 6).map((carrier: any) => (
            <div key={carrier.name} className="border border-gray-200 rounded p-3">
              <div className="font-medium text-sm text-gray-900 mb-2 truncate" title={carrier.name}>
                {carrier.name}
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total:</span>
                  <span className="font-semibold">{carrier.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Pending:</span>
                  <span className="font-semibold text-orange-600">{carrier.pending}</span>
                </div>
                {carrier.avgResponseTime && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Avg:</span>
                    <span className="font-semibold">{carrier.avgResponseTime}d</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Widget>
  );
}

// 8. Quick Filters Widget
export function QuickFiltersWidget({ id, config, onRemove, onConfigure }: WidgetComponentProps) {
  const { data, loading, error } = useWidgetData('quick-filters', config);

  const handleFilterClick = (filterType: string) => {
    const baseUrl = '/smartoffice';
    switch (filterType) {
      case 'pending':
        window.location.href = `${baseUrl}?status=PENDING`;
        break;
      case 'pending7':
        window.location.href = `${baseUrl}?filter=pending-week`;
        break;
      case 'thisMonth':
        window.location.href = `${baseUrl}?filter=this-month`;
        break;
      case 'inforce':
        window.location.href = `${baseUrl}?status=INFORCE`;
        break;
    }
  };

  return (
    <Widget id={id} title="Quick Filters" onRemove={onRemove} onConfigure={onConfigure} loading={loading} error={error}>
      {data && (
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleFilterClick('pending')}
            className="p-4 border-2 border-orange-200 rounded-lg hover:bg-orange-50 transition-colors text-left"
          >
            <div className="text-2xl font-bold text-orange-600">{data.pending}</div>
            <div className="text-sm text-gray-700">Pending</div>
          </button>
          <button
            onClick={() => handleFilterClick('pending7')}
            className="p-4 border-2 border-red-200 rounded-lg hover:bg-red-50 transition-colors text-left"
          >
            <div className="text-2xl font-bold text-red-600">{data.pendingOver7Days}</div>
            <div className="text-sm text-gray-700">Pending {'>'}7d</div>
          </button>
          <button
            onClick={() => handleFilterClick('thisMonth')}
            className="p-4 border-2 border-blue-200 rounded-lg hover:bg-blue-50 transition-colors text-left"
          >
            <div className="text-2xl font-bold text-blue-600">{data.thisMonth}</div>
            <div className="text-sm text-gray-700">This Month</div>
          </button>
          <button
            onClick={() => handleFilterClick('inforce')}
            className="p-4 border-2 border-green-200 rounded-lg hover:bg-green-50 transition-colors text-left"
          >
            <div className="text-2xl font-bold text-green-600">{data.inforce}</div>
            <div className="text-sm text-gray-700">Inforce</div>
          </button>
        </div>
      )}
    </Widget>
  );
}

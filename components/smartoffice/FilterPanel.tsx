'use client';

import { useState, useEffect } from 'react';
import { Filter, X, Calendar } from 'lucide-react';

interface FilterPanelProps {
  onApplyFilters: (filters: FilterValues) => void;
  onClearFilters: () => void;
  initialFilters?: FilterValues;
}

export interface FilterValues {
  status?: string[];
  carrier?: string[];
  type?: string[];
  dateFrom?: string;
  dateTo?: string;
  premiumMin?: number;
  premiumMax?: number;
}

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'ISSUED', label: 'Issued' },
  { value: 'DECLINED', label: 'Declined' },
  { value: 'LAPSED', label: 'Lapsed' },
  { value: 'SURRENDERED', label: 'Surrendered' },
];

const TYPE_OPTIONS = [
  { value: 'LIFE', label: 'Life Insurance' },
  { value: 'ANNUITY', label: 'Annuity' },
  { value: 'OTHER', label: 'Other' },
];

export default function FilterPanel({
  onApplyFilters,
  onClearFilters,
  initialFilters = {},
}: FilterPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<FilterValues>(initialFilters);
  const [carriers, setCarriers] = useState<string[]>([]);
  const [loadingCarriers, setLoadingCarriers] = useState(true);

  // Fetch unique carriers from API
  useEffect(() => {
    fetchCarriers();
  }, []);

  const fetchCarriers = async () => {
    try {
      const response = await fetch('/api/smartoffice/policies?limit=1000');
      const data = await response.json();

      if (data.success) {
        const uniqueCarriers = Array.from(
          new Set(data.data.map((p: any) => p.carrierName))
        ).sort() as string[];
        setCarriers(uniqueCarriers);
      }
    } catch (error) {
      console.error('Failed to fetch carriers:', error);
    } finally {
      setLoadingCarriers(false);
    }
  };

  const handleStatusToggle = (value: string) => {
    const current = filters.status || [];
    const updated = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];

    setFilters({ ...filters, status: updated.length > 0 ? updated : undefined });
  };

  const handleCarrierToggle = (value: string) => {
    const current = filters.carrier || [];
    const updated = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];

    setFilters({ ...filters, carrier: updated.length > 0 ? updated : undefined });
  };

  const handleTypeToggle = (value: string) => {
    const current = filters.type || [];
    const updated = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];

    setFilters({ ...filters, type: updated.length > 0 ? updated : undefined });
  };

  const handleApply = () => {
    onApplyFilters(filters);
    setIsOpen(false);
  };

  const handleClear = () => {
    setFilters({});
    onClearFilters();
    setIsOpen(false);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.status && filters.status.length > 0) count++;
    if (filters.carrier && filters.carrier.length > 0) count++;
    if (filters.type && filters.type.length > 0) count++;
    if (filters.dateFrom || filters.dateTo) count++;
    if (filters.premiumMin || filters.premiumMax) count++;
    return count;
  };

  const activeCount = getActiveFilterCount();

  return (
    <div className="relative">
      {/* Filter Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`px-4 py-2 border rounded-lg inline-flex items-center gap-2 transition-colors ${
          activeCount > 0
            ? 'bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100'
            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
        }`}
      >
        <Filter className="w-5 h-5" />
        Filters
        {activeCount > 0 && (
          <span className="ml-1 px-2 py-0.5 bg-blue-600 text-white text-xs font-medium rounded-full">
            {activeCount}
          </span>
        )}
      </button>

      {/* Filter Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-25 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[80vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Filter Policies</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Filters */}
            <div className="p-4 space-y-6">
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <div className="space-y-2">
                  {STATUS_OPTIONS.map(option => (
                    <label key={option.value} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.status?.includes(option.value) || false}
                        onChange={() => handleStatusToggle(option.value)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Type
                </label>
                <div className="space-y-2">
                  {TYPE_OPTIONS.map(option => (
                    <label key={option.value} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.type?.includes(option.value) || false}
                        onChange={() => handleTypeToggle(option.value)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Carrier Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Carrier
                </label>
                {loadingCarriers ? (
                  <p className="text-sm text-gray-500">Loading carriers...</p>
                ) : (
                  <div className="max-h-48 overflow-y-auto space-y-2 border border-gray-200 rounded p-2">
                    {carriers.map(carrier => (
                      <label key={carrier} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={filters.carrier?.includes(carrier) || false}
                          onChange={() => handleCarrierToggle(carrier)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">{carrier}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Date Range Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Status Date Range
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">From</label>
                    <input
                      type="date"
                      value={filters.dateFrom || ''}
                      onChange={(e) =>
                        setFilters({
                          ...filters,
                          dateFrom: e.target.value || undefined,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">To</label>
                    <input
                      type="date"
                      value={filters.dateTo || ''}
                      onChange={(e) =>
                        setFilters({
                          ...filters,
                          dateTo: e.target.value || undefined,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Premium Range Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Annual Premium Range
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Min ($)</label>
                    <input
                      type="number"
                      value={filters.premiumMin || ''}
                      onChange={(e) =>
                        setFilters({
                          ...filters,
                          premiumMin: e.target.value ? Number(e.target.value) : undefined,
                        })
                      }
                      placeholder="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Max ($)</label>
                    <input
                      type="number"
                      value={filters.premiumMax || ''}
                      onChange={(e) =>
                        setFilters({
                          ...filters,
                          premiumMax: e.target.value ? Number(e.target.value) : undefined,
                        })
                      }
                      placeholder="No limit"
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-4 py-3 flex gap-3">
              <button
                onClick={handleClear}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100"
              >
                Clear All
              </button>
              <button
                onClick={handleApply}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

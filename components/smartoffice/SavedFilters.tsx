'use client';

import { useState, useEffect } from 'react';
import { Star, Trash2, Loader2, Filter, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SavedFilter {
  id: string;
  name: string;
  filters: Record<string, any>;
  isDefault: boolean;
  createdAt: string;
}

export default function SavedFilters() {
  const router = useRouter();
  const [filters, setFilters] = useState<SavedFilter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchFilters();
  }, []);

  const fetchFilters = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/smartoffice/saved-filters', { credentials: 'include' });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch saved filters');
      }

      if (result.success) {
        setFilters(result.data);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const applyFilter = (filter: SavedFilter) => {
    const params = new URLSearchParams(filter.filters);
    router.push(`/smartoffice?${params.toString()}`);
    setIsOpen(false);
  };

  const deleteFilter = async (id: string) => {
    if (!confirm('Are you sure you want to delete this saved filter?')) {
      return;
    }

    try {
      setDeletingId(id);
      const response = await fetch(`/api/smartoffice/saved-filters/${id}`, {
        credentials: 'include',
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete filter');
      }

      setFilters((prev) => prev.filter((f) => f.id !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete filter');
    } finally {
      setDeletingId(null);
    }
  };

  const toggleDefault = async (id: string, currentDefault: boolean) => {
    try {
      const response = await fetch(`/api/smartoffice/saved-filters/${id}`, {
        credentials: 'include',
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDefault: !currentDefault }),
      });

      if (!response.ok) {
        throw new Error('Failed to update filter');
      }

      // Update local state
      setFilters((prev) =>
        prev.map((f) => ({
          ...f,
          isDefault: f.id === id ? !currentDefault : currentDefault ? false : f.isDefault,
        }))
      );
    } catch (err: any) {
      alert(err.message || 'Failed to update filter');
    }
  };

  if (loading) {
    return (
      <div className="relative">
        <button className="px-3 py-2 text-sm border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading...
        </button>
      </div>
    );
  }

  if (error) {
    return null; // Silently fail - saved filters are optional
  }

  if (filters.length === 0) {
    return null; // Don't show if no saved filters
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-2 text-sm border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
      >
        <Filter className="w-4 h-4" />
        Saved Filters ({filters.length})
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-96 overflow-y-auto">
            <div className="p-3 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 text-sm">Your Saved Filters</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="divide-y divide-gray-200">
              {filters.map((filter) => (
                <div
                  key={filter.id}
                  className="p-3 hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <button
                      onClick={() => applyFilter(filter)}
                      className="flex-1 text-left"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900 text-sm">
                          {filter.name}
                        </span>
                        {filter.isDefault && (
                          <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        {Object.entries(filter.filters)
                          .filter(([key, value]) => value)
                          .map(([key, value]) => `${key}: ${value}`)
                          .join(', ') || 'No filters'}
                      </div>
                    </button>

                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => toggleDefault(filter.id, filter.isDefault)}
                        className="p-1 text-gray-400 hover:text-yellow-500 transition-colors"
                        title={filter.isDefault ? 'Remove default' : 'Set as default'}
                      >
                        <Star
                          className={`w-4 h-4 ${
                            filter.isDefault ? 'fill-yellow-500 text-yellow-500' : ''
                          }`}
                        />
                      </button>
                      <button
                        onClick={() => deleteFilter(filter.id)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                        disabled={deletingId === filter.id}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

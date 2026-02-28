'use client';

import { useState } from 'react';
import { X, Save, Star } from 'lucide-react';

interface SaveFilterDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentFilters: Record<string, any>;
  onSave: (name: string, isDefault: boolean) => Promise<void>;
}

export default function SaveFilterDialog({
  isOpen,
  onClose,
  currentFilters,
  onSave,
}: SaveFilterDialogProps) {
  const [name, setName] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please enter a filter name');
      return;
    }

    try {
      setSaving(true);
      await onSave(name.trim(), isDefault);
      setName('');
      setIsDefault(false);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save filter');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Save className="w-5 h-5 text-blue-600" />
            Save Current Filter
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="filter-name" className="block text-sm font-medium text-gray-700 mb-1">
              Filter Name
            </label>
            <input
              type="text"
              id="filter-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Pending >7 days"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={saving}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is-default"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              disabled={saving}
            />
            <label htmlFor="is-default" className="text-sm text-gray-700 flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-500" />
              Set as default filter
            </label>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded p-3">
            <p className="text-xs text-gray-600 mb-2">Current filter settings:</p>
            <ul className="text-xs text-gray-700 space-y-1">
              {currentFilters.status && <li>Status: {currentFilters.status}</li>}
              {currentFilters.carrier && <li>Carrier: {currentFilters.carrier}</li>}
              {currentFilters.agent && <li>Agent: {currentFilters.agent}</li>}
              {currentFilters.dateFrom && <li>Date From: {currentFilters.dateFrom}</li>}
              {currentFilters.dateTo && <li>Date To: {currentFilters.dateTo}</li>}
              {currentFilters.search && <li>Search: {currentFilters.search}</li>}
              {currentFilters.sortBy && (
                <li>
                  Sort: {currentFilters.sortBy} ({currentFilters.sortOrder || 'asc'})
                </li>
              )}
              {Object.keys(currentFilters).length === 0 && (
                <li className="text-gray-500 italic">No filters applied</li>
              )}
            </ul>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Filter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

'use client';

import { ReactNode } from 'react';
import { X, Settings } from 'lucide-react';

interface WidgetProps {
  id: string;
  title: string;
  children: ReactNode;
  onRemove?: (id: string) => void;
  onConfigure?: (id: string) => void;
  loading?: boolean;
  error?: string | null;
}

export default function Widget({
  id,
  title,
  children,
  onRemove,
  onConfigure,
  loading,
  error,
}: WidgetProps) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <div className="flex gap-2">
          {onConfigure && (
            <button
              onClick={() => onConfigure(id)}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              title="Configure widget"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
          {onRemove && (
            <button
              onClick={() => onRemove(id)}
              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
              title="Remove widget"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

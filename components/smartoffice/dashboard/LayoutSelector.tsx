'use client';

import { useState, useEffect } from 'react';
import { Layout, Plus, Star, Trash2, Check } from 'lucide-react';

interface DashboardLayout {
  id: string;
  name: string;
  description: string | null;
  isDefault: boolean;
  createdAt: string;
}

interface LayoutSelectorProps {
  currentLayoutId?: string;
  onSelectLayout: (layoutId: string | null) => void;
  onCreateNew: () => void;
}

export default function LayoutSelector({
  currentLayoutId,
  onSelectLayout,
  onCreateNew,
}: LayoutSelectorProps) {
  const [layouts, setLayouts] = useState<DashboardLayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [savingName, setSavingName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  useEffect(() => {
    fetchLayouts();
  }, []);

  const fetchLayouts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/smartoffice/dashboards', { credentials: 'include' });
      const result = await response.json();
      if (result.success) {
        setLayouts(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch layouts:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteLayout = async (id: string) => {
    if (!confirm('Are you sure you want to delete this layout?')) {
      return;
    }

    try {
      const response = await fetch(`/api/smartoffice/dashboards/${id}`, {
        credentials: 'include',
        method: 'DELETE',
      });

      if (response.ok) {
        setLayouts(layouts.filter(l => l.id !== id));
        if (currentLayoutId === id) {
          onSelectLayout(null);
        }
      }
    } catch (error) {
      console.error('Failed to delete layout:', error);
    }
  };

  const toggleDefault = async (id: string) => {
    try {
      const layout = layouts.find(l => l.id === id);
      if (!layout) return;

      const response = await fetch(`/api/smartoffice/dashboards/${id}`, {
        credentials: 'include',
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDefault: !layout.isDefault }),
      });

      if (response.ok) {
        setLayouts(layouts.map(l => ({
          ...l,
          isDefault: l.id === id ? !layout.isDefault : layout.isDefault ? false : l.isDefault,
        })));
      }
    } catch (error) {
      console.error('Failed to update layout:', error);
    }
  };

  const currentLayout = layouts.find(l => l.id === currentLayoutId);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
      >
        <Layout className="w-4 h-4" />
        {currentLayout ? currentLayout.name : 'Default Layout'}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-96 overflow-y-auto">
            <div className="p-3 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900 text-sm">Your Layouts</h3>
            </div>

            <div className="divide-y divide-gray-200">
              {/* Default layout option */}
              <button
                onClick={() => {
                  onSelectLayout(null);
                  setIsOpen(false);
                }}
                className="w-full p-3 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm text-gray-900">Default Layout</div>
                    <div className="text-xs text-gray-500">Standard dashboard view</div>
                  </div>
                  {!currentLayoutId && (
                    <Check className="w-4 h-4 text-blue-600" />
                  )}
                </div>
              </button>

              {layouts.map(layout => (
                <div
                  key={layout.id}
                  className="p-3 hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <button
                      onClick={() => {
                        onSelectLayout(layout.id);
                        setIsOpen(false);
                      }}
                      className="flex-1 text-left"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm text-gray-900">{layout.name}</span>
                        {layout.isDefault && (
                          <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                        )}
                        {currentLayoutId === layout.id && (
                          <Check className="w-4 h-4 text-blue-600" />
                        )}
                      </div>
                      {layout.description && (
                        <div className="text-xs text-gray-500">{layout.description}</div>
                      )}
                    </button>

                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => toggleDefault(layout.id)}
                        className="p-1 text-gray-400 hover:text-yellow-500 transition-colors"
                        title={layout.isDefault ? 'Remove default' : 'Set as default'}
                      >
                        <Star
                          className={`w-4 h-4 ${
                            layout.isDefault ? 'fill-yellow-500 text-yellow-500' : ''
                          }`}
                        />
                      </button>
                      <button
                        onClick={() => deleteLayout(layout.id)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 border-t border-gray-200">
              <button
                onClick={() => {
                  onCreateNew();
                  setIsOpen(false);
                }}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Create New Layout
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

'use client';

import { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import DashboardBuilder from '@/components/smartoffice/dashboard/DashboardBuilder';
import LayoutSelector from '@/components/smartoffice/dashboard/LayoutSelector';

function CustomDashboardContent() {
  const router = useRouter();
  const [currentLayoutId, setCurrentLayoutId] = useState<string | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [layoutName, setLayoutName] = useState('');
  const [layoutDescription, setLayoutDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSaveLayout = async (layout: any[]) => {
    setShowSaveDialog(true);
  };

  const handleConfirmSave = async () => {
    if (!layoutName.trim()) {
      alert('Please enter a layout name');
      return;
    }

    try {
      setSaving(true);
      const response = await fetch('/api/smartoffice/dashboards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: layoutName.trim(),
          description: layoutDescription.trim() || null,
          layout: [], // Will be updated by DashboardBuilder
          isDefault: false,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save layout');
      }

      const result = await response.json();
      setCurrentLayoutId(result.data.id);
      setShowSaveDialog(false);
      setLayoutName('');
      setLayoutDescription('');
    } catch (error) {
      console.error('Failed to save layout:', error);
      alert('Failed to save layout');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Custom Dashboard</h1>
            <p className="text-sm text-gray-600 mt-1">
              Build your personalized workspace with drag-and-drop widgets
            </p>
          </div>
          <div className="flex items-center gap-4">
            <LayoutSelector
              currentLayoutId={currentLayoutId}
              onSelectLayout={setCurrentLayoutId}
              onCreateNew={() => setShowSaveDialog(true)}
            />
            <button
              onClick={() => router.push('/smartoffice')}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Dashboard Builder */}
      <DashboardBuilder
        layoutId={currentLayoutId || undefined}
        onSave={handleSaveLayout}
      />

      {/* Save Layout Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Save Layout</h3>

            <div className="space-y-4 mb-6">
              <div>
                <label htmlFor="layout-name" className="block text-sm font-medium text-gray-700 mb-1">
                  Layout Name *
                </label>
                <input
                  type="text"
                  id="layout-name"
                  value={layoutName}
                  onChange={(e) => setLayoutName(e.target.value)}
                  placeholder="e.g., My Day, Month End View"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={saving}
                />
              </div>

              <div>
                <label htmlFor="layout-description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description (optional)
                </label>
                <textarea
                  id="layout-description"
                  value={layoutDescription}
                  onChange={(e) => setLayoutDescription(e.target.value)}
                  placeholder="Brief description of this layout..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={saving}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowSaveDialog(false);
                  setLayoutName('');
                  setLayoutDescription('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSave}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Layout'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CustomDashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    }>
      <CustomDashboardContent />
    </Suspense>
  );
}

'use client';

import { useState, useEffect } from 'react';
import GridLayout from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import { Plus, Save, Trash2 } from 'lucide-react';
import {
  StatsWidget,
  MiniChartWidget,
  RecentActivityWidget,
  PendingListWidget,
  CommissionWidget,
  TopAgentsWidget,
  CarrierStatusWidget,
  QuickFiltersWidget,
} from './widgets';

interface LayoutItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  type: string;
  config?: any;
}

interface DashboardBuilderProps {
  layoutId?: string;
  onSave?: (layout: LayoutItem[]) => void;
}

const WIDGET_TYPES = [
  { type: 'stats', label: 'Stats Card', defaultConfig: { metric: 'total-policies' } },
  { type: 'mini-chart', label: 'Mini Chart', defaultConfig: { months: 6 } },
  { type: 'recent-activity', label: 'Recent Activity', defaultConfig: {} },
  { type: 'pending-list', label: 'Pending List', defaultConfig: { daysThreshold: 7, limit: 10 } },
  { type: 'commission', label: 'Commission Tracker', defaultConfig: { goal: 100000 } },
  { type: 'top-agents', label: 'Top Agents', defaultConfig: { limit: 5, metric: 'premium' } },
  { type: 'carrier-status', label: 'Carrier Status', defaultConfig: {} },
  { type: 'quick-filters', label: 'Quick Filters', defaultConfig: {} },
];

export default function DashboardBuilder({ layoutId, onSave }: DashboardBuilderProps) {
  const [layout, setLayout] = useState<LayoutItem[]>([]);
  const [showWidgetPicker, setShowWidgetPicker] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (layoutId) {
      loadLayout(layoutId);
    } else {
      // Default layout
      setLayout([
        { i: 'widget-1', x: 0, y: 0, w: 3, h: 2, type: 'stats', config: { metric: 'total-policies' } },
        { i: 'widget-2', x: 3, y: 0, w: 3, h: 2, type: 'stats', config: { metric: 'total-premium' } },
        { i: 'widget-3', x: 6, y: 0, w: 3, h: 2, type: 'pending-list' },
        { i: 'widget-4', x: 9, y: 0, w: 3, h: 2, type: 'quick-filters' },
      ]);
    }
  }, [layoutId]);

  const loadLayout = async (id: string) => {
    try {
      const response = await fetch(`/api/smartoffice/dashboards/${id}`, { credentials: 'include' });
      const result = await response.json();
      if (result.success && result.data.layout) {
        setLayout(result.data.layout);
      }
    } catch (error) {
      console.error('Failed to load layout:', error);
    }
  };

  const addWidget = (widgetType: any) => {
    const newWidget: LayoutItem = {
      i: `widget-${Date.now()}`,
      x: 0,
      y: Infinity, // Places at bottom
      w: 3,
      h: 2,
      type: widgetType.type,
      config: widgetType.defaultConfig,
    };
    setLayout([...layout, newWidget]);
    setShowWidgetPicker(false);
  };

  const removeWidget = (id: string) => {
    setLayout(layout.filter(item => item.i !== id));
  };

  const handleLayoutChange = (newLayout: any[]) => {
    if (!isEditing) return;

    const updatedLayout = layout.map(item => {
      const gridItem = newLayout.find(l => l.i === item.i);
      return gridItem ? { ...item, x: gridItem.x, y: gridItem.y, w: gridItem.w, h: gridItem.h } : item;
    });
    setLayout(updatedLayout);
  };

  const handleSave = () => {
    if (onSave) {
      onSave(layout);
    }
    setIsEditing(false);
  };

  const renderWidget = (item: LayoutItem) => {
    const commonProps = {
      id: item.i,
      config: item.config,
      onRemove: isEditing ? removeWidget : undefined,
    };

    switch (item.type) {
      case 'stats':
        return <StatsWidget {...commonProps} />;
      case 'mini-chart':
        return <MiniChartWidget {...commonProps} />;
      case 'recent-activity':
        return <RecentActivityWidget {...commonProps} />;
      case 'pending-list':
        return <PendingListWidget {...commonProps} />;
      case 'commission':
        return <CommissionWidget {...commonProps} />;
      case 'top-agents':
        return <TopAgentsWidget {...commonProps} />;
      case 'carrier-status':
        return <CarrierStatusWidget {...commonProps} />;
      case 'quick-filters':
        return <QuickFiltersWidget {...commonProps} />;
      default:
        return <div>Unknown widget type</div>;
    }
  };

  return (
    <div className="relative">
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between sticky top-0 z-10">
        <h2 className="text-lg font-semibold text-gray-900">Custom Dashboard</h2>
        <div className="flex gap-2">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Edit Layout
            </button>
          ) : (
            <>
              <button
                onClick={() => setShowWidgetPicker(true)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Widget
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>

      {/* Grid */}
      <div className="p-4">
        <GridLayout
          className="layout"
          layout={layout.map(item => ({ i: item.i, x: item.x, y: item.y, w: item.w, h: item.h }))}
          cols={12}
          rowHeight={100}
          width={1200}
          isDraggable={isEditing}
          isResizable={isEditing}
          onLayoutChange={handleLayoutChange}
          draggableHandle=".widget-drag-handle"
        >
          {layout.map(item => (
            <div key={item.i} className={isEditing ? 'cursor-move' : ''}>
              <div className={isEditing ? 'widget-drag-handle' : ''}>
                {renderWidget(item)}
              </div>
            </div>
          ))}
        </GridLayout>

        {layout.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <p className="text-gray-500 mb-4">No widgets added yet</p>
            <button
              onClick={() => setShowWidgetPicker(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Your First Widget
            </button>
          </div>
        )}
      </div>

      {/* Widget Picker Modal */}
      {showWidgetPicker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Widget</h3>
            <div className="grid grid-cols-2 gap-4 mb-6">
              {WIDGET_TYPES.map(widgetType => (
                <button
                  key={widgetType.type}
                  onClick={() => addWidget(widgetType)}
                  className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
                >
                  <div className="font-medium text-gray-900">{widgetType.label}</div>
                  <div className="text-sm text-gray-600 mt-1">
                    {widgetType.type === 'stats' && 'Display key metrics'}
                    {widgetType.type === 'mini-chart' && 'Show premium trends'}
                    {widgetType.type === 'recent-activity' && 'Recent sync activity'}
                    {widgetType.type === 'pending-list' && 'Policies pending action'}
                    {widgetType.type === 'commission' && 'Track commission goals'}
                    {widgetType.type === 'top-agents' && 'Top performing agents'}
                    {widgetType.type === 'carrier-status' && 'Carrier performance'}
                    {widgetType.type === 'quick-filters' && 'One-click filters'}
                  </div>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowWidgetPicker(false)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

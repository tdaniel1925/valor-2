'use client';

import { ReactNode, useState, useRef, useEffect } from 'react';
import { X, Settings, Pencil, Check } from 'lucide-react';

interface WidgetProps {
  id: string;
  title: string;
  children: ReactNode;
  onRemove?: (id: string) => void;
  onConfigure?: (id: string) => void;
  onTitleChange?: (id: string, newTitle: string) => void;
  loading?: boolean;
  error?: string | null;
}

export default function Widget({
  id,
  title,
  children,
  onRemove,
  onConfigure,
  onTitleChange,
  loading,
  error,
}: WidgetProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    if (editedTitle.trim() && editedTitle !== title && onTitleChange) {
      onTitleChange(id, editedTitle.trim());
    } else {
      setEditedTitle(title); // Reset if empty or unchanged
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditedTitle(title);
      setIsEditing(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        {isEditing ? (
          <div className="flex items-center gap-2 flex-1">
            <input
              ref={inputRef}
              type="text"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleSave}
              className="flex-1 px-2 py-1 text-sm font-semibold border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={50}
            />
            <button
              onClick={handleSave}
              className="p-1 text-green-600 hover:text-green-700 transition-colors"
              title="Save title"
            >
              <Check className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-1 group">
            <h3 className="font-semibold text-gray-900">{title}</h3>
            {onTitleChange && (
              <button
                onClick={() => setIsEditing(true)}
                className="p-1 text-gray-400 hover:text-blue-600 transition-colors opacity-0 group-hover:opacity-100"
                title="Edit title"
              >
                <Pencil className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
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

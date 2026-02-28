'use client';

import { LucideIcon } from 'lucide-react';

interface QuickActionCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  onClick?: () => void;
  subtitle?: string;
  colorClass?: string;
  isClickable?: boolean;
}

export default function QuickActionCard({
  title,
  value,
  icon: Icon,
  onClick,
  subtitle,
  colorClass = 'text-blue-600',
  isClickable = true,
}: QuickActionCardProps) {
  const baseClasses = 'bg-white rounded-lg shadow-md p-6 transition-all';
  const interactiveClasses = isClickable
    ? 'hover:shadow-lg hover:scale-[1.02] cursor-pointer active:scale-[0.98]'
    : '';

  return (
    <div
      className={`${baseClasses} ${interactiveClasses}`}
      onClick={isClickable ? onClick : undefined}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={(e) => {
        if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        <Icon className={`w-5 h-5 ${colorClass}`} />
      </div>

      <p className="text-3xl font-bold text-gray-900 mb-1">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>

      {subtitle && (
        <p className="text-xs text-gray-500">{subtitle}</p>
      )}

      {isClickable && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <span className="text-xs font-medium text-blue-600 flex items-center gap-1">
            Click to filter
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </span>
        </div>
      )}
    </div>
  );
}

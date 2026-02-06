'use client';

import { cn } from '@/lib/utils';

interface Column<T = any> {
  key: string;
  label: string;
  render?: (value: any, row: T) => React.ReactNode;
  className?: string;
}

interface ResponsiveTableProps<T = any> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  className?: string;
}

export function ResponsiveTable<T extends Record<string, any>>({
  columns,
  data,
  onRowClick,
  className,
}: ResponsiveTableProps<T>) {
  return (
    <>
      {/* Desktop table view */}
      <div className={cn("hidden md:block overflow-x-auto", className)}>
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={cn(
                    "px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider",
                    column.className
                  )}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400"
                >
                  No data available
                </td>
              </tr>
            ) : (
              data.map((row, idx) => (
                <tr
                  key={idx}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    "hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors",
                    onRowClick && "cursor-pointer"
                  )}
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100"
                    >
                      {column.render
                        ? column.render(row[column.key], row)
                        : row[column.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile card view */}
      <div className={cn("block md:hidden space-y-4", className)}>
        {data.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 border border-gray-200 dark:border-gray-700 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">No data available</p>
          </div>
        ) : (
          data.map((row, idx) => (
            <div
              key={idx}
              onClick={() => onRowClick?.(row)}
              className={cn(
                "bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm",
                onRowClick && "cursor-pointer active:scale-98 transition-transform"
              )}
            >
              {columns.map((column) => (
                <div
                  key={column.key}
                  className="flex justify-between items-start py-2 border-b border-gray-100 dark:border-gray-700 last:border-0"
                >
                  <span className="font-medium text-gray-600 dark:text-gray-400 text-sm mr-4">
                    {column.label}
                  </span>
                  <span className="text-gray-900 dark:text-gray-100 text-sm text-right flex-1">
                    {column.render
                      ? column.render(row[column.key], row)
                      : row[column.key]}
                  </span>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </>
  );
}

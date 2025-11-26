/**
 * ChartPanel Component
 *
 * Wrapper for Recharts with consistent styling.
 * Provides title, description, and loading states.
 */

import { ReactNode } from 'react';
import { LucideIcon, Info } from 'lucide-react';

interface ChartPanelProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
  isEmpty?: boolean;
  emptyMessage?: string;
}

export function ChartPanel({
  title,
  description,
  icon: Icon,
  children,
  className = '',
  action,
  isEmpty = false,
  emptyMessage = 'No data available',
}: ChartPanelProps) {
  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="p-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <Icon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </div>
            )}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                {title}
              </h3>
              {description && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {description}
                </p>
              )}
            </div>
          </div>
          {action}
        </div>
      </div>

      {/* Chart content */}
      <div className="p-4">
        {isEmpty ? (
          <div className="h-48 flex items-center justify-center">
            <div className="text-center">
              <Info className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {emptyMessage}
              </p>
            </div>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

// Simple horizontal bar for inline distributions
interface MiniBarProps {
  value: number;
  max: number;
  color?: string;
  showLabel?: boolean;
}

export function MiniBar({
  value,
  max,
  color = 'bg-primary-500',
  showLabel = true,
}: MiniBarProps) {
  const percentage = max > 0 ? (value / max) * 100 : 0;

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums w-12 text-right">
          {percentage.toFixed(1)}%
        </span>
      )}
    </div>
  );
}

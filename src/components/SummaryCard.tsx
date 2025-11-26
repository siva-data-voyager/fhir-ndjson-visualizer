/**
 * SummaryCard Component
 *
 * Displays a single KPI/metric in a card format.
 * Supports icons, trends, and secondary text.
 */

import { ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus, LucideIcon } from 'lucide-react';

interface SummaryCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    value: string;
  };
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  className?: string;
  children?: ReactNode;
}

const variantStyles = {
  default: {
    iconBg: 'bg-gray-100 dark:bg-gray-700',
    iconColor: 'text-gray-600 dark:text-gray-400',
    valueColor: 'text-gray-900 dark:text-white',
  },
  primary: {
    iconBg: 'bg-primary-100 dark:bg-primary-900/50',
    iconColor: 'text-primary-600 dark:text-primary-400',
    valueColor: 'text-primary-700 dark:text-primary-300',
  },
  success: {
    iconBg: 'bg-green-100 dark:bg-green-900/50',
    iconColor: 'text-green-600 dark:text-green-400',
    valueColor: 'text-green-700 dark:text-green-300',
  },
  warning: {
    iconBg: 'bg-amber-100 dark:bg-amber-900/50',
    iconColor: 'text-amber-600 dark:text-amber-400',
    valueColor: 'text-amber-700 dark:text-amber-300',
  },
  danger: {
    iconBg: 'bg-red-100 dark:bg-red-900/50',
    iconColor: 'text-red-600 dark:text-red-400',
    valueColor: 'text-red-700 dark:text-red-300',
  },
};

export function SummaryCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = 'default',
  className = '',
  children,
}: SummaryCardProps) {
  const styles = variantStyles[variant];

  const TrendIcon =
    trend?.direction === 'up'
      ? TrendingUp
      : trend?.direction === 'down'
        ? TrendingDown
        : Minus;

  const trendColor =
    trend?.direction === 'up'
      ? 'text-green-600 dark:text-green-400'
      : trend?.direction === 'down'
        ? 'text-red-600 dark:text-red-400'
        : 'text-gray-500 dark:text-gray-400';

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 ${className}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
            {title}
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <p
              className={`text-2xl font-bold ${styles.valueColor} tabular-nums`}
            >
              {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
            {trend && (
              <span className={`flex items-center gap-0.5 text-sm ${trendColor}`}>
                <TrendIcon className="w-3.5 h-3.5" />
                <span>{trend.value}</span>
              </span>
            )}
          </div>
          {subtitle && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {subtitle}
            </p>
          )}
        </div>

        {Icon && (
          <div className={`p-2.5 rounded-lg ${styles.iconBg}`}>
            <Icon className={`w-5 h-5 ${styles.iconColor}`} />
          </div>
        )}
      </div>

      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}

// Compact variant for grid layouts
interface CompactCardProps {
  label: string;
  value: string | number;
  color?: 'gray' | 'blue' | 'green' | 'amber' | 'red';
}

export function CompactCard({
  label,
  value,
  color = 'gray',
}: CompactCardProps) {
  const colorStyles = {
    gray: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
    blue: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
    green:
      'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300',
    amber:
      'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
    red: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300',
  };

  return (
    <div className={`px-3 py-2 rounded-lg ${colorStyles[color]}`}>
      <p className="text-xs font-medium opacity-70">{label}</p>
      <p className="text-lg font-semibold tabular-nums">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
    </div>
  );
}

/**
 * PatientDashboard Component
 *
 * Displays analytics and visualizations specific to Patient resources.
 * Includes demographics, age distribution, geographic, and data quality.
 */

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  Users,
  Calendar,
  MapPin,
  Activity,
  Heart,
  AlertTriangle,
  UserCheck,
  Globe,
} from 'lucide-react';
import { FhirPatient } from '../types/fhir';
import { PatientAnalytics } from '../types/analytics';
import { analyzePatients } from '../utils/patientAnalytics';
import { SummaryCard, CompactCard } from './SummaryCard';
import { ChartPanel, MiniBar } from './ChartPanel';

interface PatientDashboardProps {
  patients: FhirPatient[];
}

// Color palettes for charts
const GENDER_COLORS: Record<string, string> = {
  female: '#ec4899',
  male: '#3b82f6',
  other: '#a855f7',
  unknown: '#6b7280',
};

const CHART_COLORS = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#06b6d4',
  '#f97316',
  '#84cc16',
  '#ec4899',
  '#6366f1',
];

export function PatientDashboard({ patients }: PatientDashboardProps) {
  // Memoize analytics computation
  const analytics: PatientAnalytics = useMemo(
    () => analyzePatients(patients),
    [patients]
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Summary Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard
          title="Total Patients"
          value={analytics.totalPatients}
          icon={Users}
          variant="primary"
          subtitle={`${analytics.uniqueIds} unique IDs`}
        />
        <SummaryCard
          title="Median Age"
          value={`${analytics.ageStats.median} years`}
          icon={Calendar}
          subtitle={`Range: ${analytics.ageStats.min}-${analytics.ageStats.max}`}
        />
        <SummaryCard
          title="Living Patients"
          value={analytics.livingCount}
          icon={Heart}
          variant="success"
          subtitle={`${analytics.mortalityRate.toFixed(1)}% mortality`}
        />
        <SummaryCard
          title="States Represented"
          value={analytics.stateDistribution.length}
          icon={MapPin}
          subtitle={
            analytics.stateDistribution[0]?.label
              ? `Top: ${analytics.stateDistribution[0].label}`
              : 'N/A'
          }
        />
      </div>

      {/* Date Range Info */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <span className="text-gray-500 dark:text-gray-400">
            Birth Date Coverage:
          </span>
          <span className="font-medium text-gray-900 dark:text-white">
            {analytics.birthDateRange.minFormatted} —{' '}
            {analytics.birthDateRange.maxFormatted}
          </span>
          <span className="text-gray-400 dark:text-gray-500">|</span>
          <span className="text-gray-500 dark:text-gray-400">
            Mean Age: <strong>{analytics.ageStats.mean}</strong> ±{' '}
            {analytics.ageStats.stdDev} years
          </span>
        </div>
      </div>

      {/* Charts Row 1: Age + Gender */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Age Distribution */}
        <ChartPanel
          title="Age Distribution"
          description="Patients grouped by age range"
          icon={Calendar}
        >
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={analytics.ageDistribution}
              margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--tooltip-bg, #fff)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                }}
                formatter={(value: number) => [value.toLocaleString(), 'Patients']}
              />
              <Bar
                dataKey="count"
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
                maxBarSize={50}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>

        {/* Gender Distribution */}
        <ChartPanel
          title="Gender Distribution"
          description="Administrative gender breakdown"
          icon={Users}
        >
          <div className="flex items-center gap-6">
            <div className="w-1/2">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={analytics.genderDistribution}
                    dataKey="count"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                  >
                    {analytics.genderDistribution.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          GENDER_COLORS[entry.label.toLowerCase()] ||
                          CHART_COLORS[index % CHART_COLORS.length]
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      `${value.toLocaleString()} (${((value / analytics.totalPatients) * 100).toFixed(1)}%)`,
                      name,
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-1/2 space-y-3">
              {analytics.genderDistribution.map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{
                      backgroundColor:
                        GENDER_COLORS[item.label.toLowerCase()] || '#6b7280',
                    }}
                  />
                  <span className="flex-1 text-sm capitalize text-gray-700 dark:text-gray-300">
                    {item.label}
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white tabular-nums">
                    {item.count.toLocaleString()}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 w-12 text-right tabular-nums">
                    {item.percentage.toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </ChartPanel>
      </div>

      {/* Charts Row 2: Race + Ethnicity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Race Distribution */}
        <ChartPanel
          title="Race Distribution"
          description="US Core race categories"
          icon={Globe}
          isEmpty={analytics.raceDistribution.length === 0}
          emptyMessage="No race data available in extensions"
        >
          <div className="space-y-3 max-h-72 overflow-y-auto scrollbar-thin">
            {analytics.raceDistribution.map((item, idx) => (
              <div key={item.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-700 dark:text-gray-300 truncate pr-2">
                    {item.label}
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white tabular-nums">
                    {item.count.toLocaleString()}
                  </span>
                </div>
                <MiniBar
                  value={item.count}
                  max={analytics.raceDistribution[0]?.count || 1}
                  color={`bg-${['blue', 'green', 'purple', 'amber', 'rose'][idx % 5]}-500`}
                />
              </div>
            ))}
          </div>
        </ChartPanel>

        {/* Ethnicity Distribution */}
        <ChartPanel
          title="Ethnicity Distribution"
          description="US Core ethnicity categories"
          icon={UserCheck}
          isEmpty={analytics.ethnicityDistribution.length === 0}
          emptyMessage="No ethnicity data available"
        >
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={analytics.ethnicityDistribution}
                dataKey="count"
                nameKey="label"
                cx="50%"
                cy="50%"
                outerRadius={70}
                label={({ name, percent }) =>
                  `${name} (${(percent * 100).toFixed(0)}%)`
                }
                labelLine={false}
              >
                {analytics.ethnicityDistribution.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                  />
                ))}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartPanel>
      </div>

      {/* Geographic Distribution */}
      {analytics.stateDistribution.length > 0 && (
        <ChartPanel
          title="Geographic Distribution"
          description="Patients by state (top 15)"
          icon={MapPin}
        >
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={analytics.stateDistribution.slice(0, 15)}
              layout="vertical"
              margin={{ top: 5, right: 20, left: 40, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis
                type="category"
                dataKey="label"
                tick={{ fontSize: 11 }}
                width={35}
              />
              <Tooltip
                formatter={(value: number) => [value.toLocaleString(), 'Patients']}
              />
              <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>
      )}

      {/* Data Quality Section */}
      <ChartPanel
        title="Data Quality Metrics"
        description="Missing or incomplete fields"
        icon={AlertTriangle}
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <CompactCard
            label="Missing Birth Date"
            value={analytics.missingBirthDate}
            color={analytics.missingBirthDate > 0 ? 'amber' : 'green'}
          />
          <CompactCard
            label="Missing Gender"
            value={analytics.missingGender}
            color={analytics.missingGender > 0 ? 'amber' : 'green'}
          />
          <CompactCard
            label="Missing Address"
            value={analytics.missingAddress}
            color={analytics.missingAddress > 0 ? 'amber' : 'green'}
          />
          <CompactCard
            label="Deceased"
            value={analytics.deceasedCount}
            color="gray"
          />
        </div>
      </ChartPanel>

      {/* Age Statistics Summary */}
      <div className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <Activity className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          <h3 className="text-sm font-semibold text-primary-900 dark:text-primary-100">
            Age Statistics Summary
          </h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary-700 dark:text-primary-300">
              {analytics.ageStats.min}
            </p>
            <p className="text-xs text-primary-600 dark:text-primary-400">
              Minimum
            </p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-primary-700 dark:text-primary-300">
              {analytics.ageStats.mean}
            </p>
            <p className="text-xs text-primary-600 dark:text-primary-400">
              Mean
            </p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-primary-700 dark:text-primary-300">
              {analytics.ageStats.median}
            </p>
            <p className="text-xs text-primary-600 dark:text-primary-400">
              Median
            </p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-primary-700 dark:text-primary-300">
              {analytics.ageStats.max}
            </p>
            <p className="text-xs text-primary-600 dark:text-primary-400">
              Maximum
            </p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-primary-700 dark:text-primary-300">
              ±{analytics.ageStats.stdDev}
            </p>
            <p className="text-xs text-primary-600 dark:text-primary-400">
              Std Dev
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * EncounterDashboard Component
 *
 * Displays analytics and visualizations specific to Encounter resources.
 * Includes class/type distributions, time series, LOS analysis.
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
  AreaChart,
  Area,
} from 'recharts';
import {
  Stethoscope,
  Clock,
  Users,
  Activity,
  AlertTriangle,
  TrendingUp,
  Timer,
} from 'lucide-react';
import { FhirEncounter } from '../types/fhir';
import { EncounterAnalytics } from '../types/analytics';
import { analyzeEncounters } from '../utils/encounterAnalytics';
import { SummaryCard, CompactCard } from './SummaryCard';
import { ChartPanel, MiniBar } from './ChartPanel';

interface EncounterDashboardProps {
  encounters: FhirEncounter[];
}

// Color palette for encounter classes
const CLASS_COLORS: Record<string, string> = {
  Ambulatory: '#3b82f6',
  Emergency: '#ef4444',
  Inpatient: '#8b5cf6',
  Outpatient: '#10b981',
  'Urgent Care': '#f59e0b',
  Wellness: '#06b6d4',
  Virtual: '#ec4899',
  'Home Health': '#84cc16',
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

export function EncounterDashboard({ encounters }: EncounterDashboardProps) {
  // Memoize analytics computation
  const analytics: EncounterAnalytics = useMemo(
    () => analyzeEncounters(encounters),
    [encounters]
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Summary Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard
          title="Total Encounters"
          value={analytics.totalEncounters}
          icon={Stethoscope}
          variant="primary"
          subtitle={`${analytics.uniqueEncounterIds} unique IDs`}
        />
        <SummaryCard
          title="Unique Patients"
          value={analytics.uniquePatientRefs}
          icon={Users}
          subtitle={`Avg ${analytics.encountersPerPatientStats.mean.toFixed(1)} encounters/patient`}
        />
        <SummaryCard
          title="Mean LOS"
          value={`${analytics.losStats.mean.toFixed(1)} days`}
          icon={Timer}
          subtitle={`Median: ${analytics.losStats.median.toFixed(1)} days`}
        />
        <SummaryCard
          title="Encounter Types"
          value={analytics.typeDistribution.length}
          icon={Activity}
          subtitle={
            analytics.classDistribution[0]?.label
              ? `Top class: ${analytics.classDistribution[0].label}`
              : 'N/A'
          }
        />
      </div>

      {/* Date Range Info */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <span className="text-gray-500 dark:text-gray-400">
            Period Coverage:
          </span>
          <span className="font-medium text-gray-900 dark:text-white">
            {analytics.periodCoverage.minFormatted} —{' '}
            {analytics.periodCoverage.maxFormatted}
          </span>
          <span className="text-gray-400 dark:text-gray-500">|</span>
          <span className="text-gray-500 dark:text-gray-400">
            Encounters with LOS data:{' '}
            <strong>{analytics.losStats.encountersWithLos.toLocaleString()}</strong>
          </span>
        </div>
      </div>

      {/* Encounters Over Time */}
      {analytics.encountersByMonth.length > 0 && (
        <ChartPanel
          title="Encounters Over Time"
          description="Monthly encounter volume"
          icon={TrendingUp}
        >
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart
              data={analytics.encountersByMonth}
              margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorEncounters" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--tooltip-bg, #fff)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
                formatter={(value: number) => [value.toLocaleString(), 'Encounters']}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#3b82f6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorEncounters)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartPanel>
      )}

      {/* Charts Row: Class + Type */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Class Distribution */}
        <ChartPanel
          title="Encounter Class Distribution"
          description="AMB, EMER, IMP, etc."
          icon={Stethoscope}
        >
          <div className="flex items-center gap-6">
            <div className="w-1/2">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={analytics.classDistribution}
                    dataKey="count"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={2}
                  >
                    {analytics.classDistribution.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          CLASS_COLORS[entry.label] ||
                          CHART_COLORS[index % CHART_COLORS.length]
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      `${value.toLocaleString()} (${((value / analytics.totalEncounters) * 100).toFixed(1)}%)`,
                      name,
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-1/2 space-y-2">
              {analytics.classDistribution.slice(0, 6).map((item, idx) => (
                <div key={item.label} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor:
                        CLASS_COLORS[item.label] ||
                        CHART_COLORS[idx % CHART_COLORS.length],
                    }}
                  />
                  <span className="flex-1 text-sm text-gray-700 dark:text-gray-300 truncate">
                    {item.label}
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white tabular-nums">
                    {item.count.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </ChartPanel>

        {/* Type Distribution (Top Types) */}
        <ChartPanel
          title="Encounter Types"
          description="Top encounter types by frequency"
          icon={Activity}
          isEmpty={analytics.typeDistribution.length === 0}
        >
          <div className="space-y-3 max-h-60 overflow-y-auto scrollbar-thin">
            {analytics.typeDistribution.slice(0, 10).map((item, idx) => (
              <div key={item.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-700 dark:text-gray-300 truncate pr-2 max-w-[200px]">
                    {item.label}
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white tabular-nums">
                    {item.count.toLocaleString()}
                  </span>
                </div>
                <MiniBar
                  value={item.count}
                  max={analytics.typeDistribution[0]?.count || 1}
                  color={`bg-${['blue', 'green', 'purple', 'amber', 'rose'][idx % 5]}-500`}
                />
              </div>
            ))}
          </div>
        </ChartPanel>
      </div>

      {/* Charts Row: LOS + Encounters per Patient */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Length of Stay Distribution */}
        <ChartPanel
          title="Length of Stay Distribution"
          description="Duration buckets for encounters with complete period data"
          icon={Clock}
          isEmpty={analytics.losDistribution.length === 0}
          emptyMessage="No encounters with complete period (start/end) data"
        >
          <ResponsiveContainer width="100%" height={250}>
            <BarChart
              data={analytics.losDistribution}
              margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                angle={-20}
                textAnchor="end"
                height={60}
              />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip
                formatter={(value: number) => [value.toLocaleString(), 'Encounters']}
              />
              <Bar
                dataKey="count"
                fill="#8b5cf6"
                radius={[4, 4, 0, 0]}
                maxBarSize={45}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>

        {/* Encounters per Patient */}
        <ChartPanel
          title="Encounters per Patient"
          description="Distribution of encounter counts per patient"
          icon={Users}
          isEmpty={analytics.encountersPerPatient.length === 0}
        >
          <ResponsiveContainer width="100%" height={250}>
            <BarChart
              data={analytics.encountersPerPatient}
              margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip
                formatter={(value: number) => [value.toLocaleString(), 'Patients']}
              />
              <Bar
                dataKey="count"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
                maxBarSize={50}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>
      </div>

      {/* Status Distribution */}
      {analytics.statusDistribution.length > 0 && (
        <ChartPanel
          title="Encounter Status"
          description="Workflow status of encounters"
          icon={Activity}
        >
          <div className="flex flex-wrap gap-3">
            {analytics.statusDistribution.map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
              >
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                  {item.label}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400 tabular-nums">
                  {item.count.toLocaleString()}
                </span>
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  ({item.percentage.toFixed(1)}%)
                </span>
              </div>
            ))}
          </div>
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
            label="Missing Period Start"
            value={analytics.missingPeriodStart}
            color={analytics.missingPeriodStart > 0 ? 'amber' : 'green'}
          />
          <CompactCard
            label="Missing Period End"
            value={analytics.missingPeriodEnd}
            color={analytics.missingPeriodEnd > 0 ? 'amber' : 'green'}
          />
          <CompactCard
            label="Missing Class"
            value={analytics.missingClass}
            color={analytics.missingClass > 0 ? 'amber' : 'green'}
          />
          <CompactCard
            label="Missing Subject"
            value={analytics.missingSubject}
            color={analytics.missingSubject > 0 ? 'red' : 'green'}
          />
        </div>
      </ChartPanel>

      {/* LOS Statistics Summary */}
      {analytics.losStats.encountersWithLos > 0 && (
        <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <Timer className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <h3 className="text-sm font-semibold text-purple-900 dark:text-purple-100">
              Length of Stay Statistics (in days)
            </h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                {analytics.losStats.min.toFixed(1)}
              </p>
              <p className="text-xs text-purple-600 dark:text-purple-400">
                Minimum
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                {analytics.losStats.mean.toFixed(1)}
              </p>
              <p className="text-xs text-purple-600 dark:text-purple-400">
                Mean
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                {analytics.losStats.median.toFixed(1)}
              </p>
              <p className="text-xs text-purple-600 dark:text-purple-400">
                Median
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                {analytics.losStats.max.toFixed(1)}
              </p>
              <p className="text-xs text-purple-600 dark:text-purple-400">
                Maximum
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

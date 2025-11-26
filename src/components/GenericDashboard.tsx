/**
 * GenericDashboard Component
 *
 * Fallback dashboard for unsupported resource types.
 * Shows basic resource info and generic field analysis.
 */

import { useMemo } from 'react';
import { FileJson, Hash, AlertCircle, Info, Key } from 'lucide-react';
import { FhirResource } from '../types/fhir';
import { SummaryCard } from './SummaryCard';
import { ChartPanel } from './ChartPanel';

interface GenericDashboardProps {
  resources: FhirResource[];
  resourceType: string;
}

interface FieldStats {
  path: string;
  presentCount: number;
  missingCount: number;
  uniqueValues: number;
  sampleValues: string[];
}

function analyzeFields(resources: FhirResource[]): FieldStats[] {
  const fieldMap = new Map<string, {
    present: number;
    values: Set<string>;
    samples: string[];
  }>();

  // Analyze first 1000 resources for performance
  const sample = resources.slice(0, 1000);

  for (const resource of sample) {
    // Get top-level keys
    for (const [key, value] of Object.entries(resource)) {
      if (key === 'resourceType') continue;

      if (!fieldMap.has(key)) {
        fieldMap.set(key, { present: 0, values: new Set(), samples: [] });
      }

      const stats = fieldMap.get(key)!;
      if (value !== null && value !== undefined) {
        stats.present++;

        // Track unique values for simple types
        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
          const strVal = String(value);
          stats.values.add(strVal);
          if (stats.samples.length < 3 && !stats.samples.includes(strVal)) {
            stats.samples.push(strVal.length > 50 ? strVal.substring(0, 50) + '...' : strVal);
          }
        } else if (Array.isArray(value)) {
          stats.values.add(`[Array: ${value.length} items]`);
        } else if (typeof value === 'object') {
          stats.values.add('[Object]');
        }
      }
    }
  }

  return Array.from(fieldMap.entries())
    .map(([path, stats]) => ({
      path,
      presentCount: stats.present,
      missingCount: sample.length - stats.present,
      uniqueValues: stats.values.size,
      sampleValues: stats.samples,
    }))
    .sort((a, b) => b.presentCount - a.presentCount);
}

export function GenericDashboard({
  resources,
  resourceType,
}: GenericDashboardProps) {
  const fieldStats = useMemo(() => analyzeFields(resources), [resources]);

  const uniqueIds = useMemo(
    () => new Set(resources.map((r) => r.id).filter(Boolean)).size,
    [resources]
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Info banner */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>{resourceType}</strong> is not a fully supported resource type.
              Below is a generic analysis of the data structure.
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              Fully supported types: Patient, Encounter
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard
          title={`Total ${resourceType}s`}
          value={resources.length}
          icon={FileJson}
          variant="primary"
        />
        <SummaryCard
          title="Unique IDs"
          value={uniqueIds}
          icon={Key}
          subtitle={uniqueIds < resources.length ? 'Some duplicates' : 'All unique'}
        />
        <SummaryCard
          title="Fields Detected"
          value={fieldStats.length}
          icon={Hash}
          subtitle="Top-level fields"
        />
        <SummaryCard
          title="Sample Size"
          value={Math.min(resources.length, 1000)}
          icon={AlertCircle}
          subtitle="Analyzed for field stats"
        />
      </div>

      {/* Field Analysis */}
      <ChartPanel
        title="Field Analysis"
        description="Top-level fields in the resource (based on first 1,000 records)"
        icon={Hash}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Field
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Present
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Missing
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Unique
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Sample Values
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {fieldStats.map((field) => (
                <tr key={field.path} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white font-mono">
                    {field.path}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-gray-700 dark:text-gray-300 tabular-nums">
                    {field.presentCount.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-right tabular-nums">
                    <span
                      className={
                        field.missingCount > 0
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-gray-400 dark:text-gray-500'
                      }
                    >
                      {field.missingCount.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-gray-700 dark:text-gray-300 tabular-nums">
                    {field.uniqueValues.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs font-mono">
                    {field.sampleValues.join(', ') || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartPanel>

      {/* Tip for extending */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
          Extending Support
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          To add full visualization support for <code className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">{resourceType}</code>,
          create a new dashboard component in <code className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">src/components/</code> and
          add analytics utilities in <code className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">src/utils/</code>.
          See <code className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">PatientDashboard.tsx</code> for reference.
        </p>
      </div>
    </div>
  );
}

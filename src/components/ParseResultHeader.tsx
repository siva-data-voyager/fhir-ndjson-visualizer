/**
 * ParseResultHeader Component
 *
 * Displays parse result summary after successful NDJSON parsing.
 * Shows resource type, record count, parse time, and any errors.
 */

import {
  FileJson,
  CheckCircle,
  AlertTriangle,
  Clock,
  ArrowLeft,
  Download,
} from 'lucide-react';
import { ParseResult } from '../types/analytics';
import { FhirResource } from '../types/fhir';

interface ParseResultHeaderProps {
  result: ParseResult<FhirResource>;
  onReset: () => void;
  onExport?: () => void;
}

export function ParseResultHeader({
  result,
  onReset,
  onExport,
}: ParseResultHeaderProps) {
  const hasErrors = result.invalidLines > 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="px-6 py-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Resource info */}
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary-100 dark:bg-primary-900/50 rounded-xl">
              <FileJson className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {result.resourceType}
                </h2>
                <span className="px-2 py-0.5 text-xs font-medium bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 rounded-full">
                  {result.pseudoFileName}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  {result.validLines.toLocaleString()} valid records
                </span>
                {hasErrors && (
                  <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="w-4 h-4" />
                    {result.invalidLines.toLocaleString()} invalid lines
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  Parsed in {result.parseTimeMs.toFixed(0)}ms
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {onExport && (
              <button
                onClick={onExport}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                Export Summary
              </button>
            )}
            <button
              onClick={onReset}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Analyze New Data
            </button>
          </div>
        </div>
      </div>

      {/* Error details (if any) */}
      {hasErrors && result.errors.length > 0 && (
        <div className="px-6 py-3 bg-amber-50 dark:bg-amber-900/20 border-t border-amber-100 dark:border-amber-800">
          <details className="group">
            <summary className="flex items-center gap-2 cursor-pointer text-sm text-amber-700 dark:text-amber-400">
              <AlertTriangle className="w-4 h-4" />
              <span>
                View parse errors ({Math.min(result.errors.length, 50)} shown)
              </span>
            </summary>
            <div className="mt-3 max-h-48 overflow-y-auto scrollbar-thin">
              <ul className="space-y-1 text-xs font-mono">
                {result.errors.slice(0, 50).map((error, idx) => (
                  <li
                    key={idx}
                    className="text-amber-800 dark:text-amber-300 break-all"
                  >
                    {error.lineNumber > 0 && (
                      <span className="text-amber-600 dark:text-amber-500">
                        Line {error.lineNumber}:{' '}
                      </span>
                    )}
                    {error.message}
                    {error.rawLine && (
                      <span className="block text-amber-600/70 dark:text-amber-400/50 truncate mt-0.5">
                        → {error.rawLine}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </details>
        </div>
      )}
    </div>
  );
}

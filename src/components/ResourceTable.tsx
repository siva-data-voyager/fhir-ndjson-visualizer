/**
 * ResourceTable Component
 *
 * Paginated, sortable table for viewing parsed FHIR resources.
 * Supports row expansion to view raw JSON.
 */

import { useState, useMemo, useCallback } from 'react';
import {
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Search,
  Code,
  Copy,
  Check,
  X,
} from 'lucide-react';
import { FhirResource, FhirPatient, FhirEncounter } from '../types/fhir';

interface ResourceTableProps {
  resources: FhirResource[];
  resourceType: string;
}

type SortDirection = 'asc' | 'desc' | null;

interface ColumnDef {
  key: string;
  label: string;
  accessor: (resource: FhirResource) => string | number | null;
  sortable?: boolean;
  width?: string;
}

// Define columns per resource type
const PATIENT_COLUMNS: ColumnDef[] = [
  {
    key: 'id',
    label: 'ID',
    accessor: (r) => r.id || 'N/A',
    sortable: true,
    width: 'w-32',
  },
  {
    key: 'name',
    label: 'Name',
    accessor: (r) => {
      const p = r as FhirPatient;
      if (!p.name || p.name.length === 0) return 'N/A';
      const n = p.name[0];
      return `${n.given?.join(' ') || ''} ${n.family || ''}`.trim() || 'N/A';
    },
    sortable: true,
    width: 'w-40',
  },
  {
    key: 'gender',
    label: 'Gender',
    accessor: (r) => (r as FhirPatient).gender || 'N/A',
    sortable: true,
    width: 'w-24',
  },
  {
    key: 'birthDate',
    label: 'Birth Date',
    accessor: (r) => (r as FhirPatient).birthDate || 'N/A',
    sortable: true,
    width: 'w-28',
  },
  {
    key: 'state',
    label: 'State',
    accessor: (r) => {
      const p = r as FhirPatient;
      return p.address?.[0]?.state || 'N/A';
    },
    sortable: true,
    width: 'w-20',
  },
  {
    key: 'city',
    label: 'City',
    accessor: (r) => {
      const p = r as FhirPatient;
      return p.address?.[0]?.city || 'N/A';
    },
    sortable: true,
    width: 'w-32',
  },
];

const ENCOUNTER_COLUMNS: ColumnDef[] = [
  {
    key: 'id',
    label: 'ID',
    accessor: (r) => r.id || 'N/A',
    sortable: true,
    width: 'w-32',
  },
  {
    key: 'status',
    label: 'Status',
    accessor: (r) => (r as FhirEncounter).status || 'N/A',
    sortable: true,
    width: 'w-24',
  },
  {
    key: 'class',
    label: 'Class',
    accessor: (r) => {
      const e = r as FhirEncounter;
      return e.class?.display || e.class?.code || 'N/A';
    },
    sortable: true,
    width: 'w-28',
  },
  {
    key: 'periodStart',
    label: 'Start',
    accessor: (r) => {
      const e = r as FhirEncounter;
      if (!e.period?.start) return 'N/A';
      try {
        return new Date(e.period.start).toLocaleString();
      } catch {
        return e.period.start;
      }
    },
    sortable: true,
    width: 'w-40',
  },
  {
    key: 'periodEnd',
    label: 'End',
    accessor: (r) => {
      const e = r as FhirEncounter;
      if (!e.period?.end) return 'N/A';
      try {
        return new Date(e.period.end).toLocaleString();
      } catch {
        return e.period.end;
      }
    },
    sortable: true,
    width: 'w-40',
  },
  {
    key: 'subject',
    label: 'Patient Ref',
    accessor: (r) => {
      const e = r as FhirEncounter;
      return e.subject?.reference?.replace('Patient/', '') || 'N/A';
    },
    sortable: true,
    width: 'w-32',
  },
];

const GENERIC_COLUMNS: ColumnDef[] = [
  {
    key: 'id',
    label: 'ID',
    accessor: (r) => r.id || 'N/A',
    sortable: true,
    width: 'w-32',
  },
  {
    key: 'resourceType',
    label: 'Type',
    accessor: (r) => r.resourceType,
    sortable: true,
    width: 'w-28',
  },
];

const PAGE_SIZES = [10, 25, 50, 100];

export function ResourceTable({ resources, resourceType }: ResourceTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Select columns based on resource type
  const columns = useMemo(() => {
    switch (resourceType) {
      case 'Patient':
        return PATIENT_COLUMNS;
      case 'Encounter':
        return ENCOUNTER_COLUMNS;
      default:
        return GENERIC_COLUMNS;
    }
  }, [resourceType]);

  // Filter resources by search term
  const filteredResources = useMemo(() => {
    if (!searchTerm.trim()) return resources;

    const term = searchTerm.toLowerCase();
    return resources.filter((r) => {
      // Search across all column values
      return columns.some((col) => {
        const value = col.accessor(r);
        return value?.toString().toLowerCase().includes(term);
      });
    });
  }, [resources, searchTerm, columns]);

  // Sort resources
  const sortedResources = useMemo(() => {
    if (!sortKey || !sortDir) return filteredResources;

    const column = columns.find((c) => c.key === sortKey);
    if (!column) return filteredResources;

    return [...filteredResources].sort((a, b) => {
      const aVal = column.accessor(a);
      const bVal = column.accessor(b);

      if (aVal === null || aVal === 'N/A') return 1;
      if (bVal === null || bVal === 'N/A') return -1;

      const comparison =
        typeof aVal === 'number' && typeof bVal === 'number'
          ? aVal - bVal
          : String(aVal).localeCompare(String(bVal));

      return sortDir === 'asc' ? comparison : -comparison;
    });
  }, [filteredResources, sortKey, sortDir, columns]);

  // Paginate
  const paginatedResources = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedResources.slice(start, start + pageSize);
  }, [sortedResources, page, pageSize]);

  const totalPages = Math.ceil(sortedResources.length / pageSize);

  // Handle sort
  const handleSort = useCallback(
    (key: string) => {
      if (sortKey === key) {
        if (sortDir === 'asc') setSortDir('desc');
        else if (sortDir === 'desc') {
          setSortKey(null);
          setSortDir(null);
        }
      } else {
        setSortKey(key);
        setSortDir('asc');
      }
      setPage(1);
    },
    [sortKey, sortDir]
  );

  // Copy JSON to clipboard
  const handleCopy = useCallback(async (resource: FhirResource) => {
    const id = resource.id || 'unknown';
    try {
      await navigator.clipboard.writeText(JSON.stringify(resource, null, 2));
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      console.error('Failed to copy');
    }
  }, []);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Raw Data Table
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {sortedResources.length.toLocaleString()} of{' '}
              {resources.length.toLocaleString()} records
              {searchTerm && ' (filtered)'}
            </p>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              placeholder="Search records..."
              className="pl-9 pr-4 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 w-full sm:w-64"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-700/50">
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-12">
                <Code className="w-4 h-4" />
              </th>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider ${col.width || ''} ${col.sortable ? 'cursor-pointer hover:text-gray-700 dark:hover:text-gray-200' : ''}`}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    {col.sortable && sortKey === col.key && (
                      sortDir === 'asc' ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {paginatedResources.map((resource, idx) => {
              const rowId = resource.id || `row-${idx}`;
              const isExpanded = expandedRow === rowId;

              return (
                <>
                  <tr
                    key={rowId}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setExpandedRow(isExpanded ? null : rowId)}
                        className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-400"
                        title="View raw JSON"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 truncate max-w-xs"
                        title={String(col.accessor(resource) || '')}
                      >
                        {col.accessor(resource) ?? 'N/A'}
                      </td>
                    ))}
                  </tr>
                  {isExpanded && (
                    <tr key={`${rowId}-expanded`}>
                      <td
                        colSpan={columns.length + 1}
                        className="px-4 py-4 bg-gray-50 dark:bg-gray-900"
                      >
                        <div className="relative">
                          <button
                            onClick={() => handleCopy(resource)}
                            className="absolute top-2 right-2 p-1.5 rounded bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-400"
                            title="Copy JSON"
                          >
                            {copiedId === rowId ? (
                              <Check className="w-4 h-4 text-green-500" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                          <pre className="text-xs text-gray-700 dark:text-gray-300 overflow-x-auto max-h-96 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 font-mono scrollbar-thin">
                            {JSON.stringify(resource, null, 2)}
                          </pre>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Page size selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Show
            </span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="px-2 py-1 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              {PAGE_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              per page
            </span>
          </div>

          {/* Page navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm text-gray-700 dark:text-gray-300 tabular-nums">
              Page {page} of {totalPages || 1}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

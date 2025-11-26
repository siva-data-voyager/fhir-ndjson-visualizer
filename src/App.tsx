/**
 * App Component
 *
 * Main application entry point.
 * Manages the state machine: Input → Parsing → Dashboard display.
 */

import { useState, useCallback, useMemo } from 'react';
import { BarChart3, Table, FileSearch } from 'lucide-react';
import { Layout } from './components/Layout';
import { NdjsonInput } from './components/NdjsonInput';
import { ParseResultHeader } from './components/ParseResultHeader';
import { TabNavigation, TabPanel, Tab } from './components/TabNavigation';
import { PatientDashboard } from './components/PatientDashboard';
import { EncounterDashboard } from './components/EncounterDashboard';
import { GenericDashboard } from './components/GenericDashboard';
import { ResourceTable } from './components/ResourceTable';
import { parseNdjson } from './utils/ndjsonParser';
import { useLocalStorage } from './hooks/useLocalStorage';
import {
  FhirResource,
  FhirPatient,
  FhirEncounter,
  isPatient,
  isEncounter,
} from './types/fhir';
import { ParseResult } from './types/analytics';

// Application view states
type AppView = 'input' | 'dashboard';

// Dashboard tabs
const DASHBOARD_TABS: Tab[] = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'data', label: 'Raw Data', icon: Table },
];

// LocalStorage key for persisting input (24 hour expiration)
const STORAGE_KEY = 'fhir-visualizer-last-input';
const STORAGE_EXPIRATION = 24 * 60 * 60 * 1000; // 24 hours

function App() {
  // Application state
  const [view, setView] = useState<AppView>('input');
  const [parseResult, setParseResult] = useState<ParseResult<FhirResource> | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(false);

  // Persist last input in localStorage
  const [storedInput, setStoredInput, clearStoredInput] = useLocalStorage<string>(
    STORAGE_KEY,
    '',
    STORAGE_EXPIRATION
  );

  // Handle NDJSON analysis
  const handleAnalyze = useCallback(
    (input: string) => {
      setIsLoading(true);

      // Use requestAnimationFrame to let the UI update before heavy parsing
      requestAnimationFrame(() => {
        try {
          const result = parseNdjson(input);
          setParseResult(result);
          setStoredInput(input);
          setView('dashboard');
          setActiveTab('overview');
        } catch (error) {
          console.error('Parse error:', error);
          // Could add error state handling here
        } finally {
          setIsLoading(false);
        }
      });
    },
    [setStoredInput]
  );

  // Reset to input view
  const handleReset = useCallback(() => {
    setView('input');
    setParseResult(null);
    setActiveTab('overview');
  }, []);

  // Export summary as JSON
  const handleExport = useCallback(() => {
    if (!parseResult) return;

    const summary = {
      resourceType: parseResult.resourceType,
      pseudoFileName: parseResult.pseudoFileName,
      totalRecords: parseResult.validLines,
      invalidLines: parseResult.invalidLines,
      parseTimeMs: parseResult.parseTimeMs,
      exportedAt: new Date().toISOString(),
      // Sample first 5 records
      sampleRecords: parseResult.resources.slice(0, 5),
    };

    const blob = new Blob([JSON.stringify(summary, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${parseResult.resourceType}-summary.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [parseResult]);

  // Render the appropriate dashboard based on resource type
  const renderDashboard = useMemo(() => {
    if (!parseResult) return null;

    const { resourceType, resources } = parseResult;

    switch (resourceType) {
      case 'Patient':
        return (
          <PatientDashboard
            patients={resources.filter(isPatient) as FhirPatient[]}
          />
        );
      case 'Encounter':
        return (
          <EncounterDashboard
            encounters={resources.filter(isEncounter) as FhirEncounter[]}
          />
        );
      default:
        return (
          <GenericDashboard resources={resources} resourceType={resourceType} />
        );
    }
  }, [parseResult]);

  return (
    <Layout>
      {view === 'input' ? (
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Welcome message */}
          <div className="text-center py-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
              Explore Your FHIR Data
            </h1>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Paste Synthea-generated FHIR R4 US Core 6.1.0 NDJSON data below.
              This tool will parse, analyze, and visualize your healthcare data
              entirely in your browser—no data is sent to any server.
            </p>
          </div>

          {/* Input component */}
          <NdjsonInput
            onAnalyze={handleAnalyze}
            isLoading={isLoading}
            storedInput={storedInput}
            onClearStored={clearStoredInput}
          />

          {/* Feature highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
              <div className="p-2 bg-primary-100 dark:bg-primary-900/50 rounded-lg w-fit mb-3">
                <FileSearch className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                Auto-Detection
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Automatically identifies resource type from your NDJSON and
                tailors the dashboard accordingly.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
              <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg w-fit mb-3">
                <BarChart3 className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                Rich Visualizations
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Interactive charts for demographics, temporal trends, and data
                quality metrics.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg w-fit mb-3">
                <Table className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                Data Table
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Sortable, searchable table with row-level JSON inspection for
                every resource.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Parse result header */}
          {parseResult && (
            <ParseResultHeader
              result={parseResult}
              onReset={handleReset}
              onExport={handleExport}
            />
          )}

          {/* Tab navigation */}
          <TabNavigation
            tabs={DASHBOARD_TABS}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />

          {/* Tab panels */}
          <TabPanel id="overview" activeTab={activeTab}>
            {renderDashboard}
          </TabPanel>

          <TabPanel id="data" activeTab={activeTab}>
            {parseResult && (
              <ResourceTable
                resources={parseResult.resources}
                resourceType={parseResult.resourceType}
              />
            )}
          </TabPanel>
        </div>
      )}
    </Layout>
  );
}

export default App;

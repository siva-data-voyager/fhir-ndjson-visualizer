/**
 * NdjsonInput Component
 *
 * Text area for pasting NDJSON with parse trigger.
 * Shows validation status and resource type detection.
 */

import { useState, useCallback } from 'react';
import {
  FileJson,
  Play,
  AlertCircle,
  CheckCircle,
  Trash2,
  Upload,
  Info,
} from 'lucide-react';
import { looksLikeNdjson, getPreview } from '../utils/ndjsonParser';
import { FhirResource } from '../types/fhir';

interface NdjsonInputProps {
  onAnalyze: (input: string) => void;
  isLoading?: boolean;
  storedInput?: string;
  onClearStored?: () => void;
}

export function NdjsonInput({
  onAnalyze,
  isLoading = false,
  storedInput,
  onClearStored,
}: NdjsonInputProps) {
  const [input, setInput] = useState(storedInput || '');
  const [validationStatus, setValidationStatus] = useState<
    'empty' | 'valid' | 'invalid'
  >('empty');
  const [previewType, setPreviewType] = useState<string | null>(null);
  const [lineCount, setLineCount] = useState(0);

  // Validate input as user types (debounced would be better for large inputs)
  const handleChange = useCallback((value: string) => {
    setInput(value);

    if (!value.trim()) {
      setValidationStatus('empty');
      setPreviewType(null);
      setLineCount(0);
      return;
    }

    // Count non-empty lines
    const lines = value.split('\n').filter((l) => l.trim()).length;
    setLineCount(lines);

    // Quick validation
    if (looksLikeNdjson(value)) {
      setValidationStatus('valid');

      // Get resource type from preview
      const preview = getPreview<FhirResource>(value, 1);
      if (preview.resources.length > 0) {
        setPreviewType(preview.resources[0].resourceType);
      }
    } else {
      setValidationStatus('invalid');
      setPreviewType(null);
    }
  }, []);

  const handleSubmit = useCallback(() => {
    if (validationStatus === 'valid' && input.trim()) {
      onAnalyze(input);
    }
  }, [input, validationStatus, onAnalyze]);

  const handleClear = useCallback(() => {
    setInput('');
    setValidationStatus('empty');
    setPreviewType(null);
    setLineCount(0);
    onClearStored?.();
  }, [onClearStored]);

  // Handle paste event for immediate validation
  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const pastedText = e.clipboardData.getData('text');
      // Let the onChange handle validation after paste
      setTimeout(() => handleChange(input + pastedText), 0);
    },
    [input, handleChange]
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 dark:bg-primary-900/50 rounded-lg">
              <FileJson className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Paste NDJSON Data
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Synthea-generated FHIR R4 US Core 6.1.0 resources
              </p>
            </div>
          </div>

          {/* Status indicator */}
          {validationStatus !== 'empty' && (
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
                validationStatus === 'valid'
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              }`}
            >
              {validationStatus === 'valid' ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>
                    {previewType || 'Valid'} ({lineCount.toLocaleString()} lines)
                  </span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4" />
                  <span>Invalid format</span>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="px-6 py-3 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-800">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-700 dark:text-blue-300">
            <p>
              Paste NDJSON content (one FHIR resource per line). Supported types:
              <span className="font-medium"> Patient</span>,
              <span className="font-medium"> Encounter</span>.
              Other resource types will show generic analytics.
            </p>
          </div>
        </div>
      </div>

      {/* Text area */}
      <div className="p-4">
        <textarea
          value={input}
          onChange={(e) => handleChange(e.target.value)}
          onPaste={handlePaste}
          placeholder={`{"resourceType": "Patient", "id": "example-1", "gender": "female", "birthDate": "1985-03-15", ...}
{"resourceType": "Patient", "id": "example-2", "gender": "male", "birthDate": "1972-08-22", ...}
...`}
          className="w-full h-64 px-4 py-3 font-mono text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg resize-y focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-gray-100 scrollbar-thin"
          spellCheck={false}
          disabled={isLoading}
        />
      </div>

      {/* Actions */}
      <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {input && (
              <button
                onClick={handleClear}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                Clear
              </button>
            )}

            {storedInput && !input && (
              <button
                onClick={() => handleChange(storedInput)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
              >
                <Upload className="w-4 h-4" />
                Load Previous Data
              </button>
            )}
          </div>

          <button
            onClick={handleSubmit}
            disabled={validationStatus !== 'valid' || isLoading}
            className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 rounded-lg transition-colors disabled:cursor-not-allowed shadow-sm"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>Analyze NDJSON</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

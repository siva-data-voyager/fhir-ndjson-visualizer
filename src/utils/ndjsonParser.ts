/**
 * NDJSON Parser
 *
 * Parses Newline-Delimited JSON (NDJSON) format used by FHIR bulk data exports.
 * Each line is an independent JSON object representing a FHIR resource.
 *
 * Key behaviors:
 * - Ignores empty lines and whitespace-only lines
 * - Reports malformed JSON lines with line numbers
 * - Auto-detects resourceType from first valid line
 * - Warns if multiple resourceTypes are detected
 */

import { FhirResource } from '../types/fhir';
import { ParseResult, ParseError } from '../types/analytics';

const MAX_ERROR_LINE_LENGTH = 100; // Truncate raw lines in error messages
const MAX_ERRORS_STORED = 50; // Limit stored errors for UI display

/**
 * Parse NDJSON string into an array of FHIR resources
 */
export function parseNdjson<T extends FhirResource = FhirResource>(
  input: string
): ParseResult<T> {
  const startTime = performance.now();

  const lines = input.split('\n');
  const resources: T[] = [];
  const errors: ParseError[] = [];
  let detectedResourceType: string | null = null;
  let resourceTypeMismatchCount = 0;

  let validLines = 0;
  let invalidLines = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const lineNumber = i + 1;

    // Skip empty lines
    if (line === '') {
      continue;
    }

    try {
      const parsed = JSON.parse(line) as T;

      // Validate it looks like a FHIR resource
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('Parsed value is not an object');
      }

      if (!parsed.resourceType) {
        throw new Error('Missing resourceType field');
      }

      // Track resourceType - use first valid one
      if (detectedResourceType === null) {
        detectedResourceType = parsed.resourceType;
      } else if (parsed.resourceType !== detectedResourceType) {
        resourceTypeMismatchCount++;
        // Still include the resource but count the mismatch
      }

      resources.push(parsed);
      validLines++;
    } catch (error) {
      invalidLines++;

      // Store error details (limit total stored)
      if (errors.length < MAX_ERRORS_STORED) {
        const message =
          error instanceof Error ? error.message : 'Unknown parse error';
        errors.push({
          lineNumber,
          message,
          rawLine:
            line.length > MAX_ERROR_LINE_LENGTH
              ? line.substring(0, MAX_ERROR_LINE_LENGTH) + '...'
              : line,
        });
      }
    }
  }

  // Add warning about mixed resourceTypes
  if (resourceTypeMismatchCount > 0 && errors.length < MAX_ERRORS_STORED) {
    errors.unshift({
      lineNumber: 0,
      message: `Warning: Found ${resourceTypeMismatchCount} resources with different resourceType than "${detectedResourceType}". Analysis focuses on the predominant type.`,
    });
  }

  const parseTimeMs = performance.now() - startTime;

  // Generate pseudo file name
  const pseudoFileName = detectedResourceType
    ? `${detectedResourceType}.ndjson`
    : 'unknown.ndjson';

  return {
    resources,
    resourceType: detectedResourceType || 'Unknown',
    pseudoFileName,
    totalLines: lines.length,
    validLines,
    invalidLines,
    errors,
    parseTimeMs,
  };
}

/**
 * Estimate if input is likely valid NDJSON
 * Quick check before full parsing
 */
export function looksLikeNdjson(input: string): boolean {
  if (!input || input.trim() === '') {
    return false;
  }

  // Check first non-empty line
  const lines = input.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === '') continue;

    // Should start with { and contain resourceType
    if (!trimmed.startsWith('{')) {
      return false;
    }

    try {
      const parsed = JSON.parse(trimmed);
      return (
        parsed &&
        typeof parsed === 'object' &&
        typeof parsed.resourceType === 'string'
      );
    } catch {
      return false;
    }
  }

  return false;
}

/**
 * Get a preview of the NDJSON content (first N resources)
 */
export function getPreview<T extends FhirResource = FhirResource>(
  input: string,
  maxResources: number = 5
): { resources: T[]; hasMore: boolean } {
  const lines = input.split('\n');
  const resources: T[] = [];

  for (const line of lines) {
    if (resources.length >= maxResources) {
      break;
    }

    const trimmed = line.trim();
    if (trimmed === '') continue;

    try {
      const parsed = JSON.parse(trimmed) as T;
      if (parsed && parsed.resourceType) {
        resources.push(parsed);
      }
    } catch {
      // Skip invalid lines in preview
    }
  }

  return {
    resources,
    hasMore: lines.filter((l) => l.trim() !== '').length > maxResources,
  };
}

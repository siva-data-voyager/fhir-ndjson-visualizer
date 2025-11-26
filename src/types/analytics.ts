/**
 * Analytics Types
 *
 * Data structures for computed metrics and visualizations.
 * These are derived from parsed FHIR resources.
 */

import { FhirResource } from './fhir';

// Result of parsing NDJSON input
export interface ParseResult<T extends FhirResource = FhirResource> {
  resources: T[];
  resourceType: string;
  pseudoFileName: string;
  totalLines: number;
  validLines: number;
  invalidLines: number;
  errors: ParseError[];
  parseTimeMs: number;
}

export interface ParseError {
  lineNumber: number;
  message: string;
  rawLine?: string; // Truncated for display
}

// Generic distribution for categorical data
export interface DistributionItem {
  label: string;
  count: number;
  percentage: number;
}

// Time series data point
export interface TimeSeriesPoint {
  date: string; // ISO date string or formatted label
  count: number;
  label?: string;
}

// Histogram bucket
export interface HistogramBucket {
  min: number;
  max: number;
  label: string;
  count: number;
}

// Date range
export interface DateRange {
  min: Date | null;
  max: Date | null;
  minFormatted: string;
  maxFormatted: string;
}

// ============================================
// Patient-specific analytics
// ============================================

export interface PatientAnalytics {
  totalPatients: number;
  uniqueIds: number;

  // Demographics
  genderDistribution: DistributionItem[];
  ageDistribution: HistogramBucket[];
  ageStats: {
    mean: number;
    median: number;
    min: number;
    max: number;
    stdDev: number;
  };

  // Race/Ethnicity (US Core extensions)
  raceDistribution: DistributionItem[];
  ethnicityDistribution: DistributionItem[];

  // Geographic
  stateDistribution: DistributionItem[];
  cityDistribution: DistributionItem[];

  // Mortality
  livingCount: number;
  deceasedCount: number;
  mortalityRate: number;

  // Birth date coverage
  birthDateRange: DateRange;

  // Data quality
  missingBirthDate: number;
  missingGender: number;
  missingAddress: number;
}

// ============================================
// Encounter-specific analytics
// ============================================

export interface EncounterAnalytics {
  totalEncounters: number;
  uniqueEncounterIds: number;
  uniquePatientRefs: number;

  // Classifications
  classDistribution: DistributionItem[];
  typeDistribution: DistributionItem[];
  statusDistribution: DistributionItem[];

  // Temporal
  encountersByMonth: TimeSeriesPoint[];
  periodCoverage: DateRange;

  // Length of Stay (for encounters with period.start and period.end)
  losDistribution: HistogramBucket[];
  losStats: {
    mean: number;
    median: number;
    min: number;
    max: number;
    encountersWithLos: number;
  };

  // Encounters per patient
  encountersPerPatient: HistogramBucket[];
  encountersPerPatientStats: {
    mean: number;
    median: number;
    max: number;
  };

  // Data quality
  missingPeriodStart: number;
  missingPeriodEnd: number;
  missingClass: number;
  missingSubject: number;
}

// ============================================
// Generic analytics for unsupported types
// ============================================

export interface GenericFieldAnalysis {
  fieldPath: string;
  fieldType: 'string' | 'number' | 'boolean' | 'date' | 'object' | 'array' | 'null' | 'mixed';
  presentCount: number;
  missingCount: number;
  uniqueValues?: number;
  topValues?: DistributionItem[];
  numericStats?: {
    min: number;
    max: number;
    mean: number;
    median: number;
  };
  dateRange?: DateRange;
}

export interface GenericAnalytics {
  totalResources: number;
  uniqueIds: number;
  fieldAnalysis: GenericFieldAnalysis[];
  sampleFields: string[]; // Top-level field names for table display
}

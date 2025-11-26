/**
 * Encounter Analytics
 *
 * Computes metrics and distributions from Encounter resources.
 * Handles missing periods, missing classes, and calculates length of stay.
 */

import { FhirEncounter } from '../types/fhir';
import {
  EncounterAnalytics,
  DistributionItem,
  HistogramBucket,
  TimeSeriesPoint,
  DateRange,
} from '../types/analytics';

/**
 * Calculate length of stay in hours from period
 */
function calculateLengthOfStay(
  start: string | undefined,
  end: string | undefined
): number | null {
  if (!start || !end) return null;

  try {
    const startDate = new Date(start);
    const endDate = new Date(end);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return null;
    }

    const diffMs = endDate.getTime() - startDate.getTime();
    if (diffMs < 0) return null;

    // Return hours
    return diffMs / (1000 * 60 * 60);
  } catch {
    return null;
  }
}

/**
 * Extract patient reference ID from subject.reference
 */
function extractPatientId(reference: string | undefined): string | null {
  if (!reference) return null;

  // Handle formats like "Patient/123" or "urn:uuid:123"
  if (reference.startsWith('Patient/')) {
    return reference.substring(8);
  }

  if (reference.startsWith('urn:uuid:')) {
    return reference.substring(9);
  }

  return reference;
}

/**
 * Get display text from encounter class
 */
function getClassDisplay(enc: FhirEncounter): string {
  if (enc.class?.display) {
    return enc.class.display;
  }
  if (enc.class?.code) {
    // Common codes to friendly names
    const codeMap: Record<string, string> = {
      AMB: 'Ambulatory',
      EMER: 'Emergency',
      IMP: 'Inpatient',
      ACUTE: 'Acute',
      NONAC: 'Non-Acute',
      OBSENC: 'Observation',
      PRENC: 'Pre-Admission',
      SS: 'Short Stay',
      HH: 'Home Health',
      VR: 'Virtual',
      outpatient: 'Outpatient',
      inpatient: 'Inpatient',
      ambulatory: 'Ambulatory',
      emergency: 'Emergency',
      wellness: 'Wellness',
      urgentcare: 'Urgent Care',
    };
    return codeMap[enc.class.code] || enc.class.code;
  }
  return 'Unknown';
}

/**
 * Get display text from encounter type
 */
function getTypeDisplay(enc: FhirEncounter): string {
  if (!enc.type || enc.type.length === 0) {
    return 'Unspecified';
  }

  const firstType = enc.type[0];
  if (firstType.text) {
    return firstType.text;
  }
  if (firstType.coding && firstType.coding.length > 0) {
    return firstType.coding[0].display || firstType.coding[0].code || 'Unknown';
  }
  return 'Unknown';
}

/**
 * Format date to month key (YYYY-MM)
 */
function toMonthKey(dateStr: string): string | null {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  } catch {
    return null;
  }
}

/**
 * Create distribution from counts map
 */
function createDistribution(counts: Map<string, number>): DistributionItem[] {
  const total = Array.from(counts.values()).reduce((a, b) => a + b, 0);

  return Array.from(counts.entries())
    .map(([label, count]) => ({
      label,
      count,
      percentage: total > 0 ? (count / total) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Create LOS histogram with meaningful buckets
 */
function createLosHistogram(losHours: number[]): HistogramBucket[] {
  const buckets: HistogramBucket[] = [
    { min: 0, max: 1, label: '<1 hour', count: 0 },
    { min: 1, max: 4, label: '1-4 hours', count: 0 },
    { min: 4, max: 8, label: '4-8 hours', count: 0 },
    { min: 8, max: 24, label: '8-24 hours', count: 0 },
    { min: 24, max: 48, label: '1-2 days', count: 0 },
    { min: 48, max: 72, label: '2-3 days', count: 0 },
    { min: 72, max: 168, label: '3-7 days', count: 0 },
    { min: 168, max: 336, label: '1-2 weeks', count: 0 },
    { min: 336, max: 720, label: '2-4 weeks', count: 0 },
    { min: 720, max: Infinity, label: '>4 weeks', count: 0 },
  ];

  for (const los of losHours) {
    for (const bucket of buckets) {
      if (los >= bucket.min && los < bucket.max) {
        bucket.count++;
        break;
      }
    }
  }

  return buckets.filter((b) => b.count > 0);
}

/**
 * Create encounters per patient histogram
 */
function createEncountersPerPatientHistogram(
  counts: number[]
): HistogramBucket[] {
  const buckets: HistogramBucket[] = [
    { min: 1, max: 1, label: '1', count: 0 },
    { min: 2, max: 5, label: '2-5', count: 0 },
    { min: 6, max: 10, label: '6-10', count: 0 },
    { min: 11, max: 20, label: '11-20', count: 0 },
    { min: 21, max: 50, label: '21-50', count: 0 },
    { min: 51, max: 100, label: '51-100', count: 0 },
    { min: 101, max: Infinity, label: '>100', count: 0 },
  ];

  for (const count of counts) {
    for (const bucket of buckets) {
      if (count >= bucket.min && count <= bucket.max) {
        bucket.count++;
        break;
      }
    }
  }

  return buckets.filter((b) => b.count > 0);
}

/**
 * Calculate basic statistics
 */
function calculateStats(values: number[]): {
  mean: number;
  median: number;
  min: number;
  max: number;
} {
  if (values.length === 0) {
    return { mean: 0, median: 0, min: 0, max: 0 };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const sum = values.reduce((a, b) => a + b, 0);
  const mean = sum / values.length;

  const median =
    values.length % 2 === 0
      ? (sorted[values.length / 2 - 1] + sorted[values.length / 2]) / 2
      : sorted[Math.floor(values.length / 2)];

  return {
    mean: Math.round(mean * 10) / 10,
    median: Math.round(median * 10) / 10,
    min: sorted[0],
    max: sorted[sorted.length - 1],
  };
}

/**
 * Analyze Encounter resources and compute analytics
 */
export function analyzeEncounters(
  encounters: FhirEncounter[]
): EncounterAnalytics {
  const uniqueEncounterIds = new Set(
    encounters.map((e) => e.id).filter(Boolean)
  );
  const patientCounts = new Map<string, number>();

  // Counters
  const classCounts = new Map<string, number>();
  const typeCounts = new Map<string, number>();
  const statusCounts = new Map<string, number>();
  const monthCounts = new Map<string, number>();

  const losHours: number[] = [];
  const periodDates: Date[] = [];

  let missingPeriodStart = 0;
  let missingPeriodEnd = 0;
  let missingClass = 0;
  let missingSubject = 0;

  for (const encounter of encounters) {
    // Class distribution
    if (encounter.class) {
      const classDisplay = getClassDisplay(encounter);
      const current = classCounts.get(classDisplay) || 0;
      classCounts.set(classDisplay, current + 1);
    } else {
      missingClass++;
    }

    // Type distribution
    const typeDisplay = getTypeDisplay(encounter);
    const typeCurrent = typeCounts.get(typeDisplay) || 0;
    typeCounts.set(typeDisplay, typeCurrent + 1);

    // Status distribution
    if (encounter.status) {
      const current = statusCounts.get(encounter.status) || 0;
      statusCounts.set(encounter.status, current + 1);
    }

    // Period analysis
    const periodStart = encounter.period?.start;
    const periodEnd = encounter.period?.end;

    if (!periodStart) {
      missingPeriodStart++;
    } else {
      try {
        const date = new Date(periodStart);
        if (!isNaN(date.getTime())) {
          periodDates.push(date);

          // Count by month
          const monthKey = toMonthKey(periodStart);
          if (monthKey) {
            const current = monthCounts.get(monthKey) || 0;
            monthCounts.set(monthKey, current + 1);
          }
        }
      } catch {
        // Invalid date
      }
    }

    if (!periodEnd) {
      missingPeriodEnd++;
    }

    // Length of stay
    const los = calculateLengthOfStay(periodStart, periodEnd);
    if (los !== null) {
      losHours.push(los);
    }

    // Patient reference
    const patientId = extractPatientId(encounter.subject?.reference);
    if (patientId) {
      const current = patientCounts.get(patientId) || 0;
      patientCounts.set(patientId, current + 1);
    } else {
      missingSubject++;
    }
  }

  // Period date range
  const sortedPeriodDates = periodDates.sort(
    (a, b) => a.getTime() - b.getTime()
  );
  const periodCoverage: DateRange = {
    min: sortedPeriodDates.length > 0 ? sortedPeriodDates[0] : null,
    max:
      sortedPeriodDates.length > 0
        ? sortedPeriodDates[sortedPeriodDates.length - 1]
        : null,
    minFormatted:
      sortedPeriodDates.length > 0
        ? sortedPeriodDates[0].toLocaleDateString()
        : 'N/A',
    maxFormatted:
      sortedPeriodDates.length > 0
        ? sortedPeriodDates[
            sortedPeriodDates.length - 1
          ].toLocaleDateString()
        : 'N/A',
  };

  // Create time series from month counts (sorted by date)
  const encountersByMonth: TimeSeriesPoint[] = Array.from(monthCounts.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, count]) => ({
      date,
      count,
      label: new Date(date + '-01').toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
      }),
    }));

  // LOS statistics (convert to days for readability)
  const losDays = losHours.map((h) => h / 24);
  const losStats = {
    ...calculateStats(losDays),
    encountersWithLos: losHours.length,
  };

  // Encounters per patient
  const encountersPerPatientValues = Array.from(patientCounts.values());
  const encountersPerPatientStats = {
    ...calculateStats(encountersPerPatientValues),
  };

  return {
    totalEncounters: encounters.length,
    uniqueEncounterIds: uniqueEncounterIds.size,
    uniquePatientRefs: patientCounts.size,
    classDistribution: createDistribution(classCounts),
    typeDistribution: createDistribution(typeCounts).slice(0, 15),
    statusDistribution: createDistribution(statusCounts),
    encountersByMonth,
    periodCoverage,
    losDistribution: createLosHistogram(losHours),
    losStats,
    encountersPerPatient: createEncountersPerPatientHistogram(
      encountersPerPatientValues
    ),
    encountersPerPatientStats,
    missingPeriodStart,
    missingPeriodEnd,
    missingClass,
    missingSubject,
  };
}

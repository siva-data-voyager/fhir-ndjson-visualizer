/**
 * Patient Analytics
 *
 * Computes metrics and distributions from Patient resources.
 * Handles missing/optional fields gracefully with fallback counts.
 */

import { FhirPatient, FhirExtension } from '../types/fhir';
import {
  PatientAnalytics,
  DistributionItem,
  HistogramBucket,
  DateRange,
} from '../types/analytics';

// US Core Extension URLs for race and ethnicity
const US_CORE_RACE_URL =
  'http://hl7.org/fhir/us/core/StructureDefinition/us-core-race';
const US_CORE_ETHNICITY_URL =
  'http://hl7.org/fhir/us/core/StructureDefinition/us-core-ethnicity';
const OMB_CATEGORY_URL = 'ombCategory';
const DETAILED_URL = 'detailed';
const TEXT_URL = 'text';

/**
 * Calculate age from birthDate
 * Returns null if birthDate is missing or invalid
 */
function calculateAge(
  birthDate: string | undefined,
  deceasedDateTime?: string
): number | null {
  if (!birthDate) return null;

  try {
    const birth = new Date(birthDate);
    if (isNaN(birth.getTime())) return null;

    // If deceased, calculate age at death; otherwise current age
    const endDate = deceasedDateTime
      ? new Date(deceasedDateTime)
      : new Date();

    let age = endDate.getFullYear() - birth.getFullYear();
    const monthDiff = endDate.getMonth() - birth.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && endDate.getDate() < birth.getDate())
    ) {
      age--;
    }

    return age >= 0 ? age : null;
  } catch {
    return null;
  }
}

/**
 * Extract race from US Core extension
 */
function extractRace(extensions: FhirExtension[] | undefined): string | null {
  if (!extensions) return null;

  const raceExt = extensions.find((e) => e.url === US_CORE_RACE_URL);
  if (!raceExt || !raceExt.extension) return null;

  // Try to get OMB category first, then detailed, then text
  const ombCategory = raceExt.extension.find((e) => e.url === OMB_CATEGORY_URL);
  if (ombCategory?.valueCoding?.display) {
    return ombCategory.valueCoding.display;
  }

  const detailed = raceExt.extension.find((e) => e.url === DETAILED_URL);
  if (detailed?.valueCoding?.display) {
    return detailed.valueCoding.display;
  }

  const text = raceExt.extension.find((e) => e.url === TEXT_URL);
  if (text?.valueString) {
    return text.valueString;
  }

  return null;
}

/**
 * Extract ethnicity from US Core extension
 */
function extractEthnicity(
  extensions: FhirExtension[] | undefined
): string | null {
  if (!extensions) return null;

  const ethExt = extensions.find((e) => e.url === US_CORE_ETHNICITY_URL);
  if (!ethExt || !ethExt.extension) return null;

  const ombCategory = ethExt.extension.find((e) => e.url === OMB_CATEGORY_URL);
  if (ombCategory?.valueCoding?.display) {
    return ombCategory.valueCoding.display;
  }

  const text = ethExt.extension.find((e) => e.url === TEXT_URL);
  if (text?.valueString) {
    return text.valueString;
  }

  return null;
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
 * Create age histogram with standard buckets
 */
function createAgeHistogram(ages: number[]): HistogramBucket[] {
  const buckets: HistogramBucket[] = [
    { min: 0, max: 9, label: '0-9', count: 0 },
    { min: 10, max: 19, label: '10-19', count: 0 },
    { min: 20, max: 29, label: '20-29', count: 0 },
    { min: 30, max: 39, label: '30-39', count: 0 },
    { min: 40, max: 49, label: '40-49', count: 0 },
    { min: 50, max: 59, label: '50-59', count: 0 },
    { min: 60, max: 69, label: '60-69', count: 0 },
    { min: 70, max: 79, label: '70-79', count: 0 },
    { min: 80, max: 89, label: '80-89', count: 0 },
    { min: 90, max: 120, label: '90+', count: 0 },
  ];

  for (const age of ages) {
    for (const bucket of buckets) {
      if (age >= bucket.min && age <= bucket.max) {
        bucket.count++;
        break;
      }
    }
  }

  return buckets;
}

/**
 * Calculate basic statistics for numeric array
 */
function calculateStats(values: number[]): {
  mean: number;
  median: number;
  min: number;
  max: number;
  stdDev: number;
} {
  if (values.length === 0) {
    return { mean: 0, median: 0, min: 0, max: 0, stdDev: 0 };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const sum = values.reduce((a, b) => a + b, 0);
  const mean = sum / values.length;

  const median =
    values.length % 2 === 0
      ? (sorted[values.length / 2 - 1] + sorted[values.length / 2]) / 2
      : sorted[Math.floor(values.length / 2)];

  const squaredDiffs = values.map((v) => Math.pow(v - mean, 2));
  const avgSquaredDiff =
    squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
  const stdDev = Math.sqrt(avgSquaredDiff);

  return {
    mean: Math.round(mean * 10) / 10,
    median: Math.round(median * 10) / 10,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    stdDev: Math.round(stdDev * 10) / 10,
  };
}

/**
 * Analyze Patient resources and compute analytics
 */
export function analyzePatients(patients: FhirPatient[]): PatientAnalytics {
  const uniqueIds = new Set(patients.map((p) => p.id).filter(Boolean));

  // Counters
  const genderCounts = new Map<string, number>();
  const raceCounts = new Map<string, number>();
  const ethnicityCounts = new Map<string, number>();
  const stateCounts = new Map<string, number>();
  const cityCounts = new Map<string, number>();

  const ages: number[] = [];
  const birthDates: Date[] = [];

  let livingCount = 0;
  let deceasedCount = 0;
  let missingBirthDate = 0;
  let missingGender = 0;
  let missingAddress = 0;

  for (const patient of patients) {
    // Gender
    if (patient.gender) {
      const current = genderCounts.get(patient.gender) || 0;
      genderCounts.set(patient.gender, current + 1);
    } else {
      missingGender++;
    }

    // Age
    const age = calculateAge(patient.birthDate, patient.deceasedDateTime);
    if (age !== null) {
      ages.push(age);
    }

    // Birth date
    if (patient.birthDate) {
      try {
        const date = new Date(patient.birthDate);
        if (!isNaN(date.getTime())) {
          birthDates.push(date);
        }
      } catch {
        // Invalid date
      }
    } else {
      missingBirthDate++;
    }

    // Deceased status
    if (patient.deceasedBoolean || patient.deceasedDateTime) {
      deceasedCount++;
    } else {
      livingCount++;
    }

    // Race and ethnicity
    const race = extractRace(patient.extension);
    if (race) {
      const current = raceCounts.get(race) || 0;
      raceCounts.set(race, current + 1);
    }

    const ethnicity = extractEthnicity(patient.extension);
    if (ethnicity) {
      const current = ethnicityCounts.get(ethnicity) || 0;
      ethnicityCounts.set(ethnicity, current + 1);
    }

    // Address
    if (patient.address && patient.address.length > 0) {
      const primaryAddress = patient.address[0];

      if (primaryAddress.state) {
        const current = stateCounts.get(primaryAddress.state) || 0;
        stateCounts.set(primaryAddress.state, current + 1);
      }

      if (primaryAddress.city) {
        const current = cityCounts.get(primaryAddress.city) || 0;
        cityCounts.set(primaryAddress.city, current + 1);
      }
    } else {
      missingAddress++;
    }
  }

  // Calculate birth date range
  const sortedBirthDates = birthDates.sort((a, b) => a.getTime() - b.getTime());
  const birthDateRange: DateRange = {
    min: sortedBirthDates.length > 0 ? sortedBirthDates[0] : null,
    max:
      sortedBirthDates.length > 0
        ? sortedBirthDates[sortedBirthDates.length - 1]
        : null,
    minFormatted:
      sortedBirthDates.length > 0
        ? sortedBirthDates[0].toLocaleDateString()
        : 'N/A',
    maxFormatted:
      sortedBirthDates.length > 0
        ? sortedBirthDates[sortedBirthDates.length - 1].toLocaleDateString()
        : 'N/A',
  };

  return {
    totalPatients: patients.length,
    uniqueIds: uniqueIds.size,
    genderDistribution: createDistribution(genderCounts),
    ageDistribution: createAgeHistogram(ages),
    ageStats: calculateStats(ages),
    raceDistribution: createDistribution(raceCounts),
    ethnicityDistribution: createDistribution(ethnicityCounts),
    stateDistribution: createDistribution(stateCounts).slice(0, 15), // Top 15
    cityDistribution: createDistribution(cityCounts).slice(0, 20), // Top 20
    livingCount,
    deceasedCount,
    mortalityRate:
      patients.length > 0 ? (deceasedCount / patients.length) * 100 : 0,
    birthDateRange,
    missingBirthDate,
    missingGender,
    missingAddress,
  };
}

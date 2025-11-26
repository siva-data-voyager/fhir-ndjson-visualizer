/**
 * FHIR R4 US Core 6.1.0 Type Definitions
 *
 * These types represent the minimal subset of FHIR resource fields
 * commonly found in Synthea-generated data and used for visualization.
 *
 * Note: Synthea outputs conform to US Core profiles, but field presence
 * varies. All optional fields should be handled gracefully.
 */

// Base FHIR Resource - all resources extend this
export interface FhirResource {
  resourceType: string;
  id?: string;
  meta?: {
    versionId?: string;
    lastUpdated?: string;
    profile?: string[];
  };
}

// FHIR Coding - used in CodeableConcept
export interface FhirCoding {
  system?: string;
  code?: string;
  display?: string;
}

// FHIR CodeableConcept - common pattern for coded values
export interface FhirCodeableConcept {
  coding?: FhirCoding[];
  text?: string;
}

// FHIR Period - start/end timestamps
export interface FhirPeriod {
  start?: string;
  end?: string;
}

// FHIR Reference - references to other resources
export interface FhirReference {
  reference?: string;
  type?: string;
  display?: string;
}

// FHIR Address
export interface FhirAddress {
  use?: string;
  type?: string;
  text?: string;
  line?: string[];
  city?: string;
  district?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

// FHIR HumanName
export interface FhirHumanName {
  use?: string;
  text?: string;
  family?: string;
  given?: string[];
  prefix?: string[];
  suffix?: string[];
}

// FHIR Identifier
export interface FhirIdentifier {
  use?: string;
  type?: FhirCodeableConcept;
  system?: string;
  value?: string;
}

// Extension - common FHIR extension pattern
export interface FhirExtension {
  url: string;
  valueString?: string;
  valueCode?: string;
  valueCoding?: FhirCoding;
  valueCodeableConcept?: FhirCodeableConcept;
  valueBoolean?: boolean;
  valueInteger?: number;
  valueDecimal?: number;
  valueDate?: string;
  valueDateTime?: string;
  valueAddress?: FhirAddress;
  extension?: FhirExtension[];
}

/**
 * Patient Resource (US Core Patient Profile)
 *
 * Key fields for Synthea visualization:
 * - birthDate: Used for age calculation
 * - gender: Administrative gender
 * - address: Geographic distribution
 * - extension: Contains race/ethnicity (US Core specific)
 */
export interface FhirPatient extends FhirResource {
  resourceType: 'Patient';
  identifier?: FhirIdentifier[];
  active?: boolean;
  name?: FhirHumanName[];
  telecom?: Array<{
    system?: string;
    value?: string;
    use?: string;
  }>;
  gender?: 'male' | 'female' | 'other' | 'unknown';
  birthDate?: string; // YYYY-MM-DD format
  deceasedBoolean?: boolean;
  deceasedDateTime?: string;
  address?: FhirAddress[];
  maritalStatus?: FhirCodeableConcept;
  multipleBirthBoolean?: boolean;
  multipleBirthInteger?: number;
  communication?: Array<{
    language?: FhirCodeableConcept;
    preferred?: boolean;
  }>;
  extension?: FhirExtension[];
}

/**
 * Encounter Resource (US Core Encounter Profile)
 *
 * Key fields for Synthea visualization:
 * - class: ambulatory, emergency, inpatient, etc.
 * - type: Specific encounter type (coded)
 * - period: Start/end times for duration calculation
 * - subject: Reference to Patient
 */
export interface FhirEncounter extends FhirResource {
  resourceType: 'Encounter';
  identifier?: FhirIdentifier[];
  status?: 'planned' | 'arrived' | 'triaged' | 'in-progress' | 'onleave' | 'finished' | 'cancelled' | 'entered-in-error' | 'unknown';
  class?: FhirCoding; // Note: In R4, this is Coding, not CodeableConcept
  type?: FhirCodeableConcept[];
  serviceType?: FhirCodeableConcept;
  priority?: FhirCodeableConcept;
  subject?: FhirReference;
  participant?: Array<{
    type?: FhirCodeableConcept[];
    period?: FhirPeriod;
    individual?: FhirReference;
  }>;
  period?: FhirPeriod;
  length?: {
    value?: number;
    unit?: string;
    system?: string;
    code?: string;
  };
  reasonCode?: FhirCodeableConcept[];
  reasonReference?: FhirReference[];
  hospitalization?: {
    admitSource?: FhirCodeableConcept;
    dischargeDisposition?: FhirCodeableConcept;
  };
  location?: Array<{
    location?: FhirReference;
    status?: string;
    period?: FhirPeriod;
  }>;
  serviceProvider?: FhirReference;
}

// Union type for supported resource types
export type SupportedFhirResource = FhirPatient | FhirEncounter;

// Type guard functions
export function isPatient(resource: FhirResource): resource is FhirPatient {
  return resource.resourceType === 'Patient';
}

export function isEncounter(resource: FhirResource): resource is FhirEncounter {
  return resource.resourceType === 'Encounter';
}

// Supported resource types for explicit handling
export const SUPPORTED_RESOURCE_TYPES = ['Patient', 'Encounter'] as const;
export type SupportedResourceType = typeof SUPPORTED_RESOURCE_TYPES[number];

export function isSupportedResourceType(type: string): type is SupportedResourceType {
  return SUPPORTED_RESOURCE_TYPES.includes(type as SupportedResourceType);
}

// ============================================
// COVERAGE DATA — All 50 States + Sample Counties
// ============================================
// Coverage Levels:
//   0 = Not Available
//   1 = Parcel Only
//   2 = Zoning Basic
//   3 = Buildability Core
//   4 = Full Risk Snapshot
// ============================================

export type CoverageLevel = 0 | 1 | 2 | 3 | 4;

export type JurisdictionEntry = {
  id: string;
  name: string;
  state: string;
  county?: string;
  city?: string;
  type: "state" | "county" | "city" | "unincorporated";
  coverageLevel: CoverageLevel;
  hasParcels: boolean;
  hasZoningPolygons: boolean;
  hasRulesStructured: boolean;
  hasEnvironmentalLayers: boolean;
  hasUtilityServiceAreas: boolean;
  hasSepticRules: boolean;
  lastUpdated: string; // ISO date
  population?: number;
};

export const COVERAGE_LEVEL_LABELS: Record<CoverageLevel, string> = {
  0: "Not Available",
  1: "Parcel Only",
  2: "Zoning Basic",
  3: "Buildability Core",
  4: "Full Risk Snapshot",
};

export const COVERAGE_LEVEL_COLORS: Record<CoverageLevel, string> = {
  0: "#d1d5db", // gray
  1: "#93c5fd", // light blue
  2: "#3b82f6", // blue
  3: "#22c55e", // green
  4: "#15803d", // dark green
};

export const COVERAGE_LEVEL_DESCRIPTIONS: Record<CoverageLevel, string> = {
  0: "No parcel or zoning data available. Snapshot not supported.",
  1: "Parcel geometry available. No zoning rules or validation.",
  2: "Zoning district lookup with limited rules (e.g. setbacks only). Partial citations.",
  3: "Full zoning rules with deterministic validation. Citation-backed buildable area visualization.",
  4: "Complete Risk Snapshot: zoning, buildability, utilities, septic, environmental overlays, and exportable report.",
};

// ============================================
// STATE COVERAGE DATA
// ============================================

export const STATE_COVERAGE: JurisdictionEntry[] = [
  // Level 4 — Full coverage
  { id: "WA", name: "Washington", state: "WA", type: "state", coverageLevel: 4, hasParcels: true, hasZoningPolygons: true, hasRulesStructured: true, hasEnvironmentalLayers: true, hasUtilityServiceAreas: true, hasSepticRules: true, lastUpdated: "2026-01-15", population: 7900000 },

  // Level 3 — Buildability Core
  { id: "OR", name: "Oregon", state: "OR", type: "state", coverageLevel: 3, hasParcels: true, hasZoningPolygons: true, hasRulesStructured: true, hasEnvironmentalLayers: true, hasUtilityServiceAreas: false, hasSepticRules: false, lastUpdated: "2026-01-10", population: 4240000 },
  { id: "CA", name: "California", state: "CA", type: "state", coverageLevel: 3, hasParcels: true, hasZoningPolygons: true, hasRulesStructured: true, hasEnvironmentalLayers: true, hasUtilityServiceAreas: false, hasSepticRules: false, lastUpdated: "2025-12-20", population: 39500000 },
  { id: "CO", name: "Colorado", state: "CO", type: "state", coverageLevel: 3, hasParcels: true, hasZoningPolygons: true, hasRulesStructured: true, hasEnvironmentalLayers: false, hasUtilityServiceAreas: false, hasSepticRules: false, lastUpdated: "2025-12-15", population: 5770000 },

  // Level 2 — Zoning Basic
  { id: "TX", name: "Texas", state: "TX", type: "state", coverageLevel: 2, hasParcels: true, hasZoningPolygons: true, hasRulesStructured: false, hasEnvironmentalLayers: false, hasUtilityServiceAreas: false, hasSepticRules: false, lastUpdated: "2025-11-20", population: 29100000 },
  { id: "FL", name: "Florida", state: "FL", type: "state", coverageLevel: 2, hasParcels: true, hasZoningPolygons: true, hasRulesStructured: false, hasEnvironmentalLayers: true, hasUtilityServiceAreas: false, hasSepticRules: false, lastUpdated: "2025-11-15", population: 21500000 },
  { id: "NC", name: "North Carolina", state: "NC", type: "state", coverageLevel: 2, hasParcels: true, hasZoningPolygons: true, hasRulesStructured: false, hasEnvironmentalLayers: false, hasUtilityServiceAreas: false, hasSepticRules: false, lastUpdated: "2025-11-01", population: 10400000 },
  { id: "AZ", name: "Arizona", state: "AZ", type: "state", coverageLevel: 2, hasParcels: true, hasZoningPolygons: true, hasRulesStructured: false, hasEnvironmentalLayers: false, hasUtilityServiceAreas: false, hasSepticRules: false, lastUpdated: "2025-10-20", population: 7170000 },
  { id: "GA", name: "Georgia", state: "GA", type: "state", coverageLevel: 2, hasParcels: true, hasZoningPolygons: true, hasRulesStructured: false, hasEnvironmentalLayers: false, hasUtilityServiceAreas: false, hasSepticRules: false, lastUpdated: "2025-10-15", population: 10700000 },
  { id: "NV", name: "Nevada", state: "NV", type: "state", coverageLevel: 2, hasParcels: true, hasZoningPolygons: true, hasRulesStructured: false, hasEnvironmentalLayers: false, hasUtilityServiceAreas: false, hasSepticRules: false, lastUpdated: "2025-10-10", population: 3100000 },
  { id: "UT", name: "Utah", state: "UT", type: "state", coverageLevel: 2, hasParcels: true, hasZoningPolygons: true, hasRulesStructured: false, hasEnvironmentalLayers: false, hasUtilityServiceAreas: false, hasSepticRules: false, lastUpdated: "2025-10-05", population: 3270000 },
  { id: "ID", name: "Idaho", state: "ID", type: "state", coverageLevel: 2, hasParcels: true, hasZoningPolygons: true, hasRulesStructured: false, hasEnvironmentalLayers: false, hasUtilityServiceAreas: false, hasSepticRules: false, lastUpdated: "2025-09-30", population: 1840000 },
  { id: "MT", name: "Montana", state: "MT", type: "state", coverageLevel: 2, hasParcels: true, hasZoningPolygons: false, hasRulesStructured: false, hasEnvironmentalLayers: false, hasUtilityServiceAreas: false, hasSepticRules: false, lastUpdated: "2025-09-25", population: 1080000 },
  { id: "TN", name: "Tennessee", state: "TN", type: "state", coverageLevel: 2, hasParcels: true, hasZoningPolygons: true, hasRulesStructured: false, hasEnvironmentalLayers: false, hasUtilityServiceAreas: false, hasSepticRules: false, lastUpdated: "2025-09-20", population: 6910000 },

  // Level 1 — Parcel Only
  { id: "NY", name: "New York", state: "NY", type: "state", coverageLevel: 1, hasParcels: true, hasZoningPolygons: false, hasRulesStructured: false, hasEnvironmentalLayers: false, hasUtilityServiceAreas: false, hasSepticRules: false, lastUpdated: "2025-09-01", population: 20200000 },
  { id: "PA", name: "Pennsylvania", state: "PA", type: "state", coverageLevel: 1, hasParcels: true, hasZoningPolygons: false, hasRulesStructured: false, hasEnvironmentalLayers: false, hasUtilityServiceAreas: false, hasSepticRules: false, lastUpdated: "2025-08-20", population: 13000000 },
  { id: "IL", name: "Illinois", state: "IL", type: "state", coverageLevel: 1, hasParcels: true, hasZoningPolygons: false, hasRulesStructured: false, hasEnvironmentalLayers: false, hasUtilityServiceAreas: false, hasSepticRules: false, lastUpdated: "2025-08-15", population: 12800000 },
  { id: "OH", name: "Ohio", state: "OH", type: "state", coverageLevel: 1, hasParcels: true, hasZoningPolygons: false, hasRulesStructured: false, hasEnvironmentalLayers: false, hasUtilityServiceAreas: false, hasSepticRules: false, lastUpdated: "2025-08-10", population: 11700000 },
  { id: "MI", name: "Michigan", state: "MI", type: "state", coverageLevel: 1, hasParcels: true, hasZoningPolygons: false, hasRulesStructured: false, hasEnvironmentalLayers: false, hasUtilityServiceAreas: false, hasSepticRules: false, lastUpdated: "2025-08-05", population: 10000000 },
  { id: "VA", name: "Virginia", state: "VA", type: "state", coverageLevel: 1, hasParcels: true, hasZoningPolygons: false, hasRulesStructured: false, hasEnvironmentalLayers: false, hasUtilityServiceAreas: false, hasSepticRules: false, lastUpdated: "2025-08-01", population: 8600000 },
  { id: "NJ", name: "New Jersey", state: "NJ", type: "state", coverageLevel: 1, hasParcels: true, hasZoningPolygons: false, hasRulesStructured: false, hasEnvironmentalLayers: false, hasUtilityServiceAreas: false, hasSepticRules: false, lastUpdated: "2025-07-25", population: 9290000 },
  { id: "MA", name: "Massachusetts", state: "MA", type: "state", coverageLevel: 1, hasParcels: true, hasZoningPolygons: false, hasRulesStructured: false, hasEnvironmentalLayers: false, hasUtilityServiceAreas: false, hasSepticRules: false, lastUpdated: "2025-07-20", population: 7030000 },
  { id: "MN", name: "Minnesota", state: "MN", type: "state", coverageLevel: 1, hasParcels: true, hasZoningPolygons: false, hasRulesStructured: false, hasEnvironmentalLayers: false, hasUtilityServiceAreas: false, hasSepticRules: false, lastUpdated: "2025-07-15", population: 5700000 },
  { id: "WI", name: "Wisconsin", state: "WI", type: "state", coverageLevel: 1, hasParcels: true, hasZoningPolygons: false, hasRulesStructured: false, hasEnvironmentalLayers: false, hasUtilityServiceAreas: false, hasSepticRules: false, lastUpdated: "2025-07-10", population: 5890000 },
  { id: "SC", name: "South Carolina", state: "SC", type: "state", coverageLevel: 1, hasParcels: true, hasZoningPolygons: false, hasRulesStructured: false, hasEnvironmentalLayers: false, hasUtilityServiceAreas: false, hasSepticRules: false, lastUpdated: "2025-07-05", population: 5120000 },
  { id: "MD", name: "Maryland", state: "MD", type: "state", coverageLevel: 1, hasParcels: true, hasZoningPolygons: false, hasRulesStructured: false, hasEnvironmentalLayers: false, hasUtilityServiceAreas: false, hasSepticRules: false, lastUpdated: "2025-07-01", population: 6180000 },
  { id: "IN", name: "Indiana", state: "IN", type: "state", coverageLevel: 1, hasParcels: true, hasZoningPolygons: false, hasRulesStructured: false, hasEnvironmentalLayers: false, hasUtilityServiceAreas: false, hasSepticRules: false, lastUpdated: "2025-06-25", population: 6790000 },
  { id: "MO", name: "Missouri", state: "MO", type: "state", coverageLevel: 1, hasParcels: true, hasZoningPolygons: false, hasRulesStructured: false, hasEnvironmentalLayers: false, hasUtilityServiceAreas: false, hasSepticRules: false, lastUpdated: "2025-06-20", population: 6150000 },

  // Level 0 — Not Available (remaining states)
  ...["AL", "AK", "AR", "CT", "DE", "HI", "IA", "KS", "KY", "LA", "ME", "MS", "NE", "NH", "NM", "ND", "OK", "RI", "SD", "VT", "WV", "WY", "DC"].map((code) => ({
    id: code,
    name: getStateName(code),
    state: code,
    type: "state" as const,
    coverageLevel: 0 as CoverageLevel,
    hasParcels: false,
    hasZoningPolygons: false,
    hasRulesStructured: false,
    hasEnvironmentalLayers: false,
    hasUtilityServiceAreas: false,
    hasSepticRules: false,
    lastUpdated: "2025-06-01",
  })),
];

// ============================================
// SAMPLE COUNTY DATA (for drill-down)
// ============================================

export const COUNTY_COVERAGE: JurisdictionEntry[] = [
  // Washington counties
  { id: "WA-snohomish", name: "Snohomish County", state: "WA", county: "Snohomish", type: "county", coverageLevel: 4, hasParcels: true, hasZoningPolygons: true, hasRulesStructured: true, hasEnvironmentalLayers: true, hasUtilityServiceAreas: true, hasSepticRules: true, lastUpdated: "2026-02-01", population: 827000 },
  { id: "WA-king", name: "King County", state: "WA", county: "King", type: "county", coverageLevel: 4, hasParcels: true, hasZoningPolygons: true, hasRulesStructured: true, hasEnvironmentalLayers: true, hasUtilityServiceAreas: true, hasSepticRules: true, lastUpdated: "2026-01-20", population: 2270000 },
  { id: "WA-pierce", name: "Pierce County", state: "WA", county: "Pierce", type: "county", coverageLevel: 3, hasParcels: true, hasZoningPolygons: true, hasRulesStructured: true, hasEnvironmentalLayers: true, hasUtilityServiceAreas: false, hasSepticRules: false, lastUpdated: "2025-12-15", population: 921000 },
  { id: "WA-clark", name: "Clark County", state: "WA", county: "Clark", type: "county", coverageLevel: 3, hasParcels: true, hasZoningPolygons: true, hasRulesStructured: true, hasEnvironmentalLayers: false, hasUtilityServiceAreas: false, hasSepticRules: false, lastUpdated: "2025-11-20", population: 503000 },
  { id: "WA-spokane", name: "Spokane County", state: "WA", county: "Spokane", type: "county", coverageLevel: 2, hasParcels: true, hasZoningPolygons: true, hasRulesStructured: false, hasEnvironmentalLayers: false, hasUtilityServiceAreas: false, hasSepticRules: false, lastUpdated: "2025-10-10", population: 539000 },
  { id: "WA-thurston", name: "Thurston County", state: "WA", county: "Thurston", type: "county", coverageLevel: 2, hasParcels: true, hasZoningPolygons: true, hasRulesStructured: false, hasEnvironmentalLayers: false, hasUtilityServiceAreas: false, hasSepticRules: false, lastUpdated: "2025-10-05", population: 294000 },

  // California counties
  { id: "CA-la", name: "Los Angeles County", state: "CA", county: "Los Angeles", type: "county", coverageLevel: 3, hasParcels: true, hasZoningPolygons: true, hasRulesStructured: true, hasEnvironmentalLayers: true, hasUtilityServiceAreas: false, hasSepticRules: false, lastUpdated: "2025-12-10", population: 10040000 },
  { id: "CA-sd", name: "San Diego County", state: "CA", county: "San Diego", type: "county", coverageLevel: 3, hasParcels: true, hasZoningPolygons: true, hasRulesStructured: true, hasEnvironmentalLayers: true, hasUtilityServiceAreas: false, hasSepticRules: false, lastUpdated: "2025-12-05", population: 3340000 },
  { id: "CA-sf", name: "San Francisco County", state: "CA", county: "San Francisco", type: "county", coverageLevel: 2, hasParcels: true, hasZoningPolygons: true, hasRulesStructured: false, hasEnvironmentalLayers: false, hasUtilityServiceAreas: false, hasSepticRules: false, lastUpdated: "2025-11-01", population: 874000 },

  // Texas counties
  { id: "TX-harris", name: "Harris County", state: "TX", county: "Harris", type: "county", coverageLevel: 2, hasParcels: true, hasZoningPolygons: true, hasRulesStructured: false, hasEnvironmentalLayers: true, hasUtilityServiceAreas: false, hasSepticRules: false, lastUpdated: "2025-11-10", population: 4730000 },
  { id: "TX-dallas", name: "Dallas County", state: "TX", county: "Dallas", type: "county", coverageLevel: 2, hasParcels: true, hasZoningPolygons: true, hasRulesStructured: false, hasEnvironmentalLayers: false, hasUtilityServiceAreas: false, hasSepticRules: false, lastUpdated: "2025-11-05", population: 2610000 },
  { id: "TX-travis", name: "Travis County", state: "TX", county: "Travis", type: "county", coverageLevel: 2, hasParcels: true, hasZoningPolygons: false, hasRulesStructured: false, hasEnvironmentalLayers: false, hasUtilityServiceAreas: false, hasSepticRules: false, lastUpdated: "2025-10-20", population: 1290000 },

  // Florida counties
  { id: "FL-miami", name: "Miami-Dade County", state: "FL", county: "Miami-Dade", type: "county", coverageLevel: 2, hasParcels: true, hasZoningPolygons: true, hasRulesStructured: false, hasEnvironmentalLayers: true, hasUtilityServiceAreas: false, hasSepticRules: false, lastUpdated: "2025-11-01", population: 2720000 },
  { id: "FL-broward", name: "Broward County", state: "FL", county: "Broward", type: "county", coverageLevel: 1, hasParcels: true, hasZoningPolygons: false, hasRulesStructured: false, hasEnvironmentalLayers: false, hasUtilityServiceAreas: false, hasSepticRules: false, lastUpdated: "2025-10-15", population: 1950000 },

  // Oregon counties
  { id: "OR-multnomah", name: "Multnomah County", state: "OR", county: "Multnomah", type: "county", coverageLevel: 3, hasParcels: true, hasZoningPolygons: true, hasRulesStructured: true, hasEnvironmentalLayers: true, hasUtilityServiceAreas: false, hasSepticRules: false, lastUpdated: "2025-12-01", population: 815000 },
  { id: "OR-clackamas", name: "Clackamas County", state: "OR", county: "Clackamas", type: "county", coverageLevel: 3, hasParcels: true, hasZoningPolygons: true, hasRulesStructured: true, hasEnvironmentalLayers: false, hasUtilityServiceAreas: false, hasSepticRules: false, lastUpdated: "2025-11-25", population: 420000 },

  // Colorado counties
  { id: "CO-denver", name: "Denver County", state: "CO", county: "Denver", type: "county", coverageLevel: 3, hasParcels: true, hasZoningPolygons: true, hasRulesStructured: true, hasEnvironmentalLayers: false, hasUtilityServiceAreas: false, hasSepticRules: false, lastUpdated: "2025-12-01", population: 715000 },
  { id: "CO-elpaso", name: "El Paso County", state: "CO", county: "El Paso", type: "county", coverageLevel: 2, hasParcels: true, hasZoningPolygons: true, hasRulesStructured: false, hasEnvironmentalLayers: false, hasUtilityServiceAreas: false, hasSepticRules: false, lastUpdated: "2025-11-10", population: 730000 },
];

// ============================================
// HELPER
// ============================================

function getStateName(code: string): string {
  const names: Record<string, string> = {
    AL: "Alabama", AK: "Alaska", AR: "Arkansas", CT: "Connecticut",
    DE: "Delaware", HI: "Hawaii", IA: "Iowa", KS: "Kansas",
    KY: "Kentucky", LA: "Louisiana", ME: "Maine", MS: "Mississippi",
    NE: "Nebraska", NH: "New Hampshire", NM: "New Mexico", ND: "North Dakota",
    OK: "Oklahoma", RI: "Rhode Island", SD: "South Dakota", VT: "Vermont",
    WV: "West Virginia", WY: "Wyoming", DC: "District of Columbia",
  };
  return names[code] || code;
}

/** Get all states with coverage info */
export function getStateCoverage(): JurisdictionEntry[] {
  return STATE_COVERAGE;
}

/** Get counties for a specific state */
export function getCountiesForState(stateCode: string): JurisdictionEntry[] {
  return COUNTY_COVERAGE.filter((c) => c.state === stateCode);
}

/** Get a specific jurisdiction */
export function getJurisdiction(id: string): JurisdictionEntry | undefined {
  return [...STATE_COVERAGE, ...COUNTY_COVERAGE].find((j) => j.id === id);
}

/** Get coverage stats */
export function getCoverageStats() {
  const states = STATE_COVERAGE;
  return {
    total: states.length,
    level4: states.filter((s) => s.coverageLevel === 4).length,
    level3: states.filter((s) => s.coverageLevel === 3).length,
    level2: states.filter((s) => s.coverageLevel === 2).length,
    level1: states.filter((s) => s.coverageLevel === 1).length,
    level0: states.filter((s) => s.coverageLevel === 0).length,
    totalCounties: COUNTY_COVERAGE.length,
  };
}

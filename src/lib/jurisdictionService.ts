// ============================================
// JURISDICTION SERVICE
// ============================================
// Point-in-jurisdiction resolution, coverage
// lookup, and coverage request handling.
// ============================================

import {
  JurisdictionEntry,
  CoverageLevel,
  getStateCoverage,
  getCountiesForState,
  getJurisdiction,
  getCoverageStats,
  COVERAGE_LEVEL_LABELS,
  COVERAGE_LEVEL_DESCRIPTIONS,
} from "./coverageData";

// ============================================
// COVERAGE REQUESTS (localStorage mock)
// ============================================

const REQUESTS_KEY = "zoning_coverage_requests";

export type CoverageRequest = {
  id: string;
  address: string;
  jurisdictionId?: string;
  intendedUse: string;
  email?: string;
  status: "pending" | "reviewed" | "planned" | "completed";
  createdAt: Date;
};

// ============================================
// PUBLIC API
// ============================================

/** Get jurisdiction by coordinates (simple state-level lookup) */
export function getJurisdictionByPoint(
  lat: number,
  lng: number
): JurisdictionEntry | null {
  // Simple bounding box check for demo
  // In production, this would use PostGIS point-in-polygon
  const stateByCoords = resolveStateFromCoords(lat, lng);
  if (!stateByCoords) return null;

  const states = getStateCoverage();
  return states.find((s) => s.state === stateByCoords) || null;
}

/** Get jurisdiction coverage level + checklist of what's available */
export function getJurisdictionCoverageDetail(jurisdictionId: string) {
  const j = getJurisdiction(jurisdictionId);
  if (!j) return null;

  return {
    ...j,
    levelLabel: COVERAGE_LEVEL_LABELS[j.coverageLevel],
    levelDescription: COVERAGE_LEVEL_DESCRIPTIONS[j.coverageLevel],
    included: getIncludedFeatures(j),
    missing: getMissingFeatures(j),
    canRunSnapshot: j.coverageLevel >= 2,
  };
}

/** Get all jurisdictions for coverage map */
export function getAllJurisdictionsForMap() {
  const states = getStateCoverage();
  return states.map((s) => ({
    id: s.id,
    name: s.name,
    state: s.state,
    coverageLevel: s.coverageLevel,
    levelLabel: COVERAGE_LEVEL_LABELS[s.coverageLevel],
    lastUpdated: s.lastUpdated,
    countyCount: getCountiesForState(s.state).length,
  }));
}

/** Submit a coverage request */
export function submitCoverageRequest(
  address: string,
  intendedUse: string,
  email?: string,
  jurisdictionId?: string
): CoverageRequest {
  const request: CoverageRequest = {
    id: `req_${Date.now()}`,
    address,
    jurisdictionId,
    intendedUse,
    email,
    status: "pending",
    createdAt: new Date(),
  };

  // Store in localStorage for demo
  if (typeof window !== "undefined") {
    const existing = localStorage.getItem(REQUESTS_KEY);
    const all: CoverageRequest[] = existing ? JSON.parse(existing) : [];
    all.push(request);
    localStorage.setItem(REQUESTS_KEY, JSON.stringify(all));
  }

  return request;
}

/** Get coverage requests */
export function getCoverageRequests(): CoverageRequest[] {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(REQUESTS_KEY);
  if (!data) return [];
  return JSON.parse(data);
}

/** Get stats for the coverage page */
export { getCoverageStats, getCountiesForState };

// ============================================
// HELPERS
// ============================================

function getIncludedFeatures(j: JurisdictionEntry): string[] {
  const features: string[] = [];
  if (j.hasParcels) features.push("Parcel geometry & boundaries");
  if (j.hasZoningPolygons) features.push("Zoning district lookup");
  if (j.hasRulesStructured) features.push("Structured zoning rules with citations");
  if (j.hasEnvironmentalLayers) features.push("Environmental & hazard overlays");
  if (j.hasUtilityServiceAreas) features.push("Utility service area data");
  if (j.hasSepticRules) features.push("Septic rules & feasibility");
  return features;
}

function getMissingFeatures(j: JurisdictionEntry): string[] {
  const missing: string[] = [];
  if (!j.hasParcels) missing.push("Parcel data not yet available");
  if (!j.hasZoningPolygons) missing.push("Zoning polygons not mapped");
  if (!j.hasRulesStructured) missing.push("Zoning rules not structured");
  if (!j.hasEnvironmentalLayers) missing.push("Environmental layers not loaded");
  if (!j.hasUtilityServiceAreas) missing.push("Utility service areas not mapped");
  if (!j.hasSepticRules) missing.push("Septic rules not structured");
  return missing;
}

/** Simple coordinate-to-state resolver for demo */
function resolveStateFromCoords(lat: number, lng: number): string | null {
  // Very rough state boundaries for demo
  if (lat >= 45.5 && lat <= 49 && lng >= -125 && lng <= -117) return "WA";
  if (lat >= 42 && lat <= 46.3 && lng >= -124.6 && lng <= -116.5) return "OR";
  if (lat >= 32.5 && lat <= 42 && lng >= -124.5 && lng <= -114.1) return "CA";
  if (lat >= 37 && lat <= 41 && lng >= -109.1 && lng <= -102) return "CO";
  if (lat >= 25.8 && lat <= 36.5 && lng >= -106.7 && lng <= -93.5) return "TX";
  if (lat >= 24.5 && lat <= 31 && lng >= -87.6 && lng <= -80) return "FL";
  if (lat >= 40.5 && lat <= 45.1 && lng >= -79.8 && lng <= -72) return "NY";
  // Default: return null (unknown)
  return null;
}

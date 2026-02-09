// ============================================
// DATA CONNECTOR INTERFACE
// ============================================
// Pluggable pattern for fetching data from
// multiple providers per jurisdiction.
// ============================================

export type Coordinates = { lat: number; lng: number };

export type DatasetType = "parcels" | "zoning" | "environmental" | "utilities" | "soils" | "boundaries";

export type SourceConfidence = "high" | "medium" | "low";
export type ProviderType = "government_gis" | "curated_provider" | "derived" | "unknown";

// ============================================
// PROVENANCE — attached to every data output
// ============================================

export interface DataProvenance {
  sourceType: "GIS" | "ordinance" | "utility_map" | "agency_page" | "PDF" | "derived";
  sourceName: string;
  sourceUrl?: string;
  sourceId?: string;
  effectiveDate?: string;
  confidence: SourceConfidence;
  lastFetched: Date;
}

// ============================================
// CANONICAL DATA MODELS
// ============================================

export interface CanonicalParcel {
  apn?: string;
  pin?: string;
  address?: string;
  owner?: string;
  areaSqft?: number;
  areaAcres?: number;
  geometry?: GeoJSON.Polygon | GeoJSON.MultiPolygon;
  provenance: DataProvenance;
}

export interface CanonicalZoning {
  districtCode: string;
  districtName: string;
  category?: string;
  description?: string;
  geometry?: GeoJSON.Polygon | GeoJSON.MultiPolygon;
  provenance: DataProvenance;
}

export interface CanonicalRule {
  ruleType: string;
  value: number | string | boolean;
  unit?: string;
  appliesTo: string[];
  ordinanceSection: string;
  ordinanceText?: string;
  provenance: DataProvenance;
}

export interface CanonicalLayer {
  layerType: string; // flood | wetland | hazard | slope | buffer
  name: string;
  geometry?: GeoJSON.Geometry;
  attributes?: Record<string, unknown>;
  provenance: DataProvenance;
}

export interface CanonicalUtilityArea {
  utilityType: "sewer" | "water" | "electric" | "gas";
  providerName: string;
  available: boolean;
  geometry?: GeoJSON.Polygon;
  provenance: DataProvenance;
}

// ============================================
// CONNECTOR INTERFACE
// ============================================

export interface DataConnector {
  /** Provider name */
  name: string;

  /** Provider type for ranking */
  providerType: ProviderType;

  /** Supported dataset types */
  supports: DatasetType[];

  /** Fetch parcel data by coordinates */
  fetchParcel(point: Coordinates): Promise<CanonicalParcel | null>;

  /** Fetch zoning data by coordinates */
  fetchZoning(point: Coordinates): Promise<CanonicalZoning | null>;

  /** Fetch environmental/hazard layers */
  fetchLayers(jurisdiction: string, layerType: string): Promise<CanonicalLayer[]>;

  /** Fetch rules for a jurisdiction + zoning code */
  fetchRules?(jurisdictionId: string, zoningCode: string): Promise<CanonicalRule[]>;

  /** Fetch utility service areas */
  fetchUtilities?(point: Coordinates): Promise<CanonicalUtilityArea[]>;
}

// ============================================
// CONNECTOR REGISTRY
// ============================================

export interface ConnectorConfig {
  connectorId: string;
  jurisdictionId: string;
  datasetType: DatasetType;
  priority: number; // higher = preferred
  config?: Record<string, unknown>;
}

/**
 * Resolve the best connector for a given jurisdiction and dataset type.
 * Uses priority ranking: government_gis > curated_provider > derived > unknown
 */
export function rankConnectors(connectors: DataConnector[]): DataConnector[] {
  const typeRank: Record<ProviderType, number> = {
    government_gis: 4,
    curated_provider: 3,
    derived: 2,
    unknown: 1,
  };

  return [...connectors].sort(
    (a, b) => (typeRank[b.providerType] || 0) - (typeRank[a.providerType] || 0)
  );
}

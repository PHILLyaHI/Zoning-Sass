// ============================================
// CORE TYPES — Zoning Intelligence Platform
// ============================================

// ============================================
// GEOGRAPHIC TYPES
// ============================================

export type Coordinates = {
  lat: number;
  lng: number;
};

export type BoundingBox = {
  north: number;
  south: number;
  east: number;
  west: number;
};

export type GeoJSONPolygon = {
  type: "Polygon";
  coordinates: number[][][];
};

export type GeoJSONMultiPolygon = {
  type: "MultiPolygon";
  coordinates: number[][][][];
};

export type GeoJSONPoint = {
  type: "Point";
  coordinates: [number, number];
};

export type GeoJSONGeometry = GeoJSONPolygon | GeoJSONMultiPolygon | GeoJSONPoint;

// ============================================
// JURISDICTION & ZONING
// ============================================

export type JurisdictionType = "city" | "county" | "township" | "special_district";

export type Jurisdiction = {
  id: string;
  name: string;
  type: JurisdictionType;
  stateCode: string;
  fipsCode?: string;
  parentJurisdictionId?: string;
  dataQuality: "verified" | "partial" | "unknown";
  lastOrdinanceUpdate?: Date;
};

export type ZoningCategory = 
  | "residential_single" 
  | "residential_multi" 
  | "commercial" 
  | "industrial" 
  | "agricultural" 
  | "mixed_use" 
  | "special" 
  | "overlay";

export type ZoningDistrict = {
  id: string;
  jurisdictionId: string;
  code: string; // e.g., "R-1", "C-2"
  name: string; // e.g., "Single Family Residential"
  category: ZoningCategory;
  description?: string;
  ordinanceSection?: string;
  effectiveDate?: Date;
};

// ============================================
// PROPERTY & PARCEL
// ============================================

export type PropertyRecord = {
  id: string;
  userId: string;
  
  // Address info
  address: string;
  addressNormalized?: string;
  city: string;
  state: string;
  zipCode?: string;
  county?: string;
  
  // Parcel info
  apn?: string;
  parcelId?: string;
  parcelGeometry?: GeoJSONPolygon | GeoJSONMultiPolygon;
  centroid: Coordinates;
  
  // Computed metrics
  areaSqft?: number;
  areaAcres?: number;
  lotWidth?: number;
  lotDepth?: number;
  
  // Zoning info
  jurisdictionId?: string;
  jurisdiction?: Jurisdiction;
  zoningDistrictId?: string;
  zoningDistrict?: ZoningDistrict;
  overlayZones?: string[];
  
  // Data freshness
  createdAt: Date;
  updatedAt: Date;
  lastAnalysisAt?: Date;
  
  // Data source tracking
  dataSources?: {
    parcel: { source: string; confidence: "high" | "medium" | "low" };
    zoning: { source: string; confidence: "high" | "medium" | "low" };
    soil?: { source: string; confidence: "high" | "medium" | "low" };
  };
  
  // Computed data
  feasibility?: FeasibilitySnapshot;
  layers?: LayerState[];
};

export type Parcel = {
  id: string;
  apn?: string;
  jurisdictionId?: string;
  geometry: GeoJSONPolygon | GeoJSONMultiPolygon;
  centroid: Coordinates;
  areaSqft?: number;
  areaAcres?: number;
  lotWidth?: number;
  lotDepth?: number;
  legalDescription?: string;
  ownerName?: string;
  source: string;
  sourceId?: string;
  fetchedAt: Date;
};

// ============================================
// LAYERS & OVERLAYS
// ============================================

export type LayerGroup = 
  | "zoning" 
  | "utilities" 
  | "septic" 
  | "environment" 
  | "hazards";

export type LayerState = {
  id: string;
  label: string;
  group: LayerGroup;
  active: boolean;
  visible?: boolean;
  opacity?: number;
};

export type OverlayData = {
  id: string;
  type: string;
  name: string;
  geometry?: GeoJSONGeometry;
  properties: Record<string, unknown>;
  source: string;
  sourceDate?: Date;
  confidence: "high" | "medium" | "low" | "unknown";
};

// ============================================
// FEASIBILITY & VALIDATION
// ============================================

export type FeasibilityStatus = "pass" | "warn" | "fail" | "unknown";

export type FeasibilityItem = {
  id: string;
  label: string;
  category: string;
  status: FeasibilityStatus;
  summary: string;
  detail?: string;
  verificationNeeded?: string[];
  citations?: Citation[];
};

export type FeasibilitySnapshot = {
  overallStatus: FeasibilityStatus;
  items: FeasibilityItem[];
  dataGaps: DataGap[];
  computedAt: Date;
};

export type DataGap = {
  id: string;
  type: "missing_rule" | "missing_data" | "stale_data" | "low_confidence";
  description: string;
  impact: string;
  suggestedAction: string;
};

export type Citation = {
  source: string;
  section?: string;
  text?: string;
  url?: string;
  lastVerified?: Date;
};

// ============================================
// ZONING RULES
// ============================================

export type RuleType = 
  | "setback_front" 
  | "setback_side" 
  | "setback_rear" 
  | "setback_street_side"
  | "height_max" 
  | "height_max_accessory"
  | "lot_coverage_max" 
  | "impervious_coverage_max"
  | "far_max" 
  | "far_min"
  | "lot_size_min" 
  | "lot_width_min" 
  | "lot_depth_min"
  | "dwelling_units_max" 
  | "density_max"
  | "use_permitted" 
  | "use_conditional" 
  | "use_prohibited"
  | "parking_required"
  | "adu_allowed" 
  | "adu_size_max" 
  | "adu_setback"
  | "structure_separation" 
  | "accessory_setback";

export type StructureType = 
  | "primary_dwelling" 
  | "adu" 
  | "dadu" 
  | "garage" 
  | "carport"
  | "shop" 
  | "barn" 
  | "pool" 
  | "deck" 
  | "patio" 
  | "shed" 
  | "other";

export type ZoningRule = {
  id: string;
  jurisdictionId: string;
  districtId?: string; // null = applies to all
  ruleType: RuleType;
  appliesTo: StructureType[];
  valueNumeric?: number;
  valueText?: string;
  valueJson?: Record<string, unknown>;
  unit?: string;
  conditionExpression?: Record<string, unknown>;
  ordinanceSection: string;
  ordinanceText?: string;
  effectiveDate?: Date;
  expirationDate?: Date;
  notes?: string;
};

// ============================================
// VALIDATION RESULTS
// ============================================

export type ValidationStatus = "pass" | "warn" | "fail";

export type ValidationCheck = {
  checkId: string;
  ruleId: string;
  ruleType: RuleType;
  structureId?: string;
  status: ValidationStatus;
  measuredValue?: number | null;
  requiredValue?: number;
  unit?: string;
  margin?: number;
  excess?: number;
  reason?: string;
  citations: Citation[];
};

export type ValidationResult = {
  id: string;
  projectId: string;
  computedAt: Date;
  overallStatus: ValidationStatus;
  buildableAreaPolygon?: GeoJSONPolygon;
  restrictedAreaPolygons?: RestrictedArea[];
  checks: ValidationCheck[];
  dataGaps: DataGap[];
  summary: {
    passingChecks: number;
    warningChecks: number;
    failingChecks: number;
    totalChecks: number;
    criticalIssues: string[];
    verificationNeeded: string[];
  };
};

export type RestrictedArea = {
  type: string;
  geometry: GeoJSONPolygon;
  source: string;
  citation?: string;
};

// ============================================
// PROJECT & STRUCTURES
// ============================================

export type ProjectStatus = "draft" | "saved" | "archived";

export type Project = {
  id: string;
  userId: string;
  propertyId: string;
  name: string;
  description?: string;
  
  // Geometry
  originalParcelGeometry?: GeoJSONPolygon | GeoJSONMultiPolygon;
  projectParcelGeometry?: GeoJSONPolygon | GeoJSONMultiPolygon;
  computedBuildableArea?: GeoJSONPolygon | GeoJSONMultiPolygon;
  computedSetbackLines?: Record<string, GeoJSONGeometry>;
  computedRestrictedAreas?: RestrictedArea[];
  
  // Structures
  structures: Structure[];
  
  // Validation
  lastValidation?: ValidationResult;
  
  // Metadata
  status: ProjectStatus;
  createdAt: Date;
  updatedAt: Date;
};

export type Structure = {
  id: string;
  projectId: string;
  structureType: StructureType;
  useType?: string;
  label?: string;
  
  // Geometry
  footprint: GeoJSONPolygon;
  footprintSqft?: number;
  
  // Dimensions
  heightFeet?: number;
  stories?: number;
  
  // For wastewater calculations
  bedrooms?: number;
  bathrooms?: number;
  
  // Computed distances (from validation)
  distanceToFront?: number;
  distanceToRear?: number;
  distanceToSide?: number;
  distanceToStreetSide?: number;
  distanceToOtherStructures?: Record<string, number>;
  
  // Metadata
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
};

// ============================================
// WASTEWATER & UTILITIES (Phase 2)
// ============================================

export type WastewaterMethod = "public_sewer" | "septic" | "unknown" | "verification_required";

export type SewerServiceArea = {
  id: string;
  jurisdictionId?: string;
  providerName: string;
  providerType: "municipal" | "district" | "private";
  geometry: GeoJSONPolygon | GeoJSONMultiPolygon;
  connectionRequired: boolean;
  connectionAvailable: boolean;
  source: string;
  sourceDate?: Date;
  confidence: "verified" | "inferred" | "unknown";
};

export type SepticFeasibility = "yes" | "conditional" | "no" | "unknown";

export type SoilUnit = {
  id: string;
  mukey: string;
  musym?: string;
  muname?: string;
  geometry: GeoJSONPolygon | GeoJSONMultiPolygon;
  septicSuitability: "well_suited" | "somewhat_limited" | "very_limited" | "not_rated";
  septicLimitations?: string[];
  drainageClass?: string;
  hydricRating?: string;
  depthToWaterTableMin?: number;
  depthToRestrictiveLayer?: number;
  floodingFrequency?: string;
  pondingFrequency?: string;
  slopeLow?: number;
  slopeHigh?: number;
};

export type ProjectWastewater = {
  id: string;
  projectId: string;
  wastewaterMethod: WastewaterMethod;
  sewerAvailable?: boolean;
  sewerRequired?: boolean;
  septicFeasible: SepticFeasibility;
  septicLimitations?: string[];
  estimatedDailyFlowGpd?: number;
  drainfieldArea?: GeoJSONPolygon;
  reserveArea?: GeoJSONPolygon;
  soilTypesPresent?: string[];
  dataGaps?: string[];
  computedAt: Date;
};

// ============================================
// ENVIRONMENTAL OVERLAYS
// ============================================

export type WetlandData = {
  id: string;
  geometry: GeoJSONPolygon | GeoJSONMultiPolygon;
  wetlandType?: string;
  classification?: string;
  source: string;
  jurisdictionId?: string;
  bufferRequiredFeet?: number;
};

export type FloodZone = {
  id: string;
  geometry: GeoJSONPolygon | GeoJSONMultiPolygon;
  zoneCode: string; // 'A', 'AE', 'X', 'VE', etc.
  zoneSubtype?: string;
  baseFloodElevation?: number;
  source: string;
  panelNumber?: string;
  effectiveDate?: Date;
};

export type HazardZone = {
  id: string;
  geometry: GeoJSONPolygon | GeoJSONMultiPolygon;
  hazardType: "wildfire" | "landslide" | "liquefaction" | "erosion" | "seismic" | "other";
  severity: "low" | "moderate" | "high" | "very_high";
  jurisdictionId?: string;
  source: string;
  sourceDate?: Date;
  notes?: string;
};

// ============================================
// AI / LLM TYPES
// ============================================

export type AIExplanationRequest = {
  context: {
    property: PropertyRecord;
    validationResult?: ValidationResult;
    rules?: ZoningRule[];
    wastewater?: ProjectWastewater;
  };
  question?: string;
  type: "explain_validation" | "answer_question" | "recommend_placement" | "summarize_wastewater";
};

export type AIExplanationResponse = {
  answer: string;
  reasoning?: string;
  nextSteps?: string[];
  citations: Citation[];
  confidence: "high" | "medium" | "low";
  dataGapsAffectingAnswer?: string[];
};

// ============================================
// API RESPONSE TYPES
// ============================================

export type APIResponse<T> = {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  meta?: {
    requestId: string;
    timestamp: Date;
    cached?: boolean;
    cacheAge?: number;
  };
};


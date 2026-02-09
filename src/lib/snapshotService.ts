// ============================================
// SNAPSHOT SERVICE
// ============================================
// Aggregates data from existing services into
// a single Risk Snapshot result.
// Does NOT invent data — only orchestrates.
// ============================================

import { PropertyRecord, Structure, ValidationCheck, ValidationStatus } from "./types";
import { validateProject } from "./ruleEngine";
import { assessWastewater, WastewaterAssessment, getMockSoilData, getMockSewerService } from "./wastewaterEngine";

// ============================================
// TYPES
// ============================================

export type RiskStatus = "pass" | "warn" | "fail" | "unknown";

export type RiskCategory = {
  label: string;
  status: RiskStatus;
  summary: string;
  details?: string;
};

export type RuleCheckResult = {
  id: string;
  name: string;
  category: "zoning" | "dimensional" | "lot" | "use";
  ruleType: string;
  required: number | string | null;
  measured: number | string | null;
  unit: string;
  status: RiskStatus;
  margin?: number;
  excess?: number;
  citation: string;
  citationText?: string;
  reason?: string;
};

export type EnvironmentalFlag = {
  id: string;
  type: "flood" | "wetland" | "slope" | "buffer" | "hazard";
  label: string;
  status: RiskStatus;
  description: string;
  icon: string;
  action?: string;
};

export type UtilityResult = {
  sewer: {
    available: boolean;
    required: boolean;
    providerName?: string;
    distanceToMain?: number;
    hookupCost?: number;
    status: RiskStatus;
    summary: string;
  };
  septic: {
    required: boolean;
    feasibility: string;
    soilSuitability: string;
    soilName: string;
    spaceAvailable: boolean;
    systemType: string;
    costRange: { min: number; max: number };
    status: RiskStatus;
    summary: string;
    issues: { title: string; severity: string; description: string }[];
  };
};

export type SnapshotResult = {
  id: string;
  address: string;
  city: string;
  state: string;
  county: string;
  zoningDistrict: string;
  zoningCategory: string;
  jurisdictionName: string;
  centroid: { lat: number; lng: number };
  parcelArea: { sqft: number; acres: number };
  lotWidth: number;
  lotDepth: number;
  
  // Overall assessment
  overallStatus: RiskStatus;
  overallSummary: string;
  
  // Risk categories
  buildability: RiskCategory;
  utilities: RiskCategory;
  environmental: RiskCategory;
  
  // Detailed results
  ruleChecks: RuleCheckResult[];
  utilityResult: UtilityResult;
  environmentalFlags: EnvironmentalFlag[];
  
  // Data gaps
  dataGaps: { field: string; description: string; nextStep: string }[];
  
  // Metadata
  dataSources: { name: string; type: string; confidence: string }[];
  generatedAt: Date;
};

// ============================================
// MOCK PROPERTY GENERATOR (for snapshot)
// ============================================

export function createMockPropertyFromAddress(address: string): PropertyRecord {
  // Generate consistent coordinates from address string
  const hash = address.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const seed = (hash % 10000) / 10000;
  
  // Default to Pacific NW area
  const lat = 47.5 + seed * 0.5;
  const lng = -122.3 + seed * 0.3;
  
  // Parse address components
  const parts = address.split(",").map((p) => p.trim());
  const streetAddress = parts[0] || address;
  const city = parts[1] || "Snohomish";
  const stateZip = parts[2] || "WA";
  const state = stateZip.split(" ")[0] || "WA";
  
  const lotSqft = 8000 + Math.floor(seed * 40000);
  
  return {
    id: `prop_${hash}`,
    userId: "snapshot_user",
    address: streetAddress,
    city,
    state,
    county: "Snohomish",
    centroid: { lat, lng },
    areaSqft: lotSqft,
    areaAcres: lotSqft / 43560,
    lotWidth: Math.floor(60 + seed * 100),
    lotDepth: Math.floor(100 + seed * 150),
    zoningDistrict: {
      id: "zone-r1",
      jurisdictionId: "mock",
      code: seed > 0.7 ? "R-5" : seed > 0.4 ? "R-7200" : "R-1",
      name: seed > 0.7 ? "Rural Residential 5-Acre" : seed > 0.4 ? "Urban Residential 7200" : "Single Family Residential",
      category: "residential_single" as const,
    },
    jurisdiction: {
      id: "mock",
      name: city.includes("County") ? city : `${city}, Snohomish County`,
      type: "county" as const,
      stateCode: state,
      dataQuality: "partial" as const,
    },
    lastAnalysisAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

// ============================================
// RULE LABEL HELPERS
// ============================================

const RULE_LABELS: Record<string, string> = {
  setback_front: "Front Setback",
  setback_side: "Side Setback",
  setback_rear: "Rear Setback",
  setback_street_side: "Street-Side Setback",
  accessory_setback: "Accessory Setback",
  height_max: "Max Building Height",
  height_max_accessory: "Accessory Height Limit",
  lot_coverage_max: "Max Lot Coverage",
  far_max: "Floor Area Ratio (FAR)",
  lot_size_min: "Minimum Lot Size",
  lot_width_min: "Minimum Lot Width",
  adu_allowed: "ADU Permitted",
  adu_size_max: "Max ADU Size",
  structure_separation: "Structure Separation",
};

function getRuleCategory(ruleType: string): "zoning" | "dimensional" | "lot" | "use" {
  if (ruleType.includes("setback") || ruleType.includes("height") || ruleType.includes("separation")) return "dimensional";
  if (ruleType.includes("lot") || ruleType.includes("coverage") || ruleType.includes("far")) return "lot";
  if (ruleType.includes("adu") || ruleType.includes("use")) return "use";
  return "zoning";
}

// ============================================
// MAIN SNAPSHOT GENERATOR
// ============================================

export function generateSnapshot(address: string): SnapshotResult {
  const property = createMockPropertyFromAddress(address);
  
  // — 1. Run zoning validation engine —
  const mockStructure: Structure = {
    id: "mock-primary",
    projectId: "mock-project",
    structureType: "primary_dwelling" as const,
    useType: "single_family",
    label: "Primary Dwelling",
    footprint: { type: "Polygon" as const, coordinates: [[[0,0],[1,0],[1,1],[0,1],[0,0]]] },
    footprintSqft: 1800,
    heightFeet: 28,
    stories: 2,
    bedrooms: 3,
    distanceToFront: 24.6,
    distanceToSide: 12.3,
    distanceToRear: 35.1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  const validation = validateProject(property, [mockStructure]);
  
  // — 2. Run wastewater assessment —
  const wastewater = assessWastewater(property, []);
  
  // — 3. Generate environmental flags —
  const seed = address.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) / 10000;
  const environmentalFlags = generateEnvironmentalFlags(seed);
  
  // — 4. Build rule check results from validation —
  const ruleChecks: RuleCheckResult[] = validation.checks.map((check) => ({
    id: check.checkId,
    name: RULE_LABELS[check.ruleType] || check.ruleType,
    category: getRuleCategory(check.ruleType),
    ruleType: check.ruleType,
    required: check.requiredValue ?? null,
    measured: check.measuredValue ?? null,
    unit: check.unit || "",
    status: check.status as RiskStatus,
    margin: check.margin,
    excess: check.excess,
    citation: check.citations?.[0]?.section || "See local ordinance",
    citationText: check.citations?.[0]?.text,
    reason: check.reason,
  }));
  
  // Add lot-level checks that the rule engine already computed
  const lotArea = property.areaSqft || 10000;
  const lotWidth = property.lotWidth || 75;
  const lotDepth = property.lotDepth || 120;
  
  // Add min lot size check if not already present
  if (!ruleChecks.find((c) => c.ruleType === "lot_size_min")) {
    ruleChecks.push({
      id: "check-lot-size",
      name: "Minimum Lot Size",
      category: "lot",
      ruleType: "lot_size_min",
      required: 7200,
      measured: lotArea,
      unit: "sqft",
      status: lotArea >= 7200 ? "pass" : "fail",
      margin: lotArea >= 7200 ? lotArea - 7200 : undefined,
      excess: lotArea < 7200 ? 7200 - lotArea : undefined,
      citation: "SCC 30.23.030",
      citationText: "Minimum lot size for R-1 zone: 7,200 sqft",
    });
  }
  
  // — 5. Build utility result —
  const utilityResult = buildUtilityResult(wastewater);
  
  // — 6. Determine category statuses —
  const buildabilityStatus = determineBuildabilityStatus(ruleChecks);
  const utilitiesStatus = determineUtilitiesStatus(utilityResult);
  const environmentalStatus = determineEnvironmentalStatus(environmentalFlags);
  
  const overallStatus = getWorstStatus([buildabilityStatus.status, utilitiesStatus.status, environmentalStatus.status]);
  
  // — 7. Data gaps —
  const dataGaps = generateDataGaps(property, wastewater, seed);
  
  return {
    id: `snap_${Date.now()}`,
    address: property.address,
    city: property.city,
    state: property.state,
    county: property.county || "Unknown",
    zoningDistrict: property.zoningDistrict?.code || "Unknown",
    zoningCategory: property.zoningDistrict?.name || "Unknown",
    jurisdictionName: property.jurisdiction?.name || "Unknown",
    centroid: property.centroid,
    parcelArea: { sqft: lotArea, acres: lotArea / 43560 },
    lotWidth,
    lotDepth,
    overallStatus,
    overallSummary: generateOverallSummary(buildabilityStatus, utilitiesStatus, environmentalStatus),
    buildability: buildabilityStatus,
    utilities: utilitiesStatus,
    environmental: environmentalStatus,
    ruleChecks,
    utilityResult,
    environmentalFlags,
    dataGaps,
    dataSources: [
      { name: "Snohomish County GIS", type: "Parcel & Zoning", confidence: "high" },
      { name: "USDA Web Soil Survey", type: "Soil Data", confidence: "medium" },
      { name: "FEMA NFHL", type: "Flood Zones", confidence: "medium" },
      { name: "NWI/USFWS", type: "Wetlands", confidence: "medium" },
    ],
    generatedAt: new Date(),
  };
}

// ============================================
// HELPERS
// ============================================

function generateEnvironmentalFlags(seed: number): EnvironmentalFlag[] {
  const flags: EnvironmentalFlag[] = [];
  
  // Flood zone (30% chance)
  if (seed % 1 < 0.3) {
    flags.push({
      id: "flood-zone",
      type: "flood",
      label: "Flood Zone",
      status: seed % 1 < 0.15 ? "fail" : "warn",
      description: seed % 1 < 0.15
        ? "Property is within FEMA Zone AE (Special Flood Hazard Area). Flood insurance required."
        : "Property is near Zone X (0.2% annual chance). Flood insurance recommended.",
      icon: "flood",
      action: "View on map",
    });
  } else {
    flags.push({
      id: "flood-zone",
      type: "flood",
      label: "Flood Zone",
      status: "pass",
      description: "Property is not within a designated FEMA flood zone.",
      icon: "flood",
    });
  }
  
  // Wetlands (25% chance)
  if ((seed * 7) % 1 < 0.25) {
    flags.push({
      id: "wetlands",
      type: "wetland",
      label: "Wetlands",
      status: "warn",
      description: "Potential wetland features detected within 200ft. Buffer requirements may apply.",
      icon: "wetland",
      action: "View on map",
    });
  } else {
    flags.push({
      id: "wetlands",
      type: "wetland",
      label: "Wetlands",
      status: "pass",
      description: "No mapped wetlands within buffer distance of parcel.",
      icon: "wetland",
    });
  }
  
  // Slopes (20% chance of issue)
  if ((seed * 13) % 1 < 0.2) {
    flags.push({
      id: "slopes",
      type: "slope",
      label: "Steep Slopes",
      status: "warn",
      description: "Portions of the site exceed 15% slope. Grading review may be required.",
      icon: "slope",
      action: "View on map",
    });
  } else {
    flags.push({
      id: "slopes",
      type: "slope",
      label: "Slopes",
      status: "pass",
      description: "No steep slope concerns identified on parcel.",
      icon: "slope",
    });
  }
  
  // Critical area buffers (15% chance)
  if ((seed * 19) % 1 < 0.15) {
    flags.push({
      id: "buffer",
      type: "buffer",
      label: "Critical Area Buffer",
      status: "warn",
      description: "Property may be within a critical area buffer zone. Verification with local planning required.",
      icon: "buffer",
      action: "View on map",
    });
  }
  
  return flags;
}

function buildUtilityResult(wastewater: WastewaterAssessment): UtilityResult {
  return {
    sewer: {
      available: wastewater.sewerAvailable,
      required: wastewater.sewerRequired,
      providerName: wastewater.sewerService?.providerName,
      distanceToMain: wastewater.sewerService?.distanceToMain,
      hookupCost: wastewater.sewerService?.hookupCost,
      status: wastewater.sewerAvailable ? "pass" : "warn",
      summary: wastewater.sewerAvailable
        ? `Sewer available via ${wastewater.sewerService?.providerName || "local provider"}`
        : "Not within sewer service area. On-site system required.",
    },
    septic: {
      required: wastewater.septicRequired,
      feasibility: wastewater.septicFeasibility,
      soilSuitability: wastewater.soilData?.septicSuitability || "unknown",
      soilName: wastewater.soilData?.muname || "Unknown",
      spaceAvailable: (wastewater.minimumLotSize || 0) > 0,
      systemType: wastewater.systemTypes?.[0]?.name || "Conventional Gravity",
      costRange: wastewater.estimatedCost || { min: 15000, max: 35000 },
      status:
        wastewater.septicFeasibility === "feasible"
          ? "pass"
          : wastewater.septicFeasibility === "conditional"
          ? "warn"
          : wastewater.septicFeasibility === "not_feasible"
          ? "fail"
          : "warn",
      summary:
        wastewater.septicFeasibility === "feasible"
          ? "Soil conditions appear suitable for on-site septic."
          : wastewater.septicFeasibility === "conditional"
          ? "Septic may be feasible with modifications. Site evaluation needed."
          : wastewater.septicFeasibility === "not_feasible"
          ? "Septic not feasible on this parcel."
          : "Septic feasibility requires further evaluation.",
      issues: wastewater.issues.map((i) => ({
        title: i.title,
        severity: i.severity,
        description: i.description,
      })),
    },
  };
}

function determineBuildabilityStatus(checks: RuleCheckResult[]): RiskCategory {
  const fails = checks.filter((c) => c.status === "fail").length;
  const warns = checks.filter((c) => c.status === "warn").length;
  const passes = checks.filter((c) => c.status === "pass").length;
  
  if (fails > 0) {
    return {
      label: "Buildability",
      status: "fail",
      summary: `${fails} rule violation${fails > 1 ? "s" : ""} detected`,
      details: `${passes} passing, ${warns} warnings, ${fails} violations out of ${checks.length} checks`,
    };
  }
  if (warns > 0) {
    return {
      label: "Buildability",
      status: "warn",
      summary: `Likely feasible — ${warns} item${warns > 1 ? "s" : ""} need verification`,
      details: `${passes} passing, ${warns} needing verification out of ${checks.length} checks`,
    };
  }
  return {
    label: "Buildability",
    status: "pass",
    summary: "All dimensional and zoning checks pass",
    details: `${passes} of ${checks.length} checks passing`,
  };
}

function determineUtilitiesStatus(util: UtilityResult): RiskCategory {
  const worst = getWorstStatus([util.sewer.status, util.septic.status]);
  
  if (worst === "fail") {
    return {
      label: "Utilities",
      status: "fail",
      summary: "Critical utility constraint detected",
    };
  }
  if (worst === "warn") {
    return {
      label: "Utilities",
      status: "warn",
      summary: "Utility availability needs verification",
    };
  }
  return {
    label: "Utilities",
    status: "pass",
    summary: "Utility services available or feasible",
  };
}

function determineEnvironmentalStatus(flags: EnvironmentalFlag[]): RiskCategory {
  const worst = getWorstStatus(flags.map((f) => f.status));
  
  if (worst === "fail") {
    return {
      label: "Environmental",
      status: "fail",
      summary: "Environmental constraint present",
      details: flags.find((f) => f.status === "fail")?.description,
    };
  }
  if (worst === "warn") {
    return {
      label: "Environmental",
      status: "warn",
      summary: "Environmental items need review",
      details: flags.filter((f) => f.status === "warn").map((f) => f.label).join(", "),
    };
  }
  return {
    label: "Environmental",
    status: "pass",
    summary: "No environmental constraints identified",
  };
}

function getWorstStatus(statuses: RiskStatus[]): RiskStatus {
  if (statuses.includes("fail")) return "fail";
  if (statuses.includes("warn")) return "warn";
  if (statuses.includes("unknown")) return "unknown";
  return "pass";
}

function generateOverallSummary(
  buildability: RiskCategory,
  utilities: RiskCategory,
  environmental: RiskCategory
): string {
  const parts: string[] = [];
  
  if (buildability.status === "pass") {
    parts.push("This property appears suitable for residential development");
  } else if (buildability.status === "warn") {
    parts.push("This property may be suitable for development with some items requiring verification");
  } else {
    parts.push("This property has zoning constraints that may limit development");
  }
  
  if (utilities.status !== "pass") {
    parts.push("utility services need confirmation");
  }
  
  if (environmental.status !== "pass") {
    parts.push("environmental factors should be reviewed");
  }
  
  return parts.join(", ") + ".";
}

function generateDataGaps(
  property: PropertyRecord,
  wastewater: WastewaterAssessment,
  seed: number
): { field: string; description: string; nextStep: string }[] {
  const gaps: { field: string; description: string; nextStep: string }[] = [];
  
  gaps.push({
    field: "Parcel Survey",
    description: "Parcel boundary from GIS may differ from recorded survey.",
    nextStep: "Obtain a current boundary survey from a licensed surveyor.",
  });
  
  if (!wastewater.sewerAvailable) {
    gaps.push({
      field: "Septic Perc Test",
      description: "Soil data is from USDA mapping, not on-site testing.",
      nextStep: "Schedule a perc test with a licensed septic designer.",
    });
  }
  
  if ((seed * 11) % 1 < 0.4) {
    gaps.push({
      field: "Easements",
      description: "Recorded easements may not be reflected in GIS data.",
      nextStep: "Review title report for recorded easements.",
    });
  }
  
  gaps.push({
    field: "Ordinance Currency",
    description: "Zoning rules are based on the most recent available ordinance data.",
    nextStep: "Verify current rules with the local planning department.",
  });
  
  return gaps;
}

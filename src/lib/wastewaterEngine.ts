// ============================================
// WASTEWATER & SEPTIC RULE ENGINE
// ============================================
// Deterministic validation for on-site sewage systems

import { PropertyRecord, Structure } from "./types";

// ============================================
// TYPES
// ============================================

export type SoilData = {
  mukey: string;
  musym: string;
  muname: string;
  septicSuitability: "well_suited" | "somewhat_limited" | "very_limited" | "not_rated";
  septicLimitations: string[];
  drainageClass: "excessively_drained" | "well_drained" | "moderately_well_drained" | "somewhat_poorly_drained" | "poorly_drained" | "very_poorly_drained";
  hydricRating: "hydric" | "predominantly_hydric" | "partially_hydric" | "not_hydric";
  depthToWaterTableMin: number; // inches
  depthToRestrictiveLayer: number; // inches
  slopeLow: number; // percent
  slopeHigh: number; // percent
  percRate?: number; // minutes per inch (from perc test)
};

export type SewerServiceArea = {
  providerName: string;
  providerType: "municipal" | "utility_district" | "private";
  connectionRequired: boolean;
  connectionAvailable: boolean;
  distanceToMain?: number; // feet
  hookupCost?: number;
  monthlyRate?: number;
};

export type WastewaterAssessment = {
  sewerAvailable: boolean;
  sewerRequired: boolean;
  sewerService?: SewerServiceArea;
  septicRequired: boolean;
  septicFeasibility: "feasible" | "conditional" | "challenging" | "not_feasible" | "unknown";
  soilData?: SoilData;
  systemTypes: SepticSystemType[];
  estimatedCost: { min: number; max: number };
  requiredSetbacks: SepticSetback[];
  minimumLotSize: number; // sqft
  issues: WastewaterIssue[];
  recommendations: string[];
  permitRequirements: string[];
  citations: { source: string; section?: string }[];
};

export type SepticSystemType = {
  name: string;
  code: string;
  description: string;
  suitability: "recommended" | "acceptable" | "not_recommended";
  costRange: { min: number; max: number };
  areaRequired: number; // sqft
  maintenanceLevel: "low" | "medium" | "high";
};

export type SepticSetback = {
  from: string;
  distance: number;
  unit: "feet";
  type: "tank" | "drainfield" | "both";
};

export type WastewaterIssue = {
  id: string;
  severity: "critical" | "major" | "minor" | "info";
  category: "soil" | "water_table" | "slope" | "setback" | "lot_size" | "environmental";
  title: string;
  description: string;
  impact: string;
  mitigation?: string;
};

// ============================================
// MOCK DATA GENERATORS
// ============================================

export function getMockSoilData(lat: number, lng: number): SoilData {
  // Generate consistent mock soil based on coordinates
  const seed = Math.abs(Math.sin(lat * 1000 + lng * 100));
  
  const suitabilities: SoilData["septicSuitability"][] = [
    "well_suited", "somewhat_limited", "somewhat_limited", "very_limited"
  ];
  const drainageClasses: SoilData["drainageClass"][] = [
    "well_drained", "moderately_well_drained", "somewhat_poorly_drained", "poorly_drained"
  ];
  
  const suitabilityIndex = Math.floor(seed * 4);
  const drainageIndex = Math.floor((seed * 10) % 4);
  
  const limitations: string[] = [];
  if (suitabilityIndex >= 2) limitations.push("Slow percolation");
  if (drainageIndex >= 2) limitations.push("High water table");
  if (seed > 0.7) limitations.push("Restrictive layer");
  if (seed > 0.8) limitations.push("Steep slopes");
  
  return {
    mukey: `SOIL-${Math.floor(seed * 100000)}`,
    musym: ["AlB", "EvC", "ToA", "RaD"][suitabilityIndex],
    muname: ["Alderwood gravelly sandy loam", "Everett very gravelly sandy loam", "Tokul silt loam", "Ragnar fine sandy loam"][suitabilityIndex],
    septicSuitability: suitabilities[suitabilityIndex],
    septicLimitations: limitations,
    drainageClass: drainageClasses[drainageIndex],
    hydricRating: drainageIndex >= 3 ? "partially_hydric" : "not_hydric",
    depthToWaterTableMin: 24 + Math.floor(seed * 60), // 24-84 inches
    depthToRestrictiveLayer: 30 + Math.floor(seed * 50), // 30-80 inches
    slopeLow: Math.floor(seed * 5),
    slopeHigh: 5 + Math.floor(seed * 20),
  };
}

export function getMockSewerService(lat: number, lng: number): SewerServiceArea | null {
  // Simulate sewer availability - more likely in urban areas
  const seed = Math.abs(Math.cos(lat * 500 + lng * 200));
  
  // 30% chance of sewer being available
  if (seed > 0.3) return null;
  
  return {
    providerName: seed < 0.15 ? "City of Seattle" : "King County Sewer District",
    providerType: seed < 0.15 ? "municipal" : "utility_district",
    connectionRequired: true,
    connectionAvailable: true,
    distanceToMain: Math.floor(seed * 500), // 0-500 feet
    hookupCost: 5000 + Math.floor(seed * 15000),
    monthlyRate: 50 + Math.floor(seed * 100),
  };
}

// ============================================
// ASSESSMENT ENGINE
// ============================================

export function assessWastewater(
  property: PropertyRecord,
  structures: Structure[] = []
): WastewaterAssessment {
  const lat = property.centroid.lat;
  const lng = property.centroid.lng;
  
  // Get data
  const soilData = getMockSoilData(lat, lng);
  const sewerService = getMockSewerService(lat, lng);
  
  const issues: WastewaterIssue[] = [];
  const recommendations: string[] = [];
  const permitRequirements: string[] = [];
  const citations: { source: string; section?: string }[] = [];
  
  // Determine if sewer is available/required
  const sewerAvailable = sewerService !== null;
  const sewerRequired = sewerService?.connectionRequired ?? false;
  
  // If sewer is required, septic is not an option
  if (sewerRequired && sewerAvailable) {
    return {
      sewerAvailable: true,
      sewerRequired: true,
      sewerService,
      septicRequired: false,
      septicFeasibility: "not_feasible",
      soilData,
      systemTypes: [],
      estimatedCost: { 
        min: sewerService.hookupCost || 5000, 
        max: (sewerService.hookupCost || 5000) + 10000 
      },
      requiredSetbacks: [],
      minimumLotSize: 0,
      issues: [{
        id: "sewer-required",
        severity: "info",
        category: "environmental",
        title: "Sewer Connection Required",
        description: `Property is within ${sewerService.providerName} service area.`,
        impact: "On-site septic system is not permitted.",
      }],
      recommendations: [
        "Contact sewer provider for connection requirements",
        "Obtain sewer connection permit before building permit",
      ],
      permitRequirements: [
        "Sewer connection permit from provider",
        "Side sewer installation permit",
      ],
      citations: [{ source: "Local Health Code", section: "Connection Requirement" }],
    };
  }
  
  // Assess septic feasibility
  let septicFeasibility: WastewaterAssessment["septicFeasibility"] = "feasible";
  
  // Check lot size
  const lotSizeSqft = property.areaSqft || 10000;
  const minimumLotSize = 7500; // Typical minimum for septic
  
  if (lotSizeSqft < minimumLotSize) {
    septicFeasibility = "not_feasible";
    issues.push({
      id: "lot-too-small",
      severity: "critical",
      category: "lot_size",
      title: "Insufficient Lot Size",
      description: `Lot is ${lotSizeSqft.toLocaleString()} sqft. Minimum ${minimumLotSize.toLocaleString()} sqft required.`,
      impact: "Standard septic system cannot be installed.",
      mitigation: "Consider alternative systems or lot combination.",
    });
  }
  
  // Check soil suitability
  if (soilData.septicSuitability === "very_limited") {
    if (septicFeasibility === "feasible") septicFeasibility = "challenging";
    issues.push({
      id: "poor-soil",
      severity: "major",
      category: "soil",
      title: "Poor Soil Suitability",
      description: `Soil type ${soilData.musym} (${soilData.muname}) has limited septic suitability.`,
      impact: "Alternative system type may be required.",
      mitigation: "Engineered system design, possible mound or sand filter.",
    });
  } else if (soilData.septicSuitability === "somewhat_limited") {
    if (septicFeasibility === "feasible") septicFeasibility = "conditional";
    issues.push({
      id: "limited-soil",
      severity: "minor",
      category: "soil",
      title: "Soil Limitations Present",
      description: `Soil has some limitations: ${soilData.septicLimitations.join(", ")}.`,
      impact: "May require modified system design.",
    });
  }
  
  // Check water table
  if (soilData.depthToWaterTableMin < 36) {
    if (septicFeasibility === "feasible") septicFeasibility = "conditional";
    issues.push({
      id: "high-water-table",
      severity: "major",
      category: "water_table",
      title: "High Water Table",
      description: `Seasonal high water table at ${soilData.depthToWaterTableMin} inches.`,
      impact: "Mound or pressure distribution system may be required.",
      mitigation: "Raised drainfield or alternative system design.",
    });
  }
  
  // Check slope
  if (soilData.slopeHigh > 30) {
    if (septicFeasibility === "feasible") septicFeasibility = "challenging";
    issues.push({
      id: "steep-slope",
      severity: "major",
      category: "slope",
      title: "Steep Slope",
      description: `Slopes up to ${soilData.slopeHigh}% present on site.`,
      impact: "Drainfield placement limited, erosion risk.",
      mitigation: "Pressure distribution system, careful site selection.",
    });
  } else if (soilData.slopeHigh > 15) {
    issues.push({
      id: "moderate-slope",
      severity: "minor",
      category: "slope",
      title: "Moderate Slope",
      description: `Slopes up to ${soilData.slopeHigh}% may affect drainfield layout.`,
      impact: "Site evaluation needed for optimal placement.",
    });
  }
  
  // Check hydric soils
  if (soilData.hydricRating === "hydric" || soilData.hydricRating === "predominantly_hydric") {
    septicFeasibility = "not_feasible";
    issues.push({
      id: "hydric-soil",
      severity: "critical",
      category: "environmental",
      title: "Hydric Soils Present",
      description: "Site contains hydric (wetland) soils.",
      impact: "Septic systems prohibited in wetland areas.",
      mitigation: "Delineate wetland boundary, locate system in upland area.",
    });
  }
  
  // Determine suitable system types
  const systemTypes = getRecommendedSystems(soilData, lotSizeSqft);
  
  // Calculate cost estimate
  const estimatedCost = calculateCostEstimate(systemTypes, septicFeasibility);
  
  // Standard setbacks
  const requiredSetbacks: SepticSetback[] = [
    { from: "Property line", distance: 10, unit: "feet", type: "both" },
    { from: "Well", distance: 100, unit: "feet", type: "drainfield" },
    { from: "Well", distance: 50, unit: "feet", type: "tank" },
    { from: "Building foundation", distance: 10, unit: "feet", type: "tank" },
    { from: "Building foundation", distance: 20, unit: "feet", type: "drainfield" },
    { from: "Surface water", distance: 100, unit: "feet", type: "drainfield" },
    { from: "Steep slope (>40%)", distance: 50, unit: "feet", type: "drainfield" },
  ];
  
  // Add recommendations
  recommendations.push(
    "Schedule site evaluation with licensed designer",
    "Conduct perc test to verify soil percolation rate",
    "Verify setbacks from wells, water bodies, and property lines",
  );
  
  if (septicFeasibility === "conditional" || septicFeasibility === "challenging") {
    recommendations.push(
      "Consider pre-application meeting with health department",
      "Budget for potential alternative system requirements",
    );
  }
  
  // Permit requirements
  permitRequirements.push(
    "On-site sewage system permit (health department)",
    "Perc test conducted by licensed professional",
    "Site plan showing setbacks and system location",
    "Designer's certification (for alternative systems)",
  );
  
  // Citations
  citations.push(
    { source: "WAC 246-272A", section: "On-Site Sewage Systems" },
    { source: "Local Health Code", section: "Sewage Disposal" },
    { source: "NRCS Web Soil Survey", section: soilData.mukey },
  );
  
  return {
    sewerAvailable,
    sewerRequired,
    sewerService: sewerService || undefined,
    septicRequired: !sewerAvailable,
    septicFeasibility,
    soilData,
    systemTypes,
    estimatedCost,
    requiredSetbacks,
    minimumLotSize,
    issues,
    recommendations,
    permitRequirements,
    citations,
  };
}

function getRecommendedSystems(soilData: SoilData, lotSize: number): SepticSystemType[] {
  const systems: SepticSystemType[] = [];
  
  // Conventional gravity system
  if (soilData.septicSuitability === "well_suited" && soilData.depthToWaterTableMin >= 48) {
    systems.push({
      name: "Conventional Gravity System",
      code: "TYPE-1",
      description: "Standard septic tank with gravity-fed drainfield trenches.",
      suitability: "recommended",
      costRange: { min: 15000, max: 25000 },
      areaRequired: 1500,
      maintenanceLevel: "low",
    });
  }
  
  // Pressure distribution
  if (soilData.septicSuitability !== "very_limited" && lotSize >= 10000) {
    systems.push({
      name: "Pressure Distribution System",
      code: "TYPE-2",
      description: "Pump-dosed even distribution for better treatment in marginal soils.",
      suitability: soilData.septicSuitability === "well_suited" ? "acceptable" : "recommended",
      costRange: { min: 20000, max: 35000 },
      areaRequired: 1200,
      maintenanceLevel: "medium",
    });
  }
  
  // Mound system
  if (soilData.depthToWaterTableMin < 48 || soilData.depthToRestrictiveLayer < 48) {
    systems.push({
      name: "Mound System",
      code: "TYPE-3",
      description: "Raised drainfield for sites with high water table or restrictive layer.",
      suitability: "recommended",
      costRange: { min: 25000, max: 45000 },
      areaRequired: 2500,
      maintenanceLevel: "medium",
    });
  }
  
  // Sand filter
  if (soilData.septicSuitability === "very_limited" || soilData.septicSuitability === "somewhat_limited") {
    systems.push({
      name: "Sand Filter System",
      code: "TYPE-4",
      description: "Engineered treatment for poor soil conditions.",
      suitability: soilData.septicSuitability === "very_limited" ? "recommended" : "acceptable",
      costRange: { min: 30000, max: 50000 },
      areaRequired: 800,
      maintenanceLevel: "high",
    });
  }
  
  // ATU (Aerobic Treatment Unit)
  systems.push({
    name: "Aerobic Treatment Unit (ATU)",
    code: "TYPE-5",
    description: "Advanced treatment for challenging sites or enhanced effluent quality.",
    suitability: lotSize < 10000 ? "recommended" : "acceptable",
    costRange: { min: 18000, max: 30000 },
    areaRequired: 400,
    maintenanceLevel: "high",
  });
  
  return systems.sort((a, b) => {
    const order = { recommended: 0, acceptable: 1, not_recommended: 2 };
    return order[a.suitability] - order[b.suitability];
  });
}

function calculateCostEstimate(
  systems: SepticSystemType[],
  feasibility: WastewaterAssessment["septicFeasibility"]
): { min: number; max: number } {
  if (systems.length === 0) {
    return { min: 0, max: 0 };
  }
  
  // Use recommended systems for estimate
  const recommended = systems.filter(s => s.suitability === "recommended");
  const toUse = recommended.length > 0 ? recommended : systems;
  
  const min = Math.min(...toUse.map(s => s.costRange.min));
  const max = Math.max(...toUse.map(s => s.costRange.max));
  
  // Add contingency for challenging sites
  const multiplier = feasibility === "challenging" ? 1.3 : feasibility === "conditional" ? 1.15 : 1;
  
  return {
    min: Math.round(min * multiplier),
    max: Math.round(max * multiplier),
  };
}




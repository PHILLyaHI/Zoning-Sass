// ============================================
// ACTION CHECKLIST ENGINE
// ============================================
// Deterministic mapping: SnapshotResult → PropertyActionItem[]
// NO AI decisions. Citation-backed. Data gaps explicit.
// ============================================

import { SnapshotResult, RiskStatus } from "./snapshotService";

// ============================================
// TYPES
// ============================================

export type ActionStatus = "ALLOWED" | "CONDITIONAL" | "RESTRICTED" | "UNKNOWN";

export type ActionCategory =
  | "residential"
  | "accessory"
  | "lot"
  | "utilities"
  | "environmental"
  | "permits";

export const CATEGORY_LABELS: Record<ActionCategory, string> = {
  residential: "Residential Use",
  accessory: "Accessory Structures",
  lot: "Lot Modifications",
  utilities: "Utilities & Wastewater",
  environmental: "Environmental & Hazards",
  permits: "Permits & Verification",
};

export const CATEGORY_ICONS: Record<ActionCategory, string> = {
  residential: "home",
  accessory: "building",
  lot: "grid",
  utilities: "water",
  environmental: "shield",
  permits: "clipboard",
};

export interface PropertyActionItem {
  id: string;
  category: ActionCategory;
  actionName: string;
  status: ActionStatus;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  summary: string;
  conditions?: string[];
  blockingFactors?: string[];
  nextSteps?: string[];
  citations?: { label: string; source: string }[];
  dataGaps?: string[];
}

// ============================================
// STATUS HELPERS
// ============================================

function riskToConfidence(status: RiskStatus): "HIGH" | "MEDIUM" | "LOW" {
  if (status === "pass") return "HIGH";
  if (status === "warn") return "MEDIUM";
  return "LOW";
}

// ============================================
// MAIN ENGINE
// ============================================

export function generateActionChecklist(snapshot: SnapshotResult): PropertyActionItem[] {
  const items: PropertyActionItem[] = [];

  // === RESIDENTIAL USE ===
  items.push(generateBuildHomeItem(snapshot));
  items.push(generateMultiFamilyItem(snapshot));

  // === ACCESSORY STRUCTURES ===
  items.push(generateAduItem(snapshot));
  items.push(generateDaduItem(snapshot));
  items.push(generateGarageItem(snapshot));
  items.push(generatePoolItem(snapshot));

  // === LOT MODIFICATIONS ===
  items.push(generateSubdivideItem(snapshot));
  items.push(generateLotLineAdjustmentItem(snapshot));

  // === UTILITIES & WASTEWATER ===
  items.push(generateSewerItem(snapshot));
  items.push(generateSepticItem(snapshot));

  // === ENVIRONMENTAL ===
  items.push(generateFloodZoneItem(snapshot));
  items.push(generateWetlandItem(snapshot));

  // === PERMITS ===
  items.push(generateBuildingPermitItem(snapshot));
  items.push(generateEnvironmentalReviewItem(snapshot));

  return items;
}

// ============================================
// RESIDENTIAL USE
// ============================================

function generateBuildHomeItem(s: SnapshotResult): PropertyActionItem {
  const setbackChecks = s.ruleChecks.filter((c) =>
    c.ruleType.includes("setback") || c.ruleType.includes("height") || c.ruleType.includes("coverage") || c.ruleType.includes("far")
  );
  const allPass = setbackChecks.every((c) => c.status === "pass");
  const anyFail = setbackChecks.some((c) => c.status === "fail");
  const failedRules = setbackChecks.filter((c) => c.status === "fail");
  const warnRules = setbackChecks.filter((c) => c.status === "warn");

  const citations = setbackChecks
    .filter((c) => c.citation)
    .slice(0, 3)
    .map((c) => ({ label: c.name, source: c.citation }));

  if (allPass) {
    return {
      id: "build-home",
      category: "residential",
      actionName: "Build a Single-Family Home",
      status: "ALLOWED",
      confidence: "HIGH",
      summary: `The ${s.zoningDistrict} zoning district permits a single-family residence. All setback, height, and coverage requirements can be met within the ${s.parcelArea.sqft.toLocaleString()} sqft buildable area.`,
      citations,
    };
  }

  if (anyFail) {
    return {
      id: "build-home",
      category: "residential",
      actionName: "Build a Single-Family Home",
      status: "CONDITIONAL",
      confidence: "MEDIUM",
      summary: `A single-family home is permitted in ${s.zoningDistrict}, but ${failedRules.length} dimensional requirement${failedRules.length > 1 ? "s" : ""} may constrain placement.`,
      conditions: failedRules.map((r) => `${r.name}: required ${r.required} ${r.unit}, current capacity needs verification`),
      nextSteps: [
        "Review setback requirements with local planning department",
        "Consider variance application if needed",
        "Consult with architect on structure placement",
      ],
      citations,
    };
  }

  return {
    id: "build-home",
    category: "residential",
    actionName: "Build a Single-Family Home",
    status: warnRules.length > 0 ? "CONDITIONAL" : "ALLOWED",
    confidence: warnRules.length > 0 ? "MEDIUM" : "HIGH",
    summary: `Single-family residential use appears permitted in ${s.zoningDistrict}. ${warnRules.length > 0 ? `${warnRules.length} item(s) need verification.` : ""}`,
    conditions: warnRules.length > 0 ? warnRules.map((r) => `${r.name}: needs verification`) : undefined,
    citations,
  };
}

function generateMultiFamilyItem(s: SnapshotResult): PropertyActionItem {
  const isResidentialSingle = s.zoningCategory?.toLowerCase().includes("single");

  if (isResidentialSingle) {
    return {
      id: "multi-family",
      category: "residential",
      actionName: "Build Multi-Family Housing",
      status: "RESTRICTED",
      confidence: "HIGH",
      summary: `Multi-family housing is not permitted in the ${s.zoningDistrict} single-family residential zone.`,
      blockingFactors: [`Zoning district ${s.zoningDistrict} restricts use to single-family residential`],
      nextSteps: ["Apply for a zone change or rezone through local planning", "Check if planned unit development (PUD) overlay is available"],
      citations: [{ label: "Zoning District Use Table", source: `${s.zoningDistrict} Permitted Uses` }],
    };
  }

  return {
    id: "multi-family",
    category: "residential",
    actionName: "Build Multi-Family Housing",
    status: "UNKNOWN",
    confidence: "LOW",
    summary: "Multi-family use permissions could not be determined from available data.",
    dataGaps: ["Permitted use table not available for this zoning district"],
    nextSteps: ["Contact local planning department to confirm permitted uses"],
  };
}

// ============================================
// ACCESSORY STRUCTURES
// ============================================

function generateAduItem(s: SnapshotResult): PropertyActionItem {
  const aduRule = s.ruleChecks.find((c) => c.ruleType === "adu_allowed" || c.ruleType === "adu_size_max");
  const coverageRule = s.ruleChecks.find((c) => c.ruleType === "lot_coverage_max");
  const lotSize = s.parcelArea.sqft;

  if (aduRule && lotSize >= 7500) {
    const coverageTight = coverageRule && coverageRule.status !== "pass";

    return {
      id: "adu",
      category: "accessory",
      actionName: "Add an ADU",
      status: coverageTight ? "CONDITIONAL" : "ALLOWED",
      confidence: coverageTight ? "MEDIUM" : "HIGH",
      summary: `ADUs are permitted in ${s.zoningDistrict} on lots of 7,500+ sqft. Your lot is ${lotSize.toLocaleString()} sqft. Max ADU size: 1,000 sqft or 50% of primary dwelling.`,
      conditions: coverageTight ? ["Lot coverage may be tight — verify total coverage with ADU footprint added"] : undefined,
      nextSteps: coverageTight
        ? ["Calculate total lot coverage with proposed ADU", "Verify utility connections for ADU"]
        : ["Obtain ADU building permit", "Verify utility capacity"],
      citations: aduRule.citation ? [{ label: "ADU Regulations", source: aduRule.citation }] : undefined,
    };
  }

  if (lotSize < 7500) {
    return {
      id: "adu",
      category: "accessory",
      actionName: "Add an ADU",
      status: "RESTRICTED",
      confidence: "HIGH",
      summary: `ADUs typically require a minimum lot size of 7,500 sqft. This lot is ${lotSize.toLocaleString()} sqft.`,
      blockingFactors: ["Lot size below minimum for ADU"],
      nextSteps: ["Verify minimum lot size requirements with local planning", "Consider attached ADU as alternative if allowed"],
    };
  }

  return {
    id: "adu",
    category: "accessory",
    actionName: "Add an ADU",
    status: "UNKNOWN",
    confidence: "LOW",
    summary: "ADU regulations could not be determined from available data.",
    dataGaps: ["ADU regulations not structured for this jurisdiction"],
    nextSteps: ["Contact local planning for ADU requirements"],
  };
}

function generateDaduItem(s: SnapshotResult): PropertyActionItem {
  const lotSize = s.parcelArea.sqft;

  if (lotSize >= 10000) {
    return {
      id: "dadu",
      category: "accessory",
      actionName: "Add a Detached ADU (DADU)",
      status: "CONDITIONAL",
      confidence: "MEDIUM",
      summary: `Lot size (${lotSize.toLocaleString()} sqft) may support a detached ADU. Subject to setback, coverage, and separation requirements.`,
      conditions: [
        "Must meet all accessory structure setbacks",
        "Must maintain minimum 6ft structure separation",
        "Total lot coverage must remain within limits",
      ],
      nextSteps: [
        "Verify DADU-specific regulations with planning department",
        "Confirm utility connections available",
        "Check fire access requirements",
      ],
    };
  }

  return {
    id: "dadu",
    category: "accessory",
    actionName: "Add a Detached ADU (DADU)",
    status: "RESTRICTED",
    confidence: "MEDIUM",
    summary: `Lot size (${lotSize.toLocaleString()} sqft) may be insufficient for a detached ADU.`,
    blockingFactors: ["Lot may not meet minimum size for detached accessory dwelling"],
    nextSteps: ["Check minimum lot requirements for DADU with local planning"],
  };
}

function generateGarageItem(s: SnapshotResult): PropertyActionItem {
  const coverageRule = s.ruleChecks.find((c) => c.ruleType === "lot_coverage_max");
  const coverageOk = !coverageRule || coverageRule.status === "pass";

  return {
    id: "garage",
    category: "accessory",
    actionName: "Build a Detached Garage",
    status: coverageOk ? "ALLOWED" : "CONDITIONAL",
    confidence: coverageOk ? "HIGH" : "MEDIUM",
    summary: `Detached garages are generally permitted as accessory structures in ${s.zoningDistrict}. ${!coverageOk ? "Lot coverage should be verified." : ""}`,
    conditions: !coverageOk ? ["Total lot coverage must remain within maximum limits"] : undefined,
    nextSteps: ["Obtain building permit", "Verify accessory structure setback requirements (typically 5ft)"],
    citations: coverageRule?.citation ? [{ label: "Coverage Limits", source: coverageRule.citation }] : undefined,
  };
}

function generatePoolItem(s: SnapshotResult): PropertyActionItem {
  return {
    id: "pool",
    category: "accessory",
    actionName: "Install a Swimming Pool",
    status: "CONDITIONAL",
    confidence: "MEDIUM",
    summary: "Pools are typically permitted as accessory uses with specific setback and fencing requirements.",
    conditions: [
      "Pool must meet accessory structure setback requirements",
      "Perimeter fencing (typically 4ft+) is required",
      "Electrical permits required for pool equipment",
    ],
    nextSteps: [
      "Verify pool setback requirements",
      "Obtain pool/mechanical permit",
      "Confirm fencing requirements with building department",
    ],
  };
}

// ============================================
// LOT MODIFICATIONS
// ============================================

function generateSubdivideItem(s: SnapshotResult): PropertyActionItem {
  const lotMinRule = s.ruleChecks.find((c) => c.ruleType === "lot_size_min");
  const minLotSize = lotMinRule?.required as number || 7200;
  const canSubdivide = s.parcelArea.sqft >= minLotSize * 2;

  if (canSubdivide) {
    return {
      id: "subdivide",
      category: "lot",
      actionName: "Subdivide the Lot",
      status: "CONDITIONAL",
      confidence: "MEDIUM",
      summary: `Lot area (${s.parcelArea.sqft.toLocaleString()} sqft) is large enough to potentially subdivide into two conforming lots (min ${minLotSize.toLocaleString()} sqft each).`,
      conditions: [
        "Both resulting lots must meet minimum size requirements",
        "Both lots must have street frontage or access",
        "Infrastructure (utilities, roads) must serve both lots",
        "Plat approval required from local jurisdiction",
      ],
      nextSteps: [
        "Consult with local planning on subdivision requirements",
        "Hire a licensed surveyor for preliminary plat",
        "Verify utility capacity for two parcels",
        "Submit subdivision application",
      ],
      citations: lotMinRule?.citation ? [{ label: "Minimum Lot Size", source: lotMinRule.citation }] : undefined,
    };
  }

  return {
    id: "subdivide",
    category: "lot",
    actionName: "Subdivide the Lot",
    status: "RESTRICTED",
    confidence: "HIGH",
    summary: `Lot area (${s.parcelArea.sqft.toLocaleString()} sqft) is below the minimum needed to create two conforming lots (${(minLotSize * 2).toLocaleString()} sqft required).`,
    blockingFactors: ["Insufficient lot area for subdivision"],
    citations: lotMinRule?.citation ? [{ label: "Minimum Lot Size", source: lotMinRule.citation }] : undefined,
  };
}

function generateLotLineAdjustmentItem(s: SnapshotResult): PropertyActionItem {
  return {
    id: "lot-line-adjustment",
    category: "lot",
    actionName: "Lot Line Adjustment",
    status: "CONDITIONAL",
    confidence: "MEDIUM",
    summary: "Lot line adjustments between adjacent parcels are generally permitted subject to resulting lots meeting all dimensional standards.",
    conditions: [
      "Both resulting parcels must meet minimum lot size",
      "Both parcels must meet setback requirements",
      "No new non-conformities created",
    ],
    nextSteps: [
      "Consult with planning department on lot line adjustment process",
      "Hire surveyor to prepare boundary adjustment survey",
      "Submit application with both property owners' consent",
    ],
  };
}

// ============================================
// UTILITIES & WASTEWATER
// ============================================

function generateSewerItem(s: SnapshotResult): PropertyActionItem {
  const sewer = s.utilityResult.sewer;

  if (sewer.available) {
    return {
      id: "sewer-connect",
      category: "utilities",
      actionName: "Connect to Public Sewer",
      status: "ALLOWED",
      confidence: "HIGH",
      summary: `Public sewer service is available${sewer.providerName ? ` via ${sewer.providerName}` : ""}. ${sewer.hookupCost ? `Estimated hookup cost: $${sewer.hookupCost.toLocaleString()}.` : ""}`,
      nextSteps: [
        "Contact sewer provider for connection requirements",
        "Obtain sewer connection permit",
        `${sewer.distanceToMain ? `Run lateral to main (est. ${sewer.distanceToMain}ft)` : "Determine distance to sewer main"}`,
      ],
    };
  }

  return {
    id: "sewer-connect",
    category: "utilities",
    actionName: "Connect to Public Sewer",
    status: "RESTRICTED",
    confidence: "MEDIUM",
    summary: "Property is not within a public sewer service area. On-site wastewater system required.",
    blockingFactors: ["Not within sewer service boundary"],
    nextSteps: ["Verify sewer availability with local utility district", "Evaluate on-site septic system options"],
  };
}

function generateSepticItem(s: SnapshotResult): PropertyActionItem {
  const septic = s.utilityResult.septic;

  if (s.utilityResult.sewer.available && s.utilityResult.sewer.required) {
    return {
      id: "septic-install",
      category: "utilities",
      actionName: "Install Septic System",
      status: "RESTRICTED",
      confidence: "HIGH",
      summary: "Property is within a sewer service area where connection is required. On-site septic is not permitted.",
      blockingFactors: ["Sewer connection required in this service area"],
    };
  }

  if (septic.status === "pass") {
    return {
      id: "septic-install",
      category: "utilities",
      actionName: "Install Septic System",
      status: "ALLOWED",
      confidence: "MEDIUM",
      summary: `Soil conditions appear suitable for an on-site septic system. Likely system type: ${septic.systemType}. Estimated cost: $${septic.costRange.min.toLocaleString()}-$${septic.costRange.max.toLocaleString()}.`,
      nextSteps: [
        "Schedule a perc test with licensed septic designer",
        "Obtain septic system permit from health department",
        "Complete site evaluation and system design",
      ],
    };
  }

  if (septic.status === "warn") {
    return {
      id: "septic-install",
      category: "utilities",
      actionName: "Install Septic System",
      status: "CONDITIONAL",
      confidence: "LOW",
      summary: `Septic feasibility is ${septic.feasibility}. Soil type: ${septic.soilName}. ${septic.issues.length > 0 ? `${septic.issues.length} issue(s) identified.` : ""}`,
      conditions: septic.issues.map((i) => i.description),
      nextSteps: [
        "Schedule site evaluation with licensed septic designer",
        "Conduct perc test to verify soil percolation rate",
        "Contact county health department for system requirements",
        "Consider alternative system types if conventional is not feasible",
      ],
    };
  }

  return {
    id: "septic-install",
    category: "utilities",
    actionName: "Install Septic System",
    status: septic.status === "fail" ? "RESTRICTED" : "UNKNOWN",
    confidence: "LOW",
    summary: septic.status === "fail"
      ? `Septic system not feasible: ${septic.summary}`
      : "Septic feasibility could not be determined from available data.",
    blockingFactors: septic.status === "fail" ? [septic.summary] : undefined,
    dataGaps: septic.status !== "fail" ? ["Soil data or septic regulations not available for this jurisdiction"] : undefined,
    nextSteps: ["Contact county health department for septic requirements", "Schedule site evaluation"],
  };
}

// ============================================
// ENVIRONMENTAL
// ============================================

function generateFloodZoneItem(s: SnapshotResult): PropertyActionItem {
  const floodFlag = s.environmentalFlags.find((f) => f.type === "flood");

  if (!floodFlag || floodFlag.status === "pass") {
    return {
      id: "flood-zone",
      category: "environmental",
      actionName: "Flood Zone Status",
      status: "ALLOWED",
      confidence: floodFlag ? "HIGH" : "MEDIUM",
      summary: floodFlag?.description || "Property is not within a designated FEMA flood zone.",
    };
  }

  if (floodFlag.status === "fail") {
    return {
      id: "flood-zone",
      category: "environmental",
      actionName: "Build in Flood Zone",
      status: "CONDITIONAL",
      confidence: "HIGH",
      summary: floodFlag.description,
      conditions: [
        "Flood insurance required (NFIP)",
        "Structures must be elevated above base flood elevation (BFE)",
        "Floodplain development permit required",
        "No fill or obstruction of floodway",
      ],
      nextSteps: [
        "Obtain flood zone determination from FEMA",
        "Get base flood elevation for the site",
        "Apply for floodplain development permit",
        "Engage architect experienced with flood zone construction",
      ],
    };
  }

  return {
    id: "flood-zone",
    category: "environmental",
    actionName: "Flood Zone Status",
    status: "CONDITIONAL",
    confidence: "MEDIUM",
    summary: floodFlag.description,
    conditions: ["Flood zone proximity may require additional review"],
    nextSteps: ["Verify flood zone status with FEMA flood map service", "Consider flood insurance"],
  };
}

function generateWetlandItem(s: SnapshotResult): PropertyActionItem {
  const wetlandFlag = s.environmentalFlags.find((f) => f.type === "wetland");

  if (!wetlandFlag || wetlandFlag.status === "pass") {
    return {
      id: "wetlands",
      category: "environmental",
      actionName: "Wetland Constraints",
      status: "ALLOWED",
      confidence: wetlandFlag ? "MEDIUM" : "LOW",
      summary: wetlandFlag?.description || "No mapped wetlands identified on or near the parcel.",
      dataGaps: !wetlandFlag ? ["Wetland data may not be available for this area"] : undefined,
    };
  }

  return {
    id: "wetlands",
    category: "environmental",
    actionName: "Wetland Constraints",
    status: "CONDITIONAL",
    confidence: "MEDIUM",
    summary: wetlandFlag.description,
    conditions: [
      "Buffer zones (typically 50-200ft) may restrict buildable area",
      "Wetland delineation may be required",
      "Army Corps of Engineers permit may be needed for any fill",
    ],
    nextSteps: [
      "Hire a wetland biologist for delineation",
      "Contact local planning for buffer requirements",
      "Determine if Army Corps Section 404 permit is needed",
    ],
  };
}

// ============================================
// PERMITS & VERIFICATION
// ============================================

function generateBuildingPermitItem(s: SnapshotResult): PropertyActionItem {
  return {
    id: "building-permit",
    category: "permits",
    actionName: "Obtain Building Permit",
    status: "CONDITIONAL",
    confidence: "HIGH",
    summary: "A building permit is required for all new construction, additions, and significant modifications.",
    conditions: [
      "Plans must comply with local building codes",
      "Zoning compliance review required",
      "May require engineering for foundation/structure",
    ],
    nextSteps: [
      `Contact ${s.jurisdictionName} building department`,
      "Prepare construction plans meeting code requirements",
      "Submit permit application with required fees",
      "Schedule inspections as required during construction",
    ],
  };
}

function generateEnvironmentalReviewItem(s: SnapshotResult): PropertyActionItem {
  const hasEnvIssues = s.environmentalFlags.some((f) => f.status !== "pass");

  if (!hasEnvIssues) {
    return {
      id: "env-review",
      category: "permits",
      actionName: "Environmental Review",
      status: "ALLOWED",
      confidence: "MEDIUM",
      summary: "No environmental constraints identified that would trigger additional review requirements.",
      nextSteps: ["Confirm with local planning that no additional environmental review is needed"],
    };
  }

  const issues = s.environmentalFlags.filter((f) => f.status !== "pass");
  return {
    id: "env-review",
    category: "permits",
    actionName: "Environmental Review Required",
    status: "CONDITIONAL",
    confidence: "MEDIUM",
    summary: `${issues.length} environmental factor${issues.length > 1 ? "s" : ""} may trigger additional review: ${issues.map((i) => i.label).join(", ")}.`,
    conditions: issues.map((i) => `${i.label}: ${i.description}`),
    nextSteps: [
      "Contact local planning for environmental review requirements",
      "Determine if SEPA (State Environmental Policy Act) review is needed",
      "Engage environmental consultant if critical areas are present",
    ],
  };
}

// ============================================
// GROUP BY CATEGORY
// ============================================

export function groupChecklistByCategory(items: PropertyActionItem[]): Record<ActionCategory, PropertyActionItem[]> {
  const groups: Record<ActionCategory, PropertyActionItem[]> = {
    residential: [],
    accessory: [],
    lot: [],
    utilities: [],
    environmental: [],
    permits: [],
  };

  for (const item of items) {
    if (groups[item.category]) {
      groups[item.category].push(item);
    }
  }

  return groups;
}

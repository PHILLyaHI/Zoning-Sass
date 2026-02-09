// ============================================
// RULE ENGINE — Deterministic Zoning Validation
// ============================================
// 
// This engine performs deterministic validation checks.
// OpenAI is NEVER used for rule evaluation.
// All results include citations.
//
// ============================================

import {
  PropertyRecord,
  Structure,
  ZoningRule,
  ValidationResult,
  ValidationCheck,
  ValidationStatus,
  RuleType,
  Citation,
  DataGap,
  RestrictedArea,
} from "./types";

// ============================================
// MOCK RULES DATABASE
// ============================================

const MOCK_RULES: ZoningRule[] = [
  {
    id: "rule-setback-front",
    jurisdictionId: "mock",
    districtId: "zone-r1",
    ruleType: "setback_front",
    appliesTo: ["primary_dwelling", "adu", "dadu", "garage"],
    valueNumeric: 25,
    unit: "feet",
    ordinanceSection: "SCC 30.23.040(1)(a)",
    ordinanceText: "The minimum front yard setback for all structures shall be twenty-five (25) feet from the front property line.",
  },
  {
    id: "rule-setback-side",
    jurisdictionId: "mock",
    districtId: "zone-r1",
    ruleType: "setback_side",
    appliesTo: ["primary_dwelling"],
    valueNumeric: 10,
    unit: "feet",
    ordinanceSection: "SCC 30.23.040(1)(b)",
    ordinanceText: "Side yard setbacks for the principal structure shall be a minimum of ten (10) feet.",
  },
  {
    id: "rule-setback-side-accessory",
    jurisdictionId: "mock",
    districtId: "zone-r1",
    ruleType: "accessory_setback",
    appliesTo: ["garage", "shop", "shed", "adu", "dadu"],
    valueNumeric: 5,
    unit: "feet",
    ordinanceSection: "SCC 30.23.040(3)",
    ordinanceText: "Accessory structures not exceeding 15 feet in height may be located within 5 feet of side and rear property lines.",
  },
  {
    id: "rule-setback-rear",
    jurisdictionId: "mock",
    districtId: "zone-r1",
    ruleType: "setback_rear",
    appliesTo: ["primary_dwelling"],
    valueNumeric: 20,
    unit: "feet",
    ordinanceSection: "SCC 30.23.040(1)(c)",
    ordinanceText: "The minimum rear yard setback shall be twenty (20) feet for principal structures.",
  },
  {
    id: "rule-height-max",
    jurisdictionId: "mock",
    districtId: "zone-r1",
    ruleType: "height_max",
    appliesTo: ["primary_dwelling"],
    valueNumeric: 35,
    unit: "feet",
    ordinanceSection: "SCC 30.23.050",
    ordinanceText: "The maximum building height for principal structures shall be thirty-five (35) feet.",
  },
  {
    id: "rule-height-accessory",
    jurisdictionId: "mock",
    districtId: "zone-r1",
    ruleType: "height_max_accessory",
    appliesTo: ["garage", "shop", "shed", "barn", "adu", "dadu"],
    valueNumeric: 20,
    unit: "feet",
    ordinanceSection: "SCC 30.23.050(2)",
    ordinanceText: "Accessory structures shall not exceed twenty (20) feet in height.",
  },
  {
    id: "rule-lot-coverage",
    jurisdictionId: "mock",
    districtId: "zone-r1",
    ruleType: "lot_coverage_max",
    appliesTo: ["primary_dwelling", "adu", "dadu", "garage", "shop", "shed", "pool", "deck", "patio"],
    valueNumeric: 35,
    unit: "percent",
    ordinanceSection: "SCC 30.23.060(1)",
    ordinanceText: "Maximum lot coverage by all structures shall not exceed 35% of the total lot area.",
  },
  {
    id: "rule-far",
    jurisdictionId: "mock",
    districtId: "zone-r1",
    ruleType: "far_max",
    appliesTo: ["primary_dwelling", "adu", "dadu"],
    valueNumeric: 0.5,
    unit: "ratio",
    ordinanceSection: "SCC 30.23.060(2)",
    ordinanceText: "Floor area ratio shall not exceed 0.5:1.",
  },
  {
    id: "rule-adu-allowed",
    jurisdictionId: "mock",
    districtId: "zone-r1",
    ruleType: "adu_allowed",
    appliesTo: ["adu", "dadu"],
    valueText: "permitted",
    ordinanceSection: "SCC 30.23.110",
    ordinanceText: "One accessory dwelling unit is permitted per lot containing a single-family dwelling on lots of 7,500 square feet or larger.",
  },
  {
    id: "rule-adu-size",
    jurisdictionId: "mock",
    districtId: "zone-r1",
    ruleType: "adu_size_max",
    appliesTo: ["adu", "dadu"],
    valueNumeric: 1000,
    unit: "sqft",
    ordinanceSection: "SCC 30.23.110(3)",
    ordinanceText: "The ADU shall not exceed 1,000 square feet or 50% of the primary dwelling floor area, whichever is less.",
  },
  {
    id: "rule-structure-separation",
    jurisdictionId: "mock",
    districtId: "zone-r1",
    ruleType: "structure_separation",
    appliesTo: ["primary_dwelling", "adu", "dadu", "garage", "shop"],
    valueNumeric: 6,
    unit: "feet",
    ordinanceSection: "SCC 30.23.070",
    ordinanceText: "Structures shall maintain a minimum separation of six (6) feet from other structures on the same lot.",
  },
];

// ============================================
// MAIN VALIDATION FUNCTION
// ============================================

export function validateProject(
  property: PropertyRecord,
  structures: Structure[]
): ValidationResult {
  const checks: ValidationCheck[] = [];
  const dataGaps: DataGap[] = [];
  
  // Get applicable rules
  const rules = getRulesForProperty(property);
  
  // Run checks for each structure
  for (const structure of structures) {
    const structureChecks = validateStructure(property, structure, structures, rules);
    checks.push(...structureChecks);
  }
  
  // Run lot-level checks
  const lotChecks = validateLot(property, structures, rules);
  checks.push(...lotChecks);
  
  // Determine overall status
  const hasFail = checks.some(c => c.status === "fail");
  const hasWarn = checks.some(c => c.status === "warn");
  const overallStatus: ValidationStatus = hasFail ? "fail" : hasWarn ? "warn" : "pass";
  
  // Generate summary
  const summary = {
    passingChecks: checks.filter(c => c.status === "pass").length,
    warningChecks: checks.filter(c => c.status === "warn").length,
    failingChecks: checks.filter(c => c.status === "fail").length,
    totalChecks: checks.length,
    criticalIssues: checks
      .filter(c => c.status === "fail")
      .map(c => `${getRuleLabel(c.ruleType)}: ${c.reason || "Does not meet requirements"}`),
    verificationNeeded: checks
      .filter(c => c.status === "warn")
      .map(c => `${getRuleLabel(c.ruleType)}: Verification needed`),
  };
  
  return {
    id: `val-${Date.now()}`,
    projectId: property.id,
    computedAt: new Date(),
    overallStatus,
    checks,
    dataGaps,
    summary,
  };
}

// ============================================
// STRUCTURE-LEVEL VALIDATION
// ============================================

function validateStructure(
  property: PropertyRecord,
  structure: Structure,
  allStructures: Structure[],
  rules: ZoningRule[]
): ValidationCheck[] {
  const checks: ValidationCheck[] = [];
  
  // Height check
  const heightRule = rules.find(r => 
    (r.ruleType === "height_max" || r.ruleType === "height_max_accessory") &&
    r.appliesTo.includes(structure.structureType)
  );
  
  if (heightRule && structure.heightFeet !== undefined) {
    const status = structure.heightFeet <= (heightRule.valueNumeric || 0) ? "pass" : "fail";
    checks.push({
      checkId: `check-height-${structure.id}`,
      ruleId: heightRule.id,
      ruleType: heightRule.ruleType,
      structureId: structure.id,
      status,
      measuredValue: structure.heightFeet,
      requiredValue: heightRule.valueNumeric,
      unit: heightRule.unit,
      margin: status === "pass" ? (heightRule.valueNumeric || 0) - structure.heightFeet : undefined,
      excess: status === "fail" ? structure.heightFeet - (heightRule.valueNumeric || 0) : undefined,
      citations: [createCitation(heightRule)],
    });
  }
  
  // Setback checks (using mock distances)
  const setbackChecks: { ruleType: RuleType; distance: number | undefined }[] = [
    { ruleType: "setback_front", distance: structure.distanceToFront },
    { ruleType: "setback_side", distance: structure.distanceToSide },
    { ruleType: "setback_rear", distance: structure.distanceToRear },
  ];
  
  for (const { ruleType, distance } of setbackChecks) {
    const rule = rules.find(r => 
      (r.ruleType === ruleType || r.ruleType === "accessory_setback") &&
      r.appliesTo.includes(structure.structureType)
    );
    
    if (rule && distance !== undefined) {
      const required = rule.valueNumeric || 0;
      const status: ValidationStatus = distance >= required ? "pass" : "fail";
      
      checks.push({
        checkId: `check-${ruleType}-${structure.id}`,
        ruleId: rule.id,
        ruleType: rule.ruleType,
        structureId: structure.id,
        status,
        measuredValue: distance,
        requiredValue: required,
        unit: rule.unit,
        margin: status === "pass" ? distance - required : undefined,
        excess: status === "fail" ? required - distance : undefined,
        citations: [createCitation(rule)],
      });
    }
  }
  
  // ADU size check
  if ((structure.structureType === "adu" || structure.structureType === "dadu") && structure.footprintSqft) {
    const sizeRule = rules.find(r => r.ruleType === "adu_size_max");
    
    if (sizeRule && sizeRule.valueNumeric) {
      const status: ValidationStatus = structure.footprintSqft <= sizeRule.valueNumeric ? "pass" : "fail";
      
      checks.push({
        checkId: `check-adu-size-${structure.id}`,
        ruleId: sizeRule.id,
        ruleType: "adu_size_max",
        structureId: structure.id,
        status,
        measuredValue: structure.footprintSqft,
        requiredValue: sizeRule.valueNumeric,
        unit: "sqft",
        margin: status === "pass" ? sizeRule.valueNumeric - structure.footprintSqft : undefined,
        excess: status === "fail" ? structure.footprintSqft - sizeRule.valueNumeric : undefined,
        citations: [createCitation(sizeRule)],
      });
    }
  }
  
  // Structure separation check
  const separationRule = rules.find(r => 
    r.ruleType === "structure_separation" &&
    r.appliesTo.includes(structure.structureType)
  );
  
  if (separationRule && structure.distanceToOtherStructures) {
    for (const [otherId, distance] of Object.entries(structure.distanceToOtherStructures)) {
      const required = separationRule.valueNumeric || 0;
      const status: ValidationStatus = distance >= required ? "pass" : "fail";
      
      checks.push({
        checkId: `check-separation-${structure.id}-${otherId}`,
        ruleId: separationRule.id,
        ruleType: "structure_separation",
        structureId: structure.id,
        status,
        measuredValue: distance,
        requiredValue: required,
        unit: separationRule.unit,
        reason: status === "fail" ? `Too close to another structure` : undefined,
        citations: [createCitation(separationRule)],
      });
    }
  }
  
  return checks;
}

// ============================================
// LOT-LEVEL VALIDATION
// ============================================

function validateLot(
  property: PropertyRecord,
  structures: Structure[],
  rules: ZoningRule[]
): ValidationCheck[] {
  const checks: ValidationCheck[] = [];
  const lotArea = property.areaSqft || 0;
  
  // Lot coverage check
  const coverageRule = rules.find(r => r.ruleType === "lot_coverage_max");
  if (coverageRule && lotArea > 0) {
    const totalFootprint = structures.reduce((sum, s) => sum + (s.footprintSqft || 0), 0);
    const coveragePercent = (totalFootprint / lotArea) * 100;
    const maxCoverage = coverageRule.valueNumeric || 35;
    const status: ValidationStatus = coveragePercent <= maxCoverage ? "pass" : "fail";
    
    checks.push({
      checkId: "check-lot-coverage",
      ruleId: coverageRule.id,
      ruleType: "lot_coverage_max",
      status,
      measuredValue: Math.round(coveragePercent * 10) / 10,
      requiredValue: maxCoverage,
      unit: "percent",
      margin: status === "pass" ? Math.round((maxCoverage - coveragePercent) * 10) / 10 : undefined,
      excess: status === "fail" ? Math.round((coveragePercent - maxCoverage) * 10) / 10 : undefined,
      citations: [createCitation(coverageRule)],
    });
  }
  
  // FAR check
  const farRule = rules.find(r => r.ruleType === "far_max");
  if (farRule && lotArea > 0) {
    // Estimate total floor area (footprint * stories)
    const totalFloorArea = structures.reduce((sum, s) => {
      const stories = s.stories || 1;
      return sum + (s.footprintSqft || 0) * stories;
    }, 0);
    const far = totalFloorArea / lotArea;
    const maxFar = farRule.valueNumeric || 0.5;
    const status: ValidationStatus = far <= maxFar ? "pass" : "fail";
    
    checks.push({
      checkId: "check-far",
      ruleId: farRule.id,
      ruleType: "far_max",
      status,
      measuredValue: Math.round(far * 100) / 100,
      requiredValue: maxFar,
      unit: "ratio",
      citations: [createCitation(farRule)],
    });
  }
  
  return checks;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function getRulesForProperty(property: PropertyRecord): ZoningRule[] {
  // In production, this would query the database for jurisdiction-specific rules
  // For now, return mock rules
  return MOCK_RULES;
}

function createCitation(rule: ZoningRule): Citation {
  return {
    source: "County Zoning Code",
    section: rule.ordinanceSection,
    text: rule.ordinanceText,
  };
}

function getRuleLabel(ruleType: RuleType): string {
  const labels: Record<RuleType, string> = {
    setback_front: "Front Setback",
    setback_side: "Side Setback",
    setback_rear: "Rear Setback",
    setback_street_side: "Street Side Setback",
    height_max: "Maximum Height",
    height_max_accessory: "Accessory Height",
    lot_coverage_max: "Lot Coverage",
    impervious_coverage_max: "Impervious Coverage",
    far_max: "Floor Area Ratio",
    far_min: "Minimum FAR",
    lot_size_min: "Minimum Lot Size",
    lot_width_min: "Minimum Lot Width",
    lot_depth_min: "Minimum Lot Depth",
    dwelling_units_max: "Maximum Dwelling Units",
    density_max: "Maximum Density",
    use_permitted: "Permitted Use",
    use_conditional: "Conditional Use",
    use_prohibited: "Prohibited Use",
    parking_required: "Required Parking",
    adu_allowed: "ADU Permitted",
    adu_size_max: "ADU Size Limit",
    adu_setback: "ADU Setback",
    structure_separation: "Structure Separation",
    accessory_setback: "Accessory Setback",
  };
  return labels[ruleType] || ruleType;
}

// ============================================
// QUICK VALIDATION (for real-time feedback)
// ============================================

export function quickValidateStructure(
  property: PropertyRecord,
  structure: Partial<Structure>
): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  
  // Height check
  if (structure.heightFeet !== undefined) {
    const maxHeight = structure.structureType === "primary_dwelling" ? 35 : 20;
    if (structure.heightFeet > maxHeight) {
      issues.push(`Height ${structure.heightFeet}' exceeds ${maxHeight}' maximum`);
    }
  }
  
  // Setback checks
  if (structure.distanceToFront !== undefined && structure.distanceToFront < 25) {
    issues.push(`Front setback ${structure.distanceToFront}' is less than 25' required`);
  }
  
  if (structure.distanceToSide !== undefined) {
    const minSide = structure.structureType === "primary_dwelling" ? 10 : 5;
    if (structure.distanceToSide < minSide) {
      issues.push(`Side setback ${structure.distanceToSide}' is less than ${minSide}' required`);
    }
  }
  
  // ADU size
  if ((structure.structureType === "adu" || structure.structureType === "dadu") && structure.footprintSqft) {
    if (structure.footprintSqft > 1000) {
      issues.push(`ADU size ${structure.footprintSqft} sf exceeds 1,000 sf maximum`);
    }
  }
  
  return {
    valid: issues.length === 0,
    issues,
  };
}




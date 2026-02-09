// ============================================
// NATIONAL RULES DATABASE
// ============================================
// US-wide septic, health, and zoning rules
// Structured for all 50 states + territories

// ============================================
// TYPES
// ============================================

export type RuleLevel = "federal" | "state" | "county" | "city";

export type RuleCategory = 
  | "septic_general"
  | "septic_setbacks" 
  | "septic_soil"
  | "septic_sizing"
  | "well_setbacks"
  | "wetland_buffer"
  | "flood_zone"
  | "health_permit"
  | "perc_test";

export type SepticSystemType = 
  | "conventional_gravity"
  | "conventional_pressure"
  | "mound"
  | "sand_filter"
  | "aerobic_treatment"
  | "constructed_wetland"
  | "holding_tank"
  | "composting";

export type HealthRule = {
  id: string;
  level: RuleLevel;
  stateCode?: string;        // e.g., "WA", "CA"
  countyFips?: string;       // e.g., "53061" for Snohomish
  category: RuleCategory;
  
  // Rule content
  title: string;
  description: string;
  valueNumeric?: number;
  valueText?: string;
  unit?: string;
  
  // Conditions
  conditions?: {
    minLotSize?: number;      // sq ft
    soilType?: string[];
    systemType?: SepticSystemType[];
    newConstruction?: boolean;
    existingSystem?: boolean;
  };
  
  // Citation
  citation: {
    source: string;
    code: string;
    section?: string;
    url?: string;
    lastVerified?: string;
  };
  
  // Metadata
  effectiveDate?: string;
  isActive: boolean;
};

export type StateRegulation = {
  stateCode: string;
  stateName: string;
  regulatoryAgency: string;
  primaryCode: string;        // e.g., "WAC 246-272A" for WA
  websiteUrl: string;
  dataCoverage: "complete" | "partial" | "minimal";
  lastUpdated: string;
  rules: HealthRule[];
};

export type CountyCoverage = {
  countyFips: string;
  countyName: string;
  stateCode: string;
  healthDistrictName?: string;
  healthDistrictUrl?: string;
  dataCoverage: "complete" | "partial" | "none";
  hasLocalRules: boolean;
  lastUpdated?: string;
  notes?: string;
};

// ============================================
// FEDERAL BASELINE (EPA)
// ============================================

export const FEDERAL_RULES: HealthRule[] = [
  {
    id: "fed-septic-well-setback",
    level: "federal",
    category: "well_setbacks",
    title: "Minimum Setback from Drinking Water Well",
    description: "All components of an on-site sewage treatment system must maintain minimum distance from drinking water wells",
    valueNumeric: 50,
    unit: "feet",
    citation: {
      source: "EPA Onsite Wastewater Treatment Systems Manual",
      code: "EPA/625/R-00/008",
      section: "Chapter 3",
      url: "https://www.epa.gov/septic/septic-systems-guidance",
      lastVerified: "2024-01",
    },
    isActive: true,
  },
  {
    id: "fed-septic-surface-water",
    level: "federal",
    category: "septic_setbacks",
    title: "Minimum Setback from Surface Water",
    description: "Drainfields must maintain distance from lakes, streams, and other surface water bodies",
    valueNumeric: 50,
    unit: "feet",
    citation: {
      source: "EPA Onsite Wastewater Treatment Systems Manual",
      code: "EPA/625/R-00/008",
      section: "Chapter 3",
    },
    isActive: true,
  },
  {
    id: "fed-wetland-buffer",
    level: "federal",
    category: "wetland_buffer",
    title: "Wetland Buffer Zone",
    description: "Development setback from jurisdictional wetlands under Clean Water Act",
    valueNumeric: 50,
    unit: "feet",
    citation: {
      source: "Clean Water Act",
      code: "33 U.S.C. §1251",
      url: "https://www.epa.gov/cwa-404/clean-water-act-section-404",
    },
    isActive: true,
  },
];

// ============================================
// STATE REGULATIONS
// ============================================

export const STATE_REGULATIONS: Record<string, StateRegulation> = {
  WA: {
    stateCode: "WA",
    stateName: "Washington",
    regulatoryAgency: "Washington State Department of Health",
    primaryCode: "WAC 246-272A",
    websiteUrl: "https://doh.wa.gov/community-and-environment/wastewater-management",
    dataCoverage: "complete",
    lastUpdated: "2024-01",
    rules: [
      {
        id: "wa-septic-tank-setback",
        level: "state",
        stateCode: "WA",
        category: "septic_setbacks",
        title: "Septic Tank Setback from Buildings",
        description: "Minimum distance from septic tank to any building foundation",
        valueNumeric: 5,
        unit: "feet",
        citation: {
          source: "Washington Administrative Code",
          code: "WAC 246-272A-0210",
          section: "Table II",
          url: "https://apps.leg.wa.gov/wac/default.aspx?cite=246-272A-0210",
          lastVerified: "2024-01",
        },
        isActive: true,
      },
      {
        id: "wa-drainfield-building-setback",
        level: "state",
        stateCode: "WA",
        category: "septic_setbacks",
        title: "Drainfield Setback from Buildings",
        description: "Minimum distance from drainfield/soil treatment area to buildings",
        valueNumeric: 10,
        unit: "feet",
        citation: {
          source: "Washington Administrative Code",
          code: "WAC 246-272A-0210",
          section: "Table II",
        },
        isActive: true,
      },
      {
        id: "wa-drainfield-property-setback",
        level: "state",
        stateCode: "WA",
        category: "septic_setbacks",
        title: "Drainfield Setback from Property Lines",
        description: "Minimum distance from drainfield to property boundaries",
        valueNumeric: 5,
        unit: "feet",
        citation: {
          source: "Washington Administrative Code",
          code: "WAC 246-272A-0210",
          section: "Table II",
        },
        isActive: true,
      },
      {
        id: "wa-well-septic-setback",
        level: "state",
        stateCode: "WA",
        category: "well_setbacks",
        title: "Well to Septic System Setback",
        description: "Minimum distance from drinking water well to any septic component",
        valueNumeric: 100,
        unit: "feet",
        citation: {
          source: "Washington Administrative Code",
          code: "WAC 246-272A-0210",
          section: "Table II",
        },
        isActive: true,
      },
      {
        id: "wa-reserve-area",
        level: "state",
        stateCode: "WA",
        category: "septic_general",
        title: "Reserve Drainfield Area Required",
        description: "100% reserve area required for future drainfield replacement",
        valueNumeric: 100,
        valueText: "100% of primary drainfield area",
        unit: "percent",
        citation: {
          source: "Washington Administrative Code",
          code: "WAC 246-272A-0230",
        },
        isActive: true,
      },
      {
        id: "wa-perc-test-required",
        level: "state",
        stateCode: "WA",
        category: "perc_test",
        title: "Soil Evaluation Required",
        description: "Site evaluation including soil logs and/or percolation test required for new systems",
        valueText: "Required for all new systems",
        citation: {
          source: "Washington Administrative Code",
          code: "WAC 246-272A-0220",
        },
        isActive: true,
      },
      {
        id: "wa-wetland-buffer",
        level: "state",
        stateCode: "WA",
        category: "wetland_buffer",
        title: "Wetland Buffer - Standard",
        description: "Buffer from Category II-IV wetlands",
        valueNumeric: 50,
        unit: "feet",
        conditions: {
          newConstruction: true,
        },
        citation: {
          source: "Washington Administrative Code",
          code: "WAC 365-196-830",
        },
        isActive: true,
      },
    ],
  },
  
  CA: {
    stateCode: "CA",
    stateName: "California",
    regulatoryAgency: "State Water Resources Control Board",
    primaryCode: "California Water Code §13291",
    websiteUrl: "https://www.waterboards.ca.gov/water_issues/programs/owts/",
    dataCoverage: "partial",
    lastUpdated: "2024-01",
    rules: [
      {
        id: "ca-septic-well-setback",
        level: "state",
        stateCode: "CA",
        category: "well_setbacks",
        title: "Well to OWTS Setback",
        description: "Minimum setback from wells to onsite wastewater treatment systems",
        valueNumeric: 100,
        unit: "feet",
        citation: {
          source: "California Water Code",
          code: "OWTS Policy §9.4",
          url: "https://www.waterboards.ca.gov/water_issues/programs/owts/docs/owts_policy.pdf",
        },
        isActive: true,
      },
      {
        id: "ca-min-lot-size",
        level: "state",
        stateCode: "CA",
        category: "septic_general",
        title: "Minimum Lot Size for OWTS",
        description: "Minimum parcel size for new onsite wastewater treatment systems",
        valueNumeric: 0.5,
        unit: "acres",
        citation: {
          source: "California Water Code",
          code: "OWTS Policy §9.3",
        },
        isActive: true,
      },
    ],
  },
  
  TX: {
    stateCode: "TX",
    stateName: "Texas",
    regulatoryAgency: "Texas Commission on Environmental Quality",
    primaryCode: "30 TAC Chapter 285",
    websiteUrl: "https://www.tceq.texas.gov/permitting/ossf",
    dataCoverage: "partial",
    lastUpdated: "2024-01",
    rules: [
      {
        id: "tx-septic-well-setback",
        level: "state",
        stateCode: "TX",
        category: "well_setbacks",
        title: "Well to OSSF Setback",
        description: "Minimum distance from water wells to on-site sewage facilities",
        valueNumeric: 50,
        unit: "feet",
        citation: {
          source: "Texas Administrative Code",
          code: "30 TAC §285.4",
          url: "https://texreg.sos.state.tx.us/public/readtac$ext.TacPage?sl=R&app=9&p_dir=&p_rloc=&p_tloc=&p_ploc=&pg=1&p_tac=&ti=30&pt=1&ch=285&rl=4",
        },
        isActive: true,
      },
    ],
  },
  
  FL: {
    stateCode: "FL",
    stateName: "Florida",
    regulatoryAgency: "Florida Department of Health",
    primaryCode: "FAC 64E-6",
    websiteUrl: "https://www.floridahealth.gov/environmental-health/onsite-sewage/index.html",
    dataCoverage: "partial",
    lastUpdated: "2024-01",
    rules: [
      {
        id: "fl-septic-well-setback",
        level: "state",
        stateCode: "FL",
        category: "well_setbacks",
        title: "Well Setback",
        description: "Distance from drainfield to private potable well",
        valueNumeric: 75,
        unit: "feet",
        citation: {
          source: "Florida Administrative Code",
          code: "FAC 64E-6.005",
        },
        isActive: true,
      },
      {
        id: "fl-septic-building-setback",
        level: "state",
        stateCode: "FL",
        category: "septic_setbacks",
        title: "Building Setback",
        description: "Distance from drainfield to building foundation",
        valueNumeric: 5,
        unit: "feet",
        citation: {
          source: "Florida Administrative Code",
          code: "FAC 64E-6.005",
        },
        isActive: true,
      },
    ],
  },
  
  // Add more states as needed...
};

// ============================================
// COUNTY COVERAGE TRACKING
// ============================================

export const COUNTY_COVERAGE: CountyCoverage[] = [
  {
    countyFips: "53061",
    countyName: "Snohomish",
    stateCode: "WA",
    healthDistrictName: "Snohomish Health District",
    healthDistrictUrl: "https://www.snohd.org/",
    dataCoverage: "complete",
    hasLocalRules: true,
    lastUpdated: "2024-01",
  },
  {
    countyFips: "53033",
    countyName: "King",
    stateCode: "WA",
    healthDistrictName: "Public Health - Seattle & King County",
    healthDistrictUrl: "https://kingcounty.gov/depts/health.aspx",
    dataCoverage: "partial",
    hasLocalRules: true,
    lastUpdated: "2024-01",
  },
  // More counties added as we gather data...
];

// ============================================
// LOOKUP FUNCTIONS
// ============================================

/**
 * Get all applicable rules for a location
 */
export function getRulesForLocation(
  stateCode: string,
  countyFips?: string
): HealthRule[] {
  const rules: HealthRule[] = [];
  
  // 1. Add federal baseline rules
  rules.push(...FEDERAL_RULES);
  
  // 2. Add state rules
  const stateReg = STATE_REGULATIONS[stateCode.toUpperCase()];
  if (stateReg) {
    rules.push(...stateReg.rules);
  }
  
  // 3. Add county-specific rules if we have them
  // TODO: Add county rules lookup
  
  return rules.filter(r => r.isActive);
}

/**
 * Get septic setback requirements for a state
 */
export function getSepticSetbacks(stateCode: string): {
  tankToBuilding: number;
  drainfieldToBuilding: number;
  drainfieldToProperty: number;
  toWell: number;
  source: string;
} {
  const stateReg = STATE_REGULATIONS[stateCode.toUpperCase()];
  
  if (stateReg) {
    const tankRule = stateReg.rules.find(r => r.id.includes("tank-setback"));
    const dfBuildingRule = stateReg.rules.find(r => r.id.includes("drainfield-building"));
    const dfPropertyRule = stateReg.rules.find(r => r.id.includes("drainfield-property"));
    const wellRule = stateReg.rules.find(r => r.category === "well_setbacks");
    
    return {
      tankToBuilding: tankRule?.valueNumeric || 10,
      drainfieldToBuilding: dfBuildingRule?.valueNumeric || 10,
      drainfieldToProperty: dfPropertyRule?.valueNumeric || 5,
      toWell: wellRule?.valueNumeric || 100,
      source: stateReg.primaryCode,
    };
  }
  
  // Federal defaults
  return {
    tankToBuilding: 10,
    drainfieldToBuilding: 10,
    drainfieldToProperty: 5,
    toWell: 50,
    source: "EPA Guidelines (verify with state)",
  };
}

/**
 * Check if we have data coverage for a county
 */
export function getCountyCoverage(stateCode: string, countyName: string): CountyCoverage | null {
  return COUNTY_COVERAGE.find(
    c => c.stateCode === stateCode.toUpperCase() && 
         c.countyName.toLowerCase() === countyName.toLowerCase()
  ) || null;
}

/**
 * Get data quality indicator for a location
 */
export function getDataQuality(stateCode: string, countyFips?: string): {
  level: "high" | "medium" | "low";
  message: string;
  recommendation: string;
} {
  const stateReg = STATE_REGULATIONS[stateCode.toUpperCase()];
  const county = countyFips ? COUNTY_COVERAGE.find(c => c.countyFips === countyFips) : null;
  
  if (county?.dataCoverage === "complete" && stateReg?.dataCoverage === "complete") {
    return {
      level: "high",
      message: "Complete state and local data available",
      recommendation: "Data is comprehensive. Still verify critical details with local health department.",
    };
  }
  
  if (stateReg?.dataCoverage === "complete" || stateReg?.dataCoverage === "partial") {
    return {
      level: "medium",
      message: "State data available, local rules may vary",
      recommendation: "Contact local health district to confirm county-specific requirements.",
    };
  }
  
  return {
    level: "low",
    message: "Limited data for this state",
    recommendation: "Use EPA guidelines as baseline. Contact state and local agencies for requirements.",
  };
}

/**
 * Get all states with data coverage
 */
export function getStatesWithCoverage(): { code: string; name: string; coverage: string }[] {
  return Object.values(STATE_REGULATIONS).map(reg => ({
    code: reg.stateCode,
    name: reg.stateName,
    coverage: reg.dataCoverage,
  }));
}




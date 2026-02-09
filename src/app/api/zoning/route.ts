import { NextRequest, NextResponse } from "next/server";
import { getZoningByLocation, type ZoningData } from "../../../lib/snohomishGIS";

// ============================================
// ZONING API ROUTE
// ============================================
// Uses Snohomish County GIS (FREE) for real zoning data

export type ZoningRule = {
  ruleType: string;
  valueNumeric?: number;
  valueText?: string;
  unit?: string;
  ordinanceSection?: string;
  ordinanceText?: string;
};

export type ZoningResult = {
  districtId: string;
  districtCode: string;
  districtName: string;
  description?: string;
  category: "residential_single" | "residential_multi" | "commercial" | "industrial" | "agricultural" | "mixed_use" | "special";
  jurisdictionId: string;
  jurisdictionName: string;
  jurisdictionType: "county" | "city" | "township";
  rules: ZoningRule[];
  source: "snohomish_gis" | "database" | "mock";
};

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");

  if (!lat || !lng) {
    return NextResponse.json(
      { success: false, error: "Latitude and longitude are required" },
      { status: 400 }
    );
  }

  try {
    // Try Snohomish County GIS first
    const zoningData = await getZoningByLocation(parseFloat(lat), parseFloat(lng));

    if (zoningData) {
      const result = parseZoningData(zoningData);
      return NextResponse.json({
        success: true,
        data: result,
      });
    }

    // Return rules for common Snohomish County zones
    const mockResult = getMockZoningData(parseFloat(lat), parseFloat(lng));
    return NextResponse.json({
      success: true,
      data: mockResult,
    });
  } catch (error) {
    console.error("Zoning lookup error:", error);
    
    // Return mock data on error
    const mockResult = getMockZoningData(parseFloat(lat), parseFloat(lng));
    return NextResponse.json({
      success: true,
      data: mockResult,
    });
  }
}

// ============================================
// PARSE REAL ZONING DATA
// ============================================

function parseZoningData(data: ZoningData): ZoningResult {
  const code = data.zoneCode.toUpperCase();
  const category = determineCategory(code);
  const rules = getZoningRules(code);

  return {
    districtId: `snoco-${code.toLowerCase()}`,
    districtCode: code,
    districtName: data.zoneName || getZoneName(code),
    description: data.zoneDescription,
    category,
    jurisdictionId: "snohomish-county",
    jurisdictionName: data.jurisdiction || "Snohomish County",
    jurisdictionType: "county",
    rules,
    source: "snohomish_gis",
  };
}

function determineCategory(code: string): ZoningResult["category"] {
  const upper = code.toUpperCase();
  
  if (upper.match(/^R-?[0-9]/i) || upper.includes("RURAL") || upper.includes("RESIDENTIAL")) {
    return "residential_single";
  }
  if (upper.match(/^MR|^RM|MULTI/i)) {
    return "residential_multi";
  }
  if (upper.match(/^C|^B|COMMERCIAL|BUSINESS/i)) {
    return "commercial";
  }
  if (upper.match(/^I|^M|INDUSTRIAL|MANUFACTURING/i)) {
    return "industrial";
  }
  if (upper.match(/^A|AG|AGRIC/i)) {
    return "agricultural";
  }
  if (upper.includes("MIX")) {
    return "mixed_use";
  }
  
  return "residential_single"; // Default
}

function getZoneName(code: string): string {
  const names: Record<string, string> = {
    "R-5": "Rural Residential (5-acre)",
    "R-10": "Rural Residential (10-acre)",
    "R-7200": "Urban Residential (7,200 sf min)",
    "R-8400": "Urban Residential (8,400 sf min)",
    "R-9600": "Urban Residential (9,600 sf min)",
    "R-12000": "Urban Residential (12,000 sf min)",
    "R-20000": "Urban Residential (20,000 sf min)",
    "A-10": "Agricultural (10-acre)",
    "F": "Forestry",
    "RC": "Rural Conservation",
    "RI": "Rural Industrial",
    "NB": "Neighborhood Business",
    "CB": "Community Business",
    "GC": "General Commercial",
    "LI": "Light Industrial",
    "HI": "Heavy Industrial",
    "PRD": "Planned Residential Development",
    "MR": "Multi-Family Residential",
  };
  
  return names[code.toUpperCase()] || `${code} Zoning District`;
}

// ============================================
// ZONING RULES BY DISTRICT
// ============================================

function getZoningRules(code: string): ZoningRule[] {
  // Snohomish County Unified Development Code rules
  // Reference: SCC Title 30
  
  const upper = code.toUpperCase();
  
  // Rural zones (R-5, R-10, etc.)
  if (upper.match(/^R-?5/)) {
    return getRuralRules(5);
  }
  if (upper.match(/^R-?10/)) {
    return getRuralRules(10);
  }
  
  // Urban zones (R-7200, R-8400, etc.)
  if (upper.includes("7200")) {
    return getUrbanRules(7200);
  }
  if (upper.includes("8400")) {
    return getUrbanRules(8400);
  }
  if (upper.includes("9600")) {
    return getUrbanRules(9600);
  }
  if (upper.includes("12000")) {
    return getUrbanRules(12000);
  }
  if (upper.includes("20000")) {
    return getUrbanRules(20000);
  }
  
  // Agricultural
  if (upper.match(/^A/)) {
    return getAgriculturalRules();
  }
  
  // Default residential rules
  return getDefaultResidentialRules();
}

function getRuralRules(acreage: number): ZoningRule[] {
  return [
    {
      ruleType: "lot_size_min",
      valueNumeric: acreage * 43560,
      unit: "sqft",
      ordinanceSection: "SCC 30.23.020",
      ordinanceText: `Minimum lot size: ${acreage} acres`,
    },
    {
      ruleType: "setback_front",
      valueNumeric: 35,
      unit: "feet",
      ordinanceSection: "SCC 30.23.040(1)",
      ordinanceText: "Front yard setback: 35 feet from front property line",
    },
    {
      ruleType: "setback_side",
      valueNumeric: 15,
      unit: "feet",
      ordinanceSection: "SCC 30.23.040(2)",
      ordinanceText: "Side yard setback: 15 feet from side property line",
    },
    {
      ruleType: "setback_rear",
      valueNumeric: 25,
      unit: "feet",
      ordinanceSection: "SCC 30.23.040(3)",
      ordinanceText: "Rear yard setback: 25 feet from rear property line",
    },
    {
      ruleType: "accessory_setback",
      valueNumeric: 10,
      unit: "feet",
      ordinanceSection: "SCC 30.23.040(4)",
      ordinanceText: "Accessory structures: 10 feet from side/rear property lines",
    },
    {
      ruleType: "height_max",
      valueNumeric: 35,
      unit: "feet",
      ordinanceSection: "SCC 30.23.050",
      ordinanceText: "Maximum building height: 35 feet",
    },
    {
      ruleType: "height_max_accessory",
      valueNumeric: 25,
      unit: "feet",
      ordinanceSection: "SCC 30.23.050(2)",
      ordinanceText: "Accessory structure height: 25 feet maximum",
    },
    {
      ruleType: "lot_coverage_max",
      valueNumeric: 15,
      unit: "percent",
      ordinanceSection: "SCC 30.23.060",
      ordinanceText: "Maximum lot coverage: 15%",
    },
    {
      ruleType: "adu_allowed",
      valueText: "permitted",
      ordinanceSection: "SCC 30.23.110",
      ordinanceText: "One ADU permitted per lot",
    },
    {
      ruleType: "adu_size_max",
      valueNumeric: 1000,
      unit: "sqft",
      ordinanceSection: "SCC 30.23.110(3)",
      ordinanceText: "ADU maximum size: 1,000 sq ft or 50% of primary dwelling",
    },
  ];
}

function getUrbanRules(minLotSize: number): ZoningRule[] {
  const frontSetback = minLotSize >= 12000 ? 25 : 20;
  const sideSetback = minLotSize >= 12000 ? 10 : 5;
  const rearSetback = minLotSize >= 12000 ? 20 : 15;
  const coverage = minLotSize >= 12000 ? 35 : 40;
  
  return [
    {
      ruleType: "lot_size_min",
      valueNumeric: minLotSize,
      unit: "sqft",
      ordinanceSection: "SCC 30.23.020",
      ordinanceText: `Minimum lot size: ${minLotSize.toLocaleString()} sq ft`,
    },
    {
      ruleType: "setback_front",
      valueNumeric: frontSetback,
      unit: "feet",
      ordinanceSection: "SCC 30.23.040(1)",
      ordinanceText: `Front yard setback: ${frontSetback} feet`,
    },
    {
      ruleType: "setback_side",
      valueNumeric: sideSetback,
      unit: "feet",
      ordinanceSection: "SCC 30.23.040(2)",
      ordinanceText: `Side yard setback: ${sideSetback} feet`,
    },
    {
      ruleType: "setback_rear",
      valueNumeric: rearSetback,
      unit: "feet",
      ordinanceSection: "SCC 30.23.040(3)",
      ordinanceText: `Rear yard setback: ${rearSetback} feet`,
    },
    {
      ruleType: "accessory_setback",
      valueNumeric: 5,
      unit: "feet",
      ordinanceSection: "SCC 30.23.040(4)",
      ordinanceText: "Accessory structures: 5 feet from side/rear",
    },
    {
      ruleType: "height_max",
      valueNumeric: 35,
      unit: "feet",
      ordinanceSection: "SCC 30.23.050",
      ordinanceText: "Maximum building height: 35 feet",
    },
    {
      ruleType: "height_max_accessory",
      valueNumeric: 20,
      unit: "feet",
      ordinanceSection: "SCC 30.23.050(2)",
      ordinanceText: "Accessory structure height: 20 feet maximum",
    },
    {
      ruleType: "lot_coverage_max",
      valueNumeric: coverage,
      unit: "percent",
      ordinanceSection: "SCC 30.23.060",
      ordinanceText: `Maximum lot coverage: ${coverage}%`,
    },
    {
      ruleType: "adu_allowed",
      valueText: "permitted",
      ordinanceSection: "SCC 30.23.110",
      ordinanceText: "ADU permitted on lots 7,500+ sq ft",
    },
    {
      ruleType: "adu_size_max",
      valueNumeric: 1000,
      unit: "sqft",
      ordinanceSection: "SCC 30.23.110(3)",
      ordinanceText: "ADU maximum: 1,000 sq ft or 50% of primary",
    },
  ];
}

function getAgriculturalRules(): ZoningRule[] {
  return [
    {
      ruleType: "lot_size_min",
      valueNumeric: 10 * 43560,
      unit: "sqft",
      ordinanceSection: "SCC 30.32.020",
      ordinanceText: "Minimum lot size: 10 acres",
    },
    {
      ruleType: "setback_front",
      valueNumeric: 50,
      unit: "feet",
      ordinanceSection: "SCC 30.32.040(1)",
      ordinanceText: "Front yard setback: 50 feet",
    },
    {
      ruleType: "setback_side",
      valueNumeric: 25,
      unit: "feet",
      ordinanceSection: "SCC 30.32.040(2)",
      ordinanceText: "Side yard setback: 25 feet",
    },
    {
      ruleType: "setback_rear",
      valueNumeric: 25,
      unit: "feet",
      ordinanceSection: "SCC 30.32.040(3)",
      ordinanceText: "Rear yard setback: 25 feet",
    },
    {
      ruleType: "height_max",
      valueNumeric: 35,
      unit: "feet",
      ordinanceSection: "SCC 30.32.050",
    },
    {
      ruleType: "lot_coverage_max",
      valueNumeric: 10,
      unit: "percent",
      ordinanceSection: "SCC 30.32.060",
    },
  ];
}

function getDefaultResidentialRules(): ZoningRule[] {
  return getUrbanRules(9600);
}

// ============================================
// MOCK DATA FALLBACK
// ============================================

function getMockZoningData(lat: number, lng: number): ZoningResult {
  // Default to R-5 for rural Snohomish County
  return {
    districtId: "snoco-r5",
    districtCode: "R-5",
    districtName: "Rural Residential (5-acre)",
    description: "Rural residential zone allowing single-family dwellings on 5-acre minimum lots",
    category: "residential_single",
    jurisdictionId: "snohomish-county",
    jurisdictionName: "Snohomish County",
    jurisdictionType: "county",
    rules: getRuralRules(5),
    source: "mock",
  };
}

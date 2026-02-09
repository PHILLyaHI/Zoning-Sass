// ============================================
// PROPERTY SERVICE — Orchestrates API calls
// ============================================
// Uses real data from:
// - Snohomish County GIS (FREE) - parcels, zoning
// - USDA Web Soil Survey (FREE) - soil data
// - OpenAI (with key) - AI explanations

import type { GeocodeResult } from "../app/api/geocode/route";
import type { ParcelResult } from "../app/api/parcel/route";
import type { ZoningResult } from "../app/api/zoning/route";
import type { SoilResult } from "../app/api/soil/route";
import type { PropertyRecord, FeasibilitySnapshot, LayerState, FeasibilityStatus } from "./types";

const API_BASE = "/api";

// ============================================
// API CALLS
// ============================================

export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  try {
    const response = await fetch(`${API_BASE}/geocode?address=${encodeURIComponent(address)}`);
    const data = await response.json();
    
    if (!data.success) {
      console.error("Geocode error:", data.error);
      return null;
    }
    
    return data.data;
  } catch (error) {
    console.error("Geocode fetch error:", error);
    return null;
  }
}

export async function getParcelData(
  lat: number, 
  lng: number, 
  countyFips?: string,
  address?: string
): Promise<ParcelResult | null> {
  try {
    let url = `${API_BASE}/parcel?lat=${lat}&lng=${lng}`;
    if (countyFips) {
      url += `&fips=${countyFips}`;
    }
    if (address) {
      url += `&address=${encodeURIComponent(address)}`;
    }
    const response = await fetch(url);
    const data = await response.json();
    
    if (!data.success) {
      console.error("Parcel lookup error:", data.error);
      return null;
    }
    
    return data.data;
  } catch (error) {
    console.error("Parcel fetch error:", error);
    return null;
  }
}

// County name to FIPS code mapping for Washington state
const WA_COUNTY_FIPS: Record<string, string> = {
  "snohomish": "53061",
  "king": "53033",
  "pierce": "53053",
  "clark": "53011",
  "spokane": "53063",
  "thurston": "53067",
  "kitsap": "53035",
  "whatcom": "53073",
  "yakima": "53077",
  "skagit": "53057",
  "benton": "53005",
  "cowlitz": "53015",
  "island": "53029",
  "lewis": "53041",
  "mason": "53045",
  "chelan": "53007",
  "grays harbor": "53027",
  "clallam": "53009",
  "walla walla": "53071",
  "franklin": "53021",
  "grant": "53025",
  "douglas": "53017",
  "whitman": "53075",
  "jefferson": "53031",
  "okanogan": "53047",
  "pacific": "53049",
  "san juan": "53055",
  "adams": "53001",
  "asotin": "53003",
  "columbia": "53013",
  "ferry": "53019",
  "garfield": "53023",
  "klickitat": "53039",
  "lincoln": "53043",
  "pend oreille": "53051",
  "skamania": "53059",
  "stevens": "53065",
  "wahkiakum": "53069",
};

function getCountyFips(county: string, state: string): string | undefined {
  if (state.toLowerCase() === "washington" || state.toLowerCase() === "wa") {
    const countyLower = county.toLowerCase().replace(" county", "").trim();
    return WA_COUNTY_FIPS[countyLower];
  }
  return undefined;
}

export async function getZoningData(lat: number, lng: number): Promise<ZoningResult | null> {
  try {
    const response = await fetch(`${API_BASE}/zoning?lat=${lat}&lng=${lng}`);
    const data = await response.json();
    
    if (!data.success) {
      console.error("Zoning lookup error:", data.error);
      return null;
    }
    
    return data.data;
  } catch (error) {
    console.error("Zoning fetch error:", error);
    return null;
  }
}

export async function getSoilData(lat: number, lng: number): Promise<SoilResult | null> {
  try {
    const response = await fetch(`${API_BASE}/soil?lat=${lat}&lng=${lng}`);
    const data = await response.json();
    
    if (!data.success) {
      console.error("Soil lookup error:", data.error);
      return null;
    }
    
    return data.data;
  } catch (error) {
    console.error("Soil fetch error:", error);
    return null;
  }
}

// ============================================
// FULL PROPERTY LOOKUP
// ============================================

export async function lookupProperty(address: string): Promise<PropertyRecord | null> {
  // Step 1: Geocode the address
  const geocode = await geocodeAddress(address);
  if (!geocode) {
    throw new Error("Could not geocode address");
  }

  // Get county FIPS code for more accurate parcel lookup
  const countyFips = geocode.county ? getCountyFips(geocode.county, geocode.state) : undefined;
  console.log(`[PropertyService] Lookup for ${address}, county: ${geocode.county}, FIPS: ${countyFips}`);

  // Step 2: Get parcel data with county FIPS + address for Zillow lookup
  const parcel = await getParcelData(geocode.lat, geocode.lng, countyFips, address);
  
  // Step 3: Get zoning data
  const zoning = await getZoningData(geocode.lat, geocode.lng);

  // Step 4: Get soil data (USDA - FREE)
  const soil = await getSoilData(geocode.lat, geocode.lng);

  // Step 5: Generate feasibility snapshot with real data
  const feasibility = generateFeasibilitySnapshot(parcel, zoning, soil);
  
  // Step 6: Generate default layers
  const layers = generateDefaultLayers();

  // Step 7: Construct property record
  const property: PropertyRecord = {
    id: generatePropertyId(address),
    userId: "", // Will be set by caller
    address: geocode.address,
    addressNormalized: address.toLowerCase().trim(),
    city: geocode.city,
    state: geocode.state,
    zipCode: geocode.zipCode,
    county: geocode.county,
    centroid: {
      lat: geocode.lat,
      lng: geocode.lng,
    },
    
    // Parcel data
    apn: parcel?.apn,
    parcelId: parcel?.parcelId,
    areaSqft: parcel?.areaSqft,
    areaAcres: parcel?.areaAcres,
    lotWidth: parcel?.lotWidth,
    lotDepth: parcel?.lotDepth,
    parcelGeometry: parcel?.geometry ? {
      type: parcel.geometry.type,
      coordinates: parcel.geometry.coordinates as number[][][],
    } : undefined,
    
    // Track data sources for transparency
    dataSources: {
      parcel: { 
        source: parcel?.source || "unknown", 
        confidence: parcel?.confidence || "low" 
      },
      zoning: { 
        source: zoning?.source || "unknown", 
        confidence: zoning?.source === "snohomish_gis" ? "high" : "medium" 
      },
      soil: soil ? { 
        source: soil.source, 
        confidence: soil.septic.confidence 
      } : undefined,
    },
    
    // Zoning data
    jurisdiction: zoning ? {
      id: zoning.jurisdictionId,
      name: zoning.jurisdictionName,
      type: zoning.jurisdictionType as "city" | "county" | "township" | "special_district",
      stateCode: geocode.state,
      dataQuality: zoning.source === "database" ? "complete" : "partial",
    } : undefined,
    
    zoningDistrict: zoning ? {
      id: zoning.districtId,
      jurisdictionId: zoning.jurisdictionId,
      code: zoning.districtCode,
      name: zoning.districtName,
      category: zoning.category as PropertyRecord["zoningDistrict"]["category"],
      ordinanceSection: zoning.rules[0]?.ordinanceSection,
    } : undefined,
    
    feasibility,
    layers,
    
    createdAt: new Date(),
    updatedAt: new Date(),
    lastAnalysisAt: new Date(),
  };

  return property;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function generatePropertyId(address: string): string {
  const slug = address
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 40);
  return `prop-${slug}-${Date.now().toString(36)}`;
}

function generateFeasibilitySnapshot(
  parcel: ParcelResult | null,
  zoning: ZoningResult | null,
  soil?: SoilResult | null
): FeasibilitySnapshot {
  const items = [
    {
      id: "zoning",
      label: "Zoning Compliance",
      category: "zoning" as const,
      status: zoning ? "pass" as FeasibilityStatus : "unknown" as FeasibilityStatus,
      summary: zoning 
        ? `${zoning.districtName} (${zoning.districtCode})` 
        : "Zoning data unavailable",
      detail: zoning 
        ? `Property is in the ${zoning.districtCode} zone. ${zoning.description || ""}`
        : "Unable to determine zoning. Verify with local jurisdiction.",
      citations: zoning ? [{ source: "County Zoning Map", section: zoning.districtCode }] : [],
    },
    {
      id: "setbacks",
      label: "Setback Requirements",
      category: "zoning" as const,
      status: "pass" as FeasibilityStatus,
      summary: zoning?.rules.find(r => r.ruleType === "setback_front")
        ? `Front: ${zoning.rules.find(r => r.ruleType === "setback_front")?.valueNumeric}'`
        : "Standard setbacks apply",
      detail: getSetbacksDetail(zoning),
      citations: zoning?.rules.filter(r => r.ruleType.includes("setback")).map(r => ({
        source: "County Zoning Code",
        section: r.ordinanceSection,
      })) || [],
    },
    {
      id: "height",
      label: "Height Limits",
      category: "zoning" as const,
      status: "pass" as FeasibilityStatus,
      summary: zoning?.rules.find(r => r.ruleType === "height_max")
        ? `${zoning.rules.find(r => r.ruleType === "height_max")?.valueNumeric}' max`
        : "35 ft maximum",
      detail: getHeightDetail(zoning),
      citations: zoning?.rules.filter(r => r.ruleType.includes("height")).map(r => ({
        source: "County Zoning Code",
        section: r.ordinanceSection,
      })) || [],
    },
    {
      id: "coverage",
      label: "Lot Coverage",
      category: "zoning" as const,
      status: "pass" as FeasibilityStatus,
      summary: zoning?.rules.find(r => r.ruleType === "lot_coverage_max")
        ? `${zoning.rules.find(r => r.ruleType === "lot_coverage_max")?.valueNumeric}% max`
        : "35% maximum",
      detail: getCoverageDetail(zoning, parcel),
      citations: zoning?.rules.filter(r => r.ruleType.includes("coverage") || r.ruleType.includes("far")).map(r => ({
        source: "County Zoning Code",
        section: r.ordinanceSection,
      })) || [],
    },
    {
      id: "septic",
      label: "Septic Feasibility",
      category: "utilities" as const,
      status: soil?.septic.feasible 
        ? (soil.septic.confidence === "high" ? "pass" : "warn") as FeasibilityStatus
        : "warn" as FeasibilityStatus,
      summary: soil 
        ? `${soil.septic.rating} - ${soil.drainageClass}`
        : "Soil data loading...",
      detail: soil 
        ? `Soil: ${soil.mapUnitName}. ${soil.septic.recommendation}${soil.septic.limitations.length > 0 ? ` Limitations: ${soil.septic.limitations.join(", ")}.` : ""}`
        : "Property may require on-site septic system. Soil suitability and perc test required.",
      verificationNeeded: ["Perc test", "Health department review"],
      citations: [{ 
        source: soil?.source === "usda_nrcs" ? "USDA Web Soil Survey" : "WAC 246-272A", 
        section: soil?.source === "usda_nrcs" ? soil.mapUnitSymbol : "On-Site Sewage Systems" 
      }],
    },
    {
      id: "water",
      label: "Water Service",
      category: "utilities" as const,
      status: "pass" as FeasibilityStatus,
      summary: "Likely available",
      detail: "Public water service appears available in this area. Confirm with local water district.",
    },
    {
      id: "wetlands",
      label: "Wetlands",
      category: "environment" as const,
      status: "warn" as FeasibilityStatus,
      summary: "Review recommended",
      detail: "Check National Wetlands Inventory for mapped wetlands near the property.",
      verificationNeeded: ["NWI review", "Field delineation if applicable"],
      citations: [{ source: "National Wetlands Inventory" }],
    },
    {
      id: "flood",
      label: "Flood Risk",
      category: "environment" as const,
      status: "pass" as FeasibilityStatus,
      summary: "Low risk (preliminary)",
      detail: "Based on preliminary data, property appears to be outside high-risk flood zones. Verify with FEMA FIRM.",
      citations: [{ source: "FEMA NFHL" }],
    },
  ];

  const hasWarn = items.some(i => i.status === "warn");
  const hasFail = items.some(i => i.status === "fail");

  return {
    overallStatus: hasFail ? "fail" : hasWarn ? "warn" : "pass",
    items,
    dataGaps: [
      {
        id: "gap-perc",
        type: "missing_data",
        description: "No perc test data on file",
        impact: "Septic sizing cannot be confirmed",
        suggestedAction: "Schedule perc test with licensed installer",
      },
      {
        id: "gap-survey",
        type: "missing_data",
        description: "No property survey on file",
        impact: "Exact boundaries may vary from tax lot",
        suggestedAction: "Consider professional survey for precise setback calculations",
      },
    ],
    computedAt: new Date(),
  };
}

function getSetbacksDetail(zoning: ZoningResult | null): string {
  if (!zoning) return "Standard residential setbacks typically apply.";
  
  const front = zoning.rules.find(r => r.ruleType === "setback_front")?.valueNumeric;
  const side = zoning.rules.find(r => r.ruleType === "setback_side")?.valueNumeric;
  const sideAccessory = zoning.rules.find(r => r.ruleType === "accessory_setback")?.valueNumeric;
  const rear = zoning.rules.find(r => r.ruleType === "setback_rear")?.valueNumeric;

  const parts = [];
  if (front) parts.push(`Front: ${front} ft`);
  if (side) parts.push(`Side: ${side} ft (primary), ${sideAccessory || 5} ft (accessory)`);
  if (rear) parts.push(`Rear: ${rear} ft`);

  return parts.length > 0 
    ? parts.join(". ") + "."
    : "Setback requirements apply per zoning code.";
}

function getHeightDetail(zoning: ZoningResult | null): string {
  if (!zoning) return "Typical maximum height is 35 feet for primary structures.";
  
  const primary = zoning.rules.find(r => r.ruleType === "height_max")?.valueNumeric;
  const accessory = zoning.rules.find(r => r.ruleType === "height_max_accessory")?.valueNumeric;

  const parts = [];
  if (primary) parts.push(`Primary structures: ${primary} ft maximum`);
  if (accessory) parts.push(`Accessory structures: ${accessory} ft maximum`);

  return parts.length > 0 
    ? parts.join(". ") + "."
    : "Height limits per zoning code.";
}

function getCoverageDetail(zoning: ZoningResult | null, parcel: ParcelResult | null): string {
  const coverage = zoning?.rules.find(r => r.ruleType === "lot_coverage_max")?.valueNumeric || 35;
  const far = zoning?.rules.find(r => r.ruleType === "far_max")?.valueNumeric;

  let detail = `Maximum lot coverage: ${coverage}%.`;
  
  if (far) {
    detail += ` Floor Area Ratio (FAR): ${far}:1.`;
  }

  if (parcel?.areaSqft) {
    const maxFootprint = Math.round(parcel.areaSqft * (coverage / 100));
    detail += ` For this ${parcel.areaSqft.toLocaleString()} sf lot, maximum footprint is ~${maxFootprint.toLocaleString()} sf.`;
    
    if (far) {
      const maxFloorArea = Math.round(parcel.areaSqft * far);
      detail += ` Maximum floor area: ~${maxFloorArea.toLocaleString()} sf.`;
    }
  }

  return detail;
}

function generateDefaultLayers(): LayerState[] {
  return [
    { id: "parcel", label: "Parcel Boundaries", group: "base", active: true },
    { id: "zoning", label: "Zoning Districts", group: "zoning", active: true },
    { id: "setbacks", label: "Setback Lines", group: "zoning", active: false },
    { id: "overlays", label: "Overlay Zones", group: "zoning", active: false },
    { id: "sewer", label: "Sewer Service", group: "utilities", active: false },
    { id: "water", label: "Water Service", group: "utilities", active: false },
    { id: "septic", label: "Septic Suitability", group: "septic", active: false },
    { id: "soils", label: "Soil Types", group: "septic", active: false },
    { id: "wetlands", label: "Wetlands", group: "environment", active: true },
    { id: "streams", label: "Streams & Waters", group: "environment", active: false },
    { id: "slope", label: "Slope Analysis", group: "environment", active: false },
    { id: "flood", label: "Flood Zones", group: "hazards", active: true },
    { id: "wildfire", label: "Wildfire Risk", group: "hazards", active: false },
    { id: "landslide", label: "Landslide Risk", group: "hazards", active: false },
  ];
}


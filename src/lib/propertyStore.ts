// ============================================
// PROPERTY STORE — Local Storage Persistence
// ============================================

import { PropertyRecord, FeasibilitySnapshot, LayerState, FeasibilityStatus } from "./types";

const PROPERTIES_KEY = "zoning_properties";

// ============================================
// CRUD Operations
// ============================================

export function getAllProperties(userId: string): PropertyRecord[] {
  if (typeof window === "undefined") return [];
  
  const stored = localStorage.getItem(PROPERTIES_KEY);
  if (!stored) return [];
  
  try {
    const all = JSON.parse(stored) as PropertyRecord[];
    return all
      .filter(p => p.userId === userId)
      .map(deserializeProperty);
  } catch {
    return [];
  }
}

export function getProperty(id: string): PropertyRecord | null {
  if (typeof window === "undefined") return null;
  
  const stored = localStorage.getItem(PROPERTIES_KEY);
  if (!stored) return null;
  
  try {
    const all = JSON.parse(stored) as PropertyRecord[];
    const property = all.find(p => p.id === id);
    return property ? deserializeProperty(property) : null;
  } catch {
    return null;
  }
}

export function saveProperty(property: PropertyRecord): PropertyRecord {
  if (typeof window === "undefined") return property;
  
  const stored = localStorage.getItem(PROPERTIES_KEY);
  let all: PropertyRecord[] = [];
  
  try {
    all = stored ? JSON.parse(stored) : [];
  } catch {
    all = [];
  }
  
  const existingIndex = all.findIndex(p => p.id === property.id);
  const now = new Date();
  
  const updatedProperty: PropertyRecord = {
    ...property,
    updatedAt: now,
    createdAt: existingIndex >= 0 ? all[existingIndex].createdAt : now,
  };
  
  if (existingIndex >= 0) {
    all[existingIndex] = updatedProperty;
  } else {
    all.push(updatedProperty);
  }
  
  localStorage.setItem(PROPERTIES_KEY, JSON.stringify(all));
  return updatedProperty;
}

export function deleteProperty(id: string): boolean {
  if (typeof window === "undefined") return false;
  
  const stored = localStorage.getItem(PROPERTIES_KEY);
  if (!stored) return false;
  
  try {
    const all = JSON.parse(stored) as PropertyRecord[];
    const filtered = all.filter(p => p.id !== id);
    localStorage.setItem(PROPERTIES_KEY, JSON.stringify(filtered));
    return true;
  } catch {
    return false;
  }
}

// ============================================
// Property Creation from Address
// ============================================

export function createPropertyFromAddress(
  userId: string,
  fullAddress: string
): PropertyRecord {
  const parsed = parseAddress(fullAddress);
  const id = generatePropertyId(fullAddress);
  
  // Generate mock feasibility data
  const feasibility = generateMockFeasibility();
  const layers = generateDefaultLayers();
  
  const property: PropertyRecord = {
    id,
    userId,
    address: parsed.address,
    addressNormalized: fullAddress.toLowerCase().trim(),
    city: parsed.city,
    state: parsed.state,
    zipCode: parsed.zip,
    centroid: getDefaultCoordinates(parsed.state),
    
    // Mock data - would come from real APIs
    areaSqft: Math.floor(Math.random() * 20000) + 8000,
    lotWidth: Math.floor(Math.random() * 50) + 60,
    lotDepth: Math.floor(Math.random() * 50) + 100,
    
    jurisdiction: {
      id: `jur-${parsed.city.toLowerCase().replace(/\s/g, "-")}`,
      name: parsed.city ? `${parsed.city}, ${parsed.state}` : parsed.state,
      type: "county",
      stateCode: parsed.state,
      dataQuality: "partial",
    },
    
    zoningDistrict: {
      id: "zone-r1",
      jurisdictionId: `jur-${parsed.city.toLowerCase().replace(/\s/g, "-")}`,
      code: "R-7200",
      name: "Single Family Residential",
      category: "residential_single",
      ordinanceSection: "Chapter 30.23",
    },
    
    feasibility,
    layers,
    
    createdAt: new Date(),
    updatedAt: new Date(),
    lastAnalysisAt: new Date(),
  };
  
  return saveProperty(property);
}

// ============================================
// Address Parsing
// ============================================

function parseAddress(fullAddress: string): { 
  address: string; 
  city: string; 
  state: string; 
  zip?: string; 
} {
  // Try comma-separated format first
  if (fullAddress.includes(",")) {
    const parts = fullAddress.split(",").map(p => p.trim());
    
    if (parts.length >= 3) {
      const address = parts[0];
      const city = parts[1];
      const stateZip = parts[2].split(" ").filter(Boolean);
      const state = stateZip[0] || "";
      const zip = stateZip[1] || undefined;
      return { address, city, state, zip };
    } else if (parts.length === 2) {
      return { address: parts[0], city: parts[1], state: "" };
    }
  }
  
  // Try to parse space-separated format
  const words = fullAddress.split(/\s+/);
  if (words.length >= 4) {
    let stateIdx = -1;
    let zipIdx = -1;
    
    for (let i = words.length - 1; i >= 0; i--) {
      if (/^\d{5}(-\d{4})?$/.test(words[i])) {
        zipIdx = i;
      } else if (/^[A-Z]{2}$/i.test(words[i]) && stateIdx === -1) {
        stateIdx = i;
      }
    }
    
    if (stateIdx > 0) {
      const address = words.slice(0, stateIdx - 1).join(" ");
      const city = words[stateIdx - 1];
      const state = words[stateIdx].toUpperCase();
      const zip = zipIdx > stateIdx ? words[zipIdx] : undefined;
      return { address, city, state, zip };
    }
  }
  
  return { address: fullAddress, city: "", state: "" };
}

function generatePropertyId(address: string): string {
  const slug = address
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 40);
  return `prop-${slug}-${Date.now().toString(36)}`;
}

function getDefaultCoordinates(state: string): { lat: number; lng: number } {
  // State centroid approximations
  const stateCoords: Record<string, { lat: number; lng: number }> = {
    WA: { lat: 47.5, lng: -120.5 },
    OR: { lat: 44.0, lng: -120.5 },
    CA: { lat: 37.0, lng: -120.0 },
    TX: { lat: 31.0, lng: -100.0 },
    FL: { lat: 28.0, lng: -82.0 },
    NY: { lat: 43.0, lng: -75.0 },
    // Add more as needed
  };
  
  return stateCoords[state.toUpperCase()] || { lat: 39.5, lng: -98.5 }; // US center
}

// ============================================
// Mock Data Generation
// ============================================

function generateMockFeasibility(): FeasibilitySnapshot {
  const items = [
    {
      id: "zoning",
      label: "Zoning Compliance",
      category: "zoning",
      status: "pass" as FeasibilityStatus,
      summary: "Residential use permitted",
      detail: "Property is zoned R-7200 (Single Family Residential). Primary dwelling, ADU, and accessory structures are permitted uses.",
      citations: [{ source: "County Zoning Code", section: "30.23.010" }],
    },
    {
      id: "setbacks",
      label: "Setback Requirements",
      category: "zoning",
      status: "pass" as FeasibilityStatus,
      summary: "Standard setbacks apply",
      detail: "Front: 25 ft, Side: 10 ft, Rear: 20 ft. Accessory structures: 5 ft from side/rear.",
      citations: [{ source: "County Zoning Code", section: "30.23.040" }],
    },
    {
      id: "height",
      label: "Height Limits",
      category: "zoning",
      status: "pass" as FeasibilityStatus,
      summary: "35 ft maximum",
      detail: "Primary structures: 35 ft max. Accessory structures: 20 ft max.",
      citations: [{ source: "County Zoning Code", section: "30.23.050" }],
    },
    {
      id: "coverage",
      label: "Lot Coverage",
      category: "zoning",
      status: "pass" as FeasibilityStatus,
      summary: "35% maximum coverage",
      detail: "Total impervious surface may not exceed 35% of lot area.",
      citations: [{ source: "County Zoning Code", section: "30.23.060" }],
    },
    {
      id: "septic",
      label: "Septic Feasibility",
      category: "utilities",
      status: "warn" as FeasibilityStatus,
      summary: "Likely feasible, verification needed",
      detail: "Property is outside sewer service area. Soil data suggests conventional septic may be suitable. Perc test required.",
      verificationNeeded: ["Perc test", "Health department review"],
      citations: [{ source: "WAC 246-272A", section: "On-Site Sewage Systems" }],
    },
    {
      id: "water",
      label: "Water Service",
      category: "utilities",
      status: "pass" as FeasibilityStatus,
      summary: "Public water available",
      detail: "Property is within water service area. Connection available.",
    },
    {
      id: "wetlands",
      label: "Wetlands",
      category: "environment",
      status: "warn" as FeasibilityStatus,
      summary: "Wetlands mapped nearby",
      detail: "NWI wetlands mapped within 200 ft of parcel. Buffer review may be required.",
      verificationNeeded: ["Critical areas review", "Wetland delineation if within 100 ft"],
      citations: [{ source: "National Wetlands Inventory" }],
    },
    {
      id: "flood",
      label: "Flood Risk",
      category: "environment",
      status: "pass" as FeasibilityStatus,
      summary: "Low flood risk",
      detail: "Property is in FEMA Zone X (minimal flood hazard). No flood insurance required.",
      citations: [{ source: "FEMA NFHL" }],
    },
    {
      id: "hazards",
      label: "Hazards",
      category: "hazards",
      status: "pass" as FeasibilityStatus,
      summary: "No major hazards identified",
      detail: "No wildfire, landslide, or seismic hazards mapped at this location.",
    },
  ];
  
  const hasWarning = items.some(i => i.status === "warn");
  const hasFail = items.some(i => i.status === "fail");
  
  return {
    overallStatus: hasFail ? "fail" : hasWarning ? "warn" : "pass",
    items,
    dataGaps: [
      {
        id: "gap-perc",
        type: "missing_data",
        description: "No perc test data on file",
        impact: "Septic sizing cannot be confirmed",
        suggestedAction: "Schedule perc test with licensed installer",
      },
    ],
    computedAt: new Date(),
  };
}

function generateDefaultLayers(): LayerState[] {
  return [
    { id: "zoning", label: "Zoning Districts", group: "zoning", active: true },
    { id: "setbacks", label: "Setback Lines", group: "zoning", active: false },
    { id: "overlays", label: "Overlay Zones", group: "zoning", active: false },
    { id: "sewer", label: "Sewer Service", group: "utilities", active: false },
    { id: "water", label: "Water Service", group: "utilities", active: false },
    { id: "septic", label: "Septic Suitability", group: "septic", active: true },
    { id: "soils", label: "Soil Types", group: "septic", active: false },
    { id: "wetlands", label: "Wetlands", group: "environment", active: true },
    { id: "streams", label: "Streams & Water", group: "environment", active: false },
    { id: "slope", label: "Slope Analysis", group: "environment", active: false },
    { id: "flood", label: "Flood Zones", group: "hazards", active: true },
    { id: "wildfire", label: "Wildfire Risk", group: "hazards", active: false },
    { id: "landslide", label: "Landslide Risk", group: "hazards", active: false },
  ];
}

// ============================================
// Serialization Helpers
// ============================================

function deserializeProperty(p: PropertyRecord): PropertyRecord {
  return {
    ...p,
    createdAt: new Date(p.createdAt),
    updatedAt: new Date(p.updatedAt),
    lastAnalysisAt: p.lastAnalysisAt ? new Date(p.lastAnalysisAt) : undefined,
    feasibility: p.feasibility ? {
      ...p.feasibility,
      computedAt: new Date(p.feasibility.computedAt),
    } : undefined,
  };
}




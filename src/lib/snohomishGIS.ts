// ============================================
// SNOHOMISH COUNTY GIS INTEGRATION
// ============================================
// FREE public data from Snohomish County, WA
// ArcGIS REST API - No API key required

// ============================================
// TYPES
// ============================================

export type ParcelData = {
  apn: string;
  parcelId: string;
  ownerName?: string;
  siteAddress?: string;
  city?: string;
  zipCode?: string;
  acreage?: number;
  lotSqft?: number;
  yearBuilt?: number;
  landUseCode?: string;
  landUseDescription?: string;
  geometry?: GeoJSON.Polygon;
};

export type ZoningData = {
  zoneCode: string;
  zoneName: string;
  zoneDescription?: string;
  jurisdiction: string;
  geometry?: GeoJSON.Polygon;
};

export type AddressResult = {
  address: string;
  city: string;
  zip: string;
  x: number;
  y: number;
  score: number;
};

// ============================================
// SNOHOMISH COUNTY GIS ENDPOINTS
// ============================================

// WORKING endpoint - verified Jan 2026
const SNOCO_CART_BASE = "https://gis.snoco.org/cart/rest/services";
const SNOCO_GIS_BASE = "https://gismaps.snoco.org/snocogis/rest/services";

const ENDPOINTS = {
  // Parcel data - USE THE CART ENDPOINT (verified working!)
  parcels: `${SNOCO_CART_BASE}/Basemaps/CART_Parcels/MapServer/0`,
  
  // Zoning
  zoning: `${SNOCO_GIS_BASE}/Zoning/MapServer/0`,
  
  // Address geocoding
  addressLocator: `${SNOCO_GIS_BASE}/Locators/SnoCo_Composite/GeocodeServer`,
  
  // Critical areas
  wetlands: `${SNOCO_GIS_BASE}/Critical_Areas/MapServer/0`,
  floodZones: `${SNOCO_GIS_BASE}/Flood/MapServer/0`,
  
  // Utilities
  sewerService: `${SNOCO_GIS_BASE}/Sewer/MapServer/0`,
  waterService: `${SNOCO_GIS_BASE}/Water/MapServer/0`,
};

// ============================================
// HELPER FUNCTIONS
// ============================================

async function queryFeatureLayer(
  endpoint: string,
  params: Record<string, string>
): Promise<any> {
  const url = new URL(`${endpoint}/query`);
  
  // Default params
  const queryParams = {
    f: "json",
    outFields: "*",
    returnGeometry: "true",
    ...params,
  };
  
  Object.entries(queryParams).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });

  try {
    const response = await fetch(url.toString(), {
      headers: {
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`GIS query failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Snohomish GIS query error:", error);
    throw error;
  }
}

function esriToGeoJSON(esriGeometry: any): GeoJSON.Polygon | null {
  if (!esriGeometry || !esriGeometry.rings) return null;
  
  return {
    type: "Polygon",
    coordinates: esriGeometry.rings,
  };
}

// ============================================
// PUBLIC API FUNCTIONS
// ============================================

/**
 * Geocode an address in Snohomish County
 */
export async function geocodeAddress(address: string): Promise<AddressResult | null> {
  try {
    const url = new URL(`${ENDPOINTS.addressLocator}/findAddressCandidates`);
    url.searchParams.append("SingleLine", address);
    url.searchParams.append("f", "json");
    url.searchParams.append("outFields", "*");
    url.searchParams.append("maxLocations", "1");

    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.candidates && data.candidates.length > 0) {
      const candidate = data.candidates[0];
      return {
        address: candidate.address,
        city: candidate.attributes?.City || "",
        zip: candidate.attributes?.Zip || "",
        x: candidate.location.x,
        y: candidate.location.y,
        score: candidate.score,
      };
    }

    return null;
  } catch (error) {
    console.error("Geocoding error:", error);
    return null;
  }
}

/**
 * Get parcel data by coordinates (lat/lng)
 */
export async function getParcelByLocation(lat: number, lng: number): Promise<ParcelData | null> {
  try {
    const result = await queryFeatureLayer(ENDPOINTS.parcels, {
      geometry: `${lng},${lat}`,
      geometryType: "esriGeometryPoint",
      spatialRel: "esriSpatialRelIntersects",
      inSR: "4326",
      outSR: "4326",
    });

    if (result.features && result.features.length > 0) {
      const feature = result.features[0];
      const attrs = feature.attributes;

      // Field mappings for CART_Parcels layer (verified Jan 2026)
      return {
        apn: attrs.PARCEL_ID || "",
        parcelId: attrs.OBJECTID?.toString() || "",
        ownerName: attrs.OWNERNAME || attrs.TAXPRNAME || "",
        siteAddress: attrs.SITUSLINE1 || "",
        city: attrs.SITUSCITY || "",
        zipCode: attrs.SITUSZIP || "",
        acreage: attrs.GIS_ACRES || attrs.TAB_ACRES,
        lotSqft: attrs.GIS_SQ_FT || (attrs.GIS_ACRES ? attrs.GIS_ACRES * 43560 : undefined),
        yearBuilt: undefined, // Not in this layer
        landUseCode: attrs.USECODE?.split(" ")[0] || "",
        landUseDescription: attrs.USECODE || "",
        geometry: esriToGeoJSON(feature.geometry) || undefined,
      };
    }

    return null;
  } catch (error) {
    console.error("Parcel query error:", error);
    return null;
  }
}

/**
 * Get parcel data by APN (Assessor Parcel Number)
 */
export async function getParcelByAPN(apn: string): Promise<ParcelData | null> {
  try {
    // Clean APN - remove dashes and spaces
    const cleanAPN = apn.replace(/[-\s]/g, "");
    
    const result = await queryFeatureLayer(ENDPOINTS.parcels, {
      where: `PARCEL_ID = '${cleanAPN}'`,
      outSR: "4326",
    });

    if (result.features && result.features.length > 0) {
      const feature = result.features[0];
      const attrs = feature.attributes;

      return {
        apn: attrs.PARCEL_ID || "",
        parcelId: attrs.OBJECTID?.toString() || "",
        ownerName: attrs.OWNERNAME || attrs.TAXPRNAME || "",
        siteAddress: attrs.SITUSLINE1 || "",
        city: attrs.SITUSCITY || "",
        zipCode: attrs.SITUSZIP || "",
        acreage: attrs.GIS_ACRES || attrs.TAB_ACRES,
        lotSqft: attrs.GIS_SQ_FT || (attrs.GIS_ACRES ? attrs.GIS_ACRES * 43560 : undefined),
        yearBuilt: undefined,
        landUseCode: attrs.USECODE?.split(" ")[0] || "",
        landUseDescription: attrs.USECODE || "",
        geometry: esriToGeoJSON(feature.geometry) || undefined,
      };
    }

    return null;
  } catch (error) {
    console.error("Parcel query error:", error);
    return null;
  }
}

/**
 * Search parcel by address (Snohomish County)
 */
export async function getParcelByAddress(address: string): Promise<ParcelData | null> {
  try {
    // Extract house number and street from address
    const match = address.match(/^(\d+)\s+(.+?)(?:,|\s+(?:SNOHOMISH|WA|98\d{3}))/i);
    if (!match) {
      console.log("[Snohomish GIS] Could not parse address:", address);
      return null;
    }
    
    const houseNum = match[1];
    const street = match[2].replace(/\s+/g, " ").trim().toUpperCase();
    
    // Search using SITUSLINE1 LIKE pattern
    const whereClause = `SITUSLINE1 LIKE '%${houseNum}%${street.split(" ")[0]}%'`;
    
    const result = await queryFeatureLayer(ENDPOINTS.parcels, {
      where: whereClause,
      outSR: "4326",
    });

    if (result.features && result.features.length > 0) {
      // Find best match
      const feature = result.features.find((f: any) => 
        f.attributes.SITUSLINE1?.includes(houseNum)
      ) || result.features[0];
      
      const attrs = feature.attributes;

      console.log(`[Snohomish GIS] Found parcel: ${attrs.SITUSLINE1}, ${attrs.GIS_ACRES} acres`);

      return {
        apn: attrs.PARCEL_ID || "",
        parcelId: attrs.OBJECTID?.toString() || "",
        ownerName: attrs.OWNERNAME || attrs.TAXPRNAME || "",
        siteAddress: attrs.SITUSLINE1 || "",
        city: attrs.SITUSCITY || "",
        zipCode: attrs.SITUSZIP || "",
        acreage: attrs.GIS_ACRES || attrs.TAB_ACRES,
        lotSqft: attrs.GIS_SQ_FT || (attrs.GIS_ACRES ? attrs.GIS_ACRES * 43560 : undefined),
        yearBuilt: undefined,
        landUseCode: attrs.USECODE?.split(" ")[0] || "",
        landUseDescription: attrs.USECODE || "",
        geometry: esriToGeoJSON(feature.geometry) || undefined,
      };
    }

    return null;
  } catch (error) {
    console.error("Parcel address search error:", error);
    return null;
  }
}

/**
 * Get zoning for a location
 */
export async function getZoningByLocation(lat: number, lng: number): Promise<ZoningData | null> {
  try {
    const result = await queryFeatureLayer(ENDPOINTS.zoning, {
      geometry: JSON.stringify({
        x: lng,
        y: lat,
        spatialReference: { wkid: 4326 },
      }),
      geometryType: "esriGeometryPoint",
      spatialRel: "esriSpatialRelIntersects",
      inSR: "4326",
      outSR: "4326",
    });

    if (result.features && result.features.length > 0) {
      const feature = result.features[0];
      const attrs = feature.attributes;

      return {
        zoneCode: attrs.ZONE_CODE || attrs.ZONING || attrs.ZONE || "",
        zoneName: attrs.ZONE_NAME || attrs.ZONE_DESC || attrs.DESCRIPTION || "",
        zoneDescription: attrs.ZONE_DESCRIPTION || attrs.FULL_DESC || "",
        jurisdiction: attrs.JURISDICTION || attrs.JURIS || "Snohomish County",
        geometry: esriToGeoJSON(feature.geometry) || undefined,
      };
    }

    return null;
  } catch (error) {
    console.error("Zoning query error:", error);
    return null;
  }
}

/**
 * Check if location is in wetlands
 */
export async function checkWetlands(lat: number, lng: number): Promise<{
  inWetland: boolean;
  wetlandType?: string;
  bufferRequired?: number;
} | null> {
  try {
    const result = await queryFeatureLayer(ENDPOINTS.wetlands, {
      geometry: JSON.stringify({
        x: lng,
        y: lat,
        spatialReference: { wkid: 4326 },
      }),
      geometryType: "esriGeometryPoint",
      spatialRel: "esriSpatialRelIntersects",
      inSR: "4326",
    });

    if (result.features && result.features.length > 0) {
      const attrs = result.features[0].attributes;
      return {
        inWetland: true,
        wetlandType: attrs.WETLAND_TYPE || attrs.TYPE || "Unknown",
        bufferRequired: attrs.BUFFER || 50, // Default 50ft buffer
      };
    }

    return { inWetland: false };
  } catch (error) {
    console.error("Wetlands query error:", error);
    return null;
  }
}

/**
 * Check flood zone
 */
export async function checkFloodZone(lat: number, lng: number): Promise<{
  inFloodZone: boolean;
  zoneCode?: string;
  zoneDescription?: string;
} | null> {
  try {
    const result = await queryFeatureLayer(ENDPOINTS.floodZones, {
      geometry: JSON.stringify({
        x: lng,
        y: lat,
        spatialReference: { wkid: 4326 },
      }),
      geometryType: "esriGeometryPoint",
      spatialRel: "esriSpatialRelIntersects",
      inSR: "4326",
    });

    if (result.features && result.features.length > 0) {
      const attrs = result.features[0].attributes;
      const zoneCode = attrs.FLD_ZONE || attrs.ZONE || attrs.SFHA || "";
      
      // X zones are minimal flood risk
      const inFloodZone = !zoneCode.startsWith("X") && zoneCode !== "";
      
      return {
        inFloodZone,
        zoneCode,
        zoneDescription: getFloodZoneDescription(zoneCode),
      };
    }

    return { inFloodZone: false };
  } catch (error) {
    console.error("Flood zone query error:", error);
    return null;
  }
}

function getFloodZoneDescription(code: string): string {
  const descriptions: Record<string, string> = {
    A: "100-year flood zone (1% annual chance)",
    AE: "100-year flood zone with Base Flood Elevation",
    AH: "100-year flood zone, shallow flooding",
    AO: "100-year flood zone, sheet flow",
    V: "Coastal high hazard area",
    VE: "Coastal high hazard with Base Flood Elevation",
    X: "Minimal flood risk",
    "X SHADED": "500-year flood zone (0.2% annual chance)",
  };
  
  return descriptions[code.toUpperCase()] || `Flood Zone ${code}`;
}

/**
 * Check sewer service availability
 */
export async function checkSewerService(lat: number, lng: number): Promise<{
  available: boolean;
  provider?: string;
  distanceToMain?: number;
} | null> {
  try {
    // First check if in service area
    const result = await queryFeatureLayer(ENDPOINTS.sewerService, {
      geometry: JSON.stringify({
        x: lng,
        y: lat,
        spatialReference: { wkid: 4326 },
      }),
      geometryType: "esriGeometryPoint",
      spatialRel: "esriSpatialRelIntersects",
      inSR: "4326",
    });

    if (result.features && result.features.length > 0) {
      const attrs = result.features[0].attributes;
      return {
        available: true,
        provider: attrs.PROVIDER || attrs.UTILITY || attrs.NAME || "Local Sewer District",
      };
    }

    return { available: false };
  } catch (error) {
    console.error("Sewer service query error:", error);
    return null;
  }
}

/**
 * Check water service availability
 */
export async function checkWaterService(lat: number, lng: number): Promise<{
  available: boolean;
  provider?: string;
} | null> {
  try {
    const result = await queryFeatureLayer(ENDPOINTS.waterService, {
      geometry: JSON.stringify({
        x: lng,
        y: lat,
        spatialReference: { wkid: 4326 },
      }),
      geometryType: "esriGeometryPoint",
      spatialRel: "esriSpatialRelIntersects",
      inSR: "4326",
    });

    if (result.features && result.features.length > 0) {
      const attrs = result.features[0].attributes;
      return {
        available: true,
        provider: attrs.PROVIDER || attrs.UTILITY || attrs.NAME || "Local Water District",
      };
    }

    return { available: false };
  } catch (error) {
    console.error("Water service query error:", error);
    return null;
  }
}

/**
 * Get all property data for a location
 */
export async function getFullPropertyData(lat: number, lng: number): Promise<{
  parcel: ParcelData | null;
  zoning: ZoningData | null;
  wetlands: { inWetland: boolean; wetlandType?: string; bufferRequired?: number } | null;
  floodZone: { inFloodZone: boolean; zoneCode?: string; zoneDescription?: string } | null;
  sewer: { available: boolean; provider?: string } | null;
  water: { available: boolean; provider?: string } | null;
}> {
  // Run all queries in parallel for speed
  const [parcel, zoning, wetlands, floodZone, sewer, water] = await Promise.all([
    getParcelByLocation(lat, lng),
    getZoningByLocation(lat, lng),
    checkWetlands(lat, lng),
    checkFloodZone(lat, lng),
    checkSewerService(lat, lng),
    checkWaterService(lat, lng),
  ]);

  return { parcel, zoning, wetlands, floodZone, sewer, water };
}


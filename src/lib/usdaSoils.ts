// ============================================
// USDA WEB SOIL SURVEY INTEGRATION
// ============================================
// FREE public soil data from NRCS
// Critical for septic feasibility analysis
// No API key required

// ============================================
// TYPES
// ============================================

export type SoilMapUnit = {
  mukey: string;          // Map unit key
  musym: string;          // Map unit symbol
  muname: string;         // Map unit name
  mukind: string;         // Map unit kind (e.g., "Consociation")
  muacres: number;        // Acres in the map unit
};

export type SoilComponent = {
  cokey: string;          // Component key
  compname: string;       // Component name
  comppct: number;        // Component percentage
  slope: { low: number; high: number };
  drainageClass: string;  // e.g., "Well drained", "Poorly drained"
  hydricRating: string;   // "Yes", "No", "Unknown"
  taxorder: string;       // Taxonomic order
};

export type SepticSuitability = {
  rating: "well_suited" | "somewhat_limited" | "very_limited" | "not_rated";
  ratingName: string;
  limitations: string[];
  explanation: string;
};

export type SoilData = {
  mapUnit: SoilMapUnit;
  primaryComponent: SoilComponent;
  septicSuitability: SepticSuitability;
  depthToWaterTable: { min: number; max: number } | null;
  depthToBedrock: number | null;
  floodingFrequency: string;
  pondingFrequency: string;
  permeability: { slow: number; fast: number } | null; // inches/hour
  percolationSuitable: boolean;
};

// ============================================
// USDA SOIL DATA ACCESS API
// ============================================

const SDAC_URL = "https://sdmdataaccess.sc.egov.usda.gov/Tabular/post.rest";
const WFS_URL = "https://sdmwfs.sc.egov.usda.gov/wfs";

/**
 * Execute SQL query against Soil Data Access
 */
async function querySoilDataAccess(sql: string): Promise<any> {
  try {
    const response = await fetch(SDAC_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        query: sql,
        format: "JSON",
      }),
    });

    if (!response.ok) {
      throw new Error(`USDA query failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("USDA Soil Data Access error:", error);
    throw error;
  }
}

/**
 * Get the Map Unit Key (mukey) for a geographic point
 * Uses WFS to find which soil polygon contains the point
 */
async function getMapUnitKeyByLocation(lat: number, lng: number): Promise<string | null> {
  try {
    // Use a bounding box around the point
    const buffer = 0.0001; // ~10 meters
    const bbox = `${lng - buffer},${lat - buffer},${lng + buffer},${lat + buffer}`;
    
    const url = new URL(WFS_URL);
    url.searchParams.append("service", "WFS");
    url.searchParams.append("version", "1.1.0");
    url.searchParams.append("request", "GetFeature");
    url.searchParams.append("typename", "MapunitPoly");
    url.searchParams.append("bbox", `${bbox},EPSG:4326`);
    url.searchParams.append("outputFormat", "application/json");

    const response = await fetch(url.toString());
    
    if (!response.ok) {
      // Fallback: Use alternative method via SDA query
      return await getMapUnitKeyBySDA(lat, lng);
    }

    const data = await response.json();
    
    if (data.features && data.features.length > 0) {
      return data.features[0].properties?.mukey || null;
    }

    return null;
  } catch (error) {
    console.error("WFS query failed, trying SDA fallback:", error);
    return await getMapUnitKeyBySDA(lat, lng);
  }
}

/**
 * Fallback method to get mukey using Soil Data Access
 */
async function getMapUnitKeyBySDA(lat: number, lng: number): Promise<string | null> {
  // This uses the SDA spatial query capability
  const sql = `
    SELECT TOP 1 mukey
    FROM SDA_Get_Mukey_from_intersection_with_WktWgs84(
      'POINT(${lng} ${lat})'
    )
  `;

  try {
    const result = await querySoilDataAccess(sql);
    
    if (result.Table && result.Table.length > 0) {
      return result.Table[0][0];
    }
    return null;
  } catch (error) {
    console.error("SDA mukey query error:", error);
    return null;
  }
}

/**
 * Get map unit info by mukey
 */
async function getMapUnitInfo(mukey: string): Promise<SoilMapUnit | null> {
  const sql = `
    SELECT mukey, musym, muname, mukind, muacres
    FROM mapunit
    WHERE mukey = '${mukey}'
  `;

  try {
    const result = await querySoilDataAccess(sql);
    
    if (result.Table && result.Table.length > 0) {
      const row = result.Table[0];
      return {
        mukey: row[0],
        musym: row[1] || "",
        muname: row[2] || "Unknown",
        mukind: row[3] || "",
        muacres: parseFloat(row[4]) || 0,
      };
    }
    return null;
  } catch (error) {
    console.error("Map unit info query error:", error);
    return null;
  }
}

/**
 * Get the primary component for a map unit
 */
async function getPrimaryComponent(mukey: string): Promise<SoilComponent | null> {
  const sql = `
    SELECT TOP 1 
      c.cokey, c.compname, c.comppct_r, 
      c.slope_l, c.slope_h,
      c.drainagecl, c.hydricrating, c.taxorder
    FROM component c
    WHERE c.mukey = '${mukey}'
    ORDER BY c.comppct_r DESC
  `;

  try {
    const result = await querySoilDataAccess(sql);
    
    if (result.Table && result.Table.length > 0) {
      const row = result.Table[0];
      return {
        cokey: row[0],
        compname: row[1] || "Unknown",
        comppct: parseFloat(row[2]) || 0,
        slope: {
          low: parseFloat(row[3]) || 0,
          high: parseFloat(row[4]) || 0,
        },
        drainageClass: row[5] || "Unknown",
        hydricRating: row[6] || "Unknown",
        taxorder: row[7] || "",
      };
    }
    return null;
  } catch (error) {
    console.error("Component query error:", error);
    return null;
  }
}

/**
 * Get septic tank absorption field suitability
 */
async function getSepticSuitability(mukey: string): Promise<SepticSuitability> {
  const sql = `
    SELECT TOP 1 
      interplr.interphrc AS rating,
      interplr.rulename,
      mrulename.ruledepth
    FROM mapunit mu
    INNER JOIN muaggatt muagg ON muagg.mukey = mu.mukey
    LEFT JOIN cointerp interplr ON interplr.mukey = mu.mukey
    WHERE mu.mukey = '${mukey}'
      AND interplr.rulename LIKE '%Septic%Absorption%'
    ORDER BY interplr.interphrc
  `;

  try {
    const result = await querySoilDataAccess(sql);
    
    if (result.Table && result.Table.length > 0) {
      const ratingText = result.Table[0][0] || "";
      
      return {
        rating: parseRating(ratingText),
        ratingName: ratingText,
        limitations: await getSepticLimitations(mukey),
        explanation: getExplanationForRating(parseRating(ratingText)),
      };
    }

    // Default if no data
    return {
      rating: "not_rated",
      ratingName: "Not Rated",
      limitations: [],
      explanation: "Soil data not available for septic suitability. A professional soil evaluation is required.",
    };
  } catch (error) {
    console.error("Septic suitability query error:", error);
    return {
      rating: "not_rated",
      ratingName: "Error retrieving data",
      limitations: [],
      explanation: "Could not retrieve soil suitability data. Contact local health department for evaluation.",
    };
  }
}

/**
 * Get specific limitations for septic systems
 */
async function getSepticLimitations(mukey: string): Promise<string[]> {
  const sql = `
    SELECT DISTINCT interplr.interplrc AS limitation
    FROM cointerp interplr
    WHERE interplr.mukey = '${mukey}'
      AND interplr.rulename LIKE '%Septic%'
      AND interplr.interplrc IS NOT NULL
      AND interplr.interplrc != ''
  `;

  try {
    const result = await querySoilDataAccess(sql);
    
    if (result.Table && result.Table.length > 0) {
      return result.Table.map((row: string[]) => row[0]).filter(Boolean);
    }
    return [];
  } catch (error) {
    return [];
  }
}

/**
 * Get depth to water table
 */
async function getWaterTableDepth(cokey: string): Promise<{ min: number; max: number } | null> {
  const sql = `
    SELECT TOP 1 soimoistdept_l, soimoistdept_r, soimoistdept_h
    FROM cosoilmoist
    WHERE cokey = '${cokey}'
      AND soimoiststat = 'Wet'
    ORDER BY soimoistdept_l
  `;

  try {
    const result = await querySoilDataAccess(sql);
    
    if (result.Table && result.Table.length > 0) {
      const row = result.Table[0];
      return {
        min: parseFloat(row[0]) || 0,
        max: parseFloat(row[2]) || parseFloat(row[1]) || 200,
      };
    }
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Get depth to bedrock
 */
async function getBedrockDepth(cokey: string): Promise<number | null> {
  const sql = `
    SELECT TOP 1 resdept_r
    FROM corestrictions
    WHERE cokey = '${cokey}'
      AND reskind LIKE '%Bedrock%'
  `;

  try {
    const result = await querySoilDataAccess(sql);
    
    if (result.Table && result.Table.length > 0) {
      return parseFloat(result.Table[0][0]) || null;
    }
    return null;
  } catch (error) {
    return null;
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function parseRating(ratingText: string): SepticSuitability["rating"] {
  const lower = ratingText.toLowerCase();
  if (lower.includes("not limited") || lower.includes("well suited")) {
    return "well_suited";
  } else if (lower.includes("somewhat limited")) {
    return "somewhat_limited";
  } else if (lower.includes("very limited") || lower.includes("not suited")) {
    return "very_limited";
  }
  return "not_rated";
}

function getExplanationForRating(rating: SepticSuitability["rating"]): string {
  switch (rating) {
    case "well_suited":
      return "This soil is generally suitable for conventional septic systems. Standard drainfield designs should work well.";
    case "somewhat_limited":
      return "This soil has moderate limitations for septic systems. You may need an engineered or alternative system design. Additional testing recommended.";
    case "very_limited":
      return "This soil has severe limitations for septic systems. Alternative treatment systems (mound, ATT, etc.) will likely be required. Professional evaluation essential.";
    default:
      return "Soil suitability data not available. A professional soil evaluation and perc test will be required.";
  }
}

// ============================================
// PUBLIC API
// ============================================

/**
 * Get complete soil data for a location
 */
export async function getSoilDataByLocation(lat: number, lng: number): Promise<SoilData | null> {
  try {
    // Step 1: Get the map unit key for this location
    const mukey = await getMapUnitKeyByLocation(lat, lng);
    
    if (!mukey) {
      console.log("No soil map unit found for location");
      return null;
    }

    // Step 2: Get all the data in parallel
    const [mapUnit, primaryComponent, septicSuitability] = await Promise.all([
      getMapUnitInfo(mukey),
      getPrimaryComponent(mukey),
      getSepticSuitability(mukey),
    ]);

    if (!mapUnit || !primaryComponent) {
      return null;
    }

    // Step 3: Get additional details
    const [waterTable, bedrock] = await Promise.all([
      getWaterTableDepth(primaryComponent.cokey),
      getBedrockDepth(primaryComponent.cokey),
    ]);

    // Determine percolation suitability based on drainage class
    const percolationSuitable = isPercolationSuitable(primaryComponent.drainageClass);

    return {
      mapUnit,
      primaryComponent,
      septicSuitability,
      depthToWaterTable: waterTable,
      depthToBedrock: bedrock,
      floodingFrequency: "None", // TODO: query this
      pondingFrequency: "None",  // TODO: query this
      permeability: null,        // TODO: query this
      percolationSuitable,
    };
  } catch (error) {
    console.error("Error getting soil data:", error);
    return null;
  }
}

function isPercolationSuitable(drainageClass: string): boolean {
  const good = ["well drained", "somewhat excessively drained", "excessively drained"];
  const marginal = ["moderately well drained"];
  const lower = drainageClass.toLowerCase();
  
  if (good.some(g => lower.includes(g))) return true;
  if (marginal.some(m => lower.includes(m))) return true;
  return false;
}

/**
 * Simple check if septic is likely feasible
 */
export async function checkSepticFeasibility(lat: number, lng: number): Promise<{
  feasible: boolean;
  confidence: "high" | "medium" | "low";
  rating: string;
  limitations: string[];
  recommendation: string;
}> {
  const soilData = await getSoilDataByLocation(lat, lng);

  if (!soilData) {
    return {
      feasible: false,
      confidence: "low",
      rating: "Unknown",
      limitations: ["Unable to retrieve soil data"],
      recommendation: "Professional soil evaluation required. Contact local health department.",
    };
  }

  const { septicSuitability, depthToWaterTable, primaryComponent } = soilData;

  // Check water table depth (need at least 2-4 feet typically)
  const waterTableOK = !depthToWaterTable || depthToWaterTable.min >= 24;
  
  // Combine ratings
  let feasible = septicSuitability.rating === "well_suited" || 
                 septicSuitability.rating === "somewhat_limited";
  
  // Adjust for water table
  if (!waterTableOK && septicSuitability.rating !== "well_suited") {
    feasible = false;
  }

  let recommendation: string;
  if (septicSuitability.rating === "well_suited" && waterTableOK) {
    recommendation = "Standard conventional septic system likely suitable. Proceed with perc test.";
  } else if (septicSuitability.rating === "somewhat_limited") {
    recommendation = "Alternative septic design may be needed. Consult with septic designer.";
  } else {
    recommendation = "Significant challenges for septic. Professional evaluation required. Consider mound or ATT system.";
  }

  return {
    feasible,
    confidence: soilData ? "medium" : "low",
    rating: `${septicSuitability.ratingName} - ${primaryComponent.drainageClass}`,
    limitations: [
      ...septicSuitability.limitations,
      ...(waterTableOK ? [] : ["High water table"]),
    ],
    recommendation,
  };
}

/**
 * Get soil type description (for display)
 */
export async function getSoilDescription(lat: number, lng: number): Promise<string> {
  const soilData = await getSoilDataByLocation(lat, lng);
  
  if (!soilData) {
    return "Soil data not available";
  }

  const { mapUnit, primaryComponent } = soilData;
  return `${mapUnit.muname} (${primaryComponent.drainageClass}, ${primaryComponent.slope.low}-${primaryComponent.slope.high}% slope)`;
}




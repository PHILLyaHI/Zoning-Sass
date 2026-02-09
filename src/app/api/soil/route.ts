import { NextRequest, NextResponse } from "next/server";
import { getSoilDataByLocation, checkSepticFeasibility, type SoilData } from "../../../lib/usdaSoils";

// ============================================
// SOIL API ROUTE
// ============================================
// Uses USDA Web Soil Survey (FREE) for real soil data

export type SoilResult = {
  mapUnitName: string;
  mapUnitSymbol: string;
  componentName: string;
  drainageClass: string;
  slope: { low: number; high: number };
  hydricRating: string;
  septic: {
    feasible: boolean;
    rating: string;
    limitations: string[];
    recommendation: string;
    confidence: "high" | "medium" | "low";
  };
  depthToWaterTable?: { min: number; max: number };
  depthToBedrock?: number;
  percolationSuitable: boolean;
  source: "usda_nrcs" | "mock";
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
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);

    // Get full soil data from USDA
    const soilData = await getSoilDataByLocation(latNum, lngNum);
    const septicCheck = await checkSepticFeasibility(latNum, lngNum);

    if (soilData) {
      const result: SoilResult = {
        mapUnitName: soilData.mapUnit.muname,
        mapUnitSymbol: soilData.mapUnit.musym,
        componentName: soilData.primaryComponent.compname,
        drainageClass: soilData.primaryComponent.drainageClass,
        slope: soilData.primaryComponent.slope,
        hydricRating: soilData.primaryComponent.hydricRating,
        septic: {
          feasible: septicCheck.feasible,
          rating: septicCheck.rating,
          limitations: septicCheck.limitations,
          recommendation: septicCheck.recommendation,
          confidence: septicCheck.confidence,
        },
        depthToWaterTable: soilData.depthToWaterTable || undefined,
        depthToBedrock: soilData.depthToBedrock || undefined,
        percolationSuitable: soilData.percolationSuitable,
        source: "usda_nrcs",
      };

      return NextResponse.json({
        success: true,
        data: result,
      });
    }

    // Return mock data if USDA data unavailable
    const mockResult = generateMockSoilData(latNum, lngNum);
    return NextResponse.json({
      success: true,
      data: mockResult,
    });
  } catch (error) {
    console.error("Soil lookup error:", error);
    
    // Return mock data on error
    const mockResult = generateMockSoilData(
      parseFloat(lat),
      parseFloat(lng)
    );
    return NextResponse.json({
      success: true,
      data: mockResult,
    });
  }
}

// ============================================
// MOCK DATA FALLBACK
// ============================================

function generateMockSoilData(lat: number, lng: number): SoilResult {
  // Snohomish County has varied soils - simulate common types
  const soilTypes = [
    {
      name: "Alderwood gravelly sandy loam",
      symbol: "AgC",
      drainage: "Moderately well drained",
      septicRating: "Somewhat Limited",
      feasible: true,
      limitations: ["Depth to dense layer", "Slow permeability"],
    },
    {
      name: "Everett gravelly sandy loam",
      symbol: "EvC",
      drainage: "Somewhat excessively drained",
      septicRating: "Not Limited",
      feasible: true,
      limitations: [],
    },
    {
      name: "Mukilteo muck",
      symbol: "Mu",
      drainage: "Very poorly drained",
      septicRating: "Very Limited",
      feasible: false,
      limitations: ["Ponding", "High water table", "Hydric soil"],
    },
  ];

  // Select based on coordinates (deterministic)
  const index = Math.abs(Math.floor((lat + lng) * 1000)) % soilTypes.length;
  const soil = soilTypes[index];

  return {
    mapUnitName: soil.name,
    mapUnitSymbol: soil.symbol,
    componentName: soil.name.split(" ")[0],
    drainageClass: soil.drainage,
    slope: { low: 0, high: 8 },
    hydricRating: soil.drainage.includes("poorly") ? "Yes" : "No",
    septic: {
      feasible: soil.feasible,
      rating: soil.septicRating,
      limitations: soil.limitations,
      recommendation: soil.feasible 
        ? "Standard septic system likely suitable. Schedule perc test to confirm."
        : "Alternative septic system required. Consult with designer.",
      confidence: "medium",
    },
    depthToWaterTable: soil.drainage.includes("poorly") 
      ? { min: 0, max: 24 } 
      : { min: 48, max: 80 },
    percolationSuitable: soil.feasible,
    source: "mock",
  };
}




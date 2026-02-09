import { NextRequest, NextResponse } from "next/server";
import { getParcelData, type ParcelResult as MultiSourceParcel } from "../../../lib/parcelDataSources";

// ============================================
// PARCEL API ROUTE
// ============================================
// Uses multiple FREE data sources:
// 1. County GIS (when available)
// 2. OpenStreetMap (for buildings)
// 3. Estimated fallback

export type ParcelResult = {
  apn?: string;
  parcelId?: string;
  ownerName?: string;
  siteAddress?: string;
  areaSqft: number;
  areaAcres: number;
  lotWidth?: number;
  lotDepth?: number;
  yearBuilt?: number;
  landUseCode?: string;
  landUseDescription?: string;
  geometry?: {
    type: "Polygon";
    coordinates: number[][][];
  };
  existingStructures?: {
    id: string;
    type: string;
    areaSqft: number;
    geometry: any;
  }[];
  source: string;
  confidence: "high" | "medium" | "low";
};

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  const countyFips = searchParams.get("fips");
  const address = searchParams.get("address");

  if (!lat || !lng) {
    return NextResponse.json(
      { success: false, error: "lat and lng parameters are required" },
      { status: 400 }
    );
  }

  try {
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    
    // Get parcel data from multiple sources (including Zillow if configured)
    const parcelData = await getParcelData(
      latNum, 
      lngNum, 
      countyFips || undefined,
      address || undefined
    );
    
    // Calculate lot dimensions from area
    const lotWidth = estimateLotWidth(parcelData.areaSqft);
    const lotDepth = estimateLotDepth(parcelData.areaSqft);
    
    const result: ParcelResult = {
      apn: parcelData.apn,
      siteAddress: parcelData.address,
      ownerName: parcelData.owner,
      areaSqft: parcelData.areaSqft,
      areaAcres: parcelData.areaAcres,
      lotWidth,
      lotDepth,
      geometry: parcelData.geometry ? {
        type: "Polygon",
        coordinates: parcelData.geometry.coordinates as number[][][],
      } : undefined,
      existingStructures: parcelData.existingStructures?.map(s => ({
        id: s.id,
        type: s.type,
        areaSqft: s.areaSqft,
        geometry: s.geometry,
      })),
      source: parcelData.source,
      confidence: parcelData.confidence,
    };

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Parcel lookup error:", error);
    
    // Return estimated data on error
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    
    return NextResponse.json({
      success: true,
      data: generateFallbackParcel(latNum, lngNum),
    });
  }
}

// ============================================
// HELPERS
// ============================================

function estimateLotWidth(areaSqft: number): number {
  // Assume roughly 2:3 width to depth ratio
  return Math.round(Math.sqrt(areaSqft * 0.67));
}

function estimateLotDepth(areaSqft: number): number {
  return Math.round(Math.sqrt(areaSqft / 0.67));
}

function generateFallbackParcel(lat: number, lng: number): ParcelResult {
  const halfSize = 0.001; // ~350ft
  
  return {
    areaSqft: 43560,
    areaAcres: 1,
    lotWidth: 180,
    lotDepth: 240,
    geometry: {
      type: "Polygon",
      coordinates: [[
        [lng - halfSize, lat - halfSize],
        [lng + halfSize, lat - halfSize],
        [lng + halfSize, lat + halfSize],
        [lng - halfSize, lat + halfSize],
        [lng - halfSize, lat - halfSize],
      ]],
    },
    source: "fallback",
    confidence: "low",
  };
}

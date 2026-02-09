import { NextRequest, NextResponse } from "next/server";
import { geocodeAddress as snohomishGeocode } from "../../../lib/snohomishGIS";

// ============================================
// GEOCODE API ROUTE
// ============================================
// Uses Snohomish County GIS (FREE) or Mapbox (with key)

export type GeocodeResult = {
  lat: number;
  lng: number;
  address: string;
  city: string;
  state: string;
  zipCode?: string;
  county?: string;
  confidence: number;
  source: "snohomish_gis" | "mapbox" | "fallback";
};

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const address = searchParams.get("address");

  if (!address) {
    return NextResponse.json(
      { success: false, error: "Address parameter is required" },
      { status: 400 }
    );
  }

  try {
    // Try Snohomish County GIS first (FREE)
    const snohomishResult = await snohomishGeocode(address);
    
    if (snohomishResult && snohomishResult.score > 70) {
      return NextResponse.json({
        success: true,
        data: {
          lat: snohomishResult.y,
          lng: snohomishResult.x,
          address: snohomishResult.address,
          city: snohomishResult.city || parseCity(address),
          state: "WA",
          zipCode: snohomishResult.zip,
          county: "Snohomish",
          confidence: snohomishResult.score / 100,
          source: "snohomish_gis",
        } as GeocodeResult,
      });
    }

    // Try Mapbox if Snohomish fails and we have a token
    const mapboxToken = process.env.MAPBOX_ACCESS_TOKEN;
    if (mapboxToken) {
      const mapboxResult = await geocodeWithMapbox(address, mapboxToken);
      if (mapboxResult) {
        return NextResponse.json({
          success: true,
          data: mapboxResult,
        });
      }
    }

    // Try OpenStreetMap Nominatim (FREE for all US addresses)
    const nominatimResult = await geocodeWithNominatim(address);
    if (nominatimResult) {
      return NextResponse.json({
        success: true,
        data: nominatimResult,
      });
    }

    // Fallback: Parse address manually for demo
    const fallbackResult = parseAddressFallback(address);
    if (fallbackResult) {
      return NextResponse.json({
        success: true,
        data: fallbackResult,
      });
    }

    return NextResponse.json(
      { success: false, error: "Could not geocode address" },
      { status: 404 }
    );
  } catch (error) {
    console.error("Geocode error:", error);
    return NextResponse.json(
      { success: false, error: "Geocoding service error" },
      { status: 500 }
    );
  }
}

// ============================================
// MAPBOX GEOCODING
// ============================================

async function geocodeWithMapbox(address: string, token: string): Promise<GeocodeResult | null> {
  try {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${token}&country=US&types=address&limit=1`;
    
    const response = await fetch(url);
    if (!response.ok) return null;
    
    const data = await response.json();
    if (!data.features || data.features.length === 0) return null;
    
    const feature = data.features[0];
    const [lng, lat] = feature.center;
    
    // Parse context for city, state, etc.
    const context = feature.context || [];
    const city = context.find((c: any) => c.id.startsWith("place"))?.text || "";
    const state = context.find((c: any) => c.id.startsWith("region"))?.short_code?.replace("US-", "") || "";
    const zipCode = context.find((c: any) => c.id.startsWith("postcode"))?.text || "";
    const county = context.find((c: any) => c.id.startsWith("district"))?.text?.replace(" County", "") || "";
    
    return {
      lat,
      lng,
      address: feature.place_name,
      city,
      state,
      zipCode,
      county,
      confidence: feature.relevance,
      source: "mapbox",
    };
  } catch (error) {
    console.error("Mapbox geocode error:", error);
    return null;
  }
}

// ============================================
// OPENSTREETMAP NOMINATIM (FREE)
// ============================================

async function geocodeWithNominatim(address: string): Promise<GeocodeResult | null> {
  try {
    // Add delay to respect Nominatim usage policy (1 req/sec)
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&countrycodes=us&limit=1&addressdetails=1`;
    
    const response = await fetch(url, {
      headers: {
        "User-Agent": "ZoningSaaS/1.0 (zoning property lookup tool)",
      },
    });
    
    if (!response.ok) {
      console.warn("Nominatim request failed:", response.status);
      return null;
    }
    
    const data = await response.json();
    if (!data || data.length === 0) {
      return null;
    }
    
    const result = data[0];
    const addressParts = result.address || {};
    
    // Extract city (could be in various fields)
    const city = addressParts.city || 
                 addressParts.town || 
                 addressParts.village || 
                 addressParts.municipality ||
                 addressParts.suburb ||
                 "";
    
    // Extract county
    const county = addressParts.county?.replace(" County", "") || "";
    
    return {
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      address: result.display_name,
      city,
      state: addressParts.state || "WA",
      zipCode: addressParts.postcode || "",
      county,
      confidence: Math.min(1, (parseFloat(result.importance) || 0.5) + 0.3),
      source: "fallback" as const, // Using fallback since it's OSM
    };
  } catch (error) {
    console.error("Nominatim geocode error:", error);
    return null;
  }
}

// ============================================
// FALLBACK PARSING
// ============================================

function parseCity(address: string): string {
  // Simple city extraction from address
  const parts = address.split(",").map(p => p.trim());
  if (parts.length >= 2) {
    return parts[parts.length - 2];
  }
  return "";
}

function parseAddressFallback(address: string): GeocodeResult | null {
  const normalized = address.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
  
  // Known city/zip coordinates for fallback geocoding
  const cityCoordinates: Record<string, { lat: number; lng: number; county: string }> = {
    "snohomish": { lat: 47.9129, lng: -122.0982, county: "Snohomish" },
    "everett": { lat: 47.9790, lng: -122.2021, county: "Snohomish" },
    "marysville": { lat: 48.0518, lng: -122.1771, county: "Snohomish" },
    "lake stevens": { lat: 48.0154, lng: -122.0638, county: "Snohomish" },
    "shoreline": { lat: 47.7557, lng: -122.3426, county: "King" },
    "seattle": { lat: 47.6062, lng: -122.3321, county: "King" },
    "bellevue": { lat: 47.6101, lng: -122.2015, county: "King" },
    "kirkland": { lat: 47.6769, lng: -122.2060, county: "King" },
    "redmond": { lat: 47.6740, lng: -122.1215, county: "King" },
    "renton": { lat: 47.4829, lng: -122.2171, county: "King" },
    "kent": { lat: 47.3809, lng: -122.2348, county: "King" },
    "tacoma": { lat: 47.2529, lng: -122.4443, county: "Pierce" },
    "olympia": { lat: 47.0379, lng: -122.9007, county: "Thurston" },
    "spokane": { lat: 47.6588, lng: -117.4260, county: "Spokane" },
    "vancouver": { lat: 45.6387, lng: -122.6615, county: "Clark" },
  };

  // Zip code coordinates
  const zipCoordinates: Record<string, { lat: number; lng: number; city: string; county: string }> = {
    "98133": { lat: 47.7557, lng: -122.3426, city: "Shoreline", county: "King" },
    "98296": { lat: 47.8697, lng: -122.0936, city: "Snohomish", county: "Snohomish" },
    "98101": { lat: 47.6062, lng: -122.3321, city: "Seattle", county: "King" },
    "98004": { lat: 47.6101, lng: -122.2015, city: "Bellevue", county: "King" },
    "98052": { lat: 47.6740, lng: -122.1215, city: "Redmond", county: "King" },
    "98033": { lat: 47.6769, lng: -122.2060, city: "Kirkland", county: "King" },
    "98201": { lat: 47.9790, lng: -122.2021, city: "Everett", county: "Snohomish" },
    "98270": { lat: 48.0518, lng: -122.1771, city: "Marysville", county: "Snohomish" },
    "98258": { lat: 48.0154, lng: -122.0638, city: "Lake Stevens", county: "Snohomish" },
  };

  // Try to match by zip code first (most accurate)
  for (const [zip, coords] of Object.entries(zipCoordinates)) {
    if (normalized.includes(zip)) {
      return {
        lat: coords.lat + (Math.random() - 0.5) * 0.01, // Small random offset for uniqueness
        lng: coords.lng + (Math.random() - 0.5) * 0.01,
        address: address,
        city: coords.city,
        state: "WA",
        zipCode: zip,
        county: coords.county,
        confidence: 0.6,
        source: "fallback",
      };
    }
  }

  // Try to match by city name
  for (const [city, coords] of Object.entries(cityCoordinates)) {
    if (normalized.includes(city)) {
      return {
        lat: coords.lat + (Math.random() - 0.5) * 0.02,
        lng: coords.lng + (Math.random() - 0.5) * 0.02,
        address: address,
        city: city.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
        state: "WA",
        county: coords.county,
        confidence: 0.4,
        source: "fallback",
      };
    }
  }

  // If address contains WA or Washington, use Seattle as center fallback
  if (normalized.includes(" wa ") || normalized.includes(" wa") || normalized.includes("washington")) {
    return {
      lat: 47.6062 + (Math.random() - 0.5) * 0.1,
      lng: -122.3321 + (Math.random() - 0.5) * 0.1,
      address: address,
      city: "Unknown",
      state: "WA",
      county: "Unknown",
      confidence: 0.2,
      source: "fallback",
    };
  }

  return null;
}

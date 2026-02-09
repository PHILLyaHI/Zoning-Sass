// ============================================
// MULTI-SOURCE PARCEL DATA
// ============================================
// Tries multiple data sources to get parcel data
// Priority: Regrid → County GIS → Zillow → Mapbox → OSM → Estimated
// 
// REGRID API - Best for exact parcel boundaries
// Sign up FREE at: https://regrid.com/api
// Free tier: 100 requests/month

export type ParcelResult = {
  apn?: string;
  address?: string;
  owner?: string;
  areaSqft: number;
  areaAcres: number;
  geometry: GeoJSON.Polygon | null;
  source: string;
  confidence: "high" | "medium" | "low";
  existingStructures?: BuildingFootprint[];
  // Zillow-specific fields
  zillowData?: {
    zpid?: string;
    zestimate?: number;
    bedrooms?: number;
    bathrooms?: number;
    yearBuilt?: number;
    lotSize?: number;
    livingArea?: number;
    propertyType?: string;
  };
};

export type BuildingFootprint = {
  id: string;
  type: "residential" | "commercial" | "garage" | "shed" | "other";
  areaSqft: number;
  geometry: GeoJSON.Polygon;
  source: string;
};

// ============================================
// DATA SOURCE: Regrid API (BEST for exact boundaries)
// ============================================
// https://regrid.com/api - Free tier: 100 requests/month
// Returns exact parcel boundaries as GeoJSON polygons

async function getParcelFromRegrid(
  lat: number, 
  lng: number,
  address?: string
): Promise<ParcelResult | null> {
  const apiKey = process.env.REGRID_API_KEY;
  if (!apiKey) {
    console.log("[Regrid] No API key configured");
    return null;
  }
  
  try {
    // Use v2 API with Bearer token auth
    const url = `https://app.regrid.com/api/v2/parcels/point.json?lat=${lat}&lon=${lng}`;
    
    const response = await fetch(url, {
      headers: { 
        "Accept": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      signal: AbortSignal.timeout(10000),
    });
    
    if (!response.ok) {
      console.log(`[Regrid] API error: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    
    // Check if we got parcels
    if (data.parcels?.features && data.parcels.features.length > 0) {
      const feature = data.parcels.features[0];
      const props = feature.properties || {};
      
      // Calculate area from geometry if not provided
      let areaSqft = props.ll_gisacre ? props.ll_gisacre * 43560 : 43560;
      if (props.sqft) areaSqft = props.sqft;
      if (props.ll_gissqft) areaSqft = props.ll_gissqft;
      
      console.log(`[Regrid] Found parcel: ${props.address || props.parcelnumb}, ${(areaSqft / 43560).toFixed(2)} acres`);
      
      return {
        apn: props.parcelnumb || props.apn || props.parcel_id,
        address: props.address || props.mail_addre || props.siteaddr,
        owner: props.owner || props.mail_name || props.ownername,
        areaSqft: areaSqft,
        areaAcres: areaSqft / 43560,
        geometry: feature.geometry, // Exact boundary polygon!
        source: "regrid",
        confidence: "high",
      };
    }
    
    console.log("[Regrid] No parcels found at this location");
    return null;
  } catch (error) {
    console.error("[Regrid] Error:", error);
    return null;
  }
}

// ============================================
// DATA SOURCE 1: OpenStreetMap Overpass API (FREE)
// ============================================

async function getParcelFromOSM(lat: number, lng: number): Promise<ParcelResult | null> {
  try {
    // Query for buildings and land parcels near the point
    const radius = 50; // meters
    const query = `
      [out:json][timeout:10];
      (
        way["building"](around:${radius},${lat},${lng});
        way["landuse"="residential"](around:${radius},${lat},${lng});
        relation["landuse"="residential"](around:${radius},${lat},${lng});
      );
      out body geom;
    `;
    
    const response = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      body: query,
    });
    
    if (!response.ok) return null;
    
    const data = await response.json();
    
    if (data.elements && data.elements.length > 0) {
      // Find the building footprints
      const buildings: BuildingFootprint[] = data.elements
        .filter((el: any) => el.tags?.building)
        .map((el: any, idx: number) => ({
          id: `osm-${el.id}`,
          type: classifyBuilding(el.tags?.building),
          areaSqft: calculateAreaFromNodes(el.geometry) || 1500,
          geometry: nodesToPolygon(el.geometry),
          source: "openstreetmap",
        }))
        .filter((b: BuildingFootprint) => b.geometry);
      
      // Get the land parcel if available
      const parcel = data.elements.find((el: any) => el.tags?.landuse);
      
      return {
        areaSqft: parcel ? calculateAreaFromNodes(parcel.geometry) || 43560 : 43560,
        areaAcres: parcel ? (calculateAreaFromNodes(parcel.geometry) || 43560) / 43560 : 1,
        geometry: parcel ? nodesToPolygon(parcel.geometry) : null,
        source: "openstreetmap",
        confidence: buildings.length > 0 ? "medium" : "low",
        existingStructures: buildings,
      };
    }
    
    return null;
  } catch (error) {
    console.error("OSM query error:", error);
    return null;
  }
}

// ============================================
// DATA SOURCE 2: Microsoft Building Footprints (FREE)
// ============================================
// https://github.com/microsoft/USBuildingFootprints

async function getBuildingsFromMicrosoft(lat: number, lng: number): Promise<BuildingFootprint[]> {
  // Microsoft provides state-level GeoJSON files
  // For real-time queries, we'd need to host this data or use a tile service
  // For now, return empty - this would be integrated with a hosted version
  return [];
}

// ============================================
// DATA SOURCE 3: County Assessor (varies by county)
// ============================================

type CountyGISConfig = {
  parcelEndpoint: string;
  buildingEndpoint?: string;
  geometryField: string;
  apnField: string;
  areaField?: string;
  ownerField?: string;
  addressField?: string;
};

const COUNTY_GIS_CONFIGS: Record<string, CountyGISConfig> = {
  // Snohomish County, WA - WORKING endpoint verified Jan 2026
  "53061": {
    parcelEndpoint: "https://gis.snoco.org/cart/rest/services/Basemaps/CART_Parcels/MapServer/0",
    geometryField: "geometry",
    apnField: "PARCEL_ID",
    areaField: "GIS_SQ_FT",
    ownerField: "OWNERNAME",
    addressField: "SITUSLINE1",
  },
  // King County, WA
  "53033": {
    parcelEndpoint: "https://gismaps.kingcounty.gov/arcgis/rest/services/Property/Parcels/MapServer/0",
    geometryField: "geometry",
    apnField: "PIN",
    areaField: "Shape_Area",
    ownerField: "TAXPAYER_NAME",
    addressField: "ADDR_FULL",
  },
  // Add more counties as we discover their endpoints...
};

async function getParcelFromCountyGIS(
  lat: number, 
  lng: number, 
  countyFips: string
): Promise<ParcelResult | null> {
  const config = COUNTY_GIS_CONFIGS[countyFips];
  if (!config) return null;
  
  try {
    const url = new URL(`${config.parcelEndpoint}/query`);
    // Use simple geometry format (works better with most ArcGIS servers)
    url.searchParams.append("geometry", `${lng},${lat}`);
    url.searchParams.append("geometryType", "esriGeometryPoint");
    url.searchParams.append("spatialRel", "esriSpatialRelIntersects");
    url.searchParams.append("outFields", "*");
    url.searchParams.append("returnGeometry", "true");
    url.searchParams.append("outSR", "4326");
    url.searchParams.append("f", "json");
    
    const response = await fetch(url.toString(), {
      headers: { "Accept": "application/json" },
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });
    
    if (!response.ok) return null;
    
    const data = await response.json();
    
    // Check for errors in response
    if (data.error || data.status === "error") {
      console.log(`[County GIS] Error response:`, data.error || data.message);
      return null;
    }
    
    if (data.features && data.features.length > 0) {
      const feature = data.features[0];
      const attrs = feature.attributes;
      const geometry = esriToGeoJSON(feature.geometry);
      
      // Get area - try multiple field names
      const areaSqft = (config.areaField ? attrs[config.areaField] : undefined) || 
                       attrs.GIS_SQ_FT || 
                       attrs.SHAPE_Area || 
                       (attrs.GIS_ACRES ? attrs.GIS_ACRES * 43560 : 43560);
      
      console.log(`[County GIS ${countyFips}] Found: ${config.addressField ? attrs[config.addressField] : 'unknown'}, ${(areaSqft / 43560).toFixed(2)} acres`);
      
      return {
        apn: config.apnField ? attrs[config.apnField] : undefined,
        address: config.addressField ? attrs[config.addressField] : undefined,
        owner: config.ownerField ? attrs[config.ownerField] : undefined,
        areaSqft: areaSqft,
        areaAcres: areaSqft / 43560,
        geometry,
        source: `county_gis_${countyFips}`,
        confidence: "high",
      };
    }
    
    return null;
  } catch (error) {
    console.error(`County GIS (${countyFips}) error:`, error);
    return null;
  }
}

// ============================================
// DATA SOURCE: Zillow via RapidAPI
// ============================================
// Free tier: 50 requests/month
// Get API key at: https://rapidapi.com/apimaker/api/zillow-com1

async function getParcelFromZillow(
  lat: number, 
  lng: number,
  address?: string
): Promise<ParcelResult | null> {
  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) {
    console.log("[Zillow] No RapidAPI key configured");
    return null;
  }
  
  try {
    // Use address-based lookup if available, otherwise use coordinates
    let url: string;
    
    if (address) {
      // Search by address
      url = `https://zillow-com1.p.rapidapi.com/propertyExtendedSearch?location=${encodeURIComponent(address)}&status_type=ForSale&home_type=Houses`;
    } else {
      // Search by coordinates (convert to Zillow's bounding box format)
      const delta = 0.001; // Small area around point
      url = `https://zillow-com1.p.rapidapi.com/propertyExtendedSearch?location=${lat},${lng}&status_type=ForSale&home_type=Houses`;
    }
    
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "X-RapidAPI-Key": apiKey,
        "X-RapidAPI-Host": "zillow-com1.p.rapidapi.com",
      },
      signal: AbortSignal.timeout(10000),
    });
    
    if (!response.ok) {
      console.log(`[Zillow] API error: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    
    // Find the closest property to our coordinates
    if (data.props && data.props.length > 0) {
      const property = data.props[0];
      
      // Get detailed property info
      const detailUrl = `https://zillow-com1.p.rapidapi.com/property?zpid=${property.zpid}`;
      const detailResponse = await fetch(detailUrl, {
        method: "GET",
        headers: {
          "X-RapidAPI-Key": apiKey,
          "X-RapidAPI-Host": "zillow-com1.p.rapidapi.com",
        },
        signal: AbortSignal.timeout(10000),
      });
      
      let lotSizeSqft = property.lotAreaValue || 43560;
      let zillowDetails: ParcelResult["zillowData"] = {
        zpid: property.zpid?.toString(),
        zestimate: property.zestimate,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        yearBuilt: property.yearBuilt,
        lotSize: lotSizeSqft,
        livingArea: property.livingArea,
        propertyType: property.propertyType,
      };
      
      if (detailResponse.ok) {
        const detail = await detailResponse.json();
        if (detail.resoFacts) {
          // Get more accurate lot size from detailed facts
          if (detail.resoFacts.lotSize) {
            lotSizeSqft = detail.resoFacts.lotSize;
          }
          zillowDetails = {
            ...zillowDetails,
            lotSize: lotSizeSqft,
            yearBuilt: detail.resoFacts.yearBuilt || zillowDetails.yearBuilt,
            bedrooms: detail.resoFacts.bedrooms || zillowDetails.bedrooms,
            bathrooms: detail.resoFacts.bathrooms || zillowDetails.bathrooms,
          };
        }
      }
      
      // Calculate lot dimensions from area (assume 2:3 ratio)
      const depth = Math.sqrt(lotSizeSqft / 0.67);
      const width = lotSizeSqft / depth;
      
      // Generate geometry from lot size
      const latFeetPerDegree = 364000;
      const lngFeetPerDegree = 280000;
      const halfDepthDeg = (depth / 2) / latFeetPerDegree;
      const halfWidthDeg = (width / 2) / lngFeetPerDegree;
      
      const propLat = property.latitude || lat;
      const propLng = property.longitude || lng;
      
      return {
        apn: property.parcelId,
        address: property.address?.streetAddress || property.streetAddress,
        areaSqft: lotSizeSqft,
        areaAcres: lotSizeSqft / 43560,
        geometry: {
          type: "Polygon",
          coordinates: [[
            [propLng - halfWidthDeg, propLat - halfDepthDeg],
            [propLng + halfWidthDeg, propLat - halfDepthDeg],
            [propLng + halfWidthDeg, propLat + halfDepthDeg],
            [propLng - halfWidthDeg, propLat + halfDepthDeg],
            [propLng - halfWidthDeg, propLat - halfDepthDeg],
          ]],
        },
        source: "zillow",
        confidence: "high",
        zillowData: zillowDetails,
      };
    }
    
    return null;
  } catch (error) {
    console.error("[Zillow] Error:", error);
    return null;
  }
}

// ============================================
// SNOHOMISH COUNTY ADDRESS SEARCH (verified working Jan 2026)
// ============================================

// Snohomish County cities for address matching
const SNOHOMISH_COUNTY_CITIES = [
  "SNOHOMISH", "LYNNWOOD", "EVERETT", "MARYSVILLE", "LAKE STEVENS", 
  "EDMONDS", "MOUNTLAKE TERRACE", "MUKILTEO", "BOTHELL", "MILL CREEK",
  "ARLINGTON", "STANWOOD", "GRANITE FALLS", "SULTAN", "GOLD BAR",
  "INDEX", "DARRINGTON", "WOODINVILLE", "BRIER", "LAKEWOOD"
];

async function getParcelFromSnohomishByAddress(address: string): Promise<ParcelResult | null> {
  if (!address) return null;
  
  try {
    // Extract house number and street - handle various formats
    // Match: "12345 Street Name, City, State ZIP" or "12345 Street Name City State"
    const match = address.match(/^(\d+)\s+(.+?)(?:,\s*|\s+)(?:WA|WASHINGTON|98\d{3}|\w+,?\s*WA)/i);
    if (!match) {
      // Try simpler pattern: just get number and next few words
      const simpleMatch = address.match(/^(\d+)\s+(\S+(?:\s+\S+)?)/i);
      if (!simpleMatch) {
        console.log("[Snohomish] Could not parse address:", address);
        return null;
      }
      var houseNum = simpleMatch[1];
      var streetPart = simpleMatch[2].replace(/\s+/g, " ").trim().toUpperCase();
    } else {
      var houseNum = match[1];
      var streetPart = match[2].replace(/\s+/g, " ").trim().toUpperCase();
    }
    
    // Build WHERE clause for address search
    const whereClause = `SITUSLINE1 LIKE '%${houseNum}%${streetPart.split(" ")[0]}%'`;
    const url = `https://gis.snoco.org/cart/rest/services/Basemaps/CART_Parcels/MapServer/0/query?where=${encodeURIComponent(whereClause)}&outFields=*&returnGeometry=true&outSR=4326&f=json`;
    
    console.log(`[Snohomish] Searching by address: ${houseNum} ${streetPart}`);
    
    const response = await fetch(url, {
      headers: { "Accept": "application/json" },
      signal: AbortSignal.timeout(10000),
    });
    
    if (!response.ok) return null;
    
    const data = await response.json();
    
    if (data.features && data.features.length > 0) {
      // Find best match
      const feature = data.features.find((f: any) => 
        f.attributes.SITUSLINE1?.includes(houseNum)
      ) || data.features[0];
      
      const attrs = feature.attributes;
      const geometry = esriToGeoJSON(feature.geometry);
      
      console.log(`[Snohomish] Found: ${attrs.SITUSLINE1}, ${attrs.GIS_ACRES} acres`);
      
      return {
        apn: attrs.PARCEL_ID,
        address: attrs.SITUSLINE1,
        owner: attrs.OWNERNAME || attrs.TAXPRNAME,
        areaSqft: attrs.GIS_SQ_FT || (attrs.GIS_ACRES * 43560),
        areaAcres: attrs.GIS_ACRES || attrs.TAB_ACRES,
        geometry,
        source: "snohomish_county_gis",
        confidence: "high",
      };
    }
    
    return null;
  } catch (error) {
    console.error("[Snohomish] Address search error:", error);
    return null;
  }
}

// ============================================
// MAIN FUNCTION: Try all sources
// ============================================

export async function getParcelData(
  lat: number, 
  lng: number,
  countyFips?: string,
  address?: string
): Promise<ParcelResult> {
  console.log(`[Parcel] Fetching data for ${lat}, ${lng}, county: ${countyFips || "unknown"}, address: ${address || "unknown"}`);
  
  // SPECIAL CASE: Snohomish County - search by address (most reliable)
  // Check if address contains any Snohomish County city
  const isSnohomishCounty = countyFips === "53061" || 
    (address && SNOHOMISH_COUNTY_CITIES.some(city => 
      address.toUpperCase().includes(city)
    ));
  
  if (isSnohomishCounty && address) {
    try {
      const snohomishData = await getParcelFromSnohomishByAddress(address);
      if (snohomishData && snohomishData.geometry) {
        console.log(`[Parcel] Got EXACT boundary from Snohomish County GIS - ${snohomishData.areaAcres.toFixed(2)} acres`);
        // Supplement with OSM building data
        try {
          const osmData = await getParcelFromOSM(lat, lng);
          if (osmData?.existingStructures) {
            snohomishData.existingStructures = osmData.existingStructures;
          }
        } catch (e) {
          // OSM failed, continue without buildings
        }
        return snohomishData;
      }
    } catch (e) {
      console.log(`[Parcel] Snohomish address search failed:`, e);
    }
  }
  
  // 1. Try Regrid (best for exact parcel boundaries)
  try {
    const regridData = await getParcelFromRegrid(lat, lng, address);
    if (regridData && regridData.geometry) {
      console.log(`[Parcel] Got EXACT boundary from Regrid - ${regridData.areaAcres.toFixed(2)} acres`);
      // Supplement with OSM building data
      try {
        const osmData = await getParcelFromOSM(lat, lng);
        if (osmData?.existingStructures) {
          regridData.existingStructures = osmData.existingStructures;
        }
      } catch (e) {
        // OSM failed, continue without buildings
      }
      return regridData;
    }
  } catch (e) {
    console.log(`[Parcel] Regrid failed:`, e);
  }
  
  // 2. Try county GIS (accurate for boundaries)
  if (countyFips) {
    try {
      const countyData = await getParcelFromCountyGIS(lat, lng, countyFips);
      if (countyData) {
        console.log(`[Parcel] Got data from county GIS`);
        // Try to get buildings from OSM to supplement
        try {
          const osmData = await getParcelFromOSM(lat, lng);
          if (osmData?.existingStructures) {
            countyData.existingStructures = osmData.existingStructures;
          }
        } catch (e) {
          // OSM failed, continue without buildings
        }
        return countyData;
      }
    } catch (e) {
      console.log(`[Parcel] County GIS failed:`, e);
    }
  }
  
  // 3. Try Zillow (excellent for lot size and property details)
  try {
    const zillowData = await getParcelFromZillow(lat, lng, address);
    if (zillowData) {
      console.log(`[Parcel] Got data from Zillow - ${zillowData.areaAcres.toFixed(2)} acres`);
      // Supplement with OSM building data
      try {
        const osmData = await getParcelFromOSM(lat, lng);
        if (osmData?.existingStructures) {
          zillowData.existingStructures = osmData.existingStructures;
        }
      } catch (e) {
        // OSM failed, continue without buildings
      }
      return zillowData;
    }
  } catch (e) {
    console.log(`[Parcel] Zillow failed:`, e);
  }
  
  // 3. Try Mapbox (reliable, if configured)
  try {
    const mapboxData = await getParcelFromMapbox(lat, lng);
    if (mapboxData) {
      console.log(`[Parcel] Got data from Mapbox`);
      return mapboxData;
    }
  } catch (e) {
    console.log(`[Parcel] Mapbox failed:`, e);
  }
  
  // 4. Try OpenStreetMap (good for buildings)
  try {
    const osmData = await getParcelFromOSM(lat, lng);
    if (osmData && (osmData.geometry || osmData.existingStructures?.length)) {
      console.log(`[Parcel] Got data from OSM`);
      return osmData;
    }
  } catch (e) {
    console.log(`[Parcel] OSM failed:`, e);
  }
  
  // 5. Generate estimate from coordinates
  console.log(`[Parcel] Using estimated data`);
  return generateEstimatedParcel(lat, lng);
}

// ============================================
// DATA SOURCE 4: Mapbox Boundaries API
// ============================================

async function getParcelFromMapbox(lat: number, lng: number): Promise<ParcelResult | null> {
  const token = process.env.MAPBOX_ACCESS_TOKEN;
  if (!token) return null;

  try {
    // Use Mapbox's tilequery for parcel boundaries
    // Note: Requires Mapbox Boundaries dataset access
    const url = `https://api.mapbox.com/v4/mapbox.enterprise-boundaries-a0-v2/tilequery/${lng},${lat}.json?access_token=${token}&limit=1`;
    
    const response = await fetch(url, {
      signal: AbortSignal.timeout(5000),
    });
    
    if (!response.ok) return null;
    
    const data = await response.json();
    
    if (data.features && data.features.length > 0) {
      const feature = data.features[0];
      return {
        areaSqft: feature.properties?.area_sqft || 43560,
        areaAcres: (feature.properties?.area_sqft || 43560) / 43560,
        geometry: feature.geometry,
        source: "mapbox",
        confidence: "high",
      };
    }
    
    return null;
  } catch (error) {
    console.error("Mapbox parcel query error:", error);
    return null;
  }
}

// ============================================
// FALLBACK: Generate estimated parcel
// ============================================

function generateEstimatedParcel(lat: number, lng: number): ParcelResult {
  // Estimate parcel size based on typical rural WA lot (1-5 acres)
  // Generate realistic rectangular shape
  
  const estimatedAcres = 1; // Default 1 acre
  const estimatedSqft = estimatedAcres * 43560;
  
  // Calculate dimensions for a 2:3 width:depth ratio
  const depth = Math.sqrt(estimatedSqft / 0.67);
  const width = estimatedSqft / depth;
  
  // Convert feet to degrees (approximate)
  // 1 degree latitude ≈ 364,000 feet
  // 1 degree longitude varies by latitude, ~280,000 feet at 47°N
  const latFeetPerDegree = 364000;
  const lngFeetPerDegree = 280000;
  
  const halfDepthDeg = (depth / 2) / latFeetPerDegree;
  const halfWidthDeg = (width / 2) / lngFeetPerDegree;
  
  return {
    areaSqft: estimatedSqft,
    areaAcres: estimatedAcres,
    geometry: {
      type: "Polygon",
      coordinates: [[
        [lng - halfWidthDeg, lat - halfDepthDeg],
        [lng + halfWidthDeg, lat - halfDepthDeg],
        [lng + halfWidthDeg, lat + halfDepthDeg],
        [lng - halfWidthDeg, lat + halfDepthDeg],
        [lng - halfWidthDeg, lat - halfDepthDeg],
      ]],
    },
    source: "estimated",
    confidence: "low",
  };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function esriToGeoJSON(esriGeometry: any): GeoJSON.Polygon | null {
  if (!esriGeometry || !esriGeometry.rings) return null;
  return {
    type: "Polygon",
    coordinates: esriGeometry.rings,
  };
}

function nodesToPolygon(nodes: any[]): GeoJSON.Polygon | null {
  if (!nodes || nodes.length < 3) return null;
  
  const coordinates = nodes.map((n: any) => [n.lon, n.lat]);
  // Close the polygon
  if (coordinates[0][0] !== coordinates[coordinates.length - 1][0] ||
      coordinates[0][1] !== coordinates[coordinates.length - 1][1]) {
    coordinates.push(coordinates[0]);
  }
  
  return {
    type: "Polygon",
    coordinates: [coordinates],
  };
}

function calculateAreaFromNodes(nodes: any[]): number | null {
  if (!nodes || nodes.length < 3) return null;
  
  // Shoelace formula for polygon area
  let area = 0;
  const n = nodes.length;
  
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += nodes[i].lon * nodes[j].lat;
    area -= nodes[j].lon * nodes[i].lat;
  }
  
  area = Math.abs(area) / 2;
  
  // Convert from degrees² to approximate sq ft (very rough)
  // 1 degree ≈ 364,000 ft at mid-latitudes
  const sqFtPerDegreeSq = 364000 * 364000;
  return Math.round(area * sqFtPerDegreeSq);
}

function classifyBuilding(buildingTag: string): BuildingFootprint["type"] {
  const tag = buildingTag.toLowerCase();
  if (tag === "house" || tag === "residential" || tag === "yes") return "residential";
  if (tag === "garage" || tag === "carport") return "garage";
  if (tag === "shed" || tag === "barn" || tag === "farm_auxiliary") return "shed";
  if (tag === "commercial" || tag === "retail" || tag === "office") return "commercial";
  return "other";
}


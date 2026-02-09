"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { PropertyRecord, LayerState } from "../lib/types";

// ============================================
// PROFESSIONAL ZILLOW-STYLE PROPERTY MAP
// ============================================

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

type Props = {
  property: PropertyRecord;
  layers?: LayerState[];
  onLayerToggle?: (layerId: string) => void;
  onMapClick?: (lng: number, lat: number) => void;
  className?: string;
  showLegend?: boolean;
  interactive?: boolean;
};

// Generate a realistic polygon based on property dimensions
function generateParcelPolygon(
  lat: number, 
  lng: number, 
  lotWidth: number = 100, 
  lotDepth: number = 150,
  seed: string = ""
): [number, number][] {
  // Convert feet to approximate degrees (rough approximation)
  const feetPerDegreeLat = 364000; // ~364,000 feet per degree latitude
  const feetPerDegreeLng = 288000; // ~288,000 feet per degree longitude (varies by latitude)
  
  const halfWidthDeg = (lotWidth / 2) / feetPerDegreeLng;
  const halfDepthDeg = (lotDepth / 2) / feetPerDegreeLat;
  
  // Add slight randomness for realistic look (seeded)
  const hash = seed.split("").reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) | 0, 0);
  const jitter = (i: number) => ((Math.sin(hash + i) * 10000) % 1) * 0.00001;
  
  // Create polygon points (clockwise from bottom-left)
  return [
    [lng - halfWidthDeg + jitter(0), lat - halfDepthDeg + jitter(1)],
    [lng + halfWidthDeg + jitter(2), lat - halfDepthDeg + jitter(3)],
    [lng + halfWidthDeg + jitter(4), lat + halfDepthDeg + jitter(5)],
    [lng - halfWidthDeg + jitter(6), lat + halfDepthDeg + jitter(7)],
    [lng - halfWidthDeg + jitter(0), lat - halfDepthDeg + jitter(1)], // Close polygon
  ];
}

export default function PropertyMapPro({ 
  property, 
  layers = [],
  onLayerToggle, 
  onMapClick,
  className = "",
  showLegend = true,
  interactive = true,
}: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapStyle, setMapStyle] = useState<"satellite" | "street" | "dark">("satellite");
  const [isLoading, setIsLoading] = useState(true);
  const [showLayerPanel, setShowLayerPanel] = useState(false);
  const [zoom, setZoom] = useState(18);
  const [mapError, setMapError] = useState(false);
  
  const lotWidth = property.lotWidth || 100;
  const lotDepth = property.lotDepth || 150;
  const lat = property.centroid?.lat || property.lat || 47.6062;
  const lng = property.centroid?.lng || property.lng || -122.3321;
  
  // Generate parcel polygon
  const parcelPolygon = useMemo(() => 
    generateParcelPolygon(lat, lng, lotWidth, lotDepth, property.id),
    [lat, lng, lotWidth, lotDepth, property.id]
  );

  // Static map URL (Mapbox Static API)
  const getStaticMapUrl = useCallback(() => {
    if (!MAPBOX_TOKEN) return null;
    
    const style = mapStyle === "satellite" ? "satellite-v9" : mapStyle === "dark" ? "dark-v11" : "light-v11";
    const size = "600x400@2x";
    
    // Create GeoJSON overlay for parcel
    const geojson = encodeURIComponent(JSON.stringify({
      type: "Feature",
      properties: {},
      geometry: {
        type: "Polygon",
        coordinates: [parcelPolygon],
      }
    }));
    
    return `https://api.mapbox.com/styles/v1/mapbox/${style}/static/geojson(${geojson})/${lng},${lat},${zoom},0/${size}?access_token=${MAPBOX_TOKEN}&attribution=false&logo=false`;
  }, [lat, lng, zoom, mapStyle, parcelPolygon]);

  // Alternative: OpenStreetMap tiles (free, no API key)
  const getOSMUrl = useCallback(() => {
    const z = Math.min(19, Math.max(1, zoom));
    const x = Math.floor((lng + 180) / 360 * Math.pow(2, z));
    const yRad = lat * Math.PI / 180;
    const y = Math.floor((1 - Math.log(Math.tan(yRad) + 1 / Math.cos(yRad)) / Math.PI) / 2 * Math.pow(2, z));
    
    // Use Esri World Imagery (free satellite tiles)
    return `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`;
  }, [lat, lng, zoom]);

  // Check if Mapbox loads successfully
  useEffect(() => {
    if (!MAPBOX_TOKEN) {
      setIsLoading(false);
      return;
    }
    
    const img = new Image();
    img.onload = () => {
      setIsLoading(false);
      setMapError(false);
    };
    img.onerror = () => {
      setIsLoading(false);
      setMapError(true);
    };
    
    const url = getStaticMapUrl();
    if (url) img.src = url;
  }, [getStaticMapUrl]);

  const activeLayers = layers.filter(l => l.active);

  // SVG Parcel Outline for overlay
  const parcelSVGPath = useMemo(() => {
    // Convert geo coords to SVG viewport (0-100)
    const minLng = Math.min(...parcelPolygon.map(p => p[0]));
    const maxLng = Math.max(...parcelPolygon.map(p => p[0]));
    const minLat = Math.min(...parcelPolygon.map(p => p[1]));
    const maxLat = Math.max(...parcelPolygon.map(p => p[1]));
    
    const lngRange = maxLng - minLng;
    const latRange = maxLat - minLat;
    const padding = 0.15;
    
    return parcelPolygon.map((point, i) => {
      const x = ((point[0] - minLng) / lngRange) * (100 - 2 * padding * 100) + padding * 100;
      const y = 100 - (((point[1] - minLat) / latRange) * (100 - 2 * padding * 100) + padding * 100);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ') + ' Z';
  }, [parcelPolygon]);

  return (
    <div className={`relative w-full h-full min-h-[400px] overflow-hidden rounded-2xl ${className}`}>
      {/* Background Map Layer */}
      <div className="absolute inset-0">
        {/* Loading State */}
        {isLoading && (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-200 to-slate-300 animate-pulse flex items-center justify-center z-20">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-slate-600 font-medium">Loading satellite imagery...</span>
            </div>
          </div>
        )}
        
        {/* Satellite/Map Image */}
        {MAPBOX_TOKEN && !mapError ? (
          <img
            src={getStaticMapUrl() || ""}
            alt="Property satellite view"
            className="absolute inset-0 w-full h-full object-cover"
            onLoad={() => setIsLoading(false)}
            onError={() => setMapError(true)}
          />
        ) : (
          /* Fallback: Esri World Imagery or styled placeholder */
          <div className="absolute inset-0">
            {/* Beautiful gradient background */}
            <div 
              className="absolute inset-0"
              style={{
                background: mapStyle === "satellite" 
                  ? "linear-gradient(135deg, #1a472a 0%, #2d5a27 25%, #4a7c59 50%, #2d5a27 75%, #1a472a 100%)"
                  : mapStyle === "dark"
                    ? "linear-gradient(135deg, #1e293b 0%, #334155 50%, #1e293b 100%)"
                    : "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #f8fafc 100%)"
              }}
            />
            
            {/* Texture overlay for realism */}
            <div 
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage: mapStyle === "satellite" 
                  ? `url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`
                  : "none",
                mixBlendMode: "overlay",
              }}
            />
            
            {/* Street grid pattern for non-satellite */}
            {mapStyle !== "satellite" && (
              <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 100 100" preserveAspectRatio="none">
                <defs>
                  <pattern id="streetGrid" width="10" height="10" patternUnits="userSpaceOnUse">
                    <path d="M 10 0 L 0 0 0 10" fill="none" stroke={mapStyle === "dark" ? "#64748b" : "#94a3b8"} strokeWidth="0.5"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#streetGrid)" />
              </svg>
            )}
          </div>
        )}
      </div>
      
      {/* Parcel Boundary Overlay */}
      <svg 
        className="absolute inset-0 w-full h-full pointer-events-none z-10"
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid slice"
      >
        {/* Glow effect */}
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="parcelGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#1d4ed8" />
          </linearGradient>
        </defs>
        
        {/* Parcel fill */}
        <path
          d={parcelSVGPath}
          fill="url(#parcelGradient)"
          fillOpacity="0.15"
          stroke="none"
        />
        
        {/* Parcel border with glow */}
        <path
          d={parcelSVGPath}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="0.8"
          strokeLinejoin="round"
          filter="url(#glow)"
        />
        
        {/* Corner markers */}
        {parcelPolygon.slice(0, -1).map((_, i) => {
          const minLng = Math.min(...parcelPolygon.map(p => p[0]));
          const maxLng = Math.max(...parcelPolygon.map(p => p[0]));
          const minLat = Math.min(...parcelPolygon.map(p => p[1]));
          const maxLat = Math.max(...parcelPolygon.map(p => p[1]));
          const lngRange = maxLng - minLng;
          const latRange = maxLat - minLat;
          const padding = 0.15;
          const x = ((parcelPolygon[i][0] - minLng) / lngRange) * (100 - 2 * padding * 100) + padding * 100;
          const y = 100 - (((parcelPolygon[i][1] - minLat) / latRange) * (100 - 2 * padding * 100) + padding * 100);
          
          return (
            <g key={i}>
              <circle cx={x} cy={y} r="2" fill="#ffffff" stroke="#3b82f6" strokeWidth="0.5" />
            </g>
          );
        })}
      </svg>

      {/* Property Marker */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-full z-20 pointer-events-none">
        <div className="relative">
          {/* Pin shadow */}
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-6 h-2 bg-black/30 rounded-full blur-sm" />
          
          {/* Pin */}
          <div className="relative">
            <svg width="40" height="52" viewBox="0 0 40 52" className="drop-shadow-lg">
              {/* Pin shape */}
              <path
                d="M20 0C8.954 0 0 8.954 0 20c0 11.046 20 32 20 32s20-20.954 20-32C40 8.954 31.046 0 20 0z"
                fill="#1d4ed8"
                stroke="#ffffff"
                strokeWidth="2"
              />
              {/* Inner circle */}
              <circle cx="20" cy="18" r="8" fill="#ffffff" />
              {/* House icon */}
              <path
                d="M20 12l-6 5v6h4v-4h4v4h4v-6l-6-5z"
                fill="#1d4ed8"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Top Controls Bar */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-30">
        {/* Map Style Toggle */}
        <div className="flex bg-white/95 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden">
          {[
            { id: "satellite", label: "Satellite", icon: "🛰️" },
            { id: "street", label: "Map", icon: "🗺️" },
            { id: "dark", label: "Dark", icon: "🌙" },
          ].map((style) => (
            <button
              key={style.id}
              onClick={() => setMapStyle(style.id as typeof mapStyle)}
              className={`px-4 py-2.5 text-sm font-medium transition-all flex items-center gap-2 ${
                mapStyle === style.id
                  ? "bg-blue-600 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <span className="text-base">{style.icon}</span>
              <span className="hidden sm:inline">{style.label}</span>
            </button>
          ))}
        </div>

        {/* Layers Button */}
        {layers.length > 0 && (
          <button
            onClick={() => setShowLayerPanel(!showLayerPanel)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-lg transition-all ${
              showLayerPanel
                ? "bg-blue-600 text-white"
                : "bg-white/95 backdrop-blur-sm text-slate-700 hover:bg-white"
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <span className="text-sm font-medium">Layers</span>
            {activeLayers.length > 0 && (
              <span className={`px-1.5 py-0.5 text-xs rounded-full ${
                showLayerPanel ? "bg-white/20" : "bg-blue-100 text-blue-700"
              }`}>
                {activeLayers.length}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Layer Panel */}
      {showLayerPanel && layers.length > 0 && (
        <div className="absolute top-20 right-4 w-72 bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl z-30 overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h4 className="font-semibold text-slate-900">Map Layers</h4>
            <p className="text-xs text-slate-500 mt-0.5">Toggle data overlays</p>
          </div>
          <div className="p-2 max-h-[300px] overflow-y-auto">
            {layers.map((layer) => (
              <label
                key={layer.id}
                className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={layer.active}
                  onChange={() => onLayerToggle?.(layer.id)}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium text-slate-700">{layer.label}</span>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Zoom Controls */}
      <div className="absolute bottom-24 right-4 flex flex-col gap-1 z-30">
        <button
          onClick={() => setZoom(Math.min(20, zoom + 1))}
          className="w-10 h-10 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg flex items-center justify-center text-slate-600 hover:bg-white hover:text-slate-900 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
        <button
          onClick={() => setZoom(Math.max(10, zoom - 1))}
          className="w-10 h-10 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg flex items-center justify-center text-slate-600 hover:bg-white hover:text-slate-900 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>
      </div>

      {/* Property Info Card (Zillow-style) */}
      <div className="absolute bottom-4 left-4 right-4 z-30">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-4">
          <div className="flex items-start justify-between gap-4">
            {/* Property Details */}
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-slate-900 truncate text-lg">{property.address}</h3>
              <p className="text-sm text-slate-500 mt-0.5">
                {property.city && `${property.city}, `}{property.state} {property.zipCode}
              </p>
            </div>
            
            {/* Quick Stats */}
            <div className="flex gap-4 shrink-0">
              <div className="text-center">
                <p className="text-xl font-bold text-slate-900">
                  {property.areaSqft ? (property.areaSqft / 43560).toFixed(2) : "--"}
                </p>
                <p className="text-xs text-slate-500">acres</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-blue-600">
                  {property.zoningDistrict?.code || "R-5"}
                </p>
                <p className="text-xs text-slate-500">zone</p>
              </div>
            </div>
          </div>
          
          {/* Lot Dimensions */}
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
              <span className="text-slate-600">
                <span className="font-semibold text-slate-900">{lotWidth}'</span> × <span className="font-semibold text-slate-900">{lotDepth}'</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              <span className="text-slate-600">
                <span className="font-semibold text-slate-900">{(lotWidth * lotDepth).toLocaleString()}</span> sq ft
              </span>
            </div>
            {property.county && (
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                <span className="text-slate-600">{property.county} County</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="absolute bottom-4 right-20 z-30">
          <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg px-4 py-3">
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-1 bg-blue-500 rounded-full" />
                <span className="text-slate-600">Parcel Boundary</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* No Mapbox Token Notice (subtle) */}
      {!MAPBOX_TOKEN && (
        <div className="absolute top-20 left-4 z-30">
          <div className="bg-amber-50/95 backdrop-blur-sm border border-amber-200 rounded-xl px-4 py-2 max-w-xs">
            <div className="flex items-start gap-2">
              <span className="text-amber-500 mt-0.5">⚠️</span>
              <div>
                <p className="text-xs font-medium text-amber-800">Demo Mode</p>
                <p className="text-xs text-amber-600 mt-0.5">
                  Add Mapbox token for satellite imagery
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}




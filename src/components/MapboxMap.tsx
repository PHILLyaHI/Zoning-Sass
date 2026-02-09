"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { PropertyRecord, LayerState } from "../lib/types";

type MapboxMapProps = {
  property: PropertyRecord;
  layers: LayerState[];
  onLayerToggle?: (layerId: string) => void;
  onMapClick?: (lng: number, lat: number) => void;
  className?: string;
};

export default function MapboxMap({ 
  property, 
  layers, 
  onLayerToggle, 
  onMapClick,
  className = ""
}: MapboxMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showLayerPanel, setShowLayerPanel] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  // Get token on client side
  const MAPBOX_TOKEN = typeof window !== 'undefined' 
    ? process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ""
    : "";

  const activeLayers = layers.filter(l => l.active);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Check for token
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) {
      console.warn("Mapbox token not set - map will not load");
      setMapError("No Mapbox token found");
      return;
    }

    console.log("Initializing Mapbox with token:", token.substring(0, 20) + "...");
    mapboxgl.accessToken = token;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/satellite-streets-v12",
      center: [property.centroid.lng, property.centroid.lat],
      zoom: 17,
      pitch: 0,
      bearing: 0,
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    // Handle load
    map.current.on("load", () => {
      setIsLoaded(true);
      
      // Generate parcel geometry - use existing or create from lot dimensions
      const parcelGeometry = property.parcelGeometry || generateFallbackGeometry(
        property.centroid.lat,
        property.centroid.lng,
        property.lotWidth || 100,
        property.lotDepth || 150
      );
      
      if (map.current) {
        map.current.addSource("parcel", {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: parcelGeometry,
          },
        });

        // Fill with semi-transparent blue
        map.current.addLayer({
          id: "parcel-fill",
          type: "fill",
          source: "parcel",
          paint: {
            "fill-color": "#3b82f6",
            "fill-opacity": 0.2,
          },
        });

        // Outline with bright blue
        map.current.addLayer({
          id: "parcel-outline",
          type: "line",
          source: "parcel",
          paint: {
            "line-color": "#60a5fa",
            "line-width": 4,
          },
        });
        
        // Dashed inner line for visibility
        map.current.addLayer({
          id: "parcel-outline-inner",
          type: "line",
          source: "parcel",
          paint: {
            "line-color": "#ffffff",
            "line-width": 2,
            "line-dasharray": [4, 4],
          },
        });
      }
    });

    // Handle click
    map.current.on("click", (e) => {
      onMapClick?.(e.lngLat.lng, e.lngLat.lat);
    });

    // Add marker for property centroid
    marker.current = new mapboxgl.Marker({ color: "#3b82f6" })
      .setLngLat([property.centroid.lng, property.centroid.lat])
      .addTo(map.current);

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Update center when property changes
  useEffect(() => {
    if (map.current && property.centroid) {
      map.current.flyTo({
        center: [property.centroid.lng, property.centroid.lat],
        zoom: 17,
        duration: 1000,
      });

      if (marker.current) {
        marker.current.setLngLat([property.centroid.lng, property.centroid.lat]);
      }
    }
  }, [property.centroid.lat, property.centroid.lng]);

  const getLayerColor = (group: string): string => {
    const colors: Record<string, string> = {
      zoning: "#6366f1",
      utilities: "#10b981",
      septic: "#f59e0b",
      environment: "#14b8a6",
      hazards: "#f43f5e",
    };
    return colors[group] || "#64748b";
  };

  // Fallback if error
  if (mapError) {
    return (
      <div className={`relative w-full h-full min-h-[400px] bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-hidden flex items-center justify-center ${className}`}>
        <div className="text-center p-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <svg className="w-8 h-8 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Map Error</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs">
            {mapError}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full min-h-[400px] bg-slate-900 ${className}`}>
      {/* Map Container - Using inline styles for guaranteed sizing */}
      <div 
        ref={mapContainer} 
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: '1rem', overflow: 'hidden' }}
      />

      {/* Loading overlay */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-slate-100 dark:bg-slate-800 flex items-center justify-center rounded-2xl">
          <div className="flex flex-col items-center gap-3">
            <svg className="animate-spin w-8 h-8 text-blue-500" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-sm text-slate-500">Loading map...</span>
          </div>
        </div>
      )}

      {/* Layer Toggle Button */}
      <div className="absolute top-4 left-4 z-10">
        <button
          onClick={() => setShowLayerPanel(!showLayerPanel)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl shadow-lg transition-colors ${
            showLayerPanel
              ? "bg-blue-500 text-white"
              : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <span className="text-sm font-medium">Layers</span>
          {activeLayers.length > 0 && (
            <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs rounded-full">
              {activeLayers.length}
            </span>
          )}
        </button>
      </div>

      {/* Layer Panel */}
      {showLayerPanel && (
        <div className="absolute top-16 left-4 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-4 z-10">
          <h4 className="font-semibold text-slate-900 dark:text-white mb-3">Map Layers</h4>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {layers.map((layer) => (
              <label
                key={layer.id}
                className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={layer.active}
                  onChange={() => onLayerToggle?.(layer.id)}
                  className="w-4 h-4 rounded border-slate-300 text-blue-500 focus:ring-blue-500"
                />
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: getLayerColor(layer.group) }}
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">{layer.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Property Info Badge */}
      <div className="absolute bottom-4 right-4 z-10">
        <div className="px-4 py-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur rounded-xl shadow-lg">
          <p className="text-sm font-medium text-slate-900 dark:text-white">{property.address}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {property.areaSqft ? `${(property.areaSqft / 43560).toFixed(2)} acres` : "Area unknown"}
            {property.zoningDistrict && ` • ${property.zoningDistrict.code}`}
          </p>
        </div>
      </div>
    </div>
  );
}

// Helper to generate fallback parcel geometry from lot dimensions
function generateFallbackGeometry(
  lat: number, 
  lng: number, 
  widthFt: number, 
  depthFt: number
): { type: "Polygon"; coordinates: number[][][] } {
  // Convert feet to approximate degrees
  // 1 degree latitude ≈ 364,000 feet
  // 1 degree longitude varies by latitude, roughly cos(lat) * 364,000 feet
  const latDegPerFt = 1 / 364000;
  const lngDegPerFt = 1 / (364000 * Math.cos(lat * Math.PI / 180));
  
  const halfWidth = (widthFt / 2) * lngDegPerFt;
  const halfDepth = (depthFt / 2) * latDegPerFt;
  
  return {
    type: "Polygon",
    coordinates: [[
      [lng - halfWidth, lat - halfDepth],
      [lng + halfWidth, lat - halfDepth],
      [lng + halfWidth, lat + halfDepth],
      [lng - halfWidth, lat + halfDepth],
      [lng - halfWidth, lat - halfDepth],
    ]],
  };
}


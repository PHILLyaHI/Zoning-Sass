"use client";

import dynamic from "next/dynamic";
import { useState, useEffect, useMemo } from "react";
import { PropertyRecord, LayerState } from "../lib/types";

const MapboxMap = dynamic(() => import("./MapboxMap"), {
  ssr: false,
  loading: () => <MapLoadingSkeleton />,
});

type PropertyMapProps = {
  property: PropertyRecord;
  layers: LayerState[];
  onLayerToggle?: (layerId: string) => void;
  onMapClick?: (lng: number, lat: number) => void;
};

function MapLoadingSkeleton() {
  return (
    <div className="absolute inset-0 bg-slate-900 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-white/20 rounded-full" />
          <div className="absolute inset-0 border-4 border-white border-t-transparent rounded-full animate-spin" />
        </div>
        <span className="text-sm text-white/70 font-medium">Loading map...</span>
      </div>
    </div>
  );
}

export default function PropertyMap({ property, layers, onLayerToggle, onMapClick }: PropertyMapProps) {
  const [useMapbox, setUseMapbox] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showLayerPanel, setShowLayerPanel] = useState(false);
  const [mapStyle, setMapStyle] = useState<"satellite" | "street">("satellite");

  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    setUseMapbox(!!token && token.startsWith("pk."));
    
    if (!token) {
      const timer = setTimeout(() => setIsLoaded(true), 600);
      return () => clearTimeout(timer);
    }
  }, []);

  // Generate realistic parcel corners based on property dimensions
  const parcelData = useMemo(() => {
    const width = property.lotWidth || 100;
    const depth = property.lotDepth || 150;
    const area = property.areaSqft || (width * depth);
    const acres = (area / 43560).toFixed(2);
    return { width, depth, area, acres };
  }, [property]);

  const activeLayers = layers.filter(l => l.active);

  const layerGroups = {
    zoning: { label: "Zoning", icon: "📋", color: "#6366f1" },
    utilities: { label: "Utilities", icon: "🔌", color: "#10b981" },
    septic: { label: "Septic", icon: "🚽", color: "#f59e0b" },
    environment: { label: "Environment", icon: "🌿", color: "#14b8a6" },
    hazards: { label: "Hazards", icon: "⚠️", color: "#f43f5e" },
  };

  if (useMapbox) {
    return (
      <div className="relative w-full h-full min-h-[400px]">
        <MapboxMap
          property={property}
          layers={layers}
          onLayerToggle={onLayerToggle}
          onMapClick={onMapClick}
          className="rounded-none lg:rounded-l-none"
        />
      </div>
    );
  }

  // Professional Zillow-style map without Mapbox
  return (
    <div className="relative w-full h-full min-h-[400px] overflow-hidden bg-slate-900">
      {/* Satellite-style Background */}
      <div className="absolute inset-0">
        {/* Realistic satellite texture */}
        <div 
          className="absolute inset-0"
          style={{
            background: mapStyle === "satellite" 
              ? `
                radial-gradient(ellipse at 30% 40%, #1a472a 0%, transparent 50%),
                radial-gradient(ellipse at 70% 60%, #234f1e 0%, transparent 40%),
                radial-gradient(ellipse at 50% 80%, #1e3a2a 0%, transparent 50%),
                linear-gradient(135deg, #0f2817 0%, #1a3d1f 25%, #224025 50%, #1a3a20 75%, #132d15 100%)
              `
              : "linear-gradient(135deg, #e2e8f0 0%, #f1f5f9 50%, #e2e8f0 100%)",
          }}
        />
        
        {/* Noise texture for realism */}
        {mapStyle === "satellite" && (
          <div 
            className="absolute inset-0 opacity-40 mix-blend-overlay"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            }}
          />
        )}
        
        {/* Subtle vignette */}
        <div 
          className="absolute inset-0"
          style={{
            background: "radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.3) 100%)",
          }}
        />
      </div>

      {/* SVG Map Content */}
      <svg 
        className="absolute inset-0 w-full h-full" 
        viewBox="0 0 600 500" 
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          {/* Professional gradients */}
          <linearGradient id="parcelBorderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
          
          <linearGradient id="parcelFillGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(59, 130, 246, 0.25)" />
            <stop offset="100%" stopColor="rgba(96, 165, 250, 0.15)" />
          </linearGradient>
          
          <filter id="parcelGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#000" floodOpacity="0.4" />
          </filter>
          
          <pattern id="grassTexture" patternUnits="userSpaceOnUse" width="20" height="20">
            <rect width="20" height="20" fill="#1a472a" />
            <circle cx="5" cy="5" r="1" fill="#234f1e" opacity="0.5" />
            <circle cx="15" cy="15" r="1.5" fill="#2d5a27" opacity="0.4" />
            <circle cx="10" cy="3" r="0.8" fill="#1e5a28" opacity="0.3" />
          </pattern>
          
          <linearGradient id="roadGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#374151" />
            <stop offset="50%" stopColor="#4b5563" />
            <stop offset="100%" stopColor="#374151" />
          </linearGradient>
        </defs>

        {/* Roads - Realistic styling */}
        <g className="roads">
          {/* Main horizontal road */}
          <rect x="0" y="220" width="600" height="60" fill="url(#roadGrad)" />
          <line x1="0" y1="250" x2="600" y2="250" stroke="#9ca3af" strokeWidth="1" strokeDasharray="30 20" />
          {/* Road edge lines */}
          <line x1="0" y1="222" x2="600" y2="222" stroke="#fbbf24" strokeWidth="2" />
          <line x1="0" y1="278" x2="600" y2="278" stroke="#fbbf24" strokeWidth="2" />
          
          {/* Side road */}
          <rect x="480" y="0" width="40" height="220" fill="url(#roadGrad)" opacity="0.8" />
        </g>

        {/* Neighboring parcels */}
        <g className="neighbor-parcels" opacity="0.6">
          {/* Left parcels */}
          <rect x="40" y="40" width="100" height="140" fill="none" stroke="#64748b" strokeWidth="1" strokeDasharray="4 2" />
          <rect x="160" y="40" width="100" height="140" fill="none" stroke="#64748b" strokeWidth="1" strokeDasharray="4 2" />
          
          {/* Right parcels */}
          <rect x="530" y="40" width="60" height="140" fill="none" stroke="#64748b" strokeWidth="1" strokeDasharray="4 2" />
          
          {/* Bottom parcels */}
          <rect x="40" y="300" width="100" height="160" fill="none" stroke="#64748b" strokeWidth="1" strokeDasharray="4 2" />
          <rect x="160" y="300" width="100" height="160" fill="none" stroke="#64748b" strokeWidth="1" strokeDasharray="4 2" />
        </g>

        {/* Subject Parcel - Main focus with animated glow */}
        <g className="subject-parcel">
          {/* Outer glow ring */}
          <rect 
            x="275" 
            y="295" 
            width="190" 
            height="170" 
            fill="none"
            stroke="#60a5fa"
            strokeWidth="12"
            strokeOpacity="0.2"
            rx="6"
          >
            <animate attributeName="stroke-opacity" values="0.1;0.3;0.1" dur="2s" repeatCount="indefinite" />
          </rect>
          
          {/* Parcel fill */}
          <rect 
            x="280" 
            y="300" 
            width="180" 
            height="160" 
            fill="url(#parcelFillGrad)"
            stroke="url(#parcelBorderGrad)"
            strokeWidth="4"
            rx="3"
            filter="url(#parcelGlow)"
          />
          
          {/* Corner markers - Survey style */}
          {[[280, 300], [460, 300], [460, 460], [280, 460]].map(([x, y], i) => (
            <g key={i}>
              <circle cx={x} cy={y} r="8" fill="#3b82f6" stroke="white" strokeWidth="3" />
              <circle cx={x} cy={y} r="3" fill="white" />
            </g>
          ))}
          
          {/* Dimension labels with background */}
          <g className="dimensions">
            <rect x="345" y="281" width="50" height="18" rx="4" fill="white" filter="url(#shadow)" />
            <text x="370" y="294" textAnchor="middle" fontSize="12" fontWeight="700" fill="#1e40af">
              {parcelData.width}'
            </text>
            
            <rect x="466" y="370" width="50" height="18" rx="4" fill="white" filter="url(#shadow)" />
            <text x="491" y="383" textAnchor="middle" fontSize="12" fontWeight="700" fill="#1e40af">
              {parcelData.depth}'
            </text>
          </g>
          
          {/* Existing structure - Professional 3D style */}
          <g className="existing-structure" filter="url(#shadow)">
            {/* Building base */}
            <rect x="315" y="355" width="50" height="40" fill="#64748b" stroke="#475569" strokeWidth="2" rx="3" />
            {/* Roof */}
            <polygon points="340,340 365,355 315,355" fill="#475569" stroke="#374151" strokeWidth="1" />
            {/* Building icon */}
            <text x="340" y="380" textAnchor="middle" fontSize="16">🏠</text>
          </g>
          
          {/* Driveway */}
          <rect x="333" y="280" width="14" height="75" fill="#64748b" opacity="0.9" rx="1" />
          <line x1="337" y1="285" x2="337" y2="350" stroke="#94a3b8" strokeWidth="1" strokeDasharray="5 5" />
          <line x1="343" y1="285" x2="343" y2="350" stroke="#94a3b8" strokeWidth="1" strokeDasharray="5 5" />
          
          {/* Property setbacks - if toggled */}
          {activeLayers.find(l => l.id === "setbacks") && (
            <g className="setbacks">
              <rect 
                x="300" 
                y="330" 
                width="140" 
                height="100" 
                fill="rgba(251, 191, 36, 0.1)"
                stroke="#fbbf24" 
                strokeWidth="3"
                strokeDasharray="10 5"
                rx="4"
              >
                <animate attributeName="stroke-dashoffset" values="0;30" dur="1s" repeatCount="indefinite" />
              </rect>
              <rect x="335" y="315" width="70" height="18" rx="4" fill="#fbbf24" />
              <text x="370" y="328" textAnchor="middle" fill="white" fontSize="10" fontWeight="700">
                BUILDABLE
              </text>
            </g>
          )}
        </g>

        {/* Wetland area - if toggled */}
        {activeLayers.find(l => l.id === "wetlands") && (
          <g className="wetland">
            <ellipse cx="100" cy="400" rx="50" ry="40" fill="#14b8a6" opacity="0.3" stroke="#14b8a6" strokeWidth="2" strokeDasharray="6 3" />
            <text x="100" y="405" textAnchor="middle" fill="white" fontSize="10" fontWeight="500">🌿 Wetland</text>
          </g>
        )}

        {/* Property marker pin - Zillow style */}
        <g className="marker" transform="translate(370, 380)">
          {/* Pulse ring */}
          <circle cx="0" cy="0" r="25" fill="none" stroke="#3b82f6" strokeWidth="2" opacity="0.4">
            <animate attributeName="r" values="20;35;20" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.5;0;0.5" dur="2s" repeatCount="indefinite" />
          </circle>
          
          {/* Pin */}
          <g transform="translate(-20, -50)">
            <path 
              d="M20 0C8.954 0 0 8.954 0 20c0 11.046 20 32 20 32s20-20.954 20-32C40 8.954 31.046 0 20 0z"
              fill="#1d4ed8"
              stroke="white"
              strokeWidth="3"
              filter="url(#shadow)"
            />
            <circle cx="20" cy="18" r="8" fill="white" />
            <path
              d="M20 12l-5 4v5h3v-3h4v3h3v-5l-5-4z"
              fill="#1d4ed8"
            />
          </g>
        </g>
      </svg>

      {/* Loading overlay */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-slate-900 flex items-center justify-center z-30">
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 border-4 border-white/20 rounded-full" />
              <div className="absolute inset-0 border-4 border-white border-t-transparent rounded-full animate-spin" />
            </div>
            <span className="text-sm text-white/70 font-medium">Loading property...</span>
          </div>
        </div>
      )}

      {/* Top Control Bar */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-20">
        {/* Map style toggle */}
        <div className="flex bg-white rounded-xl shadow-lg overflow-hidden">
          {[
            { id: "satellite", label: "Satellite", icon: "🛰️" },
            { id: "street", label: "Map", icon: "🗺️" },
          ].map((style) => (
            <button
              key={style.id}
              onClick={() => setMapStyle(style.id as typeof mapStyle)}
              className={`px-4 py-2.5 text-sm font-medium transition-all flex items-center gap-2 ${
                mapStyle === style.id
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <span>{style.icon}</span>
              <span className="hidden sm:inline">{style.label}</span>
            </button>
          ))}
        </div>

        {/* Layers button */}
        {layers.length > 0 && (
          <button
            onClick={() => setShowLayerPanel(!showLayerPanel)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-lg transition-all ${
              showLayerPanel
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-700 hover:bg-slate-50"
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
        <div className="absolute top-20 right-4 w-72 bg-white rounded-2xl shadow-2xl z-20 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-4 border-b border-slate-100 bg-slate-50">
            <h4 className="font-semibold text-slate-900">Map Layers</h4>
            <p className="text-xs text-slate-500 mt-0.5">Toggle data overlays</p>
          </div>
          <div className="p-3 space-y-3 max-h-[350px] overflow-y-auto">
            {Object.entries(layerGroups).map(([groupId, group]) => {
              const groupLayers = layers.filter(l => l.group === groupId);
              if (groupLayers.length === 0) return null;
              
              return (
                <div key={groupId}>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-2 px-2">
                    <span>{group.icon}</span>
                    {group.label}
                  </p>
                  <div className="space-y-1">
                    {groupLayers.map((layer) => (
                      <label
                        key={layer.id}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                          layer.active 
                            ? "bg-blue-50 border border-blue-100" 
                            : "hover:bg-slate-50 border border-transparent"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={layer.active}
                          onChange={() => onLayerToggle?.(layer.id)}
                          className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: group.color }}
                        />
                        <span className="text-sm text-slate-700 flex-1">{layer.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Zoom Controls */}
      <div className="absolute bottom-28 lg:bottom-8 right-4 flex flex-col gap-1 z-20">
        <button className="w-10 h-10 bg-white rounded-lg shadow-lg flex items-center justify-center text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
        <button className="w-10 h-10 bg-white rounded-lg shadow-lg flex items-center justify-center text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>
      </div>

      {/* Property Info Card - Zillow style bottom card */}
      <div className="absolute bottom-4 left-4 right-4 lg:right-auto lg:max-w-md z-20">
        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-4 border border-white/50">
          <div className="flex items-start gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold px-2.5 py-1 bg-blue-600 text-white rounded-lg">
                  {property.zoningDistrict?.code || "R-5"}
                </span>
                <span className="text-xs text-slate-500">{property.county} County</span>
              </div>
              <h3 className="font-bold text-slate-900 text-lg leading-tight truncate">
                {property.address}
              </h3>
              <p className="text-sm text-slate-500">
                {property.city}, {property.state} {property.zipCode}
              </p>
            </div>
            
            {/* Mini lot diagram */}
            <div className="shrink-0 w-16 h-16 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-xl flex items-center justify-center border-2 border-blue-400">
              <div className="w-8 h-10 bg-blue-500/30 border-2 border-blue-500 rounded-sm relative">
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-xs">🏠</div>
              </div>
            </div>
          </div>
          
          {/* Property stats - horizontal bar */}
          <div className="mt-3 pt-3 border-t border-slate-200/50 grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-lg font-bold text-slate-900">{parcelData.acres}</p>
              <p className="text-xs text-slate-500">acres</p>
            </div>
            <div className="text-center border-x border-slate-200">
              <p className="text-lg font-bold text-slate-900">{parcelData.width}'</p>
              <p className="text-xs text-slate-500">width</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-slate-900">{parcelData.depth}'</p>
              <p className="text-xs text-slate-500">depth</p>
            </div>
          </div>
        </div>
      </div>

      {/* Demo mode banner */}
      {!useMapbox && (
        <div className="absolute top-20 left-4 z-20">
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 shadow-lg max-w-xs">
            <div className="flex items-start gap-2">
              <span className="text-amber-500 mt-0.5">ℹ️</span>
              <div>
                <p className="text-xs font-semibold text-amber-800">Demo Visualization</p>
                <p className="text-xs text-amber-600 mt-0.5">
                  Add Mapbox API key for satellite imagery
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      {activeLayers.length > 0 && (
        <div className="absolute bottom-4 right-16 z-20 hidden lg:block">
          <div className="bg-white/95 backdrop-blur rounded-xl shadow-lg px-4 py-3">
            <p className="text-xs font-semibold text-slate-600 mb-2">Legend</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs">
                <div className="w-4 h-1 rounded-full bg-gradient-to-r from-blue-400 to-blue-600" />
                <span className="text-slate-600">Parcel Boundary</span>
              </div>
              {activeLayers.map((layer) => (
                <div key={layer.id} className="flex items-center gap-2 text-xs">
                  <div
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: layerGroups[layer.group as keyof typeof layerGroups]?.color || "#64748b" }}
                  />
                  <span className="text-slate-600">{layer.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

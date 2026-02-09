"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { PropertyRecord } from "../lib/types";
import {
  evaluateConstraints,
  generateMockSiteConstraints,
  getPermitRequirements,
  getUtilitySummary,
  getSepticSummary,
  RealTimeComment,
  PlacedStructure,
  Easement,
  SiteConstraints,
} from "../lib/siteConstraints";

// ============================================
// TYPES
// ============================================

type Structure = {
  id: string;
  type: "house" | "adu" | "dadu" | "garage" | "pool" | "shop" | "deck";
  label: string;
  x: number;
  y: number;
  width: number;
  depth: number;
  rotation: number;
  isExisting: boolean;
  color: string;
  icon: string;
  bedrooms?: number;
  stories?: number;
};

// ============================================
// STRUCTURE PRESETS - Premium Design
// ============================================

const STRUCTURE_TYPES = [
  { type: "house", label: "House", icon: "🏠", width: 40, depth: 30, color: "from-blue-500 to-indigo-600", bedrooms: 3 },
  { type: "adu", label: "ADU", icon: "🏡", width: 24, depth: 20, color: "from-emerald-500 to-teal-600", bedrooms: 1 },
  { type: "dadu", label: "DADU", icon: "🏘️", width: 28, depth: 22, color: "from-cyan-500 to-blue-600", bedrooms: 2 },
  { type: "garage", label: "Garage", icon: "🚗", width: 24, depth: 24, color: "from-violet-500 to-purple-600", bedrooms: 0 },
  { type: "shop", label: "Shop/Barn", icon: "🏭", width: 30, depth: 40, color: "from-amber-500 to-orange-600", bedrooms: 0 },
  { type: "pool", label: "Pool", icon: "🏊", width: 20, depth: 40, color: "from-sky-400 to-cyan-500", bedrooms: 0 },
  { type: "deck", label: "Deck", icon: "🪵", width: 16, depth: 12, color: "from-stone-500 to-stone-600", bedrooms: 0 },
] as const;

const SOLID_COLORS: Record<string, string> = {
  house: "#3b82f6",
  adu: "#10b981",
  dadu: "#06b6d4",
  garage: "#8b5cf6",
  shop: "#f59e0b",
  pool: "#0ea5e9",
  deck: "#78716c",
};

const FEATURE_COLORS: Record<string, { fill: string; border: string; label: string; pattern?: string }> = {
  house: { fill: "rgba(100, 116, 139, 0.7)", border: "#475569", label: "Existing House" },
  driveway: { fill: "rgba(107, 114, 128, 0.6)", border: "#4b5563", label: "Driveway", pattern: "driveway" },
  utility_easement: { fill: "rgba(251, 191, 36, 0.25)", border: "#f59e0b", label: "Utility Easement", pattern: "diagonal" },
  access_easement: { fill: "rgba(249, 115, 22, 0.25)", border: "#ea580c", label: "Access Easement", pattern: "diagonal" },
  easement: { fill: "rgba(6, 182, 212, 0.2)", border: "#0891b2", label: "Easement", pattern: "diagonal" },
  garage: { fill: "rgba(148, 163, 184, 0.6)", border: "#64748b", label: "Garage" },
  septic_tank: { fill: "rgba(139, 92, 246, 0.5)", border: "#8b5cf6", label: "Septic Tank" },
  drainfield: { fill: "rgba(167, 139, 250, 0.4)", border: "#a78bfa", label: "Drainfield" },
  reserve_area: { fill: "rgba(196, 181, 253, 0.3)", border: "#c4b5fd", label: "Reserve Area" },
  well: { fill: "rgba(14, 165, 233, 0.6)", border: "#0ea5e9", label: "Well" },
};

// ============================================
// COMPONENT
// ============================================

type Props = {
  property: PropertyRecord;
  onValidationChange?: (messages: RealTimeComment[]) => void;
};

export default function SitePlanDesigner({ property, onValidationChange }: Props) {
  const lotWidth = property.lotWidth || 171;
  const lotDepth = property.lotDepth || 255;
  
  const maxCanvasWidth = typeof window !== "undefined" ? Math.min(window.innerWidth * 0.55, 700) : 600;
  const maxCanvasHeight = typeof window !== "undefined" ? Math.min(window.innerHeight - 200, 600) : 500;
  const scale = Math.min(maxCanvasWidth / lotWidth, maxCanvasHeight / lotDepth, 4);
  
  const canvasWidth = lotWidth * scale;
  const canvasHeight = lotDepth * scale;

  const siteConstraints = useMemo(() => generateMockSiteConstraints(property), [property]);

  const [structures, setStructures] = useState<Structure[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dragState, setDragState] = useState<{ structureId: string; offsetX: number; offsetY: number } | null>(null);
  const [resizeState, setResizeState] = useState<{ structureId: string; handle: "e" | "s" | "se"; startWidth: number; startDepth: number; startX: number; startY: number } | null>(null);
  const [comments, setComments] = useState<RealTimeComment[]>([]);
  const [showSetbacks, setShowSetbacks] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [showSiteFeatures, setShowSiteFeatures] = useState(true);
  const [activeTab, setActiveTab] = useState<"feedback" | "permits" | "utilities" | "septic" | "easements">("feedback");
  const [isPanelExpanded, setIsPanelExpanded] = useState(true);
  
  const canvasRef = useRef<HTMLDivElement>(null);

  const setbacks = { front: 25, side: 10, rear: 20 };

  // Validation
  const validateAllStructures = useCallback(() => {
    const allComments: RealTimeComment[] = [];
    const placedStructures: PlacedStructure[] = structures.map(s => ({
      id: s.id, type: s.type, label: s.label, x: s.x, y: s.y, width: s.width, depth: s.depth, bedrooms: s.bedrooms, stories: s.stories,
    }));
    
    for (const struct of placedStructures) {
      const structComments = evaluateConstraints(struct, placedStructures, siteConstraints, lotWidth, lotDepth);
      allComments.push(...structComments);
    }
    
    const uniqueComments = allComments.filter((c, i, self) => i === self.findIndex(x => x.id === c.id));
    setComments(uniqueComments);
    onValidationChange?.(uniqueComments);
  }, [structures, siteConstraints, lotWidth, lotDepth, onValidationChange]);

  useEffect(() => { validateAllStructures(); }, [validateAllStructures]);

  // Drag & Drop
  const handleMouseDown = (e: React.MouseEvent, structureId: string) => {
    e.preventDefault();
    const struct = structures.find(s => s.id === structureId);
    if (!struct || struct.isExisting) return;
    setSelectedId(structureId);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mouseX = (e.clientX - rect.left) / scale;
    const mouseY = (e.clientY - rect.top) / scale;
    setDragState({ structureId, offsetX: mouseX - struct.x, offsetY: mouseY - struct.y });
  };

  const handleResizeStart = (e: React.MouseEvent, structureId: string, handle: "e" | "s" | "se") => {
    e.preventDefault();
    e.stopPropagation();
    const struct = structures.find(s => s.id === structureId);
    if (!struct || struct.isExisting) return;
    setResizeState({ structureId, handle, startWidth: struct.width, startDepth: struct.depth, startX: e.clientX, startY: e.clientY });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    if (dragState) {
      const mouseX = (e.clientX - rect.left) / scale;
      const mouseY = (e.clientY - rect.top) / scale;
      let newX = mouseX - dragState.offsetX;
      let newY = mouseY - dragState.offsetY;
      const struct = structures.find(s => s.id === dragState.structureId);
      if (struct) {
        newX = Math.max(0, Math.min(lotWidth - struct.width, newX));
        newY = Math.max(0, Math.min(lotDepth - struct.depth, newY));
      }
      newX = Math.round(newX / 5) * 5;
      newY = Math.round(newY / 5) * 5;
      setStructures(prev => prev.map(s => s.id === dragState.structureId ? { ...s, x: newX, y: newY } : s));
    }
    
    if (resizeState) {
      const deltaX = (e.clientX - resizeState.startX) / scale;
      const deltaY = (e.clientY - resizeState.startY) / scale;
      setStructures(prev => prev.map(s => {
        if (s.id !== resizeState.structureId) return s;
        let newWidth = resizeState.startWidth;
        let newDepth = resizeState.startDepth;
        if (resizeState.handle === "e" || resizeState.handle === "se") {
          newWidth = Math.max(10, Math.round((resizeState.startWidth + deltaX) / 2) * 2);
        }
        if (resizeState.handle === "s" || resizeState.handle === "se") {
          newDepth = Math.max(10, Math.round((resizeState.startDepth + deltaY) / 2) * 2);
        }
        return { ...s, width: newWidth, depth: newDepth };
      }));
    }
  }, [dragState, resizeState, scale, structures, lotWidth, lotDepth]);

  const handleMouseUp = useCallback(() => { setDragState(null); setResizeState(null); }, []);

  useEffect(() => {
    if (dragState || resizeState) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [dragState, resizeState, handleMouseMove, handleMouseUp]);

  // Add/Remove Structure
  const addStructure = (type: typeof STRUCTURE_TYPES[number]["type"]) => {
    const preset = STRUCTURE_TYPES.find(s => s.type === type);
    if (!preset) return;
    const newStructure: Structure = {
      id: `${type}-${Date.now()}`,
      type,
      label: preset.label,
      x: Math.round(lotWidth / 2 - preset.width / 2),
      y: setbacks.front + 15,
      width: preset.width,
      depth: preset.depth,
      rotation: 0,
      isExisting: false,
      color: SOLID_COLORS[type] || "#3b82f6",
      icon: preset.icon,
      bedrooms: preset.bedrooms,
      stories: 1,
    };
    setStructures(prev => [...prev, newStructure]);
    setSelectedId(newStructure.id);
  };

  const removeStructure = (id: string) => {
    setStructures(prev => prev.filter(s => s.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  // Derived
  const selectedStructure = structures.find(s => s.id === selectedId);
  const criticalComments = comments.filter(c => c.severity === "critical");
  const warningComments = comments.filter(c => c.severity === "warning");
  const successComments = comments.filter(c => c.severity === "success");
  
  const permits = useMemo(() => {
    const placedStructures: PlacedStructure[] = structures.map(s => ({ id: s.id, type: s.type, label: s.label, x: s.x, y: s.y, width: s.width, depth: s.depth }));
    return getPermitRequirements(placedStructures, siteConstraints);
  }, [structures, siteConstraints]);
  
  const utilitySummary = useMemo(() => getUtilitySummary(siteConstraints), [siteConstraints]);
  const septicSummary = useMemo(() => getSepticSummary(siteConstraints), [siteConstraints]);

  const existingCoverage = siteConstraints.existingFeatures.filter(f => f.type === "house" || f.type === "garage").reduce((sum, f) => sum + f.width * f.height, 0);
  const newCoverage = structures.reduce((sum, s) => sum + s.width * s.depth, 0);
  const totalCoverage = newCoverage + existingCoverage;
  const coveragePercent = (totalCoverage / (lotWidth * lotDepth)) * 100;
  const maxCoverage = 35;

  return (
    <div className="h-full flex">
      {/* Canvas Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 lg:p-8">
        {/* Floating Toolbar */}
        <div className="mb-4 flex items-center gap-2 p-2 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10">
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              showGrid 
                ? "bg-white text-slate-900 shadow-lg" 
                : "text-white/70 hover:text-white hover:bg-white/10"
            }`}
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
              Grid
            </span>
          </button>
          <button
            onClick={() => setShowSetbacks(!showSetbacks)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              showSetbacks 
                ? "bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-lg shadow-orange-500/30" 
                : "text-white/70 hover:text-white hover:bg-white/10"
            }`}
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
              Setbacks
            </span>
          </button>
          <button
            onClick={() => setShowSiteFeatures(!showSiteFeatures)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              showSiteFeatures 
                ? "bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg shadow-purple-500/30" 
                : "text-white/70 hover:text-white hover:bg-white/10"
            }`}
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Features
            </span>
          </button>
          
          <div className="w-px h-6 bg-white/20 mx-2" />
          
          <div className="text-white/60 text-sm px-3">
            <span className="font-semibold text-white">{lotWidth}'</span> × <span className="font-semibold text-white">{lotDepth}'</span>
            <span className="ml-2 text-white/40">({(lotWidth * lotDepth).toLocaleString()} sf)</span>
          </div>
        </div>

        {/* Canvas Container with Glow */}
        <div className="relative">
          {/* Glow effect */}
          <div 
            className="absolute -inset-4 bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-cyan-500/20 rounded-3xl blur-2xl opacity-50"
          />
          
          {/* Road Label */}
          <div className="relative z-10 flex items-center justify-center mb-2">
            <div className="flex items-center gap-3 text-white/50 text-xs uppercase tracking-widest">
              <div className="w-12 h-px bg-white/20" />
              <span>🚗 Street</span>
              <div className="w-12 h-px bg-white/20" />
            </div>
          </div>

          {/* Main Canvas */}
          <div 
            ref={canvasRef}
            className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-slate-700/50"
            style={{ 
              width: canvasWidth, 
              height: canvasHeight,
              cursor: dragState ? "grabbing" : "default",
              background: "linear-gradient(135deg, #d4f1d4 0%, #a8d5a2 50%, #7bc47f 100%)",
            }}
          >
            {/* Grid Pattern */}
            {showGrid && (
              <svg className="absolute inset-0 pointer-events-none" width={canvasWidth} height={canvasHeight}>
                <defs>
                  <pattern id="grid" width={10 * scale} height={10 * scale} patternUnits="userSpaceOnUse">
                    <path d={`M ${10 * scale} 0 L 0 0 0 ${10 * scale}`} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="1" />
                  </pattern>
                  <pattern id="grid-major" width={50 * scale} height={50 * scale} patternUnits="userSpaceOnUse">
                    <path d={`M ${50 * scale} 0 L 0 0 0 ${50 * scale}`} fill="none" stroke="rgba(0,0,0,0.12)" strokeWidth="1" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
                <rect width="100%" height="100%" fill="url(#grid-major)" />
              </svg>
            )}

            {/* Property Boundary */}
            <div className="absolute inset-0 border-4 border-slate-800 pointer-events-none" style={{ boxSizing: "border-box" }} />

            {/* Setback Zones */}
            {showSetbacks && (
              <>
                {/* Front */}
                <div 
                  className="absolute left-0 right-0 border-b-3 border-amber-500 border-dashed"
                  style={{ top: 0, height: setbacks.front * scale, background: "linear-gradient(180deg, rgba(251,191,36,0.35) 0%, rgba(251,191,36,0.15) 100%)" }}
                >
                  <span className="absolute right-3 bottom-2 px-2 py-1 bg-amber-500 text-white text-[10px] font-bold rounded-lg shadow-lg">
                    {setbacks.front}' Front
                  </span>
                </div>
                
                {/* Sides */}
                <div 
                  className="absolute top-0 bottom-0 border-r-2 border-amber-500/70 border-dashed"
                  style={{ left: 0, width: setbacks.side * scale, background: "linear-gradient(90deg, rgba(251,191,36,0.2) 0%, transparent 100%)" }}
                />
                <div 
                  className="absolute top-0 bottom-0 border-l-2 border-amber-500/70 border-dashed"
                  style={{ right: 0, width: setbacks.side * scale, background: "linear-gradient(-90deg, rgba(251,191,36,0.2) 0%, transparent 100%)" }}
                />
                
                {/* Rear */}
                <div 
                  className="absolute left-0 right-0 border-t-3 border-amber-500 border-dashed"
                  style={{ bottom: 0, height: setbacks.rear * scale, background: "linear-gradient(0deg, rgba(251,191,36,0.35) 0%, rgba(251,191,36,0.15) 100%)" }}
                >
                  <span className="absolute right-3 top-2 px-2 py-1 bg-amber-500 text-white text-[10px] font-bold rounded-lg shadow-lg">
                    {setbacks.rear}' Rear
                  </span>
                </div>
                
                {/* Buildable Area */}
                <div 
                  className="absolute pointer-events-none"
                  style={{
                    left: setbacks.side * scale,
                    top: setbacks.front * scale,
                    width: (lotWidth - setbacks.side * 2) * scale,
                    height: (lotDepth - setbacks.front - setbacks.rear) * scale,
                    border: "3px dashed rgba(16, 185, 129, 0.7)",
                    background: "rgba(16, 185, 129, 0.08)",
                    borderRadius: 8,
                  }}
                />
              </>
            )}

            {/* ALWAYS VISIBLE: Wetlands (critical environmental feature) */}
            {siteConstraints.existingFeatures.filter(f => f.type === "wetland").map((feature) => (
              <div 
                key={feature.id} 
                className="absolute pointer-events-none overflow-hidden"
                style={{ 
                  left: feature.x * scale, 
                  top: feature.y * scale, 
                  width: feature.width * scale, 
                  height: feature.height * scale,
                  border: "3px solid #14b8a6",
                  borderRadius: 12,
                  background: "repeating-linear-gradient(45deg, rgba(20, 184, 166, 0.15), rgba(20, 184, 166, 0.15) 8px, rgba(20, 184, 166, 0.3) 8px, rgba(20, 184, 166, 0.3) 16px)",
                }}
              >
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl">🌿</span>
                  <span className="text-[10px] font-bold text-teal-700 bg-teal-100/80 px-2 py-0.5 rounded-full mt-1">
                    WETLAND
                  </span>
                  <span className="text-[8px] text-teal-600 mt-0.5">{feature.setbackRequired}' buffer required</span>
                </div>
                {/* Corner markers */}
                <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-teal-500 rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-teal-500 rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-teal-500 rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-teal-500 rounded-br-lg" />
              </div>
            ))}

            {/* ALWAYS VISIBLE: Existing Structures (house, garage, shed) */}
            {siteConstraints.existingFeatures.filter(f => f.type === "house" || f.type === "garage" || f.type === "shed").map((feature) => {
              const structureIcons: Record<string, string> = { house: "🏠", garage: "🚗", shed: "🏚️" };
              const structureColors: Record<string, { bg: string; border: string }> = {
                house: { bg: "rgba(100, 116, 139, 0.85)", border: "#475569" },
                garage: { bg: "rgba(148, 163, 184, 0.8)", border: "#64748b" },
                shed: { bg: "rgba(161, 161, 170, 0.7)", border: "#71717a" },
              };
              const colors = structureColors[feature.type] || structureColors.shed;
              
              return (
                <div 
                  key={feature.id} 
                  className="absolute pointer-events-none"
                  style={{ 
                    left: feature.x * scale, 
                    top: feature.y * scale, 
                    width: feature.width * scale, 
                    height: feature.height * scale,
                    backgroundColor: colors.bg,
                    border: `3px solid ${colors.border}`,
                    borderRadius: 8,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                  }}
                >
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl">{structureIcons[feature.type] || "🏠"}</span>
                    <span className="text-[9px] font-bold text-white drop-shadow mt-0.5">{feature.label}</span>
                    <span className="text-[8px] text-white/70">{feature.width}' × {feature.height}'</span>
                  </div>
                </div>
              );
            })}

            {/* Toggleable Features (driveways, wells, septic, easements) */}
            {showSiteFeatures && siteConstraints.existingFeatures.map((feature) => {
              const colors = FEATURE_COLORS[feature.type] || { fill: "rgba(100,100,100,0.3)", border: "#666", label: feature.type };
              
              // Skip structures (already rendered above) and wetlands
              if (feature.type === "house" || feature.type === "garage" || feature.type === "shed" || feature.type === "wetland") {
                return null;
              }
              
              // Well with protection zone
              if (feature.type === "well") {
                return (
                  <div key={feature.id} className="absolute flex items-center justify-center" style={{ left: (feature.x - 2) * scale, top: (feature.y - 2) * scale, width: 4 * scale, height: 4 * scale }}>
                    <div className="absolute rounded-full border-2 border-dashed border-sky-400 pointer-events-none" style={{ width: 180 * scale, height: 180 * scale, backgroundColor: "rgba(14, 165, 233, 0.08)", left: "50%", top: "50%", transform: "translate(-50%, -50%)" }} />
                    <div className="absolute w-7 h-7 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold shadow-lg" style={{ boxShadow: "0 0 20px rgba(14, 165, 233, 0.5)" }}>W</div>
                    <span className="absolute text-[9px] font-bold whitespace-nowrap text-sky-600" style={{ top: 32 }}>Well (100' buffer)</span>
                  </div>
                );
              }

              // Skip utility lines
              if (feature.type === "sewer_line" || feature.type === "water_line") return null;
              
              // Driveway - special rendering with tire track pattern
              if (feature.type === "driveway") {
                return (
                  <div key={feature.id} className="absolute pointer-events-none" style={{ left: feature.x * scale, top: feature.y * scale, width: feature.width * scale, height: feature.height * scale }}>
                    <div className="absolute inset-0 rounded-sm" style={{ backgroundColor: colors.fill, border: `2px solid ${colors.border}` }}>
                      {/* Tire track lines */}
                      <div className="absolute left-[20%] top-0 bottom-0 w-[2px]" style={{ backgroundColor: colors.border, opacity: 0.4 }} />
                      <div className="absolute right-[20%] top-0 bottom-0 w-[2px]" style={{ backgroundColor: colors.border, opacity: 0.4 }} />
                    </div>
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[8px] font-bold px-1.5 py-0.5 rounded bg-gray-700 text-white whitespace-nowrap">
                      🚗 {feature.label}
                    </span>
                  </div>
                );
              }
              
              // Easements - diagonal stripe pattern
              if (feature.type === "utility_easement" || feature.type === "access_easement" || feature.type === "easement") {
                const isUtility = feature.type === "utility_easement";
                const isAccess = feature.type === "access_easement";
                const stripeColor = isUtility ? "#f59e0b" : isAccess ? "#ea580c" : "#0891b2";
                
                return (
                  <div 
                    key={feature.id} 
                    className="absolute pointer-events-none overflow-hidden" 
                    style={{ 
                      left: feature.x * scale, 
                      top: feature.y * scale, 
                      width: feature.width * scale, 
                      height: feature.height * scale,
                      border: `2px dashed ${stripeColor}`,
                      borderRadius: 4,
                    }}
                  >
                    {/* Diagonal stripe pattern */}
                    <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                      <defs>
                        <pattern id={`stripes-${feature.id}`} patternUnits="userSpaceOnUse" width="12" height="12" patternTransform="rotate(45)">
                          <line x1="0" y1="0" x2="0" y2="12" stroke={stripeColor} strokeWidth="3" strokeOpacity="0.3" />
                        </pattern>
                      </defs>
                      <rect width="100%" height="100%" fill={`url(#stripes-${feature.id})`} />
                    </svg>
                    
                    {/* Label */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span 
                        className="text-[8px] font-bold px-2 py-1 rounded shadow-sm whitespace-nowrap"
                        style={{ 
                          backgroundColor: `${stripeColor}20`, 
                          color: stripeColor,
                          border: `1px solid ${stripeColor}`,
                        }}
                      >
                        {isUtility ? "⚡" : isAccess ? "🚶" : "📋"} {feature.label}
                      </span>
                    </div>
                    
                    {/* Restrictions tooltip indicator */}
                    {feature.restrictions && (
                      <div className="absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center text-[8px]" style={{ backgroundColor: stripeColor, color: "white" }}>
                        !
                      </div>
                    )}
                  </div>
                );
              }
              
              // Default feature rendering
              return (
                <div key={feature.id} className="absolute pointer-events-none" style={{ left: feature.x * scale, top: feature.y * scale, width: feature.width * scale, height: feature.height * scale, backgroundColor: colors.fill, border: `2px solid ${colors.border}`, borderRadius: 6 }}>
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-1">
                    <span className="text-[9px] font-bold text-center leading-tight" style={{ color: colors.border }}>{colors.label}</span>
                    {feature.setbackRequired && feature.setbackRequired > 5 && (
                      <span className="text-[8px] opacity-75" style={{ color: colors.border }}>{feature.setbackRequired}' setback</span>
                    )}
                  </div>
                </div>
              );
            })}

            {/* User Structures */}
            {structures.map((struct) => {
              const hasError = comments.some(m => m.structureId === struct.id && m.severity === "critical");
              const hasWarning = comments.some(m => m.structureId === struct.id && m.severity === "warning");
              const isSelected = selectedId === struct.id;
              
              return (
                <div
                  key={struct.id}
                  className={`absolute transition-all duration-150 ${struct.isExisting ? "cursor-not-allowed" : "cursor-grab active:cursor-grabbing"}`}
                  style={{
                    left: struct.x * scale,
                    top: struct.y * scale,
                    width: struct.width * scale,
                    height: struct.depth * scale,
                    background: `linear-gradient(135deg, ${struct.color} 0%, ${struct.color}dd 100%)`,
                    borderRadius: 12,
                    boxShadow: isSelected 
                      ? `0 0 0 4px white, 0 20px 40px rgba(0,0,0,0.3)` 
                      : hasError 
                        ? `0 0 0 4px #f43f5e, 0 10px 30px rgba(244,63,94,0.4)`
                        : hasWarning 
                          ? `0 0 0 4px #fbbf24, 0 10px 30px rgba(251,191,36,0.4)`
                          : `0 8px 24px rgba(0,0,0,0.2)`,
                    transform: isSelected ? "scale(1.02)" : "scale(1)",
                    zIndex: isSelected ? 100 : 10,
                  }}
                  onMouseDown={(e) => handleMouseDown(e, struct.id)}
                  onClick={() => setSelectedId(struct.id)}
                >
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-2">
                    <span className="text-2xl drop-shadow-lg">{struct.icon}</span>
                    <span className="text-[10px] font-bold mt-1 text-center leading-tight drop-shadow">{struct.label}</span>
                    <span className="text-[9px] opacity-80">{struct.width}' × {struct.depth}'</span>
                  </div>

                  {hasError && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg animate-pulse">!</div>
                  )}
                  {hasWarning && !hasError && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg">⚠</div>
                  )}

                  {!struct.isExisting && isSelected && (
                    <>
                      <div className="absolute right-0 top-1/2 w-4 h-10 bg-white rounded-lg cursor-e-resize shadow-lg border-2 border-blue-500" style={{ transform: "translateX(50%) translateY(-50%)" }} onMouseDown={(e) => handleResizeStart(e, struct.id, "e")} />
                      <div className="absolute bottom-0 left-1/2 w-10 h-4 bg-white rounded-lg cursor-s-resize shadow-lg border-2 border-blue-500" style={{ transform: "translateY(50%) translateX(-50%)" }} onMouseDown={(e) => handleResizeStart(e, struct.id, "s")} />
                      <div className="absolute bottom-0 right-0 w-5 h-5 bg-white rounded-lg cursor-se-resize shadow-lg border-2 border-blue-500" style={{ transform: "translate(50%, 50%)" }} onMouseDown={(e) => handleResizeStart(e, struct.id, "se")} />
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* Scale Bar */}
          <div className="relative z-10 flex items-center justify-center mt-4 gap-4 text-white/50 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-10 h-1 bg-white/40 rounded" />
              <span>= 10 ft</span>
            </div>
            <span className="text-white/30">|</span>
            <span>Scale: 1 ft = {scale.toFixed(1)} px</span>
          </div>
        </div>
      </div>

      {/* Side Panel */}
      <div className={`transition-all duration-300 ease-out ${isPanelExpanded ? "w-80 lg:w-96" : "w-14"} shrink-0`}>
        <div className="h-full bg-white rounded-l-3xl shadow-2xl overflow-hidden flex flex-col">
          {/* Toggle Button */}
          <button
            onClick={() => setIsPanelExpanded(!isPanelExpanded)}
            className={`w-full p-3 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors border-b border-slate-100 ${!isPanelExpanded ? "h-full" : ""}`}
          >
            <svg className={`w-5 h-5 transition-transform ${isPanelExpanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {isPanelExpanded && (
            <div className="flex-1 overflow-y-auto">
              {/* Structure Palette */}
              {/* Site Summary - Always visible */}
              <div className="p-4 border-b border-slate-100 bg-gradient-to-br from-slate-50 to-slate-100">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">On This Property</h3>
                <div className="flex flex-wrap gap-2">
                  {/* Existing Structures */}
                  {siteConstraints.existingFeatures.filter(f => f.type === "house").length > 0 && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-700 text-white rounded-lg text-xs font-medium">
                      🏠 House
                    </span>
                  )}
                  {siteConstraints.existingFeatures.filter(f => f.type === "garage").length > 0 && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-600 text-white rounded-lg text-xs font-medium">
                      🚗 Garage
                    </span>
                  )}
                  {siteConstraints.existingFeatures.filter(f => f.type === "shed").length > 0 && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-500 text-white rounded-lg text-xs font-medium">
                      🏚️ Shed
                    </span>
                  )}
                  
                  {/* Wetlands */}
                  {siteConstraints.wetlandsPresent && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-teal-500 text-white rounded-lg text-xs font-medium animate-pulse">
                      🌿 Wetland
                    </span>
                  )}
                  
                  {/* Well */}
                  {siteConstraints.onSiteWell && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-sky-500 text-white rounded-lg text-xs font-medium">
                      💧 Well
                    </span>
                  )}
                  
                  {/* Septic */}
                  {!siteConstraints.sewerAvailable && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-violet-500 text-white rounded-lg text-xs font-medium">
                      🚽 Septic
                    </span>
                  )}
                  
                  {/* Driveway */}
                  {siteConstraints.hasDriveway && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-500 text-white rounded-lg text-xs font-medium">
                      🛣️ Driveway
                    </span>
                  )}
                  
                  {/* Easements */}
                  {siteConstraints.easements.length > 0 && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-500 text-white rounded-lg text-xs font-medium">
                      📜 {siteConstraints.easements.length} Easement{siteConstraints.easements.length > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="p-5 border-b border-slate-100">
                <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs">+</span>
                  Add Structure
                </h3>
                <div className="grid grid-cols-4 gap-2">
                  {STRUCTURE_TYPES.map((type) => (
                    <button
                      key={type.type}
                      onClick={() => addStructure(type.type)}
                      className="group flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 border-slate-100 hover:border-blue-300 hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 transition-all hover:shadow-lg hover:scale-105"
                    >
                      <span className="text-2xl group-hover:scale-110 transition-transform">{type.icon}</span>
                      <span className="text-[10px] font-medium text-slate-600 group-hover:text-blue-700">{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Selected Structure Details */}
              {selectedStructure && !selectedStructure.isExisting && (
                <div className="p-5 border-b border-slate-100 bg-gradient-to-br from-blue-50/50 to-indigo-50/50">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-2xl" style={{ backgroundColor: `${selectedStructure.color}20` }}>
                        {selectedStructure.icon}
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900">{selectedStructure.label}</h4>
                        <p className="text-xs text-slate-500">{selectedStructure.width}&apos; × {selectedStructure.depth}&apos;</p>
                      </div>
                    </div>
                    <button onClick={() => removeStructure(selectedStructure.id)} className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="p-3 bg-white rounded-xl">
                      <p className="text-xs text-slate-400 mb-1">Area</p>
                      <p className="font-semibold text-slate-900">{(selectedStructure.width * selectedStructure.depth).toLocaleString()} sf</p>
                    </div>
                    <div className="p-3 bg-white rounded-xl">
                      <p className="text-xs text-slate-400 mb-1">Position</p>
                      <p className="font-semibold text-slate-900">{selectedStructure.x}&apos;, {selectedStructure.y}&apos;</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Lot Coverage */}
              <div className="p-5 border-b border-slate-100">
                <h4 className="text-sm font-semibold text-slate-900 mb-4">Lot Coverage</h4>
                <div className="relative h-4 bg-slate-100 rounded-full overflow-hidden mb-2">
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-200 to-slate-100" />
                  <div 
                    className={`absolute left-0 top-0 bottom-0 transition-all duration-500 rounded-full ${
                      coveragePercent > maxCoverage ? "bg-gradient-to-r from-rose-500 to-red-500" : coveragePercent > maxCoverage * 0.85 ? "bg-gradient-to-r from-amber-400 to-orange-500" : "bg-gradient-to-r from-emerald-400 to-teal-500"
                    }`}
                    style={{ width: `${Math.min(100, (coveragePercent / maxCoverage) * 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-900">{totalCoverage.toLocaleString()} sf ({coveragePercent.toFixed(1)}%)</span>
                  <span className="text-slate-500">Max {maxCoverage}%</span>
                </div>
              </div>

              {/* Tabbed Panel */}
              <div className="p-2 border-b border-slate-100">
                <div className="flex gap-1 p-1 bg-slate-100 rounded-xl">
                  {[
                    { id: "feedback", label: "Live", icon: "⚡", count: criticalComments.length + warningComments.length },
                    { id: "permits", label: "Permits", icon: "📋", count: permits.filter(p => p.required).length },
                    { id: "utilities", label: "Utils", icon: "🔌", count: 0 },
                    { id: "septic", label: "Septic", icon: "🚽", count: 0 },
                    { id: "easements", label: "Ease.", icon: "📜", count: siteConstraints.easements.length },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as typeof activeTab)}
                      className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-lg text-xs font-medium transition-all ${
                        activeTab === tab.id 
                          ? "bg-white text-slate-900 shadow-sm" 
                          : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      <span>{tab.icon}</span>
                      <span className="hidden sm:inline">{tab.label}</span>
                      {tab.count > 0 && (
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                          activeTab === tab.id ? "bg-rose-500 text-white" : "bg-slate-200 text-slate-600"
                        }`}>{tab.count}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab Content */}
              <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
                {activeTab === "feedback" && (
                  <>
                    {/* Wetlands Alert - Always show if present */}
                    {siteConstraints.wetlandsPresent && (
                      <div className="p-4 rounded-2xl bg-gradient-to-br from-teal-100 to-cyan-100 border-2 border-teal-400 mb-3 animate-pulse-slow">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-white text-xl shadow-lg">🌿</div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <p className="font-bold text-teal-900">Wetland on Property</p>
                              <span className="text-[10px] px-2 py-0.5 bg-teal-600 text-white rounded-full font-bold">CRITICAL AREA</span>
                            </div>
                            <p className="text-xs text-teal-700 mt-1">50'+ buffer required. No construction in wetland area.</p>
                            <p className="text-[10px] text-teal-600 mt-1 font-medium">→ See Easements tab for full requirements</p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {criticalComments.length === 0 && warningComments.length === 0 && successComments.length > 0 && !siteConstraints.wetlandsPresent && (
                      <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-lg shadow-lg">✓</div>
                          <div>
                            <p className="font-semibold text-emerald-900">All Clear!</p>
                            <p className="text-xs text-emerald-700">No violations detected</p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {criticalComments.map(c => (
                      <div key={c.id} className="p-4 rounded-2xl bg-gradient-to-br from-rose-50 to-red-50 border border-rose-200">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-rose-500 flex items-center justify-center text-white text-sm shrink-0">⛔</div>
                          <div>
                            <p className="font-semibold text-rose-900 text-sm">{c.title}</p>
                            <p className="text-xs text-rose-700 mt-1">{c.message}</p>
                            {c.action && <p className="text-xs font-medium text-rose-800 mt-2">→ {c.action}</p>}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {warningComments.map(c => (
                      <div key={c.id} className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-amber-400 flex items-center justify-center text-white text-sm shrink-0">⚠</div>
                          <div>
                            <p className="font-semibold text-amber-900 text-sm">{c.title}</p>
                            <p className="text-xs text-amber-700 mt-1">{c.message}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {structures.length === 0 && <p className="text-sm text-slate-500 text-center py-8">Add a structure to see real-time feedback</p>}
                  </>
                )}

                {activeTab === "permits" && (
                  <>
                    {permits.length === 0 ? <p className="text-sm text-slate-500 text-center py-8">Add structures to see required permits</p> : (
                      permits.map((permit, i) => (
                        <div key={i} className={`p-4 rounded-2xl border ${permit.required ? "bg-blue-50 border-blue-200" : "bg-slate-50 border-slate-200"}`}>
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-medium text-sm text-slate-900">{permit.permitType}</p>
                              <p className="text-xs text-slate-500 mt-0.5">{permit.authority}</p>
                            </div>
                            {permit.required && <span className="px-2 py-1 bg-blue-500 text-white text-[10px] font-bold rounded-full">REQUIRED</span>}
                          </div>
                          <div className="mt-3 flex gap-2 text-[10px]">
                            <span className="px-2 py-1 bg-slate-100 rounded-lg text-slate-600">{permit.estimatedFee}</span>
                            <span className="px-2 py-1 bg-slate-100 rounded-lg text-slate-600">{permit.timeline}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </>
                )}

                {activeTab === "utilities" && (
                  <div className="space-y-2">
                    {utilitySummary.map((line, i) => (
                      <div key={i} className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                        <p className="text-sm text-slate-700">{line}</p>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === "septic" && (
                  <div className={`p-4 rounded-2xl border ${septicSummary.status === "ok" ? "bg-emerald-50 border-emerald-200" : septicSummary.status === "review" ? "bg-amber-50 border-amber-200" : "bg-rose-50 border-rose-200"}`}>
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl">{septicSummary.status === "ok" ? "✅" : septicSummary.status === "review" ? "⚠️" : "❌"}</span>
                      <span className="font-semibold text-sm">{septicSummary.status === "ok" ? "Septic OK" : septicSummary.status === "review" ? "Review Needed" : "Issues Found"}</span>
                    </div>
                    <ul className="space-y-2">
                      {septicSummary.messages.map((msg, i) => (
                        <li key={i} className="text-xs text-slate-700 pl-4">• {msg}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {activeTab === "easements" && (
                  <>
                    {/* Wetlands Warning */}
                    {siteConstraints.wetlandsPresent && (
                      <div className="p-4 rounded-2xl border bg-teal-50 border-teal-300 mb-3">
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">🌿</span>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-sm text-teal-900">Wetland Detected</span>
                              <span className="text-xs px-2 py-0.5 bg-teal-500 text-white rounded-full font-bold">CRITICAL</span>
                            </div>
                            <p className="text-xs text-teal-700 mt-1">
                              This property contains or borders a regulated wetland area.
                            </p>
                            <div className="mt-2 pt-2 border-t border-teal-200">
                              <p className="text-[10px] font-medium text-teal-800 mb-1">Requirements:</p>
                              <ul className="space-y-0.5">
                                <li className="text-[10px] text-teal-700 pl-2">• 50-100' buffer zone required</li>
                                <li className="text-[10px] text-teal-700 pl-2">• No construction in wetland area</li>
                                <li className="text-[10px] text-teal-700 pl-2">• Critical Area Review required</li>
                                <li className="text-[10px] text-teal-700 pl-2">• Wetland delineation study may be needed</li>
                              </ul>
                            </div>
                            <p className="text-[10px] text-teal-600 mt-2 italic">
                              📋 Contact county for wetland boundary verification
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Driveway Info */}
                    {siteConstraints.hasDriveway && (
                      <div className="p-4 rounded-2xl border bg-gray-50 border-gray-200 mb-3">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-2xl">🚗</span>
                          <div>
                            <span className="font-semibold text-sm text-slate-900">Existing Driveway</span>
                            <p className="text-xs text-slate-500">
                              {siteConstraints.drivewayType?.charAt(0).toUpperCase()}{siteConstraints.drivewayType?.slice(1)} • {siteConstraints.drivewayWidth}' wide
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Easements List */}
                    {siteConstraints.easements.length === 0 ? (
                      <div className="p-4 rounded-2xl border bg-emerald-50 border-emerald-200">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">✅</span>
                          <div>
                            <span className="font-semibold text-sm text-emerald-900">No Recorded Easements</span>
                            <p className="text-xs text-emerald-700">No easements found on title</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {siteConstraints.easements.map((easement) => {
                          const typeColors: Record<string, { bg: string; border: string; icon: string }> = {
                            utility: { bg: "bg-amber-50", border: "border-amber-200", icon: "⚡" },
                            access: { bg: "bg-orange-50", border: "border-orange-200", icon: "🚶" },
                            drainage: { bg: "bg-cyan-50", border: "border-cyan-200", icon: "💧" },
                            conservation: { bg: "bg-green-50", border: "border-green-200", icon: "🌿" },
                            scenic: { bg: "bg-purple-50", border: "border-purple-200", icon: "🏞️" },
                          };
                          const colors = typeColors[easement.type] || typeColors.utility;
                          
                          return (
                            <div key={easement.id} className={`p-4 rounded-2xl border ${colors.bg} ${colors.border}`}>
                              <div className="flex items-start gap-3">
                                <span className="text-xl">{colors.icon}</span>
                                <div className="flex-1">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="font-semibold text-sm text-slate-900 capitalize">
                                      {easement.type} Easement
                                    </span>
                                    <span className="text-xs px-2 py-0.5 bg-white rounded-full text-slate-600 border">
                                      {easement.width}' wide
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-600 mb-2">
                                    <strong>Holder:</strong> {easement.holder}
                                  </p>
                                  <p className="text-xs text-slate-600 mb-2">
                                    <strong>Location:</strong> {easement.location.replace(/_/g, " ")}
                                  </p>
                                  {easement.recordedDocument && (
                                    <p className="text-[10px] text-slate-500 mb-2">
                                      📄 {easement.recordedDocument}
                                    </p>
                                  )}
                                  <div className="mt-2 pt-2 border-t border-slate-200">
                                    <p className="text-[10px] font-medium text-slate-700 mb-1">Restrictions:</p>
                                    <ul className="space-y-0.5">
                                      {easement.restrictions.map((r, i) => (
                                        <li key={i} className="text-[10px] text-slate-600 pl-2">• {r}</li>
                                      ))}
                                    </ul>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    
                    {/* Easement Warning */}
                    {siteConstraints.easements.length > 0 && (
                      <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200">
                        <p className="text-[10px] text-amber-800">
                          ⚠️ <strong>Important:</strong> Easement areas shown are approximate. Always verify exact boundaries with a title search and survey before construction.
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

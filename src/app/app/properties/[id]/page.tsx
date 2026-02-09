"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useProperties } from "../../../../contexts/PropertyContext";
import { PropertyRecord, LayerState, Structure } from "../../../../lib/types";
import { validateProject } from "../../../../lib/ruleEngine";
import PropertyMap from "../../../../components/PropertyMap";
import AiChatDrawer from "../../../../components/AiChatDrawer";
import Link from "next/link";

export default function PropertyDashboard() {
  const params = useParams();
  const router = useRouter();
  const { loadProperty, updateProperty } = useProperties();
  
  const [property, setProperty] = useState<PropertyRecord | null>(null);
  const [layers, setLayers] = useState<LayerState[]>([]);
  const [structures] = useState<Structure[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAiChat, setShowAiChat] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "feasibility" | "permits">("overview");
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  // Load property
  useEffect(() => {
    const id = params.id as string;
    if (id) {
      const prop = loadProperty(id);
      if (prop) {
        setProperty(prop);
        setLayers(prop.layers || []);
      } else {
        router.push("/app/properties");
      }
      setIsLoading(false);
    }
  }, [params.id, loadProperty, router]);

  const handleLayerToggle = useCallback((layerId: string) => {
    setLayers(prev => prev.map(l => 
      l.id === layerId ? { ...l, active: !l.active } : l
    ));
  }, []);

  const validationResult = property && structures.length > 0 
    ? validateProject(property, structures)
    : undefined;

  const handleSave = useCallback(() => {
    if (property) {
      updateProperty({ ...property, layers, updatedAt: new Date() });
    }
  }, [property, layers, updateProperty]);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-200 rounded-full animate-pulse" />
          <div className="absolute inset-0 w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-rose-100 to-orange-100 flex items-center justify-center">
            <span className="text-4xl">🏠</span>
          </div>
          <h2 className="text-2xl font-semibold text-slate-900 mb-2">Property not found</h2>
          <p className="text-slate-500 mb-6">This property may have been removed.</p>
          <Link href="/app/properties" className="btn-primary px-6 py-3">
            ← Back to properties
          </Link>
        </div>
      </div>
    );
  }

  // Calculate stats
  const feasibilityItems = property.feasibility?.items || [];
  const passCount = feasibilityItems.filter(i => i.status === "pass").length;
  const warnCount = feasibilityItems.filter(i => i.status === "warn").length;
  const failCount = feasibilityItems.filter(i => i.status === "fail").length;
  const progressPercent = Math.round((passCount / Math.max(feasibilityItems.length, 1)) * 100);

  return (
    <div className="h-full flex flex-col lg:flex-row overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
      {/* Map Section - Full width on mobile, left side on desktop */}
      <div className="h-[40vh] lg:h-full lg:flex-1 relative">
        <PropertyMap
          property={property}
          layers={layers}
          onLayerToggle={handleLayerToggle}
        />
        
        {/* Status Badge - Compact version on top */}
        <div className="absolute top-4 left-4 z-20 animate-in slide-in-from-top duration-500 pointer-events-auto">
          <div className="bg-white/90 backdrop-blur-xl rounded-xl shadow-lg border border-white/50 px-4 py-2.5 flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full animate-pulse ${
                property.feasibility?.overallStatus === "pass" ? "bg-emerald-500" :
                property.feasibility?.overallStatus === "warn" ? "bg-amber-500" :
                "bg-rose-500"
              }`} />
              <span className="text-sm font-semibold text-slate-900">
                {property.feasibility?.overallStatus === "pass" ? "Development Ready" :
                 property.feasibility?.overallStatus === "warn" ? "Needs Review" :
                 "Has Issues"}
              </span>
            </div>
            <div className="w-px h-4 bg-slate-200" />
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowEditModal(true);
              }}
              className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors pointer-events-auto cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Property
            </button>
          </div>
        </div>

        {/* Floating Action Buttons */}
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between z-10 animate-in slide-in-from-bottom duration-500 delay-200">
          <Link
            href={`/app/properties/${property.id}/visualizer`}
            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-lg shadow-blue-500/30 font-medium transition-all hover:scale-105 hover:shadow-xl"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6z" />
            </svg>
            <span>Design Your Site</span>
            <span className="ml-1 px-2 py-0.5 bg-white/20 rounded-full text-xs">NEW</span>
          </Link>
          
          <button
            onClick={() => setShowAiChat(true)}
            className="flex items-center gap-2 px-4 py-3 bg-white/90 backdrop-blur-xl hover:bg-white text-slate-700 rounded-xl shadow-lg border border-white/50 font-medium transition-all hover:scale-105"
          >
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <span className="text-white text-xs">✨</span>
            </div>
            <span>Ask AI</span>
          </button>
        </div>
      </div>

      {/* Info Panel - Bottom sheet on mobile, right side on desktop */}
      <div className="flex-1 lg:w-[420px] lg:flex-none overflow-y-auto bg-white border-t lg:border-t-0 lg:border-l border-slate-200">
        {/* Tabs */}
        <div className="sticky top-0 bg-white/80 backdrop-blur-xl z-10 border-b border-slate-100">
          <div className="flex p-2 gap-1">
            {[
              { id: "overview", label: "Overview", icon: "📊" },
              { id: "feasibility", label: "Feasibility", icon: "✓" },
              { id: "permits", label: "Permits", icon: "📋" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? "bg-slate-900 text-white shadow-lg"
                    : "text-slate-500 hover:bg-slate-100"
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="p-5 space-y-6">
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Progress Ring */}
              <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl p-6">
                <div className="flex items-center gap-6">
                  <div className="relative w-24 h-24">
                    <svg className="w-24 h-24 -rotate-90">
                      <circle
                        cx="48" cy="48" r="42"
                        fill="none"
                        stroke="#e2e8f0"
                        strokeWidth="8"
                      />
                      <circle
                        cx="48" cy="48" r="42"
                        fill="none"
                        stroke="url(#progressGradient)"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={`${progressPercent * 2.64} 264`}
                        className="transition-all duration-1000 ease-out"
                      />
                      <defs>
                        <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#3b82f6" />
                          <stop offset="100%" stopColor="#8b5cf6" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-bold text-slate-900">{progressPercent}%</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">Feasibility Score</h3>
                    <p className="text-sm text-slate-500 mt-1">
                      {passCount} passed · {warnCount} warnings · {failCount} issues
                    </p>
                    <div className="flex gap-1 mt-3">
                      {feasibilityItems.slice(0, 8).map((item, i) => (
                        <div
                          key={i}
                          className={`w-2 h-2 rounded-full ${
                            item.status === "pass" ? "bg-emerald-500" :
                            item.status === "warn" ? "bg-amber-500" :
                            item.status === "fail" ? "bg-rose-500" :
                            "bg-slate-300"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Insights */}
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <span>💡</span> Quick Insights
                </h3>
                <div className="space-y-2">
                  <InsightCard
                    icon="🏠"
                    title="ADU Potential"
                    description={property.areaSqft && property.areaSqft > 32670 
                      ? "Your lot qualifies for an ADU (min 0.75 acres)" 
                      : "Lot may be too small for ADU"}
                    status={property.areaSqft && property.areaSqft > 32670 ? "positive" : "warning"}
                  />
                  <InsightCard
                    icon="🌱"
                    title="Septic System"
                    description={property.feasibility?.items.find(i => i.id === "septic")?.summary || "Check soil suitability"}
                    status={property.feasibility?.items.find(i => i.id === "septic")?.status === "pass" ? "positive" : "warning"}
                  />
                  <InsightCard
                    icon="📏"
                    title="Buildable Area"
                    description={`~${Math.round((property.areaSqft || 0) * 0.15).toLocaleString()} sq ft after setbacks`}
                    status="info"
                  />
                </div>
              </div>

              {/* Cost Estimator */}
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-5 border border-emerald-100">
                <h3 className="text-sm font-semibold text-emerald-900 mb-3 flex items-center gap-2">
                  <span>💰</span> Development Cost Estimate
                </h3>
                <div className="space-y-3">
                  <CostRow label="Permits & Fees" low={3000} high={8000} />
                  <CostRow label="Site Work" low={15000} high={40000} />
                  <CostRow label="Septic System" low={15000} high={35000} />
                  <CostRow label="Utilities" low={5000} high={20000} />
                  <div className="pt-3 border-t border-emerald-200">
                    <CostRow label="Estimated Total" low={38000} high={103000} bold />
                  </div>
                </div>
                <p className="text-xs text-emerald-600 mt-3">
                  *Rough estimates only. Get professional quotes.
                </p>
              </div>

              {/* Navigation Cards */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { href: "zoning", label: "Zoning Rules", icon: "📋", color: "from-blue-500 to-indigo-500" },
                  { href: "utilities", label: "Utilities", icon: "🔌", color: "from-emerald-500 to-teal-500" },
                  { href: "environment", label: "Environment", icon: "🌿", color: "from-green-500 to-emerald-500" },
                  { href: "reports", label: "Reports", icon: "📄", color: "from-violet-500 to-purple-500" },
                ].map(({ href, label, icon, color }) => (
                  <Link
                    key={href}
                    href={`/app/properties/${property.id}/${href}`}
                    className="group p-4 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all"
                  >
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                      <span className="text-lg">{icon}</span>
                    </div>
                    <p className="font-medium text-slate-900">{label}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Feasibility Tab */}
          {activeTab === "feasibility" && (
            <div className="space-y-3 animate-in fade-in duration-300">
              {feasibilityItems.map((item) => (
                <div
                  key={item.id}
                  className={`rounded-2xl border transition-all ${
                    expandedItem === item.id 
                      ? "bg-white shadow-lg border-slate-200" 
                      : "bg-slate-50 border-transparent hover:bg-white hover:border-slate-200"
                  }`}
                >
                  <button
                    onClick={() => setExpandedItem(expandedItem === item.id ? null : item.id)}
                    className="w-full p-4 flex items-center gap-3 text-left"
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      item.status === "pass" ? "bg-emerald-100" :
                      item.status === "warn" ? "bg-amber-100" :
                      item.status === "fail" ? "bg-rose-100" :
                      "bg-slate-100"
                    }`}>
                      {item.status === "pass" && <span className="text-emerald-600 text-lg">✓</span>}
                      {item.status === "warn" && <span className="text-amber-600 text-lg">!</span>}
                      {item.status === "fail" && <span className="text-rose-600 text-lg">✕</span>}
                      {item.status === "unknown" && <span className="text-slate-400 text-lg">?</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900">{item.label}</p>
                      <p className="text-sm text-slate-500 truncate">{item.summary}</p>
                    </div>
                    <svg 
                      className={`w-5 h-5 text-slate-400 transition-transform ${expandedItem === item.id ? "rotate-180" : ""}`}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {expandedItem === item.id && (
                    <div className="px-4 pb-4 animate-in slide-in-from-top duration-200">
                      <div className="p-4 bg-slate-50 rounded-xl">
                        <p className="text-sm text-slate-600 leading-relaxed">{item.detail}</p>
                        {item.citations && item.citations.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-slate-200">
                            <p className="text-xs text-slate-400 mb-2">Sources</p>
                            <div className="flex flex-wrap gap-2">
                              {item.citations.map((cite, i) => (
                                <span key={i} className="px-2 py-1 bg-white rounded-lg text-xs text-slate-600 border border-slate-200">
                                  {cite.section || cite.source}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <button className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                        <span>Ask AI about this</span>
                        <span>→</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Permits Tab */}
          {activeTab === "permits" && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
                <p className="text-sm text-blue-800">
                  <strong>Estimated Timeline:</strong> 8-16 weeks for typical residential project
                </p>
              </div>
              
              <h3 className="text-sm font-semibold text-slate-900">Likely Required Permits</h3>
              
              <div className="space-y-3">
                <PermitCard
                  name="Building Permit"
                  agency="Snohomish County PDS"
                  cost="$2,000 - $5,000"
                  time="4-8 weeks"
                  required
                />
                <PermitCard
                  name="Septic Permit"
                  agency="Snohomish Health District"
                  cost="$800 - $1,500"
                  time="2-4 weeks"
                  required={!property.feasibility?.items.find(i => i.id === "septic")?.summary?.includes("sewer")}
                />
                <PermitCard
                  name="Grading Permit"
                  agency="Snohomish County PDS"
                  cost="$500 - $2,000"
                  time="2-4 weeks"
                />
                <PermitCard
                  name="Critical Areas Review"
                  agency="Snohomish County PDS"
                  cost="$1,000 - $3,000"
                  time="4-6 weeks"
                  required={property.feasibility?.items.some(i => i.category === "environment" && i.status === "warn")}
                />
              </div>
              
              <button className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2">
                <span>📋</span>
                <span>Generate Permit Checklist</span>
              </button>
            </div>
          )}

          {/* Data Sources Footer */}
          <div className="pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Data sources: {property.dataSources?.parcel?.source || "estimated"}</span>
              <span>Updated {new Date(property.updatedAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* AI Chat Drawer */}
      <AiChatDrawer
        property={property}
        validationResult={validationResult}
        isOpen={showAiChat}
        onClose={() => setShowAiChat(false)}
      />

      {/* Edit Property Modal */}
      {showEditModal && (
        <EditPropertyModal
          property={property}
          onSave={(updated) => {
            setProperty(updated);
            updateProperty(updated);
            setShowEditModal(false);
          }}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </div>
  );
}

// Helper Components
function InsightCard({ icon, title, description, status }: { 
  icon: string; 
  title: string; 
  description: string; 
  status: "positive" | "warning" | "info" 
}) {
  return (
    <div className={`p-4 rounded-xl border ${
      status === "positive" ? "bg-emerald-50 border-emerald-100" :
      status === "warning" ? "bg-amber-50 border-amber-100" :
      "bg-slate-50 border-slate-100"
    }`}>
      <div className="flex items-start gap-3">
        <span className="text-xl">{icon}</span>
        <div>
          <p className={`font-medium ${
            status === "positive" ? "text-emerald-900" :
            status === "warning" ? "text-amber-900" :
            "text-slate-900"
          }`}>{title}</p>
          <p className={`text-sm mt-0.5 ${
            status === "positive" ? "text-emerald-700" :
            status === "warning" ? "text-amber-700" :
            "text-slate-600"
          }`}>{description}</p>
        </div>
      </div>
    </div>
  );
}

function CostRow({ label, low, high, bold }: { label: string; low: number; high: number; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={`text-sm ${bold ? "font-semibold text-emerald-900" : "text-emerald-700"}`}>{label}</span>
      <span className={`text-sm ${bold ? "font-semibold text-emerald-900" : "text-emerald-700"}`}>
        ${low.toLocaleString()} - ${high.toLocaleString()}
      </span>
    </div>
  );
}

function PermitCard({ name, agency, cost, time, required }: {
  name: string;
  agency: string;
  cost: string;
  time: string;
  required?: boolean;
}) {
  return (
    <div className={`p-4 rounded-xl border ${required ? "bg-white border-slate-200" : "bg-slate-50 border-transparent"}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-slate-900 flex items-center gap-2">
            {name}
            {required && (
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">Required</span>
            )}
          </p>
          <p className="text-sm text-slate-500 mt-0.5">{agency}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-slate-900">{cost}</p>
          <p className="text-xs text-slate-500">{time}</p>
        </div>
      </div>
    </div>
  );
}

// Edit Property Modal
function EditPropertyModal({ 
  property, 
  onSave, 
  onClose 
}: { 
  property: PropertyRecord; 
  onSave: (p: PropertyRecord) => void; 
  onClose: () => void;
}) {
  const [lotSize, setLotSize] = useState<string>(
    property.areaSqft ? (property.areaSqft / 43560).toFixed(2) : "1"
  );
  const [lotWidth, setLotWidth] = useState<string>(
    property.lotWidth?.toString() || "200"
  );
  const [lotDepth, setLotDepth] = useState<string>(
    property.lotDepth?.toString() || "200"
  );
  const [zoneCode, setZoneCode] = useState<string>(
    property.zoningDistrict?.code || "R-5"
  );
  
  const handleSave = () => {
    const acres = parseFloat(lotSize) || 1;
    const sqft = Math.round(acres * 43560);
    const width = parseFloat(lotWidth) || 200;
    const depth = parseFloat(lotDepth) || 200;
    
    // Generate new geometry based on lot dimensions
    const lat = property.centroid.lat;
    const lng = property.centroid.lng;
    const latPerFt = 1 / 364000;
    const lngPerFt = 1 / (364000 * Math.cos(lat * Math.PI / 180));
    const halfWidth = (width / 2) * lngPerFt;
    const halfDepth = (depth / 2) * latPerFt;
    
    const newGeometry: GeoJSON.Polygon = {
      type: "Polygon",
      coordinates: [[
        [lng - halfWidth, lat - halfDepth],
        [lng + halfWidth, lat - halfDepth],
        [lng + halfWidth, lat + halfDepth],
        [lng - halfWidth, lat + halfDepth],
        [lng - halfWidth, lat - halfDepth],
      ]]
    };
    
    const updated: PropertyRecord = {
      ...property,
      areaSqft: sqft,
      lotWidth: width,
      lotDepth: depth,
      parcelGeometry: newGeometry,
      zoningDistrict: {
        id: property.zoningDistrict?.id || "zone-default",
        jurisdictionId: property.zoningDistrict?.jurisdictionId || "default",
        category: property.zoningDistrict?.category || "residential_single" as const,
        ...property.zoningDistrict,
        code: zoneCode,
        name: zoneCode,
      },
      updatedAt: new Date(),
    };
    
    onSave(updated);
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95 duration-300">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900">Edit Property</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors"
          >
            <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="space-y-4">
          {/* Lot Size */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Lot Size (acres)
            </label>
            <input
              type="number"
              step="0.01"
              value={lotSize}
              onChange={(e) => setLotSize(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-lg font-medium"
              placeholder="5.00"
            />
            <p className="text-xs text-slate-500 mt-1">
              = {Math.round((parseFloat(lotSize) || 0) * 43560).toLocaleString()} sq ft
            </p>
          </div>
          
          {/* Lot Dimensions */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Width (ft)
              </label>
              <input
                type="number"
                value={lotWidth}
                onChange={(e) => setLotWidth(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                placeholder="330"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Depth (ft)
              </label>
              <input
                type="number"
                value={lotDepth}
                onChange={(e) => setLotDepth(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                placeholder="660"
              />
            </div>
          </div>
          
          {/* Zoning */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Zoning Code
            </label>
            <select
              value={zoneCode}
              onChange={(e) => setZoneCode(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
            >
              <option value="R-5">R-5 (Rural 5 acre)</option>
              <option value="R-10">R-10 (Rural 10 acre)</option>
              <option value="R-20">R-20 (Rural 20 acre)</option>
              <option value="RA-5">RA-5 (Rural Agriculture)</option>
              <option value="A-10">A-10 (Agriculture)</option>
              <option value="RU-HI">RU-HI (Rural High Intensity)</option>
              <option value="SR-7200">SR-7200 (Suburban Residential)</option>
              <option value="LR">LR (Low Density Residential)</option>
            </select>
          </div>
          
          {/* Tip */}
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <p className="text-sm text-blue-800">
              <strong>💡 Tip:</strong> For a 5-acre lot, typical dimensions might be 
              330' × 660' or 466' × 466' (square).
            </p>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

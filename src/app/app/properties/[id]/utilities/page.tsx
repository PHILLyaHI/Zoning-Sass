"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useProperties } from "../../../../../contexts/PropertyContext";
import { assessWastewater, WastewaterAssessment } from "../../../../../lib/wastewaterEngine";
import Card from "../../../../../components/Card";

export default function UtilitiesPage() {
  const params = useParams();
  const router = useRouter();
  const { loadProperty } = useProperties();
  const [assessment, setAssessment] = useState<WastewaterAssessment | null>(null);
  const [activeTab, setActiveTab] = useState<"wastewater" | "water" | "power" | "gas">("wastewater");

  useEffect(() => {
    const id = params.id as string;
    const property = loadProperty(id);
    if (!property) {
      router.push("/app/properties");
      return;
    }
    
    // Run wastewater assessment
    const result = assessWastewater(property);
    setAssessment(result);
  }, [params.id, loadProperty, router]);

  if (!assessment) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "text-rose-600 bg-rose-50 border-rose-200";
      case "major": return "text-amber-600 bg-amber-50 border-amber-200";
      case "minor": return "text-blue-600 bg-blue-50 border-blue-200";
      default: return "text-slate-600 bg-slate-50 border-slate-200";
    }
  };

  const getFeasibilityBadge = (feasibility: string) => {
    switch (feasibility) {
      case "feasible": return { color: "bg-emerald-100 text-emerald-700", label: "Feasible" };
      case "conditional": return { color: "bg-amber-100 text-amber-700", label: "Conditional" };
      case "challenging": return { color: "bg-orange-100 text-orange-700", label: "Challenging" };
      case "not_feasible": return { color: "bg-rose-100 text-rose-700", label: "Not Feasible" };
      default: return { color: "bg-slate-100 text-slate-700", label: "Unknown" };
    }
  };

  const badge = getFeasibilityBadge(assessment.septicFeasibility);

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link 
          href={`/app/properties/${params.id}`}
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-4 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to property
        </Link>
        <h1 className="text-2xl lg:text-3xl font-semibold text-slate-900">Utilities & Services</h1>
        <p className="text-slate-500 mt-2">Wastewater, water, power, and gas availability analysis.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {[
          { id: "wastewater", label: "Wastewater", icon: "💧" },
          { id: "water", label: "Water", icon: "🚰" },
          { id: "power", label: "Power", icon: "⚡" },
          { id: "gas", label: "Gas", icon: "🔥" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? "bg-slate-900 text-white shadow-lg"
                : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Wastewater Content */}
      {activeTab === "wastewater" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Summary Card */}
          <Card className="!p-0 overflow-hidden">
            <div className={`px-6 py-4 ${assessment.sewerAvailable ? "bg-blue-50" : "bg-amber-50"}`}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    {assessment.sewerAvailable ? "Sewer Service Available" : "On-Site Septic Required"}
                  </h2>
                  <p className="text-sm text-slate-600 mt-1">
                    {assessment.sewerAvailable
                      ? `Connection to ${assessment.sewerService?.providerName} is ${assessment.sewerRequired ? "required" : "available"}.`
                      : "Property is outside sewer service area."}
                  </p>
                </div>
                <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${badge.color}`}>
                  {badge.label}
                </span>
              </div>
            </div>
            
            {/* Cost Estimate */}
            <div className="px-6 py-4 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Estimated Cost Range</span>
                <span className="text-lg font-semibold text-slate-900">
                  ${assessment.estimatedCost.min.toLocaleString()} – ${assessment.estimatedCost.max.toLocaleString()}
                </span>
              </div>
            </div>
          </Card>

          {/* Soil Analysis */}
          {assessment.soilData && (
            <Card>
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <span className="text-lg">🌍</span>
                Soil Analysis
              </h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-xs text-slate-500 mb-1">Soil Type</p>
                  <p className="font-medium text-slate-900">{assessment.soilData.musym}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{assessment.soilData.muname}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-xs text-slate-500 mb-1">Septic Suitability</p>
                  <p className={`font-medium ${
                    assessment.soilData.septicSuitability === "well_suited" ? "text-emerald-600" :
                    assessment.soilData.septicSuitability === "somewhat_limited" ? "text-amber-600" :
                    "text-rose-600"
                  }`}>
                    {assessment.soilData.septicSuitability.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-xs text-slate-500 mb-1">Water Table Depth</p>
                  <p className="font-medium text-slate-900">{assessment.soilData.depthToWaterTableMin}" min</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-xs text-slate-500 mb-1">Slope Range</p>
                  <p className="font-medium text-slate-900">{assessment.soilData.slopeLow}% – {assessment.soilData.slopeHigh}%</p>
                </div>
              </div>
              
              {assessment.soilData.septicLimitations.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {assessment.soilData.septicLimitations.map((limitation, i) => (
                    <span key={i} className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-lg">
                      {limitation}
                    </span>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* Issues */}
          {assessment.issues.length > 0 && (
            <Card>
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <span className="text-lg">⚠️</span>
                Issues & Considerations
              </h3>
              <div className="space-y-3">
                {assessment.issues.map((issue) => (
                  <div 
                    key={issue.id}
                    className={`p-4 rounded-xl border ${getSeverityColor(issue.severity)}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <h4 className="font-medium">{issue.title}</h4>
                        <p className="text-sm mt-1 opacity-80">{issue.description}</p>
                        {issue.mitigation && (
                          <p className="text-sm mt-2 flex items-start gap-1">
                            <span className="shrink-0">💡</span>
                            <span>{issue.mitigation}</span>
                          </p>
                        )}
                      </div>
                      <span className="text-xs uppercase font-medium opacity-60 shrink-0">
                        {issue.severity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* System Options */}
          {assessment.systemTypes.length > 0 && (
            <Card>
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <span className="text-lg">🔧</span>
                System Options
              </h3>
              <div className="space-y-3">
                {assessment.systemTypes.map((system) => (
                  <div 
                    key={system.code}
                    className={`p-4 rounded-xl border transition-all ${
                      system.suitability === "recommended"
                        ? "border-emerald-200 bg-emerald-50/50"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-slate-900">{system.name}</h4>
                          {system.suitability === "recommended" && (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded-full font-medium">
                              Recommended
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-500 mt-1">{system.description}</p>
                        <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                          <span>Area: {system.areaRequired.toLocaleString()} sqft</span>
                          <span>Maintenance: {system.maintenanceLevel}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-medium text-slate-900">
                          ${system.costRange.min.toLocaleString()} – ${system.costRange.max.toLocaleString()}
                        </p>
                        <p className="text-xs text-slate-400">installed</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Setbacks */}
          <Card>
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <span className="text-lg">📏</span>
              Required Setbacks
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-2 font-medium text-slate-500">From</th>
                    <th className="text-center py-2 font-medium text-slate-500">Tank</th>
                    <th className="text-center py-2 font-medium text-slate-500">Drainfield</th>
                  </tr>
                </thead>
                <tbody>
                  {assessment.requiredSetbacks.reduce((acc, setback) => {
                    const existing = acc.find(r => r.from === setback.from);
                    if (existing) {
                      if (setback.type === "tank") existing.tank = setback.distance;
                      if (setback.type === "drainfield") existing.drainfield = setback.distance;
                      if (setback.type === "both") {
                        existing.tank = setback.distance;
                        existing.drainfield = setback.distance;
                      }
                    } else {
                      acc.push({
                        from: setback.from,
                        tank: setback.type === "tank" || setback.type === "both" ? setback.distance : undefined,
                        drainfield: setback.type === "drainfield" || setback.type === "both" ? setback.distance : undefined,
                      });
                    }
                    return acc;
                  }, [] as { from: string; tank?: number; drainfield?: number }[]).map((row, i) => (
                    <tr key={i} className="border-b border-slate-100">
                      <td className="py-2.5 text-slate-700">{row.from}</td>
                      <td className="py-2.5 text-center text-slate-900">{row.tank ? `${row.tank}'` : "—"}</td>
                      <td className="py-2.5 text-center text-slate-900">{row.drainfield ? `${row.drainfield}'` : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Recommendations & Permits */}
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <span className="text-lg">✅</span>
                Recommendations
              </h3>
              <ul className="space-y-2">
                {assessment.recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                    <span className="text-emerald-500 mt-0.5">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </Card>

            <Card>
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <span className="text-lg">📋</span>
                Permit Requirements
              </h3>
              <ul className="space-y-2">
                {assessment.permitRequirements.map((permit, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                    <span className="text-blue-500 mt-0.5">•</span>
                    <span>{permit}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          {/* Citations */}
          <Card>
            <h3 className="font-semibold text-slate-900 mb-3 text-sm">Sources</h3>
            <div className="flex flex-wrap gap-2">
              {assessment.citations.map((citation, i) => (
                <span key={i} className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-lg">
                  {citation.source}{citation.section && ` § ${citation.section}`}
                </span>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Other Tabs Placeholder */}
      {activeTab !== "wastewater" && (
        <Card className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 flex items-center justify-center text-2xl">
            {activeTab === "water" && "🚰"}
            {activeTab === "power" && "⚡"}
            {activeTab === "gas" && "🔥"}
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Service Analysis
          </h3>
          <p className="text-slate-500 max-w-sm mx-auto">
            Detailed {activeTab} service analysis coming soon. This will include provider information, availability, and connection requirements.
          </p>
        </Card>
      )}
    </div>
  );
}

"use client";

type DataSourceBadgeProps = {
  dataSources?: {
    parcel: { source: string; confidence: "high" | "medium" | "low" };
    zoning: { source: string; confidence: "high" | "medium" | "low" };
    soil?: { source: string; confidence: "high" | "medium" | "low" };
  };
};

export default function DataSourceBadge({ dataSources }: DataSourceBadgeProps) {
  if (!dataSources) return null;

  const getConfidenceColor = (confidence: "high" | "medium" | "low") => {
    switch (confidence) {
      case "high": return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "medium": return "bg-amber-100 text-amber-700 border-amber-200";
      case "low": return "bg-rose-100 text-rose-700 border-rose-200";
    }
  };

  const getConfidenceIcon = (confidence: "high" | "medium" | "low") => {
    switch (confidence) {
      case "high": return "✓";
      case "medium": return "~";
      case "low": return "?";
    }
  };

  const formatSource = (source: string): string => {
    const names: Record<string, string> = {
      "snohomish_gis": "Snohomish County GIS",
      "county_gis_53061": "Snohomish County GIS",
      "usda_nrcs": "USDA Soil Survey",
      "openstreetmap": "OpenStreetMap",
      "mapbox": "Mapbox",
      "estimated": "Estimated",
      "fallback": "Estimated",
      "mock": "Demo Data",
    };
    return names[source] || source;
  };

  const sources = [
    { label: "Parcel", ...dataSources.parcel },
    { label: "Zoning", ...dataSources.zoning },
    ...(dataSources.soil ? [{ label: "Soil", ...dataSources.soil }] : []),
  ];

  // Calculate overall confidence
  const confidences = sources.map(s => s.confidence);
  const overallConfidence = confidences.includes("low") ? "low" 
    : confidences.includes("medium") ? "medium" 
    : "high";

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Data Sources
        </h4>
        <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getConfidenceColor(overallConfidence)}`}>
          {overallConfidence === "high" ? "Verified" : overallConfidence === "medium" ? "Partial" : "Estimated"}
        </span>
      </div>

      {/* Source list */}
      <div className="space-y-2">
        {sources.map((source) => (
          <div key={source.label} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className={`w-5 h-5 flex items-center justify-center rounded text-xs font-bold ${getConfidenceColor(source.confidence)}`}>
                {getConfidenceIcon(source.confidence)}
              </span>
              <span className="text-slate-600 dark:text-slate-400">{source.label}</span>
            </div>
            <span className="text-slate-500 dark:text-slate-500 text-xs">
              {formatSource(source.source)}
            </span>
          </div>
        ))}
      </div>

      {/* Warning for low confidence */}
      {overallConfidence === "low" && (
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            ⚠️ Using estimated data. Verify with county records for accuracy.
          </p>
        </div>
      )}

      {/* Tip for real data */}
      {dataSources.parcel.source === "estimated" && (
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <p className="text-xs text-blue-600 dark:text-blue-400">
            💡 Add MAPBOX_ACCESS_TOKEN for real parcel boundaries
          </p>
        </div>
      )}
    </div>
  );
}




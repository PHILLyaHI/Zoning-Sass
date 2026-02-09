"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getStateCoverage,
  getCountiesForState,
  getCoverageStats,
  COVERAGE_LEVEL_LABELS,
  COVERAGE_LEVEL_COLORS,
  COVERAGE_LEVEL_DESCRIPTIONS,
  CoverageLevel,
  JurisdictionEntry,
} from "../../lib/coverageData";
import { submitCoverageRequest } from "../../lib/jurisdictionService";

// ============================================
// SVG State Path Data (simplified outlines)
// ============================================

const STATE_POSITIONS: Record<string, { x: number; y: number; w: number; h: number }> = {
  WA: { x: 62, y: 22, w: 48, h: 30 }, OR: { x: 58, y: 52, w: 50, h: 32 },
  CA: { x: 42, y: 80, w: 38, h: 72 }, NV: { x: 82, y: 72, w: 34, h: 50 },
  ID: { x: 112, y: 32, w: 30, h: 54 }, MT: { x: 140, y: 20, w: 60, h: 36 },
  WY: { x: 146, y: 58, w: 48, h: 32 }, UT: { x: 110, y: 86, w: 32, h: 42 },
  CO: { x: 150, y: 100, w: 48, h: 32 }, AZ: { x: 98, y: 130, w: 40, h: 46 },
  NM: { x: 142, y: 136, w: 42, h: 44 }, ND: { x: 206, y: 22, w: 48, h: 28 },
  SD: { x: 206, y: 52, w: 48, h: 28 }, NE: { x: 204, y: 82, w: 52, h: 24 },
  KS: { x: 210, y: 108, w: 48, h: 24 }, OK: { x: 210, y: 134, w: 52, h: 26 },
  TX: { x: 198, y: 158, w: 62, h: 64 }, MN: { x: 258, y: 22, w: 40, h: 42 },
  IA: { x: 262, y: 68, w: 38, h: 28 }, MO: { x: 272, y: 100, w: 38, h: 36 },
  AR: { x: 274, y: 138, w: 34, h: 28 }, LA: { x: 278, y: 168, w: 34, h: 32 },
  WI: { x: 300, y: 26, w: 34, h: 38 }, IL: { x: 306, y: 68, w: 28, h: 50 },
  MI: { x: 330, y: 30, w: 36, h: 46 }, IN: { x: 334, y: 72, w: 24, h: 42 },
  OH: { x: 358, y: 68, w: 28, h: 36 }, KY: { x: 348, y: 110, w: 42, h: 22 },
  TN: { x: 330, y: 132, w: 54, h: 18 }, MS: { x: 306, y: 150, w: 24, h: 38 },
  AL: { x: 332, y: 148, w: 24, h: 38 }, GA: { x: 360, y: 144, w: 30, h: 36 },
  FL: { x: 370, y: 178, w: 34, h: 40 }, SC: { x: 382, y: 138, w: 28, h: 22 },
  NC: { x: 370, y: 118, w: 44, h: 20 }, VA: { x: 374, y: 98, w: 40, h: 22 },
  WV: { x: 370, y: 86, w: 22, h: 22 }, PA: { x: 380, y: 60, w: 38, h: 22 },
  NY: { x: 392, y: 32, w: 38, h: 30 }, NJ: { x: 418, y: 66, w: 12, h: 22 },
  CT: { x: 424, y: 54, w: 12, h: 10 }, RI: { x: 434, y: 56, w: 8, h: 10 },
  MA: { x: 424, y: 44, w: 18, h: 10 }, VT: { x: 416, y: 22, w: 12, h: 22 },
  NH: { x: 428, y: 22, w: 10, h: 24 }, ME: { x: 436, y: 10, w: 18, h: 34 },
  MD: { x: 394, y: 86, w: 20, h: 12 }, DE: { x: 416, y: 82, w: 8, h: 14 },
  DC: { x: 400, y: 92, w: 6, h: 6 }, AK: { x: 20, y: 178, w: 48, h: 32 },
  HI: { x: 120, y: 198, w: 28, h: 16 },
};

// ============================================
// MAIN PAGE
// ============================================

export default function CoveragePage() {
  const router = useRouter();
  const states = useMemo(() => getStateCoverage(), []);
  const stats = useMemo(() => getCoverageStats(), []);

  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [hoveredState, setHoveredState] = useState<string | null>(null);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestAddress, setRequestAddress] = useState("");
  const [requestUse, setRequestUse] = useState("buying");
  const [requestEmail, setRequestEmail] = useState("");
  const [requestSubmitted, setRequestSubmitted] = useState(false);

  const selectedJurisdiction = useMemo(
    () => (selectedState ? states.find((s) => s.id === selectedState) : null),
    [selectedState, states]
  );
  const selectedCounties = useMemo(
    () => (selectedState ? getCountiesForState(selectedState) : []),
    [selectedState]
  );
  const hoveredJurisdiction = useMemo(
    () => (hoveredState ? states.find((s) => s.id === hoveredState) : null),
    [hoveredState, states]
  );

  const handleRequestSubmit = () => {
    submitCoverageRequest(requestAddress, requestUse, requestEmail, selectedState || undefined);
    setRequestSubmitted(true);
    setTimeout(() => {
      setShowRequestForm(false);
      setRequestSubmitted(false);
      setRequestAddress("");
      setRequestEmail("");
    }, 3000);
  };

  const openRequestForState = (stateName: string) => {
    setRequestAddress(stateName);
    setShowRequestForm(true);
  };

  return (
    <div className="min-h-screen bg-[#F7F9FC]">
      {/* Header */}
      <div className="bg-white border-b border-[#e8e8ed]">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-[18px] font-semibold text-[#1d1d1f] tracking-tight">
              Property Risk Snapshot<span className="text-[10px] align-super ml-0.5 text-[#86868b]">TM</span>
            </Link>
            <span className="text-[#d2d2d7]">/</span>
            <h1 className="text-[18px] font-semibold text-[#1d1d1f]">Coverage Map</h1>
          </div>
          <Link
            href="/pricing"
            className="px-4 py-2 bg-[#0071e3] text-white rounded-full text-[13px] font-medium hover:bg-[#0077ed] transition-colors"
          >
            Get Credits
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Title + Stats */}
        <div className="text-center mb-10">
          <h2 className="text-[36px] font-light tracking-tight text-[#1d1d1f] mb-3">
            Nationwide Coverage
          </h2>
          <p className="text-[17px] text-[#86868b] font-light mb-8">
            We&apos;re expanding across the U.S. Click any state to see available data.
          </p>
          <div className="flex items-center justify-center gap-6 flex-wrap">
            {([4, 3, 2, 1, 0] as CoverageLevel[]).map((level) => {
              const count = states.filter((s) => s.coverageLevel === level).length;
              return (
                <div key={level} className="flex items-center gap-2 text-[13px]">
                  <span
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: COVERAGE_LEVEL_COLORS[level] }}
                  />
                  <span className="text-[#6e6e73]">
                    {COVERAGE_LEVEL_LABELS[level]} ({count})
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
          {/* MAP */}
          <div className="bg-white rounded-[20px] shadow-[0_8px_24px_rgba(0,0,0,0.04)] border border-[#f0f0f2] p-6 relative">
            {/* Tooltip */}
            {hoveredJurisdiction && !selectedState && (
              <div className="absolute top-4 left-4 bg-white rounded-xl shadow-lg border border-[#e8e8ed] px-4 py-3 z-10 pointer-events-none">
                <div className="text-[14px] font-semibold text-[#1d1d1f]">{hoveredJurisdiction.name}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className="w-2.5 h-2.5 rounded"
                    style={{ backgroundColor: COVERAGE_LEVEL_COLORS[hoveredJurisdiction.coverageLevel] }}
                  />
                  <span className="text-[12px] text-[#6e6e73]">
                    {COVERAGE_LEVEL_LABELS[hoveredJurisdiction.coverageLevel]}
                  </span>
                </div>
              </div>
            )}

            <svg viewBox="0 0 460 230" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
              {states.map((state) => {
                const pos = STATE_POSITIONS[state.id];
                if (!pos) return null;
                const isHovered = hoveredState === state.id;
                const isSelected = selectedState === state.id;

                return (
                  <g key={state.id}>
                    <rect
                      x={pos.x}
                      y={pos.y}
                      width={pos.w}
                      height={pos.h}
                      rx={3}
                      fill={COVERAGE_LEVEL_COLORS[state.coverageLevel]}
                      stroke={isSelected ? "#1d1d1f" : isHovered ? "#0071e3" : "white"}
                      strokeWidth={isSelected ? 2 : isHovered ? 1.5 : 0.5}
                      className="cursor-pointer transition-all duration-150"
                      opacity={isHovered ? 0.9 : 0.85}
                      onMouseEnter={() => setHoveredState(state.id)}
                      onMouseLeave={() => setHoveredState(null)}
                      onClick={() => setSelectedState(state.id === selectedState ? null : state.id)}
                    />
                    <text
                      x={pos.x + pos.w / 2}
                      y={pos.y + pos.h / 2 + 1}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize={pos.w < 15 ? 5 : 8}
                      fill="white"
                      fontWeight="600"
                      className="pointer-events-none select-none"
                      style={{ textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}
                    >
                      {state.id}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Stats bar */}
            <div className="mt-4 flex items-center justify-between text-[12px] text-[#86868b] border-t border-[#f5f5f7] pt-4">
              <span>{stats.total} states tracked</span>
              <span>{stats.totalCounties} counties with detailed data</span>
              <span>{stats.level3 + stats.level4} states with buildability analysis</span>
            </div>
          </div>

          {/* SIDE PANEL */}
          <div className="space-y-4">
            {selectedJurisdiction ? (
              <>
                {/* Jurisdiction Detail */}
                <div className="bg-white rounded-[20px] shadow-[0_8px_24px_rgba(0,0,0,0.04)] border border-[#f0f0f2] p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[20px] font-semibold text-[#1d1d1f]">
                      {selectedJurisdiction.name}
                    </h3>
                    <button
                      onClick={() => setSelectedState(null)}
                      className="w-8 h-8 rounded-full bg-[#f5f5f7] hover:bg-[#e8e8ed] grid place-items-center transition-colors"
                    >
                      <svg className="w-4 h-4 text-[#86868b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* Coverage Level Badge */}
                  <div className="flex items-center gap-3 mb-5">
                    <span
                      className="px-3 py-1.5 rounded-full text-white text-[12px] font-bold"
                      style={{ backgroundColor: COVERAGE_LEVEL_COLORS[selectedJurisdiction.coverageLevel] }}
                    >
                      Level {selectedJurisdiction.coverageLevel}
                    </span>
                    <span className="text-[14px] text-[#6e6e73]">
                      {COVERAGE_LEVEL_LABELS[selectedJurisdiction.coverageLevel]}
                    </span>
                  </div>

                  <p className="text-[13px] text-[#6e6e73] leading-relaxed mb-5">
                    {COVERAGE_LEVEL_DESCRIPTIONS[selectedJurisdiction.coverageLevel]}
                  </p>

                  {/* What's Included */}
                  <div className="mb-4">
                    <div className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wider mb-2">
                      Included
                    </div>
                    <div className="space-y-1.5">
                      {[
                        { label: "Parcel Data", on: selectedJurisdiction.hasParcels },
                        { label: "Zoning Polygons", on: selectedJurisdiction.hasZoningPolygons },
                        { label: "Structured Rules", on: selectedJurisdiction.hasRulesStructured },
                        { label: "Environmental Layers", on: selectedJurisdiction.hasEnvironmentalLayers },
                        { label: "Utility Service Areas", on: selectedJurisdiction.hasUtilityServiceAreas },
                        { label: "Septic Rules", on: selectedJurisdiction.hasSepticRules },
                      ].map((f) => (
                        <div key={f.label} className="flex items-center gap-2 text-[13px]">
                          {f.on ? (
                            <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4 text-[#d2d2d7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          )}
                          <span className={f.on ? "text-[#1d1d1f]" : "text-[#c7c7cc]"}>{f.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Last Updated */}
                  <div className="text-[11px] text-[#c7c7cc] mb-5">
                    Last updated: {selectedJurisdiction.lastUpdated}
                  </div>

                  {/* CTAs */}
                  {selectedJurisdiction.coverageLevel >= 2 ? (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder={`Enter address in ${selectedJurisdiction.name}...`}
                          className="flex-1 px-4 py-3 bg-[#f5f5f7] rounded-xl text-[13px] outline-none focus:ring-2 focus:ring-[#0071e3]/30 border border-transparent focus:border-[#0071e3]/30"
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && (e.target as HTMLInputElement).value.trim()) {
                              router.push(`/snapshot/${encodeURIComponent((e.target as HTMLInputElement).value.trim())}`);
                            }
                          }}
                        />
                      </div>
                      <button
                        onClick={() => {
                          const input = document.querySelector<HTMLInputElement>('input[placeholder*="Enter address"]');
                          if (input?.value.trim()) {
                            router.push(`/snapshot/${encodeURIComponent(input.value.trim())}`);
                          } else {
                            router.push("/");
                          }
                        }}
                        className="w-full py-3 bg-[#0071e3] text-white rounded-full text-[14px] font-semibold hover:bg-[#0077ed] transition-colors active:scale-[0.97]"
                      >
                        Run a Risk Snapshot
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => openRequestForState(selectedJurisdiction.name)}
                      className="w-full py-3 bg-[#1d1d1f] text-white rounded-full text-[14px] font-semibold hover:bg-[#333] transition-colors active:scale-[0.97]"
                    >
                      Request Coverage for {selectedJurisdiction.name}
                    </button>
                  )}
                </div>

                {/* Counties */}
                {selectedCounties.length > 0 && (
                  <div className="bg-white rounded-[20px] shadow-[0_8px_24px_rgba(0,0,0,0.04)] border border-[#f0f0f2] p-6">
                    <h4 className="text-[15px] font-semibold text-[#1d1d1f] mb-3">
                      Counties ({selectedCounties.length})
                    </h4>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {selectedCounties
                        .sort((a, b) => b.coverageLevel - a.coverageLevel)
                        .map((county) => (
                          <div
                            key={county.id}
                            className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-[#f5f5f7] transition-colors cursor-pointer group"
                            onClick={() => {
                              if (county.coverageLevel >= 2) {
                                const addr = `${county.county || county.name}, ${county.state}`;
                                router.push(`/snapshot/${encodeURIComponent(addr)}`);
                              } else {
                                setShowRequestForm(true);
                              }
                            }}
                          >
                            <div>
                              <div className="text-[13px] font-medium text-[#1d1d1f] group-hover:text-[#0071e3] transition-colors">{county.name}</div>
                              <div className="text-[11px] text-[#86868b]">
                                {county.population?.toLocaleString()} pop. &bull; {COVERAGE_LEVEL_LABELS[county.coverageLevel]}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span
                                className="px-2.5 py-1 rounded-full text-white text-[10px] font-bold"
                                style={{ backgroundColor: COVERAGE_LEVEL_COLORS[county.coverageLevel] }}
                              >
                                L{county.coverageLevel}
                              </span>
                              <svg className="w-4 h-4 text-[#c7c7cc] group-hover:text-[#0071e3] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* Default Panel */
              <div className="bg-white rounded-[20px] shadow-[0_8px_24px_rgba(0,0,0,0.04)] border border-[#f0f0f2] p-6">
                <h3 className="text-[17px] font-semibold text-[#1d1d1f] mb-3">
                  Select a State
                </h3>
                <p className="text-[13px] text-[#86868b] leading-relaxed mb-6">
                  Click any state on the map to see what data is available and what level of
                  Risk Snapshot is supported.
                </p>

                <div className="space-y-3">
                  {/* Quick stats */}
                  <div className="bg-[#f5f5f7] rounded-xl p-4">
                    <div className="text-[28px] font-bold text-[#1d1d1f]">{stats.level3 + stats.level4}</div>
                    <div className="text-[13px] text-[#86868b]">States with buildability analysis</div>
                  </div>
                  <div className="bg-[#f5f5f7] rounded-xl p-4">
                    <div className="text-[28px] font-bold text-[#1d1d1f]">{stats.totalCounties}</div>
                    <div className="text-[13px] text-[#86868b]">Counties with detailed data</div>
                  </div>
                  <div className="bg-[#f5f5f7] rounded-xl p-4">
                    <div className="text-[28px] font-bold text-[#1d1d1f]">{stats.total - stats.level0}</div>
                    <div className="text-[13px] text-[#86868b]">States with some coverage</div>
                  </div>
                </div>

                <p className="text-[11px] text-[#c7c7cc] mt-5 text-center">
                  Coverage expands weekly. Request your area to help prioritize.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Request Coverage Modal */}
        {showRequestForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowRequestForm(false)} />
            <div className="relative bg-white rounded-[24px] shadow-lg max-w-md w-full p-8">
              {requestSubmitted ? (
                <div className="text-center py-6">
                  <div className="w-14 h-14 rounded-full bg-emerald-50 mx-auto mb-4 grid place-items-center">
                    <svg className="w-7 h-7 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-[20px] font-semibold text-[#1d1d1f] mb-2">Request Submitted</h3>
                  <p className="text-[14px] text-[#86868b]">
                    We&apos;ll prioritize coverage based on demand. Thank you!
                  </p>
                </div>
              ) : (
                <>
                  <h3 className="text-[20px] font-semibold text-[#1d1d1f] mb-1">Request Coverage</h3>
                  <p className="text-[14px] text-[#86868b] mb-6">
                    Help us prioritize where to expand next.
                  </p>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-[12px] text-[#86868b] mb-1.5">Property Address</label>
                      <input
                        type="text"
                        value={requestAddress}
                        onChange={(e) => setRequestAddress(e.target.value)}
                        placeholder="123 Main St, City, State"
                        className="w-full px-4 py-3 bg-[#f5f5f7] rounded-xl text-[14px] outline-none focus:ring-2 focus:ring-[#0071e3]/30"
                      />
                    </div>
                    <div>
                      <label className="block text-[12px] text-[#86868b] mb-1.5">Intended Use</label>
                      <select
                        value={requestUse}
                        onChange={(e) => setRequestUse(e.target.value)}
                        className="w-full px-4 py-3 bg-[#f5f5f7] rounded-xl text-[14px] outline-none focus:ring-2 focus:ring-[#0071e3]/30"
                      >
                        <option value="buying">Buying property</option>
                        <option value="building">Building / developing</option>
                        <option value="investing">Investing</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[12px] text-[#86868b] mb-1.5">Email (optional)</label>
                      <input
                        type="email"
                        value={requestEmail}
                        onChange={(e) => setRequestEmail(e.target.value)}
                        placeholder="you@email.com"
                        className="w-full px-4 py-3 bg-[#f5f5f7] rounded-xl text-[14px] outline-none focus:ring-2 focus:ring-[#0071e3]/30"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => setShowRequestForm(false)}
                      className="flex-1 py-3 bg-[#f5f5f7] text-[#1d1d1f] rounded-full text-[14px] font-medium hover:bg-[#e8e8ed] transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleRequestSubmit}
                      disabled={!requestAddress.trim()}
                      className="flex-1 py-3 bg-[#0071e3] text-white rounded-full text-[14px] font-semibold hover:bg-[#0077ed] transition-colors disabled:opacity-50"
                    >
                      Submit Request
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

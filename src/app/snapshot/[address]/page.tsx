"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useAuth } from "../../../contexts/AuthContext";
import { useCredits } from "../../../contexts/CreditContext";
import { CreditGateModal } from "../../../components/CreditGateModal";
import { generateSnapshot, createMockPropertyFromAddress, SnapshotResult, RiskStatus, RuleCheckResult } from "../../../lib/snapshotService";
import { RealTimeComment } from "../../../lib/siteConstraints";
import { generateActionChecklist } from "../../../lib/actionChecklist";
import PropertyActionChecklist from "../../../components/PropertyActionChecklist";

// Dynamically import SitePlanDesigner to avoid SSR issues with canvas/SVG
const SitePlanDesigner = dynamic(
  () => import("../../../components/SitePlanDesigner").then((mod) => mod.default),
  { ssr: false, loading: () => <div className="h-[600px] bg-[#f5f5f7] rounded-xl animate-pulse" /> }
);

// Dynamically import SnapshotMap (Leaflet) to avoid SSR issues
const SnapshotMap = dynamic(
  () => import("../../../components/SnapshotMap").then((mod) => mod.default),
  { ssr: false, loading: () => <div className="h-[600px] bg-[#f5f5f7] rounded-xl animate-pulse" /> }
);

// Free geocoding via OpenStreetMap Nominatim (no API key needed)
async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&countrycodes=us&limit=1`;
    const res = await fetch(url, {
      headers: { "User-Agent": "PropertyRiskSnapshot/1.0" },
    });
    const data = await res.json();
    if (data && data.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
    return null;
  } catch {
    return null;
  }
}

// ============================================
// STATUS HELPERS
// ============================================

function StatusPill({ status, size = "md" }: { status: RiskStatus; size?: "sm" | "md" | "lg" }) {
  const colors = {
    pass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warn: "bg-amber-50 text-amber-700 border-amber-200",
    fail: "bg-red-50 text-red-700 border-red-200",
    unknown: "bg-gray-50 text-gray-500 border-gray-200",
  };
  const labels = { pass: "Pass", warn: "Warning", fail: "Fail", unknown: "Unknown" };
  const dots = {
    pass: "bg-emerald-400",
    warn: "bg-amber-400",
    fail: "bg-red-400",
    unknown: "bg-gray-400",
  };
  const sizing = {
    sm: "px-2.5 py-1 text-[11px]",
    md: "px-3.5 py-1.5 text-[13px]",
    lg: "px-5 py-2.5 text-[15px]",
  };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border font-semibold ${colors[status]} ${sizing[size]}`}>
      <span className={`w-2 h-2 rounded-full ${dots[status]}`} />
      {labels[status]}
    </span>
  );
}

function StatusIcon({ status, size = 20 }: { status: RiskStatus; size?: number }) {
  if (status === "pass") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="text-emerald-500">
        <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.15" />
        <path d="M8 12l2.5 2.5L16 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (status === "warn") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="text-amber-500">
        <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.15" />
        <path d="M12 8v4m0 4h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  if (status === "fail") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="text-red-500">
        <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.15" />
        <path d="M15 9l-6 6m0-6l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="text-gray-400">
      <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.15" />
      <path d="M12 8v4m0 4h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

const ENV_ICONS: Record<string, JSX.Element> = {
  flood: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
    </svg>
  ),
  wetland: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.893 13.393l-1.135-1.135a2.252 2.252 0 01-.421-.585l-1.08-2.16a.414.414 0 00-.663-.107.827.827 0 01-.812.21l-1.273-.363a.89.89 0 00-.738 1.595l.587.39c.59.395.674 1.23.172 1.732l-.2.2c-.212.212-.33.498-.33.796v.41c0 .409-.11.809-.32 1.158l-1.315 2.191a2.11 2.11 0 01-1.81 1.025 1.055 1.055 0 01-1.055-1.055v-1.172c0-.92-.56-1.747-1.414-2.089l-.655-.261a2.25 2.25 0 01-1.383-2.46l.007-.042a2.25 2.25 0 01.29-.787l.09-.15a2.25 2.25 0 012.37-1.048l1.178.236a1.125 1.125 0 001.302-.795l.208-.73a1.125 1.125 0 00-.578-1.315l-.665-.332-.091.091a2.25 2.25 0 01-1.591.659h-.18c-.249 0-.487.1-.662.274a.931.931 0 01-1.458-1.137l1.411-2.353a2.25 2.25 0 00.286-.76M11.25 3v1.5" />
    </svg>
  ),
  slope: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
    </svg>
  ),
  buffer: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
  ),
  hazard: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
  ),
};

// ============================================
// MAIN PAGE COMPONENT
// ============================================

export default function SnapshotPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const credits = useCredits();

  const [snapshot, setSnapshot] = useState<SnapshotResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreditGate, setShowCreditGate] = useState(false);
  const [creditUsed, setCreditUsed] = useState(false);
  const [expandedRules, setExpandedRules] = useState<Set<string>>(new Set());
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiMessages, setAiMessages] = useState<{ role: string; content: string }[]>([]);
  const [activeMapTab, setActiveMapTab] = useState<"siteplan" | "aerial">("aerial");
  const [constraintMessages, setConstraintMessages] = useState<RealTimeComment[]>([]);
  const [realCoords, setRealCoords] = useState<{ lat: number; lng: number } | null>(null);
  const address = decodeURIComponent((params?.address as string) || "");

  // Geocode the address for real coordinates
  useEffect(() => {
    if (!address) return;
    geocodeAddress(address).then((coords) => {
      if (coords) setRealCoords(coords);
    });
  }, [address]);

  // Load snapshot — always generate, handle credits after
  useEffect(() => {
    if (!address) return;
    if (snapshot) return; // already loaded

    let cancelled = false;

    const run = async () => {
      setIsLoading(true);

      // Small delay for loading UX
      await new Promise((r) => setTimeout(r, 600));

      if (cancelled) return;

      // Try to deduct credit if user is logged in
      if (isAuthenticated && user) {
        try {
          const idKey = `snap_${address}_${user.id}_${new Date().toISOString().split("T")[0]}`;
          await credits.useCredit(address, idKey);
          setCreditUsed(true);
        } catch {
          // Credit deduction failed — still show snapshot
        }
      }

      // Always generate snapshot regardless of auth/credits
      const result = generateSnapshot(address);
      if (!cancelled) {
        setSnapshot(result);
        setIsLoading(false);
      }
    };

    run();

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

  // Build a PropertyRecord for the SitePlanDesigner from the address
  const propertyRecord = useMemo(() => {
    if (!address) return null;
    return createMockPropertyFromAddress(address);
  }, [address]);

  // Handle real-time constraint feedback from the SitePlanDesigner
  const handleValidationChange = useCallback((messages: RealTimeComment[]) => {
    setConstraintMessages(messages);
  }, []);

  const handleCreditGateClose = () => {
    setShowCreditGate(false);
    if (credits.balance < 1) {
      router.push("/");
    }
  };

  const handleCredited = () => {
    setCreditUsed(false); // trigger reload
  };

  const toggleRule = (id: string) => {
    setExpandedRules((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAiQuestion = (q: string) => {
    if (!q.trim() || !snapshot) return;
    setAiMessages((prev) => [
      ...prev,
      { role: "user", content: q },
      {
        role: "assistant",
        content: generateAiResponse(q, snapshot),
      },
    ]);
    setAiQuestion("");
  };

  // Group rules by category
  const groupedRules = useMemo(() => {
    if (!snapshot) return {};
    return snapshot.ruleChecks.reduce((acc, rule) => {
      const cat = rule.category;
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(rule);
      return acc;
    }, {} as Record<string, RuleCheckResult[]>);
  }, [snapshot]);

  // ============================================
  // LOADING STATE
  // ============================================
  if (isLoading || !snapshot) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-6 relative">
            <div className="absolute inset-0 rounded-full border-4 border-[#e8e8ed]" />
            <div className="absolute inset-0 rounded-full border-4 border-[#0071e3] border-t-transparent animate-spin" />
          </div>
          <h2 className="text-[22px] font-semibold text-[#1d1d1f] mb-2">
            Generating Risk Snapshot
          </h2>
          <p className="text-[15px] text-[#86868b] max-w-sm">
            Analyzing zoning rules, utilities, and environmental data for this property...
          </p>
          <p className="text-[13px] text-[#c7c7cc] mt-4">{address}</p>
          <div className="mt-6 flex flex-col gap-2 max-w-xs mx-auto">
            {["Locating parcel boundary", "Loading zoning rules", "Checking utilities", "Scanning environmental data"].map((step, i) => (
              <div key={step} className="flex items-center gap-3 text-[13px] text-[#86868b] slide-up" style={{ animationDelay: `${i * 400}ms` }}>
                <svg className="w-4 h-4 text-[#0071e3] animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="4" />
                </svg>
                {step}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const categoryLabels: Record<string, string> = {
    dimensional: "Setbacks & Height",
    lot: "Lot Requirements",
    zoning: "Zoning",
    use: "Use & Structures",
  };

  // ============================================
  // MAIN RENDER
  // ============================================
  return (
    <div className="min-h-screen bg-[#F7F9FC]">
      {/* Credit Gate Modal */}
      <CreditGateModal
        isOpen={showCreditGate}
        onClose={handleCreditGateClose}
        onCredited={handleCredited}
      />

      {/* ===== STICKY HEADER ===== */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-[#e8e8ed]">
        <div className="max-w-[1440px] mx-auto px-6 h-[72px] flex items-center justify-between">
          <div className="flex items-center gap-4 min-w-0">
            <Link href="/" className="text-[#0071e3] hover:underline text-[14px] flex-shrink-0">
              ← Home
            </Link>
            <div className="h-5 w-px bg-[#d2d2d7]" />
            <div className="min-w-0">
              <h1 className="text-[18px] font-semibold text-[#1d1d1f] truncate">
                {snapshot.address}
              </h1>
              <p className="text-[12px] text-[#86868b] truncate">
                {snapshot.city}, {snapshot.county} County &bull; {snapshot.zoningDistrict} — {snapshot.zoningCategory}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            {creditUsed && (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-[12px] font-semibold border border-emerald-200">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                1 Credit Used
              </span>
            )}
            <button
              onClick={() => window.print()}
              className="hidden sm:flex items-center gap-2 px-4 py-2 bg-[#f5f5f7] hover:bg-[#e8e8ed] rounded-full text-[13px] font-medium text-[#1d1d1f] transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download PDF
            </button>
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
              }}
              className="hidden sm:flex items-center gap-2 px-4 py-2 bg-[#f5f5f7] hover:bg-[#e8e8ed] rounded-full text-[13px] font-medium text-[#1d1d1f] transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Share
            </button>
          </div>
        </div>
      </header>

      {/* ===== CONTENT ===== */}
      <div className="max-w-[1440px] mx-auto px-6 py-8 space-y-8">

        {/* ===== SECTION 1: OVERALL RISK SUMMARY ===== */}
        <section className="bg-white rounded-[20px] shadow-[0_8px_24px_rgba(0,0,0,0.04)] border border-[#f0f0f2] p-8">
          <div className="flex items-center gap-2 mb-6">
            <h2 className="text-[13px] font-semibold uppercase tracking-wider text-[#86868b]">
              Risk Snapshot Summary
            </h2>
            <span className="text-[11px] text-[#c7c7cc]">
              &bull; Generated {snapshot.generatedAt.toLocaleDateString()}
            </span>
          </div>

          {/* Status Pills Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {[snapshot.buildability, snapshot.utilities, snapshot.environmental].map((cat) => (
              <div
                key={cat.label}
                className={`rounded-2xl border p-5 ${
                  cat.status === "pass"
                    ? "bg-emerald-50/50 border-emerald-100"
                    : cat.status === "warn"
                    ? "bg-amber-50/50 border-amber-100"
                    : cat.status === "fail"
                    ? "bg-red-50/50 border-red-100"
                    : "bg-gray-50 border-gray-100"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[14px] font-semibold text-[#1d1d1f]">{cat.label}</span>
                  <StatusPill status={cat.status} size="sm" />
                </div>
                <p className="text-[13px] text-[#6e6e73] leading-relaxed">{cat.summary}</p>
              </div>
            ))}
          </div>

          {/* Summary sentence */}
          <div className="bg-[#f5f5f7] rounded-xl p-4 flex items-start gap-3">
            <StatusIcon status={snapshot.overallStatus} size={24} />
            <p className="text-[14px] text-[#1d1d1f] leading-relaxed">{snapshot.overallSummary}</p>
          </div>
        </section>

        {/* ===== SECTION 2: INTERACTIVE MAP + LIVE FEEDBACK ===== */}
        <section>
          {/* Tab Bar */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-1 bg-[#f5f5f7] rounded-full p-1">
              <button
                onClick={() => setActiveMapTab("siteplan")}
                className={`px-5 py-2 rounded-full text-[13px] font-medium transition-all duration-200 ${
                  activeMapTab === "siteplan"
                    ? "bg-white text-[#1d1d1f] shadow-sm"
                    : "text-[#86868b] hover:text-[#1d1d1f]"
                }`}
              >
                Site Plan Designer
              </button>
              <button
                onClick={() => setActiveMapTab("aerial")}
                className={`px-5 py-2 rounded-full text-[13px] font-medium transition-all duration-200 ${
                  activeMapTab === "aerial"
                    ? "bg-white text-[#1d1d1f] shadow-sm"
                    : "text-[#86868b] hover:text-[#1d1d1f]"
                }`}
              >
                Aerial Map
              </button>
            </div>
            <div className="text-[12px] text-[#86868b]">
              {activeMapTab === "siteplan"
                ? "Drag structures onto the lot to check what you can build"
                : "Satellite view of the property"
              }
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
            {/* MAP / SITE PLAN */}
            <div className="rounded-[20px] shadow-[0_8px_24px_rgba(0,0,0,0.04)] border border-[#f0f0f2] overflow-hidden">
              {activeMapTab === "siteplan" && propertyRecord ? (
                <div className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 min-h-[680px]">
                  <SitePlanDesigner
                    property={propertyRecord}
                    onValidationChange={handleValidationChange}
                  />
                </div>
              ) : (
                /* Real Map with Leaflet + free tiles */
                <SnapshotMap
                  lat={realCoords?.lat ?? snapshot.centroid.lat}
                  lng={realCoords?.lng ?? snapshot.centroid.lng}
                  lotWidth={snapshot.lotWidth}
                  lotDepth={snapshot.lotDepth}
                  address={snapshot.address}
                  zoningDistrict={snapshot.zoningDistrict}
                  parcelAreaSqft={snapshot.parcelArea.sqft}
                />
              )}
            </div>

            {/* LIVE FEEDBACK + EXPLANATION PANEL */}
            <div className="space-y-4">

              {/* Live Constraint Feedback */}
              <div className="bg-white rounded-[20px] shadow-[0_8px_24px_rgba(0,0,0,0.04)] border border-[#f0f0f2] p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[15px] font-semibold text-[#1d1d1f]">
                    {constraintMessages.length > 0 ? "Live Feedback" : "What This Means"}
                  </h3>
                  {constraintMessages.length > 0 && (
                    <div className="flex items-center gap-2 text-[11px]">
                      <span className="flex items-center gap-1 text-red-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                        {constraintMessages.filter((m) => m.severity === "critical").length}
                      </span>
                      <span className="flex items-center gap-1 text-amber-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        {constraintMessages.filter((m) => m.severity === "warning").length}
                      </span>
                      <span className="flex items-center gap-1 text-emerald-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        {constraintMessages.filter((m) => m.severity === "success").length}
                      </span>
                    </div>
                  )}
                </div>

                {constraintMessages.length > 0 ? (
                  <div className="space-y-2 max-h-[320px] overflow-y-auto">
                    {constraintMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`p-3 rounded-xl text-[12px] leading-relaxed ${
                          msg.severity === "critical"
                            ? "bg-red-50 border border-red-100 text-red-800"
                            : msg.severity === "warning"
                            ? "bg-amber-50 border border-amber-100 text-amber-800"
                            : msg.severity === "success"
                            ? "bg-emerald-50 border border-emerald-100 text-emerald-800"
                            : "bg-[#f5f5f7] text-[#6e6e73]"
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <span className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                            msg.severity === "critical" ? "bg-red-500" :
                            msg.severity === "warning" ? "bg-amber-500" :
                            msg.severity === "success" ? "bg-emerald-500" : "bg-gray-400"
                          }`} />
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-[12px] mb-0.5">{msg.title}</div>
                            <div className="text-[11px] opacity-80">{msg.message}</div>
                            {msg.citation && (
                              <div className="flex items-center gap-1 mt-1.5 text-[10px] opacity-60">
                                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
                                </svg>
                                {msg.citation}
                              </div>
                            )}
                            {msg.action && (
                              <div className="text-[10px] mt-1 font-medium opacity-70">
                                Tip: {msg.action}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    <p className="text-[13px] text-[#6e6e73] leading-relaxed mb-4">
                      {snapshot.overallSummary}
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-[12px]">
                        <StatusIcon status={snapshot.buildability.status} size={16} />
                        <span className="text-[#1d1d1f]">{snapshot.buildability.summary}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[12px]">
                        <StatusIcon status={snapshot.utilities.status} size={16} />
                        <span className="text-[#1d1d1f]">{snapshot.utilities.summary}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[12px]">
                        <StatusIcon status={snapshot.environmental.status} size={16} />
                        <span className="text-[#1d1d1f]">{snapshot.environmental.summary}</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-[#c7c7cc] mt-4">
                      Add a structure on the Site Plan to see live constraint feedback.
                    </p>
                  </>
                )}
              </div>

              {/* Ask a Question */}
              <div className="bg-white rounded-[20px] shadow-[0_8px_24px_rgba(0,0,0,0.04)] border border-[#f0f0f2] p-6">
                <h3 className="text-[15px] font-semibold text-[#1d1d1f] mb-3">Ask a Question</h3>

                {aiMessages.length > 0 && (
                  <div className="mb-4 space-y-3 max-h-[200px] overflow-y-auto">
                    {aiMessages.map((msg, i) => (
                      <div
                        key={i}
                        className={`text-[13px] leading-relaxed p-3 rounded-xl ${
                          msg.role === "user"
                            ? "bg-[#0071e3] text-white ml-6"
                            : "bg-[#f5f5f7] text-[#1d1d1f] mr-4"
                        }`}
                      >
                        {msg.content}
                      </div>
                    ))}
                  </div>
                )}

                {aiMessages.length === 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {["Can an ADU fit here?", "Where is safest to build?", "Why is this a warning?"].map((q) => (
                      <button
                        key={q}
                        onClick={() => handleAiQuestion(q)}
                        className="px-3 py-1.5 bg-[#f5f5f7] hover:bg-[#e8e8ed] rounded-full text-[12px] text-[#1d1d1f] transition-colors"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={aiQuestion}
                    onChange={(e) => setAiQuestion(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAiQuestion(aiQuestion)}
                    placeholder="Ask about this property..."
                    className="flex-1 px-4 py-2.5 bg-[#f5f5f7] rounded-full text-[13px] outline-none focus:ring-2 focus:ring-[#0071e3]/30 border border-transparent focus:border-[#0071e3]/30"
                  />
                  <button
                    onClick={() => handleAiQuestion(aiQuestion)}
                    className="w-10 h-10 bg-[#0071e3] rounded-full grid place-items-center hover:bg-[#0077ed] transition-colors flex-shrink-0"
                  >
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
                <p className="text-[10px] text-[#c7c7cc] mt-3">
                  AI explanations are based only on validated public records and rules.
                </p>
              </div>

              {/* Data Sources */}
              <div className="bg-white rounded-[20px] shadow-[0_8px_24px_rgba(0,0,0,0.04)] border border-[#f0f0f2] p-6">
                <h3 className="text-[15px] font-semibold text-[#1d1d1f] mb-3">Data Sources</h3>
                <div className="space-y-2">
                  {snapshot.dataSources.map((src) => (
                    <div key={src.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            src.confidence === "high"
                              ? "bg-emerald-400"
                              : src.confidence === "medium"
                              ? "bg-amber-400"
                              : "bg-gray-400"
                          }`}
                        />
                        <span className="text-[12px] text-[#1d1d1f]">{src.name}</span>
                      </div>
                      <span className="text-[11px] text-[#86868b]">{src.type}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== SECTION 3: RULE VALIDATION CARDS ===== */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-[22px] font-semibold text-[#1d1d1f]">Rules & Codes</h2>
              <p className="text-[13px] text-[#86868b] mt-1">
                Validated against local zoning ordinances
              </p>
            </div>
            <div className="flex items-center gap-3 text-[12px]">
              <span className="flex items-center gap-1.5 text-emerald-600">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                {snapshot.ruleChecks.filter((c) => c.status === "pass").length} Pass
              </span>
              <span className="flex items-center gap-1.5 text-amber-600">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                {snapshot.ruleChecks.filter((c) => c.status === "warn").length} Warn
              </span>
              <span className="flex items-center gap-1.5 text-red-600">
                <span className="w-2 h-2 rounded-full bg-red-400" />
                {snapshot.ruleChecks.filter((c) => c.status === "fail").length} Fail
              </span>
            </div>
          </div>

          {Object.entries(groupedRules).map(([category, rules]) => (
            <div key={category} className="mb-6">
              <h3 className="text-[14px] font-semibold text-[#86868b] uppercase tracking-wider mb-3">
                {categoryLabels[category] || category}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {rules.map((rule) => (
                  <button
                    key={rule.id}
                    onClick={() => toggleRule(rule.id)}
                    className="text-left bg-white rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.03)] border border-[#f0f0f2] p-5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition-all duration-200"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-[14px] font-semibold text-[#1d1d1f]">{rule.name}</span>
                      <StatusIcon status={rule.status} />
                    </div>

                    {rule.measured !== null && rule.required !== null && (
                      <div className="flex items-baseline gap-4 mb-2">
                        <div>
                          <div className="text-[11px] text-[#86868b] uppercase tracking-wider">Required</div>
                          <div className="text-[17px] font-semibold text-[#1d1d1f]">
                            {typeof rule.required === "number" ? rule.required.toLocaleString() : rule.required}
                            <span className="text-[12px] text-[#86868b] ml-1">{rule.unit}</span>
                          </div>
                        </div>
                        <div className="text-[#d2d2d7]">vs</div>
                        <div>
                          <div className="text-[11px] text-[#86868b] uppercase tracking-wider">Measured</div>
                          <div className="text-[17px] font-semibold text-[#1d1d1f]">
                            {typeof rule.measured === "number" ? rule.measured.toLocaleString() : rule.measured}
                            <span className="text-[12px] text-[#86868b] ml-1">{rule.unit}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Margin/Excess */}
                    {rule.margin !== undefined && (
                      <div className="text-[12px] text-emerald-600 mb-2">
                        +{rule.margin.toFixed(1)} {rule.unit} margin
                      </div>
                    )}
                    {rule.excess !== undefined && (
                      <div className="text-[12px] text-red-600 mb-2">
                        -{rule.excess.toFixed(1)} {rule.unit} over limit
                      </div>
                    )}

                    {/* Citation badge */}
                    <div className="flex items-center gap-1.5 mt-2">
                      <svg className="w-3 h-3 text-[#0071e3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                      <span className="text-[11px] text-[#0071e3] font-medium">{rule.citation}</span>
                    </div>

                    {/* Expanded content */}
                    {expandedRules.has(rule.id) && rule.citationText && (
                      <div className="mt-3 pt-3 border-t border-[#f5f5f7]">
                        <p className="text-[12px] text-[#6e6e73] italic leading-relaxed">
                          &ldquo;{rule.citationText}&rdquo;
                        </p>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </section>

        {/* ===== SECTION 4: ACTION CHECKLIST ===== */}
        <section>
          <div className="mb-5">
            <h2 className="text-[22px] font-semibold text-[#1d1d1f]">What You Can Do on This Property</h2>
            <p className="text-[13px] text-[#86868b] mt-1">
              Deterministic checklist based on zoning rules, utilities, and environmental data. Click any item for details.
            </p>
          </div>
          <PropertyActionChecklist items={generateActionChecklist(snapshot)} />
        </section>

        {/* ===== SECTION 5: UTILITIES & SEPTIC ===== */}
        <section>
          <h2 className="text-[22px] font-semibold text-[#1d1d1f] mb-5">Utilities & Septic</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sewer Card */}
            <div className="bg-white rounded-[20px] shadow-[0_8px_24px_rgba(0,0,0,0.04)] border border-[#f0f0f2] p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl grid place-items-center ${
                    snapshot.utilityResult.sewer.available ? "bg-emerald-50" : "bg-amber-50"
                  }`}>
                    <svg className={`w-5 h-5 ${snapshot.utilityResult.sewer.available ? "text-emerald-600" : "text-amber-600"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                    </svg>
                  </div>
                  <h3 className="text-[17px] font-semibold text-[#1d1d1f]">Sewer</h3>
                </div>
                <StatusPill status={snapshot.utilityResult.sewer.status} size="sm" />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-[13px]">
                  <span className="text-[#86868b]">Service Available</span>
                  <span className={`font-medium ${snapshot.utilityResult.sewer.available ? "text-emerald-600" : "text-red-600"}`}>
                    {snapshot.utilityResult.sewer.available ? "Yes" : "No"}
                  </span>
                </div>
                {snapshot.utilityResult.sewer.providerName && (
                  <div className="flex justify-between text-[13px]">
                    <span className="text-[#86868b]">Provider</span>
                    <span className="text-[#1d1d1f]">{snapshot.utilityResult.sewer.providerName}</span>
                  </div>
                )}
                {snapshot.utilityResult.sewer.distanceToMain !== undefined && (
                  <div className="flex justify-between text-[13px]">
                    <span className="text-[#86868b]">Distance to Main</span>
                    <span className="text-[#1d1d1f]">{snapshot.utilityResult.sewer.distanceToMain} ft</span>
                  </div>
                )}
                {snapshot.utilityResult.sewer.hookupCost !== undefined && (
                  <div className="flex justify-between text-[13px]">
                    <span className="text-[#86868b]">Est. Hookup Cost</span>
                    <span className="text-[#1d1d1f]">${snapshot.utilityResult.sewer.hookupCost?.toLocaleString()}</span>
                  </div>
                )}
              </div>
              <p className="mt-4 text-[12px] text-[#6e6e73] leading-relaxed">{snapshot.utilityResult.sewer.summary}</p>
            </div>

            {/* Septic Card */}
            <div className="bg-white rounded-[20px] shadow-[0_8px_24px_rgba(0,0,0,0.04)] border border-[#f0f0f2] p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl grid place-items-center ${
                    snapshot.utilityResult.septic.status === "pass" ? "bg-emerald-50" :
                    snapshot.utilityResult.septic.status === "warn" ? "bg-amber-50" : "bg-red-50"
                  }`}>
                    <svg className={`w-5 h-5 ${
                      snapshot.utilityResult.septic.status === "pass" ? "text-emerald-600" :
                      snapshot.utilityResult.septic.status === "warn" ? "text-amber-600" : "text-red-600"
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
                    </svg>
                  </div>
                  <h3 className="text-[17px] font-semibold text-[#1d1d1f]">Septic</h3>
                </div>
                <StatusPill status={snapshot.utilityResult.septic.status} size="sm" />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-[13px]">
                  <span className="text-[#86868b]">Soil Suitability</span>
                  <span className="text-[#1d1d1f] capitalize">
                    {snapshot.utilityResult.septic.soilSuitability.replace("_", " ")}
                  </span>
                </div>
                <div className="flex justify-between text-[13px]">
                  <span className="text-[#86868b]">Soil Type</span>
                  <span className="text-[#1d1d1f]">{snapshot.utilityResult.septic.soilName}</span>
                </div>
                <div className="flex justify-between text-[13px]">
                  <span className="text-[#86868b]">Likely System</span>
                  <span className="text-[#1d1d1f]">{snapshot.utilityResult.septic.systemType}</span>
                </div>
                <div className="flex justify-between text-[13px]">
                  <span className="text-[#86868b]">Est. Cost Range</span>
                  <span className="text-[#1d1d1f]">
                    ${snapshot.utilityResult.septic.costRange.min.toLocaleString()} – $
                    {snapshot.utilityResult.septic.costRange.max.toLocaleString()}
                  </span>
                </div>
              </div>

              {snapshot.utilityResult.septic.issues.length > 0 && (
                <div className="mt-4 pt-4 border-t border-[#f5f5f7]">
                  <div className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wider mb-2">Issues</div>
                  {snapshot.utilityResult.septic.issues.map((issue, i) => (
                    <div key={i} className="flex items-start gap-2 mb-2">
                      <span
                        className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                          issue.severity === "critical" ? "bg-red-400" :
                          issue.severity === "major" ? "bg-amber-400" : "bg-gray-400"
                        }`}
                      />
                      <span className="text-[12px] text-[#6e6e73]">{issue.description}</span>
                    </div>
                  ))}
                </div>
              )}

              <p className="mt-4 text-[12px] text-[#6e6e73] leading-relaxed">{snapshot.utilityResult.septic.summary}</p>
            </div>
          </div>
        </section>

        {/* ===== SECTION 5: ENVIRONMENTAL RISK FLAGS ===== */}
        <section>
          <h2 className="text-[22px] font-semibold text-[#1d1d1f] mb-5">Risk Flags</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {snapshot.environmentalFlags.map((flag) => (
              <div
                key={flag.id}
                className="bg-white rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.03)] border border-[#f0f0f2] p-5"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl grid place-items-center ${
                    flag.status === "pass" ? "bg-emerald-50 text-emerald-600" :
                    flag.status === "warn" ? "bg-amber-50 text-amber-600" :
                    flag.status === "fail" ? "bg-red-50 text-red-600" : "bg-gray-50 text-gray-500"
                  }`}>
                    {ENV_ICONS[flag.type] || ENV_ICONS.hazard}
                  </div>
                  <StatusPill status={flag.status} size="sm" />
                </div>
                <h4 className="text-[14px] font-semibold text-[#1d1d1f] mb-1">{flag.label}</h4>
                <p className="text-[12px] text-[#6e6e73] leading-relaxed">{flag.description}</p>
                {flag.action && (
                  <button className="mt-3 text-[12px] text-[#0071e3] font-medium hover:underline">
                    {flag.action} →
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ===== SECTION 6: DATA GAPS ===== */}
        {snapshot.dataGaps.length > 0 && (
          <section className="bg-amber-50/50 rounded-[20px] border border-amber-100 p-6">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <h2 className="text-[17px] font-semibold text-amber-900">Data Gaps & Verification Needed</h2>
            </div>
            <p className="text-[13px] text-amber-800 mb-4">
              Some public records may be incomplete. The following items should be verified before making decisions.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {snapshot.dataGaps.map((gap, i) => (
                <div key={i} className="bg-white rounded-xl p-4 border border-amber-100">
                  <div className="text-[13px] font-semibold text-[#1d1d1f] mb-1">{gap.field}</div>
                  <p className="text-[12px] text-[#6e6e73] mb-2">{gap.description}</p>
                  <div className="flex items-center gap-1.5 text-[11px] text-[#0071e3] font-medium">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                    {gap.nextStep}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ===== SECTION 7: EXPORT & NEXT STEPS ===== */}
        <section className="bg-white rounded-[20px] shadow-[0_8px_24px_rgba(0,0,0,0.04)] border border-[#f0f0f2] p-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex-1">
              <h3 className="text-[17px] font-semibold text-[#1d1d1f] mb-2">About This Report</h3>
              <p className="text-[13px] text-[#86868b] leading-relaxed max-w-2xl">
                This Property Risk Snapshot is based on publicly available city and county records,
                zoning ordinances, and environmental data. All results are validated against
                deterministic rules with citations. This is not legal advice — verify critical
                items with local planning departments before making decisions.
              </p>
              {creditUsed && (
                <div className="mt-3 text-[12px] text-[#86868b]">
                  Snapshot ID: {snapshot.id} &bull; Generated{" "}
                  {snapshot.generatedAt.toLocaleString()} &bull; Credits used: 1
                </div>
              )}
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <button
                onClick={() => window.print()}
                className="px-6 py-3 bg-[#0071e3] text-white rounded-full text-[14px] font-semibold hover:bg-[#0077ed] transition-colors active:scale-[0.97]"
              >
                Download PDF
              </button>
              <Link
                href="/"
                className="px-6 py-3 bg-[#f5f5f7] text-[#1d1d1f] rounded-full text-[14px] font-semibold hover:bg-[#e8e8ed] transition-colors active:scale-[0.97]"
              >
                Run Another Snapshot
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="text-center py-6">
          <p className="text-[12px] text-[#c7c7cc]">
            Property Risk Snapshot™ — Powered by public records and deterministic validation.
          </p>
          <p className="text-[11px] text-[#d2d2d7] mt-1">
            Rule-based. Citation-backed. No guessing.
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================
// AI RESPONSE GENERATOR (mock)
// Uses ONLY validated snapshot data
// ============================================

function generateAiResponse(question: string, snapshot: SnapshotResult): string {
  const q = question.toLowerCase();

  if (q.includes("adu")) {
    const aduRule = snapshot.ruleChecks.find((c) => c.ruleType === "adu_allowed" || c.ruleType === "adu_size_max");
    if (aduRule) {
      return `Based on the zoning rules for ${snapshot.zoningDistrict}, ADUs are permitted on this property per ${aduRule.citation}. The maximum ADU size is 1,000 sqft or 50% of the primary dwelling, whichever is less. Given the lot size of ${snapshot.parcelArea.sqft.toLocaleString()} sqft, there should be space within the buildable area after setbacks are applied.`;
    }
    return `Based on the ${snapshot.zoningDistrict} zoning district, I would need to verify ADU regulations with the local planning department. This is listed as a data gap in your report.`;
  }

  if (q.includes("safest") || q.includes("where") || q.includes("build")) {
    return `Based on the setback analysis, the safest area to build on this property is within the buildable envelope — at least ${
      snapshot.ruleChecks.find((c) => c.ruleType === "setback_front")?.required || 25
    }ft from the front, ${
      snapshot.ruleChecks.find((c) => c.ruleType === "setback_side")?.required || 10
    }ft from each side, and ${
      snapshot.ruleChecks.find((c) => c.ruleType === "setback_rear")?.required || 20
    }ft from the rear property line. The center of the lot provides the most buffer from all boundaries. ${
      snapshot.environmentalFlags.some((f) => f.status !== "pass")
        ? "Note: there are environmental considerations that may further restrict placement."
        : ""
    }`;
  }

  if (q.includes("warning") || q.includes("why")) {
    const warnings = snapshot.ruleChecks.filter((c) => c.status === "warn");
    const envWarnings = snapshot.environmentalFlags.filter((f) => f.status === "warn");
    if (warnings.length > 0 || envWarnings.length > 0) {
      const items = [
        ...warnings.map((w) => `${w.name}: needs verification per ${w.citation}`),
        ...envWarnings.map((e) => `${e.label}: ${e.description}`),
      ];
      return `Warnings are shown when data needs verification or when conditions require closer review. Current warnings:\n\n${items.map((i) => `• ${i}`).join("\n")}\n\nThese are not necessarily problems — they indicate areas where on-site verification or professional review is recommended.`;
    }
    return "There are no warnings for this property. All checks are passing based on available data.";
  }

  return `Based on the validated data for ${snapshot.address}: The property is in the ${snapshot.zoningDistrict} zone (${snapshot.zoningCategory}), with a lot size of ${snapshot.parcelArea.sqft.toLocaleString()} sqft. ${snapshot.overallSummary} Is there a specific aspect you'd like me to explain?`;
}

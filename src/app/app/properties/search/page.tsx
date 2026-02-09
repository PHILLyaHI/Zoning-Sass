"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { useProperties } from "../../../../contexts/PropertyContext";

export default function SearchPropertyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { searchProperty, searchError } = useProperties();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState(0);
  const hasSearched = useRef(false);

  useEffect(() => {
    const address = searchParams.get("address");
    if (!address) {
      router.push("/app/properties/new");
      return;
    }

    // Prevent double-execution in React strict mode
    if (hasSearched.current) return;
    hasSearched.current = true;

    // Search property using API
    const doSearch = async () => {
      try {
        setLoading(true);
        
        // Animate through stages
        const stageInterval = setInterval(() => {
          setStage(s => Math.min(s + 1, 3));
        }, 600);
        
        // Call the property service via context
        const property = await searchProperty(decodeURIComponent(address));
        
        clearInterval(stageInterval);
        
        if (property) {
          // Redirect to property dashboard
          router.replace(`/app/properties/${property.id}`);
        } else {
          setError(searchError || "Could not find property. Please try a different address.");
          setLoading(false);
        }
      } catch (err) {
        console.error("Search error:", err);
        setError(err instanceof Error ? err.message : "Could not find property. Please try a different address.");
        setLoading(false);
      }
    };

    doSearch();
  }, [searchParams, router, searchProperty, searchError]);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px] p-8">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-rose-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-[#1d1d1f] mb-2">
            Property Not Found
          </h2>
          <p className="text-[#86868b] mb-6">{error}</p>
          <button
            onClick={() => router.push("/app/properties/new")}
            className="px-5 py-2.5 bg-[#0071e3] text-white rounded-xl font-medium hover:bg-[#0077ed] transition-colors"
          >
            Try Another Address
          </button>
        </div>
      </div>
    );
  }

  const stages = [
    { label: "Geocoding address", complete: stage > 0 },
    { label: "Fetching parcel data", complete: stage > 1 },
    { label: "Loading zoning rules", complete: stage > 2 },
    { label: "Building feasibility report", complete: stage > 3 },
  ];

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <div className="relative w-16 h-16 mx-auto mb-6">
          <div className="absolute inset-0 border-4 border-[#0071e3]/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-[#0071e3] border-t-transparent rounded-full animate-spin"></div>
        </div>
        <h2 className="text-lg font-semibold text-[#1d1d1f] mb-2">
          Searching Property
        </h2>
        <p className="text-[#86868b] mb-6">
          Looking up parcel data and zoning information...
        </p>
        <div className="flex flex-col items-start gap-3 text-sm max-w-xs mx-auto">
          {stages.map((s, i) => (
            <div key={i} className="flex items-center gap-3">
              {s.complete ? (
                <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : i === stage ? (
                <svg className="w-5 h-5 text-[#0071e3] animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <div className="w-5 h-5 rounded-full border-2 border-[#d2d2d7]"></div>
              )}
              <span className={s.complete ? "text-[#1d1d1f]" : "text-[#86868b]"}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

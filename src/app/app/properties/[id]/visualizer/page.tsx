"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useProperties } from "../../../../../contexts/PropertyContext";
import { PropertyRecord } from "../../../../../lib/types";
import SitePlanDesigner from "../../../../../components/SitePlanDesigner";

export default function VisualizerPage() {
  const params = useParams();
  const router = useRouter();
  const { loadProperty } = useProperties();

  const [property, setProperty] = useState<PropertyRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const id = params.id as string;
    if (id) {
      const prop = loadProperty(id);
      if (prop) {
        setProperty(prop);
      } else {
        router.push("/app/properties");
      }
      setIsLoading(false);
    }
  }, [params.id, loadProperty, router]);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-indigo-500/30 rounded-full" />
            <div className="absolute inset-0 w-20 h-20 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            <div className="absolute inset-3 w-14 h-14 border-4 border-purple-400/50 border-t-transparent rounded-full animate-spin" style={{ animationDirection: "reverse", animationDuration: "0.8s" }} />
          </div>
          <div className="text-center">
            <p className="text-lg font-medium text-white">Loading Designer</p>
            <p className="text-sm text-indigo-300/70">Preparing your canvas...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="h-full flex items-center justify-center p-8 bg-slate-50">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-rose-100 to-orange-100 flex items-center justify-center shadow-lg">
            <svg className="w-12 h-12 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-slate-900 mb-3">Property not found</h2>
          <p className="text-slate-500 mb-8">The property you're looking for doesn't exist or has been removed.</p>
          <Link 
            href="/app/properties" 
            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-full font-medium hover:bg-slate-800 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to properties
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 lg:p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900">
        <div className="flex items-center justify-between">
          {/* Back button and title */}
          <div className="flex items-center gap-4">
            <Link
              href={`/app/properties/${property.id}`}
              className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/10 backdrop-blur-xl text-white hover:bg-white/20 transition-all border border-white/10"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            
            <div className="hidden sm:flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <span className="text-lg">🏗️</span>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-white">Site Plan Designer</h1>
                <p className="text-sm text-white/60 truncate max-w-xs">
                  {property.address}
                </p>
              </div>
            </div>
          </div>
          
          {/* Property stats */}
          <div className="flex items-center gap-2">
            {property.zoningDistrict && (
              <div className="px-4 py-2 bg-white/10 backdrop-blur-xl rounded-xl border border-white/10">
                <div className="text-[10px] uppercase tracking-wider text-white/50 mb-0.5">Zone</div>
                <div className="text-sm font-semibold text-white">{property.zoningDistrict.code}</div>
              </div>
            )}
            <div className="px-4 py-2 bg-white/10 backdrop-blur-xl rounded-xl border border-white/10">
              <div className="text-[10px] uppercase tracking-wider text-white/50 mb-0.5">Lot Size</div>
              <div className="text-sm font-semibold text-white">
                {property.areaSqft ? `${(property.areaSqft / 43560).toFixed(2)} ac` : "—"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Designer Canvas */}
      <div className="flex-1 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 overflow-hidden">
        <SitePlanDesigner property={property} />
      </div>
    </div>
  );
}

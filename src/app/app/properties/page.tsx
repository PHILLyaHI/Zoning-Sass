"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useProperties } from "../../../contexts/PropertyContext";
import Card from "../../../components/Card";

export default function PropertiesPage() {
  const { properties, isLoading, loadProperties } = useProperties();

  useEffect(() => {
    loadProperties();
  }, [loadProperties]);

  const formatDate = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return "today";
    if (days === 1) return "yesterday";
    if (days < 7) return `${days} days ago`;
    return new Date(date).toLocaleDateString();
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "pass": return "bg-emerald-500";
      case "warn": return "bg-amber-500";
      case "fail": return "bg-rose-500";
      default: return "bg-slate-400";
    }
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/4 mb-8"></div>
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-slate-200 dark:bg-slate-700 rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-semibold text-slate-900 dark:text-white">
            Your Properties
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {properties.length === 0 
              ? "Search for a property to get started"
              : `${properties.length} saved ${properties.length === 1 ? "property" : "properties"}`
            }
          </p>
        </div>
        <Link
          href="/app/properties/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-full font-medium transition-all duration-200 shadow-lg shadow-slate-900/10"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="hidden sm:inline">Add Property</span>
        </Link>
      </div>

      {/* Empty State */}
      {properties.length === 0 && (
        <Card className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
            No properties yet
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md mx-auto">
            Search for any US address to analyze zoning, utilities, and environmental constraints.
          </p>
          <Link
            href="/app/properties/new"
            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-full font-medium transition-all duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Search Property
          </Link>
        </Card>
      )}

      {/* Property List */}
      <div className="space-y-4">
        {properties.map((property) => (
          <Link 
            key={property.id} 
            href={`/app/properties/${property.id}`}
            className="block group"
          >
            <Card className="hover:shadow-lg hover:shadow-slate-900/5 transition-all duration-300 hover:border-slate-200 dark:hover:border-slate-600">
              <div className="flex items-start gap-4">
                {/* Status Indicator */}
                <div className={`w-2 h-2 rounded-full mt-2 ${getStatusColor(property.feasibility?.overallStatus)}`} />
                
                {/* Property Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                    {property.address}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                    {[property.city, property.state].filter(Boolean).join(", ")}
                    {property.zoningDistrict && (
                      <span className="ml-2 text-slate-400 dark:text-slate-500">
                        • {property.zoningDistrict.code}
                      </span>
                    )}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-slate-400 dark:text-slate-500">
                    {property.areaSqft && (
                      <span>{(property.areaSqft / 43560).toFixed(2)} acres</span>
                    )}
                    {property.layers && (
                      <span>{property.layers.filter(l => l.active).length} layers active</span>
                    )}
                    <span>Updated {formatDate(property.updatedAt)}</span>
                  </div>
                </div>

                {/* Feasibility Summary */}
                {property.feasibility && (
                  <div className="hidden sm:flex items-center gap-2">
                    {property.feasibility.items.slice(0, 3).map((item) => (
                      <span
                        key={item.id}
                        className={`px-2 py-1 text-xs font-medium rounded-lg ${
                          item.status === "pass"
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                            : item.status === "warn"
                            ? "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                            : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400"
                        }`}
                      >
                        {item.label.split(" ")[0]}
                      </span>
                    ))}
                  </div>
                )}

                {/* Arrow */}
                <svg 
                  className="w-5 h-5 text-slate-300 dark:text-slate-600 group-hover:text-slate-400 dark:group-hover:text-slate-500 group-hover:translate-x-1 transition-all" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

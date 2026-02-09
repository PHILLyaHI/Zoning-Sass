"use client";

import { useState } from "react";
import { ValidationResult, ValidationCheck, FeasibilityItem } from "../lib/types";

type ValidationPanelProps = {
  validationResult?: ValidationResult;
  feasibilityItems?: FeasibilityItem[];
};

export default function ValidationPanel({ validationResult, feasibilityItems }: ValidationPanelProps) {
  const [activeTab, setActiveTab] = useState<"feasibility" | "validation">("feasibility");
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pass":
        return (
          <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
            <svg className="w-3 h-3 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case "warn":
        return (
          <div className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
            <svg className="w-3 h-3 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01" />
            </svg>
          </div>
        );
      case "fail":
        return (
          <div className="w-5 h-5 rounded-full bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center">
            <svg className="w-3 h-3 text-rose-600 dark:text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
            <span className="text-slate-400 text-xs">?</span>
          </div>
        );
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "pass":
        return "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
      case "warn":
        return "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
      case "fail":
        return "bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400";
      default:
        return "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400";
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-700">
        <button
          onClick={() => setActiveTab("feasibility")}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === "feasibility"
              ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-blue-50/50 dark:bg-blue-900/20"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
        >
          Feasibility
        </button>
        <button
          onClick={() => setActiveTab("validation")}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === "validation"
              ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-blue-50/50 dark:bg-blue-900/20"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
        >
          Validation
        </button>
      </div>

      {/* Content */}
      <div className="p-4 max-h-[500px] overflow-y-auto">
        {activeTab === "feasibility" && feasibilityItems && (
          <div className="space-y-2">
            {feasibilityItems.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden"
              >
                <button
                  onClick={() => setExpandedItem(expandedItem === item.id ? null : item.id)}
                  className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  {getStatusIcon(item.status)}
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{item.label}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{item.summary}</p>
                  </div>
                  <svg
                    className={`w-4 h-4 text-slate-400 transition-transform ${expandedItem === item.id ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {expandedItem === item.id && (
                  <div className="px-3 pb-3 border-t border-slate-100 dark:border-slate-800 pt-3">
                    {item.detail && (
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{item.detail}</p>
                    )}
                    
                    {item.verificationNeeded && item.verificationNeeded.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs font-medium text-amber-600 dark:text-amber-400 mb-1">Verification Needed:</p>
                        <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                          {item.verificationNeeded.map((v, i) => (
                            <li key={i} className="flex items-center gap-1.5">
                              <span className="w-1 h-1 rounded-full bg-amber-400" />
                              {v}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {item.citations && item.citations.length > 0 && (
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                          Source: {item.citations.map(c => c.section ? `${c.source} §${c.section}` : c.source).join(", ")}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === "validation" && (
          <>
            {validationResult ? (
              <div className="space-y-4">
                {/* Summary */}
                <div className={`p-4 rounded-xl ${getStatusBadgeClass(validationResult.overallStatus)}`}>
                  <div className="flex items-center gap-3 mb-2">
                    {getStatusIcon(validationResult.overallStatus)}
                    <span className="font-semibold">
                      {validationResult.overallStatus === "pass" && "All Checks Passing"}
                      {validationResult.overallStatus === "warn" && "Review Required"}
                      {validationResult.overallStatus === "fail" && "Issues Found"}
                    </span>
                  </div>
                  <div className="flex gap-4 text-sm">
                    <span>{validationResult.summary.passingChecks} passed</span>
                    <span>{validationResult.summary.warningChecks} warnings</span>
                    <span>{validationResult.summary.failingChecks} failed</span>
                  </div>
                </div>

                {/* Checks */}
                <div className="space-y-2">
                  {validationResult.checks.map((check) => (
                    <div
                      key={check.checkId}
                      className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800"
                    >
                      {getStatusIcon(check.status)}
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                          {getRuleLabel(check.ruleType)}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {check.measuredValue !== undefined && check.measuredValue !== null
                            ? `${check.measuredValue}${check.unit === "percent" ? "%" : check.unit === "feet" ? "'" : ` ${check.unit || ""}`}`
                            : "—"
                          }
                          {check.requiredValue && ` / ${check.requiredValue}${check.unit === "percent" ? "%" : check.unit === "feet" ? "'" : ` ${check.unit || ""}`} required`}
                        </p>
                      </div>
                      {check.margin !== undefined && check.margin > 0 && (
                        <span className="text-xs text-emerald-600 dark:text-emerald-400">
                          +{check.margin}{check.unit === "feet" ? "'" : check.unit === "percent" ? "%" : ""}
                        </span>
                      )}
                      {check.excess !== undefined && check.excess > 0 && (
                        <span className="text-xs text-rose-600 dark:text-rose-400">
                          -{check.excess}{check.unit === "feet" ? "'" : check.unit === "percent" ? "%" : ""}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                <svg className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="font-medium">No structures added yet</p>
                <p className="text-sm mt-1">Add structures to validate against zoning rules</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function getRuleLabel(ruleType: string): string {
  const labels: Record<string, string> = {
    setback_front: "Front Setback",
    setback_side: "Side Setback",
    setback_rear: "Rear Setback",
    setback_street_side: "Street Side Setback",
    height_max: "Maximum Height",
    height_max_accessory: "Accessory Height",
    lot_coverage_max: "Lot Coverage",
    impervious_coverage_max: "Impervious Coverage",
    far_max: "Floor Area Ratio",
    far_min: "Minimum FAR",
    lot_size_min: "Minimum Lot Size",
    lot_width_min: "Minimum Lot Width",
    adu_size_max: "ADU Size Limit",
    structure_separation: "Structure Separation",
    accessory_setback: "Accessory Setback",
  };
  return labels[ruleType] || ruleType.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
}




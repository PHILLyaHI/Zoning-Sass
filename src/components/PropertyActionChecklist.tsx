"use client";

import { useState } from "react";
import {
  PropertyActionItem,
  ActionStatus,
  ActionCategory,
  CATEGORY_LABELS,
  groupChecklistByCategory,
} from "../lib/actionChecklist";

// ============================================
// STATUS PILL
// ============================================

function ActionStatusPill({ status }: { status: ActionStatus }) {
  const config = {
    ALLOWED: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-400", label: "Allowed" },
    CONDITIONAL: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-400", label: "Conditional" },
    RESTRICTED: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", dot: "bg-red-400", label: "Restricted" },
    UNKNOWN: { bg: "bg-gray-50", text: "text-gray-500", border: "border-gray-200", dot: "bg-gray-400", label: "Unknown" },
  };
  const c = config[status];

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold ${c.bg} ${c.text} ${c.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}

// ============================================
// CONFIDENCE BADGE
// ============================================

function ConfidenceBadge({ level }: { level: "HIGH" | "MEDIUM" | "LOW" }) {
  const config = {
    HIGH: { color: "text-emerald-600", bg: "bg-emerald-50", label: "High confidence" },
    MEDIUM: { color: "text-amber-600", bg: "bg-amber-50", label: "Medium confidence" },
    LOW: { color: "text-gray-500", bg: "bg-gray-50", label: "Low confidence" },
  };
  const c = config[level];

  return (
    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${c.color} ${c.bg}`}>
      {c.label}
    </span>
  );
}

// ============================================
// STATUS ICON
// ============================================

function StatusIconLarge({ status }: { status: ActionStatus }) {
  if (status === "ALLOWED") {
    return (
      <div className="w-8 h-8 rounded-full bg-emerald-100 grid place-items-center flex-shrink-0">
        <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      </div>
    );
  }
  if (status === "CONDITIONAL") {
    return (
      <div className="w-8 h-8 rounded-full bg-amber-100 grid place-items-center flex-shrink-0">
        <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01M12 3l9.66 16.5H2.34L12 3z" />
        </svg>
      </div>
    );
  }
  if (status === "RESTRICTED") {
    return (
      <div className="w-8 h-8 rounded-full bg-red-100 grid place-items-center flex-shrink-0">
        <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
    );
  }
  return (
    <div className="w-8 h-8 rounded-full bg-gray-100 grid place-items-center flex-shrink-0">
      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01" />
      </svg>
    </div>
  );
}

// ============================================
// CATEGORY ICONS
// ============================================

const CATEGORY_ICON_MAP: Record<ActionCategory, JSX.Element> = {
  residential: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </svg>
  ),
  accessory: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
    </svg>
  ),
  lot: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
    </svg>
  ),
  utilities: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
    </svg>
  ),
  environmental: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  ),
  permits: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
    </svg>
  ),
};

// ============================================
// MAIN COMPONENT
// ============================================

type Props = {
  items: PropertyActionItem[];
};

export default function PropertyActionChecklist({ items }: Props) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const grouped = groupChecklistByCategory(items);

  const toggleExpand = (id: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Summary counts
  const allowed = items.filter((i) => i.status === "ALLOWED").length;
  const conditional = items.filter((i) => i.status === "CONDITIONAL").length;
  const restricted = items.filter((i) => i.status === "RESTRICTED").length;
  const unknown = items.filter((i) => i.status === "UNKNOWN").length;

  const categoryOrder: ActionCategory[] = [
    "residential", "accessory", "lot", "utilities", "environmental", "permits",
  ];

  return (
    <div>
      {/* Summary Bar */}
      <div className="flex items-center gap-4 mb-6 text-[12px]">
        <span className="flex items-center gap-1.5 text-emerald-600">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          {allowed} Allowed
        </span>
        <span className="flex items-center gap-1.5 text-amber-600">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          {conditional} Conditional
        </span>
        <span className="flex items-center gap-1.5 text-red-600">
          <span className="w-2 h-2 rounded-full bg-red-400" />
          {restricted} Restricted
        </span>
        {unknown > 0 && (
          <span className="flex items-center gap-1.5 text-gray-500">
            <span className="w-2 h-2 rounded-full bg-gray-400" />
            {unknown} Unknown
          </span>
        )}
      </div>

      {/* Categories */}
      {categoryOrder.map((category) => {
        const categoryItems = grouped[category];
        if (!categoryItems || categoryItems.length === 0) return null;

        return (
          <div key={category} className="mb-6">
            {/* Category Header */}
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-lg bg-[#f5f5f7] grid place-items-center text-[#6e6e73]">
                {CATEGORY_ICON_MAP[category]}
              </div>
              <h3 className="text-[14px] font-semibold text-[#86868b] uppercase tracking-wider">
                {CATEGORY_LABELS[category]}
              </h3>
            </div>

            {/* Action Cards */}
            <div className="space-y-3">
              {categoryItems.map((item) => {
                const isExpanded = expandedItems.has(item.id);
                const hasDetails = !!(
                  item.conditions?.length ||
                  item.blockingFactors?.length ||
                  item.nextSteps?.length ||
                  item.citations?.length ||
                  item.dataGaps?.length
                );

                return (
                  <button
                    key={item.id}
                    onClick={() => hasDetails && toggleExpand(item.id)}
                    className={`w-full text-left bg-white rounded-2xl border p-5 transition-all duration-200 ${
                      hasDetails ? "hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] cursor-pointer" : "cursor-default"
                    } ${
                      item.status === "RESTRICTED"
                        ? "border-red-100"
                        : item.status === "CONDITIONAL"
                        ? "border-amber-100"
                        : "border-[#f0f0f2]"
                    } shadow-[0_4px_12px_rgba(0,0,0,0.03)]`}
                  >
                    {/* Header Row */}
                    <div className="flex items-start gap-3">
                      <StatusIconLarge status={item.status} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-[15px] font-semibold text-[#1d1d1f]">
                            {item.actionName}
                          </span>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <ConfidenceBadge level={item.confidence} />
                            <ActionStatusPill status={item.status} />
                          </div>
                        </div>
                        <p className="text-[13px] text-[#6e6e73] leading-relaxed">
                          {item.summary}
                        </p>
                      </div>
                      {hasDetails && (
                        <svg
                          className={`w-4 h-4 text-[#c7c7cc] flex-shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      )}
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-[#f5f5f7] space-y-4 ml-11">
                        {/* Conditions */}
                        {item.conditions && item.conditions.length > 0 && (
                          <div>
                            <div className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider mb-2">
                              Conditions
                            </div>
                            <ul className="space-y-1.5">
                              {item.conditions.map((c, i) => (
                                <li key={i} className="flex items-start gap-2 text-[12px] text-[#6e6e73]">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                                  {c}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Blocking Factors */}
                        {item.blockingFactors && item.blockingFactors.length > 0 && (
                          <div>
                            <div className="text-[11px] font-semibold text-red-700 uppercase tracking-wider mb-2">
                              Blocking Factors
                            </div>
                            <ul className="space-y-1.5">
                              {item.blockingFactors.map((b, i) => (
                                <li key={i} className="flex items-start gap-2 text-[12px] text-[#6e6e73]">
                                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
                                  {b}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Next Steps */}
                        {item.nextSteps && item.nextSteps.length > 0 && (
                          <div>
                            <div className="text-[11px] font-semibold text-[#0071e3] uppercase tracking-wider mb-2">
                              Next Steps
                            </div>
                            <ol className="space-y-1.5">
                              {item.nextSteps.map((step, i) => (
                                <li key={i} className="flex items-start gap-2 text-[12px] text-[#6e6e73]">
                                  <span className="w-5 h-5 rounded-full bg-[#0071e3]/10 text-[#0071e3] grid place-items-center text-[10px] font-bold flex-shrink-0 mt-0.5">
                                    {i + 1}
                                  </span>
                                  {step}
                                </li>
                              ))}
                            </ol>
                          </div>
                        )}

                        {/* Citations */}
                        {item.citations && item.citations.length > 0 && (
                          <div>
                            <div className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wider mb-2">
                              Citations
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {item.citations.map((c, i) => (
                                <span
                                  key={i}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#f5f5f7] rounded-full text-[11px] text-[#0071e3]"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
                                  </svg>
                                  {c.source}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Data Gaps */}
                        {item.dataGaps && item.dataGaps.length > 0 && (
                          <div className="bg-amber-50/50 rounded-xl p-3 border border-amber-100">
                            <div className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider mb-1.5">
                              Data Gaps
                            </div>
                            {item.dataGaps.map((gap, i) => (
                              <div key={i} className="text-[12px] text-amber-700 flex items-start gap-2">
                                <svg className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                                </svg>
                                {gap}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

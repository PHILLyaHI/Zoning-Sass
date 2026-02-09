"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useCredits } from "../../contexts/CreditContext";
import { CREDIT_PACKS } from "../../lib/credits";

const includedFeatures = [
  "Zoning district identification",
  "Setback, height, coverage & FAR validation",
  "Utility & sewer availability check",
  "Septic feasibility assessment",
  "Environmental & hazard flags",
  "Visual buildable area map",
  "All results citation-backed",
  "Exportable PDF report",
  "AI explanation assistant",
];

export default function PricingPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { buyPack, balance } = useCredits();
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastPurchase, setLastPurchase] = useState<{ credits: number; balance: number } | null>(null);

  const handleBuy = async (packId: string) => {
    if (!isAuthenticated) {
      router.push("/signup?redirect=/pricing");
      return;
    }

    setPurchasing(packId);
    await new Promise((r) => setTimeout(r, 1200));
    const result = await buyPack(packId);
    setPurchasing(null);

    if (result.success) {
      const pack = CREDIT_PACKS.find((p) => p.id === packId);
      setLastPurchase({ credits: pack?.credits ?? 0, balance: result.newBalance });
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F9FC]">
      {/* Header */}
      <div className="bg-white border-b border-[#e8e8ed]">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-[18px] font-semibold text-[#1d1d1f] tracking-tight">
            Property Risk Snapshot
            <span className="text-[10px] align-super ml-0.5 text-[#86868b]">TM</span>
          </Link>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <span className="text-[13px] text-[#86868b]">
                  Balance: <strong className="text-[#1d1d1f]">{balance}</strong>
                </span>
                <Link
                  href="/app/properties"
                  className="px-4 py-2 bg-[#0071e3] text-white rounded-full text-[13px] font-medium hover:bg-[#0077ed] transition-colors"
                >
                  Dashboard
                </Link>
              </>
            ) : (
              <Link
                href="/login"
                className="px-4 py-2 bg-[#0071e3] text-white rounded-full text-[13px] font-medium hover:bg-[#0077ed] transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-16">
        {/* Success Toast */}
        {showSuccess && lastPurchase && (
          <div className="mb-8 p-5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-4 slide-up">
            <div className="w-10 h-10 rounded-full bg-emerald-100 grid place-items-center flex-shrink-0">
              <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <div className="text-[15px] font-semibold text-emerald-900">
                {lastPurchase.credits} {lastPurchase.credits === 1 ? "credit" : "credits"} added!
              </div>
              <div className="text-[13px] text-emerald-700">
                Your new balance is {lastPurchase.balance} credits.
              </div>
            </div>
            <Link
              href="/"
              className="ml-auto px-5 py-2 bg-emerald-600 text-white rounded-full text-[13px] font-semibold hover:bg-emerald-700 transition-colors"
            >
              Run a Snapshot
            </Link>
          </div>
        )}

        {/* Headline */}
        <div className="text-center mb-14">
          <h1 className="text-[48px] font-light tracking-tight text-[#1d1d1f] mb-4">
            Research properties on your terms.
          </h1>
          <p className="text-[19px] text-[#86868b] font-light max-w-2xl mx-auto">
            Buy credits. Use them anytime. No subscriptions.
          </p>
        </div>

        {/* Credit Packs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {CREDIT_PACKS.map((pack) => (
            <div
              key={pack.id}
              className={`relative bg-white rounded-[24px] border-2 overflow-hidden transition-all duration-200 hover:shadow-lg ${
                pack.popular
                  ? "border-[#0071e3] shadow-[0_0_0_1px_rgba(0,113,227,0.1)]"
                  : "border-[#e8e8ed] hover:border-[#d2d2d7]"
              }`}
            >
              {pack.popular && (
                <div className="bg-[#0071e3] text-white text-center py-2 text-[12px] font-bold uppercase tracking-wider">
                  Most Popular
                </div>
              )}

              <div className="p-7">
                {pack.badge && !pack.popular && (
                  <span className="inline-block mb-3 px-3 py-1 bg-[#1d1d1f] text-white text-[10px] font-bold rounded-full uppercase tracking-wide">
                    {pack.badge}
                  </span>
                )}

                <div className="text-[14px] font-medium text-[#86868b] mb-1">{pack.name}</div>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-[48px] font-bold text-[#1d1d1f] tracking-tight leading-none">
                    {pack.credits}
                  </span>
                  <span className="text-[15px] text-[#86868b]">
                    {pack.credits === 1 ? "Snapshot" : "Snapshots"}
                  </span>
                </div>
                <div className="text-[32px] font-bold text-[#1d1d1f] mb-1">${pack.priceUsd}</div>
                <div className="text-[13px] text-[#86868b] mb-6">
                  ${pack.pricePerCredit.toFixed(0)} per snapshot
                </div>

                <button
                  onClick={() => handleBuy(pack.id)}
                  disabled={purchasing !== null}
                  className={`w-full py-3.5 rounded-full text-[15px] font-semibold transition-all duration-200 active:scale-[0.97] disabled:opacity-50 ${
                    pack.popular
                      ? "bg-[#0071e3] text-white hover:bg-[#0077ed]"
                      : "bg-[#f5f5f7] text-[#1d1d1f] hover:bg-[#e8e8ed]"
                  }`}
                >
                  {purchasing === pack.id ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    "Buy Pack"
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Notes */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-6 text-[13px] text-[#86868b]">
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Credits never expire
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              1 credit = 1 full report
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Includes map + rules + export
            </span>
          </div>
        </div>

        {/* What's Included */}
        <div className="bg-white rounded-[24px] shadow-[0_8px_32px_rgba(0,0,0,0.04)] border border-[#f0f0f2] p-10 mb-16">
          <h2 className="text-[28px] font-light tracking-tight text-[#1d1d1f] mb-6 text-center">
            Every snapshot includes
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {includedFeatures.map((feature) => (
              <div key={feature} className="flex items-center gap-3">
                <svg className="w-5 h-5 text-[#34c759] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-[14px] text-[#1d1d1f] font-light">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto">
          <h2 className="text-[28px] font-light tracking-tight text-[#1d1d1f] mb-8 text-center">
            Frequently asked questions
          </h2>

          <div className="space-y-5">
            {[
              {
                q: "What is a Property Risk Snapshot?",
                a: "It's a comprehensive report that aggregates zoning, utilities, environmental data, and public city & county records into one visual dashboard for any property address. Think of it like Carfax, but for land and buildability.",
              },
              {
                q: "Do credits expire?",
                a: "No. Credits never expire. Buy them when you need them, use them whenever you're ready.",
              },
              {
                q: "What data sources do you use?",
                a: "We use public county GIS data, USDA soil surveys, FEMA flood maps, NWI wetlands data, and local zoning ordinances. Every result cites its data source.",
              },
              {
                q: "Is this legal advice?",
                a: "No. This is informational analysis based on public records. All outputs cite their sources, but local jurisdictions make final determinations. We recommend consulting professionals for significant decisions.",
              },
              {
                q: "What if data is missing?",
                a: "We clearly label any missing information as a 'Data Gap' and recommend the specific next verification step. We never guess or imply certainty without citations.",
              },
            ].map((item) => (
              <div key={item.q} className="bg-white rounded-2xl border border-[#f0f0f2] p-6 shadow-sm">
                <h3 className="text-[16px] font-semibold text-[#1d1d1f] mb-2">{item.q}</h3>
                <p className="text-[14px] text-[#86868b] font-light leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-16 pt-10 border-t border-[#f0f0f2]">
          <p className="text-[13px] text-[#c7c7cc]">
            Property Risk Snapshot™ — Rule-based. Citation-backed. No guessing.
          </p>
          <div className="flex items-center justify-center gap-6 mt-3 text-[13px] text-[#86868b]">
            <Link href="/" className="hover:text-[#1d1d1f] transition-colors">Home</Link>
            <Link href="/how-it-works" className="hover:text-[#1d1d1f] transition-colors">How It Works</Link>
            <Link href="/faq" className="hover:text-[#1d1d1f] transition-colors">FAQ</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";
import { useCredits } from "../../contexts/CreditContext";

export default function CreditsPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { balance, packs, transactions, snapshots, buyPack } = useCredits();
  const [purchasingPack, setPurchasingPack] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastPurchase, setLastPurchase] = useState<{ credits: number; balance: number } | null>(null);

  if (!isAuthenticated) {
    router.push("/login");
    return null;
  }

  const handlePurchase = async (packId: string) => {
    setPurchasingPack(packId);
    await new Promise((r) => setTimeout(r, 1200));
    const result = await buyPack(packId);
    setPurchasingPack(null);

    if (result.success) {
      const pack = packs.find((p) => p.id === packId);
      setLastPurchase({ credits: pack?.credits ?? 0, balance: result.newBalance });
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 4000);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F9FC]">
      {/* Header */}
      <div className="bg-white border-b border-[#e8e8ed]">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-[#0071e3] text-[15px] hover:underline">
              ← Home
            </Link>
            <span className="text-[#d2d2d7]">/</span>
            <h1 className="text-[22px] font-semibold text-[#1d1d1f]">Credits</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#0071e3]/10 to-[#34c759]/10 rounded-full border border-[#0071e3]/20">
              <svg className="w-5 h-5 text-[#0071e3]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
              </svg>
              <span className="text-[20px] font-bold text-[#1d1d1f]">{balance}</span>
              <span className="text-[14px] text-[#86868b]">credits available</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10">
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

        {/* Credit Packs */}
        <div className="mb-12">
          <h2 className="text-[28px] font-semibold text-[#1d1d1f] mb-2">Buy Credits</h2>
          <p className="text-[15px] text-[#86868b] mb-8">
            1 credit = 1 Property Risk Snapshot. Credits never expire.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {packs.map((pack) => (
              <div
                key={pack.id}
                className={`relative bg-white rounded-[20px] border-2 p-6 transition-all duration-200 hover:shadow-lg ${
                  pack.popular
                    ? "border-[#0071e3] shadow-[0_0_0_1px_rgba(0,113,227,0.1)]"
                    : "border-[#e8e8ed] hover:border-[#d2d2d7]"
                }`}
              >
                {pack.badge && (
                  <span
                    className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-[11px] font-bold rounded-full uppercase tracking-wide ${
                      pack.popular
                        ? "bg-[#0071e3] text-white"
                        : "bg-[#1d1d1f] text-white"
                    }`}
                  >
                    {pack.badge}
                  </span>
                )}

                <div className="text-center mb-6 pt-2">
                  <div className="text-[15px] font-medium text-[#86868b] mb-1">{pack.name}</div>
                  <div className="text-[42px] font-bold text-[#1d1d1f] leading-none">{pack.credits}</div>
                  <div className="text-[13px] text-[#86868b] mt-1">
                    {pack.credits === 1 ? "Snapshot" : "Snapshots"}
                  </div>
                </div>

                <div className="text-center mb-6">
                  <div className="text-[28px] font-bold text-[#1d1d1f]">${pack.priceUsd}</div>
                  <div className="text-[12px] text-[#86868b]">${pack.pricePerCredit.toFixed(0)} per snapshot</div>
                </div>

                <button
                  onClick={() => handlePurchase(pack.id)}
                  disabled={purchasingPack !== null}
                  className={`w-full py-3 rounded-full text-[14px] font-semibold transition-all duration-200 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed ${
                    pack.popular
                      ? "bg-[#0071e3] text-white hover:bg-[#0077ed]"
                      : "bg-[#f5f5f7] text-[#1d1d1f] hover:bg-[#e8e8ed]"
                  }`}
                >
                  {purchasingPack === pack.id ? (
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
            ))}
          </div>
        </div>

        {/* Usage History */}
        <div>
          <h2 className="text-[22px] font-semibold text-[#1d1d1f] mb-6">Usage History</h2>

          {transactions.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#e8e8ed] p-10 text-center">
              <div className="w-14 h-14 rounded-full bg-[#f5f5f7] mx-auto mb-4 grid place-items-center">
                <svg className="w-7 h-7 text-[#86868b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="text-[15px] text-[#86868b]">No transactions yet</div>
              <div className="text-[13px] text-[#c7c7cc] mt-1">
                Buy credits and run your first Property Risk Snapshot
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[#e8e8ed] overflow-hidden">
              <div className="divide-y divide-[#f5f5f7]">
                {transactions.map((tx) => (
                  <div key={tx.id} className="px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-9 h-9 rounded-full grid place-items-center ${
                          tx.type === "purchase" || tx.type === "welcome_bonus"
                            ? "bg-emerald-50"
                            : tx.type === "usage"
                            ? "bg-blue-50"
                            : "bg-[#f5f5f7]"
                        }`}
                      >
                        {tx.type === "purchase" || tx.type === "welcome_bonus" ? (
                          <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 text-[#0071e3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <div className="text-[14px] font-medium text-[#1d1d1f]">
                          {tx.type === "purchase"
                            ? `Purchased ${tx.packName}`
                            : tx.type === "welcome_bonus"
                            ? "Welcome Bonus"
                            : tx.type === "usage"
                            ? `Snapshot — ${(tx.metadata as Record<string, string>)?.address || "Unknown"}`
                            : tx.type}
                        </div>
                        <div className="text-[12px] text-[#86868b]">
                          {new Date(tx.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {tx.amountUsd && (
                        <span className="text-[13px] text-[#86868b]">${tx.amountUsd}</span>
                      )}
                      <span
                        className={`text-[14px] font-semibold ${
                          tx.creditsDelta > 0 ? "text-emerald-600" : "text-[#1d1d1f]"
                        }`}
                      >
                        {tx.creditsDelta > 0 ? "+" : ""}
                        {tx.creditsDelta} {Math.abs(tx.creditsDelta) === 1 ? "credit" : "credits"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

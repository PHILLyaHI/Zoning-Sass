"use client";

import { useState } from "react";
import { useCredits } from "../contexts/CreditContext";
import { useRouter } from "next/navigation";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onCredited?: () => void;
};

export function CreditGateModal({ isOpen, onClose, onCredited }: Props) {
  const { packs, buyPack, balance } = useCredits();
  const [selectedPack, setSelectedPack] = useState("investor");
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const router = useRouter();

  if (!isOpen) return null;

  const handlePurchase = async () => {
    setIsPurchasing(true);
    // Simulate Stripe processing delay
    await new Promise((r) => setTimeout(r, 1200));
    const result = await buyPack(selectedPack);
    setIsPurchasing(false);

    if (result.success) {
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        onClose();
        onCredited?.();
      }, 1800);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-[24px] shadow-[0_24px_64px_rgba(0,0,0,0.12)] max-w-lg w-full overflow-hidden">
        {showSuccess ? (
          /* Success State */
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-50 mx-auto mb-4 grid place-items-center">
              <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-[22px] font-semibold text-[#1d1d1f] mb-2">Credits Added</h3>
            <p className="text-[15px] text-[#86868b]">
              Your new balance: <span className="font-semibold text-[#1d1d1f]">{balance} credits</span>
            </p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="p-8 pb-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-[22px] font-semibold text-[#1d1d1f]">
                    Get Credits to Continue
                  </h2>
                  <p className="text-[15px] text-[#86868b] mt-1">
                    You need 1 credit to run a Property Risk Snapshot.
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-[#f5f5f7] hover:bg-[#e8e8ed] grid place-items-center transition-colors"
                >
                  <svg className="w-4 h-4 text-[#86868b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {balance > 0 && (
                <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-[#f5f5f7] rounded-full">
                  <span className="text-[13px] text-[#86868b]">Current balance:</span>
                  <span className="text-[13px] font-semibold text-[#1d1d1f]">{balance}</span>
                </div>
              )}
            </div>

            {/* Pack Selector */}
            <div className="px-8 pb-4 grid grid-cols-2 gap-3">
              {packs.map((pack) => (
                <button
                  key={pack.id}
                  onClick={() => setSelectedPack(pack.id)}
                  className={`relative p-4 rounded-2xl border-2 text-left transition-all duration-200 ${
                    selectedPack === pack.id
                      ? "border-[#0071e3] bg-[#0071e3]/[0.03]"
                      : "border-[#e8e8ed] hover:border-[#d2d2d7]"
                  }`}
                >
                  {pack.badge && (
                    <span className="absolute -top-2 right-3 px-2 py-0.5 bg-[#0071e3] text-white text-[10px] font-semibold rounded-full uppercase tracking-wide">
                      {pack.badge}
                    </span>
                  )}
                  <div className="text-[22px] font-semibold text-[#1d1d1f]">
                    {pack.credits}
                  </div>
                  <div className="text-[13px] text-[#86868b]">
                    {pack.credits === 1 ? "Snapshot" : "Snapshots"}
                  </div>
                  <div className="text-[17px] font-semibold text-[#1d1d1f] mt-2">
                    ${pack.priceUsd}
                  </div>
                  <div className="text-[11px] text-[#86868b]">
                    ${pack.pricePerCredit.toFixed(0)}/each
                  </div>
                </button>
              ))}
            </div>

            {/* Footer */}
            <div className="p-8 pt-4 border-t border-[#f5f5f7]">
              <button
                onClick={handlePurchase}
                disabled={isPurchasing}
                className="w-full py-3.5 bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-full text-[15px] font-semibold transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98]"
              >
                {isPurchasing ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Processing...
                  </span>
                ) : (
                  `Buy ${packs.find((p) => p.id === selectedPack)?.credits} Credits — $${packs.find((p) => p.id === selectedPack)?.priceUsd}`
                )}
              </button>
              <button
                onClick={onClose}
                className="w-full py-2.5 text-[15px] text-[#86868b] hover:text-[#1d1d1f] mt-2 transition-colors"
              >
                Not now
              </button>
              <p className="text-[11px] text-[#86868b] text-center mt-3">
                Credits never expire. 1 credit = 1 Property Risk Snapshot.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

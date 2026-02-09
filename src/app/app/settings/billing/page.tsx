"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "../../../../contexts/AuthContext";
import Card from "../../../../components/Card";

export default function BillingPage() {
  const router = useRouter();
  const { user, hasSubscription, trialDaysRemaining, upgrade } = useAuth();

  const handleUpgrade = async () => {
    // In production, this would redirect to Stripe Checkout
    const result = await upgrade();
    if (result.success) {
      router.refresh();
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "N/A";
    return date.toLocaleDateString("en-US", { 
      year: "numeric", 
      month: "long", 
      day: "numeric" 
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[40px] font-light tracking-tight text-[#1d1d1f] mb-2">Billing</h1>
        <p className="text-[17px] text-[#86868b] font-light">Manage your subscription and billing.</p>
      </div>

      {/* Current Plan */}
      <Card title="Current Plan">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[19px] font-medium text-[#1d1d1f]">
                {hasSubscription ? "Pro Plan" : "Free Trial"}
              </div>
              {hasSubscription ? (
                <div className="text-[15px] text-[#86868b] font-light">
                  $99/month · Renews {formatDate(user?.subscription.currentPeriodEnd || null)}
                </div>
              ) : trialDaysRemaining !== null ? (
                <div className="text-[15px] text-amber-600 font-light">
                  {trialDaysRemaining} days remaining in trial
                </div>
              ) : (
                <div className="text-[15px] text-red-600 font-light">
                  Trial expired
                </div>
              )}
            </div>
            
            {hasSubscription ? (
              <span className="px-3 py-1 rounded-full bg-[#34c759]/10 text-[#34c759] text-[13px] font-medium">
                Active
              </span>
            ) : (
              <button
                onClick={handleUpgrade}
                className="btn-primary px-6 py-2 text-[15px] font-medium active:scale-95"
              >
                Upgrade to Pro
              </button>
            )}
          </div>
          
          {hasSubscription && (
            <div className="pt-4 border-t border-[#f5f5f7]">
              <button className="text-[15px] text-red-600 hover:underline">
                Cancel subscription
              </button>
            </div>
          )}
        </div>
      </Card>

      {/* Plan Features */}
      <Card title="Plan Features">
        <ul className="space-y-3">
          {[
            "Unlimited property searches",
            "Zoning analysis with citations",
            "Septic & utilities assessment",
            "Environmental overlay detection",
            "AI-powered Q&A with sources",
            "Structure placement tool",
            "Real-time validation",
            "Downloadable reports",
            "Priority support",
          ].map((feature, idx) => (
            <li key={idx} className="flex items-center gap-3">
              <svg className="w-5 h-5 text-[#34c759] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-[15px] text-[#1d1d1f]">{feature}</span>
            </li>
          ))}
        </ul>
      </Card>

      {/* Payment Method */}
      {hasSubscription && (
        <Card title="Payment Method">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-8 bg-[#1d1d1f] rounded-[4px] flex items-center justify-center text-white text-[10px] font-bold">
                VISA
              </div>
              <div>
                <div className="text-[15px] text-[#1d1d1f]">•••• •••• •••• 4242</div>
                <div className="text-[13px] text-[#86868b]">Expires 12/2027</div>
              </div>
            </div>
            <button className="text-[15px] text-[#0071e3] hover:underline">
              Update
            </button>
          </div>
        </Card>
      )}

      {/* Billing History */}
      {hasSubscription && (
        <Card title="Billing History">
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <div>
                <div className="text-[15px] text-[#1d1d1f]">Pro Plan - Monthly</div>
                <div className="text-[13px] text-[#86868b]">January 19, 2026</div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-[15px] text-[#1d1d1f]">$99.00</span>
                <button className="text-[15px] text-[#0071e3] hover:underline">
                  Download
                </button>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}


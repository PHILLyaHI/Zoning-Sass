"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";

const features = [
  "Unlimited property searches",
  "Zoning analysis with citations",
  "Septic & utilities assessment",
  "Environmental overlay detection",
  "AI-powered Q&A with sources",
  "Structure placement tool",
  "Real-time validation",
  "Downloadable reports",
  "Priority support",
];

export default function PricingPage() {
  const router = useRouter();
  const { isAuthenticated, upgrade, hasSubscription } = useAuth();

  const handleSubscribe = async () => {
    if (!isAuthenticated) {
      router.push("/signup");
      return;
    }
    
    // In production, this would redirect to Stripe Checkout
    const result = await upgrade();
    if (result.success) {
      router.push("/app/properties");
    }
  };

  return (
    <div className="dashboard-shell min-h-screen px-4 py-12 fade-in">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="inline-block mb-8 text-[#0071e3] text-[15px] font-light hover:underline">
          ← Back to home
        </Link>
        
        <div className="text-center mb-12">
          <h1 className="text-[48px] font-light tracking-tight text-[#1d1d1f] mb-4">
            Simple, transparent pricing
          </h1>
          <p className="text-[19px] text-[#86868b] font-light max-w-2xl mx-auto">
            One plan with everything you need to understand any property.
            Start with a 14-day free trial.
          </p>
        </div>

        <div className="bg-white rounded-[28px] shadow-[0_8px_32px_rgba(0,0,0,0.06)] border border-[rgba(0,0,0,0.06)] overflow-hidden slide-up max-w-xl mx-auto">
          {/* Header */}
          <div className="bg-gradient-to-br from-[#0071e3] to-[#0077ed] p-8 text-white text-center">
            <div className="text-[15px] font-medium uppercase tracking-wide mb-2 opacity-80">
              Pro Plan
            </div>
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-[64px] font-light tracking-tight">$99</span>
              <span className="text-[19px] font-light opacity-80">/month</span>
            </div>
            <div className="text-[15px] font-light opacity-80 mt-2">
              Billed monthly · Cancel anytime
            </div>
          </div>
          
          {/* Features */}
          <div className="p-8">
            <ul className="space-y-4 mb-8">
              {features.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-[#34c759] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-[15px] text-[#1d1d1f] font-light">{feature}</span>
                </li>
              ))}
            </ul>
            
            <button 
              onClick={handleSubscribe}
              className="w-full btn-primary py-4 text-[17px] font-medium active:scale-[0.98]"
            >
              {isAuthenticated && hasSubscription 
                ? "You're subscribed" 
                : isAuthenticated 
                  ? "Subscribe now" 
                  : "Start 14-day free trial"
              }
            </button>
            
            <p className="text-[13px] text-[#86868b] font-light mt-4 text-center">
              No credit card required for trial. Cancel anytime.
            </p>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-16 max-w-2xl mx-auto">
          <h2 className="text-[28px] font-light tracking-tight text-[#1d1d1f] mb-8 text-center">
            Frequently asked questions
          </h2>
          
          <div className="space-y-6">
            <div className="card p-6">
              <h3 className="text-[17px] font-medium text-[#1d1d1f] mb-2">
                What happens after my trial ends?
              </h3>
              <p className="text-[15px] text-[#86868b] font-light">
                Your trial lasts 14 days with full access to all features. After that, 
                you'll need to subscribe to continue using the platform. We'll send 
                you a reminder before your trial expires.
              </p>
            </div>
            
            <div className="card p-6">
              <h3 className="text-[17px] font-medium text-[#1d1d1f] mb-2">
                Can I cancel anytime?
              </h3>
              <p className="text-[15px] text-[#86868b] font-light">
                Yes, you can cancel your subscription at any time. You'll continue 
                to have access until the end of your current billing period.
              </p>
            </div>
            
            <div className="card p-6">
              <h3 className="text-[17px] font-medium text-[#1d1d1f] mb-2">
                What jurisdictions are covered?
              </h3>
              <p className="text-[15px] text-[#86868b] font-light">
                We're continuously expanding coverage. Currently, we have detailed 
                zoning data for major US counties. If your jurisdiction isn't covered, 
                you'll see a notice and can request it to be added.
              </p>
            </div>
            
            <div className="card p-6">
              <h3 className="text-[17px] font-medium text-[#1d1d1f] mb-2">
                Is this legal advice?
              </h3>
              <p className="text-[15px] text-[#86868b] font-light">
                No. Our platform provides informational analysis based on public data. 
                All outputs cite their sources, but final determinations are made by 
                local jurisdictions. We recommend consulting professionals for 
                significant decisions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



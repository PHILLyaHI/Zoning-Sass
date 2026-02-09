"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";

const features = [
  {
    icon: "buildability",
    title: "Buildability Snapshot",
    description:
      "Setbacks, height limits, lot coverage, FAR — all validated against local ordinances with pass/warning/restriction indicators.",
    color: "from-emerald-500 to-teal-600",
    bgLight: "bg-emerald-50",
  },
  {
    icon: "map",
    title: "Visual Buildable Area",
    description:
      "See your parcel boundary with setbacks and buffers applied. The buildable zone is highlighted so you know exactly where you can place structures.",
    color: "from-blue-500 to-indigo-600",
    bgLight: "bg-blue-50",
  },
  {
    icon: "citation",
    title: "Zoning Rules with Citations",
    description:
      "Every rule check shows measured vs required values with a citation badge linking directly to the relevant ordinance section.",
    color: "from-violet-500 to-purple-600",
    bgLight: "bg-violet-50",
  },
  {
    icon: "utilities",
    title: "Utilities & Septic Risk",
    description:
      "Sewer availability check, septic soil analysis (USDA SSURGO), system type guidance, and estimated cost ranges.",
    color: "from-cyan-500 to-blue-600",
    bgLight: "bg-cyan-50",
  },
  {
    icon: "environmental",
    title: "Environmental & Hazard Flags",
    description:
      "Flood zones, wetlands and buffers, steep slopes, and sensitive areas — all flagged with clear status indicators.",
    color: "from-amber-500 to-orange-600",
    bgLight: "bg-amber-50",
  },
  {
    icon: "report",
    title: "Exportable Report",
    description:
      "Download a shareable PDF report. Perfect for buyers, agents, builders, and lenders to make informed decisions.",
    color: "from-rose-500 to-pink-600",
    bgLight: "bg-rose-50",
  },
];

const audiences = [
  { label: "Buyers & Investors", desc: "Avoid costly surprises before you commit" },
  { label: "Real Estate Agents", desc: "Instant due diligence for your clients" },
  { label: "Builders & Designers", desc: "Early feasibility clarity before design" },
];

const FEATURE_ICONS: Record<string, JSX.Element> = {
  buildability: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.745 3.745 0 011.043 3.296A3.745 3.745 0 0121 12z" />
    </svg>
  ),
  map: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
    </svg>
  ),
  citation: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  ),
  utilities: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
    </svg>
  ),
  environmental: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
  ),
  report: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
  ),
};

export default function LandingPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      if (isAuthenticated) {
        router.push(`/snapshot/${encodeURIComponent(searchQuery.trim())}`);
      } else {
        router.push(`/signup?redirect=/snapshot/${encodeURIComponent(searchQuery.trim())}`);
      }
    }
  };

  return (
    <div className="min-h-screen w-full relative overflow-hidden">
      {/* ===== HERO SECTION ===== */}
      <div
        className="relative text-white"
        style={{
          backgroundImage: "url(/images/house-bg.jpg)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/55 to-black/80" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(0,0,0,0.3)_100%)]" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-8 lg:py-16">
          {/* Navigation */}
          <nav className="flex items-center justify-between mb-12 lg:mb-20 fade-in">
            <div className="text-[18px] font-semibold tracking-tight">
              Property Risk Snapshot
              <span className="text-[10px] align-super ml-0.5 opacity-70">TM</span>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/pricing"
                className="text-[14px] text-white/80 hover:text-white transition-colors"
              >
                Pricing
              </Link>
              <Link
                href="/coverage"
                className="text-[14px] text-white/80 hover:text-white transition-colors hidden sm:block"
              >
                Coverage
              </Link>
              <Link
                href="/how-it-works"
                className="text-[14px] text-white/80 hover:text-white transition-colors hidden sm:block"
              >
                How It Works
              </Link>
              {isAuthenticated ? (
                <Link
                  href="/app/properties"
                  className="px-5 py-2 bg-white/15 backdrop-blur-sm border border-white/25 rounded-full text-[14px] font-medium hover:bg-white/25 transition-all"
                >
                  Dashboard
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="px-5 py-2 bg-white text-[#1d1d1f] rounded-full text-[14px] font-medium hover:bg-gray-100 transition-colors"
                >
                  Sign In
                </Link>
              )}
            </div>
          </nav>

          {/* Hero Content */}
          <div className="max-w-3xl mx-auto text-center slide-up" style={{ animationDelay: "100ms" }}>
            <div className="flex items-center justify-center gap-2 text-[13px] uppercase tracking-wider text-white/70 mb-6">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Rule-based. Citation-backed. No guessing.
            </div>

            <h1 className="text-[48px] lg:text-[64px] font-light leading-[1.05] tracking-tight mb-6">
              Know what you can build
              <br />
              <span className="text-white/90">— before you buy.</span>
            </h1>

            <p className="text-[19px] text-white/80 font-light leading-relaxed mb-10 max-w-2xl mx-auto">
              A Property Risk Snapshot aggregates zoning, utilities, environmental data,
              and public city & county records into one clear, visual report — for any address.
            </p>

            {/* Search Bar */}
            <form
              onSubmit={handleSearch}
              className="max-w-xl mx-auto flex items-center gap-3 bg-white/15 backdrop-blur-md border border-white/25 rounded-full px-6 py-4 mb-6"
            >
              <svg className="w-5 h-5 text-white/60 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter a property address..."
                className="flex-1 bg-transparent outline-none text-white placeholder-white/50 text-[16px] font-light"
              />
              <button
                type="submit"
                className="px-6 py-2.5 bg-white text-[#1d1d1f] rounded-full text-[15px] font-semibold hover:bg-gray-100 active:scale-95 transition-all duration-200 flex-shrink-0"
              >
                Run Snapshot
              </button>
            </form>

            <div className="flex items-center justify-center gap-6 text-[13px] text-white/60">
              <span>1 credit per snapshot</span>
              <span className="w-1 h-1 rounded-full bg-white/30" />
              <span>Credits never expire</span>
              <span className="w-1 h-1 rounded-full bg-white/30" />
              <Link href="/pricing" className="hover:text-white/80 transition-colors underline-offset-4 hover:underline">
                See pricing
              </Link>
            </div>
          </div>

          {/* Trust Bar */}
          <div className="max-w-4xl mx-auto mt-16 mb-8 slide-up" style={{ animationDelay: "400ms" }}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { value: "23M+", label: "Parcels nationwide", icon: "parcel" },
                { value: "200+", label: "Utility districts", icon: "utility" },
                { value: "100%", label: "Rule-based validation", icon: "rule" },
              ].map((stat) => (
                <div key={stat.label} className="glass-panel p-5 flex items-center gap-4">
                  <div className="text-[28px] font-light tracking-tight">{stat.value}</div>
                  <div className="text-[13px] text-white/70 font-light">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ===== HOW IT WORKS ===== */}
      <div className="bg-white py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-[36px] font-light tracking-tight text-[#1d1d1f] mb-3">
              How it works
            </h2>
            <p className="text-[17px] text-[#86868b] font-light">
              Three steps to clarity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Enter an address",
                desc: "We locate the parcel, jurisdiction, and applicable regulations.",
              },
              {
                step: "2",
                title: "We analyze public records",
                desc: "Zoning codes, utility service areas, environmental layers, and parcel geometry are evaluated using deterministic rules.",
              },
              {
                step: "3",
                title: "Get your Risk Snapshot",
                desc: "A clear, visual summary of what's possible, what's restricted, and what needs verification.",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-[#0071e3] text-white grid place-items-center text-[22px] font-semibold mx-auto mb-5">
                  {item.step}
                </div>
                <h3 className="text-[19px] font-semibold text-[#1d1d1f] mb-2">{item.title}</h3>
                <p className="text-[15px] text-[#86868b] font-light leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ===== WHAT YOU GET ===== */}
      <div className="bg-[#F7F9FC] py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-[36px] font-light tracking-tight text-[#1d1d1f] mb-3">
              What you get
            </h2>
            <p className="text-[17px] text-[#86868b] font-light">
              Every Property Risk Snapshot includes:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="bg-white rounded-[20px] shadow-[0_4px_16px_rgba(0,0,0,0.04)] border border-[#f0f0f2] p-7 hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition-shadow duration-300"
              >
                <div className={`w-12 h-12 rounded-xl ${feature.bgLight} grid place-items-center mb-5 text-[#1d1d1f]`}>
                  {FEATURE_ICONS[feature.icon]}
                </div>
                <h3 className="text-[17px] font-semibold text-[#1d1d1f] mb-2">{feature.title}</h3>
                <p className="text-[14px] text-[#86868b] font-light leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ===== WHO IT'S FOR ===== */}
      <div className="bg-white py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-[36px] font-light tracking-tight text-[#1d1d1f] mb-10">
            Who it&apos;s for
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {audiences.map((a) => (
              <div key={a.label} className="p-6 rounded-2xl bg-[#f5f5f7]">
                <h3 className="text-[17px] font-semibold text-[#1d1d1f] mb-2">{a.label}</h3>
                <p className="text-[14px] text-[#86868b] font-light">{a.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ===== TRANSPARENCY ===== */}
      <div className="bg-[#F7F9FC] py-16">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 grid place-items-center mx-auto mb-5">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <h2 className="text-[28px] font-light tracking-tight text-[#1d1d1f] mb-4">
            Transparency over confidence
          </h2>
          <p className="text-[15px] text-[#86868b] font-light leading-relaxed max-w-2xl mx-auto">
            Some public records are incomplete or jurisdiction-specific. When data is missing,
            we clearly label it as a <strong className="text-[#1d1d1f]">Data Gap</strong> and recommend
            the exact next verification step. No false confidence. Ever.
          </p>
        </div>
      </div>

      {/* ===== CTA ===== */}
      <div
        className="relative text-white py-20"
        style={{
          backgroundImage: "url(/images/house-bg.jpg)",
          backgroundSize: "cover",
          backgroundPosition: "center bottom",
        }}
      >
        <div className="absolute inset-0 bg-black/75" />
        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-[36px] font-light tracking-tight mb-4">
            Like Carfax, but for land and buildability.
          </h2>
          <p className="text-[17px] text-white/80 font-light mb-8">
            One address. Every public record. Visualized with real rules.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href={isAuthenticated ? "/app/properties" : "/signup"}
              className="px-8 py-3.5 bg-white text-[#1d1d1f] rounded-full text-[15px] font-semibold hover:bg-gray-100 active:scale-95 transition-all"
            >
              Run a Risk Snapshot
            </Link>
            <Link
              href="/pricing"
              className="px-8 py-3.5 border border-white/40 text-white rounded-full text-[15px] font-medium hover:bg-white/10 transition-all"
            >
              See Pricing
            </Link>
          </div>
        </div>
      </div>

      {/* ===== FOOTER ===== */}
      <div className="bg-[#1d1d1f] text-white/60 py-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-[13px]">
            Property Risk Snapshot™ — Rule-based. Citation-backed. No guessing.
          </div>
          <div className="flex items-center gap-6 text-[13px]">
            <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
            <Link href="/coverage" className="hover:text-white transition-colors">Coverage</Link>
            <Link href="/how-it-works" className="hover:text-white transition-colors">How It Works</Link>
            <Link href="/faq" className="hover:text-white transition-colors">FAQ</Link>
            <Link href="/login" className="hover:text-white transition-colors">Sign In</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

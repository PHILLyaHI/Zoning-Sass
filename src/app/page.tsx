"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const stats = [
  { label: "Zoning + Overlays", value: "23M", icon: "🗺️", delay: "100ms" },
  { label: "Utilities + Septic", value: "200+", icon: "💧", delay: "200ms" },
  { label: "AI Q&A with sources", value: "24/7", icon: "🤖", delay: "300ms" }
];

export default function LandingPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/signup?redirect=/app/properties/new&q=${encodeURIComponent(searchQuery)}`);
    } else {
      router.push("/signup");
    }
  };

  return (
    <div
      className="min-h-screen w-full text-white relative overflow-hidden"
      style={{
        backgroundImage: "url(/images/house-bg.jpg)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed"
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/70" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(0,0,0,0.3)_100%)]" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8 lg:py-16 flex flex-col gap-8">
        {/* Top Navigation */}
        <nav className="flex items-center justify-between fade-in" style={{ animationDelay: "0ms" }}>
          <button 
            onClick={() => router.push("/how-it-works")}
            className="glass-panel w-14 h-14 grid place-items-center text-xl cursor-pointer active:scale-95"
            aria-label="Menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          <form onSubmit={handleSearch} className="glass-panel flex-1 max-w-2xl mx-6 flex items-center gap-3 px-5 py-3.5 rounded-full">
            <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search an address"
              className="bg-transparent w-full outline-none placeholder-white/60 text-white text-[15px] font-light"
            />
            <button 
              type="submit"
              className="px-4 py-1.5 bg-white text-[#1d1d1f] rounded-full text-sm font-medium hover:bg-gray-100 active:scale-95 transition-all duration-200"
            >
              Go
            </button>
          </form>
          
          <div className="flex items-center gap-3">
            <Link 
              href="/pricing"
              className="glass-panel w-14 h-14 grid place-items-center rounded-full cursor-pointer active:scale-95"
              aria-label="Settings"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </Link>
            <Link 
              href="/login"
              className="glass-panel w-14 h-14 grid place-items-center rounded-full cursor-pointer active:scale-95"
              aria-label="Account"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </Link>
          </div>
        </nav>

        {/* Main Content */}
        <div className="grid lg:grid-cols-[1.3fr_0.9fr] gap-8 mt-8 lg:mt-16 items-start">
          {/* Hero Card */}
          <div 
            className="glass-panel p-10 lg:p-12 slide-up"
            style={{ animationDelay: "150ms" }}
          >
            <div className="flex items-center gap-3 text-xs uppercase tracking-wider text-white/70 mb-6">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Instant zoning + utilities + risks
            </div>
            <h1 className="text-5xl lg:text-6xl font-light leading-[1.1] tracking-tight mb-5">
              What Can I Do On This Property?
            </h1>
            <p className="text-xl text-white/80 font-light leading-relaxed mb-8">
              Instant zoning + utilities + risk insights. Ask anything. Get sources.
            </p>
            <div className="flex items-center gap-4 flex-wrap">
              <Link
                href="/signup"
                className="px-8 py-3.5 bg-white text-[#1d1d1f] rounded-full text-[15px] font-medium hover:bg-gray-100 active:scale-95 transition-all duration-200 shadow-lg"
              >
                Start Free Trial
              </Link>
              <Link
                href="/pricing"
                className="px-8 py-3.5 border border-white/30 text-white rounded-full text-[15px] font-medium hover:bg-white/10 hover:border-white/50 active:scale-95 transition-all duration-200"
              >
                See Pricing
              </Link>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="flex flex-col gap-4">
            <div 
              className="glass-panel flex items-center justify-between p-6 slide-up"
              style={{ animationDelay: "200ms" }}
            >
              <div>
                <div className="text-5xl font-light tracking-tight mb-1">23M</div>
                <div className="text-white/70 text-sm font-light">Nationwide parcels</div>
              </div>
              <button 
                onClick={() => router.push("/signup")}
                className="w-14 h-14 rounded-full bg-white/20 hover:bg-white/30 text-white grid place-items-center cursor-pointer active:scale-95 transition-all duration-200 backdrop-blur-sm"
                aria-label="Explore"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            
            {stats.map((stat, idx) => (
              <div 
                key={stat.label} 
                className="glass-panel p-5 flex items-center justify-between slide-up"
                style={{ animationDelay: `${300 + idx * 100}ms` }}
              >
                <div>
                  <div className="text-3xl font-light tracking-tight mb-1">{stat.value}</div>
                  <div className="text-white/70 text-sm font-light">{stat.label}</div>
                </div>
                <div className="w-12 h-12 rounded-full bg-white/15 backdrop-blur-sm grid place-items-center text-2xl">
                  {stat.icon}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}



"use client";

import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";

export function Topbar() {
  const router = useRouter();
  const { user, logout, trialDaysRemaining, hasSubscription } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/app/properties/search?address=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push("/app/properties/new");
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <header className="flex items-center justify-between gap-4 w-full">
      <form onSubmit={handleSearch} className="flex-1 max-w-2xl">
        <div className="relative">
          <svg 
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#86868b]" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search address, APN, or property…"
            className="w-full rounded-full border border-[#d2d2d7] bg-[#f5f5f7] pl-12 pr-4 py-2.5 text-[15px] font-light focus:outline-none focus:ring-2 focus:ring-[#0071e3]/30 focus:border-[#0071e3] transition-all duration-200"
          />
        </div>
      </form>
      
      <div className="flex items-center gap-3">
        {/* Trial indicator */}
        {trialDaysRemaining !== null && trialDaysRemaining > 0 && (
          <button
            onClick={() => router.push("/pricing")}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 text-[13px] font-medium hover:bg-amber-100 transition-colors"
          >
            <span>{trialDaysRemaining} days left in trial</span>
            <span className="text-amber-500">→</span>
          </button>
        )}
        
        <button 
          onClick={() => router.push("/app/settings")}
          className="p-2.5 rounded-full bg-[#f5f5f7] hover:bg-[#e8e8ed] active:scale-95 cursor-pointer transition-all duration-200"
          title="Notifications"
        >
          <svg className="w-5 h-5 text-[#1d1d1f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </button>
        
        {/* User menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0071e3] to-[#0077ed] text-white grid place-items-center text-sm font-medium cursor-pointer hover:opacity-90 active:scale-95 transition-all duration-200 shadow-sm"
            title={user?.name || "Profile"}
          >
            {user?.avatarInitials || "U"}
          </button>
          
          {showUserMenu && (
            <div className="absolute right-0 top-12 w-64 bg-white rounded-[16px] shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-[rgba(0,0,0,0.06)] py-2 z-50">
              <div className="px-4 py-3 border-b border-[#f5f5f7]">
                <div className="text-[15px] font-medium text-[#1d1d1f]">{user?.name}</div>
                <div className="text-[13px] text-[#86868b]">{user?.email}</div>
                {hasSubscription ? (
                  <div className="text-[12px] text-[#34c759] mt-1">Pro subscription</div>
                ) : trialDaysRemaining !== null ? (
                  <div className="text-[12px] text-amber-600 mt-1">{trialDaysRemaining} days left in trial</div>
                ) : null}
              </div>
              
              <div className="py-1">
                <button
                  onClick={() => { router.push("/app/settings"); setShowUserMenu(false); }}
                  className="w-full px-4 py-2 text-left text-[15px] text-[#1d1d1f] hover:bg-[#f5f5f7] transition-colors"
                >
                  Settings
                </button>
                <button
                  onClick={() => { router.push("/app/settings/billing"); setShowUserMenu(false); }}
                  className="w-full px-4 py-2 text-left text-[15px] text-[#1d1d1f] hover:bg-[#f5f5f7] transition-colors"
                >
                  Billing
                </button>
              </div>
              
              <div className="border-t border-[#f5f5f7] pt-1">
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-left text-[15px] text-red-600 hover:bg-red-50 transition-colors"
                >
                  Log out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}



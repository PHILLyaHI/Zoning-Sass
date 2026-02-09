"use client";

import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useCredits } from "../contexts/CreditContext";

export function Topbar() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { balance } = useCredits();
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
      router.push(`/snapshot/${encodeURIComponent(searchQuery.trim())}`);
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
            placeholder="Run a Risk Snapshot — enter any address..."
            className="w-full rounded-full border border-[#d2d2d7] bg-[#f5f5f7] pl-12 pr-4 py-2.5 text-[15px] font-light focus:outline-none focus:ring-2 focus:ring-[#0071e3]/30 focus:border-[#0071e3] transition-all duration-200"
          />
        </div>
      </form>
      
      <div className="flex items-center gap-3">
        {/* Credit Balance Badge */}
        <button
          onClick={() => router.push("/credits")}
          className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-full bg-gradient-to-r from-[#0071e3]/10 to-[#34c759]/10 border border-[#0071e3]/15 hover:from-[#0071e3]/15 hover:to-[#34c759]/15 transition-all duration-200"
          title="View credits"
        >
          <svg className="w-4 h-4 text-[#0071e3]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
          </svg>
          <span className="text-[13px] font-bold text-[#1d1d1f]">{balance}</span>
          <span className="text-[12px] text-[#86868b]">credits</span>
        </button>

        {/* Buy Credits CTA */}
        <button
          onClick={() => router.push("/pricing")}
          className="hidden sm:block px-4 py-2 bg-[#0071e3] text-white rounded-full text-[13px] font-semibold hover:bg-[#0077ed] transition-colors active:scale-95"
        >
          Buy Credits
        </button>
        
        {/* Notifications */}
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
            <div className="absolute right-0 top-12 w-72 bg-white rounded-[16px] shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-[rgba(0,0,0,0.06)] py-2 z-50">
              <div className="px-4 py-3 border-b border-[#f5f5f7]">
                <div className="text-[15px] font-medium text-[#1d1d1f]">{user?.name}</div>
                <div className="text-[13px] text-[#86868b]">{user?.email}</div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[12px] text-[#0071e3] font-semibold">{balance} credits</span>
                  <span className="text-[12px] text-[#d2d2d7]">&bull;</span>
                  <button
                    onClick={() => { router.push("/credits"); setShowUserMenu(false); }}
                    className="text-[12px] text-[#0071e3] hover:underline"
                  >
                    Manage
                  </button>
                </div>
              </div>
              
              <div className="py-1">
                <button
                  onClick={() => { router.push("/credits"); setShowUserMenu(false); }}
                  className="w-full px-4 py-2 text-left text-[15px] text-[#1d1d1f] hover:bg-[#f5f5f7] transition-colors flex items-center gap-3"
                >
                  <svg className="w-4 h-4 text-[#86868b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                  </svg>
                  Credits & Billing
                </button>
                <button
                  onClick={() => { router.push("/app/settings"); setShowUserMenu(false); }}
                  className="w-full px-4 py-2 text-left text-[15px] text-[#1d1d1f] hover:bg-[#f5f5f7] transition-colors flex items-center gap-3"
                >
                  <svg className="w-4 h-4 text-[#86868b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Settings
                </button>
              </div>
              
              <div className="border-t border-[#f5f5f7] pt-1">
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-left text-[15px] text-red-600 hover:bg-red-50 transition-colors flex items-center gap-3"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                  </svg>
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

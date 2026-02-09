"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Get redirect URL from query params
  const getRedirectUrl = () => {
    if (typeof window === "undefined") return "/app/properties";
    const params = new URLSearchParams(window.location.search);
    return params.get("redirect") || "/app/properties";
  };

  // Redirect if already logged in
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push(getRedirectUrl());
    }
  }, [isAuthenticated, isLoading, router]);

  // Dev mode: one-click login for testing
  const handleDevLogin = async () => {
    setSubmitting(true);
    await login("dev@test.com", "password");
    router.push(getRedirectUrl());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const result = await login(email, password);
    
    if (result.success) {
      router.push(getRedirectUrl());
    } else {
      setError(result.error || "Login failed. Please try again.");
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f5f7]">
        <div className="w-8 h-8 border-2 border-[#0071e3] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="dashboard-shell min-h-screen flex items-center justify-center px-4 py-12 fade-in">
      <div className="max-w-md w-full bg-white p-10 rounded-[24px] shadow-[0_8px_32px_rgba(0,0,0,0.04)] border border-[rgba(0,0,0,0.06)] slide-up">
        <Link href="/" className="inline-block mb-8 text-[#0071e3] text-[15px] font-light hover:underline">
          ← Back to home
        </Link>
        <h1 className="text-[32px] font-light tracking-tight text-[#1d1d1f] mb-8">Log in</h1>
        
        {error && (
          <div className="mb-6 p-4 rounded-[12px] bg-red-50 border border-red-200 text-red-700 text-[14px]">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[13px] text-[#86868b] font-light mb-2">Email</label>
            <input 
              className="w-full border border-[#d2d2d7] rounded-[12px] px-4 py-3 text-[15px] font-light focus:outline-none focus:ring-2 focus:ring-[#0071e3]/30 focus:border-[#0071e3] transition-all duration-200" 
              placeholder="you@example.com" 
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-[13px] text-[#86868b] font-light mb-2">Password</label>
            <input 
              className="w-full border border-[#d2d2d7] rounded-[12px] px-4 py-3 text-[15px] font-light focus:outline-none focus:ring-2 focus:ring-[#0071e3]/30 focus:border-[#0071e3] transition-all duration-200" 
              placeholder="••••••••" 
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button 
            type="submit" 
            disabled={submitting}
            className="w-full btn-primary py-3.5 text-[15px] font-medium active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Logging in..." : "Continue"}
          </button>
        </form>
        <div className="text-[13px] text-[#86868b] font-light mt-6 text-center">
          No account?{" "}
          <Link href="/signup" className="text-[#0071e3] hover:underline">
            Sign up
          </Link>
        </div>
        
        {/* Dev login - remove in production */}
        {process.env.NODE_ENV === "development" && (
          <button
            type="button"
            onClick={handleDevLogin}
            className="w-full mt-4 py-2.5 text-[13px] text-[#86868b] border border-dashed border-[#d2d2d7] rounded-[12px] hover:border-[#86868b] transition-colors"
          >
            🔧 Dev Login (skip form)
          </button>
        )}
      </div>
    </div>
  );
}



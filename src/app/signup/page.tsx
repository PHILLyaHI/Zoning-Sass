"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";

export default function SignupPage() {
  const router = useRouter();
  const { signup, isAuthenticated, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setSubmitting(true);

    const result = await signup(email, password);
    
    if (result.success) {
      router.push(getRedirectUrl());
    } else {
      setError(result.error || "Signup failed. Please try again.");
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
        <h1 className="text-[32px] font-light tracking-tight text-[#1d1d1f] mb-2">Create your account</h1>
        <p className="text-[15px] text-[#86868b] font-light mb-8">Get 2 free credits to run your first Risk Snapshots.</p>
        
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
              placeholder="At least 6 characters" 
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <div>
            <label className="block text-[13px] text-[#86868b] font-light mb-2">Confirm Password</label>
            <input 
              className="w-full border border-[#d2d2d7] rounded-[12px] px-4 py-3 text-[15px] font-light focus:outline-none focus:ring-2 focus:ring-[#0071e3]/30 focus:border-[#0071e3] transition-all duration-200" 
              placeholder="••••••••" 
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <button 
            type="submit" 
            disabled={submitting}
            className="w-full btn-primary py-3.5 text-[15px] font-medium active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Creating account..." : "Create account"}
          </button>
        </form>
        
        <p className="text-[12px] text-[#86868b] font-light mt-6 text-center">
          By signing up, you agree to our Terms of Service and Privacy Policy.
        </p>
        
        <div className="text-[13px] text-[#86868b] font-light mt-6 text-center border-t border-[#d2d2d7] pt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-[#0071e3] hover:underline">
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
}



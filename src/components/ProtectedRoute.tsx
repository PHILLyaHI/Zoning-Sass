"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";

type ProtectedRouteProps = {
  children: React.ReactNode;
  requireSubscription?: boolean;
};

export function ProtectedRoute({ children, requireSubscription = false }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, hasSubscription } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push("/login");
      } else if (requireSubscription && !hasSubscription) {
        router.push("/pricing");
      }
    }
  }, [isAuthenticated, isLoading, hasSubscription, requireSubscription, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f5f7]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#0071e3] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[15px] text-[#86868b] font-light">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (requireSubscription && !hasSubscription) {
    return null;
  }

  return <>{children}</>;
}




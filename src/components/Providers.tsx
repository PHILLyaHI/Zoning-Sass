"use client";

import { AuthProvider } from "../contexts/AuthContext";
import { PropertyProvider } from "../contexts/PropertyContext";
import { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <PropertyProvider>
        {children}
      </PropertyProvider>
    </AuthProvider>
  );
}


"use client";

import { AuthProvider } from "../contexts/AuthContext";
import { PropertyProvider } from "../contexts/PropertyContext";
import { CreditProvider } from "../contexts/CreditContext";
import { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <CreditProvider>
        <PropertyProvider>
          {children}
        </PropertyProvider>
      </CreditProvider>
    </AuthProvider>
  );
}


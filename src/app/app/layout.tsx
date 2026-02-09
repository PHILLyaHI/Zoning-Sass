"use client";

import { LayoutShell } from "../../components/LayoutShell";
import { ProtectedRoute } from "../../components/ProtectedRoute";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <LayoutShell>{children}</LayoutShell>
    </ProtectedRoute>
  );
}




"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useAuth } from "./AuthContext";
import {
  getCreditBalance,
  getCreditHistory,
  getSnapshotHistory,
  purchaseCredits,
  deductCreditForSnapshot,
  recordSnapshotRun,
  giveWelcomeBonus,
  CreditTransaction,
  SnapshotRun,
  CREDIT_PACKS,
  CreditPack,
} from "../lib/credits";

type CreditContextType = {
  balance: number;
  transactions: CreditTransaction[];
  snapshots: SnapshotRun[];
  packs: CreditPack[];
  isLoading: boolean;
  hasEnoughCredits: boolean;
  buyPack: (packId: string) => Promise<{ success: boolean; newBalance: number; error?: string }>;
  useCredit: (address: string, idempotencyKey: string) => Promise<{
    success: boolean;
    newBalance: number;
    transactionId: string;
    error?: string;
  }>;
  saveSnapshotRun: (run: Omit<SnapshotRun, "id" | "createdAt">) => SnapshotRun;
  refreshBalance: () => void;
};

const CreditContext = createContext<CreditContextType | undefined>(undefined);

export function CreditProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [snapshots, setSnapshots] = useState<SnapshotRun[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshBalance = useCallback(() => {
    if (!user) {
      setBalance(0);
      setTransactions([]);
      setSnapshots([]);
      setIsLoading(false);
      return;
    }

    setBalance(getCreditBalance(user.id));
    setTransactions(getCreditHistory(user.id));
    setSnapshots(getSnapshotHistory(user.id));
    setIsLoading(false);
  }, [user]);

  // Load credits on mount and when user changes
  useEffect(() => {
    if (user) {
      // Give welcome bonus to new users
      giveWelcomeBonus(user.id, 2);
    }
    refreshBalance();
  }, [user, refreshBalance]);

  const buyPack = async (packId: string) => {
    if (!user) return { success: false, newBalance: 0, error: "Not authenticated" };

    // In production, this would:
    // 1. Create Stripe checkout session
    // 2. Wait for webhook confirmation
    // 3. Then credit the account
    // For now, simulate immediate purchase
    const result = purchaseCredits(user.id, packId);
    if (result.success) {
      refreshBalance();
    }
    return result;
  };

  const useCredit = async (address: string, idempotencyKey: string) => {
    if (!user)
      return { success: false, newBalance: 0, transactionId: "", error: "Not authenticated" };

    const result = deductCreditForSnapshot(user.id, address, idempotencyKey);
    if (result.success) {
      refreshBalance();
    }
    return result;
  };

  const saveSnapshotRun = (run: Omit<SnapshotRun, "id" | "createdAt">) => {
    const saved = recordSnapshotRun(run);
    refreshBalance();
    return saved;
  };

  const value: CreditContextType = {
    balance,
    transactions,
    snapshots,
    packs: CREDIT_PACKS,
    isLoading,
    hasEnoughCredits: balance >= 1,
    buyPack,
    useCredit,
    saveSnapshotRun,
    refreshBalance,
  };

  return <CreditContext.Provider value={value}>{children}</CreditContext.Provider>;
}

export function useCredits() {
  const context = useContext(CreditContext);
  if (context === undefined) {
    throw new Error("useCredits must be used within a CreditProvider");
  }
  return context;
}

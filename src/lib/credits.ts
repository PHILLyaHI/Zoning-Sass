// ============================================
// CREDIT SYSTEM — Carfax-style credits
// ============================================
// 1 credit = 1 Property Risk Snapshot™
// Credits never expire
// ============================================

const CREDITS_KEY = "zoning_credits";
const TRANSACTIONS_KEY = "zoning_credit_transactions";
const SNAPSHOTS_KEY = "zoning_snapshot_runs";

// ============================================
// TYPES
// ============================================

export type CreditPack = {
  id: string;
  name: string;
  credits: number;
  priceUsd: number;
  pricePerCredit: number;
  popular?: boolean;
  badge?: string;
};

export type CreditTransaction = {
  id: string;
  userId: string;
  type: "purchase" | "usage" | "admin_adjustment" | "refund" | "welcome_bonus";
  creditsDelta: number;
  amountUsd: number | null;
  packName: string | null;
  snapshotRunId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
};

export type SnapshotRun = {
  id: string;
  userId: string;
  address: string;
  addressNormalized: string;
  city: string;
  state: string;
  county: string;
  centroidLat: number;
  centroidLng: number;
  zoningDistrict: string;
  jurisdictionName: string;
  overallStatus: "pass" | "warn" | "fail";
  creditTransactionId: string;
  idempotencyKey: string;
  createdAt: Date;
};

// ============================================
// CREDIT PACKS
// ============================================

export const CREDIT_PACKS: CreditPack[] = [
  {
    id: "starter",
    name: "Starter",
    credits: 1,
    priceUsd: 29,
    pricePerCredit: 29,
  },
  {
    id: "investor",
    name: "Investor Pack",
    credits: 5,
    priceUsd: 129,
    pricePerCredit: 25.8,
    popular: true,
    badge: "Save 11%",
  },
  {
    id: "pro",
    name: "Pro Pack",
    credits: 10,
    priceUsd: 199,
    pricePerCredit: 19.9,
    badge: "Save 31%",
  },
  {
    id: "builder",
    name: "Builder Pack",
    credits: 25,
    priceUsd: 399,
    pricePerCredit: 15.96,
    badge: "Best Value",
  },
];

// ============================================
// LOCAL STORAGE HELPERS (mock for dev)
// In production, all credit ops happen server-side
// ============================================

function getStoredCredits(userId: string): number {
  if (typeof window === "undefined") return 0;
  const data = localStorage.getItem(CREDITS_KEY);
  if (!data) return 0;
  try {
    const credits = JSON.parse(data);
    return credits[userId] ?? 0;
  } catch {
    return 0;
  }
}

function setStoredCredits(userId: string, balance: number): void {
  if (typeof window === "undefined") return;
  const data = localStorage.getItem(CREDITS_KEY);
  const credits = data ? JSON.parse(data) : {};
  credits[userId] = balance;
  localStorage.setItem(CREDITS_KEY, JSON.stringify(credits));
}

function getStoredTransactions(userId: string): CreditTransaction[] {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(TRANSACTIONS_KEY);
  if (!data) return [];
  try {
    const all: CreditTransaction[] = JSON.parse(data);
    return all
      .filter((t) => t.userId === userId)
      .map((t) => ({ ...t, createdAt: new Date(t.createdAt) }))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch {
    return [];
  }
}

function addStoredTransaction(tx: CreditTransaction): void {
  if (typeof window === "undefined") return;
  const data = localStorage.getItem(TRANSACTIONS_KEY);
  const all: CreditTransaction[] = data ? JSON.parse(data) : [];
  all.push(tx);
  localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(all));
}

function getStoredSnapshots(userId: string): SnapshotRun[] {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(SNAPSHOTS_KEY);
  if (!data) return [];
  try {
    const all: SnapshotRun[] = JSON.parse(data);
    return all
      .filter((s) => s.userId === userId)
      .map((s) => ({ ...s, createdAt: new Date(s.createdAt) }))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch {
    return [];
  }
}

function addStoredSnapshot(run: SnapshotRun): void {
  if (typeof window === "undefined") return;
  const data = localStorage.getItem(SNAPSHOTS_KEY);
  const all: SnapshotRun[] = data ? JSON.parse(data) : [];
  all.push(run);
  localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(all));
}

// ============================================
// PUBLIC API
// ============================================

/** Get current credit balance */
export function getCreditBalance(userId: string): number {
  return getStoredCredits(userId);
}

/** Check if user has enough credits */
export function hasCredits(userId: string, required: number = 1): boolean {
  return getStoredCredits(userId) >= required;
}

/** Get transaction history */
export function getCreditHistory(userId: string): CreditTransaction[] {
  return getStoredTransactions(userId);
}

/** Get snapshot run history */
export function getSnapshotHistory(userId: string): SnapshotRun[] {
  return getStoredSnapshots(userId);
}

/** Purchase credits (mock — in production, this happens after Stripe webhook) */
export function purchaseCredits(
  userId: string,
  packId: string
): { success: boolean; newBalance: number; error?: string } {
  const pack = CREDIT_PACKS.find((p) => p.id === packId);
  if (!pack) return { success: false, newBalance: 0, error: "Invalid pack" };

  const currentBalance = getStoredCredits(userId);
  const newBalance = currentBalance + pack.credits;

  // Create transaction record
  const tx: CreditTransaction = {
    id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    userId,
    type: "purchase",
    creditsDelta: pack.credits,
    amountUsd: pack.priceUsd,
    packName: pack.name,
    snapshotRunId: null,
    metadata: { packId: pack.id, stripePaymentId: `mock_pi_${Date.now()}` },
    createdAt: new Date(),
  };

  addStoredTransaction(tx);
  setStoredCredits(userId, newBalance);

  return { success: true, newBalance };
}

/** 
 * Deduct 1 credit for a snapshot run
 * Uses idempotency key to prevent double-charging
 */
export function deductCreditForSnapshot(
  userId: string,
  address: string,
  idempotencyKey: string
): { success: boolean; newBalance: number; transactionId: string; error?: string } {
  // Check idempotency — if this snapshot was already charged, return success without deducting
  const existingSnapshots = getStoredSnapshots(userId);
  const existing = existingSnapshots.find((s) => s.idempotencyKey === idempotencyKey);
  if (existing) {
    return {
      success: true,
      newBalance: getStoredCredits(userId),
      transactionId: existing.creditTransactionId,
    };
  }

  const currentBalance = getStoredCredits(userId);
  if (currentBalance < 1) {
    return {
      success: false,
      newBalance: currentBalance,
      transactionId: "",
      error: "Insufficient credits",
    };
  }

  const newBalance = currentBalance - 1;
  const txId = `tx_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  // Create deduction transaction
  const tx: CreditTransaction = {
    id: txId,
    userId,
    type: "usage",
    creditsDelta: -1,
    amountUsd: null,
    packName: null,
    snapshotRunId: null,
    metadata: { address, idempotencyKey },
    createdAt: new Date(),
  };

  addStoredTransaction(tx);
  setStoredCredits(userId, newBalance);

  return { success: true, newBalance, transactionId: txId };
}

/** Record a snapshot run (after data is fetched successfully) */
export function recordSnapshotRun(
  run: Omit<SnapshotRun, "id" | "createdAt">
): SnapshotRun {
  const fullRun: SnapshotRun = {
    ...run,
    id: `snap_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date(),
  };
  addStoredSnapshot(fullRun);
  return fullRun;
}

/** Give welcome bonus credits to new users */
export function giveWelcomeBonus(userId: string, credits: number = 2): void {
  const currentBalance = getStoredCredits(userId);
  if (currentBalance > 0) return; // already has credits

  const existingTx = getStoredTransactions(userId);
  if (existingTx.some((t) => t.type === "welcome_bonus")) return; // already got bonus

  const tx: CreditTransaction = {
    id: `tx_welcome_${Date.now()}`,
    userId,
    type: "welcome_bonus",
    creditsDelta: credits,
    amountUsd: null,
    packName: null,
    snapshotRunId: null,
    metadata: { reason: "Welcome bonus — 2 free snapshots" },
    createdAt: new Date(),
  };

  addStoredTransaction(tx);
  setStoredCredits(userId, credits);
}

"use client";

import { useCredits } from "../contexts/CreditContext";
import { useRouter } from "next/navigation";

type Props = {
  variant?: "header" | "compact" | "full";
};

export function CreditBalanceBadge({ variant = "header" }: Props) {
  const { balance, isLoading } = useCredits();
  const router = useRouter();

  if (isLoading) return null;

  if (variant === "compact") {
    return (
      <button
        onClick={() => router.push("/credits")}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#f5f5f7] hover:bg-[#e8e8ed] transition-colors"
        title="View credits"
      >
        <svg className="w-3.5 h-3.5 text-[#0071e3]" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H11.5v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.65c.09 1.71 1.37 2.66 2.85 2.97V19h1.72v-1.67c1.52-.29 2.72-1.16 2.72-2.74 0-2.2-1.88-2.95-3.63-3.45z" />
        </svg>
        <span className="text-[13px] font-semibold text-[#1d1d1f]">{balance}</span>
      </button>
    );
  }

  return (
    <button
      onClick={() => router.push("/credits")}
      className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#0071e3]/10 to-[#34c759]/10 hover:from-[#0071e3]/15 hover:to-[#34c759]/15 border border-[#0071e3]/20 transition-all duration-200"
      title="View credits"
    >
      <svg className="w-4 h-4 text-[#0071e3]" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H11.5v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.65c.09 1.71 1.37 2.66 2.85 2.97V19h1.72v-1.67c1.52-.29 2.72-1.16 2.72-2.74 0-2.2-1.88-2.95-3.63-3.45z" />
      </svg>
      <span className="text-[13px] font-semibold text-[#1d1d1f]">
        {balance} {balance === 1 ? "Credit" : "Credits"}
      </span>
    </button>
  );
}
